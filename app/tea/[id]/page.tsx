import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/lib/auth";
import { getEvent, userRsvp } from "@/lib/content";
import { formatWhen } from "@/lib/text";

export const metadata: Metadata = { title: "茶局" };

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) {
    return (
      <main className="section tight">
        <div className="wrap stack">
          <h1 className="page-title">星球茶局</h1>
          <div className="warn">
            茶局仅登录后的自由创造者可见。请先
            <a href={`/join?login=1&next=/tea/${id}`}>登录</a>
            ，或从 <a href="/garden">创造者家园</a> 进入。
          </div>
        </div>
      </main>
    );
  }
  const event = await getEvent(id);
  if (!event || event.status !== "approved") notFound();
  const going = await userRsvp(id, user.id);
  return (
    <main className="section tight">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <a className="help" href="/tea">
          ← 茶局
        </a>
        <div className="topic" style={{ marginTop: 18 }}>
          {event.theme}
        </div>
        <h1 className="page-title">{event.title}</h1>
        <p className="help">
          {formatWhen(event.starts_at)} · {event.place}
          <br />
          发起 {event.host_name} · {event.rsvp_count} 人报名
        </p>
        <div className="prose">
          <p>{event.summary}</p>
        </div>
        {user ? (
          <form action="/api/action" method="post">
            <input type="hidden" name="action" value="rsvp" />
            <input type="hidden" name="event_id" value={event.id} />
            <Button type="submit" variant={going ? "outline" : "default"}>
              {going ? "取消报名" : "我来坐坐"}
            </Button>
          </form>
        ) : (
          <p className="help">
            <a href={`/join?login=1&next=/tea/${event.id}`}>登录</a>后可以报名或取消。
          </p>
        )}
      </div>
    </main>
  );
}
