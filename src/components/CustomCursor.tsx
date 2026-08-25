"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const CURSOR_SIZE = 34;
const CURSOR_SIZE_ACTIVE = 46;

/**
 * Custom cursor: the SanBazar droplet logo, tip pointing up-left like a
 * normal pointer. logo-icon.png is cropped tight — its peak touches the
 * very top edge, centered horizontally — so that point (top-center of the
 * image) is what tracks the real pointer position. Eases toward the
 * pointer and, when hovering anything tagged data-cursor-magnetic, gets
 * pulled toward that element's center and grows.
 */
export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isFine) return;

    document.body.classList.add("has-custom-cursor");

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let cursorX = pointerX;
    let cursorY = pointerY;
    let scale = 1;
    let magnetTarget: { x: number; y: number } | null = null;
    let active = false;

    const onMove = (e: MouseEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
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
      } else {
        magnetTarget = null;
        active = false;
      }
    };

    let raf = 0;
    const animate = () => {
      const toX = magnetTarget ? pointerX + (magnetTarget.x - pointerX) * 0.5 : pointerX;
      const toY = magnetTarget ? pointerY + (magnetTarget.y - pointerY) * 0.5 : pointerY;
      cursorX += (toX - cursorX) * (active ? 0.28 : 0.22);
      cursorY += (toY - cursorY) * (active ? 0.28 : 0.22);
      scale += ((active ? CURSOR_SIZE_ACTIVE / CURSOR_SIZE : 1) - scale) * 0.25;
      if (cursorRef.current) {
        // top-center of the image (the droplet's tip) is the hotspot
        cursorRef.current.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, 0%) scale(${scale})`;
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
    <div
      ref={cursorRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] origin-top opacity-0 [.has-custom-cursor_&]:opacity-100"
      style={{ width: CURSOR_SIZE, height: CURSOR_SIZE }}
    >
      <Image
        src="/logo-icon.png"
        alt=""
        fill
        sizes={`${CURSOR_SIZE_ACTIVE}px`}
        className="object-contain drop-shadow-[0_0_10px_rgba(30,111,230,0.5)]"
        priority
      />
    </div>
  );
}
