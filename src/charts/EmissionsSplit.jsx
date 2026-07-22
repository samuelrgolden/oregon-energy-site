import { useMemo, useState } from "react";
import emissions from "../data/emissions.json";
import stats from "../data/stats.json";
import { useMeasure, scaleLinear, niceTicks, fmtDate, fmtNum, dayNum, yearTicks, nearestIndex } from "./utils";
import { YAxis, XAxis, ShiftMarker, Legend, TableView } from "./Frame";

const H = 380;
const M = { top: 28, right: 16, bottom: 30, left: 64 };
const SHIFT_X = dayNum(stats.shiftDate);

export default function EmissionsSplit() {
  const [hover, setHover] = useState(null);
  const [ref, width] = useMeasure();
  const xs = useMemo(() => emissions.months.map(dayNum), []);

  const W = Math.max(width, 320);
  const x0 = M.left;
  const x1 = W - M.right;
  const y1 = H - M.bottom;

  const hi = Math.max(...emissions.co2);
  const sx = scaleLinear([xs[0], xs.at(-1)], [x0, x1]);
  const sy = scaleLinear([0, hi], [y1, M.top]);

  // split the series at the shift so before/after wear different colors
  const splitIdx = xs.findIndex((x) => x >= SHIFT_X);
  const seg = (from, to, color, label) => {
    const pts = [];
    for (let i = from; i < to; i++) pts.push(`${sx(xs[i]).toFixed(1)},${sy(emissions.co2[i]).toFixed(1)}`);
    const area = `M${sx(xs[from]).toFixed(1)},${y1} L${pts.join(" L")} L${sx(xs[to - 1]).toFixed(1)},${y1} Z`;
    return { line: `M${pts.join(" L")}`, area, color, label };
  };
  const segments = [
    seg(0, splitIdx, "var(--c-before)", "Before"),
    seg(splitIdx - 1, emissions.co2.length, "var(--c-after)", "After"),
  ];

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    if (px < x0 || px > x1) return setHover(null);
    setHover(nearestIndex(xs, sx.invert(px)));
  };

  return (
    <div>
      <div className="mb-3">
        <Legend
          items={[
            { label: "Before the transfer", color: "var(--c-before)" },
            { label: "After the transfer", color: "var(--c-after)" },
          ]}
        />
      </div>
      <div ref={ref} className="relative">
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Monthly average CO2 consumed by PACW: roughly 19,500 tonnes per day before July 2022, roughly 7,300 after — a 63 percent drop on the books."
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <YAxis ticks={niceTicks(0, hi, 4)} sy={sy} x0={x0} x1={x1} unit="tonnes CO₂ / day" />
          <XAxis ticks={yearTicks(emissions.months[0], emissions.months.at(-1), 1)} sx={sx} y={y1} />
          {segments.map((s) => (
            <g key={s.label}>
              <path d={s.area} fill={s.color} opacity="0.14" />
              <path d={s.line} fill="none" stroke={s.color} strokeWidth="2.25" strokeLinejoin="round" />
            </g>
          ))}
          {/* pre/post average guides */}
          <line x1={x0} x2={sx(SHIFT_X)} y1={sy(stats.preShift.avgCo2)} y2={sy(stats.preShift.avgCo2)} stroke="var(--c-before)" strokeWidth="1" strokeDasharray="2 4" />
          <line x1={sx(SHIFT_X)} x2={x1} y1={sy(stats.postShift.avgCo2)} y2={sy(stats.postShift.avgCo2)} stroke="var(--c-after)" strokeWidth="1" strokeDasharray="2 4" />
          <ShiftMarker x={sx(SHIFT_X)} y0={M.top - 8} y1={y1} />
          {hover != null && (
            <g aria-hidden="true">
              <line x1={sx(xs[hover])} x2={sx(xs[hover])} y1={M.top} y2={y1} stroke="hsl(var(--ink) / 0.25)" strokeWidth="1" />
              <circle
                cx={sx(xs[hover])}
                cy={sy(emissions.co2[hover])}
                r="4.5"
                fill={hover < splitIdx ? "var(--c-before)" : "var(--c-after)"}
                stroke="var(--chart-surface)"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
        {hover != null && (
          <div
            className="chart-tooltip"
            style={{ left: `${Math.min(Math.max((sx(xs[hover]) / W) * 100, 8), 74)}%`, top: 4 }}
          >
            <div className="tt-title">{fmtDate(emissions.months[hover])}</div>
            <div>
              <span
                className="swatch"
                style={{ background: hover < splitIdx ? "var(--c-before)" : "var(--c-after)" }}
              />
              {fmtNum(emissions.co2[hover])} tonnes CO₂/day
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-[0.78rem] text-[hsl(var(--muted))]">
        Monthly averages of EIA&#8217;s consumption-based CO₂ estimate. Dotted guides mark the period averages.
      </p>
      <TableView
        caption="Monthly average CO2 consumed (tonnes per day)"
        head={["Month", "CO₂ (tonnes/day)"]}
        rows={emissions.months.map((m, i) => [fmtDate(m), fmtNum(emissions.co2[i])])}
      />
    </div>
  );
}
