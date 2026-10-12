import { useCallback, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import { effectiveStickers, type Assets } from './card';
import { geometryOf, type Design } from './design';
import { templateById } from './templates/index.ts';
import type { Sticker, TemplateId } from './templates/types.ts';

/** a new sticker is about 12% of the card's short side */
function defaultWidth(design: Design): number {
  const g = geometryOf(design);
  return (0.12 * Math.min(g.width, g.height)) / g.width;
}

/**
 * Sticker + template actions shared by the booth and the result page.
 * Returns a `dialog` element to render (the "switch template?" confirmation).
 */
export function useStickerActions(design: Design, update: (p: Partial<Design>) => void, assets: Assets | null) {
  const [pending, setPending] = useState<TemplateId | null>(null);
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

  const chooseTemplate = useCallback(
    (id: TemplateId) => {
      if (id === design.template) return;
      if (!customised) update({ template: id });
      else setPending(id);
    },
    [customised, design.template, update],
  );

  const dialog = pending ? (
    <ConfirmDialog
      title={`switch to ${templateById[pending].name.toLowerCase()}?`}
      body="You've moved or added stickers. Use this template's stickers instead, or keep yours where they are?"
      onCancel={() => setPending(null)}
      choices={[
        {
          label: 'use template stickers',
          primary: true,
          onChoose: () => {
            update({ template: pending, stickers: null });
            setPending(null);
          },
        },
        {
          label: 'keep my stickers',
          onChoose: () => {
            update({ template: pending });
            setPending(null);
          },
        },
      ]}
    />
  ) : null;

  return { customised, addSticker, resetStickers, clearStickers, chooseTemplate, dialog };
}
