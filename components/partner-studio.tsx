"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Msg = { id: string; role: "user" | "assistant" | "system"; content: string; createdAt?: string };

type Context = {
  litCount: number;
  portraitReady: boolean;
  oneLiner: string | null;
  directionNote: string | null;
  roomSummaries: Array<{ name: string; quote: string | null; summary: string; lit: boolean }>;
  portraitText: string | null;
  profileDirection: string | null;
  profileExpertise: string | null;
  profileExperience: string | null;
};

type State = {
  user: { id: string; displayName: string } | null;
  llm: { configured: boolean; providerLabel?: string; mock?: boolean };
  session: { id: string; status: string; directionSummary: string | null; updatedAt?: string } | null;
  context: Context | null;
  messages: Msg[];
};

export function PartnerStudio() {
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [mockBanner, setMockBanner] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/partner", { credentials: "same-origin" });
      const data = (await res.json()) as State & { error?: string };
      if (!res.ok) throw new Error(data.error || "加载失败");
      setState(data);
      setMockBanner(!data.llm?.configured);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [state?.messages.length, sending]);

  async function start() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/partner", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "无法开始");
      setMockBanner(Boolean(data.mock));
      await refresh();
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "无法开始");
    } finally {
      setSending(false);
    }
  }

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    const outgoing = text.trim();
    setText("");
    try {
      const res = await fetch("/api/partner", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", text: outgoing }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "发送失败");
      setMockBanner(Boolean(data.mock));
      setState((prev) => {
        if (!prev) return prev;
        const nextMsgs = [...prev.messages];
        if (data.userMessage) nextMsgs.push(data.userMessage);
        if (data.message) nextMsgs.push(data.message);
        return {
          ...prev,
          messages: nextMsgs,
          context: data.context ?? prev.context,
          session: prev.session
            ? {
                ...prev.session,
                directionSummary: data.directionSummary ?? prev.session.directionSummary,
              }
            : prev.session,
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送失败");
      setText(outgoing);
    } finally {
      setSending(false);
    }
  }

  async function reset() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/partner", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "无法重开");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "无法重开");
    } finally {
      setSending(false);
    }
  }

  if (loading && !state) {
    return <div className="warn">正在打开 AI 分身…</div>;
  }

  if (!state?.user) {
    return (
      <div className="warn">
        AI 分身只对自由创造者开放，需要读取你的七维画像做方向对话。
        <a href="/join?login=1&next=/partner" style={{ marginLeft: 8 }}>
          去登录 →
        </a>
      </div>
    );
  }

  const ctx = state.context;
  const hasSession = Boolean(state.session);
  const messages = state.messages;
  const summary = state.session?.directionSummary;
  const litRooms = (ctx?.roomSummaries || []).filter((r) => r.lit);

  return (
    <div className="partner-studio">
      {mockBanner ? (
        <div className="warn" style={{ marginBottom: 12 }}>
          当前为演示模式（未配置大模型密钥）。对话逻辑可用，回复为示意内容。
        </div>
      ) : null}
      {error ? <div className="warn" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="partner-studio-grid">
        <section className="partner-chat-panel explore-chat-panel">
          <div className="partner-chat-scroll explore-chat-scroll">
            {!hasSession && messages.length === 0 ? (
              <div className="explore-chat-row is-assistant">
                <div className="explore-chat-bubble guide">
                  <p style={{ margin: 0 }}>
                    你好，{state.user.displayName}。我是你的 AI 分身——读你的七维画像，帮你认清起点、梳理能力，并聊清楚长期方向。
                  </p>
                  <p className="help" style={{ margin: "10px 0 0" }}>
                    不做项目推荐，也不做站内撮合。准备好了就点「开始对话」。
                  </p>
                  <div style={{ marginTop: 14 }}>
                    <Button type="button" onClick={() => void start()} disabled={sending}>
                      开始对话
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`explore-chat-row ${msg.role === "user" ? "is-user" : "is-assistant"}`}
              >
                <div className={`explore-chat-bubble ${msg.role === "user" ? "you" : "guide"}`}>
                  {msg.content.split("\n").map((line, i) => (
                    <p key={`${msg.id}-${i}`} style={{ margin: i === 0 ? 0 : "8px 0 0" }}>
                      {line || "\u00a0"}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {sending ? (
              <div className="explore-chat-row is-assistant">
                <div className="explore-chat-bubble guide workbench-typing">分身正在想…</div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="explore-chat-composer">
            {hasSession || messages.length > 0 ? (
              <>
                <div className="explore-chat-input-wrap">
                  <Textarea
                    ref={inputRef}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="聊聊你的经历、能力或向往；也可说「帮我汇总方向」"
                    aria-label="AI 分身输入"
                    rows={1}
                    className="explore-chat-input"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void send();
                      }
                    }}
                  />
                  <Button type="button" onClick={() => void send()} disabled={sending || !text.trim()}>
                    发送
                  </Button>
                </div>
                <div className="explore-chat-toolbar">
                  {!hasSession ? (
                    <Button type="button" size="sm" onClick={() => void start()} disabled={sending}>
                      开始对话
                    </Button>
                  ) : (
                    <button type="button" className="explore-chat-linkbtn" onClick={() => void reset()} disabled={sending}>
                      新开对话
                    </button>
                  )}
                  <span className="help">Enter 发送 · Shift+Enter 换行</span>
                </div>
              </>
            ) : null}
          </div>
        </section>

        <aside className="partner-side-panel">
          <div className="partner-side-card">
            <div className="kicker">画像与方向要点</div>
            <h2 className="serif" style={{ fontSize: 22, margin: "6px 0 10px" }}>
              {ctx?.oneLiner || "完成七维后，这里会浮现你的本源一句"}
            </h2>
            <p className="help" style={{ margin: 0 }}>
              七维进度 {ctx?.litCount ?? 0}/7
              {ctx?.portraitReady ? " · 画像已齐" : ""}
              {ctx && ctx.litCount < 1 ? (
                <>
                  {" · "}
                  <a href="/explore">先去认识自己</a>
                </>
              ) : null}
            </p>
            {ctx?.directionNote ? (
              <p className="help" style={{ marginTop: 12 }}>
                <b>向往定位</b>
                <br />
                {ctx.directionNote}
              </p>
            ) : null}
            {ctx?.profileExpertise || ctx?.profileDirection ? (
              <p className="help" style={{ marginTop: 12 }}>
                <b>向往空间要点</b>
                <br />
                {ctx.profileExpertise ? `专长：${ctx.profileExpertise}` : null}
                {ctx.profileExpertise && ctx.profileDirection ? <br /> : null}
                {ctx.profileDirection ? `方向：${ctx.profileDirection}` : null}
              </p>
            ) : null}
            {litRooms.length ? (
              <div style={{ marginTop: 14 }}>
                <p className="help" style={{ marginBottom: 6 }}>
                  <b>已点亮维度</b>
                </p>
                <ul className="partner-dim-list">
                  {litRooms.map((room) => (
                    <li key={room.name}>
                      <span className="partner-dim-name">{room.name}</span>
                      {room.quote ? <span className="help">「{room.quote.slice(0, 48)}{room.quote.length > 48 ? "…" : ""}」</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="partner-side-card">
            <div className="kicker">方向纪要</div>
            {summary ? (
              <>
                <p className="help" style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                  {summary.slice(0, 600)}
                  {summary.length > 600 ? "…" : ""}
                </p>
                <a className="btn-primary" href="/api/partner/plan?format=pdf" style={{ display: "inline-flex", marginTop: 12 }}>
                  下载方向纪要 PDF
                </a>
              </>
            ) : (
              <p className="help" style={{ marginTop: 8 }}>
                对话深入后，对分身说「帮我汇总方向」，这里会出现纪要，并支持下载 PDF。
              </p>
            )}
            <div className="partner-side-links">
              <a href="/profile">查看自动生成的「我的向往」 →</a>
              <a href="/community">去同频家园 →</a>
              <a href="/garden#growth">回我的家园 · 成长空间 →</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
