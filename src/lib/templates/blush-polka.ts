import type {TemplateConfig} from './types.ts';
const config:TemplateConfig={
  "margin": 0.12,
  "gutter": 0.06,
  "header": 0.19,
  "footer": 0.44,
  "frame": {
    "side": 0.04,
    "top": 0.04,
    "bottom": 0.04
  },
  "id": "blush-polka",
  "name": "Blush Polka",
  "group": "open",
  "doubling": "continuous",
  "background": "#FDE8ED",
  "ink": "#6D3949",
  "decorations": {
    "cell": [
      "white-frame"
    ],
    "card": [
      "polka",
      "serif-caption",
      "caps-date"
    ]
  },
  "stickers": [
    {
      "id": "default-top",
      "asset": "01-silk-bow.png",
      "x": 0.5,
      "y": 0.052,
      "width": 0.18,
      "rotation": 0
    },
    {
      "id": "default-left",
      "asset": "07-cherries.png",
      "x": 0.06,
      "y": 0.962,
      "width": 0.13,
      "rotation": -12
    },
    {
      "id": "default-right",
      "asset": "07-cherries.png",
      "x": 0.94,
      "y": 0.962,
      "width": 0.13,
      "rotation": 12,
      "mirrored": true
    }
  ]
};
export default config;
