import { ASPIRATION_SECTIONS, type AspirationPage } from "@/lib/aspiration";

function initialOf(name: string) {
  const text = name.trim();
  return text ? text.slice(0, 1) : "星";
}

function Quiet() {
  return <p className="pp-quiet">这一段还在长。</p>;
}

export function AspirationDocument({
  name,
  page,
}: {
  name: string;
  page: AspirationPage;
}) {
  const [story, believe, practice, longing, resonance] = ASPIRATION_SECTIONS.slice(1);

  return (
    <>
      <header className="pp-hero">
        <div className="pp-orb" aria-hidden>
          <span>{initialOf(name)}</span>
        </div>
        <div className="pp-hero-text">
          <p className="pp-kicker">自在星球 · 我的向往</p>
          <h1 className="pp-name">{name}</h1>
          <h2 className="pp-claim-label">{ASPIRATION_SECTIONS[0].title}</h2>
          {page.claim.sentence ? <p className="pp-tagline">{page.claim.sentence}</p> : <Quiet />}
          {page.claim.keywords.length ? (
            <div className="pp-tags" aria-label="关键词">
              {page.claim.keywords.map((tag) => (
                <span key={tag} className="pp-tag">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="pp-sections">
        <section className="pp-sec" aria-labelledby="asp-story">
          <h2 id="asp-story">{story.title}</h2>
          {page.story.nodes.length ? (
            <ol className="pp-story">
              {page.story.nodes.map((node, index) => (
                <li key={`${node.when}-${node.title}-${index}`} className="pp-node">
                  {node.when ? <div className="pp-node-when">{node.when}</div> : null}
                  {node.title ? <h3 className="pp-node-title">{node.title}</h3> : null}
                  {node.detail ? <p className="pp-node-detail">{node.detail}</p> : null}
                </li>
              ))}
            </ol>
          ) : (
            <Quiet />
          )}
        </section>

        <section className="pp-sec" aria-labelledby="asp-believe">
          <h2 id="asp-believe">{believe.title}</h2>
          {page.believe.points.length || page.believe.closing ? (
            <>
              {page.believe.points.length ? (
                <ul className="pp-points">
                  {page.believe.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : null}
              {page.believe.closing ? <p className="pp-closing">{page.believe.closing}</p> : null}
            </>
          ) : (
            <Quiet />
          )}
        </section>

        <section className="pp-sec" aria-labelledby="asp-practice">
          <h2 id="asp-practice">{practice.title}</h2>
          {page.practice.steps.length ? (
            <ol className="pp-flow">
              {page.practice.steps.map((step, index) => (
                <li key={`${step.name}-${index}`} className="pp-flow-step">
                  <div className="pp-flow-no" aria-hidden>
                    {index + 1}
                  </div>
                  {step.name ? <h3>{step.name}</h3> : null}
                  {step.detail ? <p>{step.detail}</p> : null}
                </li>
              ))}
            </ol>
          ) : (
            <Quiet />
          )}
        </section>

        <section className="pp-sec" aria-labelledby="asp-longing">
          <div className="pp-longing">
            <h2 id="asp-longing">{longing.title}</h2>
            {page.longing.keywords.length ? (
              <div className="pp-tags">
                {page.longing.keywords.map((word) => (
                  <span key={word} className="pp-tag">
                    {word}
                  </span>
                ))}
              </div>
            ) : null}
            {page.longing.line ? <p className="pp-longing-line">{page.longing.line}</p> : null}
            {!page.longing.keywords.length && !page.longing.line ? <Quiet /> : null}
          </div>
        </section>

        <section className="pp-sec" aria-labelledby="asp-resonance">
          <h2 id="asp-resonance">{resonance.title}</h2>
          {page.resonance.groups.length ? (
            <div className="pp-people">
              {page.resonance.groups.map((group, index) => (
                <article key={`${group.who}-${index}`} className="pp-person">
                  <div className="pp-person-row">
                    <span className="pp-person-label">他们是谁</span>
                    <p>{group.who}</p>
                  </div>
                  <div className="pp-person-row">
                    <span className="pp-person-label">共同方向</span>
                    <p>{group.direction}</p>
                  </div>
                  <div className="pp-person-row">
                    <span className="pp-person-label">连接方式</span>
                    <p>{group.connect}</p>
                  </div>
                  {group.goal ? (
                    <div className="pp-person-goal">
                      <span className="pp-person-label">共同目标</span>
                      <p>{group.goal}</p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <Quiet />
          )}
        </section>
      </div>
    </>
  );
}
