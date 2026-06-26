import { unstable_cache } from "next/cache";
import { getNotionWorlds, type NotionWorld } from "@/lib/notion";

const getCachedWorlds = unstable_cache(() => getNotionWorlds(), ["notion-worlds"], { revalidate: 60 });

export type World = NotionWorld;

export async function getWorlds(): Promise<World[]> {
  try {
    return await getCachedWorlds();
  } catch (error) {
    console.warn("Notion worlds fetch failed", error);
    return [];
  }
}

export async function getWorldBySlug(slug: string): Promise<World | null> {
  const decoded = decodeURIComponent(slug);
  const worlds = await getWorlds();
  return worlds.find((w) => w.slug === decoded || w.name === decoded) ?? null;
}

export function filterArtworksForWorld<T extends { world: string; worldId?: string; worlds?: string[] }>(
  artworks: T[],
  world: World
): T[] {
  return artworks.filter((a) => {
    if (a.worldId === world.id) return true;
    if (a.worlds?.includes(world.name)) return true;
    if (a.world === world.name) return true;
    return a.world.split(" · ").includes(world.name);
  });
}
