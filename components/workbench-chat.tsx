"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Msg = { id: string; role: "user" | "assistant" | "system"; content: string; createdAt?: string };

type State = {
  user: { id: string; displayName: string } | null;
  llm: { configured: boolean; providerLabel?: string; mock?: boolean };
  session: {
    id: string;
    presetId?: string;
    model?: string | null;
    status: string;
    portraitText: string | null;
  } | null;
  messages: Msg[];
};

export function WorkbenchChat() {
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
      const res = await fetch("/api/workbench", { credentials: "same-origin" });
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
          session: prev.session
            ? {
                ...prev.session,
                portraitText: data.portraitText ?? prev.session.portraitText,
                status: data.portraitText ? "portrait" : prev.session.status,
              }
            : prev.session,
        };
      });
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

  if (loading && !state) {
    return <div className="q-panel explore-chat-shell">正在打开七维自我探索…</div>;
  }

  const messages = state?.messages || [];
  const hasSession = Boolean(state?.session);

  return (
    <div className="explore-chat-shell">
      {mockBanner ? (
        <div className="warn workbench-banner">
          平台暂未接通大模型：当前为演示模式，可走完对话流程，回答由站内脚本生成。运营可在后台选择服务商并配置密钥。
        </div>
      ) : null}
      {error ? <div className="warn">{error}</div> : null}

      <div className="explore-chat glass-panel" role="log" aria-label="七维自我探索对话">
        <div className="explore-chat-messages" aria-live="polite">
          {messages.length === 0 ? (
            <div className="explore-chat-empty">
              <div className="kicker">七维自我探索</div>
              <h2 className="serif" style={{ margin: "8px 0 10px", fontSize: 26 }}>
                和向导聊聊，找清自己的方向
              </h2>
              <p className="help" style={{ maxWidth: 420, margin: "0 auto 18px" }}>
                按本源、天赋、品味、价值观、身份、同频关系、人生愿景逐层对话。结束后生成《七维个人定位画像》，并尽量写回家园。
              </p>
              {!hasSession ? (
                <Button type="button" onClick={() => void start()} disabled={sending}>
                  开始探索
                </Button>
              ) : null}
            </div>
          ) : (
            messages.map((item) => (
              <div
                className={`explore-chat-row ${item.role === "user" ? "is-user" : item.role === "assistant" ? "is-assistant" : "is-guide"}`}
                key={item.id}
              >
                <div className={`explore-chat-bubble ${item.role === "user" ? "you" : item.role === "assistant" ? "q" : "guide"}`}>
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
          {hasSession ? (
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
                <button type="button" className="explore-chat-linkbtn" onClick={() => void reset()} disabled={sending}>
                  新开对话
                </button>
                <span className="help">Enter 发送 · Shift+Enter 换行</span>
                {state?.session?.portraitText ? (
                  <a className="help" href="/garden" style={{ color: "#2A9B8F" }}>
                    已生成画像 · 去家园查看
                  </a>
                ) : null}
              </div>
            </>
          ) : messages.length > 0 ? (
            <div className="row-actions">
              <Button type="button" onClick={() => void start()} disabled={sending}>
                开始探索
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
