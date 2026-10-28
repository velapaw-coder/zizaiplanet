import {
  aspirationHasContent,
  legacyMirror,
  normalizeAspiration,
  resolveAspiration,
  type AspirationPage,
} from "./aspiration";
import { savedHome } from "./content";
import { db } from "./db";
import { nowIso } from "./http";
import { draftPublicProfileFields, readableSlugCandidate } from "./profile-generate";

export type Profile = {
  user_id: string;
  slug: string;
  experience: string;
  expertise: string;
  direction: string;
  cases: string;
  /** Empty until the six-section page is saved or generated. Missing on databases before migration 0008. */
  aspiration_json?: string | null;
  published: number;
  updated_at: string;
};

export type PublicProfile = {
  slug: string;
  displayName: string;
  experience: string;
  expertise: string;
  direction: string;
  cases: string;
  aspiration: AspirationPage;
  updatedAt: string;
};

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,31}$/;

export function defaultSlugFromUserId(userId: string) {
  const hex = userId.replace(/-/g, "").toLowerCase();
  return `zp-${(hex.slice(0, 8) || "resident").padEnd(8, "0")}`;
}

export function parseProfileSlug(raw: unknown): { ok: true; slug: string } | { ok: false; reason: string } {
  const slug = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  if (!slug) return { ok: false, reason: "请填写分享路径。" };
  if (!SLUG_RE.test(slug)) return { ok: false, reason: "分享路径用 2～32 位小写英文、数字和短横线。" };
  if (slug.startsWith("-") || slug.endsWith("-") || slug.includes("--")) {
    return { ok: false, reason: "分享路径不要以短横线开头或结尾，也不要连续短横线。" };
  }
  return { ok: true, slug };
}

export async function getProfileByUserId(userId: string) {
  return db().prepare("SELECT * FROM profiles WHERE user_id = ?").bind(userId).first<Profile>();
}

type PublicProfileRow = {
  slug: string;
  experience: string;
  expertise: string;
  direction: string;
  cases: string;
  aspiration_json?: string | null;
  updated_at: string;
  display_name: string;
};

async function readPublicProfileRow(slug: string) {
  const withAspiration = `SELECT p.slug, p.experience, p.expertise, p.direction, p.cases, p.aspiration_json, p.updated_at, u.display_name
       FROM profiles p JOIN users u ON u.id = p.user_id
       WHERE p.slug = ? AND p.published = 1`;
  try {
    return await db().prepare(withAspiration).bind(slug).first<PublicProfileRow>();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/no such column/i.test(message)) throw error;
    const legacy = await db()
      .prepare(
        `SELECT p.slug, p.experience, p.expertise, p.direction, p.cases, p.updated_at, u.display_name
         FROM profiles p JOIN users u ON u.id = p.user_id
         WHERE p.slug = ? AND p.published = 1`,
      )
      .bind(slug)
      .first<PublicProfileRow>();
    return legacy ? { ...legacy, aspiration_json: "" } : null;
  }
}

export async function getPublicProfileBySlug(slug: string): Promise<PublicProfile | null> {
  const row = await readPublicProfileRow(slug);
  if (!row) return null;
  return {
    slug: row.slug,
    displayName: row.display_name,
    experience: row.experience,
    expertise: row.expertise,
    direction: row.direction,
    cases: row.cases,
    aspiration: resolveAspiration(row),
    updatedAt: row.updated_at,
  };
}

export async function ensureProfileDraft(userId: string) {
  const existing = await getProfileByUserId(userId);
  if (existing) return existing;
  const displayName = await displayNameFor(userId);
  let finalSlug = await allocateSlug(userId, readableSlugCandidate(displayName, userId));
  const stamp = nowIso();
  await db()
    .prepare(
      `INSERT INTO profiles (user_id, slug, experience, expertise, direction, cases, published, updated_at)
       VALUES (?, ?, '', '', '', '', 0, ?)`,
    )
    .bind(userId, finalSlug, stamp)
    .run();
  return (await getProfileByUserId(userId))!;
}

export async function saveProfile(
  userId: string,
  input: {
    slug: string;
    aspiration: AspirationPage;
    published: boolean;
  },
): Promise<{ ok: true; profile: Profile } | { ok: false; reason: string }> {
  const parsed = parseProfileSlug(input.slug);
  if (!parsed.ok) return parsed;
  const aspiration = normalizeAspiration(input.aspiration);
  if (!aspirationHasContent(aspiration)) {
    return { ok: false, reason: "至少写下主张、故事、相信、做事、向往或同频中的一项。" };
  }
  const aspirationJson = JSON.stringify(aspiration);
  if (aspirationJson.length > 20000) return { ok: false, reason: "内容太长了，请删掉一些再保存。" };
  const mirrored = legacyMirror(aspiration);
  const taken = await db()
    .prepare("SELECT user_id FROM profiles WHERE slug = ? AND user_id != ?")
    .bind(parsed.slug, userId)
    .first<{ user_id: string }>();
  if (taken) return { ok: false, reason: "这个分享路径已被占用，换一个试试。" };
  const stamp = nowIso();
  await db()
    .prepare(
      `INSERT INTO profiles (user_id, slug, experience, expertise, direction, cases, aspiration_json, published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         slug = excluded.slug,
         experience = excluded.experience,
         expertise = excluded.expertise,
         direction = excluded.direction,
         cases = excluded.cases,
         aspiration_json = excluded.aspiration_json,
         published = excluded.published,
         updated_at = excluded.updated_at`,
    )
    .bind(
      userId,
      parsed.slug,
      mirrored.experience,
      mirrored.expertise,
      mirrored.direction,
      mirrored.cases,
      aspirationJson,
      input.published ? 1 : 0,
      stamp,
    )
    .run();
  const profile = await getProfileByUserId(userId);
  if (!profile) return { ok: false, reason: "保存失败，请稍后再试。" };
  return { ok: true, profile };
}

