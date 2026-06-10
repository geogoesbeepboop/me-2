"use client";

import { motion, useReducedMotion } from "framer-motion";

export interface LogLine {
  /** timestamp, e.g. "04:11:02" */
  t?: string;
  /** cmd | agent | out | err | sys */
  k?: "cmd" | "agent" | "out" | "err" | "sys";
  s: string;
}

const KIND_CLASS: Record<NonNullable<LogLine["k"]>, string> = {
  cmd: "text-bone",
  agent: "text-bone",
  out: "text-ash",
  err: "text-ember",
  sys: "text-dim italic",
};

/**
 * A real-looking session transcript, staged line by line as it scrolls
 * into view. Mono is the engineer's fingerprint — this is its home.
 */
export default function TerminalLog({
  title,
  lines,
  cursor = true,
}: {
  title: string;
  lines: LogLine[];
  cursor?: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <figure className="my-10 border border-line bg-panel">
      <figcaption className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="font-mono text-label tracking-[0.18em] text-dim uppercase">
          {title}
        </span>
        <span className="flex items-center gap-2 font-mono text-label tracking-[0.18em] text-dim uppercase">
          <span className="live-dot" aria-hidden />
          session
        </span>
      </figcaption>
      <div className="overflow-x-auto px-5 py-5">
        <pre className="font-mono text-mono-sm leading-[1.9]">
          {lines.map((line, i) => {
            const row = (
              <span className="block whitespace-pre">
                {line.t && <span className="mr-4 text-dim">{line.t}</span>}
                {line.k === "cmd" && <span className="mr-2 text-dim">$</span>}
                <span className={KIND_CLASS[line.k ?? "out"]}>{line.s}</span>
              </span>
            );
            return reduced ? (
              <span key={i}>{row}</span>
            ) : (
              <motion.span
                key={i}
                className="block"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-5% 0px" }}
                transition={{
                  duration: 0.01,
                  delay: 0.25 + i * 0.09,
                }}
              >
                {row}
              </motion.span>
            );
          })}
          {cursor && <span className="caret mt-1" aria-hidden />}
        </pre>
      </div>
    </figure>
  );
}
