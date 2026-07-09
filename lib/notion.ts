const NOTION_VERSION = "2022-06-28";

/** 日本語プロパティ名（scripts/notion-schema.mjs と同期） */
const P = {
  published: "公開",
  date: "日付",
  titleJa: "タイトル（日）",
  titleEn: "タイトル（英）",
  artworkId: "作品ID",
  world: "世界",
  media: "メディア",
  mediaType: "メディア種別",
  captionJa: "キャプション（日）",
  captionEn: "キャプション（英）",
  status: "ステータス",
  featured: "強調",
  excerptJa: "抜粋（日）",
  excerptEn: "抜粋（英）",
  nameJa: "名前（日）",
  nameEn: "名前（英）",
  name: "名前",
  slug: "スラッグ",
  descJa: "説明（日）",
  descEn: "説明（英）",
  sort: "並び順",
  thumbnail: "サムネイル",
  leadJa: "リード（日）",
  leadEn: "リード（英）",
  bodyJa: "本文（日）",
  bodyEn: "本文（英）",
  linkUrl: "リンクURL",
  linkLabel: "リンクラベル",
  icon: "アイコン",
  email: "メール",
  nameReading: "名前の読み方",
  commissionType: "依頼種別",
  budget: "予算",
  deadline: "納期",
  detail: "依頼内容",
  submittedAt: "受付日時",
  responseStatus: "対応状況",
};

const SELECT = {
  mediaType: { 画像: "image", 動画: "video", image: "image", video: "video" },
  artworkStatus: {
    公開中: "ACTIVE",
    アーカイブ: "ARCHIVED",
    季節限定: "SEASONAL",
    保存: "PRESERVED",
    運用中: "OPERATIONAL",
    ACTIVE: "ACTIVE",
    ARCHIVED: "ARCHIVED",
    SEASONAL: "SEASONAL",
    PRESERVED: "PRESERVED",
    OPERATIONAL: "OPERATIONAL",
  },
  commissionType: {
    outsourcing: "業務委託",
    event: "イベント出展",
    lecture: "講習",
    "creative-advisor": "創作相談役",
    interview: "取材",
    other: "その他",
  },
  commissionResponseStatus: {
    pending: "未対応",
    in_progress: "対応中",
    done: "完了",
  },
};

function getApiKey() {
  return process.env.NOTION_API_KEY ?? "";
}

function getDatabaseId(key: string) {
  return process.env[key] ?? "";
}

function normalizeId(id: string) {
  return id.replace(/-/g, "");
}

function canUseNotion() {
  return Boolean(getApiKey() && getDatabaseId("NOTION_DB_ARTWORKS"));
}

type NotionFile = {
  name: string;
  type: string;
  file?: { url: string };
  external?: { url: string };
};

type NotionPage = {
  id: string;
  properties: Record<string, NotionProperty>;
};

type NotionProperty = {
  type: string;
  title?: { plain_text: string }[];
  rich_text?: { plain_text: string }[];
  select?: { name: string } | null;
  url?: string | null;
  number?: number | null;
  date?: { start: string } | null;
  checkbox?: boolean;
  files?: NotionFile[];
  relation?: { id: string }[];
};

function prop(page: Record<string, NotionProperty>, ...names: string[]) {
  for (const name of names) {
    if (page[name]) return page[name];
  }
  return undefined;
}

function plainText(prop?: NotionProperty): string {
  if (!prop) return "";
  if (prop.type === "title" || prop.type === "rich_text") {
    const items = prop.title ?? prop.rich_text ?? [];
    return items.map((t) => t.plain_text).join("");
  }
  if (prop.type === "select") return prop.select?.name ?? "";
  if (prop.type === "url") return prop.url ?? "";
  if (prop.type === "number") return prop.number != null ? String(prop.number) : "";
  if (prop.type === "date") return prop.date?.start ?? "";
  if (prop.type === "checkbox") return prop.checkbox ? "true" : "";
  return "";
}

function numberValue(prop?: NotionProperty): number {
  if (!prop || prop.type !== "number") return 0;
  return prop.number ?? 0;
}

function checkboxValue(prop?: NotionProperty): boolean {
  if (!prop || prop.type !== "checkbox") return false;
  return Boolean(prop.checkbox);
}

function urlValue(prop?: NotionProperty): string {
  if (!prop || prop.type !== "url") return "";
  return prop.url ?? "";
}

function mapSelect<T extends string>(map: Record<string, T>, value: string): T | undefined {
  return (map[value] ?? value) as T | undefined;
}

function fileUrl(prop?: NotionProperty): string {
  if (!prop || prop.type !== "files" || !prop.files?.length) return "";
  const f = prop.files[0];
  return f.file?.url ?? f.external?.url ?? "";
}

