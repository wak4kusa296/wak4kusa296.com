import worksJson from "@/data/works.json";
import achievementsJson from "@/data/achievements.json";
import { fetchMicrocmsList } from "@/lib/microcms";
import type { Work } from "@/components/WorkGrid";

export type Achievement = {
  id: string;
  date: string;
  title: string;
  client: string;
  category: string;
  thumbnail?: string;
  images?: string[];
  summary: string;
};

type MicrocmsAsset = { url?: string } | string | undefined;
type MicrocmsRecord = Record<string, unknown> & { id?: string };

function getAssetUrl(value: MicrocmsAsset) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value.url;
}

function getAssetUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => getAssetUrl(item as MicrocmsAsset))
    .filter((url): url is string => Boolean(url));
}

function getYearFromDate(dateValue: unknown, fallbackYear: number) {
  if (typeof dateValue !== "string") return fallbackYear;
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? fallbackYear : date.getFullYear();
}

function normalizeWork(item: MicrocmsRecord, index: number): Work {
  const fallbackSrc = "/images/placeholder-square.svg";
  const monoSrc = getAssetUrl(item["img-mono"] as MicrocmsAsset);
  const flatSrc = getAssetUrl(item["img-flat"] as MicrocmsAsset);
  const spiaSrc = getAssetUrl(item["img-spia"] as MicrocmsAsset);
  const shadingSrc = getAssetUrl(item["img-shad"] as MicrocmsAsset);
  const src = getAssetUrl(item.src as MicrocmsAsset) ?? monoSrc ?? fallbackSrc;

  return {
    id: item.id ?? `work-${index}`,
    title: (item.title as string) ?? `work-${index + 1}`,
    category: (item.category as string) ?? "illustration",
    src,
    date: (item.date as string) ?? undefined,
    srcs: {
      monotone: monoSrc ?? src,
      flat: flatSrc ?? src,
      spia: spiaSrc ?? src,
      shading: shadingSrc ?? src,
    },
    year: getYearFromDate(item.date, new Date().getFullYear()),
    colSpan: Number(item.colSpan ?? 1),
    rowSpan: Number(item.rowSpan ?? 1),
  };
}

function normalizeAchievement(item: MicrocmsRecord, index: number): Achievement {
  const thumbnail = getAssetUrl(item.thumbnail as MicrocmsAsset);
  const images = getAssetUrls(item.img);
  return {
    id: item.id ?? `achievement-${index}`,
    date: (item.date as string) ?? "1970-01-01",
    title: (item.title as string) ?? `achievement-${index + 1}`,
    client: (item.client as string) ?? "",
    category: (item.category as string) ?? "journal",
    thumbnail,
    images,
    summary: (item.body as string) ?? (item.summary as string) ?? "",
  };
}

export async function getWorks(): Promise<Work[]> {
  try {
    const remote = await fetchMicrocmsList<MicrocmsRecord>("works");
    if (remote.length > 0) {
      return remote.map((item, index) => normalizeWork(item, index));
    }
  } catch (error) {
    console.warn("microCMS works fetch failed; fallback to local JSON", error);
  }
  return (worksJson as Work[]).map((item, index) => normalizeWork(item, index));
}

export async function getAchievements(): Promise<Achievement[]> {
  try {
    const remote = await fetchMicrocmsList<MicrocmsRecord>("achievements");
    if (remote.length > 0) {
      return remote.map((item, index) => normalizeAchievement(item, index));
    }
  } catch (error) {
    console.warn("microCMS achievements fetch failed; fallback to local JSON", error);
  }
  return (achievementsJson as Achievement[]).map((item, index) =>
    normalizeAchievement(item, index)
  );
}
