import type { Metadata } from "next";
import { archive } from "../data";
import Plan from "./plan";
import "./l9.css";

export const metadata: Metadata = {
  title: "Landing Nº9 — The floorplan",
  description:
    "Exploration: the household drawn to scale. Every agent has a room; the method is the corridor.",
  robots: { index: false },
};

/**
 * Nº9 — THE FLOORPLAN.
 * The agents already live like a household — one runs the pantry, one
 * runs the errands, one keeps the ledger, one runs the booth. So draw
 * the house. Plan view, thin lines, door swings; the method is the
 * corridor that connects every room, and the reading nook holds the
 * essays. Hover a room to light it; enter to open the file.
 */
export default function Landing9() {
  const { projects, writing, method } = archive();
  return (
    <Plan
      projects={projects}
      writing={writing}
      method={{ title: method.title, thesis: method.thesis, status: method.status }}
      rev={projects.map((p) => p.updated ?? p.date).sort().at(-1)!}
    />
  );
}
