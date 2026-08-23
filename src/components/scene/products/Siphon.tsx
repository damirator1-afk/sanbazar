"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Group, Mesh } from "three";

// Настоящая 3D-модель товара (V512-18-MR, Tripo AI) вместо абстрактной
// хромированной сборки из труб — единственный постамент в шоуруме с
// реальным сканом, остальные пока стилизованная 3D-графика. Файл лежит
// локально в public/, а не грузится из Sanity — не должен зависеть от
// того, существует ли ещё этот товар в каталоге, и не должен мигать
// незагруженным при первом рендере главной страницы.
// Сжат: gltf-transform (упрощение + meshopt) + текстуры уменьшены до
// 512px в Blender — было 57 МБ, стало ~3.5 МБ.
const MODEL_URL = "/models/siphon.glb";

export default function Siphon() {
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

  // единственный постамент с настоящим сканом вместо статичной абстрактной
  // сборки — без вращения читается как неживое фото, а не экспонат
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
