import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { canvasToBlob, processedPhoto, type Photo } from '../lib/capture';
import { fileDate, getLayout, stripGeometry } from '../lib/design';
import { ensureFonts, renderStrip } from '../lib/renderStrip';
import { useBooth } from '../state/booth';

function saveBlob(href: string, name: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function Result() {
  const { design, photos, shotAt, clearPhotos } = useBooth();
  const navigate = useNavigate();
  const complete = photos.length > 0 && photos.every(Boolean);

  const [url, setUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savingEach, setSavingEach] = useState(false);

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
      made = URL.createObjectURL(blob);
      setUrl(made);
    })();
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [complete, design, photos, shotAt]);

  const base = `lilbooth-${fileDate(shotAt)}`;

  const download = () => {
    if (!url) return;
    saveBlob(url, `${base}.png`);
    setSaved(true);
  };

  const downloadEach = async () => {
    setSavingEach(true);
    try {
      const layout = getLayout(design.layout);
      const w = Math.round(stripGeometry(layout).slots[0].w * 2);
      for (const [i, p] of (photos as Photo[]).entries()) {
        const blob = await canvasToBlob(processedPhoto(p, layout.aspect, w, design.filter), 'image/jpeg', 0.92);
        const href = URL.createObjectURL(blob);
        saveBlob(href, `${base}-photo-${i + 1}.jpg`);
        setTimeout(() => URL.revokeObjectURL(href), 1000);
        // browsers drop rapid back-to-back downloads, so space them out a little
        await new Promise((r) => setTimeout(r, 250));
      }
    } finally {
      setSavingEach(false);
    }
  };

  const retake = () => {
    clearPhotos();
    navigate('/booth');
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
            <p className="lede">Save it to your device, or go back and change the filter, frame or stickers. Your photos stay put.</p>
          </div>

          <div className="save-box">
            <button type="button" className="btn btn-ink btn-lg btn-block" onClick={download} disabled={!url}>
              {url ? 'download my strip' : 'developing…'}
            </button>
            <button type="button" className="btn btn-line btn-block" onClick={downloadEach} disabled={savingEach}>
              {savingEach ? 'saving…' : 'download each photo too'}
            </button>
            {saved && (
              <div className="sent-box" role="status">
                <span className="sent-title">saved ♡</span>
                <span>Check your downloads for {base}.png</span>
              </div>
            )}
          </div>

          <div className="result-actions">
            <Link to="/booth" className="btn btn-line">
              edit the design
            </Link>
            <button type="button" className="btn btn-ghost" onClick={retake}>
              retake photos
            </button>
          </div>
          <p className="fine">Your photos never leave this device. Nothing is uploaded anywhere.</p>
        </section>
      </main>
    </div>
  );
}

function aspectOf(layout: Parameters<typeof getLayout>[0]): string {
  const g = stripGeometry(getLayout(layout));
  return `${g.W} / ${g.H}`;
}
