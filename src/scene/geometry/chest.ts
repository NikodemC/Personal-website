import type { BufferGeometry } from 'three';
import { buildSurface } from './surface';

/** Barrel lid: a half cylinder lying along X, cut flat at y = 0. */
export const createChestLid = (width: number, radius: number): BufferGeometry =>
  buildSurface(1, 26, (u, v, out) => {
    const angle = Math.PI * v;
    out.set(width * (u - 0.5), radius * Math.sin(angle), radius * Math.cos(angle));
  });

/** The two semicircular ends that close the lid. */
export const createChestLidCaps = (width: number, radius: number): BufferGeometry =>
  buildSurface(24, 8, (u, v, out) => {
    const side = v < 0.5 ? -1 : 1;
    const reach = Math.abs(v * 2 - 1);
    const angle = Math.PI * u;
    out.set((side * width) / 2, radius * Math.sin(angle) * reach, radius * Math.cos(angle) * reach);
  });
