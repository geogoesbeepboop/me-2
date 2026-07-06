"use client";

/**
 * V2 SHARED CHROME — the vocabulary both faces of the ops layer speak.
 * Hooks (city clock, fleet polling), the top-bar widgets, the work
 * phrasing helpers, and THE SHIFT LOG — one expandable timeline used by
 * the landing (short) and the ops room (deep, filterable).
 *
 * Everything rendered here is measured. The two inferences in play —
 * session states and active time — are labeled as such where they appear.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { SceneName } from "@/components/city/SfScene";
import { dayStamp, sceneFor, sfClock, sfHour, sfStamp } from "@/lib/ops/time";
import {
  STATE_WORDS,
  type AgentOps,
  type FleetSnapshot,
  type NightlyDigest,
  type NightlyRun,
  type OpsCommit,
  type OpsSession,
} from "@/lib/ops/types";

/* ── hooks ───────────────────────────────────────────────── */

export function useCityTime(initialScene: SceneName) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return {
    clock: now ? sfClock(now) : "--:--:--",
    liveScene: now ? sceneFor(sfHour(now)) : initialScene,
  };
}

/** poll the live machine; the recorded site never polls — the record
 *  only changes when the next report is filed (a new deploy) */
export function useFleet(initial: FleetSnapshot) {
  const [fleet, setFleet] = useState(initial);
  const [windowHours, setWindowHours] = useState(initial.windowHours);
  const live = initial.mode === "live";
  const inflight = useRef(false);

  const refresh = useCallback(
    async (h: number) => {
      if (!live || inflight.current) return;
      inflight.current = true;
      try {
        const res = await fetch(`/api/ops?window=${h}`, { cache: "no-store" });
        if (res.ok) setFleet(await res.json());
      } catch {
        /* a missed beat is fine — the next one will land */
      } finally {
        inflight.current = false;
      }
    },
    [live]
  );

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void refresh(windowHours);
    }, 8000);
    return () => clearInterval(t);
  }, [live, windowHours, refresh]);

  const pick = (h: number) => {
    setWindowHours(h);
    void refresh(h);
  };

  return { fleet, windowHours, pick, live };
}

/* ── top-bar widgets ─────────────────────────────────────── */

/** which record you're reading, and when it was cut — lives at the fleet
 *  board's foot (never in the bar; the bar stays one instrument row) */
export function FeedChip({ fleet }: { fleet: FleetSnapshot }) {
  const live = fleet.mode === "live";
  const empty = fleet.agents.length === 0;
  return (
    <span className="v2-feed" data-live={live}>
      {live
        ? "live — this machine"
        : empty
          ? "no record yet"
          : `report filed ${sfStamp(fleet.generatedAt)}`}
    </span>
  );
}

/** one slim line, placed at a panel's foot — never in its header */
export function Legend() {
  return (
    <span className="v2-legend" aria-label="State legend">
      <span><i className="v2-dot" data-state="running" /> working</span>
      <span><i className="v2-dot" data-state="waiting" /> a human decides next</span>
      <span><i className="v2-dot" data-state="blocked" /> blocked</span>
      <span><i className="v2-dot" data-state="parked" /> asleep</span>
      <span><i className="v2-dot" data-state="dark" /> dark</span>
    </span>
  );
}

export const WINDOWS = [
  { h: 12, label: "overnight" },
  { h: 24, label: "24h" },
  { h: 72, label: "3 days" },
  { h: 168, label: "7 days" },
] as const;

export function WindowPicker({
  windowHours,
  pick,
  live,
}: {
  windowHours: number;
  pick: (h: number) => void;
  live: boolean;
}) {
  return (
    <span className="v2-window" role="group" aria-label="Time window">
      {WINDOWS.map((w) => (
        <button
          key={w.h}
          aria-pressed={windowHours === w.h}
          onClick={() => pick(w.h)}
          disabled={!live}
          title={live ? undefined : "the filed report was cut at one window — live windows need the machine"}
        >
          {w.label}
        </button>
      ))}
    </span>
  );
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="v2-copy"
      data-done={done}
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard denied — nothing to do */
        }
      }}
    >
      {done ? "copied" : label}
    </button>
  );
}

/* ── work phrasing — numbers into words, zeros omitted ───── */

