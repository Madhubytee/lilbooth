# lil booth

A cute photobooth in your browser. Design a strip (filter, layout, frame, stickers, caption), take real photos with your webcam through a 3·2·1 countdown, then download the strip.

Everything happens on your device. There's no backend, and photos are never uploaded.

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
```

## The camera needs https (or localhost)

Browsers only allow `getUserMedia` on secure origins: `https://…` or `http://localhost`. If you open the dev server from another device using your LAN IP (`http://192.168.x.x:5173`), the camera will be blocked and the booth shows a "needs a secure page" message. To test on a phone, use an https tunnel (for example `cloudflared tunnel --url http://localhost:5173` or `ngrok http 5173`) or deploy it.

Until the user allows the camera, the booth shows an example photo (`public/example-cow.jpg`) so filters and the layout can be tried right away.

## Production

```bash
npm run build    # typechecks and builds to dist/
npm run preview  # serve the build locally
```

`dist/` is a static site. Host it anywhere that serves https (Netlify, Vercel, Cloudflare Pages, GitHub Pages…). Point unknown routes at `index.html` so `/booth` and `/result` work on refresh.

## How it fits together

```
src/
  pages/        Home, Booth, Result
  components/   Camera, FilterView, Countdown, DesignPanel, StripPreview, Demo, Sticker, Logo
  lib/
    filters.ts      filter definitions → CSS live preview + per-pixel canvas renderer
    capture.ts      grab mirrored video frames, centre-crop to slot, cache filtered crops
    renderStrip.ts  renderStrip(design, photos) → canvas (used for the preview AND the export)
    frames.ts       frame themes drawn in canvas (polka, gingham, film sprockets, …)
    stickers.ts     sticker shapes (the design's SVG paths) + die-cut raster
    design.ts       layouts, strip geometry, date helpers
    useCamera.ts    permission states, device picker, track cleanup
  state/booth.tsx   React context: design + photos (in memory only)
```

### Filters

Each filter is defined once as data (`lib/filters.ts`). It becomes:

1. a live CSS preview: a `filter:` string on the `<video>`, plus blended layers for tint (`soft-light`), lifted blacks (`screen`), bloom (blurred copy, `screen`), grain (`overlay`) and vignette, and
2. a canvas render for captured photos. This uses the same colour matrices as the CSS Filter Effects spec, applied per pixel with `getImageData`, plus canvas composite modes for the layers.

It doesn't use `ctx.filter` (Safari doesn't support it), so every browser gets the same export, and the export matches the preview.

### Photos

Each shot keeps the unfiltered, mirrored full frame. The strip centre-crops it to the slot's aspect ratio at render time, so you can change the filter, frame, stickers or even the layout after shooting without reshooting.

### Downloads

The result page saves the strip as `lilbooth-YYYY-MM-DD.png`, and can also save each photo on its own as `lilbooth-YYYY-MM-DD-photo-N.jpg`.

| layout | 1x | exported PNG (2x) |
|---|---|---|
| strip (4 × 4:3) | 600 × 1884 | 1200 × 3768 |
| grid (2 × 2 square) | 1200 × 1370 | 2400 × 2740 |
| trio (3 × 6:5) | 600 × 1596 | 1200 × 3192 |
