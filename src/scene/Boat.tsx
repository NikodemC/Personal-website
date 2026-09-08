import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CatmullRomCurve3,
  DoubleSide,
  type Group,
  MathUtils,
  type MeshStandardMaterial,
  TubeGeometry,
  Vector3,
} from 'three';
import {
  createCabinAftGeometry,
  createCabinGeometry,
  createCockpitEndsGeometry,
  createCockpitGeometry,
  createDeckGeometry,
  createHullGeometry,
  createToeRailGeometry,
  createTransomGeometry,
  WATERLINE_ACROSS,
} from './geometry/hull';
import {
  backstayTop,
  boomClew,
  boomTack,
  bowFitting,
  forestayTop,
  jibClew,
  jibTack,
  mainHead,
  mastBase,
  RIG,
  sternFitting,
} from './geometry/rig';
import { createRailGeometry } from './geometry/rails';
import { createSailGeometry } from './geometry/sail';
import { sceneState } from './sceneState';
import { waveHeight } from './waves';

import { CockpitFittings, NavigationLights } from './boat/Fittings';
import { HULL_LENGTH, HULL_PAINT, ROPE, ROPE_THICKNESS, winchAt } from './boat/layout';

const ropeGeometry = (from: Vector3, to: Vector3, sag = 0) => {
  const mid = new Vector3().addVectors(from, to).multiplyScalar(0.5);
  mid.y -= sag;
  return new TubeGeometry(new CatmullRomCurve3([from, mid, to]), 20, ROPE_THICKNESS, 5, false);
};

export const Boat = () => {
  const groupRef = useRef<Group>(null);
  const rockRef = useRef<Group>(null);
  const clothRef = useRef<MeshStandardMaterial[]>([]);

  const geometries = useMemo(() => {
    const topsides = createHullGeometry(WATERLINE_ACROSS, 1, 44);
    const bottom = createHullGeometry(0, WATERLINE_ACROSS + 0.012);
    const deck = createDeckGeometry();
    const cabin = createCabinGeometry();
    const cabinAft = createCabinAftGeometry();
    const rails = createRailGeometry();
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
      cabinAft,
      rails,
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

    const { boatPos, boatYaw, time, palette } = sceneState;

    /**
     * Sailcloth passes light, so the shadow side is never black. Taking the
     * fill from the sky rather than a fixed colour keeps the sails inside the
     * scene instead of reading as grey slabs cut out of it.
     */
    for (const cloth of clothRef.current) {
      if (!cloth) continue;
      cloth.emissive.copy(palette.horizon);
      cloth.emissiveIntensity = 0.1 + palette.lightGlow * 0.12;
    }

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
            color={HULL_PAINT}
            roughness={0.24}
            metalness={0.05}
            emissive="#e8e4d8"
            emissiveIntensity={0.12}
            side={DoubleSide}
          />
        </mesh>
        <mesh geometry={geometries.bottom}>
          <meshStandardMaterial
            color={HULL_PAINT}
            roughness={0.24}
            metalness={0.05}
            emissive="#e8e4d8"
            emissiveIntensity={0.12}
            side={DoubleSide}
          />
        </mesh>
        <mesh geometry={geometries.deck}>
          <meshStandardMaterial
            vertexColors
            roughness={0.68}
            emissive="#b08b5c"
            emissiveIntensity={0.1}
            side={DoubleSide}
          />
        </mesh>
        <mesh geometry={geometries.cabin}>
          <meshStandardMaterial
            vertexColors
            roughness={0.34}
            emissive="#e6e2d6"
            emissiveIntensity={0.12}
            side={DoubleSide}
          />
        </mesh>
        <mesh geometry={geometries.cabinAft}>
          <meshStandardMaterial
            vertexColors
            roughness={0.34}
            emissive="#e6e2d6"
            emissiveIntensity={0.12}
            side={DoubleSide}
          />
        </mesh>
        <mesh geometry={geometries.rails}>
          <meshStandardMaterial color="#c9ced4" roughness={0.3} metalness={0.65} />
        </mesh>

        <mesh geometry={geometries.transom}>
          <meshStandardMaterial
            color={HULL_PAINT}
            roughness={0.24}
            metalness={0.05}
            emissive="#e8e4d8"
            emissiveIntensity={0.12}
            side={DoubleSide}
          />
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
            ref={(material: MeshStandardMaterial) => {
              clothRef.current[0] = material;
            }}
            vertexColors
            roughness={0.92}
            side={DoubleSide}
            flatShading={false}
          />
        </mesh>
        <mesh geometry={geometries.jib}>
          <meshStandardMaterial
            ref={(material: MeshStandardMaterial) => {
              clothRef.current[1] = material;
            }}
            vertexColors
            roughness={0.92}
            side={DoubleSide}
          />
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
