import type { Metadata } from "next";
import { allNodes, accentOf } from "@/lib/content";
import { loadFleet } from "@/lib/ops/fleet";
import { sceneFor, sfHour } from "@/lib/ops/time";
import CityLanding, { type LogRow } from "./city-landing";
import "./v2.css";

export const metadata: Metadata = {
  title: "The city — the fleet at work",
  description:
    "San Francisco keeps the real time; the fleet of agents works in it. Measured states, the shift log, and what got done while the operator slept.",
};

// the board reads the machine at request time — never prerender it
export const dynamic = "force-dynamic";

/**
 * V2 LANDING — THE CITY.
 * Landing Nº5 grown up: the skyline is San Francisco, the clock is
 * real, and every light is measured — agent sessions from transcripts
 * on disk, commits from the source repos, writes from the archive.
 * The archive itself (v1) stays canonical at "/"; this is the ops
 * layer over it.
 */
export default async function V2Landing() {
  const fleet = await loadFleet(24);

  // archive writes for the shift log — entry updates are real events
  const writes: LogRow[] = allNodes()
    .slice(0, 10)
    .map((n) => ({
      at: n.sortDate,
      dateOnly: true,
      accent: accentOf(n),
      main: n.title,
      tag:
        n.kind === "writing"
          ? "post published"
          : n.updated
            ? "entry rewritten"
            : "entry published",
      href: `/${n.path}`,
      kind: "entry" as const,
    }));

  return (
    <CityLanding
      initialFleet={fleet}
      writes={writes}
      initialScene={sceneFor(sfHour(new Date()))}
    />
  );
}
