import { unstable_cache } from "next/cache";
import { canUseNotion, getNotionSitePages, type NotionSitePage } from "@/lib/notion";

export const FIXED_PAGE_NAV_SLUGS = ["commission", "support"] as const;
export type FixedPageNavSlug = (typeof FIXED_PAGE_NAV_SLUGS)[number];

export type SitePageTier = {
  code: string;
  label: string;
  en: string;
};

export type SitePageLink = {
  label: string;
  url: string;
};

export type SitePage = NotionSitePage & {
  tiers?: SitePageTier[];
  linkList?: SitePageLink[];
};

/** ホームファーストビュー用のデフォルトアイコン（Notion未設定時） */
export const HOME_ICON_FALLBACK = "/images/home-icon.png";

function emptySitePage(slug: string): SitePage {
  return {
    slug,
    title: { ja: "", en: "" },
    lead: { ja: "", en: "" },
    body: { ja: "", en: "" },
  };
}

const getCachedPages = unstable_cache(() => getNotionSitePages(), ["notion-pages"], { revalidate: 3600 });

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

/** リンクリスト: 1行1リンク `ラベル|URL`（固定ページ本文から読む） */
function parseLinks(raw?: string): SitePageLink[] | undefined {
  if (!raw?.trim()) return undefined;
  const links = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split("|").map((part) => part.trim());
      if (!label || !url) return null;
      return { label, url };
    })
    .filter((link): link is SitePageLink => link !== null);
  return links.length > 0 ? links : undefined;
}

function enrichPage(page: NotionSitePage): SitePage {
  if (page.slug === "home") {
    return {
      ...page,
      linkList: parseLinks(page.body.ja),
    };
  }
  if (page.slug === "support") {
    return {
      ...page,
      tiers: parseTiers(page.body.ja),
    };
  }
  return { ...page };
}

export async function getPublishedSitePageSlugs(): Promise<Set<string>> {
  if (!canUseNotion()) {
    return new Set();
  }
  try {
    const pages = await getCachedPages();
    return new Set(pages.map((page) => page.slug));
  } catch (error) {
    console.warn("Failed to fetch published site pages for nav", error);
    return new Set();
  }
}

export async function getSitePage(slug: string): Promise<SitePage> {
  try {
    const remote = await getCachedPages();
    const found = remote.find((page) => page.slug === slug);
    if (found) return enrichPage(found);
  } catch (error) {
    console.warn(`Notion page fetch failed for "${slug}"`, error);
  }
  return emptySitePage(slug);
}
