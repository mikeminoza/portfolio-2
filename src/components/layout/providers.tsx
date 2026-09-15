"use client";

import { useEffect, useRef } from "react";
import { ThemeProvider } from "next-themes";
import { ReactLenis, type LenisRef } from "lenis/react";
import { useReducedMotion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Drives Lenis from GSAP's ticker instead of its own RAF loop, so smooth
 * scroll and ScrollTrigger share one clock and never fight each other.
 */
function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    const lenis = lenisRef.current?.lenis;
    lenis?.on("scroll", ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(update);
      lenis?.off("scroll", ScrollTrigger.update);
    };
  }, [reduced]);

  // Reduced motion gets native scrolling, no interception at all.
  if (reduced) return <>{children}</>;

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{ autoRaf: false, duration: 1.1, smoothWheel: true }}
    >
      {children}
    </ReactLenis>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    /*
     * Dark is the design's home state, so it is the default rather than the
     * OS preference. `enableSystem` has to be off for that to hold: left on,
     * the system preference wins and `defaultTheme` only applies when none
     * can be read. The toggle still switches and still persists per visitor.
     */
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <SmoothScroll>{children}</SmoothScroll>
    </ThemeProvider>
  );
}
