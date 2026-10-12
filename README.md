# lil booth

A cute photobooth in your browser. Pick a filter, one of ten paper templates and one of six layouts, take real photos with your webcam through a 3·2·1 countdown, decorate the card with drag-and-drop stickers, then download or share it.

Everything happens on your device. There's no backend; photos only leave the device if you use the share button.

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

`dist/` is a static site. Host it anywhere that serves https (Netlify, Vercel, Cloudflare Pages, GitHub Pages…). Point unknown routes at `index.html` so `/booth` and `/result` work on refresh. The verification scripts and sample photos are not part of the build.

## Verify the templates

```bash
npm run verify
```

Renders all 10 templates × 6 layouts with `@napi-rs/canvas` and the bundled fonts, checks geometry, symmetry, photo aspect ratios, default sticker pairs, shot mapping, 1800px/3600px export and PNG round-trips, plus lil booth's own checks (unmoved default stickers render exactly like the template's, blank captions/hidden dates). Output goes to `artifacts/` (gitignored): `template-contact-sheet.png` and `verification.json`. The sample portraits in `scripts/fixtures/samples` are AI-generated test fixtures.

`scripts/configs.py` regenerates the template configs in `src/lib/templates/` if you change them there.

## How it fits together

```
src/
  pages/        Home, Booth, Result
  components/   Camera, FilterView, Countdown, DesignPanel, CardCanvas, CardEditor,
                StickerTray, Demo, HeroCards, Logo
  lib/
    templates/      10 template configs, layout engine, canvas renderer (renderCard)
    card.ts         renderDesign(): filters + crop each photo, then renderCard. Used by every card on screen and every export
    filters.ts      filter definitions → CSS live preview + per-pixel canvas renderer
    capture.ts      grab mirrored video frames, centre-crop to the layout's window, cache filtered crops
    design.ts       design state, layouts/shot counts, date helpers
    useCamera.ts    permission states, device picker, track cleanup
    useStickerActions.ts   add/reset/clear stickers, template switching
  state/booth.tsx   React context: design + up to 8 photos (in memory only)
  styles/fonts.css  @font-face for the bundled fonts (shared by UI and canvas)
public/
  stickers/     20 sticker PNGs
  fonts/        Instrument Serif, DM Sans, Caveat, Courier-compatible mono + licenses
scripts/        verify.mjs, configs.py, fixtures/samples
```

### Filters

Each filter is defined once as data (`lib/filters.ts`). It becomes:

1. a live CSS preview: a `filter:` string on the `<video>`, plus blended layers for tint (`soft-light`), lifted blacks (`screen`), bloom (blurred copy, `screen`), grain (`overlay`) and vignette, and
2. a canvas render for captured photos. This uses the same colour matrices as the CSS Filter Effects spec, applied per pixel with `getImageData`, plus canvas composite modes for the layers.

It doesn't use `ctx.filter` (Safari doesn't support it), so every browser gets the same export, and the export matches the preview.

### Templates and layouts

Templates are data (`src/lib/templates/*.ts`): colours, spacing, decorations and default stickers. Layouts are strip (4), trio (3), double strip (4, or 8 with different shots in each strip), double trio (3 or 6), grid (4) and big grid (6). Photos are kept when switching layouts, so extra shots aren't lost.

lil booth's changes to the package renderer: a `hideDate` option, no placeholder caption (an empty caption leaves the band blank), and a per-sticker `masked` flag so template default stickers keep their face-protection clip (they never cover the middle 60% of a photo) until someone moves them.

### Stickers

Positions are stored as fractions of the card (`x`, `y` of width/height, `width` of card width), so they stay put at any preview size and at 1800px or 3600px export. Select a sticker to bring it to the front; drag to move, corner handle to resize, top handle to rotate, square button to delete. Two fingers pinch to resize and twist. Keyboard: focus the card, Enter cycles stickers, arrows nudge (Shift for bigger steps), + / − resize, [ ] rotate, Delete removes, Escape deselects. Drag from the tray onto the card (on touch, press and hold first). Switching templates swaps in the new template's default stickers and keeps the ones you added.

### Photos

Each shot keeps the unfiltered, mirrored full frame. The strip centre-crops it to the slot's aspect ratio at render time, so you can change the filter, frame, stickers or even the layout after shooting without reshooting.

### Download and share

The result page downloads the exact canvas shown on screen (1800px on the long side), or a 3600px version with "extra large". Share opens the share sheet on touch devices and downloads on desktop. Each photo can also be saved on its own. File names look like `lilbooth-2026-10-12.png`.
