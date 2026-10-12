import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';

const PORT = Number(process.env.PORT) || 8787;
const FROM = process.env.MAIL_FROM || 'lil booth <onboarding@resend.dev>';
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const MAX_STRIP_BYTES = 15 * 1024 * 1024;
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
const MAX_PHOTOS = 4;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const sendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 6,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'You’ve sent a lot of strips! Please wait a few minutes and try again.' },
});

/** decoded size of a base64 string, without decoding it */
function b64Bytes(s: string): number {
  const pad = s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0;
  return Math.floor((s.length * 3) / 4) - pad;
}

function isPng(buf: Buffer): boolean {
  return buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47;
}
function isJpeg(buf: Buffer): boolean {
  return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8;
}

function emailHtml(): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF8F7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F7;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border:1.5px solid #2B2326;">
<tr><td style="padding:16px 22px;border-bottom:1.5px solid #2B2326;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#2B2326;">
<span style="display:inline-block;width:10px;height:10px;background:#F4A7B9;"></span>
<span style="display:inline-block;width:10px;height:10px;background:#FFE29A;"></span>
<span style="display:inline-block;width:10px;height:10px;background:#A9D3F5;margin-right:8px;"></span>lil booth
</td></tr>
<tr><td style="padding:30px 22px 8px;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.1;color:#2B2326;">
your lil booth strip <em style="color:#D9577A;">&#9825;</em>
</td></tr>
<tr><td style="padding:0 22px 22px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#6E6266;">
Here it is, fresh out of the booth. It's attached too, so you can save it.
</td></tr>
<tr><td align="center" style="padding:8px 22px 30px;background:#FBF8F7;">
<img src="cid:strip" alt="your photo strip" width="260" style="display:block;width:260px;max-width:100%;height:auto;margin-top:22px;border:0;">
</td></tr>
<tr><td style="padding:16px 22px;border-top:1px solid #EEE7E8;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E6266;">
made with lil booth. we don't keep a copy of your photos.
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

app.post('/api/send', sendLimiter, express.json({ limit: '30mb' }), async (req: Request, res: Response) => {
  const { to, strip, photos, fileName } = (req.body ?? {}) as {
    to?: unknown;
    strip?: unknown;
    photos?: unknown;
    fileName?: unknown;
  };

  if (typeof to !== 'string' || to.length > 254 || !EMAIL_RE.test(to.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (typeof strip !== 'string' || !BASE64_RE.test(strip)) {
    return res.status(400).json({ error: 'The strip image is missing.' });
  }
  if (b64Bytes(strip) > MAX_STRIP_BYTES) {
    return res.status(413).json({ error: 'That strip is too big to email.' });
  }
  const stripBuf = Buffer.from(strip, 'base64');
  if (!isPng(stripBuf)) return res.status(400).json({ error: 'The strip image is not a PNG.' });

  const singles: Buffer[] = [];
  if (photos !== undefined) {
    if (!Array.isArray(photos) || photos.length > MAX_PHOTOS) {
      return res.status(400).json({ error: 'Too many photos attached.' });
    }
    for (const p of photos) {
      if (typeof p !== 'string' || !BASE64_RE.test(p) || b64Bytes(p) > MAX_PHOTO_BYTES) {
        return res.status(400).json({ error: 'One of the photos could not be attached.' });
      }
      const buf = Buffer.from(p, 'base64');
      if (!isJpeg(buf)) return res.status(400).json({ error: 'One of the photos could not be attached.' });
      singles.push(buf);
    }
  }

  if (!resend) {
    return res.status(503).json({ error: 'Email isn’t set up on this server yet (missing RESEND_API_KEY).' });
  }

  const name =
    typeof fileName === 'string' && /^[\w.-]{1,80}\.png$/.test(fileName) ? fileName : 'lilbooth-strip.png';

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [to.trim()],
      subject: 'your lil booth strip ♡',
      html: emailHtml(),
      text: "your lil booth strip ♡\n\nHere it is, fresh out of the booth. It's attached so you can save it.\n\nmade with lil booth. we don't keep a copy of your photos.",
      attachments: [
        { filename: name, content: stripBuf, contentType: 'image/png', contentId: 'strip' },
        ...singles.map((buf, i) => ({
          filename: name.replace(/\.png$/, `-photo-${i + 1}.jpg`),
          content: buf,
          contentType: 'image/jpeg',
        })),
      ],
    });
    if (error) {
      console.error('[send] resend error:', error);
      return res.status(502).json({ error: 'Our email service had a hiccup. Please try again in a moment.' });
    }
    // nothing is stored: buffers go out of scope here
    return res.json({ ok: true });
  } catch (err) {
    console.error('[send] failed:', err);
    return res.status(502).json({ error: 'Our email service had a hiccup. Please try again in a moment.' });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// In production, serve the built frontend from the same server.
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../dist');
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// body too large / bad JSON → friendly JSON errors
app.use((err: { type?: string; status?: number }, _req: Request, res: Response, next: NextFunction) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'That strip is too big to email.' });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Bad request.' });
  if (res.headersSent) return next(err);
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`lil booth api on http://localhost:${PORT}${resend ? '' : ' (email disabled: set RESEND_API_KEY)'}`);
});
