/** A lab bench update — dated, raw, newest at the top of the file. */
export default function Update({
  date,
  title,
  children,
}: {
  date: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="relative border-l border-dashed border-line-loud pb-12 pl-7 last:pb-4">
      <span
        aria-hidden
        className="absolute top-[7px] -left-[4.5px] block h-2 w-2 rotate-45 bg-(--accent)"
      />
      <p className="font-mono text-label tracking-[0.18em] text-dim uppercase">
        {date}
      </p>
      {title && <h3 className="mt-1 mb-3 font-semibold text-bone">{title}</h3>}
      <div className="mt-2 space-y-4">{children}</div>
    </article>
  );
}
