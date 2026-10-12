import { memo, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { Photo } from '../lib/capture';
import { stickerLabel, type Assets } from '../lib/card';
import { isDouble, LAYOUT_IDS, requiredShots, type Design } from '../lib/design';
import { FILTERS } from '../lib/filters';
import { layouts, stickerFiles, templates } from '../lib/templates/index.ts';
import type { LayoutId, TemplateId } from '../lib/templates/types.ts';
import CardCanvas from './CardCanvas';
import FilterView, { type MediaSource } from './FilterView';

type Tab = 'filter' | 'layout' | 'frame' | 'stickers' | 'caption';
const TABS: Tab[] = ['filter', 'layout', 'frame', 'stickers', 'caption'];

const GROUPS: { id: 'film' | 'open'; label: string }[] = [
  { id: 'film', label: 'film' },
  { id: 'open', label: 'open + cute' },
];

interface Props {
  design: Design;
  update: (patch: Partial<Design>) => void;
  /** switching template goes through the parent so it can ask about custom stickers */
  onTemplate: (id: TemplateId) => void;
  photos: (Photo | null)[];
  shotAt: Date;
  assets: Assets | null;
  /** live camera (or the example photo) for the filter thumbnails */
  source: MediaSource;
  mirror: boolean;
  /** true while shooting: layout can't change mid-session */
  busy: boolean;
  onAddSticker: (file: string) => void;
  /** pointer-drag a sticker from the tray (handled by the card it's dropped on) */
  onStickerDragStart?: (file: string, e: ReactPointerEvent) => void;
  onResetStickers: () => void;
  onClearStickers: () => void;
  stickersCustomised: boolean;
}

/** One template rendered with the real photos. Memoised so it only redraws when the card would change. */
const TemplateThumb = memo(function TemplateThumb({
  design,
  template,
  photos,
  shotAt,
  assets,
}: {
  design: Design;
  template: TemplateId;
  photos: (Photo | null)[];
  shotAt: Date;
  assets: Assets | null;
}) {
  const { filter, layout, differentShots, caption, showDate, favorite } = design;
  const thumb = useMemo(
    () => ({ filter, layout, differentShots, caption, showDate, favorite, template, stickers: null }),
    [filter, layout, differentShots, caption, showDate, favorite, template],
  );
  return (
    <span className="template-thumb">
      {assets && (
        <CardCanvas design={thumb} photos={photos} date={shotAt} assets={assets} maxWidth={88} maxHeight={112} longSide={300} label="" />
      )}
    </span>
  );
});

function LayoutIcon({ id }: { id: LayoutId }) {
  const l = layouts[id];
  const strips = l.double ? 2 : 1;
  const cols = l.double ? 1 : l.cols;
  const cell = l.aspect === 1 ? { w: 14, h: 14 } : { w: 16, h: 12 };
  return (
    <span className="layout-icon" aria-hidden="true">
      {Array.from({ length: strips }, (_, s) => (
        <span
          key={s}
          className="layout-icon-strip"
          style={{ gridTemplateColumns: `repeat(${cols}, ${cell.w}px)`, gridAutoRows: `${cell.h}px` }}
        >
          {Array.from({ length: cols * l.rows }, (_, i) => (
            <span key={i} />
          ))}
        </span>
      ))}
    </span>
  );
}

export default function DesignPanel(props: Props) {
  const { design, update, onTemplate, photos, shotAt, assets, source, mirror, busy } = props;
  const [tab, setTab] = useState<Tab>('filter');
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onTabKey = (e: KeyboardEvent, i: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setTab(TABS[next]);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className="panel" aria-label="Design your card">
      <div className="tabs" role="tablist" aria-label="Design options">
        {TABS.map((t, i) => (
          <button
            key={t}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`${uid}-panel-${t}`}
            tabIndex={tab === t ? 0 : -1}
            className="tab"
            onClick={() => setTab(t)}
            onKeyDown={(e) => onTabKey(e, i)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="tabpanel" role="tabpanel" id={`${uid}-panel-${tab}`} aria-labelledby={`${uid}-tab-${tab}`}>
        {tab === 'filter' && (
          <div className="opt-grid opt-grid-3" role="group" aria-label="Filter">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className="opt opt-filter"
                aria-pressed={design.filter === f.id}
                onClick={() => update({ filter: f.id })}
              >
                <FilterView className="opt-thumb" filter={f.id} source={source} mirror={mirror} />
                <span className="opt-label">{f.name}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'layout' && (
          <>
            <div className="opt-grid opt-grid-3" role="group" aria-label="Layout">
              {LAYOUT_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="opt opt-layout"
                  aria-pressed={design.layout === id}
                  disabled={busy}
                  onClick={() => update({ layout: id })}
                >
                  <LayoutIcon id={id} />
                  <span className="opt-label">{layouts[id].name.toLowerCase()}</span>
                  <span className="opt-sub">{requiredShots(id, design.layout === id && design.differentShots)} shots</span>
                </button>
              ))}
            </div>
            {isDouble(design.layout) && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={design.differentShots}
                  disabled={busy}
                  onChange={(e) => update({ differentShots: e.target.checked })}
                />
                <span>
                  different shots in each strip
                  <span className="check-sub">
                    {' '}
                    ({requiredShots(design.layout, true)} shots instead of {requiredShots(design.layout, false)})
                  </span>
                </span>
              </label>
            )}
            <p className="panel-note">Switching layout keeps every photo you've taken. New slots start empty.</p>
          </>
        )}

        {tab === 'frame' &&
          GROUPS.map((g) => (
            <div key={g.id} className="template-group" role="group" aria-labelledby={`${uid}-group-${g.id}`}>
              <span className="field-label" id={`${uid}-group-${g.id}`}>
                {g.label}
              </span>
              <div className="opt-grid opt-grid-3">
                {templates
                  .filter((t) => t.group === g.id)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="opt opt-template"
                      aria-pressed={design.template === t.id}
                      onClick={() => onTemplate(t.id)}
                    >
                      <TemplateThumb design={design} template={t.id} photos={photos} shotAt={shotAt} assets={assets} />
                      <span className="opt-label">{t.name.toLowerCase()}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}

        {tab === 'stickers' && (
          <>
            <p className="panel-note">Tap a sticker to add it, or drag it onto your card. Tap it on the card to move, resize or turn it.</p>
            <div className="tray" role="group" aria-label="Sticker tray">
              {stickerFiles.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="tray-item"
                  onClick={() => props.onAddSticker(f)}
                  onPointerDown={(e) => props.onStickerDragStart?.(f, e)}
                  aria-label={`Add ${stickerLabel(f)}`}
                  title={stickerLabel(f)}
                >
                  <img src={`/stickers/${f}`} alt="" draggable={false} />
                </button>
              ))}
            </div>
            <div className="panel-actions">
              <button type="button" className="btn btn-line btn-sm" onClick={props.onResetStickers} disabled={!props.stickersCustomised}>
                reset stickers
              </button>
              <button type="button" className="btn btn-line btn-sm" onClick={props.onClearStickers}>
                clear all
              </button>
            </div>
          </>
        )}

        {tab === 'caption' && (
          <div className="caption-form">
            <label className="field">
              <span className="field-label">caption</span>
              <input
                type="text"
                className="input"
                value={design.caption}
                maxLength={24}
                placeholder="besties ♡"
                onChange={(e) => update({ caption: e.target.value })}
              />
            </label>
            <label className="check">
              <input type="checkbox" checked={design.showDate} onChange={(e) => update({ showDate: e.target.checked })} />
              <span>add the date</span>
            </label>
            <p className="panel-note">Each template picks its own lettering. Leave the caption empty for a clean band.</p>
          </div>
        )}
      </div>
    </section>
  );
}
