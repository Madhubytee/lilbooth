import { applyFilter, makeCanvas, type FilterId } from './filters';

export interface Photo {
  id: string;
  /** Unfiltered, mirrored full camera frame. Never modified. */
  original: HTMLCanvasElement;
}

/** Longest side we keep for an original frame. */
const MAX_SIDE = 1920;

/**
 * Grabs the current video frame, mirrored to match the live preview.
 * We keep the whole frame so the strip can be re-cropped if the layout changes
 * after shooting; `cropPhoto` does the centre crop to the slot's aspect ratio.
 */
export function captureFrame(video: HTMLVideoElement): Photo {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const k = Math.min(1, MAX_SIDE / Math.max(vw, vh));
  const w = Math.round(vw * k);
  const h = Math.round(vh * k);
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  return { id: Math.random().toString(36).slice(2), original: c };
}

/** Centre crop (never stretch) to `aspect` (w/h), output `outW` wide. */
export function cropPhoto(src: HTMLCanvasElement, aspect: number, outW: number): HTMLCanvasElement {
  const outH = Math.round(outW / aspect);
  let sw = src.width;
  let sh = src.width / aspect;
  if (sh > src.height) {
    sh = src.height;
    sw = src.height * aspect;
  }
  const sx = (src.width - sw) / 2;
  const sy = (src.height - sh) / 2;
  const c = makeCanvas(outW, outH);
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, outW, outH);
  return c;
}

const cache = new WeakMap<HTMLCanvasElement, Map<string, HTMLCanvasElement>>();

/** Cropped + filtered photo, cached per (photo, aspect, width, filter). */
export function processedPhoto(photo: Photo, aspect: number, outW: number, filter: FilterId): HTMLCanvasElement {
  let m = cache.get(photo.original);
  if (!m) {
    m = new Map();
    cache.set(photo.original, m);
  }
  const key = `${aspect.toFixed(4)}|${outW}|${filter}`;
  let out = m.get(key);
  if (!out) {
    const cropKey = `${aspect.toFixed(4)}|${outW}|crop`;
    let crop = m.get(cropKey);
    if (!crop) {
      crop = cropPhoto(photo.original, aspect, outW);
      m.set(cropKey, crop);
    }
    out = applyFilter(crop, filter);
    m.set(key, out);
  }
  return out;
}

export function canvasToBlob(c: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode image'))), type, quality),
  );
}
