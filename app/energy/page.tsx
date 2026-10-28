import type { Metadata } from "next";
import { listResources } from "@/lib/content";
import { optimizeRemoteImageUrl } from "@/lib/text";

export const metadata: Metadata = { title: "AI能量站" };

export default async function EnergyPage() {
  const resources = await listResources();
  return (
    <main className="section tight resource">
      <div className="wrap">
        <div className="section-head left">
          <div className="kicker">AI ENERGY STATION</div>
          <h1 className="page-title">AI能量站</h1>
          <p>
            善用AI，是为了创造更自由的生活。这里是工具与操作手册：注册开通、制图视频、本地部署、办公提效与内容流水线。每篇都有步骤与配图，照着做就能干活；理念向内容请看星球生活志。领取后会出现在我的家园。
          </p>
        </div>
        {resources.length === 0 ? <div className="warn">能量站还是空的。</div> : null}
        <div className="resource-grid">
          {resources.map((resource) => (
            <a className="resource-card" key={resource.id} href={`/energy/${resource.slug}`}>
              <div
                className="r-cover"
                style={
                  resource.cover
                    ? { backgroundImage: `url('${optimizeRemoteImageUrl(resource.cover, { width: 480, quality: 60 })}')` }
                    : undefined
                }
                aria-hidden={!resource.cover}
              />
              <div className="r-body">
                <div className="r-icon">{resource.icon}</div>
                <div>
                  <div className="topic">{resource.category}</div>
                  <h3>{resource.title}</h3>
                  <p>{resource.summary}</p>
                  <span>查看 ↗</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
