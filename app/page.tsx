import Link from "next/link";
import Hero from "@/components/site/Hero";
import ArchiveIndex from "@/components/archive/ArchiveIndex";
import IndexRow from "@/components/archive/IndexRow";
import HueLegend from "@/components/site/HueLegend";
import LocalClock from "@/components/site/LocalClock";
import SignalTicker from "@/components/site/SignalTicker";
import MaskReveal from "@/components/motion/MaskReveal";
import Reveal from "@/components/motion/Reveal";
import { allNodes, getMethod, getAbout, tagOf } from "@/lib/content";

export default function Home() {
  const nodes = allNodes();
  const about = getAbout();
  const method = getMethod();

  // the wire — every entry in the archive, oldest story last on the tape
  const signal = [
    {
      no: "N°000",
      tag: "META",
      title: method.title,
      status: method.status,
      live: false,
    },
    ...nodes.map((node) => ({
      no: `N°${node.no}`,
      tag: tagOf(node),
      title: node.title,
      status: node.status,
      live: node.status === "LIVE",
    })),
  ];

  return (
    <>
      <Hero />

      <SignalTicker items={signal} />

      {/* about strip — the person behind the archive, one line */}
      <Link
        href="/about"
        className="group block border-y border-line bg-panel/50 transition-colors duration-500 hover:bg-bone hover:text-void"
      >
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-5 py-4 font-mono md:px-10">
          <span className="text-label tracking-[0.2em] text-dim uppercase group-hover:text-void/60">
            About
          </span>
          <span className="text-mono-sm">
            {about.headline} Engineer, {about.location.replace(", CA", "")}.
          </span>
          <span className="ml-auto flex items-baseline gap-6 text-label tracking-[0.16em] text-dim uppercase group-hover:text-void/60">
            <span className="hidden md:inline">
              SF <LocalClock timeZone="America/Los_Angeles" />
            </span>
            <span>the person behind the archive →</span>
          </span>
        </div>
      </Link>

      {/* the archive — work, lab, writing on one surface */}
      <section aria-label="The archive" className="pt-24 pb-28 md:pt-32">
        <div className="mb-12 flex flex-col gap-4 px-5 md:flex-row md:items-end md:justify-between md:px-10">
          <h2 className="text-display font-black uppercase stretch-125">
            <MaskReveal lines={["The archive"]} inView />
          </h2>
          <div className="max-w-xs font-mono text-label tracking-[0.18em] text-dim uppercase md:text-right">
            <p>
              Projects and writing — one index.
              <br />
              Open anything. It links onward.
            </p>
            {/* the color doctrine, made legible */}
            <p className="mt-3 text-dim">
              <HueLegend />
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
