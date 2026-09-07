import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import {
  AdditiveBlending,
  Box3,
  DoubleSide,
  type Group,
  MathUtils,
  type Object3D,
  Vector3,
} from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { sceneState, smoothstep } from './sceneState';
import { createSplashState, Splash, type SplashState } from './Splash';
import { waveHeight } from './waves';

const DOLPHIN_URL = '/media/models/dolphin.glb';
const WHALE_URL = '/media/models/whale.glb';
const TENTACLE_URL = '/media/models/tentacle.glb';

useGLTF.preload(DOLPHIN_URL);
useGLTF.preload(WHALE_URL);
useGLTF.preload(TENTACLE_URL);

/**
 * Each sighting fires once when the scroll crosses its point, then plays out on
 * a real clock. Scrubbing the animation with the scroll would make a leaping
 * dolphin hang in the air.
 */
interface Sighting {
  id: string;
  kind: 'dolphins' | 'whale' | 'kraken';
  at: number;
  duration: number;
  /** Metres to starboard, negative for port. */
  side: number;
  ahead: number;
  /** Turn off the boat's heading, so the animal can show a broadside. */
  yaw?: number;
}

const SIGHTINGS: Sighting[] = [
  { id: 'kraken-night', kind: 'kraken', at: 0.13, duration: 34, side: -78, ahead: 110 },
  { id: 'dolphins-dawn', kind: 'dolphins', at: 0.23, duration: 6.5, side: 19, ahead: 4 },
  /** Same spot on screen as before, pushed out along the camera ray toward the horizon. */
  { id: 'whale-landfall', kind: 'whale', at: 0.93, duration: 14, side: 9, ahead: 172, yaw: 2.14 },
  { id: 'dolphins-run', kind: 'dolphins', at: 0.71, duration: 6.5, side: -20, ahead: 2 },
];

const POD = [
  { lag: 0, lateral: 0, height: 2.6, span: 15, scale: 1 },
  { lag: 0.5, lateral: -3.4, height: 2.05, span: 13.5, scale: 0.86 },
  { lag: 0.27, lateral: 3.8, height: 2.35, span: 14, scale: 0.93 },
];

/** Arms break the surface in a loose ring, each on its own clip and timing. */
const TENTACLES = [
  { angle: 0.35, reach: 14, height: 34, clip: 1, speed: 0.22, delay: 0 },
  { angle: 1.6, reach: 22, height: 26, clip: 2, speed: 0.15, delay: 0.09 },
  { angle: 2.9, reach: 12, height: 40, clip: 0, speed: 0.19, delay: 0.05 },
  { angle: 4.1, reach: 24, height: 24, clip: 3, speed: 0.13, delay: 0.15 },
  { angle: 5.3, reach: 16, height: 30, clip: 1, speed: 0.17, delay: 0.2 },
];

const BLOW = [
  { lean: -1, radius: 0.5 },
  { lean: 1, radius: 0.46 },
  { lean: 0.1, radius: 0.3 },
];

/** Where the sighting sits, in world space, relative to the boat when it fires. */
const anchorFor = (sighting: Sighting, out: Vector3) => {
  const { boatPos, boatYaw } = sceneState;
  const sin = Math.sin(boatYaw);
  const cos = Math.cos(boatYaw);
  out.set(
    boatPos.x + cos * sighting.side + sin * sighting.ahead,
    0,
    boatPos.z - sin * sighting.side + cos * sighting.ahead,
  );
};

interface ActiveState {
  elapsed: number;
  yaw: number;
  anchor: Vector3;
}

/**
 * The models are authored at their own scale and are not centred on their own
 * origin. This measures one, recentres it, scales it to a known body length and
 * turns it nose-along +Z, so the choreography can work in metres without caring
 * how the asset was exported.
 */
const useRiggedCreature = (url: string, targetLength: number) => {
  const { scene, animations } = useGLTF(url);

  return useMemo(() => {
    const clone = SkeletonUtils.clone(scene) as Object3D;

    /**
     * These assets carry a scale of 100 on the mesh node, so the box has to be
     * measured after the matrices are resolved. Skipping this returns a
     * near-zero box and the scale factor explodes.
     */
    clone.updateMatrixWorld(true);
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    const centre = new Vector3();
    box.getSize(size);
    box.getCenter(centre);

    const longest = Math.max(size.x, size.y, size.z);
    const scale = longest > 0.001 ? targetLength / longest : 1;
    const noseAlongX = size.x >= size.z;

    return {
      clone,
      animations,
      scale,
      offset: centre.multiplyScalar(-1),
      yaw: noseAlongX ? -Math.PI / 2 : 0,
    };
  }, [scene, animations, targetLength]);
};

