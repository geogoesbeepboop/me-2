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
import StateFlowSvg from "./StateFlow";
import TraceView from "./TraceView";
import InspectBlocks from "./InspectBlocks";
import { INSPECT, type InspectEntry } from "@/lib/inspect";
import type {
  FlowState,
  FlowTransition,
  StateMachine,
} from "@/lib/inspect/types";

export type { FlowState, FlowTransition, StateMachine };

/**
 * "The complete architecture" — a full-screen deep dive behind one click.
 * The dossier shows the system at a glance; this is the whole machine,
 * all the way down:
 *   00 topology — every component; click a box to open the artifact behind it
 *   01 state machines — the actual lifecycles (carts, mandates, runs)
 *   02 agentic surface — every LLM call-site, model and shape
 *   03 deterministic core — the rules code enforces, with thresholds
 *   04 layers & invariants
 * Clicking a component slides in a full-height, scrollable drawer with
 * the artifact behind it — verbatim code, a tabbed set of files, or a
 * designed trace view. Color doctrine holds here too: an accent outline
 * marks a point where the model has no say; dashed paths are
 * failure/repair routes. Esc closes the drawer first, then the dive.
 */

export interface DeepDiveLayer {
  name: string;
  note: string;
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

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <p className="mt-12 mb-5 font-mono text-label tracking-[0.2em] uppercase">
      <span className="text-(--accent)">{n}</span>
      <span className="ml-3 text-dim">{title}</span>
    </p>
  );
}

/** SKILL.md tabs read as the skill's name; other files keep their filename */
function tabLabel(path: string): string {
  const parts = path.split("/");
  const file = parts[parts.length - 1];
  return file === "SKILL.md" && parts.length > 1 ? parts[parts.length - 2] : file;
}

/* ── the artifact behind a clicked component — blocks, a trace, or files ──
   Everything reads downward: text wraps, diagrams scale to the drawer,
   the user scrolls vertically — never sideways. */
