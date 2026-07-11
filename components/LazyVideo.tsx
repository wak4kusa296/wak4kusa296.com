"use client";

import { useEffect, useRef } from "react";
import { MEDIA_COVER_ASSET_CLASS } from "@/lib/media-cover";

type Props = {
  src: string;
  alt: string;
  /** true のときだけ動画を読み込み・再生する */
  active: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onAspectRatio?: (ratio: number) => void;
  onReady?: () => void;
};

/**
 * 動画は active になるまで src を付けない（帯域を食わない）。
 * active 時は metadata のみ先読みし、再生可能になったら play する。
 */
export default function LazyVideo({
  src,
  alt,
  active,
  muted = true,
  loop = true,
  className,
  style,
  onAspectRatio,
  onReady,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const framedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!active) {
      framedRef.current = false;
      video.pause();
      video.removeAttribute("src");
      video.load();
      return;
    }

    if (video.src !== src) {
      video.src = src;
      video.load();
    }

    video.muted = muted;

    const tryPlay = () => {
      video.play().catch(() => {});
      onReady?.();
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      tryPlay();
    } else {
      video.addEventListener("loadeddata", tryPlay, { once: true });
      return () => video.removeEventListener("loadeddata", tryPlay);
    }
  }, [active, src, muted, onReady]);

  return (
    <>
      {!active && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "#E8E8E8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: "#666",
            }}
          >
            ▶
          </span>
        </div>
      )}
      <video
        ref={videoRef}
        className={className ?? MEDIA_COVER_ASSET_CLASS}
        style={{
          ...style,
          pointerEvents: active ? "auto" : "none",
        }}
        muted={muted}
        loop={loop}
        playsInline
        preload="none"
        aria-label={alt}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          if (v.videoWidth > 0 && v.videoHeight > 0) {
            onAspectRatio?.(v.videoWidth / v.videoHeight);
          }
          if (!framedRef.current && active) {
            framedRef.current = true;
            v.currentTime = 0.001;
          }
        }}
        onError={() => onReady?.()}
      />
    </>
  );
}
