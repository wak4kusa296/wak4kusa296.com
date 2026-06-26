import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { getPublishedSitePageSlugs } from "@/lib/site-pages";

export const metadata: Metadata = {
  title: "ごとうたつや",
  description: "イラストレーター / ごとうたつやの作品ポータル",
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishedPageSlugs = [...(await getPublishedSitePageSlugs())];

  return (
    <html lang="ja">
      <body>
        <Nav publishedPageSlugs={publishedPageSlugs} />
        <main className="site-main">
          {children}
        </main>
      </body>
    </html>
  );
}
