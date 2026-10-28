"use client";

import { useEffect, useRef, useState } from "react";
import { ExplorePlanView } from "@/components/explore-plan";
import { SevenCard, type SevenCardRoom } from "@/components/seven-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ExplorePlan } from "@/lib/explore-plan";
import type { DimensionId } from "@/lib/rooms";

type Msg = { id: string; role: "user" | "assistant" | "system"; content: string; createdAt?: string };

type ProgressItem = {
  id: string;
  name: string;
  icon: string;
  tone: string;
  guide: string;
  lit: boolean;
  current: boolean;
  quote?: string | null;
};

type State = {
  user: { id: string; displayName: string } | null;
  llm: { configured: boolean; providerLabel?: string; mock?: boolean };
  session: {
    id: string;
    status: string;
    portraitText: string | null;
    focusDimension?: string | null;
  } | null;
  progress?: ProgressItem[];
  messages: Msg[];
};

function toRooms(progress?: ProgressItem[]): SevenCardRoom[] {
  return (progress || []).map((item) => ({
    dimension: item.id,
    lit: item.lit,
    current: item.current,
    quote: item.quote,
  }));
}

export function ExploreStudio() {
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [mockBanner, setMockBanner] = useState(false);
  const [plan, setPlan] = useState<ExplorePlan | null>(null);
  const [qrUrl, setQrUrl] = useState("/community-wecom-qr.png");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function loadPlan() {
    try {
      const res = await fetch("/api/explore/plan?format=json", { credentials: "same-origin" });
      const data = await res.json();
      if (res.ok && data.ok && data.plan) {
        setPlan(data.plan as ExplorePlan);
        if (data.qrUrl) setQrUrl(String(data.qrUrl));
      }
    } catch {
      // ignore — plan is optional until enough dims lit
    }
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workbench", { credentials: "same-origin" });
      const data = (await res.json()) as State & { error?: string };
      if (!res.ok) throw new Error(data.error || "加载失败");
      setState(data);
      setMockBanner(!data.llm?.configured);
      const lit = (data.progress || []).filter((item: ProgressItem) => item.lit).length;
      if (data.session?.portraitText || lit >= 3) await loadPlan();
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
      const res = await fetch("/api/workbench", {
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
    if (!state?.session) {
      await start();
    }
    setSending(true);
    setError(null);
    const outgoing = text.trim();
    setText("");
    try {
      const res = await fetch("/api/workbench", {
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
          progress: data.progress || prev.progress,
          session: prev.session
            ? {
                ...prev.session,
                portraitText: data.portraitText ?? prev.session.portraitText,
                status: data.portraitText ? "portrait" : prev.session.status,
              }
            : prev.session,
        };
      });
      const lit = (data.progress || []).filter((item: ProgressItem) => item.lit).length;
      if (data.portraitText || lit >= 3) await loadPlan();
    } catch (err) {
      setText(outgoing);
      setError(err instanceof Error ? err.message : "发送失败");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function reset() {
    setSending(true);
    setError(null);
    try {
      await fetch("/api/workbench", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "重置失败");
    } finally {
      setSending(false);
    }
  }

  async function focusDimension(dimension: DimensionId) {
    setSelecting(true);
    setError(null);
    try {
      const res = await fetch("/api/workbench", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "focus", dimension }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "无法聚焦该维");
      await refresh();
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "无法聚焦该维");
    } finally {
      setSelecting(false);
    }
  }

  const messages = state?.messages || [];
  const hasSession = Boolean(state?.session);
  const rooms = toRooms(state?.progress);
  const litCount = rooms.filter((item) => item.lit).length;

  return (
    <div className="explore-studio">
      {mockBanner ? (
        <div className="warn workbench-banner">
          平台暂未接通大模型：当前为演示模式。运营可在后台选择服务商并配置密钥。
        </div>
      ) : null}
      {error ? <div className="warn">{error}</div> : null}

      <div className="explore-studio-grid">
        <section className="explore-chat glass-panel" aria-label="七维自我探索对话">
          <div className="explore-chat-messages" aria-live="polite">
            {loading && !state ? (
              <div className="explore-chat-empty">
                <p className="help">正在打开七维自我探索…</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="explore-chat-empty">
                <div className="kicker">七维自我探索</div>
                <h2 className="serif" style={{ margin: "8px 0 10px", fontSize: 24 }}>
                  和向导聊聊，右侧卡片会跟着点亮
                </h2>
                <p className="help" style={{ maxWidth: 420, margin: "0 auto 18px" }}>
                  按本源、天赋、品味、价值观、身份、同频关系、人生愿景逐层对话。某一维有足够原话就会点亮；不满意可点右侧该维重修。
                </p>
                <Button type="button" onClick={() => void start()} disabled={sending}>
                  开始探索
                </Button>
              </div>
            ) : (
              messages.map((item) => (
                <div
                  className={`explore-chat-row ${item.role === "user" ? "is-user" : "is-assistant"}`}
                  key={item.id}
                >
                  <div className={`explore-chat-bubble ${item.role === "user" ? "you" : "q"}`}>
                    <div className="workbench-msg-body">{item.content}</div>
                  </div>
                </div>
              ))
            )}
            {sending ? (
              <div className="explore-chat-row is-assistant">
                <div className="explore-chat-bubble guide workbench-typing">向导正在想…</div>
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
                    placeholder="用你自己的话回答；也可说「跳过」「下一维」「生成画像」"
                    aria-label="七维自我探索输入"
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
                      开始探索
                    </Button>
                  ) : (
                    <button type="button" className="explore-chat-linkbtn" onClick={() => void reset()} disabled={sending}>
                      新开对话
                    </button>
                  )}
                  <span className="help">Enter 发送 · Shift+Enter 换行</span>
                  {state?.session?.portraitText ? (
                    <a className="help" href="/partner" style={{ color: "#2A9B8F" }}>
                      已生成画像 · 去 AI 分身
                    </a>
                  ) : (
                    <span className="help">已点亮 {litCount} / 7</span>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </section>

        <aside className="explore-studio-card">
          <SevenCard
            variant="studio"
            rooms={rooms}
            litCount={litCount}
            selecting={selecting}
            onSelectDimension={(dimension) => void focusDimension(dimension)}
          />
          {(plan?.portraitReady || litCount >= 7 || Boolean(state?.session?.portraitText)) ? (
            <div className="explore-studio-plan-panel">
              <div className="kicker">自我探索方案</div>
              <p className="help" style={{ margin: "6px 0 12px" }}>
                七维已汇成方案。下一步：找 AI 分身认清起点，写下「我的向往」，再去同频家园交流。
              </p>
              <a className="btn-primary explore-studio-pdf-btn" href="/partner">
                去 AI 分身认清起点
              </a>
              <div className="partner-side-links" style={{ marginTop: 12 }}>
                <a href="/api/explore/plan?format=pdf">下载探索方案 PDF</a>
                <a href="/profile">我的向往（可自动生成）</a>
                <a href="/community">回家园同频</a>
              </div>
              {plan ? (
                <p className="help" style={{ marginTop: 12 }}>
                  <a href="#explore-plan">在下方预览方案全文 →</a>
                </p>
              ) : null}
            </div>
          ) : litCount >= 3 ? (
            <div className="explore-studio-plan-panel is-progress">
              <p className="help" style={{ margin: 0 }}>
                已点亮 {litCount}/7。七维齐备后，这里会出现「下载自我探索方案 PDF」。
              </p>
            </div>
          ) : null}
        </aside>
      </div>

      {plan ? (
        <div style={{ marginTop: 22 }}>
          <ExplorePlanView plan={plan} qrUrl={qrUrl} />
        </div>
      ) : null}
    </div>
  );
}
