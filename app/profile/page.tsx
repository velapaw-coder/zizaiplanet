import type { Metadata } from "next";
import { ProfileStudio } from "@/components/profile-studio";
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
          <p className="help">「我的向往」是你想成为、想去往的样子——根据七维探索与 AI 分身纪要自动生成，可在每个框里微调后分享。请先登录。</p>
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
  const hasContent = Boolean(profile.experience || profile.expertise || profile.direction);
  const hasSource = sync.ok && sync.source !== "none";
  const autoHint =
    sync.ok && sync.changed
      ? "已根据你的探索方案 / 方向纪要自动生成「我的向往」，不对的地方点框修改即可。"
      : sync.ok && hasSource && hasContent
        ? "这是你想成为 / 想去往的公开摘要；点任意框即可改，不会展示七维聊天私密原文。"
        : "完成七维探索或与 AI 分身生成方向纪要后，这里会自动生成「我的向往」初稿；也可直接在框里写。";

  return (
    <ProfileStudio
      data={{
        displayName: user.display_name || "星球居民",
        slug: profile.slug,
        experience: profile.experience,
        expertise: profile.expertise,
        direction: profile.direction,
        cases: profile.cases,
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
