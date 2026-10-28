"use client";

import { useState } from "react";
import {
  ASPIRATION_SECTIONS,
  aspirationHasContent,
  type AspirationPage,
  type PracticeStep,
  type ResonanceGroup,
  type StoryNode,
} from "@/lib/aspiration";

export type ProfileStudioData = {
  displayName: string;
  slug: string;
  aspiration: AspirationPage;
  published: boolean;
  updatedAt: string;
  publicUrl: string;
  notice?: string;
  autoHint: string;
  hasSource: boolean;
};

function initialOf(name: string) {
  const text = name.trim();
  return text ? text.slice(0, 1) : "星";
}

function pad(list: string[], size: number) {
  const next = list.slice(0, size);
  while (next.length < size) next.push("");
  return next;
}

const blankNode = (): StoryNode => ({ when: "", title: "", detail: "" });
const blankStep = (): PracticeStep => ({ name: "", detail: "" });
const blankGroup = (): ResonanceGroup => ({ who: "", direction: "", connect: "", goal: "" });

export function ProfileStudio({ data }: { data: ProfileStudioData }) {
  const [slug, setSlug] = useState(data.slug);
  const [page, setPage] = useState<AspirationPage>(data.aspiration);
  const [published, setPublished] = useState(data.published);
  const [copied, setCopied] = useState(false);

  const sharePath = `/u/${slug || data.slug}`;
  const shareUrl = data.publicUrl.replace(/\/u\/[^/]+$/, sharePath);
  const [story, believe, practice, longing, resonance] = ASPIRATION_SECTIONS.slice(1);
  const claimWords = pad(page.claim.keywords, 3);
  const longingWords = pad(page.longing.keywords, 4);

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function setKeywords(kind: "claim" | "longing", index: number, value: string) {
    setPage((current) => {
      const size = kind === "claim" ? 3 : 4;
      const list = pad(kind === "claim" ? current.claim.keywords : current.longing.keywords, size);
      list[index] = value;
      if (kind === "claim") return { ...current, claim: { ...current.claim, keywords: list } };
      return { ...current, longing: { ...current.longing, keywords: list } };
    });
  }

  return (
    <main className="pp-page pp-owner">
      <div className="pp-bg" aria-hidden />
      <div className="wrap pp-wrap">
        <div className="pp-owner-bar">
          <div className="pp-owner-bar-text">
            <div className="kicker">我的向往 · 可分享</div>
            <p className="help" style={{ margin: "4px 0 0" }}>
              {data.autoHint}
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

        <form className="pp-card pp-owner-card" action="/api/action" method="post" autoComplete="off">
          <input type="hidden" name="action" value="save_profile" />
          <input type="hidden" name="next" value="/profile" />
          <input type="hidden" name="aspiration_json" value={JSON.stringify(page)} />
          <input type="hidden" name="slug" value={slug} />

          <header className="pp-hero">
            <div className="pp-orb" aria-hidden>
              <span>{initialOf(data.displayName)}</span>
            </div>
            <div className="pp-hero-text">
              <p className="pp-kicker">自在星球 · 我的向往</p>
              <h1 className="pp-name">{data.displayName}</h1>
              <h2 className="pp-claim-label">{ASPIRATION_SECTIONS[0].title}</h2>
              <textarea
                className="pp-tagline pp-area"
                rows={2}
                value={page.claim.sentence}
                placeholder="一句话：你想成为、想去往的样子"
                aria-label="主张"
                onChange={(event) =>
                  setPage((current) => ({ ...current, claim: { ...current.claim, sentence: event.target.value } }))
                }
              />
              <div className="pp-tags" aria-label="三个关键词">
                {claimWords.map((word, index) => (
                  <input
                    key={`claim-${index}`}
                    className="pp-tag pp-tag-input"
                    value={word}
                    placeholder="一个词"
                    aria-label={`关键词 ${index + 1}`}
                    maxLength={12}
                    onChange={(event) => setKeywords("claim", index, event.target.value)}
                  />
                ))}
              </div>
              <p className="pp-sec-lead">{ASPIRATION_SECTIONS[0].lead}</p>
            </div>
          </header>

          <div className="pp-sections">
            <section className="pp-sec" aria-labelledby="edit-story">
              <h2 id="edit-story">{story.title}</h2>
              <p className="pp-sec-lead">{story.lead}</p>
              <ol className="pp-story">
                {page.story.nodes.map((node, index) => (
                  <li key={`story-${index}`} className="pp-node">
                    <div className="pp-node-edit">
                      <input
                        className="pp-input pp-when"
                        value={node.when}
                        placeholder="阶段，可空"
                        aria-label={`故事 ${index + 1} 阶段`}
                        maxLength={16}
                        onChange={(event) =>
                          setPage((current) => {
                            const nodes = current.story.nodes.slice();
                            nodes[index] = { ...nodes[index], when: event.target.value };
                            return { ...current, story: { nodes } };
                          })
                        }
                      />
                      <input
                        className="pp-input pp-node-title-input"
                        value={node.title}
                        placeholder="这一节点"
                        aria-label={`故事 ${index + 1} 标题`}
                        maxLength={24}
                        onChange={(event) =>
                          setPage((current) => {
                            const nodes = current.story.nodes.slice();
                            nodes[index] = { ...nodes[index], title: event.target.value };
                            return { ...current, story: { nodes } };
                          })
                        }
                      />
                      <button
                        type="button"
                        className="pp-text-btn pp-remove"
                        aria-label={`移除故事 ${index + 1}`}
                        onClick={() =>
                          setPage((current) => ({
                            ...current,
                            story: { nodes: current.story.nodes.filter((_, item) => item !== index) },
                          }))
                        }
                      >
                        移除
                      </button>
                    </div>
                    <textarea
                      className="pp-area"
                      rows={2}
                      value={node.detail}
                      placeholder="当时发生了什么"
                      aria-label={`故事 ${index + 1} 细节`}
                      onChange={(event) =>
                        setPage((current) => {
                          const nodes = current.story.nodes.slice();
                          nodes[index] = { ...nodes[index], detail: event.target.value };
                          return { ...current, story: { nodes } };
                        })
                      }
                    />
                  </li>
                ))}
              </ol>
              {page.story.nodes.length ? null : <p className="pp-quiet">还没有节点。补上你愿意公开的几段就好。</p>}
              <button
                type="button"
                className="pp-text-btn"
                disabled={page.story.nodes.length >= 8}
                onClick={() =>
                  setPage((current) => ({ ...current, story: { nodes: [...current.story.nodes, blankNode()] } }))
                }
              >
                添加一段经历
              </button>
            </section>

            <section className="pp-sec" aria-labelledby="edit-believe">
              <h2 id="edit-believe">{believe.title}</h2>
              <p className="pp-sec-lead">{believe.lead}</p>
              <ul className="pp-points">
                {page.believe.points.map((point, index) => (
                  <li key={`belief-${index}`}>
                    <div className="pp-inline-row">
                      <input
                        className="pp-input"
                        value={point}
                        placeholder="一条你愿意守住的话"
                        aria-label={`相信 ${index + 1}`}
                        maxLength={80}
                        onChange={(event) =>
                          setPage((current) => {
                            const points = current.believe.points.slice();
                            points[index] = event.target.value;
                            return { ...current, believe: { ...current.believe, points } };
                          })
                        }
                      />
                      <button
                        type="button"
                        className="pp-text-btn pp-remove"
                        aria-label={`移除相信 ${index + 1}`}
                        onClick={() =>
                          setPage((current) => ({
                            ...current,
                            believe: {
                              ...current.believe,
                              points: current.believe.points.filter((_, item) => item !== index),
                            },
                          }))
                        }
                      >
                        移除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="pp-text-btn"
                disabled={page.believe.points.length >= 6}
                onClick={() =>
                  setPage((current) => ({
                    ...current,
                    believe: { ...current.believe, points: [...current.believe.points, ""] },
                  }))
                }
              >
                添加一条
              </button>
              <input
                className="pp-input pp-closing-input"
                value={page.believe.closing}
                placeholder="可选：收在段尾的一句"
                aria-label="相信的底句"
                maxLength={160}
                onChange={(event) =>
                  setPage((current) => ({ ...current, believe: { ...current.believe, closing: event.target.value } }))
                }
              />
            </section>

            <section className="pp-sec" aria-labelledby="edit-practice">
              <h2 id="edit-practice">{practice.title}</h2>
              <p className="pp-sec-lead">{practice.lead}</p>
              <ol className="pp-flow">
                {page.practice.steps.map((step, index) => (
                  <li key={`step-${index}`} className="pp-flow-step">
                    <div className="pp-flow-head">
                      <div className="pp-flow-no" aria-hidden>
                        {index + 1}
                      </div>
                      <button
                        type="button"
                        className="pp-text-btn pp-remove"
                        aria-label={`移除步骤 ${index + 1}`}
                        onClick={() =>
                          setPage((current) => ({
                            ...current,
                            practice: { steps: current.practice.steps.filter((_, item) => item !== index) },
                          }))
                        }
                      >
                        移除
                      </button>
                    </div>
                    <input
                      className="pp-input"
                      value={step.name}
                      placeholder="这一步"
                      aria-label={`做事步骤 ${index + 1} 名称`}
                      maxLength={12}
                      onChange={(event) =>
                        setPage((current) => {
                          const steps = current.practice.steps.slice();
                          steps[index] = { ...steps[index], name: event.target.value };
                          return { ...current, practice: { steps } };
                        })
                      }
                    />
                    <textarea
                      className="pp-area"
                      rows={3}
                      value={step.detail}
                      placeholder="你实际怎么做"
                      aria-label={`做事步骤 ${index + 1} 说明`}
                      onChange={(event) =>
                        setPage((current) => {
                          const steps = current.practice.steps.slice();
                          steps[index] = { ...steps[index], detail: event.target.value };
                          return { ...current, practice: { steps } };
                        })
                      }
                    />
                  </li>
                ))}
              </ol>
              {page.practice.steps.length ? null : <p className="pp-quiet">还没有步骤。按你自己的做法添上，不必套固定流程。</p>}
              <button
                type="button"
                className="pp-text-btn"
                disabled={page.practice.steps.length >= 6}
                onClick={() =>
                  setPage((current) => ({
                    ...current,
                    practice: { steps: [...current.practice.steps, blankStep()] },
                  }))
                }
              >
                添加一步
              </button>
            </section>

            <section className="pp-sec" aria-labelledby="edit-longing">
              <div className="pp-longing">
                <h2 id="edit-longing">{longing.title}</h2>
                <p className="pp-sec-lead">{longing.lead}</p>
                <div className="pp-tags">
                  {longingWords.map((word, index) => (
                    <input
                      key={`longing-${index}`}
                      className="pp-tag pp-tag-input"
                      value={word}
                      placeholder="方向词"
                      aria-label={`向往关键词 ${index + 1}`}
                      maxLength={12}
                      onChange={(event) => setKeywords("longing", index, event.target.value)}
                    />
                  ))}
                </div>
                <textarea
                  className="pp-area pp-longing-line"
                  rows={3}
                  value={page.longing.line}
                  placeholder="一两句你想靠近的方向"
                  aria-label="向往"
                  onChange={(event) =>
                    setPage((current) => ({ ...current, longing: { ...current.longing, line: event.target.value } }))
                  }
                />
              </div>
            </section>

            <section className="pp-sec" aria-labelledby="edit-resonance">
              <h2 id="edit-resonance">{resonance.title}</h2>
              <p className="pp-sec-lead">{resonance.lead}</p>
              <div className="pp-people">
                {page.resonance.groups.map((group, index) => (
                  <article key={`group-${index}`} className="pp-person">
                    <div className="pp-person-tools">
                      <span className="pp-person-index">第 {index + 1} 类</span>
                      <button
                        type="button"
                        className="pp-text-btn pp-remove"
                        aria-label={`移除同频第 ${index + 1} 类`}
                        onClick={() =>
                          setPage((current) => ({
                            ...current,
                            resonance: {
                              groups: current.resonance.groups.filter((_, item) => item !== index),
                            },
                          }))
                        }
                      >
                        移除
                      </button>
                    </div>
                    {(
                      [
                        ["who", "他们是谁", "他们是谁"],
                        ["direction", "共同方向", "你们要一起靠近什么"],
                        ["connect", "连接方式", "打算怎样认识"],
                        ["goal", "共同目标（可选）", "可以不写"],
                      ] as const
                    ).map(([field, label, placeholder]) => (
                      <label key={field} className="pp-person-row">
                        <span className="pp-person-label">{label}</span>
                        <textarea
                          className="pp-area"
                          rows={field === "goal" ? 2 : 2}
                          value={group[field]}
                          placeholder={placeholder}
                          aria-label={`${label} ${index + 1}`}
                          onChange={(event) =>
                            setPage((current) => {
                              const groups = current.resonance.groups.slice();
                              groups[index] = { ...groups[index], [field]: event.target.value };
                              return { ...current, resonance: { groups } };
                            })
                          }
                        />
                      </label>
                    ))}
                  </article>
                ))}
              </div>
              {page.resonance.groups.length ? null : (
                <p className="pp-quiet">还没有写下希望遇见的人。可以先写两类。</p>
              )}
              <button
                type="button"
                className="pp-text-btn"
                disabled={page.resonance.groups.length >= 4}
                onClick={() =>
                  setPage((current) => ({
                    ...current,
                    resonance: { groups: [...current.resonance.groups, blankGroup()] },
                  }))
                }
              >
                添加一类人
              </button>
            </section>
          </div>

          {!aspirationHasContent(page) ? (
            <p className="pp-empty">
              还没有内容。可先去「见自己」或「我的 AI 分身」，再点上方「重新生成」；也可直接在每一段里写。
            </p>
          ) : null}

          <div className="pp-owner-meta">
            <label className="pp-slug-field">
              <span>分享路径</span>
              <div className="pp-slug-row">
                <span className="pp-slug-prefix">/u/</span>
                <input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/\s+/g, "-"))}
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
                onChange={(event) => setPublished(event.target.checked)}
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
              <a
                className="btn-light"
                href="/api/profile/pdf?format=pdf"
                style={{ color: "#164E56", borderColor: "#D4E4E8", background: "#fff" }}
              >
                下载 PDF
              </a>
              <a href="/partner">回 AI 分身</a>
              <a href="/community">去同频家园</a>
              <a href="/explore">见自己</a>
            </div>
          </footer>
        </form>
      </div>
    </main>
  );
}
