import { emptyAspiration, normalizeAspiration, type AspirationPage, type PracticeStep, type ResonanceGroup, type StoryNode } from "./aspiration";
import type { HomeCard } from "./compose";
import { clip, firstClause } from "./text";

export type ProfileDraftFields = {
  experience: string;
  expertise: string;
  direction: string;
  cases: string;
  aspiration: AspirationPage;
  source: "none" | "explore" | "partner" | "both";
};

const EMPTY_DRAFT: ProfileDraftFields = {
  experience: "",
  expertise: "",
  direction: "",
  cases: "",
  aspiration: emptyAspiration(),
  source: "none",
};

function room(card: HomeCard, id: string) {
  return card.rooms.find((r) => r.dimension === id && r.lit && r.quote) || null;
}

function lineAfter(summary: string, labels: string[]) {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[：:]\\s*(.+)`, "m");
    const m = summary.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

/** Build public-safe profile fields from explore home + partner direction summary.
 *  Never dumps raw seven-dimension chat transcripts. */
export function draftPublicProfileFields(input: {
  card: HomeCard | null;
  directionSummary?: string | null;
}): ProfileDraftFields {
  const card = input.card;
  const summary = (input.directionSummary || "").trim();
  const hasExplore = Boolean(card && card.litCount > 0);
  const hasPartner = Boolean(summary);

  if (!hasExplore && !hasPartner) return { ...EMPTY_DRAFT, aspiration: emptyAspiration() };

  const talent = card ? room(card, "talent") : null;
  const taste = card ? room(card, "taste") : null;
  const vision = card ? room(card, "vision") : null;
  const origin = card ? room(card, "origin") : null;
  const identity = card ? room(card, "identity") : null;
  const values = card ? room(card, "values") : null;

  const partnerOneLiner = lineAfter(summary, ["一句话方向"]);
  const partnerAbility = lineAfter(summary, ["能力与资源"]);
  const partnerDirections = lineAfter(summary, ["可选方向"]);
  const partnerStep = lineAfter(summary, ["本周最小一步"]);

  // Expertise: partner ability first, else talent
  let expertise = "";
  if (partnerAbility) {
    expertise = clip(partnerAbility.replace(/^七维已点亮[^；;。.]+[；;。.]?\s*/, ""), 400);
  }
  if (!expertise && talent?.quote) {
    expertise = `擅长：${clip(firstClause(talent.quote, 48), 48)}`;
    if (values?.quote) expertise += `；做事看重：${clip(firstClause(values.quote, 36), 36)}`;
  }

  // Direction: partner one-liner > vision/identity/directionNote
  let direction = "";
  if (partnerOneLiner) {
    direction = clip(partnerOneLiner, 400);
  } else if (card?.directionNote && !card.directionNote.includes("七维都点亮后")) {
    // Public rewrite without stacking many raw quotes
    const bits: string[] = [];
    if (vision?.quote) bits.push(`向往：${clip(firstClause(vision.quote, 40), 40)}`);
    if (identity?.quote) bits.push(`想成为：${clip(firstClause(identity.quote, 32), 32)}`);
    if (origin?.quote) bits.push(`本源：${clip(firstClause(origin.quote, 32), 32)}`);
    direction = bits.length ? bits.join(" · ") : clip(card.directionNote, 400);
  } else if (vision?.quote) {
    direction = `向往：${clip(firstClause(vision.quote, 60), 60)}`;
  }

  // Experience: public narrative from lit dims (summarized, not transcript)
  const expParts: string[] = [];
  if (talent?.quote) {
    expParts.push(`在能力上，自然会走到「${clip(firstClause(talent.quote, 40), 40)}」一类的事。`);
  }
  if (taste?.quote) {
    expParts.push(`当下生活更贴近：${clip(firstClause(taste.quote, 48), 48)}。`);
  }
  if (origin?.quote && !talent?.quote) {
    expParts.push(`自我探索里，本源一句是：${clip(firstClause(origin.quote, 48), 48)}。`);
  }
  if (partnerAbility && !expParts.length) {
    expParts.push(clip(partnerAbility, 280));
  }
  if (card && card.litCount > 0 && expParts.length === 0) {
    expParts.push(`已完成七维探索 ${card.litCount}/7，正在把画像落成可分享的身份页。`);
  }
  let experience = expParts.join("");

  // Cases: optional directions / weekly step from partner only (not private chat)
  const caseBits: string[] = [];
  if (partnerDirections) {
    const normalized = partnerDirections
      .replace(/\s*(\d+)\.\s*/g, "\n$1. ")
      .trim();
    caseBits.push(normalized);
  }
  if (partnerStep) caseBits.push(`本周最小一步：${clip(partnerStep, 120)}`);
  let cases = caseBits.join("\n").trim();

  // Length caps aligned with saveProfile
  experience = experience.slice(0, 2000);
  expertise = expertise.slice(0, 800);
  direction = direction.slice(0, 800);
  cases = cases.slice(0, 2000);

  const source: ProfileDraftFields["source"] =
    hasExplore && hasPartner ? "both" : hasPartner ? "partner" : "explore";

  const aspiration = draftAspiration({
    card,
    partnerOneLiner,
    partnerAbility,
    partnerDirections,
    partnerStep,
    summary,
  });

  return { experience, expertise, direction, cases, aspiration, source };
}

type RoomLike = { keywords?: string[]; quote?: string | null } | null;

function tight(text: string, max: number) {
  const part = (text || "").split(/[，。！？、；\n]/)[0]?.trim() || "";
  return part.replace(/\s+/g, " ").slice(0, max);
}

function polishLead(text: string, max: number) {
  const stripped = tight(text, max + 16).replace(
    /^(我想成为|想成为|我希望成为|希望成为|我向往|向往|我想|想|我喜欢|喜欢|我希望|希望|我觉得|觉得|我感到|感到)/,
    "",
  );
  return stripped.trim().slice(0, max);
}

/** A short pill from the resident's own words. No site-wide slogan list. */
export function keywordFromQuote(text: string) {
  const cleaned = (text || "")
    .replace(
      /^(我想成为|想成为|我希望成为|希望成为|我向往|向往|我想|想|我喜欢|喜欢|我希望|希望|我觉得|觉得|我感到|感到|真正|特别|很)/,
      "",
    )
    .trim();
  const parts = cleaned
    .split(/[，。！？、；：:\n的时后里和与]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2 && part.length <= 8);
  if (!parts.length) {
    const fallback = cleaned.replace(/\s+/g, "").slice(0, 4);
    return fallback.length >= 2 ? fallback : "";
  }
  let best = parts[0];
  let bestScore = Math.abs(best.length - 4);
  for (const part of parts.slice(1)) {
    const score = Math.abs(part.length - 4);
    if (score <= bestScore) {
      best = part;
      bestScore = score;
    }
  }
  return best;
}

function keywordFromRoom(room: RoomLike) {
  if (!room) return "";
  const listed = (room.keywords || []).map((item) => item.trim()).find((item) => item.length >= 2 && item.length <= 8);
  if (listed) return listed;
  return keywordFromQuote(room.quote || "");
}

function uniq(items: Array<string | undefined | null>, max: number) {
  const out: string[] = [];
  for (const item of items) {
    const text = String(item || "").trim();
    if (!text || out.includes(text)) continue;
    out.push(text);
    if (out.length >= max) break;
  }
  return out;
}

function visionPhrase(quote: string, max: number) {
  const after = /[：:]/.test(quote) ? quote.split(/[：:]/).slice(1).join("：") : quote;
  return clip(after.trim(), max).replace(/…$/, "");
}

function splitList(text: string) {
  return text
    .replace(/\s*(\d+)[.、．]\s*/g, "\n$1. ")
    .split(/[\n；;、]/)
    .map((part) => part.replace(/^\d+[.、．]\s*/, "").trim())
    .filter((part) => part.length >= 2);
}

function beliefPoints(quote: string) {
  const parts = splitList(quote).filter((part) => part.length <= 40);
  if (parts.length >= 2) return parts.slice(0, 5);
  const one = tight(quote, 48);
  return one ? [one] : [];
}

function mentionsAi(text: string) {
  return /AI|AIGC|人工智能|大模型/i.test(text);
}

function draftAspiration(input: {
  card: HomeCard | null;
  partnerOneLiner: string;
  partnerAbility: string;
  partnerDirections: string;
  partnerStep: string;
  summary: string;
}): AspirationPage {
  const card = input.card;
  const talent = card ? room(card, "talent") : null;
  const taste = card ? room(card, "taste") : null;
  const vision = card ? room(card, "vision") : null;
  const origin = card ? room(card, "origin") : null;
  const identity = card ? room(card, "identity") : null;
  const values = card ? room(card, "values") : null;
  const relation = card ? room(card, "relation") : null;

  const identityBit = identity?.quote ? polishLead(identity.quote, 28) : "";
  const visionBit = vision?.quote ? visionPhrase(vision.quote, 36) : "";
  const originBit = origin?.quote ? polishLead(origin.quote, 24) : "";

  let sentence = "";
  if (input.partnerOneLiner) sentence = clip(input.partnerOneLiner, 160);
  else if (identityBit && visionBit) sentence = `我想成为${identityBit}，把日子过成「${visionBit}」。`;
  else if (visionBit) sentence = `我想把日子过成「${visionBit}」。`;
  else if (identityBit) sentence = `我想成为${identityBit}。`;
  else if (originBit) sentence = `我在意的是：${originBit}。`;
  else if (talent?.quote) sentence = `我自然会做的事是：${tight(talent.quote, 36)}。`;

  const keywords = uniq(
    [taste, talent, values, vision, identity, origin].map((item) => keywordFromRoom(item)),
    3,
  );

  const nodes: StoryNode[] = [];
  if (origin?.quote) {
    nodes.push({
      when: "起点",
      title: keywordFromQuote(origin.quote) || "起点",
      detail: clip(origin.quote, 100),
    });
  }
  if (talent?.quote) {
    nodes.push({
      when: "已会",
      title: keywordFromQuote(talent.quote) || "已会的事",
      detail: clip(talent.quote, 100),
    });
  }
  if (taste?.quote) {
    nodes.push({
      when: "眼下",
      title: keywordFromQuote(taste.quote) || "现在的生活",
      detail: clip(taste.quote, 100),
    });
  }
  if (vision?.quote || identity?.quote) {
    const source = vision?.quote || identity?.quote || "";
    nodes.push({
      when: "正去往",
      title: keywordFromQuote(source) || "想去的方向",
      detail: clip(source, 100),
    });
  }
  if (!nodes.length && input.partnerAbility) {
    nodes.push({ when: "", title: "已经有的", detail: clip(input.partnerAbility, 100) });
  }

  const points = values?.quote ? beliefPoints(values.quote) : [];
  const closing = "";

  const steps: PracticeStep[] = [];
  const seen = vision?.quote || origin?.quote;
  if (seen) steps.push({ name: "看见", detail: clip(vision?.quote || origin?.quote || "", 80) });
  if (talent?.quote) steps.push({ name: "动手", detail: clip(talent.quote, 80) });
  else if (input.partnerAbility) steps.push({ name: "动手", detail: clip(input.partnerAbility, 80) });
  if (values?.quote) steps.push({ name: "校准", detail: clip(values.quote, 80) });
  if (input.partnerDirections && steps.length < 3) {
    for (const item of splitList(input.partnerDirections)) {
      if (steps.length >= 3) break;
      steps.push({ name: keywordFromQuote(item) || tight(item, 8) || "一条路", detail: tight(item, 80) });
    }
  }
  if (input.partnerStep) steps.push({ name: "下一步", detail: clip(input.partnerStep, 80) });
  else if (relation?.quote && steps.length < 4) steps.push({ name: "靠近", detail: clip(relation.quote, 80) });

  const aiWord = mentionsAi(`${input.summary}\n${vision?.quote || ""}\n${talent?.quote || ""}`) ? "AI" : "";
  const longingKeywords = uniq(
    [vision, identity, origin].map((item) => keywordFromRoom(item)).concat(aiWord ? [aiWord] : []),
    4,
  );
  let line = "";
  if (visionBit && identityBit) line = `我想靠近的是${visionBit}。也希望自己成为${identityBit}。`;
  else if (visionBit) line = `我想靠近的是：${visionBit}`;
  else if (input.partnerDirections) line = `可以先靠近这些：${clip(splitList(input.partnerDirections).join("、"), 80)}`;
  else if (input.partnerOneLiner && input.partnerOneLiner !== sentence) line = clip(input.partnerOneLiner, 160);

  const groups: ResonanceGroup[] = [];
  if (relation?.quote || vision?.quote || input.partnerOneLiner) {
    groups.push({
      who: relation?.quote ? clip(relation.quote, 80) : "向往与我靠近的人",
      direction: vision?.quote
        ? clip(vision.quote, 80)
        : input.partnerOneLiner || sentence || "一起把方向说清楚",
      connect: "先读这一页，愿意的话再用你习惯的方式打个招呼",
      goal: "",
    });
  }
  if (talent?.quote || input.partnerAbility) {
    const able = talent?.quote ? tight(talent.quote, 28) : tight(input.partnerAbility, 28);
    groups.push({
      who: able ? `能和「${able}」互补的人` : "能力可以互补的人",
      direction: input.partnerOneLiner || visionBit || "一起把一件具体的小事做完",
      connect: "先做完一件很小的事，再决定要不要继续",
      goal: "",
    });
  }
  if (/客户|用户|访谈|老板|学员/.test(input.summary) && groups.length < 4) {
    groups.push({
      who: "正面临相近问题、愿意被认真听完的人",
      direction: input.partnerOneLiner || "先把真实需要听清楚",
      connect: "一次访谈，或一次很小的交付",
      goal: input.partnerStep ? clip(input.partnerStep, 80) : "",
    });
  }

  return normalizeAspiration({
    claim: { sentence, keywords },
    story: { nodes },
    believe: { points, closing },
    practice: { steps: steps.slice(0, 4) },
    longing: { keywords: longingKeywords, line },
    resonance: { groups: groups.slice(0, 4) },
  });
}

/** Prefer a readable latin slug from display name; else zp-xxxxxxxx. */
export function readableSlugCandidate(displayName: string | null | undefined, userId: string) {
  const raw = String(displayName || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
  const ascii = raw
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-")
    .slice(0, 24);
  if (ascii.length >= 2 && /^[a-z0-9]/.test(ascii)) return ascii;
  const hex = userId.replace(/-/g, "").toLowerCase();
  return `zp-${(hex.slice(0, 8) || "resident").padEnd(8, "0")}`;
}
