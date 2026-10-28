import { useEffect, useMemo, useRef, useState } from "react";
import tempbands from "../../data/tempbands.json";
import { scaleLinear, niceTicks, fmtNum, useMeasure, useOutsideTap } from "../../charts/utils";
import { YAxis, TableView } from "../../charts/Frame";

const COPY = {
  kicker: "Finding 01",
  title: "Oregon's grid is heating-dominated.",
  hint: "Hover any band for exact numbers.",
  demand: {
    body: [
      `In Oregon, most days are spent below the comfort point,
    so energy is most often used for heating.
    On the graph, each bar is a temperature range, and each bar's height is energy demanded in that range.
    Cold days rise slightly over hot ones — a cold 25°F day demands more than
a warm 80°F one. To add on, cold days are also far more abundant.`,
      `And the strip below shows that distrubution: ${fmtNum(tempbands.coldDays)} days of
the last decade sat on the cold side of ${tempbands.baseTempF}°F, against
${fmtNum(tempbands.hotDays)} on the hot side. Expensive days, most of the year. So the
first effect of warming is relief — fewer cold days of heating to supply.`,
    ],
  },
  emissions: {
    body: [
      `The same bands, now measured in carbon. Each bar is the average CO₂ a day in that
temperature range puts on the grid, and the shape is even more lopsided than demand.
Not only do cold days demand more power, they're signifigantly dirtier that hot days.`,
      `Here, cold days tower of hot ones, because Oregon's cold-weather electricity leans on gas and imports, while milder days draw
more from hydro, wind, and solar. So the coldest days carry the heaviest carbon impact, which means warming acts as a relief to the grid.`,
    ],
  },
};

