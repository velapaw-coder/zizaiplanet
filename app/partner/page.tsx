import type { Metadata } from "next";
import { PartnerStudio } from "@/components/partner-studio";
import { PAGE_COPY, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(PAGE_COPY.partner);

export default function PartnerPage() {
  return (
    <main className="section tight">
      <div className="wrap explore-page-wide">
        <div className="kicker">认清起点</div>
        <h1 className="page-title">我的 AI 分身</h1>
        <p className="help">
          善用AI，读取你的七维画像，帮你认清起点、梳理能力，并做方向对话。判断仍由你做。左侧聊天，右侧看要点；方向清晰后可下载纪要 PDF。
        </p>
        <p className="help">
          下一步：<a href="/profile">我的向往</a>
          ，写下自由生活，登录后可分享个人页。
        </p>
        <PartnerStudio />
      </div>
    </main>
  );
}
