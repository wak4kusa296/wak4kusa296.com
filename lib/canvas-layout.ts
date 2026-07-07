import type { Artwork } from "@/lib/artworks";
import { getArtworkWorlds } from "@/lib/artworks";
import { CARD_AREA, CARD_H, cardHalfH, cardHalfW, cardSize } from "@/lib/canvas-card";
import { CANVAS_TEXT_ZONE } from "@/lib/site-type";

export type CanvasNode = Artwork & {
  x: number;
  y: number;
  vx: number;
  vy: number;
  stackIndex: number;
};

export { CARD_H };
/** カード面積に対する重なりの上限（関連タグ同士のみ） */
export const MAX_OVERLAP_RATIO = 0.1;
/** まとまり（タグ群）をファーストビュー中心へ寄せる係数 */
const CLUSTER_INWARD = 0.80;
const STAGGER_RATIO = 0.25;
const UNRELATED_GAP = 28;
const { halfW: TEXT_HW, halfH: TEXT_HH, margin: TEXT_MARGIN } = CANVAS_TEXT_ZONE;

function hashFloat(key: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function signOrRandom(value: number, salt: string) {
  if (value !== 0) return Math.sign(value);
  return hashFloat(salt, 7) > 0.5 ? 1 : -1;
}

function sharesWorld(a: Pick<Artwork, "world" | "worlds">, b: Pick<Artwork, "world" | "worlds">) {
  const wa = getArtworkWorlds(a);
  const wb = getArtworkWorlds(b);
  return wa.some((w) => wb.includes(w));
}

function worldsKey(worlds: string[]) {
  return [...worlds].sort().join("\0");
}

function textZoneOverlap(n: CanvasNode) {
  const hw = cardHalfW(n);
  const hh = cardHalfH(n);
  const textHw = TEXT_HW + TEXT_MARGIN;
  const textHh = TEXT_HH + TEXT_MARGIN;
  const overlapX = textHw + hw - Math.abs(n.x);
  const overlapY = textHh + hh - Math.abs(n.y);
  return { overlapX, overlapY, textHw, textHh, hw, hh };
}

function pushOutFromOrigin(value: number, minAbs: number, salt: string) {
  const sign = value !== 0 ? Math.sign(value) : signOrRandom(0, salt);
  return sign * Math.max(minAbs, Math.abs(value));
}

function fixTextZoneOverlaps(nodes: CanvasNode[]): boolean {
  let moved = false;
  for (const n of nodes) {
    const { overlapX, overlapY, textHw, textHh, hw, hh } = textZoneOverlap(n);
    // 矩形同士が実際に重なっているときだけ退避（片軸だけの一致では十字分断しない）
    if (overlapX <= 0 || overlapY <= 0) continue;

    if (overlapX <= overlapY) {
      n.x = pushOutFromOrigin(n.x, textHw + hw, n.id);
    } else {
      n.y = pushOutFromOrigin(n.y, textHh + hh, `${n.id}-y`);
    }
    moved = true;
  }
  return moved;
}

function pairOverlap(a: CanvasNode, b: CanvasNode) {
  const overlapX = cardHalfW(a) + cardHalfW(b) - Math.abs(b.x - a.x);
  const overlapY = cardHalfH(a) + cardHalfH(b) - Math.abs(b.y - a.y);
  return {
    overlapX,
    overlapY,
    overlaps: overlapX > 0 && overlapY > 0,
  };
}

function overlapAreaRatio(a: CanvasNode, b: CanvasNode): number {
  const { overlapX, overlapY, overlaps } = pairOverlap(a, b);
  if (!overlaps) return 0;
  const overlapArea = overlapX * overlapY;
  return overlapArea / CARD_AREA;
}

function minStaggerX(a: CanvasNode, b: CanvasNode) {
  return Math.min(cardSize(a).width, cardSize(b).width) * STAGGER_RATIO;
}

function minStaggerY(a: CanvasNode, b: CanvasNode) {
  return Math.min(cardSize(a).height, cardSize(b).height) * STAGGER_RATIO;
}

/** 関連のないタグ同士は一切重ねない */
function resolveUnrelatedOverlap(a: CanvasNode, b: CanvasNode): boolean {
  if (sharesWorld(a, b)) return false;
  const { overlapX, overlapY, overlaps } = pairOverlap(a, b);
  if (!overlaps) return false;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const shift = (overlapX < overlapY ? overlapX : overlapY) + UNRELATED_GAP;

  a.x -= ux * shift * 0.5;
  a.y -= uy * shift * 0.5;
  b.x += ux * shift * 0.5;
  b.y += uy * shift * 0.5;
  return true;
}

function resolveAxisAlignedOverlap(a: CanvasNode, b: CanvasNode): boolean {
  const { overlaps } = pairOverlap(a, b);
  if (!overlaps) return false;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const needDx = minStaggerX(a, b);
  const needDy = minStaggerY(a, b);
  const lacksX = Math.abs(dx) < needDx;
  const lacksY = Math.abs(dy) < needDy;
  if (!lacksX && !lacksY) return false;

  const top = a.stackIndex >= b.stackIndex ? a : b;
  const other = top === a ? b : a;
  let moved = false;

  if (lacksX && lacksY) {
    const angle = hashFloat(`${a.id}-${b.id}`, 32) * Math.PI * 2;
    const pushX = (needDx - Math.abs(dx) + 2) * 0.55;
    const pushY = (needDy - Math.abs(dy) + 2) * 0.55;
    top.x += Math.cos(angle) * pushX;
    top.y += Math.sin(angle) * pushY;
    other.x -= Math.cos(angle) * pushX * 0.45;
    other.y -= Math.sin(angle) * pushY * 0.45;
    return true;
  }

  if (lacksY) {
    const signY = dy >= 0 ? 1 : signOrRandom(0, `${a.id}-${b.id}-y`);
    const fix = needDy - Math.abs(dy) + 2;
    top.y += signY * fix * 0.6;
    other.y -= signY * fix * 0.4;
    moved = true;
  }

  if (lacksX) {
    const signX = dx >= 0 ? 1 : signOrRandom(0, `${a.id}-${b.id}`);
    const fix = needDx - Math.abs(dx) + 2;
    top.x += signX * fix * 0.6;
    other.x -= signX * fix * 0.4;
    moved = true;
  }

  return moved;
}

function resolveExcessOverlap(
  a: CanvasNode,
  b: CanvasNode,
  worldCenters: Record<string, { cx: number; cy: number }>
): boolean {
  if (overlapAreaRatio(a, b) <= MAX_OVERLAP_RATIO) return false;

  let dx = b.x - a.x;
  let dy = b.y - a.y;
  let dist = Math.hypot(dx, dy);
  if (dist < 2) {
    const angle = hashFloat(`${a.id}-${b.id}`, 19) * Math.PI * 2;
    dx = Math.cos(angle);
    dy = Math.sin(angle);
    dist = 1;
  }
  const ux = dx / dist;
  const uy = dy / dist;

  const top = a.stackIndex >= b.stackIndex ? a : b;
  const bottom = top === a ? b : a;
  const anchor = targetCenter(top, worldCenters);
  const ox = top.x - anchor.cx;
  const oy = top.y - anchor.cy;
  const od = Math.hypot(ox, oy) || 1;

  const push = 18;
  top.x += (ox / od) * push * 0.55 + ux * push * 0.45;
  top.y += (oy / od) * push * 0.55 + uy * push * 0.45;
  bottom.x -= ux * push * 0.35;
  bottom.y -= uy * push * 0.35;
  return true;
}

function shiftGroupAwayFromTextZone(nodes: CanvasNode[]): boolean {
  if (!nodes.length) return false;
  const textHw = TEXT_HW + TEXT_MARGIN;
  const textHh = TEXT_HH + TEXT_MARGIN;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x - cardHalfW(n));
    maxX = Math.max(maxX, n.x + cardHalfW(n));
    minY = Math.min(minY, n.y - cardHalfH(n));
    maxY = Math.max(maxY, n.y + cardHalfH(n));
  }

  const overlapX = Math.min(maxX, textHw) - Math.max(minX, -textHw);
  const overlapY = Math.min(maxY, textHh) - Math.max(minY, -textHh);
  if (overlapX <= 0 || overlapY <= 0) return false;

  const cx = nodes.reduce((sum, n) => sum + n.x, 0) / nodes.length;
  const cy = nodes.reduce((sum, n) => sum + n.y, 0) / nodes.length;

  if (overlapX <= overlapY) {
    const dx = (Math.sign(cx) || signOrRandom(0, nodes[0].id)) * (overlapX + UNRELATED_GAP);
    for (const n of nodes) n.x += dx;
  } else {
    const dy = (Math.sign(cy) || signOrRandom(0, `${nodes[0].id}-y`)) * (overlapY + UNRELATED_GAP);
    for (const n of nodes) n.y += dy;
  }
  return true;
}

