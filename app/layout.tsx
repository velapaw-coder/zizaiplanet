import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { currentUser } from "@/lib/auth";
import "./globals.css";

export const dynamic = "force-dynamic";

const APP_URL = "https://www.zizaiplanet.com";
const SITE_TITLE = "自在星球 · 看见自己 · 连接同频 · 找到自由生意";
const SITE_DESCRIPTION =
  "帮每个人找到属于自己的自由生意。看见自己，连接同频，把热爱与专长长成能带来人生自由的事业。";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · 自在星球",
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.png", type: "image/png", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "自在星球",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: APP_URL,
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "自在星球" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-default.png"],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let user: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    user = await currentUser();
  } catch (error) {
    console.error(error);
  }
  return (
    <html lang="zh-CN">
      <head>
        {/* System CJK fonts only — no Google Fonts (slow/blocked in CN). */}
        {/* Media-specific LCP preloads: phone gets the small planet. */}
        <link
          rel="preload"
          href="/planet-sm.webp"
          as="image"
          type="image/webp"
          media="(max-width: 700px)"
        />
        <link
          rel="preload"
          href="/planet.webp"
          as="image"
          type="image/webp"
          media="(min-width: 701px)"
        />
        <link rel="preload" href="/logo.webp" as="image" type="image/webp" />
        <meta name="theme-color" content="#f5fafb" />
      </head>
      <body>
        <SiteHeader user={user ? { displayName: user.display_name } : null} admin={user?.role === "admin"} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
