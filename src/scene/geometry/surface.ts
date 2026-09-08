import { BufferAttribute, BufferGeometry, type Color, Vector3 } from 'three';

export type SurfacePoint = (u: number, v: number, out: Vector3) => void;

/**
 * Builds an indexed surface from a parametric function sampled on a
 * (segmentsU + 1) x (segmentsV + 1) grid.
 */
/**
 * `wrapU` closes the surface around the u axis by reusing the first column of
 * vertices instead of emitting a duplicate one. Without it, a revolved body
 * gets a hard crease down the seam, because the two coincident columns end up
 * with different averaged normals.
 */
export const buildSurface = (
  segmentsU: number,
  segmentsV: number,
  point: SurfacePoint,
  wrapU = false,
): BufferGeometry => {
  const cols = wrapU ? segmentsU : segmentsU + 1;
  const rows = segmentsV + 1;
  const positions = new Float32Array(cols * rows * 3);
  const uvs = new Float32Array(cols * rows * 2);
  const scratch = new Vector3();

  for (let i = 0; i < cols; i += 1) {
    const u = i / segmentsU;
    for (let j = 0; j < rows; j += 1) {
      const v = j / segmentsV;
      point(u, v, scratch);
      const index = i * rows + j;
      positions[index * 3] = scratch.x;
      positions[index * 3 + 1] = scratch.y;
      positions[index * 3 + 2] = scratch.z;
      uvs[index * 2] = u;
      uvs[index * 2 + 1] = v;
    }
  }

  const indices: number[] = [];
  for (let i = 0; i < segmentsU; i += 1) {
    const next = wrapU ? ((i + 1) % cols) * rows : (i + 1) * rows;
    for (let j = 0; j < segmentsV; j += 1) {
      const a = i * rows + j;
      const b = next + j;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

/**
 * Writes a colour attribute using the surface parameters the geometry was built
 * from, which buildSurface already stores as uvs. Saves recovering u and v from
 * world position, which is ambiguous on a shell folded across both sides.
 */
export const paintSurface = (
  geometry: BufferGeometry,
  paint: (u: number, v: number, out: Color) => void,
  out: Color,
): BufferGeometry => {
  const uv = geometry.getAttribute('uv');
  const colours = new Float32Array(uv.count * 3);

  for (let i = 0; i < uv.count; i += 1) {
    paint(uv.getX(i), uv.getY(i), out);
    colours[i * 3] = out.r;
    colours[i * 3 + 1] = out.g;
    colours[i * 3 + 2] = out.b;
  }

  geometry.setAttribute('color', new BufferAttribute(colours, 3));
  return geometry;
};
