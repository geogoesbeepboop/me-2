"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface CardData {
  slug: string;
  no: string;
  title: string;
  tag: string;
  line: string;
  date: string;
  accent: string;
  href: string;
}

/* where each card hangs before anyone touches the board (fractions) */
const HOME: Record<string, { x: number; y: number }> = {
  "four-agents-one-nervous-system": { x: 0.42, y: 0.34 },
  "ship-the-how": { x: 0.38, y: 0.78 },
  "dj-agent": { x: 0.04, y: 0.14 },
  "grocery-buddy": { x: 0.74, y: 0.08 },
  jim: { x: 0.06, y: 0.64 },
  "procurement-agent": { x: 0.76, y: 0.58 },
};
const FALLBACK = [
  { x: 0.32, y: 0.18 }, { x: 0.6, y: 0.3 }, { x: 0.3, y: 0.5 },
  { x: 0.64, y: 0.7 }, { x: 0.2, y: 0.8 }, { x: 0.5, y: 0.12 },
];

const PIN_Y = 12;

export default function Wall({
  cards,
  edges,
  interests,
}: {
  cards: CardData[];
  edges: [number, number][];
  interests: string[];
}) {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 720 });
  const [frac, setFrac] = useState(() =>
    cards.map((c, i) => HOME[c.slug] ?? FALLBACK[i % FALLBACK.length])
  );
  const [hot, setHot] = useState<number | null>(null);
  const drag = useRef<{
    i: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const measure = () =>
      setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cardW = size.w < 700 ? 136 : 172;
  const px = (i: number) => ({
    x: frac[i].x * (size.w - cardW),
    y: frac[i].y * (size.h - 130),
  });
  const anchor = (i: number) => {
    const p = px(i);
    return { x: p.x + cardW / 2, y: p.y + PIN_Y };
  };

  const onPointerDown = (i: number) => (e: React.PointerEvent) => {
    const p = px(i);
    drag.current = {
      i,
      startX: e.clientX,
      startY: e.clientY,
      origX: p.x,
      origY: p.y,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    const nx = Math.min(Math.max(d.origX + dx, 0), size.w - cardW);
    const ny = Math.min(Math.max(d.origY + dy, 0), size.h - 130);
    setFrac((prev) =>
      prev.map((f, k) =>
        k === d.i
          ? { x: nx / (size.w - cardW), y: ny / (size.h - 130) }
          : f
      )
    );
  };
  const onPointerUp = (i: number) => () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) router.push(cards[i].href);
  };

  const tidy = () =>
    setFrac(cards.map((c, i) => HOME[c.slug] ?? FALLBACK[i % FALLBACK.length]));

  const stickies = interests.slice(0, 4);

  return (
    <div className="l11-room">
      <div className="l11-lamp" aria-hidden />

      <header className="l11-bar">
        <span className="l11-brand">THE WALL — HOW IT ALL CONNECTS</span>
        <span className="l11-bar-dim">
          DRAG THE CARDS · CLICK ONE TO OPEN ITS FILE
        </span>
        <button className="l11-tidy" onClick={tidy}>
          TIDY THE BOARD
        </button>
      </header>

      <div className="l11-board" ref={boardRef}>
        {/* the strings — every one a real refs: line */}
        <svg
          className="l11-strings"
          width={size.w}
          height={size.h}
          aria-hidden
        >
          {edges.map(([a, b], k) => {
            const p1 = anchor(a);
            const p2 = anchor(b);
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const mx = (p1.x + p2.x) / 2;
            const my = Math.max(p1.y, p2.y) + dist * 0.09 + 14; // gravity
            const lit = hot === null || hot === a || hot === b;
            return (
              <path
                key={k}
                d={`M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}`}
                className={`l11-string ${lit ? "" : "is-dim"}`}
              />
            );
          })}
        </svg>

        {/* the cards */}
        {cards.map((c, i) => {
          const p = px(i);
          const tilt = ((i * 53) % 5) - 2; // deterministic, slightly crooked
          return (
            <article
              key={c.slug}
              className={`l11-card ${hot === i ? "is-hot" : ""}`}
              style={
                {
                  left: p.x,
                  top: p.y,
                  width: cardW,
                  "--tilt": `${tilt}deg`,
                  "--c": c.accent,
                } as React.CSSProperties
              }
              onPointerDown={onPointerDown(i)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp(i)}
              onMouseEnter={() => setHot(i)}
              onMouseLeave={() => setHot(null)}
              tabIndex={0}
              role="button"
              aria-label={`${c.title} — open file`}
              onKeyDown={(e) => e.key === "Enter" && router.push(c.href)}
            >
              <span className="l11-pin" aria-hidden />
              <p className="l11-card-no">
                N°{c.no} · {c.tag}
              </p>
              <h2 className="l11-card-title">{c.title}</h2>
              <p className="l11-card-line">{c.line}</p>
              <p className="l11-card-date">{c.date}</p>
            </article>
          );
        })}

        {/* stickies — the person behind the board */}
        {stickies.map((s, i) => (
          <p
            key={s}
            className="l11-sticky"
            style={
              {
                left: `${[2, 88, 1.5, 89][i]}%`,
                top: `${[6, 8, 84, 80][i]}%`,
                "--tilt": `${[-3, 2.5, 2, -2][i]}deg`,
              } as React.CSSProperties
            }
          >
            {s}
          </p>
        ))}
      </div>

      <footer className="l11-ledge">
        <p className="l11-legend">
          EVERY RED STRING IS A <b>refs:</b> LINE IN THE FRONTMATTER — THE
          GRAPH IS REAL, ONLY THE PINS ARE PROPS.
        </p>
        <nav className="l11-exits" aria-label="Sections">
          <Link href="/projects">PROJECTS</Link>
          <Link href="/writing">WRITING</Link>
          <Link href="/method">METHOD</Link>
          <Link href="/about">ABOUT</Link>
          <Link href="/" className="l11-exit-main">
            STEP BACK →
          </Link>
        </nav>
      </footer>
    </div>
  );
}
