import type {TemplateConfig} from './types.ts';
const config:TemplateConfig={
  "margin": 0.17,
  "gutter": 0.11,
  "header": 0.18,
  "footer": 0.4,
  "frame": {
    "side": 0.015,
    "top": 0.018,
    "bottom": 0.018
  },
  "id": "film-negative",
  "name": "Film Negative",
  "group": "film",
  "doubling": "twin",
  "background": "#2A1E1A",
  "ink": "#F8EAD7",
  "decorations": {
    "cell": [
      "sprockets",
      "negative-number",
      "edge-text"
    ],
    "card": [
      "caption",
      "date"
    ]
  },
  "stickers": [
    {
      "id": "default-left",
      "asset": "20-gold-star-charm.png",
      "x": 0.075,
      "y": 0.055,
      "width": 0.11,
      "rotation": -12
    },
    {
      "id": "default-right",
      "asset": "20-gold-star-charm.png",
      "x": 0.925,
      "y": 0.055,
      "width": 0.11,
      "rotation": 12,
      "mirrored": true
    }
  ]
};
export default config;
