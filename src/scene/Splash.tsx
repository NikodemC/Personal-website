import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshBasicMaterial,
  Object3D,
} from 'three';
import { seeded } from './random';

export interface SplashState {
  /** Seconds since the impact. */
  time: number;
  /** 0 for nothing, 1 for a full breach landing. */
  strength: number;
}

export const createSplashState = (): SplashState => ({ time: 0, strength: 0 });

const DROPLETS = 260;
const GRAVITY = 11;
const LIFE = 2.6;

/** Ballistic launch vectors, biased outward and low the way real spray throws. */
const LAUNCH = Array.from({ length: DROPLETS }, (_, i) => {
  const angle = seeded(i + 1) * Math.PI * 2;
  const lift = Math.pow(seeded(i + 37), 1.7);
  const out = 4 + seeded(i + 71) * 14;
  return {
    vx: Math.cos(angle) * out,
    vy: 5 + lift * 14,
    vz: Math.sin(angle) * out,
    size: 0.22 + seeded(i + 113) * 0.6,
    life: LIFE * (0.55 + seeded(i + 149) * 0.75),
  };
});

const scratch = new Object3D();

/**
 * Everything here is plain geometry driven from the CPU. A shader version was
 * cheaper but impossible to verify in this environment, and a splash that
 * silently fails to compile is worse than one that costs a few hundred matrix
 * updates a frame.
 */
export const Splash = ({ state }: { state: SplashState }) => {
  const groupRef = useRef<Group>(null);
  const dropletsRef = useRef<InstancedMesh>(null);
  const crownRef = useRef<Mesh>(null);
  const foamRef = useRef<Mesh>(null);

  useEffect(() => {
    const droplets = dropletsRef.current;
    if (droplets) droplets.frustumCulled = false;
  }, []);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const live = state.strength > 0.001 && state.time < LIFE + 0.6;
    group.visible = live;
    if (!live) return;

    const t = state.time;
    const power = state.strength;

    const droplets = dropletsRef.current;
    if (droplets) {
      for (let i = 0; i < DROPLETS; i += 1) {
        const drop = LAUNCH[i];
        const alive = t < drop.life;
        const fade = alive ? 1 - t / drop.life : 0;

        scratch.position.set(
          drop.vx * power * t,
          drop.vy * power * t - GRAVITY * t * t,
          drop.vz * power * t,
        );
        const size = alive ? drop.size * power * (0.5 + fade * 0.9) : 0;
        scratch.scale.setScalar(scratch.position.y < -1.5 ? 0 : size);
        scratch.updateMatrix();
        droplets.setMatrixAt(i, scratch.matrix);
      }
      droplets.instanceMatrix.needsUpdate = true;
      const material = droplets.material as MeshBasicMaterial;
      material.opacity = Math.max(0, 1 - t / LIFE) * 0.9;
    }

    /** The curtain leaps up, then collapses faster than it rose. */
    const crownRise = Math.min(1, t / 0.3);
    const crownFall = Math.max(0, 1 - Math.max(0, t - 0.4) / 1.1);
    const crown = crownRef.current;
    if (crown) {
      const height = Math.max(0.02, power * (4 + crownRise * 11) * crownFall);
      const radius = power * (3.2 + t * 8);
      crown.scale.set(radius, height, radius);
      crown.position.y = height * 0.5;
      (crown.material as MeshBasicMaterial).opacity = crownFall * power * 0.5;
    }

    const foam = foamRef.current;
    if (foam) {
      const spread = power * (8 + t * 17);
      foam.scale.set(spread, spread, spread);
      (foam.material as MeshBasicMaterial).opacity =
        Math.max(0, 1 - t / (LIFE + 0.4)) * power * 0.45;
    }
  });

  return (
    <group ref={groupRef} visible={false} position={[0, 0.6, 0]}>
      <instancedMesh ref={dropletsRef} args={[undefined, undefined, DROPLETS]}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshBasicMaterial
          color={new Color('#f2f8fb')}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </instancedMesh>

      <mesh ref={crownRef}>
        <cylinderGeometry args={[1, 0.68, 1, 28, 1, true]} />
        <meshBasicMaterial
          color={new Color('#eef6fa')}
          transparent
          opacity={0}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      <mesh ref={foamRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[0.45, 1, 40]} />
        <meshBasicMaterial
          color={new Color('#f4fafd')}
          transparent
          opacity={0}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
};
