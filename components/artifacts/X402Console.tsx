"use client";

import { useMemo } from "react";
import {
  ConsoleShell,
  fade,
  usePlayback,
  type ConsolePhase,
} from "./console/harness";

/**
 * ────────────────────────────────────────────────────────────────────
 * X402 CONSOLE — one memo sale, agent to agent.
 *
 * A sequence diagram of agentic commerce in both directions: a buyer
 * agent pays JIM in USDC over x402; JIM turns around and buys its own
 * upstream data the same way; Sonnet drafts the memo; a deterministic
 * sourcing gate — regex and arithmetic, no model — rejects any figure
 * that doesn't trace to a cited fact, and only a passing memo ships.
 *
 * The RULES are the repo's, verbatim: the gate's tolerance math
 * (max(2% relative, 0.05 absolute)) executes right here on the memo
 * shown; prices, the 402 header flow, the budget ceiling, and the
 * retry bound are quoted from the code. The memo text is
 * representative.
 * ────────────────────────────────────────────────────────────────────
 */

/* ── the real rules, ported 1:1 from the repo ─────────────────────── */

// src/jim/research/gate.py — _matches(): a figure matches a cited fact
// iff |value − fact| ≤ max(2% of fact, 0.05). Verbatim tolerance.
const matches = (value: number, fact: number) =>
  Math.abs(value - fact) <= Math.max(Math.abs(fact) * 0.02, 0.05);

// the gate's three violation kinds: phantom citation · uncited ·
// value mismatch. A memo passes iff violations == [].
interface MemoLine {
  text: string;
  /** the figure the gate's regex extracts from this line */
  figure?: { display: string; value: number; cite?: string };
}
interface Fact {
  id: string;
  label: string;
  value: number;
}

// snapshot facts — C1 is the repo's own docstring example (Apple
// FY-2022 revenue from EDGAR); the rest are representative
const FACTS: Fact[] = [
  { id: "C1", label: "Revenue (10-K)", value: 394_328_000_000 },
  { id: "C2", label: "Gross margin", value: 43.3 },
  { id: "C3", label: "P/E (derived)", value: 28.4 },
  { id: "C4", label: "Services revenue", value: 85_200_000_000 },
];

// draft nº1 — sonnet leaves one figure uncited
const DRAFT_1: MemoLine[] = [
  { text: "Revenue of $394.3B [C1], flat against a strong dollar.",
    figure: { display: "$394.3B", value: 394_300_000_000, cite: "C1" } },
  { text: "Gross margin held at 43.3% [C2] on services mix.",
    figure: { display: "43.3%", value: 43.3, cite: "C2" } },
  { text: "The market pays 28.4x [C3] for that stability.",
    figure: { display: "28.4x", value: 28.4, cite: "C3" } },
  { text: "Services keeps compounding toward $85B.",
    figure: { display: "$85B", value: 85_000_000_000 } },
];

// draft nº2 — the feedback loop cites it; same fact, in tolerance
const DRAFT_2: MemoLine[] = [
  ...DRAFT_1.slice(0, 3),
  { text: "Services keeps compounding — $85.2B [C4] this year.",
    figure: { display: "$85.2B", value: 85_200_000_000, cite: "C4" } },
];

// the gate, as coded: every extracted figure must carry a citation
// whose fact value matches within tolerance
function runGate(lines: MemoLine[]) {
  const violations: string[] = [];
  let figures = 0;
  let covered = 0;
  for (const l of lines) {
    if (!l.figure) continue;
    figures++;
    const { display, value, cite } = l.figure;
    if (!cite) {
      violations.push(`uncited: "${display}" (citations: none)`);
      continue;
    }
    const fact = FACTS.find((f) => f.id === cite);
    if (!fact) {
      violations.push(`phantom citation: [${cite}]`);
      continue;
    }
    if (!matches(value, fact.value)) {
      violations.push(`value mismatch: "${display}" (citations: [${cite}])`);
      continue;
    }
    covered++;
  }
  return { passed: violations.length === 0, violations, figures, covered };
}

/* ── playback ─────────────────────────────────────────────────────── */

