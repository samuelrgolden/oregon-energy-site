import { useMemo, useState } from "react";
import fuel from "../data/fuel.json";
import { useMeasure, scaleLinear, niceTicks, fmtDate, fmtNum, dayNum, yearTicks } from "./utils";
import { YAxis, XAxis, ShiftMarker, Legend, TableView } from "./Frame";

const SERIES = [
  { key: "coal", label: "Coal", color: "var(--c-coal)" },
  { key: "gas", label: "Natural gas", color: "var(--c-gas)" },
  { key: "hydro", label: "Hydro", color: "var(--c-hydro)" },
  { key: "wind", label: "Wind", color: "var(--c-wind)" },
  { key: "solar", label: "Solar", color: "var(--c-solar)" },
];

const H = 360;
const M = { top: 28, right: 16, bottom: 30, left: 56 };
const SHIFT_X = dayNum("2022-07-07");

export default function FuelBars() {
  const [hover, setHover] = useState(null);
  const [ref, width] = useMeasure();

  const xs = useMemo(() => fuel.months.map((m) => dayNum(m)), []);
  const totals = fuel.months.map((_, i) =>
    SERIES.reduce((acc, s) => acc + (fuel[s.key][i] ?? 0), 0)
  );

  const W = Math.max(width, 320);
  const x0 = M.left;
  const x1 = W - M.right;
  const y1 = H - M.bottom;
  const hi = Math.max(...totals);

  const sx = scaleLinear([xs[0], xs.at(-1)], [x0 + 8, x1 - 8]);
  const sy = scaleLinear([0, hi], [y1, M.top]);
  const barW = Math.max(((x1 - x0) / fuel.months.length) * 0.66, 2.5);

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
          aria-label="Monthly average generation by fuel for PACW from July 2018: coal drops to zero in July 2022 while hydro, gas, wind, and solar continue."
          onPointerLeave={() => setHover(null)}
        >
          <YAxis ticks={niceTicks(0, hi, 4)} sy={sy} x0={x0} x1={x1} unit="GWh / day" />
          <XAxis ticks={yearTicks(fuel.months[0], fuel.months.at(-1), 1)} sx={sx} y={y1} />
          {fuel.months.map((m, i) => {
            let y = y1;
            return (
              <g
                key={m}
                onPointerEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
              >
                {/* hit target wider than the mark */}
                <rect
                  x={sx(xs[i]) - barW}
                  width={barW * 2}
                  y={M.top}
                  height={y1 - M.top}
                  fill="transparent"
                />
                {SERIES.map((s) => {
                  const v = fuel[s.key][i];
                  if (!v) return null;
                  const h = y1 - sy(v);
                  y -= h;
                  return (
                    <rect
                      key={s.key}
                      x={sx(xs[i]) - barW / 2}
                      y={y}
                      width={barW}
                      height={Math.max(h - 1, 0.5)} /* 1px gap between segments */
                      fill={s.color}
                      opacity={hover == null || hover === i ? 1 : 0.45}
                    />
                  );
                })}
              </g>
            );
          })}
          <ShiftMarker x={sx(SHIFT_X)} y0={M.top - 8} y1={y1} />
        </svg>
        {hover != null && (
          <div
            className="chart-tooltip"
            style={{ left: `${Math.min(Math.max((sx(xs[hover]) / W) * 100, 8), 72)}%`, top: 4 }}
          >
            <div className="tt-title">{fmtDate(fuel.months[hover])}</div>
            {SERIES.map((s) => (
              <div key={s.key}>
                <span className="swatch" style={{ background: s.color }} />
                {s.label}: {fmtNum(fuel[s.key][hover] ?? 0, 1)} GWh/day
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="mt-2 text-[0.78rem] text-[hsl(var(--muted))]">
        EIA-930 began reporting fuel-level generation in July 2018, so this chart starts there.
      </p>
      <TableView
        caption="Monthly average generation by fuel (GWh per day)"
        head={["Month", ...SERIES.map((s) => s.label)]}
        rows={fuel.months.map((m, i) => [
          fmtDate(m),
          ...SERIES.map((s) => fmtNum(fuel[s.key][i] ?? 0, 1)),
        ])}
      />
    </div>
  );
}
