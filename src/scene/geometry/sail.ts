import { Color, Vector3, type BufferGeometry } from 'three';
import { buildSurface, paintSurface } from './surface';

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

const CLOTH = new Color('#fbf8f0');
const SEAM = new Color('#ddd6c6');
const PATCH = new Color('#e4dcc8');
const PANELS = 7;

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

  const geometry = buildSurface(40, 30, (u, v, out) => {
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

  return paintSurface(
    geometry,
    (u, v, out) => {
      out.copy(CLOTH);
      /** Cross-cut panels: seams run from luff to leech, fanning slightly. */
      const across = u + v * 0.16;
      const strip = across * PANELS;
      const seam = Math.abs(strip - Math.floor(strip) - 0.5) * 2;
      out.lerp(SEAM, Math.pow(seam, 9) * 0.8);
      /** Reinforcement patches where the corners take the load. */
      const corner = Math.min(
        1,
        Math.max(
          Math.max(0, 1 - Math.hypot(u, v) * 4.5),
          Math.max(0, 1 - Math.hypot(u, 1 - v) * 4.5),
          Math.max(0, 1 - Math.hypot(1 - u, v) * 4.5),
        ),
      );
      out.lerp(PATCH, corner * 0.85);
    },
    new Color(),
  );
};
