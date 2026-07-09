import type { Metadata } from "next";
import Link from "next/link";
import SearchEntry from "@/components/search/SearchEntry";
import OperatorPanel from "@/components/library/OperatorPanel";
import {
  decisionShelves,
  featuredDocs,
  libraryShelves,
  unlistedCount,
  type LibraryDoc,
} from "@/lib/library";
import { fullStamp, nodesOf } from "@/lib/content";

export const metadata: Metadata = {
  title: "Library",
  description:
    "The reading room behind the archive — the idea lenses, the working method, and every engineering decision, mirrored daily from where the work actually happens.",
};

const FRESH_DAYS = 14;
const isFresh = (syncedAt: string) =>
  Date.now() - new Date(syncedAt).getTime() <= FRESH_DAYS * 86_400_000;

function Stamp({ d }: { d: LibraryDoc }) {
  return (
    <p className="mt-2 font-mono text-mono-sm text-dim">
      {d.source} · synced {fullStamp(d.syncedAt)}
      {d.sourceCommit && ` · ${d.sourceCommit}`}
    </p>
  );
}

function Badges({ d }: { d: LibraryDoc }) {
  return (
    <>
      {isFresh(d.syncedAt) && (
        <span className="font-mono text-label tracking-[0.18em] text-bone uppercase">updated</span>
      )}
      {d.status && (
        <span className="font-mono text-label tracking-[0.18em] text-dim uppercase">{d.status}</span>
      )}
    </>
  );
}

