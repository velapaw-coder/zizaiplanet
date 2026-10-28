import { env } from "cloudflare:workers";
import {
  clearSessionCookie,
  destroySession,
  getUserFromRequest,
  type User,
} from "./auth";
import { composeHome, type HomeCard } from "./compose";
import { db } from "./db";
import {
  activeExploreSession,
  cardsForSession,
  exploreCookieFor,
  revisitDimension,
  savedExploreSession,
} from "./explore";
import {
  SESSION_COOKIE,
  nowIso,
  parseCookies,
  redirectTo,
} from "./http";
import { parseDisplayName } from "./identity";
import { moderateText } from "./moderate";
import { clip, safeNext } from "./text";
import { LLM_PRESETS } from "./llm";
import {
  COMMUNITY_WECOM_QR_KEY,
  COMMUNITY_WECOM_QR_MEDIA_KEY,
  saveLlmPlatformChoice,
  setSiteSetting,
} from "./site-settings";

function back(request: Request, path: string, message?: string, cookies: string[] = []) {
  const url = new URL(path, request.url);
  if (message) url.searchParams.set("notice", message);
  return redirectTo(request, `${url.pathname}${url.search}${url.hash}`, cookies);
}

function needUser(request: Request, user: User | null, next: string) {
  if (user) return null;
  return back(request, `/join?login=1&next=${encodeURIComponent(safeNext(next, "/garden"))}`, "登录之后才能保存或参与。");
}

async function toggleRow(sqlExists: string, sqlDelete: string, sqlInsert: string, binds: unknown[]) {
  const row = await db().prepare(sqlExists).bind(...binds).first<{ ok: number }>();
  if (row) await db().prepare(sqlDelete).bind(...binds).run();
  else await db().prepare(sqlInsert).bind(...binds, nowIso()).run();
  return !row;
}

