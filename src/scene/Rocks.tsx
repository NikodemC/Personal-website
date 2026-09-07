import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import { useTexture } from '@react-three/drei';
import { createRockGeometry } from './geometry/rock';
import { seeded } from './random';
import { ROUTE } from './route';
import { sceneState } from './sceneState';
import { waveHeight } from './waves';
import { useScrollStore } from '@/scroll/scrollStore';

const FOAM_URL = '/media/photos/glow.png';

useTexture.preload(FOAM_URL);

/** Close enough to the track that the boat threads between them. */
const OFFSETS = [9.8, -7.5, 7.6, -6.4, 7];

/** One outcrop plus the smaller stacks that broke off it. */
const CLUSTER = [
  { x: 0, z: 0, scale: 1, sink: 0.28 },
  { x: 1.9, z: 1.1, scale: 0.42, sink: 0.24 },
  { x: -1.5, z: 1.7, scale: 0.28, sink: 0.2 },
];

interface OutcropProps {
  index: number;
  routeT: number;
  offset: number;
}

const Outcrop = ({ index, routeT, offset }: OutcropProps) => {
  const foamRef = useRef<Group>(null);
  const foamTexture = useTexture(FOAM_URL);

  const rocks = useMemo(
    () =>
      CLUSTER.map((piece, i) => ({
        ...piece,
        geometry: createRockGeometry(index * 13 + i * 5 + 1),
        turn: seeded(index * 17 + i) * Math.PI * 2,
        lean: (seeded(index * 23 + i) - 0.5) * 0.3,
        size: 1.6 + seeded(index * 29 + i) * 0.9,
      })),
    [index],
  );

  const clamped = Math.min(0.999, Math.max(0, routeT));
  const point = ROUTE.getPointAt(clamped);
  const tangent = ROUTE.getTangentAt(clamped);
  const x = point.x + -tangent.z * offset;
  const z = point.z + tangent.x * offset;

  useFrame(() => {
    const foam = foamRef.current;
    if (!foam) return;
    const { time } = sceneState;

    /** The swell washing round the base, rather than the rock bobbing. */
    foam.children.forEach((ring, i) => {
      const surge = Math.sin(time * 1.1 + i * 1.7 + index) * 0.5 + 0.5;
      ring.position.y = waveHeight(x + CLUSTER[i].x, z + CLUSTER[i].z, time) + 0.06;
      ring.scale.setScalar(0.9 + surge * 0.22);
      (ring as Mesh & { material: MeshBasicMaterial }).material.opacity = 0.16 + surge * 0.22;
    });
  });

  return (
    <group position={[x, 0, z]}>
      {rocks.map((rock, i) => (
        <mesh
          key={i}
          geometry={rock.geometry}
          position={[rock.x, -rock.size * rock.sink, rock.z]}
          rotation={[rock.lean, rock.turn, rock.lean * 0.6]}
          scale={rock.size * rock.scale}
        >
          <meshStandardMaterial vertexColors roughness={0.93} />
        </mesh>
      ))}

      <group ref={foamRef}>
        {CLUSTER.map((piece, i) => (
          <mesh key={i} position={[piece.x, 0, piece.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry
              args={[rocks[i].size * rocks[i].scale * 3.2, rocks[i].size * rocks[i].scale * 3.2]}
            />
            <meshBasicMaterial
              map={foamTexture}
              color="#dfe9ee"
              transparent
              opacity={0.18}
              depthWrite={false}
              side={DoubleSide}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/** Rocks standing out of the water along the passage, in place of channel marks. */
export const Rocks = () => {
  const ports = useScrollStore((state) => state.ports);
  const destination = useScrollStore((state) => state.destination);

  if (ports.length === 0 || destination <= 0) return null;

  return (
    <group>
      {ports.slice(0, OFFSETS.length).map((portProgress, index) => (
        <Outcrop
          key={index}
          index={index}
          routeT={Math.min(0.999, portProgress / destination)}
          offset={OFFSETS[index]}
        />
      ))}
    </group>
  );
};
