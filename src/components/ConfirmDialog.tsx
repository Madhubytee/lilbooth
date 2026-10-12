import { useEffect, useRef } from 'react';

export interface ConfirmChoice {
  label: string;
  primary?: boolean;
  onChoose: () => void;
}

interface Props {
  title: string;
  body: string;
  choices: ConfirmChoice[];
  onCancel: () => void;
}

/** Small square modal. Escape or clicking the backdrop cancels. */
export default function ConfirmDialog({ title, body, choices, onCancel }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const before = useRef<Element | null>(null);

  useEffect(() => {
    before.current = document.activeElement;
    box.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Tab' && box.current) {
        // keep focus inside the dialog
        const btns = [...box.current.querySelectorAll<HTMLButtonElement>('button')];
        const i = btns.indexOf(document.activeElement as HTMLButtonElement);
        const next = e.shiftKey ? (i <= 0 ? btns.length - 1 : i - 1) : (i + 1) % btns.length;
        e.preventDefault();
        btns[next]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      (before.current as HTMLElement | null)?.focus?.();
    };
  }, [onCancel]);

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div
        ref={box}
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-body"
        onClick={(e) => e.stopPropagation()}
      >
        <span id="dialog-title" className="dialog-title">
          {title}
        </span>
        <p id="dialog-body">{body}</p>
        <div className="dialog-actions">
          {choices.map((c) => (
            <button key={c.label} type="button" className={`btn ${c.primary ? 'btn-ink' : 'btn-line'}`} onClick={c.onChoose}>
              {c.label}
            </button>
          ))}
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            cancel
          </button>
        </div>
      </div>
    </div>
  );
}
