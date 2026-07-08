"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { easeCubicInOut } from "d3-ease";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import { select } from "d3-selection";
import type { Artwork } from "@/lib/artworks";
import { getArtworkWorlds } from "@/lib/artworks";
import { type CanvasNode } from "@/lib/canvas-layout";
import { cardSize } from "@/lib/canvas-card";
import {
  CANVAS_DEFAULT_ZOOM,
  CANVAS_ZOOM_MAX,
  CANVAS_ZOOM_MIN,
  canvasLayerTransform,
  cardCounterScale,
  panToCanvasPoint,
} from "@/lib/canvas-transform";
import { FONT, GRAY, CANVAS_TYPE } from "@/lib/site-type";
import { FRAME_STYLE, BOX_RADIUS } from "@/lib/site-frame";
import { MEDIA_COVER_ASSET_CLASS } from "@/lib/media-cover";
import MediaCover from "./MediaCover";
import PostcardPopup from "./PostcardPopup";

type Props = {
  artworks: Artwork[];
  initialNodes: CanvasNode[];
  intro?: { ja: string; en: string };
};

const FOCUS_PAN_MS = 650;

function isZoomGestureTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return !target.closest("[data-card], [data-popup], [data-ui]");
}

function isCanvasWheelTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return !target.closest("[data-popup]");
}

function CardMedia({
  artwork,
  eager,
  playing,
  onAspectRatio,
}: {
  artwork: Artwork;
  eager?: boolean;
  playing: boolean;
  onAspectRatio: (ratio: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const framedRef = useRef(false);
  // カードごとに独立してフェードインさせる（他のカードの読み込み状況に一切依存しない）
  const [loaded, setLoaded] = useState(false);

  const reportRatio = useCallback(
    (width: number, height: number) => {
      if (width > 0 && height > 0) onAspectRatio(width / height);
    },
    [onAspectRatio]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || artwork.mediaType !== "video") return;
    if (playing) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playing, artwork.mediaType]);

  const mediaStyle = {
    opacity: loaded ? 1 : 0,
    transition: "opacity 300ms ease",
  };

  if (artwork.mediaType === "video") {
    return (
      <MediaCover fill style={{ position: "absolute", inset: 0 }}>
        <video
          ref={videoRef}
          className={MEDIA_COVER_ASSET_CLASS}
          style={mediaStyle}
          src={artwork.src}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            reportRatio(v.videoWidth, v.videoHeight);
            if (!framedRef.current) {
              framedRef.current = true;
              v.currentTime = 0.001;
            }
          }}
          onLoadedData={(e) => {
            if (!playing) e.currentTarget.pause();
            setLoaded(true);
          }}
          onSeeked={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      </MediaCover>
    );
  }
  return (
    <MediaCover fill style={{ position: "absolute", inset: 0 }}>
      {/* キャンバスサムネイルは小さいため next/image を使わず変換枠を消費しない */}
      <img
        className={MEDIA_COVER_ASSET_CLASS}
        style={mediaStyle}
        src={artwork.src}
        alt={artwork.title.ja}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        onLoad={(e) => {
          const img = e.currentTarget;
          reportRatio(img.naturalWidth, img.naturalHeight);
          setLoaded(true);
        }}
        onError={() => setLoaded(true)}
      />
    </MediaCover>
  );
}

