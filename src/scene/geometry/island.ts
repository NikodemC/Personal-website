import { BufferAttribute, Color, type BufferGeometry } from 'three';
import { buildSurface } from './surface';

export const ISLAND = {
  radius: 42,
  height: 13.5,
  beachLevel: 2.6,
};

const outline = (angle: number): number =>
  1 +
  0.16 * Math.sin(angle * 2.0 + 0.6) +
  0.1 * Math.sin(angle * 3.0 - 1.3) +
  0.05 * Math.sin(angle * 5.0 + 2.1);

const TREELINE = 0.62;
const TREELINE_HEIGHT = 3.4;
const RIM_HEIGHT = -1.8;

/**
 * Bare landform, before any relief is laid over it. Outside the treeline it is
 * an even shallow ramp, which is what makes the sand read as a beach rather
 * than as the last few metres of a hillside.
 */
const dome = (t: number): number => {
  const clamped = Math.min(1, Math.max(0, t));

  if (clamped >= TREELINE) {
    const k = (clamped - TREELINE) / (1 - TREELINE);
    return TREELINE_HEIGHT + k * (RIM_HEIGHT - TREELINE_HEIGHT);
  }

  const inner = clamped / TREELINE;
  const ridge = Math.pow(Math.cos((inner * Math.PI) / 2), 1.5);
  const shoulder = 0.24 * Math.pow(Math.cos((inner * Math.PI) / 2), 4.5);
  return TREELINE_HEIGHT + ((ISLAND.height - TREELINE_HEIGHT) * (ridge + shoulder)) / 1.24;
};

const smooth = (edge0: number, edge1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** Second summit, so the island has a saddle instead of one clean peak. */
const KNOLL = { x: -13, z: 16, spread: 15, rise: 4.6 };

/**
 * Height above the waterline. Driven by world position rather than radius
 * alone, which is what kept the old island a surface of revolution.
 */
const islandHeight = (x: number, z: number, t: number): number => {
  const base = dome(t);
  /** Relief dies away at the shore, leaving the beach smooth. */
  const inland = smooth(1 - TREELINE, 0.7, 1 - t);

  const relief =
    1.0 * Math.sin(x * 0.062 + 0.7) * Math.sin(z * 0.055 - 0.3) +
    0.62 * Math.sin(x * 0.108 - 1.2) * Math.sin(z * 0.121 + 1.9) +
    0.36 * Math.sin(x * 0.221 + 2.3) * Math.sin(z * 0.194 - 0.8) +
    0.19 * Math.sin(x * 0.402 - 0.4) * Math.sin(z * 0.377 + 2.2);

  const dx = x - KNOLL.x;
  const dz = z - KNOLL.z;
  const knoll =
    KNOLL.rise * Math.exp(-(dx * dx + dz * dz) / (KNOLL.spread * KNOLL.spread)) * inland;

  return base + relief * 3.4 * inland + knoll;
};

const SAND = new Color('#e8d7ae');
const SAND_WET = new Color('#b8a37a');
const EARTH = new Color('#7a6242');
const SCRUB = new Color('#5f8f43');
const CANOPY = new Color('#2f6b33');
const DEEP_CANOPY = new Color('#1d4527');

const point = (u: number, v: number): [number, number, number] => {
  const angle = u * Math.PI * 2;
  const radius = v * ISLAND.radius * outline(angle);
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  return [x, islandHeight(x, z, v), z];
};

/** A low sand islet: radius runs along v, bearing along u. */
export const createIslandGeometry = (): BufferGeometry => {
  const geometry = buildSurface(
    112,
    36,
    (u, v, out) => {
      const [x, y, z] = point(u, v);
      out.set(x, y, z);
    },
    true,
  );

  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const colors = new Float32Array(position.count * 3);
  const scratch = new Color();

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    /** Steep ground sheds soil, so it shows earth where the canopy cannot hold. */
    const steep = 1 - Math.min(1, Math.max(0, normal.getY(i)));
    const mottle = 0.5 + 0.5 * Math.sin(x * 0.19 + 1.4) * Math.sin(z * 0.23 - 0.6);

    if (y < ISLAND.beachLevel) {
      scratch.copy(SAND_WET).lerp(SAND, smooth(-1.2, ISLAND.beachLevel, y));
    } else {
      const t = Math.min(1, (y - ISLAND.beachLevel) / (ISLAND.height * 0.34));
      scratch
        .copy(SAND)
        .lerp(SCRUB, Math.pow(t, 0.32))
        .lerp(CANOPY, Math.pow(t, 0.85) * (0.72 + mottle * 0.35))
        .lerp(DEEP_CANOPY, Math.pow(t, 2.2) * 0.7)
        .lerp(EARTH, Math.min(0.72, steep * 1.9));
    }

    colors[i * 3] = scratch.r;
    colors[i * 3 + 1] = scratch.g;
    colors[i * 3 + 2] = scratch.b;
  }

  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  return geometry;
};

/** Where the shore sits for a given bearing, used to place palms and the jetty. */
export const shorePoint = (angle: number, inset: number): [number, number, number] => {
  const v = Math.max(0, Math.min(1, inset));
  const radius = v * ISLAND.radius * outline(angle);
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  return [x, islandHeight(x, z, v), z];
};
