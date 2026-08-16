"use client";

import { useRef, useState } from "react";

interface IntroSplashProps {
  onFinish: () => void;
}

export default function IntroSplash({ onFinish }: IntroSplashProps) {
  const [phase, setPhase] = useState<"prompt" | "playing" | "leaving">("prompt");
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const start = () => {
    if (!ready) return; // видео ещё буферизуется — без этого клик выглядел как зависание
    setPhase("playing");
    videoRef.current?.play().catch(() => {
      // автовоспроизведение со звуком заблокировано — просто пропускаем вступление
      finish();
    });
  };

  const finish = () => {
    setPhase("leaving");
    window.setTimeout(onFinish, 500);
  };

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-brand-navy-deep transition-opacity duration-500 ${
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {phase === "prompt" && (
        <button
          type="button"
          onClick={start}
          disabled={!ready}
          data-cursor-magnetic
          className="group flex flex-col items-center gap-6 disabled:cursor-wait"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 transition-colors group-hover:border-brand-blue/60">
            {ready ? (
              <span className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-brand-ink" />
            ) : (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-brand-blue" />
            )}
          </span>
          <span className="font-mono-label text-[11px] uppercase tracking-[0.2em] text-brand-muted group-hover:text-brand-ink">
            {ready ? "Нажмите, чтобы войти" : "Загрузка…"}
          </span>
        </button>
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
          className="block max-h-[70vh] w-auto max-w-[90vw]"
          playsInline
          onCanPlayThrough={() => setReady(true)}
          onEnded={finish}
        />
      </div>

      {phase === "playing" && (
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
