/** キャンバスカードの基準面積（2:3 × 高さ180px と同等） */
export const CARD_REF_H = 180;
const DEFAULT_RATIO = 2 / 3;
export const CARD_AREA = CARD_REF_H * CARD_REF_H * DEFAULT_RATIO;

/** Notionの「強調」トグルがONの作品の面積倍率 */
export const FEATURED_AREA_MULTIPLIER = 4;

/** @deprecated 基準高さ。描画サイズは cardSize を使う */
export const CARD_H = CARD_REF_H;

type CardLike = { aspectRatio?: number; featured?: boolean };

export function cardAspectRatio(artwork: { aspectRatio?: number }) {
  const r = artwork.aspectRatio ?? DEFAULT_RATIO;
  return r > 0 ? r : DEFAULT_RATIO;
}

export function cardSize(artwork: CardLike) {
  const r = cardAspectRatio(artwork);
  const area = artwork.featured ? CARD_AREA * FEATURED_AREA_MULTIPLIER : CARD_AREA;
  return {
    width: Math.sqrt(area * r),
    height: Math.sqrt(area / r),
  };
}

export function cardHalfW(artwork: CardLike) {
  return cardSize(artwork).width / 2;
}

export function cardHalfH(artwork: CardLike) {
  return cardSize(artwork).height / 2;
}
