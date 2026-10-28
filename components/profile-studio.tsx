"use client";

import { useMemo, useState } from "react";

export type ProfileStudioData = {
  displayName: string;
  slug: string;
  experience: string;
  expertise: string;
  direction: string;
  cases: string;
  published: boolean;
  updatedAt: string;
  publicUrl: string;
  notice?: string;
  autoHint: string;
  hasSource: boolean;
};

function initialOf(name: string) {
  const t = name.trim();
  return t ? t.slice(0, 1) : "星";
}

function deriveTags(expertise: string, direction: string) {
  return [expertise, direction]
    .filter(Boolean)
    .flatMap((text) =>
      String(text)
        .split(/[；;·|/、，,\n]+/)
        .map((s) => s.replace(/^(擅长|向往|想成为|本源)[：:]\s*/, "").trim())
        .filter((s) => s.length >= 2 && s.length <= 18),
    )
    .slice(0, 5);
}

type FieldKey = "experience" | "expertise" | "direction" | "cases";

const BLOCKS: Array<{
  key: FieldKey;
  title: string;
  icon: string;
  className: string;
  placeholder: string;
  rows: number;
}> = [
  {
    key: "expertise",
    title: "专长",
    icon: "✦",
    className: "pp-block-expertise",
    placeholder: "你真正擅长、别人会找你帮忙的事（点此修改）",
    rows: 4,
  },
  {
    key: "experience",
    title: "真实经历",
    icon: "◈",
    className: "pp-block-experience",
    placeholder: "例如十年制造业供应链…（点此修改）",
    rows: 5,
  },
  {
    key: "direction",
    title: "想成为 / 想去往",
    icon: "◎",
    className: "pp-block-direction",
    placeholder: "你想成为的样子、想去往的方向（点此修改）",
    rows: 4,
  },
  {
    key: "cases",
    title: "案例 / 正在验证",
    icon: "✧",
    className: "pp-block-cases",
    placeholder: "可写 1～3 个已完成的小事或正在验证的方向（点此修改）",
    rows: 4,
  },
];

