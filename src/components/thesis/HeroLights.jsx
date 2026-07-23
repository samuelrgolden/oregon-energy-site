import { useEffect, useRef } from "react";

/**
 * The hero's light layer: a soft white pool that follows the pointer.
 * Desktop (fine-pointer) only; elsewhere it rests as a fixed glow behind
 * the headline. Direct style writes, rAF throttled — no React re-renders
 * on mousemove.
 */
export default function HeroLights() {
  const spotRef = useRef(null);

  useEffect(() => {
    const el = spotRef.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return undefined;
    const surface = el.parentElement;
    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--sx", `${px}px`);
      el.style.setProperty("--sy", `${py}px`);
    };
    const onMove = (e) => {
      const r = surface.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    surface.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      surface.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={spotRef} className="cursor-spot pointer-events-none absolute inset-0" aria-hidden="true" />;
}
