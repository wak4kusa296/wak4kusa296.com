import Link from "next/link";
import { notFound } from "next/navigation";
import WorldArtworkGrid from "@/components/WorldArtworkGrid";
import { getArtworks } from "@/lib/artworks";
import { filterArtworksForWorld, getWorldBySlug } from "@/lib/worlds";
import { FONT, DARK, GRAY, TYPE } from "@/lib/site-type";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export default async function WorldPage({ params }: Props) {
  const { slug } = await params;
  const world = await getWorldBySlug(slug);
  if (!world) notFound();

  const items = filterArtworksForWorld(await getArtworks(), world);

  return (
    <div style={{ minHeight: "100%", padding: "48px 24px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <Link href="/worlds" style={{ fontFamily: FONT, fontSize: TYPE.caption, color: GRAY, letterSpacing: "0.1em", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "32px" }}>
          ← WORLDS
        </Link>
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontFamily: FONT, fontSize: TYPE.label, color: GRAY, letterSpacing: "0.14em", marginBottom: "12px" }}>
            WORLD / {world.name.toUpperCase()}
          </p>
          <h1 style={{ fontFamily: FONT, fontSize: TYPE.display, fontWeight: 700, color: DARK, margin: 0, lineHeight: 1.2 }}>
            {world.name}
          </h1>
          {world.description.ja && (
            <p style={{ fontFamily: FONT, fontSize: TYPE.prose, color: DARK, lineHeight: 1.9, marginTop: "16px", maxWidth: "640px" }}>
              {world.description.ja}
            </p>
          )}
          {world.description.en && (
            <p style={{ fontFamily: FONT, fontSize: TYPE.body, color: GRAY, lineHeight: 1.8, marginTop: "8px", maxWidth: "640px" }}>
              {world.description.en}
            </p>
          )}
          <p style={{ fontFamily: FONT, fontSize: TYPE.label, color: GRAY, marginTop: "16px", letterSpacing: "0.08em" }}>
            {items.length} WORKS IN THIS WORLD
          </p>
        </div>

        {items.length === 0 ? (
          <p style={{ fontFamily: FONT, fontSize: TYPE.lead, color: GRAY }}>
            この世界に紐づく公開作品はまだありません。
          </p>
        ) : (
          <WorldArtworkGrid items={items} />
        )}
      </div>
    </div>
  );
}
