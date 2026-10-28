import { draftRoom, type AnswerInput, type StoredCard } from "./compose";
import { getLlmProvider } from "./llm";
import type { RoomDef } from "./rooms";

const SYSTEM = `你在协助整理「自在星球」七维自我探索的一个维度。只输出 JSON：{"summary":"...","keywords":["..."]}。
规则：
- summary 必须原样包含用户原话中连续的至少 8 个字，用「」包住引用。
- keywords 每一项都必须是用户回答里的连续子串，2 到 12 个字，最多 4 个。
- 不要诊断，不要打分，不要鼓励创业、招商或贩卖课程。
- 不要把兴趣写成已经实现的事业。不要编造用户没说过的身份。`;

export async function makeRoomCard(room: RoomDef, answers: AnswerInput[]): Promise<StoredCard & { via: "rules" | "model" }> {
  const base = draftRoom(room.id, room.name, answers);
  const provider = getLlmProvider();
  if (provider.name === "mock" || !base.lit || !base.quote) return { ...base, via: "rules" };
  const payload = answers
    .map((item, index) => `${index + 1}. ${item.skipped ? "（跳过）" : item.answer || ""}`)
    .join("\n");
  const raw = await provider.complete({
    system: SYSTEM,
    user: `维度：${room.name}\n用户回答：\n${payload}`,
  });
  if (!raw) return { ...base, via: "rules" };
  try {
    const parsed = JSON.parse(raw) as { summary?: string; keywords?: string[] };
    const corpus = answers.map((item) => item.answer || "").join("\n");
    const keywords = (parsed.keywords || [])
      .map((item) => item.trim())
      .filter((item) => item.length >= 2 && item.length <= 12 && corpus.includes(item))
      .slice(0, 4);
    const summary = parsed.summary?.trim() || "";
    const anchor = base.quote.slice(0, Math.min(8, base.quote.length));
    const summaryOk = anchor.length >= 2 && summary.includes(anchor);
    return {
      ...base,
      keywords: keywords.length ? keywords : base.keywords,
      summary: summaryOk ? summary : base.summary,
      via: summaryOk || keywords.length ? "model" : "rules",
    };
  } catch {
    return { ...base, via: "rules" };
  }
}
