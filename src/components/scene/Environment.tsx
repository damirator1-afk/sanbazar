import { useMemo } from "react";
import { Color, InstancedMesh, Object3D } from "three";
import { FINALE_Z } from "@/lib/categories";

const SLAT_WIDTH = 0.12;
const SLAT_GAP = 0.12;
const SLAT_PITCH = SLAT_WIDTH + SLAT_GAP;
const SLAT_HEIGHT = 8.8;
// alternating blocks along the wall: a stretch of slats, then a stretch
// of bare wall, repeating -- matching the reference photo's rhythm
// rather than reeding the whole wall
const SLAT_BLOCK_LENGTH = 5.2;
const WALL_BLOCK_LENGTH = SLAT_BLOCK_LENGTH * 1.5;
const BLOCK_CYCLE = SLAT_BLOCK_LENGTH + WALL_BLOCK_LENGTH;

function WoodSlats({ x, slotCount, startZ }: { x: number; slotCount: number; startZ: number }) {
  // one InstancedMesh per wall so a dense reeded pattern (hundreds of thin
  // slats) is still a single draw call instead of hundreds of meshes
  const dummy = useMemo(() => new Object3D(), []);
  const setRef = (mesh: InstancedMesh | null) => {
    if (!mesh) return;
    let placed = 0;
    for (let i = 0; i < slotCount; i++) {
      const z = startZ + i * SLAT_PITCH;
      const posInCycle = ((z - startZ) % BLOCK_CYCLE + BLOCK_CYCLE) % BLOCK_CYCLE;
      if (posInCycle >= SLAT_BLOCK_LENGTH) continue;
      dummy.position.set(x - Math.sign(x) * 0.03, 4, z);
      // face the corridor's center, not just always +X -- the right-hand
      // wall (x>0) needs the opposite yaw or its normal points outward,
      // away from the camera, and the whole plane backface-culls invisible
      dummy.rotation.set(0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
  };

  return (
    <instancedMesh ref={setRef} args={[undefined, undefined, slotCount]}>
      <planeGeometry args={[SLAT_WIDTH, SLAT_HEIGHT]} />
      <meshStandardMaterial color="#6b4527" metalness={0.05} roughness={0.5} />
    </instancedMesh>
  );
}

const STRIP_THICKNESS = 0.1;
const STRIP_TOP_Y = 8.3;
const STRIP_BOTTOM_Y = 0.08;
// pushed well past 1.0 -- toneMapped=false means this isn't clamped by
// the display curve, so it's genuinely overbright in the HDR buffer the
// scene's Bloom pass reads from. That's what makes a strip actually
// bloom/diffuse onto its surroundings instead of just being a bright
// but flat-looking rectangle.
const STRIP_HDR_COLOR = new Color(1, 1, 1).multiplyScalar(6);

/** Rim-light strip along the top and bottom edge of each *plain wall*
 * block only — the slat blocks stay without them, per reference. Relies
 * on the scene's existing Bloom pass for the diffuse glow rather than a
 * hand-authored gradient, which read as a painted decal, not light. */
function WallLightStrips({ x, startZ, floorLength }: { x: number; startZ: number; floorLength: number }) {
  const floorEnd = startZ + floorLength;
  const cycles = Math.ceil(floorLength / BLOCK_CYCLE) + 1;
  const segments: { z: number; length: number }[] = [];

  for (let c = 0; c < cycles; c++) {
    const wallStart = startZ + c * BLOCK_CYCLE + SLAT_BLOCK_LENGTH;
    const wallEnd = wallStart + WALL_BLOCK_LENGTH;
    const clampedStart = Math.max(wallStart, startZ);
    const clampedEnd = Math.min(wallEnd, floorEnd);
    if (clampedEnd <= clampedStart) continue;
    segments.push({ z: (clampedStart + clampedEnd) / 2, length: clampedEnd - clampedStart });
  }

  return (
    <>
      {segments.map((s, i) => (
        <group key={i}>
          <mesh
            position={[x - Math.sign(x) * 0.015, STRIP_TOP_Y, s.z]}
            rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
          >
            <planeGeometry args={[s.length, STRIP_THICKNESS]} />
            <meshBasicMaterial color={STRIP_HDR_COLOR} toneMapped={false} />
          </mesh>
          <mesh
            position={[x - Math.sign(x) * 0.015, STRIP_BOTTOM_Y, s.z]}
            rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
          >
            <planeGeometry args={[s.length, STRIP_THICKNESS]} />
            <meshBasicMaterial color={STRIP_HDR_COLOR} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

const CEILING_LIGHT_SPACING = 13;
const CEILING_Y = 8.4;
// same overbright trick as the wall/pedestal glow elements -- the lens
// itself blooms, the pointLight underneath it does the actual floor
// illumination. Plain white (not tinted) to match the wall rim lights.
const CEILING_LENS_COLOR = new Color(1, 1, 1).multiplyScalar(5);

/** Round recessed downlights along the ceiling centerline, like the
 * reference showroom photos -- a small glowing lens (bloom-driven, see
 * STRIP_HDR_COLOR above) plus a real, non-shadow-casting point light
 * for a soft pool on the floor below each fixture. */
function CeilingLights({ startZ, floorLength }: { startZ: number; floorLength: number }) {
  const count = Math.floor(floorLength / CEILING_LIGHT_SPACING);
  const fixtures = Array.from({ length: count }, (_, i) => startZ + (i + 0.5) * CEILING_LIGHT_SPACING);

  return (
    <>
      {fixtures.map((z) => (
        <group key={z} position={[0, CEILING_Y, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.03, 24]} />
            <meshBasicMaterial color={CEILING_LENS_COLOR} toneMapped={false} />
          </mesh>
          <pointLight intensity={9} distance={7} decay={2} color="#fff6ea" />
        </group>
      ))}
    </>
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

      {/* dead-end wall closing off the far end of the corridor -- sits
          just behind FinaleLogo (FINALE_Z), not all the way out at
          floorStartZ, so the logo reads as mounted flush on it rather
          than floating in open corridor with a gap behind it. Default
          plane normal (+Z) already faces back up the corridor toward
          the camera, no rotation needed. */}
      <mesh position={[0, 4, FINALE_Z - 1.2]} receiveShadow>
        <planeGeometry args={[16, 9]} />
        <meshStandardMaterial color="#060c16" metalness={0.1} roughness={0.9} />
      </mesh>

      <CeilingLights startZ={floorStartZ} floorLength={floorLength} />

      {[-7, 7].map((x) => (
        <group key={x}>
          <mesh
            position={[x, 4, floorCenterZ]}
            rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
            receiveShadow
          >
            <planeGeometry args={[floorLength, 9]} />
            <meshStandardMaterial color="#060c16" metalness={0.1} roughness={0.9} />
          </mesh>

          <WoodSlats x={x} slotCount={slatCount} startZ={floorStartZ} />
          <WallLightStrips x={x} startZ={floorStartZ} floorLength={floorLength} />
        </group>
      ))}
    </group>
  );
}
