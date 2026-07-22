import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

/** True when the user prefers reduced motion — scenes render their final frame. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Scroll progress (0..1) through a tall track element.
 * Progress is derived purely from scroll position, so any landing point
 * (deep link, back button, reload) renders the correct frame.
 * Once progress reaches 1 the scene is "complete" and holds its final
 * frame forever — pins never re-pin on the way back up.
 */
export function useScrollProgress(ref, { once = true } = {}) {
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;
    const measure = () => {
      raf = 0;
      if (once && doneRef.current) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      const scrollable = rect.height - vh;
      let p = scrollable <= 0 ? 1 : Math.min(Math.max(-rect.top / scrollable, 0), 1);
      // quantize so sub-0.1% scroll deltas don't trigger React re-renders
      p = Math.round(p * 1000) / 1000;
      if (p >= 1 && once) doneRef.current = true;
      setProgress(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    // a tab restored mid-scene must show the right frame immediately —
    // rAF is frozen while hidden, so measure synchronously on return
    const onVisible = () => {
      if (!document.hidden) measure();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    measure();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", onVisible);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, once]);

  return progress;
}

/**
 * A pinned scene: a track `heightVh` tall whose inner viewport-sized frame
 * sticks while the reader scrolls through it. `children` is a function of
 * progress (0..1).
 *
 * Once progress hits 1 the scene is SPENT: the track collapses to a single
 * viewport (scroll position compensated in the same frame, so nothing jumps)
 * and the scene holds its final frame forever. Scrolling back over it is
 * plain document scrolling — no re-pin, no replay, no dead distance.
 *
 * Under reduced motion every scene renders spent from the start.
 */
export function PinScene({ heightVh = 300, mobileHeightVh, className = "", id, children }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const progress = useScrollProgress(ref);
  const [narrow, setNarrow] = useState(() => window.innerWidth < 768);
  const [spent, setSpent] = useState(false);
  const pendingCollapse = useRef(0);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 768);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Mark spent the moment the scene completes, remembering how much track
  // height is about to disappear.
  useLayoutEffect(() => {
    if (spent || reduced || progress < 1) return;
    const el = ref.current;
    if (el) pendingCollapse.current = el.offsetHeight - window.innerHeight;
    setSpent(true);
  }, [progress, spent, reduced]);

  // After the collapse renders, pull the viewport up by the removed height —
  // the sticky frame lands exactly where it already was. MUST be instant:
  // the page's scroll-behavior:smooth would otherwise animate this correction
  // as a visible lurch.
  useLayoutEffect(() => {
    if (spent && pendingCollapse.current > 0) {
      window.scrollBy({ top: -pendingCollapse.current, behavior: "instant" });
      pendingCollapse.current = 0;
    }
  }, [spent]);

  const done = reduced || spent;
  const h = done ? 100 : narrow && mobileHeightVh ? mobileHeightVh : heightVh;

  return (
    <section ref={ref} id={id} className={className} style={{ height: `${h}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        {children(done ? 1 : progress)}
      </div>
    </section>
  );
}

/** Map global progress into a local 0..1 phase between `from` and `to`. */
export function phase(p, from, to) {
  if (to === from) return p >= to ? 1 : 0;
  return Math.min(Math.max((p - from) / (to - from), 0), 1);
}

/** Ease for scrub-driven transforms (smoothstep). */
export function ease(t) {
  return t * t * (3 - 2 * t);
}

/* ---------------- progress rail ---------------- */

const RailContext = createContext({ setDelta: () => {} });
export const useRail = () => useContext(RailContext);

/**
 * Hairline rail down the right edge: one pip per section, lit as the reader
 * passes it. While a scene publishes a ΔT (the warming slider), the rail
 * shows a temperature readout beside the active pip.
 */
export function ProgressRail({ sections, children }) {
  const [active, setActive] = useState(0);
  const [delta, setDelta] = useState(null);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      let current = 0;
      sections.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = i;
      });
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sections]);

  return (
    <RailContext.Provider value={{ setDelta }}>
      {children}
      <div className="rail" aria-hidden="true">
        <div className="rail-line" />
        {sections.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            tabIndex={-1}
            className={`rail-pip ${i === active ? "on" : ""}`}
            title={s.label}
          >
            {i === active && delta != null && (
              <span className="rail-temp">
                {typeof delta === "string" ? delta : `+${delta.toFixed(1)}°F`}
              </span>
            )}
          </a>
        ))}
      </div>
    </RailContext.Provider>
  );
}
