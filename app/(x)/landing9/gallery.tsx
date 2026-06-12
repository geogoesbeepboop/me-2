"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SlimNode } from "../data";

interface MethodLine {
  title: string;
  thesis: string;
  status: string;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/* ── the studies — one drawn composition per system ──────
   Deterministic, derived from each system's real shape,
   and labeled on the placard as studies, not screenshots. */

function StudyDJ({ c }: { c: string }) {
  // a set being planned: concentric passes, one needle
  const arcs = Array.from({ length: 13 }, (_, i) => i);
  return (
    <svg viewBox="0 0 300 380" className="l9-art" role="img" aria-label="Study: concentric arcs like a record being read">
      <rect width="300" height="380" fill="#100e0c" />
      {arcs.map((i) => {
        const r = 18 + i * 10.5;
        const start = (i * 47) % 360;
        const span = 70 + ((i * 53) % 160);
        const a0 = (start * Math.PI) / 180;
        const a1 = ((start + span) * Math.PI) / 180;
        const x0 = 150 + r * Math.cos(a0);
        const y0 = 175 + r * Math.sin(a0);
        const x1 = 150 + r * Math.cos(a1);
        const y1 = 175 + r * Math.sin(a1);
        return (
          <path
            key={i}
            d={`M ${x0} ${y0} A ${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${x1} ${y1}`}
            fill="none"
            stroke={c}
            strokeOpacity={0.25 + (i % 4) * 0.18}
            strokeWidth={i % 3 === 0 ? 2.2 : 1.1}
          />
        );
      })}
      <line x1="150" y1="175" x2="265" y2="60" stroke="#e8e2d6" strokeOpacity="0.7" strokeWidth="1.2" />
      <circle cx="150" cy="175" r="3.2" fill="#e8e2d6" />
      <text x="22" y="352" fill="#6e6557" fontSize="9" letterSpacing="2">SET STUDY — 13 PASSES</text>
    </svg>
  );
}

function StudyPantry({ c }: { c: string }) {
  // the pantry as inventory; one cell is the human's tap
  const cells: { x: number; y: number; full: boolean }[] = [];
  for (let i = 0; i < 7; i++)
    for (let j = 0; j < 9; j++)
      cells.push({ x: i, y: j, full: (i * 7 + j * 3) % 5 < 2 });
  return (
    <svg viewBox="0 0 300 380" className="l9-art" role="img" aria-label="Study: an inventory grid with one highlighted cell">
      <rect width="300" height="380" fill="#0e100d" />
      {cells.map(({ x, y, full }, k) => (
        <rect
          key={k}
          x={36 + x * 33}
          y={34 + y * 33}
          width="24"
          height="24"
          fill={full ? c : "none"}
          fillOpacity={full ? 0.18 + ((x + y) % 3) * 0.18 : 0}
          stroke={c}
          strokeOpacity={full ? 0.85 : 0.22}
          strokeWidth="1"
        />
      ))}
      {/* the final tap stays human */}
      <rect x={36 + 4 * 33 - 4} y={34 + 7 * 33 - 4} width="32" height="32" fill="none" stroke="#e8e2d6" strokeWidth="1.6" />
      <text x="22" y="352" fill="#6e6557" fontSize="9" letterSpacing="2">INVENTORY — THE OUTLINED CELL IS YOURS</text>
    </svg>
  );
}

function StudyLedger({ c }: { c: string }) {
  // cited research: ledger lines, each with its source mark
  const cols = [0, 1, 2];
  return (
    <svg viewBox="0 0 300 380" className="l9-art" role="img" aria-label="Study: ledger lines with citation marks">
      <rect width="300" height="380" fill="#0c0f10" />
      {cols.map((col) =>
        Array.from({ length: 11 }, (_, row) => {
          const w = 24 + ((col * 31 + row * 17) % 46);
          const x = 30 + col * 88;
          const y = 44 + row * 26;
          const cited = (col + row) % 3 === 0;
          return (
            <g key={`${col}-${row}`}>
              <line x1={x} y1={y} x2={x + w} y2={y} stroke={c} strokeOpacity={0.3 + ((row + col) % 3) * 0.25} strokeWidth={row % 4 === 0 ? 2 : 1} />
              {cited && <circle cx={x + w + 7} cy={y} r="2.1" fill={c} fillOpacity="0.9" />}
            </g>
          );
        })
      )}
      <line x1="30" y1="330" x2="270" y2="330" stroke="#e8e2d6" strokeOpacity="0.5" strokeWidth="1" />
      <text x="22" y="352" fill="#6e6557" fontSize="9" letterSpacing="2">EVERY LINE KEEPS ITS DOT — OR IT DOESN&#39;T SHIP</text>
    </svg>
  );
}

function StudyVault({ c }: { c: string }) {
  // the single-purpose card inside its policy walls
  return (
    <svg viewBox="0 0 300 380" className="l9-art" role="img" aria-label="Study: a small card nested inside policy rectangles">
      <rect width="300" height="380" fill="#100f0b" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={42 + i * 18}
          y={58 + i * 22}
          width={216 - i * 36}
          height={244 - i * 44}
          fill="none"
          stroke={c}
          strokeOpacity={0.18 + i * 0.16}
          strokeWidth="1.1"
        />
      ))}
      <rect x="123" y="158" width="54" height="36" rx="3" fill={c} fillOpacity="0.85" />
      <line x1="123" y1="170" x2="177" y2="170" stroke="#100f0b" strokeWidth="3" />
      {/* spent: one diagonal strike — the card dies after one swipe */}
      <line x1="115" y1="202" x2="186" y2="150" stroke="#e8e2d6" strokeWidth="1.4" strokeOpacity="0.9" />
      <text x="22" y="352" fill="#6e6557" fontSize="9" letterSpacing="2">ONE CARD, ONE SWIPE — STRUCK THROUGH</text>
    </svg>
  );
}

