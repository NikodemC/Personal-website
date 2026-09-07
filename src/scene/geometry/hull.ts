import type { BufferGeometry } from 'three';
import type { Vector3 } from 'three';
import { buildSurface } from './surface';

export const HULL = {
  length: 9.6,
  beam: 3.1,
  draftCanoe: 0.8,
  freeboard: 0.84,
  bowStation: 1,
  sternStation: 0,
};

/** u runs 0 at the transom to 1 at the stem; z is positive forward. */
export const stationZ = (u: number): number => (u - 0.42) * HULL.length;

export const stationHalfBeam = (u: number): number => {
  const taper = Math.pow(Math.max(0, 1 - Math.pow(u, 2.7)), 0.6);
  const sternFill = 0.7 + 0.3 * Math.min(1, u / 0.42);
  return (HULL.beam / 2) * taper * sternFill;
};

const stationDepth = (u: number): number => {
  const shape = 1 - Math.pow(Math.abs(u * 2 - 0.9) / 1.12, 2.6);
  return HULL.draftCanoe * Math.max(0.08, shape);
};

export const stationSheer = (u: number): number =>
  HULL.freeboard * (0.88 + 0.44 * Math.pow(u, 2.5)) + 0.07 * Math.pow(1 - u, 3);

export const deckCrown = (across: number): number => 0.1 * (1 - across * across);

/** Waterline crossing, in the cross-section parameter. */
export const WATERLINE_ACROSS = 0.47;

export const hullPoint = (u: number, across: number, side: number, out: Vector3) => {
  const beam = stationHalfBeam(u);
  const depth = stationDepth(u);
  const sheer = stationSheer(u);
  const theta = (across * Math.PI) / 2;
  out.set(
    side * beam * Math.pow(Math.sin(theta), 0.78),
    -depth + (depth + sheer) * Math.pow(Math.sin(theta * 0.985), 1.85),
    stationZ(u),
  );
};

/**
 * One continuous shell across both sides: v = 0 is the port deck edge,
 * v = 0.5 the keel, v = 1 the starboard deck edge. `from` and `to` clip
 * the band in the cross-section parameter, so topsides and bottom paint
 * can be built as separate meshes.
 */
export const createHullGeometry = (from = 0, to = 1): BufferGeometry =>
  buildSurface(76, 30, (u, v, out) => {
    const side = v < 0.5 ? -1 : 1;
    const across = from + (to - from) * Math.abs(v * 2 - 1);
    hullPoint(u, across, side, out);
  });

export const createDeckGeometry = (): BufferGeometry =>
  buildSurface(72, 16, (u, v, out) => {
    const beam = stationHalfBeam(u);
    const sheer = stationSheer(u);
    const across = v * 2 - 1;
    out.set(beam * across, sheer + deckCrown(across), stationZ(u));
  });

export const createCabinGeometry = (): BufferGeometry => {
  const start = 0.4;
  const end = 0.78;
  const height = 0.56;
  return buildSurface(40, 28, (u, v, out) => {
    const station = start + (end - start) * u;
    const beam = stationHalfBeam(station) * 0.62;
    const base = stationSheer(station) + 0.02;
    const taper = 0.72 + 0.28 * Math.sin(Math.PI * Math.min(1, u * 1.15));
    const side = v < 0.5 ? -1 : 1;
    const across = Math.abs(v * 2 - 1);
    const theta = (across * Math.PI) / 2;
    const roofFall = 1 - Math.pow(Math.cos(theta), 2) * 0.22;
    out.set(
      side * beam * taper * Math.pow(Math.sin(theta), 0.55),
      base + height * roofFall * (1 - Math.pow(Math.sin(theta), 3.2)),
      stationZ(station),
    );
  });
};

/** Recessed cockpit well aft of the cabin. */
export const createCockpitGeometry = (): BufferGeometry => {
  const start = 0.14;
  const end = 0.4;
  const depth = 0.62;
  return buildSurface(28, 24, (u, v, out) => {
    const station = start + (end - start) * u;
    const beam = stationHalfBeam(station) * 0.66;
    const rim = stationSheer(station) + 0.02;
    const side = v < 0.5 ? -1 : 1;
    const across = Math.abs(v * 2 - 1);
    const theta = (across * Math.PI) / 2;
    out.set(
      side * beam * Math.pow(Math.sin(theta), 0.7),
      rim - depth * Math.pow(Math.cos(theta), 0.7),
      stationZ(station),
    );
  });
};

/** Toe rail running the length of the sheer. */
export const createToeRailGeometry = (): BufferGeometry =>
  buildSurface(72, 6, (u, v, out) => {
    const beam = stationHalfBeam(u);
    const sheer = stationSheer(u);
    const side = v < 0.5 ? -1 : 1;
    const up = Math.abs(v * 2 - 1);
    out.set(side * beam * (1 - up * 0.12), sheer + 0.02 + up * 0.11, stationZ(u));
  });

/**
 * Closes the stern. The outer boundary reuses the hull's own stern section,
 * so the cap meets the shell exactly with no seam.
 */
export const createTransomGeometry = (): BufferGeometry => {
  const station = 0;
  const z = stationZ(station);

  return buildSurface(26, 28, (u, v, out) => {
    const side = v < 0.5 ? -1 : 1;
    const across = Math.abs(v * 2 - 1);
    hullPoint(station, across, side, out);
    out.set(out.x * u, out.y, z);
  });
};

/** Vertical faces closing the forward and aft ends of the cockpit well. */
export const createCockpitEndsGeometry = (): BufferGeometry => {
  const aft = 0.14;
  const forward = 0.4;
  const wellDepth = 0.62;

  return buildSurface(24, 20, (u, v, out) => {
    const station = u < 0.5 ? aft : forward;
    const t = u < 0.5 ? u * 2 : (1 - u) * 2;
    const beam = stationHalfBeam(station) * 0.66;
    const rim = stationSheer(station) + 0.02;
    const side = v < 0.5 ? -1 : 1;
    const across = Math.abs(v * 2 - 1);
    const theta = (across * Math.PI) / 2;
    const edgeX = side * beam * Math.pow(Math.sin(theta), 0.7);
    const y = rim - wellDepth * Math.pow(Math.cos(theta), 0.7);
    out.set(edgeX * t, y, stationZ(station));
  });
};
