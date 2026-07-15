import type { Metadata } from "next";
import JournalPageClient from "@/components/JournalPageClient";
import { getJournalEntries } from "@/lib/journal";
import { FONT, DARK, GRAY, TYPE } from "@/lib/site-type";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
  title: "ジャーナル",
  description:
    "若草フクロウの制作ノート。日々の作品づくりや、イラストと世界観について考えていることを書き留めています。",
  path: "/journal",
  keywords: ["制作ノート", "ジャーナル", "若草フクロウ", "イラスト"],
});

export default async function JournalPage() {
  const entries = await getJournalEntries();

  return (
    <div style={{ minHeight: "100%", padding: "48px 32px" }}>
      <div style={{ maxWidth: "660px", margin: "0 auto" }}>
        <p style={{ fontFamily: FONT, fontSize: TYPE.label, color: GRAY, letterSpacing: "0.14em", marginBottom: "12px" }}>JOURNAL</p>
        <h1 style={{ fontFamily: FONT, fontSize: TYPE.heading, fontWeight: 700, color: DARK, marginBottom: "4px" }}>ジャーナル</h1>
        <p style={{ fontFamily: FONT, fontSize: TYPE.lead, color: GRAY, marginBottom: "48px" }}>Notes &amp; Reflections</p>

        <JournalPageClient entries={entries} />
      </div>
    </div>
  );
}
