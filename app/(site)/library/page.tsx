import type { Metadata } from "next";
import Link from "next/link";
import { libraryGroups } from "@/lib/library";
import { fullStamp } from "@/lib/content";

export const metadata: Metadata = {
  title: "Library",
  description:
    "The stacks — idea dossiers, hackathon lenses, decision records, and process manuals, mirrored daily from where they live on disk. The archive is curated; this is the raw shelf.",
};

const FRESH_DAYS = 14;
const isFresh = (syncedAt: string) =>
  Date.now() - new Date(syncedAt).getTime() <= FRESH_DAYS * 86_400_000;

export default function LibraryPage() {
  const groups = libraryGroups();
  const total = groups.reduce((n, g) => n + g.docs.length, 0);
  return (
    <div className="pt-36 pb-24">
      <header className="mb-14 px-5 md:px-10">
        <p className="font-mono text-label tracking-[0.16em] text-dim uppercase">
          /archive/library — {total} documents
        </p>
        <h1 className="mt-4 text-display font-black uppercase stretch-125">Library</h1>
        <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <p className="max-w-xl text-ash">
            The stacks behind the archive: idea dossiers, hackathon lenses, decision
            records, process manuals — mirrored from where they live on disk, provenance
            attached. The projects above are curated; this is the working corpus, published
            as it moves.
          </p>
          <p className="shrink-0 font-mono text-label tracking-[0.18em] text-dim uppercase md:text-right">
            MIRRORED — the source stays in its repo
            <br />
            UPDATED — changed in the last {FRESH_DAYS} days
          </p>
        </div>
      </header>

      {groups.map((g) => (
        <section key={g.id} className="mb-4">
          <p className="border-t border-line px-5 pt-6 pb-2 font-mono text-label tracking-[0.2em] text-dim uppercase md:px-10">
            {g.label} — {g.docs.length}
          </p>
          <ul>
            {g.docs.map((d) => (
              <li key={d.urlPath}>
                <Link
                  href={`/library/${d.urlPath}`}
                  className="group block border-t border-line/60 px-5 py-5 transition-colors duration-300 hover:bg-panel md:px-10"
                >
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-semibold text-bone group-hover:underline group-hover:underline-offset-4">
                      {d.title}
                    </span>
                    {isFresh(d.syncedAt) && (
                      <span className="font-mono text-label tracking-[0.18em] text-bone uppercase">
                        updated
                      </span>
                    )}
                    {d.status && (
                      <span className="font-mono text-label tracking-[0.18em] text-dim uppercase">
                        {d.status}
                      </span>
                    )}
                  </div>
                  {d.summary && (
                    <p className="mt-1 max-w-3xl text-[0.95rem] leading-relaxed text-ash">
                      {d.summary}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-mono-sm text-dim">
                    {d.source} · synced {fullStamp(d.syncedAt)}
                    {d.sourceCommit && ` · ${d.sourceCommit}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="mt-14 border-t border-line px-5 pt-8 md:px-10">
        <p className="max-w-xl font-mono text-mono-sm text-dim">
          Mirrored daily by a deterministic sync — no model in the loop. Every document
          names its source; the mirror changes only when the source does.
        </p>
      </div>
    </div>
  );
}
