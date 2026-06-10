"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

/**
 * THE METHOD, AS A TRACE — the hero doesn't claim a process, it plays
 * one back. Every line is a true fact from the archive, tagged in the
 * color doctrine: gold = money, ember = heat, cyan = data,
 * violet = night, green = alive.
 */
const LINES: { tag: string; text: string; tone: string }[] = [
  {
    tag: "[scaffold]",
    text: "empty repo → live in production, 7 days",
    tone: "text-bone",
  },
  {
    tag: "[gates]",
    text: "the model proposes — deterministic code disposes",
    tone: "text-gold",
  },
  {
    tag: "[red-team]",
    text: "5 planted attacks, 5 blocked — every block cites its rule",
    tone: "text-ember",
  },
  {
    tag: "[evals]",
    text: "wired before the first feature · a run costs $0.15–0.40",
    tone: "text-cyan",
  },
  {
    tag: "[taste]",
    text: "audio renders only after a critic the model can't sweet-talk",
    tone: "text-violet",
  },
  {
    tag: "[ship]",
    text: "four live systems below — open any file ↓",
    tone: "text-lab",
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
          rec
        </span>
      </span>
      <div className="px-4 py-4">
        <p className="font-mono text-mono-sm leading-[2]">
          <span className="text-dim">$</span>
          <span className="ml-2 text-ash">replay --method</span>
        </p>
        {LINES.map((line, i) => {
          const row = (
            <span className="grid grid-cols-[96px_1fr] gap-x-3 font-mono text-mono-sm leading-[2]">
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
        <span className="caret mt-2" aria-hidden />
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
