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
  { id: "request", label: "REQUEST", ms: 1813, who: "code",
    note: "another agent wants research — a plain GET, no account, no API key, no sales call" },
  { id: "pay402", label: "402", ms: 2380, who: "code",
    note: "the middleware answers 402 PAYMENT REQUIRED — the payment-required header carries the exact scheme, the network, and the USDC amount in base units" },
  { id: "pay", label: "PAY", ms: 2267, who: "code",
    note: "the buyer signs an EIP-3009 transferWithAuthorization and retries; the facilitator verifies before the route handler ever runs" },
  { id: "source", label: "SOURCE", ms: 2607, who: "code",
    note: "jim is a buyer too: an unpaid pre-flight reads the upstream price from its 402, budget.propose checks it against the $0.10-per-query ceiling, then jim pays the same way it gets paid" },
  { id: "draft", label: "DRAFT", ms: 2153, who: "model",
    note: "sonnet writes the memo — every claim against the snapshot, every figure expected to carry a [C#] citation" },
  { id: "gate", label: "GATE", ms: 2947, who: "code",
    note: "no model — regex pulls every dollar figure, percentage and multiple; each must match a cited fact within max(2%, 0.05). a hallucinated number has no fact to match" },
  { id: "pass", label: "PASS", ms: 2380, who: "model",
    note: "the rejection text is the next prompt — attempt 2 of a hard maximum 2. exhausted attempts mean no memo and no charge, never a lowered bar" },
  { id: "deliver", label: "DELIVER", ms: 2493, who: "code",
    note: "settle on-chain, receipt in the payment-response header, memo in the body — research that proves itself, $0.25 at a time" },
  { id: "open", label: "OPEN", ms: 2267, who: "code",
    note: "the storefront stays up — no signup, no invoice, the next buyer pays the same way. monitors poll quietly for free and bill $0.10 only when something material ships" },
];

/* ── the wire, drawn — three lifelines, six messages, two coins ──── */

const LX = { buyer: 110, jim: 380, up: 650 };

interface Msg {
  y: number;
  from: number;
  to: number;
  phase: string;
  label: string;
  sub?: string;
  accent?: boolean;
  hero?: boolean;
  delay?: number;
}

const MSGS: Msg[] = [
  { y: 58, from: LX.buyer, to: LX.jim, phase: "request",
    label: "GET /research/fundamentals?ticker=AAPL" },
  { y: 100, from: LX.jim, to: LX.buyer, phase: "pay402", accent: true, hero: true,
    label: "402 PAYMENT REQUIRED",
    sub: "payment-required: exact · eip155:8453 · 250000 µUSDC = $0.25" },
  { y: 142, from: LX.buyer, to: LX.jim, phase: "pay",
    label: "retry + payment-signature",
    sub: "EIP-3009 transferWithAuthorization · facilitator /verify ✓" },
  { y: 184, from: LX.jim, to: LX.up, phase: "source",
    label: "pre-flight GET — the price read from upstream's own 402",
    sub: "budget.propose($0.01 ≤ $0.10 ceiling) ✓" },
  { y: 226, from: LX.up, to: LX.jim, phase: "source", accent: true, delay: 1020,
    label: "data + payment-response (tx hash)",
    sub: "cost_in $0.01 · cached 24 h — the next query is free" },
  { y: 268, from: LX.jim, to: LX.buyer, phase: "deliver", accent: true,
    label: "200 OK — memo + receipt in payment-response" },
];

