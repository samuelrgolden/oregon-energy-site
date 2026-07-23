import { useEffect, useMemo, useState } from "react";
import bandshift from "../../data/bandshift.json";
import scenarios from "../../data/scenarios.json";
import { PinScene, phase, ease, useRail } from "../../lib/scroll";
import { scaleLinear, fmtNum, useMeasure } from "../../charts/utils";

const COPY = {
  kicker: "Wait — run that again?",
  title: "Why: watch the cold days disappear.",
  body: `Same model, same sweep — but this time, watch the input. Every day of the decade
sits in a temperature band; as Oregon warms, days pour across the 58°F line from the
expensive, dirty cold side to the cheaper, cleaner hot side. One bill shrinks while
another grows — so demand barely moves. But the days being deleted are the dirtiest
ones the grid has — so emissions just fall.`,
  hint: "The outline is today's distribution; the bars are the warmed one. The sweep runs to +9°F — the top of the century's hottest path above.",
};

const H = 310;
const M = { top: 34, right: 20, bottom: 40, left: 16 };
// same palette as the Finding 1 bars
const COLD = "#3B82F6"; // blue-500
const HOT = "#F97316"; // orange-500
// cap the rerun at +9°F — the top of the century's hottest path in section
// 02 (SSP5-8.5 by 2100). Past that the demand U turns and CO₂ rebounds,
// which is the +15°F tail of the sweep, not the century story.
const MAX_W = 9;

/** interpolate an array series at fractional index */
function lerpAt(arr, t) {
  const i = Math.min(Math.floor(t), arr.length - 2);
  const f = t - i;
  return arr[i] + (arr[i + 1] - arr[i]) * f;
}

