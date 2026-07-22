import { useEffect, useMemo, useState } from "react";
import scenarios from "../../data/scenarios.json";
import { PinScene, phase, ease, useRail } from "../../lib/scroll";
import { scaleLinear, niceTicks, fmtNum, linePath, useMeasure } from "../../charts/utils";
import { YAxis } from "../../charts/Frame";
import { TableView } from "../../charts/Frame";

const COPY = {
  kicker: "Finding 02",
  title: "Turn the temperature up yourself.",
  body: `Scroll, and Oregon warms. The model re-predicts every one of the decade's days at
each temperature — demand dips as heating fades, then climbs as cooling takes over. But
emissions just keep sliding: warm days run on a cleaner mix than cold ones. The grid is
carbon-lopsided.`,
  hint: "After the scroll ride, the slider is yours — drag it, switch cities.",
};

const CITIES = Object.keys(scenarios.cities);
const WARMING = scenarios.warming;

const H = 300;
const M = { top: 26, right: 18, bottom: 32, left: 56 };

function valueAt(series, delta) {
  // linear interp on the 0.5°F grid
  const i = Math.min(Math.floor(delta * 2), series.length - 2);
  const t = delta * 2 - i;
  return series[i] * (1 - t) + series[i + 1] * t;
}

function ScenarioChart({ title, unit, series, delta, color, digits, landmarks }) {
  const [ref, width] = useMeasure();
  const W = Math.max(width, 280);
  const x0 = M.left;
  const x1 = W - M.right;
  const y1 = H - M.bottom;

  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const pad = (hi - lo) * 0.15 || 1;
  const sx = scaleLinear([0, 15], [x0, x1]);
  const sy = scaleLinear([lo - pad, hi + pad], [y1, M.top]);

  const cut = Math.min(Math.floor(delta * 2) + 1, series.length - 1);
  const doneXs = WARMING.slice(0, cut + 1);
  const doneYs = series.slice(0, cut + 1);
  const dotY = valueAt(series, delta);

  return (
    <div ref={ref} className="relative">
      <p className="smallcaps mb-2">{title}</p>
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title} across warming from 0 to 15 degrees Fahrenheit.`}
      >
        <YAxis ticks={niceTicks(lo - pad, hi + pad, 4)} sy={sy} x0={x0} x1={x1} unit={unit} />
        {[0, 5, 10, 15].map((t) => (
          <text key={t} x={sx(t)} y={y1 + 19} textAnchor="middle" fontSize="11" fill="hsl(var(--muted))" aria-hidden="true">
            +{t}°F
          </text>
        ))}
        {/* full curve, faint */}
        <path d={linePath(WARMING, series, sx, sy)} fill="none" stroke={color} strokeWidth="1.5" opacity="0.22" />
        {/* traversed portion */}
        <path d={linePath(doneXs, doneYs, sx, sy)} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        {/* baseline reference */}
        <line x1={x0} x2={x1} y1={sy(series[0])} y2={sy(series[0])} stroke="hsl(var(--ink) / 0.25)" strokeWidth="1" strokeDasharray="2 5" />
        {/* landmarks */}
        {landmarks.map(
          (lm) =>
            delta >= lm.at - 0.05 && (
              <g key={lm.label} opacity={ease(phase(delta, lm.at - 0.05, lm.at + 1))}>
                <circle cx={sx(lm.at)} cy={sy(valueAt(series, lm.at))} r="4" fill={color} stroke="var(--chart-surface)" strokeWidth="2" />
                <text
                  x={sx(lm.at)}
                  y={sy(valueAt(series, lm.at)) + (lm.below ? 20 : -12)}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={color}
                >
                  {lm.label}
                </text>
              </g>
            )
        )}
        {/* the moving dot */}
        <circle cx={sx(delta)} cy={sy(dotY)} r="6" fill={color} stroke="var(--chart-surface)" strokeWidth="2.5" />
      </svg>
      <p className="text-right text-sm font-semibold tabular-nums" style={{ color }}>
        {fmtNum(dotY, digits)} {unit}{" "}
        <span className="font-normal text-[hsl(var(--muted))]">
          ({dotY >= series[0] ? "+" : ""}
          {fmtNum(((dotY - series[0]) / series[0]) * 100, 1)}% vs today)
        </span>
      </p>
    </div>
  );
}

export default function Finding2() {
  const [city, setCity] = useState("Albany");
  const [manual, setManual] = useState(null);
  const { setDelta: setRailDelta } = useRail();

  const data = scenarios.cities[city];

  return (
    <PinScene id="finding-2" heightVh={520} mobileHeightVh={300}>
      {(p) => {
        const enter = ease(phase(p, 0, 0.06));
        const scrub = phase(p, 0.08, 0.92) * 15;
        const delta = manual ?? scrub;
        return (
          <Finding2Inner
            {...{ p, enter, scrub, delta, city, setCity, manual, setManual, setRailDelta, data }}
          />
        );
      }}
    </PinScene>
  );
}

function Finding2Inner({ p, enter, scrub, delta, city, setCity, manual, setManual, setRailDelta, data }) {
  // scroll takes over from manual whenever the scrub moves
  useEffect(() => {
    if (manual != null) setManual(null);
  }, [scrub]); // eslint-disable-line react-hooks/exhaustive-deps

  // publish ΔT to the rail while the scene is live
  useEffect(() => {
    setRailDelta(p > 0.02 && p < 0.97 ? delta : null);
    return () => setRailDelta(null);
  }, [delta, p, setRailDelta]);

  const demandLandmarks = useMemo(() => {
    const d = data.demand;
    const minI = d.indexOf(Math.min(...d));
    let backI = d.findIndex((v, i) => i > minI && v >= d[0]);
    if (backI < 0) backI = null;
    return [
      { at: WARMING[minI], label: "heating relief peaks", below: false },
      ...(backI ? [{ at: WARMING[backI], label: "cooling overtakes", below: true }] : []),
    ];
  }, [data]);

  const co2Landmarks = useMemo(() => {
    const c = data.co2;
    const minI = c.indexOf(Math.min(...c));
    const pct = ((c[minI] - c[0]) / c[0]) * 100;
    return [{ at: WARMING[minI], label: `emissions floor ${pct.toFixed(1)}%`, below: true }];
  }, [data]);

  // the page warms with the slider — a whisper of heat in the background
  const warmBg = `color-mix(in oklab, hsl(var(--paper)), #d97940 ${(delta / 15) * 7}%)`;

  return (
    <div className="flex h-full items-center transition-colors duration-300" style={{ background: warmBg }}>
      <div
        className="mx-auto w-full max-w-[1440px] px-6 md:px-12"
        style={{ opacity: enter, transform: `translateY(${20 * (1 - enter)}px)` }}
      >
        <div className="grid grid-cols-12 items-end gap-x-6 md:gap-x-10">
          <div className="col-span-12 md:col-span-7">
            <p className="smallcaps">{COPY.kicker}</p>
            <h2 className="display mt-2 text-[clamp(1.8rem,3vw,2.6rem)]">{COPY.title}</h2>
            <p className="body-copy mt-3 hidden max-w-2xl text-[0.95rem] md:block">{COPY.body}</p>
          </div>
          <div className="col-span-12 mt-4 md:col-span-5 md:mt-0">
            <div className="flex items-baseline justify-between">
              <span className="serif text-[clamp(2.4rem,4.5vw,3.6rem)] font-medium tabular-nums text-[hsl(var(--ink))]">
                +{delta.toFixed(1)}°F
              </span>
              <div className="flex gap-1.5">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className={`rounded-full border px-2.5 py-1 text-[0.7rem] transition-colors ${
                      city === c
                        ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))] text-[hsl(var(--paper))]"
                        : "border-[hsl(var(--ink)/0.2)] text-[hsl(var(--muted))] hover:border-[hsl(var(--accent))]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.1"
              value={delta}
              onChange={(e) => setManual(parseFloat(e.target.value))}
              aria-label="Warming in degrees Fahrenheit"
              className="temp-slider mt-2 w-full"
            />
            <p className="mt-1 text-[0.75rem] text-[hsl(var(--muted))]">{COPY.hint}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5">
            <ScenarioChart
              title="Mean daily demand"
              unit="GWh / day"
              series={data.demand}
              delta={delta}
              color="var(--c-hydro)"
              digits={1}
              landmarks={demandLandmarks}
            />
          </div>
          <div className="rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5">
            <ScenarioChart
              title="Mean daily CO₂ consumed"
              unit="tonnes / day"
              series={data.co2}
              delta={delta}
              color="var(--c-gas)"
              digits={0}
              landmarks={co2Landmarks}
            />
          </div>
        </div>

        <div className="mt-3 hidden md:block">
          <TableView
            caption={`Warming scenario projections for ${city}`}
            head={["Warming", "Demand (GWh/day)", "CO₂ (tonnes/day)"]}
            rows={WARMING.filter((w) => w % 1 === 0).map((w) => [
              `+${w}°F`,
              fmtNum(data.demand[w * 2], 1),
              fmtNum(data.co2[w * 2]),
            ])}
          />
        </div>
      </div>
    </div>
  );
}
