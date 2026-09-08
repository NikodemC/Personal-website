import { BufferAttribute, CatmullRomCurve3, Color, Vector3, type BufferGeometry } from 'three';
import { addFrond, emptyFrondMesh, placeFrond, toGeometry } from './frond';
import { seeded } from '../random';
import { buildSurface } from './surface';

export interface PalmShape {
  height: number;
  lean: number;
  leanAngle: number;
  frondCount: number;
  frondLength: number;
}

export const palmCurve = ({ height, lean, leanAngle }: PalmShape): CatmullRomCurve3 => {
  const dirX = Math.cos(leanAngle);
  const dirZ = Math.sin(leanAngle);
  return new CatmullRomCurve3([
    new Vector3(0, 0, 0),
    new Vector3(dirX * lean * 0.18, height * 0.32, dirZ * lean * 0.18),
    new Vector3(dirX * lean * 0.58, height * 0.66, dirZ * lean * 0.58),
    new Vector3(dirX * lean, height, dirZ * lean),
  ]);
};

const BARK_DARK = new Color('#5d4a35');
const BARK_LIGHT = new Color('#a08768');
const LEAF_DEEP = new Color('#31552c');
const LEAF_MID = new Color('#54803e');
const LEAF_SUN = new Color('#8fa844');
const LEAF_DRY = new Color('#9c8a43');

/** Sweeps a tapering ring along the trunk curve, banded with old leaf scars. */
export const createPalmTrunk = (shape: PalmShape): BufferGeometry => {
  const curve = palmCurve(shape);
  const frames = curve.computeFrenetFrames(24, false);
  /** Sampled once: buildSurface asks for every vertex, not every ring. */
  const spine = Array.from({ length: 25 }, (_, i) => curve.getPoint(i / 24));

  const geometry = buildSurface(
    24,
    10,
    (u, v, out) => {
      const index = Math.min(24, Math.round(u * 24));
      const point = spine[index];
      const normal = frames.normals[index];
      const binormal = frames.binormals[index];
      /** Flared foot, then a steady taper with the scar rings standing proud. */
      const flare = 1 + Math.pow(1 - u, 3) * 0.55;
      const radius = (0.3 * (1 - u * 0.5) + 0.028 * Math.sin(u * 34)) * flare;
      const angle = v * Math.PI * 2;
      out
        .copy(point)
        .addScaledVector(normal, Math.cos(angle) * radius)
        .addScaledVector(binormal, Math.sin(angle) * radius);
    },
    true,
  );

  const position = geometry.getAttribute('position');
  const colours = new Float32Array(position.count * 3);
  const tint = new Color();
  const top = shape.height;

  for (let i = 0; i < position.count; i += 1) {
    const up = Math.min(1, Math.max(0, position.getY(i) / top));
    const ring = Math.sin(up * 34) * 0.5 + 0.5;
    tint.copy(BARK_DARK).lerp(BARK_LIGHT, up * 0.55 + ring * 0.35);
    colours[i * 3] = tint.r;
    colours[i * 3 + 1] = tint.g;
    colours[i * 3 + 2] = tint.b;
  }

  geometry.setAttribute('color', new BufferAttribute(colours, 3));
  return geometry;
};

/**
 * A whole crown of unit frond length as one buffer. Older fronds hang, younger
 * ones stand up, and merging them keeps a palm to two draw calls instead of ten.
 */
const createPalmCrown = (frondCount: number, seed: number): BufferGeometry => {
  const mesh = emptyFrondMesh();

  for (let f = 0; f < frondCount; f += 1) {
    const start = mesh.positions.length / 3;
    const age = seeded(seed + f * 7);
    const shade = new Color().copy(LEAF_DEEP).lerp(LEAF_MID, seeded(seed + f * 11));

    addFrond(mesh, {
      leaflets: 18,
      bend: 1.35,
      leafletLength: 0.34,
      leafletWidth: 0.052,
      droop: 0.35 + age * 0.9,
      rake: 0.24,
      rib: 0.022,
      shade,
      tipShade: LEAF_SUN,
      ribShade: new Color().copy(shade).lerp(LEAF_DRY, 0.35),
      seed: seed + f * 17,
    });

    /** Old fronds drop below the horizontal, new ones reach above it. */
    placeFrond(
      mesh,
      start,
      0.82 + seeded(seed + f * 29) * 0.36,
      1.05 - age * 1.75,
      (f / frondCount) * Math.PI * 2 + seeded(seed + f * 23) * 0.35,
    );
  }

  return toGeometry(mesh);
};

export interface PlantedPalm extends PalmShape {
  angle: number;
  inset: number;
}

const PALM_COUNT = 26;

/**
 * Crowns are shared rather than built per palm: twenty-six of them cost about
 * ninety milliseconds of blocked main thread at mount, which is enough to make
 * the performance monitor give up on the whole scene.
 */
export const CROWNS = [9, 10, 11, 12, 13].map((count, i) => createPalmCrown(count, i * 47 + 5));

export const PALMS: PlantedPalm[] = Array.from({ length: PALM_COUNT }, (_, i) => {
  const angle = (i / PALM_COUNT) * Math.PI * 2 + seeded(i + 5) * 0.5;
  return {
    angle,
    inset: 0.3 + seeded(i + 13) * 0.44,
    height: 9 + seeded(i + 19) * 6.5,
    lean: 1.6 + seeded(i + 23) * 2.8,
    leanAngle: angle + (seeded(i + 29) - 0.5) * 1.8,
    frondCount: 9 + Math.floor(seeded(i + 31) * 4),
    frondLength: 4.2 + seeded(i + 37) * 2,
  };
});
