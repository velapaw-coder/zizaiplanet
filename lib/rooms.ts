export type DimensionId =
  | "origin"
  | "talent"
  | "taste"
  | "values"
  | "identity"
  | "relation"
  | "vision";

export type RoomTone = "blue" | "cyan" | "purple" | "orange" | "sky" | "green" | "magenta";

/** Dimension definition. `place` kept for saved-home JSON compat; equals `name` (no room framing). */
export type RoomDef = {
  id: DimensionId;
  name: string;
  /** @deprecated product no longer uses room places; mirrors `name` */
  place: string;
  /** 七维自我探索卡上的引导问句 */
  guide: string;
  icon: string;
  tone: RoomTone;
  questions: [string, string];
};

export const ROOMS: RoomDef[] = [
  {
    id: "origin",
    name: "本源",
    place: "本源",
    guide: "我真正向往什么？",
    icon: "🧭",
    tone: "blue",
    questions: [
      "什么时刻你感到不需要证明自己，也能自然地做自己？",
      "请讲一段你感到真正自在的具体经历，当时发生了什么？",
    ],
  },
  {
    id: "talent",
    name: "天赋",
    place: "天赋",
    guide: "我自然擅长什么？",
    icon: "💎",
    tone: "cyan",
    questions: [
      "你在做什么事情时容易忘记时间？",
      "有没有一件生活里的小事，也让你用上同样的能力？",
    ],
  },
  {
    id: "taste",
    name: "品味",
    place: "品味",
    guide: "我喜欢怎样的生活？",
    icon: "☕",
    tone: "purple",
    questions: [
      "你最欣赏哪一种生活节奏与居住环境？",
      "最近一次让你觉得「这很合我心意」的体验是什么？",
    ],
  },
  {
    id: "values",
    name: "价值观",
    place: "价值观",
    guide: "什么原则对我最重要？",
    icon: "❤️",
    tone: "orange",
    questions: [
      "哪三条原则是你愿意长期坚持的？",
      "讲一次你为了原则放下利益，或为了边界说不的经历。",
    ],
  },
  {
    id: "identity",
    name: "身份",
    place: "身份",
    guide: "我希望成为怎样的人？",
    icon: "👤",
    tone: "sky",
    questions: [
      "如果拿掉职位和头衔，你希望别人怎样认识你？",
      "讲一次你觉得自己的角色与能力很匹配的具体经历。",
    ],
  },
  {
    id: "relation",
    name: "同频关系",
    place: "同频关系",
    guide: "我愿意和谁同行？",
    icon: "👥",
    tone: "green",
    questions: [
      "什么样的人让你自在、不需要证明自己？",
      "讲一个让你长期觉得舒服的关系，它是怎样形成的？",
    ],
  },
  {
    id: "vision",
    name: "人生愿景",
    place: "人生愿景",
    guide: "我想把生活过成什么样？",
    icon: "🚩",
    tone: "magenta",
    questions: [
      "你最向往的一个普通日子怎样展开？",
      "你现在已经开始实践的，是这幅画面里的哪一小部分？",
    ],
  },
];

export const CORE_IDS: DimensionId[] = ["origin", "talent", "taste", "values"];

export const EXPLORE_HARVEST = [
  { icon: "👁", title: "更了解自己", desc: "看见真实的内在需求" },
  { icon: "◎", title: "明确生活方向", desc: "找到清晰的行动路径" },
  { icon: "🪪", title: "生成个人画像", desc: "绘制属于你的独特地图" },
] as const;

export const EXPLORE_SLOGAN = "看见自己，找到方向，开启属于你的自在生活。";
export const EXPLORE_EXPLAINER =
  "通过七个维度的自我探索，逐步看见你的向往、能力、关系与方向，形成为你而写的个人画像。";
export const EXPLORE_TAGLINE = "一个星球，无数种自在生活";

/** Deeper 120-q Skill: download only; run in the resident's own AI Harness — not on this site. */
export const DEEP_SKILL_ZIP = "/skills/seven-dimensions-skill.zip";
export const DEEP_SKILL_MD = "/skills/seven_dimensions_skill/SKILL.md";

export function roomById(id: string) {
  return ROOMS.find((room) => room.id === id);
}

export function roomIndex(id: string) {
  return ROOMS.findIndex((room) => room.id === id);
}
