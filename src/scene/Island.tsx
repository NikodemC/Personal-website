import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, DoubleSide, type Group, type ShaderMaterial } from 'three';
import { Beach } from './Beach';
import { createIslandGeometry, ISLAND, shorePoint } from './geometry/island';
import { CROWNS, createPalmTrunk, palmCurve, PALMS, type PlantedPalm } from './geometry/palm';
import { HARBOR_CENTER } from './route';
import { Undergrowth } from './Undergrowth';
import { sceneState, smoothstep } from './sceneState';
import { gerstnerGlsl, waveUniforms } from './waves';

/** Four nuts tucked under the crown, rather than one ball on the shaft. */
const NUTS = [
  { x: 0.34, y: -0.28, z: 0.12, r: 0.3 },
  { x: -0.18, y: -0.36, z: 0.3, r: 0.27 },
  { x: -0.3, y: -0.24, z: -0.22, r: 0.29 },
  { x: 0.12, y: -0.46, z: -0.3, r: 0.24 },
];

const Palm = ({ shape, index }: { shape: PlantedPalm; index: number }) => {
  const parts = useMemo(() => {
    const trunk = createPalmTrunk(shape);
    const crown = palmCurve(shape).getPoint(1);
    return { trunk, crown };
  }, [shape]);

  const [x, y, z] = shorePoint(shape.angle, shape.inset);

  return (
    <group position={[x, y, z]}>
      <mesh geometry={parts.trunk}>
        <meshStandardMaterial vertexColors roughness={0.95} />
      </mesh>
      <group position={parts.crown}>
        <mesh
          geometry={CROWNS[index % CROWNS.length]}
          scale={shape.frondLength}
          rotation={[0, index * 1.7, 0]}
        >
          <meshStandardMaterial vertexColors roughness={0.72} side={DoubleSide} />
        </mesh>
        {NUTS.map((nut, i) => (
          <mesh key={i} position={[nut.x, nut.y, nut.z]}>
            <sphereGeometry args={[nut.r, 10, 8]} />
            <meshStandardMaterial color="#6b5334" roughness={0.88} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const lagoonVertex = /* glsl */ `
uniform float uTime;
uniform vec2 uOrigin;
varying vec3 vWorldPos;
varying vec2 vLocal;
${gerstnerGlsl}

void main() {
  vec2 flat2 = position.xy + uOrigin;
  vec3 waveNormal;
  vec3 displaced = gerstner(flat2, uTime, waveNormal);
  vWorldPos = displaced;
  vLocal = position.xy;
  gl_Position = projectionMatrix * viewMatrix * vec4(displaced + vec3(0.0, 0.06, 0.0), 1.0);
}
`;

const lagoonFragment = /* glsl */ `
uniform vec3 uShallow;
uniform float uInner;
uniform float uOuter;
uniform float uOpacity;
varying vec2 vLocal;

void main() {
  float d = length(vLocal);
  float band = 1.0 - smoothstep(uInner, uOuter, d);
  float shore = smoothstep(uInner * 0.62, uInner, d);
  float alpha = band * shore * uOpacity;
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(uShallow, alpha);
  #include <colorspace_fragment>
}
`;

const Lagoon = () => {
  const materialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOrigin: { value: { x: HARBOR_CENTER.x, y: HARBOR_CENTER.z } },
      uWaves: { value: waveUniforms() },
      uShallow: { value: new Color('#63d8cf') },
      uInner: { value: ISLAND.radius * 0.96 },
      uOuter: { value: ISLAND.radius * 1.85 },
      uOpacity: { value: 0.6 },
    }),
    [],
  );

  useFrame(() => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uTime.value = sceneState.time;
    material.uniforms.uOpacity.value = 0.28 + sceneState.palette.lightGlow * 0.42;
  });

  return (
    <mesh position={[0, 0, 0]} frustumCulled={false} renderOrder={1}>
      <planeGeometry args={[ISLAND.radius * 4, ISLAND.radius * 4, 140, 140]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={lagoonVertex}
        fragmentShader={lagoonFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
};

/**
 * Bearing 1.08 rad sits on the shore the camera faces, just to port of the
 * arriving boat; inset 0.76 keeps it up among the palms and clear of the swell.
 */
export const Island = () => {
  const groupRef = useRef<Group>(null);
  const landGeometry = useMemo(() => createIslandGeometry(), []);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const reveal = smoothstep(0.24, 0.92, sceneState.progress);
    group.visible = reveal > 0.01;
    if (!group.visible) return;
  });

  return (
    <group ref={groupRef} position={HARBOR_CENTER}>
      <Lagoon />
      <mesh geometry={landGeometry} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} side={DoubleSide} />
      </mesh>
      <Undergrowth />
      {PALMS.map((shape, index) => (
        <Palm key={index} shape={shape} index={index} />
      ))}
      <Beach />
    </group>
  );
};