export default function LibraryPage() {
  const featured = featuredDocs();
  const shelves = libraryShelves();
  const decisions = decisionShelves();
  const adrCount = decisions.reduce((n, g) => n + g.docs.length, 0);
  // repo basename → project slug, resolved through the repo: registry
  const projectOf = new Map(
    nodesOf("projects")
      .filter((n) => n.repo)
      .map((n) => [n.repo!.split("/").pop()!, n.slug])
  );
  const shelved = shelves.reduce(
    (n, s) => n + s.entries.reduce((m, e) => m + 1 + (e.series?.history.length ?? 0), 0),
    0
  );
  const deep = unlistedCount();

  return (
    <div className="pt-36 pb-24">
      <header className="mb-12 px-5 md:px-10">
        <p className="font-mono text-label tracking-[0.16em] text-dim uppercase">
          /archive/library
        </p>
        <h1 className="mt-4 text-display font-black uppercase stretch-125">Library</h1>
        <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <p className="max-w-xl text-ash">
            The reading room behind the archive: the idea lenses this work grows from, the
            method it runs on, and every engineering decision on record — mirrored daily from
            where the documents actually live, provenance attached.
          </p>
          <p className="shrink-0 font-mono text-label tracking-[0.18em] text-dim uppercase md:text-right">
            {shelved} on the shelf · {adrCount} decision records
            <br />
            {deep} more in the deep stacks — ⌘K finds them
          </p>
        </div>
        <SearchEntry />
      </header>

      {/* ── START HERE — the editor's picks ── */}
      {featured.length > 0 && (
        <section className="mb-4">
          <p className="border-t border-line px-5 pt-6 pb-4 font-mono text-label tracking-[0.2em] text-dim uppercase md:px-10">
            Start here
          </p>
          <div className="grid gap-px border-y border-line bg-line/40 sm:grid-cols-3">
            {featured.map((d) => (
              <Link
                key={d.urlPath}
                href={`/library/${d.urlPath}`}
                className="group block bg-void px-5 py-6 transition-colors duration-300 hover:bg-panel md:px-8"
              >
                <p className="font-mono text-label tracking-[0.18em] text-dim uppercase">
                  {d.collection}
                </p>
                <p className="mt-2 font-semibold text-bone group-hover:underline group-hover:underline-offset-4">
                  {d.title}
                </p>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-ash line-clamp-3">
                  {d.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── the shelves — listed collections, series folded ── */}
      {shelves.map((shelf) => (
        <section key={shelf.id} className="mb-4">
          <p className="border-t border-line px-5 pt-6 pb-2 font-mono text-label tracking-[0.2em] text-dim uppercase md:px-10">
            {shelf.label}
          </p>
          <ul>
            {shelf.entries.map((e) => (
              <li key={e.doc.urlPath}>
                <Link
                  href={`/library/${e.doc.urlPath}`}
                  className="group block border-t border-line/60 px-5 py-5 transition-colors duration-300 hover:bg-panel md:px-10"
                >
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    {e.series && (
                      <span className="font-mono text-label tracking-[0.18em] text-dim uppercase">
                        series
                      </span>
                    )}
                    <span className="font-semibold text-bone group-hover:underline group-hover:underline-offset-4">
                      {e.series ? `${e.series.label} — current: ${e.doc.title}` : e.doc.title}
                    </span>
                    <Badges d={e.doc} />
                  </div>
                  {e.doc.summary && (
                    <p className="mt-1 max-w-3xl text-[0.95rem] leading-relaxed text-ash">
                      {e.doc.summary}
                    </p>
                  )}
                  <Stamp d={e.doc} />
                </Link>
                {e.series && e.series.history.length > 0 && (
                  <p className="border-t border-line/40 px-5 pb-4 pt-2 font-mono text-mono-sm text-dim md:px-10">
                    earlier lenses:{" "}
                    {e.series.history.map((h, i) => (
                      <span key={h.urlPath}>
                        {i > 0 && " · "}
                        <Link
                          href={`/library/${h.urlPath}`}
                          className="text-ash underline-offset-4 hover:underline"
                        >
                          {h.title}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* ── decision records — every agent's ADRs, one collapsed shelf ── */}
      {decisions.length > 0 && (
        <details className="group/decisions border-t border-line">
          <summary className="cursor-pointer list-none px-5 py-6 font-mono text-label tracking-[0.2em] text-dim uppercase transition-colors duration-300 hover:text-ash md:px-10">
            <span aria-hidden className="mr-3 inline-block transition-transform duration-300 group-open/decisions:rotate-90">
              ▸
            </span>
            Decision records — {adrCount} ADRs across{" "}
            {decisions.map((g) => `${g.repo} ${g.docs.length}`).join(" · ")}
            <span className="ml-3 normal-case tracking-normal text-dim">
              (each also lives on its project&apos;s dossier)
            </span>
          </summary>
          {decisions.map((g) => (
            <div key={g.repo}>
              <p className="border-t border-line/60 px-5 pt-4 pb-1 font-mono text-label tracking-[0.18em] text-ash uppercase md:px-10">
                {projectOf.has(g.repo) ? (
                  <Link
                    href={`/projects/${projectOf.get(g.repo)}`}
                    className="hover:underline hover:underline-offset-4"
                  >
                    {g.repo}
                  </Link>
                ) : (
                  g.repo
                )}
              </p>
              <ul className="pb-3">
                {g.docs.map((d) => (
                  <li key={d.urlPath}>
                    <Link
                      href={`/library/${d.urlPath}`}
                      className="group flex flex-wrap items-baseline gap-x-4 gap-y-0.5 px-5 py-1.5 transition-colors duration-150 hover:bg-panel md:px-10"
                    >
                      <span className="text-[0.95rem] text-bone/85 group-hover:underline group-hover:underline-offset-4">
                        {d.title}
                      </span>
                      {d.status && (
                        <span className="font-mono text-label tracking-[0.14em] text-dim uppercase">
                          {d.status}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </details>
      )}

      <div className="mt-14 border-t border-line px-5 pt-8 md:px-10">
        <p className="max-w-xl font-mono text-mono-sm text-dim">
          Mirrored daily by a deterministic sync — no model in the loop. Every document names
          its source; the mirror changes only when the source does. The deep stacks (idea
          dossiers, reference material) stay off the shelf on purpose — search reaches them.
        </p>
      </div>

      {/* the hidden shelf — renders only where the operator API answers */}
      <OperatorPanel />
    </div>
  );
}
