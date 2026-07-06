/**
 * The ladder — ceremony matched to stakes. Each rung is a real front
 * door (a skill on this machine); the tick meter climbs with the
 * stakes. Static by design: a reference card, not a performance.
 */
export interface LadderRung {
  /** the front door, e.g. "just ask" or "/deep-plan" */
  skill: string;
  /** when this is the right rung — one line */
  when: string;
  /** what comes back — one line */
  gets: string;
}

function Ticks({ level, of }: { level: number; of: number }) {
  return (
    <span className="flex items-center gap-[3px]" aria-hidden>
      {Array.from({ length: of }, (_, i) => (
        <span
          key={i}
          className={`block h-[10px] w-[5px] ${
            i < level ? "bg-ash" : "border border-line"
          }`}
        />
      ))}
    </span>
  );
}

export default function Ladder({
  title,
  caption,
  rungs,
}: {
  title: string;
  caption?: string;
  rungs: LadderRung[];
}) {
  return (
    <figure className="my-10 border border-line bg-panel">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-3">
        <span className="font-mono text-label tracking-[0.18em] text-dim uppercase">
          {title}
        </span>
        {caption && (
          <span className="font-mono text-label tracking-[0.06em] text-dim">
            {caption}
          </span>
        )}
      </figcaption>
      <div className="hidden grid-cols-[64px_180px_1.2fr_1fr] gap-x-6 border-b border-line px-5 py-2.5 font-mono text-label tracking-[0.18em] text-dim uppercase md:grid">
        <span>Stakes</span>
        <span>Front door</span>
        <span>When</span>
        <span>What comes back</span>
      </div>
      <ol className="divide-y divide-line">
        {rungs.map((r, i) => (
          <li
            key={r.skill}
            className="grid gap-x-6 gap-y-1.5 px-5 py-3.5 md:grid-cols-[64px_180px_1.2fr_1fr] md:items-baseline"
          >
            <span className="md:self-center">
              <Ticks level={i + 1} of={rungs.length} />
            </span>
            <span className="font-mono text-mono-sm font-semibold text-bone">
              {r.skill}
            </span>
            <span className="font-mono text-mono-sm text-ash">{r.when}</span>
            <span className="font-mono text-mono-sm text-dim">{r.gets}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
