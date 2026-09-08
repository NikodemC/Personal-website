import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, DoubleSide, type InstancedMesh, Object3D } from 'three';
import { createFernGeometry } from './geometry/fern';
import { shorePoint } from './geometry/island';
import { PALMS } from './geometry/palm';
import { seeded } from './random';

const VARIANTS = 3;
const FERNS = 84;
const NUTS = 34;

/** Per-clump modulation, not a colour: the fern already carries its own. */
const SHADED = new Color('#93a389');
const PLAIN = new Color('#ffffff');
const SUNBLEACHED = new Color('#d9cd94');

const scratch = new Object3D();
const tint = new Color();

interface Planted {
  variant: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  turn: number;
  shade: number;
}

/** Scattered inland of the beach, in the shade the palms throw. */
const CLUMPS: Planted[] = Array.from({ length: FERNS }, (_, i) => {
  const angle = seeded(i + 3) * Math.PI * 2;
  const inset = 0.24 + seeded(i + 41) * 0.48;
  const [x, y, z] = shorePoint(angle, inset);
  return {
    variant: i % VARIANTS,
    x,
    y,
    z,
    scale: 1.8 + seeded(i + 59) * 1.9,
    turn: seeded(i + 67) * Math.PI * 2,
    shade: seeded(i + 71),
  };
});

/** Windfall, lying where the crown above it drops them. */
const FALLEN = Array.from({ length: NUTS }, (_, i) => {
  const palm = PALMS[(i * 5 + 2) % PALMS.length];
  const angle = seeded(i + 83) * Math.PI * 2;
  const reach = 0.02 + seeded(i + 89) * 0.05;
  const [x, y, z] = shorePoint(palm.angle + (seeded(i + 97) - 0.5) * 0.14, palm.inset + reach);
  const size = 0.3 + seeded(i + 103) * 0.12;
  return { x: x + Math.cos(angle) * 0.6, y: y + size * 0.62, z: z + Math.sin(angle) * 0.6, size };
});

const Ferns = ({ variant }: { variant: number }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => createFernGeometry(variant * 37 + 5), [variant]);
  const planted = useMemo(() => CLUMPS.filter((clump) => clump.variant === variant), [variant]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    planted.forEach((clump, i) => {
      scratch.position.set(clump.x, clump.y, clump.z);
      scratch.rotation.set(0, clump.turn, 0);
      scratch.scale.set(clump.scale, clump.scale, clump.scale);
      scratch.updateMatrix();
      mesh.setMatrixAt(i, scratch.matrix);

      tint
        .copy(SHADED)
        .lerp(PLAIN, clump.shade)
        .lerp(SUNBLEACHED, Math.max(0, clump.shade - 0.72));
      mesh.setColorAt(i, tint);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [planted]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, planted.length]} castShadow>
      <meshStandardMaterial vertexColors roughness={0.82} side={DoubleSide} />
    </instancedMesh>
  );
};

const Coconuts = () => {
  const meshRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    FALLEN.forEach((nut, i) => {
      scratch.position.set(nut.x, nut.y, nut.z);
      scratch.rotation.set(seeded(i + 5) * 3, seeded(i + 9) * 3, 0);
      scratch.scale.setScalar(nut.size);
      scratch.updateMatrix();
      mesh.setMatrixAt(i, scratch.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, NUTS]} castShadow>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial color="#6b5334" roughness={0.9} />
    </instancedMesh>
  );
};

/** Low cover between the palms, so the island is not bare ground under them. */
export const Undergrowth = () => (
  <>
    {Array.from({ length: VARIANTS }, (_, variant) => (
      <Ferns key={variant} variant={variant} />
    ))}
    <Coconuts />
  </>
);
