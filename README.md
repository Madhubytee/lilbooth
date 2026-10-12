# lil booth

A cute photobooth in your browser. Design a strip (filter, layout, frame, stickers, caption), take real photos with your webcam through a 3·2·1 countdown, then download the strip or email it to yourself.

Photos never touch a server until you press **send**, and the server doesn't store them.

## Setup

```bash
npm install
cp .env.example .env   # then add your Resend key
npm run dev
```

`npm run dev` starts both:

- the Vite frontend on http://localhost:5173
- the email API on http://localhost:8787 (Vite proxies `/api` to it)

Without a `RESEND_API_KEY`, everything still works except sending email. The send form shows a friendly error.

### Environment variables

| name | what |
|---|---|
| `RESEND_API_KEY` | API key from https://resend.com/api-keys |
| `MAIL_FROM` | sender, e.g. `lil booth <hi@yourdomain.com>`. Must be on a domain you verified in Resend. `onboarding@resend.dev` works for testing but only delivers to your own Resend account email. |
| `PORT` | API port, default `8787` |

`.env` is gitignored. Never commit it.

## The camera needs https (or localhost)

Browsers only allow `getUserMedia` on secure origins: `https://…` or `http://localhost`. If you open the dev server from another device using your LAN IP (`http://192.168.x.x:5173`), the camera will be blocked and the booth shows a "needs a secure page" message. To test on a phone, use an https tunnel (for example `cloudflared tunnel --url http://localhost:5173` or `ngrok http 5173`) or deploy it.

Until the user allows the camera, the booth shows an example photo (`public/example-cow.jpg`) so filters and the layout can be tried right away.

## Production

```bash
npm run build   # typechecks and builds to dist/
npm start       # serves dist/ and /api from one Express server on $PORT
```

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
server/index.ts     POST /api/send via Resend, with rate limiting and size limits
```

### Filters

Each filter is defined once as data (`lib/filters.ts`). It becomes:

1. a live CSS preview: a `filter:` string on the `<video>`, plus blended layers for tint (`soft-light`), lifted blacks (`screen`), bloom (blurred copy, `screen`), grain (`overlay`) and vignette, and
2. a canvas render for captured photos. This uses the same colour matrices as the CSS Filter Effects spec, applied per pixel with `getImageData`, plus canvas composite modes for the layers.

It doesn't use `ctx.filter` (Safari doesn't support it), so every browser gets the same export, and the export matches the preview.

### Photos

Each shot keeps the unfiltered, mirrored full frame. The strip centre-crops it to the slot's aspect ratio at render time, so you can change the filter, frame, stickers or even the layout after shooting without reshooting.

### Export sizes (PNG at 2x)

| layout | 1x | exported |
|---|---|---|
| strip (4 × 4:3) | 600 × 1884 | 1200 × 3768 |
| grid (2 × 2 square) | 1200 × 1370 | 2400 × 2740 |
| trio (3 × 6:5) | 600 × 1596 | 1200 × 3192 |

## Email API

`POST /api/send`

```json
{ "to": "you@email.com", "strip": "<base64 png>", "fileName": "lilbooth-2026-10-12.png", "photos": ["<base64 jpeg>", "…"] }
```

- 6 requests per 15 minutes per IP
- JSON body up to 30 MB, strip up to 15 MB, up to 4 photos of 6 MB each
- the strip is attached and shown inline (`cid:strip`). Nothing is written to disk.