export default function X402Console({ title }: { title?: string }) {
  const playback = usePlayback(PHASES);
  const { at, past, reduced } = playback;

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
          <span className="text-(--accent)">cyan</span> = value in motion —
          payments, receipts, a memo that proved itself ·{" "}
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
          prose, the buyer and the open-phase traffic are representative.
        </>
      }
    >
      {/* the wire — a live sequence diagram. Min-width keeps the type
          legible on phones; the band scrolls sideways instead of shrinking */}
      <div className="overflow-x-auto px-2 pt-2 pb-1 md:px-3">
        <svg viewBox="0 0 760 300" className="block w-full min-w-[640px]" aria-hidden>
          <defs>
            <filter id="x4-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* lifelines */}
          {(
            [
              [LX.buyer, "buyer agent", false],
              [LX.jim, "jim", true],
              [LX.up, "upstream — the graph", false],
            ] as const
          ).map(([x, name, isJim]) => (
            <g key={x} fontFamily="var(--font-mono)">
              <text
                x={x}
                y={17}
                textAnchor="middle"
                fontSize="12"
                letterSpacing="1.5"
                fill={isJim ? "var(--accent)" : "var(--color-ash)"}
                style={{ textTransform: "uppercase" }}
              >
                {name}
              </text>
              <rect
                x={x - 3}
                y={25}
                width={6}
                height={6}
                fill={isJim ? "var(--accent)" : "var(--color-line-loud)"}
              />
              <line
                x1={x}
                y1={31}
                x2={x}
                y2={288}
                stroke="var(--color-line-loud)"
                strokeDasharray="2 6"
              />
              {/* open for business — quiet traffic keeps moving */}
              {at("open") && !reduced && (
                <circle
                  cx={x}
                  cy={0}
                  r={2.5}
                  fill="var(--accent)"
                  className="x4-flow"
                  style={{ animationDelay: `${(x / LX.up) * 1.247}s` }}
                />
              )}
            </g>
          ))}

          {/* messages */}
          {MSGS.map((m) => {
            const dir = m.to > m.from ? 1 : -1;
            const x1 = m.from + dir * 8;
            const x2 = m.to - dir * 8;
            const len = Math.abs(x2 - x1);
            const mid = (x1 + x2) / 2;
            const on = past(m.phase);
            const dly = on && at(m.phase) ? (m.delay ?? 0) : 0;
            const color = m.accent ? "var(--accent)" : "var(--color-ash)";
            return (
              <g key={`${m.phase}-${m.y}`} fontFamily="var(--font-mono)">
                <line
                  x1={x1}
                  y1={m.y}
                  x2={x2}
                  y2={m.y}
                  stroke={color}
                  strokeWidth={m.hero ? 1.6 : 1.2}
                  strokeDasharray={len}
                  filter={m.hero ? "url(#x4-glow)" : undefined}
                  style={{
                    strokeDashoffset: on ? 0 : len,
                    transition: `stroke-dashoffset 623ms var(--ease-cine) ${dly}ms, opacity 227ms`,
                    opacity: on ? 1 : 0,
                  }}
                />
                <path
                  d={
                    dir === 1
                      ? `M ${x2} ${m.y} l -7 -4 v 8 z`
                      : `M ${x2} ${m.y} l 7 -4 v 8 z`
                  }
                  fill={color}
                  style={{
                    opacity: on ? 1 : 0,
                    transition: `opacity 283ms var(--ease-cine) ${dly + 453}ms`,
                  }}
                />
                <text
                  x={mid}
                  y={m.y - 8}
                  textAnchor="middle"
                  fontSize={m.hero ? 13 : 11}
                  letterSpacing={m.hero ? 1.4 : 0.2}
                  fill={color}
                  stroke="var(--color-panel)"
                  strokeWidth="4"
                  paintOrder="stroke"
                  filter={m.hero ? "url(#x4-glow)" : undefined}
                  className={m.hero && at("open") && !reduced ? "x4-breathe" : undefined}
                  style={{
                    opacity: on ? 1 : 0,
                    transition: `opacity 397ms var(--ease-cine) ${dly + 113}ms`,
                  }}
                >
                  {m.label}
                </text>
                {m.sub && (
                  <text
                    x={mid}
                    y={m.y + 15}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="var(--color-dim)"
                    stroke="var(--color-panel)"
                    strokeWidth="3.5"
                    paintOrder="stroke"
                    style={{
                      opacity: on ? 1 : 0,
                      transition: `opacity 397ms var(--ease-cine) ${dly + 283}ms`,
                    }}
                  >
                    {m.sub}
                  </text>
                )}
              </g>
            );
          })}

          {/* the coins — money actually moving, both directions of the business */}
          {(
            [
              { from: LX.buyer, to: LX.jim, y: 142, on: past("pay") },
              { from: LX.jim, to: LX.up, y: 184, on: past("source") },
            ] as const
          ).map((c, i) => (
            <g
              key={i}
              fontFamily="var(--font-mono)"
              style={{
                transform: c.on
                  ? `translate(${c.to - 26}px, ${c.y}px)`
                  : `translate(${c.from + 18}px, ${c.y}px)`,
                opacity: c.on ? 1 : 0,
                transition:
                  "transform 907ms var(--ease-cine) 113ms, opacity 283ms var(--ease-cine) 113ms",
              }}
            >
              <circle r={7} fill="var(--color-void)" stroke="var(--accent)" strokeWidth="1.3" filter="url(#x4-glow)" />
              <text y={3} textAnchor="middle" fontSize="8" fill="var(--accent)">
                $
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* the memo under the gate */}
      <div className="grid border-t border-line md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="border-b border-line p-4 md:border-r md:border-b-0 md:p-5" style={fade(past("draft"), 397)}>
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
        <div className="p-4 md:p-5" style={fade(past("gate"), 397)}>
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
            <p className="mt-auto pt-2 font-mono text-[0.62rem] text-dim" style={fade(at("gate") || past("pass"), 397)}>
              a hallucinated number has no fact it matches — it structurally
              cannot pass
            </p>
          </div>
        </div>
      </div>

      {/* settlement + the economics of one sale */}
      <div className="border-t border-line px-4 py-3 md:px-5" style={fade(past("deliver"), 397)}>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 font-mono text-[0.7rem]">
          <span className="text-dim">facilitator /settle →</span>
          <span className="text-ash">200 OK · payment-response: tx 0x…receipt</span>
          <span className="ml-auto text-bone">
            $0.25 in − $0.01 data − model ={" "}
            <span
              className={at("open") && !reduced ? "x4-margin text-(--accent)" : "text-(--accent)"}
            >
              margin on every memo
            </span>
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-mono text-[0.62rem] text-dim">
            the tests pin this math: $0.25 out, $0.03 data, $0 test model →
            $0.22 margin · monitors bill $0.10 only when a material, cited
            update ships — quiet polls are free
          </p>
          <span
            className="flex items-center gap-1.5 font-mono text-[0.62rem]"
            style={fade(past("open"), 397)}
          >
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              {past("open") && !reduced && (
                <span className="x4-ping absolute inline-flex h-full w-full rounded-full bg-(--accent) opacity-60" />
              )}
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--accent)" />
            </span>
            <span className="text-(--accent)">open</span>
            <span className="text-dim">— waiting on the next GET</span>
          </span>
        </div>
      </div>

      <style>{`
        @keyframes x4-flow-y {
          0% { transform: translateY(31px); opacity: 0; }
          12% { opacity: 0.9; }
          88% { opacity: 0.9; }
          100% { transform: translateY(284px); opacity: 0; }
        }
        .x4-flow { animation: x4-flow-y 1.813s linear infinite; }
        @keyframes x4-breathe-o {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .x4-breathe { animation: x4-breathe-o 1.247s ease-in-out infinite; }
        .x4-margin { animation: x4-breathe-o 1.247s ease-in-out infinite; }
        @keyframes x4-ping-k {
          0% { scale: 1; opacity: 0.6; }
          80%, 100% { scale: 2.6; opacity: 0; }
        }
        .x4-ping { animation: x4-ping-k 1.02s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .x4-flow, .x4-breathe, .x4-margin, .x4-ping { animation: none; }
        }
      `}</style>
    </ConsoleShell>
  );
}