export async function dispatchAction(request: Request, form: FormData) {
  const action = String(form.get("action") || "");
  const user = await getUserFromRequest(request);
  const next = safeNext(form.get("next"), "/");

  if (action === "logout") {
    await destroySession(parseCookies(request.headers.get("cookie"))[SESSION_COOKIE]);
    return redirectTo(request, "/", [clearSessionCookie(request)]);
  }

  if (action === "save_home") {
    const denied = needUser(request, user, "/garden");
    if (denied || !user) return denied!;
    const session = (await activeExploreSession(request, user)) ?? (await savedExploreSession(user));
    if (!session) return back(request, "/explore", "还没有可以保存的探索。");
    const cards = await cardsForSession(session.id);
    const existing = await db()
      .prepare("SELECT payload FROM homes WHERE user_id = ?")
      .bind(user.id)
      .first<{ payload: string }>();
    let changeNote = "首次安家";
    if (existing) {
      try {
        const prev = JSON.parse(existing.payload) as HomeCard;
        const draft = composeHome({ cards });
        const changed = draft.rooms
          .filter((room) => {
            const old = prev.rooms.find((item) => item.dimension === room.dimension);
            return !old || old.quote !== room.quote || old.lit !== room.lit;
          })
          .map((room) => room.name);
        changeNote = changed.length ? `这次更新了：${changed.join("、")}` : "再次保存，原话没有明显变化";
      } catch {
        changeNote = "再次保存";
      }
    }
    const card = composeHome({ cards, changeNote });
    if (card.litCount < 1) return back(request, "/explore", "至少点亮一个维度，再保存家园。");
    const stamp = nowIso();
    await db()
      .prepare(
        `INSERT INTO homes (user_id, session_id, payload, is_private, updated_at)
         VALUES (?, ?, ?, 1, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           session_id = excluded.session_id, payload = excluded.payload, updated_at = excluded.updated_at`,
      )
      .bind(user.id, session.id, JSON.stringify(card), stamp)
      .run();
    if (!session.user_id) {
      await db().prepare("UPDATE explore_sessions SET user_id = ? WHERE id = ?").bind(user.id, session.id).run();
    }
    try {
      const { syncProfileFromSources } = await import("./profile");
      await syncProfileFromSources(user.id, "fill_empty");
    } catch {
      // profile sync is best-effort
    }
    return back(request, "/garden", "已保存到你的家园，默认只有你自己看得见。", [
      exploreCookieFor(request, session.id),
    ]);
  }

  if (action === "resume") {
    const denied = needUser(request, user, "/garden");
    if (denied || !user) return denied!;
    const session = await savedExploreSession(user);
    if (!session) return back(request, "/explore", "还没有保存过的探索可以继续。");
    return redirectTo(request, "/explore#now", [exploreCookieFor(request, session.id)]);
  }

  if (action === "revisit") {
    return revisitDimension(request, user, String(form.get("dimension") || ""));
  }

  if (action === "rename") {
    const denied = needUser(request, user, "/garden");
    if (denied || !user) return denied!;
    const named = parseDisplayName(form.get("display_name"));
    if (!named.ok) return back(request, safeNext(form.get("next"), "/garden"), named.reason);
    const name = named.name;
    await db().prepare("UPDATE users SET display_name = ? WHERE id = ?").bind(name, user.id).run();
    return back(request, safeNext(form.get("next"), "/garden"), "名字已更新。");
  }

  if (action === "post") {
    const returnTo = safeNext(form.get("next"), "/community");
    const denied = needUser(request, user, returnTo);
    if (denied || !user) return denied!;
    const body = String(form.get("body") || "").trim();
    if (body.length < 1 || body.length > 2000) return back(request, returnTo, "写一点再发布，最多两千字。");
    const topic = clip(String(form.get("topic") || "生活日常"), 16).replace(/…$/, "") || "生活日常";
    let imageKey: string | null = null;
    const file = form.get("image");
    if (file instanceof File && file.size > 0) {
      if (file.size > 2_000_000) return back(request, returnTo, "图片请小于 2MB。");
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        return back(request, returnTo, "图片只用 jpg、png、webp 或 gif。");
      }
      imageKey = `posts/${crypto.randomUUID()}`;
      await env.MEDIA.put(imageKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    }
    const id = crypto.randomUUID();
    let verdict = { pass: false, reason: "审核没有完成，这段先不公开。" };
    try {
      verdict = await moderateText(`${topic}\n${body}`);
    } catch (error) {
      console.error(error);
    }
    const status = verdict.pass ? "visible" : "rejected";
    await db()
      .prepare(
        `INSERT INTO posts (id, user_id, author_name, body, image_key, topic, status, review_note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, user.id, user.display_name, body, imageKey, topic, status, verdict.pass ? null : verdict.reason, nowIso())
      .run();
    const successPath = returnTo === "/community" ? `/community/${id}` : returnTo;
    return back(request, successPath, verdict.pass ? "已经放下这段分享。" : verdict.reason);
  }

  if (action === "comment") {
    const postId = String(form.get("post_id") || "");
    const denied = needUser(request, user, `/community/${postId}`);
    if (denied || !user) return denied!;
    const body = String(form.get("body") || "").trim();
    if (body.length < 1 || body.length > 500) return back(request, `/community/${postId}`, "评论写短一点，五百字以内。");
    const post = await db().prepare("SELECT id, status FROM posts WHERE id = ?").bind(postId).first<{ id: string; status: string }>();
    if (!post || post.status !== "visible") return back(request, "/community", "这段分享已经不在了。");
    await db()
      .prepare(
        `INSERT INTO comments (id, post_id, user_id, author_name, body, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'visible', ?)`,
      )
      .bind(crypto.randomUUID(), postId, user.id, user.display_name, body, nowIso())
      .run();
    return back(request, `/community/${postId}`, "评论已留下。");
  }

  if (action === "like") {
    const postId = String(form.get("post_id") || "");
    const denied = needUser(request, user, `/community/${postId}`);
    if (denied || !user) return denied!;
    await toggleRow(
      "SELECT 1 AS ok FROM likes WHERE post_id = ? AND user_id = ?",
      "DELETE FROM likes WHERE post_id = ? AND user_id = ?",
      "INSERT INTO likes (post_id, user_id, created_at) VALUES (?, ?, ?)",
      [postId, user.id],
    );
    const returnTo = safeNext(form.get("next"), `/community/${postId}`);
    return back(request, returnTo);
  }

  if (action === "report") {
    const targetType = String(form.get("target_type") || "");
    const targetId = String(form.get("target_id") || "");
    const denied = needUser(request, user, "/community");
    if (denied || !user) return denied!;
    if (targetType !== "post" && targetType !== "comment") return back(request, "/community", "举报对象不清楚。");
    const reason = String(form.get("reason") || "").trim();
    if (reason.length < 2 || reason.length > 300) return back(request, next, "用一两句话说明哪里不合适。");
    await db()
      .prepare(
        `INSERT INTO reports (id, target_type, target_id, user_id, reason, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'open', ?)`,
      )
      .bind(crypto.randomUUID(), targetType, targetId, user.id, reason, nowIso())
      .run();
    return back(request, next, "已交给运营，不会公开你的举报。");
  }

  if (action === "favorite") {
    const denied = needUser(request, user, next);
    if (denied || !user) return denied!;
    const articleId = String(form.get("article_id") || "");
    const article = await db().prepare("SELECT slug FROM articles WHERE id = ?").bind(articleId).first<{ slug: string }>();
    if (!article) return back(request, "/journal", "没有找到这篇文章。");
    await toggleRow(
      "SELECT 1 AS ok FROM favorites WHERE user_id = ? AND target_type = 'article' AND target_id = ?",
      "DELETE FROM favorites WHERE user_id = ? AND target_type = 'article' AND target_id = ?",
      "INSERT INTO favorites (user_id, target_type, target_id, created_at) VALUES (?, 'article', ?, ?)",
      [user.id, articleId],
    );
    return back(request, `/journal/${article.slug}`);
  }

  if (action === "claim") {
    const denied = needUser(request, user, next);
    if (denied || !user) return denied!;
    const resourceId = String(form.get("resource_id") || "");
    const resource = await db().prepare("SELECT slug FROM resources WHERE id = ?").bind(resourceId).first<{ slug: string }>();
    if (!resource) return back(request, "/energy", "没有找到这份资源。");
    await toggleRow(
      "SELECT 1 AS ok FROM claims WHERE user_id = ? AND resource_id = ?",
      "DELETE FROM claims WHERE user_id = ? AND resource_id = ?",
      "INSERT INTO claims (user_id, resource_id, created_at) VALUES (?, ?, ?)",
      [user.id, resourceId],
    );
    return back(request, `/energy/${resource.slug}`, "已放进我的家园。");
  }

  if (action === "rsvp") {
    const eventId = String(form.get("event_id") || "");
    const denied = needUser(request, user, `/tea/${eventId}`);
    if (denied || !user) return denied!;
    const event = await db()
      .prepare("SELECT id, status FROM events WHERE id = ?")
      .bind(eventId)
      .first<{ id: string; status: string }>();
    if (!event || event.status !== "approved") return back(request, "/tea", "这场茶局还不能报名。");
    await toggleRow(
      "SELECT 1 AS ok FROM rsvps WHERE event_id = ? AND user_id = ?",
      "DELETE FROM rsvps WHERE event_id = ? AND user_id = ?",
      "INSERT INTO rsvps (event_id, user_id, created_at) VALUES (?, ?, ?)",
      [eventId, user.id],
    );
    return back(request, `/tea/${eventId}`);
  }

  if (action === "propose") {
    const denied = needUser(request, user, "/tea");
    if (denied || !user) return denied!;
    const title = clip(String(form.get("title") || ""), 40).replace(/…$/, "");
    const summary = String(form.get("summary") || "").trim();
    const theme = clip(String(form.get("theme") || ""), 16).replace(/…$/, "");
    const starts = String(form.get("starts_at") || "").trim();
    const place = clip(String(form.get("place") || "线上"), 24).replace(/…$/, "") || "线上";
    if (title.length < 2 || summary.length < 4 || summary.length > 500 || theme.length < 1 || !starts) {
      return back(request, "/tea", "把主题、时间和一两句介绍写完整。");
    }
    await db()
      .prepare(
        `INSERT INTO events
         (id, title, summary, theme, starts_at, place, host_name, status, proposed_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      )
      .bind(crypto.randomUUID(), title, summary, theme, starts, place, user.display_name, user.id, nowIso())
      .run();
    return back(request, "/tea", "提议已提交，通过审核后才会公开报名。");
  }

  if (action === "save_profile") {
    const denied = needUser(request, user, "/profile");
    if (denied || !user) return denied!;
    const { saveProfile } = await import("./profile");
    const { parseAspirationJson, aspirationFromLegacy } = await import("./aspiration");
    const published = String(form.get("published") || "") === "1" || form.get("published") === "on";
    const rawAspiration = String(form.get("aspiration_json") || "");
    const aspiration = rawAspiration.trim()
      ? parseAspirationJson(rawAspiration)
      : aspirationFromLegacy({
          experience: String(form.get("experience") || ""),
          expertise: String(form.get("expertise") || ""),
          direction: String(form.get("direction") || ""),
          cases: String(form.get("cases") || ""),
        });
    if (!aspiration) return back(request, "/profile", "向往内容没有保存成功，请再试一次。");
    const result = await saveProfile(user.id, {
      slug: String(form.get("slug") || ""),
      aspiration,
      published,
    });
    if (!result.ok) return back(request, "/profile", result.reason);
    const msg = result.profile.published
      ? `「我的向往」已保存并公开，可分享 /u/${result.profile.slug}`
      : "「我的向往」已保存（仍为私密草稿）。勾选公开并保存后即可分享。";
    return back(request, "/profile", msg);
  }

  if (action === "regenerate_profile") {
    const denied = needUser(request, user, "/profile");
    if (denied || !user) return denied!;
    const { syncProfileFromSources } = await import("./profile");
    const result = await syncProfileFromSources(user.id, "overwrite");
    if (!result.ok) return back(request, "/profile", result.reason);
    if (result.source === "none") {
      return back(request, "/profile", result.reason || "请先完成七维探索或与 AI 分身生成方向纪要。");
    }
    const msg = result.changed
      ? "已根据探索与方向纪要重新写成六段「我的向往」，请核对后保存。"
      : "「我的向往」已是最新生成结果，可直接改完再保存。";
    return back(request, "/profile", msg);
  }

  if (!user || user.role !== "admin") return back(request, "/", "这里只对运营管理员开放。");

  if (action === "admin_resolve") {
    await db().prepare("UPDATE reports SET status = 'resolved' WHERE id = ?").bind(String(form.get("id") || "")).run();
    return back(request, "/admin", "举报已标记处理。");
  }

  if (action === "admin_hide") {
    const targetType = String(form.get("target_type") || "");
    const targetId = String(form.get("target_id") || "");
    if (targetType === "post") await db().prepare("UPDATE posts SET status = 'hidden' WHERE id = ?").bind(targetId).run();
    if (targetType === "comment") await db().prepare("UPDATE comments SET status = 'hidden' WHERE id = ?").bind(targetId).run();
    return back(request, "/admin", "内容已从公开页面撤下。");
  }

  if (action === "admin_event") {
    const id = String(form.get("id") || "");
    const decision = String(form.get("decision") || "");
    const status = decision === "approve" ? "approved" : "rejected";
    const row = await db()
      .prepare("SELECT proposed_by FROM events WHERE id = ?")
      .bind(id)
      .first<{ proposed_by: string | null }>();
    await db().prepare("UPDATE events SET status = ? WHERE id = ?").bind(status, id).run();
    if (status === "approved" && row?.proposed_by) {
      await db()
        .prepare("UPDATE users SET role = 'host' WHERE id = ? AND role = 'member'")
        .bind(row.proposed_by)
        .run();
    }
    return back(request, "/admin", status === "approved" ? "茶局已公开，提议人成为茶主。" : "提议未通过。");
  }

  if (action === "admin_article") {
    const slug = String(form.get("slug") || "");
    if (!/^[a-z0-9-]{2,48}$/.test(slug)) return back(request, "/admin", "文章路径只用小写英文、数字和短横线。");
    const title = String(form.get("title") || "").trim();
    const summary = String(form.get("summary") || "").trim();
    const topic = String(form.get("topic") || "").trim();
    const tags = String(form.get("tags") || "").trim();
    const cover = String(form.get("cover") || "").trim();
    const body = String(form.get("body") || "").trim();
    if (!title || !summary || !topic || !body) return back(request, "/admin", "文章的标题、摘要、栏目和正文都要有。");
    await db()
      .prepare(
        `INSERT INTO articles (id, slug, title, summary, topic, tags, cover, body, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           title = excluded.title, summary = excluded.summary, topic = excluded.topic,
           tags = excluded.tags, cover = excluded.cover, body = excluded.body`,
      )
      .bind(crypto.randomUUID(), slug, title, summary, topic, tags, cover || "/logo.png", body.slice(0, 20000), nowIso())
      .run();
    return back(request, `/journal/${slug}`, "文章已发布。");
  }

  if (action === "admin_llm") {
    const presetId = String(form.get("preset_id") || "").trim();
    const modelRaw = String(form.get("model") || "").trim();
    if (!LLM_PRESETS.some((item) => item.id === presetId)) {
      return back(request, "/admin", "请选择有效的大模型服务商。");
    }
    if (modelRaw.length > 80) return back(request, "/admin", "模型 ID 太长了。");
    await saveLlmPlatformChoice({ presetId, model: modelRaw || null });
    return back(request, "/admin", "已保存七维对话默认模型。");
  }

  if (action === "admin_wecom_qr") {
    const file = form.get("qr");
    if (!(file instanceof File) || file.size <= 0) {
      return back(request, "/admin", "请选择要上传的企业微信二维码图片。");
    }
    if (file.size > 2_000_000) {
      return back(request, "/admin", "二维码图片请小于 2MB。");
    }
    const allowed = ["image/png", "image/jpeg", "image/webp"] as const;
    if (!allowed.includes(file.type as (typeof allowed)[number])) {
      return back(request, "/admin", "二维码只用 PNG、JPG 或 WebP。");
    }
    try {
      await env.MEDIA.put(COMMUNITY_WECOM_QR_MEDIA_KEY, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      });
    } catch (error) {
      console.error("admin_wecom_qr upload failed", error);
      return back(request, "/admin", "上传失败，请稍后重试；若持续失败请检查 R2 MEDIA 绑定。");
    }
    const stamp = Date.now().toString(36);
    const url = `/api/media/${COMMUNITY_WECOM_QR_MEDIA_KEY}?v=${stamp}`;
    try {
      await setSiteSetting(COMMUNITY_WECOM_QR_KEY, url);
    } catch (error) {
      console.error("admin_wecom_qr setting failed", error);
      return back(request, "/admin", "图片已上传，但站点设置写入失败，请重试。");
    }
    return back(request, "/admin", "社区企业微信二维码已更新。");
  }

  if (action === "admin_resource") {
    const slug = String(form.get("slug") || "");
    if (!/^[a-z0-9-]{2,48}$/.test(slug)) return back(request, "/admin", "资源路径只用小写英文、数字和短横线。");
    const title = String(form.get("title") || "").trim();
    const summary = String(form.get("summary") || "").trim();
    const category = String(form.get("category") || "").trim();
    const prompt = String(form.get("prompt") || "").trim();
    const body = String(form.get("body") || "").trim();
    const icon = String(form.get("icon") || "✳").trim() || "✳";
    const cover = String(form.get("cover") || "").trim();
    if (!title || !summary || !category || !prompt || !body) return back(request, "/admin", "资源的标题、简介、分类、提示词和说明都要有。");
    await db()
      .prepare(
        `INSERT INTO resources (id, slug, title, summary, category, body, prompt, icon, cover)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           title = excluded.title, summary = excluded.summary, category = excluded.category,
           body = excluded.body, prompt = excluded.prompt, icon = excluded.icon, cover = excluded.cover`,
      )
      .bind(crypto.randomUUID(), slug, title, summary, category, body.slice(0, 30000), prompt.slice(0, 4000), icon.slice(0, 4), cover.slice(0, 500))
      .run();
    return back(request, `/energy/${slug}`, "资源已发布。");
  }

  return back(request, next, "这个动作没有被认出来。");
}
