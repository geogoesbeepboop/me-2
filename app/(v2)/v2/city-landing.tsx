"use client";

import { useMemo } from "react";
import Link from "next/link";
import SfScene, { type SceneName } from "@/components/city/SfScene";
import { relTime, sfStamp } from "@/lib/ops/time";
import type { FleetSnapshot } from "@/lib/ops/types";
import type { SfWeather } from "@/lib/ops/weather";
import {
  FeedChip,
  Legend,
  ShiftLog,
  agentWork,
  fmtActive,
  nightlyGreen,
  nightlyLine,
  useCityTime,
  useFleet,
  windowWorkLine,
  type MirrorDay,
  type WriteRow,
} from "./shared";
import { shiftDigest, fmtUnits } from "@/lib/ops/digest";
import CityBar from "@/components/city/CityBar";
import CityFooter from "@/components/city/CityFooter";

/* one voice per hour of the city — durable lines, no counts.
   "you" is whoever holds the watch; the chrome says "the operator". */
const HERO: Record<SceneName, { eyebrow: string; h1: [string, string]; sub: string }> = {
  night: {
    eyebrow: "NIGHT · 20:00 — 06:00",
    h1: ["Autonomous imagination,", "harnessed while you sleep."],
    sub: "The desk is empty and the systems hold the watch. The skyline is a drawing — every light on the board below is the measured state of real work.",
  },
  morning: {
    eyebrow: "MORNING · 06:00 — 11:00",
    h1: ["What got done", "while you slept."],
    sub: "At dawn the fleet files its report: the sessions that ran, the commits that landed, the words that got written. Read it like a shift log — it is one.",
  },
  day: {
    eyebrow: "DAY · 11:00 — 17:00",
    h1: ["Build fast,", "adapt faster."],
    sub: "Daylight is for steering: review what ran, redirect what's stuck, ship what's ready. The board below is the working instrument, not a brochure.",
  },
  evening: {
    eyebrow: "EVENING · 17:00 — 20:00",
    h1: ["Hand the night", "to the systems."],
    sub: "Shift change at dusk: what's still open gets briefed, queued, and left to run. The morning report writes itself overnight.",
  },
};

export default function CityLanding({
  initialFleet,
  writes,
  mirrors,
  weather,
  initialScene,
}: {
  initialFleet: FleetSnapshot;
  writes: WriteRow[];
  mirrors: MirrorDay[];
  weather: SfWeather | null;
  initialScene: SceneName;
}) {
  const { clock, liveScene } = useCityTime(initialScene);
  const scene = liveScene;
  const { fleet, live } = useFleet(initialFleet);
  const hero = HERO[scene];

  return (
    <div className="v2-root">
      <CityBar clock={clock} scene={scene} weather={weather} />

      <section id="content" className="v2-stage" aria-label="San Francisco, drawn — the data below is measured">
        <SfScene scene={scene} condition={weather?.condition} />
        <div className="v2-hero">
          <p className="v2-eyebrow">SAN FRANCISCO · {hero.eyebrow}</p>
          <h1>
            {hero.h1[0]}
            <br />
            {hero.h1[1]}
          </h1>
          <p className="v2-sub">{hero.sub}</p>
        </div>
      </section>

      <DigestPanel fleet={fleet} writes={writes} />

      <div className="v2-landing-grid">
        <section className="v2-panel" aria-label="The fleet">
          <div className="v2-panel-head">
            <h2>THE FLEET</h2>
            <span className="v2-panel-sub">what each agent has done</span>
          </div>
          {fleet.agents.map((a) => (
            <Link
              key={a.slug}
              href={`/v2/ops#${a.slug}`}
              className="v2-row"
              style={{ "--c": a.accent } as React.CSSProperties}
            >
              <span className="v2-dot" data-state={a.state} aria-hidden />
              <span className="v2-row-title">{a.title}</span>
              <span className="v2-row-doing">
                {a.state === "dark" ? "no sessions on record" : windowWorkLine(agentWork(a))}
              </span>
              <span className="v2-row-time" suppressHydrationWarning>
                {a.lastActiveAt ? relTime(a.lastActiveAt) : "—"}
              </span>
            </Link>
          ))}
          <FleetTotals fleet={fleet} />
          <div className="v2-panel-foot">
            <Legend />
            <p className="v2-note">
              <FeedChip fleet={fleet} /> — the skyline is drawn, this board is measured; states
              inferred from transcripts on disk, active time counts gaps under 5m
            </p>
          </div>
        </section>

        <section className="v2-panel" aria-label="The shift log">
          <div className="v2-panel-head">
            <h2>THE SHIFT LOG</h2>
            <span className="v2-panel-sub">every row opens — full log in the ops room</span>
          </div>
          <ShiftLog fleet={fleet} writes={writes} mirrors={mirrors} live={live} cap={12} />
          <div className="v2-panel-foot">
            <p className="v2-note">
              sessions, commits and archive writes, newest first — all of it real
            </p>
          </div>
        </section>
      </div>

      <div className="v2-foot v2-foot-cta-band">
        <Link href="/v2/ops" className="v2-foot-cta">
          WALK INTO THE OPS ROOM →
        </Link>
        <span className="v2-foot-cta-note">
          the working dashboard — fleet, shift log, steering
        </span>
      </div>

      <CityFooter />
    </div>
  );
}

