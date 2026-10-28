import type { Metadata } from "next";
import { Notice } from "@/components/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageMeta } from "@/lib/seo";
import { one } from "@/lib/text";

export const metadata: Metadata = pageMeta({
  title: "设置新密码",
  description: "为自在星球账号设置新密码。",
  path: "/auth/reset",
  noindex: true,
});

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = one(params.token) || "";
  return (
    <main className="section tight">
      <div className="wrap" style={{ maxWidth: 640 }}>
        <div className="kicker">PASSWORD</div>
        <h1 className="page-title">设置新密码</h1>
        <p className="help">设好之后用邮箱或手机号加上这组密码登录。链接十五分钟内有效。</p>
        <Notice text={one(params.notice)} />
        {token ? (
          <form className="share" action="/api/auth/password" method="post">
            <input type="hidden" name="action" value="reset_password" />
            <input type="hidden" name="token" value={token} />
            <div className="field">
              <Label htmlFor="reset-password">新密码</Label>
              <Input id="reset-password" name="password" type="password" required minLength={8} maxLength={64} autoComplete="new-password" />
            </div>
            <div className="field">
              <Label htmlFor="reset-password-2">再输入一次</Label>
              <Input id="reset-password-2" name="password_confirm" type="password" required minLength={8} maxLength={64} autoComplete="new-password" />
            </div>
            <Button type="submit">保存并进入家园</Button>
          </form>
        ) : (
          <p className="warn">缺少重置链接。请从加入页再要一次。</p>
        )}
      </div>
    </main>
  );
}
