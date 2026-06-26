/** 作品IDから決定的にメタデータを生成（表示のたびに同じ値） */

function hashFloat(key: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  }
  return (h >>> 0) / 0xffffffff;
}

/** ランダム風の分類コード（例: K7A2-9F3M-X2P1） */
export function generateClassCode(id: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (salt: number, len: number) =>
    Array.from({ length: len }, (_, i) => chars[Math.floor(hashFloat(id, salt + i) * chars.length)]).join("");
  return `${seg(1, 4)}-${seg(10, 4)}-${seg(20, 4)}`;
}

/** 架空座標 W.X.Y.Z */
export function generateCoordinates(id: string): string {
  const f = (salt: number) => (hashFloat(id, salt) * 999.9999).toFixed(4);
  return `W.${f(30)}.${f(31)}.${f(32)}`;
}

export function generateClassLabel(id: string): string {
  return id;
}

export type ArtworkMeta = {
  classCode: string;
  coordinates: string;
  classLabel: string;
};

export function assignArtworkMeta<T extends { id: string; world: string }>(item: T): T & ArtworkMeta {
  return {
    ...item,
    classCode: generateClassCode(item.id),
    coordinates: generateCoordinates(item.id),
    classLabel: generateClassLabel(item.id),
  };
}

export function enrichArtworkMetadata<T extends { id: string; world: string }>(
  items: T[]
): (T & ArtworkMeta)[] {
  return items.map(assignArtworkMeta);
}
