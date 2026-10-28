import { formatJoinDotDate, residentNumber, roleLabel } from "@/lib/text";

const PATH_STEPS = [
  {
    n: "1",
    href: "/explore",
    title: "认识自己",
    desc: "走完七维自我探索卡。",
  },
  {
    n: "2",
    href: "/partner",
    title: "做分身",
    desc: "基于探索，认清起点与方向。",
  },
  {
    n: "3",
    href: "/profile",
    title: "形成向往",
    desc: "把想做的长期事写清楚。",
  },
] as const;

const BENEFITS = [
  {
    href: "/explore",
    icon: "🧭",
    tone: "teal",
    title: "七维自我探索",
    desc: "看见更多可能的自己",
  },
  {
    href: "/partner",
    icon: "🪞",
    tone: "blue",
    title: "AI分身",
    desc: "基于探索，认清起点与方向",
  },
  {
    href: "/profile",
    icon: "🌟",
    tone: "purple",
    title: "我的向往",
    desc: "明确想做的事，形成可分享主页",
  },
  {
    href: "/garden#garden-compose",
    icon: "🤝",
    tone: "green",
    title: "家园交流",
    desc: "居民内部发帖分享",
  },
] as const;

export function WelcomeCard({
  displayName,
  userId,
  createdAt,
  role = "member",
}: {
  displayName: string;
  userId: string;
  createdAt: string;
  role?: string;
}) {
  const number = residentNumber(userId);
  const joinDate = formatJoinDotDate(createdAt);
  const identity = roleLabel(role);
  const initial = displayName.trim().slice(0, 1) || "居";
  return (
    <section className="welcome-card" aria-label="星球居民欢迎卡">
      <div className="welcome-card-sky" aria-hidden="true">
        <span className="welcome-card-planet" />
        <span className="welcome-card-script">让生活多一种可能</span>
        <span className="welcome-card-star a">✦</span>
        <span className="welcome-card-star b">✧</span>
        <span className="welcome-card-star c">✦</span>
      </div>

      <header className="welcome-card-brand">
        <span className="welcome-card-logo">
          <img src="/logo.png" alt="" />
        </span>
        <span>
          <b>自在星球</b>
          <small>ZIZAI PLANET</small>
        </span>
      </header>

      <div className="welcome-card-title-block">
        <h2 className="welcome-card-title">星球居民欢迎卡</h2>
        <p className="welcome-card-title-en">Resident Welcome Card</p>
        <p className="welcome-card-greet">✦ 欢迎加入自在星球，成为一位新的星球居民 ✦</p>
      </div>

      <div className="welcome-glass identity-glass">
        <div className="welcome-glass-head">
          <span>
            <i aria-hidden="true">🪐</i> 居民身份认证
          </span>
          <small>ZIZAI PLANET</small>
        </div>
        <div className="welcome-identity-row">
          <div className="welcome-avatar" title={displayName}>
            <span>{initial}</span>
          </div>
          <dl className="welcome-fields">
            <div>
              <dt>身份</dt>
              <dd>
                <span className="welcome-pill">
                  <i aria-hidden="true">🪐</i>
                  {identity}
                </span>
              </dd>
            </div>
            <div>
              <dt>编号</dt>
              <dd className="welcome-mono">{number}</dd>
            </div>
            <div>
              <dt>入驻日期</dt>
              <dd className="welcome-mono">{joinDate}</dd>
            </div>
            <div className="welcome-name-line">
              <dt>居民</dt>
              <dd>{displayName}</dd>
            </div>
          </dl>
          <div className="welcome-seal" aria-hidden="true">
            <div className="welcome-seal-ring">
              <span className="welcome-seal-top">ZIZAI PLANET</span>
              <span className="welcome-seal-mid">🪐</span>
              <span className="welcome-seal-bot">自在星球</span>
            </div>
            <span className="welcome-seal-waves" />
          </div>
        </div>
        <p className="welcome-identity-foot">
          从今天起，你将与一群真诚、开放、长期主义的同行者，一起探索更自在的生活方式。
        </p>
      </div>

      <div className="welcome-glass welcome-path" aria-label="进站流程">
        <div className="welcome-glass-head">
          <span>
            <i aria-hidden="true">→</i> 在星球里怎么走
          </span>
          <small>ZIZAI PLANET</small>
        </div>
        <p className="welcome-path-lead">AI 时代，帮每个人找到自己的长期生意。</p>
        <ol className="welcome-steps">
          {PATH_STEPS.map((step) => (
            <li key={step.n}>
              <a className="welcome-step" href={step.href}>
                <span className="welcome-step-num" aria-hidden="true">
                  {step.n}
                </span>
                <span>
                  <b>{step.title}</b>
                  <small>{step.desc}</small>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      <div className="welcome-glass benefits-glass">
        <div className="welcome-glass-head">
          <span>
            <i aria-hidden="true">▣</i> 居民权益
          </span>
          <small>ZIZAI PLANET</small>
        </div>
        <div className="welcome-benefits">
          {BENEFITS.map((item) => (
            <a className={`welcome-benefit tone-${item.tone}`} href={item.href} key={item.href}>
              <span className="welcome-benefit-icon" aria-hidden="true">
                {item.icon}
              </span>
              <b>{item.title}</b>
              <small>{item.desc}</small>
            </a>
          ))}
        </div>
      </div>

      <footer className="welcome-card-foot">
        <p>—— 一个星球，无数种自在生活 ——</p>
        <small>ZIZAI PLANET</small>
      </footer>
    </section>
  );
}
