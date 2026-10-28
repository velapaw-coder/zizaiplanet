import { clip, firstClause, keywordsFrom } from "./text";
import { CORE_IDS, ROOMS, type DimensionId } from "./rooms";

export type Evidence = "较强" | "中等" | "待验证" | "待加深" | "尚未点亮";

export type AnswerInput = {
  answer: string | null;
  skipped: boolean;
};

export type StoredCard = {
  dimension: string;
  keywords: string[];
  quote: string | null;
  summary: string;
  evidence: Evidence;
  lit: boolean;
};

/** One dimension slot on the home / portrait card. `place` mirrors `name` for saved JSON compat. */
export type HomeRoom = StoredCard & {
  name: string;
  place: string;
};

export type HomeCard = {
  oneLiner: string;
  rooms: HomeRoom[];
  identityStatus: "待加深" | "已从证据长出";
  privateName: string | null;
  identityNote: string;
  /** Short aspiration / direction blurb for 个人画像 */
  directionNote: string;
  lifestyleNow: string;
  lifestyleToward: string;
  invitation: string | null;
  changeNote: string;
  openQuestions: string[];
  nextSteps: string[];
  litCount: number;
  provisional: boolean;
  /** True when all 7 dimensions are lit with quotes */
  portraitReady: boolean;
};

export function evidenceFor(answers: AnswerInput[]) {
  const substantive = answers.filter((item) => !item.skipped && (item.answer?.trim().length ?? 0) >= 8);
  const long = substantive.filter((item) => (item.answer?.trim().length ?? 0) >= 30);
  if (substantive.length === 0) return { evidence: "待加深" as const, lit: false };
  if (substantive.length >= 2 && long.length >= 2) return { evidence: "较强" as const, lit: true };
  if (substantive.length >= 2) return { evidence: "中等" as const, lit: true };
  return { evidence: "待验证" as const, lit: true };
}

/** `label` is the dimension display name (e.g. 本源). Kept as 2nd arg for call-site compat. */
export function draftRoom(dimension: string, label: string, answers: AnswerInput[]): StoredCard {
  const { evidence, lit } = evidenceFor(answers);
  const usable = answers
    .map((item) => item.answer?.trim() || "")
    .filter((text) => text.length >= 2);
  const quoteSource = [...usable].sort((a, b) => b.length - a.length)[0] ?? null;
  const quote = quoteSource ? clip(quoteSource, 120) : null;
  const keywords = keywordsFrom(...usable);
  let summary = `「${label}」这一维还没有足够的原话。（尚未知）`;
  if (lit && quote) {
    const cited = usable.slice(0, 2).map((text) => `「${clip(text, 80)}」`).join("，以及");
    const mark = usable.length >= 2 ? "有具体经历支持" : "用户直接陈述";
    summary = `在「${label}」这一维，你直接写下${cited}。（${mark}）`;
  }
  return { dimension, keywords, quote, summary, evidence: lit ? evidence : "待加深", lit };
}

function cardFor(cards: StoredCard[], id: DimensionId) {
  return cards.find((card) => card.dimension === id && card.lit && card.quote);
}

