export const SESSION_COOKIE = "zizai_session";
export const EXPLORE_COOKIE = "zizai_explore";

export function parseCookies(header: string | null) {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

export function serializeCookie(name: string, value: string, maxAge: number, secure: boolean) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function isSecureRequest(request: Request) {
  return new URL(request.url).protocol === "https:";
}

export function redirectTo(request: Request, location: string, cookies: string[] = []) {
  const url = new URL(location, request.url);
  const headers = new Headers();
  headers.set("Location", `${url.pathname}${url.search}${url.hash}`);
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}

export function nowIso() {
  return new Date().toISOString();
}

export function nowSec() {
  return Math.floor(Date.now() / 1000);
}
