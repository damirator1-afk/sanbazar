import { useMemo } from "react";
import { InstancedMesh, Object3D } from "three";
import { FINALE_Z } from "@/lib/categories";

const PANEL_SPACING = 3.2;
const PANEL_WIDTH = 1.4;
const PANEL_HEIGHT = 8;

function WoodPanels({ x, count, startZ }: { x: number; count: number; startZ: number }) {
  // instanced so ~36 panels per wall cost one draw call each side, not 36
  const dummy = useMemo(() => new Object3D(), []);
  const setRef = (mesh: InstancedMesh | null) => {
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      dummy.position.set(x - Math.sign(x) * 0.03, 4, startZ + i * PANEL_SPACING);
      dummy.rotation.set(0, Math.PI / 2, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  return (
    <instancedMesh ref={setRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[PANEL_WIDTH, PANEL_HEIGHT]} />
      <meshStandardMaterial color="#5a3c22" metalness={0.15} roughness={0.55} />
    </instancedMesh>
  );
}

/** Warm showroom corridor: dark stone-toned floor and walls, vertical
 * wood-panel accents, and a glowing amber rim-light strip along each
 * wall base (unlit meshBasicMaterial + the scene's existing Bloom pass
 * makes it read as a real LED strip without a separate light source). */
export default function Environment() {
  const floorLength = Math.abs(FINALE_Z) + 20;
  const floorCenterZ = FINALE_Z / 2 + 4;
  const floorStartZ = floorCenterZ - floorLength / 2;
  const panelCount = Math.floor(floorLength / PANEL_SPACING);

  return (
    <group>
      <mesh
        position={[0, 0, floorCenterZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[16, floorLength]} />
        <meshStandardMaterial color="#0d0a06" metalness={0.5} roughness={0.35} />
      </mesh>

      {[-7, 7].map((x) => (
        <group key={x}>
          <mesh position={[x, 4, floorCenterZ]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
            <planeGeometry args={[floorLength, 9]} />
            <meshStandardMaterial color="#16120c" metalness={0.05} roughness={0.95} />
          </mesh>

          <WoodPanels x={x} count={panelCount} startZ={floorStartZ} />

          <mesh position={[x - Math.sign(x) * 0.02, 0.06, floorCenterZ]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[floorLength, 0.06]} />
            <meshBasicMaterial color="#ffb35c" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
