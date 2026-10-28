import { getLlmProvider } from "./llm";
import { ruleModeration } from "./moderate-rules";

export type Moderation = { pass: boolean; reason: string; via: "rules" | "model" };

export async function moderateText(text: string): Promise<Moderation> {
  const rules = ruleModeration(text);
  if (!rules.pass) return { ...rules, via: "rules" };
  const raw = await getLlmProvider().complete({
    system:
      "你是社区审核。只判断这段中文生活分享有没有明显的色情、暴力、诈骗、辱骂或广告引流。只返回 JSON：{\"pass\":true或false,\"reason\":\"不超过40字的中文原因\"}。生活日常、读书、喝茶、散步应通过。不要编造没有写出的情节。",
    user: text.slice(0, 2000),
  });
  if (!raw) return { pass: true, reason: "", via: "rules" };
  try {
    const parsed = JSON.parse(raw) as { pass?: boolean; reason?: string };
    if (parsed.pass === false) {
      const reason =
        typeof parsed.reason === "string" && parsed.reason.trim().length >= 2
          ? parsed.reason.trim().slice(0, 80)
          : "这段内容和社区氛围不太合，先不公开。";
      return { pass: false, reason, via: "model" };
    }
  } catch {
    return { pass: true, reason: "", via: "rules" };
  }
  return { pass: true, reason: "", via: "rules" };
}
