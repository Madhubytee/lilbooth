import type {TemplateConfig} from './types.ts';
const config:TemplateConfig={
  "margin": 0.12,
  "gutter": 0.06,
  "header": 0.18,
  "footer": 0.47,
  "frame": {
    "side": 0.035,
    "top": 0.035,
    "bottom": 0.035
  },
  "id": "gingham",
  "name": "Gingham",
  "group": "open",
  "doubling": "continuous",
  "background": "#FFFFFF",
  "ink": "#684550",
  "decorations": {
    "cell": [
      "white-frame"
    ],
    "card": [
      "gingham",
      "ribbon",
      "caption",
      "caps-date"
    ]
  },
  "stickers": [
    {
      "id": "default-left",
      "asset": "08-pink-tulip-bouquet.png",
      "x": 0.075,
      "y": 0.065,
      "width": 0.13,
      "rotation": -12
    },
    {
      "id": "default-right",
      "asset": "08-pink-tulip-bouquet.png",
      "x": 0.925,
      "y": 0.065,
      "width": 0.13,
      "rotation": 12,
      "mirrored": true
    }
  ]
};
export default config;
