"use client";

import { useEffect, useRef, useState } from "react";

interface IntroSplashProps {
  onFinish: () => void;
}

export default function IntroSplash({ onFinish }: IntroSplashProps) {
  const [phase, setPhase] = useState<"buffering" | "playing" | "leaving">("buffering");
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase("leaving");
    window.setTimeout(onFinish, 500);
  };

  useEffect(() => {
    // reduced-motion users get straight to the site — no intro to sit through
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-brand-navy-deep transition-opacity duration-500 ${
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {phase === "buffering" && (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-brand-blue" />
      )}

      <div
        className={`overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-opacity duration-300 ${
          phase === "playing" ? "opacity-100" : "pointer-events-none absolute opacity-0"
        }`}
      >
        <video
          ref={videoRef}
          src="/logo-animation.mp4"
          preload="auto"
          muted
          autoPlay
          className="block max-h-[70vh] w-auto max-w-[90vw]"
          playsInline
          onCanPlayThrough={() => setPhase("playing")}
          onEnded={finish}
          onError={finish}
        />
      </div>

      {phase !== "leaving" && (
        <button
          type="button"
          onClick={finish}
          className="font-mono-label absolute bottom-10 right-6 text-[11px] uppercase text-brand-muted transition-colors hover:text-brand-ink sm:right-10"
        >
          Пропустить →
        </button>
      )}
    </div>
  );
}
