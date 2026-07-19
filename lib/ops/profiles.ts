/**
 * AGENT PROFILES — what each agent IS and DOES, beyond the dev work on it.
 *
 * Two faces of every agent's labor reach the board:
 *   BUILD   — the development done TO the agent (edits to its source)
 *   OPERATE — the agent running its OWN job (its entrypoints firing)
 *   VERIFY  — the agent checking itself (tests, evals, gates)
 *
 * This file is the registry that lets the transcript scanner tell those
 * apart. `operate[]` lists the commands/slash-skills that mean "the agent
 * ran" — each carries the noun for one such run. `verify[]` lists the
 * check commands the global test pattern misses.
 *
 * The numbers in `metrics[]` are REAL and traceable to a source file —
 * they were mined from each repo with a verbatim citation (see the commit
 * that introduced this file). They are facts about the agent, not counts
 * that rot, so they live in code, reviewed like any content.
 *
 * Honesty, enforced here and labeled in the UI: none of these agents
 * persist their run output to disk in-checkout (history lives in Postgres,
 * in memory, or is gitignored). So OPERATE counts are INVOCATIONS measured
 * from transcripts — "ran its set pipeline 7×", never "made 7 sets". Cards
 * whose output is unpersisted say so. `noGitHistory` agents (no commits in
 * the repo) size their BUILD lane on transcript edits, never on git.
 */

export interface OperateVerb {
  /** lowercase substring matched in a Bash command, or a /slash-skill name */
  token: string;
  /** singular noun for one such run — the view pluralizes it */
  unit: string;
}

export interface AgentMetric {
  /** short label, e.g. "cost ceiling" */
  k: string;
  /** the value as shown, e.g. "$0.50", "≥70%", "213", or "—" when absent */
  v: string;
  /** a threshold the model can't cross → rendered with an accent outline */
  gate?: boolean;
  /** a money figure → rendered in gold */
  money?: boolean;
  /** when the fact has no on-disk evidence, why — v should be "—" */
  absent?: string;
}

export interface OpsProfile {
  /** one plain line: what the agent does for its user (the only sentence) */
  mandate: string;
  operate: OperateVerb[];
  /** check-run command substrings the global test pattern doesn't catch */
  verify?: string[];
  /** real headline facts, max 4, sourced from the repo (see commit) */
  metrics: AgentMetric[];
  /** the agent leaves no run output on disk here — counts are invocations */
  outputUnpersisted?: boolean;
  /** the repo has no commits to mine — BUILD sizes on transcript edits */
  noGitHistory?: boolean;
}

