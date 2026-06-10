export interface TimelineEntry {
  date: string;
  title: string;
  note?: string;
  tag?: string;
}

/** Build timeline — a left rail of dated marks. The pace of the work, visible. */
export default function BuildTimeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="my-10 border-l border-line pl-8">
      {entries.map((e, i) => (
        <li key={i} className="relative pb-10 last:pb-2">
          <span
            aria-hidden
            className="absolute top-[7px] -left-[37px] block h-2 w-2 rotate-45 bg-(--accent)"
          />
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-mono text-label tracking-[0.16em] text-dim uppercase">
              {e.date}
            </span>
            {e.tag && (
              <span className="border border-line px-2 py-0.5 font-mono text-label tracking-[0.12em] text-ash uppercase">
                {e.tag}
              </span>
            )}
          </div>
          <p className="mt-1 font-semibold text-bone">{e.title}</p>
          {e.note && (
            <p className="mt-1 max-w-xl text-[0.95rem] leading-relaxed text-ash">
              {e.note}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
