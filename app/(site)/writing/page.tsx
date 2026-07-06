import type { Metadata } from "next";
import ArchiveIndex from "@/components/archive/ArchiveIndex";
import { nodesOf } from "@/lib/content";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Reflections on everything being built. The dossiers show how; this is where the why gets argued.",
};

export default function WritingPage() {
  return (
    <div className="pt-36 pb-24">
      <header className="mb-14 px-5 md:px-10">
        <p className="font-mono text-label tracking-[0.16em] text-dim uppercase">
          /archive/writing
        </p>
        <h1 className="mt-4 text-display font-black uppercase stretch-125">
          Writing
        </h1>
        <p className="mt-5 max-w-xl text-ash">
          Reflections on everything being built. The dossiers show the how;
          this is where the why gets argued. Posts deep-link into project
          sections — and the projects link back.
        </p>
      </header>
      <ArchiveIndex nodes={nodesOf("writing")} />
    </div>
  );
}
