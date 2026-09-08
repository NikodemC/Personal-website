import { Color, type BufferGeometry } from 'three';
import { addFrond, emptyFrondMesh, placeFrond, toGeometry } from './frond';
import { seeded } from '../random';

const FERN_DEEP = new Color('#2c5326');
const FERN_MID = new Color('#4a7a2f');
const FERN_TIP = new Color('#86a63f');
const FERN_STEM = new Color('#7f8a3c');

/**
 * A fern clump: fronds rising from one crown, arching over as they reach out.
 * Same shaft-and-leaflet construction as a palm frond, at a tenth of the size
 * and with the leaflets packed far closer together.
 */
export const createFernGeometry = (seed: number): BufferGeometry => {
  const mesh = emptyFrondMesh();
  const fronds = 11 + Math.floor(seeded(seed) * 4);

  for (let f = 0; f < fronds; f += 1) {
    const start = mesh.positions.length / 3;
    const age = seeded(seed + f * 7);
    const shade = new Color().copy(FERN_DEEP).lerp(FERN_MID, seeded(seed + f * 11));

    addFrond(mesh, {
      leaflets: 26,
      bend: 1.05,
      leafletLength: 0.13,
      leafletWidth: 0.026,
      droop: 0.12 + age * 0.24,
      /** Raked hard toward the tip, which is what makes a frond read as feathery. */
      rake: 0.55,
      rib: 0.012,
      shade,
      tipShade: FERN_TIP,
      ribShade: new Color().copy(shade).lerp(FERN_STEM, 0.45),
      seed: seed + f * 17,
    });

    placeFrond(
      mesh,
      start,
      0.72 + seeded(seed + f * 29) * 0.34,
      1.3 + age * 0.3,
      (f / fronds) * Math.PI * 2 + seeded(seed + f * 23) * 0.45,
    );
  }

  return toGeometry(mesh);
};
