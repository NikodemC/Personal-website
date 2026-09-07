import type { BufferGeometry } from 'three';
import { Vector3 } from 'three';
import { buildSurface } from './surface';

interface SailOptions {
  /** Tack corner: bottom of the luff. */
  tack: Vector3;
  /** Head corner: top of the luff. */
  head: Vector3;
  /** Clew corner: aft end of the foot. */
  clew: Vector3;
  /** Maximum belly depth, positive to leeward. */
  camber: number;
  /** Extra leech curvature; 0 for a straight leech. */
  roach?: number;
}

const LEEWARD = new Vector3(1, 0, 0);

/**
 * A cambered triangular sail. `u` runs from tack to head along the luff,
 * `v` from luff to leech.
 */
export const createSailGeometry = ({
  tack,
  head,
  clew,
  camber,
  roach = 0,
}: SailOptions): BufferGeometry => {
  const luff = new Vector3().subVectors(head, tack);
  const foot = new Vector3().subVectors(clew, tack);
  const leech = new Vector3().subVectors(head, clew);
  const luffPoint = new Vector3();
  const chord = new Vector3();

  return buildSurface(26, 22, (u, v, out) => {
    luffPoint.copy(tack).addScaledVector(luff, u);
    const roachBulge = roach * Math.sin(Math.PI * Math.pow(u, 0.85));
    chord
      .copy(foot)
      .multiplyScalar(1 - u)
      .addScaledVector(leech, roachBulge);
    out.copy(luffPoint).addScaledVector(chord, v);

    const belly = camber * Math.sin(Math.PI * v) * Math.sin(Math.PI * Math.pow(u, 0.7) * 0.92);
    out.addScaledVector(LEEWARD, belly);
  });
};
