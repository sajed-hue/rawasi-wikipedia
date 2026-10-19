import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Reveal — a lightweight scroll-reveal wrapper (no animation library).
 *
 * Children start slightly offset + transparent and ease into place when the
 * element scrolls into view, via IntersectionObserver. Use `delay` to stagger
 * items in a list, `y` to tune the slide distance, and `once` to re-animate on
 * every entry (default: animate a single time).
 *
 * Accessibility: when the viewer prefers reduced motion, content shows
 * immediately with no transform or transition. SSR-safe: the observer only runs
 * in the browser, and the text is always present in the DOM for crawlers.
 */
export interface RevealProps {
  children: ReactNode;
  /** Extra classes on the wrapper (e.g. layout/height). */
  className?: string;
  /** Stagger delay in milliseconds. */
  delay?: number;
  /** Vertical slide distance in pixels (default 24). */
  y?: number;
  /** Animate only the first time it enters the viewport (default true). */
  once?: boolean;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Reveal({ children, className = "", delay = 0, y = 24, once = true }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show immediately when motion is reduced or the observer is unavailable.
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [once]);

  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : `translateY(${y}px)`,
    transitionDelay: visible ? `${delay}ms` : "0ms",
  };

  return (
    <div
      ref={ref}
      style={style}
      className={`transition-all duration-700 ease-out will-change-[opacity,transform] motion-reduce:transition-none ${className}`}
    >
      {children}
    </div>
  );
}
