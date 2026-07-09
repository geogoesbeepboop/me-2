#!/usr/bin/env tsx
/**
 * npm run library -- status
 * npm run library -- private "~/dev/hackathons/HEALTHCARE.md"
 * npm run library -- public  "~/dev/hackathons/HEALTHCARE.md"
 *
 * The CLI face of the visibility flip (lib/library-admin.ts). Flips edit
 * the manifest and re-sync immediately; they do NOT commit — run
 * scripts/publish-visibility.sh (or let the ops toggle do it) to publish.
 */
import { libraryInventory, setVisibility } from "../lib/library-admin";

const [cmd, source] = process.argv.slice(2);

if (cmd === "status") {
  const inv = libraryInventory();
  const hidden = inv.filter((s) => s.status !== "public");
  console.log(`${inv.length} sources — ${inv.length - hidden.length} public, ${hidden.length} hidden`);
  for (const s of hidden) {
    console.log(`  ${s.status.padEnd(7)} ${s.source}${s.detail ? ` (${s.detail})` : ""}`);
  }
} else if ((cmd === "private" || cmd === "public") && source) {
  try {
    const r = setVisibility(source, cmd);
    console.log(`${r.source} → ${r.visibility}`);
    console.log(r.synced);
    console.log("not yet committed — scripts/publish-visibility.sh publishes it");
  } catch (e) {
    console.error(`ERROR ${(e as Error).message}`);
    process.exit(1);
  }
} else {
  console.error('usage: npm run library -- status | private "<~-source>" | public "<~-source>"');
  process.exit(1);
}
