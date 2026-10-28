import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Notice } from "@/components/cards";
import { WelcomeCard } from "@/components/welcome-card";
import { SevenCard } from "@/components/seven-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { gardenLists, savedHome } from "@/lib/content";
import { buildExploreView } from "@/lib/explore";
import { EXPLORE_COOKIE } from "@/lib/http";
import { ROOMS } from "@/lib/rooms";
import { formatWhen, one, postStatusLabel, roleLabel } from "@/lib/text";

export const metadata: Metadata = { title: "家园后台" };

export default async function GardenSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await currentUser();
  if (!user) {
    return (
      <main className="section tight">
        <div className="wrap">
          <h1 className="page-title">家园后台</h1>
          <p className="help">这是你自己的家园，不是全站运营。请先登录。</p>
          <a className="btn-primary" href="/join?login=1&next=/garden/settings">
            去登录
          </a>
        </div>
      </main>
    );
  }
  const jar = await cookies();
  const [saved, lists, live, passwordRow] = await Promise.all([
    savedHome(user.id).catch(() => null),
    gardenLists(user.id).catch(() => null),
    buildExploreView(jar.get(EXPLORE_COOKIE)?.value ?? null).catch(() => null),
    db()
      .prepare("SELECT password_hash FROM users WHERE id = ?")
      .bind(user.id)
      .first<{ password_hash: string | null }>()
      .catch(() => null),
  ]);
  const rooms = saved?.card?.rooms ?? live?.homeCard?.rooms ?? null;
  return (
    <main className="section tight">
      <div className="wrap stack">
        <div>
          <div className="kicker">MY PLACE</div>
          <h1 className="page-title">家园后台</h1>
          <p className="help">
            {user.display_name}，你是{roleLabel(user.role)}。这里只管理你自己的名字、密码、七维探索和个人帖子。
          </p>
          <Notice text={one(params.notice)} />
          <p className="help">
            <a href="/garden">回到家园卡片</a>
          </p>
        </div>
        <WelcomeCard
          displayName={user.display_name}
          userId={user.id}
          createdAt={user.created_at}
          role={user.role}
        />
        <div className="two">
          <section className="share">
            <h2 className="serif" style={{ fontSize: 24, marginTop: 0 }}>
              用户名
            </h2>
            <form action="/api/action" method="post">
              <input type="hidden" name="action" value="rename" />
              <input type="hidden" name="next" value="/garden/settings" />
              <div className="field">
                <Label htmlFor="display_name">用户名</Label>
                <Input id="display_name" name="display_name" defaultValue={user.display_name} required minLength={2} maxLength={16} />
              </div>
              <Button type="submit" variant="outline">
                更新用户名
              </Button>
            </form>
            <p className="help">登录邮箱：{user.email || "还没有绑定邮箱"}</p>
            <p className="help">手机号：{user.phone || "还没有绑定手机号"}</p>
            {user.phone ? null : (
              <form action="/api/auth/password" method="post">
                <input type="hidden" name="action" value="bind_phone" />
                <div className="field">
                  <Label htmlFor="bind-phone">绑定手机号</Label>
                  <Input id="bind-phone" name="phone" type="tel" required placeholder="11 位中国大陆手机号" />
                </div>
                <Button type="submit" variant="outline">
                  绑定
                </Button>
              </form>
            )}
          </section>
          <section className="share">
            <h2 className="serif" style={{ fontSize: 24, marginTop: 0 }}>
              密码
            </h2>
            <form action="/api/auth/password" method="post">
              <input type="hidden" name="action" value="change_password" />
              {passwordRow?.password_hash ? (
                <div className="field">
                  <Label htmlFor="current-password">当前密码</Label>
                  <Input id="current-password" name="current_password" type="password" autoComplete="current-password" required />
                </div>
              ) : (
                <p className="help">你还是用登录链接进来的，可以直接设一组密码。</p>
              )}
              <div className="field">
                <Label htmlFor="new-password">新密码</Label>
                <Input id="new-password" name="password" type="password" required minLength={8} maxLength={64} autoComplete="new-password" />
              </div>
              <div className="field">
                <Label htmlFor="new-password-2">再输入一次</Label>
                <Input id="new-password-2" name="password_confirm" type="password" required minLength={8} maxLength={64} autoComplete="new-password" />
              </div>
              <Button type="submit">更新密码</Button>
            </form>
          </section>
        </div>
        <section className="stack">
          <h2 className="serif" style={{ fontSize: 24, margin: 0 }}>
            七维自我探索卡
          </h2>
          <SevenCard
            rooms={(rooms ?? ROOMS.map((room) => ({ dimension: room.id, name: room.name, place: room.place, lit: false, evidence: "尚未点亮" }))).map(
              (room) => ({
                dimension: room.dimension,
                lit: room.lit,
                evidence: room.evidence,
              }),
            )}
            litCount={(rooms ?? []).filter((room) => room.lit).length}
            variant="compact"
          />
          <div className="dim-grid room-grid" aria-label="七维进度">
            {(rooms ?? ROOMS.map((room) => ({ dimension: room.id, name: room.name, place: room.place, lit: false, evidence: "尚未点亮" }))).map(
              (room) => {
                const def = ROOMS.find((item) => item.id === room.dimension);
                return (
                  <form action="/api/explore" method="post" className="room-tile-form" key={room.dimension}>
                    <input type="hidden" name="action" value="enter" />
                    <input type="hidden" name="dimension" value={room.dimension} />
                    <button type="submit" className={room.lit ? "room-tile lit" : "room-tile"} aria-label={`${room.lit ? "重修" : "进入"}「${room.name}」`}>
                      <div className="topic">{def?.icon} {room.name}</div>
                      <h3>{def?.guide ?? room.place}</h3>
                      <p className="help">{room.lit ? "已点亮" : "还没点亮"} · {room.evidence}</p>
                    </button>
                  </form>
                );
              },
            )}
          </div>
        </section>
        <section className="share">
          <h2 className="serif" style={{ fontSize: 24, marginTop: 0 }}>
            我发布的
          </h2>
          {lists?.posts.length ? (
            lists.posts.map((post) => (
              <p className="help" key={post.id}>
                <a href={`/community/${post.id}`}>{post.topic}</a> · {formatWhen(post.created_at)} · {postStatusLabel(post.status)}
                <br />
                {post.body.slice(0, 80)}
                {post.review_note ? (
                  <>
                    <br />
                    {post.review_note}
                  </>
                ) : null}
              </p>
            ))
          ) : (
            <p className="help">还没有分享。</p>
          )}
        </section>
      </div>
    </main>
  );
}
