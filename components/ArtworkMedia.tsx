"use client";

import { MEDIA_COVER_ASSET_CLASS } from "@/lib/media-cover";
import { proxyNotionImage } from "@/lib/img-proxy";
import LazyVideo from "./LazyVideo";
import MediaCover from "./MediaCover";

type Props = {
  src: string;
  alt: string;
  sizes?: string;
  mediaType?: "image" | "video";
  playing?: boolean;
  muted?: boolean;
  poster?: boolean;
  /** eager を渡すと loading="eager"。省略時は lazy */
  eager?: boolean;
  /** 表示幅(px)。指定するとプロキシでリサイズ（Retina なら 2 倍を渡す） */
  displayWidth?: number;
  onAspectRatio?: (ratio: number) => void;
};

function isVideo(src: string, mediaType?: "image" | "video") {
  return mediaType === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(src);
}

export default function ArtworkMedia({
  src,
  alt,
  mediaType,
  playing = false,
  muted = true,
  poster = false,
  eager = false,
  displayWidth,
  onAspectRatio,
}: Props) {
  const reportRatio = (width: number, height: number) => {
    if (width > 0 && height > 0) onAspectRatio?.(width / height);
  };

  if (isVideo(src, mediaType)) {
    return (
      <MediaCover fill>
        <LazyVideo
          src={src}
          alt={alt}
          active={playing || eager}
          muted={muted}
          onAspectRatio={onAspectRatio}
        />
      </MediaCover>
    );
  }

  return (
    <MediaCover fill>
      {/* Notion S3 は署名付き URL が毎時変化するため next/image を使わず直接表示。
          同一オリジンプロキシ経由にすることで CORS を回避しブラウザキャッシュを安定させる */}
      <img
        className={MEDIA_COVER_ASSET_CLASS}
        src={proxyNotionImage(src, displayWidth)}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        onLoad={(e) => {
          const img = e.currentTarget;
          reportRatio(img.naturalWidth, img.naturalHeight);
        }}
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
      />
    </MediaCover>
  );
}