export type SyncProfileMode = "fill_empty" | "overwrite";

export type SyncProfileResult =
  | {
      ok: true;
      profile: Profile;
      changed: boolean;
      source: "none" | "explore" | "partner" | "both";
      reason?: string;
    }
  | { ok: false; reason: string };

async function latestPartnerSummary(userId: string): Promise<string | null> {
  try {
    const row = await db()
      .prepare(
        `SELECT direction_summary FROM partner_sessions
         WHERE user_id = ? AND direction_summary IS NOT NULL AND direction_summary != ''
         ORDER BY updated_at DESC LIMIT 1`,
      )
      .bind(userId)
      .first<{ direction_summary: string }>();
    return row?.direction_summary?.trim() || null;
  } catch {
    return null;
  }
}

async function displayNameFor(userId: string) {
  const row = await db()
    .prepare("SELECT display_name FROM users WHERE id = ?")
    .bind(userId)
    .first<{ display_name: string }>();
  return row?.display_name || null;
}

async function allocateSlug(userId: string, preferred: string) {
  const parsed = parseProfileSlug(preferred);
  const base = parsed.ok ? parsed.slug : defaultSlugFromUserId(userId);
  for (let i = 0; i < 8; i++) {
    const candidate = i === 0 ? base : `${base.slice(0, 24)}-${i + 1}`;
    const taken = await db()
      .prepare("SELECT user_id FROM profiles WHERE slug = ? AND user_id != ?")
      .bind(candidate, userId)
      .first<{ user_id: string }>();
    if (!taken) return candidate;
  }
  return `${defaultSlugFromUserId(userId)}-${crypto.randomUUID().slice(0, 4)}`;
}

/** Sync profile fields from explore home card + partner direction summary. */
export async function syncProfileFromSources(
  userId: string,
  mode: SyncProfileMode = "fill_empty",
): Promise<SyncProfileResult> {
  const saved = await savedHome(userId);
  const card = saved?.card ?? null;
  const directionSummary = await latestPartnerSummary(userId);
  const draft = draftPublicProfileFields({ card, directionSummary });

  if (draft.source === "none") {
    const existing = await ensureProfileDraft(userId);
    return {
      ok: true,
      profile: existing,
      changed: false,
      source: "none",
      reason: "还没有探索或方向纪要可生成。",
    };
  }

  if (!draft.experience && !draft.expertise && !draft.direction && !aspirationHasContent(draft.aspiration)) {
    const existing = await ensureProfileDraft(userId);
    return { ok: true, profile: existing, changed: false, source: draft.source, reason: "生成内容为空。" };
  }

  let profile = await getProfileByUserId(userId);
  const draftJson = JSON.stringify(draft.aspiration);

  if (!profile) {
    const displayName = await displayNameFor(userId);
    const slug = await allocateSlug(userId, readableSlugCandidate(displayName, userId));
    const stamp = nowIso();
    await db()
      .prepare(
        `INSERT INTO profiles (user_id, slug, experience, expertise, direction, cases, aspiration_json, published, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      )
      .bind(userId, slug, draft.experience, draft.expertise, draft.direction, draft.cases, draftJson, stamp)
      .run();
    profile = (await getProfileByUserId(userId))!;
    return { ok: true, profile, changed: true, source: draft.source };
  }

  const next = {
    experience: profile.experience,
    expertise: profile.expertise,
    direction: profile.direction,
    cases: profile.cases,
    aspiration_json: profile.aspiration_json || "",
  };

  const legacyAllEmpty = ![profile.experience, profile.expertise, profile.direction, profile.cases].some((item) =>
    String(item || "").trim(),
  );

  if (mode === "overwrite") {
    next.experience = draft.experience || profile.experience;
    next.expertise = draft.expertise || profile.expertise;
    next.direction = draft.direction || profile.direction;
    next.cases = draft.cases;
    if (aspirationHasContent(draft.aspiration)) next.aspiration_json = draftJson;
  } else if (!next.aspiration_json.trim() && legacyAllEmpty && aspirationHasContent(draft.aspiration)) {
    if (!next.experience.trim() && draft.experience) next.experience = draft.experience;
    if (!next.expertise.trim() && draft.expertise) next.expertise = draft.expertise;
    if (!next.direction.trim() && draft.direction) next.direction = draft.direction;
    if (!next.cases.trim() && draft.cases) next.cases = draft.cases;
    next.aspiration_json = draftJson;
  } else {
    if (!next.experience.trim() && draft.experience) next.experience = draft.experience;
    if (!next.expertise.trim() && draft.expertise) next.expertise = draft.expertise;
    if (!next.direction.trim() && draft.direction) next.direction = draft.direction;
    if (!next.cases.trim() && draft.cases) next.cases = draft.cases;
  }

  const changed =
    next.experience !== profile.experience ||
    next.expertise !== profile.expertise ||
    next.direction !== profile.direction ||
    next.cases !== profile.cases ||
    next.aspiration_json !== (profile.aspiration_json || "");

  if (!changed) {
    return { ok: true, profile, changed: false, source: draft.source };
  }

  const stamp = nowIso();
  await db()
    .prepare(
      `UPDATE profiles SET experience = ?, expertise = ?, direction = ?, cases = ?, aspiration_json = ?, updated_at = ?
       WHERE user_id = ?`,
    )
    .bind(next.experience, next.expertise, next.direction, next.cases, next.aspiration_json, stamp, userId)
    .run();

  profile = (await getProfileByUserId(userId))!;
  return { ok: true, profile, changed: true, source: draft.source };
}
