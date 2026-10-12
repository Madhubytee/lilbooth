import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Camera, { EXAMPLE_THUMB } from '../components/Camera';
import CardEditor from '../components/CardEditor';
import DesignPanel from '../components/DesignPanel';
import Logo from '../components/Logo';
import { captureFrame } from '../lib/capture';
import { useCardAssets } from '../lib/card';
import { layouts } from '../lib/templates/index.ts';
import { useCamera } from '../lib/useCamera';
import { useReducedMotion } from '../lib/useReducedMotion';
import { useStickerActions } from '../lib/useStickerActions';
import { useBooth } from '../state/booth';

const COUNT_MS = 1000;
const BETWEEN_MS = 1100;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Booth() {
  const { design, updateDesign, photos, required, setPhoto, clearPhotos, shotAt } = useBooth();
  const cam = useCamera();
  const reduced = useReducedMotion();
  const assets = useCardAssets();
  const stickers = useStickerActions(design, updateDesign, assets);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [count, setCount] = useState<number | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);
  const aborted = useRef(false);

  const live = cam.status === 'live' && !!cam.stream;
  const used = photos.slice(0, required);
  const filled = used.filter(Boolean).length;
  const done = filled === required;
  const empty = used.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0);

  useEffect(() => {
    document.title = 'the booth · lil booth';
    aborted.current = false;
    return () => {
      aborted.current = true;
    };
  }, []);

  const shoot = useCallback(
    async (indices: number[]) => {
      if (busy || !live || !indices.length) return;
      setBusy(true);
      try {
        for (let k = 0; k < indices.length; k++) {
          const i = indices[k];
          setCurrent(i);
          for (const c of [3, 2, 1]) {
            setCount(c);
            await wait(COUNT_MS);
            if (aborted.current) return;
          }
          setCount(null);
          const v = videoRef.current;
          if (!v || !v.videoWidth) break;
          setPhoto(i, captureFrame(v));
          if (!reduced) setFlashKey((f) => f + 1);
          if (k < indices.length - 1) {
            await wait(BETWEEN_MS);
            if (aborted.current) return;
          }
        }
      } finally {
        if (!aborted.current) {
          setCount(null);
          setCurrent(null);
          setBusy(false);
        }
      }
    },
    [busy, live, reduced, setPhoto],
  );

  const shootRemaining = () => shoot(empty);

  // spacebar = shutter (unless typing, a control has focus, or the sticker editor has focus)
  const shutterRef = useRef(shootRemaining);
  shutterRef.current = shootRemaining;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, button, a, [role="tab"], .card-editor')) return;
      e.preventDefault();
      shutterRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const shotLabel = `shot ${current !== null ? current + 1 : Math.min(filled + 1, required)} of ${required}`;

  let buttonText = 'ready when you are';
  if (!live) buttonText = 'camera’s off';
  else if (busy && count !== null) buttonText = 'get ready…';
  else if (busy) buttonText = 'strike a pose!';
  else if (done) buttonText = 'that’s a wrap';
  else if (filled > 0) buttonText = `${required - filled} more to go`;

  let status = { text: 'camera off', tone: 'off' };
  if (cam.status === 'requesting') status = { text: 'waiting for camera', tone: 'wait' };
  else if (live && busy) status = { text: `shooting · ${shotLabel}`, tone: 'rec' };
  else if (live && done) status = { text: 'your card is ready', tone: 'done' };
  else if (live) status = { text: 'camera on', tone: 'on' };

  return (
    <div className="page booth-page">
      <header className="site-header">
        <Logo />
        <span className="status" aria-live="polite">
          <span className={`status-dot status-${status.tone}`} aria-hidden="true" />
          {status.text}
        </span>
      </header>

      <main className="booth">
        <h1 className="sr-only">The booth</h1>
        <section className="booth-cam" aria-label="Camera">
          <Camera
            status={cam.status}
            stream={cam.stream}
            filter={design.filter}
            shotLabel={shotLabel}
            count={count}
            flashKey={flashKey}
            aspect={layouts[design.layout].aspect}
            videoRef={videoRef}
            devices={cam.devices}
            deviceId={cam.deviceId}
            onAllow={() => cam.start(cam.deviceId)}
            onSwitch={cam.switchDevice}
          />

          <div className="controls">
            <div className="controls-shoot">
              <button
                type="button"
                className="shutter"
                aria-label={done ? 'All photos taken' : `Take ${empty.length} photo${empty.length === 1 ? '' : 's'}`}
                onClick={shootRemaining}
                disabled={!live || busy || done}
              />
              <div className="controls-text">
                <span className="controls-title">{buttonText}</span>
                <span className="controls-sub">
                  {required} shots · 3 second countdown each
                  {live && !busy && !done && <span className="kbd-hint"> · or press space</span>}
                </span>
              </div>
            </div>
            {done && !busy && (
              <div className="controls-done">
                <button type="button" className="btn btn-line" onClick={clearPhotos}>
                  retake all
                </button>
                <Link to="/result" className="btn btn-ink">
                  see my card →
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="booth-preview" aria-label="Card preview">
          <span className="preview-label">live preview</span>
          {assets ? (
            <CardEditor
              design={design}
              update={updateDesign}
              photos={photos}
              date={shotAt}
              assets={assets}
              maxWidth={268}
              maxHeight={540}
            />
          ) : (
            <div className="card-loading">loading…</div>
          )}
          {live && filled > 0 && (
            <div className="retake-row" role="group" aria-label="Retake one photo">
              <span>retake</span>
              {used.map((p, i) =>
                p ? (
                  <button
                    key={i}
                    type="button"
                    className="retake-btn"
                    onClick={() => shoot([i])}
                    disabled={busy}
                    aria-label={`Retake photo ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                ) : null,
              )}
            </div>
          )}
        </section>

        <DesignPanel
          design={design}
          update={updateDesign}
          onTemplate={stickers.chooseTemplate}
          photos={photos}
          shotAt={shotAt}
          assets={assets}
          source={live ? { kind: 'stream', stream: cam.stream! } : { kind: 'image', src: EXAMPLE_THUMB }}
          mirror={live}
          busy={busy}
          onAddSticker={stickers.addSticker}
          onResetStickers={stickers.resetStickers}
          onClearStickers={stickers.clearStickers}
          stickersCustomised={stickers.customised}
        />
      </main>
      {stickers.dialog}
    </div>
  );
}
