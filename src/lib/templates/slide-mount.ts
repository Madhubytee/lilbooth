import type {TemplateConfig} from './types.ts';
const config:TemplateConfig={
  "margin": 0.1,
  "gutter": 0.06,
  "header": 0.15,
  "footer": 0.31,
  "frame": {
    "side": 0.08,
    "top": 0.07,
    "bottom": 0.13
  },
  "id": "slide-mount",
  "name": "Slide Mount",
  "group": "film",
  "doubling": "twin",
  "background": "#EBEBE9",
  "ink": "#49423F",
  "decorations": {
    "cell": [
      "slide",
      "mount-label"
    ],
    "card": [
      "caption",
      "date"
    ]
  },
  "stickers": [
    {
      "id": "default-left",
      "asset": "14-blue-butterfly.png",
      "x": 0.075,
      "y": 0.055,
      "width": 0.13,
      "rotation": -12
    },
    {
      "id": "default-right",
      "asset": "14-blue-butterfly.png",
      "x": 0.925,
      "y": 0.055,
      "width": 0.13,
      "rotation": 12,
      "mirrored": true
    }
  ]
};
export default config;
