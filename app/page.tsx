import Link from "next/link";
import Hero from "@/components/site/Hero";
import ArchiveIndex from "@/components/archive/ArchiveIndex";
import IndexRow from "@/components/archive/IndexRow";
import Reveal from "@/components/motion/Reveal";
import { allNodes, getMethod, getSignal, fullStamp } from "@/lib/content";

export default function Home() {
  const nodes = allNodes();
  const signal = getSignal();
  const method = getMethod();

  return (
    <>
      <Hero />

      {/* signal strip — one live line from /signal */}
      <Link
        href="/signal"
        className="group block border-y border-line bg-panel/50 transition-colors duration-500 hover:bg-bone hover:text-void"
      >
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-5 py-4 font-mono md:px-10">
          <span className="flex items-center gap-2 text-label tracking-[0.2em] text-dim uppercase group-hover:text-void/60">
            <span className="live-dot" aria-hidden />
            Signal
          </span>
          <span className="text-mono-sm">{signal.headline}</span>
          <span className="ml-auto text-label tracking-[0.16em] text-dim uppercase group-hover:text-void/60">
            upd {fullStamp(signal.updated)} →
          </span>
        </div>
      </Link>

      {/* the archive — work, lab, writing on one surface */}
      <section aria-label="The archive" className="pt-24 pb-28 md:pt-32">
        <div className="mb-12 flex flex-col gap-4 px-5 md:flex-row md:items-end md:justify-between md:px-10">
          <Reveal>
            <h2 className="text-display font-black uppercase stretch-125">
              The archive
            </h2>
          </Reveal>
          <div className="max-w-xs font-mono text-label tracking-[0.18em] text-dim uppercase md:text-right">
            <p>
              Work, lab, writing — one index.
              <br />
              Open anything. It links onward.
            </p>
            {/* the color doctrine, made legible */}
            <p className="mt-3 text-dim">
              <span className="text-lab">●</span> live ·{" "}
              <span className="text-gold">●</span> money ·{" "}
              <span className="text-cyan">●</span> markets ·{" "}
              <span className="text-violet">●</span> audio ·{" "}
              <span className="text-post">●</span> writing
            </p>
          </div>
        </div>

        {/* N°000 — pinned: the file that explains the rest */}
        <Reveal>
          <div className="border-b border-line">
            <IndexRow
              no="N°000"
              tag="META"
              href="/method"
              title={method.title}
              primaryMeta="ALWAYS"
              status={method.status}
              thesis={method.thesis}
              secondary="17 skills · 4 hooks · 2 specialist agents — claude code, wrapped. read me first."
              accent="var(--color-ember)"
            />
          </div>
        </Reveal>

        <div className="h-10" aria-hidden />
        <ArchiveIndex nodes={nodes} />
      </section>
    </>
  );
}
