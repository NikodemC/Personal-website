import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, type MeshStandardMaterial, type Object3D, Vector3 } from 'three';
import { SkeletonUtils } from 'three-stdlib';

const PARROT_URL = '/media/models/parrot.glb';

useGLTF.preload(PARROT_URL);

/**
 * The parrot, measured and recentred so callers can ask for a body length in
 * metres instead of guessing at the asset's own scale.
 */
export const Parrot = ({ length }: { length: number }) => {
  const { scene } = useGLTF(PARROT_URL);

  const model = useMemo(() => {
    const clone = SkeletonUtils.clone(scene) as Object3D;
    clone.updateMatrixWorld(true);

    /** Lifts the plumage out of the dusk without washing the colours out. */
    clone.traverse((child) => {
      const mesh = child as Object3D & { material?: MeshStandardMaterial };
      if (!mesh.material || !('emissive' in mesh.material)) return;
      mesh.material = mesh.material.clone();
      mesh.material.emissive.copy(mesh.material.color);
      mesh.material.emissiveIntensity = 0.32;
    });

    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    const centre = new Vector3();
    box.getSize(size);
    box.getCenter(centre);

    const longest = Math.max(size.x, size.y, size.z);
    return {
      clone,
      fit: longest > 0.001 ? length / longest : 1,
      offset: centre.multiplyScalar(-1),
    };
  }, [scene, length]);

  return (
    <group scale={model.fit}>
      <primitive object={model.clone} position={model.offset} />
    </group>
  );
};
