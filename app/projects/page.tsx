import type { Metadata } from "next";
import Link from "next/link";
import ArchiveIndex from "@/components/archive/ArchiveIndex";
import { nodesOf } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Every system, one index — shipped dossiers and live benches, tagged by stage. Architecture, real logs, what broke, and the calls made along the way.",
};

export default function ProjectsPage() {
  return (
    <div className="pt-36 pb-24">
      <header className="mb-14 px-5 md:px-10">
        <p className="font-mono text-label tracking-[0.16em] text-dim uppercase">
          /archive/projects
        </p>
        <h1 className="mt-4 text-display font-black uppercase stretch-125">
          Projects
        </h1>
        <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <p className="max-w-xl text-ash">
            Products and systems, built end to end — one index, every stage.
            Each entry shows the how: the full architecture, the real logs,
            what broke, and the decisions that cost something.
          </p>
          {/* the stage doctrine, made legible */}
          <p className="shrink-0 font-mono text-label tracking-[0.18em] text-dim uppercase md:text-right">
            SHIP — polished, done for now
            <br />
            BENCH — raw, still moving
            <br />
            <span className="live-dot mr-2 inline-block align-middle" /> live —
            operating right now
          </p>
        </div>
      </header>
      <ArchiveIndex nodes={nodesOf("projects")} />
      <div className="mt-14 px-5 md:px-10">
        <Link
          href="/writing"
          className="font-mono text-mono-sm text-ash underline-offset-4 hover:underline"
        >
          The thinking behind the builds lives in writing →
        </Link>
      </div>
    </div>
  );
}
