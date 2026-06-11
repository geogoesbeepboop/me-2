"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.19, 1, 0.22, 1] as const;

/** Clipped text reveal — lines rise out of a mask like titles in a film.
 *  `inView` defers the rise until the lines scroll into frame (once).
 *  The viewport observer must sit on the unclipped root: the lines
 *  themselves start fully hidden inside the mask, so observing them
 *  directly would never fire. */
export default function MaskReveal({
  lines,
  className,
  delay = 0,
  inView = false,
}: {
  lines: string[];
  className?: string;
  delay?: number;
  inView?: boolean;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <span className={className}>
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </span>
    );
  }

  const masked = lines.map((line, i) => (
    <span key={i} className="block overflow-hidden pt-[0.12em] -mt-[0.12em]">
      <motion.span
        className="block"
        variants={{
          hidden: { y: "112%" },
          shown: {
            y: 0,
            transition: { duration: 1.1, ease: EASE, delay: delay + i * 0.12 },
          },
        }}
      >
        {line}
      </motion.span>
    </span>
  ));

  return inView ? (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-8% 0px" }}
    >
      {masked}
    </motion.span>
  ) : (
    <motion.span className={className} initial="hidden" animate="shown">
      {masked}
    </motion.span>
  );
}
