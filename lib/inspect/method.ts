import type { InspectMap } from "./types";

/**
 * verbatim excerpts from ~/.claude — the actual files behind each
 * component of the harness. Paths are real; nothing is illustrative.
 */
export const METHOD: InspectMap = {
  contract: {
    path: "~/.claude/CLAUDE.md",
    note: "the standing contract — loaded into every session",
    lang: "md",
    excerpt: `# Working with me

Treat my framing as a hypothesis, not a spec. I may be missing context, working from a
wrong assumption, or asking for the wrong thing. Your job is the best outcome, not fast agreement.

## Working guidelines
- **Pressure-test consequential decisions** When an approach meaningfully affects outcomes,
  surface assumptions, alternatives, tradeoffs, and failure modes before committing that I may
  not have considered.
- **Think outside of the box before converging.** Lay out the alternatives worth considering
  and why you recommend one when they genuinely could lead to a better solution so we're
  proactive instead of churning later.
- **Disagree out loud.** Prioritize correctness over agreement. If you see a materially better
  approach, explain it and why you'd choose it.
- **Decide vs. ask.** Resolve trivial choices yourself with a sensible default and note it.
- **Balance conciseness and completeness.** Challenge what changes the outcome; don't bikeshed
  or manufacture objections for the sake of opposing.`,
  },

  cc: {
    path: "~/.claude/settings.json",
    note: "the loop's wiring — every hook declared here, deterministically",
    lang: "json",
    excerpt: `{
  "PreToolUse": [
    { "matcher": "Bash",
      "hooks": [{ "type": "command",
        "command": "/Users/geoandr/.claude/hooks/guard-bash.sh", "timeout": 10 }] },
    { "matcher": "Edit|Write",
      "hooks": [{ "type": "command",
        "command": "/Users/geoandr/.claude/hooks/guard-secrets.sh", "timeout": 10 }] }
  ],
  "PostToolUse": [
    { "matcher": "Edit|Write",
      "hooks": [{ "type": "command",
        "command": "/Users/geoandr/.claude/hooks/format-on-edit.sh", "timeout": 30 }] }
  ],
  "SessionStart": [
    { "matcher": "startup|resume|clear",
      "hooks": [{ "type": "command",
        "command": "/Users/geoandr/.claude/hooks/session-context.sh", "timeout": 10 }] }
  ]
}`,
  },

  light: {
    path: "~/.claude/skills/*",
    note: "the light tier — each frames a brief inline, delegates the heavy reading, adjudicates back",
    files: [
      {
        path: "~/.claude/skills/brainstorm/SKILL.md",
        lang: "md",
        note: "ideation — researched options, not a guess",
        excerpt: `# Brainstorm

Turn \`$ARGUMENTS\` into a well-researched set of solution options — grounded in CURRENT sources,
with scale and robustness considered — without flooding this conversation with raw research.

## How to run this

2. **Write a self-contained research brief.** This is the ONLY context the researcher subagent
   will get — it cannot see our conversation. Into the brief, serialize: the question, every
   relevant constraint and decision from THIS session and the specific sub-questions to answer
   (alternatives to compare, scaling limits, failure modes, current best practice, notable
   tools/libraries and their tradeoffs). Demand current sources and flag anything older than
   ~18 months as possibly stale.

3. **Delegate to the researcher.** They do the searching/fetching in their own context
   and return only synthesized, cited findings.`,
      },
      {
        path: "~/.claude/skills/plan/SKILL.md",
        lang: "md",
        note: "the plan rules — checkpoints, no time estimates",
        excerpt: `# Plan

Produce an implementation plan for: \`$ARGUMENTS\` (if empty, plan whatever we've been discussing).

## Rules for the plan
- **No time estimates. Ever.** They're noise.
- **Phase boundaries are checkpoints, not chapters.** End each phase exactly where *I* should
  verify it works ("after this, run X and confirm Y") or where you need my hands ("I need you to
  provision / approve / decide Z before continuing").
- **Dense phases.** Each phase is roughly one execution request, so pack in coherent, high-value
  work. Keep the total in the single digits — fold trivial steps together.
- **Each phase states:** its goal, the concrete changes (files / components), and the explicit
  checkpoint that ends it.`,
      },
      {
        path: "~/.claude/skills/challenge/SKILL.md",
        lang: "md",
        note: "the red-team — runs on what was built, before it ships",
        excerpt: `# Challenge

Red-team \`$ARGUMENTS\` (or, if blank, the plan / design / decision we're currently on).

## How to run this
1. **State the target precisely.** In one place, write what we're proposing — the approach, the
   key assumptions, and the constraints. This becomes the brief for the critic, which can't see
   our chat, so make it self-contained.
2. **Delegate to the critic.** Spawn the \`critic\` subagent (your Task/Agent tool, brief as prompt).
   The critic defaults to **Opus** (its frontmatter default — a single-shot, max-rigor red-team is
   where Opus reasoning earns its keep).
3. **Adjudicate — don't just relay.** For each point the critic raises, give your honest take:
   real and worth fixing / real but acceptable / not a concern (with why). Stay calibrated`,
      },
    ],
  },

  deep: {
    path: "~/.claude/skills/deep-*",
    note: "every light skill's heavyweight sibling — the model frames the brief, a script runs the fan-out",
    files: [
      {
        path: "~/.claude/skills/deep-challenge/SKILL.md",
        lang: "md",
        note: "a panel of critics instead of one",
        excerpt: `# Deep challenge

The dynamic-workflow sibling of \`/challenge\`. Instead of a single critic, it runs a multi-lens
panel in parallel, merges and dedupes the concerns, and adjudicates with an Opus pass — then I add
my own honest take on top. Reserve for high-stakes calls; use \`/challenge\` otherwise.

# …

**Intensity sets depth:** **low** (default, 1 critic/lens) · **medium** (2) · **high** (3); extra
passes run independently and are deduped, so intensity buys scrutiny on the same lenses. A
\`+500k\`/\`+1m\` budget directive maps to medium/high. Lenses live in
\`~/.claude/skills/deep-challenge/workflow.js\`; the shared convention is in \`~/dev/docs/DEEP_SKILLS.md\`.`,
      },
      {
        path: "~/.claude/skills/deep-brainstorm/SKILL.md",
        lang: "md",
        note: "research that fact-checks itself",
        excerpt: `# Deep brainstorm

The dynamic-workflow sibling of \`/brainstorm\`. Where \`/brainstorm\` spawns 1–3 researchers inline,
this runs a full research workflow — decompose → parallel Sonnet searchers → adversarial
verification → Opus synthesis. More sources, fact-checked, at noticeably higher token cost.
Reserve it for decisions that justify the spend; otherwise use \`/brainstorm\`.

# …

**Intensity sets breadth:** **low** (default, ~5 angles) · **medium** (~8) · **high** (~12); a
\`+500k\`/\`+1m\` budget directive maps to medium/high.
Keep raw research in the subagents — only the synthesis returns here.`,
      },
      {
        path: "~/.claude/skills/deep-plan/SKILL.md",
        lang: "md",
        note: "three competing designs, judged",
        excerpt: `# Deep plan

The dynamic-workflow sibling of \`/plan\`, for big or uncertain features where parallel recon and
competing designs pay off. It maps the codebase with parallel Explore agents, drafts three distinct
approaches (MVP-first, risk-first, robustness-first), scores them, and has Opus write the plan. For
ordinary changes, \`/plan\` is lighter and usually enough.

# …

**Intensity sets recon breadth:** **low** (default, 4 explorers) · **medium** (6) · **high** (8); a
\`+500k\`/\`+1m\` budget directive maps to medium/high.`,
      },
      {
        path: "~/.claude/skills/deep-challenge/workflow.js",
        lang: "js",
        note: "the fan-out is a script, not a vibe",
        excerpt: `// args is either a bare string (the target, low intensity) or { brief, intensity }.
// intensity ∈ low | medium | high — low = lean default, medium ≈ +500k, high ≈ +1m of effort.
const INTENSITY = ['low', 'medium', 'high'].includes(RAW.intensity)
  ? RAW.intensity
  : tierFromBudget(TURN_BUDGET)

// Critics PER lens by intensity: extra passes run independently and are deduped, so higher
// intensity buys depth on the same lenses — not a diluted taxonomy.
const PER_LENS = { low: 1, medium: 2, high: 3 }[INTENSITY]
const LENSES = [
  { key: 'correctness',
    focus: 'Logical correctness and hidden assumptions: what must be true for this to work, ' +
           'and which of those is shakiest?' },
  { key: 'failure-modes',
    focus: 'Failure modes & edge cases: what breaks under bad input, load, concurrency, ' +
           'partial failure, retries, or unusual users?' },
  { key: 'security-integrity', /* … */ },
]`,
      },
    ],
  },

  critic: {
    path: "~/.claude/agents/critic.md",
    note: "the specialist paid to attack — read-only by construction",
    lang: "md",
    excerpt: `---
name: critic
tools: Read, Grep, Glob, Bash
model: opus
effort: xhigh
---

You are a rigorous, fair red-team reviewer. You receive a brief describing a proposed plan,
design, or decision, and your job is to find what's wrong with it BEFORE it's built — so the
cost of being wrong is a paragraph, not a rewrite.

## Stance
- Argue the strongest honest case AGAINST the proposal. Steelman the opposition; don't nitpick.
- Be specific and grounded. You may inspect the codebase read-only. Never modify anything.
- Be fair, not contrarian. Distinguish "this will bite you" from "this is a matter of taste."
  Rank by impact.`,
  },

  researcher: {
    path: "~/.claude/agents/researcher.md",
    note: "reads the web in its own window; returns conclusions, never pages",
    lang: "md",
    excerpt: `---
name: researcher
tools: WebSearch, WebFetch, Read, Grep, Glob
model: sonnet
effort: max
---

## Principles
- **Current over comprehensive.** Prefer the most recent authoritative sources. Treat anything
  older than ~18 months as possibly stale and say so.
- **Triangulate.** Verify important claims across multiple independent sources. If sources
  conflict, surface the disagreement instead of papering over it.
- **Compare, don't enumerate.** When there are options, compare them on the dimensions that
  matter for the stated goal, then say which you'd pick and why.

## Output (return only this — keep raw page content out of your answer)`,
  },

  guardbash: {
    path: "~/.claude/hooks/guard-bash.sh",
    note: "the catastrophic-command guard — ancestors blocked, insides deletable",
    lang: "bash",
    excerpt: `# The smart part is rm protection: a recursive delete is blocked when its target
# RESOLVES to a protected directory (your home, your dev root) or an ANCESTOR of one
# -- while anything strictly *inside* a protected dir stays deletable (e.g. a project's
# build output, .../grocery-buddy/dist).
# This guards accidents, not deliberate obfuscation.

# ---- directories the guard refuses to recursively delete (or wipe the contents of) ----
# Each is protected *as a root*: the dir itself and anything above it is blocked, but
# anything strictly inside it stays deletable. $HOME keeps this portable (no username).
HOME_DIR="\${HOME:-/Users/geoandr}"
PROTECTED_DIRS=(
  "$HOME_DIR"          # your home directory
  "$HOME_DIR/dev"      # your dev root
)`,
  },

  guardsec: {
    path: "~/.claude/hooks/guard-secrets.sh",
    note: "high-confidence secrets never land in tracked files",
    lang: "bash",
    excerpt: `# PreToolUse(Edit|Write): block writing high-confidence secrets into tracked files.
# Exempts .env / example / key files where secrets legitimately live.
# Conservative on purpose (high-confidence patterns only). Fails OPEN on error.

# Files where secrets/placeholders legitimately live — skip them
case "$file" in
  *.env|*.env.*|.env|*/.env|*.local|*.example|*.sample|*.dist|*.tfvars|*/secrets/*|*.pem|*.key)
    exit 0 ;;
esac

c '-----BEGIN[A-Z ]*PRIVATE KEY-----'        && deny "private key"`,
  },

  fmt: {
    path: "~/.claude/hooks/format-on-edit.sh",
    note: "every write formatted, silently — never blocks",
    lang: "bash",
    excerpt: `# PostToolUse(Edit|Write): auto-format the file just touched.
# Never blocks; silently skips if no formatter is available. Always exits 0.

case "$file" in
  *.py)
    if have ruff; then ruff format "$file" >/dev/null 2>&1; ruff check --fix "$file" >/dev/null 2>&1; fi
    ;;
  *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs|*.json|*.jsonc|*.css|*.scss|*.less|*.html|*.vue|*.svelte|*.md|*.mdx|*.yaml|*.yml|*.graphql)
    if have prettier; then prettier --write "$file" >/dev/null 2>&1
    elif have npx; then npx --no-install prettier --write "$file" >/dev/null 2>&1; fi`,
  },

  sessctx: {
    path: "~/.claude/hooks/session-context.sh",
    note: "orientation in a dozen lines — git state + the last handoff's next steps",
    lang: "bash",
    excerpt: `# SessionStart: inject lightweight orientation — git state + latest handoff's next steps.
# Plain stdout is injected into context. Keep it short. Always exits 0.

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  dirty=$(git status --porcelain 2>/dev/null | grep -c .)
  last=$(git log -1 --oneline 2>/dev/null)
  echo "Git: on '\${branch}', \${dirty} uncommitted change(s). Last commit: \${last}"
fi

hdir=".claude/handoffs"
if [ -d "$hdir" ]; then
  latest=$(ls -1 "$hdir"/*.md 2>/dev/null | sort | tail -n 1)
  # Print the "Next steps" section only, capped, so the prefix stays lean.
  awk '/^##[[:space:]]+Next steps/{f=1;print;next} /^##[[:space:]]/{f=0} f' "$latest" | head -n 15
fi`,
  },

  handoff: {
    path: "~/.claude/skills/handoff/SKILL.md",
    note: "state that survives sessions — written to disk, not remembered",
    lang: "md",
    excerpt: `# Handoff

Write a continuation handoff from THIS session. This runs here, not in a subagent, on purpose:
the value is the live session context, which a subagent can't see.

## Steps
1. Get a real timestamp: run \`date "+%Y-%m-%d-%H%M"\`. Don't guess it.
2. Create \`.claude/handoffs/\` if it doesn't exist.
3. Write \`.claude/handoffs/<timestamp>-<short-slug>.md\` using the structure below.

## Structure (keep the \`## Next steps\` heading exactly — the session-start hook reads it)

## State
- DONE and verified (note how it was verified).
- In progress / partially done.
- Anything broken or known-bad right now.`,
  },

  onboard: {
    path: "~/.claude/skills/onboard/SKILL.md",
    note: "loads the handoff, then verifies its claims against reality",
    lang: "md",
    excerpt: `# Onboard

Get up to speed fast at the start of a session — the counterpart to \`/handoff\`.

## How to run this
1. **Find the handoff.** If \`$ARGUMENTS\` names a file, use it. Otherwise read the most recent
   file in \`.claude/handoffs/\` (sort by name — they're timestamped).
2. **Load what it points to.** Read the "Next steps", "Watch out for", and "Pointers" sections,
   then read the specific files/docs referenced — enough to act, not the whole repo.
3. **Verify the stated state** Quickly sanity-check that "done" items still look done and
   "broken" items are as described — Flag any drift between the handoff and reality.
4. **Brief me back:** 3–5 lines on where we are + the single recommended next action. Then wait
   for my go.`,
  },

  docs: {
    path: "~/.claude/skills/update-docs/SKILL.md",
    note: "doc changes are approval-gated — update, never sprawl",
    lang: "md",
    excerpt: `# Update docs

Bring the project's docs in line with what we built this session. Be surgical — update what's
affected, don't rewrite everything, and don't sprawl unnecessary new docs.

## How to run this
1. **List what changed.** From this session (plus \`git diff\` / \`git status\` if useful),
   enumerate the files, features, and decisions that have documentation implications. You have
   this context; the subagent won't, so capture it concretely.

2. **Survey existing docs, delegated.** Spawn an \`Explore\` subagent with: the list of changes +
   "find the docs directory(ies) and every existing doc affected by these changes"`,
  },

  ledger: {
    path: "~/.claude/skills/token-breakdown-stats-session/SKILL.md",
    note: "one of six lenses — the census that ranks every session by cost",
    lang: "md",
    excerpt: `# Token breakdown stats — per session

Scan every session and total its cost (main thread + all subagents), then rank sessions and
report grand totals. The complement to \`/token-breakdown-stats-skill\`. Reads from disk in a
subprocess; only the small summary enters this chat.

## How to run this
1. **Run the per-session census** (saves a bar chart + JSON to \`~/dev/token-breakdowns/\` and
   auto-opens). Use \`--limit N\` for the printed row count if I asked for one (default 30)`,
  },

  gates: {
    path: "jim-agent/.claude/gate.sh",
    note: "one per repo — the guard-commit hook runs this on every git commit and blocks on red",
    lang: "bash",
    excerpt: `#!/usr/bin/env bash
# Health gate — runs on every \`git commit\` via the global guard-commit hook.
# Fast (<120s target; ~15s in practice): lint + the full offline test suite.
# Skip deliberately with \`git commit --no-verify\`.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "gate: ruff check"
run ruff check .

# Full offline suite (~10s, 338 tests) — no DB/network/API-key/wallet needed by
# design, and the hypothesis fuzz tests are derandomized + bounded, so nothing
# is excluded for speed. -p no:cacheprovider keeps the gate from writing
# .pytest_cache state during a commit.
echo "gate: pytest (offline suite)"
run pytest -q -p no:cacheprovider

echo "gate: OK"`,
  },

  evals: {
    path: "jim-agent/.claude/evals.sh",
    note: "tests for the nondeterministic parts — offline, zero-credential, baseline-armed",
    lang: "bash",
    excerpt: `# Offline eval suite — picked up by the nightly digest convention (like gate.sh
# is by guard-commit). Runs the deterministic suites only (gate + guards +
# scenarios: no key, no DB, no network, no spend; ~2s) and persists the run
# under ./eval_runs (gitignored) so \`jim-eval ui\` can plot trends. Any failing
# offline case exits 1; with a baseline set (\`jim-eval baseline set <id>\`),
# --compare-baseline also exits 1 on regression vs that baseline.

# jim-eval runs without tests/conftest.py, so neutralize the same .env leakage
# the test suite does: empty values override .env in pydantic-settings, forcing
# the in-memory store and the no-key/testnet paths. The offline suites need
# none of these — this guarantees zero credentials, zero cost, and reproducible
# results whatever the local .env says.
export DATABASE_URL=""
export ANTHROPIC_API_KEY=""

echo "evals: jim-eval (offline suites)"
run jim-eval run --suite offline --compare-baseline --label nightly`,
  },

  night: {
    path: "~/dev/scripts/nightly-gate-digest.sh",
    note: "launchd fires it at 06:17 — every repo's gate + evals, digested to one dated file",
    lang: "bash",
    excerpt: `# nightly-gate-digest.sh — run each focus project's .claude/gate.sh and write a dated digest.
# Exit 0 = all gates green; exit 1 = at least one failure (lets a scheduler/notifier branch on it).

REPOS=(jim-agent grocery-buddy procurement-agent dj-agent)
out="$OUT_DIR/$(date +%F).md"

for r in "\${REPOS[@]}"; do
  if log=$(cd "$ROOT/$r" && "$gate" 2>&1); then status="✅ pass"; else status="❌ FAIL"; overall=1; fi
  printf '## %s — %s (%ss)\\n' "$r" "$status" "$dur" >> "$out"

  # Optional per-repo offline evals (.claude/evals.sh): zero-credential, zero-LLM-cost suites
  # only. They run here nightly — never in the commit gate, so gates stay <120s.
  if elog=$(cd "$ROOT/$r" && "$evals" 2>&1); then estatus="✅ evals pass"
  else estatus="🟡 EVAL REGRESSION"; overall=1; fi
done`,
  },

  board: {
    path: "me-2/scripts/file-report.sh · scripts/curate.sh",
    note: "the site is the instrument panel — it files its own report daily and curates its own entries weekly",
    lang: "bash",
    excerpt: `# file-report.sh — the fleet files its own morning report, unconditionally.
# Measurement runs in THIS checkout (real repo paths, real transcripts) —
# but the record publishes through a detached worktree pinned to origin/main,
# so filing never depends on which branch the operator's checkout is on.
FLEET_SNAPSHOT_PATH="$PAD/data/fleet-snapshot.json" npm run ops:snapshot -- 24
git -C "$PAD" commit --quiet -m "ops: file the fleet report ($(stamp))"
git -C "$PAD" push origin HEAD:main

# curate.sh — the archive maintains its own content (Sunday 07:15).
# Drift first: repo's last commit vs the entry's updated date — no drift,
# no model run, $0. Then a headless /update-project per drifted entry,
# merged to main ONLY if the content check, the production build and the
# content-scope allowlist all pass. The model writes; code decides what ships.
node scripts/check-content.mjs || GATES_OK=0
npm run build >/dev/null 2>&1 || GATES_OK=0`,
  },
};
