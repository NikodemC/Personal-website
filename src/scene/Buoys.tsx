import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, type Group, type Mesh, type MeshStandardMaterial } from 'three';
import { createBuoyBand, createBuoyHull, createBuoyTower } from './geometry/buoy';
import { ROUTE } from './route';
import { sceneState } from './sceneState';
import { waveHeight } from './waves';
import { useScrollStore } from '@/scroll/scrollStore';

const OFFSETS = [5.2, -6, 6.1, -5.1, 5.6];

/**
 * IALA region A lateral marks: port hand is red with a can topmark, starboard
 * is green with a cone. They alternate along the route.
 */
const PORT = { hull: '#a8231f', accent: '#7c1714', light: '#ff5a4d' };
const STARBOARD = { hull: '#177a3c', accent: '#0f5628', light: '#3ce874' };

interface BuoyProps {
  index: number;
  routeT: number;
  offset: number;
}

const Buoy = ({ index, routeT, offset }: BuoyProps) => {
  const groupRef = useRef<Group>(null);
  const lampRef = useRef<Mesh>(null);
  const parts = useMemo(
    () => ({ hull: createBuoyHull(), band: createBuoyBand(), tower: createBuoyTower() }),
    [],
  );

  const isPort = index % 2 === 0;
  const paint = isPort ? PORT : STARBOARD;

  const clamped = Math.min(0.999, Math.max(0, routeT));
  const point = ROUTE.getPointAt(clamped);
  const tangent = ROUTE.getTangentAt(clamped);
  const x = point.x + -tangent.z * offset;
  const z = point.z + tangent.x * offset;

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const { time } = sceneState;
    group.position.y = waveHeight(x, z, time) - 0.18;
    group.rotation.z = Math.sin(time * 0.85 + index) * 0.13;
    group.rotation.x = Math.cos(time * 0.68 + index * 1.7) * 0.11;
    group.rotation.y = time * 0.06 + index;

    const lamp = lampRef.current;
    if (lamp) {
      const flash = Math.sin(time * 1.9 + index * 2.2);
      (lamp.material as MeshStandardMaterial).emissiveIntensity = flash > 0.5 ? 3.4 : 0.25;
    }
  });

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      <mesh geometry={parts.hull}>
        <meshStandardMaterial
          color={paint.hull}
          roughness={0.62}
          metalness={0.12}
          side={DoubleSide}
        />
      </mesh>
      <mesh geometry={parts.band}>
        <meshStandardMaterial color={paint.accent} roughness={0.75} side={DoubleSide} />
      </mesh>
      <mesh geometry={parts.tower}>
        <meshStandardMaterial
          color={paint.hull}
          roughness={0.55}
          metalness={0.2}
          side={DoubleSide}
        />
      </mesh>

      {isPort ? (
        <mesh position={[0, 2.72, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.66, 14]} />
          <meshStandardMaterial color={paint.hull} roughness={0.6} />
        </mesh>
      ) : (
        <mesh position={[0, 2.74, 0]}>
          <coneGeometry args={[0.36, 0.72, 14]} />
          <meshStandardMaterial color={paint.hull} roughness={0.6} />
        </mesh>
      )}

      <mesh position={[0, 2.36, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.1, 12]} />
        <meshStandardMaterial color="#2c3138" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh ref={lampRef} position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial
          color={paint.light}
          emissive={paint.light}
          emissiveIntensity={0.25}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <torusGeometry args={[0.21, 0.016, 6, 14]} />
        <meshStandardMaterial color="#2c3138" roughness={0.5} metalness={0.6} />
      </mesh>

      <mesh position={[0, 0.94, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.028, 6, 12]} />
        <meshStandardMaterial color="#3a3f46" roughness={0.45} metalness={0.7} />
      </mesh>
    </group>
  );
};

export const Buoys = () => {
  const ports = useScrollStore((state) => state.ports);
  const destination = useScrollStore((state) => state.destination);

  if (ports.length === 0 || destination <= 0) return null;

  return (
    <group>
      {ports.slice(0, OFFSETS.length).map((portProgress, index) => (
        <Buoy
          key={index}
          index={index}
          routeT={Math.min(0.999, portProgress / destination)}
          offset={OFFSETS[index]}
        />
      ))}
    </group>
  );
};
