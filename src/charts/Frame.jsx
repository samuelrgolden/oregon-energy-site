import { fmtNum } from "./utils";

/** Horizontal gridlines + y tick labels. */
export function YAxis({ ticks, sy, x0, x1, unit }) {
  // show decimals when the tick step is fractional (e.g. 58.2, 58.4 — not 58, 58)
  const step = ticks.length > 1 ? Math.abs(ticks[1] - ticks[0]) : 1;
  const digits = step < 1 ? Math.min(2, Math.ceil(-Math.log10(step) - 1e-9)) : 0;
  return (
    <g aria-hidden="true">
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={x0}
            x2={x1}
            y1={sy(t)}
            y2={sy(t)}
            stroke="hsl(var(--ink) / 0.08)"
            strokeWidth="1"
          />
          <text
            x={x0 - 8}
            y={sy(t)}
            dy="0.32em"
            textAnchor="end"
            fontSize="11"
            fill="hsl(var(--muted))"
          >
            {fmtNum(t, digits)}
          </text>
        </g>
      ))}
      {unit && (
        <text x={2} y={sy(ticks[ticks.length - 1]) - 14} textAnchor="start" fontSize="11" fill="hsl(var(--muted))">
          {unit}
        </text>
      )}
    </g>
  );
}

/** Year labels along the bottom. */
export function XAxis({ ticks, sx, y }) {
  return (
    <g aria-hidden="true">
      {ticks.map((t) => (
        <text
          key={t.label}
          x={sx(t.x)}
          y={y + 18}
          textAnchor="middle"
          fontSize="11"
          fill="hsl(var(--muted))"
        >
          {t.label}
        </text>
      ))}
    </g>
  );
}

/** Dashed vertical marker for the July 2022 books transfer. */
export function ShiftMarker({ x, y0, y1, label = "Jul 7, 2022 — coal leaves the books" }) {
  return (
    <g>
      <line x1={x} x2={x} y1={y0} y2={y1} stroke="hsl(var(--accent))" strokeWidth="1.5" strokeDasharray="5 4" />
      <text
        x={x + 6}
        y={y0 + 12}
        fontSize="11"
        fontWeight="500"
        fill="hsl(var(--accent))"
      >
        {label}
      </text>
    </g>
  );
}

/** Inline legend row (identity is never color-alone: labels sit beside swatches). */
export function Legend({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.78rem] text-[hsl(var(--ink-soft))]">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center">
          <span className="swatch" style={{ background: it.color }} aria-hidden="true" />
          {it.label}
        </span>
      ))}
    </div>
  );
}

/** Collapsible table view — the accessibility relief for every chart. */
export function TableView({ caption, head, rows }) {
  return (
    <details className="mt-3">
      <summary className="smallcaps cursor-pointer select-none hover:text-[hsl(var(--accent))]">
        View as table
      </summary>
      <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-[hsl(var(--ink)/0.1)]">
        <table className="data-table">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-[hsl(var(--surface))]">
            <tr>
              {head.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
