"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * THE CUT — every route entrance is a film cut, not a fade-in.
 * A void panel covers the frame and collapses downward with a weighted
 * curve while the page settles up beneath it. Reduced motion: no cut.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1], delay: 0.12 }}
      >
        {children}
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-100 bg-void"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        style={{ originY: 1 }}
        transition={{ duration: 0.7, ease: [0.83, 0, 0.17, 1] }}
      />
    </>
  );
}
