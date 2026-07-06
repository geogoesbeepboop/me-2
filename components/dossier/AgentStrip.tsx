import Link from "next/link";
import { recordedFleet } from "@/lib/ops/fleet";
import { STATE_WORDS } from "@/lib/ops/types";
import { sfStamp } from "@/lib/ops/time";
import { fmtUnits } from "@/lib/ops/digest";

/**
 * THE AGENT STRIP — the one bridge from the ops floor onto a dossier.
 *
 * A project that runs as an agent gets a single slim line under its
 * breadcrumb: its current state and what it has done, drawn from the
 * filed report (data/fleet-snapshot.json — never live polling on a
 * reading page), linking onto the board. Gated on the entry resolving in
 * the fleet — an un-instrumented entry shows nothing, never a fake zero.
 */
export default function AgentStrip({ slug }: { slug: string }) {
  const snap = recordedFleet();
  const a = snap?.agents.find((x) => x.slug === slug);
  if (!snap || !a) return null;

  let edits = 0;
  let operate = 0;
  let verify = 0;
  const units: Record<string, number> = {};
  for (const s of a.sessions) {
    edits += s.work?.edits ?? 0;
    operate += s.work?.operateRuns ?? 0;
    verify += s.work?.testRuns ?? 0;
    for (const [u, c] of Object.entries(s.work?.operateUnits ?? {})) {
      units[u] = (units[u] ?? 0) + c;
    }
  }

  const parts: string[] = [];
  if (operate > 0) parts.push(fmtUnits(units, 2));
  if (edits > 0) parts.push(`${edits} edits building`);
  if (verify > 0) parts.push(`${verify} ${verify === 1 ? "check" : "checks"}`);

  return (
    <div className="agent-strip">
      <span className="v2-dot" data-state={a.state} aria-hidden />
      <span className="agent-strip-state">{STATE_WORDS[a.state]}</span>
      {parts.length > 0 && <span className="agent-strip-did">{parts.join(" · ")}</span>}
      <Link href={`/v2/ops#${slug}`} className="agent-strip-link">
        on the ops board →
      </Link>
      <span className="agent-strip-stamp" suppressHydrationWarning>
        report filed {sfStamp(snap.generatedAt)}
      </span>
    </div>
  );
}
