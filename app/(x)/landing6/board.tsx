"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface DepartureRow {
  time: string;
  service: string;
  dest: string;
  remarks: string;
  platform: string;
  href: string;
  accent: string;
  line: string;
}

/* the character drum every flap cycles through */
const DRUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—.:°/ ";

function colsFor(rows: DepartureRow[]) {
  // the board is exactly as wide as its longest real destination
  const destW = Math.max(...rows.map((r) => r.dest.length));
  return [
    { key: "time", width: 5, label: "TIME" },
    { key: "service", width: 6, label: "SERVICE" },
    { key: "dest", width: destW, label: "DESTINATION" },
    { key: "remarks", width: 13, label: "REMARKS" },
    { key: "platform", width: 5, label: "PLAT" },
  ] as const;
}

const TICK_MS = 60;
/* per-flap settle time: a cascade that sweeps down and to the right */
function settleMs(row: number, col: number, ch: number) {
  return 350 + row * 240 + col * 130 + ch * 26;
}

function padTo(s: string, n: number) {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

function useClock() {
  const [clock, setClock] = useState("--:--:--");
  useEffect(() => {
    const update = () =>
      setClock(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "America/Los_Angeles",
        }).format(new Date())
      );
    const first = setTimeout(update, 0);
    const t = setInterval(update, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  return clock;
}

export default function Board({
  rows,
  announcements,
}: {
  rows: DepartureRow[];
  announcements: string[];
}) {
  const router = useRouter();
  const clock = useClock();
  const COLS = useMemo(() => colsFor(rows), [rows]);
  const [hovered, setHovered] = useState(0);
  /* elapsed ms since this row's last flip began */
  const [elapsed, setElapsed] = useState<number[]>(() => rows.map(() => 0));
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reducedRef.current) {
      setElapsed(rows.map(() => 1e9)); // everything settled, instantly
      return;
    }

    const t = setInterval(() => {
      setElapsed((prev) => {
        const maxSettle = settleMs(0, 4, 34);
        if (prev.every((e) => e > maxSettle + 1200)) return prev; // board at rest
        return prev.map((e) => e + TICK_MS);
      });
    }, TICK_MS);

    /* a live board: one row reflips every so often */
    const reflip = setInterval(() => {
      setElapsed((prev) => {
        const i = Math.floor(performance.now() / 16000) % rows.length;
        const next = [...prev];
        next[i] = 0;
        return next;
      });
    }, 16000);

    return () => {
      clearInterval(t);
      clearInterval(reflip);
    };
  }, [rows]);

  const sel = rows[hovered];

  return (
    <div className="l6-hall">
      <header className="l6-head">
        <span className="l6-brand">GAM TERMINUS</span>
        <span className="l6-head-mid">DEPARTURES — THE SYSTEMS ARCHIVE</span>
        <span className="l6-clock">
          SF <b suppressHydrationWarning>{clock}</b>
        </span>
      </header>

      <div className="l6-board" role="table" aria-label="Departures">
        <div className="l6-row l6-row-head" role="row" aria-hidden>
          {COLS.map((c) => (
            <span key={c.key} className={`l6-col-${c.key}`}>
              {c.label}
            </span>
          ))}
        </div>

        {rows.map((r, ri) => (
          <Link
            key={r.href}
            href={r.href}
            role="row"
            className={`l6-row ${ri === hovered ? "is-hot" : ""}`}
            style={{ "--c": r.accent } as React.CSSProperties}
            onMouseEnter={() => setHovered(ri)}
            onFocus={() => setHovered(ri)}
          >
            {COLS.map((c, ci) => {
              const target = padTo(r[c.key], c.width);
              return (
                <span
                  key={c.key}
                  className={`l6-cell l6-col-${c.key}`}
                  aria-label={r[c.key]}
                >
                  {target.split("").map((ch, k) => {
                    const settled = elapsed[ri] >= settleMs(ri, ci, k);
                    const drumIdx =
                      (ri * 13 + ci * 7 + k * 3 + Math.floor(elapsed[ri] / TICK_MS)) %
                      DRUM.length;
                    return (
                      <span
                        key={k}
                        className={`l6-flap ${settled ? "is-set" : "is-spin"}`}
                        aria-hidden
                      >
                        {settled ? ch : DRUM[drumIdx]}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </Link>
        ))}
      </div>

      {/* now boarding — follows the hovered service */}
      <aside
        className="l6-boarding"
        style={{ "--c": sel.accent } as React.CSSProperties}
        aria-live="polite"
      >
        <span className="l6-boarding-tag">NOW BOARDING</span>
        <span className="l6-boarding-dest">{sel.dest}</span>
        <span className="l6-boarding-line">{sel.line}</span>
        <button className="l6-boarding-go" onClick={() => router.push(sel.href)}>
          BOARD →
        </button>
      </aside>

      {/* announcements */}
      <div className="l6-pa" aria-hidden>
        <div className="l6-pa-track">
          <span>{announcements.join("  ···  ")}  ···  </span>
          <span>{announcements.join("  ···  ")}  ···  </span>
        </div>
      </div>

      <footer className="l6-exits">
        <Link href="/projects">PLATFORM SHIP/BENCH — PROJECTS</Link>
        <Link href="/writing">PLATFORM POST — WRITING</Link>
        <Link href="/method">STATION MASTER — METHOD</Link>
        <Link href="/about">LOST &amp; FOUND — ABOUT</Link>
        <Link href="/" className="l6-exit-main">
          STATION EXIT →
        </Link>
      </footer>
    </div>
  );
}
