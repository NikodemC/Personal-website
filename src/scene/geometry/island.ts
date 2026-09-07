import { BufferAttribute, Color, type BufferGeometry } from 'three';
import { buildSurface } from './surface';

export const ISLAND = {
  radius: 42,
  height: 13.5,
  beachLevel: 0.9,
};

const outline = (angle: number): number =>
  1 +
  0.16 * Math.sin(angle * 2.0 + 0.6) +
  0.1 * Math.sin(angle * 3.0 - 1.3) +
  0.05 * Math.sin(angle * 5.0 + 2.1);

const profile = (r: number): number => {
  const t = Math.min(1, Math.max(0, r));
  const ridge = Math.pow(Math.cos((t * Math.PI) / 2), 1.55);
  const shoulder = 0.22 * Math.pow(Math.cos((t * Math.PI) / 2), 4.5);
  return ISLAND.height * (ridge + shoulder) - 1.2;
};

const SAND = new Color('#ecdcb6');
const SAND_WET = new Color('#cdb98d');
const SCRUB = new Color('#5f8f43');
const CANOPY = new Color('#2f6b33');
const DEEP_CANOPY = new Color('#1f4f2a');

/** A low sand islet: radius runs along v, bearing along u. */
export const createIslandGeometry = (): BufferGeometry => {
  const geometry = buildSurface(96, 32, (u, v, out) => {
    const angle = u * Math.PI * 2;
    const radius = v * ISLAND.radius * outline(angle);
    out.set(Math.cos(angle) * radius, profile(v), Math.sin(angle) * radius);
  });

  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  const scratch = new Color();

  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    if (y < ISLAND.beachLevel) {
      scratch.copy(SAND_WET).lerp(SAND, Math.min(1, (y + 1.2) / (ISLAND.beachLevel + 1.2)));
    } else {
      const t = Math.min(1, (y - ISLAND.beachLevel) / (ISLAND.height * 0.3));
      scratch
        .copy(SAND)
        .lerp(SCRUB, Math.pow(t, 0.3))
        .lerp(CANOPY, Math.pow(t, 0.85))
        .lerp(DEEP_CANOPY, Math.pow(t, 2.4) * 0.75);
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
  return [Math.cos(angle) * radius, profile(v), Math.sin(angle) * radius];
};
