import type { Metadata } from "next";
import { archive } from "../data";
import NightShift from "./night";
import "./l5.css";

export const metadata: Metadata = {
  title: "Landing Nº5 — Night shift",
  description:
    "Exploration: an instrument field that drifts while you sleep. The cursor is weather; the systems keep operating.",
  robots: { index: false },
};

/**
 * Nº5 — NIGHT SHIFT.
 * The quiet argument: these systems run whether or not anyone is
 * looking. A generative flow field drifts across the whole viewport
 * (deterministically seeded — same sky every night), the cursor
 * disturbs it like weather, and the archive sits at the bottom as a
 * row of instruments, each reporting its real status.
 */
export default function Landing5() {
  const { projects, writing } = archive();
  return <NightShift projects={projects} writing={writing} />;
}
