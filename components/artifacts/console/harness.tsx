"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * ────────────────────────────────────────────────────────────────────
 * CONSOLE HARNESS — shared playback engine + chrome for the per-project
 * run consoles (SetConsole, PantryConsole, X402Console, MandateConsole).
 *
 * Every console is the same contract: a sequence of PHASES played on a
 * timer once the console scrolls into view, scrubbable via the phase
 * chips, replayable, and frozen at the finished state under
 * prefers-reduced-motion. What happens on the stage is each console's
 * own — built strictly from its repo's real wiring.
 *
 * Color doctrine: the project accent = the model imagining. Accent
 * OUTLINE = the model has no say — code or a human decides. Ember = a
 * failure or an attack.
 * ────────────────────────────────────────────────────────────────────
 */

export interface ConsolePhase {
  id: string;
  label: string;
  /** how long this phase holds before auto-advancing */
  ms: number;
  /** who is acting — drives the narration tag color */
  who: "model" | "code" | "human";
  /** one-line narration shown under the stage */
  note: string;
}

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const reducedMotionNow = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface Playback {
  /** current phase index; -1 = not started */
  step: number;
  setStep: (i: number) => void;
  reduced: boolean;
  rootRef: React.RefObject<HTMLDivElement | null>;
  /** is the current phase exactly this one */
  at: (id: string) => boolean;
  /** has playback reached (or passed) this phase */
  past: (id: string) => boolean;
}

export function usePlayback(phases: readonly ConsolePhase[]): Playback {
  const [rawStep, setStep] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  // reduced motion = skip the playback, show the finished state
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    reducedMotionNow,
    () => false
  );
  const step = reduced ? phases.length - 1 : rawStep;

  useEffect(() => {
    if (reduced) return;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          setStep(0);
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (reduced || rawStep < 0 || rawStep >= phases.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), phases[rawStep].ms);
    return () => clearTimeout(t);
  }, [rawStep, reduced, phases]);

  return {
    step,
    setStep: (i: number) => {
      started.current = true;
      setStep(i);
    },
    reduced,
    rootRef,
    at: (id) => (step >= 0 ? phases[step].id === id : false),
    past: (id) => step >= phases.findIndex((p) => p.id === id),
  };
}

/** opacity fade tied to playback progress — the consoles' one transition */
export function fade(on: boolean, dur = 700): React.CSSProperties {
  return {
    opacity: on ? 1 : 0,
    transition: `opacity ${dur}ms var(--ease-cine)`,
  };
}

export function ConsoleShell({
  title,
  ariaLabel,
  phases,
  playback,
  legend,
  footnote,
  children,
}: {
  title: string;
  ariaLabel: string;
  phases: readonly ConsolePhase[];
  playback: Playback;
  /** the doctrine line — what each color means in THIS console */
  legend: ReactNode;
  /** the honesty line — what's verbatim and what's representative */
  footnote: ReactNode;
  children: ReactNode;
}) {
  const { step, setStep, reduced, rootRef } = playback;

  return (
    <div
      ref={rootRef}
      className="my-10 border border-line bg-panel"
      role="group"
      aria-label={ariaLabel}
    >
      {/* header — transport */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 md:px-5">
        <p className="font-mono text-label tracking-[0.2em] text-dim uppercase">
          {title}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1">
          {phases.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`Jump to ${p.label}`}
              className={`font-mono text-label tracking-[0.14em] uppercase transition-colors duration-300 ${
                i === step
                  ? "text-(--accent)"
                  : i < step
                    ? "text-ash"
                    : "text-dim/60"
              }`}
            >
              {p.label}
            </button>
          ))}
          {!reduced && (
            <button
              type="button"
              onClick={() => setStep(0)}
              className="ml-1 border border-line px-2 py-0.5 font-mono text-label tracking-[0.14em] text-ash uppercase transition-colors duration-300 hover:border-line-loud hover:text-bone"
            >
              ↺ replay
            </button>
          )}
        </div>
      </div>

      {/* the stage — each console's own */}
      {children}

      {/* narration + doctrine legend + honesty line */}
      <div className="border-t border-line px-4 py-3 md:px-5">
        <p className="min-h-[2.6em] font-mono text-mono-sm text-ash">
          {step >= 0 && (
            <>
              <span
                className={
                  phases[step].who === "model" ? "text-(--accent)" : "text-dim"
                }
              >
                [{phases[step].who}]
              </span>{" "}
              {phases[step].note}
            </>
          )}
        </p>
        <p className="mt-2 font-mono text-[0.6rem] tracking-[0.12em] text-dim uppercase">
          {legend}
        </p>
        <p className="mt-1.5 font-mono text-[0.6rem] leading-relaxed text-dim/80">
          {footnote}
        </p>
      </div>
    </div>
  );
}
