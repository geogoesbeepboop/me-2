---
title: Top-1% Agentic Development Workflow
collection: harness
source: ~/dev/agentic-harness/docs/TOP_PERCENT_WORKFLOW.md
sourceMtime: '2026-07-09T20:33:15.065Z'
sourceCommit: c48ce56
syncedAt: '2026-07-09'
summary: >-
  Companion to CLAUDECODEBIBLE.md. Written 2026-07-05 from a full audit of the
  current setup. The Bible says how to build the harness; this says how to
  operate like the people who ship fastest with i…
contentHash: 'sha256:b1b7bbc9af59a5c1ff96a03412600aafd47034805c5900d688ebb8320abed646'
---
# Top-1% Agentic Development Workflow

*Companion to CLAUDE_CODE_BIBLE.md. Written 2026-07-05 from a full audit of the current setup.
The Bible says how to build the harness; this says how to operate like the people who ship
fastest with it. Applies to Claude Code first, Codex second (§7).*

## 0. The diagnosis

The top 1% aren't better prompters. Their edge is three compounding properties:

1. **The agent can verify its own work without them.** Every loop where a human must look at
   the output before the agent can continue is the bottleneck. They make verification
   agent-runnable (tests, previews, evals, sandboxes) *before* starting the work.
2. **Parallel by default.** One conductor session; implementation happens in worktrees and
   background agents. Serial agentic development is single-threading a multicore machine.
3. **Everything done twice gets codified.** Skills, hooks, templates, scaffolds. Their harness
   compounds weekly; everyone else's stays static.

Your current state, honestly: the *guard* layer is top-decile (bash/secrets/format/session
hooks), the *delegation* layer is top-decile (researcher/critic, deep-skill fan-outs), and the
*verification* + *parallelism* layers are the gap. Only a couple of the focus repos have real
eval suites; project instruction quality varies from excellent to empty across the fleet;
worktrees and nightly automation are still "pending" from Bible Week 3–4.

## 1. Close the verification loop (highest leverage, do first)

**The rule: before starting any task, ask "can the agent verify this without me?" If no, build
that first — it pays back within the same session.**

**The scoping invariant (adopted 2026-07-08, from the harness-literature review — Weng's
"Harness Engineering" 2026-07-04 + its references):** *gate the irreversible; evaluate the
reversible; widen the autonomy envelope as trust accumulates.* Deterministic authority on
money/publication/consent/deletion; evals and monitoring — not blocking gates — everywhere
else. As models and eval streaks improve, actions graduate: approval-required → notify-after →
autonomous-within-budget, with graduation rules living in deterministic policy code
(tiered risk models and capability-map-based permission systems are the in-house patterns to
copy). Verification is not a claim that models are weak — it converts probabilistic quality into
a sellable *guarantee* ("every figure is cited" is a property, not a probability), and it
limits the blast radius when ingested content is hostile.

**The eval-layer taxonomy (when adding eval coverage, name the layer you're adding):**
- **L0 — verifier tests** (deterministic, no model, in the commit gate): tests *of the gate
  itself* — fuzz, planted failures that must be caught. A `--gate-only` mode that runs just this
  layer is the model to copy.
- **L1 — offline replay** (recorded model outputs, no key, no cost): re-run the pipeline over
  captured responses; catches logic regressions around the model. This is the layer most
  projects end up missing first — check for it explicitly.
- **L2 — offline live-model** (JSONL dataset + scorer + baseline + history, nightly, costs
  cents): graded cases; deterministic scorers where possible, rubric-anchored judges where not.
- **L3 — online** (production sampling): periodically re-verify real outputs — e.g. re-gate
  and spot-check the outputs that actually shipped that week.

**Reward-hacking hygiene (Weng: a loop optimizes exactly what you measure):** every LLM
misbehavior becomes a case forever, AND (a) keep a held-out/rotating subset the developing
agent never tunes against, (b) anchor LLM judges with a few human-graded reference cases and a
pinned judge model so judge drift is detectable, (c) treat a suspiciously fast eval improvement
as a 🟡, not a win. Adversarial cases are part of the convention: any agent that ingests
untrusted content (filings, web pages, peer agents, chat messages) gets prompt-injection cases
proving instruction-shaped content cannot move the gated outcome (a scenario named something
like `injected_source_cannot_bypass_gate_or_billing`, added 2026-07-08, is the template).

- **`gate.sh` convention (now live).** Every project gets an executable `.claude/gate.sh` — the
  fast "is it healthy" check (lint + typecheck + the test subset that matters, target <120s).
  The new global `guard-commit` hook runs it automatically on every `git commit` and blocks on
  failure (`--no-verify` is the deliberate escape hatch). One convention, three payoffs: agents
  self-check before committing, you stop reviewing broken diffs, and CI can run the same file.
  - Rollout: DONE 2026-07-05 for the focus set of repos — all gates verified green, 2–9s each.
    Convention for any new repo thereafter. Gotcha baked into every gate: if your package
    manager isn't on the hook-shell PATH, have the gate call its binaries directly (e.g.
    `.venv/bin/*`) with a fallback to the global command.
