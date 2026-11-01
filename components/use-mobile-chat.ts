"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/**
 * Keep a fixed mobile composer above the on-screen keyboard.
 * `vh` does not shrink when the keyboard opens; visualViewport does.
 * Returns a callback ref for the composer element.
 */
export function useKeyboardInset() {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const setComposer = useCallback((el: HTMLElement | null) => {
    setNode(el);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;

    let lastInset = 0;
    const apply = () => {
      const inset = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
      root.style.setProperty("--keyboard-inset", `${Math.round(inset)}px`);
      if (node?.classList.contains("is-active") && node.offsetHeight > 0) {
        root.style.setProperty("--composer-space", `${Math.round(node.offsetHeight)}px`);
      } else {
        root.style.removeProperty("--composer-space");
      }
      // When the keyboard opens, bring the latest line up above the docked composer.
      if (inset > 80 && lastInset <= 80 && node?.contains(document.activeElement)) {
        node.closest("section")?.querySelector(".chat-scroll-anchor")?.scrollIntoView({ block: "nearest" });
      }
      lastInset = inset;
    };

    apply();
    let observer: ResizeObserver | null = null;
    if (node) {
      observer = new ResizeObserver(apply);
      observer.observe(node);
    }
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      observer?.disconnect();
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("orientationchange", apply);
      root.style.removeProperty("--keyboard-inset");
      root.style.removeProperty("--composer-space");
    };
  }, [node]);

  return setComposer;
}

/**
 * After the first successful load, follow new messages.
 * The opening paint stays at the top so the intro can be read.
 */
export function useScrollLatest(anchorRef: RefObject<HTMLElement | null>, signal: string, enabled: boolean) {
  const primed = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    if (!primed.current) {
      primed.current = true;
      return;
    }
    const anchor = anchorRef.current;
    if (!anchor) return;
    const scroller = anchor.parentElement;
    if (scroller && scroller.scrollHeight > scroller.clientHeight + 4) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
      return;
    }
    anchor.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [anchorRef, signal, enabled]);
}
