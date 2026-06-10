export interface Breakage {
  title: string;
  sev: string;
  what: string;
  fix: string;
  lesson: string;
}

/**
 * The candid section. Each failure is a filed incident: severity stamp,
 * what happened, the fix, the lesson. Ember is earned here.
 */
export default function WhatBroke({ items }: { items: Breakage[] }) {
  return (
    <div className="my-10 space-y-6">
      {items.map((item, i) => (
        <article key={i} className="border border-line bg-panel">
          <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line px-5 py-3">
            <span className="font-mono text-label tracking-[0.18em] text-ember uppercase">
              {item.sev}
            </span>
            <h3 className="font-semibold text-bone">{item.title}</h3>
          </header>
          <div className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {(
              [
                ["What happened", item.what, "text-ash"],
                ["The fix", item.fix, "text-ash"],
                ["The lesson", item.lesson, "text-bone"],
              ] as const
            ).map(([label, text, tone]) => (
              <div key={label} className="px-5 py-4">
                <p className="mb-2 font-mono text-label tracking-[0.18em] text-dim uppercase">
                  {label}
                </p>
                <p className={`text-[0.95rem] leading-relaxed ${tone}`}>{text}</p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
