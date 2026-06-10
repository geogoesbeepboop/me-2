import type { TraceData, TraceSpan } from "@/lib/inspect/types";

/**
 * A Langfuse-style trace, drawn in the archive's own hand — waterfall
 * of spans, model calls, deterministic gates, and the scores the run
 * pushed. No screenshots in this archive; the span names, models,
 * scores, and gates are the real wiring.
 */

const TYPE_STYLE: Record<
  TraceSpan["type"],
  { tag: string; color: string }
> = {
  span: { tag: "SPAN", color: "var(--color-dim)" },
  generation: { tag: "GEN", color: "var(--color-cyan)" },
  gate: { tag: "GATE", color: "var(--accent)" },
  event: { tag: "EVENT", color: "var(--color-ash)" },
};

function fmtMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 90_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

export default function TraceView({ trace }: { trace: TraceData }) {
  return (
    <div className="font-mono">
      {/* trace header — the root row */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line px-5 py-3">
        <span className="text-label tracking-[0.18em] text-bone uppercase">
          TRACE
        </span>
        <span className="text-mono-sm text-bone">{trace.title}</span>
        <span className="ml-auto text-label tracking-[0.1em] text-dim">
          {fmtMs(trace.total)} total
        </span>
      </div>
      {trace.subtitle && (
        <p className="border-b border-line px-5 py-2.5 text-label tracking-[0.1em] text-dim">
          {trace.subtitle}
        </p>
      )}

      {/* waterfall */}
      <ul className="divide-y divide-line/60">
        {trace.spans.map((s, i) => {
          const t = TYPE_STYLE[s.type];
          const leftPct = (s.start / trace.total) * 100;
          const widthPct = Math.max((s.dur / trace.total) * 100, 0.8);
          return (
            <li key={i} className="px-5 py-2.5">
              <div className="flex items-baseline gap-3">
                <span
                  style={{ paddingLeft: s.depth * 16, color: t.color }}
                  className="w-[88px] shrink-0 text-[10px] tracking-[0.14em]"
                >
                  {t.tag}
                </span>
                <span
                  className={`shrink-0 text-mono-sm ${
                    s.status === "fail" ? "text-ember" : "text-bone"
                  }`}
                  style={{ paddingLeft: s.depth * 16 }}
                >
                  {s.name}
                </span>
                {s.detail && (
                  <span className="min-w-0 truncate text-label tracking-[0.04em] text-dim">
                    {s.detail}
                  </span>
                )}
                <span className="ml-auto shrink-0 text-label text-dim">
                  {fmtMs(s.dur)}
                </span>
              </div>
              {/* timeline bar */}
              <div className="mt-1.5 h-[3px] w-full bg-panel-2">
                <div
                  className="h-full"
                  style={{
                    marginLeft: `${leftPct}%`,
                    width: `${widthPct}%`,
                    background:
                      s.status === "fail" ? "var(--color-ember)" : t.color,
                    opacity: s.type === "span" ? 0.55 : 0.9,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* scores — the names are the real ones the code pushes */}
      {trace.scores && trace.scores.length > 0 && (
        <div className="border-t border-line px-5 py-3.5">
          <p className="mb-2.5 text-label tracking-[0.2em] text-dim uppercase">
            Scores on this trace
          </p>
          <div className="flex flex-wrap gap-2">
            {trace.scores.map((sc) => (
              <span
                key={sc.name}
                className="border border-line bg-panel-2 px-2.5 py-1 text-label tracking-[0.06em]"
              >
                <span className="text-dim">{sc.name}</span>{" "}
                <span className={sc.accent ? "text-(--accent)" : "text-bone"}>
                  {sc.value}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {trace.footnote && (
        <p className="border-t border-line px-5 py-2.5 text-label tracking-[0.1em] text-dim">
          {trace.footnote}
        </p>
      )}
    </div>
  );
}
