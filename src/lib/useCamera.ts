import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus =
  | 'checking' // looking at permissions, nothing on screen yet
  | 'idle' // permission not granted yet: show the example + allow button
  | 'requesting' // browser prompt is open
  | 'live'
  | 'denied'
  | 'notfound'
  | 'inuse'
  | 'insecure'
  | 'error';

export interface CameraDevice {
  id: string;
  label: string;
}

function classify(err: unknown): CameraStatus {
  const name = (err as { name?: string })?.name ?? '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') return 'notfound';
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'inuse';
  return 'error';
}

export function useCamera() {
  const [status, setStatus] = useState<CameraStatus>('checking');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const alive = useRef(true);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({ id: d.deviceId, label: d.label || `camera ${i + 1}` }));
      if (alive.current) setDevices(cams);
    } catch {
      /* not critical */
    }
  }, []);

  const start = useCallback(
    async (id?: string | null) => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setStatus('insecure');
        return;
      }
      stopTracks();
      setStream(null);
      setStatus('requesting');
      const video: MediaTrackConstraints = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        ...(id ? { deviceId: { exact: id } } : { facingMode: 'user' }),
      };
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video, audio: false });
        if (!alive.current) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        const track = s.getVideoTracks()[0];
        track?.addEventListener('ended', () => {
          if (alive.current && streamRef.current === s) setStatus('error');
        });
        setDeviceId(track?.getSettings().deviceId ?? id ?? null);
        setStream(s);
        setStatus('live');
        refreshDevices();
      } catch (err) {
        if (alive.current) setStatus(classify(err));
      }
    },
    [refreshDevices, stopTracks],
  );

  // On mount: start right away only if permission was already granted,
  // otherwise wait for the user to press "allow camera".
  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    (async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setStatus('insecure');
        return;
      }
      let state: PermissionState | 'unknown' = 'unknown';
      try {
        const p = await navigator.permissions.query({ name: 'camera' as PermissionName });
        state = p.state;
      } catch {
        /* Firefox/Safari may not support querying camera */
      }
      if (cancelled) return;
      if (state === 'granted') start();
      else if (state === 'denied') setStatus('denied');
      else setStatus('idle');
    })();

    const onChange = () => refreshDevices();
    navigator.mediaDevices?.addEventListener?.('devicechange', onChange);
    return () => {
      cancelled = true;
      alive.current = false;
      navigator.mediaDevices?.removeEventListener?.('devicechange', onChange);
      // turn the camera light off when leaving the booth
      stopTracks();
    };
  }, [refreshDevices, start, stopTracks]);

  const switchDevice = useCallback((id: string) => start(id), [start]);

  return { status, stream, devices, deviceId, start, switchDevice };
}
