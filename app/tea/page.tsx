import type { Metadata } from "next";
import { Notice } from "@/components/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { currentUser } from "@/lib/auth";
import { listEvents, myProposals } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { formatWhen, one } from "@/lib/text";

export const metadata: Metadata = pageMeta({
  title: "星球茶局",
  description: "创造者之间的茶局，登录后可见。",
  path: "/tea",
  noindex: true,
});

export default async function TeaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await currentUser();
  if (!user) {
    return (
      <main className="section tight">
        <div className="wrap stack">
          <div className="section-head left">
            <div className="kicker">TEA GATHERINGS</div>
            <h1 className="page-title">星球茶局</h1>
            <p>创造者之间的活动，不对站外公开浏览。</p>
          </div>
          <div className="warn">
            请先
            <a href="/join?login=1&next=/tea">登录 / 成为自由创造者</a>
            ，再从「创造者家园」进入茶局。
          </div>
          <p className="help">
            <a href="/garden">回创造者家园</a>
            {" · "}
            <a href="/">回首页</a>
          </p>
        </div>
      </main>
    );
  }
  const events = await listEvents();
  const proposals = await myProposals(user.id);
  return (
    <main className="section tight">
      <div className="wrap stack">
        <div className="section-head left">
          <div className="kicker">TEA GATHERINGS</div>
          <h1 className="page-title">星球茶局</h1>
          <p>轻一点的相聚。报名和取消都随意，提议会先经过审核。通过之后，提议人会成为茶主。</p>
        </div>
        <p className="help">
          <a href="/garden">← 回创造者家园</a>
        </p>
        <Notice text={one(params.notice)} />
        {events.length === 0 ? <div className="warn">现在没有公开的茶局。</div> : null}
        <div className="content-grid">
          {events.map((event) => (
            <article className="share" key={event.id}>
              <div className="topic">{event.theme}</div>
              <h2 className="serif" style={{ fontSize: 24 }}>
                {event.title}
              </h2>
              <p className="help">{event.summary}</p>
              <p className="help">
                {formatWhen(event.starts_at)} · {event.place}
                <br />
                {event.host_name} · {event.rsvp_count} 人报名
              </p>
              <a href={`/tea/${event.id}`}>查看并报名 →</a>
            </article>
          ))}
        </div>
        {proposals.length ? (
          <section>
            <h2 className="serif" style={{ fontSize: 24 }}>
              我提过的
            </h2>
            {proposals.map((event) => (
              <p className="help" key={event.id}>
                {event.title} · {event.status === "pending" ? "审核中" : event.status === "approved" ? "已公开" : "未通过"}
              </p>
            ))}
          </section>
        ) : null}
        <section className="share">
          <h2 className="serif" style={{ fontSize: 24, marginTop: 0 }}>
            提议一场
          </h2>
          {user ? (
            <form action="/api/action" method="post">
              <input type="hidden" name="action" value="propose" />
              <div className="field">
                <Label htmlFor="title">名称</Label>
                <Input id="title" name="title" required maxLength={40} placeholder="例如：周三傍晚的阅读" />
              </div>
              <div className="field">
                <Label htmlFor="theme">主题</Label>
                <Input id="theme" name="theme" required maxLength={16} placeholder="读书 / 生活 / AI体验" />
              </div>
              <div className="field">
                <Label htmlFor="starts_at">时间</Label>
                <Input id="starts_at" name="starts_at" type="datetime-local" required />
              </div>
              <div className="field">
                <Label htmlFor="place">地点</Label>
                <Input id="place" name="place" defaultValue="线上语音" maxLength={24} />
              </div>
              <div className="field">
                <Label htmlFor="summary">介绍</Label>
                <Textarea id="summary" name="summary" required placeholder="这场茶局会怎样度过，谁适合来。" />
              </div>
              <Button type="submit">提交审核</Button>
            </form>
          ) : (
            <p className="help">
              <a href="/join?login=1&next=/tea">登录</a>后可以提议茶局。
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
