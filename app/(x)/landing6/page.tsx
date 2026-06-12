import type { Metadata } from "next";
import Link from "next/link";
import { archive } from "../data";
import "./l6.css";

export const metadata: Metadata = {
  title: "Landing Nº6 — The Systems Bulletin",
  description:
    "Exploration: the practice as a morning broadsheet. Ink on paper; every figure still traces to a repo.",
  robots: { index: false },
};

/**
 * Nº6 — THE SYSTEMS BULLETIN.
 * The hard break: light mode, serif, justified columns, no motion at
 * all. The archive rewritten as front-page news — headlines, datelines,
 * jump lines, classifieds. Every headline is a restatement of real
 * frontmatter; the numbers box is the real metrics list.
 */

const MONTHS_LONG = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

function longDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS_LONG[m - 1]} ${d}, ${y}`;
}

/* headlines — each a compression of the entry's own summary/thesis */
const HEADLINES: Record<string, string> = {
  "dj-agent":
    "DJ Agent Plans Beatmatched Sets; Deterministic Critic Holds the Door",
  "grocery-buddy":
    "Pantry Now Runs Itself Over Telegram — Human Keeps the Final Tap",
  "procurement-agent":
    "Household Errands Paid With Cards Born for One Purchase; Model Never Holds Them",
  jim: "Analyst Sells Cited Research for Micropayments — and Buys Its Own Data the Same Way",
};

export default function Landing6() {
  const { projects, writing, method, about } = archive();
  const [lead, ...rest] = projects;
  const edition = projects
    .map((p) => p.updated ?? p.date)
    .sort()
    .at(-1)!;

  return (
    <div className="l6-root">
      <div className="l6-paper">
        {/* ── masthead ─────────────────────────────── */}
        <header className="l6-masthead">
          <div className="l6-ears">
            <p className="l6-ear">
              MOTTO —<br />
              “Build fast,
              <br />
              adapt faster.”
            </p>
            <div className="l6-title-block">
              <p className="l6-overline">THE SYSTEMS ARCHIVE OF GEORGE ANDRADE-MUÑOZ, ENGINEER</p>
              <h1 className="l6-title">The Systems Bulletin</h1>
              <p className="l6-dateline-row">
                VOL. I &nbsp;·&nbsp; SAN FRANCISCO — EDITION OF {longDate(edition)}
                &nbsp;·&nbsp; PUBLISHED WHENEVER SOMETHING SHIPS
              </p>
            </div>
            <p className="l6-ear l6-ear-r">
              PRICE: FREE.
              <br />
              THE HOW IS
              <br />
              PUBLISHED.
            </p>
          </div>
        </header>

        {/* ── front page ───────────────────────────── */}
        <div className="l6-front">
          {/* lead story */}
          <article className="l6-lead">
            <Link href={lead.href} className="l6-headline-link">
              <h2 className="l6-headline">{HEADLINES[lead.slug] ?? lead.title}</h2>
            </Link>
            <p className="l6-deck">{lead.line}</p>
            <p className="l6-byline">
              By GEORGE ANDRADE-MUÑOZ — Special to the Bulletin
            </p>
            <div className="l6-body l6-dropcap">
              <p>
                <span className="l6-place">SAN FRANCISCO, {longDate(lead.date)} —</span>{" "}
                {lead.summary}
              </p>
              <p>
                The system is filed under {lead.domain?.toLowerCase()}, carries
                archive number {lead.no}, and reports a status of{" "}
                {lead.status.toLowerCase()}
                {lead.updated
                  ? `; its file was last written ${longDate(lead.updated)}.`
                  : "."}{" "}
                Like everything in the archive, the entry publishes its own
                construction: the architecture, the failures, and the
                constraints that held.
              </p>
              <p className="l6-jump">
                (Continued at {lead.href.slice(1)}, col. 1)
              </p>
            </div>
          </article>

          {/* the wire — full index */}
          <aside className="l6-wire">
            <h3 className="l6-section-head">THE WIRE</h3>
            <p className="l6-wire-note">All files, newest first.</p>
            {[...projects, ...writing]
              .sort((a, b) => Number(b.no) - Number(a.no))
              .map((n) => (
                <Link key={n.slug} href={n.href} className="l6-wire-item">
                  <span className="l6-wire-no">N°{n.no}</span>
                  <span className="l6-wire-title">{n.title}.</span>{" "}
                  <span className="l6-wire-line">{n.line}</span>
                </Link>
              ))}
            <div className="l6-numbers">
              <h4>BY THE NUMBERS</h4>
              {projects
                .flatMap((p) =>
                  p.metrics.slice(0, 2).map((m) => ({ ...m, t: p.title }))
                )
                .map((m) => (
                  <p key={`${m.t}-${m.k}`}>
                    <b>{m.v}</b> — {m.k} <i>({m.t})</i>
                  </p>
                ))}
            </div>
          </aside>
        </div>

        <hr className="l6-cut" />

        {/* ── second row: remaining stories + opinion ── */}
        <div className="l6-row2">
          {rest.map((p) => (
            <article key={p.slug} className="l6-story">
              <Link href={p.href} className="l6-headline-link">
                <h3 className="l6-headline-sm">{HEADLINES[p.slug] ?? p.title}</h3>
              </Link>
              <p className="l6-byline-sm">
                {p.domain} · N°{p.no} · {p.status}
              </p>
              <p className="l6-body-sm">
                <span className="l6-place">SAN FRANCISCO —</span> {p.summary}
              </p>
              <p className="l6-jump">(See {p.href.slice(1)})</p>
            </article>
          ))}

          <section className="l6-opinion">
            <h3 className="l6-section-head">OPINION</h3>
            {writing.map((w) => (
              <article key={w.slug} className="l6-op-item">
                <Link href={w.href} className="l6-headline-link">
                  <h4>“{w.line}”</h4>
                </Link>
                <p>
                  {w.title} — {w.readingTime} min. {w.summary}
                </p>
              </article>
            ))}
            <article className="l6-op-item l6-notice">
              <h4>PUBLIC NOTICE — THE METHOD</h4>
              <p>
                {method.thesis} A standing harness — skills, hooks, specialist
                agents — filed permanently at{" "}
                <Link href="/method" className="l6-plain-link">
                  /method
                </Link>
                . Status: {method.status.toLowerCase()}.
              </p>
            </article>
          </section>
        </div>

        <hr className="l6-cut" />

        {/* ── classifieds ──────────────────────────── */}
        <section className="l6-classifieds">
          <h3 className="l6-section-head">CLASSIFIED</h3>
          <div className="l6-class-grid">
            <p>
              <b>RUNNING</b> — ongoing, citywide. No destination on file.
            </p>
            <p>
              <b>VOLLEYBALL</b> — standing engagement.
            </p>
            <p>
              <b>DJING</b> — now with staff:{" "}
              <Link href="/projects/dj-agent" className="l6-plain-link">
                see DJ Agent
              </Link>
              .
            </p>
            <p>
              <b>FOOD</b> — everywhere. Leads welcome.
            </p>
            <p>
              <b>SITUATION HELD</b> — {about.work[0]?.role},{" "}
              {about.work[0]?.org}.
            </p>
            <p>
              <b>DEGREES</b> — {about.education[0]?.school}: computer science;
              economics.
            </p>
          </div>
        </section>

        {/* ── folio ────────────────────────────────── */}
        <footer className="l6-folio">
          <Link href="/projects">PROJECTS, p. 2</Link>
          <Link href="/writing">WRITING, p. 3</Link>
          <Link href="/about">THE PUBLISHER, p. 4</Link>
          <Link href="/method">THE PRESS ITSELF, p. 5</Link>
          <Link href="/">BACK TO THE ARCHIVE →</Link>
        </footer>
      </div>
    </div>
  );
}
