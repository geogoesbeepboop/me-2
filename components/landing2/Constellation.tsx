"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import HueLegend from "@/components/site/HueLegend";

/**
 * ────────────────────────────────────────────────────────────────────
 * THE CONSTELLATION — the archive's content graph, rendered live.
 *
 * Nothing here is invented: every node is a real file in
 * content/{projects,writing}, every edge is a real `refs:` line in a
 * real frontmatter block, and the layout is computed from the graph
 * itself — the highest-degree node sits at the center because it
 * literally links everything. Nodes drift at film speed (the archive
 * is alive, not embalmed); hover lights a node's real neighborhood;
 * click opens the file. Reduced motion: a still chart.
 * ────────────────────────────────────────────────────────────────────
 */

export interface GraphNode {
  no: string;
  title: string;
  path: string;
  accent: string;
  status: string;
  live: boolean;
  tag: string;
  blurb: string;
}
export type GraphEdge = readonly [number, number];

const W = 620;
const H = 640;
const CX = 310;
const CY = 308;
const RX = 218;
const RY = 222;
const DRIFT = 4;

// deterministic pseudo-random — same LCG as the consoles, so the
// server-rendered SVG matches the client bit-for-bit
const jitter = (i: number, k: number) => {
  const s = (i * 1103515245 + k * 12345 + 1013904223) % 2147483648;
  return s / 2147483648;
};
const r2 = (v: number) => Math.round(v * 100) / 100;

