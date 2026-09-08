import { useMemo } from 'react';
import { Glow } from '../Glow';
import { CABIN_AFT, stationSheer, stationZ } from '../geometry/hull';
import { createRopeCoil, mastHead } from '../geometry/rig';
import { ROPE, WHEEL_RADIUS, WHEEL_STATION, WINCH_STATION } from './layout';

export const CockpitFittings = () => {
  const coil = useMemo(() => createRopeCoil(), []);
  const wheelZ = stationZ(WHEEL_STATION);
  const rimY = stationSheer(WHEEL_STATION);

  /** The rim has to clear the cockpit coaming, or the wheel sinks into the deck. */
  const hubY = rimY + WHEEL_RADIUS + 0.16;
  const pedestalTop = hubY - WHEEL_RADIUS * 0.55;
  const pedestalFoot = rimY - 0.58;
  const pedestalHeight = pedestalTop - pedestalFoot;

  return (
    <group>
      <mesh position={[0, pedestalFoot + pedestalHeight / 2, wheelZ]}>
        <cylinderGeometry args={[0.075, 0.13, pedestalHeight, 10]} />
        <meshStandardMaterial color="#cfd5db" roughness={0.35} metalness={0.6} />
      </mesh>

      <group position={[0, hubY, wheelZ]} rotation={[0.14, 0, 0]}>
        <mesh>
          <torusGeometry args={[WHEEL_RADIUS, 0.028, 8, 32]} />
          <meshStandardMaterial color="#b9a887" roughness={0.5} />
        </mesh>
        {[0, 1, 2, 3, 4].map((spoke) => (
          <mesh key={spoke} rotation={[0, 0, (spoke * Math.PI) / 5]}>
            <cylinderGeometry args={[0.016, 0.016, WHEEL_RADIUS * 2, 6]} />
            <meshStandardMaterial color="#b9a887" roughness={0.5} />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.16, 12]} />
          <meshStandardMaterial color="#cfd5db" roughness={0.35} metalness={0.6} />
        </mesh>
      </group>

      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * 0.98, stationSheer(WINCH_STATION) + 0.14, stationZ(WINCH_STATION)]}
          >
            <cylinderGeometry args={[0.11, 0.13, 0.24, 12]} />
            <meshStandardMaterial color="#cfd5db" roughness={0.3} metalness={0.75} />
          </mesh>
          <mesh
            geometry={coil}
            position={[
              side * 1.16,
              stationSheer(WINCH_STATION) + 0.06,
              stationZ(WINCH_STATION) - 0.38,
            ]}
            rotation={[0, side * 0.7, 0]}
          >
            <meshStandardMaterial color={ROPE} roughness={0.86} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, CABIN_AFT.base + 0.19, CABIN_AFT.z - 0.04]}>
        <boxGeometry args={[CABIN_AFT.halfBeam * 0.96, 0.38, 0.08]} />
        <meshStandardMaterial
          color="#2a2018"
          roughness={0.4}
          emissive="#ffb45e"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
};

/**
 * The bow faces local +Z, so an observer aboard has starboard at -X and port
 * at +X: green to starboard, red to port, white at the masthead and the stern.
 */
/** Sidelights, sternlight and masthead, with a halo so each reads from a way off. */
const LAMPS = [
  { at: [0.44, stationSheer(0.9) + 0.16, stationZ(0.9)], body: '#c33', lit: '#ff2a2a', halo: 0.62 },
  {
    at: [-0.44, stationSheer(0.9) + 0.16, stationZ(0.9)],
    body: '#2c9',
    lit: '#28ff70',
    halo: 0.62,
  },
  { at: [0, stationSheer(0.02) + 0.2, stationZ(0.02)], body: '#e8e2d2', lit: '#fff0cf', halo: 0.6 },
  { at: [0, mastHead.y + 0.14, mastHead.z], body: '#f2f0e9', lit: '#ffffff', halo: 0.95 },
] as const;

export const NavigationLights = () => (
  <group>
    {LAMPS.map((lamp, index) => (
      <group key={index} position={lamp.at as unknown as [number, number, number]}>
        <mesh>
          <sphereGeometry args={[index === 3 ? 0.085 : 0.065, 10, 10]} />
          <meshStandardMaterial
            color={lamp.body}
            emissive={lamp.lit}
            emissiveIntensity={index === 3 ? 6 : 4.4}
            toneMapped={false}
          />
        </mesh>
        <Glow color={lamp.lit} radius={lamp.halo} strength={0.85} flicker={0} />
      </group>
    ))}
    <pointLight
      position={[0, mastHead.y + 0.14, mastHead.z]}
      intensity={4}
      distance={18}
      color="#ffffff"
    />
  </group>
);

/**
 * Rigging as thin tubes rather than lines. A line material is unlit, so at dusk
 * the stays stayed bright while every rope beside them went dark.
 */
