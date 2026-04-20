"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "トップページ" },
  { href: "/journal", label: "ジャーナル" },
  { href: "/profile", label: "経歴紹介" },
];
const mailSubject = encodeURIComponent("お仕事のご依頼");
const mailBody = encodeURIComponent(
  [
    "若草フクロウ（五嶋龍也）様",
    "",
    "お世話になっております。お仕事のご相談です。",
    "",
    "【ご依頼内容】",
    "",
    "【ご希望納期】",
    "",
    "【ご予算】",
    "",
    "【掲載媒体 / 用途】",
    "",
    "【参考資料】",
    "",
    "【ご連絡先】",
    "",
    "どうぞよろしくお願いいたします。",
  ].join("\n")
);
const mailHref = `mailto:wak4kusa296@gmail.com?subject=${mailSubject}&body=${mailBody}`;

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-3 z-50 h-7 w-7 flex flex-col items-center justify-center gap-[3px]"
        onClick={() => setOpen((v) => !v)}
        aria-label="メニュー"
      >
        <span
          className={`block h-[2.5px] w-5 rounded-full bg-[#161616] transition-all duration-300 ${open ? "translate-y-[5px] rotate-45" : ""}`}
        />
        <span
          className={`block h-[2.5px] w-5 rounded-full bg-[#161616] transition-all duration-300 ${open ? "opacity-0" : ""}`}
        />
        <span
          className={`block h-[2.5px] w-5 rounded-full bg-[#161616] transition-all duration-300 ${open ? "-translate-y-[5px] -rotate-45" : ""}`}
        />
      </button>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-transparent"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-[100dvh] w-screen lg:w-[25vw]
          bg-[rgba(248,248,246,1)] border-r border-black/5
          flex flex-col px-6 py-8
          transition-opacity duration-300
          lg:opacity-100 lg:pointer-events-auto
          ${open ? "opacity-100" : "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"}
        `}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-12 text-center">
          <Link
            href="/"
            className="block hover:opacity-60 transition-opacity"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/images/title-logo.png"
              alt="若草フクロウ"
              width={140}
              height={110}
              className="h-auto w-[140px] object-contain"
              priority
            />
          </Link>

          <nav>
            <ul className="space-y-5">
              {navItems.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`transition-opacity hover:opacity-60 ${
                      pathname === href ? "opacity-100" : "opacity-30"
                    } font-bold`}
                    style={{ fontSize: "12px" }}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="pb-2 text-center">
          <a
            href={mailHref}
            className="inline-block tracking-widest uppercase border border-[#161616] px-8 py-3 hover:bg-[#161616] hover:text-[#EEEEEE] transition-colors rounded"
            style={{ fontSize: "10px" }}
            onClick={() => setOpen(false)}
          >
            メールで依頼する
          </a>
        </div>
      </aside>
    </>
  );
}
