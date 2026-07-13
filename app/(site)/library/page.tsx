import type { Metadata } from "next";
import Link from "next/link";
import SearchEntry from "@/components/search/SearchEntry";
import OperatorPanel from "@/components/library/OperatorPanel";
import {
  decisionShelves,
  libraryShelves,
  unlistedCount,
  type LibraryDoc,
  type Shelf,
} from "@/lib/library";
import { nodesOf } from "@/lib/content";

export const metadata: Metadata = {
  title: "Library",
  description:
    "The reading room behind the archive — the idea lenses, the working method, and every engineering decision, mirrored daily from where the work actually happens.",
};

function sourceDate(d: LibraryDoc): string {
  return d.sourceMtime.slice(0, 10);
}

function SectionHead({
  number,
  title,
  note,
  id,
}: {
  number: string;
  title: string;
  note: string;
  id: string;
}) {
  return (
    <div className="mb-10 grid items-end gap-x-8 gap-y-4 md:grid-cols-[2rem_minmax(0,1fr)_auto]">
      <span className="pb-2 font-mono text-label tracking-[0.18em] text-dim">{number}</span>
      <h2
        id={id}
        className="text-[clamp(2.5rem,5vw,4.8rem)] font-black leading-none tracking-[-0.035em] text-bone uppercase"
      >
        {title}
      </h2>
      <p className="max-w-xl pb-2 font-mono text-label leading-relaxed tracking-[0.18em] text-dim uppercase md:text-right">
        {note}
      </p>
    </div>
  );
}

function DocCard({ d, kicker }: { d: LibraryDoc; kicker: string }) {
  return (
    <Link
      href={`/library/${d.urlPath}`}
      className="group flex flex-col bg-void px-5 py-7 text-inherit no-underline transition-colors duration-300 hover:bg-panel sm:min-h-60 md:px-8"
    >
      <p className="font-mono text-label tracking-[0.2em] text-dim uppercase">{kicker}</p>
      <h3 className="mt-5 text-[1.08rem] font-semibold leading-snug text-bone group-hover:underline group-hover:underline-offset-4">
        {d.title}
      </h3>
      {d.summary && (
        <p className="mt-4 line-clamp-3 text-[0.95rem] leading-relaxed text-ash">{d.summary}</p>
      )}
      <time className="mt-auto pt-6 font-mono text-mono-sm text-dim" dateTime={sourceDate(d)}>
        {sourceDate(d)}
      </time>
    </Link>
  );
}

function ShelfCard({ shelf, entry }: { shelf: Shelf; entry: Shelf["entries"][number] }) {
  const kicker = `${shelf.id === "hackathons" ? "lens" : "guide"} · ${shelf.label}`;
  return (
    <li className="flex min-w-0 flex-col bg-void">
      <DocCard d={entry.doc} kicker={kicker} />
      {entry.series && entry.series.history.length > 0 && (
        <p className="border-t border-line/60 px-5 py-3 font-mono text-mono-sm leading-relaxed text-dim md:px-8">
          HISTORY: {entry.series.history.map((h, i) => (
            <span key={h.urlPath}>
              {i > 0 && " · "}
              <Link href={`/library/${h.urlPath}`} className="text-ash underline-offset-4 hover:underline">
                {h.title}
              </Link>
            </span>
          ))}
        </p>
      )}
    </li>
  );
}

function MethodCard() {
  return (
    <Link
      href="/method"
      className="group mb-4 block border border-line border-l-2 border-l-bone/50 bg-panel px-5 py-8 text-inherit no-underline transition-colors duration-300 hover:bg-bone/5 md:px-8 md:py-9"
    >
      <p className="font-mono text-label tracking-[0.2em] text-dim uppercase">
        N°000 · guided overview
      </p>
      <h3 className="mt-4 text-[1.35rem] font-semibold text-bone group-hover:underline group-hover:underline-offset-4">
        The Method
      </h3>
      <p className="mt-4 max-w-4xl text-[0.98rem] leading-relaxed text-ash">
        The day-to-day operating system around the projects: skills, parallel lanes,
        verification, overnight gates, and the publishing loop.
      </p>
    </Link>
  );
}

