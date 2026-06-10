"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  DiagramSvg,
  type DiagramEdge,
  type DiagramNode,
} from "./ArchitectureDiagram";

/**
 * "The complete architecture" — a full-screen deep dive behind one click.
 * The dossier shows the system at a glance; this is the whole machine,
 * all the way down:
 *   00 topology — every component, zoomable
 *   01 state machines — the actual lifecycles (carts, mandates, runs)
 *   02 agentic surface — every LLM call-site, model and shape
 *   03 deterministic core — the rules code enforces, with thresholds
 *   04 layers & invariants
 * Color doctrine holds here too: outlined boxes are gates; dashed paths
 * are failure/repair routes. Esc closes; zoom is two buttons; pan is
 * native scroll.
 */

export interface DeepDiveLayer {
  name: string;
  note: string;
}

export interface FlowState {
  id: string;
  label: string;
  col: number;
  row: number;
  /** gate = accent outline · terminal = dashed, dim */
  kind?: "gate" | "terminal";
}

export interface FlowTransition {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

export interface StateMachine {
  title: string;
  caption?: string;
  states: FlowState[];
  transitions: FlowTransition[];
}

export interface LoopRow {
  name: string;
  model: string;
  shape: string;
  does: string;
}

export interface CoreRule {
  name: string;
  rule: string;
}

const noopSubscribe = () => () => {};

/* ── state-machine renderer — small boxes, loop-back routing ── */
const SW = 152; // state box width
const SH = 44; // state box height
const SCW = 180; // column pitch
const SRH = 84; // row pitch

function StateFlowSvg({
  machine,
  markerId,
}: {
  machine: StateMachine;
  markerId: string;
}) {
  const byId = Object.fromEntries(machine.states.map((s) => [s.id, s]));
  const maxCol = Math.max(...machine.states.map((s) => s.col));
  const maxRow = Math.max(...machine.states.map((s) => s.row));
  const width = maxCol * SCW + SW + 24;
  const height = maxRow * SRH + SH + 40;

  const pos = (s: FlowState) => ({ x: s.col * SCW + 12, y: s.row * SRH + 12 });

  function path(a: FlowState, b: FlowState): { d: string; lx: number; ly: number } {
    const pa = pos(a);
    const pb = pos(b);
    const aCx = pa.x + SW / 2;
    const bCx = pb.x + SW / 2;
    const aCy = pa.y + SH / 2;
    const bCy = pb.y + SH / 2;

    if (a.row === b.row && b.col > a.col) {
      return {
        d: `M ${pa.x + SW} ${aCy} L ${pb.x} ${bCy}`,
        lx: (pa.x + SW + pb.x) / 2,
        ly: aCy - 8,
      };
    }
    if (a.row === b.row && b.col < a.col) {
      // loop back, routed underneath the row
      const dip = pa.y + SH + 22;
      return {
        d: `M ${aCx} ${pa.y + SH} L ${aCx} ${dip} L ${bCx} ${dip} L ${bCx} ${pb.y + SH}`,
        lx: (aCx + bCx) / 2,
        ly: dip + 12,
      };
    }
    if (a.col === b.col) {
      const down = pb.y > pa.y;
      return {
        d: `M ${aCx} ${down ? pa.y + SH : pa.y} L ${bCx} ${down ? pb.y : pb.y + SH}`,
        lx: aCx + 8,
        ly: (aCy + bCy) / 2,
      };
    }
    const midX = (pa.x + SW + pb.x) / 2;
    return {
      d: `M ${pa.x + SW} ${aCy} L ${midX} ${aCy} L ${midX} ${bCy} L ${pb.x} ${bCy}`,
      lx: midX,
      ly: (aCy + bCy) / 2 - 8,
    };
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width, minWidth: Math.min(width, 680) }}
      role="img"
      aria-label={machine.title}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--color-dim)" />
        </marker>
      </defs>
      {machine.transitions.map((t, i) => {
        const a = byId[t.from];
        const b = byId[t.to];
        if (!a || !b) return null;
        const { d, lx, ly } = path(a, b);
        return (
          <g key={i}>
            <path
              d={d}
              fill="none"
              stroke="var(--color-line-loud)"
              strokeWidth="1"
              strokeDasharray={t.dashed ? "4 4" : undefined}
              markerEnd={`url(#${markerId})`}
            />
            {t.label && (
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                fill="var(--color-dim)"
                style={{
                  font: "500 8.5px var(--font-mono)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {t.label}
              </text>
            )}
          </g>
        );
      })}
      {machine.states.map((s) => {
        const p = pos(s);
        return (
          <g key={s.id}>
            <rect
              x={p.x}
              y={p.y}
              width={SW}
              height={SH}
              fill="var(--color-panel-2)"
              stroke={
                s.kind === "gate"
                  ? "var(--accent)"
                  : s.kind === "terminal"
                    ? "var(--color-line-loud)"
                    : "var(--color-line-loud)"
              }
              strokeWidth="1"
              strokeDasharray={s.kind === "terminal" ? "3 3" : undefined}
            />
            <text
              x={p.x + SW / 2}
              y={p.y + SH / 2 + 3.5}
              textAnchor="middle"
              fill={s.kind === "terminal" ? "var(--color-dim)" : "var(--color-bone)"}
              style={{
                font: "600 10px var(--font-mono)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <p className="mt-12 mb-5 font-mono text-label tracking-[0.2em] uppercase">
      <span className="text-(--accent)">{n}</span>
      <span className="ml-3 text-dim">{title}</span>
    </p>
  );
}

export default function SystemDeepDive({
  title,
  subtitle,
  nodes,
  edges,
  stateMachines = [],
  loops = [],
  core = [],
  layers = [],
  invariants = [],
}: {
  title: string;
  subtitle?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  stateMachines?: StateMachine[];
  loops?: LoopRow[];
  core?: CoreRule[];
  layers?: DeepDiveLayer[];
  invariants?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  // the portal escapes the page's --accent scope; capture it at open time
  const [accent, setAccent] = useState("var(--color-ember)");
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  // SSR-safe portal target — true only after hydration, no effect-setState
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (triggerRef.current) {
            const v = getComputedStyle(triggerRef.current)
              .getPropertyValue("--accent")
              .trim();
            if (v) setAccent(v);
          }
          setOpen(true);
        }}
        className="group my-10 flex w-full items-center justify-between gap-6 border border-line bg-panel px-6 py-6 text-left transition-colors duration-300 hover:border-(--accent)"
      >
        <span>
          <span className="block font-mono text-label tracking-[0.2em] text-dim uppercase">
            The complete architecture
          </span>
          <span className="mt-2 block text-title font-bold uppercase stretch-110">
            {title}
          </span>
          <span className="mt-2 block font-mono text-label tracking-[0.12em] text-dim uppercase">
            topology · state machines · agentic surface · deterministic core
          </span>
        </span>
        <span
          aria-hidden
          className="font-mono text-title text-(--accent) transition-transform duration-500 ease-(--ease-cine) group-hover:rotate-90"
        >
          +
        </span>
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={`${title} — complete architecture`}
                style={{ "--accent": accent } as React.CSSProperties}
                className="fixed inset-0 z-150 overflow-y-auto bg-void"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
                onMouseDown={(e) => e.target === e.currentTarget && close()}
              >
                <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-line bg-void px-5 py-4 md:px-10">
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-label tracking-[0.2em] text-(--accent) uppercase">
                      Full map
                    </span>
                    <span className="text-title font-bold uppercase stretch-110">
                      {title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-mono-sm">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                      aria-label="Zoom out"
                      className="border border-line px-3 py-1.5 text-ash transition-colors hover:border-line-loud hover:text-bone"
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-label text-dim">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
                      aria-label="Zoom in"
                      className="border border-line px-3 py-1.5 text-ash transition-colors hover:border-line-loud hover:text-bone"
                    >
                      +
                    </button>
                    <button
                      ref={closeRef}
                      type="button"
                      onClick={close}
                      className="ml-3 border border-line px-3 py-1.5 text-bone transition-colors hover:border-(--accent)"
                    >
                      Close ✕
                    </button>
                  </div>
                </div>

                <motion.div
                  className="px-5 py-8 md:px-10"
                  initial={reduced ? false : { y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.19, 1, 0.22, 1],
                    delay: 0.1,
                  }}
                >
                  {subtitle && (
                    <p className="max-w-2xl font-mono text-mono-sm text-ash">
                      {subtitle}
                    </p>
                  )}

                  <SectionLabel n="00" title="Topology — every component" />
                  <div className="overflow-auto border border-line bg-panel p-8">
                    <DiagramSvg
                      nodes={nodes}
                      edges={edges}
                      ariaLabel={`${title} complete architecture`}
                      scale={zoom * 1.15}
                      markerId="deep-arrow"
                    />
                  </div>
                  <p className="mt-3 font-mono text-label tracking-[0.12em] text-dim uppercase">
                    <span className="text-(--accent)">outlined</span> = a gate —
                    where deterministic code overrules the model ·{" "}
                    <span className="text-ash">dashed</span> = failure / repair
                    path
                  </p>

                  {stateMachines.length > 0 && (
                    <>
                      <SectionLabel
                        n="01"
                        title="State machines — the actual lifecycles"
                      />
                      <div className="grid gap-6 xl:grid-cols-2">
                        {stateMachines.map((m, i) => (
                          <figure
                            key={m.title}
                            className="border border-line bg-panel"
                          >
                            <figcaption className="border-b border-line px-5 py-3">
                              <span className="font-mono text-label tracking-[0.18em] text-bone uppercase">
                                {m.title}
                              </span>
                              {m.caption && (
                                <span className="ml-3 font-mono text-label tracking-[0.08em] text-dim">
                                  {m.caption}
                                </span>
                              )}
                            </figcaption>
                            <div className="overflow-x-auto p-6">
                              <StateFlowSvg
                                machine={m}
                                markerId={`sm-arrow-${i}`}
                              />
                            </div>
                          </figure>
                        ))}
                      </div>
                    </>
                  )}

                  {loops.length > 0 && (
                    <>
                      <SectionLabel
                        n="02"
                        title="Agentic surface — every model call-site"
                      />
                      <div className="border border-line bg-panel font-mono text-mono-sm">
                        <div className="hidden grid-cols-[1.1fr_120px_130px_1.9fr] gap-x-6 border-b border-line px-5 py-3 text-label tracking-[0.18em] text-dim uppercase md:grid">
                          <span>Call-site</span>
                          <span>Model</span>
                          <span>Shape</span>
                          <span>Does</span>
                        </div>
                        <ul className="divide-y divide-line">
                          {loops.map((l) => (
                            <li
                              key={l.name}
                              className="grid gap-x-6 gap-y-1 px-5 py-4 md:grid-cols-[1.1fr_120px_130px_1.9fr]"
                            >
                              <span className="text-bone">{l.name}</span>
                              <span className="text-cyan">{l.model}</span>
                              <span className="text-dim uppercase">
                                {l.shape}
                              </span>
                              <span className="text-ash">{l.does}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {core.length > 0 && (
                    <>
                      <SectionLabel
                        n="03"
                        title="Deterministic core — the rules code enforces"
                      />
                      <ul className="grid gap-px border border-line bg-line md:grid-cols-2">
                        {core.map((c) => (
                          <li key={c.name} className="bg-void px-5 py-4">
                            <p className="font-mono text-label tracking-[0.18em] text-bone uppercase">
                              <span aria-hidden className="mr-2 text-(--accent)">
                                ▸
                              </span>
                              {c.name}
                            </p>
                            <p className="mt-1.5 font-mono text-mono-sm text-ash">
                              {c.rule}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {(layers.length > 0 || invariants.length > 0) && (
                    <>
                      <SectionLabel n="04" title="Layers & invariants" />
                      <div className="grid gap-10 lg:grid-cols-2">
                        {layers.length > 0 && (
                          <ul className="space-y-4">
                            {layers.map((layer) => (
                              <li key={layer.name} className="flex gap-4">
                                <span
                                  aria-hidden
                                  className="mt-[7px] block h-2 w-2 shrink-0 rotate-45 bg-(--accent)"
                                />
                                <p className="text-[0.95rem] leading-relaxed text-ash">
                                  <strong className="font-semibold text-bone">
                                    {layer.name}.
                                  </strong>{" "}
                                  {layer.note}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}
                        {invariants.length > 0 && (
                          <div>
                            <p className="mb-4 font-mono text-label tracking-[0.2em] text-dim uppercase">
                              What always holds
                            </p>
                            <ul className="space-y-3 font-mono text-mono-sm">
                              {invariants.map((inv, i) => (
                                <li key={i} className="flex gap-3">
                                  <span className="text-(--accent)">▸</span>
                                  <span className="text-bone/85">{inv}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
