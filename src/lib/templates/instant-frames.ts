import type {TemplateConfig} from './types.ts';
const config:TemplateConfig={
  "margin": 0.1,
  "gutter": 0.09,
  "header": 0.16,
  "footer": 0.16,
  "frame": {
    "side": 0.045,
    "top": 0.045,
    "bottom": 0.19
  },
  "id": "instant-frames",
  "name": "Instant Frames",
  "group": "film",
  "doubling": "twin",
  "background": "#F3E9E5",
  "ink": "#423936",
  "decorations": {
    "cell": [
      "instant",
      "last-caption"
    ],
    "card": [
      "date"
    ]
  },
  "stickers": [
    {
      "id": "default-left",
      "asset": "19-satin-scrunchie.png",
      "x": 0.075,
      "y": 0.055,
      "width": 0.125,
      "rotation": -12
    },
    {
      "id": "default-right",
      "asset": "19-satin-scrunchie.png",
      "x": 0.925,
      "y": 0.055,
      "width": 0.125,
      "rotation": 12,
      "mirrored": true
    }
  ]
};
export default config;
