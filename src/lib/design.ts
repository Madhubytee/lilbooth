import type { FilterId } from './filters';
import type { FrameId } from './frames';
import type { StickerPackId } from './stickers';

export type LayoutId = 'strip' | 'grid' | 'trio';
export type CaptionFont = 'serif' | 'bold' | 'type';

export interface Design {
  filter: FilterId;
  layout: LayoutId;
  frame: FrameId;
  stickers: StickerPackId[];
  caption: string;
  showDate: boolean;
  font: CaptionFont;
  /** drives the small random sticker rotations */
  seed: number;
}

export const DEFAULT_DESIGN: Design = {
  filter: 'original',
  layout: 'strip',
  frame: 'classic',
  stickers: [],
  caption: '',
  showDate: true,
  font: 'serif',
  seed: 7,
};

export interface LayoutDef {
  id: LayoutId;
  name: string;
  count: number;
  cols: number;
  /** strip width in base units (1x export) */
  W: number;
  /** photo aspect ratio, w / h */
  aspect: number;
  pad: number;
  gap: number;
  /** caption band height */
  band: number;
  /** scale for text and stickers relative to a 600 wide strip */
  unit: number;
}

export const LAYOUTS: LayoutDef[] = [
  { id: 'strip', name: 'strip', count: 4, cols: 1, W: 600, aspect: 4 / 3, pad: 30, gap: 18, band: 180, unit: 1 },
  { id: 'grid', name: 'grid', count: 4, cols: 2, W: 1200, aspect: 1, pad: 60, gap: 24, band: 230, unit: 1.6 },
  { id: 'trio', name: 'trio', count: 3, cols: 1, W: 600, aspect: 6 / 5, pad: 30, gap: 18, band: 180, unit: 1 },
];

export function getLayout(id: LayoutId): LayoutDef {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StripGeometry {
  W: number;
  H: number;
  slots: Rect[];
  band: Rect;
}

export function stripGeometry(layout: LayoutDef): StripGeometry {
  const { W, pad, gap, cols, count, aspect, band } = layout;
  const pw = (W - pad * 2 - gap * (cols - 1)) / cols;
  const ph = pw / aspect;
  const rows = Math.ceil(count / cols);
  const slots: Rect[] = [];
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    slots.push({ x: pad + c * (pw + gap), y: pad + r * (ph + gap), w: pw, h: ph });
  }
  const photosBottom = pad + rows * ph + (rows - 1) * gap;
  return { W, H: Math.round(photosBottom + band), slots, band: { x: 0, y: photosBottom, w: W, h: band } };
}

export function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}.${p(d.getDate())}.${String(d.getFullYear()).slice(-2)}`;
}

export function fileDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
