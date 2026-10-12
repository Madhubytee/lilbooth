import { useEffect, useRef, useState, type CSSProperties, type Ref } from 'react';
import {
  cssFilter,
  getFilter,
  getGrainUrl,
  GRAIN_REF_WIDTH,
  GRAIN_TILE,
  VIGNETTE_START,
  type FilterId,
} from '../lib/filters';

export type MediaSource = { kind: 'stream'; stream: MediaStream } | { kind: 'image'; src: string };

interface Props {
  filter: FilterId;
  source: MediaSource;
  mirror?: boolean;
  className?: string;
  /** accessible label for the picture; omit for decorative thumbnails */
  label?: string;
  videoRef?: Ref<HTMLVideoElement>;
}

function StreamVideo({ stream, style, innerRef }: { stream: MediaStream; style: CSSProperties; innerRef?: Ref<HTMLVideoElement> }) {
  const local = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = local.current;
    if (!v) return;
    if (v.srcObject !== stream) v.srcObject = stream;
    v.play().catch(() => {
      /* autoplay with muted should always work; ignore races on unmount */
    });
  }, [stream]);
  return (
    <video
      ref={(el) => {
        local.current = el;
        if (typeof innerRef === 'function') innerRef(el);
        else if (innerRef) (innerRef as { current: HTMLVideoElement | null }).current = el;
      }}
      autoPlay
      playsInline
      muted
      style={style}
    />
  );
}

/**
 * Live CSS preview of a filter. Mirrors the canvas pipeline in lib/filters.ts:
 * colour ops → bloom (screen) → tint (soft-light) → lift (screen) → grain (overlay) → vignette.
 */
export default function FilterView({ filter, source, mirror, className, label, videoRef }: Props) {
  const def = getFilter(filter);
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width || 600));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const base: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: mirror ? 'scaleX(-1)' : undefined,
    filter: cssFilter(def),
    transition: 'filter 0.3s',
  };
  const layer: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' };

  const media = (style: CSSProperties, main: boolean) =>
    source.kind === 'stream' ? (
      <StreamVideo stream={source.stream} style={style} innerRef={main ? videoRef : undefined} />
    ) : (
      <img src={source.src} alt="" style={style} draggable={false} />
    );

  return (
    <div
      ref={box}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ position: 'relative', overflow: 'hidden', isolation: 'isolate' }}
    >
      {media(base, true)}
      {def.bloom &&
        media(
          {
            ...base,
            filter: `${cssFilter(def)} blur(${(def.bloom.blur * width).toFixed(1)}px)`,
            mixBlendMode: 'screen',
            opacity: def.bloom.alpha,
          },
          false,
        )}
      {def.tint && <div style={{ ...layer, background: def.tint.color, mixBlendMode: 'soft-light', opacity: def.tint.alpha }} />}
      {def.lift && (
        <div
          style={{
            ...layer,
            background: `rgb(${Math.round(def.lift * 255)},${Math.round(def.lift * 255)},${Math.round(def.lift * 255)})`,
            mixBlendMode: 'screen',
          }}
        />
      )}
      {def.grain && (
        <div
          style={{
            ...layer,
            backgroundImage: `url(${getGrainUrl()})`,
            backgroundSize: `${(GRAIN_TILE * width) / GRAIN_REF_WIDTH}px`,
            mixBlendMode: 'overlay',
            opacity: def.grain,
          }}
        />
      )}
      {def.vignette && (
        <div
          style={{
            ...layer,
            background: `radial-gradient(ellipse farthest-corner at center, rgba(0,0,0,0) ${VIGNETTE_START * 100}%, rgba(0,0,0,${def.vignette}) 100%)`,
          }}
        />
      )}
    </div>
  );
}
