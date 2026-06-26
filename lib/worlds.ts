import { unstable_cache } from "next/cache";
import { getNotionWorlds, type NotionWorld } from "@/lib/notion";

const FALLBACK_WORLDS: NotionWorld[] = [
  {
    id: "idmo",
    name: "IDMO",
    slug: "idmo",
    description: { ja: "山の上に都市がある世界。", en: "A world where a city rests atop the mountains." },
    sort: 1,
  },
  {
    id: "kintoki-shinzan",
    name: "キントキ新山",
    slug: "kintoki-shinzan",
    description: { ja: "温泉と古い街並みの世界。", en: "A world of hot springs and old streets." },
    sort: 2,
  },
  {
    id: "kaginoko",
    name: "かぎのこ",
    slug: "kaginoko",
    description: { ja: "鍵の形をした入り江の港町。", en: "A harbor town in a key-shaped inlet." },
    sort: 3,
  },
];

const getCachedWorlds = unstable_cache(() => getNotionWorlds(), ["notion-worlds"], { revalidate: 60 });

export type World = NotionWorld;

export async function getWorlds(): Promise<World[]> {
  try {
    const remote = await getCachedWorlds();
    if (remote.length > 0) return remote;
  } catch (error) {
    console.warn("Notion worlds fetch failed; fallback to local data", error);
  }
  return FALLBACK_WORLDS;
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
