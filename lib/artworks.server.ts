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

function normalizeArtworks(items: Artwork[]): Artwork[] {
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

/** 一覧・件数用。S3 へのアスペクト比プローブをスキップして高速化 */
const getCachedArtworksLight = unstable_cache(
  async () => {
    const remote = await getNotionArtworks();
    return enrichArtworkMetadata(remote);
  },
  ["notion-artworks-light"],
  { revalidate: 3600 }
);

export async function getArtworks(): Promise<Artwork[]> {
  try {
    return normalizeArtworks(await getCachedArtworks());
  } catch (error) {
    console.warn("Notion artworks fetch failed", error);
    return [];
  }
}

/** ワールド一覧など、アスペクト比が不要なページ向け */
export async function getArtworksLight(): Promise<Artwork[]> {
  try {
    return normalizeArtworks(await getCachedArtworksLight());
  } catch (error) {
    console.warn("Notion artworks (light) fetch failed", error);
    return [];
  }
}
