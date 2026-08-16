import Pipe from "../Pipe";
import { chromeMaterial } from "@/lib/materials";

export default function Siphon() {
  return (
    <group position={[-0.2, 0, -0.05]}>
      <Pipe
        points={[
          [0, 0.5, 0],
          [0, 0.32, 0],
          [0, 0.22, 0],
        ]}
        radius={0.032}
        material={chromeMaterial}
      />
      <Pipe
        points={[
          [0, 0.22, 0],
          [0.02, 0.1, 0],
          [0.12, 0.03, 0],
          [0.24, 0.03, 0],
          [0.33, 0.09, 0],
          [0.36, 0.2, 0],
        ]}
        radius={0.036}
        material={chromeMaterial}
      />
      <Pipe
        points={[
          [0.36, 0.2, 0],
          [0.44, 0.24, 0],
          [0.55, 0.25, 0],
        ]}
        radius={0.03}
        material={chromeMaterial}
      />
      <mesh position={[0.24, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 20]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>
    </group>
  );
}
