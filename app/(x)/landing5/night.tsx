"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { SlimNode } from "../data";

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

/* the wind — layered waves, evolving slowly with time */
function field(x: number, y: number, t: number) {
  return (
    Math.sin(y * 0.0017 + t * 0.00011) * 1.7 +
    Math.cos(x * 0.0013 - t * 0.00008) * 1.3 +
    Math.sin((x + y) * 0.0006 + t * 0.00005) * 0.8
  );
}

function FieldCanvas() {
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

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      cvs.width = w * dpr;
      cvs.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#070a12";
      ctx.fillRect(0, 0, w, h);
    };
    resize();

    /* still air for reduced motion: one frame of the field, no loop */
    if (reduced) {
      ctx.strokeStyle = "rgba(170, 195, 215, 0.16)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 26) {
        for (let gy = 0; gy < h; gy += 26) {
          const a = field(gx, gy, 0);
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx + Math.cos(a) * 9, gy + Math.sin(a) * 9);
          ctx.stroke();
        }
      }
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }

    const rand = mulberry32(20260611);
    const N = 700;
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const vx = new Float32Array(N);
    const vy = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      px[i] = rand() * w;
      py[i] = rand() * h;
    }

    const pointer = { x: -9999, y: -9999 };
    let pulse: { x: number; y: number; t0: number } | null = null;

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    const onDown = (e: PointerEvent) => {
      pulse = { x: e.clientX, y: e.clientY, t0: performance.now() };
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", resize);

    let raf = 0;
    const tick = (t: number) => {
      /* trails: fade the last frame instead of clearing it */
      ctx.fillStyle = "rgba(7, 10, 18, 0.055)";
      ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = 1;

      const pulseAge = pulse ? t - pulse.t0 : Infinity;
      const pulseAlive = pulseAge < 700;

      for (let i = 0; i < N; i++) {
        const a = field(px[i], py[i], t);
        vx[i] = vx[i] * 0.88 + Math.cos(a) * 0.42;
        vy[i] = vy[i] * 0.88 + Math.sin(a) * 0.42;

        /* the cursor is weather — a soft vortex around the pointer */
        const dx = px[i] - pointer.x;
        const dy = py[i] - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 22500) {
          const d = Math.sqrt(d2) + 0.001;
          const f = (1 - d / 150) * 2.1;
          vx[i] += (-dy / d) * f + (dx / d) * f * 0.35;
          vy[i] += (dx / d) * f + (dy / d) * f * 0.35;
        }

        /* a click is a pressure front */
        if (pulseAlive && pulse) {
          const qx = px[i] - pulse.x;
          const qy = py[i] - pulse.y;
          const qd = Math.sqrt(qx * qx + qy * qy) + 0.001;
          const ring = pulseAge * 0.55;
          const band = Math.exp(-((qd - ring) * (qd - ring)) / 1800);
          const decay = 1 - pulseAge / 700;
          vx[i] += (qx / qd) * band * decay * 4.5;
          vy[i] += (qy / qd) * band * decay * 4.5;
        }

        const ox = px[i];
        const oy = py[i];
        px[i] += vx[i];
        py[i] += vy[i];

        if (px[i] < -10) px[i] = w + 10;
        else if (px[i] > w + 10) px[i] = -10;
        if (py[i] < -10) py[i] = h + 10;
        else if (py[i] > h + 10) py[i] = -10;
        else {
          const speed = Math.min(Math.abs(vx[i]) + Math.abs(vy[i]), 4);
          ctx.strokeStyle = `rgba(172, 198, 218, ${0.05 + speed * 0.045})`;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(px[i], py[i]);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="l5-canvas" aria-hidden />;
}

export default function NightShift({
  projects,
  writing,
}: {
  projects: SlimNode[];
  writing: SlimNode[];
}) {
  const live = projects.filter((p) => p.live).length;

  return (
    <div className="l5-root">
      <FieldCanvas />

      <header className="l5-corner l5-tl">
        <p>George Andrade-Muñoz</p>
        <p className="l5-dim">engineer · san francisco</p>
      </header>

      <aside className="l5-corner l5-tr">
        <p className="l5-dim">field notes</p>
        {writing.map((w) => (
          <Link key={w.slug} href={w.href} className="l5-note">
            {w.title} <span className="l5-dim">— {w.date.slice(0, 7)}</span>
          </Link>
        ))}
      </aside>

      <section className="l5-center">
        <p className="l5-eyebrow">the night shift</p>
        <h1>
          while you sleep,
          <br />
          the archive operates.
        </h1>
        <p className="l5-sub">
          build fast, adapt faster — {live} of {projects.length} instruments
          reporting live right now. drag the air. press it.
        </p>
      </section>

      <Link href="/" className="l5-exit">
        enter the archive →
      </Link>

      <footer className="l5-instruments" aria-label="Instruments">
        {projects.map((p) => (
          <Link
            key={p.slug}
            href={p.href}
            className="l5-instr"
            style={{ "--c": p.accent } as React.CSSProperties}
          >
            <span className="l5-instr-head">
              <span className={`l5-instr-dot ${p.live ? "is-live" : ""}`} aria-hidden />
              {p.title}
            </span>
            <span className="l5-instr-domain">{p.domain}</span>
            <span className="l5-instr-status">{p.status}</span>
            <span className="l5-instr-line">{p.line}</span>
          </Link>
        ))}
      </footer>
    </div>
  );
}
