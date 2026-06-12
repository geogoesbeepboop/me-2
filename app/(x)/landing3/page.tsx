import type { Metadata } from "next";
import { archive } from "../data";
import OpsFloor from "./ops";
import "./l3.css";

export const metadata: Metadata = {
  title: "Landing Nº3 — Operations floor",
  description:
    "Exploration: the archive as a live operations board. Radar, telemetry, statuses straight from frontmatter.",
  robots: { index: false },
};

/**
 * Nº3 — OPERATIONS FLOOR.
 * The practice rendered as a night-shift ops room: systems are radar
 * contacts, writing is the transmissions log, the index is telemetry.
 * Every status, date and number on the board is real frontmatter.
 */
export default function Landing3() {
  const { projects, writing, method } = archive();
  return (
    <OpsFloor
      projects={projects}
      writing={writing}
      method={{
        title: method.title,
        status: method.status,
        thesis: method.thesis,
      }}
    />
  );
}
