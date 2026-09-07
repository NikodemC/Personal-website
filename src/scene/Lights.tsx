import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { AmbientLight, DirectionalLight, HemisphereLight } from 'three';
import { sceneState } from './sceneState';

export const Lights = () => {
  const keyRef = useRef<DirectionalLight>(null);
  const ambientRef = useRef<AmbientLight>(null);
  const hemiRef = useRef<HemisphereLight>(null);

  useFrame(() => {
    const key = keyRef.current;
    const ambient = ambientRef.current;
    const hemi = hemiRef.current;
    const { palette, lightDir, boatPos } = sceneState;

    if (key) {
      key.position.copy(lightDir).multiplyScalar(70).add(boatPos);
      key.target.position.copy(boatPos);
      key.target.updateMatrixWorld();
      key.color.copy(palette.light);
      key.intensity = palette.lightIntensity;
    }
    if (ambient) {
      ambient.color.copy(palette.horizon);
      ambient.intensity = 0.35 + palette.lightGlow * 0.3;
    }
    if (hemi) {
      hemi.color.copy(palette.zenith);
      hemi.groundColor.copy(palette.deep);
      hemi.intensity = 0.5;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} />
      <hemisphereLight ref={hemiRef} />
      <directionalLight ref={keyRef} />
    </>
  );
};
