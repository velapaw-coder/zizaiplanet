"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="section tight">
      <div className="wrap">
        <div className="kicker">暂时中断</div>
        <h1 className="page-title">这一页没有展开。</h1>
        <p className="help">可以再试一次。如果是本地第一次打开，先确认数据库迁移已经跑过。</p>
        <button className="btn-primary" type="button" onClick={() => reset()}>
          再试一次
        </button>
      </div>
    </main>
  );
}
