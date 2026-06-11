"use client";

import { useMemo, useState } from "react";
import {
  ConsoleShell,
  fade,
  usePlayback,
  type ConsolePhase,
} from "./console/harness";

/**
 * ────────────────────────────────────────────────────────────────────
 * SET CONSOLE — the booth, thinking.
 *
 * An animated playback of one set-generation run: brief → arc →
 * candidate pool → proposal → critic → revision → pass → HITL →
 * render. The RULES are the repo's, verbatim — the Camelot legality
 * test, the open genre profile's thresholds, linear arc interpolation,
 * RMSE and jump math all execute right here on the data shown. The SET
 * is representative: a plausible plan generated to exercise those rules.
 * ────────────────────────────────────────────────────────────────────
 */

/* ── the real rules, ported 1:1 from the repo ─────────────────────── */

// The gates this run is graded on. "sunset" in the brief selects the
// downtempo profile (src/dj/profiles.py), whose jump/harmonic gates
// equal the open defaults; arc-RMSE and the artist rule are critic-wide
// constants (src/dj/critic.py).
const TH = {
  maxBpmJump: 6.0,
  minHarmonicCompat: 0.7,
  maxArcRmseLufs: 4.0,
  maxArtistRepeats: 0,
};

// src/dj/audio/camelot.py — compatible(): identical, relative
// major/minor (same number, other letter), or ±1 on the wheel with
// the same letter. Nothing else mixes.
function camelotCompatible(a: string, b: string): boolean {
  const pa = { n: parseInt(a, 10), l: a.slice(-1) };
  const pb = { n: parseInt(b, 10), l: b.slice(-1) };
  if (pa.n === pb.n) return true; // identical or relative
  const d = Math.abs(pa.n - pb.n) % 12;
  return Math.min(d, 12 - d) === 1 && pa.l === pb.l;
}

// src/dj/arc.py — Arc.target_at(): linear interpolation between
// {position, bpm, lufs} control points. The model only authors the
// points; everything downstream treats the curve as data.
interface ArcPoint {
  position: number;
  bpm: number;
  lufs: number;
}
function targetAt(points: ArcPoint[], pos: number): ArcPoint {
  if (pos <= points[0].position) return points[0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (pos <= b.position) {
      const t = (pos - a.position) / (b.position - a.position || 1);
      return {
        position: pos,
        bpm: a.bpm + (b.bpm - a.bpm) * t,
        lufs: a.lufs + (b.lufs - a.lufs) * t,
      };
    }
  }
  return points[points.length - 1];
}

// src/dj/critic.py — evaluate_set(), the four hard gates
interface Slot {
  camelot: string;
  bpm: number;
  lufs: number;
  section: string;
}
function evaluateSet(slots: Slot[], arc: ArcPoint[]) {
  const jumps: number[] = [];
  let compat = 0;
  const rough: number[] = [];
  for (let i = 0; i < slots.length - 1; i++) {
    jumps.push(Math.abs(slots[i].bpm - slots[i + 1].bpm));
    if (camelotCompatible(slots[i].camelot, slots[i + 1].camelot)) compat++;
    else rough.push(i);
  }
  const harmonic = compat / (slots.length - 1);
  const maxJump = Math.max(...jumps);
  const sq = slots.map((s, i) => {
    const t = targetAt(arc, i / (slots.length - 1));
    return (s.lufs - t.lufs) ** 2;
  });
  const rmse = Math.sqrt(sq.reduce((a, b) => a + b, 0) / sq.length);
  const passed =
    harmonic >= TH.minHarmonicCompat &&
    maxJump <= TH.maxBpmJump &&
    rmse <= TH.maxArcRmseLufs;
  // notes format mirrors critic.py's f-strings
  const notes: string[] = [];
  if (harmonic < TH.minHarmonicCompat)
    notes.push(`harmonic compat ${Math.round(harmonic * 100)}% < 70%`);
  if (maxJump > TH.maxBpmJump)
    notes.push(`max bpm jump ${maxJump.toFixed(1)} > ${TH.maxBpmJump}`);
  if (rmse > TH.maxArcRmseLufs)
    notes.push(`energy-arc RMSE ${rmse.toFixed(1)} LUFS > ${TH.maxArcRmseLufs}`);
  return { harmonic, maxJump, rmse, passed, notes, rough };
}

