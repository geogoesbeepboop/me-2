import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { NightlyDigest, NightlyRun } from "./types";

/**
 * NIGHTLY GATE DIGESTS — reading the record the night left behind.
 *
 * A LaunchAgent (com.geoandr.nightly-gate-digest) runs each focus repo's
 * `.claude/gate.sh` (lint + hermetic test suite) and `.claude/evals.sh`
 * (offline eval suites) every morning and writes one dated markdown file
 * to ~/dev/docs/gate-digests. This module parses those files — the site
 * never runs a gate itself; it reports what actually ran, when, and how
 * it went. Live mode only: the deployed site gets these inside the filed
 * snapshot, with failure tails stripped by sanitizeForRecord.
 *
 * The format is the digest script's own (nightly-gate-digest.sh):
 *
 *   # Gate digest — 2026-07-05 20:11
 *   ## jim-agent — ✅ pass (10s)
 *   ### jim-agent evals — ✅ evals pass (2s)
 *   ## dj-agent — ❌ FAIL (13s)
 *   ```
 *   <last 30 lines of the failure>
 *   ```
 */

const DIGEST_DIR =
  process.env.GATE_DIGEST_DIR ?? path.join(os.homedir(), "dev", "docs", "gate-digests");

const HEADER_RE = /^# Gate digest — (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/;
// the digest decorates some statuses — "🟡 pass — SLOW (budget 120s)" and
// "❌ FAIL (timed out after 900s)" — before the trailing duration; both
// decorations are swallowed so the duration still parses
const GATE_RE =
  /^## (\S+) — (✅ pass|🟡 pass — SLOW|❌ FAIL|⚠ no gate\.sh)(?: \((?:budget \d+s|timed out after \d+s)\))?(?: \((\d+)s\))?/;
const EVAL_RE = /^### (\S+) evals — (✅ evals pass|🟡 EVAL REGRESSION)(?: \((\d+)s\))?/;

export function parseDigest(text: string): NightlyDigest | null {
  const lines = text.split("\n");
  const head = lines.find((l) => HEADER_RE.test(l))?.match(HEADER_RE);
  if (!head) return null;
  // the digest is written in this machine's clock (PT on the operator's) —
  // parsed here, on the same machine, so local interpretation is exact
  const at = new Date(`${head[1]}T${head[2]}:00`).toISOString();

  const runs: NightlyRun[] = [];
  let current: NightlyRun | null = null;
  let fence: string[] | null = null;

  for (const line of lines) {
    if (fence !== null) {
      if (line.startsWith("```")) {
        if (current) current.tail = fence.join("\n").trim() || undefined;
        fence = null;
      } else {
        fence.push(line);
      }
      continue;
    }
    const g = line.match(GATE_RE);
    if (g) {
      current = {
        repo: g[1],
        gate: g[2].startsWith("❌") ? "fail" : g[2].startsWith("⚠") ? "missing" : "pass",
        slow: g[2].startsWith("🟡") || undefined,
        gateSeconds: g[3] !== undefined ? Number(g[3]) : undefined,
      };
      runs.push(current);
      continue;
    }
    const e = line.match(EVAL_RE);
    if (e) {
      const run = runs.find((r) => r.repo === e[1]) ?? current;
      if (run) {
        run.evals = e[2] === "✅ evals pass" ? "pass" : "regression";
        run.evalSeconds = e[3] !== undefined ? Number(e[3]) : undefined;
      }
      continue;
    }
    if (line.startsWith("```")) fence = [];
  }

  return runs.length > 0 ? { at, runs } : null;
}

/** the most recent digests on this machine, newest first */
export function readNightlyDigests(limit = 14): NightlyDigest[] {
  let files: string[];
  try {
    files = fs
      .readdirSync(DIGEST_DIR)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort()
      .reverse()
      .slice(0, limit);
  } catch {
    return [];
  }
  const digests: NightlyDigest[] = [];
  for (const f of files) {
    try {
      const d = parseDigest(fs.readFileSync(path.join(DIGEST_DIR, f), "utf8"));
      if (d) digests.push(d);
    } catch {
      /* an unreadable digest is a missing one, not a crash */
    }
  }
  return digests;
}
