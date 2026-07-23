import { useCallback, useEffect, useState } from "react";

const KEY = "or-grid-theme";

/** Read the stored theme; default to dark. */
function stored() {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

/** Apply a theme by stamping <html data-theme>. Dark is the attribute-less default. */
function apply(theme) {
  const root = document.documentElement;
  if (theme === "light") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
}

/** Call once, before render, from each entry point. */
export function initTheme() {
  apply(stored());
}

/** Theme state + toggle, shared via a tiny event so all mounts stay in sync. */
export function useTheme() {
  const [theme, setTheme] = useState(stored);

  useEffect(() => {
    const onChange = () => setTheme(stored());
    window.addEventListener("themechange", onChange);
    return () => window.removeEventListener("themechange", onChange);
  }, []);

  const toggle = useCallback(() => {
    const next = stored() === "light" ? "dark" : "light";
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    apply(next);
    window.dispatchEvent(new Event("themechange"));
  }, []);

  return [theme, toggle];
}