export default function Constellation({
  nodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const reduced = useReducedMotion();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [t, setT] = useState(0);

  // the hub is earned, not styled: max degree sits at the center
  const degree = nodes.map(
    (_, i) => edges.filter((e) => e[0] === i || e[1] === i).length
  );
  const hub = degree.indexOf(Math.max(...degree));
  const ring = nodes.map((_, i) => i).filter((i) => i !== hub);

  const base: [number, number][] = nodes.map(() => [CX, CY]);
  ring.forEach((i, k) => {
    const angle =
      -Math.PI / 2 + (k * 2 * Math.PI) / ring.length + (jitter(i, 3) - 0.5) * 0.5;
    const rr = 0.88 + jitter(i, 4) * 0.2;
    base[i] = [CX + Math.cos(angle) * RX * rr, CY + Math.sin(angle) * RY * rr];
  });

  // drift loop — ~30fps, only while on screen, never under reduced motion
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let running = false;
    let t0 = 0;
    let last = 0;
    const loop = (now: number) => {
      if (!t0) t0 = now;
      if (now - last > 33) {
        last = now;
        setT(now - t0);
      }
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(loop);
      } else if (!e.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    if (rootRef.current) io.observe(rootRef.current);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reduced]);

  // drift is zero at t=0 so SSR, first client paint and frame one agree
  const pos = (i: number): [number, number] => {
    const [bx, by] = base[i];
    if (!t) return [r2(bx), r2(by)];
    const p1 = i * 1.7;
    const p2 = i * 2.3;
    return [
      r2(bx + DRIFT * (Math.sin(t / 2600 + p1) - Math.sin(p1))),
      r2(by + DRIFT * (Math.cos(t / 3300 + p2) - Math.cos(p2))),
    ];
  };

  const isNeighbor = (i: number) =>
    hover !== null &&
    edges.some(
      (e) =>
        (e[0] === hover && e[1] === i) || (e[1] === hover && e[0] === i)
    );

  const open = (path: string) => router.push(`/${path}`);

  return (
    <div ref={rootRef} className="flex h-full min-h-0 flex-col">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block min-h-0 w-full flex-1"
        role="group"
        aria-label="The archive's cross-link map — every dot a file, every line a real cross-link between two files"
      >
        {/* edges — the refs graph, drawn */}
        {edges.map(([a, b], k) => {
          const [ax, ay] = pos(a);
          const [bx, by] = pos(b);
          const dx = bx - ax;
          const dy = by - ay;
          const len = Math.hypot(dx, dy) || 1;
          const bow = (jitter(k, 7) - 0.5) * 40;
          const cx = r2((ax + bx) / 2 + (-dy / len) * bow);
          const cy = r2((ay + by) / 2 + (dx / len) * bow);
          const active = hover !== null && (a === hover || b === hover);
          const dimmed = hover !== null && !active;
          return (
            <path
              key={k}
              d={`M${ax},${ay} Q${cx},${cy} ${bx},${by}`}
              fill="none"
              stroke={
                active ? nodes[hover as number].accent : "var(--color-line-loud)"
              }
              strokeWidth={active ? 1.4 : 1}
              opacity={active ? 0.9 : dimmed ? 0.12 : 0.5}
              style={{ transition: "opacity 400ms, stroke 400ms" }}
            />
          );
        })}

        {/* nodes — real files, in their own domain hue */}
        {nodes.map((n, i) => {
          const [x, y] = pos(i);
          const isHub = i === hub;
          const focusDim =
            hover !== null && hover !== i && !isNeighbor(i);
          // labels prefer the outward side, but never leave the frame
          // (~9.2px per glyph at 11.5px uppercase mono + tracking)
          const est = n.title.length * 9.2;
          let left = x < CX;
          if (left && x - 16 - est < 6) left = false;
          if (!left && x + 16 + est > W - 6) left = true;
          const labelX = isHub ? 0 : left ? -16 : 16;
          const anchor = isHub ? "middle" : left ? "end" : "start";
          return (
            <g
              key={n.path}
              transform={`translate(${x}, ${y})`}
              className="l2-node cursor-pointer outline-none"
              role="link"
              tabIndex={0}
              aria-label={`${n.title} — ${[n.no, n.status]
                .filter(Boolean)
                .join(" · ")} — open`}
              onClick={() => open(n.path)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open(n.path);
                }
              }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              style={{
                opacity: focusDim ? 0.3 : 1,
                transition: "opacity 400ms",
              }}
            >
              {/* live marker — pulses in motion, holds as a static glow
                  under reduced motion (the state must survive stillness) */}
              {n.live && (
                <circle
                  r={isHub ? 11 : 9}
                  fill={n.accent}
                  className="l2-halo"
                  aria-hidden
                />
              )}
              {/* soft halo + core: filled marks, never accent outlines */}
              <circle r={isHub ? 17 : 13} fill={n.accent} opacity={0.14} />
              <circle
                className="l2-core"
                r={isHub ? 8 : 6}
                fill={n.accent}
                opacity={hover === i ? 1 : 0.9}
              />
              <g
                fontFamily="var(--font-mono)"
                textAnchor={anchor}
                transform={`translate(${labelX}, ${isHub ? 30 : 0})`}
              >
                <text
                  y={isHub ? 0 : -3}
                  fontSize="11.5"
                  letterSpacing="1.2"
                  fill="var(--color-bone)"
                  style={{ textTransform: "uppercase" }}
                  stroke="var(--color-void)"
                  strokeWidth="3.5"
                  paintOrder="stroke"
                >
                  {n.title}
                </text>
                <text
                  y={isHub ? 13 : 10}
                  fontSize="8.5"
                  letterSpacing="0.8"
                  fill="var(--color-dim)"
                  stroke="var(--color-void)"
                  strokeWidth="3"
                  paintOrder="stroke"
                >
                  {[n.no, n.status].filter(Boolean).join(" · ")}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* the inspector — what the map is, then what you're touching */}
      <div className="border-t border-line px-5 py-3 md:px-6">
        <p
          aria-live="polite"
          className="min-h-[2.8em] font-mono text-mono-sm text-ash"
        >
          {hover !== null ? (
            <>
              <span style={{ color: nodes[hover].accent }}>
                {nodes[hover].tag}
              </span>{" "}
              <span className="text-dim">{nodes[hover].no}</span>{" "}
              <span className="text-bone">{nodes[hover].title}</span>
              <span className="text-dim"> — {nodes[hover].blurb}</span>
            </>
          ) : (
            <>
              the archive, drawn live — every line is a real cross-link
              between two files. hover a dot to read it; click to open the
              file.
            </>
          )}
        </p>
        <p className="mt-2 font-mono text-[0.6rem] tracking-[0.12em] text-dim uppercase">
          ● = a file · line = a cross-link · pulse = live now ·{" "}
          <HueLegend />
        </p>
      </div>

      <style>{`
        @keyframes l2-halo-k {
          0% { transform: scale(1); opacity: 0.4; }
          80%, 100% { transform: scale(2.4); opacity: 0; }
        }
        .l2-halo {
          transform-box: fill-box;
          transform-origin: center;
          animation: l2-halo-k 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .l2-node:focus-visible .l2-core {
          stroke: var(--color-bone);
          stroke-width: 2;
        }
        @media (prefers-reduced-motion: reduce) {
          /* live keeps a marker even when nothing moves */
          .l2-halo { animation: none; transform: scale(1.5); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
