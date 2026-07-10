---
title: The Claude Code Bible — George's Power-User Operating Manual
collection: harness
source: ~/dev/agentic-harness/docs/CLAUDE_CODE_BIBLE.md
sourceMtime: '2026-07-10T10:03:35.463Z'
sourceCommit: 20ea825
syncedAt: '2026-07-10'
summary: >-
  This is written specifically for your situation: a 16-agent portfolio built on
  one architectural theorem (a deterministic, unit-testable gate owns every
  irreversible action), a shared agent-core ha…
contentHash: 'sha256:e38175edfa2929b6a8d79e9e23bfeaa2f2696efbc38ac01dd576250cd010500a'
---
# The Claude Code Bible — George's Power-User Operating Manual

> **The one sentence:** Treat Claude Code the way you treat your agents — *the model proposes, your config disposes.* Every surface below (CLAUDE.md, MCP, skills, hooks, subagents, worktrees, automation) is a different way to encode "your config" so the model walks into every task already loaded with the right context, the right tools, and the right guardrails.

This is written specifically for **your** situation: a 16-agent portfolio built on one architectural theorem (a deterministic, unit-testable gate owns every irreversible action), a shared `agent-core` harness, a house stack of **Temporal + Supabase/pgvector + Langfuse + Telegram HITL + offline evals + MCP exposure**, and a build sequence of **Mnemo → Provenance → Quill** under a hard EU AI Act (Aug 2, 2026) audit bar.

---

## How to read this

- **Part I** is the only mental model you must internalize: context is a *cache*, not a folder. Everything else is downstream of it.
- **Parts II–VIII** are the seven configurable surfaces. Each part is structured the same way: **What it is → The cost model → What *you* should do.**
- **Part IX** is your concrete, copy-paste setup.
- **Part X** is a 30-day rollout so you don't try to boil the ocean.
- **Appendix A** answers each of your specific questions directly. **Appendix B** is anti-patterns. **Appendix C** is the list of things you had *slightly* wrong (you were mostly right).

---

# PART I — THE ONE MENTAL MODEL: CONTEXT IS A CACHE, NOT A FOLDER

Everything you intuited about KV cache is correct. Here's the precise version, because the precision is what unlocks the rest.

## I.1 — Every turn rebuilds the whole request

When you send a message, Claude Code does **not** "continue" a live session in the model's memory. It re-sends the entire request from scratch every single turn:

```
[ system prompt ] [ tool definitions ] [ CLAUDE.md ] [ skills index ] [ ...conversation history... ] [ your new message ]
└─────────────────────── STABLE PREFIX ───────────────────────┘ └──────── VOLATILE SUFFIX ────────┘
```

The model has no memory between turns. The *only* thing that makes this affordable and fast is **prompt caching (KV cache)**: the model's internal computation over a token prefix is cached and reused on the next request *as long as that prefix is byte-for-byte identical.*

## I.2 — The numbers that matter

| Property | Value | Implication for you |
|---|---|---|
| Default cache TTL | **5 minutes**, *sliding* (every cache hit resets the timer) | Keep working and the cache stays warm indefinitely. Walk away for 6 minutes and the next turn recomputes the prefix. |
| Extended TTL | **1 hour** — **automatic on a Claude subscription** (opt-in on raw API keys via `ENABLE_PROMPT_CACHING_1H=1`) | You almost certainly get 1h caching for free. Long think-breaks mid-task are cheap. |
| Cache granularity | **Prefix-based.** The cache matches the *longest identical prefix.* | Any change at position *N* invalidates the cache for everything from *N* onward. Order matters enormously. |
| Cost of a hit | ~10% of the price of recomputing those tokens | A warm cache is roughly 10× cheaper on input. This is the entire game. |

## I.3 — What actually busts the cache (and what *doesn't*)

This is where most people's mental model is wrong. You were right about the principle; here are the exact rules.