/* ── the representative run ───────────────────────────────────────── */

// a "peak" shaped arc (one of the repo's named shapes), 5 control
// points — inside the schema's 4–7
const ARC: ArcPoint[] = [
  { position: 0.0, bpm: 118, lufs: -16 },
  { position: 0.35, bpm: 122, lufs: -13 },
  { position: 0.7, bpm: 126, lufs: -9 },
  { position: 0.85, bpm: 124, lufs: -10 },
  { position: 1.0, bpm: 120, lufs: -14 },
];

// proposal nº1 — the selector reads the brief's "slow build" too
// literally and stays in cold sections straight through the peak.
// one wrong-key pick at slot 06 costs two transitions.
const ROUND_1: Slot[] = [
  { camelot: "7A", bpm: 118, lufs: -16.1, section: "intro" },
  { camelot: "8A", bpm: 119, lufs: -15.3, section: "chorus" },
  { camelot: "8B", bpm: 120, lufs: -14.2, section: "chorus" },
  { camelot: "8B", bpm: 121, lufs: -13.4, section: "bridge" },
  { camelot: "9B", bpm: 122, lufs: -12.6, section: "chorus" },
  { camelot: "3A", bpm: 123, lufs: -16.8, section: "break" },
  { camelot: "9A", bpm: 124, lufs: -17.2, section: "break" },
  { camelot: "10A", bpm: 126, lufs: -16.4, section: "intro" },
  { camelot: "10B", bpm: 125, lufs: -15.9, section: "break" },
  { camelot: "10B", bpm: 124, lufs: -16.2, section: "bridge" },
  { camelot: "11B", bpm: 122, lufs: -15.4, section: "break" },
  { camelot: "12B", bpm: 119, lufs: -13.6, section: "outro" },
];

// proposal nº2 — slots 05–10 swapped for peak-energy sections in
// legal keys; the curve hugs the arc and every transition mixes
const ROUND_2: Slot[] = [
  { camelot: "7A", bpm: 118, lufs: -15.8, section: "intro" },
  { camelot: "8A", bpm: 119, lufs: -13.9, section: "chorus" },
  { camelot: "8B", bpm: 120, lufs: -13.1, section: "chorus" },
  { camelot: "8B", bpm: 121, lufs: -12.0, section: "bridge" },
  { camelot: "9B", bpm: 122, lufs: -11.3, section: "chorus" },
  { camelot: "9A", bpm: 123, lufs: -9.9, section: "chorus" },
  { camelot: "9A", bpm: 124, lufs: -9.0, section: "chorus" },
  { camelot: "10A", bpm: 126, lufs: -8.7, section: "chorus" },
  { camelot: "10B", bpm: 125, lufs: -10.4, section: "chorus" },
  { camelot: "10B", bpm: 124, lufs: -11.9, section: "bridge" },
  { camelot: "11B", bpm: 122, lufs: -13.7, section: "chorus" },
  { camelot: "12B", bpm: 119, lufs: -15.2, section: "outro" },
];

const SWAPPED = new Set([5, 6, 7, 8, 9, 10]);

