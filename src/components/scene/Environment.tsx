import { useMemo } from "react";
import { InstancedMesh, Object3D } from "three";
import { FINALE_Z } from "@/lib/categories";

const SLAT_WIDTH = 0.12;
const SLAT_GAP = 0.12;
const SLAT_PITCH = SLAT_WIDTH + SLAT_GAP;
const SLAT_HEIGHT = 8.8;

function WoodSlats({ x, count, startZ }: { x: number; count: number; startZ: number }) {
  // one InstancedMesh per wall so a dense reeded pattern (hundreds of thin
  // slats) is still a single draw call instead of hundreds of meshes
  const dummy = useMemo(() => new Object3D(), []);
  const setRef = (mesh: InstancedMesh | null) => {
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      dummy.position.set(x - Math.sign(x) * 0.03, 4, startZ + i * SLAT_PITCH);
      dummy.rotation.set(0, Math.PI / 2, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  return (
    <instancedMesh ref={setRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[SLAT_WIDTH, SLAT_HEIGHT]} />
      <meshStandardMaterial color="#6b4527" metalness={0.05} roughness={0.5} />
    </instancedMesh>
  );
}

/** Dark matte floor with a faint reflection, plus the corridor walls
 * fading into darkness — kept as simple planes so it stays cheap. Thin
 * vertical wood slats (reeded/fluted look) sit in front of the walls,
 * evenly alternating with gaps that show the dark wall behind. */
export default function Environment() {
  const floorLength = Math.abs(FINALE_Z) + 20;
  const floorCenterZ = FINALE_Z / 2 + 4;
  const floorStartZ = floorCenterZ - floorLength / 2;
  const slatCount = Math.floor(floorLength / SLAT_PITCH);

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
        <group key={x}>
          <mesh position={[x, 4, floorCenterZ]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
            <planeGeometry args={[floorLength, 9]} />
            <meshStandardMaterial color="#060c16" metalness={0.1} roughness={0.9} />
          </mesh>

          <WoodSlats x={x} count={slatCount} startZ={floorStartZ} />
        </group>
      ))}
    </group>
  );
}
