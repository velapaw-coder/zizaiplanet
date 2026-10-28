import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Notice } from "@/components/cards";
import { ReportDialog } from "@/components/report-dialog";
import { ShareBar } from "@/components/share-bar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { currentUser } from "@/lib/auth";
import { getPost, liked, listComments } from "@/lib/content";
import { siteOrigin } from "@/lib/origin";
import { clip, formatWhen, one, postStatusLabel } from "@/lib/text";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  const origin = await siteOrigin();
  if (!post || post.status !== "visible") {
    return { title: "分享未公开", robots: { index: false, follow: false } };
  }
  const title = `${post.topic} · ${post.author_name}`;
  const description = clip(post.body, 80).replace(/…$/, "");
  const image = post.image_key ? `${origin}/api/media/${post.image_key}` : `${origin}/logo.png`;
  const url = `${origin}/community/${post.id}`;
  return {
    title: post.topic,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "自在星球",
      locale: "zh_CN",
      type: "article",
      images: [{ url: image, alt: "自在星球" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await currentUser();
  if (!user) {
    return (
      <main className="section tight">
        <div className="wrap stack">
          <h1 className="page-title">同频家园</h1>
          <div className="warn">
            帖子仅登录居民可见。请先
            <a href={`/join?login=1&next=/community/${id}`}>登录</a>
            ，或从 <a href="/garden">我的家园</a> 进入。
          </div>
        </div>
      </main>
    );
  }
  const post = await getPost(id);
  if (!post || (post.status !== "visible" && post.user_id !== user.id)) notFound();
  const origin = await siteOrigin();
  const shareUrl = `${origin}/community/${post.id}`;
  const comments = post.status === "visible" ? await listComments(id) : [];
  const mine = await liked(id, user?.id);
  return (
    <main className="section tight">
      <div className="wrap" style={{ maxWidth: 820 }}>
        <a className="help" href="/community">
          ← 同频家园
        </a>
        <article className="share" style={{ marginTop: 16 }}>
          <div className="share-head">
            <div className="avatar">{post.author_name.slice(0, 1)}</div>
            <div>
              <b>{post.author_name}</b>
              <small>
                {post.topic} · {formatWhen(post.created_at)}
                {post.status !== "visible" ? ` · ${postStatusLabel(post.status)}` : ""}
              </small>
            </div>
          </div>
          {post.status !== "visible" && post.review_note ? <div className="warn">{post.review_note}</div> : null}
          <div className="body" style={{ whiteSpace: "pre-wrap" }}>
            {post.body}
          </div>
          {post.image_key ? (
            <img src={`/api/media/${post.image_key}`} alt="" style={{ width: "100%", borderRadius: 6 }} />
          ) : null}
          {post.status === "visible" ? (
            <ShareBar url={shareUrl} title={`${post.topic} · ${post.author_name}`} text={clip(post.body, 60).replace(/…$/, "")} />
          ) : null}
          <div className="share-foot">
            <form action="/api/action" method="post">
              <input type="hidden" name="action" value="like" />
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="next" value={`/community/${post.id}`} />
              <Button type="submit" variant="ghost" size="sm">
                {mine ? "已喜欢" : "喜欢"} · {post.like_count}
              </Button>
            </form>
            <ReportDialog targetType="post" targetId={post.id} next={`/community/${post.id}`} />
          </div>
        </article>
        <Notice text={one(query.notice)} />
        {post.status === "visible" ? (
          <section className="share" style={{ marginTop: 16 }}>
            <h2 className="serif" style={{ fontSize: 22, marginTop: 0 }}>
              评论
            </h2>
            {comments.length === 0 ? <p className="help">还没有评论。</p> : null}
            {comments.map((comment) => (
              <div className="comment" key={comment.id}>
                <b>{comment.author_name}</b>
                <small className="help"> {formatWhen(comment.created_at)}</small>
                <p className="help" style={{ whiteSpace: "pre-wrap" }}>
                  {comment.body}
                </p>
                <ReportDialog targetType="comment" targetId={comment.id} next={`/community/${post.id}`} />
              </div>
            ))}
            {user ? (
              <form action="/api/action" method="post">
                <input type="hidden" name="action" value="comment" />
                <input type="hidden" name="post_id" value={post.id} />
                <div className="field">
                  <Label htmlFor="comment-body">写一句</Label>
                  <Textarea id="comment-body" name="body" required maxLength={500} />
                </div>
                <Button type="submit">发送评论</Button>
              </form>
            ) : (
              <p className="help">
                <a href={`/join?login=1&next=/community/${post.id}`}>登录</a>后可以评论。
              </p>
            )}
          </section>
        ) : (
          <p className="help">这段还没有公开，别人打不开这个链接。</p>
        )}
      </div>
    </main>
  );
}
