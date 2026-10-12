import { useEffect, useRef, useState } from 'react';
import type { Photo } from '../lib/capture';
import { getLayout, stripGeometry, type Design } from '../lib/design';
import { ensureFonts, renderStrip } from '../lib/renderStrip';

interface Props {
  design: Design;
  photos: (Photo | null)[];
  shotAt: Date;
  /** CSS width of the strip */
  width: number;
  onRetake?: (i: number) => void;
  retakeDisabled?: boolean;
}

/** Live strip, drawn by the same renderStrip() used for the export. */
export default function StripPreview({ design, photos, shotAt, width, onRetake, retakeDisabled }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const layout = getLayout(design.layout);
  const geo = stripGeometry(layout);
  const height = (width * geo.H) / geo.W;

  // remember which photo was in each slot so new ones can slide in
  const prev = useRef<(string | null)[]>([]);
  const [fresh, setFresh] = useState<Record<number, string>>({});

  useEffect(() => {
    const ids = photos.map((p) => p?.id ?? null);
    const added: Record<number, string> = {};
    ids.forEach((id, i) => {
      if (id && prev.current[i] !== id) added[i] = id;
    });
    prev.current = ids;
    if (Object.keys(added).length) setFresh(added);
  }, [photos]);

  useEffect(() => {
    let cancelled = false;
    ensureFonts().then(() => {
      if (cancelled || !ref.current) return;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const scale = Math.min(2, (width * dpr * 1.25) / geo.W);
      const out = renderStrip(design, photos, { scale, placeholders: true, date: shotAt });
      const c = ref.current;
      c.width = out.width;
      c.height = out.height;
      c.getContext('2d')!.drawImage(out, 0, 0);
    });
    return () => {
      cancelled = true;
    };
  }, [design, photos, shotAt, width, geo.W]);

  const filled = photos.filter(Boolean).length;
  const label = `Strip preview, ${layout.name} layout, ${filled} of ${layout.count} photos taken`;

  return (
    <div className="strip-preview" style={{ width, height }}>
      <canvas ref={ref} role="img" aria-label={label} style={{ width, height }} />
      {geo.slots.map((r, i) => {
        const pos = {
          left: `${(r.x / geo.W) * 100}%`,
          top: `${(r.y / geo.H) * 100}%`,
          width: `${(r.w / geo.W) * 100}%`,
          height: `${(r.h / geo.H) * 100}%`,
        };
        return (
          <div key={i} className="slot-layer" style={pos}>
            {fresh[i] && photos[i]?.id === fresh[i] && <span key={fresh[i]} className="slot-reveal" aria-hidden="true" />}
            {onRetake && photos[i] && (
              <button
                type="button"
                className="slot-retake"
                onClick={() => onRetake(i)}
                disabled={retakeDisabled}
                aria-label={`Retake photo ${i + 1}`}
              >
                <span>retake</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
