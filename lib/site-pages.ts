import { unstable_cache } from "next/cache";
import { canUseNotion, getNotionSitePages, type NotionSitePage } from "@/lib/notion";

export const FIXED_PAGE_NAV_SLUGS = ["commission", "support"] as const;
export type FixedPageNavSlug = (typeof FIXED_PAGE_NAV_SLUGS)[number];

export type SitePageTier = {
  code: string;
  label: string;
  en: string;
};

export type SitePage = NotionSitePage & {
  tiers?: SitePageTier[];
};

const FALLBACK_PAGES: Record<string, SitePage> = {
  home: {
    slug: "home",
    title: { ja: "若草フクロウ", en: "Goto Tatsuya" },
    lead: {
      ja: "イラストレーター。架空の世界を地図や風景として描いています。",
      en: "Illustrator drawing imaginary worlds as maps and landscapes.",
    },
    body: { ja: "", en: "" },
  },
  commission: {
    slug: "commission",
    title: { ja: "お仕事依頼", en: "Request a Commission" },
    lead: {
      ja: "イラスト制作・キャラクターデザイン・世界観設定・カバーアートなど、各種ご依頼を承っております。",
      en: "Accepting commissions for illustration, character design, world-building, cover art, and more.",
    },
    body: { ja: "", en: "" },
  },
  support: {
    slug: "support",
    title: { ja: "この世界を支える", en: "Support These Worlds" },
    lead: {
      ja: "IDMOや、キントキ新山や、かぎのこの港。\nこれらの世界は、継続的な制作活動によって少しずつ広がっています。",
      en: "IDMO, Kintoki-Shinzan, the port of Kaginoko —\nthese worlds expand slowly through continued creative work.\nYour support makes that possible.",
    },
    body: {
      ja: [
        "TIER-01|制作過程のスケッチ・ラフ公開|WIP sketches and rough drafts",
        "TIER-02|世界設定資料の先行公開|Early access to world-building documents",
        "TIER-03|高解像度データDL|High-resolution file downloads",
      ].join("\n"),
      en: "",
    },
    link: { url: "https://www.patreon.com", label: "PATREON で支援する" },
  },
};

const getCachedPages = unstable_cache(() => getNotionSitePages(), ["notion-pages"], { revalidate: 60 });

function parseTiers(bodyJa: string): SitePageTier[] | undefined {
  const lines = bodyJa
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const tiers = lines
    .map((line) => {
      const [code, label, en] = line.split("|").map((part) => part.trim());
      if (!code || !label) return null;
      return { code, label, en: en ?? "" };
    })
    .filter((tier): tier is SitePageTier => tier !== null);
  return tiers.length > 0 ? tiers : undefined;
}

function enrichPage(page: NotionSitePage): SitePage {
  return {
    ...page,
    tiers: parseTiers(page.body.ja),
  };
}

export async function getPublishedSitePageSlugs(): Promise<Set<string>> {
  if (!canUseNotion()) {
    return new Set(FIXED_PAGE_NAV_SLUGS);
  }
  try {
    const pages = await getCachedPages();
    return new Set(pages.map((page) => page.slug));
  } catch (error) {
    console.warn("Failed to fetch published site pages for nav; showing all fixed pages", error);
    return new Set(FIXED_PAGE_NAV_SLUGS);
  }
}

export async function getSitePage(slug: string): Promise<SitePage> {
  const fallback = FALLBACK_PAGES[slug];
  try {
    const remote = await getCachedPages();
    const found = remote.find((page) => page.slug === slug);
    if (found) return enrichPage(found);
  } catch (error) {
    console.warn(`Notion page fetch failed for "${slug}"; fallback to local data`, error);
  }
  return fallback ?? {
    slug,
    title: { ja: slug, en: slug },
    lead: { ja: "", en: "" },
    body: { ja: "", en: "" },
  };
}
