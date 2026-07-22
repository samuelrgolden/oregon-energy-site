import Reveal from "./Reveal";

const COPY = {
  title: "The catch: the plant never closed",
  body: [
    `The coal in question is the Jim Bridger Power Plant — four units in the Wyoming
desert, one of the largest coal stations in the West. Bridger sits physically inside
PacifiCorp's *eastern* balancing authority, PACE. For years it was "pseudo-tied" into
PACW: telemetered and scheduled so that the western grid counted it as its own
generation, and carried its emissions.`,
    `In July 2022, that accounting arrangement ended. Bridger's output — and its carbon —
moved from PACW's ledger to PACE's. The units kept running. Nothing about the physical
grid changed that week except which column the electrons were tallied in.`,
    `No press release announced this. EIA's own documentation never mentions it. The
transfer surfaces only in the data itself — and in a handful of regulatory filings,
years later.`,
  ],
};

const EVIDENCE = [
  {
    tag: "Federal registry",
    text: "EIA-860M generator data, June and December 2022: all four Jim Bridger units listed as Operating, balancing authority PACE — before and after the 'disappearance.' No retirement occurred.",
  },
  {
    tag: "PacifiCorp, in writing",
    text: "A 2025 Wyoming PSC rebuttal states that Jim Bridger had “historically been a PACW resource, pseudo tied into PACW” prior to 2023. A 2024 Washington UTC filing confirms the plant is physically located in PACE.",
  },
  {
    tag: "Blind breakpoint test",
    text: "A single-breakpoint scan over PACW's coal series — given no dates — lands on July 6, 2022: exactly the documented cutover, zero days off.",
  },
  {
    tag: "Independent confirmation",
    text: "The Open Grid Emissions project flagged the same anomaly in September 2022: PACW's reported rates inflated by coal generation that plant-level data placed elsewhere. Raw EIA-930 files even contain a PACW–PACE channel that exists only for the cutover week.",
  },
  {
    tag: "Still burning",
    text: "Units 1–2 converted to natural gas in 2024; units 3–4 burn coal today. In early 2026 Bridger generated 869 GWh from coal and 557 GWh from gas — reported under PACE.",
  },
  {
    tag: "The policy backdrop",
    text: "Washington's CETA required coal-free allocation by 2025; Oregon's HB 2021 demands steep cuts by 2030. Whether the transfer was driven by compliance accounting or grid operations, the filings don't say — the motive question remains open.",
  },
];

export default function Catch() {
  return (
    <section id="catch" className="bg-[hsl(var(--accent-soft)/0.45)]">
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 md:py-20">
        <div className="grid grid-cols-12 gap-x-6 gap-y-8 md:gap-x-10">
          <Reveal className="col-span-12 md:col-span-4">
            <p className="smallcaps">05 · The finding</p>
            <h2 className="display mt-3 text-[clamp(1.9rem,3.4vw,2.9rem)]">{COPY.title}</h2>
          </Reveal>
          <Reveal delay={120} className="col-span-12 md:col-span-7 md:col-start-6">
            {COPY.body.map((p, i) => (
              <p key={i} className="body-copy mb-4">
                {p.split("*").map((chunk, j) =>
                  j % 2 ? (
                    <em key={j} className="text-[hsl(var(--accent))]">
                      {chunk}
                    </em>
                  ) : (
                    chunk
                  )
                )}
              </p>
            ))}
          </Reveal>
          <div className="col-span-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {EVIDENCE.map((e, i) => (
              <Reveal
                key={e.tag}
                delay={i * 70}
                className="lift-card rounded-2xl border border-[hsl(var(--ink)/0.12)] bg-[hsl(var(--surface))] p-5"
              >
                <p className="smallcaps text-[hsl(var(--accent))]">{e.tag}</p>
                <p className="mt-2.5 text-[0.92rem] leading-relaxed text-[hsl(var(--ink-soft))]">{e.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