**Busts the prefix (expensive — avoid mid-task):**
- Switching **model** (each model has its own cache) or **effort level**, or toggling **fast mode**.
- **Compaction** or `/clear` (history is replaced by a summary — by design).
- Denying a tool entirely (it leaves the system prompt).
- Upgrading Claude Code.
- Connecting/disconnecting an MCP server **only if its tools are eagerly loaded into the prefix** (see the deferred-tools revelation below — for you, mostly they aren't).

**Does NOT bust the cache (you were probably over-worried about these):**
- **Editing CLAUDE.md mid-session** — the edit doesn't apply until the next session start. It's not silently recomputing every turn.
- **File edits / reading files** — these *append* to the volatile suffix; they don't change the prefix.
- **Invoking a skill or slash command** — appends to the suffix.
- **Spawning a subagent** — the subagent gets its *own* fresh cache; your main session's cache is untouched.
- **`/rewind`** — reuses an earlier cached prefix.

**The takeaway:** the prefix is your fixed cost; the conversation is your variable cost. Power-using Claude Code is mostly the discipline of **keeping the prefix small and stable, and keeping the conversation window clean.**

## I.4 — The deferred-tools revelation (this corrects your MCP worry)

You asked: *"Should I turn off the Supabase MCP when I'm not doing database work, or is the difference negligible?"*

Here's the thing that changes the answer: **on Opus and Sonnet, Claude Code no longer loads all MCP tool schemas into the prefix.** It uses a **ToolSearch** mechanism — tool *names* are known, but the full (expensive) JSON schemas are fetched lazily, only when a tool is actually about to be used.

I can prove this is active in *your* setup: in this very session, your Supabase, Notion, Spotify, Figma, Vercel, Postman, Google Calendar/Drive tools all showed up as **deferred** — present by name, schemas not loaded. They were costing you a tiny fraction of what you feared.

**So the precise answer to your question:** The raw *context/cache* cost of a connected-but-idle MCP is **small** now — it is **not** the emergency you imagined, and you do **not** need to manually toggle MCPs on and off for token reasons. But there are still **three real reasons to curate** MCPs per project — and they're more important than tokens. See Part III.

## I.5 — The three budgets

Hold all three in your head; every config decision trades against them:

1. **Prefix budget** — tokens in the stable prefix (system + tools + CLAUDE.md). Paid every turn at cache-hit rates. Keep it *small and stable*.
2. **Window budget** — tokens in the live conversation. Paid every turn at full rate, and it grows. Big file dumps, verbose tool output, and "how we got here" noise eat this. *Delegate noisy work to subagents so the noise lands in their window, not yours.*
3. **Attention budget** — the model's finite ability to *use* what's in the window. Even with 1M context, a window stuffed with 50 half-relevant tool results produces worse reasoning than a clean one. *Less, but more relevant, beats more.*

> **Prime directive:** Keep the prefix small and stable. Keep the window clean and relevant. Push everything else to the edges — subagents, hooks, skills, scripts — so it only enters the window at the moment it's needed.

Every remaining part of this Bible is an application of that directive.

---

# PART II — CLAUDE.md (THE ALWAYS-ON CONTEXT)

## II.1 — What it is

`CLAUDE.md` is a markdown file auto-loaded into the **stable prefix** at session start. It's how you give Claude durable, always-true instructions without retyping them. It has a hierarchy, all merged:

| Scope | Path | Loaded when | Use it for |
|---|---|---|---|
| **User** | `~/.claude/CLAUDE.md` | Every session, every project | *Who you are, how you work, your house style* (gate thesis, stack defaults, conventions) |
| **Project** | `<repo>/CLAUDE.md` | Sessions in that repo | *This repo's architecture, commands, gotchas* |
| **Subdirectory** | `<repo>/sub/CLAUDE.md` | Only when working in `sub/` | Module-specific rules, loaded *on demand* |
| **Local (gitignored)** | `<repo>/CLAUDE.local.md` | That repo, not committed | Personal scratch notes, local-only paths |

You can also pull files in with `@path/to/file` imports — **but be careful: an `@import` loads that file's full content into the prefix every turn.**

## II.2 — The cost model

CLAUDE.md is in the **prefix**. Every line you add is paid (at cache-hit rates) on every turn, in every session, forever. This is exactly why your instinct — *"we pay for this context every single turn even when it's 90% irrelevant"* — is the correct instinct, and why your Copilot pattern needs rethinking.

**Your Copilot "router that imports everything" pattern is an anti-pattern here.** A router whose job is to `@import` ten instruction files just loads all ten files into the prefix every turn — the worst of both worlds. The fix isn't "one giant file" *or* "a router that inlines everything." It's:

- **CLAUDE.md = the lean, always-true core** (the 10% that's relevant to *every* task).
- **Everything contextual = pulled in only when relevant** — via subdirectory CLAUDE.md (loads only in that dir), or skills (load only when invoked), or by *naming where things are* so Claude reads them on demand.

> Rule of thumb: if a piece of guidance isn't relevant to **most** turns in a session, it does **not** belong in CLAUDE.md. It belongs in a skill, a subdir CLAUDE.md, or a doc you point to by path.

## II.3 — What you should do

**A. Write a lean user-level `~/.claude/CLAUDE.md` that encodes your house style once.** This is the single highest-leverage file you can create, because it makes *every* session in *every* agent repo start with your architecture baked in. Keep it under ~40 lines. Draft in Part IX.

**B. Give every agent repo a tight project `CLAUDE.md`** with the five things Claude always needs and always re-derives painfully without:
1. **What this agent gates** (the irreversible action + the gate function's location, e.g. `gate/send_gate.py`).
2. **How to run it** (the dev command, the MCP entrypoint, e.g. `grocery-buddy mcp`).
3. **How to test it** (`uv run pytest`, where the gate tests live, where the eval suite lives).
4. **The stack** (Temporal/Supabase/Langfuse/Telegram) and any non-obvious local setup.
5. **The one or two gotchas** that waste a session if unknown (e.g. "Amazon has no consumer API; onboarding reads order history" / "Playwright session is persistent, don't blow it away").

**C. Point, don't inline.** Instead of `@import docs/ARCHITECTURE.md` (loads it every turn), write: *"Architecture lives in `docs/ARCHITECTURE.md`; read it before touching the workflow shell."* Claude reads it once, when relevant, into the *window* — not every turn into the *prefix*.

**D. Use `#` to teach it in-session.** When you correct Claude and want it to stick, prefix your message with `#` — it offers to write the lesson into the appropriate CLAUDE.md. This is how the file should *grow*: from real friction, not speculation.

> **The dj-agent CLAUDE.md you already have is a good model** — it's concrete about phases, tests, and stack. Generalize that quality to the other repos, and lift the *cross-cutting* parts (gate thesis, eval discipline, stack defaults) up into the user-level file so you write them once.

---

# PART III — MCP (GIVING CLAUDE HANDS)

## III.1 — What it is

MCP (Model Context Protocol) servers give Claude **tools** — the ability to *act* on external systems (query Supabase, create a Notion page, deploy to Vercel, drive a browser). You've already connected a strong set: Supabase, Notion, Vercel, Postman, Figma, Google Calendar/Drive, Spotify.

## III.2 — The cost model (revised for deferred loading)

As established in Part I.4: with ToolSearch/deferred loading active (it is, for you), the **token cost** of connected-but-idle MCP servers is small. So **stop worrying about tokens as the reason to toggle MCPs.** The real costs are:

1. **Tool-selection accuracy.** More tools in reach = more chances the model picks the wrong one, or burns a turn deciding. A focused toolset produces sharper behavior.
2. **Blast radius / safety surface** — *this is the big one for you.* Your Supabase MCP exposes `execute_sql`, `apply_migration`, `deploy_edge_function`. Your Vercel MCP can `deploy_to_vercel`. Those are **irreversible production-mutating actions.** Having them armed and in-reach during *unrelated* work is precisely the "the model can reach an irreversible action without a gate" anti-pattern **you sell against in your own products.** Apply your own thesis to your dev environment.
3. **Auth/credential surface** — every connected server is a live credential. Fewer live credentials per context = smaller attack surface (and you, of all people, care about prompt-injection surface — it's literally Quill's whole premise).

## III.3 — What you should do

**A. Stop toggling for tokens; start scoping for safety.** Keep your read-heavy MCPs (Notion, Calendar, Drive, Figma, Spotify) at **user scope** — they're broadly useful and low-risk. Move the **write/mutate-capable** MCPs (Supabase, Vercel) to **project scope** via `.mcp.json`, so they're only armed in the repos that actually deploy/migrate.

**B. Use the three MCP scopes deliberately:**

| Scope | Where | For |
|---|---|---|
| **User** | `~/.claude.json` / user settings | Broadly useful, low-risk servers |
| **Project** | `<repo>/.mcp.json` (commit it) | Servers this repo needs; shared with collaborators |
| **Local** | project settings, gitignored | Personal/experimental servers |

Per-project, gate which `.mcp.json` servers are active with `enabledMcpjsonServers` / `disabledMcpjsonServers` in `.claude/settings.json`, and inspect/connect/disconnect live with the **`/mcp`** command.

**C. The MCPs you're missing (high-value for an agent-builder):**

| MCP | Why it matters for your portfolio |
|---|---|
| **GitHub** | PRs, issues, CI status, code search across your 20+ repos. You're running a multi-repo portfolio — this is table stakes. (Available as a connector/plugin.) |
| **Playwright / browser** | Your house actuation modality (grocery-buddy, Hawk, Catch all drive real sites). A browser MCP lets Claude *drive and inspect* the same automation you're building — invaluable for debugging selectors and login flows. |
| **A docs/context server (e.g. Context7)** | Pulls *current* library docs (Temporal SDK, asyncpg, Anthropic SDK) into the window on demand instead of relying on training-cutoff memory. Cuts hallucinated APIs. |
| **Sentry / error-tracking** (when you add it) | For the always-on agents, surfacing runtime errors into a session closes the debug loop. |
| **Stripe / payments** (for Broker, Leech, procurement) | When those agents touch real settlement, a payments MCP lets you inspect state safely. |

**D. The custom MCPs you should build — and the surprise: you're already doing it.**

You said you weren't sure if you should build custom MCPs. You already are: **grocery-buddy exposes `grocery-buddy mcp`**, and you have `poc-mcp`, `sdd-mcp`, `hello`. Generalize that into a **portfolio convention**:

1. **Every agent exposes an MCP server for local dev/inspection.** A `<agent> mcp` entrypoint that surfaces: *current gate decisions, recent runs, pantry/ledger/memory state, last eval result.* This turns "debug my agent" into "ask Claude Code, which queries the agent's own MCP" — a massive feedback-loop accelerator. Bake it into the `agent-core` template so every new agent gets it free.

2. **Mnemo *is* a custom MCP — and it's the keystone.** Mnemo is on your roadmap as a memory MCP server with a staleness/supersession gate. Build it early (it's already your #1 build-first pick) because it pays off **twice**: it's a portfolio piece *and* it becomes the shared memory backend that **Claude Code itself** can call across all your dev sessions. Recall/remember/forget across every agent repo, with your gate semantics. That's the highest-compounding thing on your list.

3. **An `agent-core` "harness MCP"** exposing eval-run, trace-fetch (Langfuse), and gate-check across *any* agent built on the harness. One server, every repo benefits.

> **Build-vs-buy callout:** `agent-core` is, in part, you re-implementing the agent loop (model tiering, tool registration, tracing, sessions). The **Claude Agent SDK** (Python/TS) gives you the loop, hooks, subagents, MCP, and sessions as a library. Before you harden `agent-core` further, spend an afternoon evaluating whether the Agent SDK should *be* your harness's backbone, with `agent-core` becoming the thin layer that adds your gate/Temporal/Telegram conventions on top. This could delete a lot of code you're maintaining.

---

# PART IV — SKILLS (GIVING CLAUDE PROCEDURES)

## IV.1 — What it is (and yes, it's far more than a .md file)

A skill is a **directory** containing a `SKILL.md` plus, optionally, **scripts, reference docs, templates, and assets.** It packages a *procedure* — "here's how we do X around here" — and, crucially, can bundle **executable code** that does deterministic heavy lifting and feeds Claude only the distilled result.

```
.claude/skills/gate-check/
├── SKILL.md            # frontmatter + instructions
├── run_gates.py        # the deterministic script Claude runs
└── reference/
    └── gate-spec.md     # loaded only if Claude needs the deep detail
```

`SKILL.md` frontmatter (the fields you'll actually use):

```markdown
---
name: gate-check
description: Run every agent's deterministic gate test suite and print a pass/fail proof matrix. Use before any commit that touches a gate or actuation path.
allowed-tools: Bash, Read           # optional: pre-approve tools while active
# disable-model-invocation: true    # optional: user-only (/gate-check), hidden from auto-delegation
---

When invoked, run `python run_gates.py` and summarize the matrix.
If any gate fails, stop and report which irreversible action is unguarded.
Full gate spec is in reference/gate-spec.md — read it only if a gate's intent is unclear.
```

## IV.2 — Progressive disclosure (why skills are cheap)

This is the elegant part, and it's the same prefix-economics from Part I:

- **Always in context:** only the skill's `name` + `description` (a couple of lines). This is how Claude knows the skill *exists* and when to use it.
- **Loaded on invocation:** the full `SKILL.md` body — only once you (or Claude) trigger it.
- **Loaded on demand:** bundled reference files — only if `SKILL.md` tells Claude to read them for the case at hand.
- **Executed, not read:** bundled scripts run as code; their *output* enters the window, not their source.

So a skill with a 500-line reference doc and a heavy script costs you ~2 lines of prefix until the moment it's needed. **This is the cheapest way to give Claude deep capability.**

## IV.3 — Skills vs CLAUDE.md vs MCP (when to use which)

| Use… | When you want… |
|---|---|
| **CLAUDE.md** | Always-true facts/conventions, relevant to most turns (small, prefix) |
| **Skill** | A *procedure* invoked sometimes — especially one backed by a script (cheap until used) |
| **MCP** | A *live connection* to an external system (act on Supabase, browser, etc.) |

Mental model: **CLAUDE.md is what's always true. Skills are how we do specific things. MCP is what we can touch.**

## IV.4 — The killer pattern for you: script-backed skills

This is exactly what you sensed — "a skill that references scripts and runs automated work that feeds Claude more relevant info." For your portfolio, the deterministic scripts you'd bundle map 1:1 onto your existing discipline:

| Skill | What its script does | Why it's high-leverage for you |
|---|---|---|
| **`gate-check`** | Runs the pure-Python gate tests across the agent, prints a pass/fail matrix | Encodes your thesis as a one-command check; the "code disposes" proof, on demand |
| **`eval-run`** | Runs the offline eval suite, diffs vs golden set, summarizes regressions | You already have an `eval-runner` *subagent* in dj-agent — this is the portable, scriptable version |
| **`new-agent`** | Scaffolds a new agent: forks `agent-core`, lays down the standard Temporal/Supabase/Langfuse/Telegram/eval structure, stubs the gate + its test | Every one of your build plans opens with "Phase 0 — fork agent-core." Automate Phase 0 into one command. |
| **`trace`** | Pulls the last N Langfuse traces for a run and summarizes spans/cost | Turns "what did my agent just do" into a one-liner, output distilled into the window |
| **`proof-matrix`** | Regenerates the 16-agent × irreversible-action × gate table from the agent docs | Keeps your single most valuable portfolio artifact always current |
| **`demo-script`** | Generates/updates the 3-minute demo script + résumé bullets from an agent's docs | You ship these in every doc; standardize them |

**Where they live:** portfolio-wide skills (`gate-check`, `eval-run`, `new-agent`, `trace`) go in **`~/.claude/skills/`** (available everywhere). Agent-specific ones go in that repo's **`.claude/skills/`**.

> Start with **`new-agent`** and **`gate-check`**. The first compresses every project kickoff to one command; the second makes your core thesis a reflex you can run before any commit.

---

# PART V — HOOKS ("CODE DISPOSES," APPLIED TO YOUR DEV LOOP)

## V.1 — What it is

Hooks are **shell commands the harness runs automatically on lifecycle events.** They live in `settings.json`, run *outside* the model's context window, and can **block**, **inject context**, or **observe**. You nailed the intuition: they cost no window tokens until they choose to feed something in at a gate.

This is, almost literally, **your product thesis applied to your own development.** In your agents, "the model proposes, deterministic code disposes." Hooks are the deterministic code that disposes over *Claude Code's* actions. A `PreToolUse` hook that blocks a bad `git commit` is the same shape as `send_gate.py` blocking a bad email. **You already think in this pattern — now run your own dev loop on it.**

## V.2 — Events and capabilities

The events fall into groups (the core, always-available ones first):

| Event | Can it block? | Primary use |
|---|---|---|
| **`PreToolUse`** | **Yes** — `deny` / `ask` / `allow` | Gate dangerous actions (block `rm -rf`, block `execute_sql` on prod, require gate-tests-pass before `git commit`) |
| **`PostToolUse`** | No (already ran) — but can inject | Auto-format/lint/typecheck after every `Edit`/`Write`; feed results back |
| **`UserPromptSubmit`** | **Yes** | Inject just-in-time context into a turn (current branch, eval status); block on a tripwire |
| **`Stop` / `SubagentStop`** | Can force continuation | Run the test/eval gate when Claude thinks it's done; bounce it back if red |
| **`SessionStart`** | No | Inject session-open context (open PRs, failing tests, today's focus) |
| **`SessionEnd` / `Notification` / `PreCompact`** | No | Observe/log; save state before compaction |

(There are additional, newer events — permission, file-change, worktree, and agent-team lifecycle hooks. Check `code.claude.com/docs/en/hooks` for the current full set; the table above is the load-bearing core.)

**The contract** (so you can write them):
- Hooks receive a **JSON object on stdin** (`session_id`, `hook_event_name`, `cwd`, `tool_input`, …).
- **Exit code 0** = proceed; optional **JSON on stdout** to inject context or set a decision.
- **Exit code 2** = block; **stderr** is shown to Claude as the reason.
- To inject context: print JSON like `{"hookSpecificOutput": {"hookEventName": "UserPromptSubmit", "additionalContext": "..."}}`.
- To deny a tool: `{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "..."}}`.

Configured in `settings.json` with a **matcher** (exact `Bash`, list `Edit|Write`, or regex `mcp__.*supabase.*`):

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/format-and-check.sh" }] }
    ],
    "PreToolUse": [
      { "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/guard-commit.sh" }] }
    ]
  }
}
```

## V.3 — The hooks you should build

| Hook | Event · matcher | What it does | Why (for you) |
|---|---|---|---|
| **Format + typecheck on save** | `PostToolUse` · `Edit\|Write` | Run `ruff format && ruff check` (Py) or `prettier && tsc --noEmit` (TS) on the touched file; feed errors back | Tight, automatic feedback loop. Claude fixes its own mess before you see it. Zero window cost until something's wrong. |
| **Gate-tests-pass before commit** | `PreToolUse` · `Bash` | If the command is `git commit` and any gate test is red, **block** with the failing gate name | *Your thesis, enforced on yourself.* No commit can ship an unguarded irreversible action. This is the centerpiece. |
| **Prod-mutation guard** | `PreToolUse` · `mcp__.*(supabase\|vercel).*` | Block `execute_sql`/`apply_migration`/`deploy_*` unless an explicit env flag or confirmation is set | Keeps the production-mutating MCP tools behind a deterministic gate — exactly the discipline you preach |
| **Eval gate on "done"** | `Stop` | When Claude stops after touching agent logic, run the offline eval suite; if regressed, bounce it back with the diff | Makes "evals as a CI gate" a reflex during *development*, not just CI |
| **Session-open briefing** | `SessionStart` | Inject: current branch, failing tests count, open PRs for this repo, last eval score | Claude starts every session already oriented — no "what's the state here" round-trip |
| **Secret-scan before write** | `PreToolUse` · `Edit\|Write` | Block writes that would commit a Supabase/Telegram/Langfuse key | You're juggling many live credentials across repos; cheap insurance |

> **Start with two:** *format-and-check on save* (instant quality-of-life) and *gate-tests-pass before commit* (your thesis, automated). Both are ~15-line shell scripts. They will change how the whole loop feels within a day.

---

# PART VI — SUBAGENTS & WORKFLOWS (SCALING INTELLIGENCE HORIZONTALLY)

## VI.1 — The model you already have right

Your description was accurate: the main session is a **parent orchestrator** that delegates a scoped task to a **subagent** with its *own* context window; the subagent does the noisy work and returns **only its final result.** The "how we got here" bloat lands in the subagent's window and is discarded — your main window stays clean. This is **window-budget management** (Part I.5) made operational.

Two constraints to know:
- **Subagents can't nest.** A subagent can't spawn its own subagents. Orchestration is one level deep (the parent fans out).
- **Subagents start fresh.** They get your delegation prompt, not the whole conversation. Brief them well.

## VI.2 — When to delegate (the decision rule)

Delegate when the work is **noisy, parallelizable, or specialized:**

- **Noisy** → reading 12 files to answer one question, grepping a huge codebase, running a test suite with 500 lines of output. Let the noise die in the subagent; keep the conclusion.
- **Parallelizable** → independent questions across different subsystems, or the same operation across many files/repos. Fan out, run concurrently.
- **Specialized** → a task with its own standards: code review, ADR writing, eval running, planning. A dedicated agent with a tuned prompt does it better.

Keep it inline when the task is small, sequential, and you need the intermediate reasoning in *your* window to make the next call.

## VI.3 — You're further along than you think

**dj-agent already has a great subagent set:** `planner`, `reviewer`, `eval-runner`, `tutor`, `adr-writer`. **refiner** has a command-driven product workflow (`create-spec` → `create-tasks` → `execute-tasks`). The move now is to **promote the portable ones to user scope** so every repo gets them:

- Lift `planner`, `reviewer`, `eval-runner`, `adr-writer`, `tutor` into **`~/.claude/agents/`** (or into the `agent-core` template so every fork inherits them).
- Define a few **portfolio-specific** agents (below).

## VI.4 — Custom agents to define (with frontmatter)

`.claude/agents/<name>.md`:

```markdown
---
name: gate-auditor
description: Given a diff, verify every irreversible action is still behind a pure-code, unit-tested gate. Use after implementing any feature that touches actuation, money, sends, or DB writes.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You audit changes against the "model proposes, code disposes" thesis.
For the given diff: identify any new or modified irreversible action (send, buy, post,
deploy, write). For each, confirm (1) the decision is made by a pure-Python gate with no
LLM call in the allow/deny path, and (2) there's a pytest covering it. Report any
irreversible action that is unguarded or untested. Be adversarial — assume a gate is
missing until you've found its test.
```

| Agent | Job | Maps to your need |
|---|---|---|
| **`gate-auditor`** | Verify the thesis holds on every diff | Automates the most important review you do, on every change |
| **`eval-runner`** (promote from dj-agent) | Run evals, summarize regressions vs golden | Portfolio-wide eval discipline |
| **`agent-scaffolder`** | Stand up a new agent from `agent-core` end to end | Pairs with the `new-agent` skill; the agent handles the judgment, the skill handles the mechanics |
| **`web-actuation-debugger`** | Drive a site via the browser MCP, find the broken selector/login step, report the fix | grocery-buddy/Hawk/Catch all break on DOM churn — this is recurring pain |
| **`compliance-checker`** | Verify hash-chained audit log + HITL exist and are tested | The EU AI Act Art. 12/14 bar you design to, checked automatically |

## VI.5 — Day-to-day examples (concrete)

1. **"Why is grocery-buddy re-suggesting items I just bought?"** → orchestrator spawns an Explore agent to trace the in-transit-stock reconciliation logic across the repo; returns the 3 relevant functions + the likely bug. Your window never fills with 15 file reads.
2. **Cross-portfolio audit** → "Check all four shipped agents: does each have a pure-code gate test for its irreversible action?" → fan out 4 `gate-auditor` agents, one per repo, in parallel; get a 4-row matrix back. (You already ran a 23-agent research workflow to *generate* this portfolio — same muscle, pointed at verification.)
3. **PR review** → after a coherent chunk of work, `reviewer` agent reviews the diff for correctness + reuse; `gate-auditor` checks the thesis; both run before you commit.
4. **New agent kickoff (e.g. Mnemo)** → `agent-scaffolder` forks `agent-core`, lays down the structure, stubs `staleness_gate.py` + its test, wires Langfuse/Telegram — you arrive at Phase 1 with Phase 0 done.

## VI.6 — Dynamic workflows (the next tier)

When a task is big enough to need *deterministic* orchestration — fan-out, loops, verify-then-synthesize — Claude Code can run a **workflow**: a script that spawns many subagents in structured stages (parallel finders → adversarial verifiers → synthesis). You've already lived this (your portfolio came from a "4 briefs → 28 candidates → judge panel → 13 winners" workflow). Reach for it on **audits, migrations, and broad reviews** across your many repos — e.g. "audit all 20 repos for missing eval suites," "migrate every agent to the new `agent-core` tracing API." It's opt-in and spawns many agents, so you invoke it explicitly when the scale justifies it.

---

# PART VII — WORKTREES (PARALLEL PHYSICAL WORKSPACES)

## VII.1 — What it is, and how it differs from subagents

A **git worktree** is a second working directory backed by the *same* repo, checked out to a
*different* branch. Multiple worktrees share one `.git` but have independent checkout files.
Claude Code integrates this: `claude --worktree <name>` (or the worktree tools) gives a
collision-isolated checkout at `.claude/worktrees/<name>/`. This is not a security sandbox.

Here's the distinction you were reaching for:

| | **Subagent** | **Worktree** |
|---|---|---|
| Isolates… | **Context** (separate window) | **Checkout changes + branch** (not host authority) |
| Same files on disk? | Yes (shares your cwd) | **No** — its own checkout, its own branch |
| Mental model | "A teammate I hand a question to, who reports back" | "A second desk where a different feature is laid out" |
| Use for | Noisy/parallel/specialized *reasoning* | Parallel *code changes* that would otherwise collide |

So: **not** "manual subagents." Worktrees solve a different problem — running **multiple
changes in parallel without them stepping on each other's checkout files.** They still share
the host, home directory, Git metadata, caches, processes, ports, network, credentials, and
external accounts unless another containment mechanism says otherwise. You *can* combine them:
a workflow can give each file-mutating agent its own worktree so parallel edits don't conflict.

## VII.2 — When you'd actually use it

- **Two features in flight at once.** Build Mnemo in one worktree, Provenance in another, each its own `claude` session on its own branch. No stashing, no branch-switching thrash, no "wait did I leave uncommitted changes."
- **Long-running agent + you.** An agent grinds on a refactor in a worktree while you keep working on `main` in your primary checkout.
- **Risky experiment.** Try the "fold `agent-core` onto the Agent SDK" spike in a throwaway worktree; delete it if it doesn't pan out.

## VII.3 — The one setup gotcha for you

Your repos may rely on **gitignored secrets** (`.env` with Supabase/Telegram/Langfuse keys).
A fresh worktree will not have them. A `.worktreeinclude` can copy local configuration for
low-risk development convenience, but copying a broad `.env` also copies its authority.
Prefer task-scoped, short-lived credentials exposed through constrained tools or a credential
broker for consequential work. If local copying is acceptable, include only the minimum
development values and document that the worktree is not contained.

---

# PART VIII — THE AUTOMATION LAYER (/loop, ROUTINES, BACKGROUND, REMOTE, AGENT TEAMS, SDK)

There are two distinct uses of automation for you, and conflating them causes confusion:
- **(a) Automating how you *build*** (dev-loop automation).
- **(b) The automation patterns your *products* use** (your agents are themselves always-on automations).

They share machinery, which is why studying Claude Code's automation layer doubles as R&D for your agents.

| Feature | What it is | Use it for (you) |
|---|---|---|
| **`/loop`** | Re-runs a prompt/command on an interval, or self-paced. Session-scoped, ≤7-day. | Babysit CI on a PR; poll a Temporal workflow until it completes; iterate "run evals, fix the worst regression, repeat" until green. |
| **Scheduled tasks / Routines (cron)** | Recurring runs that survive restarts (desktop) or run unattended in the cloud (routines; cron + GitHub-event triggers). | A nightly "run all eval suites across the portfolio and post a digest"; a weekly "regenerate the proof matrix + demo scripts." This is also the *exact* shape of Daybreak/Quill's nightly heartbeat — prototype the pattern on your own dev chores first. |
| **Background / `--background`** | Detaches a session to run unattended; notified on completion; monitor via `/tasks`, desktop, or web. | Kick off a long migration agent and keep working; get pinged when it's done. |
| **Push notifications** | Alerts when a background/remote run finishes or needs input. | The HITL-over-a-channel pattern — same idea as your Telegram approval flow, applied to your dev agents. |
| **Remote / web dispatch** | Trigger and monitor Claude Code from web/desktop, and via API/webhooks (routines). | Trigger an agent run from a GitHub event; check on a long job from your phone. |
| **Agent teams** *(experimental)* | Multiple *full* Claude sessions collaborating via a shared task list + messaging. Each is a full instance — **much** higher token cost. Enable with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. | Skip for now. Subagents + worktrees cover your needs at a fraction of the cost. Revisit only for genuinely parallel, independent multi-day workstreams. |
| **Claude Agent SDK** | Claude Code's agent loop **as a Python/TS library** (tools, hooks, subagents, MCP, sessions, caching). | The strategic one: evaluate it as the backbone of `agent-core` (see Part III.D). It may already provide what you're hand-rolling. |

> For day-to-day dev, the two that earn their keep immediately are **`/loop`** (babysit CI / iterate-to-green) and **routines** (nightly portfolio eval digest). The rest are situational. Agent teams are a "later."

---

# PART IX — YOUR SETUP (THE BLUEPRINT)

This is the concrete "my setup" you asked for. Build it in the order of Part X.

## IX.1 — `~/.claude/` (user scope — written once, helps every repo)

```
~/.claude/
├── CLAUDE.md                 # your house style (lean, <40 lines)
├── settings.json             # model, hooks, MCP enablement
├── agents/                   # portfolio-wide subagents
│   ├── gate-auditor.md
│   ├── reviewer.md           # promoted from dj-agent
│   ├── eval-runner.md        # promoted from dj-agent
│   ├── planner.md            # promoted from dj-agent
│   └── adr-writer.md         # promoted from dj-agent
└── skills/                   # portfolio-wide skills
    ├── new-agent/SKILL.md    # fork agent-core, scaffold standard structure
    ├── gate-check/SKILL.md   # run gate tests → proof matrix
    ├── eval-run/SKILL.md     # run evals → regression diff
    └── trace/SKILL.md        # fetch + summarize Langfuse traces
