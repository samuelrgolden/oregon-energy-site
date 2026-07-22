import Reveal from "./Reveal";
import EmissionsSplit from "../charts/EmissionsSplit";
import stats from "../data/stats.json";
import { fmtNum } from "../charts/utils";

const COPY = {
  title: "The books vs. the sky",
  body: [
    `On PACW's books, the transfer looks like a climate triumph: consumption-based CO₂
fell ${stats.emissionsDrop.pct}%, about ${fmtNum(stats.emissionsDrop.absPerDay)} tonnes a
day. Counted by generation, it's starker still — CO₂ attributed to electricity generated
inside PACW fell from 7.9 million tonnes in 2021 to essentially zero in 2023. That
paper reduction alone is larger than everything Oregon's HB 2021 requires of PacifiCorp
by 2030.`,
    `The sky saw much less. Bridger's smoke now enters the ledger through the back door:
PACW imports power at PACE's average carbon intensity, so the coal arrives diluted —
averaged together with Wyoming wind and gas — rather than counted at full strength.
Some of the measured drop is real (units 1–2 did convert to gas in 2024); much of it
is arithmetic.`,
    `This is the correction this dashboard exists to make. An earlier version of this
project — and my thesis, before its final revision — read the July 2022 step as
structural decarbonization. The deeper story is about how emissions accounting behaves
at a reporting boundary: a resource-shuffling case study hiding in plain sight in
public data.`,
  ],
};

const TILES = [
  {
    label: "CO₂ consumed, before",
    value: fmtNum(stats.preShift.avgCo2),
    unit: "tonnes / day, avg",
    tone: "before",
  },
  {
    label: "CO₂ consumed, after",
    value: fmtNum(stats.postShift.avgCo2),
    unit: "tonnes / day, avg",
    tone: "after",
  },
  {
    label: "Drop on the books",
    value: `−${stats.emissionsDrop.pct}%`,
    unit: `${fmtNum(stats.emissionsDrop.absPerDay)} tonnes / day`,
    tone: "accent",
  },
  {
    label: "Change at the smokestack",
    value: "≈ 0",
    unit: "that week — the units kept running",
    tone: "plain",
  },
];

const toneStyle = {
  before: { borderColor: "color-mix(in srgb, var(--c-before) 45%, transparent)" },
  after: { borderColor: "color-mix(in srgb, var(--c-after) 55%, transparent)" },
  accent: {},
  plain: {},
};

export default function Books() {
  return (
    <section id="books" className="mx-auto max-w-[1440px] px-6 py-14 md:px-12 md:py-16">
      <div className="grid grid-cols-12 gap-x-6 gap-y-8 md:gap-x-10">
        <Reveal className="col-span-12 md:col-span-4">
          <p className="smallcaps">06 · The accounting</p>
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
              style={toneStyle[t.tone]}
            >
              <p className="smallcaps">{t.label}</p>
              <p className="serif mt-2 text-[2rem] leading-none text-[hsl(var(--ink))]">{t.value}</p>
              <p className="mt-1.5 text-xs text-[hsl(var(--muted))]">{t.unit}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="col-span-12">
          <div className="rounded-2xl border border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--surface))] p-5 md:p-7">
            <EmissionsSplit />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
