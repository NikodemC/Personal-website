import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { readScrollProgress, useScrollStore } from '@/scroll/scrollStore';
import { samplePalette } from './palette';
import { ROUTE } from './route';
import { sceneState, damp } from './sceneState';
import { sampleVoyage } from './voyage';

const DEG = Math.PI / 180;

/**
 * A fixed bearing rather than the point opposite the sun, which fell behind the
 * camera. This sits high and to the right of the boat in the opening shot.
 */
const MOON_AZIMUTH = 0.2;
const MOON_ELEVATION = 0.3;
const MOON_DIR = new Vector3(
  Math.cos(MOON_ELEVATION) * Math.sin(MOON_AZIMUTH),
  Math.sin(MOON_ELEVATION),
  Math.cos(MOON_ELEVATION) * Math.cos(MOON_AZIMUTH),
).normalize();

const VEIL_MIN = 0.34;
const VEIL_MAX = 0.78;

export const VoyageDriver = () => {
  const point = useRef(new Vector3());
  const tangent = useRef(new Vector3());
  const smoothedProgress = useRef(0);
  const veil = useRef(-1);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const { keyframes } = useScrollStore.getState();
    const progress = readScrollProgress();

    smoothedProgress.current = damp(smoothedProgress.current, progress, 6, dt);
    sceneState.progress = smoothedProgress.current;
    sceneState.time += dt;
    sceneState.intro = damp(sceneState.intro, 0, 1.1, dt);

    const targetTod = sampleVoyage(smoothedProgress.current, keyframes, sceneState.camWeights);
    sceneState.tod = damp(sceneState.tod, targetTod, 5, dt);
    samplePalette(sceneState.tod, sceneState.palette);

    const routeT = Math.min(0.9995, smoothedProgress.current);
    sceneState.routeT = routeT;
    ROUTE.getPointAt(routeT, point.current);
    ROUTE.getTangentAt(routeT, tangent.current);
    sceneState.boatPos.set(point.current.x, 0, point.current.z);
    sceneState.boatYaw = Math.atan2(tangent.current.x, tangent.current.z);

    const elevation = sceneState.palette.sunElevation * DEG;
    const azimuth = -0.85 + sceneState.tod * 2.4;
    sceneState.sunDir.set(
      Math.cos(elevation) * Math.sin(azimuth),
      Math.sin(elevation),
      Math.cos(elevation) * Math.cos(azimuth),
    );
    sceneState.moonDir.copy(MOON_DIR);

    sceneState.sunAlpha = Math.max(0, Math.min(1, (sceneState.sunDir.y + 0.06) * 7));
    sceneState.moonAlpha = 1 - sceneState.sunAlpha;
    sceneState.lightDir
      .copy(sceneState.sunAlpha > 0.35 ? sceneState.sunDir : sceneState.moonDir)
      .normalize();

    const horizon = sceneState.palette.horizon;
    const brightness = horizon.r * 0.2126 + horizon.g * 0.7152 + horizon.b * 0.0722;
    const target = VEIL_MIN + (VEIL_MAX - VEIL_MIN) * Math.min(1, Math.pow(brightness, 0.42));
    if (Math.abs(target - veil.current) > 0.012) {
      veil.current = target;
      document.documentElement.style.setProperty('--veil-strength', target.toFixed(3));
    }
  });

  return null;
};
