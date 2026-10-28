"use client";

import { useState } from "react";
import { Button } from "./ui/button";

export function ShareBar({ url, title, text }: { url: string; title: string; text: string }) {
  const [note, setNote] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setNote("链接已复制，可以贴到微信。");
    } catch {
      setNote(url);
    }
  }

  async function share() {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({ title, text, url });
      setNote("已交给系统分享。");
    } catch {
      setNote("");
    }
  }

  return (
    <div className="row-actions">
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        复制链接
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={share}>
        系统分享
      </Button>
      <span className="help">在微信里打开后，点右上角还可以再转发给朋友。</span>
      {note ? <span className="help">{note}</span> : null}
    </div>
  );
}
