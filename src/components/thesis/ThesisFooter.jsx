const CITATION = `Golden, S. R. (2026). Climate and the Oregon Energy Grid: Modeling
Climate-Driven Demand and Emissions Under 21st Century Warming Scenarios
[Bachelor's thesis, University of Oregon, Robert D. Clark Honors College].`;

const LINKS = [
  { label: "The Bridger investigation", href: "/bridger/" },
  { label: "EIA-930 grid monitor", href: "https://www.eia.gov/electricity/gridmonitor/" },
  { label: "PRISM Climate Group", href: "https://prism.oregonstate.edu/" },
];

export default function ThesisFooter() {
  return (
    <footer className="border-t border-[hsl(var(--ink)/0.12)]">
      <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12">
        <div className="grid grid-cols-12 gap-x-6 gap-y-8 md:gap-x-10">
          <div className="col-span-12 md:col-span-6">
            <p className="serif text-lg text-[hsl(var(--ink))]">
              OR<span className="italic text-[hsl(var(--accent))]">/</span>grid
            </p>
            <p className="mt-3 max-w-md font-mono text-[0.72rem] leading-relaxed text-[hsl(var(--muted))]">
              {CITATION}
            </p>
            {/* PDF link goes here once Sam exports it:
            <a href="/thesis.pdf" className="...">Download the thesis (PDF)</a> */}
          </div>
          <div className="col-span-6 md:col-span-3">
            <p className="smallcaps mb-3">Explore</p>
            <ul className="space-y-2">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="link-wipe inline-block text-sm text-[hsl(var(--ink-soft))] hover:text-[hsl(var(--accent))]"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-6 md:col-span-3">
            <p className="smallcaps mb-3">Sam Golden</p>
            <ul className="space-y-2">
              <li>
                <a href="mailto:samuelrgolden@gmail.com" className="link-wipe inline-block text-sm text-[hsl(var(--ink-soft))] hover:text-[hsl(var(--accent))]">
                  samuelrgolden@gmail.com
                </a>
              </li>
              <li>
                <a href="https://github.com/samuelrgolden" className="link-wipe inline-block text-sm text-[hsl(var(--ink-soft))] hover:text-[hsl(var(--accent))]">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="rule mt-10" />
        <p className="mt-4 text-xs text-[hsl(var(--muted))]">
          Set in Fraunces &amp; Inter. The ridgelines behind the title are ten years of real
          PACW demand. No chart library, no server, no tracking.
        </p>
      </div>
    </footer>
  );
}