const PHASES: readonly ConsolePhase[] = [
  { id: "brief", label: "BRIEF", ms: 3200, who: "human",
    note: "a vibe in plain words — the only input" },
  { id: "arc", label: "ARC", ms: 4400, who: "model",
    note: "the architect's whole authority: the shape of one curve — 4–7 {position, bpm, lufs} control points, interpolated linearly ever after" },
  { id: "pool", label: "POOL", ms: 3800, who: "code",
    note: "pgvector pulls candidates near the arc's bpm band — scored 0.5·acoustic + 0.4·taste + 0.1·rating" },
  { id: "propose", label: "PROPOSE", ms: 4400, who: "model",
    note: "the selector orders sections, not tracks — the right part of the right track for each moment of the arc" },
  { id: "critic", label: "CRITIC", ms: 5200, who: "code",
    note: "no model here — thresholds from the genre profile (“sunset” reads as downtempo), pure math, and the failure becomes the next prompt" },
  { id: "revise", label: "REVISE", ms: 4000, who: "model",
    note: "notes appended, revision 1 of a maximum 3 — then the same math runs again" },
  { id: "verify", label: "PASS", ms: 4400, who: "code",
    note: "same thresholds, no mercy, no model — this time the curve holds" },
  { id: "hitl", label: "APPROVE", ms: 4400, who: "human",
    note: "the plan is data — a human reads it before a second of audio is rendered. the y/n below is live: it does what the agent would do" },
  { id: "render", label: "RENDER", ms: 5000, who: "code",
    note: "time-stretch dst÷src · equal-power crossfade (sin²+cos²=1) · incoming bass high-passed at 180 Hz · overlap = half the outgoing section, quantized down to a power of two, capped by the genre" },
  { id: "live", label: "ON AIR", ms: 4000, who: "code",
    note: "the booth goes quiet and the set plays — one continuous .wav, with rekordbox.xml cues, an .m3u8 and a printable set sheet exported alongside" },
];

const HITL_IDX = PHASES.findIndex((p) => p.id === "hitl");

const W = 760;
const H = 230;
const PL = 44;
const PR = 14;
const PT = 16;
const PB = 26;

// the canvas plots LUFS (energy); BPM rides along as labels on the
// control points and in the slot lane
const x = (pos: number) => PL + pos * (W - PL - PR);
const yLufs = (l: number) => PT + ((-8 - l) / 10) * (H - PT - PB);

// deterministic pseudo-random — integer LCG, exact in float64, so the
// server-rendered SVG matches the client bit-for-bit (no Math.sin drift)
const jitter = (i: number, k: number) => {
  const s = (i * 1103515245 + k * 12345 + 1013904223) % 2147483648;
  return s / 2147483648;
};