/** keyed by the project slug (== content/projects/<slug>.mdx) */
export const AGENT_PROFILES: Record<string, OpsProfile> = {
  "dj-agent": {
    mandate:
      "Turns your own music library into beatmatched DJ sets that follow a planned energy arc and match your taste.",
    operate: [
      { token: "dj.agents.generate", unit: "set" },
      { token: "make-set", unit: "set" },
      { token: "dj.ingest", unit: "ingest" },
      { token: "dj.curator", unit: "ingest" },
      { token: "ingest-link", unit: "ingest" },
      { token: "dj.taste.judge", unit: "judge" },
      { token: "bulk-judge", unit: "judge" },
      { token: "dj.taste.tag", unit: "tag run" },
      { token: "dj.taste.review", unit: "taste review" },
      { token: "vibe-review", unit: "taste review" },
      { token: "library-status", unit: "library check" },
    ],
    verify: ["test-gate", "dj.evals", "ruff", "gate.sh", "evals.sh"],
    metrics: [
      { k: "test fns", v: "213" },
      { k: "CLAP vector", v: "512-d" },
      { k: "harmonic floor", v: "≥70%", gate: true },
      { k: "BPM jump cap", v: "≤6", gate: true },
    ],
    outputUnpersisted: true,
  },

  "grocery-buddy": {
    mandate:
      "Watches your pantry over Telegram, predicts what's low, prices an Amazon cart, and hands you a checkout link to tap — it never spends your money.",
    operate: [
      { token: "grocery-buddy run", unit: "run" },
      { token: "make run", unit: "run" },
      { token: "grocery-buddy ask", unit: "request" },
      { token: "make ask", unit: "request" },
      { token: "grocery-buddy onboard", unit: "onboarding" },
      { token: "make onboard", unit: "onboarding" },
      { token: "grocery-buddy worker", unit: "worker session" },
      { token: "make worker", unit: "worker session" },
      { token: "grocery-buddy webhook", unit: "webhook session" },
      { token: "make webhook", unit: "webhook session" },
      { token: "grocery-buddy schedule", unit: "schedule" },
      { token: "make schedule", unit: "schedule" },
      { token: "grocery-buddy scraper-health", unit: "scraper probe" },
      { token: "grocery-buddy gate", unit: "gate check" },
    ],
    verify: [
      "make test",
      "make evals",
      "grocery-buddy evals",
      "ruff",
      "gate.sh",
      "evals.sh",
    ],
    metrics: [
      { k: "test fns", v: "124" },
      { k: "orders placed", v: "0" },
      { k: "precision floor", v: "0.70", gate: true },
      { k: "cost ceiling", v: "$0.50", gate: true, money: true },
    ],
    outputUnpersisted: true,
  },

  jim: {
    mandate:
      "Sells fully-cited research memos for micropayments and buys its own source data the same way — refusing to ship a number it can't trace.",
    operate: [
      { token: "jim-research", unit: "memo" },
      { token: "research_demo.py", unit: "memo" },
      { token: "jim-monitor", unit: "monitor run" },
      { token: "jim-seller", unit: "seller run" },
      { token: "jim-market", unit: "market op" },
      { token: "jim-mcp", unit: "mcp run" },
      { token: "jim-dashboard", unit: "margin read" },
      { token: "precompute.py", unit: "precompute run" },
    ],
    verify: ["jim-eval", "ruff", "gate.sh", "evals.sh"],
    metrics: [
      // mined 2026-07-06: 172 = grep -rc "^def test_" tests/; 88 = 39 gate
      // + 40 guard + 9 scenario cases (ADR-0009, dataset*.py/scenarios.py)
      { k: "test fns", v: "172" },
      { k: "offline eval cases", v: "88" },
      { k: "data budget cap", v: "$0.10", gate: true, money: true },
      { k: "faithfulness gate", v: "≥0.8", gate: true },
    ],
    outputUnpersisted: true,
  },

  "procurement-agent": {
    mandate:
      "Restocks what's routine on its own and pauses for your approval on anything risky.",
    operate: [
      { token: "procurement_agent.demo", unit: "demo run" },
      { token: "mcp_server.server", unit: "mcp session" },
      { token: "workflows.worker", unit: "worker run" },
      { token: "webhook.app", unit: "auth endpoint" },
    ],
    verify: ["ruff", "gate.sh"],
    metrics: [
      { k: "tests", v: "57" },
      { k: "auto-spend cap", v: "$50", gate: true, money: true },
      { k: "review threshold", v: "$1,000", gate: true, money: true },
      { k: "mandate TTL", v: "900s", gate: true },
    ],
    outputUnpersisted: true,
    noGitHistory: true,
  },

  "the-archive": {
    mandate:
      "The site you're reading — a living archive that measures its own fleet, files the report, and mirrors the stacks.",
    operate: [
      { token: "ops:snapshot", unit: "report" },
      { token: "sync:library", unit: "mirror pass" },
      { token: "run new", unit: "entry scaffold" },
    ],
    verify: ["run check", "run lint"],
    // sources: content/library count (sync-library.ts summary line), the
    // three me.* LaunchAgents (ops-report daily, library-sync daily,
    // curator weekly), and the curator/sync publish gate
    metrics: [
      { k: "mirrored docs", v: "72" },
      { k: "automations", v: "3" },
      { k: "publish gate", v: "check+build+scope", gate: true },
    ],
  },
};

/** longest tokens first so a specific verb wins over a prefix of it */
export function operateVerbs(slug: string): OperateVerb[] {
  const p = AGENT_PROFILES[slug];
  if (!p) return [];
  return [...p.operate].sort((a, b) => b.token.length - a.token.length);
}
