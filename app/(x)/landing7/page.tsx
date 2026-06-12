import type { Metadata } from "next";
import Link from "next/link";
import { archive } from "../data";
import "./l7.css";

export const metadata: Metadata = {
  title: "Landing Nº7 — Raw index",
  description:
    "Exploration: no design between you and the files. One list, two colors, underlines.",
  robots: { index: false },
};

/**
 * Nº7 — RAW INDEX.
 * Web brutalism: Arial Black, Times New Roman, hyperlink blue,
 * 1px borders, a marquee. The archive presented the way a directory
 * listing would present it — because the files are the product and
 * everything else is decoration. The only easter egg is a checkbox.
 */
export default function Landing7() {
  const { nodes, projects, about, method } = archive();
  const lastModified = nodes
    .map((n) => n.updated ?? n.date)
    .sort()
    .at(-1)!;

  const tape = "BUILD FAST ★ ADAPT FASTER ★ THE HOW GETS PUBLISHED ★ ";

  return (
    <div className="l7-root">
      {/* invert easter egg — zero JS, pure :has() */}
      <input type="checkbox" id="l7-invert" className="l7-invert-box" />

      <div className="l7-page">
        <header>
          <h1 className="l7-name">
            GEORGE
            <br />
            ANDRADE-
            <br />
            MUÑOZ
          </h1>
          <p className="l7-sub">
            AI ENGINEER. SAN FRANCISCO. THIS PAGE HAS NO DESIGN — THE FILES ARE
            THE PRODUCT.
          </p>
        </header>

        <div className="l7-marquee" aria-hidden>
          <div className="l7-tape">
            <span>{tape.repeat(4)}</span>
            <span>{tape.repeat(4)}</span>
          </div>
        </div>

        <p className="l7-meta">
          INDEX OF /ARCHIVE · LAST MODIFIED: {lastModified} · SORT: NEWEST
          FIRST · <label htmlFor="l7-invert" className="l7-invert-label">[INVERT]</label>
        </p>

        <ol className="l7-list">
          <li>
            <span className="l7-no">N°000</span>
            <Link href="/method" className="l7-link">
              content/method.mdx
            </Link>{" "}
            — META — “{method.thesis}” <em>({method.status})</em>
          </li>
          {nodes.map((n) => (
            <li key={n.slug}>
              <span className="l7-no">N°{n.no}</span>
              <Link href={n.href} className="l7-link">
                content/{n.kind}/{n.slug}.mdx
              </Link>{" "}
              — {n.tag} — “{n.line}”{" "}
              <em>
                ({n.status || `${n.readingTime} min read`}
                {n.updated ? `, upd ${n.updated}` : `, ${n.date}`})
              </em>
            </li>
          ))}
        </ol>

        <h2 className="l7-h2">FACTS, UNSORTED</h2>
        <table className="l7-table">
          <thead>
            <tr>
              <th>SYSTEM</th>
              <th>CLAIM</th>
              <th>NUMBER</th>
            </tr>
          </thead>
          <tbody>
            {projects.flatMap((p) =>
              p.metrics.map((m) => (
                <tr key={`${p.slug}-${m.k}`}>
                  <td>{p.title}</td>
                  <td>{m.k}</td>
                  <td className="l7-num">{m.v}</td>
                </tr>
              ))
            )}
            <tr>
              <td>{method.title}</td>
              <td>skills in the pipeline</td>
              <td className="l7-num">17</td>
            </tr>
            <tr>
              <td>{method.title}</td>
              <td>hooks on the rim, fail-open</td>
              <td className="l7-num">4</td>
            </tr>
          </tbody>
        </table>

        <h2 className="l7-h2">WHO</h2>
        <p className="l7-prose">
          {about.work[0]?.role} at {about.work[0]?.org}. Studied computer
          science and economics at {about.education[0]?.school}. Interests:{" "}
          {about.interests.join("; ")}. Motto: <mark>build fast, adapt faster</mark>.
          Everything above traces to a real repo on a real disk; if a number
          can’t prove itself, it doesn’t ship.
        </p>

        <h2 className="l7-h2">GO</h2>
        <p className="l7-gorow">
          <Link href="/projects" className="l7-link">
            /projects
          </Link>{" "}
          ·{" "}
          <Link href="/writing" className="l7-link">
            /writing
          </Link>{" "}
          ·{" "}
          <Link href="/about" className="l7-link">
            /about
          </Link>{" "}
          ·{" "}
          <Link href="/method" className="l7-link">
            /method
          </Link>{" "}
          ·{" "}
          <Link href="/" className="l7-link">
            the designed version
          </Link>
        </p>

        <footer className="l7-foot">
          <p>NO COOKIES · NO ANALYTICS · NO ROUNDED CORNERS · BEST VIEWED IN ANY BROWSER</p>
        </footer>
      </div>
    </div>
  );
}
