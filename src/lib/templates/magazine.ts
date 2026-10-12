import type {TemplateConfig} from './types.ts';
const config:TemplateConfig={
  "margin": 0.1,
  "gutter": 0.045,
  "header": 0.7,
  "footer": 0.23,
  "frame": {
    "side": 0,
    "top": 0,
    "bottom": 0
  },
  "id": "magazine",
  "name": "Magazine",
  "group": "open",
  "doubling": "continuous",
  "background": "#FFFFFF",
  "ink": "#2B2326",
  "decorations": {
    "cell": [],
    "card": [
      "masthead",
      "issue",
      "caps-date"
    ]
  },
  "stickers": [
    {
      "id": "default-left",
      "asset": "13-lipstick-kiss.png",
      "x": 0.08,
      "y": 0.977,
      "width": 0.12,
      "rotation": -12
    },
    {
      "id": "default-right",
      "asset": "13-lipstick-kiss.png",
      "x": 0.92,
      "y": 0.977,
      "width": 0.12,
      "rotation": 12,
      "mirrored": true
    }
  ]
};
export default config;
