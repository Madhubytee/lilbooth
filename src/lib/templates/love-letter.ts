import type {TemplateConfig} from './types.ts';
const config:TemplateConfig={
  "margin": 0.14,
  "gutter": 0.09,
  "header": 0.2,
  "footer": 0.48,
  "frame": {
    "side": 0.045,
    "top": 0.045,
    "bottom": 0.045
  },
  "id": "love-letter",
  "name": "Love Letter",
  "group": "open",
  "doubling": "continuous",
  "background": "#FFF9EF",
  "ink": "#895562",
  "decorations": {
    "cell": [
      "stamp"
    ],
    "card": [
      "double-border",
      "sign-off",
      "caps-date"
    ]
  },
  "stickers": [
    {
      "id": "default-top",
      "asset": "16-wax-sealed-envelope.png",
      "x": 0.5,
      "y": 0.04,
      "width": 0.15,
      "rotation": 0
    },
    {
      "id": "default-left",
      "asset": "18-cherry-blossoms.png",
      "x": 0.065,
      "y": 0.966,
      "width": 0.125,
      "rotation": -12
    },
    {
      "id": "default-right",
      "asset": "18-cherry-blossoms.png",
      "x": 0.935,
      "y": 0.966,
      "width": 0.125,
      "rotation": 12,
      "mirrored": true
    }
  ]
};
export default config;
