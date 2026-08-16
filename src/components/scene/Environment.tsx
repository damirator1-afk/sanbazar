import { FINALE_Z } from "@/lib/categories";

/** Dark matte floor with a faint reflection, plus the corridor walls
 * fading into darkness — kept as simple planes so it stays cheap. */
export default function Environment() {
  const floorLength = Math.abs(FINALE_Z) + 20;
  const floorCenterZ = FINALE_Z / 2 + 4;

  return (
    <group>
      <mesh
        position={[0, 0, floorCenterZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[16, floorLength]} />
        <meshStandardMaterial color="#050a12" metalness={0.55} roughness={0.32} />
      </mesh>

      {[-7, 7].map((x) => (
        <mesh
          key={x}
          position={[x, 4, floorCenterZ]}
          rotation={[0, Math.PI / 2, 0]}
          receiveShadow
        >
          <planeGeometry args={[floorLength, 9]} />
          <meshStandardMaterial color="#060c16" metalness={0.1} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