/* ── the shift digest — "what got done while you slept" ──────────── */

const DIGEST_HEADING: Record<string, string> = {
  "last night": "WHILE YOU SLEPT",
  "tonight so far": "TONIGHT'S WATCH",
  "overnight so far": "THE NIGHT SO FAR",
  "the last shift": "THE LATEST SHIFT",
};

function DigestPanel({ fleet, writes }: { fleet: FleetSnapshot; writes: WriteRow[] }) {
  // the report is cut from the same instant the snapshot was — stable
  // across server and client, so no hydration drift on the window
  const ref = Date.parse(fleet.generatedAt) || 0;
  const d = useMemo(() => shiftDigest(fleet, writes, ref), [fleet, writes, ref]);
  const heading = DIGEST_HEADING[d.window.label] ?? "THE SHIFT REPORT";
  const range = `${sfStamp(new Date(d.window.start).toISOString())} → ${
    d.window.inProgress ? "now" : sfStamp(new Date(d.window.end).toISOString())
  }`;

  return (
    <section className="v2-panel v2-digest" aria-label="Shift report">
      <div className="v2-panel-head">
        <h2>{heading}</h2>
        <span className="v2-panel-sub" suppressHydrationWarning>
          {d.window.label} · {range}
        </span>
      </div>
      {d.quiet ? (
        <p className="v2-digest-lede">
          a quiet shift — the fleet last stirred{" "}
          <span suppressHydrationWarning>
            {d.lastActiveAt ? relTime(d.lastActiveAt, ref || undefined) : "—"}
          </span>
          .
        </p>
      ) : (
        <>
          <p className="v2-digest-lede">{digestLede(d)}</p>
          <div className="v2-digest-grid">
            {d.agents.map((a) => (
              <div
                key={a.slug}
                className="v2-digest-agent"
                style={{ "--c": a.accent } as React.CSSProperties}
              >
                <span className="v2-digest-tick" aria-hidden />
                <span className="v2-digest-name">{a.title}</span>
                <span className="v2-digest-did">{digestAgentLine(a)}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <NightWatchLine fleet={fleet} refMs={ref} />
    </section>
  );
}

/** the newest nightly gate digest, when it's fresh enough to matter —
 *  the suites that ran against the whole fleet while nobody watched */
function NightWatchLine({ fleet, refMs }: { fleet: FleetSnapshot; refMs: number }) {
  const d = fleet.gateDigests?.[0];
  if (!d) return null;
  const age = refMs - (Date.parse(d.at) || 0);
  if (Number.isNaN(age) || age > 48 * 3600_000) return null;
  return (
    <p className="v2-nightwatch" data-green={nightlyGreen(d)}>
      <i className="v2-shift-glyph g-verify" aria-hidden>
        ☾
      </i>
      {nightlyLine(d)} · <span suppressHydrationWarning>{relTime(d.at, refMs)}</span> — detail in
      the shift log
    </p>
  );
}

function digestLede(d: ReturnType<typeof shiftDigest>): string {
  const t = d.totals;
  const parts: string[] = [`${t.agents} ${t.agents === 1 ? "agent" : "agents"} on the watch`];
  if (t.operateRuns > 0) parts.push(fmtUnits(t.operateUnits, 3));
  if (t.edits > 0) parts.push(`${t.edits} edits`);
  if (t.commits > 0) parts.push(`${t.commits} ${t.commits === 1 ? "commit" : "commits"} landed`);
  if (t.prs > 0) parts.push(`${t.prs} ${t.prs === 1 ? "PR" : "PRs"} opened`);
  if (t.entries > 0) parts.push(`${t.entries} archive ${t.entries === 1 ? "write" : "writes"}`);
  return parts.join(" · ");
}

function digestAgentLine(a: ReturnType<typeof shiftDigest>["agents"][number]): string {
  const parts: string[] = [];
  if (a.operateRuns > 0) parts.push(fmtUnits(a.operateUnits, 2));
  if (a.edits > 0) parts.push(`${a.edits} edits`);
  if (a.commits > 0) parts.push(`${a.commits} ${a.commits === 1 ? "commit" : "commits"}`);
  return parts.join(" · ") || "active";
}

/** the whole fleet's output in one line — real sums of the rows above */
function FleetTotals({ fleet }: { fleet: FleetSnapshot }) {
  const totals = fleet.agents.reduce(
    (t, a) => {
      const w = agentWork(a);
      t.activeMinutes += w.activeMinutes;
      t.edits += w.edits;
      t.operateRuns += w.operateRuns;
      t.testRuns += w.testRuns;
      t.sessions += w.sessions;
      return t;
    },
    { sessions: 0, activeMinutes: 0, edits: 0, operateRuns: 0, testRuns: 0 }
  );
  if (totals.sessions === 0) return null;
  return (
    <p className="v2-totals">
      across the fleet: {totals.sessions} sessions · {fmtActive(totals.activeMinutes)} active ·{" "}
      {totals.edits} edits building · {totals.operateRuns} agent runs · {totals.testRuns} checks
    </p>
  );
}
