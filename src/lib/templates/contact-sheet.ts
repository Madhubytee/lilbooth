import type {TemplateConfig} from './types.ts';
const config:TemplateConfig={
  "margin": 0.1,
  "gutter": 0.045,
  "header": 0.14,
  "footer": 0.32,
  "frame": {
    "side": 0.025,
    "top": 0.025,
    "bottom": 0.09
  },
  "id": "contact-sheet",
  "name": "Contact Sheet",
  "group": "film",
  "doubling": "twin",
  "background": "#F6F2E8",
  "ink": "#242020",
  "decorations": {
    "cell": [
      "rebate",
      "frame-number",
      "favorite"
    ],
    "card": [
      "grain",
      "caption",
      "date"
    ]
  },
  "stickers": [
    {
      "id": "default-left",
      "asset": "10-film-negatives.png",
      "x": 0.075,
      "y": 0.055,
      "width": 0.115,
      "rotation": -12
    },
    {
      "id": "default-right",
      "asset": "10-film-negatives.png",
      "x": 0.925,
      "y": 0.055,
      "width": 0.115,
      "rotation": 12,
      "mirrored": true
    }
  ]
};
export default config;
