import Reveal from "../Reveal";
import stats from "../../data/thesisStats.json";

const CARDS = [
  {
    title: "Data",
    short: "Ten years of EIA-930 hourly grid data × PRISM climate at five Oregon stations.",
    more: `Daily PACW demand, generation, interchange, and consumption-based CO₂ (July 2015 –
October 2025), merged with PRISM daily temperature, dew point, and precipitation extracted
at Albany, Eugene, Bend, Portland, and Medford. Albany — inside PACW's service territory —
is the production specification.`,
  },
  {
    title: "Model",
    short: "OLS carries temperature so extrapolation behaves; XGBoost mops up the calendar.",
    more: `A hybrid, two-layer design: ordinary least squares on temperature terms (mean, squared,
heating and cooling degree days below/above a 58°F base), then an XGBoost model fit to the
residuals using calendar and humidity features. Trees can't extrapolate beyond the data they
saw — so the variable the warming scenarios push out of range lives in the parametric layer.`,
  },
  {
    title: "Validation",
    short: `My first R² was inflated. The honest one is ${stats.albany.demandTestR2}.`,
    more: `A random train-test split leaked seasonal structure and flattered the emissions model.
The production models use a chronological 80/20 split — trained on the past, tested on the
future — giving demand test R² of ${stats.albany.demandTestR2} and emissions test R² of
${stats.albany.co2TestR2} at Albany. Weaker-looking, and true.`,
  },
];

export default function MethodsStrip() {
  return (
    <section id="methods" className="mx-auto max-w-[1440px] px-6 py-16 md:px-12">
      <Reveal>
        <p className="smallcaps">How I did it</p>
      </Reveal>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {CARDS.map((c, i) => (
          <Reveal key={c.title} delay={i * 80}>
            <details className="lift-card group rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5">
              <summary className="cursor-pointer select-none list-none">
                <p className="serif text-lg text-[hsl(var(--ink))]">{c.title}</p>
                <p className="mt-1.5 text-[0.88rem] leading-relaxed text-[hsl(var(--ink-soft))]">{c.short}</p>
                <p className="smallcaps mt-3 text-[hsl(var(--accent))] group-open:hidden">More +</p>
              </summary>
              <p className="mt-3 text-[0.85rem] leading-relaxed text-[hsl(var(--muted))]">{c.more}</p>
            </details>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <p className="mt-5 text-sm text-[hsl(var(--muted))]">
          Full methodology: Chapter 4 of the thesis. Every number on this page regenerates from
          public data with one script.
        </p>
      </Reveal>
    </section>
  );
}
