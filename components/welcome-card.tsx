import { formatJoinDotDate, residentNumber, roleLabel } from "@/lib/text";

const BENEFITS = [
  {
    href: "/explore",
    icon: "🧭",
    tone: "teal",
    title: "七维自我探索",
    desc: "看见更多可能的自己",
  },
  {
    href: "/energy",
    icon: "🤖",
    tone: "blue",
    title: "AI能量站",
    desc: "工具与操作手册，照着做",
  },
  {
    href: "/tea",
    icon: "☕",
    tone: "purple",
    title: "星球茶局",
    desc: "遇见有趣的灵魂",
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
