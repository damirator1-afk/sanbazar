import { chromeMaterial, ceramicMaterial } from "@/lib/materials";

export default function Accessories() {
  return (
    <group>
      {/* soap dispenser */}
      <group position={[-0.22, 0, 0.1]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.038, 0.16, 24]} />
          <meshStandardMaterial {...ceramicMaterial} />
        </mesh>
        <mesh position={[0, 0.17, 0]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, 0.03, 16]} />
          <meshStandardMaterial {...chromeMaterial} />
        </mesh>
        <mesh position={[0.025, 0.2, 0]} rotation={[0, 0, 0.3]} castShadow>
          <boxGeometry args={[0.05, 0.014, 0.014]} />
          <meshStandardMaterial {...chromeMaterial} />
        </mesh>
      </group>

      {/* toilet brush holder */}
      <group position={[0.2, 0, -0.05]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.055, 0.2, 24]} />
          <meshStandardMaterial {...chromeMaterial} />
        </mesh>
        <mesh position={[0, 0.205, 0]} castShadow>
          <cylinderGeometry args={[0.052, 0.052, 0.014, 24]} />
          <meshStandardMaterial {...chromeMaterial} />
        </mesh>
      </group>

      {/* tray */}
      <mesh position={[0, 0.015, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.03, 0.16]} />
        <meshStandardMaterial {...ceramicMaterial} />
      </mesh>
    </group>
  );
}
