import type { Metadata } from "next";
import { ExploreStudio } from "@/components/explore-studio";
import { EXPLORE_SLOGAN } from "@/lib/rooms";

export const metadata: Metadata = { title: "见自己 · 七维自我探索" };

export default function ExplorePage() {
  return (
    <main className="section tight">
      <div className="wrap explore-page-wide">
        <div className="kicker">见自己</div>
        <h1 className="page-title">七维自我探索</h1>
        <p className="help">
          {EXPLORE_SLOGAN} 左侧和向导对话，右侧七维卡随探索逐步点亮；某一维不满意，点该维即可重修。
        </p>
        <ExploreStudio />
      </div>
    </main>
  );
}
