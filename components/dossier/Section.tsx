/**
 * A dossier section — stable anchor, mono index number, display title.
 * Every major section is deep-linkable; posts link straight into these.
 */
export default function Section({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 border-t border-line py-12 md:py-16">
      <header className="group mb-8 flex items-baseline gap-4">
        <span className="font-mono text-label tracking-[0.2em] text-(--accent)">
          {n}
        </span>
        <h2 className="text-title font-extrabold uppercase stretch-110">
          {title}
        </h2>
        <a
          href={`#${id}`}
          aria-label={`Link to ${title}`}
          className="font-mono text-mono-sm text-dim opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
        >
          #
        </a>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
