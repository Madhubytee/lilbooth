/*
 * Photo filters.
 *
 * Every filter is described once as data. From that description we build:
 *  1. a live CSS preview (a `filter:` string on the <video> plus a few blended
 *     overlay layers, see <FilterView>), and
 *  2. a canvas renderer for captured photos.
 *
 * The canvas side does NOT use ctx.filter (Safari doesn't support it). Colour ops
 * are done per pixel with the exact matrices from the CSS Filter Effects spec, so
 * the export matches what the browser shows in the preview. Blend layers use
 * canvas composite modes (soft-light / screen / overlay), which match CSS
 * mix-blend-mode, and the bloom blur is a 3 pass box blur (≈ gaussian).
 */

export type FilterId = 'original' | 'bw' | 'softpink' | 'film' | 'dreamy' | 'cool';

type OpType = 'grayscale' | 'sepia' | 'saturate' | 'contrast' | 'brightness';
interface Op {
  type: OpType;
  amount: number;
}

export interface FilterDef {
  id: FilterId;
  name: string;
  ops: Op[];
  /** colour layer blended with soft-light */
  tint?: { color: string; alpha: number };
  /** lifts the blacks: screen blend with a flat gray of this level (0..1) */
  lift?: number;
  /** blurred copy screened on top. blur is a fraction of the image width */
  bloom?: { blur: number; alpha: number };
  /** film grain opacity (overlay blend) */
  grain?: number;
  /** vignette edge darkness (0..1) */
  vignette?: number;
}

export const FILTERS: FilterDef[] = [
  { id: 'original', name: 'original', ops: [] },
  {
    id: 'bw',
    name: 'b&w',
    ops: [
      { type: 'grayscale', amount: 1 },
      { type: 'contrast', amount: 1.15 },
      { type: 'brightness', amount: 1.03 },
    ],
    grain: 0.14,
  },
  {
    id: 'softpink',
    name: 'soft pink',
    ops: [
      { type: 'brightness', amount: 1.06 },
      { type: 'saturate', amount: 1.12 },
    ],
    tint: { color: '#F4A7B9', alpha: 0.4 },
    lift: 0.06,
  },
  {
    id: 'film',
    name: 'film',
    ops: [
      { type: 'sepia', amount: 0.3 },
      { type: 'contrast', amount: 1.06 },
      { type: 'saturate', amount: 0.9 },
    ],
    tint: { color: '#F2C9A0', alpha: 0.3 },
    grain: 0.16,
    vignette: 0.25,
  },
  {
    id: 'dreamy',
    name: 'dreamy',
    ops: [
      { type: 'brightness', amount: 1.1 },
      { type: 'saturate', amount: 0.85 },
    ],
    bloom: { blur: 0.014, alpha: 0.45 },
    lift: 0.07,
  },
  {
    id: 'cool',
    name: 'cool',
    ops: [
      { type: 'saturate', amount: 0.9 },
      { type: 'brightness', amount: 1.04 },
    ],
    tint: { color: '#A9D3F5', alpha: 0.32 },
  },
];

export function getFilter(id: FilterId): FilterDef {
  return FILTERS.find((f) => f.id === id) ?? FILTERS[0];
}

/** CSS `filter` value for the colour ops (no overlays). */
export function cssFilter(def: FilterDef): string {
  if (!def.ops.length) return 'none';
  return def.ops.map((o) => `${o.type}(${o.amount})`).join(' ');
}

/** Grain tile size in px at a reference image width of 600px. */
export const GRAIN_TILE = 128;
export const GRAIN_REF_WIDTH = 600;

/* ------------------------------------------------------------------ */
/* colour math                                                          */
/* ------------------------------------------------------------------ */

// 3x4 affine matrix in 0..1 space: [r,g,b] * M + offset
type Affine = [number, number, number, number, number, number, number, number, number, number, number, number];

