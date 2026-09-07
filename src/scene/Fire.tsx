import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { AdditiveBlending, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import { seeded } from './random';

const FLAME_URL = '/media/photos/flame.png';

useTexture.preload(FLAME_URL);

/**
 * Layered billboards rather than cones. Real flame has no silhouette of its
 * own; it is a stack of thin, moving sheets, and each one here runs on its own
 * clock so the shape never repeats.
 */
const SHEETS = Array.from({ length: 9 }, (_, i) => ({
  width: 0.5 + seeded(i + 3) * 0.55,
  height: 1.1 + seeded(i + 11) * 1.5,
  offsetX: (seeded(i + 17) - 0.5) * 0.5,
  offsetZ: (seeded(i + 23) - 0.5) * 0.5,
  phase: seeded(i + 31) * Math.PI * 2,
  speed: 2.6 + seeded(i + 37) * 3.4,
  sway: 0.1 + seeded(i + 41) * 0.14,
  /** Inner sheets are pale and short-lived, outer ones deeper and slower. */
  inner: seeded(i + 43),
}));

const EMBERS = Array.from({ length: 16 }, (_, i) => ({
  angle: seeded(i + 53) * Math.PI * 2,
  radius: 0.1 + seeded(i + 59) * 0.3,
  rise: 1.6 + seeded(i + 61) * 2.6,
  life: 1.4 + seeded(i + 67) * 1.8,
  phase: seeded(i + 71) * 3,
  size: 0.025 + seeded(i + 73) * 0.03,
}));

export const Fire = () => {
  const sheetsRef = useRef<Group>(null);
  const embersRef = useRef<Group>(null);
  const texture = useTexture(FLAME_URL);

  const colors = useMemo(
    () => SHEETS.map((sheet) => (sheet.inner > 0.55 ? '#ffe6a8' : '#ff8a2e')),
    [],
  );

  useFrame(({ camera, clock }) => {
    const time = clock.elapsedTime;

    const sheets = sheetsRef.current;
    if (sheets) {
      sheets.children.forEach((sheet, index) => {
        const spec = SHEETS[index];
        const beat = Math.sin(time * spec.speed + spec.phase);
        const wobble = Math.sin(time * spec.speed * 0.43 + spec.phase * 1.7);

        sheet.quaternion.copy(camera.quaternion);
        sheet.position.set(
          spec.offsetX + wobble * spec.sway,
          spec.height * (0.52 + beat * 0.08),
          spec.offsetZ + beat * spec.sway * 0.5,
        );
        sheet.scale.set(1 + beat * 0.12, 1 + beat * 0.22, 1);
        (sheet as Mesh & { material: MeshBasicMaterial }).material.opacity =
          (spec.inner > 0.55 ? 0.5 : 0.36) * (0.75 + beat * 0.25);
      });
    }

    const embers = embersRef.current;
    if (!embers) return;
    embers.children.forEach((ember, index) => {
      const spec = EMBERS[index];
      const t = ((time + spec.phase) % spec.life) / spec.life;
      const drift = Math.sin((time + spec.phase) * 2.2) * 0.25 * t;

      ember.position.set(
        Math.cos(spec.angle) * spec.radius + drift,
        0.35 + t * spec.rise,
        Math.sin(spec.angle) * spec.radius + drift * 0.6,
      );
      const fade = Math.sin(Math.PI * t);
      ember.scale.setScalar(spec.size * (0.5 + fade));
      (ember as Mesh & { material: MeshBasicMaterial }).material.opacity = fade * 0.85;
    });
  });

  return (
    <group>
      <group ref={sheetsRef}>
        {SHEETS.map((sheet, index) => (
          <mesh key={index} renderOrder={4}>
            <planeGeometry args={[sheet.width, sheet.height]} />
            <meshBasicMaterial
              map={texture}
              color={colors[index]}
              transparent
              opacity={0.4}
              depthWrite={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      <group ref={embersRef}>
        {EMBERS.map((_, index) => (
          <mesh key={index} renderOrder={5}>
            <sphereGeometry args={[1, 6, 5]} />
            <meshBasicMaterial
              color="#ffb14a"
              transparent
              opacity={0}
              depthWrite={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};