function mediaUrl(...candidates: (NotionProperty | undefined)[]): string {
  for (const candidate of candidates) {
    const fromFiles = fileUrl(candidate);
    if (fromFiles) return fromFiles;
    if (candidate?.type === "url" && candidate.url) return candidate.url;
  }
  return "";
}

function isPublished(page: NotionPage): boolean {
  const pub = page.properties[P.published] ?? page.properties.Published;
  if (!pub || pub.type !== "checkbox") return true;
  return Boolean(pub.checkbox);
}

async function queryDatabase(databaseId: string, options?: { publishedOnly?: boolean }) {
  const apiKey = getApiKey();
  if (!apiKey || !databaseId) return [];

  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${normalizeId(databaseId)}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Notion query failed (${res.status})`);

    const data = (await res.json()) as {
      results: NotionPage[];
      has_more: boolean;
      next_cursor: string | null;
    };
    pages.push(...data.results);
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
  } while (cursor);

  if (options?.publishedOnly) {
    return pages.filter(isPublished);
  }
  return pages;
}

export type NotionArtwork = {
  id: string;
  title: { ja: string; en: string };
  world: string;
  worlds?: string[];
  worldId?: string;
  date: string;
  src: string;
  mediaType?: "image" | "video";
  caption: { ja: string; en: string };
  status: string;
  featured?: boolean;
};

function resolveArtworkWorlds(
  p: Record<string, NotionProperty>,
  worldById: Map<string, NotionWorld>
): { worlds: string[]; worldIds: string[] } {
  const worldProp = prop(p, P.world, "World");
  if (!worldProp) return { worlds: [], worldIds: [] };

  if (worldProp.type === "relation" && worldProp.relation?.length) {
    const worlds: string[] = [];
    const worldIds: string[] = [];
    for (const rel of worldProp.relation) {
      const world = worldById.get(rel.id);
      if (!world?.name) continue;
      worlds.push(world.name);
      worldIds.push(rel.id);
    }
    return { worlds, worldIds };
  }

  if (worldProp.type === "select" && worldProp.select?.name) {
    return { worlds: [worldProp.select.name], worldIds: [] };
  }

  const name = plainText(worldProp);
  return name ? { worlds: [name], worldIds: [] } : { worlds: [], worldIds: [] };
}

export async function getNotionArtworks(): Promise<NotionArtwork[]> {
  if (!canUseNotion()) return [];

  const dbId = getDatabaseId("NOTION_DB_ARTWORKS");
  const [pages, worlds] = await Promise.all([
    queryDatabase(dbId, { publishedOnly: true }),
    getNotionWorlds(),
  ]);
  const worldById = new Map(worlds.map((w) => [w.id, w]));

  return pages.map((page) => {
    const p = page.properties;
    const rawMediaType = plainText(prop(p, P.mediaType, "Media Type"));
    const rawStatus = plainText(prop(p, P.status, "Status"));
    const { worlds, worldIds } = resolveArtworkWorlds(p, worldById);
    return {
      id: plainText(prop(p, P.artworkId, "ID")),
      title: {
        ja: plainText(prop(p, P.titleJa, "Title JA")),
        en: plainText(prop(p, P.titleEn, "Title EN")),
      },
      world: worlds.length > 1 ? worlds.join(" · ") : (worlds[0] ?? ""),
      worlds,
      worldId: worldIds[0],
      date: plainText(prop(p, P.date, "Date")),
      src: mediaUrl(prop(p, P.media, "メディア"), p["Media URL"]),
      mediaType: mapSelect(SELECT.mediaType, rawMediaType) as "image" | "video" | undefined,
      caption: {
        ja: plainText(prop(p, P.captionJa, "Caption JA")),
        en: plainText(prop(p, P.captionEn, "Caption EN")),
      },
      status: mapSelect(SELECT.artworkStatus, rawStatus) ?? rawStatus,
      featured: checkboxValue(prop(p, P.featured, "強調", "Featured")),
    };
  });
}

export type NotionJournalEntry = {
  id: string;
  date: string;
  title: { ja: string; en: string };
  excerpt: string;
};

export async function getNotionJournalEntries(): Promise<NotionJournalEntry[]> {
  const dbId = getDatabaseId("NOTION_DB_JOURNAL");
  if (!getApiKey() || !dbId) return [];

  const pages = await queryDatabase(dbId, { publishedOnly: true });

  return pages
    .map((page) => {
      const p = page.properties;
      const excerptJa =
        plainText(prop(p, P.excerptJa, "Excerpt JA", "Excerpt")) ||
        plainText(prop(p, "抜粋（日）"));
      const excerptEn = plainText(prop(p, P.excerptEn, "Excerpt EN", "抜粋（英）"));
      return {
        id: page.id,
        date: plainText(prop(p, P.date, "Date")),
        title: {
          ja: plainText(prop(p, P.titleJa, "Title JA")),
          en: plainText(prop(p, P.titleEn, "Title EN")),
        },
        excerpt: excerptJa || excerptEn,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getNotionJournalEntryContent(pageId: string): Promise<string> {
  if (!getApiKey()) return "";
  const { getNotionPageMarkdown } = await import("@/lib/notion-markdown");
  return getNotionPageMarkdown(pageId);
}

export type NotionWorld = {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  description: { ja: string; en: string };
  sort: number;
  thumbnail?: string;
};

export async function getNotionWorlds(): Promise<NotionWorld[]> {
  const dbId = getDatabaseId("NOTION_DB_WORLDS");
  if (!getApiKey() || !dbId) return [];

  const pages = await queryDatabase(dbId);

  return pages
    .map((page) => {
      const p = page.properties;
      const name = plainText(prop(p, P.nameJa, P.name, "Name"));
      const nameEn = plainText(prop(p, P.nameEn, "名前（英）", "Name EN"));
      const slug = plainText(prop(p, P.slug, "Slug"));
      return {
        id: page.id,
        name,
        nameEn,
        slug: slug || name,
        description: {
          ja: plainText(prop(p, P.descJa, "Description JA")),
          en: plainText(prop(p, P.descEn, "Description EN")),
        },
        sort: numberValue(prop(p, P.sort, "Sort")),
        thumbnail: mediaUrl(prop(p, P.thumbnail, "Thumbnail", "サムネイル")),
      };
    })
    .sort((a, b) => a.sort - b.sort);
}

export type NotionSitePage = {
  slug: string;
  title: { ja: string; en: string };
  lead: { ja: string; en: string };
  body: { ja: string; en: string };
  icon?: string;
  link?: { url: string; label: string };
};

export async function getNotionSitePages(): Promise<NotionSitePage[]> {
  const dbId = getDatabaseId("NOTION_DB_PAGES");
  if (!getApiKey() || !dbId) return [];

  const pages = await queryDatabase(dbId, { publishedOnly: true });

  return pages.map((page) => {
    const p = page.properties;
    const slug = plainText(prop(p, P.slug, "Slug"));
    const linkUrl = urlValue(prop(p, P.linkUrl, "Link URL"));
    const linkLabel = plainText(prop(p, P.linkLabel, "Link Label"));
    return {
      slug,
      title: {
        ja: plainText(prop(p, P.titleJa, "Title JA")),
        en: plainText(prop(p, P.titleEn, "Title EN")),
      },
      lead: {
        ja: plainText(prop(p, P.leadJa, "Lead JA")),
        en: plainText(prop(p, P.leadEn, "Lead EN")),
      },
      body: {
        ja: plainText(prop(p, P.bodyJa, "Body JA")),
        en: plainText(prop(p, P.bodyEn, "Body EN")),
      },
      icon: fileUrl(prop(p, P.icon, "Icon")) || undefined,
      link: linkUrl ? { url: linkUrl, label: linkLabel || linkUrl } : undefined,
    };
  });
}

export { canUseNotion, fileUrl, mediaUrl };

export type CommissionFormData = {
  name: string;
  nameReading: string;
  email: string;
  type: string;
  budget: string;
  deadline: string;
  detail: string;
};

function richTextBlocks(text: string) {
  const blocks: { type: "text"; text: { content: string } }[] = [];
  for (let i = 0; i < text.length; i += 2000) {
    blocks.push({ type: "text", text: { content: text.slice(i, i + 2000) } });
  }
  return blocks;
}

export function canUseCommissionNotion() {
  return Boolean(getApiKey() && getDatabaseId("NOTION_DB_COMMISSIONS"));
}

export async function createCommissionRequest(
  data: CommissionFormData
): Promise<{ id: string }> {
  const apiKey = getApiKey();
  const dbId = getDatabaseId("NOTION_DB_COMMISSIONS");
  if (!apiKey || !dbId) {
    throw new Error("Notion commission database is not configured");
  }

  const typeLabel = SELECT.commissionType[data.type as keyof typeof SELECT.commissionType] ?? data.type;
  const today = new Date().toISOString().slice(0, 10);

  const properties: Record<string, unknown> = {
    [P.name]: { title: richTextBlocks(data.name.trim()) },
    [P.nameReading]: { rich_text: richTextBlocks(data.nameReading.trim()) },
    [P.email]: { email: data.email.trim() },
    [P.commissionType]: { select: { name: typeLabel } },
    [P.budget]: { rich_text: richTextBlocks(data.budget.trim()) },
    [P.deadline]: { rich_text: richTextBlocks(data.deadline.trim()) },
    [P.detail]: { rich_text: richTextBlocks(data.detail.trim()) },
    [P.submittedAt]: { date: { start: today } },
    [P.responseStatus]: { select: { name: SELECT.commissionResponseStatus.pending } },
  };

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: normalizeId(dbId) },
      properties,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Notion create failed (${res.status})`);
  }

  const page = (await res.json()) as { id: string };
  return { id: page.id };
}
