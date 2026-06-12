"use client";

import { useState } from "react";
import Link from "next/link";
import SfScene, { type SceneName } from "@/components/city/SfScene";
import { relTime } from "@/lib/ops/time";
import { STATE_WORDS, type AgentOps, type FleetSnapshot, type OpsSession } from "@/lib/ops/types";
import {
  CopyButton,
  FeedChip,
  Legend,
  SceneSwitch,
  ShiftLog,
  WindowPicker,
  sessionLine,
  sessionName,
  useCityTime,
  useFleet,
  windowWork,
  windowWorkLine,
  type WriteRow,
} from "../shared";

/* ── one session, one line — the prompt is never the line ── */

function SessionRow({ s, agent, live }: { s: OpsSession; agent: AgentOps; live: boolean }) {
  const name = sessionName(s);
  return (
    <li className="v2-session" title={s.stateDetail}>
      <span className="v2-dot" data-state={s.state} aria-hidden />
      <span className="v2-session-title">{name ?? sessionLine(s)}</span>
      {name && <span className="v2-session-fact">{sessionLine(s)}</span>}
      {s.worktree && (
        <span className="v2-session-fact" title={s.worktree}>
          {s.worktree.replace(/-[0-9a-f]{6}$/, "")}
        </span>
      )}
      {s.prUrl && (
        <span className="v2-session-fact">
          <a href={s.prUrl} target="_blank" rel="noreferrer">
            PR #{s.prNumber}
          </a>
        </span>
      )}
      {live && agent.repoPath && (
        <CopyButton text={`cd ${agent.repoPath} && claude --resume ${s.id}`} label="resume" />
      )}
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
              <span suppressHydrationWarning>{relTime(n.at)}</span> —{" "}
              {n.body.split("\n").slice(2).join(" ").slice(0, 160)}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

/* ── one agent's card ────────────────────────────────────── */

function AgentCard({
  a,
  live,
  windowHours,
  generatedAt,
}: {
  a: AgentOps;
  live: boolean;
  windowHours: number;
  generatedAt: string;
}) {
  const ww = windowWork(a, windowHours, generatedAt);
  return (
    <article id={a.slug} className="v2-card" style={{ "--c": a.accent } as React.CSSProperties}>
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

      {/* the agent's own output this window — the card's headline fact */}
      <p className="v2-workline">{windowWorkLine(ww)}</p>

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
          last activity{" "}
          <b suppressHydrationWarning>{a.lastActiveAt ? relTime(a.lastActiveAt) : "—"}</b>
        </span>
      </div>

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
  writes: WriteRow[];
  hookSnippet: string;
  initialScene: SceneName;
}) {
  const { clock, liveScene } = useCityTime(initialScene);
  const [override, setOverride] = useState<SceneName | null>(null);
  const scene = override ?? liveScene;
  const { fleet, windowHours, pick, live } = useFleet(initialFleet);

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
              <WindowPicker windowHours={windowHours} pick={pick} live={live} />
              <span className="v2-panel-sub">
                what each agent did, measured from its transcripts and its repo
              </span>
            </div>
          </div>
          <div className="v2-fleet">
            {fleet.agents.map((a) => (
              <AgentCard
                key={a.slug}
                a={a}
                live={live}
                windowHours={windowHours}
                generatedAt={fleet.generatedAt}
              />
            ))}
          </div>
          <div className="v2-panel v2-panel-foot-strip">
            <Legend />
            <p className="v2-note">
              states inferred from transcript activity · active time counts gaps under 5m — the
              protocol below says how
            </p>
          </div>
        </section>

        {/* ── the shift log ── */}
        <section className="v2-panel" id="shift" aria-labelledby="shift-h">
          <div className="v2-panel-head">
            <h2 id="shift-h">THE SHIFT LOG</h2>
            <span className="v2-panel-sub">
              sessions, commits, pull requests and archive writes in the last {windowHours}h — every
              row opens{live ? ", commits read as patches" : ""}
            </span>
          </div>
          <ShiftLog
            fleet={fleet}
            writes={writes}
            live={live}
            cap={80}
            filterable
            cutoffMs={(Date.parse(fleet.generatedAt) || 0) - windowHours * 3600_000}
          />
          <div className="v2-panel-foot">
            <p className="v2-note">one clock for everything — san francisco time</p>
          </div>
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
              dates. Two things are inferred and say so: <em>states</em> — a moving transcript is
              «working», a finished turn is «a human decides next», a stop-hook failure is
              «blocked» — and <em>active time</em>, which sums the gaps between transcript events
              and stops counting any gap longer than five minutes.
            </p>
            <p>
              The work numbers are the agent&apos;s own labor, not the repo&apos;s: every tool call
              in a transcript is counted — files edited, commands run, test and check runs,
              subagents dispatched. A session that shipped no commit still shows its hours. What
              <em> landed</em> is git&apos;s story; what <em>was done</em> is the transcript&apos;s.
            </p>
            <p>
              This page can&apos;t see that machine from your browser — and shouldn&apos;t. At the
              operator&apos;s desk the board is live and re-measured every few seconds. Everywhere
              else it serves the last <em>filed report</em>: a snapshot cut on the machine
              (<code>npm run ops:snapshot</code>), sanitized in code — assigned titles and measured
              numbers only; prompts, patches and file paths never leave the desk — then committed
              and deployed like any other change. The chip in the bar names which one you&apos;re
              reading, and when it was cut.
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
