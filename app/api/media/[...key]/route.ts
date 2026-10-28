import { env } from "cloudflare:workers";

/** Public MEDIA keys served via /api/media/* */
const ALLOWED = /^(posts\/[0-9a-f-]{36}|site\/community-wecom-qr|site\/intro(?:-1080)?\.mp4|site\/about-deck\.pdf)$/;

export async function GET(request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params;
  const path = key.join("/");
  if (!ALLOWED.test(path)) return new Response("找不到该媒体。", { status: 404 });

  const rangeHeader = request.headers.get("Range");
  const object = rangeHeader
    ? await env.MEDIA.get(path, { range: request.headers })
    : await env.MEDIA.get(path);

  if (!object) return new Response("找不到该媒体。", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set(
    "Cache-Control",
    path.endsWith(".mp4")
      ? "public, max-age=604800, stale-while-revalidate=2592000, immutable"
      : "public, max-age=300, must-revalidate",
  );
  if (!headers.has("Content-Type")) {
    headers.set(
      "Content-Type",
      path.endsWith(".mp4")
        ? "video/mp4"
        : path.endsWith(".pdf")
          ? "application/pdf"
          : "application/octet-stream",
    );
  }

  const wantDownload = new URL(request.url).searchParams.get("download") === "1";
  if (wantDownload && path.endsWith(".pdf")) {
    headers.set(
      "Content-Disposition",
      "attachment; filename=\"zizai-planet-about.pdf\"; filename*=UTF-8''%E8%87%AA%E5%9C%A8%E6%98%9F%E7%90%83%E4%BB%8B%E7%BB%8D%E8%B5%84%E6%96%99.pdf",
    );
  } else if (path.endsWith(".pdf")) {
    headers.set("Content-Disposition", 'inline; filename="zizai-planet-about.pdf"');
  } else if (wantDownload && path.endsWith(".mp4")) {
    headers.set(
      "Content-Disposition",
      "attachment; filename=\"zizai-planet-intro.mp4\"; filename*=UTF-8''%E8%87%AA%E5%9C%A8%E6%98%9F%E7%90%83%E4%BB%8B%E7%BB%8D%E8%A7%86%E9%A2%91.mp4",
    );
  }

  // Only emit 206 when the client asked for a Range. Some R2 responses expose
  // a full-object `.range`; treating that as partial breaks plain GET.
  if (rangeHeader && object.range) {
    const { offset, length } = object.range as { offset: number; length?: number };
    const total = object.size;
    const end = length != null ? offset + length - 1 : total - 1;
    headers.set("Content-Range", `bytes ${offset}-${end}/${total}`);
    headers.set("Content-Length", String(end - offset + 1));
    return new Response(object.body, { status: 206, headers });
  }

  headers.set("Content-Length", String(object.size));
  headers.delete("Content-Range");
  return new Response(object.body, { status: 200, headers });
}
