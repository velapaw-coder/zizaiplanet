import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Notice } from "@/components/cards";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/lib/auth";
import { getArticle, isFavorite } from "@/lib/content";
import { PAGE_COPY, articleJsonLd, jsonLdScript, pageMeta } from "@/lib/seo";
import { clip, formatWhen, one, optimizeRemoteImageUrl } from "@/lib/text";

/** Remote URLs stay remote; site paths such as /images/journal/... render as figures too. */
function articleImage(block: string) {
  const collapsed = block.replace(/\s+/g, " ").trim();
  const match = /^!\[(.*?)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)\s*$/.exec(collapsed);
  if (!match) return null;
  return { alt: match[1] || "", src: match[2] };
}

function articleDescription(article: { summary: string; body: string; topic: string }) {
  return clip(article.summary || article.body || article.topic, 110).replace(/…$/, "") || article.topic;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    return pageMeta({ ...PAGE_COPY.journal, path: `/journal/${slug}`, noindex: true });
  }
  return pageMeta({
    title: article.title,
    description: articleDescription(article),
    path: `/journal/${article.slug}`,
    type: "article",
    image: article.cover,
    imageAlt: article.title,
    publishedTime: article.published_at,
  });
}

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const article = await getArticle(slug);
  if (!article) notFound();
  const user = await currentUser();
  const saved = await isFavorite(user?.id, "article", article.id);
  const description = articleDescription(article);
  return (
    <main className="section tight">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            articleJsonLd({
              title: article.title,
              description,
              path: `/journal/${article.slug}`,
              image: article.cover,
              datePublished: article.published_at,
            }),
          ),
        }}
      />
      <div className="wrap">
        <a className="help" href="/journal">
          ← 创造手记
        </a>
        <div className="topic" style={{ marginTop: 18 }}>
          {article.topic}
        </div>
        <h1 className="page-title">{article.title}</h1>
        <p className="help">{formatWhen(article.published_at)}</p>
        <Notice text={one(query.notice)} />
        <div className="cover" style={{ backgroundImage: `url('${optimizeRemoteImageUrl(article.cover, { width: 1200, quality: 70 })}')` }} />
        <div className="prose">
          {article.body.split(/\n\n+/).map((block, index) => {
            const trimmed = block.trim();
            const image = articleImage(trimmed);
            if (image) {
              return (
                <figure className="prose-figure" key={`img-${index}`}>
                  <img src={optimizeRemoteImageUrl(image.src, { width: 1200, quality: 72 })} alt={image.alt} loading="lazy" decoding="async" />
                  {image.alt ? <figcaption>{image.alt}</figcaption> : null}
                </figure>
              );
            }
            return <p key={`p-${index}`}>{trimmed}</p>;
          })}
        </div>
        <div className="tagset">
          {article.tags
            .split(",")
            .filter(Boolean)
            .map((tag) => (
              <span className="tag" key={tag}>
                # {tag}
              </span>
            ))}
        </div>
        <form action="/api/action" method="post" className="row-actions">
          <input type="hidden" name="action" value="favorite" />
          <input type="hidden" name="article_id" value={article.id} />
          <input type="hidden" name="next" value={`/journal/${article.slug}`} />
          <Button type="submit" variant={saved ? "outline" : "default"}>
            {saved ? "取消收藏" : "收藏到创造者家园"}
          </Button>
        </form>
        <div className="row-actions" style={{ marginTop: 12 }}>
          <Button asChild variant="outline">
            <a href="/journal">返回创造手记</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
