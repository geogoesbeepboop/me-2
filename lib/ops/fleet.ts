import fs from "node:fs";
import path from "node:path";
import { nodesOf, accentOf } from "../content";
import { scanSessions, transcriptsAvailable } from "./sessions";
import { recentCommits, repoStatus } from "./git";
import { listSteering } from "./steer";
import { AGENT_PROFILES, operateVerbs } from "./profiles";
import { readNightlyDigests } from "./gates";
import type { AgentOps, AgentState, FleetSnapshot, NightlyDigest, OpsSession } from "./types";

/**
 * FLEET ASSEMBLY — one snapshot of every agent's real state.
 *
 * The roster is the content graph itself: every project entry whose
 * frontmatter names a `repo:` is an agent on the board, plus the
 * archive's own repo — this site maintains itself and says so.
 *
 * On George's machine the snapshot is measured live. Anywhere else
 * (the deployed site) it falls back to the committed snapshot in
 * data/fleet-snapshot.json and is labeled RECORDED with its timestamp.
 */

// overridable so the filing automation can cut a report in this checkout
// but write it straight into the publishing worktree (scripts/file-report.sh)
const SNAPSHOT_PATH =
  process.env.FLEET_SNAPSHOT_PATH ??
  path.join(process.cwd(), "data", "fleet-snapshot.json");
const SESSION_CAP = 12;

interface RosterEntry {
  slug: string;
  title: string;
  accent: string;
  domain?: string;
  href: string;
  repoPath: string;
}

export function roster(): RosterEntry[] {
  const entries: RosterEntry[] = nodesOf("projects")
    .filter((n) => n.repo)
    .map((n) => ({
      slug: n.slug,
      title: n.title,
      accent: accentOf(n),
      domain: n.domain,
      href: `/${n.path}`,
      repoPath: n.repo as string,
    }));
  // the archive itself — the site is one of the agents' workplaces too.
  // When a content entry claims the slug (content/projects/the-archive.mdx),
  // it IS the roster row — accent, href and repo come from the dossier.
  if (!entries.some((e) => e.slug === "the-archive")) {
    entries.push({
      slug: "the-archive",
      title: "The Archive",
      accent: "var(--color-ember)",
      domain: "THIS SITE",
      href: "/",
      repoPath: process.cwd(),
    });
  }
  return entries;
}

function fleetState(sessions: OpsSession[]): { state: AgentState; detail: string } {
  if (sessions.length === 0) return { state: "dark", detail: "no sessions on record" };
  const rank: AgentState[] = ["running", "blocked", "waiting", "parked"];
  for (const s of rank) {
    const hit = sessions.find((x) => x.state === s);
    if (hit) return { state: s, detail: hit.stateDetail };
  }
  return { state: "dark", detail: "no sessions on record" };
}

export function liveSourcesPresent(): boolean {
  return transcriptsAvailable() && roster().some((r) => fs.existsSync(r.repoPath));
}

async function measureAgent(
  entry: RosterEntry,
  windowHours: number,
  withSteering: boolean
): Promise<AgentOps> {
  const profile = AGENT_PROFILES[entry.slug];
  const [sessions, status, commits] = await Promise.all([
    scanSessions(entry.repoPath, operateVerbs(entry.slug), profile?.verify ?? []),
    repoStatus(entry.repoPath),
    recentCommits(entry.repoPath, windowHours),
  ]);
  const { state, detail } = fleetState(sessions);
  return {
    ...entry,
    mandate: profile?.mandate,
    metrics: profile?.metrics,
    outputUnpersisted: profile?.outputUnpersisted,
    noGitHistory: profile?.noGitHistory,
    branch: status.branch,
    detached: status.detached,
    dirty: status.dirty,
    state,
    stateDetail: detail,
    lastActiveAt: sessions[0]?.lastActiveAt,
    sessions: sessions.slice(0, SESSION_CAP),
    commits,
    steering: withSteering ? listSteering(entry.repoPath) : undefined,
  };
}

/** resolve digest repo basenames to fleet slugs, and hand each agent its
 *  latest run — the digest names repos by directory, the board by slug */
function attachNightly(agents: AgentOps[], digests: NightlyDigest[]): void {
  const bySlug = new Map(
    agents.filter((a) => a.repoPath).map((a) => [path.basename(a.repoPath as string), a])
  );
  for (const d of digests) {
    for (const run of d.runs) {
      const agent = bySlug.get(run.repo);
      if (!agent) continue;
      run.slug = agent.slug;
      if (!agent.nightly) agent.nightly = { ...run, at: d.at };
    }
  }
}

export async function measureFleet(windowHours = 24): Promise<FleetSnapshot> {
  const agents = await Promise.all(
    roster().map((r) => measureAgent(r, windowHours, true))
  );
  const gateDigests = readNightlyDigests();
  attachNightly(agents, gateDigests);
  return {
    mode: "live",
    generatedAt: new Date().toISOString(),
    windowHours,
    agents,
    gateDigests,
  };
}

export function recordedFleet(): FleetSnapshot | null {
  try {
    const raw = fs.readFileSync(SNAPSHOT_PATH, "utf8");
    const snap = JSON.parse(raw) as FleetSnapshot;
    snap.mode = "recorded";
    return snap;
  } catch {
    return null;
  }
}

/** live when the sources are on this machine, else the committed record */
export async function loadFleet(windowHours = 24): Promise<FleetSnapshot> {
  if (liveSourcesPresent()) {
    try {
      return await measureFleet(windowHours);
    } catch {
      /* fall through to the record */
    }
  }
  return (
    recordedFleet() ?? {
      mode: "recorded",
      generatedAt: "1970-01-01T00:00:00.000Z",
      windowHours,
      agents: [],
    }
  );
}

/** what the committed snapshot may carry — assigned titles and measured
 *  numbers only. Prompt text (including prompt-derived titles) and every
 *  kind of path (repo, file) stay on the machine; the record states its
 *  own mode. */
export function sanitizeForRecord(snap: FleetSnapshot): FleetSnapshot {
  return {
    ...snap,
    mode: "recorded",
    agents: snap.agents.map((a) => ({
      ...a,
      repoPath: undefined,
      steering: undefined,
      nightly: a.nightly && { ...a.nightly, tail: undefined },
      sessions: a.sessions.map((s) => ({
        ...s,
        lastPrompt: undefined,
        topFiles: undefined,
        title: s.titleSource === "prompt" ? "untitled session" : s.title,
      })),
    })),
    // gate/eval statuses and durations are measured numbers — they file;
    // failure log tails can quote paths and code, so they stay home
    gateDigests: snap.gateDigests?.map((d) => ({
      ...d,
      runs: d.runs.map((r) => ({ ...r, tail: undefined })),
    })),
  };
}

export { SNAPSHOT_PATH };
