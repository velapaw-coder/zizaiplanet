import type { HomeCard } from "./compose";
import { clip, firstClause } from "./text";

export type ProfileDraftFields = {
  experience: string;
  expertise: string;
  direction: string;
  cases: string;
  source: "none" | "explore" | "partner" | "both";
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

  if (!hasExplore && !hasPartner) {
    return { experience: "", expertise: "", direction: "", cases: "", source: "none" };
  }

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

  return { experience, expertise, direction, cases, source };
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
