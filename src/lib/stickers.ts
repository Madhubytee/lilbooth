import { makeCanvas } from './filters';

/*
 * Sticker shapes use the exact SVG paths from the design files.
 * The same data drives the inline SVGs in the UI and the die-cut canvas render.
 */

export interface Part {
  d?: string;
  circle?: [number, number, number];
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface Shape {
  w: number;
  h: number;
  parts: Part[];
}

export type ShapeId = 'heart' | 'star' | 'bow' | 'sparkle' | 'flower';

const HEART = 'M12 21s-7.5-4.6-9.5-9.2C1 8.4 3.2 5 6.6 5c2 0 3.6 1.1 5.4 3 1.8-1.9 3.4-3 5.4-3 3.4 0 5.6 3.4 4.1 6.8C19.5 16.4 12 21 12 21z';
const STAR = 'M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z';
const SPARKLE = 'M12 2c.6 5 4.4 8.8 10 10-5.6 1.2-9.4 5-10 10-.6-5-4.4-8.8-10-10 5.6-1.2 9.4-5 10-10z';
const BOW_L = 'M22 15 C 14 4, 2 2, 3 12 C 4 22, 14 22, 22 15 Z';
const BOW_R = 'M22 15 C 30 4, 42 2, 41 12 C 40 22, 30 22, 22 15 Z';
const BOW_TAILS = 'M20 16 L14 29 M24 16 L30 29';

export function shape(id: ShapeId, color: string, accent?: string): Shape {
  switch (id) {
    case 'heart':
      return { w: 24, h: 24, parts: [{ d: HEART, fill: color }] };
    case 'star':
      return { w: 24, h: 24, parts: [{ d: STAR, fill: color }] };
    case 'sparkle':
      return { w: 24, h: 24, parts: [{ d: SPARKLE, fill: color }] };
    case 'bow':
      return {
        w: 44,
        h: 30,
        parts: [
          { d: BOW_TAILS, stroke: color, strokeWidth: 3 },
          { d: BOW_L, fill: color },
          { d: BOW_R, fill: color },
          { circle: [22, 15, 4], fill: accent ?? '#D9577A', stroke: '#FFFFFF', strokeWidth: 1.5 },
        ],
      };
    case 'flower': {
      const petals: Part[] = [];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        petals.push({ circle: [12 + Math.cos(a) * 5.4, 12 + Math.sin(a) * 5.4, 4.6], fill: color });
      }
      return { w: 24, h: 24, parts: [...petals, { circle: [12, 12, 3.4], fill: accent ?? '#FFE29A', stroke: '#FFFFFF', strokeWidth: 1.2 }] };
    }
  }
}

export type StickerPackId = 'hearts' | 'stars' | 'bows' | 'sparkles' | 'flowers';

export interface Placement {
  shape: ShapeId;
  color: string;
  accent?: string;
  /** centre, as a fraction of strip width / height */
  x: number;
  y: number;
  /** width in base units for a 600px wide strip */
  size: number;
  rot: number;
}

export interface StickerPack {
  id: StickerPackId;
  name: string;
  /** icon shown on the toggle */
  icon: { shape: ShapeId; color: string; accent?: string };
  items: Placement[];
}

/** Default spots overlap the photo edges and the frame, like the booth design. */
export const STICKER_PACKS: StickerPack[] = [
  {
    id: 'hearts',
    name: 'hearts',
    icon: { shape: 'heart', color: '#F4A7B9' },
    items: [
      { shape: 'heart', color: '#F4A7B9', x: 0.075, y: 0.06, size: 115, rot: -16 },
      { shape: 'heart', color: '#D9577A', x: 0.93, y: 0.47, size: 81, rot: 14 },
    ],
  },
  {
    id: 'stars',
    name: 'stars',
    icon: { shape: 'star', color: '#FFE29A' },
    items: [
      { shape: 'star', color: '#FFE29A', x: 0.92, y: 0.04, size: 102, rot: 12 },
      { shape: 'star', color: '#FFE29A', x: 0.07, y: 0.78, size: 68, rot: -8 },
    ],
  },
  {
    id: 'bows',
    name: 'bow',
    icon: { shape: 'bow', color: '#F4A7B9' },
    items: [{ shape: 'bow', color: '#F4A7B9', accent: '#D9577A', x: 0.5, y: 0.024, size: 161, rot: -3 }],
  },
  {
    id: 'sparkles',
    name: 'sparkles',
    icon: { shape: 'sparkle', color: '#A9D3F5' },
    items: [
      { shape: 'sparkle', color: '#A9D3F5', x: 0.9, y: 0.27, size: 65, rot: 0 },
      { shape: 'sparkle', color: '#FFE29A', x: 0.1, y: 0.4, size: 50, rot: 0 },
      { shape: 'sparkle', color: '#F4A7B9', x: 0.9, y: 0.7, size: 43, rot: 0 },
    ],
  },
  {
    id: 'flowers',
    name: 'flowers',
    icon: { shape: 'flower', color: '#BFE6CF', accent: '#FFE29A' },
    items: [
      { shape: 'flower', color: '#BFE6CF', accent: '#FFE29A', x: 0.1, y: 0.22, size: 78, rot: 10 },
      { shape: 'flower', color: '#F4A7B9', accent: '#FFFFFF', x: 0.88, y: 0.93, size: 71, rot: -12 },
    ],
  },
];

/** Deterministic random in [0,1) so the preview and export get identical rotations. */
export function seeded(seed: number, i: number): number {
  let t = (seed + i * 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/* ------------------------------------------------------------------ */
/* die-cut raster                                                       */
/* ------------------------------------------------------------------ */

const OUTLINE = 3.2; // white border width in viewBox units (half sits outside the shape)

function tracePart(p: Part): Path2D {
  if (p.d) return new Path2D(p.d);
  const path = new Path2D();
  const [cx, cy, r] = p.circle!;
  path.arc(cx, cy, r, 0, Math.PI * 2);
  return path;
}

const rasterCache = new Map<string, HTMLCanvasElement>();

/**
 * Renders a sticker as a die-cut: thick white outline, then the coloured shape.
 * Returned canvas is padded by `pad` px on every side (for the outline).
 */
export function stickerRaster(s: Shape, widthPx: number): { canvas: HTMLCanvasElement; pad: number } {
  const k = widthPx / s.w;
  const pad = Math.ceil(OUTLINE * k);
  const key = `${JSON.stringify(s.parts)}|${Math.round(widthPx)}`;
  const cached = rasterCache.get(key);
  if (cached) return { canvas: cached, pad };

  const c = makeCanvas(Math.ceil(s.w * k) + pad * 2, Math.ceil(s.h * k) + pad * 2);
  const ctx = c.getContext('2d')!;
  ctx.translate(pad, pad);
  ctx.scale(k, k);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // white die-cut base
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFFFFF';
  for (const p of s.parts) {
    const path = tracePart(p);
    ctx.lineWidth = (p.strokeWidth ?? 0) + OUTLINE * 2;
    ctx.stroke(path);
    if (p.fill) ctx.fill(path);
  }
  // colour
  for (const p of s.parts) {
    const path = tracePart(p);
    if (p.fill) {
      ctx.fillStyle = p.fill;
      ctx.fill(path);
    }
    if (p.stroke) {
      ctx.strokeStyle = p.stroke;
      ctx.lineWidth = p.strokeWidth ?? 1;
      ctx.stroke(path);
    }
  }
  if (rasterCache.size > 200) rasterCache.clear();
  rasterCache.set(key, c);
  return { canvas: c, pad };
}
