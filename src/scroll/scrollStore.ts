import { create } from 'zustand';

export type CameraPreset = 'hero' | 'reading' | 'voyage' | 'destination' | 'wide' | 'harbour';

export interface VoyageKeyframe {
  progress: number;
  tod: number;
  cam: CameraPreset;
}

interface ScrollState {
  keyframes: VoyageKeyframe[];
  ports: number[];
  destination: number;
  setLayout: (keyframes: VoyageKeyframe[], ports: number[], destination: number) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
  keyframes: [{ progress: 0, tod: 0, cam: 'hero' }],
  ports: [],
  destination: 1,
  setLayout: (keyframes, ports, destination) => set({ keyframes, ports, destination }),
}));

/**
 * How far down the document we are, 0 to 1. Read straight from the scroll
 * position rather than from Lenis, so anchor jumps and keyboard scrolling move
 * the scene too.
 */
export const readScrollProgress = (): number => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / max));
};
