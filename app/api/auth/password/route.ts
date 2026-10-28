import {
  bindPhone,
  changePassword,
  createSession,
  getUserFromRequest,
  loginWithPassword,
  registerWithPassword,
  resetPasswordWithToken,
  sessionCookie,
  verifyTurnstile,
} from "@/lib/auth";
import { redirectTo } from "@/lib/http";
import { parseDisplayName, parseEmail, parsePhone } from "@/lib/identity";
import { safeNext } from "@/lib/text";

function back(request: Request, path: string, message: string) {
  const url = new URL(path, request.url);
  url.searchParams.set("notice", message);
  return redirectTo(request, `${url.pathname}${url.search}`);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const action = String(form.get("action") || "");
  const next = safeNext(form.get("next"), "/garden");
  const passed = await verifyTurnstile(String(form.get("cf-turnstile-response") || ""), request.headers.get("cf-connecting-ip"));
  if (!passed) return back(request, "/join", "人机验证没有通过。");

  if (action === "register_email" || action === "register_phone") {
    const named = parseDisplayName(form.get("display_name"));
    if (!named.ok) return back(request, "/join", named.reason);
    const password = String(form.get("password") || "");
    if (password !== String(form.get("password_confirm") || "")) return back(request, "/join", "两次输入的密码不一致。");
    const email = action === "register_email" ? parseEmail(form.get("email")) : null;
    const phone = parsePhone(String(form.get("phone") || "").trim());
    if (!phone) return back(request, "/join", "请填写中国大陆手机号，11 位，以 1 开头。");
    if (action === "register_email" && !email) return back(request, "/join", "请填写一个可用的邮箱。");
    const created = await registerWithPassword({
      displayName: named.name,
      email,
      phone: action === "register_phone" ? phone : phone,
      password,
    });
    if (!created.ok) {
      const path = created.reason.includes("请直接登录") ? `/join?login=1&next=${encodeURIComponent(next)}` : "/join";
      return back(request, path, created.reason);
    }
    const token = await createSession(created.user.id);
    return redirectTo(request, next, [sessionCookie(request, token)]);
  }

  if (action === "login") {
    const result = await loginWithPassword(String(form.get("account") || ""), String(form.get("password") || ""));
    if (!result.ok) return back(request, `/join?login=1&next=${encodeURIComponent(next)}`, result.reason);
    const token = await createSession(result.user.id);
    return redirectTo(request, next, [sessionCookie(request, token)]);
  }

  if (action === "reset_password") {
    const tokenValue = String(form.get("token") || "");
    if (String(form.get("password") || "") !== String(form.get("password_confirm") || "")) {
      const url = new URL("/auth/reset", request.url);
      url.searchParams.set("token", tokenValue);
      url.searchParams.set("notice", "两次输入的密码不一致。");
      return redirectTo(request, `${url.pathname}${url.search}`);
    }
    const result = await resetPasswordWithToken(tokenValue, String(form.get("password") || ""));
    if (!result.ok) return back(request, "/join", result.reason);
    const token = await createSession(result.user.id);
    return redirectTo(request, "/garden/settings", [sessionCookie(request, token)]);
  }

  const user = await getUserFromRequest(request);
  if (!user) return back(request, "/join?next=/garden/settings", "登录之后才能改自己的家园。");

  if (action === "change_password") {
    if (String(form.get("password") || "") !== String(form.get("password_confirm") || "")) {
      return back(request, "/garden/settings", "两次输入的密码不一致。");
    }
    const result = await changePassword(user.id, String(form.get("current_password") || ""), String(form.get("password") || ""));
    if (!result.ok) return back(request, "/garden/settings", result.reason);
    return back(request, "/garden/settings", "密码已更新。");
  }

  if (action === "bind_phone") {
    const result = await bindPhone(user.id, String(form.get("phone") || ""));
    if (!result.ok) return back(request, "/garden/settings", result.reason);
    return back(request, "/garden/settings", "手机号已绑定，之后也可以用它登录。");
  }

  return back(request, "/join", "这个动作没有被认出来。");
}