export function fmtActive(min: number): string {
  if (min < 1) return "under a minute";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `≈${h}h ${String(m).padStart(2, "0")}m` : `≈${m}m`;
}

function n(count: number, one: string, many?: string): string {
  return `${count} ${count === 1 ? one : (many ?? `${one}s`)}`;
}

/** the facts of a session's labor, biggest first, zeros dropped */
export function workParts(s: OpsSession): string[] {
  const w = s.work;
  if (!w) return [];
  const parts: string[] = [];
  if (w.filesTouched > 0) parts.push(n(w.filesTouched, "file"));
  if (w.commands > 0) parts.push(n(w.commands, "command"));
  if (w.testRuns > 0) parts.push(n(w.testRuns, "test/check run"));
  if (s.subagents > 0) parts.push(n(s.subagents, "subagent"));
  if (parts.length === 0 && w.reads > 0) parts.push(n(w.reads, "read"));
  return parts;
}

/** one scan line for what a session did — never the prompt */
export function sessionLine(s: OpsSession): string {
  // a record cut before work mining existed has no numbers — absent ≠ zero
  if (!s.work) return "session on record — work not measured for this record";
  const parts = workParts(s).slice(0, 3);
  const time = s.work.activeMinutes >= 1 ? fmtActive(s.work.activeMinutes) : null;
  if (s.state === "running") {
    return parts.length > 0 ? `working now — ${parts.join(", ")} so far` : "working now";
  }
  if (parts.length === 0) return "a brief exchange — nothing edited";
  return time ? `worked ${time} — ${parts.join(", ")}` : `worked — ${parts.join(", ")}`;
}

/** assigned names only — prompt-derived titles stay off the scan layer */
export function sessionName(s: OpsSession): string | null {
  return s.titleSource === "custom" || s.titleSource === "ai" || s.titleSource === "agent"
    ? s.title
    : null;
}

export interface WindowWork {
  sessions: number;
  activeMinutes: number;
  edits: number;
  commands: number;
  testRuns: number;
  /** the agent's own runs (invocations of its entrypoints) */
  operateRuns: number;
  /** those runs by unit, merged across the window's sessions */
  operateUnits: Record<string, number>;
  commits: number;
  ins: number;
  del: number;
}

/** an agent's output inside the window — sessions + commits combined.
 *  "now" is the snapshot's own stamp so server and client agree. */
export function windowWork(a: AgentOps, windowHours: number, generatedAt: string): WindowWork {
  const cut = (Date.parse(generatedAt) || 0) - windowHours * 3600_000;
  const ss = a.sessions.filter((s) => (Date.parse(s.lastActiveAt) || 0) >= cut);
  const units: Record<string, number> = {};
  for (const s of ss) {
    for (const [u, c] of Object.entries(s.work?.operateUnits ?? {})) {
      units[u] = (units[u] ?? 0) + c;
    }
  }
  return {
    sessions: ss.length,
    activeMinutes: ss.reduce((t, s) => t + (s.work?.activeMinutes ?? 0), 0),
    edits: ss.reduce((t, s) => t + (s.work?.edits ?? 0), 0),
    commands: ss.reduce((t, s) => t + (s.work?.commands ?? 0), 0),
    testRuns: ss.reduce((t, s) => t + (s.work?.testRuns ?? 0), 0),
    operateRuns: ss.reduce((t, s) => t + (s.work?.operateRuns ?? 0), 0),
    operateUnits: units,
    commits: a.commits.length,
    ins: a.commits.reduce((t, c) => t + c.ins, 0),
    del: a.commits.reduce((t, c) => t + c.del, 0),
  };
}

/** the whole record for one agent — the fleet card is a dossier, not a
 *  24h slice, so an agent idle for days still shows what it has done */
export function agentWork(a: AgentOps): WindowWork {
  return windowWork(a, Number.POSITIVE_INFINITY, "1970-01-01T00:00:00.000Z");
}

/** "23 ingests · 4 judges · 2 sets" — the operate runs, biggest unit first.
 *  These are INVOCATIONS, never persisted-output counts. */
export function operateSummary(units: Record<string, number>, max = 3): string {
  const parts = Object.entries(units)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([u, c]) => n(c, u));
  return parts.join(" · ");
}

