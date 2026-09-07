import type { BufferGeometry } from 'three';
import { revolveProfile } from './surface';

/** Float body: bulbous below the waterline, tapering to a collar on top. */
export const createBuoyHull = (): BufferGeometry =>
  revolveProfile(
    [
      [0.001, -1.35],
      [0.34, -1.28],
      [0.6, -1.02],
      [0.72, -0.6],
      [0.74, -0.1],
      [0.72, 0.3],
      [0.6, 0.62],
      [0.42, 0.8],
      [0.34, 0.9],
      [0.001, 0.92],
    ],
    22,
    30,
  );

/** The band that sits at the waterline, painted darker on a real mark. */
export const createBuoyBand = (): BufferGeometry =>
  revolveProfile(
    [
      [0.735, -0.22],
      [0.752, -0.08],
      [0.752, 0.08],
      [0.735, 0.22],
    ],
    22,
    8,
  );

/** Lattice tower carrying the topmark and the lantern. */
export const createBuoyTower = (): BufferGeometry =>
  revolveProfile(
    [
      [0.001, 0.86],
      [0.3, 0.9],
      [0.22, 1.35],
      [0.15, 1.95],
      [0.13, 2.3],
      [0.001, 2.34],
    ],
    14,
    18,
  );
