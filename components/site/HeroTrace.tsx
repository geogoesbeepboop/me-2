"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

/**
 * THE METHOD, AS A TRACE — the hero doesn't claim a process, it plays
 * one back. Every line is a true, durable fact about how the work gets
 * made (the method, not any one product — products churn, the method
 * doesn't). Tags follow the color doctrine where it genuinely applies:
 * cyan = research/data, ember = heat/attack, green = alive.
 */
const LINES: { tag: string; text: string; tone: string }[] = [
  {
    tag: "[ideate]",
    text: "every build opens with researched options, not a guess",
    tone: "text-cyan",
  },
  {
    tag: "[plan]",
    text: "phases end where a human verifies — no time estimates",
    tone: "text-bone",
  },
  {
    tag: "[build]",
    text: "deterministic guards ride every change, fail-open",
    tone: "text-bone",
  },
  {
    tag: "[challenge]",
    text: "a critic is paid to attack what was built before it ships",
    tone: "text-ember",
  },
  {
    tag: "[ship]",
    text: "every system lands in the archive below — open any file ↓",
    tone: "text-lab",
  },
  {
    tag: "[resume]",
    text: "state survives on disk — the next session boots from a handoff",
    tone: "text-ash",
  },
];

export default function HeroTrace() {
  const reduced = useReducedMotion();

  return (
    <Link
      href="/method"
      className="group block border border-line bg-panel/70 transition-colors duration-300 hover:border-line-loud focus-visible:border-(--accent)"
    >
      <span className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="font-mono text-label tracking-[0.18em] text-dim uppercase">
          how-i-build — trace
        </span>
        <span className="flex items-center gap-2 font-mono text-label tracking-[0.18em] text-dim uppercase">
          <span className="live-dot" aria-hidden />
          replay
        </span>
      </span>
      <div className="px-4 py-4">
        <p className="font-mono text-mono-sm leading-[2]">
          <span className="text-dim">$</span>
          <span className="ml-2 text-ash">replay --method</span>
        </p>
        {LINES.map((line, i) => {
          const row = (
            <span className="grid grid-cols-[104px_1fr] gap-x-3 font-mono text-mono-sm leading-[2]">
              <span className={line.tone}>{line.tag}</span>
              <span className="text-ash">{line.text}</span>
            </span>
          );
          return reduced ? (
            <span key={i} className="block">
              {row}
            </span>
          ) : (
            <motion.span
              key={i}
              className="block"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                ease: [0.19, 1, 0.22, 1],
                delay: 1.6 + i * 0.45,
              }}
            >
              {row}
            </motion.span>
          );
        })}
        <span className="mt-3 flex items-baseline justify-between border-t border-line pt-3 font-mono text-label tracking-[0.16em] uppercase">
          <span className="text-dim">n°000 — the full method file</span>
          <span className="text-ash transition-transform duration-500 ease-(--ease-cine) group-hover:translate-x-1.5">
            open →
          </span>
        </span>
      </div>
    </Link>
  );
}
