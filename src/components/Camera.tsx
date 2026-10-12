import type { CSSProperties, Ref } from 'react';
import { getFilter, type FilterId } from '../lib/filters';
import type { CameraDevice, CameraStatus } from '../lib/useCamera';
import Countdown from './Countdown';
import FilterView from './FilterView';

export const EXAMPLE_PHOTO = '/example-cow.jpg';
export const EXAMPLE_THUMB = '/example-cow-sm.jpg';

interface Props {
  status: CameraStatus;
  stream: MediaStream | null;
  filter: FilterId;
  shotLabel: string;
  count: number | null;
  flashKey: number;
  /** aspect ratio of a photo slot; the camera box takes this shape */
  aspect: number;
  videoRef: Ref<HTMLVideoElement>;
  devices: CameraDevice[];
  deviceId: string | null;
  onAllow: () => void;
  onSwitch: (id: string) => void;
}

const MESSAGES: Partial<Record<CameraStatus, { title: string; body: string; action?: string }>> = {
  idle: {
    title: 'allow camera to start your strip',
    body: 'Your photos never leave this device. Until you allow it, say hi to our example cow and try some filters on her.',
    action: 'allow camera',
  },
  requesting: {
    title: 'waiting for permission…',
    body: 'Click “allow” in your browser’s prompt. It’s usually near the address bar.',
  },
  denied: {
    title: 'the camera is blocked',
    body: 'Click the camera or lock icon in the address bar, set camera to “allow”, then try again. On a phone, check your browser’s site settings.',
    action: 'try again',
  },
  notfound: {
    title: 'no camera found',
    body: 'Plug in a webcam (or check that your browser can see it) and try again.',
    action: 'try again',
  },
  inuse: {
    title: 'your camera is busy',
    body: 'Another app like Zoom, FaceTime or Teams is using it. Close that app, then try again.',
    action: 'try again',
  },
  insecure: {
    title: 'the camera needs a secure page',
    body: 'Browsers only allow the camera on https or localhost. Open lil booth from a secure address.',
  },
  error: {
    title: 'the camera stopped',
    body: 'It may have been unplugged or turned off. Try again to reconnect.',
    action: 'try again',
  },
};

export default function Camera(props: Props) {
  const { status, stream, filter, shotLabel, count, flashKey, aspect, videoRef, devices, deviceId, onAllow, onSwitch } = props;
  const live = status === 'live' && stream;
  const msg = MESSAGES[status];

  return (
    // the box is the same shape as the photo slot, so what you see is exactly what gets captured
    <div className="cam" style={{ '--cam-aspect': aspect } as CSSProperties}>
      <FilterView
        className="cam-media"
        filter={filter}
        mirror={!!live}
        source={live ? { kind: 'stream', stream } : { kind: 'image', src: EXAMPLE_PHOTO }}
        label={live ? 'Live camera preview' : 'Example photo of a cow, shown until the camera is on'}
        videoRef={videoRef}
      />

      <Countdown count={count} flashKey={flashKey} />

      <span className="cam-chip cam-chip-left">{getFilter(filter).name}</span>
      <span className="cam-chip cam-chip-right">{live ? shotLabel : 'example photo'}</span>

      {live && devices.length > 1 && (
        <label className="cam-picker">
          <span className="sr-only">camera</span>
          <select value={deviceId ?? ''} onChange={(e) => onSwitch(e.target.value)} disabled={count !== null}>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {msg && (
        <div className="cam-msg" role="status">
          <span className="cam-msg-title">{msg.title}</span>
          <p>{msg.body}</p>
          {msg.action && (
            <button type="button" className="btn btn-ink" onClick={onAllow}>
              {msg.action}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