function opMatrix(op: Op): Affine {
  const a = op.amount;
  switch (op.type) {
    case 'grayscale': {
      const s = 1 - Math.min(1, a);
      return [
        0.2126 + 0.7874 * s, 0.7152 - 0.7152 * s, 0.0722 - 0.0722 * s, 0,
        0.2126 - 0.2126 * s, 0.7152 + 0.2848 * s, 0.0722 - 0.0722 * s, 0,
        0.2126 - 0.2126 * s, 0.7152 - 0.7152 * s, 0.0722 + 0.9278 * s, 0,
      ];
    }
    case 'sepia': {
      const s = 1 - Math.min(1, a);
      return [
        0.393 + 0.607 * s, 0.769 - 0.769 * s, 0.189 - 0.189 * s, 0,
        0.349 - 0.349 * s, 0.686 + 0.314 * s, 0.168 - 0.168 * s, 0,
        0.272 - 0.272 * s, 0.534 - 0.534 * s, 0.131 + 0.869 * s, 0,
      ];
    }
    case 'saturate':
      return [
        0.213 + 0.787 * a, 0.715 - 0.715 * a, 0.072 - 0.072 * a, 0,
        0.213 - 0.213 * a, 0.715 + 0.285 * a, 0.072 - 0.072 * a, 0,
        0.213 - 0.213 * a, 0.715 - 0.715 * a, 0.072 + 0.928 * a, 0,
      ];
    case 'contrast': {
      const o = 0.5 - 0.5 * a;
      return [a, 0, 0, o, 0, a, 0, o, 0, 0, a, o];
    }
    case 'brightness':
      return [a, 0, 0, 0, 0, a, 0, 0, 0, 0, a, 0];
  }
}

function applyOps(data: Uint8ClampedArray, ops: Op[]) {
  if (!ops.length) return;
  // CSS clamps between filter primitives, so apply one matrix at a time.
  const mats = ops.map(opMatrix);
  const n = data.length;
  for (let i = 0; i < n; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;
    for (let m = 0; m < mats.length; m++) {
      const M = mats[m];
      const nr = r * M[0] + g * M[1] + b * M[2] + M[3];
      const ng = r * M[4] + g * M[5] + b * M[6] + M[7];
      const nb = r * M[8] + g * M[9] + b * M[10] + M[11];
      r = nr < 0 ? 0 : nr > 1 ? 1 : nr;
      g = ng < 0 ? 0 : ng > 1 ? 1 : ng;
      b = nb < 0 ? 0 : nb > 1 ? 1 : nb;
    }
    data[i] = r * 255 + 0.5;
    data[i + 1] = g * 255 + 0.5;
    data[i + 2] = b * 255 + 0.5;
  }
}

/* ------------------------------------------------------------------ */
/* blur (for bloom)                                                     */
/* ------------------------------------------------------------------ */

function boxBlurH(src: Uint8ClampedArray, dst: Uint8ClampedArray, w: number, h: number, r: number) {
  const div = r * 2 + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let c = 0; c < 3; c++) {
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += src[row + Math.min(w - 1, Math.max(0, k)) * 4 + c];
      for (let x = 0; x < w; x++) {
        dst[row + x * 4 + c] = acc / div;
        const add = Math.min(w - 1, x + r + 1);
        const sub = Math.max(0, x - r);
        acc += src[row + add * 4 + c] - src[row + sub * 4 + c];
      }
    }
    for (let x = 0; x < w; x++) dst[row + x * 4 + 3] = 255;
  }
}

function boxBlurV(src: Uint8ClampedArray, dst: Uint8ClampedArray, w: number, h: number, r: number) {
  const div = r * 2 + 1;
  for (let x = 0; x < w; x++) {
    for (let c = 0; c < 3; c++) {
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += src[(Math.min(h - 1, Math.max(0, k)) * w + x) * 4 + c];
      for (let y = 0; y < h; y++) {
        dst[(y * w + x) * 4 + c] = acc / div;
        const add = Math.min(h - 1, y + r + 1);
        const sub = Math.max(0, y - r);
        acc += src[(add * w + x) * 4 + c] - src[(sub * w + x) * 4 + c];
      }
    }
  }
}

