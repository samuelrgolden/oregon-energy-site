import Reveal from "./Reveal";
import stats from "../data/stats.json";

const HERO = {
  kicker: "A data investigation · Oregon's grid, 2015–2025",
  dek: `On July 7, 2022, coal vanished overnight from the books of PacifiCorp West —
the balancing authority serving most of Oregon. Reported emissions fell ${stats.emissionsDrop.pct}%.
The coal plant never stopped burning.`,
  byline: "Sam Golden · University of Oregon Data Science",
  source: "EIA-930 hourly grid data, July 2015 – October 2025",
};

export default function Hero() {
  return (
    <section id="top" className="mx-auto max-w-[1440px] px-6 pb-16 pt-20 md:px-12 md:pb-24 md:pt-28">
      <div className="grid grid-cols-12 gap-x-6 md:gap-x-10">
        <Reveal className="col-span-12 md:col-span-10">
          <p className="smallcaps">{HERO.kicker}</p>
          <h1 className="display mt-6 text-[clamp(2.8rem,7.5vw,6.5rem)]">
            The coal that vanished{" "}
            <span className="italic text-[hsl(var(--accent))]">on paper</span>
          </h1>
        </Reveal>
        <Reveal delay={140} className="col-span-12 mt-8 md:col-span-7">
          <p className="serif text-[1.35rem] leading-relaxed text-[hsl(var(--ink-soft))]">{HERO.dek}</p>
        </Reveal>
        <Reveal delay={220} className="col-span-12 mt-8 md:col-span-4 md:col-start-9 md:mt-10">
          <div className="rule mb-4" />
          <p className="text-sm font-medium text-[hsl(var(--ink))]">{HERO.byline}</p>
          <p className="mt-1 text-sm text-[hsl(var(--muted))]">{HERO.source}</p>
        </Reveal>
      </div>
    </section>
  );
}
