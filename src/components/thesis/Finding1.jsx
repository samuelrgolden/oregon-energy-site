import { useMemo, useState } from "react";
import tempbands from "../../data/tempbands.json";
import { scaleLinear, niceTicks, fmtNum, useMeasure } from "../../charts/utils";
import { YAxis, TableView } from "../../charts/Frame";

const COPY = {
  kicker: "Finding 01",
  title: "Oregon's grid is heating-dominated.",
  body: [
    `Each bar is a temperature band: how much electricity an average day in that band
demands. Cold days tower over hot ones — a 22°F day works the grid nearly twice as
hard as a 62°F one — because Oregon heats with electricity far more than it cools.`,
    `And the strip below shows where Oregon actually lives: ${fmtNum(tempbands.coldDays)} of
the decade's days sat on the cold side of ${tempbands.baseTempF}°F, against
${fmtNum(tempbands.hotDays)} on the hot side. Expensive days, most of the year. So the
first effect of warming is relief — fewer degrees of heating to supply.`,
  ],
  hint: "Hover any band for exact numbers.",
};

const H = 380;
const STRIP_H = 96;
const M = { top: 28, right: 20, bottom: 6, left: 58 };
const COLD = "hsl(var(--accent))";
const HOT = "var(--c-solar)";

function TempBandsChart() {
  const [ref, width] = useMeasure();
  const [hover, setHover] = useState(null);

  const W = Math.max(width, 320);
  const x0 = M.left;
  const x1 = W - M.right;
  const y1 = H - M.bottom;

  const bands = tempbands.bands;
  const hi = Math.max(...bands.map((b) => b.avgDemand));
  const maxDays = Math.max(...bands.map((b) => b.days));

  const sx = scaleLinear([bands[0].lo, bands.at(-1).hi], [x0, x1]);
  const sy = scaleLinear([0, hi * 1.08], [y1, M.top]);
  const gap = 3;

  const bars = useMemo(
    () =>
      bands.map((b) => ({
        ...b,
        x: sx(b.lo) + gap / 2,
        w: sx(b.hi) - sx(b.lo) - gap,
        cold: (b.lo + b.hi) / 2 < tempbands.baseTempF,
      })),
    [W] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div ref={ref} className="relative">
      <svg
        width="100%"
        height={H + STRIP_H}
        viewBox={`0 0 ${W} ${H + STRIP_H}`}
        role="img"
        aria-label={`Average daily demand by temperature band in Albany: about 81 gigawatt-hours below 25 degrees falling to about 45 near 60, rising again in the 80s — with ${fmtNum(tempbands.coldDays)} days of the decade below 58 degrees versus ${fmtNum(tempbands.hotDays)} above.`}
        onPointerLeave={() => setHover(null)}
      >
        <YAxis ticks={niceTicks(0, hi * 1.08, 4)} sy={sy} x0={x0} x1={x1} unit="GWh / day" />
        {bands.map((b) =>
          b.lo % 10 === 0 ? (
            <text key={b.lo} x={sx(b.lo)} y={y1 + 16} textAnchor="middle" fontSize="11" fill="hsl(var(--muted))" aria-hidden="true">
              {b.lo}°F
            </text>
          ) : null
        )}

        {/* demand bars */}
        {bars.map((b, i) => {
          const h = y1 - sy(b.avgDemand);
          return (
            <g key={b.lo} onPointerEnter={() => setHover(i)}>
              <rect x={b.x} width={b.w} y={M.top} height={y1 - M.top} fill="transparent" />
              <rect
                x={b.x}
                width={b.w}
                y={y1 - h}
                height={Math.max(h, 0.5)}
                rx="3"
                fill={b.cold ? COLD : HOT}
                opacity={hover == null || hover === i ? 1 : 0.45}
              />
            </g>
          );
        })}

        {/* days-per-band distribution, overlaid faded on the bars — the mass
            of the decade visibly sits left of 58°F */}
        <g opacity="0.8" aria-hidden="true">
          <path
            d={
              "M" +
              bars
                .map((b) => {
                  const cx = b.x + b.w / 2;
                  const cy = y1 - (b.days / maxDays) * (y1 - M.top - 24);
                  return `${cx.toFixed(1)},${cy.toFixed(1)}`;
                })
                .join(" L")
            }
            fill="none"
            stroke="hsl(var(--ink) / 0.65)"
            strokeWidth="1.75"
            strokeLinejoin="round"
            strokeDasharray="1 0"
          />
          {bars.map((b) => (
            <circle
              key={`d${b.lo}`}
              cx={b.x + b.w / 2}
              cy={y1 - (b.days / maxDays) * (y1 - M.top - 24)}
              r="2.5"
              fill="hsl(var(--ink) / 0.75)"
            />
          ))}
          <text
            x={sx(47.5)}
            y={y1 - (1 * (y1 - M.top - 24)) - 10}
            textAnchor="middle"
            fontSize="11"
            fontWeight="500"
            fill="hsl(var(--ink-soft))"
          >
            days spent in each band
          </text>
        </g>

        {/* 58°F comfort marker */}
        <line
          x1={sx(58)}
          x2={sx(58)}
          y1={M.top - 6}
          y2={y1 + STRIP_H - 14}
          stroke="hsl(var(--ink) / 0.5)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <text x={sx(58)} y={M.top - 12} textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(var(--ink-soft))">
          58°F
        </text>

        {/* day-count strip */}
        <g>
          <text x={x0 - 8} y={y1 + 34} textAnchor="end" fontSize="10.5" fill="hsl(var(--muted))">
            days
          </text>
          {bars.map((b, i) => {
            const ch = (b.days / maxDays) * (STRIP_H - 40);
            return (
              <rect
                key={b.lo}
                x={b.x}
                width={b.w}
                y={y1 + 26 + (STRIP_H - 40) - ch}
                height={Math.max(ch, 1)}
                rx="2"
                fill={b.cold ? COLD : HOT}
                opacity={(hover == null || hover === i ? 1 : 0.45) * 0.45}
                onPointerEnter={() => setHover(i)}
              />
            );
          })}
        </g>

        {/* totals annotation */}
        <text x={sx(40)} y={y1 + 40} textAnchor="middle" fontSize="12" fontWeight="600" fill={COLD}>
          {fmtNum(tempbands.coldDays)} cold-side days
        </text>
        <text x={sx(74)} y={y1 + 40} textAnchor="middle" fontSize="12" fontWeight="600" fill={HOT}>
          {fmtNum(tempbands.hotDays)} hot-side
        </text>
      </svg>

      {hover != null && (
        <div
          className="chart-tooltip"
          style={{ left: `${Math.min(Math.max(((bars[hover].x + bars[hover].w / 2) / W) * 100, 10), 72)}%`, top: 0 }}
        >
          <div className="tt-title">
            {bands[hover].lo}–{bands[hover].hi}°F days
          </div>
          <div>
            <span className="swatch" style={{ background: bars[hover].cold ? COLD : HOT }} />
            Avg demand: {fmtNum(bands[hover].avgDemand, 1)} GWh/day
          </div>
          <div className="text-[hsl(var(--muted))]">{fmtNum(bands[hover].days)} days in ten years</div>
        </div>
      )}
    </div>
  );
}

