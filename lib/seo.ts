import type { Metadata } from "next";
import { absoluteUrl as assetUrl } from "./text";

export const SITE_URL = "https://www.zizaiplanet.com";
export const SITE_NAME = "自在星球";
export const SITE_TITLE = "自在星球 · AI创造自由";
export const SITE_DESCRIPTION =
  "AI 时代，让每个人活成自己向往的自由。以道驭AI，以创造得自由。见自己、明其道、善用AI，把热爱长成能带来人生自由的生意。";
export const OG_IMAGE_PATH = "/og-default.png";
export const LOGO_PATH = "/logo.png";

/** Absolute URL on the production host. Empty or `/` stays the site origin without a trailing slash. */
export function absoluteUrl(path: string) {
  if (!path || path === "/") return SITE_URL;
  return assetUrl(path, SITE_URL) ?? SITE_URL;
}

/** ISO-8601 for article dates. Naive timestamps are treated as China local time. */
export function toIsoDateTime(value: string | null | undefined) {
  if (!value) return undefined;
  const match = value
    .trim()
    .match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?(Z|[+-]\d{2}:\d{2})?$/);
  if (!match) return undefined;
  const [, date, hh, mm, ss, zone] = match;
  if (!hh) return `${date}T00:00:00+08:00`;
  return `${date}T${hh}:${mm}:${ss ?? "00"}${zone ?? "+08:00"}`;
}

export type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  /** Site path or absolute image. Falls back to the default OG card. */
  image?: string | null;
  imageAlt?: string;
  publishedTime?: string | null;
  /** Login walls and admin. Emits noindex, follow. */
  noindex?: boolean;
};

/**
 * Full page metadata. Vinext replaces `openGraph` / `twitter` as whole objects,
 * so a page that only sets `title` keeps the homepage OG URL. This always sends
 * the page URL, title, description, canonical, and card image together.
 */
export function pageMeta(input: PageMetaInput): Metadata {
  const url = absoluteUrl(input.path);
  const socialTitle = input.path === "/" ? input.title : `${input.title} · ${SITE_NAME}`;
  const imageUrl = input.image ? absoluteUrl(input.image) : absoluteUrl(OG_IMAGE_PATH);
  const image = input.image
    ? { url: imageUrl, alt: input.imageAlt || socialTitle }
    : { url: imageUrl, width: 1200, height: 630, alt: input.imageAlt || SITE_NAME };
  const openGraphBase = {
    locale: "zh_CN" as const,
    siteName: SITE_NAME,
    title: socialTitle,
    description: input.description,
    url,
    images: [image],
  };
  const publishedTime = input.type === "article" ? toIsoDateTime(input.publishedTime) : undefined;

  return {
    title: input.path === "/" ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: url },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph:
      input.type === "article"
        ? { ...openGraphBase, type: "article", ...(publishedTime ? { publishedTime } : {}) }
        : { ...openGraphBase, type: "website" },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: input.description,
      images: [imageUrl],
    },
  };
}

export const PAGE_COPY = {
  home: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    path: "/",
  },
  explore: {
    title: "见自己 · 七维自我探索",
    description:
      "七维自我探索，从经历、品格与生活向往里见自己、明其道，再开启属于你的自由创造。不必套用别人的成功模板。善用AI只负责整理思路，判断仍由你做。以道驭AI，以创造得自由。",
    path: "/explore",
  },
  partner: {
    title: "我的AI分身",
    description:
      "我的AI分身会读取你的七维画像，帮你认清起点、梳理能力，并做方向对话。善用AI，判断仍由你做。方向清楚之后，把想要的自由生活写进我的向往。以道驭AI，以创造得自由。AI自由创造，创造自由生活。",
    path: "/partner",
  },
  profile: {
    title: "我的向往",
    description:
      "写下你想成为、想去往的自由生活。完成见自己，或与AI分身把方向说清楚之后，可以整理成一页可分享的个人页。登录后每一段都能改。判断与表达仍由你做。以道驭AI，以创造得自由。",
    path: "/profile",
  },
  journal: {
    title: "创造手记",
    description:
      "创造手记收录见自己、善用AI、创造自由生活的编辑文章。以道驭AI，以创造得自由。文章由编辑发布，读完可收藏进创造者家园。从阅读里看见自己的道，判断仍由你做，再去创造。",
    path: "/journal",
  },
  energy: {
    title: "善用AI",
    description:
      "善用AI，是为了创造更自由的生活。这里是能量与工具向内容：注册开通、制图视频、本地部署、办公提效与内容流水线。每篇都有步骤与配图，判断仍由你做。理念请看创造手记。",
    path: "/energy",
  },
  about: {
    title: "关于我们",
    description:
      "关于自在星球。我们的定位是AI创造自由，辨识句是以道驭AI，以创造得自由。见自己、明其道、善用AI，把热爱长成能带来人生自由的生意。判断仍由你做。口号是AI自由创造，创造自由生活。",
    path: "/about",
  },
  join: {
    title: "成为自由创造者",
    description:
      "成为自由创造者，从见自己开始。注册后可以善用AI、写下我的向往，并进入创造者家园。已有账号可在此登录。AI创造自由：见自己，明其道，善用AI。判断仍由你做。以道驭AI，以创造得自由。",
    path: "/join",
  },
} as const;

export function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Sitewide Organization + WebSite. No SearchAction: the site has no search URL. */
export function siteJsonLd() {
  const logo = absoluteUrl(LOGO_PATH);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo,
        description: "以道驭AI，以创造得自由。AI自由创造，创造自由生活。",
        slogan: "AI自由创造，创造自由生活",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: "zh-CN",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  datePublished?: string | null;
}) {
  const url = absoluteUrl(input.path);
  const image = input.image ? absoluteUrl(input.image) : absoluteUrl(OG_IMAGE_PATH);
  const datePublished = toIsoDateTime(input.datePublished);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    image: [image],
    ...(datePublished ? { datePublished } : {}),
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(LOGO_PATH),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}
