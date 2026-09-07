import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { FogExp2 } from 'three';
import { sceneState, smoothstep } from './sceneState';

/**
 * Distance haze in the sky's own colour. Without it the island switches on the
 * moment it is allowed to draw; with it, land rises out of the murk the way it
 * actually does at sea.
 */
const DENSITY = 0.0062;

export const SceneFog = () => {
  const fogRef = useRef<FogExp2>(null);

  useFrame(() => {
    const fog = fogRef.current;
    if (!fog) return;
    fog.color.copy(sceneState.palette.fog);

    /**
     * Clear at the open, thick through the crossing so the island can rise out
     * of it, and clear again for landfall.
     */
    const gathering = smoothstep(0.05, 0.3, sceneState.progress);
    const clearing = smoothstep(0.72, 0.93, sceneState.progress);
    fog.density = DENSITY * gathering * (1 - clearing * 0.94);
  });

  return <fogExp2 ref={fogRef} attach="fog" args={['#0b1a33', DENSITY]} />;
};
