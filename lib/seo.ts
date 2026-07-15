import type { Metadata } from "next";

export const SITE_URL = "https://wak4kusa296.com";
export const SITE_NAME = "若草フクロウ";
export const SITE_TITLE = "若草フクロウ：GotoTatsuya｜2D/3D-artist";
export const AUTHOR_NAME = "五嶋龍也";
export const AUTHOR_NAME_EN = "Goto Tatsuya";

export const OG_IMAGE = "/og-image.png";
export const OG_IMAGE_ALT = "若草フクロウ — Goto Tatsuya";

/** サイト全体で狙う中心キーワード。デフォルメ・世界観・ストーリー・イラスト・コンセプトを軸に置く。 */
export const SEO_KEYWORDS = [
  "デフォルメ",
  "世界観",
  "ストーリー",
  "イラスト",
  "コンセプト",
  "コンセプトアート",
  "背景イラスト",
  "2Dアーティスト",
  "3Dアーティスト",
  "若草フクロウ",
  "五嶋龍也",
  "Goto Tatsuya",
];

export const DEFAULT_DESCRIPTION =
  "2D・3Dアーティスト 若草フクロウ（五嶋龍也）のポートフォリオ。デフォルメの効いたイラストと、ストーリー・コンセプトを織り込んだ世界観を、風景として描き・組み立てています。";

/** SNS など sameAs に載せる外部プロフィール。 */
export const SAME_AS = [
  "https://note.com/wak4kusa296",
  "https://www.youtube.com/@wak4kusa296",
  "https://www.instagram.com/wak4kusa296/",
];

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
};

/**
 * ページ単位の Metadata を組み立てる。openGraph / twitter は Next のメタデータ継承で
 * 親オブジェクトごと上書きされるため、必要フィールドを毎回フルで返して欠落を防ぐ。
 */
export function buildPageMetadata({
  title,
  description,
  path,
  keywords = SEO_KEYWORDS,
  image = OG_IMAGE,
}: PageMetadataInput): Metadata {
  const ogTitle = `${title}｜${SITE_NAME}`;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "ja_JP",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [image],
    },
  };
}

/** WebSite + Person を @graph でまとめた構造化データ（サイト全体に適用）。 */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: "ja",
        description: DEFAULT_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name: AUTHOR_NAME,
        alternateName: [SITE_NAME, AUTHOR_NAME_EN],
        url: SITE_URL,
        image: `${SITE_URL}${OG_IMAGE}`,
        jobTitle: "2D/3D Artist / Illustrator",
        description: DEFAULT_DESCRIPTION,
        knowsAbout: [
          "デフォルメ",
          "世界観",
          "ストーリー",
          "イラスト",
          "コンセプト",
          "コンセプトアート",
          "背景イラスト",
        ],
        sameAs: SAME_AS,
      },
    ],
  };
}

/** ワールド個別ページ用の CollectionPage 構造化データ。 */
export function worldJsonLd(input: {
  name: string;
  nameEn?: string;
  description: string;
  path: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    alternateName: input.nameEn || undefined,
    description: input.description,
    url: `${SITE_URL}${input.path}`,
    inLanguage: "ja",
    ...(input.image ? { image: input.image } : {}),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#person` },
    keywords: ["世界観", "ストーリー", "コンセプト", "イラスト", "デフォルメ"],
  };
}
