import { unstable_cache } from "next/cache";
import artworksJson from "@/data/artworks.json";
import { getNotionArtworks } from "@/lib/notion";
import { enrichArtworkMetadata } from "@/lib/artwork-metadata";

const getCachedNotionArtworks = unstable_cache(
  () => getNotionArtworks(),
  ["notion-artworks"],
  { revalidate: 60 }
);

function defaultAspectRatio(mediaType?: "image" | "video") {
  return mediaType === "video" ? 16 / 9 : 2 / 3;
}

export type Artwork = {
  id: string;
  title: { ja: string; en: string };
  /** 表示用（複数タグは " · " 区切り） */
  world: string;
  worldId?: string;
  /** 紐づく世界観タグ（1件以上） */
  worlds?: string[];
  date: string;
  /** image or video URL */
  src: string;
  /** "image" (default) or "video" */
  mediaType?: "image" | "video";
  /** width/height ratio — computed from media file dimensions */
  aspectRatio?: number;
  caption: { ja: string; en: string };
  classCode: string;
  coordinates: string;
  classLabel: string;
  status: string;
  x?: number;
  y?: number;
};

export const WORLDS = ["IDMO", "キントキ新山", "かぎのこ"] as const;
export type World = (typeof WORLDS)[number];

async function loadArtworks(): Promise<Artwork[]> {
  let items: Artwork[];
  try {
    const remote = await getCachedNotionArtworks();
    items = remote.length > 0 ? (remote as Artwork[]) : (artworksJson as Artwork[]);
  } catch (error) {
    console.warn("Notion artworks fetch failed; fallback to local JSON", error);
    items = artworksJson as Artwork[];
  }
  return enrichArtworkMetadata(items);
}

export function getArtworkWorlds(artwork: Pick<Artwork, "world" | "worlds">): string[] {
  if (artwork.worlds?.length) return artwork.worlds;
  return artwork.world ? [artwork.world] : [];
}

export async function getArtworks(): Promise<Artwork[]> {
  const items = await loadArtworks();
  return items.map((item) => {
    const worlds = getArtworkWorlds(item);
    return {
      ...item,
      worlds,
      world: worlds.length > 1 ? worlds.join(" · ") : (worlds[0] ?? item.world),
      aspectRatio: defaultAspectRatio(item.mediaType),
    };
  });
}

export function getWorldColor(_world: string): string {
  return "#222222";
}
