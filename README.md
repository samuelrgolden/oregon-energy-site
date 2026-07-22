# The Coal That Vanished on Paper

A data-story site about Oregon's grid, 2015–2025: on July 7, 2022, coal
disappeared overnight from PacifiCorp West's (PACW) books and reported
emissions fell 63% — but the Jim Bridger plant kept burning. The "retirement"
was a pseudo-tie accounting transfer to PacifiCorp East (PACE), documented
here from public EIA data and regulatory filings.

Built from my Clark Honors College thesis, *Climate and the Oregon Energy
Grid* (University of Oregon Data Science). This replaces the earlier
Plotly Dash dashboard on Hugging Face Spaces.

## Stack

- Vite + React + Tailwind v4, static build — no server, no chart library
- Charts are hand-built SVG components (`src/charts/`), themed light/dark
  via CSS custom properties
- Data is precomputed JSON in `src/data/`, exported from the thesis parquet

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
```

## Updating the data

The source of truth is `../oregon-energy-dashboard/daily_pacw.parquet`
(EIA-930 daily aggregates). Regenerate the JSON with:

```bash
python3 scripts/export_data.py
```

The script converts the parquet's hourly-mean values into honest daily
totals (GWh/day, tonnes CO₂/day) and precomputes the monthly aggregates
and headline stats the site displays.

## Sources

- EIA-930 hourly grid monitor (demand, generation, interchange, CO₂)
- EIA-860M generator inventory (Jim Bridger unit status & balancing authority)
- Wyoming PSC Docket 20000-682-EM-25; Washington UTC Docket UE-230482
  (PacifiCorp testimony on the pseudo-tie)
- Open Grid Emissions (Singularity Energy) — independent documentation of
  the PACW anomaly

— Sam Golden · samuelrgolden@gmail.com
