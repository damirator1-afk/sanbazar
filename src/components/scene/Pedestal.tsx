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
// base edge, fading out by the rim), then carved into distinct dashes
// around the circumference -- the previous attempt used subtle
// brightness bumps on a continuous ring, which blurred (canvas gradient
// + the scene's Bloom pass, twice) into something visually uniform, so
// the spin never actually showed. Hard gaps survive that blur.
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
    base.addColorStop(0.55, "rgba(255,255,255,0.4)");
    base.addColorStop(0.75, "rgba(255,255,255,0.18)");
    base.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    // cut real gaps out of the ring -- destination-out erases alpha
    // regardless of fill color, so this leaves hard on/off dashes
    const dashCount = 8;
    const gapFraction = 0.45; // fraction of each dash's arc that's cut away
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
    const step = (Math.PI * 2) / dashCount;
    for (let i = 0; i < dashCount; i++) {
      const gapStart = i * step + step * (1 - gapFraction) * 0.5;
      const gapEnd = gapStart + step * gapFraction;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, size, gapStart, gapEnd);
      ctx.closePath();
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