- **Make "run the app" agent-runnable.** Add `.claude/launch.json` (preview server config) to
  UI projects (start with whichever one you touch most) so sessions can start the app, click
  through it, and read console/network themselves instead of asking you "does it look right?"
  Seeded demo data is part of this — an app the agent can't log into is an app it can't verify.
- **Evals are tests for the nondeterministic parts.** Any project with an LLM decision gets a
  10-case eval file from day one (a hackathon "yardstick" idea, productized). Convention (live
  2026-07-05): offline, zero-credential suites go in `.claude/evals.sh` — the nightly digest
  runs them (never the commit gate, so gates stay fast). The strongest example in the fleet:
  ~100 cases (the bulk of them, plus a later adversarial/injection block), $0.00, ~1s,
  baseline-armed regression detection. Not every project needs the same shape: one
  predictor-heavy project needs an offline replay mode before its evals are trustworthy (chip
  filed); a project with no LLM on the hot path just relies on its regular tests as its evals;
  a project whose LLM components are still being built seeds evals once those stabilize.
- **Mirror gates in CI.** Hooks only guard *interactive* sessions — cloud agents, Codex, and
  teammates bypass them. `gate.sh` doubles as the CI job so the gate holds everywhere.

## The agent anatomy — twelve questions in four buckets (2026-07-08; bucketed + memory/latency added 2026-07-09; egress, model-as-dependency, concurrency + compensation woven in 2026-07-09 pm)

The rest of this doc is *operating* discipline: how you build. This section is *design*
discipline: what has to be in the box before you start. It exists because the fleet audit kept
surfacing the same omission — a build nails use-case + tools + a happy-path loop, then discovers
at integration that nothing gates the irreversible action, no input is treated as hostile, and
there's no way to see what the agent did. These are the twelve questions `/new-agent` and `/hack`
now force *before the second hour*; answer each in a line or two, into `AGENTS.md` and the first
ADR. A blank is a design hole assigned to a phase — never a thing discovered at the demo.

They fall into four buckets. **A · Correctness** (make it work, right) is the part most builds
do instinctively. **B · Trust & safety**, **C · Economics**, and **D · Operability** are the ones
builds skip and pay for later — the whole reason this checklist exists. Note that every concern
which has ever tried to join this list pulled *toward* an existing bucket rather than starting a
fifth (latency → C, blast-radius → B, termination → D, memory → B, egress → B, model-drift → A,
concurrency/compensation → D): the sign the spine holds is
that **the gate (A2) owns the irreversible action, and everything else feeds or constrains it.**

### A · Correctness — make it work, right

