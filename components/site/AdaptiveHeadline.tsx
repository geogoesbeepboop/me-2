"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * THE MOTTO, ALIVE — "build fast, adapt faster" set in type that
 * breathes. Every letter rides Archivo's variable-width axis: a slow
 * wave travels through the line at film speed, nothing more. (A
 * pointer-following squeeze was tried and cut — type that trails the
 * cursor reads as lag, not adaptation.) Entrance is the same masked
 * rise as everywhere else. Reduced motion: static lines, full width.
 */

const BASE = 125; // resting width — matches stretch-125
const WAVE = 4; // breathing depth (wdth %)

export default function AdaptiveHeadline({
  lines,
  delay = 0,
}: {
  lines: string[];
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const root = useRef<HTMLSpanElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (reduced) return;
    const els = letters.current.filter(Boolean) as HTMLSpanElement[];

    let raf = 0;
    let running = false;

    const frame = (t: number) => {
      els.forEach((el, i) => {
        const wave = WAVE * (0.5 + 0.5 * Math.sin(t / 900 + i * 0.55));
        el.style.fontStretch = `${(BASE - wave).toFixed(2)}%`;
      });
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // only spend frames while the headline is on screen
    const io = new IntersectionObserver(([e]) =>
      e.isIntersecting ? start() : stop()
    );
    if (root.current) io.observe(root.current);

    return () => {
      stop();
      io.disconnect();
    };
  }, [reduced]);

  if (reduced) {
    return (
      <span>
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </span>
    );
  }

  let n = 0;
  return (
    <span ref={root}>
      <span className="sr-only">{lines.join(" ")}</span>
      {lines.map((line, i) => (
        <span
          key={line}
          className="block overflow-hidden pt-[0.12em] -mt-[0.12em]"
          aria-hidden
        >
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
            {Array.from(line).map((ch, j) =>
              ch === " " ? (
                " "
              ) : (
                <span
                  key={j}
                  ref={(el) => {
                    letters.current[n++] = el;
                  }}
                >
                  {ch}
                </span>
              )
            )}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
