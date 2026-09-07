export interface DeviceCapabilities {
  webgl: boolean;
  lowPower: boolean;
}

export const detectCapabilities = (): DeviceCapabilities => {
  if (typeof window === 'undefined') return { webgl: false, lowPower: true };

  let webgl = false;
  try {
    const canvas = document.createElement('canvas');
    webgl = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch (error) {
    console.warn('[VoyageCanvas] WebGL is unavailable:', error);
  }

  const smallScreen = window.matchMedia('(max-width: 640px)').matches;
  const memory = (navigator as { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency ?? 8;
  const lowPower = (smallScreen && memory !== undefined && memory <= 4) || cores <= 4;

  return { webgl, lowPower };
};