1. **Use case** — the one demoable/sellable outcome, in a sentence. Two outcomes = two projects.
2. **Verification — the gate.** The ONE irreversible action (money / publication / deletion /
   consent / external message) and the *deterministic, no-LLM* code that owns it — "the model
   proposes, code disposes." Can't name it? Stop and design it first; it's the nucleus of every
   agent in this portfolio. "One" is the forcing function, not a license to ignore a second
   (2026-07-09): if honest accounting finds more — an agent that *sends* and *spends* — each gets
   the same deterministic owner, and three or more says the project wants splitting (#1).
3. **Eval layers** — which of L0–L3 (§1) this needs and the first five cases; any LLM decision
   gets ≥5 cases day one, planted failure included. The model + prompt are *pinned, versioned
   dependencies* (2026-07-09): provider drift and deprecation-forced upgrades are real, so the
   same baseline that catches your regressions is the gate a model swap or prompt change must
   pass before it ships — an unpinned model is an unreviewed dependency bump.
4. **The loop** — the steps (gather → decide → act) and *where the gates sit in the flow*. Fail
   closed on the gated paths.

### B · Trust & safety — make it safe to point at the world

5. **Trust of inputs & egress** *(the gap most builds skip)* — is any input hostile-capable
   (filings, web pages, peer agents, user chat)? If yes, an injection case proving
   instruction-shaped content *cannot* move the gated outcome ships day one (a scenario like
   `injected_source_cannot_bypass_gate_or_billing`). If no, write "closed input set" — but decide
   it on purpose. And moving the gate is not the only harm (2026-07-09): an agent that holds
   private data, reads hostile content, and has *any* outbound channel — a web request, a
   message, a commit, a URL embedded in a citation — can be made to exfiltrate without ever
   touching the gate (the "lethal trifecta"). Gate-safety proofs say nothing about this path. So
   enumerate the egress channels next to the input list; if all three legs are present, the
   sibling case `injected_source_cannot_exfiltrate_via_any_egress` ships day one too.
6. **Memory — agent-facing, and an input like any other.** What the agent writes to itself and
   reads back to reason: working (in-context), episodic (past runs), semantic (facts/prefs),
   procedural (learned steps). Two rules it inherits from elsewhere in this list. It's a *trust
   surface* (#5): hostile content written now and read back later as "trusted" is time-shifted
   injection — memory poisoning — so memory-sourced content carries the trust of whatever *could*
   have written it and **cannot move the gated outcome** (#2); a day-one case like
   `poisoned_memory_cannot_move_gate` is the sibling of the injection case. And it's *stale by
   default*: every memory reflects a point in time, so name a write policy (what persists, when,
   decay) and verify-on-read for anything load-bearing. The write policy is also a data policy
   (2026-07-09): PII persisted today is PII exfiltrated later (#5), so retention is a decision,
   not a default. Distinct from Observability (#10 —
   operator-facing, read-only, after-the-fact) and Durability (#11 — crash-recovery of in-flight
   state, not accumulated knowledge that shapes future decisions).
7. **Tools** — the functions / MCP servers / peer-agent calls that extend it. Trust runs two
   directions: *can I believe this output* (a peer agent is an untrusted input — see #5), and
   *what can this tool's credentials touch if the agent is compromised* — least privilege /
   blast-radius containment is the agent's own authz boundary, bigger than any single input and
   worth naming even when every input is trusted. Three riders (2026-07-09): a tool's own
   metadata is input — a hostile MCP server injects through tool *descriptions*, not just
   results; least privilege is *enforced*, not aspired to (sandbox, allowlist, scoped token —
   name the mechanism); and authority flows downward only — a sub-agent spawned mid-task
   inherits the parent's gates, budgets, and trust tier or narrower, never wider.
8. **HITL & autonomy graduation** — who approves what today, and the rule *in deterministic
   policy code* that graduates an action approval-required → notify-after →
   autonomous-within-budget as its eval streak earns it (or demotes it after an incident).
   Tiered, risk-based approval rules are the model.

### C · Economics — make it affordable

9. **Budget & latency ceilings** — per-task token/spend cap + model/effort routing (Haiku for
   mechanical fan-out, Opus only where reasoning is the bottleneck), *and* a wall-clock ceiling
   (the nightly digest already gates this — 🟡 SLOW at >120s is a real signal, not cosmetic). Two
   ceilings because a cheap model can still hang. For money-movers both are enforced in code
   *before* the act (a dynamic-price cap guard is the spend model), and a gate that blows its
   latency budget fails *closed*, not through. No spend ceiling = a runaway loop with your credit
   card; no latency ceiling = a hung lane you find at the retro. Ceilings bind the whole tree
   (2026-07-09): sub-agents draw down the parent's budget, not fresh ones — a fan-out that mints
   per-child budgets is a multiplier wearing a cap's clothes.

### D · Operability — make it survivable at 3am

10. **Observability — memory for you, not the agent.** The receipts / append-only ledger / trace
    that reconstructs what it did and why, after the fact (a settlement-receipt ledger or a signed
    mandate record are the models). For the operator at 3am — distinct from #6 (agent-facing) and
    #11. The trace records *which version* of model / prompt / policy acted (2026-07-09), or
    "why did it do that" becomes unanswerable after the next upgrade (#3).
11. **Durability** — how it resumes after a kill: what state persists, where, and what a fresh
    process reads to know what it was mid-doing. Handoffs are the harness-level version; the agent
    needs its own.
12. **Failure, termination & idempotency** — what happens when a tool errors or the model refuses;
    the explicit *definition of done / max-iteration cap / escalate-on-give-up* so "the loop won't
    converge" has a defined exit rather than an infinite leash; and, for any side effect, the
    idempotency key/mandate that makes a retry safe (never double-spend, double-send,
    double-publish). Two more from the same family (2026-07-09): *concurrency* — idempotency
    makes a retry safe but not two live instances racing (cron overlap, a user double-firing, a
    stuck run restarted while the original limps on); anything single-writer takes a lease/lock.
    And *compensation* — for every gated action, name the undo (refund, retraction, takedown) or
    write "none": "none" is the confession that explains why the gate exists.

*The test: a teammate can answer all twelve for your repo from its `AGENTS.md` + gate + eval files
without asking you. Blanks are backlog, named on purpose — not surprises found on stage.*

## 2. Parallel by default

- **Session shape: conduct, don't type.** One main session plans and reviews; implementation
  runs in background agents / worktrees. The mental switch: your job is writing *briefs* and
  reviewing *diffs*, not watching tokens stream.
- **Worktrees for anything >30 min or >1 workstream.** (Bible Week 3, still pending — this is
  the week.) Pattern: plan in main → spawn per-feature worktree agents with self-contained
  briefs → review, merge, delete. Your deep-skill workflows already prove you trust fan-out;
  extend that trust from research to implementation. Start with two lanes, not five.
- **Background the long stuff.** Test suites, migrations, research: `run_in_background` and
  keep conducting. The notification model means idle-waiting is a choice.
- **Brief quality is the multiplier.** A parallel agent is only as good as its brief: goal,
  constraints, files to respect, the verify command it must pass, and what "done" means. Your
  orchestrator-pattern skills already encode this — apply the same discipline to implementation
  briefs.
- **Lanes are bounded, ~2h max (2026-07-08).** RE-Bench's crossover: agents beat humans ~4x at
  2-hour budgets but humans overtake at 8h/32h — current harnesses front-load competence and
  don't compound over long horizons. No open-ended autonomous epics: a lane gets a crisp
  "done", a verify command, and a checkpoint; long work is a *chain* of bounded lanes with
  review between, not one long leash.
- **Artifacts, not chat (2026-07-08).** A lane or background agent's deliverable is a file — a
  report, a diff, a log — never only its final chat message (Weng: sub-agent outputs must be
  "explicit and inspectable"; transient chat outputs go stale and invisible). The brief names
  the output path; "done" includes the artifact existing.

## Running this as a 2–3 person team (2026-07-08)

The workflow above is written for a solo conductor plus background agents, but its spine —
self-verifying work, parallel lanes, codified conventions — is exactly what makes a *human* team
of two or three fast, and for the same reason: the bottleneck is coordination, and shared
verification is what removes it.

The one principle: **a team parallelizes on shared contracts, not shared context.** Three people
can't keep one mental model in sync by talking; they stay coherent by agreeing up front on the
interfaces — the data shapes, the gate signature, the `AGENTS.md` invariants — then coding against
them independently. This is §2's "brief quality is the multiplier" with the brief promoted to a
*contract*: the `gate.sh` every lane commits against is the team's shared definition of done, so
the integrator reviews *diffs*, not *correctness by hand*.

Three moves make it work:
1. **Agree the anatomy and the contracts before splitting** — the twelve questions above, plus the
   data shapes and the gate signature. If you can't write the contract, the work isn't ready to
   split; plan it together first. This is the team-scale form of "can the agent verify this
   without me?"
2. **Own lanes by module, not by feature** — so two people never edit the same files, and the gate
   is the referee that lets a lane merge without a human re-checking correctness.
3. **The conventions ARE the shared memory.** Solo, you can carry an undocumented invariant in your
   head; a team of three cannot. Every `AGENTS.md` line, gate case, and anatomy answer is what keeps
   three people — or three fresh sessions tomorrow — from diverging. Instruction files stop being
   hygiene and become the coordination layer.

The hour-by-hour mechanics — lane ownership, the H0–2 shared kickoff, checkpoint syncs — are in
OPERATING_MANUAL §13.

## 3. Instructions as API docs, not prose

CLAUDE.md variance is your biggest silent tax: quality ranges from excellent to empty across
the fleet, and every empty one means re-explaining the project every session.

- **Standard template, ~60–150 lines:** what this is (2 lines) → run/verify commands (the exact
  ones) → architecture map (files that matter, 10 lines) → invariants ("money paths never
  bypass gating.py") → DO-NOT list → current phase + link to roadmap. Nothing the code already
  says; everything an agent gets wrong without being told.
- **AGENTS.md is the canonical file; CLAUDE.md points at it.** One project already does this
  (`CLAUDE.md` = `@AGENTS.md`) — bless it as the house standard for every project. One
  instruction file, readable by Claude Code, Codex, Cursor, and whatever's next. Claude-specific
  extras (skill pointers, hook notes) stay in CLAUDE.md below the import.
- **Instruction files are code: review the diff.** When a session reveals a missing invariant,
  add one line then, not "someday." /update-docs already gates this — use it at session end.
- **Update by delta, not rewrite (2026-07-08, from ACE).** Wholesale rewrites of accumulated
  context cause "context collapse" (knowledge degrading over generations of rewriting) and
  "brevity bias" (compression discarding load-bearing detail). Instruction files, memory, and
  these docs get *additive deltas* by default — add a line, deprecate a line, date the change;
  full rewrites are deliberate, diffed occasions.

## 4. Codify relentlessly (the compounding layer)

- **Rule of three.** Explained or performed the same procedure three times → it becomes a
  project skill that session. Your existing project skills prove the muscle exists; the gap is
  applying it to *dev-loop* chores: `new-agent`, `gate-check`-style project setup, release
  runbooks. (Bible Week 2 items `new-agent` + `gate-check` are still unbuilt — rule-of-three
  says they're overdue.)
- **Slash-only is right for expensive skills, wrong as a blanket.** Everything being
  `disable-model-invocation: true` means Claude can never self-serve a procedure even when it
  obviously should (e.g., following the migration convention when you ask for a schema change —
  one project's `add-migration` skill does this correctly). Default new *cheap, procedural* skills
  to auto-invocable with tight descriptions; keep fan-outs and anything costly slash-only.
- **Scaffold, don't re-create.** `/hack` covers hackathons; extract the general version
  (`/scaffold`: git init + AGENTS.md template + gate.sh stub + settings.local.json) once the
  template stabilizes across two more real projects. Then bake it into agent-core (Bible Week 3).
- **agent-core is scaffold-first (decided 2026-07-08).** The spine now built four times over
  (deterministic gate interface, receipts/append-only ledger, approval state machine, HMAC
  mandates, budget meters, LLM-usage metering, idempotency keys, hermetic conftest, gate.sh/
  evals.sh, AGENTS.md template) becomes reference implementations in a template repo that
  `/new-agent` copies — copy, don't import, so no version coupling. Promote a piece to a real
  shared library only when a *fix* needs to propagate to a third consumer (rule of three,
  applied to libraries). The domain gate predicate is never extracted — only the machinery
  around it.

## 5. Continuous improvement of the harness itself

You already instrument (token-breakdown suite, fleet dashboard). Close the loop the way you'd
close it for any agent:

- **Weekly 30-minute harness retro.** One question: *where did I babysit this week?* Every
  answer becomes a hook, a skill, a gate.sh line, or an instruction-file fix. Keep a running
  `~/dev/docs/BABYSIT_LOG.md` — items enter during the week, leave at the retro. This single
  ritual is most of what "top 1%" means in practice.
- **Nightly automation (LIVE).** `nightly-gate-digest.sh` via LaunchAgent (06:17): every focus
  repo's `gate.sh` + `.claude/evals.sh`, digested to `~/dev/docs/gate-digests/` and surfaced by
  the session banner. Drift caught while you sleep — your Drift Watch hackathon idea, dogfooded.
- **Consolidate the token-breakdown suite** (6 skills → ~3) at the next retro — cognitive load
  on the skill menu is real friction.
- **Model/effort routing as habit:** Haiku subagents for mechanical fan-out, Sonnet for breadth,
  Opus/high-effort only where reasoning is the bottleneck (your deep skills already encode
  this — apply it when spawning ad-hoc agents too).

## 6. Memory and continuity

- Handoffs + session-context hook are already top-decile. Keep them.
- **Decide whether to build a custom shared-memory tool this week:** the harness now has
  built-in auto-memory doing ~70% of what such a tool would give you day-to-day. Recommendation:
  lean on built-ins for day-to-day; only build the custom tool if it earns its place as a
  *portfolio piece* (cross-agent shared memory for the fleet — which built-ins don't do). Don't
  build infrastructure the platform just shipped.

## 7. Codex / multi-harness parity

- AGENTS.md-as-canonical (§3) gets instruction parity for free.
- Hooks don't port — that's why gate.sh + CI mirroring (§1) matters: the *convention* is
  harness-agnostic even when the enforcement point isn't.
- Skills: keep the logic in scripts (`scripts/*.sh`, `workflow.js`) invoked by thin SKILL.md
  wrappers — scripts run anywhere; prose-only skills are Claude-only.
- Run the same brief through both harnesses occasionally; divergence teaches you what's
  under-specified in your instructions (under-specification is the bug, not the harness).

## The order to do it in

*(Focus set, 2026-07-05: four existing agent repos, kept deliberately small.)*

| When | Action | Status |
|---|---|---|
| 2026-07-05 | guard-commit hook + permissions allowlist + /hack + /spike | ✅ done |
| 2026-07-05 | gate.sh in all four focus repos, verified green (2–9s each) · AGENTS.md-canonical in all four · BABYSIT_LOG.md seeded | ✅ done |
| 2026-07-05 | nightly gate digest: script + LaunchAgent (06:17 daily) + session-context surfacing | ✅ done |
| 2026-07-05 pm | both bugs fixed (one repo's test suite made fully hermetic — 338/338 passing bare; another repo auto-formatted + format-check added to its gate) · `.claude/evals.sh` nightly convention adopted, with one repo wired first (87 cases, $0, baseline armed) · `/retro` + `/new-agent` skills · OPERATING_MANUAL.md written | ✅ done |
| 2026-07-05 eve | LaunchAgent verified end-to-end via `launchctl kickstart` (exit 0, all green) · OPERATING_MANUAL §10 (multi-lane mechanics + lane contract) and §11 (automation verification, launchd semantics) | ✅ done |
| 2026-07-07 | harness-as-code repo + builder-session README tour (v2 items 1–2): `~/dev/agentic-harness`, owner-mode install verified end-to-end, `~/.claude` symlinked into the repo, canonical docs moved into `docs/` (symlinks left behind) · nightly digest gained `repos.txt` config + 🟡 SLOW flag (born from one repo's silent 9s→2247s gate-runtime creep that morning) | ✅ done |
| 2026-07-07 pm | one repo's gate stall root-caused (package-manager global cache-lock contention from concurrent worktree activity; no code change involved) → gate flipped to a venv-first check like its siblings, back to 9s · gate/evals scripts were untracked in all four focus repos — now committed (fresh clones/worktrees get the gate) · digest hardened: 🟡 SLOW flag, hard per-gate timeout (900s, process-group kill), red/yellow desktop notification | ✅ done |
| 2026-07-08 | harness-literature review (Weng 2026-07-04 + refs) folded in: scoping invariant + eval-layer taxonomy + reward-hacking hygiene (§1), bounded lanes + artifacts-not-chat (§2), delta-updates (§3), agent-core scaffold-first decision (§4) · one repo's adversarial/injection eval block: 10 gate cases (unicode evasion, injection preambles, fake citations) + `injected_source_cannot_bypass_gate_or_billing` scenario — ~100 offline cases, baseline FLAT · `/hack` gained gate-stub + micro-eval step · OPERATING_MANUAL §12 (hackathon mode) | ✅ done |
| 2026-07-08 | agent-anatomy checklist — 11 questions, adding trust-of-inputs, budget ceiling, observability, failure+idempotency, and HITL graduation as first-class (this doc) — wired into `/new-agent` (forces the eleven) + `/hack` (compressed anatomy) · "using this as a team" added to both manuals (this doc + OPERATING_MANUAL §13) | ✅ done |
| 2026-07-09 | agent anatomy revised — 11 flat questions → 12 in four named buckets (A Correctness / B Trust & safety / C Economics / D Operability) · **Memory** added as a first-class question (agent-facing input, trust surface, `poisoned_memory_cannot_move_gate` case) · latency folded into the budget ceiling (spend + wall-clock, 🟡 SLOW) · blast-radius/least-privilege woven into Tools, termination into Failure · `/new-agent` + `/hack` prompts to re-sync to twelve | ✅ done |
| 2026-07-09 pm | anatomy pressure-tested vs. mid-2026 practice, still twelve questions — every addition folded into an existing one: #5 widened to **egress/exfiltration** (lethal trifecta; sibling case `injected_source_cannot_exfiltrate_via_any_egress`) · model + prompt as pinned, eval-gated dependencies (#3) · tool-description injection + enforced least-privilege + sub-agent authority inheritance (#7) · tree-wide budgets (#9) · model/prompt version provenance in the trace (#10) · concurrency leases + compensating actions (#12) · retention-as-decision (#6) · multi-irreversible-action honesty (#2) · stale "eleven" fixed in the team section · re-sync `/new-agent` + `/hack` to revised text (chip filed) | ✅ done |
| This week | first real worktree run (1 conductor + 1 executor) — HABIT, yours · one project's predictor evals need an offline replay mode (chip filed — this is the L1 layer) | pending |
| Next 2 weeks | first weekly `/retro` (calendar it) · another project's evals: wrap its deterministic scoring/critic logic in a small JSONL + `evals.sh` NOW — only its LLM-selector cases wait for a later phase (a third project: N/A — no LLM on hot path) · understudy-lite (v2 item 4, promoted to front — see v2 intro): transcript-mining retro intake | pending |
| This month | token-skill consolidation (at a retro) · shared-memory-tool decision (yours) · agent-core template repo (scaffold-first, see §4) seeded from the mandate pattern, the receipts/eval-runner pattern, and the hermetic-conftest pattern already built across the fleet · weekly re-gate audit of real shipped outputs on the money-moving project (L3) | pending |
| When repos get remotes | CI mirror: run each repo's `gate.sh` as a GitHub Actions job (yours: decide public/private) | blocked on remotes |

## v2 — the next iterations (beyond the original plan)

Ordered by leverage. Items 1–2 shipped 2026-07-07 (see the table). Understudy-lite was
promoted to the front of the queue at the 2026-07-08 review: it is this workflow's own
"self-improving harness" move (Meta-Harness/ACE-shaped — an agent with access to traces
proposes harness changes; the human stays the approval gate), and the literature says that's
the highest-leverage unbuilt layer here. Deliberately NOT adopted from the same literature:
evolutionary/automated workflow search (ADAS-style) — diversity collapse + provisional
evidence + wrong scale for a five-repo fleet; the weekly retro beats it. Watch, don't build.

1. **Dogfood an approvals dashboard.** Your approvals are already scattered (chat notifications
   for one project, terminal prompts elsewhere) and will scatter more at 3–5 lanes. Building a
   quick-slice approvals dashboard for your own fleet kills real friction AND pre-builds a
   hackathon demo. Workflow need and portfolio idea, same artifact.
2. **Understudy-lite for the retro.** `/retro` step 4 already sweeps handoffs for unlogged
   babysitting; upgrade it to mine session transcripts (`~/.claude/projects/*.jsonl`) for
   repeated interventions and auto-draft candidate log entries. The retro's intake stops
   depending on your discipline — same closed-loop move as evals.
3. **Lane telemetry at the retro.** One trend line per week (sessions, cost, background-agent
   count) from the token-breakdown data, appended to the retro metric. You have the
   instrumentation; this just makes drift visible before it's a feeling.

*The test for whether it's working: sessions should increasingly start with "run the plan" and
end with "review the diffs" — and the babysit log should shrink month over month.*
