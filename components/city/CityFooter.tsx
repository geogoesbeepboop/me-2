import Link from "next/link";

/**
 * THE FOOTER — one on every page. Fuses the v2 foot geometry with the
 * archive's durable closing line and contacts. No counts, nothing that
 * rots: the motto carries the site.
 */
export default function CityFooter() {
  return (
    <footer className="city-foot">
      <div className="city-foot-motto">
        <p className="city-foot-line">
          Build fast, adapt faster —<br className="city-foot-br" /> and publish the how.
        </p>
        <p className="city-foot-contact">
          <a href="mailto:georgeandrade93@gmail.com">georgeandrade93@gmail.com</a>
          <span className="city-foot-dot">·</span>
          <a href="https://x.com/geobuilds">@geobuilds</a>
        </p>
      </div>
      <nav className="city-foot-exits" aria-label="Sections">
        <Link href="/">THE CITY</Link>
        <Link href="/projects">PROJECTS</Link>
        <Link href="/writing">WRITING</Link>
        <Link href="/method">N°000 — METHOD</Link>
        <Link href="/about">ABOUT</Link>
        <Link href="/v2/ops">OPS ROOM</Link>
      </nav>
      <p className="city-foot-copy">© 2026 George Andrade-Muñoz</p>
    </footer>
  );
}
