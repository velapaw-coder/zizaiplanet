import type { Metadata } from "next";
import { cookies } from "next/headers";
import { HomeCardView, Notice } from "@/components/cards";
import { ExplorePlanView } from "@/components/explore-plan";
import { WelcomeCard } from "@/components/welcome-card";
import { SevenCard } from "@/components/seven-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { currentUser } from "@/lib/auth";
import { gardenLists, savedHome } from "@/lib/content";
import { db } from "@/lib/db";
import { getProfileByUserId } from "@/lib/profile";
import { buildExploreView } from "@/lib/explore";
import { EXPLORE_COOKIE } from "@/lib/http";
import { ROOMS } from "@/lib/rooms";
import { composeExplorePlan } from "@/lib/explore-plan";
import { getCommunityWecomQrUrl } from "@/lib/site-settings";
;
import { formatWhen, one, postStatusLabel, roleLabel } from "@/lib/text";

export const metadata: Metadata = { title: "我的家园" };

export default async function GardenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await currentUser();
  const jar = await cookies();
  let live = null as Awaited<ReturnType<typeof buildExploreView>> | null;
  let saved = null as Awaited<ReturnType<typeof savedHome>>;
  let lists = null as Awaited<ReturnType<typeof gardenLists>> | null;
  let partner: { direction_summary: string | null; updated_at: string } | null = null;
  let profile: Awaited<ReturnType<typeof getProfileByUserId>> | null = null;
  try {
    live = await buildExploreView(jar.get(EXPLORE_COOKIE)?.value ?? null);
    if (user) {
      saved = await savedHome(user.id);
      lists = await gardenLists(user.id);
      profile = await getProfileByUserId(user.id).catch(() => null);
      partner = await db()
        .prepare(
          `SELECT direction_summary, updated_at FROM partner_sessions
           WHERE user_id = ? AND status = 'active'
           ORDER BY updated_at DESC LIMIT 1`,
        )
        .bind(user.id)
        .first<{ direction_summary: string | null; updated_at: string }>()
        .catch(() => null);
    }
  } catch (error) {
    console.error(error);
  }
  const card = saved?.card ?? live?.homeCard ?? null;
  const qrUrl = (await getCommunityWecomQrUrl());
  const growthLit = card?.litCount ?? 0;
  const growthDirection =
    profile?.direction ||
    partner?.direction_summary?.match(/一句话方向[：:]\s*(.+)/)?.[1]?.trim() ||
    card?.directionNote ||
    "尚未写下长期方向。";
  const focusGrowth = one(params.section) === "growth";
  const plan = card && (card.portraitReady || (card.litCount ?? 0) >= 3)
    ? composeExplorePlan({ card, displayName: user?.display_name })
    : null;
  const rooms =
    card?.rooms ??
    ROOMS.map((room) => ({
      dimension: room.id,
      name: room.name,
      place: room.place,
      lit: false,
      keywords: [] as string[],
      quote: null,
      summary: "还没有原话。",
      evidence: "尚未点亮" as const,
    }));
  return (
    <main className="section tight">
      <div className="wrap stack">
        <div>
          <div className="kicker">我的家园</div>
          <h1 className="page-title">{user ? `${user.display_name}的七维探索` : "先看一看，再决定要不要留下"}</h1>
          <p className="help">
            {user ? `你是${roleLabel(user.role)}。` : "访客的探索只留在这台浏览器里。"}
            家园默认私密，没有积分，也没有排行。
          </p>
          <Notice text={one(params.notice)} />
        </div>
        {user ? (
          <WelcomeCard
            displayName={user.display_name}
            userId={user.id}
            createdAt={user.created_at}
            role={user.role}
          />
        ) : null}
        {user || card ? (
          <SevenCard
            rooms={rooms.map((room) => ({
              dimension: room.dimension,
              lit: room.lit,
              quote: room.quote,
              evidence: room.evidence,
            }))}
            litCount={rooms.filter((room) => room.lit).length}
            variant="compact"
          />
        ) : null}
        {card ? <HomeCardView card={card} /> : <div className="warn">七个维度都还是暗的。打开七维自我探索卡，从「本源」开始点亮就好。</div>}
        {plan ? <ExplorePlanView plan={plan} qrUrl={qrUrl} /> : null}
        {plan ? (
          <div className="row-actions">
            <a className="btn-primary" href="/partner">去 AI 分身认清起点</a>
            <a href="/profile">完善我的向往</a>
            <a href="#garden-compose">家园发帖</a>
            <a href="#growth">我的成长空间</a>
          </div>
        ) : null}

        {user ? (
          <section id="growth" className="share" style={focusGrowth ? { outline: "2px solid #2A9B8F", outlineOffset: 4 } : undefined}>
            <div className="kicker">我的成长空间</div>
            <h2 className="serif" style={{ fontSize: 24, marginTop: 0 }}>
              探索到哪一步了
            </h2>
            <p className="help" style={{ fontSize: 15 }}>
              七维自我探索：已点亮 <b style={{ color: "#2A9B8F" }}>{growthLit}</b> / 7
              {card?.portraitReady ? " · 画像已齐" : growthLit >= 3 ? " · 可生成临时方案" : ""}
            </p>
            <p className="prose" style={{ margin: "12px 0 0", whiteSpace: "pre-wrap" }}>
              <b style={{ color: "#164E56" }}>当前方向：</b>
              {growthDirection}
            </p>
            {partner?.updated_at ? (
              <p className="help">AI 分身最近更新：{formatWhen(partner.updated_at)}</p>
            ) : null}
            <div className="row-actions" style={{ marginTop: 14 }}>
              <a className="btn-primary" href="/explore">
                {growthLit >= 7 ? "重修某一维" : "继续认识自己"}
              </a>
              <a href="/partner">与 AI 分身继续聊</a>
              {partner?.direction_summary ? (
                <a href="/api/partner/plan?format=pdf">下载方向纪要 PDF</a>
              ) : null}
              <a href="/profile">{profile?.direction ? "编辑向往方向" : "写入我的向往"}</a>
              <a href="#garden-compose">家园发帖</a>
              <a href="/tea">星球茶局</a>
            </div>
            <ol className="help" style={{ lineHeight: 2, paddingLeft: 18, marginTop: 16 }}>
              <li>
                <a href="/explore">认识自己</a>
                {growthLit > 0 ? " ✓" : ""}
              </li>
              <li>
                <a href="/partner">AI 分身</a>
                {partner ? " ✓" : ""}
              </li>
              <li>
                <a href="/profile">我的向往</a>
                {profile?.published ? " · 已公开" : profile ? " · 草稿" : ""}
              </li>
              <li>
                <a href="#garden-compose">家园交流发帖</a>
              </li>
              <li>
                <a href="/tea">星球茶局</a>
              </li>
            </ol>
          </section>
        ) : null}

        <div className="row-actions">
          <a className="btn-primary" href="/explore">
            打开七维自我探索卡
          </a>
          {user && saved ? (
            <form action="/api/action" method="post">
              <input type="hidden" name="action" value="resume" />
              <Button type="submit" variant="outline">
                在这台设备上继续已保存的探索
              </Button>
            </form>
          ) : null}
          {user && live?.homeCard && live.litCount > 0 ? (
            <form action="/api/action" method="post">
              <input type="hidden" name="action" value="save_home" />
              <Button type="submit">{saved ? "用当前探索覆盖家园卡" : "保存当前探索"}</Button>
            </form>
          ) : null}
          {user ? <a href="/garden/settings">家园后台</a> : <a href="/join?login=1&next=/garden">登录后保存</a>}
        </div>
        <div className="dim-grid room-grid" aria-label="七维进度">
          {rooms.map((room) => {
            const def = ROOMS.find((item) => item.id === room.dimension);
            return (
              <form action="/api/explore" method="post" className="room-tile-form" key={room.dimension}>
                <input type="hidden" name="action" value="enter" />
                <input type="hidden" name="dimension" value={room.dimension} />
                <button type="submit" className={room.lit ? "room-tile lit" : "room-tile"} aria-label={`${room.lit ? "重修" : "进入"}「${room.name}」`}>
                  <div className="topic">{def?.icon} {room.name}</div>
                  <h3>{def?.guide ?? room.place}</h3>
                  <p className="help">{room.lit ? room.quote : "点这里进入，写下两句原话即可点亮。"}</p>
                  <p className="help">{room.evidence}{room.lit ? " · 已点亮" : " · 待点亮"}</p>
                </button>
              </form>
            );
          })}
        </div>
        {user ? (
          <>
            <section className="share" aria-label="居民内部活动">
              <div className="kicker">居民内部</div>
              <h2 className="serif" style={{ fontSize: 24, marginTop: 0 }}>
                同频家园 · 星球茶局
              </h2>
              <p className="help">仅登录居民可见。短分享在家园发帖；茶局在这里报名或提议。不做站外公开栏目。</p>
              <div className="two" style={{ gap: 16, marginTop: 12 }}>
                <a className="share" href="#garden-compose" style={{ display: "block", textDecoration: "none", margin: 0 }}>
                  <div className="kicker">同频家园</div>
                  <h3 className="serif" style={{ fontSize: 18, margin: "6px 0 8px" }}>发帖交流</h3>
                  <p className="help" style={{ margin: 0 }}>写下今天想分享的一段 →</p>
                </a>
                <a className="share" href="/tea" style={{ display: "block", textDecoration: "none", margin: 0 }}>
                  <div className="kicker">星球茶局</div>
                  <h3 className="serif" style={{ fontSize: 18, margin: "6px 0 8px" }}>轻量相聚</h3>
                  <p className="help" style={{ margin: 0 }}>看场次、报名或提议一场茶局 →</p>
                </a>
              </div>
              <p className="help" style={{ marginTop: 12 }}>
                <a href="/community">打开同频家园看帖 →</a>
              </p>
            </section>
            <form className="share" action="/api/action" method="post" encType="multipart/form-data" id="garden-compose">
              <input type="hidden" name="action" value="post" />
              <input type="hidden" name="next" value="/garden" />
              <div className="row-actions" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <h2 className="serif" style={{ fontSize: 24, margin: 0 }}>
                  发帖到同频家园
                </h2>
                <a href="/community#compose">去同频家园看帖 →</a>
              </div>
              <p className="help">居民内部短分享。发出后会先审核；通过后其他登录居民可见。没有打卡，没有排行。</p>
              <div className="field">
                <Label htmlFor="garden-topic">话题</Label>
                <Input id="garden-topic" name="topic" defaultValue="生活日常" maxLength={16} />
              </div>
              <div className="field">
                <Label htmlFor="garden-body">内容</Label>
                <Textarea id="garden-body" name="body" required placeholder="今天有什么想轻轻放下的？" />
              </div>
              <div className="field">
                <Label htmlFor="garden-image">图片，可选</Label>
                <Input id="garden-image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
              </div>
              <p className="help">发出后会先看一遍。没有明显的色情、暴力、诈骗、辱骂或广告引流，就会公开。</p>
              <Button type="submit">发布</Button>
            </form>
            <div className="two">
              <section className="share">
                <h2 className="serif" style={{ fontSize: 24 }}>
                  收藏与领取
                </h2>
                {lists && (lists.articles.length || lists.resources.length) ? (
                  <div className="stack">
                    {lists.articles.map((item) => (
                      <a key={item.slug} href={`/journal/${item.slug}`}>
                        星球生活志 · {item.title}
                      </a>
                    ))}
                    {lists.resources.map((item) => (
                      <a key={item.slug} href={`/energy/${item.slug}`}>
                        能量站 · {item.title}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="help">还没有收藏的文章，也没有领取的提示词。</p>
                )}
                <h2 className="serif" style={{ fontSize: 24, marginTop: 28 }}>
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
                  <p className="help">还没有分享。社区欢迎一段很短的话。</p>
                )}
              </section>
              <section className="share">
                <h2 className="serif" style={{ fontSize: 24 }}>
                  账号
                </h2>
                <p className="help">
                  <a href="/garden/settings">在家园后台改用户名和密码</a>
                </p>
                <p className="help">邮箱和手机号只用于登录，不会出现在社区里。</p>
                <form action="/api/action" method="post">
                  <input type="hidden" name="action" value="logout" />
                  <Button type="submit" variant="ghost">
                    退出登录
                  </Button>
                </form>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
