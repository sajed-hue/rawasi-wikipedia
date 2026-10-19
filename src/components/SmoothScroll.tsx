import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * SmoothScroll — enables Lenis momentum/buttery wheel scrolling app-wide.
 *
 * Renders nothing; it only runs a client-side effect. Disabled for viewers who
 * prefer reduced motion (native scrolling is kept). Mounted once in __root.
 */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
