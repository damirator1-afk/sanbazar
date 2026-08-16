import { Vector3, CatmullRomCurve3 } from "three";

export type ModelKey =
  | "faucet"
  | "toilet"
  | "shower"
  | "installation"
  | "siphon"
  | "accessories";

export interface Category {
  key: ModelKey;
  index: number;
  title: string;
  tagline: string;
  position: Vector3;
}

// distance in world units between two consecutive category pedestals
export const SPACING = 13;
// how far in front of camera-start the first pedestal sits
const LEAD_IN = 10;

const RAW: { key: ModelKey; title: string; tagline: string }[] = [
  { key: "faucet", title: "Смесители", tagline: "Современные формы и безупречная надежность." },
  { key: "toilet", title: "Санфаянс", tagline: "Минимализм. Комфорт. Эстетика." },
  { key: "shower", title: "Душевые системы", tagline: "Комфорт в каждой детали." },
  { key: "installation", title: "Инсталляции", tagline: "Надежность и технологии." },
  { key: "siphon", title: "Сифоны", tagline: "Качество в мелочах." },
  { key: "accessories", title: "Аксессуары", tagline: "Завершающие штрихи." },
];

// gentle alternating left/right weave down the -Z corridor
function xOffsetFor(i: number): number {
  return Math.sin(i * 1.15) * 2.6;
}

export const CATEGORIES: Category[] = RAW.map((c, i) => ({
  ...c,
  index: i,
  position: new Vector3(xOffsetFor(i), 0, -LEAD_IN - i * SPACING),
}));

export const LAST_Z = CATEGORIES[CATEGORIES.length - 1].position.z;
export const FINALE_Z = LAST_Z - SPACING * 1.6;

// Camera travels through these points (index -1 = intro standing point,
// 0..9 = beside each category, 10 = pulled back for the finale).
export function buildCameraPath(): CatmullRomCurve3 {
  const points: Vector3[] = [];
  // the very first frame a visitor sees, before any scroll — framed as
  // a close hero shot of the faucet (matching the reference composition)
  // rather than a distant, dim establishing view of an empty corridor
  const first = CATEGORIES[0].position;
  points.push(new Vector3(first.x - 3.6, 1.85, first.z + 5.6));
  CATEGORIES.forEach((c) => {
    const side = c.index % 2 === 0 ? 1 : -1;
    // pulled in close for a clear, legible view of each product —
    // the earlier wider framing left products small and washed out
    points.push(new Vector3(c.position.x + side * 2.3, 2.05, c.position.z + 2.9));
  });
  points.push(new Vector3(0, 3.2, FINALE_Z + 8));
  // pulled well back so the medallion reads as a framed reveal rather
  // than the camera ending up nearly inside the particle cluster
  points.push(new Vector3(0, 2.3, FINALE_Z + 5));
  return new CatmullRomCurve3(points, false, "catmullrom", 0.4);
}

export function buildLookPath(): CatmullRomCurve3 {
  const points: Vector3[] = [];
  const first = CATEGORIES[0].position;
  points.push(new Vector3(first.x + 0.6, 1.35, first.z + 0.3));
  CATEGORIES.forEach((c) => {
    points.push(new Vector3(c.position.x, 1.3, c.position.z));
  });
  points.push(new Vector3(0, 1.6, FINALE_Z));
  // centred on the medallion, not past it — the previous version looked
  // straight through the logo into the fog instead of at it
  points.push(new Vector3(0, 1.9, FINALE_Z));
  return new CatmullRomCurve3(points, false, "catmullrom", 0.4);
}

// Sizes the scroll spacer (in page.tsx: `${TOTAL_STEPS * 100}vh`) AND is
// the number of *segments* in the camera/look curves: 1 (intro→cat0) +
// (CATEGORIES.length - 1) product-to-product hops + 1 (last cat→finale-
// approach) + 1 (finale-approach→finale-final) = CATEGORIES.length + 2
// segments, i.e. CATEGORIES.length + 3 control points.
export const TOTAL_STEPS = CATEGORIES.length + 2;

/**
 * CameraRig moves the camera with `curve.getPointAt(u)` — arc-length
 * parametrization, so it travels at constant speed regardless of how far
 * apart consecutive waypoints happen to be. That's what makes the motion
 * feel smooth. But it means a control point (a category's waypoint) does
 * NOT sit at u = j/TOTAL_STEPS unless every segment is the same length,
 * which ours aren't (the weave, and the intro/finale legs, are all
 * different distances). Using `getPoint(u)` instead — raw parameter,
 * control points evenly spaced in u — fixes that alignment but makes the
 * camera visibly speed up and slow down at every waypoint, which reads
 * as jerky.
 *
 * This function resolves that: it walks the SAME curve CameraRig
 * actually drives on with getLengths() (arc length sampled at each raw
 * control-point parameter) to find, for every waypoint, the real u value
 * at which getPointAt reaches it. CameraRig turns the smoothed scroll
 * fraction into a continuous "step index" through this table instead of
 * naively multiplying by TOTAL_STEPS, so motion stays constant-speed
 * while labels/shadows/finale timing stay correctly synced to it.
 */
export function buildWaypointU(curve: CatmullRomCurve3): number[] {
  const lengths = curve.getLengths(TOTAL_STEPS);
  const total = lengths[lengths.length - 1];
  return lengths.map((l) => (total > 0 ? l / total : 0));
}

/** Continuous step index (0..TOTAL_STEPS) for an arc-length fraction u,
 * e.g. 3.4 means 40% of the way from waypoint 3 to waypoint 4. */
export function stepIndexFromU(u: number, waypointU: number[]): number {
  for (let j = 0; j < waypointU.length - 1; j++) {
    if (u <= waypointU[j + 1]) {
      const span = waypointU[j + 1] - waypointU[j];
      const frac = span > 0 ? (u - waypointU[j]) / span : 0;
      return j + frac;
    }
  }
  return waypointU.length - 1;
}
