"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Artwork } from "@/lib/artworks";
import { FRAME_STYLE } from "@/lib/site-frame";
import { FONT, DARK, GRAY, POSTCARD_TYPE } from "@/lib/site-type";
import ArtworkMedia from "./ArtworkMedia";

type Props = { artwork: Artwork; onClose: () => void };

function sampleFromElement(el: HTMLImageElement | HTMLVideoElement): string {
  const SIZE = 80;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "#111111";
  ctx.drawImage(el, 0, 0, SIZE, SIZE);
  try {
    return sampleEdgeColor(ctx.getImageData(0, 0, SIZE, SIZE));
  } catch {
    return "#111111";
  }
}

function sampleEdgeColor(imageData: ImageData): string {
  const { data, width, height } = imageData;
  let r = 0,
    g = 0,
    b = 0,
    count = 0;
  const add = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  };
  for (let x = 0; x < width; x++) {
    add(x, 0);
    add(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    add(0, y);
    add(width - 1, y);
  }
  return `rgb(${Math.round(r / count)},${Math.round(g / count)},${Math.round(b / count)})`;
}

async function getEdgeColor(artwork: Artwork): Promise<string> {
  return new Promise((resolve) => {
    if (artwork.mediaType === "video") {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.onloadeddata = () => {
        try {
          resolve(sampleFromElement(video));
        } catch {
          resolve("#111111");
        }
        video.src = "";
      };
      video.onerror = () => resolve("#111111");
      video.src = artwork.src;
      video.load();
      setTimeout(() => resolve("#111111"), 5000);
    } else {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          resolve(sampleFromElement(img));
        } catch {
          resolve("#111111");
        }
      };
      img.onerror = () => resolve("#111111");
      img.src = artwork.src;
    }
  });
}

export default function PostcardPopup({ artwork, onClose }: Props) {
  const [side, setSide] = useState<"front" | "back">("front");
  const [edgeColor, setEdgeColor] = useState<string>("#111111");
  const [ratio, setRatio] = useState(artwork.aspectRatio ?? 2 / 3);
  const ratioLockedRef = useRef(false);

  const handleAspectRatio = useCallback((next: number) => {
    if (next <= 0 || ratioLockedRef.current) return;
    ratioLockedRef.current = true;
    setRatio(next);
  }, []);

  useEffect(() => {
    setSide("front");
    setEdgeColor("#111111");
    const initial = artwork.aspectRatio ?? 2 / 3;
    ratioLockedRef.current = Boolean(artwork.aspectRatio && artwork.aspectRatio > 0);
    setRatio(initial);
    getEdgeColor(artwork).then(setEdgeColor);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [artwork, onClose]);

  const flip = () => setSide((s) => (s === "front" ? "back" : "front"));

  return (
    <div
      data-popup="true"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
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
        onClick={(e) => e.stopPropagation()}
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
          onClick={flip}
          style={{
            position: "absolute",
            inset: 0,
            background: artwork.mediaType === "video" ? "#ffffff" : edgeColor,
            overflow: "hidden",
            opacity: side === "front" ? 1 : 0,
            pointerEvents: side === "front" ? "auto" : "none",
            transition: "opacity 0.3s ease, background 0.4s ease",
            ...FRAME_STYLE,
          }}
        >
          <ArtworkMedia
            src={artwork.src}
            alt={artwork.title.ja}
            sizes="92vw"
            mediaType={artwork.mediaType}
            playing={artwork.mediaType === "video"}
            onAspectRatio={handleAspectRatio}
          />
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
          onClick={flip}
          style={{
            position: "absolute",
            inset: 0,
            background: "#FFFFFF",
            overflow: "hidden",
            opacity: side === "back" ? 1 : 0,
            pointerEvents: side === "back" ? "auto" : "none",
            transition: "opacity 0.3s ease",
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            ...FRAME_STYLE,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: POSTCARD_TYPE.code,
              color: GRAY,
              letterSpacing: "0.1em",
              marginBottom: "20px",
              flexShrink: 0,
            }}
          >
            {artwork.classCode}
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              paddingRight: "4px",
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
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
          </div>

          <div style={{ flexShrink: 0, marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #EBEBEB" }}>
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
      </div>

      <button
        onClick={onClose}
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
    </div>
  );
}
