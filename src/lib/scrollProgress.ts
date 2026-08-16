"use client";

import { useEffect, useSyncExternalStore } from "react";

type Listener = (p: number) => void;

/**
 * Tiny pub/sub for the page's scroll progress (0..1).
 *
 * The R3F camera rig reads `.value` directly inside useFrame (60fps,
 * no React re-render needed). HTML overlays that only need to react
 * occasionally (active category label, hero fade) subscribe through
 * useScrollProgress() below.
 */
class ScrollProgressStore {
  value = 0;
  /**
   * The camera rig eases toward `value` over time rather than snapping to
   * it, so the camera's actual on-screen position lags behind a raw
   * scroll jump. Category labels, per-stage shadows and the finale timer
   * all need to key off where the camera *actually is* — CameraRig writes
   * a continuous "step index" here every frame (e.g. 3.4 = 40% of the
   * way from waypoint 3 to waypoint 4, see stepIndexFromU in
   * lib/categories.ts), and everything else reads `cameraStep` instead
   * of `value` so a label can't announce a product the camera hasn't
   * reached yet.
   */
  cameraStep = 0;
  private listeners = new Set<Listener>();

  set(v: number) {
    this.value = v;
    this.listeners.forEach((l) => l(v));
  }

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
}

export const scrollProgress = new ScrollProgressStore();

/** Mount once near the app root: wires the real window scroll listener. */
export function useInitScrollProgress(totalSteps: number) {
  useEffect(() => {
    let raf = 0;

    const compute = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      scrollProgress.set(p);
      raf = 0;
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [totalSteps]);
}

/** React-state view of scroll progress, for components that need to re-render. */
export function useScrollProgress(): number {
  return useSyncExternalStore(
    scrollProgress.subscribe,
    () => scrollProgress.value,
    () => 0
  );
}
