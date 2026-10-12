import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import type { Photo } from '../lib/capture';
import { effectiveStickers, stickerLabel, type Assets } from '../lib/card';
import { geometryOf, type Design } from '../lib/design';
import type { Sticker } from '../lib/templates/types.ts';
import CardCanvas, { fitCard } from './CardCanvas';

interface Props {
  design: Design;
  update: (patch: Partial<Design>) => void;
  photos: (Photo | null)[];
  date: Date;
  assets: Assets;
  maxWidth: number;
  maxHeight: number;
  onRendered?: (c: HTMLCanvasElement) => void;
}

type Mode = 'move' | 'resize' | 'rotate' | 'pinch';

interface Gesture {
  mode: Mode;
  id: string;
  /** the finger/mouse driving move/resize/rotate */
  pointerId: number;
  start: Sticker;
  /** pointer position at start, px relative to the card */
  px: number;
  py: number;
  /** pinch: distance + angle between the two fingers at start */
  dist?: number;
  angle?: number;
  changed: boolean;
}

const MIN_W = 0.03;
const MAX_W = 1;
const NUDGE = 0.005;
const NUDGE_BIG = 0.025;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** snap to 0/90/180/270 when within 4 degrees */
function snapAngle(deg: number): number {
  const n = ((deg % 360) + 540) % 360 - 180;
  for (const a of [-180, -90, 0, 90, 180]) if (Math.abs(n - a) < 4) return a === -180 ? 180 : a;
  return Math.round(n * 10) / 10;
}

/**
 * The card with on-card sticker editing.
 * Sticker positions/sizes are fractions of the card (x, y of width/height; width of width),
 * so they're independent of preview size and export resolution.
 */
