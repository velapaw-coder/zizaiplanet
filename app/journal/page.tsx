import type { Metadata } from "next";
import { Notice } from "@/components/cards";
import { listArticles } from "@/lib/content";
import { PAGE_COPY, pageMeta } from "@/lib/seo";
import { formatWhen, one, optimizeRemoteImageUrl } from "@/lib/text";

const JOURNAL_TITLE = PAGE_COPY.journal.title;
const JOURNAL_DESCRIPTION = PAGE_COPY.journal.description;

export const metadata: Metadata = pageMeta(PAGE_COPY.journal);

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
          <h1 className="page-title">{JOURNAL_TITLE}</h1>
          <p>{JOURNAL_DESCRIPTION}</p>
          <p className="help">
            从 <a href="/explore">见自己</a> 开始，方法在 <a href="/energy">善用AI</a>。
          </p>
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
                <h2>
                  <a href={`/journal/${article.slug}`}>{article.title}</a>
                </h2>
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
