import Link from "next/link";
import { backlinks, KIND_TAG, resolveRef, type Node } from "@/lib/content";

/**
 * The archive's connective tissue — rendered from the content graph,
 * so every link here is real and bidirectional. REFERENCES come from
 * this node's frontmatter; REFERENCED BY is computed from every other
 * node that points back.
 */
export default function CrossLinks({ node, n = "XX" }: { node: Node; n?: string }) {
  const outbound = node.refs
    .map((r) => ({ raw: r, res: resolveRef(r) }))
    .filter((r) => r.res);
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
                    {KIND_TAG[res!.kind]}
                  </span>
                  <span className="text-bone underline-offset-4 group-hover:underline">
                    {res!.title}
                    {res!.anchorTitle && (
                      <span className="text-ash"> § {res!.anchorTitle}</span>
                    )}
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
                    {KIND_TAG[n.kind]}
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
