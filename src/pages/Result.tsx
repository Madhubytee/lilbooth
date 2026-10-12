import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CardEditor from '../components/CardEditor';
import Logo from '../components/Logo';
import StickerTray from '../components/StickerTray';
import { canvasToBlob } from '../lib/capture';
import { cardPhotos, renderDesign, useCardAssets } from '../lib/card';
import { fileDate } from '../lib/design';
import { layouts } from '../lib/templates/index.ts';
import { useStickerActions } from '../lib/useStickerActions';
import { useBooth } from '../state/booth';

function useViewport() {
  const [v, setV] = useState(() => ({ vw: window.innerWidth, vh: window.innerHeight }));
  useEffect(() => {
    const on = () => setV({ vw: window.innerWidth, vh: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return v;
}

function saveBlob(blob: Blob, name: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1500);
}

/** touch devices get the share sheet; desktops just download */
function canUseShareSheet(file: File): boolean {
  return window.matchMedia('(pointer: coarse)').matches && !!navigator.canShare?.({ files: [file] });
}

export default function Result() {
  const { design, updateDesign, photos, required, shotAt, clearPhotos } = useBooth();
  const navigate = useNavigate();
  const assets = useCardAssets();
  const stickers = useStickerActions(design, updateDesign, assets);
  const complete = photos.slice(0, required).every(Boolean);
  const { vw, vh } = useViewport();

  // the exact canvas on screen: downloads encode this, so export == preview
  const shown = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);
  const [retina, setRetina] = useState(false);
  const [status, setStatus] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    document.title = 'your card · lil booth';
  }, []);

  const base = `lilbooth-${fileDate(shotAt)}`;

  const exportBlob = async (): Promise<Blob> => {
    if (retina && assets) {
      const big = await renderDesign(design, photos, shotAt, assets, { retina: true });
      return canvasToBlob(big, 'image/png');
    }
    if (!shown.current) throw new Error('not ready');
    return canvasToBlob(shown.current, 'image/png');
  };

  const download = async () => {
    setWorking(true);
    try {
      saveBlob(await exportBlob(), `${base}${retina ? '-3600' : ''}.png`);
      setStatus(`saved ♡ check your downloads for ${base}${retina ? '-3600' : ''}.png`);
    } catch {
      setStatus('Something went wrong saving your card. Please try again.');
    } finally {
      setWorking(false);
    }
  };

  const share = async () => {
    setWorking(true);
    try {
      const blob = await exportBlob();
      const file = new File([blob], `${base}.png`, { type: 'image/png' });
      if (canUseShareSheet(file)) {
        await navigator.share({ files: [file], title: 'my lil booth card' });
        setStatus('shared ♡');
      } else {
        saveBlob(blob, file.name);
        setStatus(`saved ♡ check your downloads for ${file.name}`);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setStatus('Sharing didn’t work here. Try download instead.');
    } finally {
      setWorking(false);
    }
  };

  const downloadEach = async () => {
    setWorking(true);
    try {
      const singles = cardPhotos(design, photos.slice(0, required));
      for (const [i, c] of singles.entries()) {
        if (!c) continue;
        saveBlob(await canvasToBlob(c, 'image/jpeg', 0.92), `${base}-photo-${i + 1}.jpg`);
        // browsers drop rapid back-to-back downloads, so space them out a little
        await new Promise((r) => setTimeout(r, 250));
      }
      setStatus(`saved ${singles.length} photos ♡`);
    } finally {
      setWorking(false);
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
            no card <em>yet.</em>
          </h1>
          <p>Head into the booth and take your photos first. Your card will show up here.</p>
          <Link to="/booth" className="btn btn-ink btn-lg">
            open the booth
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="page result-page">
      <header className="site-header">
        <Logo />
        <Link to="/booth" className="link-muted">
          ← edit the design
        </Link>
      </header>

      <main className="result">
        <section className="result-stage" aria-label="Your card">
          {assets ? (
            <CardEditor
              design={design}
              update={updateDesign}
              photos={photos}
              date={shotAt}
              assets={assets}
              maxWidth={Math.min(440, vw - 64)}
              maxHeight={Math.min(660, Math.max(360, vh * 0.7))}
              onRendered={(c) => {
                shown.current = c;
                setReady(true);
              }}
            />
          ) : (
            <div className="card-loading">developing…</div>
          )}
          <details className="result-stickers">
            <summary>add or change stickers</summary>
            <StickerTray
              onAdd={stickers.addSticker}
              onReset={stickers.resetStickers}
              onClear={stickers.clearStickers}
              customised={stickers.customised}
            />
          </details>
        </section>

        <section className="result-side">
          <div className="result-head">
            <span className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              {required} photos · {layouts[design.layout].name.toLowerCase()}
            </span>
            <h1 className="display">
              your card is <em>ready.</em>
            </h1>
            <p className="lede">Save it, share it, or go back and change the filter, template or stickers. Your photos stay put.</p>
          </div>

          <div className="save-box">
            <button type="button" className="btn btn-ink btn-lg btn-block" onClick={download} disabled={!ready || working}>
              {ready ? 'download png' : 'developing…'}
            </button>
            <button type="button" className="btn btn-line btn-block" onClick={share} disabled={!ready || working}>
              share
            </button>
            <label className="check">
              <input type="checkbox" checked={retina} onChange={(e) => setRetina(e.target.checked)} />
              <span>
                extra large <span className="check-sub">(3600px instead of 1800px)</span>
              </span>
            </label>
            <button type="button" className="link-btn" onClick={downloadEach} disabled={working}>
              download each photo on its own
            </button>
            {status && (
              <div className="sent-box" role="status">
                {status}
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
          <p className="fine">Your photos never leave this device unless you share them.</p>
        </section>
      </main>
      {stickers.dialog}
    </div>
  );
}
