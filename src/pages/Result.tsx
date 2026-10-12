import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { blobToBase64, canvasToBlob, processedPhoto, type Photo } from '../lib/capture';
import { fileDate, getLayout, stripGeometry } from '../lib/design';
import { ensureFonts, renderStrip } from '../lib/renderStrip';
import { useBooth } from '../state/booth';

type SendState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; to: string } | { kind: 'error'; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Result() {
  const { design, photos, shotAt, clearPhotos } = useBooth();
  const navigate = useNavigate();
  const complete = photos.length > 0 && photos.every(Boolean);

  const [url, setUrl] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const [email, setEmail] = useState('');
  const [attachEach, setAttachEach] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [send, setSend] = useState<SendState>({ kind: 'idle' });

  useEffect(() => {
    document.title = 'your strip · lil booth';
  }, []);

  // render the 2x export once per design change
  useEffect(() => {
    if (!complete) return;
    let cancelled = false;
    let made: string | null = null;
    (async () => {
      await ensureFonts();
      const canvas = renderStrip(design, photos, { scale: 2, date: shotAt });
      const blob = await canvasToBlob(canvas, 'image/png');
      if (cancelled) return;
      blobRef.current = blob;
      made = URL.createObjectURL(blob);
      setUrl(made);
    })();
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [complete, design, photos, shotAt]);

  const fileName = `lilbooth-${fileDate(shotAt)}.png`;

  const download = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const retake = () => {
    clearPhotos();
    navigate('/booth');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const to = email.trim();
    if (!EMAIL_RE.test(to)) {
      setEmailError('That email doesn’t look quite right.');
      return;
    }
    setEmailError('');
    if (!blobRef.current) return;
    setSend({ kind: 'sending' });
    try {
      const strip = await blobToBase64(blobRef.current);
      let singles: string[] | undefined;
      if (attachEach) {
        const layout = getLayout(design.layout);
        const w = Math.round(stripGeometry(layout).slots[0].w * 2);
        singles = await Promise.all(
          (photos as Photo[]).map(async (p) =>
            blobToBase64(await canvasToBlob(processedPhoto(p, layout.aspect, w, design.filter), 'image/jpeg', 0.92)),
          ),
        );
      }
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, strip, fileName, photos: singles }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong sending your strip.');
      setSend({ kind: 'sent', to });
    } catch (err) {
      const message =
        err instanceof TypeError ? 'Couldn’t reach the server. Check your connection and try again.' : (err as Error).message;
      setSend({ kind: 'error', message });
    }
  };

  if (!complete) {
    return (
      <div className="page">
        <header className="site-header">
          <Logo />
        </header>
        <main className="result-empty">
          <h1 className="display">
            no strip <em>yet.</em>
          </h1>
          <p>Head into the booth and take your photos first. Your strip will show up here.</p>
          <Link to="/booth" className="btn btn-ink btn-lg">
            open the booth
          </Link>
        </main>
      </div>
    );
  }

  const wide = design.layout === 'grid';

  return (
    <div className="page result-page">
      <header className="site-header">
        <Logo />
        <Link to="/booth" className="link-muted">
          ← edit the design
        </Link>
      </header>

      <main className="result">
        <section className="result-stage" aria-label="Your strip">
          <div className={`result-strip ${wide ? 'is-wide' : ''}`}>
            {url ? (
              <img src={url} alt={`Your lil booth ${design.layout}${design.caption ? `, captioned “${design.caption}”` : ''}`} />
            ) : (
              <div className="result-loading" style={{ aspectRatio: aspectOf(design.layout) }}>
                developing…
              </div>
            )}
          </div>
        </section>

        <section className="result-side">
          <div className="result-head">
            <span className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              {getLayout(design.layout).count} photos, printed pretty
            </span>
            <h1 className="display">
              your strip is <em>ready.</em>
            </h1>
            <p className="lede">Send it to your inbox, save the image, or go back and change the filter, frame or stickers. Your photos stay put.</p>
          </div>

          {send.kind === 'sent' ? (
            <div className="sent-box" role="status">
              <span className="sent-title">sent ♡</span>
              <span>Check your inbox at {send.to}. It might take a minute.</span>
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setSend({ kind: 'idle' });
                  setEmail('');
                }}
              >
                send to someone else
              </button>
            </div>
          ) : (
            <form className="email-form" onSubmit={onSubmit} noValidate>
              <label className="field">
                <span className="field-label">email it to</span>
                <input
                  type="email"
                  className="input"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  disabled={send.kind === 'sending'}
                  required
                />
              </label>
              {emailError && (
                <span id="email-error" className="field-error">
                  {emailError}
                </span>
              )}
              <label className="check">
                <input type="checkbox" checked={attachEach} onChange={(e) => setAttachEach(e.target.checked)} />
                <span>also attach each photo on its own</span>
              </label>
              <button type="submit" className="btn btn-ink btn-block" disabled={send.kind === 'sending' || !url}>
                {send.kind === 'sending' ? 'sending…' : 'send'}
              </button>
              {send.kind === 'error' && (
                <div className="error-box" role="alert">
                  <strong>that didn’t send.</strong> {send.message}
                </div>
              )}
            </form>
          )}

          <div className="result-actions">
            <button type="button" className="btn btn-line" onClick={download} disabled={!url}>
              download png
            </button>
            <Link to="/booth" className="btn btn-line">
              edit the design
            </Link>
            <button type="button" className="btn btn-ghost" onClick={retake}>
              retake photos
            </button>
          </div>
          <p className="fine">Nothing is saved on our server. Your photos only leave this device when you hit send.</p>
        </section>
      </main>
    </div>
  );
}

function aspectOf(layout: Parameters<typeof getLayout>[0]): string {
  const g = stripGeometry(getLayout(layout));
  return `${g.W} / ${g.H}`;
}
