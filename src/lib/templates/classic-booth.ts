import type {TemplateConfig} from './types.ts';
const config:TemplateConfig={
  "margin": 0.1,
  "gutter": 0.06,
  "header": 0.12,
  "footer": 0.34,
  "frame": {
    "side": 0.012,
    "top": 0.012,
    "bottom": 0.012
  },
  "id": "classic-booth",
  "name": "Classic Booth",
  "group": "film",
  "doubling": "twin",
  "background": "#FAF8F2",
  "ink": "#2B2326",
  "decorations": {
    "cell": [
      "white-frame"
    ],
    "card": [
      "grain",
      "date",
      "caption"
    ]
  },
  "stickers": [
    {
      "id": "default-left",
      "asset": "04-pearls.png",
      "x": 0.075,
      "y": 0.055,
      "width": 0.12,
      "rotation": -12
    },
    {
      "id": "default-right",
      "asset": "04-pearls.png",
      "x": 0.925,
      "y": 0.055,
      "width": 0.12,
      "rotation": 12,
      "mirrored": true
    }
  ]
};
export default config;
