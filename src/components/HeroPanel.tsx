"use client";

import { motion } from "framer-motion";
import { useScrollProgress } from "@/lib/scrollProgress";

interface HeroPanelProps {
  revealed: boolean;
}

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  shown: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function enterShowroom() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: max * 0.07, behavior: "smooth" });
}

export default function HeroPanel({ revealed }: HeroPanelProps) {
  const progress = useScrollProgress();
  // fade out over the first sliver of scroll, once the journey begins
  const fadeStart = 0.012;
  const fadeEnd = 0.055;
  const t = Math.min(1, Math.max(0, (progress - fadeStart) / (fadeEnd - fadeStart)));
  const opacity = 1 - t;
  const translate = t * -24;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[88px] bottom-14 z-20 flex items-center"
      style={{
        opacity,
        transform: `translateY(${translate}px)`,
        transition: "opacity 0.2s linear",
        // plain `items-center` can push the first headline line up behind
        // the header on shorter viewports once all the copy is stacked in —
        // "safe center" falls back to start-aligned instead of overflowing
        alignItems: "safe center",
      }}
    >
      <div className="max-w-[45%] px-6 sm:px-10 lg:max-w-[46%]">
        <motion.p
          custom={0}
          initial="hidden"
          animate={revealed ? "shown" : "hidden"}
          variants={fadeUp}
          className="font-mono-label mb-5 text-[11px] uppercase text-brand-blue-light"
        >
          — Создано для современного дома
        </motion.p>

        <motion.h1
          custom={0.12}
          initial="hidden"
          animate={revealed ? "shown" : "hidden"}
          variants={fadeUp}
          className="font-display mb-6 text-[clamp(38px,6.4vw,84px)] font-bold leading-[0.98] tracking-tight"
        >
          <span className="block text-brand-ink">Не просто</span>
          <span className="stroke-text block">сантехника.</span>
          <span className="block text-brand-ink">
            Пространство, которое вдохновляет.
          </span>
        </motion.h1>

        <motion.p
          custom={0.24}
          initial="hidden"
          animate={revealed ? "shown" : "hidden"}
          variants={fadeUp}
          className="mb-10 max-w-[380px] text-[15px] leading-relaxed text-brand-muted"
        >
          Проведите курсором по экрану. Исследуйте пространство SANBAZAR.
          Откройте коллекцию современной бытовой сантехники, созданной для
          красивого и комфортного дома.
        </motion.p>

        <motion.div
          custom={0.36}
          initial="hidden"
          animate={revealed ? "shown" : "hidden"}
          variants={fadeUp}
          className="pointer-events-auto flex flex-wrap items-center gap-10"
        >
          <ul className="flex gap-8" role="list">
            {[
              ["1000+", "товаров"],
              ["30+", "брендов"],
              ["20+", "лет опыта"],
            ].map(([value, label]) => (
              <li key={label} className="flex flex-col gap-1.5">
                <span className="font-display text-lg font-semibold text-brand-ink">
                  {value}
                </span>
                <span className="font-mono-label text-[9px] text-brand-muted">
                  {label}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={enterShowroom}
            data-cursor-magnetic
            aria-label="Войти в 3D-шоурум SANBAZAR"
            className="group flex h-[130px] w-[130px] shrink-0 flex-col items-center justify-center gap-2 rounded-full bg-brand-ink text-[#0b1422] transition-colors duration-500 ease-out hover:bg-brand-blue hover:text-white"
          >
            <span className="font-mono-label text-center text-[11px] font-medium leading-tight">
              ВОЙТИ
              <br />В SHOWROOM
            </span>
            <svg
              width="20"
              height="12"
              viewBox="0 0 22 12"
              fill="none"
              aria-hidden
              className="transition-transform duration-500 ease-out group-hover:translate-x-1"
            >
              <path
                d="M0.5 6H21M21 6L16 1M21 6L16 11"
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </svg>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
