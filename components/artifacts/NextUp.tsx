/** What's next — numbered intentions, not promises. */
export default function NextUp({ items }: { items: string[] }) {
  return (
    <ol className="my-8 space-y-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-baseline gap-4 border-t border-line pt-4">
          <span className="font-mono text-label tracking-[0.16em] text-(--accent)">
            NX-{String(i + 1).padStart(2, "0")}
          </span>
          <span className="max-w-2xl text-bone/85">{item}</span>
        </li>
      ))}
    </ol>
  );
}
