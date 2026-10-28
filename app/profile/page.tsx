import type { Metadata } from "next";
import { ProfileStudio } from "@/components/profile-studio";
import { aspirationHasContent, resolveAspiration } from "@/lib/aspiration";
import { currentUser } from "@/lib/auth";
import { ensureProfileDraft, syncProfileFromSources } from "@/lib/profile";
import { siteOrigin } from "@/lib/origin";
import { formatWhen, one } from "@/lib/text";

export const metadata: Metadata = { title: "我的向往" };

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await currentUser();
  if (!user) {
    return (
      <main className="section tight">
        <div className="wrap">
          <h1 className="page-title">我的向往</h1>
          <p className="help">「我的向往」是你想成为、想去往的样子。完成七维探索或 AI 分身后会写成一页可分享的个人页，每一段都能改。请先登录。</p>
          <a className="btn-primary" href="/join?login=1&next=/profile">
            去登录
          </a>
        </div>
      </main>
    );
  }

  const sync = await syncProfileFromSources(user.id, "fill_empty");
  const profile = sync.ok ? sync.profile : await ensureProfileDraft(user.id);
  const origin = await siteOrigin();
  const publicUrl = `${origin.replace(/\/$/, "")}/u/${profile.slug}`;
  const aspiration = resolveAspiration(profile);
  const hasContent = aspirationHasContent(aspiration);
  const hasSource = sync.ok && sync.source !== "none";
  const autoHint =
    sync.ok && sync.changed
      ? "已根据你的探索与方向纪要写成六段。不对的地方直接改，保存后即可分享。"
      : sync.ok && hasSource && hasContent
        ? "这是你想成为、想去往的一页。每一段都能改，不会展示七维聊天私密原文。"
        : "完成七维探索或与 AI 分身生成方向纪要后，这里会按你的原话写成初稿；也可以直接在每一段里写。";

  return (
    <ProfileStudio
      data={{
        displayName: user.display_name || "星球居民",
        slug: profile.slug,
        aspiration,
        published: profile.published === 1,
        updatedAt: formatWhen(profile.updated_at),
        publicUrl,
        notice: one(params.notice),
        autoHint,
        hasSource,
      }}
    />
  );
}
