import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, type Group, IcosahedronGeometry, type PointLight, Vector3 } from 'three';
import { useTexture } from '@react-three/drei';
import { Parrot } from './Birds';
import { Fire } from './Fire';
import { Glow } from './Glow';
import { createChestLid, createChestLidCaps } from './geometry/chest';
import { shorePoint } from './geometry/island';
import { sceneState } from './sceneState';
import { seeded } from './random';

const SHADOW_URL = '/media/photos/ground-shadow.png';

useTexture.preload(SHADOW_URL);

/** Darkens the sand right under a prop, so it sits on the beach instead of hovering. */
const ContactShadow = ({ radius, opacity }: { radius: number; opacity: number }) => {
  const texture = useTexture(SHADOW_URL);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} renderOrder={2}>
      <planeGeometry args={[radius * 2, radius * 2]} />
      <meshBasicMaterial
        map={texture}
        color="#20160c"
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
};

const CHEST = {
  width: 5,
  height: 2.6,
  depth: 3.1,
  lidRadius: 1.55,
  bearing: 1.08,
  inset: 0.76,
};

/** Heaped: thickest in the middle, spilling toward the corners. */
const COINS = Array.from({ length: 110 }, (_, i) => {
  const angle = seeded(i + 61) * Math.PI * 2;
  const spread = Math.pow(seeded(i + 67), 0.55);
  const x = Math.cos(angle) * spread * (CHEST.width - 0.9) * 0.5;
  const z = Math.sin(angle) * spread * (CHEST.depth - 0.9) * 0.5;
  return {
    x,
    z,
    y: (1 - spread) * 0.5 + seeded(i + 71) * 0.16,
    tilt: seeded(i + 79) * Math.PI,
    roll: (seeded(i + 83) - 0.5) * 1.1,
    radius: 0.16 + seeded(i + 89) * 0.14,
    tone: Math.floor(seeded(i + 97) * 3),
  };
});

/** Bars and a couple of shapes with flat faces, to break up all the discs. */
const BARS = Array.from({ length: 7 }, (_, i) => ({
  x: (seeded(i + 101) - 0.5) * (CHEST.width - 1.9),
  z: (seeded(i + 107) - 0.5) * (CHEST.depth - 1.6),
  y: 0.1 + seeded(i + 109) * 0.32,
  turn: seeded(i + 113) * Math.PI,
  tilt: (seeded(i + 127) - 0.5) * 0.7,
  length: 0.5 + seeded(i + 131) * 0.3,
}));

/** Three alloys, so the pile is not one flat yellow. */
const COIN_TONES = [
  { color: '#ffd968', emissive: '#c08a1a' },
  { color: '#f5e0a3', emissive: '#a8842c' },
  { color: '#d99a4e', emissive: '#8a5716' },
];

/** A few gems in among the coins, so the hoard is not one flat yellow. */
const GEMS = Array.from({ length: 9 }, (_, i) => ({
  x: (seeded(i + 131) - 0.5) * (CHEST.width - 1.6),
  z: (seeded(i + 137) - 0.5) * (CHEST.depth - 1.4),
  y: 0.28 + seeded(i + 139) * 0.3,
  size: 0.14 + seeded(i + 149) * 0.1,
  tilt: seeded(i + 151) * Math.PI,
  color: ['#4fd1c5', '#e2467a', '#5b8cf0', '#f2f0ea'][i % 4],
}));

const PERCH_TURN = -2.795;
const IDLE_LOOP = 9;

/** Eases in and out of a punctuated move, so nothing starts or stops abruptly. */
const beat = (t: number, from: number, to: number) => {
  if (t < from || t > to) return 0;
  const local = (t - from) / (to - from);
  return Math.sin(Math.PI * local) ** 1.4;
};

/**
 * One parrot on the chest. Mostly it sits: the point of an idle is the pauses
 * between the moves, not the moves.
 */
const ChestParrot = () => {
  const perchRef = useRef<Group>(null);

  useFrame(() => {
    const perch = perchRef.current;
    if (!perch) return;

    const time = sceneState.time;
    const loop = time % IDLE_LOOP;

    /** Two quick bobs, a long look to one side, then back to watching the fire. */
    const bob = beat(loop, 2.6, 3.0) + beat(loop, 3.15, 3.5);
    const look = beat(loop, 5.4, 7.8);
    const breath = Math.sin(time * 1.1);

    perch.position.y = CHEST.height + 0.95 + breath * 0.02 - bob * 0.09;
    perch.rotation.x = bob * 0.34;
    perch.rotation.y = PERCH_TURN + look * 0.85;
    perch.rotation.z = breath * 0.02 - look * 0.06;
  });

  return (
    <group
      ref={perchRef}
      position={[-CHEST.width * 0.38, CHEST.height + 0.95, CHEST.depth * 0.46]}
      rotation={[0, PERCH_TURN, 0]}
    >
      <Parrot length={2.2} />
    </group>
  );
};

