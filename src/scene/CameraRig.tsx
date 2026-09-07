import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Vector3 } from 'three';
import type { CameraPreset } from '@/scroll/scrollStore';
import { sceneState, damp } from './sceneState';
import { waveHeight } from './waves';

interface Shot {
  offset: [number, number, number];
  look: [number, number, number];
  fov: number;
}

const SHOTS: Record<CameraPreset, Shot> = {
  hero: { offset: [16, 5.5, 26], look: [0, 5, 0], fov: 46 },
  reading: { offset: [26, 7.5, 16], look: [0, 4.5, 0], fov: 38 },
  voyage: { offset: [-22, 5.5, -19], look: [0, 5.5, 2], fov: 44 },
  destination: { offset: [17, 9, 30], look: [-8, 4.5, -8], fov: 42 },
  wide: { offset: [-6, 11, 46], look: [0, 5, 0], fov: 36 },
  harbour: { offset: [-16, 8, -18], look: [6, 5, 12], fov: 44 },
};

const PRESETS = Object.keys(SHOTS) as CameraPreset[];

export const CameraRig = () => {
  const desired = useRef(new Vector3());
  const target = useRef(new Vector3());
  const current = useRef(new Vector3(9, 4, 24));
  const lookAt = useRef(new Vector3());
  const fov = useRef(52);

  useFrame((state, delta) => {
    const { camera, pointer } = state;
    const dt = Math.min(delta, 0.05);
    const { camWeights, boatPos, boatYaw, time, intro } = sceneState;

    desired.current.set(0, 0, 0);
    target.current.set(0, 0, 0);
    let blendedFov = 0;
    let totalWeight = 0;

    for (const preset of PRESETS) {
      const weight = camWeights[preset];
      if (weight <= 0.0001) continue;
      const shot = SHOTS[preset];
      const sin = Math.sin(boatYaw);
      const cos = Math.cos(boatYaw);
      desired.current.x += (shot.offset[0] * cos + shot.offset[2] * sin) * weight;
      desired.current.y += shot.offset[1] * weight;
      desired.current.z += (-shot.offset[0] * sin + shot.offset[2] * cos) * weight;
      target.current.x += (shot.look[0] * cos + shot.look[2] * sin) * weight;
      target.current.y += shot.look[1] * weight;
      target.current.z += (-shot.look[0] * sin + shot.look[2] * cos) * weight;
      blendedFov += shot.fov * weight;
      totalWeight += weight;
    }

    if (totalWeight > 0.0001) {
      desired.current.divideScalar(totalWeight);
      target.current.divideScalar(totalWeight);
      blendedFov /= totalWeight;
    } else {
      desired.current.set(9, 4, 24);
      target.current.set(0, 2, 0);
      blendedFov = 50;
    }

    desired.current.add(boatPos);
    target.current.add(boatPos);

    const introLift = intro * 26;
    desired.current.y += introLift + Math.sin(time * 0.55) * 0.35;
    desired.current.x += pointer.x * 1.6;
    desired.current.y += pointer.y * 0.8;

    const seaFloorGuard = waveHeight(desired.current.x, desired.current.z, time) + 1.6;
    if (desired.current.y < seaFloorGuard) desired.current.y = seaFloorGuard;

    const lambda = 3.4;
    current.current.x = damp(current.current.x, desired.current.x, lambda, dt);
    current.current.y = damp(current.current.y, desired.current.y, lambda, dt);
    current.current.z = damp(current.current.z, desired.current.z, lambda, dt);
    lookAt.current.x = damp(lookAt.current.x, target.current.x, lambda, dt);
    lookAt.current.y = damp(lookAt.current.y, target.current.y, lambda, dt);
    lookAt.current.z = damp(lookAt.current.z, target.current.z, lambda, dt);

    camera.position.copy(current.current);
    camera.lookAt(lookAt.current);

    if (camera instanceof PerspectiveCamera) {
      fov.current = damp(fov.current, blendedFov + intro * 14, lambda, dt);
      camera.fov = fov.current;
      camera.updateProjectionMatrix();
    }
  });

  return null;
};
