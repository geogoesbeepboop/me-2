/**
 * ops-snapshot — measure the fleet on this machine and file the report.
 *
 *   npm run ops:snapshot                  # cut a 24h record, write it, stop
 *   npm run ops:snapshot -- 72            # custom window in hours
 *   npm run ops:snapshot -- 24 --commit   # …and commit ONLY the snapshot
 *   npm run ops:snapshot -- 24 --commit --push   # …and push (deploy follows)
 *
 * THE DEPLOY STORY. The deployed site can't see ~/.claude or the source
 * repos — only this machine can. So the site has two modes: live at the
 * operator's desk, and the last *filed report* everywhere else. Filing a
 * report IS the update path for the public site: cut → sanitize → commit
 * → push → the host redeploys and serves the new record, labeled with
 * the moment it was cut. Run it by hand at shift change, or schedule it
 * (see AGENTS.md for the launchd recipe).
 *
 * Sanitization is enforced in code, not in review: assigned titles and
 * measured numbers only — prompts, prompt-derived titles, file paths and
 * steering notes never leave the machine. --commit refuses to run with
 * other changes staged, and stages nothing but the snapshot file, so the
 * data commit can never smuggle code along.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { measureFleet, sanitizeForRecord, liveSourcesPresent, SNAPSHOT_PATH } from "../lib/ops/fleet";

function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: process.cwd(), encoding: "utf8" }).trim();
}

async function main() {
  if (!liveSourcesPresent()) {
    console.error("ops-snapshot: no live sources on this machine — nothing to record.");
    process.exit(1);
  }
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith("--")));
  const windowHours = Number(args.find((a) => !a.startsWith("--")) ?? 24) || 24;

  const snap = sanitizeForRecord(await measureFleet(windowHours));
  fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
  fs.writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snap, null, 2)}\n`);

  const lines = snap.agents.map((a) => {
    const active = a.sessions.reduce((t, s) => t + (s.work?.activeMinutes ?? 0), 0);
    const s = `${a.slug.padEnd(18)} ${a.state.padEnd(8)} sessions:${a.sessions.length} active:${active}m commits:${a.commits.length} dirty:${a.dirty} branch:${a.branch ?? "—"}`;
    return `  ${s}`;
  });
  console.log(`fleet recorded → ${path.relative(process.cwd(), SNAPSHOT_PATH)} (window ${windowHours}h)`);
  console.log(lines.join("\n"));

  if (!flags.has("--commit")) {
    if (flags.has("--push")) console.error("ops-snapshot: --push needs --commit; nothing pushed.");
    return;
  }

  // the data commit carries data only — refuse a dirty stage
  const staged = git("diff", "--cached", "--name-only");
  if (staged) {
    console.error(`ops-snapshot: refusing to commit — already staged:\n${staged}`);
    process.exit(1);
  }
  const rel = path.relative(process.cwd(), SNAPSHOT_PATH);
  if (!git("diff", "--name-only", "--", rel) && !git("ls-files", "--others", "--", rel)) {
    console.log("ops-snapshot: record unchanged — nothing to commit.");
    return;
  }
  git("add", "--", rel);
  git("commit", "-m", `ops: file the fleet report (window ${windowHours}h, cut ${snap.generatedAt})`);
  console.log(`committed on ${git("rev-parse", "--abbrev-ref", "HEAD")}`);

  if (flags.has("--push")) {
    execFileSync("git", ["push"], { cwd: process.cwd(), stdio: "inherit" });
    console.log("pushed — the deploy will serve this report.");
  }
}

main().catch((e) => {
  console.error("ops-snapshot failed:", e);
  process.exit(1);
});
