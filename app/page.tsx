export default function HomePage() {
  return (
    <>
      <main id="main" className="home-brand">
        <section className="hero" aria-labelledby="hero-title">
          <div className="wrap">
            <div className="hero-grid">
              <div className="hero-copy">
                <div className="eyebrow">A home for long-term creators</div>
                <h1 id="hero-title">
                  AI时代，
                  <br />
                  帮每个人找到
                  <br />
                  <span>属于自己的长期生意</span>
                </h1>
                <p>
                  通过自我探索、AI赋能与同频连接，看见真实需求，
                  <br />
                  把热爱与专长长成可持续的事业。
                </p>
                <div className="hero-actions">
                  <a className="hb-btn" href="/join">
                    星球居民 <span className="arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                  <a className="text-link" href="#philosophy">
                    认识长期生意 <span aria-hidden="true">↓</span>
                  </a>
                </div>
                <div className="hero-note">看见自己 · 连接同频 · 找到长期生意</div>
              </div>
              <div
                className="planet-scene"
                role="img"
                aria-label="蓝绿星球与环绕轨道，象征彼此连接、共同生长"
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
                <div className="scene-label">ROOTED IN YOU. OPEN TO THE WORLD.</div>
              </div>
            </div>
            <div className="hero-bottom">
              <span>
                <i />
                向内扎根 · 向外生长
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
              <div className="eyebrow">Watch · Intro</div>
              <h2 id="intro-video-title">认识自在星球</h2>
              <p>
                看见自己 · 连接同频 · 找到长期生意。
                <br />
                一段宽屏介绍，帮你快速了解我们在做什么。
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
                <source src="/api/media/site/intro.mp4?v=2" type="video/mp4" />
                你的浏览器不支持视频播放，请
                <a href="/api/media/site/intro.mp4?v=2">下载介绍视频</a>
                。
              </video>
            </div>
          </div>
        </section>

        <section className="statement">
          <div className="wrap statement-inner">
            <h2>
              生意，从一个真实的人开始。
              <br />
              关系，在时间里慢慢长出来。
            </h2>
            <p>
              自在星球，是一个关于「AI时代的长期生意」的交流社区。我们相信，一门值得长期经营的生意，生长于真实的能力、被理解的需求，以及一次次兑现的承诺。先找到自己，再找到值得一起走下去的人。
            </p>
          </div>
        </section>

        <section className="section wrap" id="philosophy" aria-labelledby="philosophy-title">
          <div className="intro-row">
            <div>
              <div className="eyebrow">01 / Start with people</div>
              <h2 id="philosophy-title">
                向内看见自己，
                <br />
                向外打开可能。
              </h2>
            </div>
            <p>
              从人出发，让方向清晰，让连接真实。
              <br />
              再用 AI，把想法一步步变成创造。
            </p>
          </div>
          <div className="pillars">
            <article className="pillar">
              <div className="pillar-top">
                <span className="number">01 — SELF</span>
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
              <h3>看见自己</h3>
              <p>
                从经历、品格与生活向往中，辨认真正擅长的事。让个人表达扎根于真实，把「我是谁」讲清楚，把「想去哪里」想明白。
              </p>
              <p className="prompt">我愿意长期为谁，创造什么价值？</p>
            </article>
            <article className="pillar">
              <div className="pillar-top">
                <span className="number">02 — CONNECTION</span>
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
              <h3>连接同频</h3>
              <p>
                因为相近的价值观相遇，因为真实的交流走近。分享经验、理解彼此，在一次次小小的互动中，沉淀值得托付的信任。
              </p>
              <p className="prompt">与谁同行，值得放进时间里？</p>
            </article>
            <article className="pillar">
              <div className="pillar-top">
                <span className="number">03 — AI NATIVE</span>
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
              <h3>AI 原生，放大创造力</h3>
              <p>
                把 AI 融入思考、学习、表达与实践。让经验更容易整理，让灵感更容易验证，把人的判断力与创造力放在中心。
              </p>
              <p className="prompt">让一个人的热爱，走得更远。</p>
            </article>
          </div>
        </section>

        <section className="section flow-section" aria-labelledby="flow-title">
          <div className="wrap">
            <div className="flow-header">
              <div>
                <div className="eyebrow">02 / Value before supply</div>
                <h2 id="flow-title">
                  先理解真实需求，
                  <br />
                  再让能力找到位置。
                </h2>
              </div>
              <p>
                长期生意的起点，是一个值得解决的问题。先听见需要，再理解能力；让每一次行动创造价值，让价值慢慢积累成信任。
              </p>
            </div>
            <div className="flow">
              <article className="flow-step">
                <div className="flow-dot">01</div>
                <h3>真实的人</h3>
                <p>
                  看见经历、优势与向往，
                  <br />
                  找到愿意长期投入的方向。
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
                <h3>合适的能力</h3>
                <p>
                  让专业与问题相互理解，
                  <br />
                  以需求组织供给。
                </p>
              </article>
              <article className="flow-step">
                <div className="flow-dot">04</div>
                <h3>持续的信任</h3>
                <p>
                  在认真行动中兑现承诺，
                  <br />
                  让价值带来下一次连接。
                </p>
              </article>
            </div>
            <div className="flow-foot">
              <strong>人 → 需求 → 能力 → 价值 → 信任 → 新的连接</strong>
              <span>这里分享长期生意的理念与方法；具体合作在线下独立开展。</span>
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
                各自生长，彼此成就。
              </h2>
              <p>
                我们用一朵花，理解长期关系的样子。共享价值观的根基，也保留每个人、每个场域的独立性。连接让成长发生，边界让关系长久。
              </p>
              <div className="ecology-lines">
                <div className="ecology-line">
                  <strong>花芯</strong>
                  <span>真实的人，以及品格、向往与价值观。</span>
                </div>
                <div className="ecology-line">
                  <strong>花瓣</strong>
                  <span>独立的专业与场域，各自扎根真实需要。</span>
                </div>
                <div className="ecology-line">
                  <strong>共生</strong>
                  <span>分享认知、经验与连接，相互启发，彼此托举。</span>
                </div>
              </div>
            </div>
            <figure className="flower-figure">
              <svg viewBox="0 0 500 490" role="img" aria-labelledby="flower-title flower-desc">
                <title id="flower-title">花型生态理念图</title>
                <desc id="flower-desc">
                  以品格、向往与价值观为花芯，五片花瓣表示独立场域。共享根基，各自生长。
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
                    品格 · 向往 · 价值观
                  </text>
                  <text x="250" y="268" fontSize="8" letterSpacing="2" fill="#7b9c9d">
                    SHARED ROOTS
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
              <figcaption>花型生态为共生理念示意，不代表在营项目或服务承诺。</figcaption>
            </figure>
          </div>
        </section>

        <section className="wave-section" id="rhythm" aria-labelledby="wave-title">
          <div className="wrap wave-grid">
            <div className="wave-copy">
              <div className="eyebrow">04 / A lighter rhythm</div>
              <h2 id="wave-title">
                像轻量的波，
                <br />
                相聚，也自在生活。
              </h2>
              <p>
                围绕一个有意义的话题相聚，带着新的理解回到自己的生活。分享一次经验，参与一场对话，或只是安静地听一听。让连接有温度，也有呼吸的空间。
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
              <div className="wave-caption">不必时刻在线，也能持续同行。</div>
            </div>
          </div>
        </section>

        <section className="section wrap" id="community" aria-labelledby="community-title">
          <div className="community-grid">
            <div className="community-copy">
              <div className="eyebrow">05 / Find your people</div>
              <h2 id="community-title">
                愿意长期做事的你，
                <br />
                欢迎在这里相遇。
              </h2>
              <p>
                你可以正在经营一份事业，也可以仍在探索自己的方向。带着真实的经历、好奇与善意，先从一次真诚的对话开始。
              </p>
              <p className="tagline">真诚 · 尊重 · 贡献 · 长期主义</p>
            </div>
            <ul className="community-list">
              <li>
                <span className="list-mark" aria-hidden="true">
                  ↗
                </span>
                <div>
                  <h3>创业者与经营者</h3>
                  <p>交流真实的经营体会，澄清方向，认识同样看重长期价值的人。</p>
                </div>
              </li>
              <li>
                <span className="list-mark" aria-hidden="true">
                  ✧
                </span>
                <div>
                  <h3>专业者与创造者</h3>
                  <p>分享自己的知识与经验，探索 AI 如何融入学习、表达与创造。</p>
                </div>
              </li>
              <li>
                <span className="list-mark" aria-hidden="true">
                  ⌁
                </span>
                <div>
                  <h3>正在探索的星球居民</h3>
                  <p>看见优势，打开认知，从一个问题、一个想法、一次小行动出发。</p>
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
                从认识彼此开始，
                <br />
                让长期的事慢慢发生。
              </h2>
              <p>
                注册成为自在星球的星球居民，一起聊成长、聊 AI、聊长期生意。
                <br />
                看见自己，连接同频，成就彼此。
              </p>
            </div>
            <div className="join-action">
              <a className="hb-btn" href="/join">
                星球居民{" "}
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
                <a href="/explore">认识自己</a>、
                <a href="/partner">AI分身</a>、
                <a href="/energy">AI能量站</a>、
                <a href="/journal">星球生活志</a>、
                <a href="/profile">我的向往</a>、
                <a href="/about">关于我们</a>。
                登录后进
                <a href="/garden">我的家园</a>
                ，可参与居民内部交流与星球茶局。
                具体活动时间以实际通知为准。
              </p>
            </details>
            <details>
              <summary>线上社区与线下合作，是什么关系？</summary>
              <p>
                线上社区用于理念传播、认知交流与同频连接，不展示或承接具体商业项目。线下合作由相关参与方独立沟通、独立约定并自行负责；加入并不构成任何商业合作、交易或收益承诺。
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
        <span>与长期做事的人同行</span>
        <a className="hb-btn" href="/join">
          星球居民 <span aria-hidden="true">↗</span>
        </a>
      </div>
    </>
  );
}