function clearGroupFromTextZone(nodes: CanvasNode[]) {
  for (let pass = 0; pass < 20; pass++) {
    if (!shiftGroupAwayFromTextZone(nodes)) break;
  }
}

function enforceLayoutConstraints(
  nodes: CanvasNode[],
  worldCenters: Record<string, { cx: number; cy: number }>
) {
  for (let pass = 0; pass < 80; pass++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        if (!sharesWorld(a, b)) {
          if (resolveUnrelatedOverlap(a, b)) moved = true;
          continue;
        }
        if (resolveAxisAlignedOverlap(a, b)) moved = true;
        if (resolveExcessOverlap(a, b, worldCenters)) moved = true;
      }
    }
    if (!moved) break;
  }
}

function settleLayout(
  nodes: CanvasNode[],
  worldCenters: Record<string, { cx: number; cy: number }>
) {
  enforceLayoutConstraints(nodes, worldCenters);
  for (let pass = 0; pass < 40; pass++) {
    if (!fixTextZoneOverlaps(nodes)) break;
  }
}

function rotatePoint(x: number, y: number, angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: x * c - y * s, y: x * s + y * c };
}

function targetCenter(
  artwork: Pick<Artwork, "world" | "worlds">,
  worldCenters: Record<string, { cx: number; cy: number }>
) {
  const worlds = getArtworkWorlds(artwork);
  let x = 0;
  let y = 0;
  let count = 0;
  for (const w of worlds) {
    const wc = worldCenters[w];
    if (!wc) continue;
    x += wc.cx;
    y += wc.cy;
    count += 1;
  }
  if (!count) return { cx: 0, cy: 0 };
  return { cx: x / count, cy: y / count };
}

