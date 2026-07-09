/** Notion CMS 日本語スキーマ定義（setup / migrate / アプリ共通） */

export const P = {
  // 共通
  published: "公開",
  date: "日付",
  title: "タイトル",
  titleJa: "タイトル（日）",
  titleEn: "タイトル（英）",
  category: "カテゴリ",
  // Worlds
  nameJa: "名前（日）",
  nameEn: "名前（英）",
  name: "名前",
  slug: "スラッグ",
  descJa: "説明（日）",
  descEn: "説明（英）",
  sort: "並び順",
  // Artworks
  artworkId: "作品ID",
  world: "世界",
  media: "メディア",
  mediaType: "メディア種別",
  captionJa: "キャプション（日）",
  captionEn: "キャプション（英）",
  status: "ステータス",
  featured: "強調",
  // Works
  mainImage: "メイン画像",
  mono: "モノトーン",
  flat: "フラット",
  spia: "スピア",
  shading: "シェーディング",
  colSpan: "列幅",
  rowSpan: "行高",
  // Achievements
  client: "クライアント",
  thumbnail: "サムネイル",
  gallery: "ギャラリー",
  summary: "概要",
  // Journal
  excerptJa: "抜粋（日）",
  excerptEn: "抜粋（英）",
  body: "本文",
  // 固定ページ
  leadJa: "リード（日）",
  leadEn: "リード（英）",
  bodyJa: "本文（日）",
  bodyEn: "本文（英）",
  linkUrl: "リンクURL",
  linkLabel: "リンクラベル",
  icon: "アイコン",
  links: "リンクリスト",
  // Commissions
  email: "メール",
  nameReading: "名前の読み方",
  commissionType: "依頼種別",
  budget: "予算",
  deadline: "納期",
  detail: "依頼内容",
  submittedAt: "受付日時",
  responseStatus: "対応状況",
};

export const DB_TITLES = {
  Worlds: "世界観",
  Artworks: "作品（世界観）",
  Works: "ポートフォリオ",
  Achievements: "実績",
  Journal: "ジャーナル",
  Pages: "固定ページ",
  Commissions: "お仕事依頼",
};

