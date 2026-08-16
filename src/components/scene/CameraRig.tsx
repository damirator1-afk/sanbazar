"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { buildCameraPath, buildLookPath, buildWaypointU, stepIndexFromU } from "@/lib/categories";
import { scrollProgress } from "@/lib/scrollProgress";

export default function CameraRig() {
  const { camera } = useThree();
  const posCurve = useMemo(() => buildCameraPath(), []);
  const lookCurve = useMemo(() => buildLookPath(), []);
  // where each waypoint actually falls in getPointAt's arc-length
  // parametrization — see buildWaypointU for why this can't just be
  // assumed to be evenly spaced
  const waypointU = useMemo(() => buildWaypointU(posCurve), [posCurve]);
  const smoothed = useRef(0);
  const mouse = useRef({ x: 0, y: 0 });
  const lookTarget = useRef(new Vector3(0, 1.4, -2));
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (isTouch || reduceMotion.current) return;

    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((_, delta) => {
    const target = scrollProgress.value;
    if (reduceMotion.current) {
      smoothed.current = target;
    } else {
      const followSpeed = 1 - Math.pow(0.0001, delta);
      smoothed.current += (target - smoothed.current) * Math.min(1, followSpeed);
    }

    const u = Math.min(1, Math.max(0, smoothed.current));
    // arc-length parametrization: constant speed along the curve
    // regardless of how far apart consecutive waypoints are, which is
    // what makes the motion feel smooth rather than surging at each stop
    const pos = posCurve.getPointAt(u);
    const look = lookCurve.getPointAt(u);
    scrollProgress.cameraStep = stepIndexFromU(u, waypointU);

    const parX = reduceMotion.current ? 0 : mouse.current.x * 0.55;
    const parY = reduceMotion.current ? 0 : mouse.current.y * 0.28;

    camera.position.set(pos.x + parX, pos.y + parY, pos.z);
    // this lerp must use the same time-based (not per-frame) factor as
    // the position above — a fixed per-frame factor converges in a fixed
    // number of frames, so under a slow renderer it lags the position
    // badly (camera arrives at its spot while still looking backward)
    const lookSpeed = reduceMotion.current ? 1 : 1 - Math.pow(0.0002, delta);
    lookTarget.current.lerp(look, Math.min(1, lookSpeed));
    camera.lookAt(
      lookTarget.current.x + parX * 0.6,
      lookTarget.current.y,
      lookTarget.current.z
    );
  });

  return null;
}
