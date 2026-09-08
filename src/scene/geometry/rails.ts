import {
  CatmullRomCurve3,
  CylinderGeometry,
  Matrix4,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { deckCrown, stationHalfBeam, stationSheer, stationZ } from './hull';

const STANCHIONS = 7;
const FIRST = 0.16;
const LAST = 0.94;
const HEIGHT = 0.62;
const INSET = 0.955;
const POST_RADIUS = 0.022;
const WIRE_RADIUS = 0.012;

/** Where a stanchion foot sits on the deck for a given station. */
const footAt = (station: number, side: number): Vector3 => {
  const across = INSET * side;
  return new Vector3(
    stationHalfBeam(station) * across,
    stationSheer(station) + deckCrown(across),
    stationZ(station),
  );
};

const stationOf = (i: number): number => FIRST + ((LAST - FIRST) * i) / (STANCHIONS - 1);

/**
 * Guard rails: posts along each side deck carrying two wires, plus the pulpit
 * hoop at the stem. More than any single detail, this is what reads as a yacht
 * rather than a hull with a mast on it.
 */
export const createRailGeometry = (): BufferGeometry => {
  const parts: BufferGeometry[] = [];
  const matrix = new Matrix4();

  for (const side of [-1, 1]) {
    for (let i = 0; i < STANCHIONS; i += 1) {
      const foot = footAt(stationOf(i), side);
      const post = new CylinderGeometry(POST_RADIUS * 0.8, POST_RADIUS, HEIGHT, 6);
      matrix.makeTranslation(foot.x, foot.y + HEIGHT / 2, foot.z);
      post.applyMatrix4(matrix);
      parts.push(post);
    }

    /** Upper and lower wire, sagging a touch between the posts. */
    for (const level of [1, 0.55]) {
      const points = Array.from({ length: STANCHIONS }, (_, i) => {
        const foot = footAt(stationOf(i), side);
        return new Vector3(foot.x, foot.y + HEIGHT * level, foot.z);
      });
      parts.push(new TubeGeometry(new CatmullRomCurve3(points), 44, WIRE_RADIUS, 5, false));
    }
  }

  /** The pulpit closes both sets of wires around the stem. */
  for (const level of [1, 0.55]) {
    const bow = Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      const side = 1 - 2 * t;
      const station = LAST + (1 - LAST) * Math.sin(Math.PI * t) * 1.6;
      const foot = footAt(Math.min(0.995, station), side);
      return new Vector3(foot.x, foot.y + HEIGHT * level, foot.z);
    });
    parts.push(new TubeGeometry(new CatmullRomCurve3(bow), 26, WIRE_RADIUS, 5, false));
  }

  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  return merged;
};
