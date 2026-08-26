"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

// cursor-droplet.png is just the drop+faucet mark (white disc background
// removed, see below) cropped tight to its silhouette — its peak sits at
// ~50%/1% of the image, so top-center is the hotspot. Aspect ratio 332:470.
// at 30px the thin white swirl stroke in the artwork was only ~1px wide
// after downscaling and washed into the neighbouring blue -- 42px gives
// it enough physical pixels to read as white
const CURSOR_WIDTH = 42;
const CURSOR_HEIGHT = Math.round((CURSOR_WIDTH * 470) / 332);
const ACTIVE_SCALE = 1.35;
// tilt like a standard arrow cursor: tip stays put, body leans to the
// lower-right (rotation happens around the tip via the origin-top class).
// Negative because CSS rotate() is clockwise, and clockwise from
// straight-down swings the body left, not right.
const TILT_DEG = -20;

/**
 * Custom cursor: the SanBazar droplet logo, tip pointing up like a normal
 * pointer. Eases toward the pointer and, when hovering anything tagged
 * data-cursor-magnetic, gets pulled toward that element's center and grows.
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
      scale += ((active ? ACTIVE_SCALE : 1) - scale) * 0.25;
      if (cursorRef.current) {
        // top-center of the image (the droplet's tip) is the hotspot
        cursorRef.current.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, 0%) rotate(${TILT_DEG}deg) scale(${scale})`;
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
      style={{ width: CURSOR_WIDTH, height: CURSOR_HEIGHT }}
    >
      <Image
        src="/cursor-droplet.png"
        alt=""
        fill
        // requesting well past the visual box (~30-40px, incl. the hover
        // grow) on purpose: at DPR 1 Next would otherwise serve a source
        // this small, and the thin white swirl stroke in the artwork
        // washes into the surrounding blue once downscaled that far
        sizes="120px"
        quality={90}
        className="object-contain drop-shadow-[0_0_10px_rgba(30,111,230,0.5)]"
        priority
      />
    </div>
  );
}
