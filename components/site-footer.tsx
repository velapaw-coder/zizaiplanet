import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <a href="/" className="logo">
              <Logo light />
            </a>
            <p>
              以道驭AI，以创造得自由。
              <br />
              AI自由创造，创造自由生活
            </p>
          </div>
          <nav aria-label="页脚导航" className="footer-nav">
            <div className="footer-col">
              <strong>顶栏入口</strong>
              <a href="/explore">见自己</a>
              <a href="/partner">AI分身</a>
              <a href="/profile">我的向往</a>
              <a href="/journal">创造手记</a>
              <a href="/energy">善用AI</a>
              <a href="/about">关于我们</a>
            </div>
            <div className="footer-col">
              <strong>更多</strong>
              <a href="/garden">创造者家园</a>
              <a href="/join">成为自由创造者</a>
            </div>
          </nav>
        </div>
        <p className="compliance">线上提供认知、关系与场域；合作由成员线下独立协商。不做站内项目撮合。</p>
        <div className="footer-bottom">
          <span>© 2026 自在星球 · AI创造自由</span>
          <span>线上交流与连接 · 线下合作独立开展</span>
        </div>
      </div>
    </footer>
  );
}
