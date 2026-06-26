import type { CSSProperties } from "react";

/** 作品・メディア枠 — globals.css の `.frame` と同期 */
export const FRAME_BORDER_COLOR = "#222222";
export const FRAME_BORDER = `2px solid ${FRAME_BORDER_COLOR}`;
export const FRAME_RADIUS = 8;
export const BOX_RADIUS = 4;
/** 固定ヘッダー高さ — globals.css の `--site-header-height` と同期 */
export const SITE_HEADER_HEIGHT = 52;

export const FRAME_STYLE: CSSProperties = {
  border: FRAME_BORDER,
  borderRadius: FRAME_RADIUS,
  overflow: "hidden",
  boxShadow: "none",
};

export const BOX_STYLE: CSSProperties = {
  borderRadius: BOX_RADIUS,
};

export const FRAME_CLASS = "frame";
export const BOX_CLASS = "box";
