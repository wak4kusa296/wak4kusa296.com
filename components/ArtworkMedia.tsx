"use client";

import { useEffect, useRef } from "react";
import { MEDIA_COVER_ASSET_CLASS } from "@/lib/media-cover";
import { proxyNotionImage } from "@/lib/img-proxy";
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
  onAspectRatio,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const framedRef = useRef(false);

  const reportRatio = (width: number, height: number) => {
    if (width > 0 && height > 0) onAspectRatio?.(width / height);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo(src, mediaType)) return;
    if (playing) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playing, src, mediaType]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo(src, mediaType)) return;
    video.muted = muted;
    if (!muted && playing) {
      video.play().catch(() => {});
    }
  }, [muted, playing, src, mediaType]);

  if (isVideo(src, mediaType)) {
    return (
      <MediaCover fill>
        <video
          ref={videoRef}
          className={MEDIA_COVER_ASSET_CLASS}
          src={src}
          muted={muted}
          loop
          playsInline
          preload="auto"
          poster={poster ? "/images/placeholder-video.svg" : undefined}
          aria-label={alt}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            reportRatio(v.videoWidth, v.videoHeight);
            if (framedRef.current) return;
            framedRef.current = true;
            v.currentTime = 0.001;
          }}
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
        src={proxyNotionImage(src)}
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
