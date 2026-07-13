import Link from "next/link";
import type { Node } from "@/lib/content";
import { decisionsFor } from "@/lib/library";
import { fullStamp } from "@/lib/content";

/**
 * DECISION NOTES — the dossier's engineering-depth strip.
 * Lists this repo's ADRs, mirrored into the library by the daily sync
 * (decisions/<repo-basename>, derived from the entry's `repo:` registry
 * field). The dossier tells the story; these are the calls it rests on,
 * verbatim, with provenance. Renders nothing when the repo keeps no ADRs.
 */
export default function DecisionNotes({ node }: { node: Node }) {
  if (!node.repo) return null;
  const docs = decisionsFor(node.repo);
  if (docs.length === 0) return null;
  return (
    <section id="decision-records" className="mt-16 scroll-mt-36">
      <p className="border-t border-line pt-6 font-mono text-label tracking-[0.2em] text-dim uppercase">
        Decision notes — {docs.length} ADRs, mirrored from the repo
      </p>
      <ul className="mt-4">
        {docs.map((d) => (
          <li key={d.urlPath}>
            <Link
              href={`/library/${d.urlPath}`}
              className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-line/60 py-3"
            >
              <span className="text-bone group-hover:underline group-hover:underline-offset-4">
                {d.title}
              </span>
              <span className="font-mono text-label tracking-[0.16em] text-dim uppercase">
                {d.status ?? "—"} · synced {fullStamp(d.syncedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
