"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { Artwork } from "@/lib/artworks";
import { cardSize } from "@/lib/canvas-card";
import { proxyNotionImage } from "@/lib/img-proxy";
import { FRAME_STYLE } from "@/lib/site-frame";
import { FONT, DARK, GRAY, POSTCARD_TYPE } from "@/lib/site-type";
import ArtworkMedia from "./ArtworkMedia";
import VideoSoundToggle from "./VideoSoundToggle";
import { useVideoAudio } from "./VideoAudioProvider";

type Props = { artwork: Artwork; onClose: () => void };

/** ポップアップ表示幅の目安（Retina 2x で w=1200） */
const POPUP_DISPLAY_W = 600;

/** キャンバスと同じサムネを即表示し、裏で大きめ画像を読み込む */
function PopupImage({ artwork }: { artwork: Artwork }) {
  const thumbW = Math.round(cardSize(artwork).width * 2);
  const thumbSrc = proxyNotionImage(artwork.src, thumbW);
  const fullSrc = proxyNotionImage(artwork.src, POPUP_DISPLAY_W * 2);
  const [fullLoaded, setFullLoaded] = useState(false);

  useEffect(() => {
    setFullLoaded(false);
  }, [fullSrc]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <img
        src={thumbSrc}
        alt=""
        aria-hidden
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: fullLoaded ? "none" : "blur(8px)",
          transform: fullLoaded ? "none" : "scale(1.05)",
          transition: "filter 0.25s ease, transform 0.25s ease",
        }}
      />
      <img
        src={fullSrc}
        alt={artwork.title.ja}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        draggable={false}
        onLoad={() => setFullLoaded(true)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: fullLoaded ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
      />
    </div>
  );
}

export default function PostcardPopup({ artwork, onClose }: Props) {
  const [side, setSide] = useState<"front" | "back">("front");
  const [mounted, setMounted] = useState(false);
  const { muted } = useVideoAudio();
  const [ratio, setRatio] = useState(artwork.aspectRatio ?? 2 / 3);
  const ratioLockedRef = useRef(false);

  const handleAspectRatio = useCallback((next: number) => {
    if (next <= 0 || ratioLockedRef.current) return;
    ratioLockedRef.current = true;
    setRatio(next);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSide("front");
    const initial = artwork.aspectRatio ?? 2 / 3;
    ratioLockedRef.current = Boolean(artwork.aspectRatio && artwork.aspectRatio > 0);
    setRatio(initial);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [artwork, onClose]);

  const flip = () => setSide((s) => (s === "front" ? "back" : "front"));

  const scrollRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef({ scrollTop: 0, x: 0, y: 0 });

  const handleCardPointerDown = (e: React.PointerEvent) => {
    pressRef.current = {
      scrollTop: scrollRef.current?.scrollTop ?? 0,
      x: e.clientX,
      y: e.clientY,
    };
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (side === "back") {
      const el = scrollRef.current;
      const { scrollTop, x, y } = pressRef.current;
      const dx = e.clientX - x;
      const dy = e.clientY - y;
      if (el && el.scrollTop !== scrollTop) return;
      if (dx * dx + dy * dy > 64) return;
    }
    flip();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div
      data-popup="true"
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(17,17,17,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      className="fade-in"
    >
      <div
        onClick={handleCardClick}
        onPointerDown={handleCardPointerDown}
        className="float-up"
        style={{
          position: "relative",
          aspectRatio: ratio,
          width: `min(92vw, calc(80vh * ${ratio}))`,
          maxHeight: "80vh",
          cursor: "pointer",
        }}
        title={side === "front" ? "クリックで裏面へ" : "クリックで表面へ"}
      >
        {/* Front */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#111111",
            overflow: "hidden",
            opacity: side === "front" ? 1 : 0,
            pointerEvents: side === "front" ? "auto" : "none",
            transition: "opacity 0.3s ease",
            ...FRAME_STYLE,
          }}
        >
          {artwork.mediaType === "video" ? (
            <ArtworkMedia
              src={artwork.src}
              alt={artwork.title.ja}
              mediaType="video"
              eager
              playing
              muted={muted}
              onAspectRatio={handleAspectRatio}
            />
          ) : (
            <PopupImage artwork={artwork} />
          )}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              fontFamily: FONT,
              fontSize: POSTCARD_TYPE.flipHint,
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.08em",
              pointerEvents: "none",
            }}
          >
            TAP TO FLIP
          </div>
        </div>

        {/* Back */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#FFFFFF",
            overflow: "hidden",
            opacity: side === "back" ? 1 : 0,
            pointerEvents: side === "back" ? "auto" : "none",
            transition: "opacity 0.3s ease",
            display: "flex",
            flexDirection: "column",
            ...FRAME_STYLE,
          }}
        >
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              padding: "28px 24px 40px",
            }}
            onWheel={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: FONT,
                fontSize: POSTCARD_TYPE.code,
                color: GRAY,
                letterSpacing: "0.1em",
                marginBottom: "20px",
              }}
            >
              {artwork.classCode}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: POSTCARD_TYPE.titleJa,
                    fontWeight: 700,
                    color: DARK,
                    lineHeight: 1.35,
                  }}
                >
                  {artwork.title.ja}
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: POSTCARD_TYPE.titleEn,
                    color: GRAY,
                    marginTop: "4px",
                    lineHeight: 1.4,
                  }}
                >
                  {artwork.title.en}
                </div>
              </div>

              <div
                style={{
                  fontFamily: FONT,
                  fontSize: POSTCARD_TYPE.meta,
                  color: GRAY,
                  letterSpacing: "0.06em",
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span>{artwork.world}</span>
                <span>·</span>
                <span>{artwork.date}</span>
              </div>

              <div style={{ borderTop: "1px solid #CCCCCC", paddingTop: "16px" }}>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: POSTCARD_TYPE.captionJa,
                    color: DARK,
                    lineHeight: 1.75,
                    marginBottom: "10px",
                    whiteSpace: "pre-line",
                  }}
                >
                  {artwork.caption.ja}
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: POSTCARD_TYPE.captionEn,
                    color: GRAY,
                    lineHeight: 1.7,
                    whiteSpace: "pre-line",
                  }}
                >
                  {artwork.caption.en}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #EBEBEB" }}>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: POSTCARD_TYPE.footer,
                  color: GRAY,
                  letterSpacing: "0.08em",
                  lineHeight: 1.7,
                }}
              >
                <div>{artwork.coordinates}</div>
                <div>
                  CLASS: {artwork.classLabel} / STATUS: {artwork.status}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              fontFamily: FONT,
              fontSize: POSTCARD_TYPE.flipHint,
              color: GRAY,
              letterSpacing: "0.08em",
              pointerEvents: "none",
            }}
          >
            TAP TO FLIP
          </div>
        </div>
      </div>

      {artwork.mediaType === "video" && (
        <VideoSoundToggle
          data-ui="true"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 210,
          }}
        />
      )}

      <button
        type="button"
        data-ui="true"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: "fixed",
          top: "20px",
          right: "24px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: FONT,
          fontSize: POSTCARD_TYPE.close,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.1em",
        }}
      >
        ESC / CLOSE
      </button>
    </div>,
    document.body
  );
}
