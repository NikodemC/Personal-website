import { Vector3 } from 'three';
import { stationSheer, stationZ } from '../geometry/hull';

export const HULL_LENGTH = 9.6;
/** Right aft, behind the end of the boom, where a wheel actually goes. */
export const WHEEL_STATION = 0.15;

export const WHEEL_RADIUS = 0.46;
export const WINCH_STATION = 0.34;

/** One paint for the whole shell: topsides, bottom and transom alike. */
export const HULL_PAINT = '#e9e5da';

/** One rope colour for the whole boat. */
export const ROPE = '#c8c2b2';
export const ROPE_THICKNESS = 0.013;

/** Where the sheets are cranked in, one winch each side of the cockpit. */
export const winchAt = (side: number) =>
  new Vector3(side * 0.98, stationSheer(WINCH_STATION) + 0.2, stationZ(WINCH_STATION));
