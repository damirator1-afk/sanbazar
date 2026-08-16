"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";

interface ModelViewerProps {
  url: string;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial color="#1e6fe6" wireframe />
    </mesh>
  );
}

// Своё освещение вместо drei <Stage> — та подгружает HDRI-окружение с
// внешнего CDN (market.pmnd.rs), что даёт лишнюю задержку/точку отказа.
// <Bounds> сам вычисляет размер модели и подгоняет камеру — тоже без
// внешних зависимостей, чистая геометрия.
export default function ModelViewer({ url }: ModelViewerProps) {
  return (
    <Canvas camera={{ position: [2.5, 1.8, 2.5], fov: 40 }} dpr={[1, 2]}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 4]} intensity={1.6} />
      <directionalLight position={[-4, 2, -3]} intensity={0.6} />
      <Suspense fallback={<Loader />}>
        <Bounds fit clip observe margin={1.2}>
          <Model url={url} />
        </Bounds>
      </Suspense>
      <OrbitControls makeDefault enableZoom enablePan={false} autoRotate autoRotateSpeed={1.2} />
    </Canvas>
  );
}
