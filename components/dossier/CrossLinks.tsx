import Link from "next/link";
import { backlinks, resolveRef, tagOf, type Node } from "@/lib/content";

/**
 * The archive's connective tissue — rendered from the content graph,
 * so every link here is real and bidirectional. REFERENCES come from
 * this node's frontmatter; REFERENCED BY is computed from every other
 * node that points back.
 */
export default function CrossLinks({ node, n = "XX" }: { node: Node; n?: string }) {
  // refs land at the top of a piece, so two refs into the same piece
  // collapse to one row
  const seen = new Set<string>();
  const outbound = node.refs
    .map((r) => ({ raw: r, res: resolveRef(r) }))
    .filter((r) => {
      if (!r.res || seen.has(r.res.href)) return false;
      seen.add(r.res.href);
      return true;
    });
  const inbound = backlinks(node.path);

  if (outbound.length === 0 && inbound.length === 0) return null;

  return (
    <section
      id="related"
      aria-label="Related work"
      className="scroll-mt-32 border-t border-line py-12 md:py-16"
    >
      <header className="mb-8 flex items-baseline gap-4">
        <span className="font-mono text-label tracking-[0.2em] text-(--accent)">{n}</span>
        <h2 className="text-title font-extrabold uppercase stretch-110">
          Related
        </h2>
      </header>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <p className="mb-4 font-mono text-label tracking-[0.2em] text-dim uppercase">
            References →
          </p>
          <ul className="space-y-3">
            {outbound.map(({ raw, res }) => (
              <li key={raw}>
                <Link
                  href={res!.href}
                  className="group flex items-baseline gap-3 font-mono text-mono-sm"
                >
                  <span className="text-label tracking-[0.18em] text-dim uppercase">
                    {res!.tag}
                  </span>
                  <span className="text-bone underline-offset-4 group-hover:underline">
                    {res!.title}
                  </span>
                </Link>
              </li>
            ))}
            {outbound.length === 0 && (
              <li className="font-mono text-mono-sm text-dim">— none yet</li>
            )}
          </ul>
        </div>
        <div>
          <p className="mb-4 font-mono text-label tracking-[0.2em] text-dim uppercase">
            ← Referenced by
          </p>
          <ul className="space-y-3">
            {inbound.map((n) => (
              <li key={n.path}>
                <Link
                  href={`/${n.path}`}
                  className="group flex items-baseline gap-3 font-mono text-mono-sm"
                >
                  <span className="text-label tracking-[0.18em] text-dim uppercase">
                    {tagOf(n)}
                  </span>
                  <span className="text-bone underline-offset-4 group-hover:underline">
                    {n.title}
                  </span>
                </Link>
              </li>
            ))}
            {inbound.length === 0 && (
              <li className="font-mono text-mono-sm text-dim">— none yet</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
