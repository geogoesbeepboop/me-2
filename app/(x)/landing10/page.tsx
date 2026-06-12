import type { Metadata } from "next";
import { archive } from "../data";
import Film from "./film";
import "./l10.css";

export const metadata: Metadata = {
  title: "Landing Nº10 — Title sequence",
  description:
    "Exploration: the motto as a film. Letterboxed acts, a timecode for a scrollbar, credits that are all real.",
  robots: { index: false },
};

/**
 * Nº10 — TITLE SEQUENCE.
 * The site's film motif taken to its logical end: the landing as an
 * opening sequence. Scroll is the projector — a timecode runs in the
 * letterbox, each system gets an act with a lateral pan, and the
 * credits roll nothing but real frontmatter.
 */
export default function Landing10() {
  const { projects, writing } = archive();
  return (
    <Film
      acts={[...projects].sort((a, b) => Number(a.no) - Number(b.no))}
      essays={writing}
    />
  );
}