function layoutHoneycombGroup(
  items: Artwork[],
  center: { cx: number; cy: number },
  posById: Map<string, { x: number; y: number }>,
  groupKey: string
): CanvasNode[] {
  const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id));
  const n = sorted.length;
  const cols = Math.max(1, Math.ceil(Math.sqrt(n * 1.2)));
  const avgW = sorted.reduce((sum, a) => sum + cardSize(a).width, 0) / n;
  const avgH = sorted.reduce((sum, a) => sum + cardSize(a).height, 0) / n;
  const staggerX = avgW * STAGGER_RATIO;
  const staggerY = avgH * STAGGER_RATIO;
  const stepX = avgW * 0.82;
  const stepY = avgH * 0.82;
  const clusterRot = (hashFloat(groupKey, 16) - 0.5) * 0.14;
  const jitter = 6;

  const grid: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const gx = col * stepX + (row % 2 === 1 ? staggerX : 0) + staggerX * 0.5;
    const gy = row * stepY + col * staggerY * 0.35 + staggerY * 0.5;
    const rot = rotatePoint(gx, gy, clusterRot);
    const jx = (hashFloat(sorted[i].id, 1) - 0.5) * jitter * 2;
    const jy = (hashFloat(sorted[i].id, 2) - 0.5) * jitter * 2;
    grid.push({ x: rot.x + jx, y: rot.y + jy });
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    const hw = cardHalfW(sorted[i]);
    const hh = cardHalfH(sorted[i]);
    const p = grid[i];
    minX = Math.min(minX, p.x - hw);
    maxX = Math.max(maxX, p.x + hw);
    minY = Math.min(minY, p.y - hh);
    maxY = Math.max(maxY, p.y + hh);
  }
  const bx = (minX + maxX) / 2;
  const by = (minY + maxY) / 2;

  return sorted.map((a, i) => {
    const existing = posById.get(a.id);
    const p = grid[i];
    return {
      ...a,
      x: existing?.x ?? center.cx + p.x - bx,
      y: existing?.y ?? center.cy + p.y - by,
      vx: 0,
      vy: 0,
      stackIndex: i,
    };
  });
}

function buildCardLayout(
  artworks: Artwork[],
  worldCenters: Record<string, { cx: number; cy: number }>,
  posById: Map<string, { x: number; y: number }>
): CanvasNode[] {
  const singles = new Map<string, Artwork[]>();
  const bridges = new Map<string, Artwork[]>();

  for (const a of artworks) {
    const ws = getArtworkWorlds(a);
    if (!ws.length) continue;
    if (ws.length === 1) {
      const list = singles.get(ws[0]) ?? [];
      list.push(a);
      singles.set(ws[0], list);
    } else {
      const key = worldsKey(ws);
      const list = bridges.get(key) ?? [];
      list.push(a);
      bridges.set(key, list);
    }
  }

  const nodes: CanvasNode[] = [];

  for (const [world, items] of singles) {
    const wc = worldCenters[world];
    if (!wc) continue;
    const group = layoutHoneycombGroup(items, wc, posById, world);
    clearGroupFromTextZone(group);
    nodes.push(...group);
  }

  for (const [key, items] of bridges) {
    const ws = key.split("\0");
    const center = targetCenter({ world: "", worlds: ws }, worldCenters);
    const group = layoutHoneycombGroup(items, center, posById, key);
    clearGroupFromTextZone(group);
    nodes.push(...group);
  }

  return nodes;
}

export function runForceLayout(
  artworks: Artwork[],
  initial?: Pick<CanvasNode, "id" | "x" | "y">[]
): CanvasNode[] {
  const posById = new Map(initial?.map((n) => [n.id, { x: n.x, y: n.y }]));

  const worlds = [
    ...new Set(artworks.flatMap((a) => getArtworkWorlds(a)).filter(Boolean)),
  ];
  const worldCenters: Record<string, { cx: number; cy: number }> = {};
  const clusterRadius = Math.min(620, 340 + worlds.length * 80);

  worlds.forEach((w, i) => {
    const baseAngle = (i / worlds.length) * Math.PI * 2 - Math.PI / 2;
    const angle = baseAngle + (hashFloat(w, 11) - 0.5) * 0.65;
    const radius = clusterRadius * (0.86 + hashFloat(w, 12) * 0.22);
    worldCenters[w] = {
      cx: Math.cos(angle) * radius * CLUSTER_INWARD,
      cy: Math.sin(angle) * radius * CLUSTER_INWARD,
    };
  });

  const nodes = buildCardLayout(artworks, worldCenters, posById);
  settleLayout(nodes, worldCenters);

  return nodes;
}
