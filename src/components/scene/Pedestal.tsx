import { pedestalMaterial } from "@/lib/materials";

export const PEDESTAL_HEIGHT = 0.9;
export const PEDESTAL_RADIUS = 0.8;

export default function Pedestal() {
  return (
    <group>
      <mesh position={[0, PEDESTAL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[PEDESTAL_RADIUS, PEDESTAL_RADIUS * 1.08, PEDESTAL_HEIGHT, 48]} />
        <meshStandardMaterial {...pedestalMaterial} />
      </mesh>
    </group>
  );
}
