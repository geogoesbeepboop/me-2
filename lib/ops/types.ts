/**
 * THE FLEET — shared types for the ops layer.
 * Everything in these shapes is measured, never invented: session facts
 * come from Claude Code transcripts on disk (~/.claude/projects), git
 * facts from the source repos that content frontmatter `repo:` points at.
 * No Node imports here so client components can type against it.
 */

export type SessionState = "running" | "waiting" | "blocked" | "parked";

/** fleet-level state adds "dark" — no transcript activity at all */
export type AgentState = SessionState | "dark";

/** what the agent itself did in a session — counted straight off the
 *  transcript's tool calls, not from git. All numbers, snapshot-safe.
 *  The three labor lanes the board shows: BUILD = edits, OPERATE =
 *  operateRuns, VERIFY = testRuns. */
export interface SessionWork {
  /** total tool_use blocks in assistant turns */
  toolCalls: number;
  /** Edit / Write / NotebookEdit calls — the BUILD lane */
  edits: number;
  /** distinct files named by those edit calls */
  filesTouched: number;
  /** Bash commands run */
  commands: number;
  /** Read / Grep / Glob calls */
  reads: number;
  /** commands matching test/check patterns — the VERIFY lane (inferred) */
  testRuns: number;
  /** invocations of the agent's OWN entrypoints — the OPERATE lane. These
   *  are runs of the agent's job, counted from the transcript, never
   *  persisted-output counts. */
  operateRuns: number;
  /** those runs broken out by operation unit, e.g. { "set": 3, "ingest": 1 } */
  operateUnits?: Record<string, number>;
  /** minutes with the transcript moving (gaps capped at 5m) — inferred */
  activeMinutes: number;
}

export interface OpsSession {
  id: string;
  /** custom title ?? ai title ?? agent name ?? trimmed first prompt */
  title: string;
  /** where the title came from — prompt-derived titles never enter the
   *  committed record (they may quote the operator verbatim) */
  titleSource: "custom" | "ai" | "agent" | "prompt" | "none";
  agentName?: string;
  /** leaf name when the session ran in a .claude-worktrees checkout */
  worktree?: string;
  branch?: string;
  startedAt: string;
  lastActiveAt: string;
  state: SessionState;
  /** one human line explaining how the state was inferred */
  stateDetail: string;
  /** transcript event count (lines in the session file) */
  events: number;
  /** subagent transcripts dispatched by this session */
  subagents: number;
  /** the agent's own labor, measured from the transcript — absent on
   *  records cut before work mining existed (absent ≠ zero) */
  work?: SessionWork;
  /** most-edited file basenames — live mode only, never snapshotted */
  topFiles?: string[];
  prUrl?: string;
  prNumber?: number;
  /** the most recent ask, verbatim — live mode only, never snapshotted */
  lastPrompt?: string;
  /** hook command that stopped the turn, when state === "blocked" */
  blockedBy?: string;
}

export interface OpsCommit {
  hash: string;
  shortHash: string;
  subject: string;
  at: string;
  files: number;
  ins: number;
  del: number;
  /** ref decorations when git knows them (branch tips, HEAD) */
  refs?: string;
}

export interface SteeringNote {
  id: string;
  at: string;
  body: string;
}

/** a real headline fact about an agent, sourced from its repo (lib/ops/profiles) */
export interface AgentMetric {
  k: string;
  v: string;
  gate?: boolean;
  money?: boolean;
  absent?: string;
}

export interface AgentOps {
  slug: string;
  title: string;
  accent: string;
  domain?: string;
  href: string;
  /** one plain line: what the agent does for its user */
  mandate?: string;
  /** real headline facts for the stat row (max 4) */
  metrics?: AgentMetric[];
  /** the agent leaves no run output on disk — operate counts are invocations */
  outputUnpersisted?: boolean;
  /** no commits in the repo — BUILD reads from transcript edits, not git */
  noGitHistory?: boolean;
  /** absolute path of the source repo — live mode only; stripped from
   *  the committed record like every other path */
  repoPath?: string;
  branch?: string;
  detached?: boolean;
  /** uncommitted change count (`git status --porcelain` lines) */
  dirty: number;
  state: AgentState;
  stateDetail: string;
  lastActiveAt?: string;
  sessions: OpsSession[];
  commits: OpsCommit[];
  /** pending steering notes — live mode only */
  steering?: SteeringNote[];
  /** this agent's latest nightly gate/eval run, when one exists */
  nightly?: NightlyRun;
}

/** ── the nightly gate digest — the system's own heartbeat ──────
 * Every morning a LaunchAgent runs each focus repo's .claude/gate.sh
 * (lint + hermetic tests) and .claude/evals.sh (offline eval suites)
 * and writes a dated digest to ~/dev/docs/gate-digests. The fleet
 * parses those files — the site never runs a gate itself, it reads
 * the record the night left behind. */
export interface NightlyRun {
  /** repo basename as the digest names it, e.g. "jim-agent" */
  repo: string;
  /** fleet slug when the repo maps to an agent on the board */
  slug?: string;
  gate: "pass" | "fail" | "missing";
  /** passing but over the digest's runtime budget — spelled out in plain
   *  ink ("slow"), never a hue; only failure carries ember */
  slow?: boolean;
  gateSeconds?: number;
  /** absent = the repo has no evals.sh (absent ≠ pass) */
  evals?: "pass" | "regression";
  evalSeconds?: number;
  /** tail of the failure log — live mode only, never recorded */
  tail?: string;
  /** when the run happened — set where a run travels without its digest
   *  (an agent's `nightly`); inside a NightlyDigest the digest holds it */
  at?: string;
}

export interface NightlyDigest {
  /** when the digest was written, from its own header */
  at: string;
  runs: NightlyRun[];
}

export interface FleetSnapshot {
  /** live = measured on this machine now · recorded = committed snapshot */
  mode: "live" | "recorded";
  generatedAt: string;
  windowHours: number;
  agents: AgentOps[];
  /** recent nightly gate digests, newest first */
  gateDigests?: NightlyDigest[];
}

/** ───── state doctrine (rendered as the visible legend) ─────
 * running → lab green, filled   — the transcript is moving now
 * waiting → outline (row accent; neutral ink in the legend)
 *                               — the model has no say; a human decides next
 * blocked → ember, filled       — a gate or hook stopped the turn
 * parked  → dim, filled         — no activity for a day or more
 * dark    → dim, hollow         — no sessions on record
 * One phrase per state, used verbatim on every surface.
 */
export const STATE_WORDS: Record<AgentState, string> = {
  running: "working",
  waiting: "a human decides next",
  blocked: "blocked",
  parked: "asleep",
  dark: "dark",
};
