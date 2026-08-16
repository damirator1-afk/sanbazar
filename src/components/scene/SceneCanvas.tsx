"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment as Hdri, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { CATEGORIES } from "@/lib/categories";
import CameraRig from "./CameraRig";
import Environment from "./Environment";
import ProductStage from "./ProductStage";
import FinaleLogo from "./FinaleLogo";

// this component is loaded with next/dynamic ssr:false, so it only ever
// mounts in the browser — reading window here is safe, and doing it as
// a lazy initial state (rather than an effect) avoids an extra render.
function detectHeavyFx() {
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const smallScreen = window.innerWidth < 760;
  return !isTouch && !reduceMotion && !smallScreen;
}

export default function SceneCanvas() {
  const [heavyFx] = useState(detectHeavyFx);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        shadows={heavyFx}
        dpr={[1, heavyFx ? 2 : 1.4]}
        gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.75 }}
        camera={{ position: [0, 2.5, 6], fov: 45, near: 0.1, far: 220 }}
      >
        <color attach="background" args={["#050b12"]} />
        <fogExp2 attach="fog" args={["#060d16", 0.011]} />

        <ambientLight intensity={1.05} color="#c3d0ff" />
        <directionalLight
          position={[6, 10, 4]}
          intensity={1.45}
          color="#f0f4ff"
          castShadow={heavyFx}
          shadow-mapSize={[512, 512]}
        />
        <pointLight position={[0, 6, -4]} intensity={16} color="#1e6fe6" distance={24} />
        {/* metals with metalness≈1 have almost no diffuse response — without
            something to reflect they read as flat black under point lights.
            Built from local Lightformer panels (no network HDR fetch) so
            there's nothing async to race against on mount/resize. */}
        <Hdri resolution={heavyFx ? 256 : 128} background={false}>
          <Lightformer intensity={3.5} color="#c3d3ff" position={[0, 6, -2]} scale={[12, 6, 1]} />
          <Lightformer intensity={2.4} color="#ffffff" position={[-6, 3, 5]} scale={[6, 5, 1]} />
          <Lightformer
            intensity={2.8}
            color="#4a92ff"
            position={[6, 2, 5]}
            rotation={[0, Math.PI / 3, 0]}
            scale={[6, 5, 1]}
          />
        </Hdri>

        <CameraRig />
        <Environment />

        <Suspense fallback={null}>
          {CATEGORIES.map((category) => (
            <ProductStage key={category.key} category={category} allowShadow={heavyFx} />
          ))}
          <FinaleLogo />
        </Suspense>

        {heavyFx && (
          <EffectComposer multisampling={4}>
            {/* DepthOfField deliberately dropped: this camera sits at a
                different distance from its product at every scroll step,
                and a single focusDistance can't track that — it was
                blurring the products themselves rather than the background */}
            <Bloom intensity={0.3} luminanceThreshold={0.62} luminanceSmoothing={0.2} />
            <Vignette eskil={false} offset={0.32} darkness={0.42} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
