import type { CSSProperties } from 'react';
import { shape, type ShapeId } from '../lib/stickers';

interface Props {
  id: ShapeId;
  color: string;
  accent?: string;
  size: number;
  /** white die-cut style outline, like the stickers on the strips */
  outline?: boolean;
  style?: CSSProperties;
  className?: string;
}

/** Inline SVG version of a sticker, built from the same shape data as the canvas render. */
export default function Sticker({ id, color, accent, size, outline, style, className }: Props) {
  const s = shape(id, color, accent);
  const h = (size * s.h) / s.w;
  return (
    <svg aria-hidden="true" width={size} height={h} viewBox={`0 0 ${s.w} ${s.h}`} style={style} className={className} overflow="visible">
      {s.parts.map((p, i) => {
        const stroke = p.stroke ?? (outline ? '#FFFFFF' : undefined);
        const sw = p.strokeWidth ?? (outline ? 1.8 : undefined);
        return p.circle ? (
          <circle key={i} cx={p.circle[0]} cy={p.circle[1]} r={p.circle[2]} fill={p.fill ?? 'none'} stroke={stroke} strokeWidth={sw} />
        ) : (
          <path
            key={i}
            d={p.d}
            fill={p.fill ?? 'none'}
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}
