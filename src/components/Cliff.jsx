import Reveal from "./Reveal";
import FuelBars from "../charts/FuelBars";
import GenImports from "../charts/GenImports";
import stats from "../data/stats.json";

const COPY = {
  title: "Coal falls off a cliff",
  body: [
    `Break local generation into its fuels and the cause is unmistakable. Coal was PACW's
single largest source — averaging ${stats.preShift.avgCoal} GWh a day. On July 6, 2022 it
collapsed to almost nothing; from July 7 onward it reads exactly zero. Not declining.
Zero, overnight.`,
    `Power plants don't retire like this. Physical retirements wind down unit by unit over
months. A one-day step to zero across an entire fleet is the signature of something else —
but first, look at what filled the hole.`,
  ],
  gapTitle: "Imports fill the gap, instantly",
  gapBody: `Demand didn't change, so the missing coal had to come from somewhere. The moment
local generation halved, imports rose by almost exactly the same amount. Before July 2022,
PACW generated ${stats.preShift.pctGenerated}% of what it consumed; after, just
${stats.postShift.pctGenerated}%, with ${stats.postShift.pctImported}% arriving from
neighboring grids.`,
};

const SHARE_CARDS = [
  { label: "Generated locally", before: stats.preShift.pctGenerated, after: stats.postShift.pctGenerated },
  { label: "Imported", before: stats.preShift.pctImported, after: stats.postShift.pctImported },
];

export default function Cliff() {
  return (
    <section id="cliff" className="mx-auto max-w-[1440px] px-6 py-14 md:px-12 md:py-16">
      <div className="grid grid-cols-12 gap-x-6 gap-y-8 md:gap-x-10">
        <Reveal className="col-span-12 md:col-span-4">
          <p className="smallcaps">03 · The event</p>
          <h2 className="display mt-3 text-[clamp(1.9rem,3.4vw,2.9rem)]">{COPY.title}</h2>
        </Reveal>
        <Reveal delay={120} className="col-span-12 md:col-span-7 md:col-start-6">
          {COPY.body.map((p, i) => (
            <p key={i} className="body-copy mb-4">
              {p}
            </p>
          ))}
        </Reveal>
        <Reveal className="col-span-12">
          <div className="rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5 md:p-7">
            <FuelBars />
          </div>
        </Reveal>

        <Reveal className="col-span-12 mt-6 md:col-span-4" id="gap">
          <p className="smallcaps">04 · The response</p>
          <h2 className="display mt-3 text-[clamp(1.9rem,3.4vw,2.9rem)]">{COPY.gapTitle}</h2>
          <div className="mt-6 space-y-3">
            {SHARE_CARDS.map((c) => (
              <div key={c.label} className="rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5">
                <p className="smallcaps">{c.label}</p>
                <p className="serif mt-2 text-[1.7rem] leading-tight text-[hsl(var(--ink))]">
                  {c.before}% <span aria-hidden="true" className="text-[hsl(var(--muted))]">→</span> {c.after}%
                </p>
                <p className="mt-1 text-xs text-[hsl(var(--muted))]">share of consumption, before → after July 2022</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={120} className="col-span-12 mt-6 md:col-span-7 md:col-start-6">
          <p className="body-copy mb-5">{COPY.gapBody}</p>
          <div className="rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5 md:p-7">
            <GenImports />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
