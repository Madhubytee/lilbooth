import { useRef, type PointerEvent as RPointerEvent } from 'react';
import { stickerLabel } from '../lib/card';
import { stickerFiles } from '../lib/templates/index.ts';

interface Props {
  /** add a sticker; `at` is the drop point as fractions of the card */
  onAdd: (file: string, at?: { x: number; y: number }) => void;
  onReset: () => void;
  onClear: () => void;
  customised: boolean;
}

const HOLD_MS = 280; // touch: press and hold to pick a sticker up (so the tray can still scroll)
const SLOP = 6;

/** Finds the card under a screen point, returning the point as fractions of the card. */
function dropPoint(x: number, y: number): { x: number; y: number } | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const target = el.closest('[data-drop-target="card"]');
    const card = target?.querySelector<HTMLElement>('.card');
    if (!card) continue;
    const r = card.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
    return { x: (x - r.left) / r.width, y: (y - r.top) / r.height };
  }
  return null;
}

export default function StickerTray({ onAdd, onReset, onClear, customised }: Props) {
  const suppressClick = useRef(false);

  const startDrag = (file: string, e: RPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const sx = e.clientX;
    const sy = e.clientY;
    const touch = e.pointerType !== 'mouse';
    let ghost: HTMLImageElement | null = null;
    let armed = !touch;
    let timer = 0;
    let lastY = sy;
    let raf = 0;
    // auto-scroll when the dragged sticker nears the top/bottom edge (card and tray are far apart on phones)
    const EDGE = 70;
    const autoScroll = () => {
      raf = 0;
      if (!ghost) return;
      const h = window.innerHeight;
      const v = lastY < EDGE ? -Math.ceil((EDGE - lastY) / 5) : lastY > h - EDGE ? Math.ceil((lastY - (h - EDGE)) / 5) : 0;
      if (v) {
        window.scrollBy(0, v);
        raf = requestAnimationFrame(autoScroll);
      }
    };

    const pickUp = (x: number, y: number) => {
      ghost = document.createElement('img');
      ghost.src = `/stickers/${file}`;
      ghost.className = 'drag-ghost';
      ghost.alt = '';
      document.body.appendChild(ghost);
      moveGhost(x, y);
      document.body.classList.add('is-dragging-sticker');
    };
    const moveGhost = (x: number, y: number) => {
      if (ghost) ghost.style.transform = `translate(${x - 36}px, ${y - 36}px)`;
    };
    const cleanup = () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('touchmove', blockScroll);
      ghost?.remove();
      document.body.classList.remove('is-dragging-sticker');
    };
    const blockScroll = (te: TouchEvent) => {
      if (ghost && te.cancelable) te.preventDefault();
    };
    const onMove = (m: PointerEvent) => {
      if (m.pointerId !== e.pointerId) return;
      const far = Math.hypot(m.clientX - sx, m.clientY - sy) > SLOP;
      if (!ghost) {
        if (touch && !armed) {
          // moved before the hold finished: it's a scroll, not a drag
          if (far) cleanup();
          return;
        }
        if (far) pickUp(m.clientX, m.clientY);
        return;
      }
      moveGhost(m.clientX, m.clientY);
      lastY = m.clientY;
      if (!raf) raf = requestAnimationFrame(autoScroll);
    };
    const onUp = (u: PointerEvent) => {
      if (u.pointerId !== e.pointerId) return;
      if (ghost) {
        // the click that may follow this drag shouldn't also add a sticker (touch sends none, so reset soon)
        suppressClick.current = true;
        setTimeout(() => (suppressClick.current = false), 0);
        const at = dropPoint(u.clientX, u.clientY);
        if (at) onAdd(file, at);
      }
      cleanup();
    };
    const onCancel = () => cleanup();

    if (touch) {
      timer = window.setTimeout(() => {
        armed = true;
        pickUp(sx, sy);
      }, HOLD_MS);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('touchmove', blockScroll, { passive: false });
  };

  return (
    <div className="sticker-tray">
      <p className="panel-note">Tap a sticker to add it, or drag it onto your card. Then drag it around, pull the corner to resize, and use the top handle to turn it.</p>
      <div className="tray" role="group" aria-label="Sticker tray">
        {stickerFiles.map((f) => (
          <button
            key={f}
            type="button"
            className="tray-item"
            onPointerDown={(e) => startDrag(f, e)}
            onClick={() => {
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              onAdd(f);
            }}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={`Add ${stickerLabel(f)}`}
            title={stickerLabel(f)}
          >
            <img src={`/stickers/${f}`} alt="" draggable={false} />
          </button>
        ))}
      </div>
      <div className="panel-actions">
        <button type="button" className="btn btn-line btn-sm" onClick={onReset} disabled={!customised}>
          reset stickers
        </button>
        <button type="button" className="btn btn-line btn-sm" onClick={onClear}>
          clear all
        </button>
      </div>
    </div>
  );
}
