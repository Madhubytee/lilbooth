import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Photo } from '../lib/capture';
import { MAX_SHOTS, requiredShots, sanitizeDesign, type Design } from '../lib/design';

interface BoothState {
  design: Design;
  updateDesign: (patch: Partial<Design>) => void;
  /**
   * Always MAX_SHOTS long. Only the first `required` are used by the current
   * layout; extra shots are kept so switching layouts never throws photos away.
   */
  photos: (Photo | null)[];
  required: number;
  setPhoto: (i: number, p: Photo) => void;
  clearPhotos: () => void;
  shotAt: Date;
}

const Ctx = createContext<BoothState | null>(null);
const KEY = 'lilbooth:design:v2';

function loadDesign(): Design {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return sanitizeDesign(JSON.parse(raw));
  } catch {
    /* storage can be unavailable; defaults are fine */
  }
  return sanitizeDesign({});
}

export function BoothProvider({ children }: { children: ReactNode }) {
  const [design, setDesign] = useState<Design>(loadDesign);
  const [photos, setPhotos] = useState<(Photo | null)[]>(() => Array(MAX_SHOTS).fill(null));
  const [shotAt, setShotAt] = useState(() => new Date());

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(design));
    } catch {
      /* ignore */
    }
  }, [design]);

  const updateDesign = useCallback((patch: Partial<Design>) => setDesign((d) => ({ ...d, ...patch })), []);

  const setPhoto = useCallback((i: number, p: Photo) => {
    setPhotos((prev) => prev.map((x, j) => (j === i ? p : x)));
    setShotAt(new Date());
  }, []);

  const clearPhotos = useCallback(() => setPhotos(Array(MAX_SHOTS).fill(null)), []);

  const required = requiredShots(design.layout, design.differentShots);

  const value = useMemo(
    () => ({ design, updateDesign, photos, required, setPhoto, clearPhotos, shotAt }),
    [design, updateDesign, photos, required, setPhoto, clearPhotos, shotAt],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBooth(): BoothState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBooth must be used inside <BoothProvider>');
  return v;
}
