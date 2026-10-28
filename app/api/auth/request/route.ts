import { env } from "cloudflare:workers";
import { findAccount, issueMagicLink, magicPreviewEnabled, verifyTurnstile } from "@/lib/auth";
import { redirectTo } from "@/lib/http";
import { parseDisplayName, parseEmail, parsePhone } from "@/lib/identity";
import { safeNext } from "@/lib/text";

export async function POST(request: Request) {
  const form = await request.formData();
  const next = safeNext(form.get("next"), "/garden");
  const intent = String(form.get("intent") || "") === "reset" ? "reset" : "phone";
  const back = (message: string) => {
    const url = new URL("/join", request.url);
    url.searchParams.set("next", next);
    url.searchParams.set("notice", message);
    return redirectTo(request, `${url.pathname}${url.search}`);
  };
  const passed = await verifyTurnstile(String(form.get("cf-turnstile-response") || ""), request.headers.get("cf-connecting-ip"));
  if (!passed) return back("人机验证没有通过。");

  let email: string | null = null;
  let phone: string | null = null;
  let displayName = "";
  if (intent === "reset") {
    const account = String(form.get("account") || "").trim();
    email = account.includes("@") ? parseEmail(account) : null;
    phone = email ? null : parsePhone(account);
    if (!email && !phone) return back("请填写注册时用的邮箱或手机号。");
    const user = await findAccount(account);
    if (!user) {
      const url = new URL("/join", request.url);
      url.searchParams.set("sent", "1");
      url.searchParams.set("intent", "reset");
      url.searchParams.set("next", next);
      return redirectTo(request, `${url.pathname}${url.search}`);
    }
    displayName = user.display_name;
    email = user.email;
    phone = user.phone;
  } else {
    const named = parseDisplayName(form.get("display_name"));
    if (!named.ok) return back(named.reason);
    const phoneRaw = String(form.get("phone") || "").trim();
    phone = phoneRaw ? parsePhone(phoneRaw) : null;
    if (!phone) return back("请填写中国大陆手机号，11 位，以 1 开头。");
    displayName = named.name;
  }

  const issued = await issueMagicLink({ email, phone, displayName, purpose: intent === "reset" ? "reset" : "login" });
  if (!issued.ok) return back(issued.reason);
  const link = new URL(intent === "reset" ? "/auth/reset" : "/auth/verify", request.url);
  link.searchParams.set("token", issued.token);
  link.searchParams.set("next", next);
  if (env.MAIL_WEBHOOK_URL) {
    try {
      await fetch(env.MAIL_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, phone, url: link.toString(), purpose: intent }),
      });
    } catch (error) {
      console.error("mail webhook failed", error);
    }
  }
  if (magicPreviewEnabled(request)) {
    const url = new URL("/join", request.url);
    url.searchParams.set("preview", issued.token);
    url.searchParams.set("intent", intent);
    url.searchParams.set("next", next);
    return redirectTo(request, `${url.pathname}${url.search}`);
  }
  const url = new URL("/join", request.url);
  url.searchParams.set("sent", "1");
  url.searchParams.set("intent", intent);
  url.searchParams.set("next", next);
  return redirectTo(request, `${url.pathname}${url.search}`);
}
