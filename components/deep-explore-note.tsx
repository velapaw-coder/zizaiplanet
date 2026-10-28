import { DEEP_SKILL_MD, DEEP_SKILL_ZIP } from "@/lib/rooms";

type Props = { compact?: boolean };

/** Secondary note after seven dims: closed-loop next steps; Skill download is optional. */
export function DeepExploreNote({ compact = false }: Props) {
  return (
    <aside className={`deep-explore-note${compact ? " compact" : ""}`} aria-label="探索之后">
      <div className="kicker">接下来</div>
      <h3 className="serif" style={{ fontSize: compact ? 18 : 22, margin: "6px 0 10px" }}>
        认清起点 · 我的向往 · 家园交流
      </h3>
      <p className="help">
        <a href="/partner">我的 AI 分身</a>
        {" · "}
        <a href="/profile">我的向往</a>
        {" · "}
        <a href="/garden#garden-compose">创造者家园发帖</a>
      </p>
      <p className="help" style={{ marginTop: 10 }}>
        可选：若想在自己的助手里跑更深题库，可下载{" "}
        <a href={DEEP_SKILL_ZIP} download>
          Skill zip
        </a>
        {" / "}
        <a href={DEEP_SKILL_MD} target="_blank" rel="noreferrer">
          SKILL.md
        </a>
        。站内主路径请用七维聊天与 AI 分身。
      </p>
    </aside>
  );
}
