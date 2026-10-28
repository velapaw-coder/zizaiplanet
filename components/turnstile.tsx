"use client";

import { useEffect } from "react";

export function Turnstile({ siteKey }: { siteKey?: string }) {
  useEffect(() => {
    if (!siteKey) return;
    if (document.querySelector("script[data-turnstile]")) return;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.dataset.turnstile = "true";
    document.body.appendChild(script);
  }, [siteKey]);
  if (!siteKey) return null;
  return <div className="cf-turnstile" data-sitekey={siteKey} style={{ marginTop: 12 }} />;
}
