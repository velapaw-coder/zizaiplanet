import type { ExplorePlan } from "@/lib/explore-plan";

export function ExplorePlanView({
  plan,
  qrUrl = "/community-wecom-qr.png",
  showDownload = true,
  compact = false,
}: {
  plan: ExplorePlan;
  qrUrl?: string;
  showDownload?: boolean;
  compact?: boolean;
}) {
  return (
    <article className={`explore-plan${compact ? " is-compact" : ""}`} id="explore-plan">
      <div className="explore-plan-top">
        <div>
          <div className="kicker">自我探索方案</div>
          <h2 className="serif explore-plan-title">{plan.title}</h2>
          <p className="help">{plan.subtitle}</p>
        </div>
        {showDownload ? (
          <a className="btn-primary explore-plan-download" href="/api/explore/plan?format=pdf">
            下载 PDF
          </a>
        ) : null}
      </div>

      <p className="explore-plan-oneliner serif">{plan.oneLiner}</p>

      <div className="explore-plan-sections">
        {plan.sections.map((section) => (
          <section key={section.id} className="explore-plan-section">
            <h3>{section.title}</h3>
            <p className="help explore-plan-body">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="help explore-plan-closing">{plan.closing}</p>

      <div className="explore-plan-join">
        <img
          src={qrUrl}
          alt="自在星球企业微信社区二维码"
          width={120}
          height={120}
          className="explore-plan-qr"
        />
        <div className="explore-plan-join-copy">
          <h3>加入自在星球社区</h3>
          <p className="help">
            扫企业微信二维码进群。或先去{" "}
            <a href="/partner">AI 分身</a>
            认清起点，再写下{" "}
            <a href="/profile">我的向往</a>
            ，到{" "}
            <a href="/community">同频家园</a>
            交流。
          </p>
          <p className="help explore-plan-join-note">也可下载 PDF 留存；方向清晰后还能下载方向纪要。</p>
        </div>
        {showDownload ? (
          <a
            className="btn-primary explore-plan-join-cta"
            href="/api/explore/plan?format=pdf"
            aria-label="下载自在星球七维自我探索方案 PDF"
          >
            <span className="explore-plan-join-cta-title">下载探索方案 PDF</span>
            <span className="explore-plan-join-cta-sub">《自在星球-七维自我探索方案》</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function ExplorePlanClientActions({ ready }: { ready: boolean }) {
  if (!ready) return null;
  return (
    <div className="explore-plan-actions row-actions">
      <a className="btn-primary" href="/partner">
        去 AI 分身认清起点
      </a>
      <a className="btn-light" href="/api/explore/plan?format=pdf" style={{ color: "#164E56", borderColor: "#D4E4E8", background: "#fff" }}>
        下载探索方案 PDF
      </a>
      <a href="/profile">我的向往（可自动生成）</a>
      <a href="/community">同频家园</a>
    </div>
  );
}
