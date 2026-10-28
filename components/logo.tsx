export function Logo({
  light = false,
  priority = false,
}: {
  light?: boolean;
  /** Header logo: eager. Footer: leave false for lazy. */
  priority?: boolean;
}) {
  return (
    <>
      <span className="logo-img-wrap">
        <picture>
          <source srcSet="/logo.webp" type="image/webp" />
          <img
            className="logo-img"
            src="/logo.png"
            alt="自在星球"
            width={88}
            height={88}
            decoding="async"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "low"}
          />
        </picture>
      </span>
      <span>
        <b style={light ? { color: "#f4fbfa" } : undefined}>自在星球</b>
        <small style={light ? { color: "#c5e4e0" } : undefined}>ZIZAI PLANET</small>
      </span>
    </>
  );
}
