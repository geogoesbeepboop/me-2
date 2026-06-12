"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SlimNode } from "../data";

interface LogRow {
  date: string;
  title: string;
  href: string;
  accent: string;
  kind: string;
}

/* deterministic PRNG — the same sky every night */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── San Francisco time, on the page's wrist ─────────── */

const SHIFT_START = 20; // 20:00 PT
const SHIFT_END = 6; // 06:00 PT

function useSfTime() {
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
  if (!now) return { clock: "--:--:--", onShift: null as boolean | null };
  const clock = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Los_Angeles",
  }).format(now);
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "America/Los_Angeles",
    }).format(now)
  );
  const onShift = hour >= SHIFT_START || hour < SHIFT_END;
  return { clock, onShift };
}

/* ── the sky: still stars, one satellite on its pass ──── */

function Sky() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    const rand = mulberry32(20260611);
    const N = 130;
    const stars = Array.from({ length: N }, () => ({
      x: rand(),
      y: rand() * 0.82,
      r: 0.4 + rand() * 1.1,
      phase: rand() * Math.PI * 2,
      speed: 0.3 + rand() * 0.5,
    }));

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      cvs.width = w * dpr;
      cvs.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = reduced ? 0.75 : 0.55 + 0.45 * Math.sin(s.phase + t * 0.0006 * s.speed);
        ctx.globalAlpha = 0.25 + tw * 0.55;
        ctx.fillStyle = "#cfd9ec";
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!reduced) {
        /* one satellite, one pass every ~46s, shallow arc */
        const period = 46000;
        const p = (t % period) / period;
        const sx = -0.05 + p * 1.1;
        const sy = 0.3 - Math.sin(p * Math.PI) * 0.13;
        ctx.strokeStyle = "rgba(207, 217, 236, 0.18)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo((sx - 0.045) * w, (sy + 0.012) * h);
        ctx.lineTo(sx * w, sy * h);
        ctx.stroke();
        ctx.fillStyle = "#e6edf9";
        ctx.beginPath();
        ctx.arc(sx * w, sy * h, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (reduced) {
      draw(0);
      return () => window.removeEventListener("resize", resize);
    }

    let raf = 0;
    const tick = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="l5-sky" aria-hidden />;
}

/* the city, asleep at the horizon */
function Skyline() {
  return (
    <svg
      className="l5-skyline"
      viewBox="0 0 1200 110"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 96 H80 V74 H96 V96 H150 V60 H160 L166 38 L172 60 H180 V96 H260 V70 H300 V96 H340
           L380 50 L420 96 H470 V66 H482 V96 H560 V44 H572 V30 H580 V44 H592 V96 H680 V78 H720 V96
           H780 L800 20 L820 96 H880 V72 H930 V96 H1000 V58 H1014 V96 H1080 V80 H1120 V96 H1200"
        fill="none"
        stroke="rgba(180, 196, 224, 0.34)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      {/* a handful of windows still lit — the shift */}
      {[
        [88, 82], [163, 70], [414, 88], [566, 56], [576, 50],
        [800, 60], [806, 76], [1006, 72],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="3" height="3" fill="#cfd9ec" opacity="0.5" />
      ))}
    </svg>
  );
}

/* ── the page ────────────────────────────────────────── */

export default function NightShift({
  projects,
  log,
}: {
  projects: SlimNode[];
  log: LogRow[];
}) {
  const { clock, onShift } = useSfTime();

  return (
    <div className="l5-root">
      <Sky />

      <header className="l5-bar">
        <span className="l5-brand">GAM — NIGHT OPERATIONS</span>
        <span className="l5-shift" data-on={onShift === true}>
          {onShift === null
            ? "READING THE CLOCK…"
            : onShift
              ? "SHIFT IN PROGRESS"
              : "OPERATOR AWAKE — SHIFT RESUMES 20:00 PT"}
        </span>
        <span className="l5-clock">
          SAN FRANCISCO <b suppressHydrationWarning>{clock}</b>
        </span>
      </header>

      <section className="l5-hero">
        <p className="l5-eyebrow">THE NIGHT SHIFT · HOURS 20:00 — 06:00 PT</p>
        <h1>
          Autonomous imagination,
          <br />
          harnessed while you sleep.
        </h1>
        <p className="l5-sub">
          Build fast, adapt faster — then hand the night to the systems.
          Probabilistic imagination, deterministic execution, nobody at the
          desk.
        </p>
      </section>

      <div className="l5-ground">
        <Skyline />

        <div className="l5-floor">
          <section className="l5-panel" aria-label="Tonight's roster">
            <h2 className="l5-panel-head">ON THE ROSTER TONIGHT</h2>
            {projects.map((p) => (
              <Link
                key={p.slug}
                href={p.href}
                className="l5-row"
                style={{ "--c": p.accent } as React.CSSProperties}
              >
                <span className={`l5-dot ${p.live ? "is-live" : ""}`} aria-hidden />
                <span className="l5-row-title">{p.title}</span>
                <span className="l5-row-domain">{p.domain}</span>
                <span className="l5-row-duty">
                  {p.live ? "on shift — unattended" : "on call"}
                </span>
              </Link>
            ))}
          </section>

          <section className="l5-panel" aria-label="Overnight log">
            <h2 className="l5-panel-head">WHILE YOU SLEPT</h2>
            {log.map((e) => (
              <Link
                key={`${e.href}-${e.date}`}
                href={e.href}
                className="l5-row l5-row-log"
                style={{ "--c": e.accent } as React.CSSProperties}
              >
                <span className="l5-log-date">{e.date}</span>
                <span className="l5-row-title">{e.title}</span>
                <span className="l5-row-duty">{e.kind}</span>
              </Link>
            ))}
            <p className="l5-log-note">
              every line above is a real write in the archive
            </p>
          </section>
        </div>

        <footer className="l5-foot">
          <Link href="/" className="l5-wake">
            WAKE THE ARCHIVE →
          </Link>
          <nav className="l5-exits" aria-label="Sections">
            <Link href="/projects">PROJECTS</Link>
            <Link href="/writing">WRITING</Link>
            <Link href="/method">METHOD</Link>
            <Link href="/about">ABOUT</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
