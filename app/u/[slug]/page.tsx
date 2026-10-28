import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AspirationDocument } from "@/components/aspiration-document";
import { aspirationHasContent, aspirationShareText } from "@/lib/aspiration";
import { getPublicProfileBySlug } from "@/lib/profile";
import { formatWhen } from "@/lib/text";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug).catch(() => null);
  if (!profile) return { title: "我的向往" };
  const desc = aspirationShareText(profile.aspiration) || profile.direction || profile.expertise || "自在星球 · 我的向往";
  return {
    title: `${profile.displayName}`,
    description: desc.slice(0, 120),
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);
  if (!profile) notFound();

  const ready = aspirationHasContent(profile.aspiration);

  return (
    <main className="pp-page">
      <div className="pp-bg" aria-hidden />
      <div className="wrap pp-wrap">
        <article className="pp-card">
          <AspirationDocument name={profile.displayName} page={profile.aspiration} />

          {!ready ? <p className="pp-empty">这位创造者还在完善「我的向往」。</p> : null}

          <footer className="pp-foot">
            <p>公开的向往空间 · 不含七维探索私密原文 · 更新于 {formatWhen(profile.updatedAt)}</p>
            <div className="pp-foot-links">
              <a className="btn-primary" href={`/api/profile/pdf?slug=${encodeURIComponent(profile.slug)}&format=pdf`}>
                下载向往 PDF
              </a>
              <a href="/join">成为自由创造者</a>
              <a href="/explore">我也开始认识自己</a>
              <a href="/">了解自在星球</a>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}
