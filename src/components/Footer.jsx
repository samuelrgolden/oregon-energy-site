import stats from "../data/stats.json";
import { fmtDate } from "../charts/utils";

const SOURCES = [
  { label: "EIA-930 hourly grid monitor (demand, generation, interchange, CO₂)", href: "https://www.eia.gov/electricity/gridmonitor/" },
  { label: "EIA-860M generator inventory (Jim Bridger unit status & balancing authority)", href: "https://www.eia.gov/electricity/data/eia860m/" },
  { label: "Open Grid Emissions — independent documentation of the PACW anomaly", href: "https://github.com/singularity-energy/open-grid-emissions" },
];

const CONTACT = [
  { label: "samuelrgolden@gmail.com", href: "mailto:samuelrgolden@gmail.com" },
  { label: "GitHub", href: "https://github.com/samuelrgolden" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--ink)/0.12)]">
      <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12">
        <div className="grid grid-cols-12 gap-x-6 gap-y-8 md:gap-x-10">
          <div className="col-span-12 md:col-span-5">
            <p className="serif text-lg text-[hsl(var(--ink))]">
              OR<span className="italic text-[hsl(var(--accent))]">/</span>grid
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[hsl(var(--muted))]">
              Built from my Clark Honors College thesis on climate and the Oregon grid,
              University of Oregon Data Science. Every number on this page is reproducible
              from public EIA data, {fmtDate(stats.dataStart)} – {fmtDate(stats.dataEnd)}.
            </p>
          </div>
          <div className="col-span-12 md:col-span-4">
            <p className="smallcaps mb-3">Sources</p>
            <ul className="space-y-2">
              {SOURCES.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="link-wipe inline-block text-sm text-[hsl(var(--ink-soft))] hover:text-[hsl(var(--accent))]"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-[hsl(var(--muted))]">
              PacifiCorp filings: Wyoming PSC Docket 20000-682-EM-25; Washington UTC Docket UE-230482.
            </p>
          </div>
          <div className="col-span-12 md:col-span-3">
            <p className="smallcaps mb-3">Sam Golden</p>
            <ul className="space-y-2">
              {CONTACT.map((c) => (
                <li key={c.href}>
                  <a
                    href={c.href}
                    className="link-wipe inline-block text-sm text-[hsl(var(--ink-soft))] hover:text-[hsl(var(--accent))]"
                  >
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rule mt-10" />
        <p className="mt-4 text-xs text-[hsl(var(--muted))]">
          Set in Fraunces &amp; Inter. Charts are hand-built SVG — no chart library, no server, no tracking.
        </p>
      </div>
    </footer>
  );
}