const PHASES: readonly ConsolePhase[] = [
  { id: "request", label: "REQUEST", ms: 2000, who: "code",
    note: "another agent wants research — a plain GET, no account, no API key, no sales call" },
  { id: "pay402", label: "402", ms: 2600, who: "code",
    note: "the middleware answers 402 PAYMENT REQUIRED — the payment-required header carries the exact scheme, the network, and the USDC amount in base units" },
  { id: "pay", label: "PAY", ms: 2400, who: "code",
    note: "the buyer signs an EIP-3009 transferWithAuthorization and retries; the facilitator verifies before the route handler ever runs" },
  { id: "source", label: "SOURCE", ms: 2800, who: "code",
    note: "jim is a buyer too: an unpaid pre-flight reads the upstream price from its 402, budget.propose checks it against the $0.10-per-query ceiling, then jim pays the same way it gets paid" },
  { id: "draft", label: "DRAFT", ms: 2400, who: "model",
    note: "sonnet writes the memo — every claim against the snapshot, every figure expected to carry a [C#] citation" },
  { id: "gate", label: "GATE", ms: 3000, who: "code",
    note: "no model — regex pulls every dollar figure, percentage and multiple; each must match a cited fact within max(2%, 0.05). a hallucinated number has no fact to match" },
  { id: "pass", label: "PASS", ms: 2600, who: "model",
    note: "the rejection text is the next prompt — attempt 2 of a hard maximum 2. exhausted attempts mean no memo and no charge, never a lowered bar" },
  { id: "deliver", label: "DELIVER", ms: 3000, who: "code",
    note: "settle on-chain, receipt in the payment-response header, memo in the body — research that proves itself, $0.25 at a time" },
];

function Arrow({
  dir,
  label,
  sub,
  tone = "ash",
  on,
  side,
}: {
  dir: "→" | "←";
  label: string;
  sub?: string;
  tone?: "ash" | "accent" | "ember";
  on: boolean;
  side: "left" | "right";
}) {
  const color =
    tone === "accent"
      ? "text-(--accent)"
      : tone === "ember"
        ? "text-ember"
        : "text-ash";
  return (
    <div
      className={`${side === "right" ? "col-start-2" : ""} px-2 font-mono text-[0.66rem]`}
      style={fade(on)}
    >
      <p className={`${color} flex items-baseline gap-1`}>
        {dir === "←" && <span aria-hidden>←</span>}
        <span className="min-w-0 truncate">{label}</span>
        {dir === "→" && <span aria-hidden>→</span>}
      </p>
      {sub && <p className="text-dim">{sub}</p>}
      <div className="mt-0.5 border-b border-dashed border-line-loud" aria-hidden />
    </div>
  );
}

