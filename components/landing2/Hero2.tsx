"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import MaskReveal from "@/components/motion/MaskReveal";
import LocalClock from "@/components/site/LocalClock";
import Constellation, {
  type GraphEdge,
  type GraphNode,
} from "@/components/landing2/Constellation";

/**
 * LANDING PROPOSAL Nº2 — the archive opens on its own nervous system.
 * Left: the motto, still and heavy. Right: the real content graph,
 * drifting, inspectable, clickable — the first thing a visitor touches
 * is the actual structure of the work. Type rises once and holds; the
 * only thing that moves forever is the thing that's genuinely alive.
 */
export default function Hero2({
  nodes,
  edges,
  aboutLine,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  aboutLine: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yCopy = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const yGraph = useTransform(scrollYProgress, [0, 1], [0, -28]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0.15]);

  const copy = (
    <div className="flex h-full flex-col justify-end px-5 pt-28 pb-8 md:pl-10 md:pr-8 md:pb-10">
      <p className="mb-6 font-mono text-label tracking-[0.2em] text-dim uppercase">
        landing — proposal nº2 ·{" "}
        <Link
          href="/"
          className="text-ash underline-offset-4 hover:text-bone hover:underline"
        >
          compare with nº1 →
        </Link>
      </p>

      <h1 className="text-[clamp(2.35rem,9vw,3.4rem)] leading-[0.92] font-black tracking-[-0.025em] uppercase stretch-110 md:text-[clamp(2rem,4.3vw,5.5rem)]">
        <MaskReveal lines={["Build fast,", "adapt faster."]} delay={0.4} />
      </h1>

      {!reduced ? (
        <motion.div
          aria-hidden
          className="mt-8 h-px origin-left bg-line-loud"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, ease: [0.83, 0, 0.17, 1], delay: 0.9 }}
        />
      ) : (
        <div aria-hidden className="mt-8 h-px bg-line-loud" />
      )}

      <div className="mt-7">
        <p className="text-title font-bold leading-[1.12]">
          Probabilistic imagination.
          <br />
          Deterministic execution.
        </p>
        <p className="mt-4 max-w-md font-mono text-mono-sm text-ash">
          Products people crave, built end to end — and documented to the
          studs. Everything on this page is real and inspectable: the files,
          the links between them, the rules that hold.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-1.5 font-mono text-label tracking-[0.18em] text-dim uppercase">
        <span>
          {aboutLine} · SF <LocalClock timeZone="America/Los_Angeles" />
        </span>
        <Link
          href="/about"
          className="text-ash underline-offset-4 hover:text-bone hover:underline"
        >
          the person behind the archive →
        </Link>
        <span className="ml-auto">the index ↓</span>
      </div>
    </div>
  );

  const graph = (
    <div className="h-[58vh] border-t border-line md:h-auto md:min-h-svh md:border-t-0 md:border-l">
      <Constellation nodes={nodes} edges={edges} />
    </div>
  );

  return (
    <section
      ref={ref}
      className="relative md:min-h-svh"
      aria-label="The archive — its content graph"
    >
      {reduced ? (
        <div className="grid md:min-h-svh md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div>{copy}</div>
          {graph}
        </div>
      ) : (
        <motion.div
          style={{ opacity: fade }}
          className="grid md:min-h-svh md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
        >
          <motion.div style={{ y: yCopy }}>{copy}</motion.div>
          <motion.div style={{ y: yGraph }}>{graph}</motion.div>
        </motion.div>
      )}
    </section>
  );
}
