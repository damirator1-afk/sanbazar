"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface PreloaderProps {
  onDone: () => void;
}

export default function Preloader({ onDone }: PreloaderProps) {
  const [percent, setPercent] = useState(0);
  const [hidden, setHidden] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const minDuration = reduceMotion ? 200 : 1500;
    const start = performance.now();
    let raf = 0;

    // gate on real signals (fonts ready) blended with a floor duration,
    // so the bar reflects genuine readiness rather than a pure fake timer
    let fontsReady = false;
    document.fonts.ready.then(() => {
      fontsReady = true;
    });

    const tick = (now: number) => {
      const elapsed = now - start;
      const timeRatio = Math.min(1, elapsed / minDuration);
      const target = Math.min(
        fontsReady ? 100 : 92,
        Math.floor(timeRatio * 100 + Math.random() * 2.5)
      );
      setPercent((p) => Math.max(p, target));

      if (timeRatio >= 1 && fontsReady) {
        setPercent(100);
        if (!doneRef.current) {
          doneRef.current = true;
          setTimeout(() => {
            setHidden(true);
            setTimeout(onDone, 700);
          }, 260);
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-brand-navy-deep transition-opacity duration-700 ease-out ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex w-64 flex-col items-center gap-6">
        <div
          className={`h-24 w-24 transition-opacity duration-[1400ms] ${
            hidden ? "opacity-0" : "animate-pulse opacity-90"
          }`}
        >
          <Image
            src="/logo-icon.png"
            alt=""
            width={192}
            height={192}
            priority
            className="h-full w-full object-contain"
          />
        </div>

        <div className="h-px w-full overflow-hidden bg-white/10">
          <div
            className="h-full bg-brand-blue shadow-[0_0_10px_rgba(30,111,230,0.8)] transition-[width] duration-150"
            style={{ width: `${percent}%` }}
          />
        </div>

        <span className="font-mono-label text-[11px] tabular-nums text-brand-muted">
          {String(percent).padStart(3, "0")}%
        </span>
      </div>
    </div>
  );
}
