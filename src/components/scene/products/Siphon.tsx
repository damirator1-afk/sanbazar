"use client";

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh } from "three";

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

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <group scale={0.55} position={[-0.25, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
