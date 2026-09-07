import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, type Points, Vector3 } from 'three';
import { sceneState } from './sceneState';
import { waveHeight } from './waves';

const COUNT = 900;
const LIFETIME = 3.4;
const EMIT_INTERVAL = 0.02;

interface WakeBuffers {
  position: BufferAttribute;
  age: BufferAttribute;
  spawn: Vector3;
  cursor: number;
  lastEmit: number;
}

export const Wake = () => {
  const pointsRef = useRef<Points>(null);
  const buffersRef = useRef<WakeBuffers | null>(null);

  useEffect(() => {
    const points = pointsRef.current;
    if (!points) return;

    const position = new BufferAttribute(new Float32Array(COUNT * 3), 3);
    const age = new BufferAttribute(new Float32Array(COUNT).fill(LIFETIME), 1);
    position.setUsage(35048);
    age.setUsage(35048);

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', position);
    geometry.setAttribute('aAge', age);
    points.geometry = geometry;

    buffersRef.current = { position, age, spawn: new Vector3(), cursor: 0, lastEmit: 0 };

    return () => {
      buffersRef.current = null;
      geometry.dispose();
    };
  }, []);

  useFrame((_, delta) => {
    const state = buffersRef.current;
    if (!state) return;

    const positions = state.position.array as Float32Array;
    const ages = state.age.array as Float32Array;
    const { boatPos, boatYaw, time } = sceneState;
    const dt = Math.min(delta, 0.05);

    if (time - state.lastEmit > EMIT_INTERVAL) {
      state.lastEmit = time;
      for (let i = 0; i < 3; i += 1) {
        const side = i === 2 ? 0 : i === 0 ? 1 : -1;
        const spread = 0.75 + Math.random() * 0.9;
        const astern = 5.6 + Math.random() * 1.4;
        state.spawn.set(
          boatPos.x - Math.sin(boatYaw) * astern + Math.cos(boatYaw) * side * spread,
          0,
          boatPos.z - Math.cos(boatYaw) * astern - Math.sin(boatYaw) * side * spread,
        );
        const index = state.cursor;
        positions[index * 3] = state.spawn.x;
        positions[index * 3 + 1] = 0.1;
        positions[index * 3 + 2] = state.spawn.z;
        ages[index] = 0;
        state.cursor = (state.cursor + 1) % COUNT;
      }
    }

    for (let i = 0; i < COUNT; i += 1) {
      if (ages[i] >= LIFETIME) continue;
      ages[i] += dt;
      positions[i * 3 + 1] = waveHeight(positions[i * 3], positions[i * 3 + 2], time) + 0.12;
    }

    state.position.needsUpdate = true;
    state.age.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        uniforms={{ uLifetime: { value: LIFETIME } }}
        vertexShader={
          /* glsl */ `
          attribute float aAge;
          uniform float uLifetime;
          varying float vAlpha;
          void main() {
            float life = clamp(aAge / uLifetime, 0.0, 1.0);
            vAlpha = (1.0 - life) * (1.0 - life);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (2.0 + life * 20.0) * (30.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `
        }
        fragmentShader={
          /* glsl */ `
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            float soft = smoothstep(0.5, 0.05, d);
            gl_FragColor = vec4(vec3(0.86, 0.93, 0.98), vAlpha * soft * 0.28);
          }
        `
        }
      />
    </points>
  );
};
