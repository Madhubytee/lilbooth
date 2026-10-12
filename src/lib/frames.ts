import { getGrainTile } from './filters';

export type FrameId = 'classic' | 'polka' | 'gingham' | 'butter' | 'mint' | 'blush' | 'film' | 'cherry';

export interface FrameTheme {
  id: FrameId;
  name: string;
  /** colour for the caption and date */
  ink: string;
  /** dark frames get light placeholders and no paper grain */
  dark?: boolean;
  /** CSS background for the swatch in the design panel */
  swatch: string;
  /** paints the frame background over the whole strip (base units) */
  paint(ctx: CanvasRenderingContext2D, w: number, h: number, pad: number): void;
}

const INK = '#2B2326';
const DEEP_PINK = '#D9577A';

function solid(color: string) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
  };
}

function dots(bg: string, dot: string) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const step = 30;
    const r = 4.6;
    // centre the grid so the dots look even at both edges
    const ox = ((w % step) + step) / 2;
    const oy = step / 2;
    ctx.fillStyle = dot;
    ctx.beginPath();
    for (let y = oy; y < h + r; y += step) {
      for (let x = ox; x < w + r; x += step) {
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  };
}

function gingham(color: string) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    const band = 14;
    const step = band * 2;
    ctx.fillStyle = color;
    // two crossing layers; where they overlap the colour doubles up like real gingham
    for (let y = 0; y < h; y += step) ctx.fillRect(0, y, w, band);
    for (let x = 0; x < w; x += step) ctx.fillRect(x, 0, band, h);
  };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const FRAMES: FrameTheme[] = [
  {
    id: 'classic',
    name: 'classic',
    ink: INK,
    swatch: 'background:#FFFFFF;box-shadow:inset 0 0 0 1.5px #E6DEDF',
    paint(ctx, w, h) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#E6DEDF';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);
    },
  },
  {
    id: 'polka',
    name: 'polka',
    ink: DEEP_PINK,
    swatch: 'background-color:#FDE8ED;background-image:radial-gradient(#F4A7B9 2px,transparent 2.6px);background-size:10px 10px',
    paint: dots('#FDE8ED', '#F4A7B9'),
  },
  {
    id: 'gingham',
    name: 'gingham',
    ink: INK,
    swatch:
      'background-color:#FFFFFF;background-image:repeating-linear-gradient(0deg,rgba(169,211,245,0.5) 0 5px,transparent 5px 10px),repeating-linear-gradient(90deg,rgba(169,211,245,0.5) 0 5px,transparent 5px 10px)',
    paint: gingham('rgba(169,211,245,0.5)'),
  },
  {
    id: 'butter',
    name: 'butter',
    ink: INK,
    swatch: 'background:#FFF1C7',
    paint: solid('#FFF1C7'),
  },
  {
    id: 'mint',
    name: 'mint',
    ink: INK,
    swatch: 'background-color:#E6F5EC;background-image:radial-gradient(#BFE6CF 2px,transparent 2.6px);background-size:10px 10px',
    paint: dots('#E6F5EC', '#BFE6CF'),
  },
  {
    id: 'blush',
    name: 'blush',
    ink: DEEP_PINK,
    swatch: 'background:#F9D6DE',
    paint: solid('#F9D6DE'),
  },
  {
    id: 'film',
    name: 'film',
    ink: '#FFFFFF',
    dark: true,
    swatch:
      'background-color:#2B2326;background-image:radial-gradient(#FFFFFF 1.3px,transparent 1.8px),radial-gradient(#FFFFFF 1.3px,transparent 1.8px);background-size:6px 8px,6px 8px;background-position:-1px 0,calc(100% + 1px) 0;background-repeat:repeat-y,repeat-y',
    paint(ctx, w, h, pad) {
      ctx.fillStyle = '#2B2326';
      ctx.fillRect(0, 0, w, h);
      // sprocket holes down both edges, centred in the side margin
      const hw = Math.min(12, pad * 0.36);
      const hh = hw * 1.35;
      const step = hh * 2.1;
      const n = Math.floor((h - hh) / step);
      const startY = (h - (n * step - (step - hh))) / 2;
      const lx = (pad - hw) / 2;
      const rx = w - pad + (pad - hw) / 2;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const y = startY + i * step;
        roundRect(ctx, lx, y, hw, hh, hw * 0.28);
        roundRect(ctx, rx, y, hw, hh, hw * 0.28);
      }
      ctx.fill();
    },
  },
  {
    id: 'cherry',
    name: 'cherry',
    ink: DEEP_PINK,
    swatch:
      'background-color:#FFFFFF;background-image:repeating-linear-gradient(0deg,rgba(217,87,122,0.35) 0 5px,transparent 5px 10px),repeating-linear-gradient(90deg,rgba(217,87,122,0.35) 0 5px,transparent 5px 10px)',
    paint: gingham('rgba(217,87,122,0.35)'),
  },
];

export function getFrame(id: FrameId): FrameTheme {
  return FRAMES.find((f) => f.id === id) ?? FRAMES[0];
}

/** Very light paper texture so light frames don't look flat and digital. */
export function paintPaperGrain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pattern = ctx.createPattern(getGrainTile(), 'repeat');
  if (!pattern) return;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
