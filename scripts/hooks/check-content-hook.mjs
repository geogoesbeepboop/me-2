#!/usr/bin/env node
/**
 * PostToolUse hook (project-local): after any Edit/Write that touches
 * content/**.mdx or lib/inspect/*.ts, run the archive integrity check
 * and feed failures back to the agent (exit 2 → stderr becomes context).
 * Fail-open on anything unexpected — a broken hook must never block edits.
 */
import { execFileSync } from "node:child_process";

let raw = "";
try {
  raw = await new Promise((resolve) => {
    let buf = "";
    process.stdin.on("data", (d) => (buf += d));
    process.stdin.on("end", () => resolve(buf));
    setTimeout(() => resolve(buf), 2000);
  });
} catch {
  process.exit(0);
}

let filePath = "";
try {
  filePath = JSON.parse(raw)?.tool_input?.file_path ?? "";
} catch {
  process.exit(0);
}

if (!/content\/.*\.mdx$|lib\/inspect\/.*\.ts$/.test(filePath)) process.exit(0);

try {
  execFileSync("node", ["scripts/check-content.mjs"], {
    cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  process.exit(0);
} catch (err) {
  // exit 2: stderr is shown to the agent so it can fix the content
  process.stderr.write(String(err.stderr || err.stdout || err.message));
  process.exit(2);
}
