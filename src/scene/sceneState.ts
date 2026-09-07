import { Vector3 } from 'three';
import type { CameraPreset } from '@/scroll/scrollStore';
import { createPaletteSample } from './palette';

export const CAMERA_PRESETS: CameraPreset[] = [
  'hero',
  'reading',
  'voyage',
  'destination',
  'wide',
  'harbour',
];

export const sceneState = {
  progress: 0,
  routeT: 0,
  tod: 0,
  time: 0,
  intro: 1,
  palette: createPaletteSample(),
  sunDir: new Vector3(0, 1, 0),
  moonDir: new Vector3(0, 1, 0),
  lightDir: new Vector3(0, 1, 0),
  moonAlpha: 1,
  sunAlpha: 0,
  boatPos: new Vector3(0, 0, 40),
  boatYaw: Math.PI / 2,
  camWeights: {
    hero: 1,
    reading: 0,
    voyage: 0,
    destination: 0,
    wide: 0,
    harbour: 0,
  } as Record<CameraPreset, number>,
};

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));
