import { useEffect, useRef, useState } from "react";

/**
 * CountUp — animates a number from its current value up to `value` when the
 * element first scrolls into view, then re-animates smoothly whenever `value`
 * changes (e.g. live stats climbing). Append a `suffix` such as "+".
 *
 * Accessibility: viewers who prefer reduced motion see the final value with no
 * animation. SSR-safe: renders 0 on the server, animates after hydration.
 */
export interface CountUpProps {
  value: number;
  /** Animation length in milliseconds. */
  durationMs?: number;
  /** Text appended after the number, e.g. "+". */
  suffix?: string;
  className?: string;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function CountUp({ value, durationMs = 1200, suffix = "", className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const [inView, setInView] = useState(false);
  const displayRef = useRef(0);
  displayRef.current = display;

  // Start once the number scrolls into view.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Animate from the current display value to the target (easeOutCubic).
  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    const from = displayRef.current;
    if (from === value) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}
