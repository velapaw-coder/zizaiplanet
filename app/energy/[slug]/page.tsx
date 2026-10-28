import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Notice } from "@/components/cards";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/lib/auth";
import { getResource, isClaimed } from "@/lib/content";
import { PAGE_COPY, pageMeta } from "@/lib/seo";
import { clip, one, optimizeRemoteImageUrl } from "@/lib/text";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResource(slug);
  if (!resource) return pageMeta({ ...PAGE_COPY.energy, path: `/energy/${slug}`, noindex: true });
  return pageMeta({
    title: resource.title,
    description: clip(resource.summary || resource.body, 110).replace(/…$/, "") || PAGE_COPY.energy.description,
    path: `/energy/${resource.slug}`,
    image: resource.cover,
    imageAlt: resource.title,
  });
}

function renderBlocks(body: string) {
  return body.split(/\n\n+/).map((block, index) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    const image = /^!\[(.*?)\]\((https?:\/\/[^)\s]+)\)\s*$/m.exec(trimmed);
    if (image && trimmed.replace(/\s+/g, " ").match(/^!\[.*?\]\(https?:\/\/[^)\s]+\)$/)) {
      return (
        <figure className="prose-figure" key={`img-${index}`}>
          <img src={optimizeRemoteImageUrl(image[2], { width: 1200, quality: 72 })} alt={image[1] || ""} loading="lazy" decoding="async" />
          {image[1] ? <figcaption>{image[1]}</figcaption> : null}
        </figure>
      );
    }
    if (/^##\s+/.test(trimmed)) {
      return (
        <h2 key={`h2-${index}`} style={{ fontSize: 20, margin: "28px 0 12px", fontFamily: '"Songti SC", "STSong", "SimSun", "Noto Serif SC", serif' }}>
          {trimmed.replace(/^##\s+/, "")}
        </h2>
      );
    }
    if (/^###\s+/.test(trimmed)) {
      return (
        <h3 key={`h3-${index}`} style={{ fontSize: 16, margin: "20px 0 10px" }}>
          {trimmed.replace(/^###\s+/, "")}
        </h3>
      );
    }
    const lines = trimmed.split("\n");
    if (lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line))) {
      const ordered = lines.every((line) => /^\d+\.\s+/.test(line));
      const ListTag = ordered ? "ol" : "ul";
      return (
        <ListTag key={`list-${index}`} style={{ margin: "0 0 16px", paddingLeft: 22, lineHeight: 1.95 }}>
          {lines.map((line, i) => (
            <li key={i}>{line.replace(/^([-*]|\d+\.)\s+/, "")}</li>
          ))}
        </ListTag>
      );
    }
    return <p key={`p-${index}`}>{trimmed}</p>;
  });
}

export default async function ResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const resource = await getResource(slug);
  if (!resource) notFound();
  const user = await currentUser();
  const claimed = await isClaimed(user?.id, resource.id);
  return (
    <main className="section tight">
      <div className="wrap" style={{ maxWidth: 780 }}>
        <a className="help" href="/energy">
          ← 善用AI
        </a>
        <div className="topic" style={{ marginTop: 18 }}>
          {resource.category}
        </div>
        <h1 className="page-title">
          {resource.icon} {resource.title}
        </h1>
        <p className="help">{resource.summary}</p>
        <Notice text={one(query.notice)} />
        {resource.cover ? <div className="cover" style={{ backgroundImage: `url('${optimizeRemoteImageUrl(resource.cover, { width: 1200, quality: 70 })}')` }} /> : null}
        <div className="prose">{renderBlocks(resource.body)}</div>
        {resource.prompt ? (
          <div className="success">
            <strong style={{ display: "block", marginBottom: 6 }}>可复制用法模板 · 怎么用</strong>
            <span style={{ display: "block", marginBottom: 8, opacity: 0.9 }}>
              复制整段到 ChatGPT / Claude / 本地模型对话框；先补全「我的材料」，再发送。不要一次塞未脱敏的客户隐私。
            </span>
            {resource.prompt}
          </div>
        ) : null}
        <form action="/api/action" method="post" className="row-actions">
          <input type="hidden" name="action" value="claim" />
          <input type="hidden" name="resource_id" value={resource.id} />
          <Button type="submit" variant={claimed ? "outline" : "default"}>
            {claimed ? "从创造者家园移出" : "收入创造者家园"}
          </Button>
        </form>
        <div className="row-actions" style={{ marginTop: 12 }}>
          <Button asChild variant="outline">
            <a href="/energy">返回善用AI</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