export default function X402Console({ title }: { title?: string }) {
  const playback = usePlayback(PHASES);
  const { at, past } = playback;

  const lines = past("pass") ? DRAFT_2 : DRAFT_1;
  const report = useMemo(() => runGate(lines), [lines]);
  const r1 = useMemo(() => runGate(DRAFT_1), []);

  return (
    <ConsoleShell
      title={title ?? "One memo sale, agent to agent"}
      ariaLabel="Animated playback of one x402 memo sale"
      phases={PHASES}
      playback={playback}
      legend={
        <>
          <span className="text-(--accent)">cyan</span> = the model imagining ·{" "}
          <span className="border border-(--accent) px-1">outline</span> = the
          model has no say — code decides ·{" "}
          <span className="text-ember">ember</span> = a number that
          couldn&apos;t prove itself
        </>
      }
      footnote={
        <>
          The gate is real and running: the tolerance test —
          max(2&nbsp;% relative, 0.05 absolute) — executes on this memo in your
          browser, exactly as coded. Prices, the 402 header flow, the
          $0.10-per-query buy ceiling and the 2-attempt bound are quoted from
          the repo; C1 is the repo&apos;s own EDGAR example fact. The memo
          prose and the buyer are representative.
        </>
      }
    >
      {/* the three lanes */}
      <div className="grid grid-cols-2 gap-y-2 px-4 pt-3 pb-4 md:px-5">
        <div className="col-span-2 mb-1 grid grid-cols-3 font-mono text-label tracking-[0.18em] text-dim uppercase">
          <span>buyer agent</span>
          <span className="text-center text-(--accent)">jim</span>
          <span className="text-right">upstream — the graph</span>
        </div>

        <Arrow side="left" on={past("request")} dir="→"
          label="GET /research/fundamentals?ticker=AAPL" />
        <Arrow side="left" on={past("pay402")} dir="←" tone="accent"
          label="402 PAYMENT REQUIRED"
          sub="payment-required: exact · eip155:8453 · 250000 µUSDC = $0.25" />
        <Arrow side="left" on={past("pay")} dir="→"
          label="retry + payment-signature"
          sub="EIP-3009 transferWithAuthorization · facilitator /verify ✓" />
        <Arrow side="right" on={past("source")} dir="→"
          label="pre-flight GET — reads the price from upstream's 402"
          sub="budget.propose($0.01 ≤ $0.10 ceiling) ✓" />
        <Arrow side="right" on={past("source")} dir="←" tone="accent"
          label="data + payment-response (tx hash)"
          sub="cost_in $0.01 · cached 24 h — the next query is free" />
      </div>

      {/* the memo under the gate */}
      <div className="grid border-t border-line md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="border-b border-line p-4 md:border-r md:border-b-0 md:p-5" style={fade(past("draft"))}>
          <p className="mb-2 font-mono text-label tracking-[0.2em] text-dim uppercase">
            the memo — draft {past("pass") ? 2 : 1} of max 2
          </p>
          <div className="space-y-1.5 font-mono text-[0.7rem] leading-relaxed">
            {lines.map((l, i) => {
              const bad =
                past("gate") &&
                !past("pass") &&
                l.figure &&
                !l.figure.cite;
              return (
                <p key={i} className={bad ? "text-ember" : "text-ash"}>
                  {l.text}
                  {l.figure?.cite && past("gate") && (
                    <span className="ml-1 text-(--accent)">✓{l.figure.cite}</span>
                  )}
                </p>
              );
            })}
          </div>
        </div>

        {/* the sourcing gate — outlined: code decides */}
        <div className="p-4 md:p-5" style={fade(past("gate"))}>
          <div className="flex h-full flex-col border border-(--accent) p-3">
            <p className="mb-2 flex items-baseline justify-between font-mono text-label tracking-[0.2em] uppercase">
              <span className="text-(--accent)">sourcing gate</span>
              <span className={report.passed ? "text-(--accent)" : "text-ember"}>
                {report.passed ? "pass" : "rejected"}
              </span>
            </p>
            <div className="space-y-1 font-mono text-[0.68rem]">
              <div className="flex justify-between gap-3">
                <span className="text-ash">figures found</span>
                <span className="text-bone">{report.figures}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ash">traced to cited facts</span>
                <span className={report.passed ? "text-(--accent)" : "text-ember"}>
                  {report.covered} / {report.figures}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ash">tolerance</span>
                <span className="text-dim">max(2% rel, 0.05 abs)</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ash">models involved</span>
                <span className="text-bone">0</span>
              </div>
            </div>
            <p className="mt-3 min-h-[2.2rem] font-mono text-[0.68rem] leading-relaxed">
              {report.passed ? (
                <span className="text-dim">
                  violations == [] — only now is the memo allowed to exist
                </span>
              ) : (
                <>
                  <span className="text-ember">
                    “The sourcing gate REJECTED the memo. Fix every issue below:
                    — {r1.violations[0]}”
                  </span>{" "}
                  <span className="text-dim">→ fed back to sonnet</span>
                </>
              )}
            </p>
            <p className="mt-auto pt-2 font-mono text-[0.62rem] text-dim" style={fade(at("gate") || past("pass"))}>
              a hallucinated number has no fact it matches — it structurally
              cannot pass
            </p>
          </div>
        </div>
      </div>

      {/* settlement + the economics of one sale */}
      <div className="border-t border-line px-4 py-3 md:px-5" style={fade(past("deliver"))}>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 font-mono text-[0.7rem]">
          <span className="text-dim">facilitator /settle →</span>
          <span className="text-ash">200 OK · payment-response: tx 0x…receipt</span>
          <span className="ml-auto text-bone">
            $0.25 in − $0.01 data − model ={" "}
            <span className="text-(--accent)">margin on every memo</span>
          </span>
        </div>
        <p className="mt-1 font-mono text-[0.62rem] text-dim">
          the tests pin this math: $0.25 out, $0.03 data, $0 test model → $0.22
          margin · monitors bill $0.10 only when a material, cited update
          ships — quiet polls are free
        </p>
      </div>
    </ConsoleShell>
  );
}
