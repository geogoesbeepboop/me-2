import type { Metadata } from "next";
import { allNodes, accentOf } from "@/lib/content";
import { loadFleet } from "@/lib/ops/fleet";
import { STEERING_HOOK_SNIPPET } from "@/lib/ops/steer";
import { sceneFor, sfHour } from "@/lib/ops/time";
import type { LogRow } from "../city-landing";
import OpsRoom from "./room";
import "../v2.css";

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
  const fleet = await loadFleet(24);

  const writes: LogRow[] = allNodes()
    .slice(0, 12)
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
    <OpsRoom
      initialFleet={fleet}
      writes={writes}
      hookSnippet={STEERING_HOOK_SNIPPET}
      initialScene={sceneFor(sfHour(new Date()))}
    />
  );
}