export function ProfileStudio({ data }: { data: ProfileStudioData }) {
  const [slug, setSlug] = useState(data.slug);
  const [experience, setExperience] = useState(data.experience);
  const [expertise, setExpertise] = useState(data.expertise);
  const [direction, setDirection] = useState(data.direction);
  const [cases, setCases] = useState(data.cases);
  const [published, setPublished] = useState(data.published);
  const [editing, setEditing] = useState<FieldKey | "slug" | null>(null);
  const [copied, setCopied] = useState(false);

  const values: Record<FieldKey, string> = {
    experience,
    expertise,
    direction,
    cases,
  };
  const setters: Record<FieldKey, (v: string) => void> = {
    experience: setExperience,
    expertise: setExpertise,
    direction: setDirection,
    cases: setCases,
  };

  const tags = useMemo(() => deriveTags(expertise, direction), [expertise, direction]);
  const sharePath = `/u/${slug || data.slug}`;
  const shareUrl = data.publicUrl.replace(/\/u\/[^/]+$/, sharePath);

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const empty = !direction && !expertise && !experience;

  return (
    <main className="pp-page pp-owner">
      <div className="pp-bg" aria-hidden />
      <div className="wrap pp-wrap">
        <div className="pp-owner-bar">
          <div className="pp-owner-bar-text">
            <div className="kicker">我的向往 · 可分享</div>
            <p className="help" style={{ margin: "4px 0 0" }}>
              {data.autoHint} 每个框可直接点开修改，保存后生效。
            </p>
            {data.notice ? <div className="success" style={{ marginTop: 10 }}>{data.notice}</div> : null}
          </div>
          <div className="pp-owner-actions">
            <form action="/api/action" method="post">
              <input type="hidden" name="action" value="regenerate_profile" />
              <input type="hidden" name="next" value="/profile" />
              <button type="submit" className="profile-regen-btn" disabled={!data.hasSource}>
                重新生成
              </button>
            </form>
            <a className="btn-primary" href="/api/profile/pdf?format=pdf">
              下载向往 PDF
            </a>
            <button type="button" className="profile-regen-btn" onClick={copyShare}>
              {copied ? "已复制链接" : "复制分享链接"}
            </button>
            {published ? (
              <a className="profile-regen-btn" href={sharePath} target="_blank" rel="noreferrer">
                打开公开页 ↗
              </a>
            ) : (
              <span className="help">勾选公开并保存后即可分享</span>
            )}
          </div>
        </div>

        <form className="pp-card pp-owner-card" action="/api/action" method="post">
          <input type="hidden" name="action" value="save_profile" />
          <input type="hidden" name="next" value="/profile" />
          <input type="hidden" name="experience" value={experience} />
          <input type="hidden" name="expertise" value={expertise} />
          <input type="hidden" name="direction" value={direction} />
          <input type="hidden" name="cases" value={cases} />
          <input type="hidden" name="slug" value={slug} />

          <header className="pp-hero">
            <div className="pp-orb" aria-hidden>
              <span>{initialOf(data.displayName)}</span>
            </div>
            <div className="pp-hero-text">
              <p className="pp-kicker">自在星球 · 我的向往</p>
              <h1 className="pp-name">{data.displayName}</h1>
              {direction ? <p className="pp-tagline">{direction}</p> : (
                <p className="pp-tagline pp-tagline-muted">完成探索或 AI 分身后，你想成为 / 想去往的样子会出现在这里</p>
              )}
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

          <div className="pp-grid">
            {BLOCKS.map((block) => {
              const value = values[block.key];
              const isEditing = editing === block.key;
              return (
                <section
                  key={block.key}
                  className={`pp-block ${block.className} pp-block-editable${isEditing ? " is-editing" : ""}`}
                  onClick={() => setEditing(block.key)}
                >
                  <div className="pp-block-head">
                    <div className="pp-block-icon" aria-hidden>
                      {block.icon}
                    </div>
                    <span className="pp-edit-hint">{isEditing ? "编辑中" : "点击修改"}</span>
                  </div>
                  <h2>{block.title}</h2>
                  {isEditing ? (
                    <textarea
                      className="pp-inline-edit"
                      value={value}
                      rows={block.rows}
                      placeholder={block.placeholder}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setters[block.key](e.target.value)}
                      onBlur={() => setEditing(null)}
                    />
                  ) : value ? (
                    <p>{value}</p>
                  ) : (
                    <p className="pp-placeholder">{block.placeholder}</p>
                  )}
                </section>
              );
            })}
          </div>

          {empty ? (
            <p className="pp-empty">
              还没有内容。可先去「认识自己」或「我的 AI 分身」，再点上方「重新生成」；也可直接在框里写。
            </p>
          ) : null}

          <div className="pp-owner-meta">
            <label className="pp-slug-field">
              <span>分享路径</span>
              <div className="pp-slug-row">
                <span className="pp-slug-prefix">/u/</span>
                <input
                  name="slug_display"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  onFocus={() => setEditing("slug")}
                  onBlur={() => setEditing(null)}
                  pattern="[a-z0-9][a-z0-9-]{1,31}"
                  required
                  aria-label="分享路径"
                />
              </div>
              <small>{shareUrl}</small>
            </label>
            <label className="pp-publish-toggle">
              <input
                type="checkbox"
                name="published"
                value="1"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              公开「我的向往」（勾选后任何人可通过链接查看）
            </label>
          </div>

          <footer className="pp-foot pp-owner-foot">
            <p>不含七维探索私密原文 · 上次更新 {data.updatedAt || "—"}</p>
            <div className="pp-owner-foot-actions">
              <button type="submit" className="btn-primary">
                保存向往
              </button>
              <a className="btn-light" href="/api/profile/pdf?format=pdf" style={{ color: "#164E56", borderColor: "#D4E4E8", background: "#fff" }}>
                下载 PDF
              </a>
              <a href="/partner">回 AI 分身</a>
              <a href="/community">去同频家园</a>
              <a href="/explore">认识自己</a>
            </div>
          </footer>
        </form>
      </div>
    </main>
  );
}
