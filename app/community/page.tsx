import type { Metadata } from "next";
import { Notice } from "@/components/cards";
import { ShareBar } from "@/components/share-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { currentUser } from "@/lib/auth";
import { liked, listPosts } from "@/lib/content";
import { siteOrigin } from "@/lib/origin";
import { clip, formatWhen, one } from "@/lib/text";

export const metadata: Metadata = { title: "同频家园" };

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await currentUser();
  if (!user) {
    return (
      <main className="section tight">
        <div className="wrap stack">
          <div className="section-head left">
            <div className="kicker">同频家园</div>
            <h1 className="page-title">同频家园</h1>
            <p>创造者之间的短分享，不对站外公开浏览。</p>
          </div>
          <div className="warn">
            请先
            <a href="/join?login=1&next=/community">登录 / 成为自由创造者</a>
            ，再从「我的家园」进入同频交流。
          </div>
          <p className="help">
            <a href="/garden">回我的家园</a>
            {" · "}
            <a href="/">回首页</a>
          </p>
        </div>
      </main>
    );
  }
  const posts = await listPosts();
  const origin = await siteOrigin();
  const flags = await Promise.all(posts.map((post) => liked(post.id, user.id)));
  return (
    <main className="section tight">
      <div className="wrap stack">
        <div className="section-head left">
          <div className="kicker">同频家园</div>
          <h1 className="page-title">同频家园</h1>
          <p>创造者之间的短分享与轻量讨论。没有打卡，没有排行，也不做站内项目撮合。也可在「我的家园」发帖。</p>
        </div>
        <p className="help">
          <a href="/garden#garden-compose">← 回我的家园发帖</a>
          {" · "}
          <a href="/tea">星球茶局</a>
        </p>
        <Notice text={one(params.notice)} />
        <form className="share" action="/api/action" method="post" encType="multipart/form-data" id="compose">
          <input type="hidden" name="action" value="post" />
          <h2 className="serif" style={{ fontSize: 22, marginTop: 0 }}>
            发帖 · 留下一段
          </h2>
          <div className="field">
            <Label htmlFor="topic">话题</Label>
            <Input id="topic" name="topic" defaultValue="生活日常" maxLength={16} />
          </div>
          <div className="field">
            <Label htmlFor="body">内容</Label>
            <Textarea id="body" name="body" required placeholder="今天有什么想轻轻放下的？" />
          </div>
          <div className="field">
            <Label htmlFor="image">图片，可选</Label>
            <Input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
          </div>
          <p className="help">发出后会先看一遍。没有明显的色情、暴力、诈骗、辱骂或广告引流，就会对登录后的自由创造者公开。</p>
          <Button type="submit">发布</Button>
        </form>
        {posts.length === 0 ? <p className="help">还没有公开的分享。</p> : null}
        {posts.map((post, index) => (
          <article className="share" key={post.id}>
            <div className="share-head">
              <div className="avatar">{post.author_name.slice(0, 1)}</div>
              <div>
                <b>{post.author_name}</b>
                <small>
                  {post.topic} · {formatWhen(post.created_at)}
                </small>
              </div>
            </div>
            <div className="body" style={{ whiteSpace: "pre-wrap" }}>
              {post.body}
            </div>
            {post.image_key ? (
              <img src={`/api/media/${post.image_key}`} alt="" style={{ width: "100%", borderRadius: 6 }} />
            ) : null}
            <ShareBar
              url={`${origin}/community/${post.id}`}
              title={`${post.topic} · ${post.author_name}`}
              text={clip(post.body, 60).replace(/…$/, "")}
            />
            <div className="share-foot">
              <form action="/api/action" method="post">
                <input type="hidden" name="action" value="like" />
                <input type="hidden" name="post_id" value={post.id} />
                <input type="hidden" name="next" value="/community" />
                <Button type="submit" variant="ghost" size="sm">
                  {flags[index] ? "已喜欢" : "喜欢"} · {post.like_count}
                </Button>
              </form>
              <a href={`/community/${post.id}`}>评论 {post.comment_count} →</a>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
