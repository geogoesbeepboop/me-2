import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { OpsCommit } from "./types";

/**
 * GIT TELEMETRY — branch, dirty count, and windowed commit log for a
 * source repo. All reads, no writes; execFile (never a shell), short
 * timeouts, and every failure degrades to "no data" rather than throwing.
 */

const run = promisify(execFile);

async function git(repo: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await run("git", ["-C", repo, ...args], {
      timeout: 5000,
      maxBuffer: 8 * 1024 * 1024,
    });
    return stdout;
  } catch {
    return null;
  }
}

export interface RepoStatus {
  branch?: string;
  detached?: boolean;
  dirty: number;
}

export async function repoStatus(repo: string): Promise<RepoStatus> {
  if (!fs.existsSync(repo)) return { dirty: 0 };
  // symbolic-ref works even on an unborn branch (a repo with no commits yet)
  const [ref, porcelain] = await Promise.all([
    git(repo, ["symbolic-ref", "--short", "-q", "HEAD"]),
    git(repo, ["status", "--porcelain"]),
  ]);
  const dirty = porcelain ? porcelain.split("\n").filter(Boolean).length : 0;
  const name = ref?.trim();
  if (name) return { branch: name, dirty };
  const sha = (await git(repo, ["rev-parse", "--short", "HEAD"]))?.trim();
  return { branch: sha ? `detached @ ${sha}` : undefined, detached: true, dirty };
}

const REC = "␞"; // record separator sentinel, never appears in subjects

/** commits across all branches in the window, newest first, deduped */
export async function recentCommits(
  repo: string,
  sinceHours: number,
  cap = 40
): Promise<OpsCommit[]> {
  if (!fs.existsSync(repo)) return [];
  const out = await git(repo, [
    "log",
    "--all",
    `--since=${sinceHours} hours ago`,
    "--date=iso-strict",
    `--pretty=format:${REC}%H%x09%h%x09%ad%x09%D%x09%s`,
    "--shortstat",
  ]);
  if (!out) return [];

  const commits: OpsCommit[] = [];
  for (const record of out.split(REC)) {
    if (!record.trim()) continue;
    const [head, ...rest] = record.split("\n");
    const [hash, shortHash, at, refs, subject] = head.split("\t");
    if (!hash || !subject) continue;
    let files = 0,
      ins = 0,
      del = 0;
    const stat = rest.find((l) => l.includes("changed"));
    if (stat) {
      files = Number(stat.match(/(\d+) files? changed/)?.[1] ?? 0);
      ins = Number(stat.match(/(\d+) insertions?\(\+\)/)?.[1] ?? 0);
      del = Number(stat.match(/(\d+) deletions?\(-\)/)?.[1] ?? 0);
    }
    commits.push({
      hash,
      shortHash,
      subject,
      at,
      files,
      ins,
      del,
      refs: refs?.trim() || undefined,
    });
    if (commits.length >= cap) break;
  }
  return commits;
}

/** full patch for one commit — live mode only, size-capped at the route */
export async function commitPatch(repo: string, hash: string): Promise<string | null> {
  if (!/^[0-9a-f]{7,40}$/i.test(hash)) return null;
  return git(repo, ["show", hash, "--stat", "--patch", "--no-color"]);
}
