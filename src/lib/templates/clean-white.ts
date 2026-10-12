import type {TemplateConfig} from './types.ts';
const config:TemplateConfig={
  "margin": 0.14,
  "gutter": 0.06,
  "header": 0.19,
  "footer": 0.46,
  "frame": {
    "side": 0.012,
    "top": 0.012,
    "bottom": 0.012
  },
  "id": "clean-white",
  "name": "Clean White",
  "group": "open",
  "doubling": "continuous",
  "background": "#FFFFFF",
  "ink": "#2B2326",
  "decorations": {
    "cell": [
      "white-frame"
    ],
    "card": [
      "hairline",
      "serif-caption",
      "caps-date"
    ]
  },
  "stickers": [
    {
      "id": "default-left",
      "asset": "04-pearls.png",
      "x": 0.075,
      "y": 0.045,
      "width": 0.13,
      "rotation": -12
    },
    {
      "id": "default-right",
      "asset": "04-pearls.png",
      "x": 0.925,
      "y": 0.045,
      "width": 0.13,
      "rotation": 12,
      "mirrored": true
    }
  ]
};
export default config;
