import { CatmullRomCurve3, Vector3 } from 'three';

export const ROUTE = new CatmullRomCurve3(
  [
    new Vector3(0, 0, 40),
    new Vector3(7, 0, -30),
    new Vector3(-9, 0, -110),
    new Vector3(7, 0, -190),
    new Vector3(-3, 0, -260),
    new Vector3(0, 0, -320),
  ],
  false,
  'catmullrom',
  0.5,
);

export const HARBOR_CENTER = new Vector3(-46, 0, -368);