/** A lumpy heap rather than a smooth dome, which read as one solid blob. */
const createHeapGeometry = () => {
  const geometry = new IcosahedronGeometry(Math.min(CHEST.width, CHEST.depth) * 0.46, 3);
  const position = geometry.getAttribute('position');
  const vertex = new Vector3();

  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i);
    const lump =
      0.86 +
      seeded(i + 11) * 0.12 +
      Math.sin(vertex.x * 3.1 + vertex.z * 2.3) * 0.06 +
      Math.sin(vertex.z * 4.7) * 0.04;
    position.setXYZ(i, vertex.x * lump, vertex.y * lump, vertex.z * lump);
  }

  geometry.computeVertexNormals();
  return geometry;
};

const TreasureChest = () => {
  const heap = useMemo(() => createHeapGeometry(), []);
  const lid = useMemo(() => createChestLid(CHEST.width, CHEST.lidRadius), []);
  const lidCaps = useMemo(() => createChestLidCaps(CHEST.width, CHEST.lidRadius), []);

  const [x, y, z] = shorePoint(CHEST.bearing, CHEST.inset);

  useFrame(() => {});

  return (
    <group position={[x, y, z]} rotation={[0, -CHEST.bearing + Math.PI / 2, 0]}>
      <ContactShadow radius={CHEST.width * 0.85} opacity={0.55} />

      <mesh position={[0, CHEST.height / 2, 0]} castShadow>
        <boxGeometry args={[CHEST.width, CHEST.height, CHEST.depth]} />
        <meshStandardMaterial color="#6b4527" roughness={0.88} />
      </mesh>

      {[-1, 0, 1].map((band) => (
        <mesh
          key={`band-${band}`}
          position={[band * (CHEST.width / 2 - 0.55), CHEST.height / 2, 0]}
        >
          <boxGeometry args={[0.24, CHEST.height + 0.06, CHEST.depth + 0.06]} />
          <meshStandardMaterial color="#d9b23a" roughness={0.36} metalness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, CHEST.height - 0.16, 0]}>
        <boxGeometry args={[CHEST.width + 0.08, 0.2, CHEST.depth + 0.08]} />
        <meshStandardMaterial color="#d9b23a" roughness={0.36} metalness={0.35} />
      </mesh>
      <mesh position={[0, CHEST.height * 0.42, CHEST.depth / 2 + 0.04]}>
        <boxGeometry args={[0.5, 0.62, 0.12]} />
        <meshStandardMaterial color="#eec44e" roughness={0.32} metalness={0.35} />
      </mesh>

      <group position={[0, CHEST.height, -CHEST.depth / 2]} rotation={[-2.05, 0, 0]}>
        <mesh geometry={lid} position={[0, 0, CHEST.depth / 2]}>
          <meshStandardMaterial color="#7a4f2c" roughness={0.86} side={DoubleSide} />
        </mesh>
        <mesh geometry={lidCaps} position={[0, 0, CHEST.depth / 2]}>
          <meshStandardMaterial color="#6b4527" roughness={0.88} side={DoubleSide} />
        </mesh>
        <mesh position={[0, CHEST.lidRadius * 0.72, CHEST.depth / 2]}>
          <boxGeometry args={[CHEST.width + 0.06, 0.16, 0.9]} />
          <meshStandardMaterial color="#d9b23a" roughness={0.36} metalness={0.35} />
        </mesh>
      </group>

      {/* The body is a solid box, so the hoard has to mound above its rim. */}
      <group position={[0, CHEST.height - 0.1, 0]}>
        {COINS.map((coin, index) => (
          <mesh
            key={index}
            position={[coin.x, coin.y, coin.z]}
            rotation={[Math.PI / 2 + coin.roll, coin.tilt, 0]}
          >
            <cylinderGeometry args={[coin.radius, coin.radius, 0.05, 12]} />
            <meshStandardMaterial
              color={COIN_TONES[coin.tone].color}
              roughness={0.26 + coin.tone * 0.12}
              metalness={0.3}
              emissive={COIN_TONES[coin.tone].emissive}
              emissiveIntensity={0.55 + coin.tone * 0.12}
            />
          </mesh>
        ))}
        <mesh geometry={heap} position={[0, 0.06, 0]} scale={[1, 0.62, 1]}>
          <meshStandardMaterial
            color="#f7cf55"
            roughness={0.34}
            metalness={0.28}
            emissive="#b8811a"
            emissiveIntensity={0.55}
            flatShading
          />
        </mesh>

        {BARS.map((bar, index) => (
          <mesh
            key={`bar-${index}`}
            position={[bar.x, bar.y, bar.z]}
            rotation={[bar.tilt, bar.turn, bar.tilt * 0.4]}
          >
            <boxGeometry args={[bar.length, 0.14, 0.24]} />
            <meshStandardMaterial
              color="#f2c855"
              roughness={0.28}
              metalness={0.32}
              emissive="#a87c1c"
              emissiveIntensity={0.6}
            />
          </mesh>
        ))}

        {GEMS.map((gem, index) => (
          <mesh
            key={`gem-${index}`}
            position={[gem.x, gem.y, gem.z]}
            rotation={[gem.tilt, gem.tilt * 1.7, 0]}
          >
            <octahedronGeometry args={[gem.size, 0]} />
            <meshStandardMaterial
              color={gem.color}
              roughness={0.15}
              metalness={0.1}
              emissive={gem.color}
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
      </group>

      <ChestParrot />

      <Glow
        color="#ffcf72"
        radius={2.6}
        aspect={2.8}
        strength={0.055}
        flicker={0}
        position={[0, CHEST.height + 0.5, 0]}
      />

      {/* Above the hoard, not inside it: a lamp in the pile reads as embers. */}
      <pointLight
        position={[0, CHEST.height + 1.9, 0]}
        intensity={3.6}
        distance={13}
        color="#ffd98c"
      />
    </group>
  );
};

/** A small fire on the sand, just down the beach from the chest. */
const FIRE = { bearing: 0.97, inset: 0.78 };

const STONES = Array.from({ length: 9 }, (_, i) => {
  const angle = (i / 9) * Math.PI * 2 + seeded(i + 149) * 0.3;
  return {
    x: Math.cos(angle) * (0.92 + seeded(i + 151) * 0.12),
    z: Math.sin(angle) * (0.92 + seeded(i + 157) * 0.12),
    scale: 0.17 + seeded(i + 163) * 0.12,
    tilt: seeded(i + 167) * Math.PI,
  };
});

const Campfire = () => {
  const lightRef = useRef<PointLight>(null);

  const [x, y, z] = shorePoint(FIRE.bearing, FIRE.inset);

  useFrame(() => {
    const { time } = sceneState;

    const flicker = 0.72 + Math.sin(time * 8.3) * 0.14 + Math.sin(time * 3.1) * 0.12;
    if (lightRef.current) lightRef.current.intensity = 11 * flicker;
  });

  return (
    <group position={[x, y, z]}>
      <ContactShadow radius={2.4} opacity={0.42} />

      {STONES.map((stone, index) => (
        <mesh
          key={index}
          position={[stone.x, 0.05, stone.z]}
          rotation={[stone.tilt, stone.tilt * 1.7, 0]}
          scale={[stone.scale, stone.scale * 0.72, stone.scale * 1.15]}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#7d7a72" roughness={0.95} />
        </mesh>
      ))}

      {[0, 1, 2, 3].map((log) => {
        const angle = (log / 4) * Math.PI * 2 + 0.4;
        return (
          <mesh
            key={log}
            position={[Math.cos(angle) * 0.3, 0.42, Math.sin(angle) * 0.3]}
            rotation={[Math.cos(angle) * 0.75, -angle, Math.sin(angle) * 0.75]}
          >
            <cylinderGeometry args={[0.075, 0.1, 1.15, 7]} />
            <meshStandardMaterial color="#4a3625" roughness={0.95} />
          </mesh>
        );
      })}

      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.46, 0.5, 0.1, 14]} />
        <meshStandardMaterial
          color="#3a1f12"
          emissive="#ff6a1f"
          emissiveIntensity={1.5}
          roughness={0.9}
        />
      </mesh>

      <Fire />

      <Glow color="#ff8a34" radius={5.2} strength={0.5} flicker={0.22} position={[0, 1, 0]} />
      <pointLight
        ref={lightRef}
        position={[0, 0.8, 0]}
        intensity={11}
        distance={16}
        color="#ff9540"
      />
    </group>
  );
};

/** What sits on the sand where the boat comes in. */
export const Beach = () => (
  <>
    <TreasureChest />
    <Campfire />
  </>
);
