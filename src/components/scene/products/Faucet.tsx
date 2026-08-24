"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Group, Mesh } from "three";

// Настоящая 3D-модель смесителя (Tripo AI) вместо абстрактной хромированной
// сборки из труб — родной материал перекрашен в хром в Blender (metalness=1,
// roughness низкий), т.к. исходный материал из Tripo был матовым бежевым.
// Тот же пайплайн сжатия, что и у сифона: gltf-transform (упрощение + meshopt)
// + текстуры уменьшены до 512px — было 61 МБ, стало ~5.6 МБ.
const MODEL_URL = "/models/faucet.glb";

export default function Faucet() {
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
    <group ref={groupRef} scale={1.65} position={[-0.115, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
