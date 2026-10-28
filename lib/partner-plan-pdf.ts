import { PDFDocument, rgb } from "pdf-lib";
import type { PartnerPlan } from "./partner";
import { embedPlanCjkFont, loadQrBytes } from "./pdf-cjk-font";

const qrCache = new Map<string, Uint8Array>();

const INK = rgb(0.11, 0.23, 0.26);
const MUTE = rgb(0.43, 0.55, 0.57);
const GREEN = rgb(0.16, 0.61, 0.56);
const LINE = rgb(0.83, 0.89, 0.91);
const PAPER = rgb(0.96, 0.98, 0.98);

async function loadQr(request: Request, path: string): Promise<Uint8Array> {
  const hit = qrCache.get(path);
  if (hit) return hit;
  const bytes = await loadQrBytes(request, path);
  qrCache.set(path, bytes);
  return bytes;
}

function wrapText(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  size: number,
  maxWidth: number,
): string[] {
  const paragraphs = text.replace(/\r/g, "").split("\n");
  const lines: string[] = [];
  for (const para of paragraphs) {
    if (!para) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const ch of para) {
      const trial = current + ch;
      if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
        current = trial;
      } else {
        if (current) lines.push(current);
        current = ch;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : [""];
}

export async function buildPartnerPlanPdf(input: {
  request: Request;
  plan: PartnerPlan;
  displayName?: string | null;
  profileUrl?: string | null;
  qrPath?: string;
}): Promise<Uint8Array> {
  const invite =
    "扫码加入自在星球社区（企业微信）\n方向属于你自己。带着纪要回来，遇见同频的人即可。\n不做站内项目撮合。";
  const footer = `生成于自在星球 · ${new Date().toISOString().slice(0, 10)} · 仅供本人留存与自愿分享`;
  const nameLine = input.displayName ? `为 ${input.displayName} 生成` : "";
  const profileLine = input.profileUrl ? `我的向往：${input.profileUrl}` : "";

  const texts = [
    "自在星球 · AI 分身",
    input.plan.title,
    input.plan.subtitle,
    nameLine,
    input.plan.oneLiner,
    ...input.plan.sections.flatMap((s) => [s.title, s.body]),
    input.plan.closing,
    profileLine,
    invite,
    footer,
  ];

  const qrBytes = await loadQr(input.request, input.qrPath || "/community-wecom-qr.png");
  const doc = await PDFDocument.create();
  const { font, sanitize } = await embedPlanCjkFont(doc, input.request, texts);

  let qrImage: Awaited<ReturnType<PDFDocument["embedPng"]>> | null = null;
  try {
    qrImage = await doc.embedPng(qrBytes);
  } catch {
    try {
      qrImage = await doc.embedJpg(qrBytes);
    } catch {
      qrImage = null;
    }
  }

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensure = (need: number) => {
    if (y - need < margin + 24) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const drawText = (text: string, size: number, color = INK, gap = 4) => {
    const lines = wrapText(sanitize(text), font, size, contentWidth);
    for (const line of lines) {
      ensure(size + gap + 2);
      if (line) page.drawText(line, { x: margin, y: y - size, size, font, color });
      y -= size + gap;
    }
  };

  page.drawRectangle({ x: 0, y: pageHeight - 92, width: pageWidth, height: 92, color: PAPER });
  y = pageHeight - 36;
  drawText("自在星球 · AI 分身", 10, GREEN, 6);
  drawText(input.plan.title, 22, INK, 8);
  drawText(input.plan.subtitle, 10, MUTE, 4);
  if (nameLine) drawText(nameLine, 10, MUTE, 6);
  y -= 8;
  page.drawRectangle({ x: margin, y: y, width: contentWidth, height: 1, color: LINE });
  y -= 18;

  drawText(input.plan.oneLiner, 14, INK, 8);
  y -= 6;

  for (const section of input.plan.sections) {
    ensure(60);
    page.drawRectangle({ x: margin, y: y - 2, width: 18, height: 3, color: GREEN });
    y -= 6;
    drawText(section.title, 13, GREEN, 6);
    drawText(section.body, 11, INK, 5);
    y -= 10;
  }

  ensure(40);
  drawText(input.plan.closing, 11, INK, 6);
  y -= 12;

  if (profileLine) {
    ensure(40);
    drawText(profileLine, 10, MUTE, 6);
  }

  ensure(180);
  page.drawRectangle({
    x: margin,
    y: y - 160,
    width: contentWidth,
    height: 160,
    color: PAPER,
    borderColor: LINE,
    borderWidth: 1,
  });
  const qrSize = 110;
  const qrX = margin + 18;
  const qrY = y - 140;
  if (qrImage) {
    page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  }
  const textX = qrX + qrSize + 18;
  const textMax = contentWidth - qrSize - 50;
  const inviteLines = wrapText(sanitize(invite), font, 11, textMax);
  let ty = y - 36;
  for (const line of inviteLines) {
    page.drawText(line, { x: textX, y: ty, size: 11, font, color: INK });
    ty -= 16;
  }
  y -= 176;

  ensure(30);
  drawText(footer, 9, MUTE, 4);

  return doc.save();
}

export const PARTNER_PDF_FILENAME = "自在星球-方向纪要.pdf";
