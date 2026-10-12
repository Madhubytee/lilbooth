/*
 * Glue between lil booth and the template renderer (lib/templates).
 * Every card on screen and every export goes through renderDesign(), so the
 * booth preview, the template thumbnails, the result page and the PNG match.
 */
import { useEffect, useState } from 'react';
import { processedPhoto, type Photo } from './capture';
import { formatDate, geometryOf, type Design } from './design';
import { layouts, preloadAssets, renderCard, templateById } from './templates/index.ts';
import { defaultStickerPlacements } from './templates/render.ts';
import type { RenderOptions, Sticker } from './templates/types.ts';

export type Assets = Record<string, HTMLImageElement>;

/** Photo width we filter at. The renderer's largest photo slot at 3600px is ~1000px wide. */
const PHOTO_W = 1100;

/** Filtered photos, cropped to the layout's window shape so the renderer's crop is a no-op. */
export function cardPhotos(design: Design, photos: (Photo | null)[]): (HTMLCanvasElement | undefined)[] {
  const aspect = layouts[design.layout].aspect;
  return photos.map((p) => (p ? processedPhoto(p, aspect, PHOTO_W, design.filter) : undefined));
}

/** The stickers actually on the card: the user's list, or the template defaults (still masked). */
export function effectiveStickers(design: Design, assets: Assets): Sticker[] {
  if (design.stickers) return design.stickers;
  const t = templateById[design.template];
  return defaultStickerPlacements(t, geometryOf(design), assets).map((s) => ({ ...s, masked: true }));
}

export interface CardRenderOptions {
  longSide?: number;
  retina?: boolean;
  /** leave one sticker out (it's being dragged and drawn by the DOM instead) */
  hideStickerId?: string;
  /** override the sticker list (used while editing) */
  stickers?: Sticker[];
}

export function renderDesign(
  design: Design,
  photos: (Photo | null)[],
  date: Date,
  assets: Assets,
  o: CardRenderOptions = {},
): Promise<HTMLCanvasElement> {
  const t = templateById[design.template];
  const opts: RenderOptions = {
    caption: design.caption.trim(),
    date: formatDate(date),
    hideDate: !design.showDate,
    differentShots: design.differentShots,
    favorite: design.favorite,
    longSide: o.longSide,
    retina: o.retina,
    assets,
  };
  let list = o.stickers ?? design.stickers;
  if (o.hideStickerId) list = (list ?? effectiveStickers(design, assets)).filter((s) => s.id !== o.hideStickerId);
  if (list) {
    opts.defaults = false;
    opts.stickers = list;
  }
  return renderCard(t, design.layout, cardPhotos(design, photos), opts);
}

let loaded: Assets | null = null;

/** Fonts + the 20 sticker images, loaded once. */
export function useCardAssets(): Assets | null {
  const [assets, setAssets] = useState<Assets | null>(loaded);
  useEffect(() => {
    if (loaded) return;
    let alive = true;
    preloadAssets().then((a) => {
      loaded = a as Assets;
      if (alive) setAssets(loaded);
    });
    return () => {
      alive = false;
    };
  }, []);
  return assets;
}

export function stickerLabel(file: string): string {
  return file.replace(/^\d+-/, '').replace(/\.png$/, '').replace(/-/g, ' ');
}