function ShelfSection({ shelf, number }: { shelf: Shelf; number: string }) {
  const lenses = shelf.id === "hackathons";
  const title = lenses ? "Working notes and lenses" : "How I work";
  const note = lenses
    ? "Current lenses and field guides, preserved with source and revision history"
    : "The operating guides behind the work, mirrored from the live harness";
  return (
    <section className="border-t border-line px-5 py-16 md:px-10 md:py-20" aria-labelledby={`shelf-${shelf.id}`}>
      <SectionHead number={number} title={title} note={note} id={`shelf-${shelf.id}`} />
      {!lenses && <MethodCard />}
      <ul className={`grid gap-px border border-line bg-line/60 ${lenses ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {shelf.entries.map((entry) => (
          <ShelfCard key={entry.doc.urlPath} shelf={shelf} entry={entry} />
        ))}
      </ul>
    </section>
  );
}

export default function LibraryPage() {
  const shelves = [...libraryShelves()].sort((a, b) => {
    const rank = (id: string) => (id === "harness" ? 0 : id === "hackathons" ? 1 : 2);
    return rank(a.id) - rank(b.id);
  });
  const howIWork = shelves.find((shelf) => shelf.id === "harness");
  const remainingShelves = shelves.filter((shelf) => shelf.id !== "harness");
  const decisions = decisionShelves().filter((group) => group.repo !== "procurement-agent");
  const adrCount = decisions.reduce((n, group) => n + group.docs.length, 0);
  const shelved = shelves.reduce(
    (n, shelf) => n + shelf.entries.reduce((m, entry) => m + 1 + (entry.series?.history.length ?? 0), 0),
    0
  );
  const deep = unlistedCount();
  const projectByRepo = new Map(
    nodesOf("projects")
      .filter((node) => node.repo)
      .map((node) => [node.repo!.split("/").pop()!, { slug: node.slug, title: node.title }])
  );
  return (
    <div className="pt-36 pb-24">
      <header className="mb-14 px-5 md:px-10">
        <p className="font-mono text-label tracking-[0.16em] text-dim uppercase">/archive/library</p>
        <h1 className="mt-4 text-display font-black uppercase stretch-125">Library</h1>
        <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <p className="max-w-xl text-ash">
            The source documents behind the archive: working lenses, operating guides, and the
            engineering decisions that made the projects necessary.
          </p>
          <p className="shrink-0 font-mono text-label tracking-[0.18em] text-dim uppercase md:text-right">
            {shelved} on the shelf · {adrCount} decision records
            <br />
            {deep} more in the deep stacks — ⌘K finds them
          </p>
        </div>
        <SearchEntry />
      </header>

      {howIWork && <ShelfSection shelf={howIWork} number="01" />}

      {decisions.length > 0 && (
        <section className="border-t border-line px-5 py-16 md:px-10 md:py-20" aria-labelledby="library-decisions">
          <SectionHead
            number="02"
            title="Decisions"
            note="Read in the project that made them necessary"
            id="library-decisions"
          />
          <div className="border-y border-line">
            {decisions.map((group) => {
              const project = projectByRepo.get(group.repo);
              const label = project?.title ?? group.repo;
              const latest = group.docs.slice(-3).reverse();
              return (
                <article
                  key={group.repo}
                  className="grid gap-6 border-b border-line py-8 last:border-b-0 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-10"
                >
                  <div>
                    <h3 className="text-[1.05rem] font-semibold text-bone">{label}</h3>
                    <p className="mt-3 font-mono text-mono-sm tracking-[0.1em] text-dim">
                      {group.docs.length} decision records
                    </p>
                    <p className="mt-2 font-mono text-label tracking-[0.18em] text-dim uppercase">
                      latest {latest.length} of {group.docs.length}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <ul className="space-y-2">
                      {latest.map((d) => (
                        <li key={d.urlPath}>
                          <Link
                            href={`/library/${d.urlPath}`}
                            className="text-[0.92rem] leading-relaxed text-ash underline-offset-4 hover:text-bone hover:underline"
                          >
                            {d.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {project && (
                      <Link
                        href={`/projects/${project.slug}#decision-records`}
                        className="mt-5 inline-block font-mono text-label tracking-[0.2em] text-bone uppercase underline-offset-4 hover:underline"
                      >
                        See all decisions in the {label} dossier →
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {remainingShelves.map((shelf, index) => (
        <ShelfSection key={shelf.id} shelf={shelf} number={String(index + 3).padStart(2, "0")} />
      ))}

      <OperatorPanel />
    </div>
  );
}
