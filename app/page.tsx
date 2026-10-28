import type { Metadata } from "next";
import { PAGE_COPY, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(PAGE_COPY.home);

export default function HomePage() {
  return (
    <>
      <main id="main" className="home-brand">
        <section className="hero" aria-labelledby="hero-title">
          <div className="wrap">
            <div className="hero-grid">
              <div className="hero-copy">
                <div className="eyebrow">AI creates freedom</div>
                <h1 id="hero-title">
                  AI时代，
                  <br />
                  以AI自由创造，
                  <br />
                  <span>创造自由生活</span>
                </h1>
                <p>
                  以道驭AI，以创造得自由。
                  <br />
                  自由生意，是能带来人生自由的事业。
                </p>
                <div className="hero-actions">
                  <a className="hb-btn" href="/join">
                    成为自由创造者{" "}
                    <span className="arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                  <a className="text-link" href="#philosophy">
                    认识 AI创造自由 <span aria-hidden="true">↓</span>
                  </a>
                </div>
                <div className="hero-note">见自己 · 明其道 · 善用AI · 创造自由</div>
              </div>
              <div
                className="planet-scene"
                role="img"
                aria-label="蓝绿星球与环绕轨道，象征以创造得自由"
              >
                <div className="orbit-line" />
                <div className="orbit-line two" />
                <span className="scene-star" aria-hidden="true">
                  ✧
                </span>
                <picture>
                  <source
                    media="(max-width: 700px)"
                    srcSet="/planet-sm.webp"
                    type="image/webp"
                  />
                  <source
                    media="(max-width: 1100px)"
                    srcSet="/planet-md.webp"
                    type="image/webp"
                  />
                  <source srcSet="/planet.webp" type="image/webp" />
                  <img
                    className="hero-planet"
                    src="/planet.png"
                    alt=""
                    width={360}
                    height={360}
                    decoding="async"
                    fetchPriority="high"
                  />
                </picture>
                <div className="scene-label">AI CREATES FREEDOM</div>
              </div>
            </div>
            <div className="hero-bottom">
              <span>
                <i />
                见自己 · 创造自由
              </span>
              <span>SCROLL TO EXPLORE ↓</span>
            </div>
          </div>
          <svg
            className="landscape"
            viewBox="0 0 1440 170"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="hb-mountain" x2="1" y2="0">
                <stop stopColor="#dff1f0" />
                <stop offset=".6" stopColor="#e3f2f8" />
                <stop offset="1" stopColor="#dbf0e4" />
              </linearGradient>
            </defs>
            <path
              d="M0 112Q100 103 190 133T400 109T620 124T850 96T1055 75T1240 47T1440 15V170H0Z"
              fill="url(#hb-mountain)"
              opacity=".65"
            />
            <path
              d="M0 150Q170 123 320 149T640 141T940 126T1190 91T1440 76"
              fill="none"
              stroke="#a6d0d3"
              strokeWidth=".7"
            />
            <path
              d="M0 163Q200 146 360 165T720 150T1080 140T1440 102"
              fill="none"
              stroke="#a6d0d3"
              strokeWidth=".6"
            />
          </svg>
        </section>

        <section className="intro-video-section" aria-labelledby="intro-video-title">
          <div className="wrap intro-video-inner">
            <div className="intro-video-copy">
              <div className="eyebrow">Watch · The idea</div>
              <h2 id="intro-video-title">认识自在星球</h2>
              <p>
                AI创造自由。以道驭AI，以创造得自由。
                <br />
                见自己 · 明其道 · 善用AI · 创造自由。
                <br />
                片中若还是更早的说法，以这一页为准。
              </p>
            </div>
            <div className="intro-video-frame">
              <video
                className="intro-video"
                controls
                playsInline
                preload="none"
                poster="/intro-poster-sm.webp"
                aria-label="自在星球介绍视频"
              >
                <source src="/api/media/site/intro.mp4?v=3" type="video/mp4" />
                你的浏览器不支持视频播放，请
                <a href="/api/media/site/intro.mp4?v=3">下载介绍视频</a>
                。
              </video>
            </div>
          </div>
        </section>

        <section className="statement">
          <div className="wrap statement-inner">
            <h2>
              技术可以更强。
              <br />
              人，要更自由。
            </h2>
            <p>
              自在星球，是 AI创造自由的同行之地。AI 是器，用来释放能力；自由是道，用来找回选择；创造是行，用来长出价值。一门自由生意，是能带来人生自由的生意：它生长于真实的能力、被理解的需求，以及一次次兑现的承诺。先见自己，再找到值得一起走的人。
            </p>
          </div>
        </section>

        <section className="section wrap" id="philosophy" aria-labelledby="philosophy-title">
          <div className="intro-row">
            <div>
              <div className="eyebrow">01 / See your way</div>
              <h2 id="philosophy-title">
                见自己，明其道。
                <br />
                再让 AI 帮上忙。
              </h2>
            </div>
            <p>
              先有方向，再有能力。先创造价值，再谈自由生意。
              <br />
              判断仍由人做。AI 负责把想法变成可以试的创造。
            </p>
          </div>
          <div className="pillars">
            <article className="pillar">
              <div className="pillar-top">
                <span className="number">01 — SEE</span>
                <svg
                  className="icon"
                  viewBox="0 0 60 60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  aria-hidden="true"
                >
                  <circle cx="30" cy="30" r="23" />
                  <circle cx="30" cy="30" r="12" />
                  <circle cx="30" cy="30" r="3" fill="#a9dbce" stroke="none" />
                  <path d="M30 2v12M30 46v12M2 30h12M46 30h12" />
                </svg>
              </div>
              <h3>见自己</h3>
              <p>
                从经历、品格与生活向往里，辨认真正擅长的事。见自己，才知道哪一条路是自己的，而不是别人的成功模板。
              </p>
              <p className="prompt">我是谁，愿意为谁创造价值？</p>
            </article>
            <article className="pillar">
              <div className="pillar-top">
                <span className="number">02 — THE WAY</span>
                <svg
                  className="icon"
                  viewBox="0 0 60 60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  aria-hidden="true"
                >
                  <circle cx="22" cy="30" r="17" />
                  <circle cx="39" cy="30" r="17" />
                  <path d="M30 17v26" strokeDasharray="2 4" />
                  <circle cx="30" cy="30" r="3" fill="#a9dbce" stroke="none" />
                </svg>
              </div>
              <h3>明其道</h3>
              <p>
                先确立方向，再选择工具和事业。顺势而为：不必人人成为同一种创业者。找到适合自己的方式与节奏。
              </p>
              <p className="prompt">我的道，通向怎样的自由生活？</p>
            </article>
            <article className="pillar">
              <div className="pillar-top">
                <span className="number">03 — WITH AI</span>
                <svg
                  className="icon"
                  viewBox="0 0 60 60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  aria-hidden="true"
                >
                  <path d="M30 4Q33 26 56 30Q33 33 30 56Q27 33 4 30Q27 26 30 4Z" />
                  <path d="M47 3v12M41 9h12" />
                  <circle cx="13" cy="48" r="3" />
                </svg>
              </div>
              <h3>善用AI</h3>
              <p>
                不为追逐 AI 而学习 AI。用它整理经验、验证想法，把一个人的热爱做成作品。判断与责任，仍由人承担。
              </p>
              <p className="prompt">让创造，少受资源限制。</p>
            </article>
          </div>
        </section>

        <section className="section flow-section" aria-labelledby="flow-title">
          <div className="wrap">
            <div className="flow-header">
              <div>
                <div className="eyebrow">02 / Create real value</div>
                <h2 id="flow-title">
                  先创造真实价值，
                  <br />
                  自由生意才会长出来。
                </h2>
              </div>
              <p>
                自由生意不是想停就停，而是能带来人生自由的事业。先听见真实需要，再让能力对上。
              </p>
            </div>
            <div className="flow">
              <article className="flow-step">
                <div className="flow-dot">01</div>
                <h3>真实的人</h3>
                <p>
                  见自己：经历、优势与向往，
                  <br />
                  找到愿意投入的方向。
                </p>
              </article>
              <article className="flow-step">
                <div className="flow-dot">02</div>
                <h3>真实的需求</h3>
                <p>
                  先问谁需要、为什么需要，
                  <br />
                  再讨论什么值得去做。
                </p>
              </article>
              <article className="flow-step">
                <div className="flow-dot">03</div>
                <h3>善用能力</h3>
                <p>
                  让专业与 AI 一起理解问题，
                  <br />
                  以需求组织创造。
                </p>
              </article>
              <article className="flow-step">
                <div className="flow-dot">04</div>
                <h3>持续的信任</h3>
                <p>
                  知行合一，在行动里兑现，
                  <br />
                  让价值带来下一次自由。
                </p>
              </article>
            </div>
            <div className="flow-foot">
              <strong>人 → 需求 → 能力 → 价值 → 信任 → 自由</strong>
              <span>这里分享理念与方法；自由生意的具体合作，在线下独立开展。</span>
            </div>
          </div>
        </section>

        <section className="section wrap" id="ecology" aria-labelledby="ecology-title">
          <div className="ecology-grid">
            <div className="ecology-copy">
              <div className="eyebrow">03 / Grow like a flower</div>
              <h2 id="ecology-title">
                一花多瓣，
                <br />
                各自创造，彼此成就。
              </h2>
              <p>
                自由创造者共享同一套价值观，也保留每个人的独立性。利他共生：连接让成长发生，边界让关系长久。
              </p>
              <div className="ecology-lines">
                <div className="ecology-line">
                  <strong>花芯</strong>
                  <span>真实的人，以及品格、向往与自己的道。</span>
                </div>
                <div className="ecology-line">
                  <strong>花瓣</strong>
                  <span>独立的专业与场域，各自扎根真实需要。</span>
                </div>
                <div className="ecology-line">
                  <strong>共生</strong>
                  <span>分享认知、经验与创造，相互启发，彼此托举。</span>
                </div>
              </div>
            </div>
            <figure className="flower-figure">
              <svg viewBox="0 0 500 490" role="img" aria-labelledby="flower-title flower-desc">
                <title id="flower-title">花型生态理念图</title>
                <desc id="flower-desc">
                  以品格、向往与自己的道为花芯，五片花瓣表示独立场域。共享根基，各自创造。
                </desc>
                <defs>
                  <linearGradient id="hb-petal" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#e5f4fb" />
                    <stop offset="1" stopColor="#e0f2e3" />
                  </linearGradient>
                  <radialGradient id="hb-flower-bg">
                    <stop stopColor="#f1f9f7" />
                    <stop offset="1" stopColor="#fff" />
                  </radialGradient>
                </defs>
                <circle cx="250" cy="237" r="229" fill="url(#hb-flower-bg)" />
                <circle
                  cx="250"
                  cy="237"
                  r="195"
                  fill="none"
                  stroke="#d5e8e5"
                  strokeDasharray="2 7"
                />
                <g fill="url(#hb-petal)" stroke="#a8d2d3" strokeWidth="1">
                  <ellipse cx="250" cy="142" rx="69" ry="104" />
                  <ellipse
                    cx="250"
                    cy="142"
                    rx="69"
                    ry="104"
                    transform="rotate(72 250 237)"
                  />
                  <ellipse
                    cx="250"
                    cy="142"
                    rx="69"
                    ry="104"
                    transform="rotate(144 250 237)"
                  />
                  <ellipse
                    cx="250"
                    cy="142"
                    rx="69"
                    ry="104"
                    transform="rotate(216 250 237)"
                  />
                  <ellipse
                    cx="250"
                    cy="142"
                    rx="69"
                    ry="104"
                    transform="rotate(288 250 237)"
                  />
                </g>
                <g
                  fill="#4e8186"
                  textAnchor="middle"
                  fontSize="12"
                  fontFamily="Noto Sans SC, Microsoft YaHei, sans-serif"
                >
                  <text x="250" y="105">
                    独立场域
                  </text>
                  <text x="380" y="203">
                    独立场域
                  </text>
                  <text x="331" y="353">
                    独立场域
                  </text>
                  <text x="169" y="353">
                    独立场域
                  </text>
                  <text x="120" y="203">
                    独立场域
                  </text>
                </g>
                <circle cx="250" cy="237" r="77" fill="#fff" stroke="#98c8c8" />
                <circle cx="250" cy="237" r="68" fill="#f9fcfa" stroke="#e1efeb" />
                <g
                  textAnchor="middle"
                  fill="#2c666c"
                  fontFamily="Noto Sans SC, Microsoft YaHei, sans-serif"
                >
                  <text x="250" y="222" fontSize="19">
                    真实的人
                  </text>
                  <text x="250" y="247" fontSize="11">
                    品格 · 向往 · 自己的道
                  </text>
                  <text x="250" y="268" fontSize="8" letterSpacing="2" fill="#7b9c9d">
                    CREATE FREELY
                  </text>
                </g>
                <path
                  d="M250 406V443M250 432q-20-16-35-9M250 435q18-18 32-14"
                  fill="none"
                  stroke="#9ecac0"
                />
                <text
                  x="250"
                  y="472"
                  textAnchor="middle"
                  fontSize="11"
                  letterSpacing="3"
                  fill="#7c9999"
                >
                  共享根基 · 保持独立
                </text>
              </svg>
              <figcaption>花型示意自由创造者如何共享根基、各自生长。不代表在营项目或服务承诺。</figcaption>
            </figure>
          </div>
        </section>

        <section className="wave-section" id="rhythm" aria-labelledby="wave-title">
          <div className="wrap wave-grid">
            <div className="wave-copy">
              <div className="eyebrow">04 / A freer rhythm</div>
              <h2 id="wave-title">
                创造有节奏，
                <br />
                生活才自在。
              </h2>
              <p>
                真正的自由，不是不工作、不连接。围绕有意义的话题相聚，带着新的理解回到自己的生活。让创造有温度，也留出呼吸的空间。
              </p>
            </div>
            <div className="wave-visual">
              <svg viewBox="0 0 500 205" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="hb-wave-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#8acdc7" stopOpacity=".35" />
                    <stop offset="1" stopColor="#b5e6dc" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 157C45 157 45 42 105 42S169 157 220 157S275 76 330 76S400 157 500 157V205H0Z"
                  fill="url(#hb-wave-fill)"
                />
                <path
                  d="M0 157C45 157 45 42 105 42S169 157 220 157S275 76 330 76S400 157 500 157"
                  stroke="#60aaa9"
                  strokeWidth="1.7"
                />
                <path
                  d="M0 179C70 179 60 88 120 88S180 179 240 179S295 115 350 115S425 179 500 179"
                  stroke="#aed4d1"
                  strokeWidth="1"
                />
                <path
                  d="M0 195H500M105 42V195M330 76V195"
                  stroke="#b7d7d5"
                  strokeDasharray="3 6"
                />
                <circle cx="105" cy="42" r="5" fill="#f5fcf9" stroke="#60aaa9" />
                <circle cx="330" cy="76" r="5" fill="#f5fcf9" stroke="#60aaa9" />
                <text x="105" y="20" textAnchor="middle" fill="#608d92" fontSize="11">
                  一次真诚的相聚
                </text>
                <text x="330" y="51" textAnchor="middle" fill="#608d92" fontSize="11">
                  下一次自然的连接
                </text>
              </svg>
              <div className="wave-legend">
                <span>话题唤起</span>
                <span>自由参与</span>
                <span>回归日常</span>
              </div>
              <div className="wave-caption">按自己的节奏创造，也按自己的节奏生活。</div>
            </div>
          </div>
        </section>

        <section className="section wrap" id="community" aria-labelledby="community-title">
          <div className="community-grid">
            <div className="community-copy">
              <div className="eyebrow">05 / Free creators</div>
              <h2 id="community-title">
                愿意创造自由的你，
                <br />
                欢迎在这里相遇。
              </h2>
              <p>
                你可以正在经营一门自由生意，也可以仍在见自己、明其道。做自由职业、一人公司，或在原来的工作里要回更多自主，都算。不必人人创业。
              </p>
              <p className="tagline">顺势而为 · 以人为本 · 知行合一 · 利他共生 · 长期主义</p>
            </div>
            <ul className="community-list">
              <li>
                <span className="list-mark" aria-hidden="true">
                  ↗
                </span>
                <div>
                  <h3>创业者与经营者</h3>
                  <p>交流真实的经营体会。一门自由生意，是能带来人生自由的生意。</p>
                </div>
              </li>
              <li>
                <span className="list-mark" aria-hidden="true">
                  ✧
                </span>
                <div>
                  <h3>专业者与创造者</h3>
                  <p>分享知识与经验，探索如何善用 AI 做表达、研究与创造。</p>
                </div>
              </li>
              <li>
                <span className="list-mark" aria-hidden="true">
                  ⌁
                </span>
                <div>
                  <h3>正在出发的自由创造者</h3>
                  <p>见自己，明其道，从一个问题、一个想法、一次小行动出发。</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section className="join-outer wrap" id="join" aria-labelledby="join-title">
          <div className="join-panel">
            <div>
              <div className="eyebrow">An open invitation</div>
              <h2 id="join-title">
                从见自己开始，
                <br />
                让自由慢慢发生。
              </h2>
              <p>
                注册成为自由创造者。一起见自己、善用 AI、把向往写成生活。
                <br />
                AI自由创造，创造自由生活。
              </p>
              <p>
                想先读一读，去
                <a href="/journal">创造手记</a>
                ：见自己、善用AI、创造自由生活的文章。
              </p>
            </div>
            <div className="join-action">
              <a className="hb-btn" href="/join">
                成为自由创造者{" "}
                <span className="arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
              <p>自由参与 · 尊重边界 · 注册即可加入</p>
            </div>
          </div>
          <div className="faq">
            <details>
              <summary>加入之后，可以参与什么？</summary>
              <p>
                顶栏：
                <a href="/explore">见自己</a>、
                <a href="/partner">AI分身</a>、
                <a href="/energy">善用AI</a>、
                <a href="/journal">创造手记</a>、
                <a href="/profile">我的向往</a>、
                <a href="/about">关于我们</a>。
                登录后进
                <a href="/garden">创造者家园</a>
                ，登录后可参与创造者之间的交流与星球茶局。
                具体活动时间以实际通知为准。
              </p>
            </details>
            <details>
              <summary>线上社区与线下合作，是什么关系？</summary>
              <p>
                线上用于理念、认知与同频连接，不展示或承接具体商业项目。自由生意的线下合作，由相关参与方独立沟通、独立约定并自行负责；加入并不构成任何商业合作、交易或收益承诺。
              </p>
            </details>
            <details>
              <summary>参与需要保持活跃，或购买服务吗？</summary>
              <p>
                注册加入即可参与。你可以按自己的时间与兴趣来，尊重彼此的节奏。站内注册与任何线下商业合作彼此独立。
              </p>
            </details>
          </div>
        </section>
      </main>
      <div className="home-mobile-join">
        <span>与自由创造者同行</span>
        <a className="hb-btn" href="/join">
          成为自由创造者 <span aria-hidden="true">↗</span>
        </a>
      </div>
    </>
  );
}
