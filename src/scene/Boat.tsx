import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, DoubleSide, type Group, MathUtils, TubeGeometry, Vector3 } from 'three';
import {
  createCabinGeometry,
  createCockpitEndsGeometry,
  createCockpitGeometry,
  createDeckGeometry,
  createHullGeometry,
  createToeRailGeometry,
  createTransomGeometry,
  stationSheer,
  stationZ,
  WATERLINE_ACROSS,
} from './geometry/hull';
import {
  backstayTop,
  boomClew,
  createRopeCoil,
  boomTack,
  bowFitting,
  forestayTop,
  jibClew,
  jibTack,
  mainHead,
  mastBase,
  mastHead,
  RIG,
  sternFitting,
} from './geometry/rig';
import { createSailGeometry } from './geometry/sail';
import { sceneState } from './sceneState';
import { waveHeight } from './waves';

const HULL_LENGTH = 9.6;
/** Right aft, behind the end of the boom, where a wheel actually goes. */
const WHEEL_STATION = 0.15;
const COMPANIONWAY_STATION = 0.4;

const WHEEL_RADIUS = 0.46;
const WINCH_STATION = 0.34;

/** One rope colour for the whole boat. */
const ROPE = '#c8c2b2';
const ROPE_THICKNESS = 0.013;

/** Where the sheets are cranked in, one winch each side of the cockpit. */
const winchAt = (side: number) =>
  new Vector3(side * 0.98, stationSheer(WINCH_STATION) + 0.2, stationZ(WINCH_STATION));

