import { BufferAttribute, Color, IcosahedronGeometry, Vector3, type BufferGeometry } from 'three';
import { mergeVertices, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { seeded } from '../random';

/** Integer bit mix. A sin-based hash is an order of magnitude slower per call. */
const hash = (x: number, y: number, z: number): number => {
  let h =
    (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const fade = (t: number): number => t * t * (3 - 2 * t);

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Value noise. Smooth in space, so neighbouring vertices move together. */
const noise = (x: number, y: number, z: number): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = fade(x - xi);
  const yf = fade(y - yi);
  const zf = fade(z - zi);

  const c00 = mix(hash(xi, yi, zi), hash(xi + 1, yi, zi), xf);
  const c10 = mix(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), xf);
  const c01 = mix(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), xf);
  const c11 = mix(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), xf);

  return mix(mix(c00, c10, yf), mix(c01, c11, yf), zf) * 2 - 1;
};

const fbm = (x: number, y: number, z: number, octaves: number): number => {
  let sum = 0;
  let amplitude = 1;
  let total = 0;
  let frequency = 1;

  for (let i = 0; i < octaves; i += 1) {
    sum += noise(x * frequency, y * frequency, z * frequency) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }

  return sum / total;
};

interface Facet {
  normal: Vector3;
  offset: number;
}

/** Fracture planes. Granite splits along flats, it does not weather to a blob. */
const facetsFor = (seed: number): Facet[] =>
  Array.from({ length: 7 }, (_, i) => {
    const theta = seeded(seed * 3.7 + i * 5.1) * Math.PI * 2;
    const phi = Math.acos(1 - 2 * seeded(seed * 2.3 + i * 7.9));
    return {
      normal: new Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi) * 0.8,
        Math.sin(phi) * Math.sin(theta),
      ).normalize(),
      offset: 0.6 + seeded(seed * 5.9 + i * 3.3) * 0.3,
    };
  });

const WET = new Color('#3a3733');
const STONE = new Color('#6f6b64');
const BLEACHED = new Color('#96907f');
const LICHEN = new Color('#6d7059');

/**
 * A sea stack: fractal relief for the mass, plane cuts for the fracture faces,
 * fine grain to keep the flats from reading as facets of a low-poly ball.
 */
const cache = new Map<string, BufferGeometry>();

export const createRockGeometry = (seed: number, detail = 3): BufferGeometry => {
  const key = `${seed}:${detail}`;
  const hit = cache.get(key);
  if (hit) return hit;

  /** The icosahedron ships non-indexed, so welding first cuts the noise work sixfold. */
  const geometry = mergeVertices(new IcosahedronGeometry(1, detail));
  const position = geometry.getAttribute('position');
  const facets = facetsFor(seed);
  const squash = 0.78 + seeded(seed * 11.3) * 0.24;
  const stretch = 1 + seeded(seed * 13.7) * 0.35;

  const point = new Vector3();
  const direction = new Vector3();
  const colours = new Float32Array(position.count * 3);
  const tint = new Color();

  for (let i = 0; i < position.count; i += 1) {
    direction.fromBufferAttribute(position, i).normalize();
    const { x, y, z } = direction;

    const warp = fbm(x * 1.6 + seed, y * 1.6 - seed, z * 1.6 + seed * 0.4, 2) * 0.5;
    const relief = fbm(x * 1.3 + warp + seed, y * 1.3 + warp, z * 1.3 + warp - seed, 4);
    point.copy(direction).multiplyScalar(1 + relief * 0.3);

    for (const facet of facets) {
      const over = point.dot(facet.normal) - facet.offset;
      if (over > 0) point.addScaledVector(facet.normal, -over);
    }

    const grain =
      fbm(point.x * 6.4 + seed, point.y * 6.4, point.z * 6.4, 3) * 0.035 +
      fbm(point.x * 15 - seed, point.y * 15, point.z * 15, 2) * 0.014;
    point.addScaledVector(direction, grain);

    point.x *= stretch;
    point.y *= squash;
    /** Undercut at the waterline, where the swell works hardest. */
    point.multiplyScalar(1 - Math.max(0, 0.22 - Math.abs(point.y)) * 0.35);

    position.setXYZ(i, point.x, point.y, point.z);

    const mottle = relief * 0.5 + 0.5;
    const dryness = Math.min(1, Math.max(0, (point.y + 0.25) / 0.7));
    tint
      .copy(WET)
      .lerp(STONE, dryness)
      .lerp(BLEACHED, mottle * dryness * 0.75);
    if (direction.y > 0.25) tint.lerp(LICHEN, (direction.y - 0.25) * mottle * 0.5);

    colours[i * 3] = tint.r;
    colours[i * 3 + 1] = tint.g;
    colours[i * 3 + 2] = tint.b;
  }

  geometry.setAttribute('color', new BufferAttribute(colours, 3));
  position.needsUpdate = true;
  geometry.computeVertexNormals();

  const creased = toCreasedNormals(geometry, 0.7);
  cache.set(key, creased);
  return creased;
};
