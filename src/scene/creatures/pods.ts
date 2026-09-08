/** Shoal, arm and blowhole layouts, shared by the scene and its choreography. */
export const POD = [
  { lag: 0, lateral: 0, height: 2.6, span: 15, scale: 1 },
  { lag: 0.5, lateral: -3.4, height: 2.05, span: 13.5, scale: 0.86 },
  { lag: 0.27, lateral: 3.8, height: 2.35, span: 14, scale: 0.93 },
];

/** Arms break the surface in a loose ring, each on its own clip and timing. */
export const TENTACLES = [
  { angle: 0.35, reach: 14, height: 34, clip: 1, speed: 0.22, delay: 0 },
  { angle: 1.6, reach: 22, height: 26, clip: 2, speed: 0.15, delay: 0.09 },
  { angle: 2.9, reach: 12, height: 40, clip: 0, speed: 0.19, delay: 0.05 },
  { angle: 4.1, reach: 24, height: 24, clip: 3, speed: 0.13, delay: 0.15 },
  { angle: 5.3, reach: 16, height: 30, clip: 1, speed: 0.17, delay: 0.2 },
];

export const BLOW = [
  { lean: -1, radius: 0.5 },
  { lean: 1, radius: 0.46 },
  { lean: 0.1, radius: 0.3 },
];
