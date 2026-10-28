import { useEffect, useRef, useState } from "react";

/** Responsive width via ResizeObserver. Returns [ref, width]. */
export function useMeasure() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

/** Width AND height via ResizeObserver, for charts that fill a flex box. Returns [ref, width, height]. */
export function useMeasureBox() {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
        const h = e.contentRect.height;
        setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size.w, size.h];
}

/** d3-free linear scale. */
export function scaleLinear([d0, d1], [r0, r1]) {
  const m = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  const fn = (v) => r0 + (v - d0) * m;
  fn.invert = (r) => (m === 0 ? d0 : d0 + (r - r0) / m);
  return fn;
}

/** Nice round ticks covering [min, max]. */
export function niceTicks(min, max, count = 5) {
  if (min === max) return [min];
  const span = max - min;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const norm = step0 / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + 1e-9; v += step) ticks.push(+v.toFixed(10));
  return ticks;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2022-07-07" -> "Jul 7, 2022"; "2022-07" -> "Jul 2022" */
export function fmtDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return d ? `${MONTHS[m - 1]} ${d}, ${y}` : `${MONTHS[m - 1]} ${y}`;
}

export function fmtNum(v, digits = 0) {
  if (v == null) return "–";
  return v.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Days since epoch for an ISO date — cheap numeric x-axis. */
export function dayNum(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d || 1) / 86400000;
}

/** Year tick positions (Jan 1) between two ISO dates, inclusive-ish. */
export function yearTicks(isoStart, isoEnd, every = 1) {
  const y0 = +isoStart.slice(0, 4) + 1;
  const y1 = +isoEnd.slice(0, 4);
  const out = [];
  for (let y = y0; y <= y1; y += every) out.push({ x: dayNum(`${y}-01-01`), label: String(y) });
  return out;
}

/** Build an SVG path from x/y arrays, skipping nulls. */
export function linePath(xs, ys, sx, sy) {
  let d = "";
  let pen = false;
  for (let i = 0; i < xs.length; i++) {
    const y = ys[i];
    if (y == null) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${sx(xs[i]).toFixed(1)},${sy(y).toFixed(1)}`;
    pen = true;
  }
  return d;
}

/** Nearest index in a sorted numeric array. */
export function nearestIndex(arr, v) {
  let lo = 0;
  let hi = arr.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < v) lo = mid;
    else hi = mid;
  }
  return v - arr[lo] < arr[hi] - v ? lo : hi;
}
