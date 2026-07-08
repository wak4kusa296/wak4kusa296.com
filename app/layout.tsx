import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/components/AppProviders";
import Nav from "@/components/Nav";
import { getPublishedSitePageSlugs } from "@/lib/site-pages";

export const metadata: Metadata = {
  title: "若草フクロウ：GotoTatsuya｜2D/3D-artist",
  description:
    "2D・3Dアーティスト。少し不思議で空想っぽさのある世界を風景として描いたり、組んだりしています。",
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
      <head>
        {/* Google Fonts: CSS @import はレンダリングブロッキングなので <link> で並列ロード */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=LINE+Seed+JP:wght@400;700&display=swap"
        />
      </head>
      <body>
        <AppProviders>
          <Nav publishedPageSlugs={publishedPageSlugs} />
          <main className="site-main">
            {children}
          </main>
        </AppProviders>
      </body>
    </html>
  );
}
