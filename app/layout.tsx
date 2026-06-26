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
