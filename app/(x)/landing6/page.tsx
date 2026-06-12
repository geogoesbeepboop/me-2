import type { Metadata } from "next";
import { archive } from "../data";
import Board from "./board";
import "./l6.css";

export const metadata: Metadata = {
  title: "Landing Nº6 — Terminus",
  description:
    "Exploration: a split-flap departures board. Everything currently leaving the station, statuses straight from frontmatter.",
  robots: { index: false },
};

/**
 * Nº6 — TERMINUS.
 * The archive as a night station. Every entry is a departure on a
 * split-flap board — the flaps cascade on arrival, a row reflips now
 * and then to remind you the board is live, and the announcements
 * ticker speaks the house doctrine. Departure times are the real
 * last-write dates; nothing on the board is invented.
 */
export default function Landing6() {
  const { nodes, writing } = archive();

  const rows = nodes.map((n) => {
    const d = (n.updated ?? n.date).slice(5).replace("-", ".");
    return {
      time: d,
      service: `N°${n.no}`,
      dest: n.title.toUpperCase(),
      remarks: n.kind === "writing" ? `${n.readingTime} MIN READ` : n.status,
      platform: n.tag,
      href: n.href,
      accent: n.accent,
      line: n.line,
    };
  });

  const announcements = [
    ...writing.map((w) => `NOW READING ON ALL SERVICES: “${w.title.toUpperCase()}”`),
    "MIND THE GAP BETWEEN THE WHAT AND THE HOW",
    "UNATTENDED SYSTEMS WILL CONTINUE OPERATING",
    "ALL SERVICES OPERATED BY ONE ENGINEER — BUILD FAST, ADAPT FASTER",
  ];

  return <Board rows={rows} announcements={announcements} />;
}
