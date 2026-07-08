export type Artwork = {
  id: string;
  title: { ja: string; en: string };
  /** 表示用（複数タグは " · " 区切り） */
  world: string;
  worldId?: string;
  /** 紐づく世界観タグ（1件以上） */
  worlds?: string[];
  date: string;
  /** image or video URL */
  src: string;
  /** "image" (default) or "video" */
  mediaType?: "image" | "video";
  /** width/height ratio — computed from media file dimensions */
  aspectRatio?: number;
  caption: { ja: string; en: string };
  classCode: string;
  coordinates: string;
  classLabel: string;
  status: string;
  /** Notionの「強調」トグルがONの作品。キャンバス上で4倍の面積で表示する */
  featured?: boolean;
  x?: number;
  y?: number;
};

export const WORLDS = ["IDMO", "キントキ新山", "かぎのこ"] as const;
export type World = (typeof WORLDS)[number];

export function getArtworkWorlds(artwork: Pick<Artwork, "world" | "worlds">): string[] {
  if (artwork.worlds?.length) return artwork.worlds;
  return artwork.world ? [artwork.world] : [];
}

export function getWorldColor(_world: string): string {
  return "#222222";
}
