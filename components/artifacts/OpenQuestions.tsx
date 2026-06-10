/** Open questions — the honest edge of the work. */
export default function OpenQuestions({ items }: { items: string[] }) {
  return (
    <div className="my-10 border border-dashed border-line-loud">
      <p className="border-b border-dashed border-line-loud px-5 py-3 font-mono text-label tracking-[0.18em] text-dim uppercase">
        Open questions
      </p>
      <ol className="divide-y divide-dashed divide-line">
        {items.map((q, i) => (
          <li key={i} className="flex items-baseline gap-4 px-5 py-4">
            <span className="font-mono text-label tracking-[0.16em] text-(--accent)">
              Q-{String(i + 1).padStart(2, "0")}
            </span>
            <span className="max-w-2xl text-[0.98rem] text-bone/85">{q}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
