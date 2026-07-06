/**
 * ops-digest — print "what got done while you slept" for the terminal,
 * a cron job, or a notification.
 *
 *   npm run ops:digest            # the overnight shift, as plain text
 *   npm run ops:digest -- --json  # the same digest as JSON
 *
 * Pipe it wherever a morning nudge should land, e.g. at shift change:
 *   npm run --silent ops:digest | terminal-notifier -title "The fleet"
 * or post the text to Slack. Reads the same measured fleet the site does;
 * operate counts are invocations, never shipped-artifact counts.
 */
import { loadFleet } from "../lib/ops/fleet";
import { shiftDigest, fmtUnits } from "../lib/ops/digest";
import { allNodes, accentOf } from "../lib/content";
import type { WriteRow } from "../app/(v2)/v2/shared";

function archiveWrites(): WriteRow[] {
  return allNodes()
    .slice(0, 12)
    .map((n) => ({
      at: n.sortDate,
      dateOnly: true,
      accent: accentOf(n),
      title: n.title,
      tag:
        n.kind === "writing" ? "post published" : n.updated ? "entry rewritten" : "entry published",
      href: `/${n.path}`,
    }));
}

async function main() {
  const json = process.argv.includes("--json");
  const fleet = await loadFleet(24);
  const ref = Date.parse(fleet.generatedAt) || Date.now();
  const d = shiftDigest(fleet, archiveWrites(), ref);

  if (json) {
    console.log(JSON.stringify(d, null, 2));
    return;
  }

  const t = d.totals;
  console.log(`── ${d.window.label.toUpperCase()} ──`);
  if (d.quiet) {
    console.log("a quiet shift — nothing measured in this window.");
    return;
  }
  const lede: string[] = [`${t.agents} ${t.agents === 1 ? "agent" : "agents"} on the watch`];
  if (t.operateRuns > 0) lede.push(fmtUnits(t.operateUnits, 4));
  if (t.edits > 0) lede.push(`${t.edits} edits`);
  if (t.commits > 0) lede.push(`${t.commits} ${t.commits === 1 ? "commit" : "commits"} landed`);
  if (t.prs > 0) lede.push(`${t.prs} ${t.prs === 1 ? "PR" : "PRs"} opened`);
  if (t.entries > 0) lede.push(`${t.entries} archive ${t.entries === 1 ? "write" : "writes"}`);
  console.log(lede.join(" · "));
  console.log("");
  for (const a of d.agents) {
    const parts: string[] = [];
    if (a.operateRuns > 0) parts.push(fmtUnits(a.operateUnits, 3));
    if (a.edits > 0) parts.push(`${a.edits} edits`);
    if (a.commits > 0) parts.push(`${a.commits} ${a.commits === 1 ? "commit" : "commits"}`);
    console.log(`  ${a.title.padEnd(18)} ${parts.join(" · ") || "active"}`);
  }
}

main().catch((e) => {
  console.error("ops-digest failed:", e);
  process.exit(1);
});
