import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import {
  AdditiveBlending,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
} from 'three';
import { sceneState } from './sceneState';

const MOON_URL = '/media/photos/moon.jpg';
const GLOW_URL = '/media/photos/moon-glow.png';
const DISTANCE = 340;
const RADIUS = 19;
const SPIN = 0.33;
/** A touch off dead-on at load, so the face is caught mid-turn. */
const START_TURN = -0.78;

useTexture.preload(MOON_URL);
useTexture.preload(GLOW_URL);

/**
 * A moon with a familiar face on it, twice: the texture wraps once per
 * hemisphere so it looks right whichever side is turned toward the boat.
 */
export const Moon = () => {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);
  const haloRef = useRef<Mesh>(null);
  const texture = useTexture(MOON_URL);
  const glow = useTexture(GLOW_URL);

  useFrame(({ camera }) => {
    const group = groupRef.current;
    if (!group) return;

    const alpha = sceneState.moonAlpha;
    group.visible = alpha > 0.02;
    if (!group.visible) return;

    const { moonDir, boatPos, time } = sceneState;
    group.position.copy(moonDir).multiplyScalar(DISTANCE).add(boatPos);

    const body = bodyRef.current;
    if (body) {
      /**
       * Start looking straight at whoever opens the page, then turn slowly.
       * Three maps texture u = 0.5 onto the mesh's +X, which is where the face
       * sits, hence the quarter turn.
       */
      const toCamera = Math.atan2(
        camera.position.x - group.position.x,
        camera.position.z - group.position.z,
      );
      body.rotation.y = toCamera - Math.PI / 2 + START_TURN + time * SPIN;
      const material = body.material as MeshStandardMaterial;
      material.opacity = alpha;
      material.emissiveIntensity = 0.55 + alpha * 0.5;
    }

    const halo = haloRef.current;
    if (halo) {
      halo.quaternion.copy(camera.quaternion);
      (halo.material as MeshBasicMaterial).opacity = alpha * 0.5;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh ref={haloRef}>
        <planeGeometry args={[RADIUS * 4.4, RADIUS * 4.4]} />
        <meshBasicMaterial
          map={glow}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </mesh>
      <mesh ref={bodyRef} rotation={[0, 0, 0.18]}>
        <sphereGeometry args={[RADIUS, 48, 32]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive="#dce9f7"
          emissiveIntensity={0.8}
          roughness={0.92}
          transparent
          opacity={1}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>
    </group>
  );
};
