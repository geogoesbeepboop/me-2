import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";
import type { OpsSession, SessionState, SessionWork } from "./types";
import type { OperateVerb } from "./profiles";

/**
 * TRANSCRIPT SCANNER — turns Claude Code session files into session facts.
 *
 * Claude Code writes one JSONL per session under
 * ~/.claude/projects/<cwd with "/" and "." flattened to "-">/.
 * A repo's sessions therefore live in its own dir plus one dir per
 * .claude-worktrees checkout. Every fact extracted here is read straight
 * off those lines; states are *inferred* from activity and labeled as
 * such in the UI.
 */

const CLAUDE_PROJECTS = path.join(os.homedir(), ".claude", "projects");

/** "/Users/x/dev/dj-agent" → "-Users-x-dev-dj-agent" (Claude Code's encoding) */
export function encodeCwd(repoPath: string): string {
  return repoPath.replace(/[/.]/g, "-");
}

export function transcriptsAvailable(): boolean {
  try {
    return fs.existsSync(CLAUDE_PROJECTS);
  } catch {
    return false;
  }
}

/** the repo's transcript dir + one dir per agent worktree under it */
function transcriptDirsFor(repoPath: string): { dir: string; worktree?: string }[] {
  const enc = encodeCwd(repoPath);
  const out: { dir: string; worktree?: string }[] = [];
  const main = path.join(CLAUDE_PROJECTS, enc);
  if (fs.existsSync(main)) out.push({ dir: main });
  const wtPrefix = `${enc}--claude-worktrees-`;
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(CLAUDE_PROJECTS);
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.startsWith(wtPrefix)) {
      out.push({
        dir: path.join(CLAUDE_PROJECTS, e),
        worktree: e.slice(wtPrefix.length),
      });
    }
  }
  return out;
}

const SESSION_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$/;

/* ── single-pass line scan ────────────────────────────────
   One readline pass per file. Marker lines (titles, pr-links) are
   small — parse them. Giant content lines are only counted. A rolling
   tail buffer feeds state inference. Results cache on (mtime, size),
   so polling re-reads only the file that is actually moving. */

interface ParsedFile {
  startedAt?: string;
  branch?: string;
  firstPrompt?: string;
  lastPrompt?: string;
  aiTitle?: string;
  customTitle?: string;
  agentName?: string;
  prUrl?: string;
  prNumber?: number;
  events: number;
  /** last meaningful event ("user" | "assistant" | "system" | …) */
  lastEvent?: string;
  /** hook command, when the tail shows a stop-hook that blocked the turn */
  blockedBy?: string;
  /** the agent's own labor — tool calls counted off assistant lines */
  work: SessionWork;
  /** edit counts per file path, for the live-only top-files detail */
  fileEdits: Map<string, number>;
  /** operate runs by unit noun, e.g. { "set": 3 } — the agent's own job */
  operateUnits: Map<string, number>;
  /** this repo's operation surface, longest token first (set per scan) */
  verbs: OperateVerb[];
  /** extra verify command substrings for this repo */
  verifyTokens: string[];
}

const parseCache = new Map<string, { key: string; parsed: ParsedFile }>();

const MARKERS = [
  '"type":"ai-title"',
  '"type":"custom-title"',
  '"type":"agent-name"',
  '"type":"pr-link"',
  '"type":"last-prompt"',
] as const;

/** event types that count as "somebody did something" for tail analysis */
const MEANINGFUL = new Set(["user", "assistant", "system", "attachment"]);

/* ── the agent's own labor ────────────────────────────────
   Tool calls live in assistant lines as {"type":"tool_use","name":…}.
   Small-enough lines get a real JSON walk (exact); oversized lines fall
   back to counting name markers. Both read the same bytes the state
   inference reads — nothing here comes from anywhere but the transcript. */

const EDIT_TOOLS = new Set(["Edit", "Write", "NotebookEdit"]);
const READ_TOOLS = new Set(["Read", "Grep", "Glob"]);
/** commands that read as a test or check run — an inference, labeled so */
const TEST_CMD =
  /\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:test\w*|check\w*|lint)\b|\bvitest\b|\bjest\b|\bpytest\b|\bgo\s+test\b|\bcargo\s+test\b|\beslint\b|\btsc\b/;