const RiggedBody = ({
  url,
  length,
  timeScale,
  clip = 0,
}: {
  url: string;
  length: number;
  timeScale: number;
  /** Which animation to play, for models that ship several. */
  clip?: number;
}) => {
  const { clone, animations, scale, offset, yaw } = useRiggedCreature(url, length);
  const host = useRef<Group>(null);
  const { actions } = useAnimations(animations, host);

  useEffect(() => {
    const all = Object.values(actions);
    const action = all[clip % Math.max(1, all.length)];
    if (!action) return;
    action.timeScale = timeScale;
    action.reset().play();
    return () => {
      action.stop();
    };
  }, [actions, timeScale, clip]);

  return (
    <group ref={host} scale={scale} rotation={[0, yaw, 0]}>
      <primitive object={clone} position={offset} />
    </group>
  );
};

const Dolphins = ({ group }: { group: React.RefObject<Group | null> }) => (
  <group ref={group} visible={false}>
    {POD.map((spec, index) => (
      <group key={index} name={`dolphin-${index}`} scale={spec.scale}>
        <RiggedBody url={DOLPHIN_URL} length={3.6} timeScale={1.5 + index * 0.18} />
      </group>
    ))}
  </group>
);

const Whale = ({
  group,
  blow,
}: {
  group: React.RefObject<Group | null>;
  blow: React.RefObject<Group | null>;
}) => (
  <group ref={group} visible={false}>
    <RiggedBody url={WHALE_URL} length={26} timeScale={0.34} />

    <group ref={blow} position={[0, 3.8, 8.4]}>
      {BLOW.map((column, index) => (
        <mesh
          key={index}
          position={[column.lean * 0.35, 1.7, 0]}
          rotation={[0, 0, -column.lean * 0.28]}
        >
          <coneGeometry args={[column.radius, 3.4, 10, 1, true]} />
          <meshBasicMaterial
            color="#e9f3f8"
            transparent
            opacity={0}
            depthWrite={false}
            blending={AdditiveBlending}
            side={DoubleSide}
          />
        </mesh>
      ))}
    </group>
  </group>
);

const Kraken = ({ group }: { group: React.RefObject<Group | null> }) => (
  <group ref={group} visible={false}>
    {TENTACLES.map((arm, index) => (
      <group
        key={index}
        name={`arm-${index}`}
        position={[Math.cos(arm.angle) * arm.reach, 0, Math.sin(arm.angle) * arm.reach]}
        rotation={[0, -arm.angle + Math.PI, 0]}
      >
        <RiggedBody url={TENTACLE_URL} length={arm.height} timeScale={arm.speed} clip={arm.clip} />
      </group>
    ))}
  </group>
);

export const Creatures = () => {
  const dolphinsRef = useRef<Group>(null);
  const whaleRef = useRef<Group>(null);
  const blowRef = useRef<Group>(null);
  const splashRef = useRef<Group>(null);
  const splashState = useMemo(() => createSplashState(), []);
  const krakenRef = useRef<Group>(null);

  const previous = useRef(-1);
  const active = useRef(new Map<string, ActiveState>());
  const anchor = useMemo(() => new Vector3(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const progress = sceneState.progress;
    const last = previous.current < 0 ? progress : previous.current;
    previous.current = progress;

    for (const sighting of SIGHTINGS) {
      const crossed =
        (last < sighting.at && progress >= sighting.at) ||
        (last > sighting.at && progress <= sighting.at);
      if (crossed && !active.current.has(sighting.id)) {
        anchorFor(sighting, anchor);
        active.current.set(sighting.id, {
          elapsed: 0,
          yaw: sceneState.boatYaw + (sighting.yaw ?? 0),
          anchor: anchor.clone(),
        });
      }
    }

    const groups: Record<Sighting['kind'], Group | null> = {
      dolphins: dolphinsRef.current,
      whale: whaleRef.current,
      kraken: krakenRef.current,
    };
    for (const key of Object.keys(groups) as Sighting['kind'][]) {
      const group = groups[key];
      if (group) group.visible = false;
    }

    for (const sighting of SIGHTINGS) {
      const state = active.current.get(sighting.id);
      if (!state) continue;

      state.elapsed += dt;
      if (state.elapsed > sighting.duration) {
        active.current.delete(sighting.id);
        continue;
      }

      const t = state.elapsed / sighting.duration;
      const group = groups[sighting.kind];
      if (!group) continue;

      group.visible = true;
      group.position.copy(state.anchor);
      group.rotation.y = state.yaw;

      if (sighting.kind === 'dolphins') animateDolphins(group, t, state);
      if (sighting.kind === 'whale')
        animateWhale(
          group,
          t,
          blowRef.current,
          splashState,
          sighting.duration,
          splashRef.current,
          state,
        );
      if (sighting.kind === 'kraken') animateKraken(group, t);
    }
  });

  return (
    <>
      <Dolphins group={dolphinsRef} />
      <Whale group={whaleRef} blow={blowRef} />
      <group ref={splashRef}>
        <Splash state={splashState} />
      </group>
      <Kraken group={krakenRef} />
    </>
  );
};