```

**`~/.claude/CLAUDE.md` starter (edit to taste):**

```markdown
# How I work

I build a portfolio of AI agents on one thesis: **the model proposes, deterministic
code disposes.** A pure-Python (or pure-SQL), unit-tested gate — never the LLM — owns
every irreversible action (send, buy, post, deploy, write). The gate is the product.

## Defaults for any agent repo
- Stack: Temporal (durable workflow + HITL signals), Supabase Postgres + pgvector,
  Langfuse (tracing), Telegram (HITL approval), offline eval suite wired as a CI gate.
- Shared harness: `agent-core` (provider-neutral qualified model aliases, tree-wide budget,
  tracing, evals). Routing policy lives in `docs/OPERATING_MANUAL.md` §10.
- Every agent exposes an MCP server (`<agent> mcp`) for local inspection.
- Compliance bar: immutable hash-chained audit log + HITL (EU AI Act Art. 12/14).

## House rules for working with me
- Never put an LLM call in a gate's allow/deny path. Flag it if you see one.
- Every irreversible action needs a pytest. No gate ships untested.
- Prefer editing existing code over new files; match the surrounding style.
- Tests: `uv run pytest` (Python). Lint: `ruff`. Don't commit if gate tests are red.
- When you finish agent logic, run the eval suite before declaring done.
```

## IX.2 — `agent-core` as the template (the multiplier)

Make `agent-core` ship a `.claude/` template that every fork inherits, so the conventions propagate automatically:

```
agent-core/.claude/
├── settings.json         # PostToolUse format/check, PreToolUse gate-before-commit
├── hooks/
│   ├── format-and-check.sh
│   ├── guard-commit.sh    # block git commit if gate tests red
│   └── session-brief.sh   # SessionStart: branch + failing tests + last eval
├── agents/
│   ├── gate-auditor.md
│   └── web-actuation-debugger.md
└── skills/
    └── gate-check/SKILL.md
