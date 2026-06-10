import type { Metadata } from "next";
import Link from "next/link";
import ArchiveIndex from "@/components/archive/ArchiveIndex";
import { nodesOf } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Case studies — polished, done for now. Architecture, logs, what broke, and the calls made along the way.",
};

export default function WorkPage() {
  return (
    <div className="pt-36 pb-24">
      <header className="mb-14 px-5 md:px-10">
        <p className="font-mono text-label tracking-[0.16em] text-dim uppercase">
          /archive/work
        </p>
        <h1 className="mt-4 text-display font-black uppercase stretch-125">
          Work
        </h1>
        <p className="mt-5 max-w-xl text-ash">
          Products and systems, built end to end. Each case study shows the
          how — the full architecture, the real logs, what broke, and the
          decisions that cost something.
        </p>
      </header>
      <ArchiveIndex nodes={nodesOf("work")} />
      <div className="mt-14 px-5 md:px-10">
        <Link
          href="/lab"
          className="font-mono text-mono-sm text-ash underline-offset-4 hover:underline"
        >
          Rawer things live in the lab →
        </Link>
      </div>
    </div>
  );
}
