import { CatmullRomCurve3, TubeGeometry, Vector3, type BufferGeometry } from 'three';
import { HULL, stationSheer, stationZ } from './hull';

const deckAt = (station: number) => new Vector3(0, stationSheer(station) + 0.1, stationZ(station));

export const RIG = {
  mastStation: 0.575,
  mastHeight: 12.4,
  boomLength: 3.9,
  boomHeight: 1.12,
  forestayStation: 0.985,
  forestayHeight: 0.86,
};

export const mastBase = deckAt(RIG.mastStation);
export const mastHead = new Vector3(0, mastBase.y + RIG.mastHeight, mastBase.z);
export const bowFitting = deckAt(RIG.forestayStation);
export const sternFitting = deckAt(0.015);

export const boomTack = new Vector3(0, mastBase.y + RIG.boomHeight, mastBase.z - 0.16);
export const boomClew = new Vector3(0, boomTack.y - 0.06, boomTack.z - RIG.boomLength);

export const mainHead = new Vector3(0, mastHead.y - 0.35, mastHead.z);
export const forestayTop = new Vector3(
  0,
  mastBase.y + RIG.mastHeight * RIG.forestayHeight,
  mastBase.z,
);

export const jibTack = new Vector3(0, bowFitting.y + 0.12, bowFitting.z - 0.12);
export const jibClew = new Vector3(0, boomTack.y - 0.15, mastBase.z + 0.55);

export const backstayTop = new Vector3(0, mastHead.y - 0.1, mastHead.z);

export const HULL_BOUNDS = {
  bowZ: stationZ(1),
  sternZ: stationZ(0),
  beam: HULL.beam,
};

/**
 * The tail of a sheet, flaked down on deck: a flat spiral of two and a bit
 * turns, stacked slightly so it does not read as a printed circle.
 */
export const createRopeCoil = (radius = 0.24, thickness = 0.022): BufferGeometry => {
  const turns = 2.4;
  const samples = 90;
  const points: Vector3[] = [];

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const angle = t * turns * Math.PI * 2;
    const spiral = radius * (1 - t * 0.42) * (1 + Math.sin(angle * 3) * 0.05);
    points.push(
      new Vector3(Math.cos(angle) * spiral, t * thickness * 1.7, Math.sin(angle) * spiral),
    );
  }

  return new TubeGeometry(new CatmullRomCurve3(points), samples, thickness, 6, false);
};
