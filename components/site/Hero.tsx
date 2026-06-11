"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import AdaptiveHeadline from "@/components/site/AdaptiveHeadline";
import HeroFieldLoader from "@/components/three/HeroFieldLoader";
import HeroTrace from "@/components/site/HeroTrace";

/**
 * The hero states the motto at full scale, the doctrine underneath it,
 * and then PROVES both — the headline itself adapts (variable-width
 * letters breathing on their own clock), and a method trace built
 * from true facts plays back beside it. On scroll the layers
 * leave at different speeds — a camera move, not a fade. The name
 * lives in the header, permanently visible. Copy here is deliberately
 * durable: no product names, no counts that stale as the archive grows.
 */
export default function Hero() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // three depths: the field lags, the headline leads, the grid follows
  const yField = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const yHead = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const yGrid = useTransform(scrollYProgress, [0, 1], [0, -48]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0.12]);

  const headline = (
    <h1 className="text-hero font-black uppercase stretch-125">
      <AdaptiveHeadline lines={["Build fast,", "adapt faster."]} delay={0.45} />
    </h1>
  );

  const grid = (
    <>
      <div>
        <p className="max-w-md text-title font-bold leading-[1.15]">
          Probabilistic imagination.
          <br />
          Deterministic execution.
        </p>
        <p className="mt-5 max-w-md font-mono text-mono-sm text-ash">
          Products people crave, built end to end — and documented to the
          studs. Every system below is real and inspectable: the
          architecture, the decisions, the failures, the rules that hold.
        </p>
        <p className="mt-6 font-mono text-label tracking-[0.2em] text-dim uppercase">
          The archive ↓
        </p>
      </div>
      <HeroTrace />
    </>
  );

  const gridClass =
    "mt-10 grid items-end gap-8 border-t border-line pt-7 md:grid-cols-[minmax(0,1fr)_minmax(360px,480px)]";

  return (
    <section
      ref={ref}
      className="relative flex min-h-svh flex-col justify-end overflow-hidden"
    >
      {reduced ? (
        <HeroFieldLoader />
      ) : (
        <motion.div style={{ y: yField }} className="absolute inset-0">
          <HeroFieldLoader />
        </motion.div>
      )}

      {reduced ? (
        <div className="relative px-5 pt-28 pb-12 md:px-10 md:pb-14">
          {headline}
          <div className={gridClass}>{grid}</div>
        </div>
      ) : (
        <motion.div
          style={{ opacity: fade }}
          className="relative px-5 pt-28 pb-12 md:px-10 md:pb-14"
        >
          <motion.div style={{ y: yHead }}>{headline}</motion.div>
          <motion.div style={{ y: yGrid }} className={gridClass}>
            {grid}
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
