import { consumeMagicLink, createSession, sessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { EXPLORE_COOKIE, parseCookies, redirectTo } from "@/lib/http";
import { safeNext } from "@/lib/text";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"), "/garden");
  const user = await consumeMagicLink(url.searchParams.get("token") || "");
  if (!user) {
    const back = new URL("/join", request.url);
    back.searchParams.set("notice", "链接无效或已经用过。");
    return redirectTo(request, `${back.pathname}${back.search}`);
  }
  const exploreId = parseCookies(request.headers.get("cookie"))[EXPLORE_COOKIE];
  if (exploreId) {
    await db()
      .prepare("UPDATE explore_sessions SET user_id = ? WHERE id = ? AND (user_id IS NULL OR user_id = ?)")
      .bind(user.id, exploreId, user.id)
      .run();
  }
  const token = await createSession(user.id);
  return redirectTo(request, next, [sessionCookie(request, token)]);
}