const H = 380;
const STRIP_H = 96;
const M = { top: 28, right: 20, bottom: 6, left: 58 };
const COLD = "#3B82F6"; // blue-500
const HOT = "#F97316";  // orange-500

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Ease a value toward `target` over `ms` with a smoothstep; instant if reduced motion. */
function useTween(target, ms = 450) {
  const [v, setV] = useState(target);
  const raf = useRef(0);
  useEffect(() => {
    if (prefersReduced()) {
      setV(target);
      return undefined;
    }
    let start;
    const from = v;
    const delta = target - from;
    if (delta === 0) return undefined;
    const step = (ts) => {
      if (start == null) start = ts;
      const p = Math.min((ts - start) / ms, 1);
      const e = p * p * (3 - 2 * p);
      setV(from + delta * e);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}

// forward-filled CO₂ per band (a sparse extreme band can read null)
const CO2_VALS = (() => {
  let last = 0;
  return tempbands.bands.map((b) => {
    if (b.avgCo2 != null) last = b.avgCo2;
    return last;
  });
})();

function TempBandsChart({ metric }) {
  const [ref, width] = useMeasure();
  const [hover, setHover] = useState(null);
  useOutsideTap(ref, hover != null, () => setHover(null));
  const mix = useTween(metric === "emissions" ? 1 : 0); // 0 = demand, 1 = emissions

  const W = Math.max(width, 260);
  // phones: shorter plot, slimmer gutters, sparser ticks, labels that don't collide
  const narrow = W < 480;
  const CH = narrow ? 210 : H;
  const SH = narrow ? 84 : STRIP_H;
  const m = narrow ? { ...M, left: 44, right: 12 } : M;
  const x0 = m.left;
  const x1 = W - m.right;
  const y1 = CH - m.bottom;
  const plotH = y1 - m.top;

  const bands = tempbands.bands;
  const maxDays = Math.max(...bands.map((b) => b.days));

  const demandTop = Math.max(...bands.map((b) => b.avgDemand)) * 1.08;
  const co2Top = Math.max(...CO2_VALS) * 1.08;

  const sx = scaleLinear([bands[0].lo, bands.at(-1).hi], [x0, x1]);
  const syDemand = scaleLinear([0, demandTop], [y1, m.top]);
  const syCo2 = scaleLinear([0, co2Top], [y1, m.top]);
  const gap = 3;

  const bars = useMemo(
    () =>
      bands.map((b, i) => ({
        ...b,
        co2: CO2_VALS[i],
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
        height={CH + SH}
        viewBox={`0 0 ${W} ${CH + SH}`}
        role="img"
        aria-label={`Average daily ${metric} by temperature band in Albany, with ${fmtNum(tempbands.coldDays)} days of the decade below 58 degrees versus ${fmtNum(tempbands.hotDays)} above.`}
        // touch fires a leave right after every tap — keep the tapped band's readout open
        onPointerLeave={(e) => e.pointerType !== "touch" && setHover(null)}
        // touch: tap a band to show it, tap it again (or anywhere else) to hide
        onPointerDown={(e) => {
          if (e.pointerType !== "touch") return;
          const r = e.currentTarget.getBoundingClientRect();
          const v = sx.invert(((e.clientX - r.left) / r.width) * W);
          const i = bands.findIndex((b) => v >= b.lo && v < b.hi);
          setHover((h) => (i < 0 || h === i ? null : i));
        }}
      >
       <defs>
          <filter id="barGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="coldGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>

          <linearGradient id="hotGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>
       </defs>

        {/* crossfading y-axes: demand (fades out as it warms), CO₂ (fades in) */}
        <g style={{ opacity: 1 - mix }}>
          <YAxis ticks={niceTicks(0, demandTop, 4)} sy={syDemand} x0={x0} x1={x1} unit="GWh / day" />
        </g>
        <g style={{ opacity: mix }}>
          <YAxis ticks={niceTicks(0, co2Top, 4)} sy={syCo2} x0={x0} x1={x1} unit="t / day CO₂" />
        </g>

        {bands.map((b) =>
          b.lo % (narrow ? 20 : 10) === 0 ? (
            <text key={b.lo} x={sx(b.lo)} y={y1 + 16} textAnchor="middle" fontSize="11" fill="hsl(var(--muted))" aria-hidden="true">
              {b.lo}°F
            </text>
          ) : null
        )}

        {/* bars — height morphs between the demand and CO₂ metric */}
        {bars.map((b, i) => {
          const fracD = b.avgDemand / demandTop;
          const fracC = b.co2 / co2Top;
          const h = (fracD + (fracC - fracD) * mix) * plotH;
          return (
            <g key={b.lo} onPointerEnter={(e) => e.pointerType !== "touch" && setHover(i)}>
              <rect x={b.x} width={b.w} y={m.top} height={plotH} fill="transparent" />
              <rect
                x={b.x}
                width={b.w}
                y={y1 - h}
                height={Math.max(h, 0.5)}
                rx="3"
                fill={b.cold ? "url(#coldGradient)" : "url(#hotGradient)"}
                opacity={hover == null || hover === i ? 1 : 0.45}
                filter="url(#barGlow)"
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
          y2={y1 + SH - 14}
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
            const ch = (b.days / maxDays) * (SH - 40);
            return (
              <rect
                key={b.lo}
                x={b.x}
                width={b.w}
                y={y1 + 26 + (SH - 40) - ch}
                height={Math.max(ch, 1)}
                rx="2"
                fill={b.cold ? COLD : HOT}
                opacity={(hover == null || hover === i ? 1 : 0.45) * 0.45}
                onPointerEnter={(e) => e.pointerType !== "touch" && setHover(i)}
              />
            );
          })}
        </g>

        {/* totals annotation */}
        {/* phones: anchor the totals either side of the 58°F line so they can't overlap */}
        <text
          x={narrow ? sx(58) - 6 : sx(40)}
          y={y1 + 40}
          textAnchor={narrow ? "end" : "middle"}
          fontSize={narrow ? "10.5" : "12"}
          fontWeight="600"
          fill={COLD}
        >
          {fmtNum(tempbands.coldDays)} cold-side days
        </text>
        <text
          x={narrow ? sx(58) + 6 : sx(74)}
          y={y1 + 40}
          textAnchor={narrow ? "start" : "middle"}
          fontSize={narrow ? "10.5" : "12"}
          fontWeight="600"
          fill={HOT}
        >
          {fmtNum(tempbands.hotDays)} hot-side
        </text>
      </svg>

      {hover != null && (
        <div
          className="chart-tooltip"
          style={
            narrow
              ? { left: "50%", transform: "translateX(-50%)", top: 0 }
              : { left: `${Math.min(Math.max(((bars[hover].x + bars[hover].w / 2) / W) * 100, 10), 72)}%`, top: 0 }
          }
        >
          <div className="tt-title">
            {bands[hover].lo}–{bands[hover].hi}°F days
          </div>
          <div>
            <span className="swatch" style={{ background: bars[hover].cold ? COLD : HOT }} />
            {metric === "emissions"
              ? `Avg CO₂: ${fmtNum(bars[hover].co2)} t/day`
              : `Avg demand: ${fmtNum(bands[hover].avgDemand, 1)} GWh/day`}
          </div>
          <div className="text-[hsl(var(--muted))]">{fmtNum(bands[hover].days)} days in ten years</div>
        </div>
      )}
    </div>
  );
}

function MetricToggle({ metric, setMetric }) {
  return (
    <div className="inline-flex rounded-full border border-[hsl(var(--ink)/0.15)] p-0.5">
      {["demand", "emissions"].map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMetric(m)}
          aria-pressed={metric === m}
          className={`smallcaps rounded-full px-3.5 py-1 text-[0.66rem] transition-colors ${
            metric === m
              ? "bg-[hsl(var(--accent))] text-[hsl(var(--paper))]"
              : "text-[hsl(var(--ink-soft))] hover:text-[hsl(var(--accent))]"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

export default function Finding1() {
  const [metric, setMetric] = useState("demand");
  const body = COPY[metric].body;

  return (
    <section id="finding-1" className="relative flex min-h-screen items-center">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-24 md:px-12">
        <h2 className="display text-[clamp(2rem,4.2vw,3.6rem)]">
          <span className="text-[hsl(var(--accent))]">01</span> — {COPY.title}
        </h2>
        <div className="mt-10 grid grid-cols-12 gap-x-6 md:gap-x-10">
        <div className="col-span-12 md:col-span-4">
          <div className="lift-card rounded-2xl border border-[hsl(var(--accent)/0.35)] bg-[hsl(var(--surface))] p-6">
            <p className="smallcaps">Oregon's demand minimum</p>
            <p className="serif mt-2 text-[4.5rem] leading-none text-[#3B82F6]">
              58<span className="text-[2.2rem]">°F</span>
            </p>
            <p className="mt-2 text-[0.8rem] leading-relaxed text-[hsl(var(--muted))]">
              Oregon uses the least amount of energy at it's comfort point, 58 degrees.
            </p>
          </div>
          <div className="mt-6">
            {body.map((t, i) => (
              <p key={`${metric}-${i}`} className={`body-copy text-[0.98rem] ${i ? "mt-4 " : ""}hidden md:block`}>
                {t}
              </p>
            ))}
            <p className="mt-4 text-[0.8rem] text-[hsl(var(--muted))]">
              <span className="hidden md:inline">{COPY.hint}</span>
              <span className="md:hidden">Tap any band for exact numbers.</span>
            </p>
          </div>
        </div>
        <div className="col-span-12 mt-6 md:col-span-8 md:mt-0">
          <div className="rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5 md:p-7">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="smallcaps text-[0.7rem] text-[hsl(var(--muted))]">
                Average daily {metric} by temperature
              </p>
              <MetricToggle metric={metric} setMetric={setMetric} />
            </div>
            <TempBandsChart metric={metric} />
            <TableView
              caption="Average daily demand, CO₂, and day count by temperature band (Albany, 2015–2025)"
              head={["Band", "Avg demand (GWh/day)", "Avg CO₂ (t/day)", "Days"]}
              rows={tempbands.bands.map((b) => [
                `${b.lo}–${b.hi}°F`,
                fmtNum(b.avgDemand, 1),
                b.avgCo2 != null ? fmtNum(b.avgCo2) : "—",
                fmtNum(b.days),
              ])}
            />
          </div>
          {body.map((t, i) => (
            <p key={`m-${metric}-${i}`} className="body-copy mt-3 text-[0.95rem] md:hidden">
              {t}
            </p>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
