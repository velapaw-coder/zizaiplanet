import { currentUser } from "@/lib/auth";
import { savedHome } from "@/lib/content";
import { composePartnerPlanFromSession, loadPartnerContext } from "@/lib/partner";
import { buildPartnerPlanPdf, PARTNER_PDF_FILENAME } from "@/lib/partner-plan-pdf";
import { db } from "@/lib/db";
import { getProfileByUserId } from "@/lib/profile";
import { getCommunityWecomQrUrl } from "@/lib/site-settings";
;
import { siteOrigin } from "@/lib/origin"
export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return Response.json({ error: "请先登录后下载方向纪要。" }, { status: 401 });

    const url = new URL(request.url);
    const format = (url.searchParams.get("format") || "pdf").toLowerCase();
    const context = await loadPartnerContext(user.id);
    const session = await db()
      .prepare(
        `SELECT direction_summary FROM partner_sessions
         WHERE user_id = ? AND status = 'active'
         ORDER BY updated_at DESC LIMIT 1`,
      )
      .bind(user.id)
      .first<{ direction_summary: string | null }>();
    const saved = await savedHome(user.id);
    const plan = composePartnerPlanFromSession({
      displayName: user.display_name,
      context,
      directionSummary: session?.direction_summary ?? null,
      card: saved?.card ?? null,
    });

    const profile = await getProfileByUserId(user.id);
    const origin = await siteOrigin();
    const profileUrl =
      profile?.published && profile.slug ? `${origin.replace(/\/$/, "")}/u/${profile.slug}` : null;
    const qrUrl = (await getCommunityWecomQrUrl());

    if (format === "json" || format === "text") {
      return Response.json({
        ok: true,
        plan,
        pdfUrl: "/api/partner/plan?format=pdf",
        profileUrl,
        qrUrl,
      });
    }

    if (!plan.directionSummary && context.litCount < 1) {
      return Response.json(
        { error: "还没有可下载的方向纪要。请先完成七维探索，并与 AI 分身对话生成汇总。" },
        { status: 400 },
      );
    }

    const qrPath = qrUrl.startsWith("/") ? qrUrl : "/community-wecom-qr.png";
    const pdf = await buildPartnerPlanPdf({
      request,
      plan,
      displayName: user.display_name,
      profileUrl,
      qrPath,
    });
    const filename = encodeURIComponent(PARTNER_PDF_FILENAME);
    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="zizai-direction-plan.pdf"; filename*=UTF-8''${filename}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("partner plan pdf failed", error);
    return Response.json({ error: "方向纪要生成失败，请稍后再试。" }, { status: 500 });
  }
}