export default function CardEditor({ design, update, photos, date, assets, maxWidth, maxHeight, onRendered }: Props) {
  const layer = useRef<HTMLDivElement>(null);
  const size = fitCard(design, maxWidth, maxHeight);
  const g = useMemo(() => geometryOf(design), [design]);
  const committed = useMemo(() => effectiveStickers(design, assets), [design, assets]);

  const [selected, setSelected] = useState<string | null>(null);
  /** sticker list while a gesture is running (not yet saved to the design) */
  const [draft, setDraft] = useState<Sticker[] | null>(null);
  /** sticker drawn by the DOM instead of the canvas (being dragged, or waiting for the canvas to catch up) */
  const [liveId, setLiveId] = useState<string | null>(null);
  const awaitingCanvas = useRef(false);
  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const downAt = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [announce, setAnnounce] = useState('');
  const deletePressed = useRef(false);

  const list = draft ?? committed;
  const sel = list.find((s) => s.id === selected) ?? null;

  // forget a selection whose sticker is gone (reset, clear, template switch)
  useEffect(() => {
    if (selected && !committed.some((s) => s.id === selected) && !draft) setSelected(null);
  }, [committed, selected, draft]);

  /** what the canvas draws during a gesture: every sticker except the one being moved */
  const [frozen, setFrozen] = useState<Sticker[] | null>(null);
  // undefined = let the renderer draw its own (masked) template defaults
  const canvasStickers = frozen ?? (design.stickers ? committed : undefined);

  const aspectOf = useCallback(
    (s: Sticker) => {
      const im = assets[s.asset];
      return im ? im.naturalHeight / im.naturalWidth : 1;
    },
    [assets],
  );

  /** sticker box in card CSS px */
  const boxOf = useCallback(
    (s: Sticker) => {
      // same maths as stickerRect() in the renderer, scaled to CSS px
      const w = s.width * size.width;
      const h = s.width * g.width * aspectOf(s) * (size.height / g.height);
      return { cx: s.x * size.width, cy: s.y * size.height, w, h };
    },
    [aspectOf, g.height, g.width, size.height, size.width],
  );

  const hitTest = (x: number, y: number): Sticker | null => {
    for (let i = list.length - 1; i >= 0; i--) {
      const s = list[i];
      const b = boxOf(s);
      const a = (-s.rotation * Math.PI) / 180;
      const dx = x - b.cx;
      const dy = y - b.cy;
      const lx = dx * Math.cos(a) - dy * Math.sin(a);
      const ly = dx * Math.sin(a) + dy * Math.cos(a);
      const pad = 4;
      if (Math.abs(lx) <= b.w / 2 + pad && Math.abs(ly) <= b.h / 2 + pad) return s;
    }
    return null;
  };

  const local = (e: { clientX: number; clientY: number }) => {
    const r = layer.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  /** save a sticker list: bring the edited one to the front and drop its face mask */
  const commit = (next: Sticker[], id: string | null) => {
    let out = next;
    if (id) {
      const s = out.find((x) => x.id === id);
      if (s) out = [...out.filter((x) => x.id !== id), { ...s, masked: false }];
    }
    update({ stickers: out });
  };

  const patchDraft = (id: string, patch: Partial<Sticker>) => {
    const cur = currentOf(id);
    if (cur) latest.current[id] = { ...cur, ...patch };
    setDraft((d) => (d ?? committed).map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  /** latest values of a sticker, including uncommitted drag changes */
  const latest = useRef<Record<string, Sticker>>({});
  const currentOf = (id: string) => latest.current[id] ?? (draft ?? committed).find((x) => x.id === id);

  const beginGesture = (mode: Mode, s: Sticker, p: { x: number; y: number }, pointerId: number) => {
    latest.current = {};
    gesture.current = { mode, id: s.id, pointerId, start: { ...s }, px: p.x, py: p.y, changed: false };
    setSelected(s.id);
    setDraft(committed);
    setFrozen(committed.filter((x) => x.id !== s.id));
    setLiveId(s.id);
  };

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    layer.current!.setPointerCapture(e.pointerId);

    // second finger while a sticker is selected or being dragged: pinch to resize + rotate.
    // (read the id from the running gesture: React may not have re-rendered since the first finger)
    const pinchId = gesture.current?.id ?? sel?.id;
    const pinchSticker = pinchId ? (draft ?? committed).find((x) => x.id === pinchId) : undefined;
    if (pointers.current.size === 2 && pinchSticker) {
      const [a, b] = [...pointers.current.values()];
      const s = gesture.current?.mode === 'move' ? { ...gesture.current.start, ...currentOf(pinchSticker.id) } : pinchSticker;
      gesture.current = {
        mode: 'pinch',
        id: s.id,
        pointerId: e.pointerId,
        start: { ...s },
        px: p.x,
        py: p.y,
        dist: Math.hypot(b.x - a.x, b.y - a.y),
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        changed: gesture.current?.changed ?? false,
      };
      if (!draft) setDraft(committed);
      if (!frozen) setFrozen(committed.filter((x) => x.id !== s.id));
      setLiveId(s.id);
      return;
    }
    if (pointers.current.size > 1) return;

    downAt.current = { x: p.x, y: p.y, moved: false };
    const handle = (e.target as HTMLElement).closest<HTMLElement>('[data-handle]')?.dataset.handle as Mode | undefined;
    if (handle && sel) {
      e.preventDefault();
      beginGesture(handle, sel, p, e.pointerId);
      return;
    }
    const hit = hitTest(p.x, p.y);
    if (hit) {
      e.preventDefault();
      layer.current!.focus({ preventScroll: true });
      beginGesture('move', hit, p, e.pointerId);
      setAnnounce(`Selected ${stickerLabel(hit.asset)}.`);
    } else {
      setSelected(null);
    }
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    if (downAt.current && Math.hypot(p.x - downAt.current.x, p.y - downAt.current.y) > 4) downAt.current.moved = true;
    const gs = gesture.current;
    if (!gs) return;
    // only the finger that started a move/resize/rotate drives it
    if (gs.mode !== 'pinch' && e.pointerId !== gs.pointerId) return;
    const s0 = gs.start;
    const b0 = boxOf(s0);

    if (gs.mode === 'pinch') {
      if (pointers.current.size < 2) return;
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      patchDraft(gs.id, {
        width: clamp(s0.width * (dist / gs.dist!), MIN_W, MAX_W),
        rotation: snapAngle(s0.rotation + ((ang - gs.angle!) * 180) / Math.PI),
      });
    } else if (gs.mode === 'move') {
      patchDraft(gs.id, {
        x: clamp(s0.x + (p.x - gs.px) / size.width, 0, 1),
        y: clamp(s0.y + (p.y - gs.py) / size.height, 0, 1),
      });
    } else if (gs.mode === 'resize') {
      const d0 = Math.hypot(gs.px - b0.cx, gs.py - b0.cy) || 1;
      const d1 = Math.hypot(p.x - b0.cx, p.y - b0.cy);
      patchDraft(gs.id, { width: clamp(s0.width * (d1 / d0), MIN_W, MAX_W) });
    } else if (gs.mode === 'rotate') {
      const deg = (Math.atan2(p.y - b0.cy, p.x - b0.cx) * 180) / Math.PI + 90;
      patchDraft(gs.id, { rotation: snapAngle(deg) });
    }
    gs.changed = true;
  };

  const endPointer = (e: RPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    const gs = gesture.current;

    // pinch → one finger left: continue as a move from here
    if (gs?.mode === 'pinch' && pointers.current.size === 1) {
      const [[restId, rest]] = [...pointers.current.entries()];
      const cur = currentOf(gs.id)!;
      gesture.current = { mode: 'move', id: gs.id, pointerId: restId, start: { ...cur }, px: rest.x, py: rest.y, changed: gs.changed };
      return;
    }
    if (pointers.current.size) return;

    if (gs) {
      // keep the DOM copy on screen until the canvas has redrawn with the sticker in place
      awaitingCanvas.current = true;
      if (gs.changed) {
        const fresh = currentOf(gs.id);
        commit((draft ?? committed).map((s) => (s.id === gs.id && fresh ? fresh : s)), gs.id);
      }
      gesture.current = null;
      setDraft(null);
      setFrozen(null);
    } else if (downAt.current && !downAt.current.moved && design.template === 'contact-sheet') {
      // Contact Sheet: tap a photo to circle it
      const { x, y } = downAt.current;
      const ux = (x / size.width) * g.width;
      const uy = (y / size.height) * g.height;
      const c = g.cells.find((c) => ux >= c.photo.x && ux <= c.photo.x + c.photo.width && uy >= c.photo.y && uy <= c.photo.y + c.photo.height);
      if (c) update({ favorite: c.shotIndex });
    }
    downAt.current = null;
  };

  const handleRendered = (c: HTMLCanvasElement) => {
    if (awaitingCanvas.current) {
      awaitingCanvas.current = false;
      setLiveId(null);
    }
    onRendered?.(c);
  };

  const removeSelected = () => {
    if (!sel) return;
    update({ stickers: committed.filter((s) => s.id !== sel.id) });
    setAnnounce(`Removed ${stickerLabel(sel.asset)}.`);
    setSelected(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.repeat) {
      // cycle through stickers
      if (!committed.length) return;
      const i = committed.findIndex((s) => s.id === selected);
      const next = committed[(i + 1) % committed.length];
      setSelected(next.id);
      setAnnounce(`Selected ${stickerLabel(next.asset)}, ${committed.indexOf(next) + 1} of ${committed.length}.`);
      e.preventDefault();
      return;
    }
    if (e.key === 'Escape') {
      if (selected) {
        setSelected(null);
        setAnnounce('Nothing selected.');
        e.preventDefault();
      }
      return;
    }
    if (!sel) return;
    const step = e.shiftKey ? NUDGE_BIG : NUDGE;
    let patch: Partial<Sticker> | null = null;
    if (e.key === 'ArrowLeft') patch = { x: clamp(sel.x - step, 0, 1) };
    else if (e.key === 'ArrowRight') patch = { x: clamp(sel.x + step, 0, 1) };
    else if (e.key === 'ArrowUp') patch = { y: clamp(sel.y - step * (size.width / size.height), 0, 1) };
    else if (e.key === 'ArrowDown') patch = { y: clamp(sel.y + step * (size.width / size.height), 0, 1) };
    else if (e.key === '+' || e.key === '=') patch = { width: clamp(sel.width * 1.08, MIN_W, MAX_W) };
    else if (e.key === '-' || e.key === '_') patch = { width: clamp(sel.width / 1.08, MIN_W, MAX_W) };
    else if (e.key === ']') patch = { rotation: snapAngle(sel.rotation + 5) };
    else if (e.key === '[') patch = { rotation: snapAngle(sel.rotation - 5) };
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      removeSelected();
      return;
    }
    if (patch) {
      e.preventDefault();
      commit(
        committed.map((s) => (s.id === sel.id ? { ...s, ...patch } : s)),
        sel.id,
      );
    }
  };

  const live = liveId ? list.find((s) => s.id === liveId) : null;
  const ppu = size.width / g.width; // css px per card unit (shadow sizes are in card units)

  const place = (s: Sticker, withMirror: boolean) => {
    const b = boxOf(s);
    return {
      left: b.cx - b.w / 2,
      top: b.cy - b.h / 2,
      width: b.w,
      height: b.h,
      transform: `rotate(${s.rotation}deg)${withMirror && s.mirrored ? ' scaleX(-1)' : ''}`,
    };
  };

  return (
    <div className="card-editor" data-drop-target="card">
      <CardCanvas
        design={design}
        photos={photos}
        date={date}
        assets={assets}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        stickers={canvasStickers}
        label={`Your ${design.layout.replace('-', ' ')} card with ${committed.length} sticker${committed.length === 1 ? '' : 's'}`}
        onRendered={handleRendered}
      >
        <div
          ref={layer}
          className={`sticker-layer${sel ? ' has-selection' : ''}`}
          tabIndex={0}
          role="application"
          aria-roledescription="sticker editor"
          aria-label="Card stickers. Press Enter to select a sticker, arrow keys to move it, plus and minus to resize, brackets to rotate, Delete to remove, Escape to deselect."
          onPointerDown={onPointerDown}
          onPointerDownCapture={(e) => {
            // an extra finger during a gesture is always part of a pinch, even if it lands on a handle
            if (pointers.current.size >= 1 && !pointers.current.has(e.pointerId)) {
              e.stopPropagation();
              onPointerDown(e);
            }
          }}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onKeyDown={onKeyDown}
        >
          {live && (
            <img
              className="sticker-live"
              src={`/stickers/${live.asset}`}
              alt=""
              draggable={false}
              style={{
                ...place(live, true),
                filter: `drop-shadow(0 ${0.01 * ppu}px ${0.02 * ppu}px rgba(0,0,0,.18))`,
              }}
            />
          )}
          {sel && (
            <div className="sticker-select" style={place(sel, false)}>
              <span className="sticker-rotate" data-handle="rotate" aria-hidden="true" />
              <span className="sticker-resize" data-handle="resize" aria-hidden="true" />
              <button
                type="button"
                className="sticker-delete"
                aria-label={`Remove ${stickerLabel(sel.asset)}`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  deletePressed.current = true;
                }}
                onClick={(e) => {
                  // a tap that selected the sticker can be followed by a click landing here; ignore it
                  if (e.detail !== 0 && !deletePressed.current) return;
                  deletePressed.current = false;
                  removeSelected();
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </CardCanvas>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
