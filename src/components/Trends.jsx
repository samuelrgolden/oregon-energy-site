import Reveal from "./Reveal";
import TrendExplorer from "../charts/TrendExplorer";

const COPY = {
  title: "Ten years, four signals",
  body: [
    `Demand is the steady heartbeat of the series — it swings with the seasons (Oregon heats
with electricity far more than it cools) but barely drifts across the decade.`,
    `The other three signals are not steady. Flip between them and watch mid-2022: local
generation halves, interchange lurches deeper into imports, and reported CO₂ steps down
to a permanently lower regime — all in the same week, while demand doesn't move.`,
  ],
};

export default function Trends() {
  return (
    <section id="trends" className="mx-auto max-w-[1440px] px-6 py-14 md:px-12 md:py-16">
      <div className="grid grid-cols-12 gap-x-6 gap-y-8 md:gap-x-10">
        <Reveal className="col-span-12 md:col-span-4">
          <p className="smallcaps">02 · The data</p>
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
            <TrendExplorer />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
