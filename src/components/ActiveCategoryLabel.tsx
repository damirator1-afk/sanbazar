"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { scrollProgress } from "@/lib/scrollProgress";

/**
 * A 3D label anchored to a point on each pedestal can end up positioned
 * off-screen depending on exactly where the camera is looking at that
 * waypoint — it's correct in 3D space but not guaranteed to be inside
 * the viewport. A fixed 2D overlay in a screen corner is always visible
 * regardless of camera framing; its *content* is driven by the same
 * cameraStep-synced "nearest category" logic, so it never announces a
 * product the camera hasn't actually reached. It's also a real link —
 * clicking it takes you into that category's own page.
 */
export default function ActiveCategoryLabel() {
  const rootRef = useRef<HTMLAnchorElement>(null);
  // opacity/position update every frame (needs to be imperative for
  // smoothness); *which* category is showing changes only a handful of
  // times per scroll, so that alone is cheap enough to be React state —
  // and state is what lets the <Link href> update correctly.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const shownIndex = useRef(-1);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const currentStep = scrollProgress.cameraStep;

      let bestIdx = 0;
      let bestDist = Infinity;
      CATEGORIES.forEach((_c, i) => {
        const d = Math.abs(currentStep - (i + 1));
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });

      const opacity = Math.max(0, 1 - bestDist / 0.85);

      if (bestIdx !== shownIndex.current && opacity > 0.01) {
        shownIndex.current = bestIdx;
        setActiveIndex(bestIdx);
      }

      if (rootRef.current) {
        rootRef.current.style.opacity = String(opacity);
        rootRef.current.style.transform = `translateY(${(1 - opacity) * 10}px)`;
        rootRef.current.style.pointerEvents = opacity > 0.4 ? "auto" : "none";
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const category = activeIndex === null ? null : CATEGORIES[activeIndex];

  return (
    <Link
      ref={rootRef}
      href={category ? `/category/${category.key}` : "#"}
      aria-label={category ? `Перейти в категорию «${category.title}»` : undefined}
      data-cursor-magnetic
      className="group pointer-events-none fixed bottom-20 right-6 z-20 w-[260px] rounded-xl border border-white/15 bg-brand-navy-deep/60 px-5 py-4 opacity-0 backdrop-blur-md transition-colors duration-300 hover:border-brand-blue/50 hover:bg-brand-navy-deep/80 sm:right-10"
      style={{ transition: "opacity 0.25s linear, background-color 0.3s, border-color 0.3s" }}
    >
      <span className="font-mono-label block text-[9px] text-brand-blue-light">
        {category ? String(activeIndex! + 1).padStart(2, "0") + " / " + String(CATEGORIES.length).padStart(2, "0") : ""}
      </span>
      <h3 className="font-display mt-1.5 text-lg font-bold text-brand-ink">{category?.title}</h3>
      <p className="mt-1 text-[12px] leading-snug text-brand-muted">{category?.tagline}</p>
      <span className="font-mono-label mt-3 flex items-center gap-1.5 text-[9px] text-brand-blue-light opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        СМОТРЕТЬ КАТЕГОРИЮ
        <svg width="12" height="8" viewBox="0 0 22 12" fill="none" aria-hidden className="translate-x-0 transition-transform duration-300 group-hover:translate-x-1">
          <path d="M0.5 6H21M21 6L16 1M21 6L16 11" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
    </Link>
  );
}