export function composeHome(input: { cards: StoredCard[]; changeNote?: string }): HomeCard {
  const rooms: HomeRoom[] = ROOMS.map((room) => {
    const card = input.cards.find((item) => item.dimension === room.id);
    if (!card || !card.lit) {
      return {
        dimension: room.id,
        name: room.name,
        place: room.name,
        keywords: [],
        quote: card?.quote ?? null,
        summary: card?.summary ?? `「${room.name}」这一维还没有足够的原话。`,
        evidence: card && !card.lit ? "待加深" : "尚未点亮",
        lit: false,
      };
    }
    return {
      ...card,
      name: room.name,
      place: room.name,
      lit: true,
    };
  });

  const litRooms = rooms.filter((room) => room.lit && room.quote);
  const origin = cardFor(input.cards, "origin");
  const oneLiner = origin?.quote
    ? firstClause(origin.quote, 42)
    : litRooms[0]?.quote
      ? firstClause(litRooms[0].quote, 42)
      : "还没有一句可以当作本源的原话。";

  const coreReady = CORE_IDS.every((id) => cardFor(input.cards, id));
  const identity = cardFor(input.cards, "identity");
  const identityReady = Boolean(coreReady && identity?.quote);
  const taste = cardFor(input.cards, "taste");
  const vision = cardFor(input.cards, "vision");
  const relation = cardFor(input.cards, "relation");
  const talent = cardFor(input.cards, "talent");
  const values = cardFor(input.cards, "values");

  let identityNote =
    "身份这一维待加深。想成为的自己不会用模板补上，要等本源、天赋、品味、价值观和身份都有你的原话。";
  let privateName: string | null = null;
  if (identityReady && identity?.quote && origin?.quote) {
    privateName = firstClause(identity.quote, 18);
    identityNote = `你在「身份」说：「${clip(identity.quote, 80)}」。这句只对照你自己，默认不写成对外简介。它站在这些原话上：本源「${clip(origin.quote, 36)}」、天赋「${clip(talent?.quote || "", 36)}」、品味「${clip(taste?.quote || "", 36)}」、价值观「${clip(values?.quote || "", 36)}」。`;
  }

  const portraitReady = litRooms.length >= 7;
  let directionNote = "七维都点亮后，这里会汇总你的向往定位与生活方向。";
  if (portraitReady && origin?.quote) {
    const bits = [
      origin.quote ? `本源：${clip(firstClause(origin.quote, 36), 36)}` : "",
      talent?.quote ? `擅长：${clip(firstClause(talent.quote, 28), 28)}` : "",
      vision?.quote ? `向往：${clip(firstClause(vision.quote, 36), 36)}` : "",
      identity?.quote ? `想成为：${clip(firstClause(identity.quote, 28), 28)}` : "",
    ].filter(Boolean);
    directionNote = bits.join(" · ");
  } else if (litRooms.length >= 3 && origin?.quote) {
    directionNote = `临时方向（已点亮 ${litRooms.length} 维）：${clip(firstClause(origin.quote, 48), 48)}。继续点亮其余维度，画像会更清楚。`;
  }

  const openQuestions = rooms
    .filter((room) => !room.lit || room.evidence === "待验证" || room.evidence === "待加深")
    .map((room) =>
      room.lit
        ? `「${room.name}」只有一部分原话，若你愿意可以再补一件具体的事。`
        : `「${room.name}」还没有足够的原话。`,
    );

  const nextSteps = rooms
    .filter((room) => !room.lit)
    .slice(0, 3)
    .map((room) => `若你愿意，下一次只点亮「${room.name}」，两题即可。`);
  if (nextSteps.length === 0) {
    nextSteps.push("下一步：打开「我的 AI 分身」，解读画像并梳理能力与方向。");
    nextSteps.push("打开「我的向往」：系统会按探索自动生成公开摘要，你改完即可分享。");
    nextSteps.push("若你愿意，过一段时间挑最有变化的一维重修，不必重答全部。");
  }

  return {
    oneLiner,
    rooms,
    identityStatus: identityReady ? "已从证据长出" : "待加深",
    privateName,
    identityNote,
    directionNote,
    lifestyleNow: taste?.quote ? taste.quote : "品味这一维还没有写下现状。",
    lifestyleToward: vision?.quote ? vision.quote : "人生愿景还没有写下向往。",
    invitation: relation?.quote ?? null,
    changeNote: input.changeNote ?? "探索还在进行",
    openQuestions: openQuestions.slice(0, 7),
    nextSteps: nextSteps.slice(0, 3),
    litCount: litRooms.length,
    provisional: litRooms.length < 7,
    portraitReady,
  };
}

export function homeCardTitle(card: HomeCard) {
  if (card.portraitReady || card.litCount >= 7) return "我的个人画像";
  if (card.litCount >= 3) return "临时个人画像";
  return "未完成的个人画像";
}
