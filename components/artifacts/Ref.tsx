import Link from "next/link";
import { resolveRef } from "@/lib/content";

/**
 * An inline deep-link into another node — the writing reaches into
 * specific dossier sections (and back). Rendered from the graph, so a
 * broken ref simply doesn't render.
 */
export default function Ref({ to, note }: { to: string; note?: string }) {
  const res = resolveRef(to);
  if (!res) return null;

  return (
    <Link
      href={res.href}
      className="group my-8 flex max-w-[68ch] items-baseline gap-3 border border-line bg-panel px-5 py-4 font-mono text-mono-sm transition-colors duration-300 hover:border-line-loud"
    >
      <span aria-hidden className="text-(--accent)">
        ↳
      </span>
      <span className="text-label tracking-[0.18em] text-dim uppercase">
        {res.tag}
      </span>
      <span className="text-bone">
        {res.title}
        {note && <span className="mt-1 block text-[0.78rem] text-dim">{note}</span>}
      </span>
      <span
        aria-hidden
        className="ml-auto text-dim transition-transform duration-300 ease-(--ease-cine) group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}
