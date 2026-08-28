"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, SpotLight } from "three";
import { Category } from "@/lib/categories";
import { scrollProgress } from "@/lib/scrollProgress";
import Pedestal, { PEDESTAL_HEIGHT } from "./Pedestal";
import { PRODUCT_COMPONENTS } from "./products";

interface ProductStageProps {
  category: Category;
  allowShadow: boolean;
}

export default function ProductStage({ category, allowShadow }: ProductStageProps) {
  const ProductModel = PRODUCT_COMPONENTS[category.key];
  const lightRef = useRef<SpotLight>(null);
  const targetRef = useRef<Object3D>(null);
  const myStep = category.index + 1;
  const wasNear = useRef(false);

  // THREE.SpotLight aims at `target`, which defaults to an orphan
  // Object3D sitting at world (0,0,0) — every stage's light would end
  // up aiming at the world origin instead of the product underneath it
  // unless we give it a real, properly-parented target to point at.
  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  }, []);

  // Ten simultaneous shadow-casting spotlights is a lot of shadow-map
  // passes for very little visual gain — only the stage the camera is
  // actually near needs one. Everything else stays lit without shadows.
  // Threshold must be <= half the 1.0 step spacing between products,
  // or two neighbouring stages both read "near" at once near the
  // midpoint -- each castShadow flip allocates/frees a shadow-map
  // render target, so overlapping thresholds meant that happened on
  // 2-3 lights at once instead of a single clean handoff, causing a
  // frame hitch right around each product while scrolling.
  useFrame(() => {
    const light = lightRef.current;
    if (!light) return;
    const currentStep = scrollProgress.cameraStep;
    const isNear = allowShadow && Math.abs(currentStep - myStep) < 0.5;
    if (isNear !== wasNear.current) {
      wasNear.current = isNear;
      light.castShadow = isNear;
    }
  });

  return (
    <group position={category.position}>
      <Pedestal />
      <group position={[0, PEDESTAL_HEIGHT, 0]}>
        <ProductModel />
      </group>
      <object3D ref={targetRef} position={[0, PEDESTAL_HEIGHT + 0.3, 0]} />
      <spotLight
        ref={lightRef}
        position={[1.2, 3.4, 1.8]}
        angle={0.6}
        penumbra={0.7}
        intensity={58}
        distance={12}
        color="#eef2ff"
      />
      {/* low, soft fill so the side of the product away from the spot
          isn't a silhouette — a single hard key light reads as underlit */}
      <pointLight position={[-1.6, 1.6, 1.6]} intensity={6} distance={6} color="#8fb4ff" />
    </group>
  );
}
