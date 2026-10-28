import type { Metadata } from "next";
import { Notice } from "@/components/cards";
import { listArticles } from "@/lib/content";
import { formatWhen, one, optimizeRemoteImageUrl } from "@/lib/text";

const JOURNAL_TITLE = "星球生活志";
const JOURNAL_DESCRIPTION =
  "见自己、善用AI、创造自由生活。文章由编辑发布，可收藏进家园。";

export const metadata: Metadata = {
  title: JOURNAL_TITLE,
  description: JOURNAL_DESCRIPTION,
  openGraph: {
    title: `${JOURNAL_TITLE} · 自在星球`,
    description: JOURNAL_DESCRIPTION,
    url: "/journal",
    type: "website",
    locale: "zh_CN",
    siteName: "自在星球",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "自在星球" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${JOURNAL_TITLE} · 自在星球`,
    description: JOURNAL_DESCRIPTION,
    images: ["/og-default.png"],
  },
};

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const articles = await listArticles();
  return (
    <main className="section tight content-area">
      <div className="wrap">
        <div className="section-head left">
          <div className="kicker">PLANET JOURNAL</div>
          <h1 className="page-title">星球生活志</h1>
          <p>见自己、善用AI、创造自由生活。文章由编辑发布，可收藏进家园。</p>
        </div>
        <Notice text={one(params.notice)} />
        {articles.length === 0 ? <div className="warn">还没有文章。</div> : null}
        <div className="content-grid">
          {articles.map((article) => (
            <article className="article" key={article.id}>
              <a
                className="photo"
                href={`/journal/${article.slug}`}
                style={{ backgroundImage: `url('${optimizeRemoteImageUrl(article.cover, { width: 560, quality: 60 })}')` }}
                aria-label={`阅读：${article.title}`}
              />
              <div className="article-body">
                <div className="topic">{article.topic}</div>
                <h3>
                  <a href={`/journal/${article.slug}`}>{article.title}</a>
                </h3>
                <p>{article.summary}</p>
                <p className="help">{formatWhen(article.published_at)}</p>
                <a className="read" href={`/journal/${article.slug}`}>
                  阅读 ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
