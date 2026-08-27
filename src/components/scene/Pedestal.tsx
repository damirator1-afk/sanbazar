import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, Color, Group } from "three";
import { pedestalMaterial } from "@/lib/materials";

export const PEDESTAL_HEIGHT = 0.9;
export const PEDESTAL_RADIUS = 0.8;

const BASE_RADIUS = PEDESTAL_RADIUS * 1.08;
const HALO_RADIUS = BASE_RADIUS * 1.7;
// overbright so the scene's real Bloom pass diffuses it (same trick as
// the wall rim lights) -- the texture's alpha channel shapes *where*
// the glow sits (a halo spilling onto the floor around the base), this
// color multiplier is what makes it actually read as light, not a decal
const HALO_HDR_COLOR = new Color(1, 1, 1).multiplyScalar(4);
// products spin at rotation.y += delta * 0.6 -- the halo turns the
// other way, slower, so the two motions read as distinct layers
const HALO_SPIN_SPEED = 0.35;

// radial falloff (transparent under the pedestal, soft peak near the
// base edge, fading out by the rim) plus a handful of brighter blobs
// unevenly spaced around that ring -- a perfectly even ring wouldn't
// show any motion once it spins, these hotspots are what make the spin
// actually visible
function useHaloTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const c = size / 2;

    const base = ctx.createRadialGradient(c, c, size * 0.22, c, c, size * 0.5);
    base.addColorStop(0, "rgba(255,255,255,0)");
    base.addColorStop(0.55, "rgba(255,255,255,0.32)");
    base.addColorStop(0.75, "rgba(255,255,255,0.14)");
    base.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    const ringRadius = size * 0.37;
    const blobRadius = size * 0.13;
    const blobCount = 6;
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < blobCount; i++) {
      const angle = (i / blobCount) * Math.PI * 2;
      const bx = c + Math.cos(angle) * ringRadius;
      const by = c + Math.sin(angle) * ringRadius;
      const blob = ctx.createRadialGradient(bx, by, 0, bx, by, blobRadius);
      blob.addColorStop(0, "rgba(255,255,255,0.55)");
      blob.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = blob;
      ctx.beginPath();
      ctx.arc(bx, by, blobRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

export default function Pedestal() {
  const haloTexture = useHaloTexture();
  const haloSpinRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (haloSpinRef.current) haloSpinRef.current.rotation.y -= delta * HALO_SPIN_SPEED;
  });

  return (
    <group>
      <mesh position={[0, PEDESTAL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[PEDESTAL_RADIUS, BASE_RADIUS, PEDESTAL_HEIGHT, 48]} />
        <meshStandardMaterial {...pedestalMaterial} />
      </mesh>

      <group ref={haloSpinRef}>
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[HALO_RADIUS, 48]} />
          <meshBasicMaterial
            map={haloTexture}
            color={HALO_HDR_COLOR}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
