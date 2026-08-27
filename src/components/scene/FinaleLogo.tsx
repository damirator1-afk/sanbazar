"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import {
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
  Quaternion,
  MeshBasicMaterial,
  Group,
} from "three";
import { CATEGORIES, FINALE_Z, TOTAL_STEPS } from "@/lib/categories";
import { scrollProgress } from "@/lib/scrollProgress";

const PARTICLE_COUNT = 220;
// up near the ceiling (wall/ceiling line sits around y=8.5) with a bit
// of headroom, rather than mid-wall
const FINALE_CENTER = new Vector3(0, 6, FINALE_Z);
// scrollProgress.cameraStep is a continuous step index (0..TOTAL_STEPS),
// not a 0..1 fraction — this threshold lives in that same step-space
const FINALE_START_STEP = TOTAL_STEPS - 1.85;

const LOGO_MODEL_URL = "/models/logo.glb";
const LOGO_SCALE = 2.3 * 1.5;
// the model's local origin sits at the drop's bottom, not its center
// (bbox y: 0..0.98) -- shift down by half that (scaled) so it centers on
// FINALE_CENTER the same way the old plane image did
const LOGO_Y_OFFSET = -0.49 * LOGO_SCALE;
// label sits below the logo -- half the logo's height (above) plus a gap
const LABEL_Y_OFFSET = -(0.49 * LOGO_SCALE + 0.5);

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export default function FinaleLogo() {
  const meshRef = useRef<InstancedMesh>(null);
  const groupVisible = useRef(false);
  const logoRef = useRef<Group>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const { scene: logoScene } = useGLTF(LOGO_MODEL_URL);
  // one-time setup only -- opacity itself is set fresh every frame by
  // re-traversing logoScene directly in useFrame below, rather than
  // caching the material list in a ref/memo. React Compiler's lint rules
  // treat anything reachable from useMemo/useEffect-captured values as
  // immutable after the fact, which fights the standard R3F pattern of
  // mutating three.js objects imperatively per frame.
  useEffect(() => {
    logoScene.traverse((obj) => {
      if (obj instanceof Mesh && obj.material instanceof MeshStandardMaterial) {
        obj.material.transparent = true;
        obj.material.opacity = 0;
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [logoScene]);

  const dummy = useMemo(() => new Object3D(), []);
  const upAxis = useMemo(() => new Vector3(0, 1, 0), []);
  const quat = useMemo(() => new Quaternion(), []);
  const tmpPos = useMemo(() => new Vector3(), []);
  const tmpDir = useMemo(() => new Vector3(), []);

  // one-time randomized layout — a lazy useState initializer (not
  // useMemo) is the React-blessed way to run non-deterministic setup
  // exactly once per component instance
  const [{ starts, ends, phases }] = useState(() => {
    const starts = new Float32Array(PARTICLE_COUNT * 3);
    const ends = new Float32Array(PARTICLE_COUNT * 3);
    const phases = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const cat = CATEGORIES[i % CATEGORIES.length];
      const jitterR = 0.5 + Math.random() * 1.6;
      const jitterAngle = Math.random() * Math.PI * 2;
      starts[i * 3] = cat.position.x + Math.cos(jitterAngle) * jitterR;
      starts[i * 3 + 1] = 0.3 + Math.random() * 1.6;
      starts[i * 3 + 2] = cat.position.z + Math.sin(jitterAngle) * jitterR;

      // concentric rings converging into the medallion silhouette
      const ring = i % 3;
      const ringR = 0.55 + ring * 0.42 + Math.random() * 0.12;
      const a = (i / PARTICLE_COUNT) * Math.PI * 2 * 3.1 + ring;
      ends[i * 3] = FINALE_CENTER.x + Math.cos(a) * ringR;
      ends[i * 3 + 1] = FINALE_CENTER.y + Math.sin(a) * ringR;
      ends[i * 3 + 2] = FINALE_CENTER.z + (Math.random() - 0.5) * 0.08;

      phases[i] = Math.random() * 0.4;
    }
    return { starts, ends, phases };
  });

  useFrame((_, delta) => {
    const raw = scrollProgress.cameraStep;
    const t = smoothstep(FINALE_START_STEP, TOTAL_STEPS, raw);

    if (meshRef.current) {
      const shouldShow = t > 0.001;
      if (shouldShow !== groupVisible.current) {
        groupVisible.current = shouldShow;
        meshRef.current.visible = shouldShow;
      }

      if (shouldShow) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const localT = smoothstep(0, 1, Math.min(1, Math.max(0, (t - phases[i]) / (1 - phases[i]))));
          tmpPos.set(
            starts[i * 3] + (ends[i * 3] - starts[i * 3]) * localT,
            starts[i * 3 + 1] + (ends[i * 3 + 1] - starts[i * 3 + 1]) * localT,
            starts[i * 3 + 2] + (ends[i * 3 + 2] - starts[i * 3 + 2]) * localT
          );
          tmpDir
            .set(ends[i * 3], ends[i * 3 + 1], ends[i * 3 + 2])
            .sub(tmpPos)
            .normalize();
          // once a particle reaches its destination the direction-to-target
          // collapses to zero and the fallback orientation kicks in — with
          // 220 particles converged simultaneously that reads as a wall of
          // vertical streaks, so shrink them to invisible before that shows
          if (tmpDir.lengthSq() < 0.0001) tmpDir.set(0, 1, 0);
          quat.setFromUnitVectors(upAxis, tmpDir);

          dummy.position.copy(tmpPos);
          dummy.quaternion.copy(quat);
          const arrival = smoothstep(0.8, 1, localT);
          const shrink = 1 - arrival;
          const scale = (0.55 + (1 - localT) * 0.7) * shrink;
          dummy.scale.set(scale, (0.4 + localT * 1.1) * shrink, scale);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        const mat = meshRef.current.material as MeshBasicMaterial;
        // fades out as the logo image fades in, so the handoff feels
        // like one continuous reveal rather than two overlapping effects
        mat.opacity = 0.9 * smoothstep(0, 0.35, t) * (1 - smoothstep(0.55, 0.92, t));
      }
    }

    const logoOpacity = smoothstep(0.68, 1, t);
    logoScene.traverse((obj) => {
      if (obj instanceof Mesh && obj.material instanceof MeshStandardMaterial) {
        obj.material.opacity = logoOpacity;
      }
    });
    if (logoRef.current && logoOpacity > 0.001) {
      logoRef.current.rotation.y += delta * 0.25;
    }
    if (labelRef.current) {
      const lo = smoothstep(0.8, 1, t);
      labelRef.current.style.opacity = String(lo);
      labelRef.current.style.transform = `translateY(${(1 - lo) * 16}px)`;
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]} visible={false}>
        <cylinderGeometry args={[0.007, 0.007, 0.16, 6]} />
        <meshBasicMaterial color="#6fa8ff" transparent opacity={0} toneMapped={false} />
      </instancedMesh>

      <group
        ref={logoRef}
        position={[FINALE_CENTER.x, FINALE_CENTER.y + LOGO_Y_OFFSET, FINALE_CENTER.z + 0.03]}
        scale={LOGO_SCALE}
      >
        <primitive object={logoScene} />
      </group>

      <pointLight
        position={[FINALE_CENTER.x, FINALE_CENTER.y, FINALE_CENTER.z + 1]}
        color="#1e6fe6"
        intensity={18}
        distance={7}
      />

      <Html
        position={[FINALE_CENTER.x, FINALE_CENTER.y + LABEL_Y_OFFSET, FINALE_CENTER.z]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div ref={labelRef} className="flex flex-col items-center text-center opacity-0">
          <span className="font-display text-3xl font-extrabold tracking-wide text-brand-ink sm:text-4xl">
            SANBAZAR
          </span>
          <span className="font-mono-label mt-3 text-[11px] text-brand-muted">
            Оптовый склад сантехники
          </span>
          <span className="font-mono-label text-[11px] text-brand-muted">
            Всё для современной ванной комнаты
          </span>
        </div>
      </Html>
    </group>
  );
}

useGLTF.preload(LOGO_MODEL_URL);
