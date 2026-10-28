import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { currentUser } from "@/lib/auth";
import { OG_IMAGE_PATH, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, jsonLdScript, siteJsonLd } from "@/lib/seo";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
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
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_PATH],
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(siteJsonLd()) }} />
      </head>
      <body>
        <SiteHeader user={user ? { displayName: user.display_name } : null} admin={user?.role === "admin"} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
