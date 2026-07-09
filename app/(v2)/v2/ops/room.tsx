"use client";

import { useState } from "react";
import Link from "next/link";
import SfScene, { type SceneName } from "@/components/city/SfScene";
import { relTime } from "@/lib/ops/time";
import {
  STATE_WORDS,
  type AgentMetric,
  type AgentOps,
  type FleetSnapshot,
  type OpsSession,
} from "@/lib/ops/types";
import type { SfWeather } from "@/lib/ops/weather";
import {
  CopyButton,
  FeedChip,
  LaborStrip,
  Legend,
  ShiftLog,
  WindowPicker,
  agentWork,
  busiest,
  fleetTally,
  laneData,
  sessionName,
  sortByAttention,
  useCityTime,
  useFleet,
  type WriteRow,
} from "../shared";
import CityBar from "@/components/city/CityBar";
import CityFooter from "@/components/city/CityFooter";

/* ── the status ribbon — "what needs me?" in one second ──────── */

function StatusRibbon({ fleet }: { fleet: FleetSnapshot }) {
  const tally = fleetTally(fleet);
  const blocked = fleet.agents.filter((a) => a.state === "blocked");
  const waiting = fleet.agents.filter((a) => a.state === "waiting");
  const busy = busiest(fleet);

  return (
    <div className="v2-ribbon">
      <div className="v2-ribbon-tally" aria-label="Fleet by state">
        {tally.map((t) => (
          <span key={t.state} className="v2-tally" data-zero={t.count === 0}>
            <i className="v2-dot" data-state={t.state} aria-hidden />
            <b>{t.count}</b> {STATE_WORDS[t.state]}
          </span>
        ))}
      </div>
      {blocked.length > 0 ? (
        <a className="v2-needs" data-tone="blocked" href={`#${blocked[0].slug}`}>
          {blocked.length} blocked — needs you
        </a>
      ) : waiting.length > 0 ? (
        <span className="v2-needs" data-tone="waiting">
          {waiting.length} waiting on a human
        </span>
      ) : (
        <span className="v2-needs" data-tone="clean">
          fleet running clean
        </span>
      )}
      {busy && (
        <span className="v2-busiest">
          busiest · <b style={{ color: busy.accent }}>{busy.title}</b>
        </span>
      )}
    </div>
  );
}

/* ── stat row — real headline facts, gates outlined, money in gold ─ */

function StatRow({ metrics, accent }: { metrics: AgentMetric[]; accent: string }) {
  if (!metrics || metrics.length === 0) return null;
  return (
    <div className="v2-stats" style={{ "--c": accent } as React.CSSProperties}>
      {metrics.map((m) => (
        <div key={m.k} className="v2-stat" data-gate={!!m.gate} data-money={!!m.money}>
          <span className="v2-stat-v">{m.absent ? "—" : m.v}</span>
          <span className="v2-stat-k">{m.absent ?? m.k}</span>
        </div>
      ))}
    </div>
  );
}

/* ── one session row — a dot, a name/handle, a labor micro-bar ──── */

function SessionRow({
  s,
  agent,
  live,
  maxActive,
}: {
  s: OpsSession;
  agent: AgentOps;
  live: boolean;
  maxActive: number;
}) {
  const name = sessionName(s);
  const active = s.work?.activeMinutes ?? 0;
  const w = Math.round((active / Math.max(1, maxActive)) * 100);
  return (
    <li className="v2-session" title={s.stateDetail}>
      <span className="v2-dot" data-state={s.state} aria-hidden />
      <span className="v2-session-name">{name ?? `session ·${s.id.slice(0, 4)}`}</span>
      <span className="v2-session-bar" aria-hidden>
        <span style={{ width: `${active === 0 ? 0 : Math.max(4, w)}%` }} />
      </span>
      {s.prUrl && (
        <a className="v2-session-pr" href={s.prUrl} target="_blank" rel="noreferrer">
          PR #{s.prNumber}
        </a>
      )}
      {live && agent.repoPath && (
        <CopyButton text={`cd ${agent.repoPath} && claude --resume ${s.id}`} label="resume" />
      )}
      <time suppressHydrationWarning>{relTime(s.lastActiveAt)}</time>
    </li>
  );
}

