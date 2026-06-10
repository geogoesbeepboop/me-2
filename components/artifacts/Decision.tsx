/**
 * A decision record — what was chosen, what it was chosen over,
 * what it cost, what it paid. Tradeoffs as first-class artifacts.
 */
export default function Decision({
  n,
  title,
  chose,
  over,
  cost,
  payoff,
}: {
  n: string;
  title: string;
  chose: string;
  over: string;
  cost: string;
  payoff: string;
}) {
  return (
    <article className="my-6 grid border border-line md:grid-cols-[150px_1fr]">
      <div className="flex items-start border-b border-line bg-panel px-5 py-4 md:border-r md:border-b-0">
        <span className="font-mono text-label tracking-[0.18em] text-dim uppercase">
          Decision
          <span className="mt-1 block text-title font-bold tracking-normal text-bone">
            {n}
          </span>
        </span>
      </div>
      <div className="px-5 py-4">
        <h3 className="mb-4 font-semibold text-bone">{title}</h3>
        <dl className="grid gap-x-8 gap-y-3 text-[0.95rem] leading-relaxed md:grid-cols-2">
          {(
            [
              ["Chose", chose],
              ["Over", over],
              ["Cost", cost],
              ["Payoff", payoff],
            ] as const
          ).map(([label, text]) => (
            <div key={label}>
              <dt className="mb-1 font-mono text-label tracking-[0.18em] text-dim uppercase">
                {label}
              </dt>
              <dd className="text-ash">{text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
