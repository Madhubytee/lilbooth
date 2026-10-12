import { useEffect, useMemo, useState } from 'react';
import type { Photo } from '../lib/capture';
import { useCardAssets } from '../lib/card';
import { DEFAULT_DESIGN, type Design } from '../lib/design';
import { makeCanvas } from '../lib/filters';
import CardCanvas from './CardCanvas';
import { EXAMPLE_PHOTO } from './Camera';

/** four "poses": different crops of the example photo around the face */
const POSES = [
  { cx: 0.36, cy: 0.42, zoom: 1.7 },
  { cx: 0.4, cy: 0.38, zoom: 2.1 },
  { cx: 0.33, cy: 0.45, zoom: 1.5 },
  { cx: 0.38, cy: 0.36, zoom: 2.4 },
];

let posesPromise: Promise<Photo[]> | null = null;

function examplePhotos(): Promise<Photo[]> {
  if (!posesPromise) {
    posesPromise = (async () => {
      const img = new Image();
      img.src = EXAMPLE_PHOTO;
      await img.decode();
      return POSES.map((p, i) => {
        const w = img.naturalWidth / p.zoom;
        const h = w * 0.75;
        const sx = Math.max(0, Math.min(img.naturalWidth - w, p.cx * img.naturalWidth - w / 2));
        const sy = Math.max(0, Math.min(img.naturalHeight - h, p.cy * img.naturalHeight - h / 2));
        const c = makeCanvas(800, 600);
        c.getContext('2d')!.drawImage(img, sx, sy, w, h, 0, 0, 800, 600);
        return { id: `hero-${i}`, original: c };
      });
    })();
  }
  return posesPromise;
}

const CARDS: { className: string; width: number; design: Partial<Design> }[] = [
  { className: 'hero-card-1', width: 132, design: { template: 'classic-booth', filter: 'bw' } },
  { className: 'hero-card-2', width: 156, design: { template: 'blush-polka', filter: 'softpink', caption: 'besties ♡' } },
  { className: 'hero-card-3', width: 132, design: { template: 'film-negative', filter: 'film' } },
];

/** The hero's three strips, drawn by the real card renderer from the example photo. */
export default function HeroCards() {
  const assets = useCardAssets();
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const date = useMemo(() => new Date(), []);
  const designs = useMemo(() => CARDS.map((c) => ({ ...DEFAULT_DESIGN, ...c.design })), []);

  useEffect(() => {
    let alive = true;
    examplePhotos().then((p) => alive && setPhotos(p));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      {CARDS.map((c, i) => (
        <div key={c.className} className={`hero-card ${c.className}`} style={{ width: c.width }}>
          {assets && photos && (
            <CardCanvas
              design={designs[i]}
              photos={photos}
              date={date}
              assets={assets}
              maxWidth={c.width}
              maxHeight={1000}
              longSide={900}
              label=""
            />
          )}
        </div>
      ))}
    </>
  );
}
