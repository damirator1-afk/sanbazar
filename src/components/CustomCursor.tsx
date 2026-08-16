"use client";

import { useEffect, useRef } from "react";

/**
 * Custom cursor: a small blue dot inside a thin ring. The ring eases
 * toward the pointer and, when hovering anything tagged
 * data-cursor-magnetic, gets pulled toward that element's center and
 * grows — a lightweight magnetic-button feel without a physics lib.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isFine) return;

    document.body.classList.add("has-custom-cursor");

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;
    let magnetTarget: { x: number; y: number } | null = null;
    let active = false;

    const onMove = (e: MouseEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pointerX}px, ${pointerY}px) translate(-50%, -50%)`;
      }
    };

    const findMagnetic = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof Element)) return null;
      return target.closest<HTMLElement>("[data-cursor-magnetic]");
    };

    const onOver = (e: MouseEvent) => {
      const el = findMagnetic(e.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        magnetTarget = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        active = true;
        ringRef.current?.classList.add("cursor-ring--active");
      } else {
        magnetTarget = null;
        active = false;
        ringRef.current?.classList.remove("cursor-ring--active");
      }
    };

    let raf = 0;
    const animate = () => {
      const toX = magnetTarget ? pointerX + (magnetTarget.x - pointerX) * 0.5 : pointerX;
      const toY = magnetTarget ? pointerY + (magnetTarget.y - pointerY) * 0.5 : pointerY;
      ringX += (toX - ringX) * (active ? 0.22 : 0.18);
      ringY += (toY - ringY) * (active ? 0.22 : 0.18);
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf);
      document.body.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[90] h-1.5 w-1.5 rounded-full bg-brand-blue opacity-0 [.has-custom-cursor_&]:opacity-100"
      />
      <div
        ref={ringRef}
        aria-hidden
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[90] h-8 w-8 rounded-full border border-brand-blue/50 opacity-0 transition-[width,height,border-color,background-color] duration-300 ease-out [.has-custom-cursor_&]:opacity-100"
      />
    </>
  );
}
