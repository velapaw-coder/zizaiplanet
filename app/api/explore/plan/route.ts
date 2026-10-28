import { currentUser } from "@/lib/auth";
import type { HomeCard } from "@/lib/compose";
import { savedHome } from "@/lib/content";
import { composeExplorePlan, explorePlanPlainText } from "@/lib/explore-plan";
import { buildExplorePlanPdf, PLAN_PDF_FILENAME } from "@/lib/explore-plan-pdf";
import { buildExploreView } from "@/lib/explore";
import { EXPLORE_COOKIE, parseCookies } from "@/lib/http";
import { getCommunityWecomQrUrl } from "@/lib/site-settings";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const format = (url.searchParams.get("format") || "pdf").toLowerCase();
    const user = await currentUser();
    const cookies = parseCookies(request.headers.get("cookie") || "");
    const exploreId = cookies[EXPLORE_COOKIE] || null;

    let card: HomeCard | null = null;
    let portraitText: string | null = null;
    const displayName = user?.display_name ?? null;

    if (user) {
      const saved = await savedHome(user.id);
      card = saved?.card ?? null;
      try {
        const { db } = await import("@/lib/db");
        const row = await db()
          .prepare(
            `SELECT portrait_text FROM workbench_sessions
             WHERE user_id = ? AND portrait_text IS NOT NULL AND portrait_text != ''
             ORDER BY updated_at DESC LIMIT 1`,
          )
          .bind(user.id)
          .first<{ portrait_text: string }>();
        portraitText = row?.portrait_text ?? null;
      } catch {
        // ignore
      }
    }

    if (!card) {
      const live = await buildExploreView(exploreId);
      card = live.homeCard;
    }

    if (!card || (card.litCount ?? 0) < 1) {
      return Response.json(
        { error: "还没有可生成的探索内容。请先完成至少一维的七维自我探索。" },
        { status: 400 },
      );
    }

    const plan = composeExplorePlan({ card, displayName, portraitText });
    const qrUrl = (await getCommunityWecomQrUrl());

    if (format === "json" || format === "text") {
      return Response.json({
        ok: true,
        plan,
        text: explorePlanPlainText(plan),
        pdfUrl: "/api/explore/plan?format=pdf",
        qrUrl,
      });
    }

    const qrPath = qrUrl.startsWith("/") ? qrUrl : "/community-wecom-qr.png";
    const pdf = await buildExplorePlanPdf({ request, plan, displayName, qrPath });
    const filename = encodeURIComponent(PLAN_PDF_FILENAME);
    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="zizai-explore-plan.pdf"; filename*=UTF-8''${filename}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("explore plan pdf failed", error);
    return Response.json({ error: "方案生成失败，请稍后再试。" }, { status: 500 });
  }
}
