"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * THE MOTTO, ENACTED — "build fast, adapt faster" set in type that
 * actually adapts. Every letter rides Archivo's variable-width axis:
 * a slow wave breathes through the line at film speed, and letters
 * yield under the pointer — compressed where you press, recovering
 * with a weighted ease as you pass. Entrance is the same masked rise
 * as everywhere else. Reduced motion: static lines, full width.
 */

const BASE = 125; // resting width — matches stretch-125
const WAVE = 4; // idle breathing depth (wdth %)
const SQUEEZE = 30; // max yield under the pointer (wdth %)
const RADIUS = 260; // px of pointer influence
const RECOVER = 0.13; // lerp factor per frame — the weighted return

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
  const widths = useRef<number[]>([]);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (reduced) return;
    const els = letters.current.filter(Boolean) as HTMLSpanElement[];
    widths.current = els.map(() => BASE);

    let raf = 0;
    let running = false;

    const frame = (t: number) => {
      const p = pointer.current;
      // geometry is only needed to resolve pointer distance — the idle
      // wave is pure math, so touch devices never pay for layout reads
      const rects = p ? els.map((el) => el.getBoundingClientRect()) : null;
      // write pass: breathe, then yield to the pointer
      els.forEach((el, i) => {
        const wave = WAVE * (0.5 + 0.5 * Math.sin(t / 900 + i * 0.55));
        let squeeze = 0;
        if (p && rects) {
          const r = rects[i];
          const d = Math.hypot(
            p.x - (r.left + r.width / 2),
            p.y - (r.top + r.height / 2)
          );
          const influence = Math.max(0, 1 - d / RADIUS);
          squeeze = SQUEEZE * influence * influence;
        }
        const target = BASE - wave - squeeze;
        widths.current[i] += (target - widths.current[i]) * RECOVER;
        el.style.fontStretch = `${widths.current[i].toFixed(2)}%`;
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

    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      pointer.current = null;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
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