function MigrationChart({ deltaT }) {
  const [ref, width] = useMeasure();
  const W = Math.max(width, 320);
  const x0 = M.left;
  const x1 = W - M.right;
  const y1 = H - M.bottom;

  const { bands, counts, meanTemp } = bandshift;
  const maxCount = useMemo(() => Math.max(...counts.flat()), [counts]);

  const sx = scaleLinear([bands[0].lo, bands.at(-1).hi], [x0, x1]);
  const sy = scaleLinear([0, maxCount * 1.06], [y1, M.top]);
  const gap = 3;

  // fractional position in the 0.5°F step table (table runs to +15)
  const t = deltaT / 0.5;
  const meanNow = lerpAt(meanTemp, t); // mean daily temperature, °F

  return (
    <div ref={ref}>
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Days per temperature band as Oregon warms by ${deltaT.toFixed(1)} degrees: cold-side days fall from 2,304 toward 1,452 at plus nine degrees while hot-side days rise from 1,435 toward 2,287.`}
      >
        <defs>
          <filter id="f3-barGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="f3-coldGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
          <linearGradient id="f3-hotGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>
        </defs>
        {bands.map((b, i) => {
          const now = lerpAt(counts.map((c) => c[i]), t);
          const base = counts[0][i];
          const bx = sx(b.lo) + gap / 2;
          const bw = sx(b.hi) - sx(b.lo) - gap;
          const cold = (b.lo + b.hi) / 2 < 58;
          return (
            <g key={b.lo}>
              {/* live bar */}
              <rect
                x={bx}
                width={bw}
                y={sy(now)}
                height={Math.max(y1 - sy(now), 0.5)}
                rx="3"
                fill={cold ? "url(#f3-coldGradient)" : "url(#f3-hotGradient)"}
                filter="url(#f3-barGlow)"
              />
              {/* ghost of today's distribution */}
              <rect
                x={bx}
                width={bw}
                y={sy(base)}
                height={Math.max(y1 - sy(base), 0.5)}
                rx="3"
                fill="none"
                stroke="hsl(var(--ink) / 0.4)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {b.lo % 10 === 0 && (
                <text x={sx(b.lo)} y={y1 + 18} textAnchor="middle" fontSize="11" fill="hsl(var(--muted))" aria-hidden="true">
                  {b.lo}°F
                </text>
              )}
            </g>
          );
        })}

        {/* 58°F line */}
        <line x1={sx(58)} x2={sx(58)} y1={M.top - 8} y2={y1} stroke="hsl(var(--ink) / 0.5)" strokeWidth="1" strokeDasharray="4 4" />
        <text x={sx(58)} y={M.top - 14} textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(var(--ink-soft))">
          58°F
        </text>

        {/* moving mean-temperature line — slides right toward 58°F as it warms */}
        <line x1={sx(meanNow)} x2={sx(meanNow)} y1={M.top - 8} y2={y1} stroke="#ef4444" strokeWidth="2" />
        <text x={sx(meanNow)} y={y1 + 32} textAnchor="middle" fontSize="11" fontWeight="700" fill="#ef4444">
          avg {meanNow.toFixed(1)}°F
        </text>
      </svg>
    </div>
  );
}

function Readout({ label, value, sub, tone }) {
  return (
    <div className="rounded-xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] px-4 py-3">
      <p className="smallcaps text-[0.62rem]">{label}</p>
      <p className={`serif mt-1 text-[1.55rem] leading-none tabular-nums ${tone ?? "text-[hsl(var(--ink))]"}`}>{value}</p>
      {sub && <p className="mt-1 text-[0.7rem] text-[hsl(var(--muted))]">{sub}</p>}
    </div>
  );
}

export default function Finding3() {
  const [manual, setManual] = useState(null);
  const { setDelta: setRailDelta } = useRail();
  return (
    <PinScene id="finding-3" heightVh={500} mobileHeightVh={260}>
      {(p) => {
        // scrub: 8%–88% of the pin drives the sweep; hold at the end
        const scrubDelta = phase(p, 0.08, 0.88) * MAX_W;
        const deltaT = manual ?? scrubDelta;
        return (
          <Finding3Inner {...{ p, scrubDelta, deltaT, manual, setManual, setRailDelta }} />
        );
      }}
    </PinScene>
  );
}

function Finding3Inner({ p, scrubDelta, deltaT, manual, setManual, setRailDelta }) {
  const alb = scenarios.cities.Albany;
  const enter = ease(phase(p, 0, 0.08));

  // scroll takes over from manual whenever the scrub moves
  useEffect(() => {
    if (manual != null) setManual(null);
  }, [scrubDelta]); // eslint-disable-line react-hooks/exhaustive-deps

  // publish ΔT to the rail thermometer while the scene is live
  useEffect(() => {
    setRailDelta(p > 0.02 && p < 0.98 ? deltaT : null);
  }, [deltaT, p, setRailDelta]);
  useEffect(() => () => setRailDelta(null), [setRailDelta]);

  const t = deltaT / 0.5; // index into the 0.5°F-step table
  const cold = Math.round(lerpAt(bandshift.coldDays, t));
  const hot = Math.round(lerpAt(bandshift.hotDays, t));
  const demandPct = ((lerpAt(alb.demand, t) - alb.demand[0]) / alb.demand[0]) * 100;
  const co2Pct = ((lerpAt(alb.co2, t) - alb.co2[0]) / alb.co2[0]) * 100;

  return (
          <div className="flex h-full items-center">
            <div className="mx-auto w-full max-w-[1440px] px-6 md:px-12" style={{ opacity: enter }}>
              <h2 className="display text-[clamp(2rem,4.2vw,3.6rem)]">
                <span className="text-[hsl(var(--accent))]">03</span> — {COPY.title}
              </h2>
              <p className="smallcaps mt-2 text-[hsl(var(--accent))]">{COPY.kicker}</p>

              <div className="mt-5 grid grid-cols-12 gap-x-6 md:gap-x-10">
                {/* left: the why — offset so it aligns with the graph card top,
                    clearing the slider row on the right */}
                <div className="col-span-12 md:col-span-4 md:mt-[2.6rem]">
                  <p className="body-copy hidden text-[0.92rem] md:block">{COPY.body}</p>
                  <p className="mt-3 hidden text-[0.75rem] text-[hsl(var(--muted))] md:block">{COPY.hint}</p>
                </div>

                {/* right: slider over the graph */}
                <div className="col-span-12 md:col-span-8">
                  <div className="flex items-center gap-4">
                    <span className="serif w-[5.5ch] text-[1.9rem] font-medium leading-none tabular-nums text-[hsl(var(--ink))]">
                      +{deltaT.toFixed(1)}°F
                    </span>
                    <input
                      type="range"
                      min="0"
                      max={MAX_W}
                      step="0.1"
                      value={deltaT}
                      onChange={(e) => setManual(parseFloat(e.target.value))}
                      aria-label="Warming in degrees Fahrenheit"
                      className="temp-slider flex-1"
                    />
                  </div>
                  <div className="mt-3 rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-4 md:p-5">
                    <MigrationChart deltaT={deltaT} />
                  </div>
                </div>
              </div>

              {/* cards row, full width */}
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <Readout label="Cold-side days" value={fmtNum(cold)} sub="of 3,739 · was 2,304" tone="text-[#60A5FA]" />
                <Readout label="Hot-side days" value={fmtNum(hot)} sub="was 1,435" tone="text-[#FB923C]" />
                <Readout
                  label="Demand"
                  value={`${demandPct >= 0 ? "+" : ""}${demandPct.toFixed(1)}%`}
                  sub="barely moves"
                />
                <Readout
                  label="CO₂"
                  value={`${co2Pct >= 0 ? "+" : ""}${co2Pct.toFixed(1)}%`}
                  sub="just falls"
                  tone="text-[var(--c-after)]"
                />
              </div>

              <p className="mt-3 text-[0.85rem] leading-relaxed text-[hsl(var(--ink-soft))] md:hidden">
                {COPY.body}
              </p>
            </div>
          </div>
  );
}
