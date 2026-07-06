import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { SteeringNote } from "./types";

/**
 * STEERING INBOX — notes for the next session in a repo.
 *
 * The ops room writes markdown notes to ~/.claude/fleet/steering/<repo
 * basename>/. Nothing is injected into any agent automatically: a
 * SessionStart hook (snippet shown in the ops room) reads the notes
 * aloud to the next session and archives them to read/. Local machine
 * only — the deployed site can't reach this and never shows it.
 */

const STEERING_ROOT = path.join(os.homedir(), ".claude", "fleet", "steering");

export function steeringDirFor(repoPath: string): string {
  return path.join(STEERING_ROOT, path.basename(repoPath));
}

export function listSteering(repoPath: string): SteeringNote[] {
  const dir = steeringDirFor(repoPath);
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  return files
    .map((f) => {
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        return {
          id: f,
          at: new Date(stat.mtimeMs).toISOString(),
          body: fs.readFileSync(full, "utf8"),
        };
      } catch {
        return null;
      }
    })
    .filter((n): n is SteeringNote => n !== null)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function writeSteering(repoPath: string, note: string): SteeringNote {
  const dir = steeringDirFor(repoPath);
  fs.mkdirSync(dir, { recursive: true });
  const at = new Date();
  const id = `${at.toISOString().replace(/[:.]/g, "-")}-ops-room.md`;
  const body = `Steering note from the ops room — ${at.toISOString()}\n\n${note.trim()}\n`;
  fs.writeFileSync(path.join(dir, id), body, { mode: 0o600 });
  return { id, at: at.toISOString(), body };
}

/** the opt-in hook George can add per repo (shown verbatim in the room) */
export const STEERING_HOOK_SNIPPET = `# .claude/settings.json — SessionStart hook (per repo, opt-in)
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command",
        "command": "d=\\"$HOME/.claude/fleet/steering/$(basename \\"$CLAUDE_PROJECT_DIR\\")\\"; if ls \\"$d\\"/*.md >/dev/null 2>&1; then echo '── steering notes from the ops room ──'; cat \\"$d\\"/*.md; mkdir -p \\"$d/read\\"; mv \\"$d\\"/*.md \\"$d/read/\\"; fi" } ] }
    ]
  }
}`;