function InspectBody({ entry }: { entry: InspectEntry }) {
  const [fileIdx, setFileIdx] = useState(0);

  if (entry.blocks) {
    return <InspectBlocks blocks={entry.blocks} />;
  }

  if (entry.trace) {
    return <TraceView trace={entry.trace} />;
  }

  if (entry.files && entry.files.length > 0) {
    const file = entry.files[Math.min(fileIdx, entry.files.length - 1)];
    return (
      <div>
        <div className="flex flex-wrap border-b border-line" role="tablist">
          {entry.files.map((f, i) => (
            <button
              key={f.path}
              type="button"
              role="tab"
              aria-selected={i === fileIdx}
              onClick={() => setFileIdx(i)}
              className={`border-r border-line px-4 py-2.5 font-mono text-label tracking-[0.08em] transition-colors ${
                i === fileIdx
                  ? "bg-panel-2 text-(--accent)"
                  : "text-dim hover:text-bone"
              }`}
            >
              {tabLabel(f.path)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line px-5 py-2.5">
          <span className="font-mono text-label tracking-[0.06em] text-ash">
            {file.path}
          </span>
          {file.note && (
            <span className="font-mono text-label tracking-[0.06em] text-dim">
              — {file.note}
            </span>
          )}
        </div>
        <pre className="px-5 py-4 font-mono text-mono-sm leading-[1.7] break-words whitespace-pre-wrap text-ash">
          {file.excerpt}
        </pre>
      </div>
    );
  }

  return (
    <pre className="px-5 py-4 font-mono text-mono-sm leading-[1.7] break-words whitespace-pre-wrap text-ash">
      {entry.excerpt}
    </pre>
  );
}

export default function SystemDeepDive({
  title,
  subtitle,
  inspect,
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
  /** key into the inspect registry — enables click-a-box → see the artifact */
  inspect?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  stateMachines?: StateMachine[];
  loops?: LoopRow[];
  core?: CoreRule[];
  layers?: DeepDiveLayer[];
  invariants?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
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

  const files = inspect ? INSPECT[inspect] : undefined;
  const inspectableIds = files
    ? new Set(nodes.map((n) => n.id).filter((id) => files[id]))
    : undefined;
  const inspected =
    inspectedId && files?.[inspectedId]
      ? { node: nodes.find((n) => n.id === inspectedId), entry: files[inspectedId] }
      : null;

  const close = useCallback(() => {
    setOpen(false);
    setInspectedId(null);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // the drawer catches the first Esc; the dive the second
      setInspectedId((cur) => {
        if (cur !== null) return null;
        close();
        return cur;
      });
    };
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
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={close}
                    className="border border-line px-3 py-1.5 font-mono text-mono-sm text-bone transition-colors hover:border-(--accent)"
                  >
                    Close ✕
                  </button>
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
                      fluid
                      markerId="deep-arrow"
                      interactiveIds={inspectableIds}
                      selectedId={inspectedId}
                      onNodeClick={(id) =>
                        setInspectedId((cur) => (cur === id ? null : id))
                      }
                    />
                  </div>

                  <p className="mt-3 font-mono text-label tracking-[0.12em] text-dim uppercase">
                    <span className="text-(--accent)">outlined</span> = where
                    the model has no say — code or a human decides ·{" "}
                    <span className="text-ash">dashed</span> = failure / repair
                    path
                    {inspectableIds && inspectableIds.size > 0 && (
                      <>
                        {" · "}
                        <span className="text-bone">
                          click a component marked + to see what&apos;s behind it
                        </span>
                      </>
                    )}
                  </p>

                  {stateMachines.length > 0 && (
                    <>
                      <SectionLabel
                        n="01"
                        title="State machines — the actual lifecycles"
                      />
                      <div className="grid gap-6">
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
                            <div className="p-6">
                              <StateFlowSvg
                                machine={m}
                                markerId={`sm-arrow-${i}`}
                              />
                            </div>
                          </figure>
                        ))}
                      </div>
                      <p className="mt-3 font-mono text-label tracking-[0.12em] text-dim uppercase">
                        <span className="text-(--accent)">outlined</span> = a
                        gate — the run stops here unless it passes ·{" "}
                        <span className="text-ash">dashed box</span> = end state
                        · <span className="text-ash">dashed path</span> = retry
                        / repair
                      </p>
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

                {/* click a box → a full-height, scrollable drawer with the
                    artifact behind it. Esc or the backdrop closes it. */}
                <AnimatePresence>
                  {inspected?.node && (
                    <>
                      <motion.div
                        key="inspect-backdrop"
                        className="fixed inset-0 z-20 bg-void/60"
                        initial={reduced ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reduced ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => setInspectedId(null)}
                        aria-hidden
                      />
                      <motion.aside
                        key={`inspect-${inspectedId}`}
                        role="dialog"
                        aria-label={`${inspected.node.label} — the artifact behind it`}
                        className="fixed inset-y-0 right-0 z-30 flex w-full max-w-[min(58rem,94vw)] flex-col border-l border-line bg-panel"
                        initial={reduced ? false : { x: "100%" }}
                        animate={{ x: 0 }}
                        exit={reduced ? undefined : { x: "100%" }}
                        transition={{
                          duration: 0.4,
                          ease: [0.19, 1, 0.22, 1],
                        }}
                      >
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line bg-panel px-5 py-3.5">
                          <span className="font-mono text-label tracking-[0.18em] text-(--accent) uppercase">
                            {inspected.node.label}
                          </span>
                          <span className="font-mono text-label tracking-[0.06em] text-ash">
                            {inspected.entry.path}
                          </span>
                          <button
                            type="button"
                            onClick={() => setInspectedId(null)}
                            className="ml-auto border border-line px-2.5 py-1 font-mono text-label tracking-[0.18em] text-dim uppercase transition-colors hover:border-(--accent) hover:text-bone"
                          >
                            close ✕
                          </button>
                        </div>
                        {inspected.entry.note && (
                          <p className="border-b border-line px-5 py-2.5 font-mono text-label tracking-[0.08em] text-dim">
                            {inspected.entry.note}
                          </p>
                        )}
                        <div className="min-h-0 flex-1 overflow-y-auto">
                          <InspectBody
                            key={inspectedId}
                            entry={inspected.entry}
                          />
                        </div>
                        <p className="border-t border-line px-5 py-2.5 font-mono text-label tracking-[0.12em] text-dim uppercase">
                          {inspected.entry.trace
                            ? "drawn from the real wiring — span names, models, scores & gates as coded; timings from a documented run"
                            : inspected.entry.blocks
                              ? "distilled from the source file — names, rules, thresholds & quotes as coded, nothing illustrative"
                              : "quoted verbatim from the source — nothing illustrative"}
                        </p>
                      </motion.aside>
                    </>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
