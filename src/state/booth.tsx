import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Photo } from '../lib/capture';
import { DEFAULT_DESIGN, getLayout, type Design } from '../lib/design';

interface BoothState {
  design: Design;
  updateDesign: (patch: Partial<Design>) => void;
  /** one entry per slot in the current layout; null = not shot yet */
  photos: (Photo | null)[];
  setPhoto: (i: number, p: Photo) => void;
  clearPhotos: () => void;
  shotAt: Date;
}

const Ctx = createContext<BoothState | null>(null);
const KEY = 'lilbooth:design';

function loadDesign(): Design {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_DESIGN, ...JSON.parse(raw) };
  } catch {
    /* storage can be unavailable; defaults are fine */
  }
  return DEFAULT_DESIGN;
}

function sized(photos: (Photo | null)[], count: number): (Photo | null)[] {
  return Array.from({ length: count }, (_, i) => photos[i] ?? null);
}

export function BoothProvider({ children }: { children: ReactNode }) {
  const [design, setDesign] = useState<Design>(loadDesign);
  const [photos, setPhotos] = useState<(Photo | null)[]>(() => sized([], getLayout(design.layout).count));
  const [shotAt, setShotAt] = useState(() => new Date());

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(design));
    } catch {
      /* ignore */
    }
  }, [design]);

  const updateDesign = useCallback((patch: Partial<Design>) => {
    setDesign((d) => ({ ...d, ...patch }));
    if (patch.layout) {
      // keep what's been shot; new slots start empty
      const count = getLayout(patch.layout).count;
      setPhotos((p) => (p.length === count ? p : sized(p, count)));
    }
  }, []);

  const setPhoto = useCallback((i: number, p: Photo) => {
    setPhotos((prev) => prev.map((x, j) => (j === i ? p : x)));
    setShotAt(new Date());
  }, []);

  const clearPhotos = useCallback(() => {
    setPhotos((p) => p.map(() => null));
  }, []);

  const value = useMemo(
    () => ({ design, updateDesign, photos, setPhoto, clearPhotos, shotAt }),
    [design, updateDesign, photos, setPhoto, clearPhotos, shotAt],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBooth(): BoothState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBooth must be used inside <BoothProvider>');
  return v;
}