export default function Finding1() {
  return (
    <section id="finding-1" className="relative flex min-h-screen items-center">
      <p className="absolute inset-x-6 top-16 text-center text-sm text-[hsl(var(--muted))] md:top-20">
        Sam Golden · Climate and the Oregon Energy Grid · University of Oregon, 2026
      </p>
      <div className="mx-auto w-full max-w-[1440px] px-6 py-24 md:px-12">
        <h2 className="display text-[clamp(2rem,4.2vw,3.6rem)]">
          <span className="text-[hsl(var(--accent))]">01</span> — {COPY.title}
        </h2>
        <div className="mt-10 grid grid-cols-12 gap-x-6 md:gap-x-10">
        <div className="col-span-12 md:col-span-4">
          {COPY.body.map((t, i) => (
            <p key={i} className={`body-copy text-[0.98rem] ${i ? "mt-4 " : ""}hidden md:block`}>
              {t}
            </p>
          ))}
          <p className="mt-4 text-[0.8rem] text-[hsl(var(--muted))]">{COPY.hint}</p>
        </div>
        <div className="col-span-12 mt-6 md:col-span-8 md:mt-0">
          <div className="rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5 md:p-7">
            <TempBandsChart />
            <TableView
              caption="Average daily demand and day count by temperature band (Albany, 2015–2025)"
              head={["Band", "Avg demand (GWh/day)", "Days"]}
              rows={tempbands.bands.map((b) => [
                `${b.lo}–${b.hi}°F`,
                fmtNum(b.avgDemand, 1),
                fmtNum(b.days),
              ])}
            />
          </div>
          <p className="mt-3 text-[0.85rem] leading-relaxed text-[hsl(var(--ink-soft))] md:hidden">
            {COPY.body[0]}
          </p>
        </div>
        </div>
      </div>
    </section>
  );
}
