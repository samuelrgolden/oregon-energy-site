import Reveal from "./Reveal";
import stats from "../data/stats.json";
import { fmtNum } from "../charts/utils";

const COPY = {
  title: "First, the grid itself",
  body: [
    `PacifiCorp West — PACW — is a balancing authority: the entity responsible for matching
electricity supply to demand, second by second, across most of Oregon plus slices of
Washington and northern California. It is a small player nationally, but it is the grid
that keeps the lights on for much of the state.`,
    `Every hour, PACW reports its demand, its own generation, its trade with neighboring
grids, and an estimate of the carbon embodied in the electricity its customers actually
consume. Ten years of those reports are the raw material for everything below.`,
  ],
};

const TILES = [
  { label: "Avg. daily demand", value: stats.decade.avgDemand, unit: "GWh / day", digits: 1 },
  { label: "Avg. local generation", value: stats.decade.avgNetGen, unit: "GWh / day", digits: 1 },
  { label: "Avg. interchange", value: stats.decade.avgInterchange, unit: "GWh / day (net imports)", digits: 1 },
  { label: "Avg. CO₂ consumed", value: stats.decade.avgCo2, unit: "tonnes / day", digits: 0 },
];

export default function GridIntro() {
  return (
    <section id="grid" className="mx-auto max-w-[1440px] px-6 py-14 md:px-12 md:py-16">
      <div className="grid grid-cols-12 gap-x-6 gap-y-8 md:gap-x-10">
        <Reveal className="col-span-12 md:col-span-4">
          <p className="smallcaps">01 · The setting</p>
          <h2 className="display mt-3 text-[clamp(1.9rem,3.4vw,2.9rem)]">{COPY.title}</h2>
        </Reveal>
        <Reveal delay={120} className="col-span-12 md:col-span-7 md:col-start-6">
          {COPY.body.map((p, i) => (
            <p key={i} className="body-copy mb-4">
              {p}
            </p>
          ))}
        </Reveal>
        <div className="col-span-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {TILES.map((t, i) => (
            <Reveal key={t.label} delay={i * 80} className="lift-card rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5">
              <p className="smallcaps">{t.label}</p>
              <p className="serif mt-2 text-[2.2rem] leading-none text-[hsl(var(--ink))]">
                {fmtNum(t.value, t.digits)}
              </p>
              <p className="mt-1.5 text-xs text-[hsl(var(--muted))]">{t.unit}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="col-span-12">
          <p className="text-xs text-[hsl(var(--muted))]">
            Ten-year averages, July 2015 – October 2025. Negative interchange means PACW imports more than it exports —
            and it has imported, on net, every year of the decade.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
