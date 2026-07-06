import type { Metadata } from "next";
import Link from "next/link";
import { archive } from "../data";
import "./l4.css";

export const metadata: Metadata = {
  title: "Landing Nº4 — Akzidenz void",
  description:
    "Exploration: the archive as an International-Style poster. Grid, rules, type — set once, in one breath.",
  robots: { index: false },
};

/**
 * Nº4 — AKZIDENZ VOID.
 * Müller-Brockmann on the dark canvas: a visible 12-column grid, one
 * red, one grotesk, hard rules. The page loads in a single choreographed
 * breath (~1.2s) and then never moves again — hovers invert instantly,
 * without easing. Certainty as a motion language.
 */
export default function Landing4() {
  const { nodes, about, method } = archive();

  return (
    <div className="l4-root">
      <div className="l4-grid" aria-hidden />
      <p className="l4-rot" aria-hidden>
        PROJEKTE &amp; TEXTE — 2026
      </p>

      <header className="l4-meta l4-rise" style={{ "--d": "0s" } as React.CSSProperties}>
        <span>George Andrade-Muñoz</span>
        <span>AI engineer</span>
        <span>San Francisco</span>
        <span className="l4-meta-right">the systems archive</span>
      </header>

      <section className="l4-hero">
        <span className="l4-redsquare l4-drop" aria-hidden />
        <h1>
          <span className="l4-line">
            <span className="l4-rise" style={{ "--d": "0.08s" } as React.CSSProperties}>
              build fast,
            </span>
          </span>
          <span className="l4-line">
            <span className="l4-rise" style={{ "--d": "0.18s" } as React.CSSProperties}>
              adapt faster.<sup className="l4-ast">*</sup>
            </span>
          </span>
        </h1>
      </section>

      <div className="l4-rule-heavy l4-draw" style={{ "--d": "0.3s" } as React.CSSProperties} aria-hidden />

      <section className="l4-index" aria-label="The archive">
        {nodes.map((n, i) => (
          <Link
            key={n.slug}
            href={n.href}
            className="l4-row l4-rise"
            style={{ "--d": `${0.38 + i * 0.05}s` } as React.CSSProperties}
          >
            <span className="l4-row-no">{n.no}</span>
            <span className="l4-row-title">{n.title}</span>
            <span className="l4-row-meta">
              {n.kind === "projects" ? n.domain : "TEXT"}
            </span>
            <span className="l4-row-meta l4-row-status">{n.status || n.date.slice(0, 4)}</span>
          </Link>
        ))}
      </section>

      <section className="l4-facts l4-rise" style={{ "--d": "0.66s" } as React.CSSProperties}>
        <div>
          <h2>Currently</h2>
          <p>
            {about.work[0]?.role}, {about.work[0]?.org}.
          </p>
        </div>
        <div>
          <h2>Studied</h2>
          <p>
            {about.education[0]?.school} — computer science &amp; economics.
          </p>
        </div>
        <div>
          <h2>Method</h2>
          <p>
            <Link href="/method" className="l4-inline">
              {method.thesis}
            </Link>
          </p>
        </div>
        <div>
          <h2>Elsewhere</h2>
          <p>{about.interests.join(", ")}.</p>
        </div>
      </section>

      <footer className="l4-foot l4-rise" style={{ "--d": "0.74s" } as React.CSSProperties}>
        <p className="l4-footnote">
          <sup className="l4-ast">*</sup> the how gets published — architecture,
          failures, constraints. open any file.
        </p>
        <nav className="l4-exits" aria-label="Sections">
          <Link href="/projects">Projects</Link>
          <Link href="/writing">Writing</Link>
          <Link href="/about">About</Link>
          <Link href="/">Nº01 ↗</Link>
        </nav>
      </footer>
    </div>
  );
}