/** JSON-parse ceiling — beyond this, count markers instead of parsing */
const PARSE_CAP = 4_000_000;
/** a gap longer than this is idle time, not work */
const ACTIVE_GAP_MS = 5 * 60_000;

function emptyWork(): SessionWork {
  return {
    toolCalls: 0, edits: 0, filesTouched: 0, commands: 0, reads: 0,
    testRuns: 0, operateRuns: 0, activeMinutes: 0,
  };
}

/** classify one Bash command: did it RUN the agent (operate), CHECK it
 *  (verify), or neither? Operate wins — running the job is the headline.
 *  Longest token first, one classification per command (no double count). */
function classifyCommand(p: ParsedFile, cmd: string): void {
  for (const v of p.verbs) {
    if (cmd.includes(v.token)) {
      p.work.operateRuns += 1;
      p.operateUnits.set(v.unit, (p.operateUnits.get(v.unit) ?? 0) + 1);
      return;
    }
  }
  if (TEST_CMD.test(cmd) || p.verifyTokens.some((t) => cmd.includes(t))) {
    p.work.testRuns += 1;
  }
}

function tallyToolUse(p: ParsedFile, line: string): void {
  if (line.length < PARSE_CAP) {
    try {
      const j = JSON.parse(line);
      const content = j.message?.content;
      if (!Array.isArray(content)) return;
      for (const b of content) {
        if (b?.type !== "tool_use") continue;
        p.work.toolCalls += 1;
        const name: string = typeof b.name === "string" ? b.name : "";
        const input = b.input ?? {};
        if (EDIT_TOOLS.has(name)) {
          p.work.edits += 1;
          if (typeof input.file_path === "string") {
            p.fileEdits.set(input.file_path, (p.fileEdits.get(input.file_path) ?? 0) + 1);
          }
        } else if (name === "Bash") {
          p.work.commands += 1;
          if (typeof input.command === "string") classifyCommand(p, input.command);
        } else if (READ_TOOLS.has(name)) {
          p.work.reads += 1;
        }
      }
      return;
    } catch {
      /* fall through to marker counting */
    }
  }
  p.work.toolCalls += (line.match(/"type":"tool_use"/g) ?? []).length;
  for (const m of line.matchAll(/"name":"([A-Za-z][\w-]*)","input"/g)) {
    const name = m[1];
    if (EDIT_TOOLS.has(name)) p.work.edits += 1;
    else if (name === "Bash") p.work.commands += 1;
    else if (READ_TOOLS.has(name)) p.work.reads += 1;
  }
}

