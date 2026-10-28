import type { Metadata } from "next";
import { PartnerStudio } from "@/components/partner-studio";

export const metadata: Metadata = { title: "我的AI分身" };

export default function PartnerPage() {
  return (
    <main className="section tight">
      <div className="wrap explore-page-wide">
        <div className="kicker">认清起点</div>
        <h1 className="page-title">我的 AI 分身</h1>
        <p className="help">
          读取你的七维画像与探索方案，帮你解读自己、梳理能力与经验，并做方向对话。左侧聊天，右侧看要点；方向清晰后可下载纪要 PDF。
        </p>
        <PartnerStudio />
      </div>
    </main>
  );
}
