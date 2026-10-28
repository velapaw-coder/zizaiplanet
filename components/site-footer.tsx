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
              向内扎根，向外生长。
              <br />
              AI 时代的自由生意共创生态
            </p>
          </div>
          <nav aria-label="页脚导航" className="footer-nav">
            <div className="footer-col">
              <strong>顶栏入口</strong>
              <a href="/explore">认识自己</a>
              <a href="/partner">AI分身</a>
              <a href="/profile">我的向往</a>
              <a href="/journal">星球生活志</a>
              <a href="/energy">AI能量站</a>
              <a href="/about">关于我们</a>
            </div>
            <div className="footer-col">
              <strong>更多</strong>
              <a href="/energy">AI能量站</a>
              <a href="/garden">我的家园</a>
              <a href="/join">星球居民</a>
            </div>
          </nav>
        </div>
        <p className="compliance">线上提供认知、关系与场域；合作由成员线下独立协商。不做站内项目撮合。</p>
        <div className="footer-bottom">
          <span>© 2026 自在星球 · AI时代的自由生意</span>
          <span>线上交流与连接 · 线下合作独立开展</span>
        </div>
      </div>
    </footer>
  );
}
