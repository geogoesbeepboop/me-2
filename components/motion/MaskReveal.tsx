"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Clipped text reveal — lines rise out of a mask like titles in a film. */
export default function MaskReveal({
  lines,
  className,
  delay = 0,
}: {
  lines: string[];
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span
          key={i}
          className="block overflow-hidden pt-[0.12em] -mt-[0.12em]"
        >
          {reduced ? (
            <span className="block">{line}</span>
          ) : (
            <motion.span
              className="block"
              initial={{ y: "112%" }}
              animate={{ y: 0 }}
              transition={{
                duration: 1.1,
                ease: [0.19, 1, 0.22, 1],
                delay: delay + i * 0.12,
              }}
            >
              {line}
            </motion.span>
          )}
        </span>
      ))}
    </span>
  );
}
