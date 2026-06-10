/** Current state of a lab bench — terse key/value readout. */
export default function Bench({ rows }: { rows: { k: string; v: string }[] }) {
  return (
    <dl className="my-10 grid border border-dashed border-line-loud font-mono text-mono-sm sm:grid-cols-2">
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex flex-col gap-1 border-b border-dashed border-line px-5 py-4 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0"
        >
          <dt className="text-label tracking-[0.18em] text-dim uppercase">
            {row.k}
          </dt>
          <dd className="text-bone">{row.v}</dd>
        </div>
      ))}
    </dl>
  );
}
