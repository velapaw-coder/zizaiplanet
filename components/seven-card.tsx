"use client";

import {
  EXPLORE_EXPLAINER,
  EXPLORE_HARVEST,
  EXPLORE_SLOGAN,
  EXPLORE_TAGLINE,
  ROOMS,
  roomById,
  type DimensionId,
} from "@/lib/rooms";

export type SevenCardRoom = {
  dimension: string;
  lit: boolean;
  current?: boolean;
  quote?: string | null;
  evidence?: string;
};

type Props = {
  rooms?: SevenCardRoom[];
  litCount?: number;
  /** compact: garden overview; full: with harvest; studio: right panel beside chat */
  variant?: "full" | "compact" | "studio";
  /** When set, orb click focuses that dimension in chat (no old quiz form). */
  onSelectDimension?: (dimension: DimensionId) => void;
  selecting?: boolean;
};

function mergeRooms(input?: SevenCardRoom[]) {
  const byId = new Map((input ?? []).map((room) => [room.dimension, room]));
  return ROOMS.map((def) => {
    const state = byId.get(def.id);
    return {
      ...def,
      lit: Boolean(state?.lit),
      current: Boolean(state?.current),
      quote: state?.quote ?? null,
      evidence: state?.evidence,
    };
  });
}

export function SevenCard({
  rooms,
  litCount,
  variant = "full",
  onSelectDimension,
  selecting = false,
}: Props) {
  const items = mergeRooms(rooms);
  const lit = litCount ?? items.filter((item) => item.lit).length;
  const interactive = Boolean(onSelectDimension);
  const showHarvest = variant === "full";

  return (
    <section className={`seven-card seven-card-${variant}`} aria-label="七维自我探索卡">
      <div className="seven-card-sky" aria-hidden="true">
        <span className="seven-card-planet" />
        <span className="seven-card-star a">✦</span>
        <span className="seven-card-star b">✧</span>
        <span className="seven-card-star c">✦</span>
      </div>

      <header className="seven-card-brand">
        <span className="seven-card-logo">
          <img src="/logo.png" alt="自在星球" />
        </span>
        <span>
          <b>自在星球</b>
          <small>ZIZAI PLANET</small>
        </span>
      </header>

      <div className="seven-card-title-block">
        <h2 className="seven-card-title">七维自我探索卡</h2>
        <p className="seven-card-title-en">Seven-Dimension Self-Discovery Card</p>
        {variant !== "studio" ? <p className="seven-card-slogan">{EXPLORE_SLOGAN}</p> : null}
      </div>

      <div className="seven-glass dims-glass">
        <div className="seven-glass-head">
          <span>
            <i aria-hidden="true">▣</i> 七个维度 · 已点亮 {lit} / 7
          </span>
          <small>
            {interactive
              ? "对话探索到某一维就会点亮；不满意可点该维重修"
              : "随左侧对话逐步点亮"}
          </small>
        </div>
        <div className="seven-orbs">
          {items.map((room) => {
            const label = `${room.lit ? "重修" : "聚焦"}「${room.name}」：${room.guide}`;
            const className = `seven-orb tone-${room.tone}${room.lit ? " lit" : " dim"}${room.current ? " current" : ""}`;
            if (interactive) {
              return (
                <button
                  type="button"
                  key={room.id}
                  className={className}
                  aria-label={label}
                  disabled={selecting}
                  onClick={() => onSelectDimension?.(room.id)}
                >
                  <span className="seven-orb-glow" aria-hidden="true">
                    <span className="seven-orb-icon">{room.icon}</span>
                  </span>
                  <b>{room.name}</b>
                  <small className="seven-orb-guide">{room.guide}</small>
                  <span className="seven-orb-state">
                    {room.lit ? (
                      <>
                        <span className="seven-orb-lit-line">已点亮 ·</span>
                        <span className="seven-orb-lit-line">可重修</span>
                      </>
                    ) : room.current ? (
                      "进行中"
                    ) : (
                      "待点亮"
                    )}
                  </span>
                </button>
              );
            }
            return (
              <div className={className} key={room.id} aria-label={label}>
                <span className="seven-orb-glow" aria-hidden="true">
                  <span className="seven-orb-icon">{room.icon}</span>
                </span>
                <b>{room.name}</b>
                <small className="seven-orb-guide">{room.guide}</small>
                <span className="seven-orb-state">
                  {room.lit ? "已点亮" : room.current ? "进行中" : "待点亮"}
                </span>
              </div>
            );
          })}
        </div>
        {variant !== "studio" ? <p className="seven-explainer">{EXPLORE_EXPLAINER}</p> : null}
      </div>

      {showHarvest ? (
        <div className="seven-glass harvest-glass">
          <div className="seven-glass-head">
            <span>
              <i aria-hidden="true">✦</i> 探索收获
            </span>
            <small>ZIZAI PLANET</small>
          </div>
          <div className="seven-harvest">
            {EXPLORE_HARVEST.map((item) => (
              <div className="seven-harvest-item" key={item.title}>
                <span className="seven-harvest-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <b>{item.title}</b>
                <small>{item.desc}</small>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <footer className="seven-card-foot">
        <p>— {EXPLORE_TAGLINE} —</p>
        <small>ZIZAI PLANET</small>
      </footer>
    </section>
  );
}

export function roomGuide(id: string | DimensionId) {
  return roomById(id)?.guide ?? "";
}
