import { useEffect, useRef } from "react";

/**
 * The hero's two light layers:
 *  1. A static spotlight beam (Aceternity-style) that sweeps in once on
 *     load from the upper left and holds — an entrance, not a loop.
 *  2. A cursor-following pool of light: a soft radial glow that drifts
 *     with the pointer. Desktop (fine-pointer) only; elsewhere it rests
 *     as a fixed glow behind the headline. Direct style writes, rAF
 *     throttled — no React re-renders on mousemove.
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

  return (
    <>
      {/* entrance beam — geometry from Aceternity's Spotlight */}
      <svg
        className="animate-spotlight pointer-events-none absolute -top-40 left-0 h-[169%] w-[138%] opacity-0 md:-top-20 md:left-60 md:w-[84%]"
        viewBox="0 0 3787 2842"
        fill="none"
        aria-hidden="true"
      >
        <g filter="url(#hero-spot-blur)">
          <ellipse
            cx="1924.71"
            cy="273.501"
            rx="1924.71"
            ry="273.501"
            transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
            fill="hsl(145 55% 82%)"
            fillOpacity="0.21"
          />
        </g>
        <defs>
          <filter
            id="hero-spot-blur"
            x="0.860352"
            y="0.838989"
            width="3785.16"
            height="2840.26"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur" />
          </filter>
        </defs>
      </svg>

      {/* cursor-following light */}
      <div ref={spotRef} className="cursor-spot pointer-events-none absolute inset-0" aria-hidden="true" />
    </>
  );
}
