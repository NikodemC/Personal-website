/**
 * Deterministic pseudo-random from a seed. Scene layouts have to be identical
 * on every render, so nothing here may call Math.random.
 */
export const seeded = (seed: number): number => {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value);
};