/* ── steering — a collapsed inbox for the next session ───────────── */

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
          {agent.steering.map((nt) => (
            <li key={nt.id}>
              <span suppressHydrationWarning>{relTime(nt.at)}</span> —{" "}
              {nt.body.split("\n").slice(2).join(" ").slice(0, 160)}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

/* ── one agent card — five fixed zones, scannable by shape ───────── */

function AgentCard({ a, live }: { a: AgentOps; live: boolean }) {
  const ww = agentWork(a);
  const lanes = laneData(ww);
  const shown = a.sessions.slice(0, 4);
  const maxActive = Math.max(1, ...a.sessions.map((s) => s.work?.activeMinutes ?? 0));
  const showFootnote = a.outputUnpersisted && ww.operateRuns > 0;

  return (
    <article id={a.slug} className="v2-card" style={{ "--c": a.accent } as React.CSSProperties}>
      {/* ZONE 1 — identity */}
      <div className="v2-card-head">
        <Link href={a.href} className="v2-card-title">
          {a.title}
        </Link>
        <span className="v2-card-state">
          <span className="v2-dot" data-state={a.state} aria-hidden />
          {STATE_WORDS[a.state]}
        </span>
      </div>
      {a.mandate && (
        <p className="v2-mandate">
          {a.mandate}
          {a.domain && <span className="v2-card-domain"> · {a.domain}</span>}
        </p>
      )}

      {/* ZONE 2 — the labor strip */}
      <LaborStrip lanes={lanes} />

      {/* ZONE 3 — real headline facts */}
      {a.metrics && <StatRow metrics={a.metrics} accent={a.accent} />}

      {/* ZONE 3.5 — last night's health run, straight from the digest */}
      {a.nightly && (
        <p className="v2-nightly" data-bad={a.nightly.gate === "fail" || a.nightly.evals === "regression"}>
          <i aria-hidden>☾</i> nightly gate{" "}
          {a.nightly.gate === "pass"
            ? `green${a.nightly.gateSeconds !== undefined ? ` (${a.nightly.gateSeconds}s)` : ""}${a.nightly.slow ? " — slow" : ""}`
            : a.nightly.gate === "fail"
              ? "FAILED"
              : "not installed"}
          {a.nightly.evals && ` · evals ${a.nightly.evals === "pass" ? "green" : "REGRESSION"}`}
          {a.nightly.at && (
            <>
              {" · "}
              <span suppressHydrationWarning>{relTime(a.nightly.at)}</span>
            </>
          )}
        </p>
      )}

      {/* ZONE 4 — sessions, as marks not sentences */}
      {shown.length > 0 ? (
        <ul className="v2-sessions">
          {shown.map((s) => (
            <SessionRow key={s.id} s={s} agent={a} live={live} maxActive={maxActive} />
          ))}
        </ul>
      ) : (
        <p className="v2-card-foot">no sessions on record</p>
      )}
      {a.sessions.length > 4 && (
        <details className="v2-steer">
          <summary>{a.sessions.length - 4} more sessions</summary>
          <ul className="v2-sessions">
            {a.sessions.slice(4).map((s) => (
              <SessionRow key={s.id} s={s} agent={a} live={live} maxActive={maxActive} />
            ))}
          </ul>
        </details>
      )}

      {/* ZONE 5 — foot */}
      <p className="v2-card-foot">
        {a.branch ? `${a.branch} · ` : ""}
        {a.noGitHistory ? "no commits to mine · " : ""}
        {a.dirty} uncommitted ·{" "}
        <span suppressHydrationWarning>{a.lastActiveAt ? relTime(a.lastActiveAt) : "—"}</span>
      </p>
      {showFootnote && (
        <p className="v2-card-note">runs counted from transcripts — no output recorded on disk</p>
      )}
      {live && <Steering agent={a} />}
    </article>
  );
}

/* ── the room ────────────────────────────────────────────────────── */

export default function OpsRoom({
  initialFleet,
  writes,
  weather,
  hookSnippet,
  initialScene,
}: {
  initialFleet: FleetSnapshot;
  writes: WriteRow[];
  weather: SfWeather | null;
  hookSnippet: string;
  initialScene: SceneName;
}) {
  const { clock, liveScene } = useCityTime(initialScene);
  const scene = liveScene;
  const { fleet, windowHours, pick, live } = useFleet(initialFleet);

  const ordered = sortByAttention(fleet.agents);
  // every agent with a history stays visible — its dossier is the showcase;
  // only truly dark agents (no sessions ever) fold away
  const shown = ordered.filter((a) => a.state !== "dark");
  const dark = ordered.filter((a) => a.state === "dark");

  return (
    <div className="v2-root">
      <CityBar clock={clock} scene={scene} weather={weather} />

      <div className="v2-room-strip" aria-hidden>
        <SfScene scene={scene} condition={weather?.condition} />
      </div>

      <main className="v2-room">
        {/* ── the fleet ── */}
        <section aria-labelledby="fleet-h">
          <div className="v2-panel" id="fleet">
            <div className="v2-panel-head">
              <h2 id="fleet-h">THE FLEET</h2>
              <span className="v2-panel-sub">each agent&apos;s labor, on the whole record</span>
            </div>
            <StatusRibbon fleet={fleet} />
            <p className="v2-note">
              build = work on the agent · operate = the agent running its own job · verify = its
              checks — measured from transcripts and the repo
            </p>
          </div>
          <div className="v2-fleet">
            {shown.map((a) => (
              <AgentCard key={a.slug} a={a} live={live} />
            ))}
          </div>
          {dark.length > 0 && (
            <details className="v2-idle">
              <summary>
                {dark.length} dark — {dark.map((a) => a.title).join(", ")}
              </summary>
              <div className="v2-fleet">
                {dark.map((a) => (
                  <AgentCard key={a.slug} a={a} live={live} />
                ))}
              </div>
            </details>
          )}
          <div className="v2-panel v2-panel-foot-strip">
            <FeedChip fleet={fleet} />
            <Legend />
            <span className="v2-lane-legend" aria-label="Labor legend">
              <span><i className="v2-swatch" data-lane="build" /> build</span>
              <span><i className="v2-swatch" data-lane="operate" /> operate · each agent&apos;s accent</span>
              <span><i className="v2-swatch" data-lane="verify" /> verify</span>
              <span><i className="v2-gate-swatch" /> a cap the model can&apos;t cross</span>
            </span>
            <p className="v2-note">states inferred from transcript activity — the protocol says how</p>
          </div>
        </section>

        {/* ── the shift log ── */}
        <section className="v2-panel" id="shift" aria-labelledby="shift-h">
          <div className="v2-panel-head">
            <h2 id="shift-h">THE SHIFT LOG</h2>
            <WindowPicker windowHours={windowHours} pick={pick} live={live} />
            <span className="v2-panel-sub">
              everything, everyone, one clock — last {windowHours}h{live ? ", commits open as patches" : ""}
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
            <p className="v2-note">
              ▸ the agent ran · ▫ built · ✓ checked · ✎ archive write · ☾ the night ran the gates
            </p>
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
              source repos the project entries cite; archive writes are the entries&apos; own dates.
              Two things are inferred and say so: <em>states</em> — a moving transcript is «working»,
              a finished turn is «a human decides next», a stop-hook failure is «blocked» — and
              <em> active time</em>, which sums the gaps between transcript events and stops counting
              any gap longer than five minutes.
            </p>
            <p>
              Each card splits an agent&apos;s labor three ways. <em>Build</em> is the development
              done <em>to</em> the agent — edits to its source. <em>Operate</em> is the agent running
              its <em>own</em> job: every time its entrypoints fire in a transcript — a set planned, a
              cart priced, a memo drafted — counted as an invocation. <em>Verify</em> is the agent
              checking itself. Operate counts are runs, not shipped artifacts: these agents keep their
              real output in a database or in memory, not on disk, so a card with operate activity
              says «no output recorded on disk» rather than dress an invocation as a delivered set.
            </p>
            <p>
              The fleet also checks itself while nobody watches. Every morning a LaunchAgent runs
              each repo&apos;s <code>.claude/gate.sh</code> — lint plus its full hermetic test
              suite — and <code>.claude/evals.sh</code>, the offline eval suites, and writes a
              dated digest. The board reads that digest: the ☾ rows in the shift log are those
              runs, each card&apos;s «nightly gate» line is its repo&apos;s latest result, and a
              red gate or a yellow eval regression is the first thing the operator triages in the
              morning. The site never runs a gate itself — it reports what the night actually did.
            </p>
            <p>
              This page can&apos;t see that machine from your browser — and shouldn&apos;t. At the
              operator&apos;s desk the board is live and re-measured every few seconds. Everywhere
              else it serves the last <em>filed report</em>: a snapshot cut on the machine
              (<code>npm run ops:snapshot</code>), sanitized in code — assigned titles and measured
              numbers only; prompts, patches, file paths and failure logs never leave the desk —
              then committed and deployed like any other change. Filing is itself automated: after
              the gates run, a second LaunchAgent cuts the snapshot, commits it and pushes, and the
              host redeploys — so the public record refreshes every morning without a hand on it.
              The chip at the fleet board&apos;s foot names which report you&apos;re reading, and
              when it was cut.
            </p>
            <p>
              Steering notes land in <code>~/.claude/fleet/steering/&lt;repo&gt;/</code>. No agent
              reads them automatically — a repo opts in with a session-start hook that reads the inbox
              aloud and archives it:
            </p>
            <pre>{hookSnippet}</pre>
          </div>
        </section>
      </main>

      <div className="v2-foot v2-foot-cta-band">
        <Link href="/" className="v2-foot-cta">
          ← BACK TO THE CITY
        </Link>
        <span className="v2-foot-cta-note">the front door — the skyline over the live board</span>
      </div>

      <CityFooter />
    </div>
  );
}
