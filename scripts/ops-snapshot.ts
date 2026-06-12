/**
 * ops-snapshot — measure the fleet on this machine and commit the result.
 *
 *   npm run ops:snapshot            # 24h window
 *   npm run ops:snapshot -- 72      # custom window in hours
 *
 * Writes data/fleet-snapshot.json: the deployed site serves this record
 * (labeled RECORDED) since it can't see ~/.claude or the source repos.
 * The record carries session titles and measured numbers only — prompts
 * and steering notes never leave the machine. Review the diff before
 * committing, like any other content change.
 */
import fs from "node:fs";
import path from "node:path";
import { measureFleet, sanitizeForRecord, liveSourcesPresent, SNAPSHOT_PATH } from "../lib/ops/fleet";

async function main() {
  if (!liveSourcesPresent()) {
    console.error("ops-snapshot: no live sources on this machine — nothing to record.");
    process.exit(1);
  }
  const windowHours = Number(process.argv[2] ?? 24) || 24;
  const snap = sanitizeForRecord(await measureFleet(windowHours));
  fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
  fs.writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snap, null, 2)}\n`);

  const lines = snap.agents.map((a) => {
    const s = `${a.slug.padEnd(18)} ${a.state.padEnd(8)} sessions:${a.sessions.length} commits:${a.commits.length} dirty:${a.dirty} branch:${a.branch ?? "—"}`;
    return `  ${s}`;
  });
  console.log(`fleet recorded → ${path.relative(process.cwd(), SNAPSHOT_PATH)} (window ${windowHours}h)`);
  console.log(lines.join("\n"));
}

main().catch((e) => {
  console.error("ops-snapshot failed:", e);
  process.exit(1);
});
