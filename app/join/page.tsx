import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import { Notice } from "@/components/cards";
import { Turnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAGE_COPY, pageMeta } from "@/lib/seo";
import { safeNext, one } from "@/lib/text";

export const metadata: Metadata = pageMeta(PAGE_COPY.join);

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeNext(one(params.next), "/garden");
  const loggingIn = one(params.login) === "1";
  const siteKey = env.TURNSTILE_SITE_KEY;
  const registerHref = next === "/garden" ? "/join" : `/join?next=${encodeURIComponent(next)}`;
  const loginHref = `/join?login=1&next=${encodeURIComponent(next)}`;

  return (
    <main className="section tight">
      <div className="wrap stack" style={{ maxWidth: 640 }}>
        <div>
          <div className="kicker">JOIN THE PLANET</div>
          <h1 className="page-title">{loggingIn ? "已有账号登录" : "成为自由创造者"}</h1>
          <p className="help">
            {loggingIn
              ? "用注册时的邮箱和密码回来。"
              : "先填用户名和手机号，再用邮箱和自己设的密码加入。注册完成后，身份是自由创造者。AI创造自由：见自己，明其道，善用AI。"}
          </p>
          <Notice text={one(params.notice)} />
        </div>

        {loggingIn ? (
          <form className="share" action="/api/auth/password" method="post">
            <input type="hidden" name="action" value="login" />
            <input type="hidden" name="next" value={next} />
            <div className="field">
              <Label htmlFor="login-email">邮箱</Label>
              <Input id="login-email" name="account" type="email" required autoComplete="email" placeholder="you@example.com" />
            </div>
            <div className="field">
              <Label htmlFor="login-password">密码</Label>
              <Input id="login-password" name="password" type="password" required autoComplete="current-password" />
            </div>
            <Button type="submit">登录</Button>
            <p className="help">
              <a href={registerHref}>去用邮箱注册</a>
            </p>
          </form>
        ) : (
          <form className="share" action="/api/auth/password" method="post">
            <input type="hidden" name="action" value="register_email" />
            <input type="hidden" name="next" value={next} />
            <h2 className="serif" style={{ fontSize: 22, marginTop: 0 }}>
              用邮箱注册
            </h2>
            <div className="field">
              <Label htmlFor="email-name">用户名</Label>
              <Input id="email-name" name="display_name" required minLength={2} maxLength={16} autoComplete="nickname" placeholder="例如 林间" />
            </div>
            <div className="field">
              <Label htmlFor="phone">手机号</Label>
              <Input id="phone" name="phone" type="tel" inputMode="numeric" required autoComplete="tel" placeholder="11 位中国大陆手机号" />
            </div>
            <div className="field">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
            </div>
            <div className="field">
              <Label htmlFor="email-password">密码</Label>
              <Input id="email-password" name="password" type="password" required minLength={8} maxLength={64} autoComplete="new-password" />
            </div>
            <div className="field">
              <Label htmlFor="email-password-2">再输入一次密码</Label>
              <Input id="email-password-2" name="password_confirm" type="password" required minLength={8} maxLength={64} autoComplete="new-password" />
            </div>
            <Turnstile siteKey={siteKey} />
            <Button type="submit">成为自由创造者</Button>
            <p className="help">
              <a href={loginHref}>已有账号登录</a>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
