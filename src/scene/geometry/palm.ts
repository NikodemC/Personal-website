import { CatmullRomCurve3, Vector3, type BufferGeometry } from 'three';
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

/** Sweeps a tapering ring along the trunk curve. */
export const createPalmTrunk = (shape: PalmShape): BufferGeometry => {
  const curve = palmCurve(shape);
  const frames = curve.computeFrenetFrames(24, false);
  const point = new Vector3();

  return buildSurface(24, 10, (u, v, out) => {
    const index = Math.min(24, Math.round(u * 24));
    curve.getPoint(u, point);
    const normal = frames.normals[index];
    const binormal = frames.binormals[index];
    const radius = 0.3 * (1 - u * 0.55) + 0.03 * Math.sin(u * 26);
    const angle = v * Math.PI * 2;
    out
      .copy(point)
      .addScaledVector(normal, Math.cos(angle) * radius)
      .addScaledVector(binormal, Math.sin(angle) * radius);
  });
};

/** One drooping frond, growing along +X from the crown. */
export const createPalmFrond = (length: number): BufferGeometry => {
  const bend = 1.35;
  const halfWidth = length * 0.17;
  const fold = 0.42;

  return buildSurface(18, 8, (u, v, out) => {
    const along = (length * Math.sin(bend * u)) / bend;
    const droop = (-length * (1 - Math.cos(bend * u))) / bend;
    const width = halfWidth * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.55)), 0.8) * (1 - u * 0.2);
    const across = v * 2 - 1;
    out.set(along, droop - fold * across * across * width, across * width);
  });
};

export interface PlantedPalm extends PalmShape {
  angle: number;
  inset: number;
}

export const PALM_COUNT = 26;

export const PALMS: PlantedPalm[] = Array.from({ length: PALM_COUNT }, (_, i) => {
  const angle = (i / PALM_COUNT) * Math.PI * 2 + seeded(i + 5) * 0.5;
  return {
    angle,
    inset: 0.34 + seeded(i + 13) * 0.48,
    height: 9 + seeded(i + 19) * 6.5,
    lean: 1.6 + seeded(i + 23) * 2.8,
    leanAngle: angle + (seeded(i + 29) - 0.5) * 1.8,
    frondCount: 8 + Math.floor(seeded(i + 31) * 3),
    frondLength: 4.2 + seeded(i + 37) * 2,
  };
});
