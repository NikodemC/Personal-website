import type { Vector3 } from 'three';
import { sceneState } from '../sceneState';

/**
 * Each sighting fires once when the scroll crosses its point, then plays out on
 * a real clock. Scrubbing the animation with the scroll would make a leaping
 * dolphin hang in the air.
 */
export interface Sighting {
  id: string;
  kind: 'dolphins' | 'whale' | 'kraken';
  at: number;
  duration: number;
  /** Metres to starboard, negative for port. */
  side: number;
  ahead: number;
  /** Turn off the boat's heading, so the animal can show a broadside. */
  yaw?: number;
  /** Seconds between repeats, for a sighting that plays on a loop. */
  every?: number;
}

export const SIGHTINGS: Sighting[] = [
  { id: 'kraken-night', kind: 'kraken', at: 0.13, duration: 34, side: -78, ahead: 110 },
  { id: 'dolphins-dawn', kind: 'dolphins', at: 0.23, duration: 6.5, side: 11, ahead: 4 },
  /** Same spot on screen as before, pushed out along the camera ray toward the horizon. */
  {
    id: 'whale-landfall',
    kind: 'whale',
    at: 0.93,
    duration: 14,
    side: 9,
    ahead: 172,
    yaw: 2.14,
    every: 15,
  },
  /** Clear of the outcrop the route passes at 0.714. */
  { id: 'dolphins-run', kind: 'dolphins', at: 0.64, duration: 6.5, side: -12, ahead: 2 },
];

/** Where the sighting sits, in world space, relative to the boat when it fires. */
export const anchorFor = (sighting: Sighting, out: Vector3) => {
  const { boatPos, boatYaw } = sceneState;
  const sin = Math.sin(boatYaw);
  const cos = Math.cos(boatYaw);
  out.set(
    boatPos.x + cos * sighting.side + sin * sighting.ahead,
    0,
    boatPos.z - sin * sighting.side + cos * sighting.ahead,
  );
};

export interface ActiveState {
  elapsed: number;
  yaw: number;
  anchor: Vector3;
}