const STUDIES: Record<string, (p: { c: string }) => React.ReactElement> = {
  "dj-agent": StudyDJ,
  "grocery-buddy": StudyPantry,
  jim: StudyLedger,
  "procurement-agent": StudyVault,
};

/* fallback for systems acquired after this wing was hung */
function StudyDefault({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 300 380" className="l9-art" role="img" aria-label="Study: a plain field">
      <rect width="300" height="380" fill="#0f0e0c" />
      <rect x="50" y="70" width="200" height="240" fill="none" stroke={c} strokeOpacity="0.7" />
    </svg>
  );
}

/* ── reveal on approach ──────────────────────────────── */

function useSeen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setSeen(true), 0);
      return () => clearTimeout(t);
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

function Exhibit({ p, index }: { p: SlimNode; index: number }) {
  const { ref, seen } = useSeen<HTMLElement>();
  const Study = STUDIES[p.slug] ?? StudyDefault;
  const medium =
    p.stack && p.stack.length > 0
      ? p.stack.slice(0, 4).join(", ").toLowerCase()
      : p.domain?.toLowerCase() ?? "software";
  return (
    <section
      ref={ref}
      className={`l9-exhibit ${index % 2 ? "is-right" : ""} ${seen ? "is-seen" : ""}`}
    >
      <Link href={p.href} className="l9-frame-link" aria-label={`${p.title} — open the file`}>
        <figure className="l9-frame">
          <Study c={p.accent} />
        </figure>
      </Link>
      <aside className="l9-label">
        <p className="l9-label-no">{ROMAN[index] ?? p.no}</p>
        <h2 className="l9-label-title">
          <em>{p.title}</em>, {p.year ?? p.date.slice(0, 4)}
        </h2>
        <p className="l9-label-medium">
          Study, after the running system. {medium}.
        </p>
        <p className="l9-label-line">{p.line}</p>
        <p className="l9-label-credit">
          {p.tag === "BENCH"
            ? "On loan from the bench — still moving."
            : "Acquired on shipping."}{" "}
          Status: {p.status.toLowerCase()}. Archive N°{p.no}.
        </p>
        <Link href={p.href} className="l9-label-link">
          Read the full provenance →
        </Link>
      </aside>
    </section>
  );
}

/* ── the wing ────────────────────────────────────────── */

export default function Gallery({
  projects,
  writing,
  method,
}: {
  projects: SlimNode[];
  writing: SlimNode[];
  method: MethodLine;
}) {
  const torch = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      torch.current?.style.setProperty(
        "background",
        `radial-gradient(460px at ${e.clientX}px ${e.clientY}px, rgba(255,243,214,0.065), transparent 70%)`
      );
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="l9-wing">
      <div ref={torch} className="l9-torch" aria-hidden />

      <header className="l9-entry">
        <p className="l9-entry-kicker">GALLERY THREE — SYSTEMS WING</p>
        <h1 className="l9-entry-title">
          The Permanent
          <br />
          Collection
        </h1>
        <p className="l9-didactic">
          George Andrade-Muñoz (American, b. Chapel Hill) builds operating
          software and publishes how it was built. The works in this wing are
          studies after his running systems, hung in the order they entered
          the archive. The systems themselves remain on duty; what hangs here
          is the shape of each one&apos;s argument. The motto of the practice
          is the title of the room: <em>build fast, adapt faster.</em>
        </p>
        <p className="l9-scroll-cue">walk this way ↓</p>
      </header>

      {projects.map((p, i) => (
        <Exhibit key={p.slug} p={p} index={i} />
      ))}

      <section className="l9-reading">
        <p className="l9-entry-kicker">THE READING ROOM</p>
        <div className="l9-reading-row">
          {writing.map((w) => (
            <Link key={w.slug} href={w.href} className="l9-plaque">
              <p className="l9-plaque-quote">“{w.line}”</p>
              <p className="l9-plaque-credit">
                <em>{w.title}</em>, {w.date.slice(0, 4)} — {w.readingTime} min
              </p>
            </Link>
          ))}
        </div>
        <div className="l9-conservation">
          <p className="l9-conservation-head">CONSERVATION NOTE</p>
          <p>
            {method.thesis} The harness that maintains this collection is
            documented at{" "}
            <Link href="/method" className="l9-label-link">
              /method
            </Link>{" "}
            — status: {method.status.toLowerCase()}.
          </p>
        </div>
      </section>

      <footer className="l9-exit">
        <Link href="/" className="l9-exit-link">
          EXIT THROUGH THE ARCHIVE →
        </Link>
        <p className="l9-exit-note">Photography permitted. Flash discouraged.</p>
      </footer>
    </div>
  );
}