export default function SetConsole({ title }: { title?: string }) {
  // scrubbing to APPROVE holds the clock — the y/n below becomes yours
  const playback = usePlayback(PHASES, { holdOnScrub: ["hitl"] });
  const { at, past, reduced, pause, resume, scrubSeq } = playback;

  // the human's answer at the gate: auto = playback answers y for you.
  // any scrub or replay re-arms the gate (state adjusted during render)
  const [decision, setDecision] = useState<"auto" | "yes" | "no">("auto");
  const [armedSeq, setArmedSeq] = useState(scrubSeq);
  if (armedSeq !== scrubSeq) {
    setArmedSeq(scrubSeq);
    setDecision("auto");
  }

  const declined = decision === "no";
  const onAir = at("live") && !declined;
  const gateOpen = at("hitl") && decision === "auto";

  // which proposal is on the table right now
  const slots = past("verify") ? ROUND_2 : ROUND_1;
  const report = useMemo(() => evaluateSet(slots, ARC), [slots]);
  const r1 = useMemo(() => evaluateSet(ROUND_1, ARC), []);

  const n = slots.length;
  const slotPos = (i: number) => i / (n - 1);

  // candidate pool dots — deterministic scatter around the arc band
  const dots = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const pos = jitter(i, 1);
        const t = targetAt(ARC, pos);
        const off = (jitter(i, 2) - 0.5) * 7;
        return {
          // 2-decimal rounding keeps SSR and client markup identical
          cx: Math.round(x(pos) * 100) / 100,
          cy: Math.round(yLufs(Math.max(-18, Math.min(-8, t.lufs + off))) * 100) / 100,
          kept: i % 4 === 0,
        };
      }),
    []
  );

  const arcPath = ARC.map(
    (p, i) => `${i ? "L" : "M"}${x(p.position)},${yLufs(p.lufs)}`
  ).join(" ");
  const arcArea = `${arcPath} L${x(1)},${H - PB} L${x(0)},${H - PB} Z`;
  const setPath = slots
    .map((s, i) => `${i ? "L" : "M"}${x(slotPos(i))},${yLufs(s.lufs)}`)
    .join(" ");

  const meters = [
    { k: "harmonic", v: `${Math.round(report.harmonic * 100)}%`, th: "≥ 70%", ok: report.harmonic >= TH.minHarmonicCompat },
    { k: "max bpm jump", v: report.maxJump.toFixed(1), th: "≤ 6.0", ok: report.maxJump <= TH.maxBpmJump },
    { k: "arc rmse", v: report.rmse.toFixed(1), th: "≤ 4.0 lufs", ok: report.rmse <= TH.maxArcRmseLufs },
    { k: "artist repeats", v: "0", th: "= 0", ok: true },
  ];

  return (
    <ConsoleShell
      title={title ?? "The booth, thinking"}
      ariaLabel="Animated playback of one set-generation run"
      phases={PHASES}
      playback={playback}
      legend={
        <>
          <span className="text-(--accent)">violet</span> = the model imagining
          · <span className="border border-(--accent) px-1">outline</span> =
          the model has no say — code or a human decides ·{" "}
          <span className="text-(--accent)">pulse</span> = the set, playing
        </>
      }
      footnote={
        <>
          The rules here are real and running: the Camelot legality test, the
          four thresholds, the arc interpolation and RMSE math execute on this
          page exactly as coded in the repo. The brief&apos;s “sunset” selects
          the downtempo genre profile — its jump and harmonic gates equal the
          open defaults shown; a hip-hop or house brief would swap in different
          ones. The set itself is representative, built to exercise those
          rules.
        </>
      }
    >
      {/* the brief — the run's only input */}
      <div className="border-b border-line px-4 py-3 font-mono text-mono-sm md:px-5" style={fade(past("brief"))}>
        <span className="text-dim">brief </span>
        <span className="text-bone">
          “two hours, rooftop, sunset into night — start mellow, peak late,
          land soft”
        </span>
        <span className="text-dim">
          {" "}
          → “sunset” · downtempo profile → architect
        </span>
      </div>

      {/* the arc canvas */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          aria-hidden
        >
          <defs>
            <linearGradient id="sc-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <filter id="sc-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* lufs gridlines */}
          {[-8, -12, -16].map((l) => (
            <g key={l}>
              <line
                x1={PL}
                x2={W - PR}
                y1={yLufs(l)}
                y2={yLufs(l)}
                stroke="var(--color-line)"
                strokeDasharray="2 6"
              />
              <text
                x={PL - 8}
                y={yLufs(l) + 3}
                textAnchor="end"
                fill="var(--color-dim)"
                fontSize="9"
                fontFamily="var(--font-mono)"
              >
                {l}
              </text>
            </g>
          ))}
          <text
            x={PL - 8}
            y={PT - 4}
            textAnchor="end"
            fill="var(--color-dim)"
            fontSize="9"
            fontFamily="var(--font-mono)"
          >
            LUFS
          </text>

          {/* candidate pool — dims to the chosen few */}
          <g style={fade(past("pool"))}>
            {dots.map((d, i) => (
              <circle
                key={i}
                cx={d.cx}
                cy={d.cy}
                r={2}
                fill="var(--accent)"
                style={{
                  opacity: past("propose") ? (d.kept ? 0.5 : 0.08) : 0.45,
                  transition: "opacity 900ms var(--ease-cine)",
                }}
              />
            ))}
          </g>

          {/* the target arc — the architect's one artifact */}
          <g style={fade(past("arc"), 900)} className={onAir ? "sc-breathe" : undefined}>
            <path d={arcArea} fill="url(#sc-area)" />
            <path
              d={arcPath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              filter="url(#sc-glow)"
            />
            {ARC.map((p, i) => (
              <g key={i}>
                <circle
                  cx={x(p.position)}
                  cy={yLufs(p.lufs)}
                  r="3.5"
                  fill="var(--color-void)"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                />
                <text
                  x={x(p.position)}
                  y={yLufs(p.lufs) - 9}
                  textAnchor="middle"
                  fill="var(--color-ash)"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                >
                  {p.bpm}·{p.lufs}
                </text>
              </g>
            ))}
          </g>

          {/* the proposed set's actual energy vs the target */}
          <path
            d={setPath}
            fill="none"
            stroke="var(--color-bone)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            opacity="0.85"
            style={{
              ...fade(past("propose"), 900),
              transition: "opacity 900ms var(--ease-cine), d 900ms var(--ease-cine)",
            }}
          />

          {/* render playhead sweep */}
          {at("render") && !reduced && !declined && (
            <rect
              x={PL}
              y={PT}
              width={W - PL - PR}
              height={H - PT - PB}
              fill="var(--accent)"
              opacity="0.07"
              className="sc-sweep"
            />
          )}

          {/* on air — the needle drifting through the set, forever */}
          {onAir && !reduced && (
            <line
              x1={PL}
              y1={PT}
              x2={PL}
              y2={H - PB}
              stroke="var(--accent)"
              strokeWidth="1.5"
              opacity="0.75"
              filter="url(#sc-glow)"
              className="sc-playhead"
            />
          )}

          {/* x axis — set position */}
          <text x={PL} y={H - 8} fill="var(--color-dim)" fontSize="9" fontFamily="var(--font-mono)">
            0:00
          </text>
          <text x={W - PR} y={H - 8} textAnchor="end" fill="var(--color-dim)" fontSize="9" fontFamily="var(--font-mono)">
            2:00:00
          </text>
        </svg>

        {/* curve legend */}
        <div
          className="pointer-events-none absolute top-2 right-3 font-mono text-[0.6rem] tracking-[0.12em] text-dim uppercase"
          style={fade(past("propose"))}
        >
          <span className="text-(--accent)">──</span> target arc ·{" "}
          <span className="text-bone">- -</span> proposed set
        </div>

        {/* on air badge — the set is playing now */}
        <div
          className="pointer-events-none absolute top-2 left-3 flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.18em] uppercase"
          style={fade(onAir)}
        >
          <span className="relative flex h-2 w-2" aria-hidden>
            {onAir && !reduced && (
              <span className="sc-ping absolute inline-flex h-full w-full rounded-full bg-(--accent) opacity-60" />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-(--accent)" />
          </span>
          <span className="text-(--accent)">on air</span>
          {onAir && !reduced && (
            <span className="flex h-[12px] items-end gap-[2px]" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="sc-eq h-full w-[3px] bg-(--accent)"
                  style={{
                    animationDelay: `${i * 0.17}s`,
                    animationDuration: `${0.9 + (i % 3) * 0.27}s`,
                  }}
                />
              ))}
            </span>
          )}
        </div>
      </div>

      {/* slot lane — sections, keys, the splices between them */}
      <div className="border-t border-line px-4 pt-3 pb-4 md:px-5" style={fade(past("propose"))}>
        <div className="flex items-stretch">
          {slots.map((s, i) => (
            <div key={i} className="relative min-w-0 flex-1">
              <div
                className={`mx-[1.5px] border px-1 py-1.5 text-center font-mono transition-all duration-700 ease-(--ease-cine) ${
                  at("revise") && SWAPPED.has(i)
                    ? "border-(--accent) bg-(--accent)/10"
                    : "border-line bg-void/40"
                }`}
                style={{
                  transitionDelay: !past("critic") ? `${i * 90}ms` : "0ms",
                  opacity: past("propose") ? 1 : 0,
                  transform: past("propose") ? "none" : "translateY(6px)",
                  // one nod per bar, at this slot's own tempo
                  animation:
                    onAir && !reduced
                      ? `sc-beat ${(240 / s.bpm).toFixed(3)}s ease-in-out ${(i * 0.13).toFixed(2)}s infinite`
                      : undefined,
                }}
              >
                <p className="text-[0.62rem] leading-tight text-bone">
                  {s.camelot}
                </p>
                <p className="text-[0.55rem] leading-tight text-dim">
                  {Math.round(s.bpm)}
                </p>
                <p className="hidden truncate text-[0.55rem] leading-tight text-dim/80 sm:block">
                  {s.section}
                </p>
              </div>
              {/* the splice marker — legal vs clashing key move */}
              {i < n - 1 && (
                <span
                  aria-hidden
                  className={`absolute top-1/2 -right-[4.5px] z-10 block h-[7px] w-[7px] -translate-y-1/2 rotate-45 ${
                    onAir && !reduced ? "sc-splice-live" : ""
                  }`}
                  style={{
                    background: report.rough.includes(i)
                      ? "var(--color-ember)"
                      : "var(--accent)",
                    opacity: past("propose") ? 1 : 0,
                    transition: "background 700ms, opacity 700ms",
                    animationDelay: `${(i * 0.13).toFixed(2)}s`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 font-mono text-[0.6rem] tracking-[0.12em] text-dim uppercase">
          12 slots — each is a <span className="text-ash">section</span> of a
          track, not the whole file · ◆ splice:{" "}
          <span className="text-(--accent)">legal key move</span> ·{" "}
          <span className="text-ember">clash</span>
        </p>
      </div>

      {/* critic + hitl — the outlined panels: the model has no say here */}
      <div className="grid border-t border-line md:grid-cols-2">
        <div
          className="border-b border-line p-4 md:border-r md:border-b-0 md:p-5"
          style={fade(past("critic"))}
        >
          <div className="border border-(--accent) p-3">
            <p className="mb-2 flex items-baseline justify-between font-mono text-label tracking-[0.2em] uppercase">
              <span className="text-(--accent)">critic — downtempo profile</span>
              <span className={past("verify") ? "text-(--accent)" : "text-ember"}>
                {past("verify") ? "pass" : at("critic") || at("revise") ? "fail" : ""}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-mono-sm">
              {meters.map((m) => (
                <div key={m.k} className="flex items-baseline justify-between gap-2 border-b border-line/60 pb-1">
                  <span className="text-[0.62rem] tracking-[0.1em] text-dim uppercase">
                    {m.k}
                  </span>
                  <span className={m.ok ? "text-bone" : "text-ember"}>
                    {m.v}{" "}
                    <span className="text-[0.6rem] text-dim">{m.th}</span>
                  </span>
                </div>
              ))}
            </div>
            {/* the note — exactly what the selector is re-prompted with */}
            <p className="mt-3 min-h-[1.2rem] font-mono text-[0.7rem] text-ash">
              {past("verify") ? (
                <>all four thresholds met — plan goes to the human</>
              ) : past("critic") ? (
                <>
                  <span className="text-ember">
                    “energy-arc RMSE {r1.rmse.toFixed(1)} LUFS &gt; 4.0”
                  </span>{" "}
                  → appended to the selector&apos;s messages
                  {at("revise") && (
                    <span className="text-dim"> · revision 1 of max 3</span>
                  )}
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="p-4 md:p-5" style={fade(past("hitl"))}>
          <div className="flex h-full flex-col border border-(--accent) p-3">
            <p className="mb-2 flex items-baseline justify-between font-mono text-label tracking-[0.2em] uppercase">
              <span className="text-(--accent)">approval — human</span>
              <span className="text-dim normal-case tracking-normal">
                {playback.paused && decision === "auto"
                  ? "holding — your call"
                  : gateOpen
                    ? "answer, or it answers for you"
                    : ""}
              </span>
            </p>
            <p className="font-mono text-mono-sm text-bone">
              Approve this set for rendering? [y/N]{" "}
              {declined ? (
                <span className="text-ash">n</span>
              ) : (
                <span
                  style={fade(decision === "yes" || past("render"))}
                  className="text-(--accent)"
                >
                  y
                </span>
              )}
            </p>
            {/* the gate is live — these do exactly what the agent does */}
            <div className="mt-2.5 flex gap-2 font-mono text-[0.68rem]">
              <button
                type="button"
                disabled={!gateOpen}
                onClick={() => {
                  setDecision("yes");
                  resume(HITL_IDX + 1);
                }}
                className="border border-(--accent) px-2.5 py-1 text-(--accent) transition-all duration-300 enabled:hover:bg-(--accent)/10 disabled:cursor-default disabled:opacity-30"
              >
                y — render it
              </button>
              <button
                type="button"
                disabled={!gateOpen}
                onClick={() => {
                  setDecision("no");
                  pause();
                }}
                className="border border-line-loud px-2.5 py-1 text-ash transition-all duration-300 enabled:hover:border-bone/40 enabled:hover:text-bone disabled:cursor-default disabled:opacity-30"
              >
                n — stop here
              </button>
            </div>
            {declined ? (
              <div className="mt-auto pt-3 font-mono text-[0.7rem] leading-relaxed">
                <p className="text-bone">
                  Not approved — stopping before export/render.
                </p>
                <p className="mt-1 text-dim">
                  [persist] logged this set anyway, approved=false — every
                  rejection is a set-acceptance record · ↺ replay to spin
                  again
                </p>
              </div>
            ) : (
              <p
                className="mt-auto pt-3 font-mono text-[0.7rem] text-dim"
                style={fade(past("render"))}
              >
                xml, m3u8 and set sheet are written on the yes — only the
                render costs compute: stretch dst÷src, equal-power crossfade,
                bass swapped at 180 Hz, overlap = half the outgoing section,
                quantized to a power-of-two bar count → one .wav
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sc-sweep-x {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .sc-sweep {
          animation: sc-sweep-x 4.5s var(--ease-cine) 1;
          transform-box: fill-box;
        }
        @keyframes sc-playhead-x {
          from { transform: translateX(0); }
          to { transform: translateX(${W - PL - PR}px); }
        }
        .sc-playhead { animation: sc-playhead-x 22s linear infinite; }
        @keyframes sc-breathe-o {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .sc-breathe { animation: sc-breathe-o 1.9s ease-in-out infinite; }
        @keyframes sc-beat {
          0%, 35%, 100% { translate: 0 0; filter: brightness(1); }
          12% { translate: 0 -2px; filter: brightness(1.45); }
        }
        @keyframes sc-splice-p {
          0%, 100% { scale: 1; opacity: 1; }
          50% { scale: 1.45; opacity: 0.55; }
        }
        .sc-splice-live { animation: sc-splice-p 1.9s ease-in-out infinite; }
        @keyframes sc-eq-y {
          0%, 100% { scale: 1 0.2; }
          50% { scale: 1 1; }
        }
        .sc-eq {
          transform-origin: bottom;
          animation: sc-eq-y 1s ease-in-out infinite;
        }
        @keyframes sc-ping-k {
          0% { scale: 1; opacity: 0.6; }
          80%, 100% { scale: 2.4; opacity: 0; }
        }
        .sc-ping { animation: sc-ping-k 1.6s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sc-sweep, .sc-playhead, .sc-breathe, .sc-splice-live, .sc-eq, .sc-ping {
            animation: none;
          }
        }
      `}</style>
    </ConsoleShell>
  );
}
