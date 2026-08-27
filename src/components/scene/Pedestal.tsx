import { useMemo } from "react";
import { AdditiveBlending, CanvasTexture, Color } from "three";
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

// radial falloff: transparent right under the pedestal (hidden anyway),
// rising to a soft peak near the base edge, fading out by the rim —
// a floor light pool, not a ring drawn on the object itself
function useHaloTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const c = size / 2;
    const gradient = ctx.createRadialGradient(c, c, size * 0.22, c, c, size * 0.5);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0.5)");
    gradient.addColorStop(0.75, "rgba(255,255,255,0.22)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

export default function Pedestal() {
  const haloTexture = useHaloTexture();

  return (
    <group>
      <mesh position={[0, PEDESTAL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[PEDESTAL_RADIUS, BASE_RADIUS, PEDESTAL_HEIGHT, 48]} />
        <meshStandardMaterial {...pedestalMaterial} />
      </mesh>

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
  );
}
