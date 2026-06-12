"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import SfScene, { type SceneName } from "@/components/city/SfScene";
import { dayStamp, relTime, sfStamp } from "@/lib/ops/time";
import { STATE_WORDS, type AgentOps, type FleetSnapshot, type OpsSession } from "@/lib/ops/types";
import { FeedChip, Legend, SceneSwitch, useCityTime, type LogRow } from "../city-landing";

/* window choices — hours measured back from now */
const WINDOWS = [
  { h: 12, label: "overnight" },
  { h: 24, label: "24h" },
  { h: 72, label: "3 days" },
  { h: 168, label: "7 days" },
] as const;

function useFleetWindow(initial: FleetSnapshot) {
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
        /* next poll catches up */
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

/* ── diff rendering — plain text in, classed lines out ───── */

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

function Commit({
  agent,
  c,
  live,
  maxChange,
}: {
  agent: AgentOps;
  c: AgentOps["commits"][number];
  live: boolean;
  maxChange: number;
}) {
  const [patch, setPatch] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!live) return;
    if (open) return setOpen(false);
    setOpen(true);
    if (patch === null && !loading) {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/ops/diff?slug=${encodeURIComponent(agent.slug)}&hash=${c.hash}`
        );
        setPatch(res.ok ? await res.text() : `couldn't read the patch (${res.status})`);
      } catch {
        setPatch("couldn't read the patch — is the machine awake?");
      } finally {
        setLoading(false);
      }
    }
  };

  const scale = (n: number) => Math.max(2, Math.round((n / Math.max(1, maxChange)) * 90));

  return (
    <>
      <button
        className="v2-commit"
        onClick={toggle}
        disabled={!live}
        title={live ? "read the patch" : "patches are readable on the operator's machine only"}
      >
        <span className="v2-commit-hash">{c.shortHash}</span>
        <span className="v2-commit-subject">{c.subject}</span>
        <span className="v2-commit-stat">
          <span className="v2-statbar" aria-hidden>
            <i className="ins" style={{ width: `${scale(c.ins)}px` }} />
            <i className="del" style={{ width: `${scale(c.del)}px` }} />
          </span>
          +{c.ins} −{c.del} · {c.files} {c.files === 1 ? "file" : "files"}
        </span>
        <span className="v2-commit-hash" suppressHydrationWarning>{sfStamp(c.at)}</span>
      </button>
      {open && (loading ? <pre className="v2-patch">reading the patch…</pre> : patch && <PatchView text={patch} />)}
    </>
  );
}

