import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { cssFilter, getFilter, type FilterId } from '../lib/filters';
import { useReducedMotion } from '../lib/useReducedMotion';
import { EXAMPLE_PHOTO, EXAMPLE_THUMB } from './Camera';
import FilterView from './FilterView';

const LEN = 32;
const TICK = 480;

const FILTER_DEFS: { id: FilterId; chip: string }[] = [
  { id: 'original', chip: '#E8DCD3' },
  { id: 'bw', chip: '#BDB6B4' },
  { id: 'softpink', chip: '#F6CBD5' },
  { id: 'film', chip: '#E6D5B5' },
];

/** mini versions of four templates: clean white, blush polka, gingham, film negative */
const FRAME_DEFS: CSSProperties[] = [
  { background: '#FFFFFF', boxShadow: 'inset 0 0 0 1px #E6DEDF' },
  {
    backgroundColor: '#FDE8ED',
    backgroundImage: 'radial-gradient(#F4A7B9 1.6px,transparent 2.1px)',
    backgroundSize: '9px 9px',
  },
  {
    backgroundColor: '#FFFFFF',
    backgroundImage:
      'repeating-linear-gradient(0deg,rgba(244,167,185,0.35) 0 4px,transparent 4px 8px),repeating-linear-gradient(90deg,rgba(244,167,185,0.35) 0 4px,transparent 4px 8px)',
  },
  { background: '#2A1E1A' },
];

/** sticker chips; the timeline adds the bow (index 2) then the cherries (index 0) */
const STICKER_CHIPS = ['07-cherries.png', '20-gold-star-charm.png', '01-silk-bow.png', '14-blue-butterfly.png'];

/** different crops of the example photo so the strip looks like four poses */
const POSES = ['34% 22%', '40% 28%', '30% 26%', '38% 20%'];

const CURSOR_MAP: Record<number, [number, number]> = {
  0: [0, 0], 1: [0, 1], 2: [0, 1], 3: [0, 2], 4: [0, 2], 5: [1, 1], 6: [1, 1],
  7: [2, 2], 8: [2, 2], 9: [2, 0], 10: [2, 0], 11: [2, 0],
};
const CLICK_TICKS = new Set([2, 4, 6, 8, 10, 24]);
const ROW_TOP = [16 + 26 + 22, 16 + 26 + 22 + 84, 16 + 26 + 22 + 168];
const FILE = 'lilbooth-card.png';

const STEPS = [
  { id: 'design', num: '1', label: 'design it', at: 0 },
  { id: 'shoot', num: '2', label: 'shoot it', at: 12 },
  { id: 'send', num: '3', label: 'save or share', at: 19 },
] as const;

