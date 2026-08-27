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
const HALO_HDR_COLOR = new Color(1, 1, 1).multiplyScalar(3);
const SWEEP_HDR_COLOR = new Color(1, 1, 1).multiplyScalar(5);
// products spin at rotation.y += delta * 0.6 -- the sweep turns the
// other way, slower, so the two motions read as distinct layers
const HALO_SPIN_SPEED = 0.35;

// a plain, unbroken radial falloff -- transparent under the pedestal,
// soft peak near the base edge, fading out by the rim. Stays solid;
// this alone never rotates, so the halo always reads as one continuous
// ring rather than a moving pattern.
function useBaseHaloTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const c = size / 2;
    const gradient = ctx.createRadialGradient(c, c, size * 0.22, c, c, size * 0.5);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0.4)");
    gradient.addColorStop(0.75, "rgba(255,255,255,0.18)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

// a single bright arc, same radial shape as the base but clipped to a
// wedge -- this is the only part that spins, riding on top of the
// always-solid base ring so the motion reads as a moving highlight
// instead of chopping the whole halo into a dashed pattern
function useSweepTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const c = size / 2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.arc(c, c, size, -Math.PI / 5, Math.PI / 5);
    ctx.closePath();
    ctx.clip();

    const gradient = ctx.createRadialGradient(c, c, size * 0.22, c, c, size * 0.5);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.75, "rgba(255,255,255,0.4)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

export default function Pedestal() {
  const baseHaloTexture = useBaseHaloTexture();
  const sweepTexture = useSweepTexture();
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

      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[HALO_RADIUS, 48]} />
        <meshBasicMaterial
          map={baseHaloTexture}
          color={HALO_HDR_COLOR}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <group ref={haloSpinRef}>
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[HALO_RADIUS, 48]} />
          <meshBasicMaterial
            map={sweepTexture}
            color={SWEEP_HDR_COLOR}
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
