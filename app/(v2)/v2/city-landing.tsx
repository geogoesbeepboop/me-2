"use client";

import { useState } from "react";
import Link from "next/link";
import SfScene, { type SceneName } from "@/components/city/SfScene";
import { relTime } from "@/lib/ops/time";
import type { FleetSnapshot } from "@/lib/ops/types";
import {
  FeedChip,
  Legend,
  SceneSwitch,
  ShiftLog,
  fmtActive,
  sessionName,
  useCityTime,
  useFleet,
  windowWork,
  windowWorkLine,
  type WriteRow,
} from "./shared";

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
  initialScene,
}: {
  initialFleet: FleetSnapshot;
  writes: WriteRow[];
  initialScene: SceneName;
}) {
  const { clock, liveScene } = useCityTime(initialScene);
  const [override, setOverride] = useState<SceneName | null>(null);
  const scene = override ?? liveScene;
  const { fleet, windowHours, live } = useFleet(initialFleet);
  const hero = HERO[scene];

  return (
    <div className="v2-root">
      <header className="v2-bar">
        <Link href="/" className="v2-brand">
          ANDRADE-MUÑOZ — THE CITY
        </Link>
        <SceneSwitch scene={scene} override={override} onOverride={setOverride} />
        <FeedChip fleet={fleet} />
        <span className="v2-clock">
          SAN FRANCISCO <b suppressHydrationWarning>{clock}</b>
        </span>
      </header>

      <section className="v2-stage" aria-label="San Francisco, drawn — the data below is measured">
        <SfScene scene={scene} />
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

      <div className="v2-landing-grid">
        <section className="v2-panel" aria-label="The fleet">
          <div className="v2-panel-head">
            <h2>THE FLEET</h2>
            <span className="v2-panel-sub">the last {windowHours}h, per agent</span>
          </div>
          {fleet.agents.map((a) => {
            const cut = (Date.parse(fleet.generatedAt) || 0) - windowHours * 3600_000;
            const current =
              a.sessions[0] && (Date.parse(a.sessions[0].lastActiveAt) || 0) >= cut
                ? a.sessions[0]
                : undefined;
            const named = current ? sessionName(current) : null;
            const ww = windowWork(a, windowHours, fleet.generatedAt);
            return (
              <Link
                key={a.slug}
                href={`/v2/ops#${a.slug}`}
                className="v2-row"
                style={{ "--c": a.accent } as React.CSSProperties}
              >
                <span className="v2-dot" data-state={a.state} aria-hidden />
                <span className="v2-row-title">{a.title}</span>
                <span className="v2-row-doing">
                  {a.state === "dark"
                    ? "no sessions on record"
                    : named ?? windowWorkLine(ww)}
                </span>
                <span className="v2-row-time" suppressHydrationWarning>
                  {a.lastActiveAt ? relTime(a.lastActiveAt) : "—"}
                </span>
              </Link>
            );
          })}
          <FleetTotals fleet={fleet} windowHours={windowHours} />
          <div className="v2-panel-foot">
            <Legend />
            <p className="v2-note">
              the skyline is drawn — this board is measured; states inferred from transcripts on
              disk, active time counts gaps under 5m
            </p>
          </div>
        </section>

        <section className="v2-panel" aria-label="The shift log">
          <div className="v2-panel-head">
            <h2>THE SHIFT LOG</h2>
            <span className="v2-panel-sub">every row opens — full log in the ops room</span>
          </div>
          <ShiftLog fleet={fleet} writes={writes} live={live} cap={12} />
          <div className="v2-panel-foot">
            <p className="v2-note">
              sessions, commits and archive writes, newest first — all of it real
            </p>
          </div>
        </section>
      </div>

      <footer className="v2-foot">
        <Link href="/v2/ops" className="v2-foot-cta">
          WALK INTO THE OPS ROOM →
        </Link>
        <nav className="v2-exits" aria-label="Sections">
          <Link href="/">THE ARCHIVE</Link>
          <Link href="/projects">PROJECTS</Link>
          <Link href="/writing">WRITING</Link>
          <Link href="/method">METHOD</Link>
          <Link href="/about">ABOUT</Link>
        </nav>
      </footer>
    </div>
  );
}

/** the whole fleet's output in one line — real sums of the rows above */
function FleetTotals({ fleet, windowHours }: { fleet: FleetSnapshot; windowHours: number }) {
  const totals = fleet.agents.reduce(
    (t, a) => {
      const w = windowWork(a, windowHours, fleet.generatedAt);
      t.activeMinutes += w.activeMinutes;
      t.edits += w.edits;
      t.commands += w.commands;
      t.commits += w.commits;
      t.sessions += w.sessions;
      return t;
    },
    { sessions: 0, activeMinutes: 0, edits: 0, commands: 0, commits: 0 }
  );
  if (totals.sessions === 0 && totals.commits === 0) return null;
  return (
    <p className="v2-totals">
      across the fleet: {totals.sessions} sessions · {fmtActive(totals.activeMinutes)} active ·{" "}
      {totals.edits} edits · {totals.commands} commands · {totals.commits} commits
    </p>
  );
}
