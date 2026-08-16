import { matteBlackMaterial, chromeMaterial, ceramicMaterial } from "@/lib/materials";

export default function Installation() {
  return (
    <group>
      <mesh position={[0, 0.65, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 1.3, 0.15]} />
        <meshStandardMaterial {...matteBlackMaterial} />
      </mesh>
      <mesh position={[0, 0.78, 0.035]} castShadow>
        <boxGeometry args={[0.3, 0.42, 0.02]} />
        <meshStandardMaterial {...ceramicMaterial} />
      </mesh>
      <mesh position={[-0.06, 0.85, 0.05]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.012, 32]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>
      <mesh position={[0.06, 0.85, 0.05]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.012, 32]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>
    </group>
  );
}
