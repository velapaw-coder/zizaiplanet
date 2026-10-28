import { env } from "cloudflare:workers";
import fontkit from "@pdf-lib/fontkit";
import type { PDFDocument, PDFFont } from "pdf-lib";

/**
 * Pre-built ~1.2MB Noto Sans SC subset (GB2312 level-1 + punctuation).
 * Cloudflare Workers disallow WebAssembly.compile() from fetched bytes
 * ("Wasm code generation disallowed by embedder"), so we cannot run
 * harfbuzz-subset.wasm at request time. pdf-lib `{ subset: true }` also
 * breaks CJK advances. Therefore: embed this already-small font with
 * `{ subset: false }` — correct Chinese, no Worker 1102.
 */
const FONT_PATH = "/fonts/NotoSansSC-Plan.ttf";

let cachedFontBytes: Uint8Array | null = null;
let cachedAllowed: Set<number> | null = null;

export let lastCjkFontMode: "plan-font" = "plan-font";
export let lastCjkFontError: string | null = null;

function exactCopy(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.byteLength);
  out.set(bytes);
  return out;
}

async function loadAsset(request: Request, path: string): Promise<Uint8Array> {
  const url = new URL(path, request.url);
  try {
    const assets = (env as { ASSETS?: { fetch: (input: RequestInfo) => Promise<Response> } }).ASSETS;
    if (assets) {
      const res = await assets.fetch(new Request(url.toString()));
      if (res.ok) return exactCopy(new Uint8Array(await res.arrayBuffer()));
    }
  } catch {
    // fall through
  }

  const appUrl = String((env as { APP_URL?: string }).APP_URL || "").replace(/\/$/, "");
  const absolute = appUrl ? `${appUrl}${path}` : url.toString();
  const res = await fetch(absolute);
  if (!res.ok) throw new Error(`无法加载资源 ${path} (${res.status})`);
  return exactCopy(new Uint8Array(await res.arrayBuffer()));
}

async function loadBaseFont(request: Request): Promise<{ bytes: Uint8Array; allowed: Set<number> }> {
  if (cachedFontBytes && cachedAllowed) {
    return { bytes: cachedFontBytes, allowed: cachedAllowed };
  }
  const bytes = await loadAsset(request, FONT_PATH);
  const fk = fontkit.create(bytes);
  const allowed = new Set<number>(fk.characterSet as number[]);
  cachedFontBytes = bytes;
  cachedAllowed = allowed;
  return { bytes, allowed };
}

/** Keep only glyphs present in the plan font; unknown CJK → middle dot. */
export function sanitizeCjkText(text: string, allowed: Set<number>): string {
  let out = "";
  for (const ch of text) {
    if (ch === "\n" || ch === "\r" || ch === "\t") {
      out += ch;
      continue;
    }
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    out += allowed.has(cp) ? ch : "·";
  }
  return out;
}

/**
 * Embed the plan CJK font.
 * Never use pdf-lib `{ subset: true }` (breaks CJK advances).
 * Never embed a multi-MB full Noto SC with `{ subset: false }` (Worker 1102).
 */
export async function embedPlanCjkFont(
  doc: PDFDocument,
  request: Request,
  _texts: string[],
): Promise<{ font: PDFFont; sanitize: (text: string) => string }> {
  const { bytes, allowed } = await loadBaseFont(request);
  const sanitize = (text: string) => sanitizeCjkText(text, allowed);
  doc.registerFontkit(fontkit);
  lastCjkFontMode = "plan-font";
  lastCjkFontError = null;
  const font = await doc.embedFont(bytes, { subset: false });
  return { font, sanitize };
}

export async function loadQrBytes(request: Request, path: string): Promise<Uint8Array> {
  const raw = path.trim();
  let pathname = raw;
  try {
    pathname = raw.startsWith("http") ? new URL(raw).pathname : raw.split("?")[0];
  } catch {
    pathname = raw.split("?")[0];
  }
  const mediaMatch = pathname.match(/^\/api\/media\/(site\/community-wecom-qr)$/);
  if (mediaMatch) {
    try {
      const object = await env.MEDIA.get(mediaMatch[1]);
      if (object) return exactCopy(new Uint8Array(await object.arrayBuffer()));
    } catch {
      // fall through to HTTP / assets
    }
  }
  return loadAsset(request, pathname.startsWith("/") ? pathname : raw);
}