export const SELECT = {
  mediaType: {
    image: "画像",
    video: "動画",
  },
  artworkStatus: {
    ACTIVE: "公開中",
    ARCHIVED: "アーカイブ",
    SEASONAL: "季節限定",
    PRESERVED: "保存",
    OPERATIONAL: "運用中",
  },
  workCategory: {
    illustration: "イラスト",
    "3dcg": "3DCG",
    branding: "ブランディング",
    web: "Web",
  },
  achievementCategory: {
    branding: "ブランディング",
    web: "Web",
    illustration: "イラスト",
    journal: "ジャーナル",
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

/** 旧プロパティ名 → 新プロパティ名 */
export const PROPERTY_RENAMES = {
  Worlds: {
    Name: P.nameJa,
    名前: P.nameJa,
    Slug: P.slug,
    "Description JA": P.descJa,
    "Description EN": P.descEn,
    Sort: P.sort,
    Thumbnail: P.thumbnail,
    "Thumbnail URL": null,
  },
  Artworks: {
    ID: P.artworkId,
    "Title JA": P.titleJa,
    "Title EN": P.titleEn,
    World: P.world,
    Date: P.date,
    "Media URL": null,
    "Media Type": P.mediaType,
    "Aspect Ratio": null,
    アスペクト比: null,
    "Caption JA": P.captionJa,
    "Caption EN": P.captionEn,
    "Class Code": null,
    "Class Label": null,
    Coordinates: null,
    分類コード: null,
    分類ラベル: null,
    座標: null,
    Status: P.status,
    Published: P.published,
  },
  Works: {
    Title: P.title,
    Category: P.category,
    Date: P.date,
    "Main Image URL": null,
    "Mono URL": null,
    "Flat URL": null,
    "Spia URL": null,
    "Shading URL": null,
    "Col Span": P.colSpan,
    "Row Span": P.rowSpan,
    Published: P.published,
  },
  Achievements: {
    Title: P.title,
    Date: P.date,
    Client: P.client,
    Category: P.category,
    "Thumbnail URL": null,
    "Gallery URLs": null,
    Summary: P.summary,
    Published: P.published,
  },
  Journal: {
    "Title JA": P.titleJa,
    "Title EN": P.titleEn,
    Date: P.date,
    Excerpt: P.excerptJa,
    "Excerpt JA": P.excerptJa,
    "Excerpt EN": P.excerptEn,
    Body: null,
    Published: P.published,
  },
  Pages: {
    Slug: P.slug,
    "Title JA": P.titleJa,
    "Title EN": P.titleEn,
    "Lead JA": P.leadJa,
    "Lead EN": P.leadEn,
    "Body JA": P.bodyJa,
    "Body EN": P.bodyEn,
    "Link URL": P.linkUrl,
    "Link Label": P.linkLabel,
    Icon: P.icon,
    Links: P.links,
    [P.icon]: P.icon,
    [P.links]: P.links,
    Published: P.published,
  },
};

export const DATABASE_SCHEMAS = {
  Worlds: {
    title: [{ type: "text", text: { content: DB_TITLES.Worlds } }],
    properties: {
      [P.nameJa]: { title: {} },
      [P.nameEn]: { rich_text: {} },
      [P.slug]: { rich_text: {} },
      [P.descJa]: { rich_text: {} },
      [P.descEn]: { rich_text: {} },
      [P.sort]: { number: { format: "number" } },
      [P.thumbnail]: { files: {} },
    },
  },
  Artworks: {
    title: [{ type: "text", text: { content: DB_TITLES.Artworks } }],
    properties: {
      [P.artworkId]: { title: {} },
      [P.titleJa]: { rich_text: {} },
      [P.titleEn]: { rich_text: {} },
      [P.world]: {
        select: {
          options: [
            { name: "IDMO", color: "gray" },
            { name: "キントキ新山", color: "brown" },
            { name: "かぎのこ", color: "blue" },
          ],
        },
      },
      [P.date]: { rich_text: {} },
      [P.media]: { files: {} },
      [P.mediaType]: {
        select: {
          options: [
            { name: SELECT.mediaType.image, color: "default" },
            { name: SELECT.mediaType.video, color: "purple" },
          ],
        },
      },
      [P.captionJa]: { rich_text: {} },
      [P.captionEn]: { rich_text: {} },
      [P.status]: {
        select: {
          options: Object.values(SELECT.artworkStatus).map((name, i) => ({
            name,
            color: ["green", "gray", "yellow", "brown", "blue"][i],
          })),
        },
      },
      [P.featured]: { checkbox: {} },
      [P.published]: { checkbox: {} },
    },
  },
  Works: {
    title: [{ type: "text", text: { content: DB_TITLES.Works } }],
    properties: {
      [P.title]: { title: {} },
      [P.category]: {
        select: {
          options: Object.values(SELECT.workCategory).map((name, i) => ({
            name,
            color: ["default", "purple", "orange", "blue"][i],
          })),
        },
      },
      [P.date]: { date: {} },
      [P.mainImage]: { files: {} },
      [P.mono]: { files: {} },
      [P.flat]: { files: {} },
      [P.spia]: { files: {} },
      [P.shading]: { files: {} },
      [P.colSpan]: { number: { format: "number" } },
      [P.rowSpan]: { number: { format: "number" } },
      [P.published]: { checkbox: {} },
    },
  },
  Achievements: {
    title: [{ type: "text", text: { content: DB_TITLES.Achievements } }],
    properties: {
      [P.title]: { title: {} },
      [P.date]: { date: {} },
      [P.client]: { rich_text: {} },
      [P.category]: {
        select: {
          options: Object.values(SELECT.achievementCategory).map((name, i) => ({
            name,
            color: ["orange", "blue", "default", "gray"][i],
          })),
        },
      },
      [P.thumbnail]: { files: {} },
      [P.gallery]: { files: {} },
      [P.summary]: { rich_text: {} },
      [P.published]: { checkbox: {} },
    },
  },
  Journal: {
    title: [{ type: "text", text: { content: DB_TITLES.Journal } }],
    properties: {
      [P.titleJa]: { title: {} },
      [P.titleEn]: { rich_text: {} },
      [P.date]: { date: {} },
      [P.excerptJa]: { rich_text: {} },
      [P.excerptEn]: { rich_text: {} },
      [P.published]: { checkbox: {} },
    },
  },
  Pages: {
    title: [{ type: "text", text: { content: DB_TITLES.Pages } }],
    properties: {
      [P.titleJa]: { title: {} },
      [P.slug]: { rich_text: {} },
      [P.titleEn]: { rich_text: {} },
      [P.leadJa]: { rich_text: {} },
      [P.leadEn]: { rich_text: {} },
      [P.bodyJa]: { rich_text: {} },
      [P.bodyEn]: { rich_text: {} },
      [P.linkUrl]: { url: {} },
      [P.linkLabel]: { rich_text: {} },
      [P.icon]: { files: {} },
      [P.links]: { rich_text: {} },
      [P.published]: { checkbox: {} },
    },
  },
  Commissions: {
    title: [{ type: "text", text: { content: DB_TITLES.Commissions } }],
    properties: {
      [P.name]: { title: {} },
      [P.nameReading]: { rich_text: {} },
      [P.email]: { email: {} },
      [P.commissionType]: {
        select: {
          options: Object.values(SELECT.commissionType).map((name, i) => ({
            name,
            color: ["default", "purple", "orange", "blue", "green", "gray"][i],
          })),
        },
      },
      [P.budget]: { rich_text: {} },
      [P.deadline]: { rich_text: {} },
      [P.detail]: { rich_text: {} },
      [P.submittedAt]: { date: {} },
      [P.responseStatus]: {
        select: {
          options: Object.values(SELECT.commissionResponseStatus).map((name, i) => ({
            name,
            color: ["default", "blue", "green"][i],
          })),
        },
      },
    },
  },
};

/** 英語タグ値 → 日本語タグ値 */
export function toJaSelect(map, value) {
  if (!value) return null;
  return map[value] ?? value;
}

/** 日本語タグ値 → 英語（アプリ内部用） */
export function fromJaSelect(map, value) {
  if (!value) return "";
  const entry = Object.entries(map).find(([, ja]) => ja === value);
  return entry ? entry[0] : value;
}
