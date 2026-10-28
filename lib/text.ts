export function clip(text: string, max: number) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}


/** Turn a site-relative or protocol-relative asset path into an absolute URL for OG crawlers. */
export function absoluteUrl(src: string | null | undefined, origin = "https://www.zizaiplanet.com") {
  const raw = (src || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  const base = origin.replace(/\/$/, "");
  if (raw.startsWith("/")) return `${base}${raw}`;
  return `${base}/${raw}`;
}


/** Shrink remote (esp. Unsplash) image URLs for list/cover use — China-friendly sizes. */
export function optimizeRemoteImageUrl(
  src: string | null | undefined,
  opts: { width?: number; quality?: number } = {},
) {
  const raw = (src || "").trim();
  if (!raw) return "";
  const width = opts.width ?? 720;
  const quality = opts.quality ?? 65;
  try {
    if (/^https?:\/\/images\.unsplash\.com\//i.test(raw)) {
      const u = new URL(raw);
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      u.searchParams.set("w", String(width));
      u.searchParams.set("q", String(quality));
      return u.toString();
    }
  } catch {
    /* keep original */
  }
  return raw;
}

export function keywordsFrom(...texts: Array<string | null | undefined>) {
  const parts: string[] = [];
  for (const text of texts) {
    if (!text) continue;
    for (const raw of text.split(/[，。！？、；：\n“”"'「」,.!?;:（）()]+/)) {
      const piece = raw.trim();
      if (piece.length >= 2 && piece.length <= 12 && !parts.includes(piece)) parts.push(piece);
      if (parts.length >= 4) return parts;
    }
  }
  return parts;
}

export function firstClause(text: string, max = 18) {
  const part = text.split(/[，。！？、；\n]/)[0]?.trim() || text.trim();
  return clip(part, max);
}

export function safeNext(raw: FormDataEntryValue | string | null | undefined, fallback = "/garden") {
  const value = typeof raw === "string" ? raw : "";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.startsWith("/auth") || value.startsWith("/api")) return fallback;
  return value;
}

export function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function formatWhen(iso: string) {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!match) return iso;
  const time = match[4] ? ` ${match[4]}:${match[5]}` : "";
  return `${match[1]}年${Number(match[2])}月${Number(match[3])}日${time}`;
}

export function roleLabel(role: string) {
  if (role === "admin") return "运营管理员";
  if (role === "host") return "茶主";
  return "自由创造者";
}

export function postStatusLabel(status: string) {
  if (status === "visible") return "公开";
  if (status === "pending") return "审核中";
  if (status === "rejected") return "未通过";
  if (status === "hidden") return "已撤下";
  return "未公开";
}

/** Stable resident ID shown on the welcome card, derived from user UUID (no DB column). */
export function residentNumber(userId: string) {
  const hex = userId.replace(/-/g, "").toUpperCase();
  const body = (hex.slice(0, 8) || "00000000").padEnd(8, "0");
  return `ZP-${body.slice(0, 4)}-${body.slice(4, 8)}`;
}

/** Join date as YYYY.MM.DD for the welcome card. */
export function formatJoinDotDate(iso: string | null | undefined) {
  if (!iso) return "————.——.——";
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "————.——.——";
  return `${match[1]}.${match[2]}.${match[3]}`;
}
