import { BufferAttribute, BufferGeometry, Color, Vector3 } from 'three';
import { seeded } from '../random';

export interface FrondMesh {
  positions: number[];
  colours: number[];
  indices: number[];
}

export const emptyFrondMesh = (): FrondMesh => ({ positions: [], colours: [], indices: [] });

export interface FrondSpec {
  /** Leaflet pairs along the shaft. */
  leaflets: number;
  /** How hard the shaft arches over across its unit length. */
  bend: number;
  leafletLength: number;
  leafletWidth: number;
  /** How far a leaflet sags over its own length. */
  droop: number;
  /** How far a leaflet rakes toward the shaft tip. */
  rake: number;
  rib: number;
  shade: Color;
  tipShade: Color;
  ribShade: Color;
  seed: number;
}

/** Position and local frame of the shaft at u, for a frond of unit length. */
const rachisAt = (bend: number, u: number, out: Vector3): { tx: number; ty: number } => {
  out.set(Math.sin(bend * u) / bend, -(1 - Math.cos(bend * u)) / bend, 0);
  return { tx: Math.cos(bend * u), ty: -Math.sin(bend * u) };
};

const pushLeaflet = (
  mesh: FrondMesh,
  spec: FrondSpec,
  base: Vector3,
  tx: number,
  ty: number,
  side: number,
  length: number,
  width: number,
) => {
  const first = mesh.positions.length / 3;
  /** Perpendicular to the shaft inside the leaf plane: the blade's own up. */
  const nx = -ty;
  const ny = tx;
  const tone = new Color();

  for (let s = 0; s <= 2; s += 1) {
    const k = s / 2;
    const out = length * k;
    const sag = spec.droop * k * k * length;
    const rake = spec.rake * out;
    const half = (width * (1 - k * 0.85)) / 2;

    tone.copy(spec.shade).lerp(spec.tipShade, k * 0.4);

    for (const edge of [-1, 1]) {
      const along = rake + edge * half;
      mesh.positions.push(
        base.x + tx * along - nx * sag,
        base.y + ty * along - ny * sag,
        base.z + side * out,
      );
      mesh.colours.push(tone.r, tone.g, tone.b);
    }
  }

  for (let s = 0; s < 2; s += 1) {
    const a = first + s * 2;
    mesh.indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
};

/** One frond of unit length: a shaft carrying two ranks of leaflets. */
export const addFrond = (mesh: FrondMesh, spec: FrondSpec) => {
  const base = new Vector3();

  for (let i = 1; i <= spec.leaflets; i += 1) {
    const u = i / (spec.leaflets + 1);
    const { tx, ty } = rachisAt(spec.bend, u, base);
    /** Longest a third of the way out, short at the shaft and again at the tip. */
    const profile = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.62)), 0.9);
    const length = spec.leafletLength * profile * (0.85 + seeded(spec.seed + i * 3) * 0.3);
    const width = spec.leafletWidth * profile + spec.leafletWidth * 0.15;

    for (const side of [-1, 1]) {
      pushLeaflet(mesh, spec, base, tx, ty, side, length, width);
    }
  }

  /** The shaft, so the frond does not read as two rows of floating blades. */
  const first = mesh.positions.length / 3;
  const steps = 10;
  const tone = spec.ribShade;

  for (let s = 0; s <= steps; s += 1) {
    const u = s / steps;
    rachisAt(spec.bend, u, base);
    const taper = spec.rib * (1 - u * 0.8);
    for (const edge of [-1, 1]) {
      mesh.positions.push(base.x, base.y, base.z + edge * taper);
      mesh.colours.push(tone.r, tone.g, tone.b);
    }
  }

  for (let s = 0; s < steps; s += 1) {
    const a = first + s * 2;
    mesh.indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
};

/** Rotates the frond written since `from` into place on the rosette. */
export const placeFrond = (
  mesh: FrondMesh,
  from: number,
  reach: number,
  pitch: number,
  spin: number,
) => {
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const cs = Math.cos(spin);
  const ss = Math.sin(spin);

  for (let i = from; i < mesh.positions.length / 3; i += 1) {
    const x = mesh.positions[i * 3] * reach;
    const y = mesh.positions[i * 3 + 1] * reach;
    const z = mesh.positions[i * 3 + 2] * reach;
    const rx = x * cp - y * sp;
    const ry = x * sp + y * cp;
    mesh.positions[i * 3] = rx * cs + z * ss;
    mesh.positions[i * 3 + 1] = ry;
    mesh.positions[i * 3 + 2] = -rx * ss + z * cs;
  }
};

export const toGeometry = (mesh: FrondMesh): BufferGeometry => {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(mesh.positions), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(mesh.colours), 3));
  geometry.setIndex(mesh.indices);
  geometry.computeVertexNormals();
  return geometry;
};
