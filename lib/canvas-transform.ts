/** カード 180px / 144px がスクリーン上でも整数 px になるよう 1/36 刻みでスナップ */
export const CANVAS_ZOOM_DENOM = 36;
export const CANVAS_ZOOM_MIN = 5 / CANVAS_ZOOM_DENOM;
export const CANVAS_ZOOM_MAX = 108 / CANVAS_ZOOM_DENOM; // 3
export const CANVAS_DEFAULT_ZOOM = 0.9;

export function clampCanvasZoom(zoom: number) {
  return Math.min(CANVAS_ZOOM_MAX, Math.max(CANVAS_ZOOM_MIN, zoom));
}

export function snapCanvasZoom(zoom: number) {
  const clamped = clampCanvasZoom(zoom);
  return Math.round(clamped * CANVAS_ZOOM_DENOM) / CANVAS_ZOOM_DENOM;
}

export function snapCanvasPan(x: number, y: number) {
  return { x: Math.round(x), y: Math.round(y) };
}

type CanvasLayerSnap = boolean | { pan?: boolean; zoom?: boolean };

function resolveLayerSnap(snap: CanvasLayerSnap) {
  if (typeof snap === "boolean") return { pan: snap, zoom: snap };
  return { pan: snap.pan ?? true, zoom: snap.zoom ?? true };
}

export function canvasLayerTransform(panX: number, panY: number, zoom: number, snap: CanvasLayerSnap = true) {
  const { pan: snapPan, zoom: snapZoom } = resolveLayerSnap(snap);
  const z = snapZoom ? snapCanvasZoom(zoom) : clampCanvasZoom(zoom);
  const { x, y } = snapPan ? snapCanvasPan(panX, panY) : { x: panX, y: panY };
  return { panX: x, panY: y, zoom: z, css: `translate3d(${x}px,${y}px,0) scale(${z})` };
}

/** キャンバス上の点をビューポート中央に合わせるパン */
export function panToCanvasPoint(
  canvasX: number,
  canvasY: number,
  viewportW: number,
  viewportH: number,
  zoom: number,
  snap = true
) {
  return canvasLayerTransform(
    viewportW / 2 - canvasX * zoom,
    viewportH / 2 - canvasY * zoom,
    zoom,
    snap
  );
}

/** カードのスクリーン上サイズを初期表示（デフォルトズーム）を上限にする */
export function cardCounterScale(zoom: number) {
  return Math.min(1 / zoom, 1 / CANVAS_DEFAULT_ZOOM);
}