const animateDolphins = (group: Group, t: number, state: ActiveState) => {
  const { time } = sceneState;

  group.children.forEach((dolphin, index) => {
    const spec = POD[index];
    const local = MathUtils.clamp((t * 2.4 - spec.lag) % 1, 0, 1);
    const travel = (t - 0.5) * spec.span;

    const arc = Math.sin(Math.PI * local);
    const airborne = smoothstep(0.06, 0.2, local) * smoothstep(0.06, 0.2, 1 - local);
    const surface = waveHeight(state.anchor.x + spec.lateral, state.anchor.z + travel, time);

    dolphin.position.set(spec.lateral, surface - 0.75 + arc * spec.height * airborne, travel);

    const slope = Math.cos(Math.PI * local) * Math.PI * spec.height * airborne;
    dolphin.rotation.x = -Math.atan2(slope, spec.span) * 0.95;
    dolphin.rotation.z = Math.sin(time * 3 + index) * 0.1;
  });
};

const animateWhale = (
  group: Group,
  t: number,
  blow: Group | null,
  splashState: SplashState,
  duration: number,
  splash: Group | null,
  state: ActiveState,
) => {
  const { time } = sceneState;

  /** Breaches almost as soon as it is sighted, then takes its time in the air. */
  const leap = MathUtils.clamp((t - 0.08) / 0.36, 0, 1);
  const airborne = Math.sin(Math.PI * leap);

  group.position.y = -15 + airborne * 27;
  group.rotation.x = -1.15 * Math.cos(Math.PI * leap);
  group.rotation.z = airborne * 0.42 + Math.sin(time * 0.4) * 0.03;

  if (blow) {
    const blowing = smoothstep(0.005, 0.03, t) * smoothstep(0, 0.04, 0.1 - t);
    blow.children.forEach((column, index) => {
      const material = (column as unknown as { material: { opacity: number } }).material;
      const puff = Math.min(1, blowing * (1 + Math.sin(time * 9 + index) * 0.12));
      material.opacity = puff * 0.34;
      column.scale.set(0.5 + puff * 0.8, 0.35 + puff * 0.85, 0.5 + puff * 0.8);
    });
  }

  /** Water stays level on the surface, so it sits outside the pitching body. */
  if (splash) splash.position.set(state.anchor.x, 0, state.anchor.z);

  const entryAt = 0.4;
  if (t >= entryAt) {
    splashState.time = (t - entryAt) * duration;
    splashState.strength = 1;
  } else {
    splashState.strength = 0;
  }
};

const animateKraken = (group: Group, t: number) => {
  const { time } = sceneState;

  group.children.forEach((arm, index) => {
    const spec = TENTACLES[index];
    const local = MathUtils.clamp((t - spec.delay) / (1 - spec.delay), 0, 1);
    /** Quick to break the surface, slow to withdraw, long time held up. */
    const rise = smoothstep(0, 0.14, local) * smoothstep(0, 0.18, 1 - local);

    /** Sunk below the surface at rest, hauled up as the sighting plays out. */
    arm.position.y = -spec.height * (1.05 - rise * 0.92);
    arm.rotation.z = Math.sin(time * 0.28 + index * 1.3) * 0.09 * rise;
    arm.rotation.x = Math.cos(time * 0.21 + index) * 0.07 * rise;
  });
};
