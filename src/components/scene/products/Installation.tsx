"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Group, Mesh } from "three";

// Настоящая 3D-модель инсталляции (Tripo AI) вместо абстрактной сборки
// (плита + кнопка) — тот же пайплайн сжатия: gltf-transform (упрощение +
// meshopt), было 55 МБ, стало ~2.6 МБ.
const MODEL_URL = "/models/installation.glb";

export default function Installation() {
  const { scene } = useGLTF(MODEL_URL);
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.6;
  });

  return (
    <group ref={groupRef} scale={1.65} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
