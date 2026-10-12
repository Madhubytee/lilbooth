import type { MouseEvent } from 'react';
import type { Photo } from '../lib/capture';
import type { Assets } from '../lib/card';
import { geometryOf, type Design } from '../lib/design';
import CardCanvas from './CardCanvas';

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

/** The live card. Contact Sheet: tap a photo to circle it as your favourite. */
export default function CardEditor({ design, update, photos, date, assets, maxWidth, maxHeight, onRendered }: Props) {
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (design.template !== 'contact-sheet') return;
    const b = e.currentTarget.getBoundingClientRect();
    const g = geometryOf(design);
    const x = ((e.clientX - b.left) / b.width) * g.width;
    const y = ((e.clientY - b.top) / b.height) * g.height;
    const c = g.cells.find((c) => x >= c.photo.x && x <= c.photo.x + c.photo.width && y >= c.photo.y && y <= c.photo.y + c.photo.height);
    if (c) update({ favorite: c.shotIndex });
  };

  return (
    <div className="card-editor" onClick={onClick}>
      <CardCanvas
        design={design}
        photos={photos}
        date={date}
        assets={assets}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        label={`Your ${design.layout.replace('-', ' ')} card`}
        onRendered={onRendered}
      />
    </div>
  );
}
