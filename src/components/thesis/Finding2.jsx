import { useEffect, useMemo, useState } from "react";
import scenarios from "../../data/scenarios.json";
import { PinScene, phase, ease, useRail, useNarrow } from "../../lib/scroll";
import { scaleLinear, niceTicks, fmtNum, useMeasureBox, nearestIndex } from "../../charts/utils";
import { YAxis, Legend, TableView } from "../../charts/Frame";
import MobileIntro from "./MobileIntro";

const COPY = {
  kicker: "Finding 02",
  title: "Scroll the century forward.",
  body: `As you scroll, Oregon warms along three futures — the moderate, high, and very-high
emissions pathways (SSP scenarios), each mapped through my model. Demand dips as heating
fades, then climbs as cooling takes over. But emissions decline consistently: warm days run
on a cleaner mix than cold ones. The grid is carbon-lopsided.`,
  hint: "Forecasts become more uncertain farther into the future",
};

// SSP central path + CMIP6 band endpoints at 2100 (°F above baseline),
// verbatim from the thesis figure-prep notebook; colors brightened one
// step for the dark surface (ordinal warm ramp, gold → deep red).
const SSP = [
  { key: "SSP2-4.5", central: 5.0, lo: 3.5, hi: 6.5, color: "#e8b923" },
  { key: "SSP3-7.0", central: 8.0, lo: 6.0, hi: 10.0, color: "#e0742c" },
  { key: "SSP5-8.5", central: 10.5, lo: 8.5, hi: 13.0, color: "#cf4f3e" },
];

const YEAR0 = 2024;
const YEAR1 = 2100;
const YEARS = Array.from({ length: YEAR1 - YEAR0 + 1 }, (_, i) => YEAR0 + i);
const PROJECTION_CITIES = ["Albany", "Portland", "Eugene"];

/** Interpolate a city's sweep (0.5°F grid) at an arbitrary warming level. */
function interpSweep(series, warming) {
  const i = Math.min(Math.max(Math.floor(warming * 2), 0), series.length - 2);
  const t = warming * 2 - i;
  return series[i] * (1 - t) + series[i + 1] * t;
}

/** Cross-city mean of a metric at one warming level. */
function crossCityMean(metric, warming) {
  let sum = 0;
  for (const c of PROJECTION_CITIES) sum += interpSweep(scenarios.cities[c][metric], warming);
  return sum / PROJECTION_CITIES.length;
}

/** central/lo/hi trajectories over the years for one SSP + metric. */
function buildTrajectory(metric, info) {
  const ramp = (y, end) => (end * (y - YEAR0)) / (YEAR1 - YEAR0);
  return {
    central: YEARS.map((y) => crossCityMean(metric, ramp(y, info.central))),
    lo: YEARS.map((y) => crossCityMean(metric, ramp(y, info.lo))),
    hi: YEARS.map((y) => crossCityMean(metric, ramp(y, info.hi))),
  };
}

const H_DESKTOP = 320;
const M_DESKTOP = { top: 26, right: 18, bottom: 32, left: 62 };
const M_FILL = { top: 24, right: 12, bottom: 26, left: 46 };

/**
 * `fill` (phones): the chart takes whatever height its flex box gives it,
 * so two charts share the pinned screen on any phone height.
 */
