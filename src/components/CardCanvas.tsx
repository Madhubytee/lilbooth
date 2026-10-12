import { useEffect, useRef, type ReactNode } from 'react';
import type { Photo } from '../lib/capture';
import { renderDesign, type Assets, type CardRenderOptions } from '../lib/card';
import { geometryOf, type Design } from '../lib/design';
import type { Sticker } from '../lib/templates/types.ts';

interface Props {
  design: Design;
  photos: (Photo | null)[];
  date: Date;
  assets: Assets;
  /** CSS box the card is fitted into */
  maxWidth: number;
  maxHeight: number;
  /** render resolution (long side px). Defaults to the 1800px export size. */
  longSide?: number;
  hideStickerId?: string;
  stickers?: Sticker[];
  label: string;
  className?: string;
  /** called with the exact canvas on screen, e.g. so download can encode it */
  onRendered?: (c: HTMLCanvasElement) => void;
  children?: ReactNode;
}

export function fitCard(design: Design, maxWidth: number, maxHeight: number) {
  const g = geometryOf(design);
  const k = Math.min(maxWidth / g.width, maxHeight / g.height);
  return { width: Math.round(g.width * k), height: Math.round(g.height * k) };
}

/**
 * Shows the renderer's canvas itself at CSS size (no second render, no screenshot),
 * so what's on screen is exactly what gets exported.
 */
export default function CardCanvas(props: Props) {
  const { design, photos, date, assets, maxWidth, maxHeight, longSide, hideStickerId, stickers, label, className, onRendered, children } =
    props;
  const host = useRef<HTMLDivElement>(null);
  const version = useRef(0);
  const onRenderedRef = useRef(onRendered);
  onRenderedRef.current = onRendered;
  const size = fitCard(design, maxWidth, maxHeight);

  useEffect(() => {
    const v = ++version.current;
    const opts: CardRenderOptions = { longSide, hideStickerId, stickers };
    renderDesign(design, photos, date, assets, opts).then((canvas) => {
      if (v !== version.current || !host.current) return;
      canvas.className = 'card-bitmap';
      if (label) {
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', label);
      } else canvas.setAttribute('aria-hidden', 'true');
      host.current.replaceChildren(canvas);
      onRenderedRef.current?.(canvas);
    });
  }, [design, photos, date, assets, longSide, hideStickerId, stickers, label]);

  return (
    <div className={`card ${className ?? ''}`} style={{ width: size.width, height: size.height }}>
      <div ref={host} className="card-host" />
      {children}
    </div>
  );
}
