export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-14 md:flex-row md:items-end md:justify-between md:px-10">
        <div>
          <p className="text-title font-extrabold uppercase stretch-110">
            Build fast, adapt faster —<br className="hidden md:block" /> and
            publish the how.
          </p>
          <p className="mt-4 font-mono text-mono-sm text-ash">
            <a
              href="mailto:georgeandrade93@gmail.com"
              className="text-bone underline-offset-4 hover:underline"
            >
              georgeandrade93@gmail.com
            </a>
            <span className="mx-3 text-dim">·</span>
            <a
              href="https://x.com/geobuilds"
              className="underline-offset-4 hover:underline"
            >
              @geobuilds
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-3 font-mono text-label tracking-[0.18em] uppercase md:items-end">
          <a
            href="/method"
            className="text-ash underline-offset-4 hover:underline"
          >
            N°000 — the method →
          </a>
          <p className="text-dim">© 2026 George Andrade-Muñoz</p>
        </div>
      </div>
    </footer>
  );
}
