import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from "d3-force";
import type { Artwork } from "@/lib/artworks";
import { getArtworkWorlds } from "@/lib/artworks";
import { CARD_H, cardHalfH, cardHalfW } from "@/lib/canvas-card";
import { CANVAS_TEXT_ZONE } from "@/lib/site-type";

export type CanvasNode = Artwork & {
  x: number;
  y: number;
  vx: number;
  vy: number;
  stackIndex: number;
};

export { CARD_H };

/**
 * Obsidian のグラフビューと同様の力学モデル：
 * - すべてのカード／タグは互いに斥力で反発する（forceManyBody）
 * - 同じタグ（世界観）のカードは、そのタグの「ハブ」に引き寄せられ塊になる（forceLink）
 * - カード同士は衝突半径分だけ確実に間隔が空く（forceCollide）
 * - ヒーローテキストの領域だけは常に避ける（独自フォース）
 * - 全体がゆるく原点付近にまとまる（forceX/forceY の弱い引力）
 */

/** タグ（ハブ）同士の反発強度。強めるほどタグ間の距離が開く */
const HUB_CHARGE = -50000;
/** カード同士の反発強度 */
const CARD_CHARGE = -260;
/** 同タグ内でカードをハブへ引き寄せる強さ（0-1） */
const LINK_STRENGTH = 1;
/** 同タグ内でカードとハブの目標距離に加える余白 */
const SAME_WORLD_GAP = 10;
/** 異なるタグのカードが最終的に確保する最小すきま（安全網の重なり解消用） */
const UNRELATED_GAP = 28;
/** カード同士の衝突半径に足す余白 */
const COLLIDE_PADDING = 4;
/** 全体を原点付近に緩くまとめる引力の強さ */
const CENTER_PULL = 0.1;
/** ヒーローテキスト領域からの退避フォースの強さ */
const TEXT_ZONE_PUSH = 2.4;
/** シミュレーションを進める tick 数 */
const SIM_TICKS = 360;

const { halfW: TEXT_HW, halfH: TEXT_HH, margin: TEXT_MARGIN } = CANVAS_TEXT_ZONE;

