import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, Color, type ShaderMaterial, Vector3 } from 'three';
import { sceneState } from './sceneState';

const vertexShader = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uLightColor;
uniform vec3 uSunDir;
uniform vec3 uMoonDir;
uniform float uStars;
uniform float uSunAlpha;
uniform float uMoonAlpha;
uniform float uGlow;
varying vec3 vDir;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float starField(vec3 dir) {
  vec3 grid = floor(dir * 260.0);
  float rnd = hash(grid);
  float star = step(0.9975, rnd);
  vec3 cell = fract(dir * 260.0) - 0.5;
  float falloff = smoothstep(0.42, 0.0, length(cell));
  float twinkle = 0.65 + 0.35 * sin(rnd * 100.0);
  return star * falloff * twinkle;
}

void main() {
  vec3 dir = normalize(vDir);
  float height = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
  float gradient = pow(clamp(dir.y, 0.0, 1.0), 0.45);
  vec3 color = mix(uHorizon, uZenith, gradient);

  float horizonBand = exp(-abs(dir.y) * 9.0);
  color = mix(color, uHorizon, horizonBand * 0.55);

  color += vec3(starField(dir)) * uStars * smoothstep(-0.05, 0.35, dir.y);

  float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
  color += uLightColor * pow(sunDot, 900.0) * 6.0 * uSunAlpha;
  color += uLightColor * pow(sunDot, 24.0) * 0.5 * uSunAlpha * uGlow;

  /** The disc itself is a separate billboard; this is only its glow on the sky. */
  float moonDot = max(dot(dir, normalize(uMoonDir)), 0.0);
  color += vec3(0.55, 0.65, 0.85) * pow(moonDot, 90.0) * 0.24 * uMoonAlpha;

  color = mix(color, uHorizon, smoothstep(0.0, -0.3, dir.y) * 0.85);
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

export const Sky = () => {
  const materialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uZenith: { value: new Color('#03070f') },
      uHorizon: { value: new Color('#132a4c') },
      uLightColor: { value: new Color('#9fb6d6') },
      uSunDir: { value: new Vector3(0, 1, 0) },
      uMoonDir: { value: new Vector3(0, 1, 0) },
      uStars: { value: 1 },
      uSunAlpha: { value: 0 },
      uMoonAlpha: { value: 1 },
      uGlow: { value: 0.3 },
    }),
    [],
  );

  useFrame(({ camera }) => {
    const material = materialRef.current;
    if (!material) return;
    const { palette, sunDir, moonDir, sunAlpha, moonAlpha } = sceneState;
    material.uniforms.uZenith.value.copy(palette.zenith);
    material.uniforms.uHorizon.value.copy(palette.horizon);
    material.uniforms.uLightColor.value.copy(palette.light);
    material.uniforms.uSunDir.value.copy(sunDir);
    material.uniforms.uMoonDir.value.copy(moonDir);
    material.uniforms.uStars.value = palette.stars;
    material.uniforms.uSunAlpha.value = sunAlpha;
    material.uniforms.uMoonAlpha.value = moonAlpha;
    material.uniforms.uGlow.value = palette.lightGlow;
    void camera;
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[420, 48, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={BackSide}
        depthWrite={false}
      />
    </mesh>
  );
};
