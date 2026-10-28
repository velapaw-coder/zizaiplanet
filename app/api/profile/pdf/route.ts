import { currentUser } from "@/lib/auth";
import { aspirationHasContent, resolveAspiration, type AspirationPage } from "@/lib/aspiration";
import { buildProfilePlanPdf, PROFILE_PDF_FILENAME } from "@/lib/profile-plan-pdf";
import { lastCjkFontError, lastCjkFontMode } from "@/lib/pdf-cjk-font";
import { getProfileByUserId, getPublicProfileBySlug } from "@/lib/profile";
import { siteOrigin } from "@/lib/origin";
import { getCommunityWecomQrUrl } from "@/lib/site-settings";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slugParam = (url.searchParams.get("slug") || "").trim().toLowerCase();
    const format = (url.searchParams.get("format") || "pdf").toLowerCase();
    const origin = await siteOrigin();
    const qrUrl = (await getCommunityWecomQrUrl());
    const qrPath = qrUrl.startsWith("/") ? qrUrl : "/community-wecom-qr.png";

    let displayName = "星球居民";
    let experience = "";
    let expertise = "";
    let direction = "";
    let cases = "";
    let aspiration: AspirationPage | null = null;
    let updatedAt: string | null = null;
    let publicUrl: string | null = null;
    let cacheControl = "private, no-store";

    if (slugParam) {
      const pub = await getPublicProfileBySlug(slugParam);
      if (!pub) {
        return Response.json({ error: "该向往页未公开或不存在。" }, { status: 404 });
      }
      displayName = pub.displayName || "星球居民";
      experience = pub.experience || "";
      expertise = pub.expertise || "";
      direction = pub.direction || "";
      cases = pub.cases || "";
      aspiration = pub.aspiration;
      updatedAt = pub.updatedAt || null;
      publicUrl = `${origin.replace(/\/$/, "")}/u/${pub.slug}`;
      cacheControl = "public, max-age=60";
    } else {
      const user = await currentUser();
      if (!user) {
        return Response.json({ error: "请先登录后下载「我的向往」PDF。" }, { status: 401 });
      }
      const profile = await getProfileByUserId(user.id);
      if (!profile) {
        return Response.json({ error: "还没有向往内容，请先保存或重新生成。" }, { status: 400 });
      }
      displayName = user.display_name || "星球居民";
      experience = profile.experience || "";
      expertise = profile.expertise || "";
      direction = profile.direction || "";
      cases = profile.cases || "";
      aspiration = resolveAspiration(profile);
      updatedAt = profile.updated_at || null;
      if (profile.published === 1 && profile.slug) {
        publicUrl = `${origin.replace(/\/$/, "")}/u/${profile.slug}`;
      }
      const hasBody =
        (aspiration && aspirationHasContent(aspiration)) ||
        Boolean(experience.trim() || expertise.trim() || direction.trim() || cases.trim());
      if (!hasBody) {
        return Response.json(
          { error: "还没有可下载的内容。请先完成探索 / AI 分身后重新生成，或在框里填写。" },
          { status: 400 },
        );
      }
    }

    const profilePayload = {
      displayName,
      experience,
      expertise,
      direction,
      cases,
      aspiration,
      publicUrl,
      updatedAt,
    };

    if (format === "json") {
      return Response.json({
        ok: true,
        profile: profilePayload,
        pdfUrl: slugParam
          ? `/api/profile/pdf?slug=${encodeURIComponent(slugParam)}&format=pdf`
          : "/api/profile/pdf?format=pdf",
      });
    }

    const pdf = await buildProfilePlanPdf({
      request,
      profile: profilePayload,
      qrPath,
    });
    const filename = encodeURIComponent(PROFILE_PDF_FILENAME);
    const asciiName = slugParam
      ? `zizai-aspiration-${slugParam}.pdf`
      : "zizai-aspiration.pdf";
    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${filename}`,
        "Cache-Control": cacheControl,
        "X-Zizai-Font": lastCjkFontMode,
        ...(lastCjkFontError ? { "X-Zizai-Font-Error": lastCjkFontError.slice(0, 180) } : {}),
      },
    });
  } catch (error) {
    console.error("profile pdf failed", error);
    return Response.json({ error: "向往 PDF 生成失败，请稍后再试。" }, { status: 500 });
  }
}
