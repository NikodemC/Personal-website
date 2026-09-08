import { type Group, MathUtils } from 'three';

const SPLASH_LEAD = 0.5;
import { sceneState, smoothstep } from '../sceneState';
import type { SplashState } from '../Splash';
import { waveHeight } from '../waves';
import { POD, TENTACLES } from './pods';
import type { ActiveState } from './sighting';

export const animateDolphins = (group: Group, t: number, state: ActiveState) => {
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

export const animateWhale = (
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

  /** Half a second ahead of the body meeting the water, in seconds not fractions. */
  const entryAt = 0.4 - SPLASH_LEAD / duration;
  if (t >= entryAt) {
    splashState.time = (t - entryAt) * duration;
    splashState.strength = 1;
  } else {
    splashState.strength = 0;
  }
};

export const animateKraken = (group: Group, t: number) => {
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
