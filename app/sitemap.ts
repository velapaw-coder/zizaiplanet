import type { MetadataRoute } from "next";
import { listArticleSitemapEntries, listResourceSitemapEntries } from "@/lib/content";
import { absoluteUrl, toIsoDateTime } from "@/lib/seo";

export const dynamic = "force-dynamic";

const HUBS: Array<{ path: string; changeFrequency: "weekly" | "monthly"; priority: number }> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/explore", changeFrequency: "weekly", priority: 0.9 },
  { path: "/partner", changeFrequency: "weekly", priority: 0.8 },
  { path: "/profile", changeFrequency: "weekly", priority: 0.8 },
  { path: "/journal", changeFrequency: "weekly", priority: 0.8 },
  { path: "/energy", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/join", changeFrequency: "monthly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hubs: MetadataRoute.Sitemap = HUBS.map((hub) => ({
    url: absoluteUrl(hub.path),
    changeFrequency: hub.changeFrequency,
    priority: hub.priority,
  }));

  let articles: Awaited<ReturnType<typeof listArticleSitemapEntries>> = [];
  let resources: Awaited<ReturnType<typeof listResourceSitemapEntries>> = [];
  try {
    [articles, resources] = await Promise.all([listArticleSitemapEntries(), listResourceSitemapEntries()]);
  } catch (error) {
    console.error("sitemap content query failed", error);
  }

  return [
    ...hubs,
    ...articles.map((article) => ({
      url: absoluteUrl(`/journal/${article.slug}`),
      lastModified: toIsoDateTime(article.published_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...resources.map((resource) => ({
      url: absoluteUrl(`/energy/${resource.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
