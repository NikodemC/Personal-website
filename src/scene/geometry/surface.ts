import { BufferAttribute, BufferGeometry, Vector3 } from 'three';

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

export const mergeMirrored = (geometry: BufferGeometry): BufferGeometry => {
  const mirrored = geometry.clone();
  const position = mirrored.getAttribute('position') as BufferAttribute;
  for (let i = 0; i < position.count; i += 1) {
    position.setX(i, -position.getX(i));
  }
  const index = mirrored.getIndex();
  if (index) {
    const array = index.array as Uint16Array | Uint32Array;
    for (let i = 0; i < array.length; i += 3) {
      const tmp = array[i + 1];
      array[i + 1] = array[i + 2];
      array[i + 2] = tmp;
    }
    index.needsUpdate = true;
  }
  mirrored.computeVertexNormals();
  return mirrored;
};
