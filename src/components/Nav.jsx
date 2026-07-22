import { useEffect, useState } from "react";

const LINKS = [
  { href: "#trends", label: "The data" },
  { href: "#cliff", label: "The cliff" },
  { href: "#catch", label: "The catch" },
  { href: "#books", label: "The books" },
  { href: "#today", label: "Today" },
];

function getInitialTheme() {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function Nav() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <header className="sticky top-0 z-50 border-b border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--paper)/0.85)] backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3 md:px-12">
        <a href="#top" className="serif text-lg text-[hsl(var(--ink))]">
          OR<span className="italic text-[hsl(var(--accent))]">/</span>grid
        </a>
        <div className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="link-wipe inline-block text-sm text-[hsl(var(--ink-soft))] hover:text-[hsl(var(--accent))]">
              {l.label}
            </a>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="lift rounded-full border border-[hsl(var(--ink)/0.2)] px-3.5 py-1.5 text-xs font-medium text-[hsl(var(--ink-soft))] hover:border-[hsl(var(--accent))]"
          aria-pressed={theme === "dark"}
        >
          {theme === "dark" ? "Light" : "Dark"} mode
        </button>
      </nav>
    </header>
  );
}