/** Gaussian-ish blur with std dev `sigma` px. Works on a downscaled copy for speed. */
function blurredCopy(src: HTMLCanvasElement, sigma: number): HTMLCanvasElement {
  // shrink so the blur radius is ~3px on the small copy; upscaling smooths the rest
  const k = Math.max(1, sigma / 3);
  const w = Math.max(1, Math.round(src.width / k));
  const h = Math.max(1, Math.round(src.height / k));
  const small = makeCanvas(w, h);
  const sctx = small.getContext('2d', { willReadFrequently: true })!;
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(src, 0, 0, w, h);
  const s = sigma / k;
  // box size for 3 passes approximating a gaussian with std dev s
  const r = Math.max(1, Math.round((Math.sqrt(4 * s * s + 1) - 1) / 2));
  const img = sctx.getImageData(0, 0, w, h);
  const tmp = new Uint8ClampedArray(img.data.length);
  for (let pass = 0; pass < 3; pass++) {
    boxBlurH(img.data, tmp, w, h, r);
    boxBlurV(tmp, img.data, w, h, r);
  }
  sctx.putImageData(img, 0, 0);
  const out = makeCanvas(src.width, src.height);
  const octx = out.getContext('2d')!;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(small, 0, 0, src.width, src.height);
  return out;
}

/* ------------------------------------------------------------------ */
/* grain                                                                */
/* ------------------------------------------------------------------ */

let grainTile: HTMLCanvasElement | null = null;
let grainUrl: string | null = null;

/** A small tile of gray noise, generated once. */
export function getGrainTile(): HTMLCanvasElement {
  if (grainTile) return grainTile;
  const c = makeCanvas(GRAIN_TILE, GRAIN_TILE);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(GRAIN_TILE, GRAIN_TILE);
  // seeded so every session gets the same grain
  let seed = 1337;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < img.data.length; i += 4) {
    // sum of two uniforms: softer, more film-like than flat noise
    const v = 128 + (rand() + rand() - 1) * 110;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

export function getGrainUrl(): string {
  if (!grainUrl) grainUrl = getGrainTile().toDataURL('image/png');
  return grainUrl;
}

/* ------------------------------------------------------------------ */
/* canvas renderer                                                      */
/* ------------------------------------------------------------------ */

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Draws an elliptical vignette matching CSS `radial-gradient(ellipse farthest-corner, ...)`. */
export function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength: number) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, h / w);
  const r = (w / 2) * Math.SQRT2;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(VIGNETTE_START, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(-w / 2, -w / 2, w, w);
  ctx.restore();
}
export const VIGNETTE_START = 0.5;

/**
 * Applies a filter to an image, returning a new canvas of the same size.
 * `src` is never modified, so the unfiltered original is always available.
 */
export function applyFilter(src: HTMLCanvasElement, id: FilterId): HTMLCanvasElement {
  const def = getFilter(id);
  const w = src.width;
  const h = src.height;
  const out = makeCanvas(w, h);
  const ctx = out.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0);
  if (def.id === 'original') return out;

  if (def.ops.length) {
    const img = ctx.getImageData(0, 0, w, h);
    applyOps(img.data, def.ops);
    ctx.putImageData(img, 0, 0);
  }

  if (def.bloom) {
    const blurred = blurredCopy(out, def.bloom.blur * w);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = def.bloom.alpha;
    ctx.drawImage(blurred, 0, 0);
    ctx.restore();
  }

  if (def.tint) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = def.tint.alpha;
    ctx.fillStyle = def.tint.color;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  if (def.lift) {
    const v = Math.round(def.lift * 255);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  if (def.grain) {
    const tile = getGrainTile();
    const pattern = ctx.createPattern(tile, 'repeat');
    if (pattern) {
      const s = w / GRAIN_REF_WIDTH;
      pattern.setTransform(new DOMMatrix().scale(s, s));
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = def.grain;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  if (def.vignette) drawVignette(ctx, w, h, def.vignette);

  return out;
}
