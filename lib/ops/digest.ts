/**
 * THE SHIFT DIGEST — "what got done while you slept", honestly.
 *
 * Rolls the fleet up over the overnight shift (20:00 → 06:00 PT). When
 * the calendar night is quiet (this machine doesn't run agents around the
 * clock), it falls back to the most recent day that had activity and says
 * so — the label always states the real window. Commits, PRs and archive
 * writes are precisely timestamped; per-agent session labor is attributed
 * to the window its session was last active in (an approximation the label
 * discloses). No Node imports — the landing computes this client-side.
 */
import type { FleetSnapshot } from "./types";
import type { WriteRow } from "../../app/(v2)/v2/shared";

const SHIFT_START = 20; // 20:00 PT
const SHIFT_END = 6; //   06:00 PT

interface PtWall {
  y: number;
  mo: number; // 1-12
  da: number;
  h: number;
}

function ptWall(ms: number): PtWall {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  let h = get("hour");
  if (h === 24) h = 0; // some engines emit 24 for midnight
  return { y: get("year"), mo: get("month"), da: get("day"), h };
}

/** PT's UTC offset (minutes) at this instant — DST-aware */
function ptOffsetMin(ms: number): number {
  const name =
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date(ms))
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT-8";
  const m = name.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
  if (!m) return -480;
  const sign = m[1].startsWith("-") ? -1 : 1;
  return Number(m[1]) * 60 + sign * Number(m[2] ?? 0);
}

/** a PT wall-clock time → epoch ms (DST-aware via the reference offset) */
function ptEpoch(y: number, mo: number, da: number, h: number, refMs: number): number {
  const utc = Date.UTC(y, mo - 1, da, h, 0, 0); // Date.UTC normalizes overflow
  return utc - ptOffsetMin(refMs) * 60_000;
}

/** "23 ingests · 4 judges" — operate units, biggest first, plural-safe */
export function fmtUnits(units: Record<string, number>, max = 3): string {
  return Object.entries(units)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([u, c]) => `${c} ${c === 1 ? u : `${u}s`}`)
    .join(" · ");
}

export interface ShiftWindow {
  start: number;
  end: number;
  inProgress: boolean;
  label: string;
}

/** the overnight shift relative to a reference instant */
export function overnightWindow(refMs: number): ShiftWindow {
  const w = ptWall(refMs);
  if (w.h >= SHIFT_END && w.h < SHIFT_START) {
    // daytime — the shift that just ended this morning
    const end = ptEpoch(w.y, w.mo, w.da, SHIFT_END, refMs);
    const start = ptEpoch(w.y, w.mo, w.da - 1, SHIFT_START, refMs);
    return { start, end, inProgress: false, label: "last night" };
  }
  if (w.h >= SHIFT_START) {
    // evening — tonight's shift, just begun
    const start = ptEpoch(w.y, w.mo, w.da, SHIFT_START, refMs);
    return { start, end: refMs, inProgress: true, label: "tonight so far" };
  }
  // small hours — the shift in progress, started last evening
  const start = ptEpoch(w.y, w.mo, w.da - 1, SHIFT_START, refMs);
  return { start, end: refMs, inProgress: true, label: "overnight so far" };
}

/** the PT calendar day that contains an instant */
function dayWindow(ms: number): ShiftWindow {
  const w = ptWall(ms);
  const start = ptEpoch(w.y, w.mo, w.da, 0, ms);
  const end = ptEpoch(w.y, w.mo, w.da + 1, 0, ms);
  return { start, end, inProgress: false, label: "the last shift" };
}

export interface DigestAgent {
  slug: string;
  title: string;
  accent: string;
  sessions: number;
  edits: number;
  operateRuns: number;
  operateUnits: Record<string, number>;
  testRuns: number;
  commits: number;
  prs: number;
}

export interface ShiftDigest {
  window: ShiftWindow;
  quiet: boolean;
  /** when quiet, how long since the fleet last stirred (rel-time string input) */
  lastActiveAt?: string;
  totals: {
    agents: number;
    sessions: number;
    edits: number;
    operateRuns: number;
    operateUnits: Record<string, number>;
    testRuns: number;
    commits: number;
    prs: number;
    entries: number;
  };
  agents: DigestAgent[];
  entries: WriteRow[];
}

function inWin(iso: string, w: ShiftWindow): boolean {
  const t = Date.parse(iso);
  return !Number.isNaN(t) && t >= w.start && t < w.end;
}

function rollup(snapshot: FleetSnapshot, writes: WriteRow[], w: ShiftWindow): ShiftDigest {
  const agents: DigestAgent[] = [];
  const units: Record<string, number> = {};
  let sessions = 0,
    edits = 0,
    operateRuns = 0,
    testRuns = 0,
    commits = 0,
    prs = 0;

  for (const a of snapshot.agents) {
    const ss = a.sessions.filter((s) => inWin(s.lastActiveAt, w));
    const cc = a.commits.filter((c) => inWin(c.at, w));
    const au: Record<string, number> = {};
    let ae = 0,
      ao = 0,
      at = 0,
      ap = 0;
    for (const s of ss) {
      ae += s.work?.edits ?? 0;
      ao += s.work?.operateRuns ?? 0;
      at += s.work?.testRuns ?? 0;
      if (s.prUrl) ap += 1;
      for (const [u, c] of Object.entries(s.work?.operateUnits ?? {})) {
        au[u] = (au[u] ?? 0) + c;
        units[u] = (units[u] ?? 0) + c;
      }
    }
    if (ss.length === 0 && cc.length === 0) continue;
    agents.push({
      slug: a.slug,
      title: a.title,
      accent: a.accent,
      sessions: ss.length,
      edits: ae,
      operateRuns: ao,
      operateUnits: au,
      testRuns: at,
      commits: cc.length,
      prs: ap,
    });
    sessions += ss.length;
    edits += ae;
    operateRuns += ao;
    testRuns += at;
    prs += ap;
    commits += cc.length;
  }

  const entries = writes.filter((e) => inWin(e.at, w));
  agents.sort((x, y) => y.edits + y.operateRuns - (x.edits + x.operateRuns));

  return {
    window: w,
    quiet: agents.length === 0 && entries.length === 0,
    totals: {
      agents: agents.length,
      sessions,
      edits,
      operateRuns,
      operateUnits: units,
      testRuns,
      commits,
      prs,
      entries: entries.length,
    },
    agents,
    entries,
  };
}

/** the digest to show: the overnight shift if it had activity, else the
 *  most recent active day, labeled with its real date. `refMs` is the
 *  snapshot's cut time (recorded) or now (live). */
export function shiftDigest(snapshot: FleetSnapshot, writes: WriteRow[], refMs: number): ShiftDigest {
  const overnight = rollup(snapshot, writes, overnightWindow(refMs));
  if (!overnight.quiet) return overnight;

  // the night was quiet — summarize the last day anything moved
  let last = 0;
  for (const a of snapshot.agents) {
    for (const s of a.sessions) {
      const t = Date.parse(s.lastActiveAt);
      if (!Number.isNaN(t) && t > last) last = t;
    }
    for (const c of a.commits) {
      const t = Date.parse(c.at);
      if (!Number.isNaN(t) && t > last) last = t;
    }
  }
  if (last === 0) return { ...overnight, lastActiveAt: undefined };
  const day = rollup(snapshot, writes, dayWindow(last));
  return { ...day, lastActiveAt: new Date(last).toISOString() };
}
