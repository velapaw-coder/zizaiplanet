"use client";

import { useEffect, useState } from "react";

const SECTION_LINKS = [
  { href: "#belief", label: "我的向往" },
  { href: "#method", label: "创造能力" },
  { href: "#practice", label: "正在实践" },
  { href: "#people", label: "寻找伙伴" },
] as const;

/** Founder profile. Visual structure follows the supplied standalone page. */
export function XiechangProfile() {
  const [open, setOpen] = useState(false);
  const year = new Date().getFullYear();

  useEffect(() => {
    const root = document.querySelector(".xc");
    if (!root) return;
    const nodes = [...root.querySelectorAll(".reveal")];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.07 },
    );
    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, []);

  function closeNav() {
    setOpen(false);
  }

  return (
    <div className="xc">
      <header className="header">
        <div className="shell">
          <a className="logo" href="#top">
            谢昌 <small>AI FREEDOM CREATION</small>
          </a>
          <button
            className="menu"
            type="button"
            aria-label={open ? "收起导航" : "展开导航"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "×" : "☰"}
          </button>
          <nav className={open ? "nav open" : "nav"} aria-label="简介章节">
            {SECTION_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={closeNav}>
                {link.label}
              </a>
            ))}
            <a href="#cooperate" className="pill" onClick={closeNav}>
              共同创造 ↗
            </a>
          </nav>
        </div>
      </header>
      <main>
        <section className="hero" id="top">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">XIE CHANG · INDEPENDENT BUSINESS CREATOR</div>
              <h1 className="display">
                AI自由<span>创造</span>
              </h1>
              <div className="hero-sub">谢昌 · 独立商业创造者</div>
              <p className="hero-desc">
                从真实商业出发，发现尚未被看见的机会。
                <br />
                用AI构建产品与商业系统，与合适的伙伴共同验证、共同创造。
              </p>
              <div className="hero-quote display">
                与合适的人同行，做有价值的事，
                <br />
                过自由而有品质的生活。
              </div>
              <div className="actions">
                <a href="#belief" className="btn">
                  认识我 <span>↘</span>
                </a>
                <a href="#people" className="btn alt">
                  寻找共创伙伴 <span>↗</span>
                </a>
              </div>
            </div>
            <div className="portrait-area">
              <div className="portrait-halo" />
              <div className="portrait-frame">
                <img
                  src="/xiechang/portrait.jpg"
                  alt="谢昌个人形象照"
                  width={980}
                  height={1225}
                />
              </div>
              <div className="photo-tag">
                简单生活 · 自由探索
                <br />
                真诚连接 · 长期创造
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="belief">
          <div className="shell philosophy">
            <div className="reveal">
              <div className="eyebrow">01 / MY ASPIRATION</div>
              <h2 className="display">
                我相信，
                <br />
                商业应该让人
                <br />
                <span className="gold">更自由。</span>
              </h2>
              <p>我希望技术不只是让人做更多的事情，而是帮助我们拥有更多时间、选择权和创造空间。</p>
              <p className="linequote display">
                让技术服务商业，
                <br />
                让商业服务人生。
              </p>
            </div>
            <div className="stacks reveal">
              <div className="valuecard">
                <span className="number">01</span>
                <h3>简单生活</h3>
                <p>珍惜家庭、健康、时间与生活品质。</p>
              </div>
              <div className="valuecard">
                <span className="number">02</span>
                <h3>自由探索</h3>
                <p>保持好奇，探索新技术与新可能。</p>
              </div>
              <div className="valuecard">
                <span className="number">03</span>
                <h3>真诚连接</h3>
                <p>尊重边界，与同频的人建立真实关系。</p>
              </div>
              <div className="valuecard">
                <span className="number">04</span>
                <h3>长期创造</h3>
                <p>做值得持续投入、可以逐渐积累的事业。</p>
              </div>
              <div className="valuecard">
                <span className="number">05</span>
                <h3>独立自主</h3>
                <p>各自拥有事业，基于共同价值创造合作。</p>
              </div>
              <div className="valuecard">
                <span className="number">06</span>
                <h3>真实结果</h3>
                <p>从真实需求出发，用市场反馈检验价值。</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section dark" id="method">
          <div className="shell">
            <div className="section-head reveal">
              <div className="eyebrow">02 / HOW I CREATE</div>
              <h2 className="display">
                看见未被看见的机会，
                <br />
                <span style={{ color: "#e3bc7a" }}>把可能变成可验证的现实。</span>
              </h2>
              <p>
                我喜欢把产业资源、市场需求、产品能力与商业模式放在一起系统思考。AI让我们可以更快完成研究、原型与实验，但真正的价值仍需真实客户来证明。
              </p>
            </div>
            <div className="method-grid">
              <div className="method reveal">
                <span className="number">01 / DISCOVER</span>
                <strong>发现机会</strong>
                <p>从现有产业能力与客户需求之间识别新的可能性。</p>
              </div>
              <div className="method reveal">
                <span className="number">02 / DESIGN</span>
                <strong>构建系统</strong>
                <p>形成产品概念、客户画像、商业模式与业务路径。</p>
              </div>
              <div className="method reveal">
                <span className="number">03 / PROTOTYPE</span>
                <strong>AI原型</strong>
                <p>快速完成研究、视觉提案、流程与初步产品原型。</p>
              </div>
              <div className="method reveal">
                <span className="number">04 / VALIDATE</span>
                <strong>真实验证</strong>
                <p>通过访谈、需求反馈、付费意愿与试点判断价值。</p>
              </div>
              <div className="method reveal">
                <span className="number">05 / CO-CREATE</span>
                <strong>共同创造</strong>
                <p>连接产业、市场与专业伙伴，明确责任和长期收益。</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section proof" id="story">
          <div className="shell philosophy">
            <div className="reveal">
              <div className="eyebrow">03 / MY JOURNEY</div>
              <h2 className="display">
                从产业一线，
                <br />
                走向<span className="gold">AI时代的</span>
                <br />
                <span className="gold">商业创造。</span>
              </h2>
            </div>
            <div className="reveal">
              <p>我的商业实践从电子产业与互联网获客开始，后来参与珠宝制造与市场经营，又逐步接触企业服务、产业合作和海外市场。</p>
              <p>
                跨越不同领域的经历让我越来越相信：新的商业价值，不一定来自全新的资源，也可能来自对已有能力、客户与需求的重新理解和组合。
              </p>
              <p>今天，我希望以独立商业创造者的身份，持续研究机会、构建系统，并与真正有行动力的伙伴在市场中验证。</p>
              <hr className="wide-rule" />
              <div className="kicker">真实商业经验 × 系统化思考 × AI快速创造 × 产业协作</div>
            </div>
          </div>
        </section>

        <section className="section" id="practice">
          <div className="shell">
            <div className="section-head reveal">
              <div className="eyebrow">04 / CURRENT EXPLORATIONS</div>
              <h2 className="display">
                我的实践，
                <br />
                也是我的<span className="gold">持续探索。</span>
              </h2>
              <p>以下是正在建设和验证的方向。它们代表方法与探索过程，不等同于已经得到充分市场验证的商业成果。</p>
            </div>
            <div className="projectgrid">
              <article className="project reveal">
                <div className="project-art">
                  <span>01 / COMMERCIAL CREATION</span>
                  <span className="mark">AI × Business</span>
                </div>
                <div className="project-body">
                  <h3>AI商业机会共创</h3>
                  <p>发现市场机会，定义新产品和商业模式，运用AI制作提案与原型，联合产业伙伴开展真实验证。</p>
                </div>
              </article>
              <article className="project reveal">
                <div className="project-art">
                  <span>02 / GLOBAL PET BUSINESS</span>
                  <span className="mark">VelaPaw</span>
                </div>
                <div className="project-body">
                  <h3>美国宠物业务实践</h3>
                  <p>探索美国宠物门店增长服务、产品供应与中美市场之间的长期业务连接。</p>
                  <a href="https://velapaw.com" target="_blank" rel="noopener noreferrer">
                    访问 VelaPaw ↗
                  </a>
                </div>
              </article>
              <article className="project reveal">
                <div className="project-art">
                  <span>03 / AI BRAND CO-CREATION</span>
                  <span className="mark">PitchPro</span>
                </div>
                <div className="project-body">
                  <h3>呈品 · 品牌新品共创</h3>
                  <p>探索从品牌研究、产品概念、视觉叙事到新品提案的AI辅助商业创造流程。</p>
                  <a href="https://pitchprogo.com" target="_blank" rel="noopener noreferrer">
                    了解 PitchPro ↗
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="people" style={{ background: "#edeee7" }}>
          <div className="shell">
            <div className="section-head reveal">
              <div className="eyebrow">05 / PEOPLE I HOPE TO MEET</div>
              <h2 className="display">
                我希望连接的，
                <br />
                是有创造意愿的<span className="gold">同行者。</span>
              </h2>
              <p>不以行业标签限制彼此。更重要的是价值观、真实能力和行动意愿能否互补。</p>
            </div>
            <div className="fit-grid">
              <div className="fit reveal">
                <span className="big">01</span>
                <div>
                  <h3>产业与制造经营者</h3>
                  <p>拥有产品、技术、生产或专业交付能力，期待探索新产品、新市场与新的商业价值。</p>
                </div>
              </div>
              <div className="fit reveal">
                <span className="big">02</span>
                <div>
                  <h3>品牌与市场渠道伙伴</h3>
                  <p>理解真实客户，拥有品牌、市场或渠道资源，希望共同开发新的产品与服务。</p>
                </div>
              </div>
              <div className="fit reveal">
                <span className="big">03</span>
                <div>
                  <h3>AI技术与专业行动派</h3>
                  <p>擅长研发、产品、设计、海外市场或运营，愿意把专业能力投入真实商业验证。</p>
                </div>
              </div>
              <div className="fit reveal">
                <span className="big">04</span>
                <div>
                  <h3>向往自由生活的同频伙伴</h3>
                  <p>重视真诚、成长、创造与自主权，愿意彼此交流、互助；不以商业合作为前提。</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="cooperate">
          <div className="shell">
            <div className="banner reveal">
              <div>
                <div className="eyebrow">06 / HOW WE WORK TOGETHER</div>
                <h2 className="display">
                  各有所长，价值对等，
                  <br />
                  独立平等，共同创造。
                </h2>
                <p>
                  可以从一次真诚交流、一个值得研究的机会或一次小规模验证开始。若市场证明值得继续，再明确投入、责任、成果归属与长期合作方式。不让友谊成为交易义务，也不让合作失去边界。
                </p>
              </div>
              <a href="/" className="btn">
                走进自在星球 ↗
              </a>
            </div>
          </div>
        </section>

        <section className="closing">
          <div className="shell reveal">
            <div className="eyebrow">CREATE WITH AI · LIVE FREELY</div>
            <div className="display">
              与合适的人同行，
              <br />
              做有价值的事，
              <br />
              <span className="gold">过自由而有品质的生活。</span>
            </div>
            <p>AI自由创造，创造自由生活。</p>
            <a href="/" className="btn" style={{ marginTop: 20 }}>
              www.zizaiplanet.com ↗
            </a>
          </div>
        </section>
      </main>
      <footer className="foot">
        <div className="shell">
          <div>
            <strong>谢昌 · AI自由创造</strong>
            <br />
            <small>独立商业创造者 / AI商业机会发现与共创</small>
          </div>
          <small>© {year} Xie Chang · 让技术服务商业，让商业服务人生。</small>
        </div>
      </footer>
    </div>
  );
}
