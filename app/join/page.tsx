import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import { Notice } from "@/components/cards";
import { Turnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentUser } from "@/lib/auth";
import { PAGE_COPY, pageMeta } from "@/lib/seo";
import { roleLabel, safeNext, one } from "@/lib/text";

export const metadata: Metadata = pageMeta(PAGE_COPY.join);

const fieldLabelClass = "text-[15px] font-semibold text-[#164E56]";
const fieldInputClass = "h-12 text-base";

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
  const user = await currentUser();
  const continueLabel = next === "/garden" ? "进入创造者家园" : "继续刚才的页面";

  return (
    <main className="section tight auth-page">
      <div className="wrap auth-shell">
        <header className="auth-hero">
          <div className="kicker">JOIN THE PLANET</div>
          <h1 className="page-title">
            {user ? "你已在星球上" : loggingIn ? "欢迎回来" : "成为自由创造者"}
          </h1>
          <p className="auth-lead">
            {user
              ? `你好，${user.display_name}。以${roleLabel(user.role)}身份继续创造，或换个账号再进。`
              : loggingIn
                ? "用注册时的邮箱和密码回来。还没有账号，就去邮箱注册。"
                : "先留用户名和手机号，再用邮箱设好密码加入。注册后身份是自由创造者。"}
          </p>
          <Notice text={one(params.notice)} />
        </header>

        {user ? (
          <section className="auth-card auth-signed-in" aria-label="已登录">
            <div className="auth-signed-badge">已登录</div>
            <div className="auth-signed-name">{user.display_name}</div>
            <p className="auth-signed-meta">{roleLabel(user.role)} · 自在星球</p>
            <div className="auth-actions">
              <a className="btn-primary auth-cta" href={next}>
                {continueLabel}
              </a>
              {next !== "/garden" ? (
                <a className="auth-secondary-btn" href="/garden">
                  去创造者家园
                </a>
              ) : (
                <a className="auth-secondary-btn" href="/explore">
                  去见自己
                </a>
              )}
            </div>
            <form className="auth-logout" action="/api/action" method="post">
              <input type="hidden" name="action" value="logout" />
              <button className="auth-text-btn" type="submit">
                退出登录，换账号进入
              </button>
            </form>
          </section>
        ) : (
          <>
            <nav className="auth-tabs" aria-label="登录或注册">
              <a
                className={loggingIn ? "auth-tab is-active" : "auth-tab"}
                href={loginHref}
                aria-current={loggingIn ? "page" : undefined}
              >
                登录
              </a>
              <a
                className={!loggingIn ? "auth-tab is-active" : "auth-tab"}
                href={registerHref}
                aria-current={!loggingIn ? "page" : undefined}
              >
                邮箱注册
              </a>
            </nav>

            {loggingIn ? (
              <form className="auth-card" action="/api/auth/password" method="post">
                <input type="hidden" name="action" value="login" />
                <input type="hidden" name="next" value={next} />
                <div className="auth-card-head">
                  <h2>邮箱登录</h2>
                  <p>输入邮箱和密码，回到你的创造者家园。</p>
                </div>
                <div className="field">
                  <Label htmlFor="login-email" className={fieldLabelClass}>
                    邮箱
                  </Label>
                  <Input
                    id="login-email"
                    name="account"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={fieldInputClass}
                  />
                </div>
                <div className="field">
                  <Label htmlFor="login-password" className={fieldLabelClass}>
                    密码
                  </Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className={fieldInputClass}
                  />
                </div>
                <Button type="submit" className="auth-submit">
                  登录
                </Button>
                <div className="auth-foot">
                  <p>还没有账号？</p>
                  <a className="auth-foot-link" href={registerHref}>
                    去邮箱注册 →
                  </a>
                </div>
              </form>
            ) : (
              <form className="auth-card" action="/api/auth/password" method="post">
                <input type="hidden" name="action" value="register_email" />
                <input type="hidden" name="next" value={next} />
                <div className="auth-card-head">
                  <h2>用邮箱注册</h2>
                  <p>加入后即可探索七维、做 AI 分身、写下我的向往。</p>
                </div>
                <div className="field">
                  <Label htmlFor="email-name" className={fieldLabelClass}>
                    用户名
                  </Label>
                  <Input
                    id="email-name"
                    name="display_name"
                    required
                    minLength={2}
                    maxLength={16}
                    autoComplete="nickname"
                    placeholder="例如 林间"
                    className={fieldInputClass}
                  />
                </div>
                <div className="field">
                  <Label htmlFor="phone" className={fieldLabelClass}>
                    手机号
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    required
                    autoComplete="tel"
                    placeholder="11 位中国大陆手机号"
                    className={fieldInputClass}
                  />
                </div>
                <div className="field">
                  <Label htmlFor="email" className={fieldLabelClass}>
                    邮箱
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={fieldInputClass}
                  />
                </div>
                <div className="field">
                  <Label htmlFor="email-password" className={fieldLabelClass}>
                    密码
                  </Label>
                  <Input
                    id="email-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={64}
                    autoComplete="new-password"
                    className={fieldInputClass}
                  />
                </div>
                <div className="field">
                  <Label htmlFor="email-password-2" className={fieldLabelClass}>
                    再输入一次密码
                  </Label>
                  <Input
                    id="email-password-2"
                    name="password_confirm"
                    type="password"
                    required
                    minLength={8}
                    maxLength={64}
                    autoComplete="new-password"
                    className={fieldInputClass}
                  />
                </div>
                <Turnstile siteKey={siteKey} />
                <Button type="submit" className="auth-submit">
                  成为自由创造者
                </Button>
                <div className="auth-foot">
                  <p>已经有账号了？</p>
                  <a className="auth-foot-link" href={loginHref}>
                    去登录 →
                  </a>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
