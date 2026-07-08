import { getArtworks } from "@/lib/artworks.server";
import { filterArtworksForWorld, getWorlds } from "@/lib/worlds";
import WorldCard from "@/components/WorldCard";
import { FONT, DARK, GRAY, TYPE } from "@/lib/site-type";

export const revalidate = 3600;

export default async function WorldsPage() {
  const [worlds, artworks] = await Promise.all([getWorlds(), getArtworks()]);
  const worldData = worlds.map((world) => {
    const items = filterArtworksForWorld(artworks, world);
    return {
      world,
      slug: world.slug,
      items,
      thumbnail: world.thumbnail ?? null,
    };
  });

  return (
    <div style={{ minHeight: "100%", padding: "48px 32px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontFamily: FONT, fontSize: TYPE.label, color: GRAY, letterSpacing: "0.14em", marginBottom: "12px" }}>
            WORLDS INDEX
          </p>
          <h1 style={{ fontFamily: FONT, fontSize: TYPE.heading, fontWeight: 700, color: DARK, lineHeight: 1.3, margin: 0 }}>
            世界観インデックス
          </h1>
          <p style={{ fontFamily: FONT, fontSize: TYPE.lead, color: GRAY, marginTop: "4px" }}>
            Index of Worlds
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px" }}>
          {worldData.map(({ world, slug, items, thumbnail }) => (
            <WorldCard
              key={world.id}
              world={world.name}
              slug={slug}
              count={items.length}
              thumbnail={thumbnail}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
