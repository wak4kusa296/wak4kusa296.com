import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/components/AppProviders";
import Nav from "@/components/Nav";
import { getPublishedSitePageSlugs } from "@/lib/site-pages";
import {
  AUTHOR_NAME,
  DEFAULT_DESCRIPTION,
  OG_IMAGE,
  OG_IMAGE_ALT,
  SEO_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  siteJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s｜${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  authors: [{ name: AUTHOR_NAME, url: SITE_URL }],
  creator: AUTHOR_NAME,
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
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
