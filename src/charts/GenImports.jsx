import { useMemo, useState } from "react";
import daily from "../data/daily.json";
import { useMeasure, scaleLinear, niceTicks, fmtDate, fmtNum, dayNum, yearTicks, linePath, nearestIndex } from "./utils";
import { YAxis, XAxis, ShiftMarker, Legend, TableView } from "./Frame";

const H = 360;
const M = { top: 28, right: 16, bottom: 30, left: 56 };
const SHIFT_X = dayNum("2022-07-07");

const SERIES = [
  { key: "netGenSmooth", label: "Local generation", color: "var(--c-gen)" },
  { key: "importsSmooth", label: "Imports", color: "var(--c-import)" },
];

export default function GenImports() {
  const [hover, setHover] = useState(null);
  const [ref, width] = useMeasure();
  const xs = useMemo(() => daily.dates.map(dayNum), []);

  const W = Math.max(width, 320);
  const x0 = M.left;
  const x1 = W - M.right;
  const y1 = H - M.bottom;

  const hi = Math.max(...daily.netGenSmooth, ...daily.importsSmooth);
  const sx = scaleLinear([xs[0], xs.at(-1)], [x0, x1]);
  const sy = scaleLinear([0, hi], [y1, M.top]);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    if (px < x0 || px > x1) return setHover(null);
    setHover(nearestIndex(xs, sx.invert(px)));
  };

  return (
    <div>
      <div className="mb-3">
        <Legend items={SERIES.map((s) => ({ label: s.label, color: s.color }))} />
      </div>
      <div ref={ref} className="relative">
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Local generation and imports for PACW over time: in July 2022 generation halves and imports rise to fill the gap."
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <YAxis ticks={niceTicks(0, hi, 4)} sy={sy} x0={x0} x1={x1} unit="GWh / day" />
          <XAxis ticks={yearTicks(daily.dates[0], daily.dates.at(-1), 1)} sx={sx} y={y1} />
          {SERIES.map((s) => (
            <path
              key={s.key}
              d={linePath(xs, daily[s.key], sx, sy)}
              fill="none"
              stroke={s.color}
              strokeWidth="2.25"
              strokeLinejoin="round"
            />
          ))}
          {/* direct labels at line ends */}
          {SERIES.map((s) => {
            const ys = daily[s.key];
            let last = ys.length - 1;
            while (last > 0 && ys[last] == null) last--;
            return (
              <text
                key={s.key}
                x={x1 - 4}
                y={sy(ys[last]) + (s.key === "netGenSmooth" ? 16 : -8)}
                textAnchor="end"
                fontSize="11.5"
                fontWeight="600"
                fill={s.color}
              >
                {s.label}
              </text>
            );
          })}
          <ShiftMarker x={sx(SHIFT_X)} y0={M.top - 8} y1={y1} />
          {hover != null && (
            <g aria-hidden="true">
              <line x1={sx(xs[hover])} x2={sx(xs[hover])} y1={M.top} y2={y1} stroke="hsl(var(--ink) / 0.25)" strokeWidth="1" />
              {SERIES.map((s) =>
                daily[s.key][hover] == null ? null : (
                  <circle key={s.key} cx={sx(xs[hover])} cy={sy(daily[s.key][hover])} r="4" fill={s.color} stroke="var(--chart-surface)" strokeWidth="2" />
                )
              )}
            </g>
          )}
        </svg>
        {hover != null && (
          <div
            className="chart-tooltip"
            style={{ left: `${Math.min(Math.max((sx(xs[hover]) / W) * 100, 8), 74)}%`, top: 4 }}
          >
            <div className="tt-title">{fmtDate(daily.dates[hover])}</div>
            {SERIES.map((s) => (
              <div key={s.key}>
                <span className="swatch" style={{ background: s.color }} />
                {s.label}: {fmtNum(daily[s.key][hover], 1)} GWh/day
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="mt-2 text-[0.78rem] text-[hsl(var(--muted))]">
        30-day averages. Imports are the negative side of interchange — electricity flowing into PACW.
      </p>
      <TableView
        caption="Local generation and imports, 30-day averages (GWh per day, quarterly sample)"
        head={["Date", "Local generation", "Imports"]}
        rows={daily.dates
          .map((d, i) => [d, i])
          .filter(([, i]) => i % 90 === 0)
          .map(([d, i]) => [fmtDate(d), fmtNum(daily.netGenSmooth[i], 1), fmtNum(daily.importsSmooth[i], 1)])}
      />
    </div>
  );
}
