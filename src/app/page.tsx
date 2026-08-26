"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Preloader from "@/components/Preloader";
import IntroSplash from "@/components/IntroSplash";
import Header from "@/components/Header";
import HeroPanel from "@/components/HeroPanel";
import ActiveCategoryLabel from "@/components/ActiveCategoryLabel";
import Footer from "@/components/Footer";
import { TOTAL_STEPS } from "@/lib/categories";
import { useInitScrollProgress } from "@/lib/scrollProgress";

// the 3D scene touches window/WebGL — keep it client-only, no SSR
const SceneCanvas = dynamic(() => import("@/components/scene/SceneCanvas"), {
  ssr: false,
});

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useInitScrollProgress(TOTAL_STEPS);

  const reveal = () => {
    setLoading(false);
    requestAnimationFrame(() => setRevealed(true));
  };

  return (
    <>
      {loading && (
        <Preloader
          onDone={() => {
            const seen = typeof window !== "undefined" && localStorage.getItem("sanbazar-intro-seen");
            if (seen) {
              reveal();
            } else {
              setShowIntro(true);
            }
          }}
        />
      )}

      {showIntro && (
        <IntroSplash
          onFinish={() => {
            localStorage.setItem("sanbazar-intro-seen", "1");
            setShowIntro(false);
            reveal();
          }}
        />
      )}

      <Header />
      <SceneCanvas />
      {/* the 3D camera can put bright product/pedestal geometry anywhere
          behind the text column as it moves — without a scrim, legibility
          depends on where the camera happens to be pointed at any given
          scroll position, which isn't reliable */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,10,18,0.88) 0%, rgba(5,10,18,0.6) 32%, rgba(5,10,18,0.05) 55%, rgba(5,10,18,0) 68%)",
        }}
        aria-hidden
      />
      <HeroPanel revealed={revealed} />
      <ActiveCategoryLabel />
      <Footer />

      {/* scroll spacer — the only in-flow element; its height is what
          gives the page something to scroll through while the header,
          hero copy, canvas and footer stay fixed on top of it */}
      <div style={{ height: `${TOTAL_STEPS * 100}vh` }} aria-hidden />
    </>
  );
}
