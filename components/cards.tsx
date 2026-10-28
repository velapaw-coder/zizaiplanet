import { homeCardTitle, type HomeCard } from "@/lib/compose";
import { DeepExploreNote } from "@/components/deep-explore-note";

export function Notice({ text }: { text?: string }) {
  if (!text) return null;
  return <div className="success">{text}</div>;
}

function normalizeCard(card: HomeCard): HomeCard {
  const litCount = card.litCount ?? card.rooms?.filter((r) => r.lit).length ?? 0;
  const portraitReady = card.portraitReady ?? litCount >= 7;
  return {
    ...card,
    litCount,
    provisional: card.provisional ?? litCount < 7,
    portraitReady,
    directionNote:
      card.directionNote ??
      (portraitReady
        ? "七维已点亮。保存后可在家园查看完整个人画像。"
        : litCount >= 3
          ? `临时方向（已点亮 ${litCount} 维）。继续点亮其余维度，画像会更清楚。`
          : "七维都点亮后，这里会汇总你的向往定位与生活方向。"),
  };
}

export function HomeCardView({ card, showDeepNote = true }: { card: HomeCard; showDeepNote?: boolean }) {
  const view = normalizeCard(card);
  const keywords = view.rooms.flatMap((room) => room.keywords).slice(0, 6);
  return (
    <article className="portrait-card" id="home">
      <div className="pc-top">
        <span>✳ &nbsp; {homeCardTitle(view)}</span>
        <small>{view.provisional ? "仍可继续" : "七维完成"}</small>
      </div>
      <h3>{view.oneLiner}</h3>
      <div className="tagline">来自你的原话 · 默认私密 · 不是诊断或测评</div>
      {keywords.length ? (
        <div className="tagset">
          {keywords.map((word) => (
            <span className="tag" key={word}>
              # {word}
            </span>
          ))}
        </div>
      ) : null}
      <div className="cardquote">向往定位与方向</div>
      <p className="help">{view.directionNote}</p>
      <div className="cardquote">想成为的自己 · {view.identityStatus}</div>
      <p className="help">{view.identityNote}</p>
      {view.privateName ? <p className="help">对自己的命名：{view.privateName}</p> : null}
      <div className="seven" aria-hidden="true">
        {view.rooms.map((room) => (
          <i key={room.dimension} className={room.lit ? "lit" : "dim"} />
        ))}
      </div>
      <div className="pc-bottom">
        <span>
          {view.litCount} / 7 维已点亮 · {view.changeNote}
        </span>
        <span>现状与向往分开写</span>
      </div>
      <div className="stack" style={{ marginTop: 18 }}>
        <p className="help">
          <b>现状 · 品味</b>　{view.lifestyleNow}
        </p>
        <p className="help">
          <b>向往 · 愿景</b>　{view.lifestyleToward}
        </p>
        <p className="help">
          <b>同频邀请</b>　{view.invitation ?? "同频关系还没有原话，先不写邀请。"}
        </p>
        {view.openQuestions.length ? (
          <div>
            <p className="help">
              <b>仍待验证</b>
            </p>
            {view.openQuestions.slice(0, 4).map((item) => (
              <p className="help" key={item}>
                {item}
              </p>
            ))}
          </div>
        ) : null}
        <div>
          <p className="help">
            <b>最小下一步</b>　都是自愿的，不做也不扣什么。
          </p>
          {view.nextSteps.map((item) => (
            <p className="help" key={item}>
              {item}
            </p>
          ))}
        </div>
      </div>
      {showDeepNote && (view.portraitReady || view.litCount >= 3) ? <DeepExploreNote compact /> : null}
    </article>
  );
}
