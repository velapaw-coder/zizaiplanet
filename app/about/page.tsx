import type { Metadata } from "next";

export const metadata: Metadata = { title: "关于我们" };

const STORY = [
  "自在星球想陪人做长期的事。看见自己 · 连接同频 · 共创长期生意。这是 AI 时代的长期生意共创生态：先看清自己，再把能力用明白，把经验留下来，与同频的人待在同一个场域。",
  "见自己，是七维自我探索。放大力，是 AI 能力成长，判断仍由自己做。认知分享留下文章和社区里的短记。同频与波，是茶局这样的交流场域。生活的样子不写在口号里，它留在你自己的探索之后。",
  "我们寻找愿意慢慢来的星球居民。不必一次想清全部，愿意看见自己，也愿意留下真实经验，就可以开始。线上提供认知、关系与场域。合作由成员线下独立协商。这里不做撮合，也不为交易或收益背书。",
];

export default function AboutPage() {
  return (
    <main className="section tight">
      <div className="wrap stack" style={{ maxWidth: 760 }}>
        <div className="section-head left">
          <div className="kicker">ABOUT</div>
          <h1 className="page-title">关于我们</h1>
          <p className="serif" style={{ fontSize: 22, lineHeight: 1.7, marginBottom: 8 }}>
            看见自己 · 连接同频 · 共创长期生意
          </p>
          <p className="help" style={{ fontSize: 14 }}>
            AI 时代的长期生意共创生态
          </p>
        </div>

        <div style={{ margin: "8px 0 28px" }}>
          <div className="intro-video-frame about-intro-video" style={{ borderRadius: 16, overflow: "hidden", background: "#0e3a42", aspectRatio: "16 / 9", border: "1px solid #d4e4e8", boxShadow: "0 16px 40px rgba(22,78,86,.12)" }}>
            <video
              controls
              playsInline
              preload="none"
              poster="/intro-poster-sm.webp"
              style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
              aria-label="自在星球介绍视频"
            >
              <source src="/api/media/site/intro.mp4?v=2" type="video/mp4" />
            </video>
          </div>
          <p className="help" style={{ fontSize: 13, lineHeight: 1.7, margin: "12px 0 10px", color: "#6D8B92" }}>
            网络较慢时，可下载后观看。
          </p>
          <a
            className="btn-light"
            href="/api/media/site/intro.mp4?v=2&download=1"
            download="自在星球介绍视频.mp4"
            style={{
              color: "#164E56",
              border: "1px solid #d4e4e8",
              background: "#F5FAFB",
            }}
          >
            下载视频 ↗
          </a>
        </div>

        <section
          className="about-deck-card"
          style={{
            margin: "0 0 32px",
            padding: "28px 26px",
            borderRadius: 16,
            border: "1px solid #d4e4e8",
            background: "#ffffff",
            boxShadow: "0 12px 32px rgba(22,78,86,.07)",
          }}
        >
          <div className="kicker" style={{ marginBottom: 8 }}>
            DECK
          </div>
          <h2 className="serif" style={{ fontSize: 24, marginBottom: 10 }}>
            自在星球介绍资料
          </h2>
          <p className="help" style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 18, color: "#6D8B92" }}>
            完整介绍 PPT（PDF）。想系统了解自在星球的定位、路径与边界，可在线预览或下载保存。
          </p>
          <div className="btn-row" style={{ marginBottom: 20 }}>
            <a
              className="btn-primary"
              href="/api/media/site/about-deck.pdf?download=1"
              download="自在星球介绍资料.pdf"
            >
              下载 PDF ↗
            </a>
            <a
              className="btn-light"
              href="/api/media/site/about-deck.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#164E56",
                border: "1px solid #d4e4e8",
                background: "#F5FAFB",
              }}
            >
              新窗口打开
            </a>
          </div>
          <div
            style={{
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #d4e4e8",
              background: "#0e3a42",
              minHeight: 420,
            }}
          >
            <object
              data="/api/media/site/about-deck.pdf#view=FitH"
              type="application/pdf"
              width="100%"
              height="520"
              aria-label="自在星球介绍资料预览"
              style={{ display: "block", width: "100%", height: 520, background: "#f5fafb" }}
            >
              <p style={{ padding: 24, color: "#E7F4F3", fontSize: 14, lineHeight: 1.8 }}>
                当前浏览器无法内嵌预览 PDF。请
                <a href="/api/media/site/about-deck.pdf?download=1" style={{ color: "#7EB6D9", marginLeft: 6 }}>
                  下载介绍资料
                </a>
                。
              </p>
            </object>
          </div>
        </section>

        <article className="prose">
          {STORY.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>

        <section className="prose">
          <h2 className="serif" style={{ fontSize: 24 }}>
            再写清楚一点
          </h2>
          <p>四项服务可以分开走，也可以只先做一件。</p>
          <p>
            <a href="/explore">七维自我探索</a>
            用来见自己。走完七维自我探索卡，就会生成个人画像，找到向往的定位与方向。生活的样子放在后面，不拿来当标准答案。
          </p>
          <p>
            <a href="/energy">AI能力成长</a>
            用来放大力。这里放用得上的方法。怎么用，由你判断。
          </p>
          <p>
            <a href="/journal">认知分享</a>
            以文章为主。更短的居民交流在登录后的 <a href="/garden">我的家园</a>。
          </p>
          <p>
            同频连接
            是茶局这样的场域，登录后在「我的家园」里进入。同频的人可以坐下来。报名自愿。
          </p>
          <p>
            从 <a href="/join">星球居民</a> 进入。注册之后，你在家园里是星球居民。我们寻找的是愿意自己判断、也愿意把经验留在场域里的人。
          </p>
          <p>线上只提供认知、关系与场域。合作、交易和收益，由成员在线下自己商量。星球不做撮合，也不为这些结果背书。</p>
        </section>

        <p>
          <a className="btn-primary" href="/join">
            星球居民 ↗
          </a>
        </p>
      </div>
    </main>
  );
}
