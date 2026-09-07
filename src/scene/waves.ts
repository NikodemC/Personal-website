import { Vector4 } from 'three';

interface Wave {
  dir: [number, number];
  steepness: number;
  wavelength: number;
}

const GRAVITY = 9.81;

export const WAVES: Wave[] = [
  { dir: [1, 0.6], steepness: 0.18, wavelength: 30 },
  { dir: [-0.7, 1], steepness: 0.13, wavelength: 15 },
  { dir: [0.3, -1], steepness: 0.09, wavelength: 7 },
  { dir: [-1, -0.25], steepness: 0.06, wavelength: 3.4 },
];

export const waveHeight = (x: number, z: number, time: number): number => {
  let height = 0;
  for (const wave of WAVES) {
    const length = Math.hypot(wave.dir[0], wave.dir[1]);
    const dx = wave.dir[0] / length;
    const dz = wave.dir[1] / length;
    const k = (2 * Math.PI) / wave.wavelength;
    const speed = Math.sqrt(GRAVITY / k);
    const amplitude = wave.steepness / k;
    height += amplitude * Math.sin(k * (dx * x + dz * z - speed * time));
  }
  return height;
};

export const waveUniforms = () =>
  WAVES.map((wave) => new Vector4(wave.dir[0], wave.dir[1], wave.steepness, wave.wavelength));

/**
 * Gerstner waves over the horizontal plane. `flat` carries the horizontal
 * coordinates in .xy; the result is a world-space position with y up.
 */
export const gerstnerGlsl = /* glsl */ `
#define WAVE_COUNT 4
uniform vec4 uWaves[WAVE_COUNT];

vec3 gerstner(vec2 flat2, float t, out vec3 outNormal) {
  vec3 pos = vec3(flat2.x, 0.0, flat2.y);
  vec3 tangent = vec3(1.0, 0.0, 0.0);
  vec3 binormal = vec3(0.0, 0.0, 1.0);
  for (int i = 0; i < WAVE_COUNT; i++) {
    vec4 w = uWaves[i];
    vec2 d = normalize(w.xy);
    float steep = w.z;
    float k = 6.28318530718 / w.w;
    float c = sqrt(9.81 / k);
    float a = steep / k;
    float f = k * (dot(d, flat2) - c * t);
    float s = sin(f);
    float co = cos(f);
    pos += vec3(d.x * a * co, a * s, d.y * a * co);
    tangent += vec3(-d.x * d.x * steep * s, d.x * steep * co, -d.x * d.y * steep * s);
    binormal += vec3(-d.x * d.y * steep * s, d.y * steep * co, -d.y * d.y * steep * s);
  }
  outNormal = normalize(cross(binormal, tangent));
  return pos;
}
`;
