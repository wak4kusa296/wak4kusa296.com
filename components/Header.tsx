"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "トップページ" },
  { href: "/journal", label: "ジャーナル" },
  { href: "/profile", label: "経歴紹介" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#EEEEEE]/90 backdrop-blur-sm border-b border-black/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="block hover:opacity-60 transition-opacity"
        >
          <Image
            src="/images/title-logo.png"
            alt="若草フクロウ"
            width={120}
            height={94}
            className="h-auto w-[120px] object-contain"
            priority
          />
        </Link>
        <nav>
          <ul className="flex items-center gap-8">
            {navItems.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`transition-opacity hover:opacity-60 ${
                    pathname === href ? "opacity-100" : "opacity-40"
                  }`}
                  style={{ fontSize: "10px" }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