/** the landing's one fleet line — operate-forward, then the build/verify
 *  totals; a quiet window says so honestly */
export function windowWorkLine(w: WindowWork): string {
  if (w.sessions === 0 && w.operateRuns === 0) return "no measured work in this window";
  const parts: string[] = [];
  if (w.operateRuns > 0) parts.push(operateSummary(w.operateUnits, 2));
  if (w.edits > 0) parts.push(`${n(w.edits, "edit")} building`);
  else if (w.sessions > 0) parts.push(n(w.sessions, "session"));
  if (w.testRuns > 0) parts.push(n(w.testRuns, "check"));
  return parts.length > 0 ? parts.join(" · ") : "a quiet window — nothing measured";
}

/* ── the labor strip — BUILD / OPERATE / VERIFY as three lanes ───
   The spine of the redesign: build (neutral) is dev work TO the agent,
   operate (accent) is the agent running its OWN job, verify (cyan) is
   it checking itself. Bars scale to the card's own busiest lane so a
   quiet agent isn't a row of slivers; the count carries exact truth. */

export interface Lanes {
  build: number;
  operate: number;
  verify: number;
  operateUnits: Record<string, number>;
}

export function laneData(w: WindowWork): Lanes {
  return {
    build: w.edits,
    operate: w.operateRuns,
    verify: w.testRuns,
    operateUnits: w.operateUnits,
  };
}