/* ── sessions ────────────────────────────────────────────── */

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="v2-copy"
      data-done={done}
      onClick={async () => {
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

function SessionRow({ s, agent, live }: { s: OpsSession; agent: AgentOps; live: boolean }) {
  return (
    <li className="v2-session">
      <span className="v2-dot" data-state={s.state} aria-hidden />
      <span className="v2-session-title" title={s.stateDetail}>
        {s.title}
      </span>
      {s.worktree && (
        <span className="v2-session-fact" title={s.worktree}>
          worktree {s.worktree.replace(/-[0-9a-f]{6}$/, "")}
        </span>
      )}
      {s.subagents > 0 && <span className="v2-session-fact">{s.subagents} subagents</span>}
      <span className="v2-session-fact">{s.events} events</span>
      {s.prUrl && (
        <span className="v2-session-fact">
          <a href={s.prUrl} target="_blank" rel="noreferrer">
            PR #{s.prNumber}
          </a>
        </span>
      )}
      {live && <CopyButton text={`cd ${agent.repoPath} && claude --resume ${s.id}`} label="resume" />}
      <time suppressHydrationWarning>{relTime(s.lastActiveAt)}</time>
    </li>
  );
}

/* ── steering ────────────────────────────────────────────── */

function Steering({ agent }: { agent: AgentOps }) {
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const text = note.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ops/steer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: agent.slug, note: text }),
      });
      if (res.ok) {
        setNote("");
        setSent("note written — it waits in the inbox until the repo's hook picks it up");
      } else {
        setSent(await res.text());
      }
    } catch {
      setSent("couldn't reach the machine");
    } finally {
      setBusy(false);
      setTimeout(() => setSent(null), 4000);
    }
  };

  return (
    <details className="v2-steer">
      <summary>steer the next session →</summary>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={`a note for the next ${agent.title} session — context, priorities, a warning…`}
        maxLength={4000}
      />
      <div className="v2-steer-actions">
        <button className="v2-copy" onClick={send} disabled={busy || !note.trim()}>
          {busy ? "writing…" : "drop the note"}
        </button>
        <span className="v2-steer-note">
          {sent ?? "lands in ~/.claude/fleet/steering — read only by repos that opt in (see protocol)"}
        </span>
      </div>
      {agent.steering && agent.steering.length > 0 && (
        <ul className="v2-pending">
          {agent.steering.map((n) => (
            <li key={n.id}>
              <span suppressHydrationWarning>{sfStamp(n.at)}</span> — {n.body.split("\n").slice(2).join(" ").slice(0, 160)}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

/* ── the room ────────────────────────────────────────────── */

export default function OpsRoom({
  initialFleet,
  writes,
  hookSnippet,
  initialScene,
}: {
  initialFleet: FleetSnapshot;
  writes: LogRow[];
  hookSnippet: string;
  initialScene: SceneName;
}) {
  const { clock, liveScene } = useCityTime(initialScene);
  const [override, setOverride] = useState<SceneName | null>(null);
  const scene = override ?? liveScene;
  const { fleet, windowHours, pick, live } = useFleetWindow(initialFleet);
  const [muted, setMuted] = useState<Set<string>>(new Set());

  const toggleAgent = (slug: string) => {
    setMuted((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  /* the ledger — one stream of everything that actually happened */
  const ledger = useMemo(() => {
    type Row = {
      at: string;
      dateOnly?: boolean;
      agent: string;
      slug: string;
      accent: string;
      line: string;
      kind: "session" | "commit" | "pr" | "entry";
      href?: string;
    };
    const rows: Row[] = [];
    for (const a of fleet.agents) {
      if (muted.has(a.slug)) continue;
      for (const c of a.commits) {
        rows.push({
          at: c.at,
          agent: a.title,
          slug: a.slug,
          accent: a.accent,
          line: c.subject,
          kind: "commit",
        });
      }
      for (const s of a.sessions) {
        rows.push({
          at: s.startedAt,
          agent: a.title,
          slug: a.slug,
          accent: a.accent,
          line: s.title,
          kind: "session",
        });
        if (s.prUrl) {
          rows.push({
            at: s.lastActiveAt,
            agent: a.title,
            slug: a.slug,
            accent: a.accent,
            line: `pull request #${s.prNumber}`,
            kind: "pr",
            href: s.prUrl,
          });
        }
      }
    }
    if (!muted.has("the-archive")) {
      for (const w of writes) {
        rows.push({
          at: w.at,
          dateOnly: w.dateOnly,
          agent: w.main,
          slug: "the-archive",
          accent: w.accent,
          line: w.tag,
          kind: "entry",
          href: w.href,
        });
      }
    }
    return rows
      .filter((r) => !Number.isNaN(Date.parse(r.at)))
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 80);
  }, [fleet, writes, muted]);

  const KIND_WORD = { session: "session opened", commit: "commit", pr: "pr opened", entry: "archive write" } as const;

  return (
    <div className="v2-root">
      <header className="v2-bar">
        <Link href="/v2" className="v2-brand">
          ← THE CITY
        </Link>
        <span>OPS ROOM</span>
        <SceneSwitch scene={scene} override={override} onOverride={setOverride} />
        <FeedChip fleet={fleet} />
        <span className="v2-clock">
          SAN FRANCISCO <b suppressHydrationWarning>{clock}</b>
        </span>
      </header>

      <div className="v2-room-strip" aria-hidden>
        <SfScene scene={scene} />
      </div>

      <main className="v2-room">
        {/* ── the fleet ── */}
        <section aria-labelledby="fleet-h">
          <div className="v2-panel" id="fleet">
            <div className="v2-panel-head">
              <h2 id="fleet-h">THE FLEET</h2>
              <span className="v2-window" role="group" aria-label="Time window">
                {WINDOWS.map((w) => (
                  <button
                    key={w.h}
                    aria-pressed={windowHours === w.h}
                    onClick={() => pick(w.h)}
                    disabled={!live}
                    title={live ? undefined : "the record was cut at one window — live windows need the machine"}
                  >
                    {w.label}
                  </button>
                ))}
              </span>
              <Legend />
            </div>
            <p className="v2-note">
              states inferred from session transcripts on disk — the protocol below says how
            </p>
          </div>
          <div className="v2-fleet">
            {fleet.agents.map((a) => (
              <article
                key={a.slug}
                id={a.slug}
                className="v2-card"
                style={{ "--c": a.accent } as React.CSSProperties}
              >
                <div className="v2-card-head">
                  <Link href={a.href} className="v2-card-title">
                    {a.title}
                  </Link>
                  {a.domain && <span className="v2-card-domain">{a.domain}</span>}
                  <span className="v2-card-state">
                    <span className="v2-dot" data-state={a.state} aria-hidden />
                    {STATE_WORDS[a.state]}
                  </span>
                </div>
                <div className="v2-card-meta">
                  {a.branch && (
                    <span>
                      branch <b>{a.branch}</b>
                    </span>
                  )}
                  <span>
                    uncommitted <b>{a.dirty}</b>
                  </span>
                  <span>
                    last activity <b suppressHydrationWarning>{a.lastActiveAt ? relTime(a.lastActiveAt) : "—"}</b>
                  </span>
                </div>
                <p className="v2-card-detail">{a.stateDetail}</p>
                <ul className="v2-sessions">
                  {a.sessions.slice(0, 4).map((s) => (
                    <SessionRow key={s.id} s={s} agent={a} live={live} />
                  ))}
                </ul>
                {a.sessions.length > 4 && (
                  <details className="v2-steer">
                    <summary>{a.sessions.length - 4} more sessions</summary>
                    <ul className="v2-sessions">
                      {a.sessions.slice(4).map((s) => (
                        <SessionRow key={s.id} s={s} agent={a} live={live} />
                      ))}
                    </ul>
                  </details>
                )}
                {live && <Steering agent={a} />}
              </article>
            ))}
          </div>
        </section>

        {/* ── the shift report ── */}
        <section className="v2-panel" id="shift" aria-labelledby="shift-h">
          <div className="v2-panel-head">
            <h2 id="shift-h">THE SHIFT REPORT</h2>
            <span>
              every commit in the last {windowHours}h, all branches
              {live ? " — click one to read the patch" : ""}
            </span>
          </div>
          {fleet.agents.map((a) => {
            const maxChange = Math.max(1, ...a.commits.map((c) => Math.max(c.ins, c.del)));
            return (
              <div className="v2-repo-block" key={a.slug}>
                <div className="v2-repo-head" style={{ "--c": a.accent } as React.CSSProperties}>
                  <b>{a.title}</b>
                  {a.branch && <span>on {a.branch}</span>}
                  <span>
                    {a.commits.length === 0
                      ? "no commits in the window"
                      : `${a.commits.length} ${a.commits.length === 1 ? "commit" : "commits"}`}
                  </span>
                </div>
                {a.commits.map((c) => (
                  <Commit key={c.hash} agent={a} c={c} live={live} maxChange={maxChange} />
                ))}
              </div>
            );
          })}
        </section>

        {/* ── the ledger ── */}
        <section className="v2-panel" id="ledger" aria-labelledby="ledger-h">
          <div className="v2-panel-head">
            <h2 id="ledger-h">THE LEDGER</h2>
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
          </div>
          <div className="v2-ledger">
            {ledger.map((r, i) => (
              <div
                key={`${r.slug}-${r.at}-${i}`}
                className="v2-ledger-row"
                data-kind={r.kind}
                style={{ "--c": r.accent } as React.CSSProperties}
              >
                <span className="v2-ledger-time" suppressHydrationWarning>
                  {r.dateOnly ? dayStamp(r.at) : sfStamp(r.at)}
                </span>
                <span className="v2-ledger-agent">{r.agent}</span>
                <span className="v2-ledger-line">
                  {r.href ? (
                    r.href.startsWith("http") ? (
                      <a href={r.href} target="_blank" rel="noreferrer">
                        {r.line}
                      </a>
                    ) : (
                      <Link href={r.href}>{r.line}</Link>
                    )
                  ) : (
                    r.line
                  )}
                </span>
                <span className="v2-ledger-kind">{KIND_WORD[r.kind]}</span>
              </div>
            ))}
          </div>
          <p className="v2-note">
            sessions, commits, pull requests and archive writes on one clock — san francisco time
          </p>
        </section>

        {/* ── the protocol ── */}
        <section className="v2-panel" id="protocol" aria-labelledby="protocol-h">
          <div className="v2-panel-head">
            <h2 id="protocol-h">THE PROTOCOL</h2>
          </div>
          <div className="v2-protocol">
            <p>
              Everything on this floor is measured, never staged. Session facts are read from the
              Claude Code transcripts each agent writes on the operator&apos;s machine
              (<code>~/.claude/projects</code>); repo facts come from <code>git</code> in the same
              source repos the project entries cite; archive writes are the entries&apos; own
              dates. States are <em>inferred</em> from that activity — a moving transcript is
              «working», a finished turn is «a human decides next», a stop-hook failure is
              «blocked» — and every card says which rule fired.
            </p>
            <p>
              The deployed site can&apos;t see that machine, so it serves the last committed
              record, labeled with the moment it was cut. Live windows, patch reading and
              steering exist only where the data does. Prompts and diffs never leave the
              machine — sessions titled only by a prompt appear in the record as «untitled
              session» — so the record carries assigned titles and measured numbers,
              reviewed like any other commit.
            </p>
            <p>
              Steering notes land in <code>~/.claude/fleet/steering/&lt;repo&gt;/</code>. No agent
              reads them automatically — a repo opts in with a session-start hook that reads the
              inbox aloud and archives it:
            </p>
            <pre>{hookSnippet}</pre>
          </div>
        </section>
      </main>

      <footer className="v2-foot">
        <Link href="/v2" className="v2-foot-cta">
          ← BACK TO THE CITY
        </Link>
        <nav className="v2-exits" aria-label="Sections">
          <Link href="/">THE ARCHIVE</Link>
          <Link href="/projects">PROJECTS</Link>
          <Link href="/writing">WRITING</Link>
          <Link href="/method">METHOD</Link>
        </nav>
      </footer>
    </div>
  );
}
