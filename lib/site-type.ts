export const FONT = '"LINE Seed JP", sans-serif';
export const DARK = "#222222";
export const GRAY = "#888888";

/** サイト共通 type scale（従来比で約1段階アップ） */
export const TYPE = {
  badge: "8px",
  caption: "9px",
  label: "10px",
  nav: "11px",
  navTitle: "16px",
  navSub: "9px",
  small: "12px",
  body: "13px",
  lead: "14px",
  prose: "15px",
  titleSm: "16px",
  titleMd: "18px",
  titleLg: "20px",
  titleXl: "22px",
  heading: "30px",
  display: "36px",
  hero: "40px",
  heroClamp: "clamp(24px, 4vw, 40px)",
  subClamp: "clamp(14px, 2vw, 18px)",
} as const;

/** キャンバス内テキスト（サイト共通より一段大きめ） */
export const CANVAS_TYPE = {
  hint: "11px",
  legend: "11px",
  title: "48px",
  subtitle: "17px",
  introJa: "14px",
  introEn: "12px",
  dragHint: "13px",
  dragHintEn: "11px",
  cardTitle: "13px",
  cardMeta: "11px",
  videoBadge: "10px",
} as const;

/** ポストカードポップアップ（裏面など大きめ表示） */
export const POSTCARD_TYPE = {
  code: "12px",
  titleJa: "26px",
  titleEn: "16px",
  meta: "13px",
  captionJa: "16px",
  captionEn: "14px",
  footer: "11px",
  flipHint: "11px",
  close: "12px",
} as const;

/** キャンバス原点のテキスト保護ゾーン（半幅・半高・余白） */
export const CANVAS_TEXT_ZONE = {
  halfW: 240,
  halfH: 170,
  margin: 48,
} as const;