export function LaborStrip({ lanes }: { lanes: Lanes }) {
  // sqrt scaling: edits always dwarf runs, so a linear bar would bury the
  // operate lane — sqrt keeps the low-frequency agent-labor lane visible
  // while build still reads longest. The count carries the exact truth.
  const max = Math.sqrt(Math.max(lanes.build, lanes.operate, lanes.verify, 1));
  const pct = (v: number) => (v === 0 ? 0 : Math.max(8, Math.round((Math.sqrt(v) / max) * 100)));
  const rows: { key: string; label: string; v: number; count: string }[] = [
    { key: "build", label: "BUILD", v: lanes.build, count: lanes.build > 0 ? n(lanes.build, "edit") : "—" },
    {
      key: "operate",
      label: "OPERATE",
      v: lanes.operate,
      count:
        lanes.operate > 0
          ? operateSummary(lanes.operateUnits, 2) || n(lanes.operate, "run")
          : "—",
    },
    { key: "verify", label: "VERIFY", v: lanes.verify, count: lanes.verify > 0 ? n(lanes.verify, "check") : "—" },
  ];
  return (
    <div className="v2-lanes" aria-label="Build, operate and verify work">
      {rows.map((r) => (
        <div key={r.key} className="v2-lane" data-lane={r.key} data-empty={r.v === 0}>
          <span className="v2-lane-label">{r.label}</span>
          <span className="v2-lane-track">
            <span className="v2-lane-fill" style={{ width: `${pct(r.v)}%` }} />
          </span>
          <span className="v2-lane-count">{r.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ── the status ribbon — answer "what needs me?" in one second ──── */

const STATE_ORDER: AgentOps["state"][] = ["blocked", "waiting", "running", "parked", "dark"];

/** count of agents in each state, in doctrine order */
export function fleetTally(fleet: FleetSnapshot): { state: AgentOps["state"]; count: number }[] {
  return STATE_ORDER.map((state) => ({
    state,
    count: fleet.agents.filter((a) => a.state === state).length,
  }));
}

/** agents sorted so the ones that need attention lead */
export function sortByAttention(agents: AgentOps[]): AgentOps[] {
  const rank = (s: AgentOps["state"]) => STATE_ORDER.indexOf(s);
  return [...agents].sort((a, b) => rank(a.state) - rank(b.state));
}

/** the agent that has done the most measured labor on record — or null */
export function busiest(fleet: FleetSnapshot): { title: string; accent: string } | null {
  let best: { title: string; accent: string; score: number } | null = null;
  for (const a of fleet.agents) {
    const w = agentWork(a);
    const score = w.edits + w.operateRuns + w.testRuns;
    if (score > 0 && (!best || score > best.score)) {
      best = { title: a.title, accent: a.accent, score };
    }
  }
  return best ? { title: best.title, accent: best.accent } : null;
}

/* ── the shift log — one timeline, every kind of event ───── */

export interface WriteRow {
  at: string;
  /** frontmatter dates carry no clock — render the day, never invent a time */
  dateOnly?: boolean;
  accent: string;
  title: string;
  /** the kind of write — "post published", "entry rewritten"… */
  tag: string;
  href: string;
}

export interface ShiftEvent {
  id: string;
  at: string;
  dateOnly?: boolean;
  accent: string;
  agent: string;
  slug: string;
  kind: "commit" | "session" | "pr" | "entry" | "gate";
  /** which labor band a session leant into — drives the row glyph */
  band?: "operate" | "build" | "verify";
  line: string;
  commit?: OpsCommit;
  session?: OpsSession;
  repoPath?: string;
  entry?: WriteRow;
  prUrl?: string;
  prNumber?: number;
  digest?: NightlyDigest;
}

/** a session's dominant labor band — operate beats verify beats build */
function sessionBand(s: OpsSession): "operate" | "build" | "verify" {
  const w = s.work;
  if (!w) return "build";
  if (w.operateRuns > 0 && w.operateRuns >= w.edits && w.operateRuns >= w.testRuns) return "operate";
  if (w.testRuns > w.edits && w.testRuns >= w.operateRuns) return "verify";
  return "build";
}

/** did every gate and eval in a digest come back green? */
export function nightlyGreen(d: NightlyDigest): boolean {
  return d.runs.every((r) => r.gate === "pass" && r.evals !== "regression");
}

/** one closed-row line for a night's digest — failures lead, by name */
export function nightlyLine(d: NightlyDigest): string {
  const fails = d.runs.filter((r) => r.gate === "fail");
  const missing = d.runs.filter((r) => r.gate === "missing");
  const regressions = d.runs.filter((r) => r.evals === "regression");
  const evalCount = d.runs.filter((r) => r.evals).length;
  const parts: string[] = [];
  if (fails.length > 0) parts.push(`${fails.map((r) => r.repo).join(", ")} FAILED`);
  const green = d.runs.length - fails.length - missing.length;
  if (green > 0) parts.push(`${green} ${green === 1 ? "gate" : "gates"} green`);
  if (regressions.length > 0) parts.push(`eval regression — ${regressions.map((r) => r.repo).join(", ")}`);
  else if (evalCount > 0) parts.push("evals green");
  if (missing.length > 0) parts.push(`${missing.length} without a gate`);
  return `the night ran the gates — ${parts.join(" · ")}`;
}

/** the row glyph encodes the KIND (and a session's band) as a shape, so a
 *  column of rows reads as a column of marks, not a wall of words */
export function shiftGlyph(e: ShiftEvent): { mark: string; cls: string; title: string } {
  if (e.kind === "gate") {
    const green = e.digest ? nightlyGreen(e.digest) : true;
    return { mark: "☾", cls: green ? "g-verify" : "g-fail", title: "nightly gate digest" };
  }
  if (e.kind === "commit") return { mark: "▫", cls: "g-build", title: "commit" };
  if (e.kind === "pr") return { mark: "⇡", cls: "g-build", title: "pull request" };
  if (e.kind === "entry") return { mark: "✎", cls: "g-build", title: "archive write" };
  // session — shaped by the band it leant into
  if (e.band === "operate") return { mark: "▸", cls: "g-operate", title: "session — the agent ran its job" };
  if (e.band === "verify") return { mark: "✓", cls: "g-verify", title: "session — checks ran" };
  return { mark: "▫", cls: "g-build", title: "session — building" };
}

/** the closed-row line: a name or a neutral handle, never the prompt */
function sessionHandle(s: OpsSession): string {
  return sessionName(s) ?? `session ·${s.id.slice(0, 4)}`;
}

export function buildShiftLog(
  fleet: FleetSnapshot,
  writes: WriteRow[],
  /** epoch ms — events older than this stay out (honors a windowed header) */
  cutoffMs?: number
): ShiftEvent[] {
  const events: ShiftEvent[] = [];
  for (const a of fleet.agents) {
    for (const c of a.commits) {
      events.push({
        id: `c-${c.hash}`,
        at: c.at,
        accent: a.accent,
        agent: a.title,
        slug: a.slug,
        kind: "commit",
        line: c.subject,
        commit: c,
      });
    }
    for (const s of a.sessions) {
      events.push({
        id: `s-${s.id}`,
        at: s.lastActiveAt,
        accent: a.accent,
        agent: a.title,
        slug: a.slug,
        kind: "session",
        band: sessionBand(s),
        line: sessionHandle(s),
        session: s,
        repoPath: a.repoPath,
      });
      if (s.prUrl) {
        events.push({
          id: `p-${s.id}`,
          at: s.lastActiveAt,
          accent: a.accent,
          agent: a.title,
          slug: a.slug,
          kind: "pr",
          line: `pull request #${s.prNumber} opened`,
          prUrl: s.prUrl,
          prNumber: s.prNumber,
        });
      }
    }
  }
  for (const w of writes) {
    events.push({
      id: `e-${w.href}-${w.at}`,
      at: w.at,
      dateOnly: w.dateOnly,
      accent: w.accent,
      agent: "The Archive",
      slug: "the-archive",
      kind: "entry",
      line: w.title,
      entry: w,
    });
  }
  // the system's own heartbeat: one row per nightly gate digest — the
  // suites that ran against the whole fleet while nobody watched
  for (const d of fleet.gateDigests ?? []) {
    events.push({
      id: `g-${d.at}`,
      at: d.at,
      accent: "var(--color-cyan)",
      agent: "Night watch",
      slug: "night-watch",
      kind: "gate",
      line: nightlyLine(d),
      digest: d,
    });
  }
  return events
    .filter((e) => !Number.isNaN(Date.parse(e.at)))
    .filter((e) => cutoffMs === undefined || Date.parse(e.at) >= cutoffMs)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

/* ── detail views — what actually got done, per kind ─────── */

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <span className="v2-fact">
      <i>{label}</i>
      {value}
    </span>
  );
}

function PatchView({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <pre className="v2-patch">
      {lines.map((l, i) => {
        const cls = l.startsWith("+")
          ? "p-add"
          : l.startsWith("-")
            ? "p-del"
            : l.startsWith("@@") || l.startsWith("diff --git")
              ? "p-hunk"
              : undefined;
        return (
          <span key={i} className={cls}>
            {l}
            {"\n"}
          </span>
        );
      })}
    </pre>
  );
}

function CommitDetail({ e, live }: { e: ShiftEvent; live: boolean }) {
  const c = e.commit!;
  const [patch, setPatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scale = (x: number) => Math.max(2, Math.min(110, Math.round(Math.sqrt(x) * 4)));

  const readPatch = async () => {
    if (loading || patch !== null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ops/diff?slug=${encodeURIComponent(e.slug)}&hash=${c.hash}`);
      setPatch(res.ok ? await res.text() : `couldn't read the patch (${res.status})`);
    } catch {
      setPatch("couldn't read the patch — is the machine awake?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="v2-detail">
      <div className="v2-facts">
        <Fact label="hash" value={c.shortHash} />
        <Fact
          label="landed"
          value={<span suppressHydrationWarning>{sfStamp(c.at)}</span>}
        />
        <Fact label="touched" value={n(c.files, "file")} />
        <Fact
          label="lines"
          value={
            <span className="v2-commit-stat">
              <span className="v2-statbar" aria-hidden>
                <i className="ins" style={{ width: `${scale(c.ins)}px` }} />
                <i className="del" style={{ width: `${scale(c.del)}px` }} />
              </span>
              +{c.ins} −{c.del}
            </span>
          }
        />
        {c.refs && <Fact label="refs" value={c.refs} />}
      </div>
      {live ? (
        patch === null ? (
          <button className="v2-copy" onClick={readPatch}>
            {loading ? "reading…" : "read the patch"}
          </button>
        ) : (
          <PatchView text={patch} />
        )
      ) : (
        <p className="v2-detail-note">patches are readable on the operator&apos;s machine only</p>
      )}
    </div>
  );
}

function SessionDetail({ e, live }: { e: ShiftEvent; live: boolean }) {
  const s = e.session!;
  const name = sessionName(s);
  const w = s.work;
  return (
    <div className="v2-detail">
      <p className="v2-detail-title">
        <span className="v2-dot" data-state={s.state} aria-hidden /> {STATE_WORDS[s.state]} —{" "}
        {s.stateDetail}
      </p>
      <div className="v2-facts">
        {name && <Fact label="named" value={name} />}
        <Fact
          label="ran"
          value={
            <span suppressHydrationWarning>
              {sfStamp(s.startedAt)} → {sfStamp(s.lastActiveAt)}
            </span>
          }
        />
        {w && (
          <Fact label="active" value={`${fmtActive(w.activeMinutes)} (gaps over 5m don't count)`} />
        )}
        {w && w.operateRuns > 0 && (
          <Fact
            label="agent ran"
            value={operateSummary(w.operateUnits ?? {}, 5) || n(w.operateRuns, "run")}
          />
        )}
        {w && w.edits > 0 && <Fact label="edits (build)" value={w.edits} />}
        {w && w.filesTouched > 0 && <Fact label="files touched" value={w.filesTouched} />}
        {w && w.commands > 0 && <Fact label="commands" value={w.commands} />}
        {w && w.reads > 0 && <Fact label="reads" value={w.reads} />}
        {w && w.testRuns > 0 && <Fact label="test/check runs" value={w.testRuns} />}
        {s.subagents > 0 && <Fact label="subagents" value={s.subagents} />}
        {s.branch && <Fact label="branch" value={s.branch} />}
        {s.worktree && <Fact label="worktree" value={s.worktree.replace(/-[0-9a-f]{6}$/, "")} />}
        {s.prUrl && (
          <Fact
            label="pull request"
            value={
              <a href={s.prUrl} target="_blank" rel="noreferrer">
                #{s.prNumber}
              </a>
            }
          />
        )}
      </div>
      {!w && <p className="v2-detail-note">work not measured for this record — absent, not zero</p>}
      {live && s.topFiles && s.topFiles.length > 0 && (
        <p className="v2-detail-note">most edited: {s.topFiles.join(", ")}</p>
      )}
      {live && !name && s.lastPrompt && (
        <p className="v2-detail-note">operator&apos;s last ask (this machine only): «{s.lastPrompt}»</p>
      )}
      {live && e.repoPath && (
        <CopyButton text={`cd ${e.repoPath} && claude --resume ${s.id}`} label="copy resume command" />
      )}
    </div>
  );
}

function EntryDetail({ e }: { e: ShiftEvent }) {
  const w = e.entry!;
  return (
    <div className="v2-detail">
      <div className="v2-facts">
        <Fact label="kind" value={w.tag} />
        <Fact label="dated" value={<span suppressHydrationWarning>{dayStamp(w.at)}</span>} />
      </div>
      <Link className="v2-copy" href={w.href}>
        read the entry →
      </Link>
    </div>
  );
}

function PrDetail({ e }: { e: ShiftEvent }) {
  return (
    <div className="v2-detail">
      <a className="v2-copy" href={e.prUrl} target="_blank" rel="noreferrer">
        open pull request #{e.prNumber} ↗
      </a>
    </div>
  );
}

/** one nightly run, spelled out — pass in plain ink, failure in ember */
function nightlyRunLine(r: NightlyRun): React.ReactNode {
  return (
    <>
      <b>{r.repo}</b>
      {" · gate "}
      {r.gate === "pass" ? (
        <>green{r.gateSeconds !== undefined && ` (${r.gateSeconds}s)`}</>
      ) : r.gate === "fail" ? (
        <em className="v2-gate-bad">failed{r.gateSeconds !== undefined && ` (${r.gateSeconds}s)`}</em>
      ) : (
        "not installed"
      )}
      {r.evals && (
        <>
          {" · evals "}
          {r.evals === "pass" ? (
            <>green{r.evalSeconds !== undefined && ` (${r.evalSeconds}s)`}</>
          ) : (
            <em className="v2-gate-bad">regression</em>
          )}
        </>
      )}
    </>
  );
}

function GateDetail({ e, live }: { e: ShiftEvent; live: boolean }) {
  const d = e.digest!;
  const tails = d.runs.filter((r) => r.tail);
  return (
    <div className="v2-detail">
      <div className="v2-facts">
        <Fact label="ran" value={<span suppressHydrationWarning>{sfStamp(d.at)}</span>} />
        <Fact label="repos" value={d.runs.length} />
      </div>
      <ul className="v2-gate-runs">
        {d.runs.map((r) => (
          <li key={r.repo}>{nightlyRunLine(r)}</li>
        ))}
      </ul>
      <p className="v2-detail-note">
        each repo&apos;s own .claude/gate.sh (lint + hermetic tests) and .claude/evals.sh (offline
        eval suites), run by the 6:17 LaunchAgent — the site reads the digest it writes
      </p>
      {live &&
        tails.map((r) => (
          <div key={r.repo} style={{ width: "100%" }}>
            <p className="v2-detail-note">{r.repo} — tail of the failure:</p>
            <PatchView text={r.tail!} />
          </div>
        ))}
      {!live && d.runs.some((r) => r.gate === "fail" || r.evals === "regression") && (
        <p className="v2-detail-note">failure logs are readable on the operator&apos;s machine only</p>
      )}
    </div>
  );
}

/* ── the rows ────────────────────────────────────────────── */

export function ShiftRow({
  e,
  live,
  open,
  onToggle,
}: {
  e: ShiftEvent;
  live: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const g = shiftGlyph(e);
  return (
    <div className="v2-shift" data-open={open} style={{ "--c": e.accent } as React.CSSProperties}>
      <button
        className="v2-shift-row"
        aria-expanded={open}
        aria-label={`${e.agent} — ${g.title}: ${e.line}`}
        onClick={onToggle}
      >
        <span className="v2-shift-time" suppressHydrationWarning>
          {e.dateOnly ? dayStamp(e.at) : sfStamp(e.at)}
        </span>
        <span className="v2-shift-agent">{e.agent}</span>
        <span className="v2-shift-line">
          <i className={`v2-shift-glyph ${g.cls}`} title={g.title} aria-hidden>
            {g.mark}
          </i>
          {e.line}
        </span>
        <span className="v2-shift-caret" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open &&
        (e.kind === "commit" ? (
          <CommitDetail e={e} live={live} />
        ) : e.kind === "session" ? (
          <SessionDetail e={e} live={live} />
        ) : e.kind === "entry" ? (
          <EntryDetail e={e} />
        ) : e.kind === "gate" ? (
          <GateDetail e={e} live={live} />
        ) : (
          <PrDetail e={e} />
        ))}
    </div>
  );
}

/** the timeline: newest first, every row opens in place. The newest row
 *  starts open so the detail layer is never a secret. */
export function ShiftLog({
  fleet,
  writes,
  live,
  cap,
  filterable = false,
  cutoffMs,
}: {
  fleet: FleetSnapshot;
  writes: WriteRow[];
  live: boolean;
  cap: number;
  filterable?: boolean;
  /** when the header claims a window, the rows honor it */
  cutoffMs?: number;
}) {
  const [muted, setMuted] = useState<Set<string>>(new Set());
  const [openIds, setOpenIds] = useState<Set<string> | null>(null);

  const events = useMemo(
    () => buildShiftLog(fleet, writes, cutoffMs),
    [fleet, writes, cutoffMs]
  );
  const shown = useMemo(
    () => events.filter((e) => !muted.has(e.slug)).slice(0, cap),
    [events, muted, cap]
  );

  /* auto-open the newest row until the reader takes over */
  const effectiveOpen = openIds ?? new Set(shown.length > 0 ? [shown[0].id] : []);
  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev ?? effectiveOpen);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAgent = (slug: string) => {
    setMuted((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <>
      {filterable && (
        <span className="v2-filter" role="group" aria-label="Mute agents">
          {fleet.agents.map((a) => (
            <button
              key={a.slug}
              aria-pressed={!muted.has(a.slug)}
              onClick={() => toggleAgent(a.slug)}
              style={{ "--c": a.accent } as React.CSSProperties}
            >
              {a.title}
            </button>
          ))}
        </span>
      )}
      <div className="v2-shiftlog">
        {shown.map((e) => (
          <ShiftRow
            key={e.id}
            e={e}
            live={live}
            open={effectiveOpen.has(e.id)}
            onToggle={() => toggle(e.id)}
          />
        ))}
        {shown.length === 0 && <p className="v2-detail-note">nothing in the log for this window</p>}
      </div>
    </>
  );
}