```

Plus a project `CLAUDE.md` template with the five-point checklist from Part II.3, and a **`.worktreeinclude`** listing `.env` and local config.

## IX.3 — Per-project `.mcp.json` (scoping the dangerous tools)

In repos that deploy/migrate (the Supabase/Vercel ones), commit a `.mcp.json` arming exactly those servers, and keep them *out* of user scope so they're not armed elsewhere. Pair with the **prod-mutation guard** hook (Part V.3).

## IX.4 — The starter kit (build this in week one)

The minimum set that changes how the loop feels:
1. `~/.claude/CLAUDE.md` — house style.
2. Two hooks — `format-and-check` (PostToolUse) + `guard-commit` (PreToolUse).
3. Two skills — `new-agent` + `gate-check`.
4. One agent — `gate-auditor`.
5. Move Supabase/Vercel MCP to project scope; keep the rest at user scope.

---

# PART X — 30-DAY ROLLOUT

Don't build all of this at once — you'll abandon it. Adopt in waves, each delivering value before the next.

**Week 1 — Foundation (prefix + reflexes).**
- Write `~/.claude/CLAUDE.md` (Part IX.1). Biggest single ROI.
- Add the two hooks: `format-and-check`, `guard-commit`.
- Move write-capable MCPs (Supabase, Vercel) to project scope.
- *Outcome:* every session starts oriented; bad commits are blocked; your thesis is enforced on you.

**Week 2 — Procedures (skills + agents).**
- Build `gate-check` and `new-agent` skills.
- Promote dj-agent's `reviewer`/`eval-runner`/`planner`/`adr-writer` to `~/.claude/agents/`; add `gate-auditor`.
- *Outcome:* project kickoff is one command; review/eval/gate-audit are reflexes.

**Week 3 — The harness multiplier.**
- Bake the `.claude/` template (hooks + agents + skills + `.worktreeinclude`) into `agent-core`.
- Spike the **Agent SDK vs hand-rolled `agent-core`** evaluation in a worktree (Part III.D).
- *Outcome:* every future agent inherits the whole setup for free; you've de-risked the harness's foundation.

**Week 4 — Compounding + automation.**
- Build **Mnemo** as a memory MCP (portfolio piece *and* your cross-session Claude Code memory) — it's your #1 build-first pick and it compounds everything.
- Add a nightly **routine**: run all eval suites across the portfolio, post a digest.
- Try **worktrees** for real: Mnemo in one, Provenance in another.
- *Outcome:* shared memory across all dev; portfolio health watched automatically; parallel feature work without thrash.

---

# APPENDIX A — DIRECT ANSWERS TO YOUR QUESTIONS

**KV cache / 5-min TTL / stable-front-volatile-back?** Correct on all counts. Additions: the 5-min TTL *slides* (resets on each hit), you likely get **1-hour caching free** on a subscription, and the things that bust it are model/effort/fast-mode switches and compaction — *not* editing CLAUDE.md mid-session (that applies next restart) and *not* idle MCPs (deferred). See Part I.

**Should I turn MCPs on/off per project (e.g. Supabase when not doing DB work)?** Not for **tokens** — deferred loading makes idle MCPs cheap (proven in your session). **Yes** for **safety/clarity:** scope write-capable MCPs (Supabase `execute_sql`/`apply_migration`, Vercel `deploy`) to the repos that need them, and gate them with a hook. Keep read-heavy ones (Notion/Calendar/Drive/Figma) at user scope. See Part III.2–III.3.

**Other MCPs I should connect?** GitHub (multi-repo PRs/CI/issues), a browser/Playwright MCP (your house actuation modality), a docs/context MCP for current library APIs, and later Sentry + Stripe. See Part III.3C.

**Custom MCPs I should build?** You already build them (grocery-buddy, poc-mcp, sdd-mcp). Standardize: **every agent exposes a `<agent> mcp` inspection server** (into the `agent-core` template), and build **Mnemo** early — it's a portfolio piece *and* your shared Claude Code memory. See Part III.3D.

**Skills — what should I build, and the script angle?** Yes, skills bundle scripts and run automated work, costing ~2 prefix lines until used (progressive disclosure). Build `new-agent`, `gate-check`, `eval-run`, `trace`, `proof-matrix`. See Part IV.

**Hooks?** Shell scripts on lifecycle events; block / inject / observe; outside the window until they gate. This *is* "model proposes, code disposes" applied to your dev loop. Start with `format-and-check` (PostToolUse) and `guard-commit` (PreToolUse). See Part V.

**Subagents — tangible day-to-day uses?** Parent orchestrator delegates noisy/parallel/specialized work; only the result returns; can't nest. You already have a strong set in dj-agent — promote them to user scope and add `gate-auditor`. Examples in Part VI.5.

**CLAUDE.md — how, given per-turn cost?** It's prefix, paid every turn — so keep it lean and *always-true*. Your Copilot "router that imports everything" is an anti-pattern (it inlines everything into the prefix). Instead: lean user-level house style + tight project files + *point* to docs by path (read on demand) + subdir CLAUDE.md for module rules. See Part II.

**Worktrees — is this "manual subagents"?** No. Subagents isolate **context**; worktrees isolate **filesystem + branch**. Worktrees are for running parallel *code changes* without collisions (Mnemo and Provenance at once). Add `.worktreeinclude` so your `.env` secrets copy into new worktrees. See Part VII.

**/loop, agent teams, remote/dispatch?** `/loop` = recurring/self-paced in-session (babysit CI, iterate-to-green). Routines = unattended cron (nightly portfolio eval digest). Background/remote/push = detach long jobs, monitor from anywhere. Agent teams = experimental, costly, *skip for now*. The Agent SDK is the strategic one — evaluate it as `agent-core`'s backbone. See Part VIII.

---

# APPENDIX B — ANTI-PATTERNS TO AVOID

- **The kitchen-sink CLAUDE.md.** Every speculative rule you add is a tax on every turn forever. Earn lines from real friction (use `#`).
- **The import-everything router.** `@import`-ing ten files into CLAUDE.md inlines all ten into the prefix. Point to paths instead.
- **Toggling MCPs for token reasons.** Deferred loading made this obsolete. Curate for *safety*, not tokens.
- **Live production-mutating tools armed during unrelated work.** The exact anti-pattern you sell against. Scope + gate them.
- **Doing noisy work inline.** Reading 15 files in your main window when a subagent could return the 3-line answer. Protect the window budget.
- **LLM in a gate's allow/deny path** — in your products *and* in your hooks. Gates are deterministic, or they aren't gates.
- **Editing CLAUDE.md mid-session and expecting it to apply now.** It loads next session start.

---

# APPENDIX C — WHERE YOUR MENTAL MODEL WAS SLIGHTLY OFF

You were ~85% right. The corrections:
1. **MCP context cost.** You feared idle MCPs were expensive; deferred tool-loading makes them cheap. Curate for safety, not tokens.
2. **CLAUDE.md cache impact.** Editing it doesn't recompute the prefix every turn — it applies next session.
3. **1-hour caching.** Probably already on for free (subscription), not something you must engineer.
4. **Subagents don't nest.** Orchestration is one level deep; plan fan-out accordingly.
5. **Worktrees ≠ manual subagents.** Different axis of isolation (files/branch vs context).
6. **Agent teams** are experimental and token-heavy — not your day-one tool. Subagents + worktrees first.
7. **The Agent SDK** may already be your harness. Evaluate before hardening `agent-core` further.

---

*Living document. Grow it from real friction, not speculation. The same way you grow a gate: add a rule when reality demands one, and write the test that proves it.*
