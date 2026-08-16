import Pipe from "../Pipe";
import { chromeMaterial } from "@/lib/materials";

export default function Faucet() {
  return (
    <group>
      <mesh position={[0, 0.025, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.055, 0.05, 32]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.024, 0.22, 24]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>
      <Pipe
        points={[
          [0, 0.27, 0],
          [0, 0.35, 0],
          [0, 0.37, 0.13],
          [0, 0.31, 0.23],
        ]}
        radius={0.02}
        material={chromeMaterial}
      />
      <mesh position={[0, 0.3, 0.235]} castShadow>
        <sphereGeometry args={[0.021, 16, 16]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>
      <mesh position={[0.055, 0.21, 0.01]} rotation={[0, 0, -0.5]} castShadow>
        <boxGeometry args={[0.1, 0.022, 0.03]} />
        <meshStandardMaterial {...chromeMaterial} />
      </mesh>
    </group>
  );
}
