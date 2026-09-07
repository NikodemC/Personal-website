import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, type Mesh, type ShaderMaterial, Vector2, Vector3 } from 'three';
import { sceneState } from './sceneState';
import { gerstnerGlsl, waveUniforms } from './waves';

const vertexShader = /* glsl */ `
uniform float uTime;
uniform vec2 uOrigin;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vFoam;
${gerstnerGlsl}

void main() {
  vec2 flat2 = position.xy + uOrigin;
  vec3 waveNormal;
  vec3 displaced = gerstner(flat2, uTime, waveNormal);
  vNormal = waveNormal;
  vWorldPos = displaced;
  vFoam = smoothstep(0.55, 1.15, displaced.y);
  gl_Position = projectionMatrix * viewMatrix * vec4(displaced, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uSky;
uniform vec3 uLightColor;
uniform vec3 uLightDir;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uGlow;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vFoam;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);

  float facing = max(dot(normal, normalize(uLightDir)), 0.0);
  vec3 water = mix(uDeep, uShallow, facing * 0.55 + fresnel * 0.35);
  water = mix(water, uSky, fresnel * 0.5);

  vec3 halfVec = normalize(normalize(uLightDir) + viewDir);
  float spec = pow(max(dot(normal, halfVec), 0.0), 220.0);
  water += uLightColor * spec * 2.4 * uGlow;

  vec3 sunOnWater = normalize(vec3(uLightDir.x, 0.0, uLightDir.z));
  vec3 toPoint = normalize(vec3(vWorldPos.x, 0.0, vWorldPos.z) - vec3(cameraPosition.x, 0.0, cameraPosition.z));
  float path = pow(max(dot(toPoint, -sunOnWater), 0.0), 34.0);
  water += uLightColor * path * fresnel * 1.2 * uGlow;

  water = mix(water, vec3(0.92, 0.95, 0.97), vFoam * 0.22);

  float dist = length(vWorldPos - cameraPosition);
  float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
  vec3 color = mix(water, uFogColor, clamp(fog, 0.0, 1.0));

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

export const Ocean = () => {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOrigin: { value: new Vector2() },
      uWaves: { value: waveUniforms() },
      uDeep: { value: new Color('#04101f') },
      uShallow: { value: new Color('#0f3152') },
      uSky: { value: new Color('#132a4c') },
      uLightColor: { value: new Color('#9fb6d6') },
      uLightDir: { value: new Vector3(0, 1, 0) },
      uFogColor: { value: new Color('#0b1a33') },
      uFogDensity: { value: 0.0075 },
      uGlow: { value: 0.3 },
    }),
    [],
  );

  useFrame(() => {
    const material = materialRef.current;
    const mesh = meshRef.current;
    if (!material || !mesh) return;
    const { palette, boatPos, time, lightDir } = sceneState;
    material.uniforms.uTime.value = time;
    material.uniforms.uDeep.value.copy(palette.deep);
    material.uniforms.uShallow.value.copy(palette.shallow);
    material.uniforms.uSky.value.copy(palette.horizon);
    material.uniforms.uLightColor.value.copy(palette.light);
    material.uniforms.uFogColor.value.copy(palette.fog);
    material.uniforms.uLightDir.value.copy(lightDir);
    material.uniforms.uGlow.value = palette.lightGlow;
    material.uniforms.uOrigin.value.set(boatPos.x, boatPos.z);
    mesh.position.set(boatPos.x, 0, boatPos.z);
  });

  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={0}>
      <planeGeometry args={[900, 900, 400, 400]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={DoubleSide}
      />
    </mesh>
  );
};
