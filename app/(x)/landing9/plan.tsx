"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SlimNode } from "../data";

interface MethodLine {
  title: string;
  thesis: string;
  status: string;
}

type Sel =
  | { kind: "project"; slug: string }
  | { kind: "method" }
  | { kind: "writing" };

/* room geometry — corridor is the cross in the middle */
const ROOMS: {
  slug: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  labelY?: number;
}[] = [
  { slug: "grocery-buddy", label: "KITCHEN", x: 60, y: 60, w: 340, h: 270 },
  { slug: "procurement-agent", label: "MAIL ROOM & VAULT", x: 60, y: 396, w: 340, h: 264 },
  { slug: "jim", label: "STUDY", x: 760, y: 60, w: 340, h: 270 },
  { slug: "dj-agent", label: "THE BOOTH", x: 760, y: 396, w: 340, h: 264 },
];

export default function Plan({
  projects,
  writing,
  method,
  rev,
}: {
  projects: SlimNode[];
  writing: SlimNode[];
  method: MethodLine;
  rev: string;
}) {
  const router = useRouter();
  const [sel, setSel] = useState<Sel>({ kind: "method" });
  const bySlug = useMemo(
    () => new Map(projects.map((p) => [p.slug, p] as const)),
    [projects]
  );

  const open = (href: string) => () => router.push(href);
  const roomKey = (slug: string) =>
    sel.kind === "project" && sel.slug === slug;

  const panel = (() => {
    if (sel.kind === "method")
      return {
        tag: "THE CORRIDOR",
        title: method.title,
        meta: `META · ${method.status}`,
        line: `${method.thesis} Every room opens onto it: one contract, the skills, four hooks on the rim.`,
        href: "/method",
        accent: "var(--color-ember)",
        cta: "WALK THE CORRIDOR →",
      };
    if (sel.kind === "writing")
      return {
        tag: "THE READING NOOK",
        title: "Two essays on the shelf",
        meta: "POST · POST",
        line: writing.map((w) => `“${w.line}”`).join(" / "),
        href: "/writing",
        accent: "var(--color-post)",
        cta: "SIT DOWN WITH THEM →",
      };
    const p = bySlug.get(sel.slug)!;
    return {
      tag: ROOMS.find((r) => r.slug === p.slug)?.label ?? "ROOM",
      title: `N°${p.no} — ${p.title}`,
      meta: `${p.domain} · ${p.tag} · ${p.status}${p.updated ? ` · LAST WRITE ${p.updated}` : ""}`,
      line: p.line,
      href: p.href,
      accent: p.accent,
      cta: "ENTER THE ROOM →",
    };
  })();

  return (
    <div className="l9-site">
      <header className="l9-bar">
        <span className="l9-brand">THE OPERATION — PLAN VIEW</span>
        <span className="l9-bar-dim">
          FOUR AGENTS, ONE HOUSEHOLD · HOVER A ROOM, ENTER TO OPEN
        </span>
        <span className="l9-bar-dim l9-bar-right">REV {rev}</span>
      </header>

      <div className="l9-sheet">
        <svg
          className="l9-plan"
          viewBox="0 0 1160 760"
          role="group"
          aria-label="Floor plan of the operation"
        >
          {/* paper grid */}
          <defs>
            <pattern id="l9grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="rgba(214,222,235,0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="1160" height="760" fill="url(#l9grid)" />

          {/* outer walls — double line */}
          <rect x="48" y="48" width="1064" height="624" className="l9-wall-heavy" />
          <rect x="60" y="60" width="1040" height="600" className="l9-wall" />

          {/* interior walls around the corridor cross, with door gaps */}
          {/* kitchen right wall */}
          <path d="M400 60 V200 M400 260 V330" className="l9-wall" />
          {/* vault right wall */}
          <path d="M400 396 V460 M400 520 V660" className="l9-wall" />
          {/* study left wall */}
          <path d="M760 60 V200 M760 260 V330" className="l9-wall" />
          {/* booth left wall */}
          <path d="M760 396 V460 M760 520 V660" className="l9-wall" />
          {/* horizontal corridor walls */}
          <path d="M60 330 H180 M240 330 H400 M760 330 H920 M980 330 H1100" className="l9-wall" />
          <path d="M60 396 H180 M240 396 H400 M760 396 H920 M980 396 H1100" className="l9-wall" />

          {/* door swings into the corridor */}
          <path d="M400 200 a60 60 0 0 1 60 60" className="l9-door" />
          <path d="M400 520 a60 60 0 0 0 60 -60" className="l9-door" />
          <path d="M760 200 a60 60 0 0 0 -60 60" className="l9-door" />
          <path d="M760 520 a60 60 0 0 1 -60 -60" className="l9-door" />
          <path d="M240 330 a60 60 0 0 1 -60 60" className="l9-door" />
          <path d="M980 330 a60 60 0 0 0 60 60" className="l9-door" />

          {/* ── rooms ─────────────────────────────────── */}
          {ROOMS.map((r) => {
            const p = bySlug.get(r.slug);
            if (!p) return null;
            const hot = roomKey(r.slug);
            return (
              <g
                key={r.slug}
                className={`l9-room ${hot ? "is-hot" : ""}`}
                style={{ "--c": p.accent } as React.CSSProperties}
                tabIndex={0}
                role="button"
                aria-label={`${r.label} — ${p.title}`}
                onMouseEnter={() => setSel({ kind: "project", slug: r.slug })}
                onFocus={() => setSel({ kind: "project", slug: r.slug })}
                onClick={open(p.href)}
                onKeyDown={(e) => e.key === "Enter" && open(p.href)()}
              >
                <rect x={r.x} y={r.y} width={r.w} height={r.h} className="l9-room-fill" />
                <text x={r.x + 18} y={r.y + 34} className="l9-room-label">
                  {r.label}
                </text>
                <text x={r.x + 18} y={r.y + 52} className="l9-room-sub">
                  {p.title.toUpperCase()} · {p.status}
                </text>

                {/* furniture, per tenant */}
                {r.slug === "grocery-buddy" && (
                  <g className="l9-furn">
                    {[0, 1, 2, 3].map((i) => (
                      <line key={i} x1={r.x + 22} y1={r.y + 86 + i * 16} x2={r.x + 120} y2={r.y + 86 + i * 16} />
                    ))}
                    <rect x={r.x + 170} y={r.y + 120} width="120" height="64" />
                    <circle cx={r.x + 230} cy={r.y + 152} r="10" />
                    <text x={r.x + 22} y={r.y + 170} className="l9-furn-note">PANTRY</text>
                  </g>
                )}
                {r.slug === "procurement-agent" && (
                  <g className="l9-furn">
                    <rect x={r.x + 30} y={r.y + 90} width="74" height="74" />
                    <circle cx={r.x + 67} cy={r.y + 127} r="18" />
                    <line x1={r.x + 67} y1={r.y + 113} x2={r.x + 67} y2={r.y + 127} />
                    <text x={r.x + 30} y={r.y + 188} className="l9-furn-note">SAFE — ONE CARD AT A TIME</text>
                    <rect x={r.x + 200} y={r.y + 96} width="60" height="8" />
                    <text x={r.x + 200} y={r.y + 124} className="l9-furn-note">MAIL SLOT</text>
                  </g>
                )}
                {r.slug === "jim" && (
                  <g className="l9-furn">
                    <rect x={r.x + 40} y={r.y + 100} width="150" height="60" />
                    {[0, 1, 2].map((i) => (
                      <line key={i} x1={r.x + 56} y1={r.y + 118 + i * 12} x2={r.x + 150} y2={r.y + 118 + i * 12} />
                    ))}
                    <circle cx={r.x + 115} cy={r.y + 190} r="14" />
                    <text x={r.x + 40} y={r.y + 230} className="l9-furn-note">DESK — THE LEDGER</text>
                  </g>
                )}
                {r.slug === "dj-agent" && (
                  <g className="l9-furn">
                    <circle cx={r.x + 80} cy={r.y + 130} r="30" />
                    <circle cx={r.x + 80} cy={r.y + 130} r="4" />
                    <circle cx={r.x + 250} cy={r.y + 130} r="30" />
                    <circle cx={r.x + 250} cy={r.y + 130} r="4" />
                    <rect x={r.x + 130} y={r.y + 108} width="70" height="44" />
                    <text x={r.x + 50} y={r.y + 196} className="l9-furn-note">DECKS — THE CRITIC LISTENS FIRST</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ── the corridor = the method ─────────────── */}
          <g
            className={`l9-room l9-corridor ${sel.kind === "method" ? "is-hot" : ""}`}
            style={{ "--c": "var(--color-ember)" } as React.CSSProperties}
            tabIndex={0}
            role="button"
            aria-label="The corridor — the method"
            onMouseEnter={() => setSel({ kind: "method" })}
            onFocus={() => setSel({ kind: "method" })}
            onClick={open("/method")}
            onKeyDown={(e) => e.key === "Enter" && open("/method")()}
          >
            <polygon
              points="400,60 760,60 760,330 1100,330 1100,396 760,396 760,660 400,660 400,396 60,396 60,330 400,330"
              className="l9-room-fill"
            />
            <text x="580" y="100" className="l9-room-label" textAnchor="middle">
              THE CORRIDOR
            </text>
            <text x="580" y="118" className="l9-room-sub" textAnchor="middle">
              {`${method.title.toUpperCase()} · ${method.status}`}
            </text>
            {/* four hooks on the rim — literally */}
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={520 + i * 32} y={140} width="10" height="10" className="l9-hook" />
            ))}
            <text x="580" y="172" className="l9-furn-note" textAnchor="middle">
              4 HOOKS ON THE RIM
            </text>
            {/* flow chevrons down the hall */}
            {[210, 250, 290].map((y) => (
              <path key={y} d={`M570 ${y} l10 10 l10 -10`} className="l9-furn-line" />
            ))}
          </g>

          {/* ── reading nook (writing) ────────────────── */}
          <g
            className={`l9-room ${sel.kind === "writing" ? "is-hot" : ""}`}
            style={{ "--c": "var(--color-post)" } as React.CSSProperties}
            tabIndex={0}
            role="button"
            aria-label="Reading nook — the writing"
            onMouseEnter={() => setSel({ kind: "writing" })}
            onFocus={() => setSel({ kind: "writing" })}
            onClick={open("/writing")}
            onKeyDown={(e) => e.key === "Enter" && open("/writing")()}
          >
            <rect x="460" y="480" width="240" height="180" className="l9-room-fill l9-nook" />
            <text x="478" y="512" className="l9-room-label">READING NOOK</text>
            <rect x="478" y="540" width="14" height="54" className="l9-book" />
            <rect x="498" y="548" width="14" height="46" className="l9-book" />
            <ellipse cx="600" cy="610" rx="64" ry="26" className="l9-furn-line" />
            <text x="478" y="636" className="l9-furn-note">TWO ESSAYS, READ IN HOUSE</text>
          </g>

          {/* annotations */}
          <g className="l9-dim">
            <line x1="60" y1="708" x2="1100" y2="708" />
            <line x1="60" y1="700" x2="60" y2="716" />
            <line x1="1100" y1="700" x2="1100" y2="716" />
            <text x="580" y="734" textAnchor="middle">
              PLAN IS CONCEPTUAL — THE SYSTEMS ARE REAL. SCALE: NONE.
            </text>
          </g>
          <g className="l9-compass">
            <circle cx="1124" cy="96" r="16" />
            <path d="M1124 108 V84 l-5 8" />
            <text x="1124" y="132" textAnchor="middle">N</text>
          </g>
        </svg>

        {/* ── the placard panel ───────────────────────── */}
        <aside
          className="l9-panel"
          style={{ "--c": panel.accent } as React.CSSProperties}
          aria-live="polite"
        >
          <p className="l9-panel-tag">{panel.tag}</p>
          <h1 className="l9-panel-title">{panel.title}</h1>
          <p className="l9-panel-meta">{panel.meta}</p>
          <p className="l9-panel-line">{panel.line}</p>
          <Link href={panel.href} className="l9-panel-open">
            {panel.cta}
          </Link>

          <div className="l9-titleblock">
            <p>DRAWING — THE OPERATION, PLAN VIEW</p>
            <p>DRAWN BY: G. ANDRADE-MUÑOZ</p>
            <p>DOCTRINE: BUILD FAST, ADAPT FASTER</p>
            <p>REV: {rev}</p>
          </div>
        </aside>
      </div>

      <footer className="l9-exits">
        <Link href="/projects">ALL ROOMS — PROJECTS</Link>
        <Link href="/writing">THE SHELF — WRITING</Link>
        <Link href="/method">THE CORRIDOR — METHOD</Link>
        <Link href="/about">THE RESIDENT — ABOUT</Link>
        <Link href="/" className="l9-exit-main">
          FRONT DOOR →
        </Link>
      </footer>
    </div>
  );
}
