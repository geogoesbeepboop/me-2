"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SlimNode } from "../data";

function useClock() {
  const [clock, setClock] = useState("--:--");
  useEffect(() => {
    const update = () =>
      setClock(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "America/Los_Angeles",
        }).format(new Date())
      );
    const first = setTimeout(update, 0);
    const t = setInterval(update, 10_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  return clock;
}

export default function Booth({
  projects,
  writing,
}: {
  projects: SlimNode[];
  writing: SlimNode[];
}) {
  const clock = useClock();
  /* 0 = full deck A (systems), 100 = full deck B (texts) */
  const [xfade, setXfade] = useState(26);
  const [cued, setCued] = useState(0);
  const sel = projects[cued];

  const a = 1 - (xfade / 100) * 0.82;
  const b = 0.18 + (xfade / 100) * 0.82;

  return (
    <div className="l7-room">
      {/* ── marquee over the booth ───────────────────── */}
      <header className="l7-top">
        <span className="l7-brand">THE BOOTH</span>
        <span className="l7-resident">
          RESIDENT: <Link href="/projects/dj-agent">DJ AGENT</Link> — LIVE
        </span>
        <span className="l7-time">
          SF <b suppressHydrationWarning>{clock}</b>
        </span>
      </header>

      <p className="l7-nowplaying">
        NOW PLAYING — <em>BUILD FAST, ADAPT FASTER</em> (EXTENDED MIX) ·
        OPERATOR: GEORGE ANDRADE-MUÑOZ
      </p>

      {/* ── the decks ────────────────────────────────── */}
      <div className="l7-decks">
        <section
          className="l7-deck"
          style={{ opacity: a, pointerEvents: xfade > 88 ? "none" : "auto" }}
          aria-label="Deck A — systems"
        >
          <h2 className="l7-deck-head">DECK A — SYSTEMS</h2>
          {projects.map((p, i) => (
            <Link
              key={p.slug}
              href={p.href}
              className={`l7-track ${i === cued ? "is-cued" : ""}`}
              style={{ "--c": p.accent } as React.CSSProperties}
              onMouseEnter={() => setCued(i)}
              onFocus={() => setCued(i)}
            >
              <span className="l7-track-no">N°{p.no}</span>
              <span className="l7-track-title">{p.title}</span>
              <span className="l7-track-meta">{p.domain}</span>
              <span className="l7-track-status">{p.status}</span>
            </Link>
          ))}
        </section>

        <section
          className="l7-deck"
          style={{ opacity: b, pointerEvents: xfade < 12 ? "none" : "auto" }}
          aria-label="Deck B — texts"
        >
          <h2 className="l7-deck-head">DECK B — TEXTS</h2>
          {writing.map((w) => (
            <Link
              key={w.slug}
              href={w.href}
              className="l7-track"
              style={{ "--c": w.accent } as React.CSSProperties}
            >
              <span className="l7-track-no">N°{w.no}</span>
              <span className="l7-track-title">{w.title}</span>
              <span className="l7-track-meta">{w.line}</span>
              <span className="l7-track-status">{w.readingTime}:00 MIN</span>
            </Link>
          ))}
          <p className="l7-bside">b-sides press slower. read them loud.</p>
        </section>
      </div>

      {/* ── the mixer ────────────────────────────────── */}
      <section className="l7-mixer" aria-label="Mixer">
        <div className="l7-strips">
          {projects.map((p, i) => (
            <div
              key={p.slug}
              className={`l7-strip ${i === cued ? "is-cued" : ""}`}
              style={{ "--c": p.accent } as React.CSSProperties}
            >
              <span className="l7-tape">{p.title}</span>
              <div className={`l7-vu ${p.live ? "is-live" : ""}`} aria-hidden>
                {Array.from({ length: 10 }, (_, k) => (
                  <i key={k} style={{ "--k": k } as React.CSSProperties} />
                ))}
              </div>
              <div className="l7-fader" aria-hidden>
                <i
                  className="l7-fader-cap"
                  style={{ bottom: `${82 - i * 17}%` }}
                />
              </div>
              <div className="l7-strip-btns">
                <button
                  className={`l7-cue ${i === cued ? "is-on" : ""}`}
                  onClick={() => setCued(i)}
                  aria-label={`Cue ${p.title}`}
                >
                  CUE
                </button>
                <Link href={p.href} className="l7-play" aria-label={`Open ${p.title}`}>
                  ▸
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* booth monitor — whatever is cued */}
        <aside
          className="l7-monitor"
          style={{ "--c": sel.accent } as React.CSSProperties}
          aria-live="polite"
        >
          <p className="l7-mon-tag">IN THE HEADPHONES</p>
          <p className="l7-mon-title">
            N°{sel.no} — {sel.title}
          </p>
          <p className="l7-mon-meta">
            {sel.domain} · {sel.tag} · {sel.status}
            {sel.updated ? ` · LAST WRITE ${sel.updated}` : ""}
          </p>
          <p className="l7-mon-line">{sel.line}</p>
          <Link href={sel.href} className="l7-mon-open">
            DROP IT →
          </Link>
        </aside>
      </section>

      <p className="l7-honest">
        FADERS SIT AT RECENCY OF LAST WRITE — NEWEST RIDES HIGHEST · METERS
        ARE AMBIENT, NOT DATA
      </p>

      {/* ── crossfader ───────────────────────────────── */}
      <section className="l7-xfade-row" aria-label="Crossfader">
        <span className="l7-xlabel">SYSTEMS</span>
        <input
          type="range"
          min={0}
          max={100}
          value={xfade}
          onChange={(e) => setXfade(Number(e.target.value))}
          className="l7-xfade"
          aria-label="Crossfade between systems and texts"
        />
        <span className="l7-xlabel">TEXTS</span>
      </section>

      <footer className="l7-boh">
        <Link href="/projects">CRATE — PROJECTS</Link>
        <Link href="/writing">LINER NOTES — WRITING</Link>
        <Link href="/method">THE RIDER — METHOD</Link>
        <Link href="/about">GUEST LIST — ABOUT</Link>
        <Link href="/" className="l7-leave">
          LIGHTS UP, LEAVE THE BOOTH →
        </Link>
      </footer>
    </div>
  );
}
