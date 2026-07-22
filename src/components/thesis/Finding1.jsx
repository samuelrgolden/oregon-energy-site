import { useMemo, useRef, useState } from "react";
import ucurve from "../../data/ucurve.json";
import { PinScene, phase, ease } from "../../lib/scroll";
import { scaleLinear, niceTicks, fmtNum, linePath } from "../../charts/utils";
import { YAxis } from "../../charts/Frame";
import { useMeasure } from "../../charts/utils";

const COPY = {
  kicker: "Finding 01",
  title: "This grid runs on heating, not cooling.",
  body: [
    `Every dot is one day: that day's average temperature in Albany against how much
electricity the PACW grid delivered. The curve the model fits through them is a shallow
U with its bottom near 58°F — and the cold side is where Oregon lives.`,
    `Oregon heats with electricity far more than it cools. Across ten years, the grid spent
half again as many days on the cold side of that curve as the hot side. So the first
effect of warming is relief: fewer degrees of heating to supply.`,
  ],
  hint: "The curve draws as you scroll — watch how much steeper the cold side climbs.",
};

const H = 440;
const M = { top: 28, right: 20, bottom: 34, left: 58 };

function UCurveChart({ p }) {
  const [ref, width] = useMeasure();
  const [hover, setHover] = useState(null);
  const pathRef = useRef(null);

  const W = Math.max(width, 320);
  const x0 = M.left;
  const x1 = W - M.right;
  const y1 = H - M.bottom;

  const dLo = 40, dHi = 85; // GWh/day window (clips a few extreme days for shape clarity)
  const sx = scaleLinear([18, 102], [x0, x1]);
  const sy = scaleLinear([dLo, dHi], [y1, M.top]);

  const scatterIn = ease(phase(p, 0.05, 0.4));
  const drawIn = phase(p, 0.25, 0.75);
  const markerIn = ease(phase(p, 0.8, 0.95));

  const curveD = useMemo(
    () => linePath(ucurve.temps, ucurve.curveGWh, sx, sy),
    [W] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const pathLen = pathRef.current?.getTotalLength?.() ?? 1400;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = sx.invert(e.clientX - rect.left);
    if (t < 20 || t > 100) return setHover(null);
    setHover(Math.round(t));
  };

  const hoverY = hover != null ? ucurve.curveGWh[hover - 20] : null;

  return (
    <div ref={ref} className="relative">
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Daily demand versus temperature in Albany: a U-shaped curve with its minimum near 58 degrees Fahrenheit and a steeper cold side."
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <YAxis ticks={niceTicks(dLo, dHi, 4)} sy={sy} x0={x0} x1={x1} unit="GWh / day" />
        {[20, 40, 58, 80, 100].map((t) => (
          <text key={t} x={sx(t)} y={y1 + 20} textAnchor="middle" fontSize="11" fill="hsl(var(--muted))" aria-hidden="true">
            {t}°F
          </text>
        ))}
        <g opacity={scatterIn * 0.85}>
          {ucurve.scatter.map(([t, d], i) =>
            d < dLo || d > dHi ? null : (
              <circle key={i} cx={sx(t)} cy={sy(d)} r="2.2" fill="var(--c-hydro)" opacity="0.4" />
            )
          )}
        </g>
        <path
          ref={pathRef}
          d={curveD}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeDasharray={pathLen}
          strokeDashoffset={pathLen * (1 - drawIn)}
        />
        {/* comfort-point marker */}
        <g opacity={markerIn} style={{ transform: `scale(${0.6 + 0.4 * markerIn})`, transformOrigin: `${sx(58)}px ${sy(ucurve.curveGWh[38])}px` }}>
          <line x1={sx(58)} x2={sx(58)} y1={sy(ucurve.curveGWh[38])} y2={y1} stroke="hsl(var(--accent))" strokeWidth="1" strokeDasharray="3 4" />
          <circle cx={sx(58)} cy={sy(ucurve.curveGWh[38])} r="5" fill="hsl(var(--accent))" stroke="var(--chart-surface)" strokeWidth="2" />
          <text x={sx(58)} y={y1 - 8} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="hsl(var(--accent))">
            58°F — the comfort point
          </text>
        </g>
        {hover != null && hoverY != null && (
          <circle cx={sx(hover)} cy={sy(hoverY)} r="4.5" fill="hsl(var(--accent))" stroke="var(--chart-surface)" strokeWidth="2" aria-hidden="true" />
        )}
      </svg>
      {hover != null && hoverY != null && (
        <div className="chart-tooltip" style={{ left: `${Math.min(Math.max((sx(hover) / W) * 100, 10), 72)}%`, top: 0 }}>
          <div className="tt-title">{hover}°F average day</div>
          <div>Fitted demand: {fmtNum(hoverY, 1)} GWh</div>
          <div className="text-[hsl(var(--muted))]">
            {hover < 58 ? `+${fmtNum(hoverY - ucurve.curveGWh[38], 1)} GWh vs a 58°F day` : hover > 58 ? `+${fmtNum(hoverY - ucurve.curveGWh[38], 1)} GWh vs a 58°F day` : "the minimum"}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Finding1() {
  return (
    <PinScene id="finding-1" heightVh={220} mobileHeightVh={160}>
      {(p) => {
        const enter = ease(phase(p, 0, 0.18));
        return (
          <div className="flex h-full items-center">
            <div className="mx-auto grid w-full max-w-[1440px] grid-cols-12 gap-x-6 px-6 md:gap-x-10 md:px-12">
              <div
                className="col-span-12 md:col-span-4"
                style={{ opacity: enter, transform: `translateY(${24 * (1 - enter)}px)` }}
              >
                <p className="smallcaps">{COPY.kicker}</p>
                <h2 className="display mt-3 text-[clamp(1.8rem,3vw,2.6rem)]">{COPY.title}</h2>
                {COPY.body.map((t, i) => (
                  <p key={i} className="body-copy mt-4 hidden text-[0.98rem] md:block">
                    {t}
                  </p>
                ))}
                <p className="mt-4 text-[0.8rem] text-[hsl(var(--muted))]">{COPY.hint}</p>
              </div>
              <div
                className="col-span-12 mt-6 md:col-span-8 md:mt-0"
                style={{ opacity: enter }}
              >
                <div className="rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5 md:p-7">
                  <UCurveChart p={p} />
                </div>
                <p className="mt-3 text-[0.85rem] leading-relaxed text-[hsl(var(--ink-soft))] md:hidden">
                  {COPY.body[0]}
                </p>
              </div>
            </div>
          </div>
        );
      }}
    </PinScene>
  );
}