const CockpitFittings = () => {
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

      <mesh
        position={[
          0,
          stationSheer(COMPANIONWAY_STATION) + 0.24,
          stationZ(COMPANIONWAY_STATION) + 0.1,
        ]}
      >
        <boxGeometry args={[0.72, 0.46, 0.1]} />
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
const NavigationLights = () => (
  <group>
    <mesh position={[0.44, stationSheer(0.9) + 0.16, stationZ(0.9)]}>
      <sphereGeometry args={[0.055, 8, 8]} />
      <meshStandardMaterial color="#8c1f1f" emissive="#ff3a3a" emissiveIntensity={1.6} />
    </mesh>
    <mesh position={[-0.44, stationSheer(0.9) + 0.16, stationZ(0.9)]}>
      <sphereGeometry args={[0.055, 8, 8]} />
      <meshStandardMaterial color="#146b2c" emissive="#33e066" emissiveIntensity={1.6} />
    </mesh>
    <mesh position={[0, stationSheer(0.02) + 0.2, stationZ(0.02)]}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshStandardMaterial color="#d8d2c2" emissive="#fff3d8" emissiveIntensity={1.2} />
    </mesh>
    <mesh position={[0, mastHead.y + 0.14, mastHead.z]}>
      <sphereGeometry args={[0.075, 10, 10]} />
      <meshStandardMaterial color="#e8e6df" emissive="#ffffff" emissiveIntensity={2.2} />
    </mesh>
    <pointLight
      position={[0, mastHead.y + 0.14, mastHead.z]}
      intensity={2.2}
      distance={14}
      color="#ffffff"
    />
  </group>
);

/**
 * Rigging as thin tubes rather than lines. A line material is unlit, so at dusk
 * the stays stayed bright while every rope beside them went dark.
 */
const ropeGeometry = (from: Vector3, to: Vector3, sag = 0) => {
  const mid = new Vector3().addVectors(from, to).multiplyScalar(0.5);
  mid.y -= sag;
  return new TubeGeometry(new CatmullRomCurve3([from, mid, to]), 20, ROPE_THICKNESS, 5, false);
};

export const Boat = () => {
  const groupRef = useRef<Group>(null);
  const rockRef = useRef<Group>(null);

  const geometries = useMemo(() => {
    const topsides = createHullGeometry(WATERLINE_ACROSS, 1);
    const bottom = createHullGeometry(0, WATERLINE_ACROSS + 0.012);
    const deck = createDeckGeometry();
    const cabin = createCabinGeometry();
    const mainsail = createSailGeometry({
      tack: boomTack,
      head: mainHead,
      clew: boomClew,
      camber: 0.46,
      roach: 0.12,
    });
    const jib = createSailGeometry({
      tack: jibTack,
      head: forestayTop,
      clew: jibClew,
      camber: 0.34,
      roach: 0.04,
    });
    const cockpit = createCockpitGeometry();
    const cockpitEnds = createCockpitEndsGeometry();
    const transom = createTransomGeometry();
    const toeRail = createToeRailGeometry();
    const forestay = ropeGeometry(bowFitting, forestayTop);
    const backstay = ropeGeometry(sternFitting, backstayTop);
    /**
     * A working sheet is nearly straight, with just enough slack to read as
     * rope. Measured against the coachroof: this leaves it well clear.
     */
    const sheets = [1, -1].map((side) => ropeGeometry(jibClew, winchAt(side), 0.13));
    return {
      topsides,
      bottom,
      deck,
      cabin,
      cockpit,
      cockpitEnds,
      transom,
      toeRail,
      mainsail,
      jib,
      forestay,
      backstay,
      sheets,
    };
  }, []);

  useFrame(() => {
    const group = groupRef.current;
    const rock = rockRef.current;
    if (!group || !rock) return;

    const { boatPos, boatYaw, time } = sceneState;
    const sin = Math.sin(boatYaw);
    const cos = Math.cos(boatYaw);
    const half = HULL_LENGTH * 0.42;

    const bow = waveHeight(boatPos.x + sin * half, boatPos.z + cos * half, time);
    const stern = waveHeight(boatPos.x - sin * half, boatPos.z - cos * half, time);
    const port = waveHeight(boatPos.x + cos * 1.4, boatPos.z - sin * 1.4, time);
    const starboard = waveHeight(boatPos.x - cos * 1.4, boatPos.z + sin * 1.4, time);

    group.position.set(boatPos.x, (bow + stern) * 0.5 - 0.08, boatPos.z);
    group.rotation.y = boatYaw;

    rock.rotation.x = MathUtils.clamp(Math.atan2(stern - bow, HULL_LENGTH * 0.84), -0.2, 0.2);
    rock.rotation.z =
      MathUtils.clamp(Math.atan2(port - starboard, 2.8), -0.3, 0.3) +
      0.11 +
      Math.sin(time * 0.6) * 0.015;
  });

  return (
    <group ref={groupRef}>
      <group ref={rockRef}>
        <mesh geometry={geometries.topsides} castShadow>
          <meshStandardMaterial
            color="#eeece4"
            roughness={0.28}
            metalness={0.04}
            side={DoubleSide}
          />
        </mesh>
        <mesh geometry={geometries.bottom}>
          <meshStandardMaterial color="#123049" roughness={0.55} side={DoubleSide} />
        </mesh>
        <mesh geometry={geometries.deck}>
          <meshStandardMaterial color="#c9b190" roughness={0.72} side={DoubleSide} />
        </mesh>
        <mesh geometry={geometries.cabin}>
          <meshStandardMaterial color="#e6e2d6" roughness={0.4} side={DoubleSide} />
        </mesh>

        <mesh geometry={geometries.transom}>
          <meshStandardMaterial color="#eeece4" roughness={0.3} side={DoubleSide} />
        </mesh>
        <mesh geometry={geometries.cockpit}>
          <meshStandardMaterial color="#8f7c60" roughness={0.82} side={DoubleSide} />
        </mesh>
        <mesh geometry={geometries.cockpitEnds}>
          <meshStandardMaterial color="#867355" roughness={0.85} side={DoubleSide} />
        </mesh>
        <mesh geometry={geometries.toeRail}>
          <meshStandardMaterial color="#8a6f4c" roughness={0.7} side={DoubleSide} />
        </mesh>

        <mesh position={[0, mastBase.y + RIG.mastHeight / 2, mastBase.z]}>
          <cylinderGeometry args={[0.058, 0.095, RIG.mastHeight, 12]} />
          <meshStandardMaterial color="#d7dbe0" roughness={0.28} metalness={0.72} />
        </mesh>
        <mesh
          position={[0, boomTack.y - 0.03, boomTack.z - RIG.boomLength / 2]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.055, 0.062, RIG.boomLength, 10]} />
          <meshStandardMaterial color="#d7dbe0" roughness={0.3} metalness={0.7} />
        </mesh>

        <mesh geometry={geometries.mainsail}>
          <meshStandardMaterial
            color="#fbf8f0"
            roughness={0.92}
            side={DoubleSide}
            flatShading={false}
          />
        </mesh>
        <mesh geometry={geometries.jib}>
          <meshStandardMaterial color="#f6f2e6" roughness={0.92} side={DoubleSide} />
        </mesh>

        <mesh geometry={geometries.forestay}>
          <meshStandardMaterial color={ROPE} roughness={0.86} />
        </mesh>
        <mesh geometry={geometries.backstay}>
          <meshStandardMaterial color={ROPE} roughness={0.86} />
        </mesh>
        {geometries.sheets.map((sheet, index) => (
          <mesh key={index} geometry={sheet}>
            <meshStandardMaterial color={ROPE} roughness={0.86} />
          </mesh>
        ))}

        <mesh position={[0, -1.35, 0.15]}>
          <boxGeometry args={[0.17, 1.9, 1.55]} />
          <meshStandardMaterial color="#101d2c" roughness={0.6} />
        </mesh>
        <mesh position={[0, -2.24, 0.15]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.24, 1.5, 6, 12]} />
          <meshStandardMaterial color="#0d1826" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, -0.86, -3.1]} rotation={[0.16, 0, 0]}>
          <boxGeometry args={[0.11, 1.5, 0.62]} />
          <meshStandardMaterial color="#101d2c" roughness={0.6} />
        </mesh>

        <CockpitFittings />
        <NavigationLights />
      </group>
    </group>
  );
};
