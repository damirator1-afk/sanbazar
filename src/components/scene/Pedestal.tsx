import { Color } from "three";
import { pedestalMaterial } from "@/lib/materials";

export const PEDESTAL_HEIGHT = 0.9;
export const PEDESTAL_RADIUS = 0.8;

const BASE_RADIUS = PEDESTAL_RADIUS * 1.08;
// same overbright-HDR trick as the showroom wall rim lights (toneMapped
// false + well past 1.0 so the scene's Bloom pass actually reacts to
// it) -- keeps the pedestal base ring glowing the same way, not flat
const RING_HDR_COLOR = new Color(1, 1, 1).multiplyScalar(6);

export default function Pedestal() {
  return (
    <group>
      <mesh position={[0, PEDESTAL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[PEDESTAL_RADIUS, BASE_RADIUS, PEDESTAL_HEIGHT, 48]} />
        <meshStandardMaterial {...pedestalMaterial} />
      </mesh>

      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BASE_RADIUS, 0.02, 8, 64]} />
        <meshBasicMaterial color={RING_HDR_COLOR} toneMapped={false} />
      </mesh>
    </group>
  );
}
