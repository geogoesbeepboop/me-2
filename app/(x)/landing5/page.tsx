import type { Metadata } from "next";
import { archive } from "../data";
import NightShift from "./night";
import "./l5.css";

export const metadata: Metadata = {
  title: "Landing Nº5 — Night shift",
  description:
    "Exploration: autonomous imagination, harnessed while you sleep. The page knows what time it is in San Francisco.",
  robots: { index: false },
};

/**
 * Nº5 — NIGHT SHIFT (second cut).
 * One narrative, no decoration: the systems hold the night watch.
 * The page reads the actual San Francisco clock — visit during shift
 * hours and the watch is in progress; visit by day and it tells you
 * when the shift resumes. Roster, overnight log, dawn exit — all of
 * it real frontmatter.
 */
export default function Landing5() {
  const { projects, writing } = archive();

  // overnight log — every entry's last write, newest first
  const log = [
    ...projects.map((p) => ({
      date: p.updated ?? p.date,
      title: p.title,
      href: p.href,
      accent: p.accent,
      kind: "file rewritten" as string,
    })),
    ...writing.map((w) => ({
      date: w.date,
      title: w.title,
      href: w.href,
      accent: w.accent,
      kind: "transmission logged",
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return <NightShift projects={projects} log={log} />;
}