export default function Demo() {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(!reduced);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) setPlaying(false);
  }, [reduced]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    const id = setInterval(() => setT((x) => (x + 1) % LEN), TICK);
    return () => clearInterval(id);
  }, [playing, visible]);

  // ---- timeline (same as renderVals() in the design) ----
  let filterIdx = t >= 4 ? 2 : t >= 2 ? 1 : 0;
  let frameIdx = t >= 6 ? 1 : 0;
  const bowOn = t >= 8;
  const heartOn = t >= 10;
  const phase: 'design' | 'shoot' | 'send' = t <= 11 ? 'design' : t <= 18 ? 'shoot' : 'send';
  if (t === 0) {
    filterIdx = 0;
    frameIdx = 0;
  }

  let curLeft: string;
  let curTop: string;
  let curShow = true;
  if (phase === 'design') {
    const ct = CURSOR_MAP[t] ?? [0, 0];
    curLeft = `calc(16px + (100% - 32px) * ${(ct[1] + 0.5) / 4})`;
    curTop = `${ROW_TOP[ct[0]] - 4}px`;
  } else if (phase === 'send') {
    curLeft = '50%';
    curTop = `${t >= 23 ? 16 + 18 + 12 + 44 + 12 + 18 : 16 + 18 + 12 + 22}px`;
    curShow = t >= 22 && t <= 25;
  } else {
    curLeft = '80%';
    curTop = '380px';
    curShow = false;
  }
  const pressing = CLICK_TICKS.has(t);

  let count = '';
  let taken = 0;
  let flash = false;
  if (t >= 19) taken = 4;
  else if (phase === 'shoot') {
    if (t === 12) count = '3';
    else if (t === 13) count = '2';
    else if (t === 14) count = '1';
    else {
      taken = t - 14;
      flash = true;
    }
  }
  if (phase === 'send') taken = 4;

  const cur = FILTER_DEFS[phase === 'design' ? filterIdx : 2];
  const curDef = getFilter(cur.id);
  const sentDone = t >= 25;
  const status =
    phase === 'design' ? 'designing your strip' : phase === 'shoot' ? 'shooting' : sentDone ? 'saved' : 'ready to save';
  const shotText = `shot ${Math.min(Math.max(taken, phase === 'shoot' ? 1 : 0), 4)} of 4`;
  const note = t < 4 ? 'trying filters…' : t < 7 ? 'soft pink + blush polka' : 'adding a bow and cherries';
  const shootTitle = count ? 'get ready…' : taken >= 4 ? 'that’s a wrap' : 'smile!';

  return (
    <div className="demo" ref={root}>
      <div className="demo-head">
        <h2 className="h2">
          see it <em>in action.</em>
        </h2>
        <div className="demo-play">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause demo' : 'Play demo'}
          >
            {playing ? (
              <svg aria-hidden="true" width="12" height="14" viewBox="0 0 12 14">
                <rect x="0" y="0" width="4" height="14" fill="#2B2326" />
                <rect x="8" y="0" width="4" height="14" fill="#2B2326" />
              </svg>
            ) : (
              <svg aria-hidden="true" width="12" height="14" viewBox="0 0 12 14">
                <path d="M0 0 L12 7 L0 14 Z" fill="#2B2326" />
              </svg>
            )}
          </button>
          {playing ? 'playing on loop' : 'paused'}
        </div>
      </div>

      <div className="demo-window">
        <div className="demo-bar">
          <span style={{ background: 'var(--pink)' }} />
          <span style={{ background: 'var(--butter)' }} />
          <span style={{ background: 'var(--sky)' }} />
          <span className="demo-bar-name">lil booth</span>
          <span className="demo-bar-status">{status}</span>
        </div>

        <div className="demo-body">
          <div className="demo-cam">
            <FilterView className="demo-cam-media" filter={cur.id} source={{ kind: 'image', src: EXAMPLE_PHOTO }} label="Demo camera view" />
            <div className="demo-count" style={{ opacity: count ? 1 : 0 }} aria-hidden="true">
              <span>{count || '1'}</span>
            </div>
            <div className="demo-flash" style={{ opacity: flash && !reduced ? 0.9 : 0 }} />
            <span className="cam-chip cam-chip-left demo-chip">{curDef.name}</span>
            <span className="cam-chip cam-chip-right demo-chip">{shotText}</span>
          </div>

          <div className="demo-stripcol">
            <div className="demo-stripwrap" style={{ transform: phase === 'send' ? 'rotate(-3deg) scale(1.08)' : 'none' }}>
              <div className="demo-strip" style={FRAME_DEFS[frameIdx]}>
                {[0, 1, 2, 3].map((i) => {
                  const filled = i < taken;
                  return (
                    <div
                      key={i}
                      className="demo-slot"
                      style={{
                        transform: `scale(${filled ? 1 : 0.92})`,
                        ...(filled
                          ? {
                              backgroundImage: `url(${EXAMPLE_THUMB})`,
                              backgroundPosition: POSES[i],
                              filter: cssFilter(curDef),
                            }
                          : { background: 'rgba(255,255,255,0.65)', outline: '1px dashed #D8CBCE', outlineOffset: -1 }),
                      }}
                    />
                  );
                })}
                <div className="demo-caption">{t >= 9 ? 'besties ♡' : ''}</div>
              </div>
              <div className="demo-bow" style={{ opacity: bowOn ? 1 : 0, transform: `scale(${bowOn ? 1 : 0.3})` }}>
                <img src="/stickers/01-silk-bow.png" alt="" width={38} height={38} style={{ objectFit: 'contain' }} />
              </div>
              <div
                className="demo-heart"
                style={{ opacity: heartOn ? 1 : 0, transform: `rotate(-14deg) scale(${heartOn ? 1 : 0.3})` }}
              >
                <img src="/stickers/07-cherries.png" alt="" width={28} height={28} style={{ objectFit: 'contain' }} />
              </div>
            </div>
          </div>

          <div className="demo-panel" aria-hidden="true">
            {phase === 'design' && (
              <div className="demo-design">
                <div className="demo-row">
                  <span className="demo-label">filter</span>
                  <div className="demo-grid">
                    {FILTER_DEFS.map((f, i) => (
                      <div
                        key={f.id}
                        style={{
                          height: 44,
                          background: f.chip,
                          boxShadow: i === filterIdx ? 'inset 0 0 0 2px #2B2326, inset 0 0 0 4px #FFFFFF' : 'none',
                          transition: 'box-shadow 0.2s',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="demo-row">
                  <span className="demo-label">frame</span>
                  <div className="demo-grid">
                    {FRAME_DEFS.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          height: 44,
                          boxSizing: 'border-box',
                          ...f,
                          outline: i === frameIdx ? '2px solid #2B2326' : '0 solid transparent',
                          outlineOffset: 2,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="demo-row">
                  <span className="demo-label">stickers</span>
                  <div className="demo-grid">
                    {STICKER_CHIPS.map((c, i) => {
                      const on = (i === 2 && bowOn) || (i === 0 && heartOn);
                      return (
                        <div
                          key={i}
                          style={{
                            height: 44,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxSizing: 'border-box',
                            border: `1.5px solid ${on ? '#2B2326' : '#EEE7E8'}`,
                            background: on ? '#FBF8F7' : '#FFFFFF',
                          }}
                        >
                          <img src={`/stickers/${c}`} alt="" width={26} height={26} style={{ objectFit: 'contain' }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="demo-note">{note}</div>
              </div>
            )}

            {phase === 'shoot' && (
              <div className="demo-shoot">
                <span className="demo-shoot-title">{shootTitle}</span>
                <div className="demo-grid demo-bars">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} style={{ height: 8, transition: 'background 0.3s', background: j < taken ? '#D9577A' : '#EEE7E8' }} />
                  ))}
                </div>
                <span className="demo-note-plain">A 3 second countdown, a flash, and the photo drops into the strip.</span>
              </div>
            )}

            {phase === 'send' && (
              <div className="demo-send">
                <span className="demo-label">your card</span>
                <div className="demo-input">{FILE}</div>
                <div
                  className="demo-sendbtn"
                  style={{ background: t >= 23 ? '#D9577A' : '#2B2326', transform: `scale(${t === 24 ? 0.97 : 1})` }}
                >
                  {sentDone ? 'downloaded' : 'download png'}
                </div>
                <div className="demo-sharebtn">share</div>
                {sentDone && (
                  <div className="demo-sent">
                    <span className="demo-sent-title">saved ♡</span>
                    <span>or share it straight from your phone</span>
                  </div>
                )}
              </div>
            )}

            <svg
              aria-hidden="true"
              width="22"
              height="26"
              viewBox="0 0 22 26"
              className="demo-cursor"
              style={{ left: curLeft, top: curTop, opacity: curShow ? 1 : 0, transform: `scale(${pressing ? 0.8 : 1})` }}
            >
              <path
                d="M2 2 L2 21 L7 16.5 L10.5 24 L14 22.5 L10.6 15 L17.5 15 Z"
                fill="#2B2326"
                stroke="#FFFFFF"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="demo-steps">
          {STEPS.map((s, k) => {
            const on = s.id === phase;
            const end = k < 2 ? STEPS[k + 1].at : LEN;
            const pct = on ? Math.round(((t - s.at + 1) / (end - s.at)) * 100) : t >= end ? 100 : 0;
            return (
              <button
                key={s.id}
                type="button"
                className="demo-step"
                aria-current={on ? 'step' : undefined}
                onClick={() => setT(s.at)}
                style={{ background: on ? '#FDE8ED' : '#FFFFFF' }}
              >
                <span className="demo-step-bar" style={{ width: `${pct}%` }} />
                <span className="demo-step-num">{s.num}</span>
                <span className="demo-step-label">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
