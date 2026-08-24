"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Group, Mesh } from "three";

// Настоящая 3D-модель унитаза (Tripo AI) вместо абстрактной сборки (стена +
// кнопка смыва + чаша) — материал перекрашен в белоснежный глянцевый фарфор
// в Blender (metalness=0, низкий roughness). Тот же пайплайн сжатия:
// gltf-transform (упрощение + meshopt) + текстуры до 512px — было 56 МБ,
// стало ~2.3 МБ.
const MODEL_URL = "/models/toilet.glb";

export default function Toilet() {
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
