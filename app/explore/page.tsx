import type { Metadata } from "next";
import { ExploreStudio } from "@/components/explore-studio";
import { EXPLORE_SLOGAN } from "@/lib/rooms";
import { PAGE_COPY, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(PAGE_COPY.explore);

export default function ExplorePage() {
  return (
    <main className="section tight">
      <div className="wrap explore-page-wide">
        <div className="kicker">见自己</div>
        <h1 className="page-title">七维自我探索</h1>
        <p className="help">
          {EXPLORE_SLOGAN} 左侧和向导对话，右侧七维卡随探索逐步点亮；某一维不满意，点该维即可重修。
        </p>
        <p className="help">
          下一步：<a href="/partner">我的AI分身</a>
          ，善用AI认清起点、做方向对话。判断仍由你做。
        </p>
        <ExploreStudio />
      </div>
    </main>
  );
}
