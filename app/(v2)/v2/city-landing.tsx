"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SfScene, { type SceneName } from "@/components/city/SfScene";
import { sceneFor, sfClock, sfHour, relTime, sfStamp, dayStamp } from "@/lib/ops/time";
import { STATE_WORDS, type FleetSnapshot } from "@/lib/ops/types";

export interface LogRow {
  at: string;
  /** frontmatter dates carry no clock — render the day, never invent a time */
  dateOnly?: boolean;
  accent: string;
  /** the event itself — a commit subject, or the entry that moved */
  main: string;
  /** who/what it belongs to — agent name, or the kind of write */
  tag: string;
  href: string;
  kind: "commit" | "entry";
}

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

const SCENE_ORDER: SceneName[] = ["morning", "day", "evening", "night"];

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

export function useFleet(initial: FleetSnapshot) {
  const [fleet, setFleet] = useState(initial);
  useEffect(() => {
    if (initial.mode !== "live") return;
    let stop = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/ops?window=${initial.windowHours}`, { cache: "no-store" });
        if (res.ok && !stop) setFleet(await res.json());
      } catch {
        /* a missed beat is fine — the next one will land */
      }
    };
    const t = setInterval(tick, 8000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [initial.mode, initial.windowHours]);
  return fleet;
}

export function FeedChip({ fleet }: { fleet: FleetSnapshot }) {
  const live = fleet.mode === "live";
  const empty = fleet.agents.length === 0;
  return (
    <span className="v2-feed" data-live={live}>
      {live
        ? "live — measured on the operator's machine"
        : empty
          ? "no record yet"
          : `recorded ${sfStamp(fleet.generatedAt)}`}
    </span>
  );
}

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

export default function CityLanding({
  initialFleet,
  writes,
  initialScene,
}: {
  initialFleet: FleetSnapshot;
  writes: LogRow[];
  initialScene: SceneName;
}) {
  const { clock, liveScene } = useCityTime(initialScene);
  const [override, setOverride] = useState<SceneName | null>(null);
  const scene = override ?? liveScene;
  const fleet = useFleet(initialFleet);
  const hero = HERO[scene];

  /* the shift log — commits from the fleet + writes from the archive */
  const log = useMemo(() => {
    const commits: LogRow[] = fleet.agents.flatMap((a) =>
      a.commits.map((c) => ({
        at: c.at,
        accent: a.accent,
        main: c.subject,
        tag: a.title,
        href: `/v2/ops#shift`,
        kind: "commit" as const,
      }))
    );
    return [...commits, ...writes]
      .sort((x, y) => (Date.parse(y.at) || 0) - (Date.parse(x.at) || 0))
      .slice(0, 14);
  }, [fleet, writes]);

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
            <Legend />
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
              <span className="v2-row-state">{STATE_WORDS[a.state]}</span>
              <span className="v2-row-doing">
                {a.sessions[0] ? a.sessions[0].title : "no sessions on record"}
              </span>
              <span className="v2-row-time">
                {a.lastActiveAt ? relTime(a.lastActiveAt) : "—"}
              </span>
            </Link>
          ))}
          <p className="v2-note">
            the skyline is drawn — this board is measured; states inferred from session transcripts on disk
          </p>
        </section>

        <section className="v2-panel" aria-label="The shift log">
          <div className="v2-panel-head">
            <h2>THE SHIFT LOG</h2>
          </div>
          {log.map((e, i) => (
            <Link
              key={`${e.href}-${e.at}-${i}`}
              href={e.href}
              className="v2-row"
              style={{ "--c": e.accent } as React.CSSProperties}
            >
              <span className="v2-log-date" suppressHydrationWarning>
                {e.dateOnly ? dayStamp(e.at) : sfStamp(e.at)}
              </span>
              <span className="v2-row-doing">{e.main}</span>
              <span className="v2-log-kind">{e.tag}</span>
            </Link>
          ))}
          <p className="v2-note">commits and archive writes, newest first — all of it real</p>
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
