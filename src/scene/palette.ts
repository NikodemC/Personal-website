import { Color } from 'three';

interface PaletteStop {
  tod: number;
  zenith: string;
  horizon: string;
  deep: string;
  shallow: string;
  fog: string;
  light: string;
  stars: number;
  sunElevation: number;
  lightGlow: number;
  lightIntensity: number;
}

const STOPS: PaletteStop[] = [
  {
    tod: 0,
    zenith: '#03070f',
    horizon: '#132a4c',
    deep: '#04101f',
    shallow: '#0f3152',
    fog: '#0b1a33',
    light: '#9fb6d6',
    stars: 1,
    sunElevation: -12,
    lightGlow: 0.25,
    lightIntensity: 0.9,
  },
  {
    tod: 0.2,
    zenith: '#0a1730',
    horizon: '#3a3d5c',
    deep: '#071a30',
    shallow: '#1f4062',
    fog: '#2b3450',
    light: '#b8a8c0',
    stars: 0.6,
    sunElevation: -3,
    lightGlow: 0.5,
    lightIntensity: 1,
  },
  {
    tod: 0.35,
    zenith: '#23406e',
    horizon: '#dd9a58',
    deep: '#0d3252',
    shallow: '#336a8c',
    fog: '#cf9a70',
    light: '#f7a862',
    stars: 0,
    sunElevation: 6,
    lightGlow: 0.85,
    lightIntensity: 1.6,
  },
  {
    tod: 0.5,
    zenith: '#2a5f9c',
    horizon: '#9fbdd2',
    deep: '#0b3c5e',
    shallow: '#3b7fa0',
    fog: '#9db8ca',
    light: '#ffeecd',
    stars: 0,
    sunElevation: 25,
    lightGlow: 0.62,
    lightIntensity: 1.9,
  },
  {
    tod: 0.65,
    zenith: '#245691',
    horizon: '#93b4cb',
    deep: '#0a486e',
    shallow: '#428ba9',
    fog: '#9ab6c8',
    light: '#fdf6e6',
    stars: 0,
    sunElevation: 45,
    lightGlow: 0.55,
    lightIntensity: 2.1,
  },
  {
    tod: 0.85,
    zenith: '#2f4a7c',
    horizon: '#d99757',
    deep: '#0f3352',
    shallow: '#63748f',
    fog: '#c99a72',
    light: '#f5b169',
    stars: 0.1,
    sunElevation: 12,
    lightGlow: 0.82,
    lightIntensity: 1.7,
  },
  {
    tod: 1,
    zenith: '#1c2a55',
    horizon: '#e86f4a',
    deep: '#0a1e3a',
    shallow: '#4a4e7c',
    fog: '#c96a5e',
    light: '#ff8e5a',
    stars: 0.4,
    sunElevation: 2,
    lightGlow: 1.2,
    lightIntensity: 1.6,
  },
];

const STOP_COLORS = STOPS.map((stop) => ({
  ...stop,
  zenithColor: new Color(stop.zenith),
  horizonColor: new Color(stop.horizon),
  deepColor: new Color(stop.deep),
  shallowColor: new Color(stop.shallow),
  fogColor: new Color(stop.fog),
  lightColor: new Color(stop.light),
}));

export interface PaletteSample {
  zenith: Color;
  horizon: Color;
  deep: Color;
  shallow: Color;
  fog: Color;
  light: Color;
  stars: number;
  sunElevation: number;
  lightGlow: number;
  lightIntensity: number;
}

export const createPaletteSample = (): PaletteSample => ({
  zenith: new Color(),
  horizon: new Color(),
  deep: new Color(),
  shallow: new Color(),
  fog: new Color(),
  light: new Color(),
  stars: 1,
  sunElevation: -12,
  lightGlow: 0.25,
  lightIntensity: 0.9,
});

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const samplePalette = (tod: number, out: PaletteSample) => {
  const clamped = Math.min(1, Math.max(0, tod));
  let index = 0;
  while (index < STOP_COLORS.length - 2 && clamped > STOP_COLORS[index + 1].tod) index += 1;
  const a = STOP_COLORS[index];
  const b = STOP_COLORS[index + 1];
  const t = smoothstep((clamped - a.tod) / (b.tod - a.tod));

  out.zenith.copy(a.zenithColor).lerp(b.zenithColor, t);
  out.horizon.copy(a.horizonColor).lerp(b.horizonColor, t);
  out.deep.copy(a.deepColor).lerp(b.deepColor, t);
  out.shallow.copy(a.shallowColor).lerp(b.shallowColor, t);
  out.fog.copy(a.fogColor).lerp(b.fogColor, t);
  out.light.copy(a.lightColor).lerp(b.lightColor, t);
  out.stars = lerp(a.stars, b.stars, t);
  out.sunElevation = lerp(a.sunElevation, b.sunElevation, t);
  out.lightGlow = lerp(a.lightGlow, b.lightGlow, t);
  out.lightIntensity = lerp(a.lightIntensity, b.lightIntensity, t);
};
