import { useEffect, useMemo, useRef } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { Box3, type Group, type Object3D, Vector3 } from 'three';
import { SkeletonUtils } from 'three-stdlib';

/**
 * The models are authored at their own scale and are not centred on their own
 * origin. This measures one, recentres it, scales it to a known body length and
 * turns it nose-along +Z, so the choreography can work in metres without caring
 * how the asset was exported.
 */
export const useRiggedCreature = (url: string, targetLength: number) => {
  const { scene, animations } = useGLTF(url);

  return useMemo(() => {
    const clone = SkeletonUtils.clone(scene) as Object3D;

    /**
     * These assets carry a scale of 100 on the mesh node, so the box has to be
     * measured after the matrices are resolved. Skipping this returns a
     * near-zero box and the scale factor explodes.
     */
    clone.updateMatrixWorld(true);
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    const centre = new Vector3();
    box.getSize(size);
    box.getCenter(centre);

    const longest = Math.max(size.x, size.y, size.z);
    const scale = longest > 0.001 ? targetLength / longest : 1;
    const noseAlongX = size.x >= size.z;

    return {
      clone,
      animations,
      scale,
      offset: centre.multiplyScalar(-1),
      yaw: noseAlongX ? -Math.PI / 2 : 0,
    };
  }, [scene, animations, targetLength]);
};

export const RiggedBody = ({
  url,
  length,
  timeScale,
  clip = 0,
}: {
  url: string;
  length: number;
  timeScale: number;
  /** Which animation to play, for models that ship several. */
  clip?: number;
}) => {
  const { clone, animations, scale, offset, yaw } = useRiggedCreature(url, length);
  const host = useRef<Group>(null);
  const { actions } = useAnimations(animations, host);

  useEffect(() => {
    const all = Object.values(actions);
    const action = all[clip % Math.max(1, all.length)];
    if (!action) return;
    action.timeScale = timeScale;
    action.reset().play();
    return () => {
      action.stop();
    };
  }, [actions, timeScale, clip]);

  return (
    <group ref={host} scale={scale} rotation={[0, yaw, 0]}>
      <primitive object={clone} position={offset} />
    </group>
  );
};
