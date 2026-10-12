import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { LAYOUTS, type CaptionFont, type Design, type LayoutId } from '../lib/design';
import { FILTERS } from '../lib/filters';
import { FRAMES } from '../lib/frames';
import { STICKER_PACKS } from '../lib/stickers';
import FilterView, { type MediaSource } from './FilterView';
import Sticker from './Sticker';

type Tab = 'filter' | 'layout' | 'frame' | 'stickers' | 'caption';
const TABS: Tab[] = ['filter', 'layout', 'frame', 'stickers', 'caption'];

interface Props {
  design: Design;
  update: (patch: Partial<Design>) => void;
  /** live camera (or the example photo) for the filter thumbnails */
  source: MediaSource;
  mirror: boolean;
  /** true while shooting: layout can't change mid-session */
  busy: boolean;
}

const FONTS: { id: CaptionFont; label: string; className: string }[] = [
  { id: 'serif', label: 'serif italic', className: 'aa-serif' },
  { id: 'bold', label: 'bold', className: 'aa-bold' },
  { id: 'type', label: 'typewriter', className: 'aa-type' },
];

function LayoutIcon({ id }: { id: LayoutId }) {
  const cells = id === 'grid' ? 4 : id === 'trio' ? 3 : 4;
  return (
    <span className={`layout-icon layout-icon-${id}`} aria-hidden="true">
      {Array.from({ length: cells }, (_, i) => (
        <span key={i} />
      ))}
    </span>
  );
}

export default function DesignPanel({ design, update, source, mirror, busy }: Props) {
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

  const toggleSticker = (id: (typeof STICKER_PACKS)[number]['id']) => {
    const on = design.stickers.includes(id);
    update({ stickers: on ? design.stickers.filter((s) => s !== id) : [...design.stickers, id] });
  };

  return (
    <section className="panel" aria-label="Design your strip">
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
              {LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="opt opt-layout"
                  aria-pressed={design.layout === l.id}
                  disabled={busy}
                  onClick={() => update({ layout: l.id })}
                >
                  <LayoutIcon id={l.id} />
                  <span className="opt-label">{l.name}</span>
                  <span className="opt-sub">{l.count} shots</span>
                </button>
              ))}
            </div>
            <p className="panel-note">Switching layout keeps the photos you've taken. Any new slots will be empty.</p>
          </>
        )}

        {tab === 'frame' && (
          <div className="opt-grid opt-grid-4" role="group" aria-label="Frame">
            {FRAMES.map((f) => (
              <button
                key={f.id}
                type="button"
                className="opt opt-frame"
                aria-pressed={design.frame === f.id}
                onClick={() => update({ frame: f.id })}
              >
                <span className="frame-swatch" style={styleFromString(f.swatch)} aria-hidden="true" />
                <span className="opt-label">{f.name}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'stickers' && (
          <>
            <div className="opt-grid opt-grid-3" role="group" aria-label="Stickers">
              {STICKER_PACKS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="opt opt-sticker"
                  aria-pressed={design.stickers.includes(s.id)}
                  onClick={() => toggleSticker(s.id)}
                >
                  <span className="sticker-icon">
                    <Sticker id={s.icon.shape} color={s.icon.color} accent={s.icon.accent} size={s.icon.shape === 'bow' ? 40 : 30} />
                  </span>
                  <span className="opt-label">{s.name}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-line btn-sm"
              onClick={() => update({ seed: Math.floor(Math.random() * 1e6) })}
              disabled={!design.stickers.length}
            >
              shuffle the tilt
            </button>
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
                maxLength={32}
                placeholder="besties ♡"
                onChange={(e) => update({ caption: e.target.value })}
              />
            </label>
            <fieldset className="field">
              <legend className="field-label">font</legend>
              <div className="opt-grid opt-grid-3">
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className="opt opt-font"
                    aria-pressed={design.font === f.id}
                    onClick={() => update({ font: f.id })}
                  >
                    <span className={f.className} aria-hidden="true">
                      Aa
                    </span>
                    <span className="opt-label">{f.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="check">
              <input type="checkbox" checked={design.showDate} onChange={(e) => update({ showDate: e.target.checked })} />
              <span>add the date</span>
            </label>
          </div>
        )}
      </div>
    </section>
  );
}

/** turns "a:b;c:d" into a React style object */
function styleFromString(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const decl of s.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[prop] = decl.slice(i + 1).trim();
  }
  return out;
}
