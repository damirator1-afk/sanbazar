import { useMemo } from "react";
import { Vector2 } from "three";
import { ceramicMaterial, matteBlackMaterial, chromeMaterial } from "@/lib/materials";

export default function Toilet() {
  const bowlPoints = useMemo(
    () =>
      [
        [0.015, 0],
        [0.2, 0.015],
        [0.26, 0.08],
        [0.25, 0.17],
        [0.19, 0.27],
        [0.02, 0.3],
      ].map(([x, y]) => new Vector2(x, y)),
    []
  );

  return (
    <group>
      {/* wall panel behind */}
      <mesh position={[0, 0.55, -0.28]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 1.1, 0.08]} />
        <meshStandardMaterial {...matteBlackMaterial} />
      </mesh>
      {/* flush plate */}
      <mesh position={[0, 0.78, -0.235]} castShadow>
        <boxGeometry args={[0.22, 0.3, 0.02]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>
      <mesh position={[-0.05, 0.78, -0.222]}>
        <cylinderGeometry args={[0.025, 0.025, 0.008, 24]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>
      <mesh position={[0.05, 0.78, -0.222]}>
        <cylinderGeometry args={[0.025, 0.025, 0.008, 24]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>
      {/* bowl, revolved profile */}
      <mesh position={[0, 0.1, 0.06]} rotation={[0, 0, 0]} castShadow receiveShadow>
        <latheGeometry args={[bowlPoints, 40]} />
        <meshStandardMaterial {...ceramicMaterial} />
      </mesh>
      {/* seat rim accent */}
      <mesh position={[0, 0.4, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.19, 0.014, 12, 48]} />
        <meshStandardMaterial {...ceramicMaterial} />
      </mesh>
    </group>
  );
}
