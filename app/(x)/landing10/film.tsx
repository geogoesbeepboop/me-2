"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import type { SlimNode } from "../data";

/* scroll progress → SMPTE-ish timecode over a 92s reel @ 24fps */
function tc(v: number) {
  const t = Math.max(0, Math.min(1, v)) * 92;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const f = Math.floor((t % 1) * 24);
  const p = (n: number) => String(n).padStart(2, "0");
  return `00:${p(m)}:${p(s)}:${p(f)}`;
}

/* ── one act per system ──────────────────────────────── */

function Act({
  p,
  index,
  onEnter,
}: {
  p: SlimNode;
  index: number;
  onEnter: (label: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const dir = index % 2 === 0 ? 1 : -1;
  const x = useTransform(scrollYProgress, [0, 1], [`${8 * dir}vw`, `${-8 * dir}vw`]);
  const numY = useTransform(scrollYProgress, [0, 1], ["-14%", "14%"]);
  const opacity = useTransform(scrollYProgress, [0.08, 0.3, 0.7, 0.92], [0, 1, 1, 0]);

  return (
    <section
      ref={ref}
      className={`l10-act ${index % 2 === 0 ? "is-left" : "is-right"}`}
      style={{ "--c": p.accent } as React.CSSProperties}
    >
      <motion.div
        className="l10-act-frame"
        onViewportEnter={() => onEnter(`ACT ${index + 1} — ${p.title.toUpperCase()}`)}
        viewport={{ amount: 0.5 }}
      >
        <motion.span
          className="l10-numeral"
          style={reduced ? undefined : { y: numY }}
          aria-hidden
        >
          {String(index + 1).padStart(2, "0")}
        </motion.span>
        <motion.div
          className="l10-act-content"
          style={reduced ? undefined : { x, opacity }}
        >
          <p className="l10-eyebrow">
            ACT {index + 1} · {p.domain} · N°{p.no}
          </p>
          <h2 className="l10-act-title">{p.title}</h2>
          <p className="l10-act-line">{p.line}</p>
          <p className="l10-stamp">
            <span className="l10-stamp-status">{p.status}</span>
            <span>{p.year ?? (p.updated ?? p.date).slice(0, 4)}</span>
            <span>{p.tag}</span>
          </p>
          <Link href={p.href} className="l10-view">
            VIEW SCENE →
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ── the film ────────────────────────────────────────── */

export default function Film({
  acts,
  essays,
}: {
  acts: SlimNode[];
  essays: SlimNode[];
}) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const timecode = useTransform(scrollYProgress, tc);
  const [scene, setScene] = useState("COLD OPEN");

  const openRef = useRef<HTMLElement>(null);
  const { scrollYProgress: openP } = useScroll({
    target: openRef,
    offset: ["start start", "end end"],
  });
  /* a hard cut, not a crossfade — cinema doesn't ease between setups */
  const w1 = useTransform(openP, (v) => (v < 0.42 ? 1 : 0));
  const w2 = useTransform(openP, (v) => (v >= 0.42 && v < 0.85 ? 1 : 0));
  const card = useTransform(openP, (v) => (v >= 0.85 ? 1 : 0));
  const w1s = useTransform(openP, [0, 0.42], [0.96, 1.02]);
  const w2s = useTransform(openP, [0.42, 0.85], [0.96, 1.02]);

  return (
    <div className="l10-theater">
      {/* letterbox */}
      <div className="l10-bar l10-bar-top">
        <span>GAM PICTURES</span>
        <span className="l10-scene" suppressHydrationWarning>
          {scene}
        </span>
        <motion.span className="l10-tc">{timecode}</motion.span>
      </div>
      <div className="l10-bar l10-bar-bottom">
        <span>GEORGE ANDRADE-MUÑOZ — A PRACTICE, IN ACTS</span>
        <span className="l10-bar-right">SCROLL TO RUN THE REEL</span>
      </div>
      <div className="l10-grain" aria-hidden />

      {/* cold open — three setups, hard cuts; flat stack under reduced motion */}
      {reduced ? (
        <section ref={openRef} className="l10-open-static" aria-label="Cold open">
          <h1 className="l10-open-word">
            BUILD FAST,
            <br />
            ADAPT FASTER.
          </h1>
          <div className="l10-title-card">
            <p className="l10-eyebrow">GAM PICTURES PRESENTS</p>
            <p className="l10-presents">THE SYSTEMS ARCHIVE</p>
            <p className="l10-sub">
              four operating systems · two essays · one method
            </p>
          </div>
        </section>
      ) : (
        <section ref={openRef} className="l10-open" aria-label="Cold open">
          <div className="l10-sticky">
            <motion.h1 className="l10-open-word" style={{ opacity: w1, scale: w1s }}>
              BUILD
              <br />
              FAST,
            </motion.h1>
            <motion.h1
              className="l10-open-word"
              style={{ opacity: w2, scale: w2s }}
            >
              ADAPT
              <br />
              FASTER.
            </motion.h1>
            <motion.div className="l10-title-card" style={{ opacity: card }}>
              <p className="l10-eyebrow">GAM PICTURES PRESENTS</p>
              <p className="l10-presents">THE SYSTEMS ARCHIVE</p>
              <p className="l10-sub">
                four operating systems · two essays · one method
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* acts */}
      {acts.map((p, i) => (
        <Act key={p.slug} p={p} index={i} onEnter={setScene} />
      ))}

      {/* intermission — the essays */}
      <section className="l10-intermission">
        <motion.div
          onViewportEnter={() => setScene("INTERMISSION")}
          viewport={{ amount: 0.5 }}
        >
          <p className="l10-eyebrow">INTERMISSION — THE ESSAYS</p>
          <div className="l10-essays">
            {essays.map((w) => (
              <Link key={w.slug} href={w.href} className="l10-essay">
                <p className="l10-essay-quote">“{w.line}”</p>
                <p className="l10-essay-credit">
                  {w.title} · {w.readingTime} MIN
                </p>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>

      {/* credits — all real */}
      <section className="l10-credits" aria-label="Credits">
        <motion.div
          onViewportEnter={() => setScene("CREDITS")}
          viewport={{ amount: 0.2 }}
        >
          <p className="l10-credit-head">CREDITS</p>
          {acts.map((p) => (
            <div key={p.slug} className="l10-credit">
              <p className="l10-credit-role">
                {p.title.toUpperCase()} — {p.status}
              </p>
              <p className="l10-credit-name">
                {p.role ?? "operator: George Andrade-Muñoz"}
              </p>
              {p.stack && (
                <p className="l10-credit-with">with {p.stack.join(" · ")}</p>
              )}
            </div>
          ))}
          <div className="l10-credit">
            <p className="l10-credit-role">WRITTEN, BUILT & SCORED BY</p>
            <p className="l10-credit-name">George Andrade-Muñoz</p>
          </div>
          <div className="l10-credit">
            <p className="l10-credit-role">SHOT ON LOCATION IN</p>
            <p className="l10-credit-name">San Francisco</p>
          </div>
          <div className="l10-credit">
            <p className="l10-credit-role">DISCLAIMER</p>
            <p className="l10-credit-name">
              every number traces to a source repo
            </p>
          </div>

          <div className="l10-end">
            <p className="l10-end-motto">
              BUILD FAST,
              <br />
              ADAPT FASTER.
            </p>
            <div className="l10-end-row">
              <Link href="/" className="l10-cta">
                ENTER THE ARCHIVE →
              </Link>
              <Link href="/projects" className="l10-cta l10-cta-ghost">
                FULL PROGRAMME
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
