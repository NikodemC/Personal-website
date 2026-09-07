import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { AdditiveBlending, type Mesh, type MeshBasicMaterial } from 'three';

const GLOW_URL = '/media/photos/glow.png';

useTexture.preload(GLOW_URL);

interface GlowProps {
  color: string;
  radius: number;
  /** Peak opacity, before any flicker. */
  strength: number;
  /** Width relative to height: above 1 spreads the light sideways. */
  aspect?: number;
  /** How hard it pulses, 0 for a steady light. */
  flicker?: number;
  speed?: number;
  position?: [number, number, number];
}

/**
 * A camera-facing pool of light. A coloured sphere reads as a solid dome; this
 * fades radially to nothing, which is what light in air actually does.
 */
export const Glow = ({
  color,
  radius,
  strength,
  aspect = 1,
  flicker = 0,
  speed = 7,
  position = [0, 0, 0],
}: GlowProps) => {
  const meshRef = useRef<Mesh>(null);
  const texture = useTexture(GLOW_URL);

  useFrame(({ camera, clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.quaternion.copy(camera.quaternion);

    if (flicker <= 0) return;
    const time = clock.elapsedTime;
    const pulse =
      1 + (Math.sin(time * speed) * 0.6 + Math.sin(time * speed * 0.37) * 0.4) * flicker;
    (mesh.material as MeshBasicMaterial).opacity = strength * pulse;
    mesh.scale.setScalar(1 + (pulse - 1) * 0.35);
  });

  return (
    <mesh ref={meshRef} position={position} renderOrder={3}>
      <planeGeometry args={[radius * 2 * aspect, radius * 2]} />
      <meshBasicMaterial
        map={texture}
        color={color}
        transparent
        opacity={strength}
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
};
