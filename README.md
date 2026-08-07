# Oregon Is Warming — What Does That Do to Its Grid?

An interactive tour of my Clark Honors College thesis, *Climate and the Oregon
Energy Grid: Modeling Climate-Driven Demand and Emissions Under 21st Century
Warming Scenarios* (University of Oregon Data Science). Ten years of PACW grid
data modeled against climate, then warmed — the reader turns the temperature up
and watches the grid respond.

The site runs three findings and a methods strip:

1. **A grid that heats** — demand and emissions across the temperature range
2. **Turn up the temperature** — the warming scenarios, scrubbed by scroll
3. **Why: the days migrate** — the temperature-band distribution pouring across
   the 58°F line
4. **How I did it** — data, model, and validation cards

## Stack

- Vite + React + Tailwind v4, static build — no server, no chart library
- Charts are hand-built SVG components (`src/charts/`), themed light/dark
  via CSS custom properties
- Scroll-pinned scenes and the progress rail live in `src/lib/scroll.jsx`
- Data is precomputed JSON in `src/data/`, exported from the thesis parquet

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
```

## Updating the data

The source of truth is `../oregon-energy-dashboard/daily_pacw.parquet`
(EIA-930 daily aggregates) merged with the PRISM climate extracts.
Regenerate the JSON with:

```bash
python3 scripts/export_thesis_data.py
```

## Sources

- EIA-930 hourly grid monitor (demand, generation, interchange, CO₂)
- PRISM Climate Group daily temperature, dew point, and precipitation at
  Albany, Eugene, Bend, Portland, and Medford

— Sam Golden · samuelrgolden@gmail.com
