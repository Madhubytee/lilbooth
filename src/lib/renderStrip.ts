import { processedPhoto, type Photo } from './capture';
import { formatDate, getLayout, stripGeometry, type CaptionFont, type Design } from './design';
import { makeCanvas } from './filters';
import { getFrame, paintPaperGrain } from './frames';
import { seeded, shape, stickerRaster, STICKER_PACKS } from './stickers';

export interface RenderOptions {
  /** output pixels per base unit. 2 = retina export */
  scale?: number;
  /** draw dashed placeholders for empty slots (live preview) */
  placeholders?: boolean;
  date?: Date;
}

/** Photos are always processed at export resolution so preview and export share one cache. */
const PHOTO_SCALE = 2;

const FONT_STACK: Record<CaptionFont, (px: number) => string> = {
  serif: (px) => `italic 400 ${px}px "Instrument Serif", Georgia, serif`,
  bold: (px) => `700 ${px}px "DM Sans", system-ui, sans-serif`,
  type: (px) => `400 ${px}px "Courier New", Courier, monospace`,
};
const FONT_SIZE: Record<CaptionFont, number> = { serif: 76, bold: 44, type: 42 };

let fontsReady: Promise<void> | null = null;

/** Resolves once every font the strip can use is loaded. Call before renderStrip. */
export function ensureFonts(): Promise<void> {
  if (!fontsReady) {
    const loads = [
      'italic 400 56px "Instrument Serif"',
      '400 56px "Instrument Serif"',
      '700 34px "DM Sans"',
      '500 18px "DM Sans"',
    ].map((f) => document.fonts.load(f).catch(() => []));
    fontsReady = Promise.all(loads).then(() => document.fonts.ready).then(() => undefined);
  }
  return fontsReady;
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, font: CaptionFont, size: number, maxW: number): number {
  let px = size;
  ctx.font = FONT_STACK[font](px);
  while (px > 10 && ctx.measureText(text).width > maxW) {
    px -= 1;
    ctx.font = FONT_STACK[font](px);
  }
  return px;
}

/**
 * Draws the whole strip: frame, photos (cropped + filtered), caption, stickers.
 * Used for both the live preview and the final export so they never differ.
 */
export function renderStrip(design: Design, photos: (Photo | null)[], opts: RenderOptions = {}): HTMLCanvasElement {
  const scale = opts.scale ?? 1;
  const layout = getLayout(design.layout);
  const geo = stripGeometry(layout);
  const frame = getFrame(design.frame);
  const u = layout.unit;

  const canvas = makeCanvas(Math.round(geo.W * scale), Math.round(geo.H * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.imageSmoothingQuality = 'high';

  // frame
  frame.paint(ctx, geo.W, geo.H, layout.pad);
  if (!frame.dark) paintPaperGrain(ctx, geo.W, geo.H);

  // photos
  geo.slots.forEach((r, i) => {
    const p = photos[i];
    if (p) {
      const img = processedPhoto(p, layout.aspect, Math.round(r.w * PHOTO_SCALE), design.filter);
      ctx.drawImage(img, r.x, r.y, r.w, r.h);
    } else if (opts.placeholders) {
      ctx.fillStyle = frame.dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.save();
      ctx.setLineDash([7 * u, 6 * u]);
      ctx.lineWidth = 1.5 * u;
      ctx.strokeStyle = frame.dark ? 'rgba(255,255,255,0.35)' : '#D8CBCE';
      ctx.strokeRect(r.x + 0.75 * u, r.y + 0.75 * u, r.w - 1.5 * u, r.h - 1.5 * u);
      ctx.restore();
      ctx.fillStyle = frame.dark ? 'rgba(255,255,255,0.4)' : 'rgba(110,98,102,0.4)';
      ctx.font = `400 ${64 * u}px "Instrument Serif", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), r.x + r.w / 2, r.y + r.h / 2);
    }
  });

  // caption band
  const caption = design.caption.trim();
  const date = design.showDate ? formatDate(opts.date ?? new Date()) : '';
  const cx = geo.W / 2;
  const maxW = geo.W - layout.pad * 2 - 20 * u;
  const bandMid = geo.band.y + geo.band.h / 2 - 4 * u;
  ctx.fillStyle = frame.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (caption) {
    const px = fitFont(ctx, caption, design.font, FONT_SIZE[design.font] * u, maxW);
    const capY = date ? bandMid - 16 * u : bandMid;
    ctx.fillText(caption, cx, capY);
    if (date) {
      ctx.globalAlpha = 0.72;
      ctx.font = `500 ${21 * u}px "DM Sans", system-ui, sans-serif`;
      ctx.fillText(spaced(date), cx, capY + px * 0.45 + 20 * u);
      ctx.globalAlpha = 1;
    }
  } else if (date) {
    fitFont(ctx, date, design.font, FONT_SIZE[design.font] * u * 0.75, maxW);
    ctx.fillText(date, cx, bandMid);
  }

  // stickers
  let n = 0;
  for (const pack of STICKER_PACKS) {
    if (!design.stickers.includes(pack.id)) continue;
    for (const it of pack.items) {
      const s = shape(it.shape, it.color, it.accent);
      const w = it.size * u;
      const h = (w * s.h) / s.w;
      const { canvas: raster, pad } = stickerRaster(s, w * scale);
      const half = Math.max(w, h) / 2 + 4 * u;
      const x = Math.min(geo.W - half, Math.max(half, it.x * geo.W));
      const y = Math.min(geo.H - half, Math.max(half, it.y * geo.H));
      const rot = it.rot + (seeded(design.seed, n++) - 0.5) * 18;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rot * Math.PI) / 180);
      // shadows ignore the transform, so they are in device pixels
      ctx.shadowColor = 'rgba(43,35,38,0.22)';
      ctx.shadowBlur = 5 * u * scale;
      ctx.shadowOffsetY = 2 * u * scale;
      const pb = pad / scale;
      ctx.drawImage(raster, -w / 2 - pb, -h / 2 - pb, raster.width / scale, raster.height / scale);
      ctx.restore();
    }
  }

  return canvas;
}

/** Thin spaces between characters for a tracked-out date. */
function spaced(s: string): string {
  return s.split('').join(' ');
}
