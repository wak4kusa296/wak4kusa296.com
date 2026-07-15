import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import WorldArtworkGrid from "@/components/WorldArtworkGrid";
import { getArtworks } from "@/lib/artworks.server";
import { filterArtworksForWorld, getWorldBySlug, type World } from "@/lib/worlds";
import { FONT, DARK, GRAY, TYPE } from "@/lib/site-type";
import { buildPageMetadata, worldJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

function worldDescription(world: World): string {
  const raw = world.description.ja?.trim();
  if (raw) return raw.length > 150 ? `${raw.slice(0, 150)}…` : raw;
  return `「${world.name}」の世界観。込められたストーリーとコンセプトを、作品とともにたどれるページです。`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const world = await getWorldBySlug(slug);
  if (!world) {
    return buildPageMetadata({
      title: "世界観",
      description: "指定された世界観は見つかりませんでした。",
      path: "/worlds",
    });
  }
  return buildPageMetadata({
    title: `${world.name}${world.nameEn ? `（${world.nameEn}）` : ""} — 世界観`,
    description: worldDescription(world),
    path: `/worlds/${encodeURIComponent(world.slug)}`,
    keywords: [world.name, world.nameEn, "世界観", "ストーリー", "コンセプト"].filter(
      (k): k is string => Boolean(k)
    ),
  });
}

export default async function WorldPage({ params }: Props) {
  const { slug } = await params;
  const world = await getWorldBySlug(slug);
  if (!world) notFound();

  const items = filterArtworksForWorld(await getArtworks(), world);

  return (
    <div style={{ minHeight: "100%", padding: "48px 24px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            worldJsonLd({
              name: world.name,
              nameEn: world.nameEn,
              description: worldDescription(world),
              path: `/worlds/${encodeURIComponent(world.slug)}`,
              image: world.thumbnail,
            })
          ),
        }}
      />
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <Link href="/worlds" style={{ fontFamily: FONT, fontSize: TYPE.caption, color: GRAY, letterSpacing: "0.1em", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "32px" }}>
          ← WORLDS
        </Link>
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontFamily: FONT, fontSize: TYPE.label, fontWeight: 600, color: DARK, letterSpacing: "0.14em", marginBottom: "12px" }}>
            WORLD / {world.name.toUpperCase()}
          </p>
          <h1 style={{ fontFamily: FONT, fontSize: TYPE.display, fontWeight: 700, color: DARK, margin: 0, lineHeight: 1.2 }}>
            {world.name}
          </h1>
          {world.nameEn && (
            <p style={{ fontFamily: FONT, fontSize: TYPE.lead, fontWeight: 600, color: DARK, marginTop: "4px", lineHeight: 1.4 }}>
              {world.nameEn}
            </p>
          )}
          {world.description.ja && (
            <p style={{ fontFamily: FONT, fontSize: TYPE.prose, fontWeight: 600, color: DARK, lineHeight: 1.9, marginTop: "16px", maxWidth: "640px" }}>
              {world.description.ja}
            </p>
          )}
          {world.description.en && (
            <p style={{ fontFamily: FONT, fontSize: TYPE.body, fontWeight: 600, color: DARK, lineHeight: 1.8, marginTop: "8px", maxWidth: "640px" }}>
              {world.description.en}
            </p>
          )}
          <p style={{ fontFamily: FONT, fontSize: TYPE.label, fontWeight: 400, color: DARK, marginTop: "16px", letterSpacing: "0.08em" }}>
            {items.length} WORKS IN THIS WORLD
          </p>
        </div>

        {items.length === 0 ? (
          <p style={{ fontFamily: FONT, fontSize: TYPE.lead, fontWeight: 600, color: DARK }}>
            この世界に紐づく公開作品はまだありません。
          </p>
        ) : (
          <WorldArtworkGrid items={items} />
        )}
      </div>
    </div>
  );
}
