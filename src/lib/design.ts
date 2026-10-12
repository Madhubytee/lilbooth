import type { FilterId } from './filters';
import { computeLayout, layouts, templateById, templates } from './templates/index.ts';
import type { LayoutId, Sticker, TemplateId } from './templates/types.ts';

export interface Design {
  filter: FilterId;
  template: TemplateId;
  layout: LayoutId;
  /** double layouts: a different set of shots in each strip */
  differentShots: boolean;
  caption: string;
  showDate: boolean;
  /** Contact Sheet: which shot gets the red circle */
  favorite: number;
  /**
   * null = the template's default stickers, untouched.
   * Once someone edits stickers this holds every sticker on the card,
   * positions as fractions of the card size.
   */
  stickers: Sticker[] | null;
}

export const DEFAULT_DESIGN: Design = {
  filter: 'original',
  template: 'clean-white',
  layout: 'strip',
  differentShots: false,
  caption: '',
  showDate: true,
  favorite: 0,
  stickers: null,
};

/** most shots any layout can need (double strip with different shots) */
export const MAX_SHOTS = 8;

export const LAYOUT_IDS = Object.keys(layouts) as LayoutId[];

export function isDouble(layout: LayoutId): boolean {
  return layouts[layout].double;
}

/** shots needed for a layout: 3, 4, 6 or 8 */
export function requiredShots(layout: LayoutId, differentShots: boolean): number {
  return computeLayout(templates[0], layout, differentShots).requiredPhotos;
}

export function geometryOf(d: Design) {
  return computeLayout(templateById[d.template], d.layout, d.differentShots);
}

/** keeps a stored design valid if templates or layouts change between versions */
export function sanitizeDesign(raw: Partial<Design>): Design {
  const d = { ...DEFAULT_DESIGN, ...raw };
  if (!templateById[d.template]) d.template = DEFAULT_DESIGN.template;
  if (!layouts[d.layout]) d.layout = DEFAULT_DESIGN.layout;
  if (d.stickers !== null && !Array.isArray(d.stickers)) d.stickers = null;
  return d;
}

export function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}.${p(d.getDate())}.${String(d.getFullYear()).slice(-2)}`;
}

export function fileDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