export default function CanvasClient({ artworks, initialNodes, intro }: Props) {
  const [nodes, setNodes] = useState<CanvasNode[]>(initialNodes);
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);

  const layerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(CANVAS_DEFAULT_ZOOM);
  const zoomBehaviorRef = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(null);
  const snappingRef = useRef(false);

  const applyZoomTransform = useCallback((x: number, y: number, k: number) => {
    panRef.current = { x, y };
    zoomRef.current = k;
    if (!layerRef.current) return;
    layerRef.current.style.transform = `translate3d(${x}px,${y}px,0) scale(${k})`;
    layerRef.current.style.setProperty("--canvas-card-scale", String(cardCounterScale(k)));
  }, []);

  const animatePanTo = useCallback((canvasX: number, canvasY: number, zoom: number) => {
    const el = containerRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!el || !behavior) return;

    const t = panToCanvasPoint(canvasX, canvasY, el.clientWidth, el.clientHeight, zoom, true);

    snappingRef.current = true;
    select(el)
      .transition()
      .duration(FOCUS_PAN_MS)
      .ease(easeCubicInOut)
      .call(behavior.transform, zoomIdentity.translate(t.panX, t.panY).scale(t.zoom))
      .on("end", () => {
        snappingRef.current = false;
      });
  }, []);

  const centerView = useCallback(() => {
    animatePanTo(0, 0, CANVAS_DEFAULT_ZOOM);
  }, [animatePanTo]);

  const focusWorld = useCallback(
    (world: string) => {
      const members = nodes.filter((n) => getArtworkWorlds(n).includes(world));
      if (!members.length) return;

      let cx = 0;
      let cy = 0;
      for (const n of members) {
        cx += n.x;
        cy += n.y;
      }
      cx /= members.length;
      cy /= members.length;

      animatePanTo(cx, cy, zoomRef.current);
    },
    [animatePanTo, nodes]
  );

  useEffect(() => {
    setNodes(initialNodes);
    setLoadKey((k) => k + 1);
  }, [initialNodes]);

  const handleAspectRatio = useCallback((id: string, aspectRatio: number) => {
    setNodes((prev) => {
      const node = prev.find((n) => n.id === id);
      if (!node || Math.abs((node.aspectRatio ?? 0) - aspectRatio) < 0.01) return prev;
      return prev.map((n) => (n.id === id ? { ...n, aspectRatio } : n));
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const behavior = zoom<HTMLDivElement, unknown>()
      .scaleExtent([CANVAS_ZOOM_MIN, CANVAS_ZOOM_MAX])
      .wheelDelta((event) => {
        const modeScale = event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.001;
        const pinchScale = event.ctrlKey ? 2.5 : 1;
        return -event.deltaY * modeScale * pinchScale;
      })
      .filter((event) => {
        if (event.type === "dblclick") return false;
        if (event.type === "wheel") return isCanvasWheelTarget(event.target);
        return isZoomGestureTarget(event.target);
      })
      .on("start", (event) => {
        if (event.sourceEvent?.type !== "wheel") {
          el.style.cursor = "grabbing";
        }
      })
      .on("zoom", (event) => {
        applyZoomTransform(event.transform.x, event.transform.y, event.transform.k);
      })
      .on("end", (event) => {
        el.style.cursor = "grab";
        if (snappingRef.current) return;

        const fromWheel = event.sourceEvent?.type === "wheel";
        const t = canvasLayerTransform(event.transform.x, event.transform.y, event.transform.k, {
          pan: true,
          zoom: !fromWheel,
        });
        if (
          t.panX === event.transform.x &&
          t.panY === event.transform.y &&
          t.zoom === event.transform.k
        ) {
          return;
        }

        snappingRef.current = true;
        select(el).call(behavior.transform, zoomIdentity.translate(t.panX, t.panY).scale(t.zoom));
        snappingRef.current = false;
      });

    zoomBehaviorRef.current = behavior;
    const selection = select(el);
    selection.call(behavior);

    const t = panToCanvasPoint(0, 0, el.clientWidth, el.clientHeight, CANVAS_DEFAULT_ZOOM, true);
    snappingRef.current = true;
    selection.call(behavior.transform, zoomIdentity.translate(t.panX, t.panY).scale(t.zoom));
    snappingRef.current = false;

    return () => {
      selection.on(".zoom", null);
      zoomBehaviorRef.current = null;
    };
  }, [applyZoomTransform]);

  const resetCenter = centerView;

  const worlds = [...new Set(artworks.flatMap((a) => getArtworkWorlds(a)).filter(Boolean))];
  const worldZ = Object.fromEntries(worlds.map((w, i) => [w, i]));

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        cursor: "grab",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {/* World legend */}
      <div
        data-ui="true"
        style={{
          position: "absolute",
          bottom: "24px",
          left: "24px",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {worlds.map((w) => (
          <button
            key={w}
            type="button"
            data-ui="true"
            onClick={() => focusWorld(w)}
            title={`${w} の作品へ移動`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontFamily: FONT,
              fontSize: CANVAS_TYPE.legend,
              color: GRAY,
              letterSpacing: "0.08em",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#222222";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = GRAY;
            }}
          >
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#888888", flexShrink: 0 }} />
            <span>{w}</span>
          </button>
        ))}
        <div
          style={{
            fontFamily: FONT,
            fontSize: CANVAS_TYPE.hint,
            color: GRAY,
            letterSpacing: "0.06em",
            marginTop: "4px",
            pointerEvents: "none",
          }}
        >
          DRAG · SCROLL TO ZOOM
        </div>
      </div>

      {/* Center button — fixed bottom right */}
      <button
        data-ui="true"
        onClick={resetCenter}
        title="ホームに戻る"
        style={{
          position: "absolute",
          bottom: "24px",
          right: "24px",
          zIndex: 10,
          width: "40px",
          height: "40px",
          background: "#222222",
          border: "none",
          borderRadius: BOX_RADIUS,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.7,
          transition: "opacity 0.2s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.7")}
      >
        {/* crosshair icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="2.5" stroke="#F5F5F5" strokeWidth="1.2"/>
          <line x1="8" y1="0" x2="8" y2="4.5" stroke="#F5F5F5" strokeWidth="1.2"/>
          <line x1="8" y1="11.5" x2="8" y2="16" stroke="#F5F5F5" strokeWidth="1.2"/>
          <line x1="0" y1="8" x2="4.5" y2="8" stroke="#F5F5F5" strokeWidth="1.2"/>
          <line x1="11.5" y1="8" x2="16" y2="8" stroke="#F5F5F5" strokeWidth="1.2"/>
        </svg>
      </button>

      {/* Canvas layer */}
      <div
        ref={layerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transformOrigin: "0 0",
          willChange: "transform",
          ["--canvas-card-scale" as string]: cardCounterScale(zoomRef.current),
        }}
      >
        {/* Site title at canvas origin */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div style={{ fontFamily: FONT, fontSize: CANVAS_TYPE.title, fontWeight: 700, color: "#222222", letterSpacing: "0.04em", lineHeight: 1.2, whiteSpace: "nowrap" }}>
            若草フクロウ
          </div>
          <div style={{ fontFamily: FONT, fontSize: CANVAS_TYPE.subtitle, color: GRAY, letterSpacing: "0.18em", marginTop: "6px", whiteSpace: "nowrap" }}>
            Goto Tatsuya
          </div>
          {(intro?.ja || intro?.en) && (
            <div style={{ marginTop: "20px", maxWidth: "360px" }}>
              {intro.ja && (
                <p
                  style={{
                    fontFamily: FONT,
                    fontSize: CANVAS_TYPE.introJa,
                    color: "#666666",
                    lineHeight: 1.85,
                    margin: 0,
                    whiteSpace: "pre-line",
                  }}
                >
                  {intro.ja}
                </p>
              )}
              {intro.en && (
                <p
                  style={{
                    fontFamily: FONT,
                    fontSize: CANVAS_TYPE.introEn,
                    color: "#999999",
                    lineHeight: 1.75,
                    margin: intro.ja ? "10px 0 0" : 0,
                    whiteSpace: "pre-line",
                  }}
                >
                  {intro.en}
                </p>
              )}
            </div>
          )}
          <div
            className="drag-hint"
            style={{
              marginTop: intro?.ja || intro?.en ? "28px" : "36px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div className="drag-hint-crosshair" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="2.5" stroke="#888888" strokeWidth="1.2" />
                <line x1="8" y1="0" x2="8" y2="4.5" stroke="#888888" strokeWidth="1.2" />
                <line x1="8" y1="11.5" x2="8" y2="16" stroke="#888888" strokeWidth="1.2" />
                <line x1="0" y1="8" x2="4.5" y2="8" stroke="#888888" strokeWidth="1.2" />
                <line x1="11.5" y1="8" x2="16" y2="8" stroke="#888888" strokeWidth="1.2" />
              </svg>
            </div>
            <p
              style={{
                fontFamily: FONT,
                fontSize: CANVAS_TYPE.dragHint,
                color: GRAY,
                letterSpacing: "0.08em",
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              自由にドラッグしてください
            </p>
            <p
              style={{
                fontFamily: FONT,
                fontSize: CANVAS_TYPE.dragHintEn,
                color: "#999999",
                letterSpacing: "0.1em",
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              Drag freely
            </p>
          </div>
        </div>

        {nodes.map((node, index) => {
          const { width, height } = cardSize(node);
          const left = node.x - width / 2;
          const top = node.y - height / 2;
          const hovered = hoveredId === node.id;
          return (
            <div
              key={node.id}
              data-card="true"
              className="canvas-card"
              onClick={() => setSelected(node)}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: "absolute",
                left,
                top,
                width,
                height,
                cursor: "pointer",
                background: "#FFFFFF",
                transformOrigin: "center center",
                transform: hovered
                  ? "scale(var(--canvas-card-scale, 1)) translate3d(0,-4px,0)"
                  : "scale(var(--canvas-card-scale, 1))",
                zIndex: hovered
                  ? 9000
                  : (worldZ[getArtworkWorlds(node)[0]] ?? 0) * 100 + node.stackIndex,
                ...FRAME_STYLE,
              }}
            >
              <CardMedia
                key={`${node.id}-${loadKey}`}
                artwork={node}
                eager={index === 0}
                playing={hovered || selected?.id === node.id}
                onAspectRatio={(ratio) => handleAspectRatio(node.id, ratio)}
              />

              {/* Hover overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(17,17,17,0.68)",
                display: "flex", flexDirection: "column", justifyContent: "flex-end",
                padding: "10px 8px",
                opacity: hovered ? 1 : 0,
                transition: "opacity 0.2s",
                pointerEvents: "none",
              }}>
                <div style={{ fontFamily: FONT, fontSize: CANVAS_TYPE.cardTitle, color: "#FFFFFF", lineHeight: 1.4, fontWeight: 700 }}>
                  {node.title.ja}
                </div>
                <div style={{ fontFamily: FONT, fontSize: CANVAS_TYPE.cardMeta, color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em", marginTop: "3px" }}>
                  {node.world}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && <PostcardPopup artwork={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
