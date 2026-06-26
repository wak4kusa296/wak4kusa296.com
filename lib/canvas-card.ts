/** キャンバスカードの基準面積（2:3 × 高さ180px と同等） */
export const CARD_REF_H = 180;
const DEFAULT_RATIO = 2 / 3;
export const CARD_AREA = CARD_REF_H * CARD_REF_H * DEFAULT_RATIO;

/** @deprecated 基準高さ。描画サイズは cardSize を使う */
export const CARD_H = CARD_REF_H;

export function cardAspectRatio(artwork: { aspectRatio?: number }) {
  const r = artwork.aspectRatio ?? DEFAULT_RATIO;
  return r > 0 ? r : DEFAULT_RATIO;
}

export function cardSize(artwork: { aspectRatio?: number }) {
  const r = cardAspectRatio(artwork);
  return {
    width: Math.sqrt(CARD_AREA * r),
    height: Math.sqrt(CARD_AREA / r),
  };
}

export function cardHalfW(artwork: { aspectRatio?: number }) {
  return cardSize(artwork).width / 2;
}

export function cardHalfH(artwork: { aspectRatio?: number }) {
  return cardSize(artwork).height / 2;
}
