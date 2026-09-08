import { Color, type BufferGeometry, type Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildSurface, paintSurface } from './surface';

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

const hullPoint = (u: number, across: number, side: number, out: Vector3) => {
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
const TEAK = new Color('#b08b5c');
const TEAK_DARK = new Color('#96744a');
const CAULK = new Color('#3b3128');
const CABIN_SIDE = new Color('#e6e2d6');
const GLASS = new Color('#1d2a33');

const band = (x: number, from: number, to: number, feather: number): number => {
  const inner = Math.min(1, Math.max(0, (x - from) / feather));
  const outer = Math.min(1, Math.max(0, (to - x) / feather));
  return Math.min(inner, outer);
};

/**
 * One band of hull plating, port and starboard built separately. Folding a
 * single sheet across the centreline joins the two sides with a membrane right
 * through the boat, which then catches the sea colour from below.
 */
export const createHullGeometry = (from = 0, to = 1, segments = 30): BufferGeometry => {
  const sides = [-1, 1].map((side) =>
    buildSurface(76, segments, (u, v, out) => {
      hullPoint(u, from + (to - from) * v, side, out);
    }),
  );

  const geometry = mergeGeometries(sides);
  sides.forEach((half) => half.dispose());

  return geometry;
};

const PLANKS = 13;

export const createDeckGeometry = (): BufferGeometry => {
  const geometry = buildSurface(72, 108, (u, v, out) => {
    const beam = stationHalfBeam(u);
    const sheer = stationSheer(u);
    const across = v * 2 - 1;
    out.set(beam * across, sheer + deckCrown(across), stationZ(u));
  });

  return paintSurface(
    geometry,
    (u, v, out) => {
      const across = v * 2 - 1;
      /** Laid fore and aft, with a caulked seam between every pair of planks. */
      /** A plain modulo is signed, which would break the lay across the centreline. */
      const strip = across * PLANKS;
      const seam = Math.abs(strip - Math.floor(strip) - 0.5) * 2;
      const grain = 0.5 + 0.5 * Math.sin(u * 9 + Math.floor(strip) * 2.7);
      out.copy(TEAK).lerp(TEAK_DARK, grain * 0.3);
      out.lerp(CAULK, Math.pow(seam, 22) * 0.8);
      /** A margin plank runs round the outside of the lay. */
      out.lerp(TEAK_DARK, band(Math.abs(across), 0.9, 1, 0.02) * 0.7);
    },
    new Color(),
  );
};

const CABIN = { start: 0.4, end: 0.82, height: 0.56 };
/** Where along the sweep the roof starts turning down to close the front. */
const CABIN_NOSE = 0.66;

export const createCabinGeometry = (): BufferGeometry => {
  const { start, end, height } = CABIN;
  const geometry = buildSurface(40, 44, (u, v, out) => {
    const station = start + (end - start) * u;
    const beam = stationHalfBeam(station) * 0.62;
    const base = stationSheer(station) + 0.02;
    const taper = 0.72 + 0.28 * Math.sin(Math.PI * Math.min(1, u * 1.15));
    const side = v < 0.5 ? -1 : 1;
    const across = Math.abs(v * 2 - 1);
    const theta = (across * Math.PI) / 2;
    const roofFall = 1 - Math.pow(Math.cos(theta), 2) * 0.22;
    /**
     * Over the last stretch the section shrinks on a quarter circle, so the
     * shell rounds down onto the deck and closes itself. A flat plate across
     * the end reads as a shed rather than a coachroof.
     */
    const nose = Math.max(0, (u - CABIN_NOSE) / (1 - CABIN_NOSE));
    const close = Math.sqrt(Math.max(0, 1 - nose * nose));
    out.set(
      side * beam * taper * close * Math.pow(Math.sin(theta), 0.55),
      base + height * close * roofFall * (1 - Math.pow(Math.sin(theta), 3.2)),
      stationZ(station),
    );
  });

  return paintSurface(
    geometry,
    (u, v, out) => {
      const across = Math.abs(v * 2 - 1);
      out.copy(CABIN_SIDE);
      /** Three long portlights a side, set into the coaming below the roof turn. */
      const inSide = band(across, 0.79, 0.95, 0.02);
      const along =
        band(u, 0.1, 0.25, 0.025) + band(u, 0.31, 0.46, 0.025) + band(u, 0.52, 0.64, 0.025);
      out.lerp(GLASS, Math.min(1, inSide * along) * 0.92);
    },
    new Color(),
  );
};

/**
 * Closes the aft end of the coachroof on the same arch the shell has there, so
 * the companionway sits in a bulkhead rather than against an open edge.
 */
export const createCabinAftGeometry = (): BufferGeometry => {
  const station = CABIN.start;
  const beam = stationHalfBeam(station) * 0.62;
  const base = stationSheer(station) + 0.02;
  const taper = 0.72;
  const z = stationZ(station);

  const geometry = buildSurface(16, 40, (u, v, out) => {
    const side = v < 0.5 ? -1 : 1;
    const across = Math.abs(v * 2 - 1);
    const theta = (across * Math.PI) / 2;
    const roofFall = 1 - Math.pow(Math.cos(theta), 2) * 0.22;
    const top = base + CABIN.height * roofFall * (1 - Math.pow(Math.sin(theta), 3.2));
    out.set(
      side * beam * taper * Math.pow(Math.sin(theta), 0.55),
      base + (top - base) * (1 - u),
      z,
    );
  });

  return paintSurface(geometry, (_u, _v, out) => out.copy(CABIN_SIDE), new Color());
};

/** Where the companionway opening sits in that bulkhead. */
export const CABIN_AFT = {
  z: stationZ(CABIN.start),
  base: stationSheer(CABIN.start) + 0.02,
  halfBeam: stationHalfBeam(CABIN.start) * 0.62 * 0.72,
  /** Clear height under the crown, which the roof camber takes off the top. */
  crown: CABIN.height * 0.78,
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
  const beam = stationHalfBeam(station);
  const sheer = stationSheer(station);

  const face = buildSurface(26, 28, (u, v, out) => {
    const side = v < 0.5 ? -1 : 1;
    hullPoint(station, Math.abs(v * 2 - 1), side, out);
    out.set(out.x * u, out.y, z);
  });

  /**
   * The hull section ends level at the sheer while the deck is crowned, which
   * leaves a lens of open air between them right across the stern.
   */
  const crown = buildSurface(24, 3, (u, v, out) => {
    const fx = u * 2 - 1;
    out.set(fx * beam, sheer + deckCrown(fx) * v, z);
  });

  const merged = mergeGeometries([face, crown]);
  face.dispose();
  crown.dispose();

  merged.computeVertexNormals();

  return merged;
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
