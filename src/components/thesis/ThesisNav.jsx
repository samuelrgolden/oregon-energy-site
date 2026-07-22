export default function ThesisNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 md:px-12">
        <a href="#top" className="serif text-lg text-[hsl(var(--ink))]">
          OR<span className="italic text-[hsl(var(--accent))]">/</span>grid
        </a>
        <a
          href="/bridger/"
          className="link-wipe inline-block text-sm text-[hsl(var(--ink-soft))] hover:text-[hsl(var(--accent))]"
        >
          The investigation
        </a>
      </nav>
    </header>
  );
}