function SSPChart({ title, unit, trajectories, year, digits, landmarks, fill = false }) {
  const [ref, width, boxH] = useMeasureBox();
  const [hover, setHover] = useState(null);

  const H = fill ? Math.max(boxH, 90) : H_DESKTOP;
  const M = fill ? M_FILL : M_DESKTOP;
  const W = Math.max(width, 260);
  const x0 = M.left;
  const x1 = W - M.right;
  const y1 = H - M.bottom;

  const all = trajectories.flatMap((t) => [...t.lo, ...t.hi]);
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const pad = (hi - lo) * 0.08 || 1;

  const sx = scaleLinear([YEAR0, YEAR1], [x0, x1]);
  const sy = scaleLinear([lo - pad, hi + pad], [y1, M.top]);

  const cut = Math.min(Math.max(Math.round(year) - YEAR0, 0), YEARS.length - 1);

  const paths = useMemo(() => {
    const line = (ys, n) =>
      "M" + ys.slice(0, n + 1).map((v, i) => `${sx(YEAR0 + i).toFixed(1)},${sy(v).toFixed(1)}`).join(" L");
    const band = (t, n) => {
      const top = t.hi.slice(0, n + 1).map((v, i) => `${sx(YEAR0 + i).toFixed(1)},${sy(v).toFixed(1)}`);
      const bot = t.lo.slice(0, n + 1).map((v, i) => `${sx(YEAR0 + i).toFixed(1)},${sy(v).toFixed(1)}`).reverse();
      return `M${top.join(" L")} L${bot.join(" L")} Z`;
    };
    return trajectories.map((t) => ({
      fullLine: line(t.central, YEARS.length - 1),
      doneLine: line(t.central, cut),
      doneBand: band(t, cut),
    }));
  }, [W, H, cut]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    if (px < x0 || px > x1) return setHover(null);
    setHover(nearestIndex(YEARS, sx.invert(px)));
  };

  // phones: keep landmark labels inside the plot instead of clipping at the edge
  const labelX = (x, label) => {
    if (!fill) return x;
    const half = label.length * 3.1;
    return Math.min(Math.max(x, x0 + half), x1 - half);
  };

  const svg = (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${title} from 2024 to 2100 under three SSP warming scenarios, with uncertainty bands.`}
      onPointerMove={onMove}
      onPointerDown={onMove}
      // touch fires a leave right after every tap — keep the tapped year's readout open
      onPointerLeave={(e) => e.pointerType !== "touch" && setHover(null)}
      className={fill ? "absolute inset-0" : undefined}
    >
        <YAxis ticks={niceTicks(lo - pad, hi + pad, fill && H < 170 ? 3 : 4)} sy={sy} x0={x0} x1={x1} unit={unit} />
        {[2030, 2050, 2070, 2090].map((yr) => (
          <text key={yr} x={sx(yr)} y={y1 + 19} textAnchor="middle" fontSize="11" fill="hsl(var(--muted))" aria-hidden="true">
            {yr}
          </text>
        ))}
        {/* baseline reference */}
        <line x1={x0} x2={x1} y1={sy(trajectories[0].central[0])} y2={sy(trajectories[0].central[0])} stroke="hsl(var(--ink) / 0.25)" strokeWidth="1" strokeDasharray="2 5" />
        {/* full central lines, faint */}
        {trajectories.map((t, i) => (
          <path key={`f${i}`} d={paths[i].fullLine} fill="none" stroke={SSP[i].color} strokeWidth="1.25" opacity="0.2" />
        ))}
        {/* traversed bands + lines */}
        {trajectories.map((t, i) => (
          <g key={`d${i}`}>
            <path d={paths[i].doneBand} fill={SSP[i].color} opacity="0.13" />
            <path d={paths[i].doneLine} fill="none" stroke={SSP[i].color} strokeWidth="2.25" strokeLinejoin="round" />
            <circle cx={sx(YEAR0 + cut)} cy={sy(t.central[cut])} r="5" fill={SSP[i].color} stroke="var(--chart-surface)" strokeWidth="2" />
          </g>
        ))}
        {/* landmarks */}
        {landmarks.map(
          (lm) =>
            cut >= lm.atIdx && (
              <g key={lm.label} opacity={ease(phase(cut, lm.atIdx, lm.atIdx + 6))}>
                <circle cx={sx(YEAR0 + lm.atIdx)} cy={sy(lm.value)} r="3.5" fill={lm.color} stroke="var(--chart-surface)" strokeWidth="1.5" />
                <text
                  x={labelX(sx(YEAR0 + lm.atIdx), lm.label)}
                  y={
                    fill
                      ? Math.min(sy(lm.value) + (lm.below ? 22 : -12), y1 - 5) // stay clear of the year labels
                      : sy(lm.value) + (lm.below ? 22 : -12)
                  }
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={lm.color}
                  // phones: a surface-colored halo keeps the label legible where it crosses the lines
                  {...(fill ? { stroke: "var(--chart-surface)", strokeWidth: 3.5, paintOrder: "stroke", strokeLinejoin: "round" } : {})}
                >
                  {lm.label}
                </text>
              </g>
            )
        )}
        {hover != null && hover <= cut && (
          <line x1={sx(YEAR0 + hover)} x2={sx(YEAR0 + hover)} y1={M.top} y2={y1} stroke="hsl(var(--ink) / 0.3)" strokeWidth="1" aria-hidden="true" />
        )}
    </svg>
  );

  return (
    <div ref={fill ? undefined : ref} className={fill ? "relative flex min-h-0 flex-1 flex-col" : "relative"}>
      <p className={fill ? "smallcaps mb-1 text-[0.64rem]" : "smallcaps mb-2"}>{title}</p>
      {fill ? (
        <div ref={ref} className="relative min-h-0 flex-1 overflow-hidden">
          {svg}
        </div>
      ) : (
        svg
      )}
      {hover != null && hover <= cut && (
        <div
          className="chart-tooltip"
          style={
            fill
              ? { left: "50%", transform: "translateX(-50%)", top: 0 }
              : { left: `${Math.min(Math.max((sx(YEAR0 + hover) / W) * 100, 10), 68)}%`, top: 0 }
          }
        >
          <div className="tt-title">{YEAR0 + hover}</div>
          {trajectories.map((t, i) => (
            <div key={SSP[i].key}>
              <span className="swatch" style={{ background: SSP[i].color }} />
              {SSP[i].key}: {fmtNum(t.central[hover], digits)} {unit}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Finding2() {
  const [manual, setManual] = useState(null);
  const { setDelta: setRailDelta } = useRail();
  const narrow = useNarrow();

  const demandTraj = useMemo(() => SSP.map((s) => buildTrajectory("demand", s)), []);
  const co2Traj = useMemo(() => SSP.map((s) => buildTrajectory("co2", s)), []);

  return (
    <>
      {narrow && (
        <MobileIntro num="02" title={COPY.title}>
          <p className="body-copy text-[0.95rem]">{COPY.body}</p>
        </MobileIntro>
      )}
      <PinScene id="finding-2" heightVh={440} mobileHeightVh={260}>
        {(p) => {
          const enter = ease(phase(p, 0, 0.06));
          const scrubYear = YEAR0 + phase(p, 0.08, 0.92) * (YEAR1 - YEAR0);
          const year = manual ?? scrubYear;
          return (
            <Finding2Inner
              {...{ p, enter, scrubYear, year, manual, setManual, setRailDelta, demandTraj, co2Traj, narrow }}
            />
          );
        }}
      </PinScene>
    </>
  );
}

function Finding2Inner({ p, enter, scrubYear, year, manual, setManual, setRailDelta, demandTraj, co2Traj, narrow }) {
  // scroll takes over from manual whenever the scrub moves
  useEffect(() => {
    if (manual != null) setManual(null);
  }, [scrubYear]); // eslint-disable-line react-hooks/exhaustive-deps

  // publish the current year to the rail while the scene is live
  useEffect(() => {
    setRailDelta(p > 0.02 && p < 0.97 ? String(Math.round(year)) : null);
    return () => setRailDelta(null);
  }, [year, p, setRailDelta]);

  // landmarks on the strongest curve (SSP5-8.5 central)
  const demandLandmarks = useMemo(() => {
    const c = demandTraj[2].central;
    const minI = c.indexOf(Math.min(...c));
    let backI = c.findIndex((v, i) => i > minI && v >= c[0]);
    if (backI < 0) backI = null;
    return [
      { atIdx: minI, value: c[minI], label: "heating relief peaks", color: SSP[2].color, below: true },
      ...(backI ? [{ atIdx: backI, value: c[backI], label: "cooling overtakes", color: SSP[2].color, below: false }] : []),
    ];
  }, [demandTraj]);

  const co2Landmarks = useMemo(() => {
    const c = co2Traj[2].central;
    const minI = c.indexOf(Math.min(...c));
    const pct = ((c[minI] - c[0]) / c[0]) * 100;
    return [{ atIdx: minI, value: c[minI], label: `emissions floor ${pct.toFixed(1)}%`, color: SSP[2].color, below: true }];
  }, [co2Traj]);

  // the page warms as the century advances — a whisper of heat
  const frac = (year - YEAR0) / (YEAR1 - YEAR0);
  const warmBg = `color-mix(in oklab, hsl(var(--paper)), #d97940 ${frac * 7}%)`;

  // phones: heading + copy live in MobileIntro above the pin; the pinned screen
  // is year, slider, and both charts sharing the remaining height
  if (narrow) {
    return (
      <div className="flex h-full flex-col px-5 pb-4 pt-[4.25rem]" style={{ background: warmBg }}>
        {/* no fade-in on phones: MobileIntro already introduced the scene, and a
            fade would leave a blank screen as the pin arrives */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-end justify-between gap-3">
            <span className="serif text-[2.4rem] font-medium leading-none tabular-nums text-[hsl(var(--ink))]">
              {Math.round(year)}
            </span>
            <div className="flex flex-col items-end gap-0.5 text-[0.72rem] text-[hsl(var(--ink-soft))]">
              {SSP.map((s) => (
                <span key={s.key} className="inline-flex items-center">
                  <span className="swatch" style={{ background: s.color }} aria-hidden="true" />
                  {s.key}
                </span>
              ))}
            </div>
          </div>
          <input
            type="range"
            min={YEAR0}
            max={YEAR1}
            step="1"
            value={year}
            onChange={(e) => setManual(parseFloat(e.target.value))}
            aria-label="Projection year"
            className="temp-slider mt-3 w-full"
          />
          <p className="mt-1.5 text-[0.7rem] text-[hsl(var(--muted))]">{COPY.hint}</p>

          <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2.5">
            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] px-3 pb-1 pt-3">
              <SSPChart
                fill
                title="Mean daily demand"
                unit="GWh / day"
                trajectories={demandTraj}
                year={year}
                digits={1}
                landmarks={demandLandmarks}
              />
            </div>
            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] px-3 pb-1 pt-3">
              <SSPChart
                fill
                title="Mean daily CO₂ consumed"
                unit="tonnes / day"
                trajectories={co2Traj}
                year={year}
                digits={0}
                landmarks={co2Landmarks}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center" style={{ background: warmBg }}>
      <div
        className="mx-auto w-full max-w-[1440px] px-6 md:px-12"
        style={{ opacity: enter, transform: `translateY(${20 * (1 - enter)}px)` }}
      >
        <h2 className="display text-[clamp(2rem,4.2vw,3.6rem)]">
          <span className="text-[hsl(var(--accent))]">02</span> — {COPY.title}
        </h2>
        <div className="mt-6 grid grid-cols-12 items-end gap-x-6 md:gap-x-10">
          <div className="col-span-12 md:col-span-7">
            <p className="body-copy hidden max-w-2xl text-[0.95rem] md:block">{COPY.body}</p>
          </div>
          <div className="col-span-12 mt-4 md:col-span-5 md:mt-0">
            <div className="flex items-baseline justify-between">
              <span className="serif text-[clamp(2.4rem,4.5vw,3.6rem)] font-medium tabular-nums text-[hsl(var(--ink))]">
                {Math.round(year)}
              </span>
              <Legend items={SSP.map((s) => ({ label: s.key, color: s.color }))} />
            </div>
            <input
              type="range"
              min={YEAR0}
              max={YEAR1}
              step="1"
              value={year}
              onChange={(e) => setManual(parseFloat(e.target.value))}
              aria-label="Projection year"
              className="temp-slider mt-2 w-full"
            />
            <p className="mt-1 text-[0.75rem] text-[hsl(var(--muted))]">{COPY.hint}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5">
            <SSPChart
              title="Mean daily demand"
              unit="GWh / day"
              trajectories={demandTraj}
              year={year}
              digits={1}
              landmarks={demandLandmarks}
            />
          </div>
          <div className="rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5">
            <SSPChart
              title="Mean daily CO₂ consumed"
              unit="tonnes / day"
              trajectories={co2Traj}
              year={year}
              digits={0}
              landmarks={co2Landmarks}
            />
          </div>
        </div>

        <div className="mt-3 hidden md:block">
          <TableView
            caption="Projected demand and CO₂ by decade under SSP scenarios (cross-city mean: Albany, Portland, Eugene)"
            head={["Year", ...SSP.map((s) => `${s.key} demand`), ...SSP.map((s) => `${s.key} CO₂`)]}
            rows={YEARS.filter((y) => y % 10 === 0).map((y) => {
              const i = y - YEAR0;
              return [
                y,
                ...demandTraj.map((t) => fmtNum(t.central[i], 1)),
                ...co2Traj.map((t) => fmtNum(t.central[i])),
              ];
            })}
          />
        </div>
      </div>
    </div>
  );
}
