import type { CameraPreset, VoyageKeyframe } from '@/scroll/scrollStore';
import { CAMERA_PRESETS } from './sceneState';

const smooth = (t: number) => t * t * (3 - 2 * t);

export const sampleVoyage = (
  progress: number,
  keyframes: VoyageKeyframe[],
  weights: Record<CameraPreset, number>,
): number => {
  for (const preset of CAMERA_PRESETS) weights[preset] = 0;
  if (keyframes.length === 0) {
    weights.hero = 1;
    return 0;
  }
  if (keyframes.length === 1 || progress <= keyframes[0].progress) {
    weights[keyframes[0].cam] = 1;
    return keyframes[0].tod;
  }
  const last = keyframes[keyframes.length - 1];
  if (progress >= last.progress) {
    weights[last.cam] = 1;
    return last.tod;
  }
  let index = 0;
  while (index < keyframes.length - 2 && progress > keyframes[index + 1].progress) index += 1;
  const a = keyframes[index];
  const b = keyframes[index + 1];
  const span = Math.max(b.progress - a.progress, 1e-4);
  const t = smooth((progress - a.progress) / span);
  weights[a.cam] += 1 - t;
  weights[b.cam] += t;
  return a.tod + (b.tod - a.tod) * t;
};
