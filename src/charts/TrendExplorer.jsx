import { useMemo, useState } from "react";
import daily from "../data/daily.json";
import { useMeasure, scaleLinear, niceTicks, fmtDate, fmtNum, dayNum, yearTicks, linePath, nearestIndex } from "./utils";
import { YAxis, XAxis, ShiftMarker, TableView } from "./Frame";

const VARIABLES = [
  { key: "demand", smooth: "demandSmooth", label: "Demand", unit: "GWh / day", color: "var(--c-hydro)", digits: 1 },
  { key: "netGen", smooth: "netGenSmooth", label: "Local generation", unit: "GWh / day", color: "var(--c-wind)", digits: 1 },
  { key: "interchange", smooth: "interchangeSmooth", label: "Interchange", unit: "GWh / day", color: "var(--c-gas)", digits: 1 },
  { key: "co2", smooth: "co2Smooth", label: "CO₂ consumed", unit: "tonnes / day", color: "var(--c-coal)", digits: 0 },
];

const H = 380;
const M = { top: 28, right: 16, bottom: 30, left: 64 };
const SHIFT_X = dayNum("2022-07-07");

export default function TrendExplorer() {
  const [varKey, setVarKey] = useState("demand");
  const [hover, setHover] = useState(null);
  const [ref, width] = useMeasure();

  const v = VARIABLES.find((d) => d.key === varKey);
  const xs = useMemo(() => daily.dates.map(dayNum), []);
  const raw = daily[v.key];
  const smooth = daily[v.smooth];

  const W = Math.max(width, 320);
  const x0 = M.left;
  const x1 = W - M.right;
  const y1 = H - M.bottom;

  const vals = raw.filter((d) => d != null);
  const lo = Math.min(0, ...vals);
  const hi = Math.max(0, ...vals);
  const sx = scaleLinear([xs[0], xs[xs.length - 1]], [x0, x1]);
  const sy = scaleLinear([lo, hi], [y1, M.top]);
  const ticks = niceTicks(lo, hi, 5);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    if (px < x0 || px > x1) return setHover(null);
    setHover(nearestIndex(xs, sx.invert(px)));
  };

  // monthly table relief
  const tableRows = useMemo(() => {
    const byMonth = new Map();
    daily.dates.forEach((d, i) => {
      if (raw[i] == null) return;
      const key = d.slice(0, 7);
      const cur = byMonth.get(key) || [0, 0];
      byMonth.set(key, [cur[0] + raw[i], cur[1] + 1]);
    });
    return [...byMonth.entries()]
      .filter((_, i) => i % 3 === 0)
      .map(([m, [sum, n]]) => [fmtDate(m), fmtNum(sum / n, v.digits)]);
  }, [varKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Choose a variable">
        {VARIABLES.map((d) => (
          <button
            key={d.key}
            role="tab"
            aria-selected={varKey === d.key}
            onClick={() => setVarKey(d.key)}
            className={`lift rounded-full border px-4 py-1.5 text-sm transition-colors ${
              varKey === d.key
                ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))] text-[hsl(var(--paper))]"
                : "border-[hsl(var(--ink)/0.2)] text-[hsl(var(--ink-soft))] hover:border-[hsl(var(--accent))]"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div ref={ref} className="relative">
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Daily ${v.label} for PACW, July 2015 to October 2025, with a 30-day average line and a marker at the July 2022 shift.`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <YAxis ticks={ticks} sy={sy} x0={x0} x1={x1} unit={v.unit} />
          <XAxis ticks={yearTicks(daily.dates[0], daily.dates.at(-1), 1)} sx={sx} y={y1} />
          {lo < 0 && (
            <line x1={x0} x2={x1} y1={sy(0)} y2={sy(0)} stroke="hsl(var(--ink) / 0.3)" strokeWidth="1" />
          )}
          <path d={linePath(xs, raw, sx, sy)} fill="none" stroke={v.color} strokeWidth="1" opacity="0.28" />
          <path d={linePath(xs, smooth, sx, sy)} fill="none" stroke={v.color} strokeWidth="2.25" strokeLinejoin="round" />
          <ShiftMarker x={sx(SHIFT_X)} y0={M.top - 8} y1={y1} />
          {hover != null && smooth[hover] != null && (
            <g aria-hidden="true">
              <line x1={sx(xs[hover])} x2={sx(xs[hover])} y1={M.top} y2={y1} stroke="hsl(var(--ink) / 0.25)" strokeWidth="1" />
              <circle cx={sx(xs[hover])} cy={sy(smooth[hover])} r="4.5" fill={v.color} stroke="var(--chart-surface)" strokeWidth="2" />
            </g>
          )}
        </svg>
        {hover != null && raw[hover] != null && (
          <div
            className="chart-tooltip"
            style={{
              left: `${Math.min(Math.max((sx(xs[hover]) / W) * 100, 8), 78)}%`,
              top: 8,
            }}
          >
            <div className="tt-title">{fmtDate(daily.dates[hover])}</div>
            <div>
              <span className="swatch" style={{ background: v.color }} />
              Daily: {fmtNum(raw[hover], v.digits)} {v.unit}
            </div>
            <div className="text-[hsl(var(--muted))]">30-day avg: {fmtNum(smooth[hover], v.digits)}</div>
          </div>
        )}
      </div>
      <p className="mt-2 text-[0.78rem] text-[hsl(var(--muted))]">
        Thin line: daily values. Bold line: 30-day centered average. Hover or tap to read exact values.
      </p>
      <TableView
        caption={`Monthly average ${v.label}`}
        head={["Month (quarterly sample)", `${v.label} (${v.unit})`]}
        rows={tableRows}
      />
    </div>
  );
}
