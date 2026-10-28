"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

/** 顶栏：认识自己 · AI分身 · 我的向往 · 星球生活志 · AI能量站 · 关于我们（同频家园/茶局仅登录后「我的家园」） */
const SERVICE_LINKS = [
  { href: "/explore", label: "认识自己" },
  { href: "/partner", label: "AI分身" },
  { href: "/profile", label: "我的向往" },
  { href: "/journal", label: "星球生活志" },
  { href: "/energy", label: "AI能量站" },
  { href: "/about", label: "关于我们" },
];

export function SiteHeader({
  user,
  admin,
}: {
  user: { displayName: string } | null;
  admin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const links = [
    ...SERVICE_LINKS,
    ...(user ? [{ href: "/garden/settings", label: "家园后台" }] : []),
    ...(admin ? [{ href: "/admin", label: "运营" }] : []),
  ];
  return (
    <header className="header">
      <div className="wrap nav">
        <a href="/" className="logo" aria-label="自在星球首页">
          <Logo priority />
        </a>
        <nav className="links" aria-label="主要">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={path.startsWith(link.href) ? { color: "#2A9B8F" } : undefined}
            >
              {link.label}
            </a>
          ))}
          {user ? (
            <form action="/api/action" method="post">
              <input type="hidden" name="action" value="logout" />
              <button className="linkish" type="submit">
                退出
              </button>
            </form>
          ) : null}
        </nav>
        {user ? (
          <a className="join" href="/garden">
            我的家园 ↗
          </a>
        ) : (
          <a className="join" href="/join">
            自由创造者 ↗
          </a>
        )}
        <button className="menu" type="button" aria-label="展开菜单" onClick={() => setOpen((value) => !value)}>
          ☰
        </button>
      </div>
      <nav className={open ? "mobile-panel show" : "mobile-panel"}>
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
        <a href={user ? "/garden" : "/join"} onClick={() => setOpen(false)}>
          {user ? "我的家园" : "自由创造者"}
        </a>
        {user ? (
          <form action="/api/action" method="post">
            <input type="hidden" name="action" value="logout" />
            <button className="linkish" type="submit">
              退出登录
            </button>
          </form>
        ) : null}
      </nav>
    </header>
  );
}
