import { useMemo, useState } from "react";
import fuel from "../data/fuel.json";
import { useMeasure, scaleLinear, niceTicks, fmtDate, fmtNum, dayNum, nearestIndex } from "./utils";
import { YAxis, Legend, TableView } from "./Frame";

const SERIES = [
  { key: "hydro", label: "Hydro", color: "var(--c-hydro)" },
  { key: "wind", label: "Wind", color: "var(--c-wind)" },
  { key: "solar", label: "Solar", color: "var(--c-solar)" },
];

const H = 320;
const M = { top: 24, right: 16, bottom: 30, left: 56 };
const N_MONTHS = 24;

export default function TodayMix() {
  const [hover, setHover] = useState(null);
  const [ref, width] = useMeasure();

  const months = fuel.months.slice(-N_MONTHS);
  const xs = useMemo(() => months.map(dayNum), []); // eslint-disable-line react-hooks/exhaustive-deps
  const series = SERIES.map((s) => fuel[s.key].slice(-N_MONTHS).map((v) => v ?? 0));

  // stacked cumulative sums
  const stacked = series.reduce((acc, ys) => {
    const prev = acc.at(-1) ?? ys.map(() => 0);
    acc.push(ys.map((v, i) => prev[i] + v));
    return acc;
  }, []);

  const W = Math.max(width, 320);
  const x0 = M.left;
  const x1 = W - M.right;
  const y1 = H - M.bottom;
  const hi = Math.max(...stacked.at(-1));

  const sx = scaleLinear([xs[0], xs.at(-1)], [x0, x1]);
  const sy = scaleLinear([0, hi], [y1, M.top]);

  const areaPath = (lower, upper) => {
    const top = upper.map((v, i) => `${sx(xs[i]).toFixed(1)},${sy(v).toFixed(1)}`);
    const bot = lower.map((v, i) => `${sx(xs[i]).toFixed(1)},${sy(v).toFixed(1)}`).reverse();
    return `M${top.join(" L")} L${bot.join(" L")} Z`;
  };

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
          aria-label={`Local generation mix for the last ${N_MONTHS} months: hydro largest, then wind, then solar, all with strong seasonal swings.`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <YAxis ticks={niceTicks(0, hi, 4)} sy={sy} x0={x0} x1={x1} unit="GWh / day" />
          {xs
            .map((x, i) => ({ x, label: fmtDate(months[i]).replace(" 20", " ’") }))
            .filter((_, i) => i % 4 === 0)
            .map((t) => (
              <text key={t.label} x={sx(t.x)} y={y1 + 18} textAnchor="middle" fontSize="11" fill="hsl(var(--muted))" aria-hidden="true">
                {t.label}
              </text>
            ))}
          {SERIES.map((s, si) => (
            <path
              key={s.key}
              d={areaPath(si === 0 ? xs.map(() => 0) : stacked[si - 1], stacked[si])}
              fill={s.color}
              opacity="0.75"
              stroke="var(--chart-surface)"
              strokeWidth="1.5"
            />
          ))}
          {hover != null && (
            <line x1={sx(xs[hover])} x2={sx(xs[hover])} y1={M.top} y2={y1} stroke="hsl(var(--ink) / 0.3)" strokeWidth="1" aria-hidden="true" />
          )}
        </svg>
        {hover != null && (
          <div
            className="chart-tooltip"
            style={{ left: `${Math.min(Math.max((sx(xs[hover]) / W) * 100, 8), 70)}%`, top: 4 }}
          >
            <div className="tt-title">{fmtDate(months[hover])}</div>
            {SERIES.map((s, si) => (
              <div key={s.key}>
                <span className="swatch" style={{ background: s.color }} />
                {s.label}: {fmtNum(series[si][hover], 1)} GWh/day
              </div>
            ))}
          </div>
        )}
      </div>
      <TableView
        caption="Local generation mix, monthly averages (GWh per day)"
        head={["Month", ...SERIES.map((s) => s.label)]}
        rows={months.map((m, i) => [fmtDate(m), ...SERIES.map((_, si) => fmtNum(series[si][i], 1))])}
      />
    </div>
  );
}
