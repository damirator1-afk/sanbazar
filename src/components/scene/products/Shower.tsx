import Pipe from "../Pipe";
import { chromeMaterial, matteBlackMaterial } from "@/lib/materials";

export default function Shower() {
  return (
    <group>
      <mesh position={[0, 0.8, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 1.6, 0.06]} />
        <meshStandardMaterial {...matteBlackMaterial} />
      </mesh>

      <mesh position={[0.12, 0.7, -0.15]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 1.3, 20]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>

      <Pipe
        points={[
          [0.12, 1.35, -0.15],
          [0.12, 1.42, -0.05],
          [0.12, 1.44, 0.1],
        ]}
        radius={0.016}
        material={chromeMaterial}
      />
      <mesh position={[0.12, 1.445, 0.16]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.02, 32]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>

      {/* hand-shower bracket + head, mid height */}
      <mesh position={[0.12, 0.95, -0.06]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.03, 16]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>
      <mesh position={[0.12, 0.88, -0.04]} rotation={[0.3, 0, 0]} castShadow>
        <capsuleGeometry args={[0.03, 0.12, 8, 16]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>

      {/* mixer valve on the wall */}
      <mesh position={[0.12, 0.55, -0.16]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.05, 24]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>
      <mesh position={[0.12, 0.55, -0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.09, 12]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>
    </group>
  );
}
