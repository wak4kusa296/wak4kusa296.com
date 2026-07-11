"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { FONT, DARK, GRAY, TYPE } from "@/lib/site-type";
import { FRAME_BORDER, SITE_HEADER_HEIGHT } from "@/lib/site-frame";

const links = [
  { href: "/", label: "マップ" },
  { href: "/worlds", label: "作品一覧" },
  { href: "/journal", label: "新着情報" },
  { href: "/commission", label: "お問い合わせ", pageSlug: "commission" },
  { href: "/support", label: "Support", pageSlug: "support" },
] as const;

type NavProps = {
  publishedPageSlugs: string[];
};

export default function Nav({ publishedPageSlugs }: NavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [landscape, setLandscape] = useState(true);
  const published = new Set(publishedPageSlugs);
  const visibleLinks = links.filter((link) => !("pageSlug" in link) || published.has(link.pageSlug));

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    const update = () => { setLandscape(mq.matches); if (mq.matches) setOpen(false); };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: SITE_HEADER_HEIGHT,
        borderBottom: !landscape && open ? "none" : FRAME_BORDER,
        background: "rgba(245,245,245,0.92)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        transition: "border-color 0.2s ease",
      }}
    >
      <Link href="/" style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: "1px" }}>
        <span style={{ fontFamily: FONT, fontSize: TYPE.navTitle, fontWeight: 700, color: DARK, letterSpacing: "0.04em", lineHeight: 1.2 }}>若草フクロウ</span>
        <span style={{ fontFamily: FONT, fontSize: TYPE.navSub, color: GRAY, letterSpacing: "0.12em" }}>Goto Tatsuya</span>
      </Link>

      {landscape && (
        <nav style={{ display: "flex", gap: "28px" }}>
          {visibleLinks.map(({ href, label }) => (
            <Link key={href} href={href} style={{ fontFamily: FONT, fontSize: TYPE.nav, letterSpacing: "0.04em", color: pathname === href ? DARK : GRAY, textDecoration: "none", transition: "color 0.2s" }}>
              {label}
            </Link>
          ))}
        </nav>
      )}

      {!landscape && (
        <button onClick={() => setOpen((v) => !v)} aria-label="メニュー" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ display: "block", width: "20px", height: "2px", flexShrink: 0, background: DARK, transition: "all 0.25s", transform: open && i === 0 ? "translateY(6px) rotate(45deg)" : open && i === 2 ? "translateY(-6px) rotate(-45deg)" : "none", opacity: open && i === 1 ? 0 : 1 }} />
          ))}
        </button>
      )}

      {!landscape && (
        <div
          className={`nav-mobile-panel${open ? " nav-mobile-panel--open" : ""}`}
          aria-hidden={!open}
        >
          {visibleLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              style={{
                fontFamily: FONT,
                fontSize: TYPE.small,
                letterSpacing: "0.04em",
                color: pathname === href ? DARK : GRAY,
                textDecoration: "none",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
