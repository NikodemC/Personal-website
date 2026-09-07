import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import type { BloomEffect } from 'postprocessing';
import { sceneState } from './sceneState';

export const Effects = () => {
  const bloomRef = useRef<BloomEffect>(null);

  useFrame(() => {
    const bloom = bloomRef.current;
    if (!bloom) return;
    bloom.intensity = 0.3 + sceneState.palette.lightGlow * 0.35;
  });

  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom ref={bloomRef} luminanceThreshold={0.78} luminanceSmoothing={0.3} mipmapBlur />
      <Vignette offset={0.28} darkness={0.55} />
    </EffectComposer>
  );
};
