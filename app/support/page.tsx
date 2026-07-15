import type { Metadata } from "next";
import { getSitePage } from "@/lib/site-pages";
import { FONT, DARK, GRAY, TYPE } from "@/lib/site-type";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
  title: "サポート",
  description:
    "若草フクロウのイラストと世界観づくりの活動を応援できるサポートページ。継続支援・単発の支援を受け付けています。",
  path: "/support",
  keywords: ["サポート", "支援", "若草フクロウ"],
});

export default async function SupportPage() {
  const content = await getSitePage("support");
  const leadJaParagraphs = content.lead.ja.split("\n").filter(Boolean);
  const leadEnParagraphs = content.lead.en.split("\n").filter(Boolean);
  const tiers = content.tiers ?? [];

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 32px", textAlign: "center" }}>
      <p style={{ fontFamily: FONT, fontSize: TYPE.label, color: GRAY, letterSpacing: "0.14em", marginBottom: "16px" }}>SUPPORT</p>
      <h1 style={{ fontFamily: FONT, fontSize: TYPE.heroClamp, fontWeight: 700, color: DARK, lineHeight: 1.4, margin: "0 0 8px", maxWidth: "520px" }}>
        {content.title.ja}
      </h1>
      <p style={{ fontFamily: FONT, fontSize: TYPE.subClamp, color: GRAY, margin: "0 0 48px" }}>
        {content.title.en}
      </p>

      <div style={{ maxWidth: "480px", fontFamily: FONT, fontSize: TYPE.prose, color: DARK, lineHeight: 2, marginBottom: "48px" }}>
        {leadJaParagraphs.map((paragraph) => (
          <p key={paragraph} style={{ margin: "0 0 16px" }}>{paragraph}</p>
        ))}
        {leadEnParagraphs.length > 0 && (
          <p style={{ fontFamily: FONT, fontSize: TYPE.body, color: GRAY }}>
            {leadEnParagraphs.map((line, i) => (
              <span key={line}>
                {line}
                {i < leadEnParagraphs.length - 1 && <br />}
              </span>
            ))}
          </p>
        )}
      </div>

      {content.link && (
        <>
          <a
            href={content.link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block", background: DARK, color: "#F5F5F5", textDecoration: "none", padding: "16px 48px", fontFamily: FONT, fontSize: TYPE.nav, letterSpacing: "0.14em", borderRadius: 4 }}
          >
            {content.link.label}
          </a>
          <p style={{ fontFamily: FONT, fontSize: TYPE.caption, color: GRAY, letterSpacing: "0.08em", marginTop: "16px" }}>月額サポートまたは単発支援</p>
        </>
      )}

      {tiers.length > 0 && (
        <>
          <div style={{ width: "1px", height: "60px", background: "#CCCCCC", margin: "48px 0" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "400px", textAlign: "left" }}>
            {tiers.map((item) => (
              <div key={item.code} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <span style={{ fontFamily: FONT, fontSize: TYPE.badge, color: GRAY, letterSpacing: "0.08em", paddingTop: "3px", flexShrink: 0 }}>
                  {item.code}
                </span>
                <div>
                  <div style={{ fontFamily: FONT, fontSize: TYPE.body, color: DARK }}>{item.label}</div>
                  {item.en && <div style={{ fontFamily: FONT, fontSize: TYPE.nav, color: GRAY }}>{item.en}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
