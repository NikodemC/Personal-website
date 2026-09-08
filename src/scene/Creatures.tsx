import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { AdditiveBlending, DoubleSide, type Group, Vector3 } from 'three';
import { animateDolphins, animateKraken, animateWhale } from './creatures/choreography';
import { BLOW, POD, TENTACLES } from './creatures/pods';
import { RiggedBody } from './creatures/RiggedBody';
import { type ActiveState, anchorFor, type Sighting, SIGHTINGS } from './creatures/sighting';
import { sceneState } from './sceneState';
import { createSplashState, Splash } from './Splash';

const DOLPHIN_URL = '/media/models/dolphin.glb';
const WHALE_URL = '/media/models/whale.glb';
const TENTACLE_URL = '/media/models/tentacle.glb';

useGLTF.preload(DOLPHIN_URL);
useGLTF.preload(WHALE_URL);
useGLTF.preload(TENTACLE_URL);

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
      const running = active.current.get(sighting.id);
      if (running) {
        /** A repeating sighting is never off the books, so re-crossing restarts it. */
        if (crossed) running.elapsed = 0;
        continue;
      }

      /** A repeating sighting arms on arrival too, not only on the frame that crosses it. */
      const arrived = sighting.every !== undefined && progress >= sighting.at;
      if (!crossed && !arrived) continue;

      anchorFor(sighting, anchor);
      active.current.set(sighting.id, {
        elapsed: 0,
        yaw: sceneState.boatYaw + (sighting.yaw ?? 0),
        anchor: anchor.clone(),
      });
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
      const period = sighting.every ?? sighting.duration;
      if (state.elapsed > period) {
        /** Loops from the same anchor, so every breach lands where the first did. */
        if (sighting.every && progress >= sighting.at) state.elapsed -= period;
        else {
          active.current.delete(sighting.id);
          continue;
        }
      }

      const t = state.elapsed / sighting.duration;
      if (t > 1) continue;

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
