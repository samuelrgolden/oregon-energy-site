import { useTheme } from "../../lib/useTheme";

export default function ThesisNav() {
  const [theme, toggleTheme] = useTheme();

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 md:px-12">
        <a href="#top" className="serif text-lg text-[hsl(var(--ink))]">
          OR<span className="italic text-[hsl(var(--accent))]">/</span>grid
        </a>
        <div className="flex items-center gap-4">
          <a
            href="/bridger/"
            className="link-wipe hidden text-sm text-[hsl(var(--ink-soft))] hover:text-[hsl(var(--accent))] sm:inline-block"
          >
            The investigation
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            className="lift rounded-full border border-[hsl(var(--ink)/0.2)] bg-[hsl(var(--paper)/0.6)] px-3.5 py-1.5 text-xs font-medium text-[hsl(var(--ink-soft))] backdrop-blur-sm hover:border-[hsl(var(--accent))]"
            aria-pressed={theme === "dark"}
          >
            {theme === "dark" ? "Light" : "Dark"} mode
          </button>
        </div>
      </nav>
    </header>
  );
}
