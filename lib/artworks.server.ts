import "server-only";

import { unstable_cache } from "next/cache";
import { getNotionArtworks } from "@/lib/notion";
import { enrichArtworkMetadata } from "@/lib/artwork-metadata";
import { enrichArtworkAspectRatios } from "@/lib/media-aspect-ratio";
import type { Artwork } from "@/lib/artworks";
import { getArtworkWorlds } from "@/lib/artworks";

function defaultAspectRatio(mediaType?: "image" | "video") {
  return mediaType === "video" ? 16 / 9 : 2 / 3;
}

const getCachedArtworks = unstable_cache(
  async () => {
    const remote = await getNotionArtworks();
    const withRatios =
      process.env.NODE_ENV === "development"
        ? remote
        : await enrichArtworkAspectRatios(remote);
    return enrichArtworkMetadata(withRatios);
  },
  ["notion-artworks"],
  { revalidate: 3600 }
);

async function loadArtworks(): Promise<Artwork[]> {
  try {
    return await getCachedArtworks();
  } catch (error) {
    console.warn("Notion artworks fetch failed", error);
    return [];
  }
}

export async function getArtworks(): Promise<Artwork[]> {
  const items = await loadArtworks();
  return items.map((item) => {
    const worlds = getArtworkWorlds(item);
    return {
      ...item,
      worlds,
      world: worlds.length > 1 ? worlds.join(" · ") : (worlds[0] ?? item.world),
      aspectRatio: item.aspectRatio ?? defaultAspectRatio(item.mediaType),
    };
  });
}
