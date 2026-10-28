import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  const desc = profile.direction || profile.expertise || "自在星球 · 我的向往";
  return {
    title: `${profile.displayName}`,
    description: desc.slice(0, 120),
  };
}

function initialOf(name: string) {
  const t = name.trim();
  return t ? t.slice(0, 1) : "星";
}

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);
  if (!profile) notFound();

  const tags = [profile.expertise, profile.direction]
    .filter(Boolean)
    .flatMap((text) =>
      String(text)
        .split(/[；;·|/、，,\n]+/)
        .map((s) => s.replace(/^(擅长|向往|想成为|本源)[：:]\s*/, "").trim())
        .filter((s) => s.length >= 2 && s.length <= 18),
    )
    .slice(0, 5);

  return (
    <main className="pp-page">
      <div className="pp-bg" aria-hidden />
      <div className="wrap pp-wrap">
        <article className="pp-card">
          <header className="pp-hero">
            <div className="pp-orb" aria-hidden>
              <span>{initialOf(profile.displayName)}</span>
            </div>
            <div className="pp-hero-text">
              <p className="pp-kicker">自在星球 · 我的向往</p>
              <h1 className="pp-name">{profile.displayName}</h1>
              {profile.direction ? <p className="pp-tagline">{profile.direction}</p> : null}
              {tags.length ? (
                <div className="pp-tags">
                  {tags.map((tag) => (
                    <span key={tag} className="pp-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </header>

          <div className="pp-owner-actions" style={{ marginBottom: 18 }}>
            <a className="btn-primary" href={`/api/profile/pdf?slug=${encodeURIComponent(profile.slug)}&format=pdf`}>
              下载向往 PDF
            </a>
          </div>

          <div className="pp-grid">
            {profile.expertise ? (
              <section className="pp-block pp-block-expertise">
                <div className="pp-block-icon" aria-hidden>
                  ✦
                </div>
                <h2>专长</h2>
                <p>{profile.expertise}</p>
              </section>
            ) : null}

            {profile.experience ? (
              <section className="pp-block pp-block-experience">
                <div className="pp-block-icon" aria-hidden>
                  ◈
                </div>
                <h2>真实经历</h2>
                <p>{profile.experience}</p>
              </section>
            ) : null}

            {profile.direction ? (
              <section className="pp-block pp-block-direction">
                <div className="pp-block-icon" aria-hidden>
                  ◎
                </div>
                <h2>想成为 / 想去往</h2>
                <p>{profile.direction}</p>
              </section>
            ) : null}

            {profile.cases ? (
              <section className="pp-block pp-block-cases">
                <div className="pp-block-icon" aria-hidden>
                  ✧
                </div>
                <h2>案例 / 正在验证</h2>
                <p>{profile.cases}</p>
              </section>
            ) : null}
          </div>

          {!profile.direction && !profile.expertise && !profile.experience ? (
            <p className="pp-empty">这位居民还在完善「我的向往」。</p>
          ) : null}

          <footer className="pp-foot">
            <p>公开的向往空间 · 不含七维探索私密原文 · 更新于 {formatWhen(profile.updatedAt)}</p>
            <div className="pp-foot-links">
              <a className="btn-primary" href={`/api/profile/pdf?slug=${encodeURIComponent(profile.slug)}&format=pdf`}>
                下载向往 PDF
              </a>
              <a href="/join">成为星球居民</a>
              <a href="/explore">我也开始认识自己</a>
              <a href="/">了解自在星球</a>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}
