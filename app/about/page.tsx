import type { Metadata } from "next";

export const metadata: Metadata = { title: "关于我们" };

const STORY = [
  "自在星球｜AI创造自由。技术越强大，人越需要找回自己。人生不只有一种活法，生意也不只有一种模式。我们不为追逐 AI 而学习 AI，而是为了创造更自由的人生而使用 AI。",
  "使命，是以 AI 释放人的创造力，以东方智慧照见人生方向，以真实需求连接长期价值。愿景，是让更多人成为自由创造者，让更多真实、有价值的小生意自然生长。辨识句：以道驭AI，以创造得自由。口号：AI自由创造，创造自由生活。",
  "路径收成十二个字：见自己 · 明其道 · 善用AI · 创造自由。见自己，是七维自我探索。明其道，是把向往写清楚。善用AI，是分身与能量站，判断仍由自己做。创造自由，可以是一门自由生意——能带来人生自由的生意，不是想停就停。",
  "我们不鼓励一夜暴富，也不制造人人创业的焦虑。有人做自由职业，有人经营很小的事业，有人在原来的工作里要回更多自主，也有人先用 AI 重新安排生活。价值观是：顺势而为、以人为本、知行合一、利他共生、长期主义。线上提供认知、关系与场域。合作由成员线下独立协商。这里不做撮合，也不为交易或收益背书。",
];

export default function AboutPage() {
  return (
    <main className="section tight">
      <div className="wrap stack" style={{ maxWidth: 760 }}>
        <div className="section-head left">
          <div className="kicker">ABOUT</div>
          <h1 className="page-title">关于我们</h1>
          <p className="serif" style={{ fontSize: 22, lineHeight: 1.7, marginBottom: 8 }}>
            AI创造自由
          </p>
          <p className="help" style={{ fontSize: 14 }}>
            以道驭AI，以创造得自由 · AI自由创造，创造自由生活
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
            片中若还是更早的说法，以本页文字为准。网络较慢时，可下载后观看。
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
            介绍资料（PDF）。想看自在星球现在怎么讲定位、路径与边界，可在线预览或下载。站上的产品仍是现有这几项，资料若与页面不一致，以页面为准。
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
            现在站上可以做的事
          </h2>
          <p>几件事可以分开走，也可以只先做一件。</p>
          <p>
            <a href="/explore">认识自己</a>
            ，走七维自我探索。有原话就点亮一维，走完会生成个人画像。生活的样子放在你自己的原话里，不拿来当标准答案。
          </p>
          <p>
            <a href="/partner">AI分身</a>
            用来认清起点，<a href="/energy">AI能量站</a>
            放用得上的方法。怎么用，由你判断。
          </p>
          <p>
            <a href="/profile">我的向往</a>
            把想成为、想去往的样子写成可分享的一页。<a href="/journal">星球生活志</a>
            以文章为主。更短的交流在登录后的 <a href="/garden">我的家园</a>。
          </p>
          <p>茶局这样的场域，登录后从「我的家园」进入。报名自愿。</p>
          <p>
            从 <a href="/join">成为自由创造者</a> 进入。注册之后，你在家园里的身份是自由创造者。我们寻找的是愿意自己判断、也愿意把经验留在场域里的人。
          </p>
          <p>线上只提供认知、关系与场域。合作、交易和收益，由成员在线下自己商量。星球不做撮合，也不为这些结果背书。</p>
        </section>

        <p>
          <a className="btn-primary" href="/join">
            成为自由创造者 ↗
          </a>
        </p>
      </div>
    </main>
  );
}
