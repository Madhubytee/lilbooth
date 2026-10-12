import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Camera, { EXAMPLE_THUMB } from '../components/Camera';
import DesignPanel from '../components/DesignPanel';
import Logo from '../components/Logo';
import StripPreview from '../components/StripPreview';
import { captureFrame } from '../lib/capture';
import { getLayout } from '../lib/design';
import { useCamera } from '../lib/useCamera';
import { useReducedMotion } from '../lib/useReducedMotion';
import { useBooth } from '../state/booth';

const COUNT_MS = 1000;
const BETWEEN_MS = 1100;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Booth() {
  const { design, updateDesign, photos, setPhoto, clearPhotos, shotAt } = useBooth();
  const cam = useCamera();
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [count, setCount] = useState<number | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);
  const aborted = useRef(false);

  const layout = getLayout(design.layout);
  const live = cam.status === 'live' && !!cam.stream;
  const filled = photos.filter(Boolean).length;
  const done = filled === layout.count;
  const empty = photos.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0);

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

  // spacebar = shutter (unless typing or a control has focus, where space already means "press")
  const shutterRef = useRef(shootRemaining);
  shutterRef.current = shootRemaining;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, button, a, [role="tab"]')) return;
      e.preventDefault();
      shutterRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const shotLabel = `shot ${current !== null ? current + 1 : Math.min(filled + 1, layout.count)} of ${layout.count}`;

  let buttonText = 'ready when you are';
  if (!live) buttonText = 'camera’s off';
  else if (busy && count !== null) buttonText = 'get ready…';
  else if (busy) buttonText = 'strike a pose!';
  else if (done) buttonText = 'that’s a wrap';
  else if (filled > 0) buttonText = `${layout.count - filled} more to go`;

  let status = { text: 'camera off', tone: 'off' };
  if (cam.status === 'requesting') status = { text: 'waiting for camera', tone: 'wait' };
  else if (live && busy) status = { text: `shooting · ${shotLabel}`, tone: 'rec' };
  else if (live && done) status = { text: 'your strip is ready', tone: 'done' };
  else if (live) status = { text: 'camera on', tone: 'on' };

  const stripWidth = design.layout === 'grid' ? 208 : 156;

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
            aspect={layout.aspect}
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
                  {layout.count} shots · 3 second countdown each
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
                  see my strip →
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="booth-preview" aria-label="Strip preview">
          <span className="preview-label">live preview</span>
          <StripPreview
            design={design}
            photos={photos}
            shotAt={shotAt}
            width={stripWidth}
            onRetake={live ? (i) => shoot([i]) : undefined}
            retakeDisabled={busy}
          />
          {filled > 0 && live && <p className="preview-tip">tap a photo to retake just that one</p>}
        </section>

        <DesignPanel
          design={design}
          update={updateDesign}
          source={live ? { kind: 'stream', stream: cam.stream! } : { kind: 'image', src: EXAMPLE_THUMB }}
          mirror={live}
          busy={busy}
        />
      </main>
    </div>
  );
}