function hashFloat(key: string | number, salt: number): number {
  let h = salt;
  const s = String(key);
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function signOrRandom(value: number, salt: string | number) {
  if (value !== 0) return Math.sign(value);
  return hashFloat(salt, 7) > 0.5 ? 1 : -1;
}

function sharesWorld(a: Pick<Artwork, "world" | "worlds">, b: Pick<Artwork, "world" | "worlds">) {
  const wa = getArtworkWorlds(a);
  const wb = getArtworkWorlds(b);
  return wa.some((w) => wb.includes(w));
}

/** タグ（世界観）ごとの仮想ハブノード。描画はされず、クラスタ形成のためだけに存在する */
type HubDatum = SimulationNodeDatum & {
  /** d3-force のリンク解決用キー（タグ名から生成、作品IDとは無関係） */
  simKey: string;
  isHub: true;
};

/** カード側のシミュレーション用ノード。simKey は配列内の並び順から生成し、作品IDには依存しない */
type CardSimNode = CanvasNode & SimulationNodeDatum & { simKey: string };

type SimNode = CardSimNode | HubDatum;

function isHubNode(n: SimNode): n is HubDatum {
  return (n as HubDatum).isHub === true;
}

function collideRadius(n: SimNode): number {
  if (isHubNode(n)) return 0;
  return Math.hypot(cardHalfW(n), cardHalfH(n)) + COLLIDE_PADDING;
}

/** ヒーローのテキスト保護ゾーンに入り込んだノードを毎tick外側へ押し出す独自フォース */
function forceTextZoneAvoidance() {
  let nodes: SimNode[] = [];
  function force(alpha: number) {
    for (const n of nodes) {
      const hw = isHubNode(n) ? 0 : cardHalfW(n);
      const hh = isHubNode(n) ? 0 : cardHalfH(n);
      const textHw = TEXT_HW + TEXT_MARGIN + hw;
      const textHh = TEXT_HH + TEXT_MARGIN + hh;
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      const overlapX = textHw - Math.abs(x);
      const overlapY = textHh - Math.abs(y);
      if (overlapX <= 0 || overlapY <= 0) continue;

      const salt = isHubNode(n) ? n.simKey : n.stackIndex;
      if (overlapX <= overlapY) {
        const sign = x !== 0 ? Math.sign(x) : signOrRandom(0, salt);
        n.vx = (n.vx ?? 0) + sign * overlapX * alpha * TEXT_ZONE_PUSH;
      } else {
        const sign = y !== 0 ? Math.sign(y) : signOrRandom(0, `${salt}-y`);
        n.vy = (n.vy ?? 0) + sign * overlapY * alpha * TEXT_ZONE_PUSH;
      }
    }
  }
  force.initialize = (_nodes: SimNode[]) => {
    nodes = _nodes;
  };
  return force;
}

type LinkDatum = { source: string; target: string };

/**
 * カードとタグハブを星型に繋ぐグラフを構築する（Obsidian のタグクラスタと同じ発想）。
 * 初期配置やタイブレークは作品IDではなく、渡された配列の並び順（インデックス）から決める。
 */
function buildSimGraph(
  artworks: Artwork[],
  posByIndex: Map<number, { x: number; y: number }>
): { nodes: SimNode[]; links: LinkDatum[] } {
  const nodes: SimNode[] = [];
  const links: LinkDatum[] = [];
  const hubSeen = new Set<string>();

  artworks.forEach((a, index) => {
    const existing = posByIndex.get(index);
    const angle = hashFloat(index, 41) * Math.PI * 2;
    const radius = 60 + hashFloat(index, 43) * 420;
    const simKey = `card-${index}`;
    nodes.push({
      ...a,
      x: existing?.x ?? Math.cos(angle) * radius,
      y: existing?.y ?? Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      stackIndex: index,
      simKey,
    });

    for (const w of getArtworkWorlds(a)) {
      const hubKey = `__hub__${w}`;
      links.push({ source: simKey, target: hubKey });
      if (!hubSeen.has(hubKey)) {
        hubSeen.add(hubKey);
        const hAngle = hashFloat(w, 51) * Math.PI * 2;
        const hRadius = 260 + hashFloat(w, 53) * 260;
        nodes.push({
          simKey: hubKey,
          isHub: true,
          x: Math.cos(hAngle) * hRadius,
          y: Math.sin(hAngle) * hRadius,
          vx: 0,
          vy: 0,
        });
      }
    }
  });

  return { nodes, links };
}

function runSimulation(nodes: SimNode[], links: LinkDatum[]) {
  const simulation = forceSimulation<SimNode>(nodes)
    .force(
      "charge",
      forceManyBody<SimNode>().strength((n) => (isHubNode(n) ? HUB_CHARGE : CARD_CHARGE))
    )
    .force(
      "link",
      forceLink<SimNode, LinkDatum>(links)
        .id((d) => d.simKey)
        .distance((l) => {
          const source = l.source as unknown as SimNode;
          if (isHubNode(source)) return SAME_WORLD_GAP;
          return Math.hypot(cardHalfW(source), cardHalfH(source)) + SAME_WORLD_GAP;
        })
        .strength(LINK_STRENGTH)
    )
    .force(
      "collide",
      forceCollide<SimNode>()
        .radius((n) => collideRadius(n))
        .strength(0.9)
        .iterations(3)
    )
    .force("textZone", forceTextZoneAvoidance())
    .force("centerX", forceX<SimNode>(0).strength(CENTER_PULL))
    .force("centerY", forceY<SimNode>(0).strength(CENTER_PULL))
    .stop();

  for (let i = 0; i < SIM_TICKS; i++) simulation.tick();
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

/** 3体以上が連鎖して押し合うときの振動を防ぐ緩和係数（1なら即時全解決、小さいほど滑らかに収束） */
const OVERLAP_RELAXATION = 0.5;
const MIN_OVERLAP_PX = 0.25;

/** シミュレーション後の残差を確実にゼロへ落とす安全網（反復緩和法） */
function resolveOverlap(a: CanvasNode, b: CanvasNode): boolean {
  const { overlapX, overlapY, overlaps } = pairOverlap(a, b);
  if (!overlaps) return false;
  if (overlapX < MIN_OVERLAP_PX && overlapY < MIN_OVERLAP_PX) return false;

  const gap = sharesWorld(a, b) ? SAME_WORLD_GAP : UNRELATED_GAP;
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  // b は常に +sign 方向、a は常に -sign 方向へ動かす（物理的に正しく引き離す）。
  // stackIndex が大きい方をわずかに動かしにくくして見た目の安定感を出す。
  const aWeight = a.stackIndex >= b.stackIndex ? 0.4 : 0.6;
  const bWeight = 1 - aWeight;

  if (overlapX <= overlapY) {
    const signX = dx !== 0 ? Math.sign(dx) : signOrRandom(0, `${a.stackIndex}-${b.stackIndex}`);
    const add = (overlapX + gap) * OVERLAP_RELAXATION;
    a.x -= signX * add * aWeight;
    b.x += signX * add * bWeight;
  } else {
    const signY = dy !== 0 ? Math.sign(dy) : signOrRandom(0, `${a.stackIndex}-${b.stackIndex}-y`);
    const add = (overlapY + gap) * OVERLAP_RELAXATION;
    a.y -= signY * add * aWeight;
    b.y += signY * add * bWeight;
  }
  return true;
}

function enforceNoOverlap(nodes: CanvasNode[]): boolean {
  let movedAny = false;
  for (let pass = 0; pass < 200; pass++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (resolveOverlap(nodes[i], nodes[j])) moved = true;
      }
    }
    if (moved) movedAny = true;
    else break;
  }
  return movedAny;
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

function pushOutFromOrigin(value: number, minAbs: number, salt: number | string) {
  const sign = value !== 0 ? Math.sign(value) : signOrRandom(0, salt);
  return sign * Math.max(minAbs, Math.abs(value));
}

function fixTextZoneOverlaps(nodes: CanvasNode[]): boolean {
  let moved = false;
  for (const n of nodes) {
    const { overlapX, overlapY, textHw, textHh, hw, hh } = textZoneOverlap(n);
    if (overlapX <= 0 || overlapY <= 0) continue;

    if (overlapX <= overlapY) {
      n.x = pushOutFromOrigin(n.x, textHw + hw, n.stackIndex);
    } else {
      n.y = pushOutFromOrigin(n.y, textHh + hh, `${n.stackIndex}-y`);
    }
    moved = true;
  }
  return moved;
}

function settleFinalLayout(nodes: CanvasNode[]) {
  for (let cycle = 0; cycle < 60; cycle++) {
    const overlapMoved = enforceNoOverlap(nodes);
    let textMoved = false;
    for (let pass = 0; pass < 40; pass++) {
      if (!fixTextZoneOverlaps(nodes)) break;
      textMoved = true;
    }
    if (!overlapMoved && !textMoved) break;
  }
}

export function runForceLayout(
  artworks: Artwork[],
  /** 直前のレイアウトを引き継ぐ場合の初期座標。作品IDではなく artworks と同じ並び順（インデックス）で対応させる */
  initial?: Pick<CanvasNode, "x" | "y">[]
): CanvasNode[] {
  const posByIndex = new Map(initial?.map((n, i) => [i, { x: n.x, y: n.y }]));

  const { nodes, links } = buildSimGraph(artworks, posByIndex);
  runSimulation(nodes, links);

  const cardNodes = nodes.filter((n): n is CardSimNode => !isHubNode(n));
  settleFinalLayout(cardNodes);

  return cardNodes;
}
