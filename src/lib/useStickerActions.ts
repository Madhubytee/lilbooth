import { useCallback } from 'react';
import { effectiveStickers, type Assets } from './card';
import { geometryOf, type Design } from './design';
import type { Sticker, TemplateId } from './templates/types.ts';

/** a new sticker is about 12% of the card's short side */
function defaultWidth(design: Design): number {
  const g = geometryOf(design);
  return (0.12 * Math.min(g.width, g.height)) / g.width;
}

const isUserSticker = (s: Sticker) => s.id.startsWith('u-');

/** Sticker + template actions shared by the booth and the result page. */
export function useStickerActions(design: Design, update: (p: Partial<Design>) => void, assets: Assets | null) {
  const customised = design.stickers !== null;

  const addSticker = useCallback(
    (asset: string, at?: { x: number; y: number }) => {
      if (!assets) return null;
      const s: Sticker = {
        id: `u-${Math.random().toString(36).slice(2, 9)}`,
        asset,
        x: at?.x ?? 0.5,
        y: at?.y ?? 0.88,
        width: defaultWidth(design),
        rotation: 0,
      };
      update({ stickers: [...effectiveStickers(design, assets), s] });
      return s.id;
    },
    [assets, design, update],
  );

  const resetStickers = useCallback(() => update({ stickers: null }), [update]);
  const clearStickers = useCallback(() => update({ stickers: [] }), [update]);

  /**
   * Switching templates never asks: the new template brings its own default stickers,
   * and stickers the user added stay where they are.
   */
  const chooseTemplate = useCallback(
    (id: TemplateId) => {
      if (id === design.template) return;
      const mine = (design.stickers ?? []).filter(isUserSticker);
      if (!mine.length) {
        update({ template: id, stickers: null });
        return;
      }
      const next = { ...design, template: id, stickers: null };
      const defaults = assets ? effectiveStickers(next, assets) : [];
      update({ template: id, stickers: [...defaults, ...mine] });
    },
    [assets, design, update],
  );

  return { customised, addSticker, resetStickers, clearStickers, chooseTemplate };
}
