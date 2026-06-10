import type { Metadata } from "next";
import Link from "next/link";
import ArchiveIndex from "@/components/archive/ArchiveIndex";
import { nodesOf } from "@/lib/content";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Live benches — what's being built and explored right now. Raw by design.",
};

export default function LabPage() {
  return (
    <div className="bench-grid pt-36 pb-24">
      <header className="mb-14 px-5 md:px-10">
        <p className="flex items-center gap-3 font-mono text-label tracking-[0.16em] text-dim uppercase">
          <span className="live-dot" aria-hidden />
          /archive/lab — live
        </p>
        <h1 className="mt-4 text-display font-black uppercase stretch-125">
          Lab
        </h1>
        <p className="mt-5 max-w-xl text-ash">
          The benches. What&apos;s being built right now, posted while it&apos;s
          still moving — updates, open questions, no polish. Things graduate to
          work when they&apos;re done for now.
        </p>
      </header>
      <ArchiveIndex nodes={nodesOf("lab")} />
      <div className="mt-14 px-5 md:px-10">
        <Link
          href="/work"
          className="font-mono text-mono-sm text-ash underline-offset-4 hover:underline"
        >
          ← Finished things live in work
        </Link>
      </div>
    </div>
  );
}