function clip(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

/** slash-command transcripts wrap the readable part in tags — unwrap them;
 *  harness boilerplate ("Caveat: the messages below…") is not a prompt */
function promptText(s: string): string {
  const cmd = s.match(/<command-message>([^<]*)<\/command-message>/);
  if (cmd?.[1].trim()) return cmd[1].trim();
  const name = s.match(/<command-name>([^<]*)<\/command-name>/);
  if (name?.[1].trim()) return name[1].trim();
  let t = s;
  if (/^\s*Caveat: the messages below/i.test(t)) {
    t = t.replace(/^\s*Caveat: the messages below[^]*?(?=\n\n|$)/i, "");
  }
  const stripped = t.replace(/<[^>]{1,80}>/g, " ").replace(/\s+/g, " ").trim();
  return stripped || s;
}

async function parseFile(
  file: string,
  stat: fs.Stats,
  verbs: OperateVerb[],
  verifyTokens: string[],
  profileSig: string
): Promise<ParsedFile> {
  // the operation surface is part of the cache identity — re-mine if its
  // tokens OR units changed (a renamed unit must not serve a stale parse)
  const key = `${stat.mtimeMs}:${stat.size}:${profileSig}`;
  const hit = parseCache.get(file);
  if (hit && hit.key === key) return hit.parsed;

  const p: ParsedFile = {
    events: 0, work: emptyWork(), fileEdits: new Map(),
    operateUnits: new Map(), verbs, verifyTokens,
  };
  const tail: { type: string; raw: string }[] = [];
  let activeMs = 0;
  let prevTs = NaN;

  const rl = readline.createInterface({
    input: fs.createReadStream(file, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line) continue;
    p.events += 1;

    // cheap type sniff without parsing giant lines
    const tm = line.match(/^\{"(?:parentUuid|type)"/) ? line.match(/"type":"([a-z-]+)"/) : null;
    const type = tm?.[1];

    // active time: capped gaps between event stamps (idle never counts)
    const ts = line.match(/"timestamp":"(20\d{2}-\d{2}-\d{2}T[^"]{6,30})"/);
    if (ts) {
      const t = Date.parse(ts[1]);
      if (!Number.isNaN(t)) {
        if (!Number.isNaN(prevTs)) activeMs += Math.min(Math.max(t - prevTs, 0), ACTIVE_GAP_MS);
        prevTs = t;
      }
    }

    // assistant lines carry "type":"message" inside the envelope before
    // the top-level type, so sniff the role + a tool_use marker instead;
    // the JSON walk only counts real tool_use blocks either way
    if (line.includes('"type":"tool_use"') && line.includes('"role":"assistant"')) {
      tallyToolUse(p, line);
    }

    if (type && MARKERS.some((m) => line.includes(m)) && line.length < 8192) {
      try {
        const j = JSON.parse(line);
        if (j.type === "ai-title" && j.aiTitle) p.aiTitle = j.aiTitle;
        if (j.type === "custom-title" && j.customTitle) p.customTitle = j.customTitle;
        if (j.type === "agent-name" && j.agentName) p.agentName = j.agentName;
        if (j.type === "last-prompt" && j.lastPrompt)
          p.lastPrompt = clip(promptText(j.lastPrompt), 200);
        if (j.type === "pr-link" && j.prUrl) {
          p.prUrl = j.prUrl;
          p.prNumber = j.prNumber;
        }
      } catch {
        /* a marker substring inside a bigger line — ignore */
      }
    }

    if (type === "user" && (!p.startedAt || !p.firstPrompt)) {
      try {
        const j = line.length < 65536 ? JSON.parse(line) : null;
        if (j?.type === "user") {
          p.startedAt ??= j.timestamp;
          p.branch ??= j.gitBranch;
          const c = j.message?.content;
          if (!p.firstPrompt) {
            if (typeof c === "string") p.firstPrompt = clip(promptText(c), 120);
            else if (Array.isArray(c)) {
              const t = c.find(
                (x: { type?: string; text?: string }) => x?.type === "text" && x.text
              );
              // tool_result-only "user" lines are plumbing, not a prompt
              if (t) p.firstPrompt = clip(promptText(t.text), 120);
            }
          }
        }
      } catch {
        /* unparseable or oversized first prompt — keep scanning */
      }
    } else if (!p.startedAt && line.length < 8192) {
      try {
        const j = JSON.parse(line);
        if (j.timestamp) p.startedAt = j.timestamp;
        if (j.gitBranch) p.branch ??= j.gitBranch;
      } catch {
        /* not json — skip */
      }
    }

    if (type && MEANINGFUL.has(type)) {
      // "user" lines carrying tool_result payloads are machine traffic,
      // not a human prompt — classify them with the assistant side
      const kind =
        type === "user" && line.includes('"tool_result"') ? "machine-user" : type;
      tail.push({ type: kind, raw: line.length < 16384 ? line : "" });
      if (tail.length > 8) tail.shift();
    }
  }

  p.lastEvent = tail.at(-1)?.type;
  p.work.filesTouched = p.fileEdits.size;
  p.work.activeMinutes = Math.round(activeMs / 60_000);
  if (p.operateUnits.size > 0) {
    p.work.operateUnits = Object.fromEntries(p.operateUnits);
  }

  // a stop-hook that prevented continuation at the very end = blocked turn
  for (const t of tail.slice(-3)) {
    if (t.type !== "system" || !t.raw.includes('"subtype":"stop_hook_summary"')) continue;
    try {
      const j = JSON.parse(t.raw);
      const failed = (j.hookErrors?.length ?? 0) > 0 || j.preventedContinuation;
      if (failed) {
        const cmd: string | undefined = j.hookInfos?.[0]?.command;
        p.blockedBy = cmd ? path.basename(cmd) : "stop hook";
      }
    } catch {
      /* ignore */
    }
  }

  parseCache.set(file, { key, parsed: p });
  return p;
}

/* ── state inference (the legend explains this on the page) ── */

function inferState(
  parsed: ParsedFile,
  lastActiveMs: number,
  now: number
): { state: SessionState; detail: string } {
  const ageMin = (now - lastActiveMs) / 60_000;
  if (ageMin < 2) return { state: "running", detail: "transcript moving now" };
  if (parsed.blockedBy && ageMin < 24 * 60)
    return { state: "blocked", detail: `stopped by ${parsed.blockedBy}` };
  if (ageMin >= 24 * 60) {
    const days = Math.floor(ageMin / (24 * 60));
    return {
      state: "parked",
      detail: days <= 1 ? "no activity for a day" : `no activity for ${days} days`,
    };
  }
  if (parsed.lastEvent === "user")
    return { state: "waiting", detail: "interrupted mid-turn — the last word was the operator's" };
  if (parsed.lastEvent === "machine-user")
    return { state: "waiting", detail: "stopped mid-work — last event was a tool result" };
  return { state: "waiting", detail: "turn finished — a human decides next" };
}

function countSubagents(dir: string, sessionId: string): number {
  try {
    const sub = path.join(dir, sessionId, "subagents");
    return fs.readdirSync(sub).filter((f) => f.endsWith(".jsonl")).length;
  } catch {
    return 0;
  }
}

/** all sessions for a repo (main checkout + agent worktrees), newest first.
 *  `verbs`/`verifyTokens` are the repo's operation surface (lib/ops/profiles)
 *  so the scanner can split OPERATE/VERIFY from generic BUILD work. */
export async function scanSessions(
  repoPath: string,
  verbs: OperateVerb[] = [],
  verifyTokens: string[] = []
): Promise<OpsSession[]> {
  const now = Date.now();
  const out: OpsSession[] = [];
  // a signature of the operation surface, so the parse cache invalidates
  // when a token or unit is edited (not just when their count changes)
  const profileSig = `${verbs.map((v) => `${v.token}>${v.unit}`).join("|")}#${verifyTokens.join("|")}`;

  for (const { dir, worktree } of transcriptDirsFor(repoPath)) {
    let files: string[] = [];
    try {
      files = fs.readdirSync(dir).filter((f) => SESSION_FILE.test(f));
    } catch {
      continue;
    }
    for (const f of files) {
      const file = path.join(dir, f);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(file);
      } catch {
        continue;
      }
      if (stat.size === 0) continue;
      const parsed = await parseFile(file, stat, verbs, verifyTokens, profileSig);
      // queue-only stubs (no conversation ever) aren't sessions
      if (!parsed.startedAt && !parsed.firstPrompt) continue;

      const id = f.replace(/\.jsonl$/, "");
      const { state, detail } = inferState(parsed, stat.mtimeMs, now);
      const titleSource = parsed.customTitle
        ? ("custom" as const)
        : parsed.aiTitle
          ? ("ai" as const)
          : parsed.agentName
            ? ("agent" as const)
            : parsed.firstPrompt
              ? ("prompt" as const)
              : ("none" as const);
      const topFiles = [...parsed.fileEdits.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([f]) => path.basename(f));
      out.push({
        id,
        title:
          parsed.customTitle ??
          parsed.aiTitle ??
          parsed.agentName ??
          parsed.firstPrompt ??
          "untitled session",
        titleSource,
        agentName: parsed.agentName,
        worktree,
        branch: parsed.branch,
        startedAt: parsed.startedAt ?? new Date(stat.mtimeMs).toISOString(),
        lastActiveAt: new Date(stat.mtimeMs).toISOString(),
        state,
        stateDetail: detail,
        events: parsed.events,
        subagents: countSubagents(dir, id),
        work: parsed.work,
        topFiles: topFiles.length > 0 ? topFiles : undefined,
        prUrl: parsed.prUrl,
        prNumber: parsed.prNumber,
        lastPrompt: parsed.lastPrompt ?? parsed.firstPrompt,
        blockedBy: parsed.blockedBy,
      });
    }
  }

  out.sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));
  return out;
}
