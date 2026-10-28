import { homeCardTitle, type HomeCard } from "./compose";
import { clip, firstClause } from "./text";

export type ExplorePlanSection = {
  id: string;
  title: string;
  body: string;
};

export type ExplorePlan = {
  title: string;
  subtitle: string;
  oneLiner: string;
  direction: string;
  lifestyle: string;
  relations: string;
  identity: string;
  dimensions: Array<{ name: string; quote: string | null; summary: string; lit: boolean }>;
  nextSteps: string[];
  openQuestions: string[];
  closing: string;
  sections: ExplorePlanSection[];
  portraitReady: boolean;
  litCount: number;
  provisional: boolean;
  /** Raw chat portrait markdown if available */
  portraitText: string | null;
};

/** Combine 7 dims + home card into one readable「自我探索方案」. */
export function composeExplorePlan(input: {
  card: HomeCard;
  displayName?: string | null;
  portraitText?: string | null;
}): ExplorePlan {
  const card = input.card;
  const name = (input.displayName || "").trim() || "星球居民";
  const lit = card.rooms.filter((r) => r.lit && r.quote);
  const portraitReady = Boolean(card.portraitReady || lit.length >= 7);

  const directionBits = [
    pickRoom(card, "origin")?.quote
      ? `本源上，你写下「${clip(firstClause(pickRoom(card, "origin")!.quote!, 48), 48)}」`
      : null,
    pickRoom(card, "talent")?.quote
      ? `天赋上，你自然会走到「${clip(firstClause(pickRoom(card, "talent")!.quote!, 40), 40)}」`
      : null,
    pickRoom(card, "vision")?.quote
      ? `愿景里，你向往「${clip(firstClause(pickRoom(card, "vision")!.quote!, 48), 48)}」`
      : null,
    pickRoom(card, "identity")?.quote
      ? `身份上，你想成为「${clip(firstClause(pickRoom(card, "identity")!.quote!, 36), 36)}」`
      : null,
  ].filter(Boolean) as string[];

  const direction =
    directionBits.length > 0
      ? `${directionBits.join("；")}。这些句子都来自你的原话，拼在一起，就是你在自在星球里正在看清的向往。`
      : card.directionNote || "继续点亮七维后，这里会汇成你的向往方向。";

  const taste = pickRoom(card, "taste");
  const vision = pickRoom(card, "vision");
  const lifestyle = [
    taste?.quote ? `现状（品味）：「${clip(taste.quote, 120)}」` : "现状（品味）还待你写下。",
    vision?.quote ? `向往（愿景）：「${clip(vision.quote, 120)}」` : "向往（愿景）还待你写下。",
    "现状与向往分开写，是为了让你看见「现在怎样」和「心里真正要去哪」并不总是同一件事。",
  ].join("\n");

  const relation = pickRoom(card, "relation");
  const relations = relation?.quote
    ? `同频关系里，你写下「${clip(relation.quote, 140)}」。在自在星球，合得来的人会自然靠近；不合的，也不必硬撑。`
    : "同频关系这一维还没有足够原话。等你愿意时再写也可以。";

  const identity = card.identityNote;

  const nextSteps =
    card.nextSteps?.length > 0
      ? card.nextSteps
      : portraitReady
        ? [
            "把这份方案收进家园，过一段时间再打开，看看哪一句仍然真。",
            "若某一维已经变了，点进该维重修即可，不必重答全部。",
            "想在社区里遇见同频的人，可扫企业微信活码加入自在星球社区。",
          ]
        : [
            `继续点亮还暗着的维度（已点亮 ${card.litCount}/7）。`,
            "一次只进一维也很好，不必赶。",
          ];

  const closing = portraitReady
    ? `${name}，七维探索已经走完一轮。这份方案不是测评结论，而是你自己原话织成的地图：看见自己，找到方向，在自在星球安一个真正属于你的家园。`
    : `${name}，探索还在路上。已点亮 ${card.litCount} 维；等七维都有你的原话，完整方案会在这里长出来。`;

  const sections: ExplorePlanSection[] = [
    { id: "direction", title: "向往定位与方向", body: direction },
    { id: "lifestyle", title: "生活现状与向往", body: lifestyle },
    { id: "relations", title: "同频关系", body: relations },
    { id: "identity", title: "想成为的自己", body: identity },
    {
      id: "dimensions",
      title: "七维原话摘要",
      body: card.rooms
        .map((r) =>
          r.lit && r.quote
            ? `【${r.name}】「${clip(r.quote, 100)}」`
            : `【${r.name}】尚未点亮`,
        )
        .join("\n"),
    },
    {
      id: "next",
      title: "接下来可以怎么走",
      body: nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n"),
    },
  ];

  if (card.openQuestions?.length) {
    sections.push({
      id: "open",
      title: "仍可再看一眼",
      body: card.openQuestions.slice(0, 5).map((q) => `· ${q}`).join("\n"),
    });
  }

  return {
    title: portraitReady ? "我的自我探索方案" : "自我探索方案（进行中）",
    subtitle: `${homeCardTitle(card)} · 来自你的原话 · 默认私密`,
    oneLiner: card.oneLiner,
    direction,
    lifestyle,
    relations,
    identity,
    dimensions: card.rooms.map((r) => ({
      name: r.name,
      quote: r.quote,
      summary: r.summary,
      lit: r.lit,
    })),
    nextSteps,
    openQuestions: card.openQuestions || [],
    closing,
    sections,
    portraitReady,
    litCount: card.litCount,
    provisional: card.provisional ?? card.litCount < 7,
    portraitText: input.portraitText?.trim() || null,
  };
}

function pickRoom(card: HomeCard, id: string) {
  return card.rooms.find((r) => r.dimension === id && r.lit && r.quote) || null;
}

export function explorePlanPlainText(plan: ExplorePlan): string {
  const lines = [
    `自在星球 · ${plan.title}`,
    plan.subtitle,
    "",
    plan.oneLiner,
    "",
    ...plan.sections.flatMap((s) => [s.title, s.body, ""]),
    plan.closing,
    "",
    "扫码加入自在星球社区（企业微信）",
  ];
  if (plan.portraitText) {
    lines.push("", "—— 对话画像原文 ——", plan.portraitText);
  }
  return lines.join("\n");
}
