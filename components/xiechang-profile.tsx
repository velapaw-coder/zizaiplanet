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
            <article className="practice-os reveal">
              <div className="eyebrow">ZIZAI AGENT OS</div>
              <h3>自在 Agent OS</h3>
              <p className="os-lead">面向未来 AI 应用的通用智能体基础平台</p>
              <p>
                统一 AI 核心引擎、长期记忆、知识系统、任务执行和软硬件连接，帮助企业和开发者构建不同场景的持续性智能助理与 AI 产品。
              </p>
              <h4>核心能力</h4>
              <div className="os-caps">
                <div>
                  <strong>AI 核心引擎</strong>
                  <span>理解、推理、规划与协作</span>
                </div>
                <div>
                  <strong>长期记忆</strong>
                  <span>建立持续更新的个人与业务记忆</span>
                </div>
                <div>
                  <strong>知识系统</strong>
                  <span>连接知识库，实现检索、分析与应用</span>
                </div>
                <div>
                  <strong>任务执行</strong>
                  <span>从理解到行动，支持任务拆解与持续跟进</span>
                </div>
                <div>
                  <strong>模块扩展</strong>
                  <span>按场景加载 Skill、工具与能力模块</span>
                </div>
                <div>
                  <strong>软硬件连接</strong>
                  <span>连接 APP、服务、设备与真实场景</span>
                </div>
              </div>
              <h4>平台结构</h4>
              <div className="os-layers">
                <div>
                  <strong>AI 应用层</strong>
                  <span>Personal AI Agent</span>
                  <span>Pet AI</span>
                  <span>Health AI</span>
                  <span>Family AI</span>
                  <span>Enterprise AI</span>
                </div>
                <div>
                  <strong>AI Agent 核心引擎</strong>
                  <span>AI 核心引擎</span>
                  <span>长期记忆</span>
                  <span>知识系统</span>
                  <span>任务执行</span>
                  <span>Skill</span>
                  <span>Tool</span>
                  <span>Workflow</span>
                </div>
                <div>
                  <strong>连接与扩展层</strong>
                  <span>模型</span>
                  <span>API</span>
                  <span>专业服务</span>
                  <span>智能硬件</span>
                  <span>数据系统</span>
                </div>
              </div>
              <h4>对企业</h4>
              <div className="os-values">
                <div>
                  <strong>持续服务的智能助理</strong>
                  <span>不止是一次 AI 对话，而是持续服务的智能助理能力。</span>
                </div>
                <div>
                  <strong>统一底座</strong>
                  <span>支持多场景 AI 产品在同一套能力上落地。</span>
                </div>
                <div>
                  <strong>进入真实场景</strong>
                  <span>连接软件、服务与硬件，让 AI 进入现实世界。</span>
                </div>
              </div>
              <p className="os-for">面向企业的 AI 助理与场景解决方案，提升效率与服务体验。</p>
              <div className="os-scope">
                <span>AI 产品联合开发</span>
                <span>AI + 硬件智能化升级</span>
                <span>垂直行业 AI 应用共创</span>
              </div>
              <p>
                如果你想先看一份写给具体企业的方案，下面两份可以直接查看或下载。它们说明的是可以怎么开始谈，不是已经做完的项目。方案封面上的合作名称是企策AI。
              </p>
              <ul className="practice-files">
                <li>
                  <strong>艾窝创新科技：企业政策赋能与 AI 增长合作方案。</strong>
                  面向宠物用品研发、生产与全球销售。先从企业资料和用工情况做政策适配评估，再讨论 AI 如何进入海外客户、销售和生产协同。其中的 90 天安排是建议路径。
                  <span>
                    <a href="https://os.zizaiplanet.com/cases/aiwo-policy-ai-growth-proposal.pdf" target="_blank" rel="noopener noreferrer">
                      查看
                    </a>
                    <a href="https://os.zizaiplanet.com/cases/aiwo-policy-ai-growth-proposal.pdf" download="艾窝创新科技-企业政策赋能与AI增长合作方案.pdf" rel="noopener noreferrer">
                      下载
                    </a>
                  </span>
                </li>
                <li>
                  <strong>华天启新材：企业政策赋能与 AI 联合创新合作意向。</strong>
                  封面写明是 2026 年 11 月的合作意向。从政策适配筛查切入，再看企业现有业务里的 AI 助手，以及个人助理、家庭助理等联合产品方向。收益和分工写的是另行约定，不是已结算的结果。
                  <span>
                    <a href="https://os.zizaiplanet.com/cases/huatianqi-ai-joint-innovation-proposal.pdf" target="_blank" rel="noopener noreferrer">
                      查看
                    </a>
                    <a href="https://os.zizaiplanet.com/cases/huatianqi-ai-joint-innovation-proposal.pdf" download="华天启新材-企业政策赋能与AI联合创新合作方案.pdf" rel="noopener noreferrer">
                      下载
                    </a>
                  </span>
                </li>
              </ul>
              <a href="https://os.zizaiplanet.com/" target="_blank" rel="noopener noreferrer">
                看看自在 Agent OS ↗
              </a>
            </article>
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
