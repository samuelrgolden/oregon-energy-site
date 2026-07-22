import { useTheme } from "../lib/useTheme";

const LINKS = [
  { href: "#trends", label: "The data" },
  { href: "#cliff", label: "The cliff" },
  { href: "#catch", label: "The catch" },
  { href: "#books", label: "The books" },
  { href: "#today", label: "Today" },
];

export default function Nav() {
  const [theme, toggleTheme] = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-[hsl(var(--ink)/0.1)] bg-[hsl(var(--paper)/0.85)] backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3 md:px-12">
        <div className="flex items-center gap-5">
          <a href="/" className="serif text-lg text-[hsl(var(--ink))]">
            OR<span className="italic text-[hsl(var(--accent))]">/</span>grid
          </a>
          <a
            href="/"
            className="link-wipe hidden text-sm text-[hsl(var(--muted))] hover:text-[hsl(var(--accent))] sm:inline-block"
          >
            ← The thesis
          </a>
        </div>
        <div className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="link-wipe inline-block text-sm text-[hsl(var(--ink-soft))] hover:text-[hsl(var(--accent))]">
              {l.label}
            </a>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="lift rounded-full border border-[hsl(var(--ink)/0.2)] px-3.5 py-1.5 text-xs font-medium text-[hsl(var(--ink-soft))] hover:border-[hsl(var(--accent))]"
          aria-pressed={theme === "dark"}
        >
          {theme === "dark" ? "Light" : "Dark"} mode
        </button>
      </nav>
    </header>
  );
}
