import stats from "../../data/thesisStats.json";
import { PinScene, phase, ease } from "../../lib/scroll";
import { fmtNum } from "../../charts/utils";

const COPY = {
  kicker: "Finding 03",
  title: "And none of it compares to a bookkeeping decision.",
  climateLabel: "Deepest climate-driven emissions cut, any city, any warming level",
  structuralLabel: "The July 2022 “coal retirement,” holding demand and weather constant",
  twist: [
    `Here's the thing about that second bar: the retirement never physically happened. `,
    `On July 7, 2022, the Jim Bridger plant's output moved from PACW's ledger to PacifiCorp
East's — a pseudo-tie accounting transfer. The units kept burning. Oregon's biggest
"decarbonization" was a change of address.`,
  ],
  cta: "Read the full investigation",
};

const BAR_MAX = 13000;

export default function Finding3() {
  const climate = stats.maxClimateDropAnyCity;
  const structural = stats.structuralDrop;

  return (
    <PinScene id="finding-3" heightVh={320} mobileHeightVh={220}>
      {(p) => {
        const enter = ease(phase(p, 0, 0.12));
        const bar1 = ease(phase(p, 0.12, 0.3));
        const bar2 = ease(phase(p, 0.42, 0.68));
        const twist = ease(phase(p, 0.72, 0.9));

        return (
          <div className="flex h-full items-center">
            <div className="mx-auto w-full max-w-[1440px] px-6 md:px-12">
              <div style={{ opacity: enter, transform: `translateY(${24 * (1 - enter)}px)` }}>
                <p className="smallcaps">{COPY.kicker}</p>
                <h2 className="display mt-3 max-w-3xl text-[clamp(1.8rem,3.2vw,2.8rem)]">{COPY.title}</h2>
              </div>

              <div className="mt-10 space-y-8">
                {/* climate bar */}
                <div style={{ opacity: bar1 > 0 ? 1 : 0 }}>
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="max-w-md text-[0.85rem] text-[hsl(var(--ink-soft))]">{COPY.climateLabel}</p>
                    <p className="serif text-[1.6rem] tabular-nums text-[hsl(var(--ink))]" style={{ opacity: bar1 }}>
                      −{fmtNum(climate * bar1)} <span className="text-sm text-[hsl(var(--muted))]">t/day</span>
                    </p>
                  </div>
                  <div className="mt-2 h-8 w-full overflow-hidden rounded-md bg-[hsl(var(--paper-deep))]">
                    <div
                      className="h-full rounded-md"
                      style={{ width: `${(climate / BAR_MAX) * 100 * bar1}%`, background: "var(--c-wind)" }}
                    />
                  </div>
                </div>

                {/* structural bar */}
                <div style={{ opacity: bar2 > 0 ? 1 : 0 }}>
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="max-w-md text-[0.85rem] text-[hsl(var(--ink-soft))]">{COPY.structuralLabel}</p>
                    <p className="serif text-[2.2rem] tabular-nums text-[hsl(var(--ink))]" style={{ opacity: bar2 }}>
                      −{fmtNum(structural * bar2)} <span className="text-sm text-[hsl(var(--muted))]">t/day</span>
                    </p>
                  </div>
                  <div className="mt-2 h-8 w-full overflow-hidden rounded-md bg-[hsl(var(--paper-deep))]">
                    <div
                      className="h-full rounded-md"
                      style={{ width: `${(structural / BAR_MAX) * 100 * bar2}%`, background: "var(--c-coal)" }}
                    />
                  </div>
                  <p className="mt-1.5 text-[0.75rem] text-[hsl(var(--muted))]" style={{ opacity: bar2 }}>
                    ~{(structural / climate).toFixed(0)}× larger. Statistically dominant in every specification tested (t &gt; 48).
                  </p>
                </div>
              </div>

              {/* the twist */}
              <div
                className="mt-10 max-w-3xl"
                style={{ opacity: twist, transform: `translateY(${20 * (1 - twist)}px)` }}
              >
                <p className="serif text-[1.15rem] leading-relaxed text-[hsl(var(--ink))]">
                  {COPY.twist[0]}
                </p>
                <p className="body-copy mt-3">{COPY.twist[1]}</p>
                <a
                  href="/bridger/"
                  className="btn-flow lift mt-6 inline-block rounded-full border border-[hsl(var(--accent))] px-6 py-2.5 text-sm font-medium text-[hsl(var(--accent))] hover:text-[hsl(var(--paper))] [--flow:hsl(var(--accent))]"
                >
                  {COPY.cta} →
                </a>
              </div>
            </div>
          </div>
        );
      }}
    </PinScene>
  );
}
