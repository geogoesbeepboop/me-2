import type { Metadata } from "next";
import { allNodes, accentOf } from "@/lib/content";
import { loadFleet } from "@/lib/ops/fleet";
import { getSfWeather } from "@/lib/ops/weather";
import { STEERING_HOOK_SNIPPET } from "@/lib/ops/steer";
import { sceneFor, sfHour } from "@/lib/ops/time";
import type { WriteRow } from "../shared";
import OpsRoom from "./room";


export const metadata: Metadata = {
  title: "The ops room — fleet, shift report, ledger",
  description:
    "The working dashboard behind the city: which agents are working, waiting or blocked; what landed in every repo; the full temporal ledger — measured, never staged.",
};

export const dynamic = "force-dynamic";

/**
 * THE OPS ROOM — the functional floor of v2.
 * For visitors it is the educational view of how this practice runs;
 * on George's machine it is the actual day-to-day instrument: live
 * states, expandable diffs, steering notes for the next session.
 */
export default async function OpsPage() {
  const [fleet, weather] = await Promise.all([loadFleet(24), getSfWeather()]);

  const writes: WriteRow[] = allNodes()
    .slice(0, 12)
    .map((n) => ({
      at: n.sortDate,
      dateOnly: true,
      accent: accentOf(n),
      title: n.title,
      tag:
        n.kind === "writing"
          ? "post published"
          : n.updated
            ? "entry rewritten"
            : "entry published",
      href: `/${n.path}`,
    }));

  return (
    <OpsRoom
      initialFleet={fleet}
      writes={writes}
      weather={weather}
      hookSnippet={STEERING_HOOK_SNIPPET}
      initialScene={sceneFor(sfHour(new Date()))}
    />
  );
}
