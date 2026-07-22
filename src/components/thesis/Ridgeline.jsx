import { useMemo } from "react";
import ridgeData from "../../data/ridgeline.json";

/**
 * The hero band: ten years of 60-day-smoothed PACW demand, drawn as layered
 * ridgelines receding into mist. Each stroke is one year; winter peaks are
 * the summits. Duplicated horizontally for a seamless glacial drift loop.
 */
const VIEW_W = 1200;
const VIEW_H = 300;

export default function Ridgeline() {
  const paths = useMemo(() => {
    const ridges = ridgeData.ridges;
    const all = ridges.flatMap((r) => r.values);
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const amp = 130; // px amplitude of the tallest summit

    return ridges.map((r, i) => {
      const n = r.values.length;
      const yOff = 90 + i * 14; // deeper years sit lower
      const pts = r.values.map((v, j) => {
        const x = (j / (n - 1)) * VIEW_W;
        const y = yOff + amp - ((v - lo) / (hi - lo)) * amp;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      return {
        year: r.year,
        d: `M${pts.join(" L")}`,
        opacity: Math.max(0.24 - i * 0.018, 0.06),
      };
    });
  }, []);

  return (
    <div className="ridge-band" aria-hidden="true">
      <div className="ridge-drift flex">
        {[0, 1].map((copy) => (
          <svg
            key={copy}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            className="h-full w-1/2 shrink-0"
          >
            {paths.map((p) => (
              <path
                key={p.year}
                d={p.d}
                fill="none"
                stroke="hsl(var(--accent))"
                strokeWidth="1"
                opacity={p.opacity}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        ))}
      </div>
    </div>
  );
}
