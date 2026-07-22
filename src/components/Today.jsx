import Reveal from "./Reveal";
import TodayMix from "../charts/TodayMix";
import stats from "../data/stats.json";

const COPY = {
  title: "The grid PACW became",
  body: [
    `Post-transfer PACW is a different kind of grid: a net importer that generates only a
quarter of what its customers use. What it still generates itself is led by hydro,
with wind and a fast-growing solar fleet behind it — all of it swinging with the
seasons, because water, wind, and sun are climate-driven resources.`,
    `That's the second half of this project's thesis: as the Northwest warms, both the
demand for electricity and the supply that meets it move with the weather. Understanding
this grid means reading its climate signal — and reading its ledger carefully.`,
  ],
};

const TILES = [
  { label: "Imports", value: stats.recent12mo.importsShare, color: "var(--c-import)" },
  { label: "Hydro", value: stats.recent12mo.hydroShare, color: "var(--c-hydro)" },
  { label: "Wind", value: stats.recent12mo.windShare, color: "var(--c-wind)" },
  { label: "Solar", value: stats.recent12mo.solarShare, color: "var(--c-solar)" },
];

export default function Today() {
  return (
    <section id="today" className="mx-auto max-w-[1440px] px-6 py-14 md:px-12 md:py-16">
      <div className="grid grid-cols-12 gap-x-6 gap-y-8 md:gap-x-10">
        <Reveal className="col-span-12 md:col-span-4">
          <p className="smallcaps">07 · The present</p>
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
            <Reveal
              key={t.label}
              delay={i * 80}
              className="lift-card rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5"
            >
              <p className="smallcaps">
                <span className="swatch" style={{ background: t.color }} aria-hidden="true" />
                {t.label}
              </p>
              <p className="serif mt-2 text-[2.2rem] leading-none text-[hsl(var(--ink))]">{t.value}%</p>
              <p className="mt-1.5 text-xs text-[hsl(var(--muted))]">of consumption, last 12 months of data</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="col-span-12">
          <div className="rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5 md:p-7">
            <TodayMix />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
