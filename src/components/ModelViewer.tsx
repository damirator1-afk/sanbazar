"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

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
      <meshStandardMaterial color="#e2993f" wireframe />
    </mesh>
  );
}

// Своё освещение вместо drei <Stage> — та подгружает HDRI-окружение с
// внешнего CDN (market.pmnd.rs), что даёт лишнюю задержку/точку отказа.
// <Bounds> сам вычисляет размер модели и подгоняет камеру — тоже без
// внешних зависимостей, чистая геометрия.
export default function ModelViewer({ url }: ModelViewerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  // autoRotate конфликтовало с ручным вращением — three.js продолжает
  // крутить камеру сам по себе, даже когда пользователь тащит мышкой, и
  // оба движения складываются рывками. Останавливаем авто-вращение на
  // время взаимодействия через onStart/onEnd.
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <Canvas camera={{ position: [2.5, 1.8, 2.5], fov: 40, near: 0.01, far: 100 }} dpr={[1, 2]}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 4]} intensity={1.6} />
      <directionalLight position={[-4, 2, -3]} intensity={0.6} />
      <Suspense fallback={<Loader />}>
        {/* без observe: c ним <Bounds> периодически пересчитывает и сам
            подруливает камеру поверх OrbitControls — тоже давало рывки.
            без clip: оно один раз подгоняет near/far под дистанцию камеры
            на момент загрузки, а после ручного зума (enableZoom) камера
            может оказаться ближе/дальше этих зафиксированных плоскостей —
            часть модели обрезается, выглядит как рывок. Статичные near/far
            на Canvas с запасом работают для любого размера модели. */}
        <Bounds fit margin={1.2}>
          <Model url={url} />
        </Bounds>
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableZoom
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
        onStart={() => setAutoRotate(false)}
        onEnd={() => setAutoRotate(true)}
      />
    </Canvas>
  );
}
