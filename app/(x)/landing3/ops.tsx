"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SlimNode } from "../data";

interface MethodLine {
  title: string;
  status: string;
  thesis: string;
}

/* ── clock ─────────────────────────────────────────────── */

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    const first = setTimeout(update, 0);
    const t = setInterval(update, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  return now;
}

function fmt(now: Date | null, timeZone: string) {
  if (!now) return "--:--:--";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  }).format(now);
}

/* ── radar geometry — contacts placed by archive index ──── */

const SWEEP_S = 8; // one full rotation; pings fire as the beam passes

function contactAngle(i: number) {
  // clockwise from 12 o'clock; deliberately irregular spacing
  return (24 + i * 93) % 360;
}

function contactRadius(tag: string) {
  // inner ring = ship (proven), outer ring = bench (still moving)
  return tag === "SHIP" ? 24 : 38;
}

export default function OpsFloor({
  projects,
  writing,
  method,
}: {
  projects: SlimNode[];
  writing: SlimNode[];
  method: MethodLine;
}) {
  const now = useClock();
  const [active, setActive] = useState(0);
  const sel = projects[active];
  const liveCount = projects.filter((p) => p.live).length;

  return (
    <div className="l3-root">
      <div className="l3-frame">
        <span className="l3-tick l3-tick-tl" aria-hidden />
        <span className="l3-tick l3-tick-tr" aria-hidden />
        <span className="l3-tick l3-tick-bl" aria-hidden />
        <span className="l3-tick l3-tick-br" aria-hidden />

        {/* ── status bar ─────────────────────────────── */}
        <header className="l3-topbar">
          <span className="l3-brand">GAM / OPS — OPERATIONS FLOOR</span>
          <span className="l3-clocks">
            <span>
              UTC <b suppressHydrationWarning>{fmt(now, "UTC")}</b>
            </span>
            <span>
              SFO{" "}
              <b suppressHydrationWarning>{fmt(now, "America/Los_Angeles")}</b>
            </span>
          </span>
          <span className="l3-count">
            {String(projects.length).padStart(2, "0")} SYSTEMS ·{" "}
            {String(liveCount).padStart(2, "0")} REPORTING LIVE
          </span>
        </header>

        {/* ── main: console left, scope right ────────── */}
        <div className="l3-main">
          <section className="l3-left">
            <p className="l3-eyebrow">OPERATOR ON DUTY</p>
            <h1 className="l3-callsign">
              GEORGE
              <br />
              ANDRADE-MUÑOZ
            </h1>
            <p className="l3-doctrine">
              STANDING ORDER — <em>build fast, adapt faster.</em>
              <br />
              PROBABILISTIC IMAGINATION · DETERMINISTIC EXECUTION
            </p>

            {/* dossier — follows the hovered/last-pinged contact */}
            <article
              className="l3-dossier"
              style={{ "--c": sel.accent } as React.CSSProperties}
              aria-live="polite"
            >
              <header>
                <span className="l3-dossier-no">N°{sel.no}</span>
                <span className="l3-dossier-title">{sel.title}</span>
                <span className="l3-dossier-status">
                  {sel.live && <span className="l3-dot" aria-hidden />}
                  {sel.status}
                </span>
              </header>
              <p className="l3-dossier-domain">
                {sel.domain} · {sel.tag}
                {sel.updated
                  ? ` · LAST WRITE ${sel.updated}`
                  : ` · FILED ${sel.date}`}
              </p>
              <p className="l3-dossier-line">{sel.line}</p>
              {sel.metrics.length > 0 && (
                <dl className="l3-dossier-metrics">
                  {sel.metrics.map((m) => (
                    <div key={m.k}>
                      <dd>{m.v}</dd>
                      <dt>{m.k}</dt>
                    </div>
                  ))}
                </dl>
              )}
              <Link href={sel.href} className="l3-open">
                OPEN FILE →
              </Link>
            </article>

            {/* transmissions — the writing, as a comms log */}
            <div className="l3-tx">
              <p className="l3-eyebrow">TRANSMISSIONS</p>
              {writing.map((w) => (
                <Link key={w.slug} href={w.href} className="l3-tx-row">
                  <span>TX N°{w.no}</span>
                  <span className="l3-tx-title">{w.title}</span>
                  <span>{w.date}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="l3-right" aria-label="Radar scope">
            <div className="l3-scope">
              <div className="l3-sweep" aria-hidden />
              <div className="l3-ring l3-ring-1" aria-hidden />
              <div className="l3-ring l3-ring-2" aria-hidden />
              <div className="l3-ring l3-ring-3" aria-hidden />
              <div className="l3-cross" aria-hidden />
              {projects.map((p, i) => {
                const a = contactAngle(i);
                const r = contactRadius(p.tag);
                const x = 50 + r * Math.sin((a * Math.PI) / 180);
                const y = 50 - r * Math.cos((a * Math.PI) / 180);
                const delay = (a / 360) * SWEEP_S;
                return (
                  <button
                    key={p.slug}
                    className={`l3-blip ${i === active ? "is-active" : ""}`}
                    style={
                      {
                        left: `${x}%`,
                        top: `${y}%`,
                        "--c": p.accent,
                        "--ping-delay": `${delay}s`,
                      } as React.CSSProperties
                    }
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-label={`${p.title} — ${p.status}`}
                  >
                    <span className="l3-ping" aria-hidden />
                    <span className="l3-blip-dot" aria-hidden />
                    <span className="l3-blip-label">{p.title}</span>
                  </button>
                );
              })}
            </div>
            <p className="l3-legend">
              SCOPE — CONTACTS PLACED BY ARCHIVE INDEX, NOT GEOGRAPHY.
              <br />
              INNER RING = SHIP (PROVEN) · OUTER = BENCH (STILL MOVING)
            </p>
          </section>
        </div>

        {/* ── telemetry table ────────────────────────── */}
        <section className="l3-table" aria-label="Telemetry">
          <div className="l3-row l3-row-head" aria-hidden>
            <span>NO</span>
            <span>SYSTEM</span>
            <span className="l3-hide-sm">DOMAIN</span>
            <span className="l3-hide-sm">STAGE</span>
            <span>STATUS</span>
            <span>LAST WRITE</span>
          </div>
          <Link
            href="/method"
            className="l3-row"
            style={{ "--c": "var(--color-ember)" } as React.CSSProperties}
          >
            <span>N°000</span>
            <span className="l3-row-title">{method.title}</span>
            <span className="l3-hide-sm">META</span>
            <span className="l3-hide-sm">—</span>
            <span>{method.status}</span>
            <span>CONTINUOUS</span>
          </Link>
          {projects.map((p, i) => (
            <Link
              key={p.slug}
              href={p.href}
              className={`l3-row ${i === active ? "is-active" : ""}`}
              style={{ "--c": p.accent } as React.CSSProperties}
              onMouseEnter={() => setActive(i)}
            >
              <span>N°{p.no}</span>
              <span className="l3-row-title">{p.title}</span>
              <span className="l3-hide-sm">{p.domain}</span>
              <span className="l3-hide-sm">{p.tag}</span>
              <span className="l3-row-status">
                {p.live && <span className="l3-dot" aria-hidden />}
                {p.status}
              </span>
              <span>{p.updated ?? p.date}</span>
            </Link>
          ))}
        </section>

        {/* ── exits ──────────────────────────────────── */}
        <footer className="l3-exits">
          <Link href="/projects">PROJECTS</Link>
          <Link href="/writing">WRITING</Link>
          <Link href="/method">METHOD</Link>
          <Link href="/about">ABOUT</Link>
          <Link href="/" className="l3-exit-home">
            LEAVE THE FLOOR →
          </Link>
        </footer>
      </div>
    </div>
  );
}
