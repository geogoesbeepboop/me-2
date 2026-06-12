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

export function FeedChip({ fleet }: { fleet: FleetSnapshot }) {
  const live = fleet.mode === "live";
  const empty = fleet.agents.length === 0;
  return (
    <span className="v2-feed" data-live={live}>
      {live
        ? "live — measured on the operator's machine"
        : empty
          ? "no record yet"
          : `report filed ${sfStamp(fleet.generatedAt)}`}
    </span>
  );
}

const SCENE_ORDER: SceneName[] = ["morning", "day", "evening", "night"];

export function SceneSwitch({
  scene,
  override,
  onOverride,
}: {
  scene: SceneName;
  override: SceneName | null;
  onOverride: (s: SceneName | null) => void;
}) {
  return (
    <span className="v2-scenes" role="group" aria-label="Scene — the clock decides unless you do">
      <span className="v2-scenes-note">scene</span>
      <button aria-pressed={override === null} onClick={() => onOverride(null)}>
        clock
      </button>
      {SCENE_ORDER.map((s) => (
        <button key={s} aria-pressed={override === s} onClick={() => onOverride(s)}>
          {s}
        </button>
      ))}
      {override === null && (
        <span className="v2-scenes-note" aria-hidden>
          → {scene}
        </span>
      )}
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
  commits: number;
  ins: number;
  del: number;
}

/** an agent's output inside the window — sessions + commits combined.
 *  "now" is the snapshot's own stamp so server and client agree. */
export function windowWork(a: AgentOps, windowHours: number, generatedAt: string): WindowWork {
  const cut = (Date.parse(generatedAt) || 0) - windowHours * 3600_000;
  const ss = a.sessions.filter((s) => (Date.parse(s.lastActiveAt) || 0) >= cut);
  return {
    sessions: ss.length,
    activeMinutes: ss.reduce((t, s) => t + (s.work?.activeMinutes ?? 0), 0),
    edits: ss.reduce((t, s) => t + (s.work?.edits ?? 0), 0),
    commands: ss.reduce((t, s) => t + (s.work?.commands ?? 0), 0),
    testRuns: ss.reduce((t, s) => t + (s.work?.testRuns ?? 0), 0),
    commits: a.commits.length,
    ins: a.commits.reduce((t, c) => t + c.ins, 0),
    del: a.commits.reduce((t, c) => t + c.del, 0),
  };
}

export function windowWorkLine(w: WindowWork): string {
  const parts: string[] = [];
  if (w.sessions > 0) parts.push(n(w.sessions, "session"));
  if (w.activeMinutes >= 1) parts.push(`${fmtActive(w.activeMinutes)} active`);
  if (w.edits > 0) parts.push(n(w.edits, "edit"));
  if (w.commands > 0) parts.push(n(w.commands, "command"));
  if (w.commits > 0) parts.push(`${n(w.commits, "commit")} +${w.ins} −${w.del}`);
  return parts.length > 0 ? parts.join(" · ") : "no measured work in this window";
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
  kind: "commit" | "session" | "pr" | "entry";
  line: string;
  commit?: OpsCommit;
  session?: OpsSession;
  repoPath?: string;
  entry?: WriteRow;
  prUrl?: string;
  prNumber?: number;
}

const KIND_WORD: Record<ShiftEvent["kind"], string> = {
  commit: "commit",
  session: "session",
  pr: "pull request",
  entry: "archive write",
};

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
        line: sessionLine(s),
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
        {w && w.filesTouched > 0 && <Fact label="files touched" value={w.filesTouched} />}
        {w && w.edits > 0 && <Fact label="edits" value={w.edits} />}
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
  return (
    <div className="v2-shift" data-open={open} style={{ "--c": e.accent } as React.CSSProperties}>
      <button className="v2-shift-row" aria-expanded={open} onClick={onToggle}>
        <span className="v2-shift-time" suppressHydrationWarning>
          {e.dateOnly ? dayStamp(e.at) : sfStamp(e.at)}
        </span>
        <span className="v2-shift-agent">{e.agent}</span>
        <span className="v2-shift-line">{e.line}</span>
        <span className="v2-shift-kind">{KIND_WORD[e.kind]}</span>
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
