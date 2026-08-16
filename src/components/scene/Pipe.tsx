import { useMemo } from "react";
import { CatmullRomCurve3, TubeGeometry, Vector3, MeshStandardMaterialParameters } from "three";

interface PipeProps {
  points: [number, number, number][];
  radius?: number;
  material: MeshStandardMaterialParameters;
  segments?: number;
}

/** A bent pipe/tube following an arbitrary set of points — sidesteps
 * fiddly torus-arc rotation math for anything that isn't a straight
 * cylinder (faucet necks, siphon traps, shower arms, rail bends…).
 *
 * TubeGeometry derives its cross-section orientation from Frenet frames,
 * which degenerate into NaN when a curve segment is perfectly aligned
 * with a world axis (very common here — most pipes start with a
 * straight vertical run). NaN geometry doesn't just fail to render, it
 * can take the whole WebGL context down. A sub-millimeter deterministic
 * jitter keeps every segment non-collinear without a visible effect. */
export default function Pipe({ points, radius = 0.03, material, segments = 32 }: PipeProps) {
  const geometry = useMemo(() => {
    const jittered = points.map(
      ([x, y, z], i) =>
        new Vector3(
          x + (i % 2 === 0 ? 1 : -1) * 0.0006,
          y,
          z + (i % 3 === 0 ? 1 : -1) * 0.0005
        )
    );
    const curve = new CatmullRomCurve3(jittered);
    return new TubeGeometry(curve, segments, radius, 14, false);
  }, [points, radius, segments]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial {...material} />
    </mesh>
  );
}
