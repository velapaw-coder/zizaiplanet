import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { db, kvDel, kvPut } from "./db";
import { parseDisplayName, parseEmail, parsePhone } from "./identity";
import { hashPassword, passwordError, verifyPassword } from "./password";
import {
  SESSION_COOKIE,
  isSecureRequest,
  nowSec,
  parseCookies,
  serializeCookie,
} from "./http";

const SESSION_TTL = 60 * 60 * 24 * 14;
const MAGIC_TTL = 60 * 15;

export type User = {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string;
  role: string;
  created_at: string;
};

function secret() {
  return env.SESSION_SECRET || "dev-only-zizai-session-secret";
}

async function hmac(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function sha256(value: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function adminEmails() {
  return (env.ADMIN_EMAILS || "admin@zizaiplanet.com")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export async function userFromCookieValue(raw: string | undefined) {
  if (!raw) return null;
  const index = raw.indexOf(".");
  if (index <= 0) return null;
  const id = raw.slice(0, index);
  const sig = raw.slice(index + 1);
  const expected = await hmac(id);
  if (!safeEqual(expected, sig)) return null;
  return db()
    .prepare(
      `SELECT u.id, u.email, u.phone, u.display_name, u.role, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`,
    )
    .bind(id, nowSec())
    .first<User>();
}

export async function getUserFromRequest(request: Request) {
  const raw = parseCookies(request.headers.get("cookie"))[SESSION_COOKIE];
  return userFromCookieValue(raw);
}

export async function currentUser() {
  try {
    const jar = await cookies();
    return await userFromCookieValue(jar.get(SESSION_COOKIE)?.value);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function sessionCookie(request: Request, token: string) {
  return serializeCookie(SESSION_COOKIE, token, SESSION_TTL, isSecureRequest(request));
}

export function clearSessionCookie(request: Request) {
  return serializeCookie(SESSION_COOKIE, "", 0, isSecureRequest(request));
}

export async function createSession(userId: string) {
  const id = crypto.randomUUID();
  const exp = nowSec() + SESSION_TTL;
  await db()
    .prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(id, userId, exp, nowSec())
    .run();
  const sig = await hmac(id);
  await kvPut(`sess:${id}`, JSON.stringify({ userId, exp }), SESSION_TTL);
  return `${id}.${sig}`;
}

export async function destroySession(raw: string | undefined) {
  if (!raw) return;
  const id = raw.slice(0, raw.indexOf("."));
  if (!id) return;
  await db().prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
  await kvDel(`sess:${id}`);
}

export function magicPreviewEnabled(request: Request) {
  if (env.MAGIC_LINK_PREVIEW === "true") return true;
  const host = new URL(request.url).hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export async function issueMagicLink(input: {
  email: string | null;
  phone: string | null;
  displayName: string;
  purpose?: "login" | "reset";
}) {
  const column = input.email ? "email" : "phone";
  const value = input.email || input.phone;
  if (!value) return { ok: false as const, reason: "邮箱和手机号填一种就好。" };
  const recent = await db()
    .prepare(`SELECT COUNT(*) AS c FROM magic_links WHERE ${column} = ? AND created_at > ?`)
    .bind(value, nowSec() - 3600)
    .first<{ c: number }>();
  if ((recent?.c ?? 0) >= 5) return { ok: false as const, reason: "这一个小时里的登录链接已经够多了，请稍后再试。" };
  const token = randomToken();
  const hash = await sha256(token);
  await db()
    .prepare(
      `INSERT INTO magic_links (token_hash, email, phone, display_name, purpose, expires_at, used_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`,
    )
    .bind(hash, input.email, input.phone, input.displayName, input.purpose || "login", nowSec() + MAGIC_TTL, nowSec())
    .run();
  return { ok: true as const, token };
}

export async function consumeMagicLink(token: string) {
  const hash = await sha256(token);
  const row = await db()
    .prepare("SELECT email, phone, display_name, purpose, expires_at, used_at FROM magic_links WHERE token_hash = ?")
    .bind(hash)
    .first<{
      email: string | null;
      phone: string | null;
      display_name: string | null;
      purpose: string | null;
      expires_at: number;
      used_at: number | null;
    }>();
  if (!row || row.used_at || row.expires_at < nowSec() || row.purpose === "reset") return null;
  await db().prepare("UPDATE magic_links SET used_at = ? WHERE token_hash = ?").bind(nowSec(), hash).run();
  const email = row.email?.toLowerCase() || null;
  const phone = row.phone || null;
  let user = email
    ? await db().prepare("SELECT id, email, phone, display_name, role, created_at FROM users WHERE email = ?").bind(email).first<User>()
    : phone
      ? await db().prepare("SELECT id, email, phone, display_name, role, created_at FROM users WHERE phone = ?").bind(phone).first<User>()
      : null;
  const named = parseDisplayName(row.display_name || "");
  const displayName = named.ok ? named.name : user?.display_name;
  if (!displayName) return null;
  const nextRole = email && adminEmails().includes(email) ? "admin" : "member";
  if (!user) {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await db()
      .prepare("INSERT INTO users (id, email, phone, display_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, email, phone, displayName, nextRole, createdAt)
      .run();
    user = { id, email, phone, display_name: displayName, role: nextRole, created_at: createdAt };
  } else {
    let role = user.role;
    if (nextRole === "admin") role = "admin";
    else if (user.role === "admin" && email && !adminEmails().includes(email)) role = "member";
    await db().prepare("UPDATE users SET display_name = ?, role = ? WHERE id = ?").bind(displayName, role, user.id).run();
    user = { ...user, display_name: displayName, role };
  }
  return user;
}

const LOGIN_FAIL = "账号或密码不正确。";

async function userByEmail(email: string) {
  return db()
    .prepare("SELECT id, email, phone, display_name, role, created_at, password_hash FROM users WHERE email = ?")
    .bind(email)
    .first<User & { password_hash: string | null }>();
}

async function userByPhone(phone: string) {
  return db()
    .prepare("SELECT id, email, phone, display_name, role, created_at, password_hash FROM users WHERE phone = ?")
    .bind(phone)
    .first<User & { password_hash: string | null }>();
}

function publicUser(row: User): User {
  return { id: row.id, email: row.email, phone: row.phone, display_name: row.display_name, role: row.role, created_at: row.created_at };
}

export async function registerWithPassword(input: {
  displayName: string;
  email: string | null;
  phone: string | null;
  password: string;
}) {
  const weak = passwordError(input.password);
  if (weak) return { ok: false as const, reason: weak };
  if (!input.phone) return { ok: false as const, reason: "请填写中国大陆手机号，11 位，以 1 开头。" };
  if (input.email && (await userByEmail(input.email))) return { ok: false as const, reason: "这个邮箱已经注册过了，请直接登录。" };
  if (input.phone && (await userByPhone(input.phone))) return { ok: false as const, reason: "这个手机号已经注册过了，请直接登录。" };
  const role = input.email && adminEmails().includes(input.email) ? "admin" : "member";
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const passwordHash = await hashPassword(input.password);
  await db()
    .prepare("INSERT INTO users (id, email, phone, display_name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, input.email, input.phone, input.displayName, role, passwordHash, createdAt)
    .run();
  return {
    ok: true as const,
    user: { id, email: input.email, phone: input.phone, display_name: input.displayName, role, created_at: createdAt } satisfies User,
  };
}

export async function loginWithPassword(accountRaw: string, password: string) {
  const email = accountRaw.includes("@") ? parseEmail(accountRaw) : null;
  const phone = email ? null : parsePhone(accountRaw);
  const row = email ? await userByEmail(email) : phone ? await userByPhone(phone) : null;
  if (!row || !(await verifyPassword(password, row.password_hash))) return { ok: false as const, reason: LOGIN_FAIL };
  return { ok: true as const, user: publicUser(row) };
}

export async function findAccount(accountRaw: string) {
  const email = accountRaw.includes("@") ? parseEmail(accountRaw) : null;
  const phone = email ? null : parsePhone(accountRaw);
  if (!email && !phone) return null;
  const row = email ? await userByEmail(email) : await userByPhone(phone || "");
  return row ? publicUser(row) : null;
}

export async function resetPasswordWithToken(token: string, password: string) {
  const weak = passwordError(password);
  if (weak) return { ok: false as const, reason: weak };
  const hash = await sha256(token);
  const row = await db()
    .prepare("SELECT email, phone, purpose, expires_at, used_at FROM magic_links WHERE token_hash = ?")
    .bind(hash)
    .first<{ email: string | null; phone: string | null; purpose: string | null; expires_at: number; used_at: number | null }>();
  if (!row || row.used_at || row.expires_at < nowSec() || row.purpose !== "reset") {
    return { ok: false as const, reason: "链接无效或已经用过。" };
  }
  const user = row.email ? await userByEmail(row.email) : row.phone ? await userByPhone(row.phone) : null;
  if (!user) return { ok: false as const, reason: "链接无效或已经用过。" };
  await db().prepare("UPDATE magic_links SET used_at = ? WHERE token_hash = ?").bind(nowSec(), hash).run();
  await db().prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(await hashPassword(password), user.id).run();
  return { ok: true as const, user: publicUser(user) };
}

export async function changePassword(userId: string, current: string, next: string) {
  const weak = passwordError(next);
  if (weak) return { ok: false as const, reason: weak };
  const row = await db().prepare("SELECT password_hash FROM users WHERE id = ?").bind(userId).first<{ password_hash: string | null }>();
  if (!row) return { ok: false as const, reason: "请先登录。" };
  if (row.password_hash && !(await verifyPassword(current, row.password_hash))) {
    return { ok: false as const, reason: "当前密码不正确。" };
  }
  await db().prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(await hashPassword(next), userId).run();
  return { ok: true as const };
}

export async function bindPhone(userId: string, phone: string) {
  const parsed = parsePhone(phone);
  if (!parsed) return { ok: false as const, reason: "请填写中国大陆手机号，11 位，以 1 开头。" };
  const taken = await userByPhone(parsed);
  if (taken && taken.id !== userId) return { ok: false as const, reason: "这个手机号已经注册过了。" };
  await db().prepare("UPDATE users SET phone = ? WHERE id = ?").bind(parsed, userId).run();
  return { ok: true as const };
}

export async function verifyTurnstile(token: string, ip: string | null) {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}
