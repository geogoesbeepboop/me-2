---
title: The Manual — why this workflow works
collection: harness
source: ~/dev/agentic-harness/docs/MANUAL.md
sourceMtime: '2026-07-26T23:59:52.809Z'
sourceCommit: c90c827
syncedAt: '2026-08-02'
summary: >-
  Visual companion:
  <https://claude.ai/code/artifact/674b8a51-7bf4-44f4-8ab5-64591f620444> — this
  file is canonical; the visual renders it (docs/visuals/README.md).
contentHash: 'sha256:cbf50a62295f975e37a8bc126d945c0eab2973f7b9ff2e435535c8f0cc8800f0'
---
# The Manual — why this workflow works

*Visual companion: <https://claude.ai/code/artifact/674b8a51-7bf4-44f4-8ab5-64591f620444> —
this file is canonical; the visual renders it (`docs/visuals/README.md`).*

_How I build real products with agents. Me first, shareable second. Every claim in here either
carries a receipt from my own systems or is marked `> Backlog:` with the trigger that will make
it real. If the numbers in Appendix B don't move, this document gets revised — the methodology
evals itself._

_Ownership rule: this is doctrine — the why, with receipts. Workflow rules are canonical in
global CLAUDE.md and per-repo AGENTS.md (the copies agents obey); the daily how lives in
OPERATING_MANUAL.md. If a sentence here would change an agent's behavior, it's in the wrong
file._

---

## 1. Doctrine

Anthropic's own economic data says engineers use AI in roughly 60% of their work but can fully
hand off only 0–20% of tasks. They call it the **delegation gap**, and the important word in
their framing is _structural_: human judgment is the permanent layer, not a transitional one.
I don't fight that. I build around it.

That single fact generates everything else in this manual:

- **My judgment is the scarcest resource in the system.** Every design decision is measured by
  one question: does this spend my judgment on _decisions_ (what to build, whether evidence is
  sufficient, which tradeoff to take) or does it waste my judgment on _re-testing things a
  machine could have verified_? The second category is the enemy. All of it.
- **Verification beats prompting.** Simon Willison: coding agents work best when they have "some
  kind of validation mechanism they can use to test their own work." The loop is the product —
  what the agent starts with, what it can check itself, when it stops. Prompting harder is what
  you do when you haven't engineered the loop.
- **Token cost is a design input, not a bill I discover.** Every verification mechanism in this
  manual is chosen with its cost curve stated. Deterministic checks are free forever; LLM judges
  are a tax on every run.
- **Methodology may lead reality — with a trigger.** Where this manual prescribes something my
  harness doesn't do yet, the gap is stated as `> Backlog:` with the concrete trigger that
  justifies building it. A prescription with no trigger is a wish, and wishes got my last
  operating manual deleted.

### The ladder

Everything in this manual maps onto five levels. Each level has one graduation trigger. The
rule: you always know your _one next move_ — per product, not globally.

| Level | Name                      | You graduate when…                                                                                           |
| ----- | ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| L0    | Prompt-and-wait           | You write a contract before nontrivial work, every time                                                      |
| L1    | Contract + evidence       | The agent's "done" arrives as an evidence packet you can accept without re-running the flow yourself         |
| L2    | Living evals              | Eval cases land with features, every bug becomes a case, and the nightly run — not you — catches regressions |
| L3    | Review-absorbed lanes     | Lane count is set by machine-absorbed review capacity, not by your personal re-testing throughput            |
| L4    | Semi-autonomous meta-loop | The system proposes its own improvements from its own logs; you approve                                      |

My honest placement, updated 2026-07-25 (the fleet eval audit — see §3 — revised several of
these downward in substance if not in letter; each repo's receipt is its
`docs/evals/2026-07-25-methodology-audit.md`):

| Product           | Level        | Evidence                                                                                                                                                                                 |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-Clone           | L2.5         | Living eval product (insights corpus + sealed holdout + per-row adjudication + failure-case dossiers; 7-step routing gate); wired into the nightly 2026-07-20. The 07-25 audit found the nightly asserts case *count*, not correctness — it cannot fail on a quality regression — and the insights ship gate was closed by an uncalibrated judge. The .5 holds only until its audit's Phase 1 lands |
| jim-agent         | L2 (fragile) | 99 offline cases (not 13 — the suite grew), baseline-compare, nightly green — but the 07-25 audit found the revenue-gating judge's calibration artifact exists on no machine and the regression gate silently no-ops off this laptop (baseline gitignored); gate SLOW again 2026-07-22 (1919s, the uv-lock signature)                                                  |
| grocery-buddy     | L1           | 28 eval cases, judges, runner — still no `.claude/evals.sh`, and the 07-25 audit found the GitHub eval nightly has been a **false green 47/47 runs** (no API key; runner exits 0). Shelf-ware with a broken warning light (flagged here since v1 of this manual).                            |
| Attest            | L2 (dark)    | Best eval *machinery* in the fleet (signal/provenance schema, enforced sealed holdout, anti-vacuous-green floors) but invisible to the operator: scripts at the repo root instead of behind the `.claude/evals.sh` doorknob, absent from the digest and `repos.txt`, holdout guarding an authored copy of the open suite (07-25 audit). Steps 1–2 are §3's named cheapest fix |
| procurement-agent | L1           | Gate green, 57 offline tests, zero evals (not yet audited)                                                                                                                               |
| dj-agent          | L1           | Nothing grades an LLM, and the declared north-star metric (set-acceptance rate) is 100% by construction — the documented path bypasses the HITL gate. Its audit is a full bootstrap plan  |

Overall: **L2 where I actually work, L1 where I don't.** M-Clone proved the loop end-to-end —
contract, machine verification, adversarial review, eval-backed evidence. The gap is no longer
"does the methodology work" but "does it exist outside the one repo I point it at": the focus
four are exactly where they were two weeks ago. Adoption is now a rollout problem, not a
design problem.

---

## 2. The unit of work

Every nontrivial task opens with a **contract** — three lines, drafted by the agent from my
brief, corrected by me at plan approval. That correction moment is the alignment mechanism;
everything after it can run without me.

```
Outcome:             <the observable result>
Non-goals:           <what not to expand into>
Acceptance evidence: <checks the agent can RUN, not vibes I will have>
```

The rules that make this work:

- **Acceptance evidence must be runnable.** "Substitutions feel right" is not evidence.
  "`evals/datasets/substitutions.jsonl` cases 1–3 pass; cart total recalculates in the
  screenshot" is. This is the load-bearing trick of the whole manual: runnable acceptance
  checks are eval cases wearing a different hat. Write them once at contract time, keep them
  forever in the suite (chapter 3).
- **The approved plan is a spec, and the spec is a file.** At approval it's saved to the
  repo's `docs/specs/` (contract on top, design and steps below) and committed with the work,
  so the PR carries its own spec. It's a living document — updated in-diff when implementation
  teaches us something — and it, never the chat's memory, is what iterations and reviews read.
  Learned the hard way: PR #48's contract lived in `~/.claude/plans/`, invisible to the diff
  it governed.
- **Heavy specs are reviewed at diagram altitude first.** A spec that spans modules leads
  with a Mermaid diagram — architecture or flow, current → proposed — and I read the boxes
  and arrows before the paragraphs: structural wrongness (a dependency pointing the wrong
  way, a layer that shouldn't know about another) is visible in a diagram in seconds and
  invisible in prose for pages. The evidence packet closes the loop by bringing the diagram
  to as-built, which keeps the repo's architecture docs true as a side effect of shipping.
  Two extensions of the same idea: PR bodies carry the spec's Mermaid delta (GitHub renders
  it, so merge review starts at plan-review altitude), and a feature with an eval suite and
  ~3+ sessions of iteration earns a living **explorer page** — an HTML dashboard of its
  architecture, guards, and metrics, updated in-diff (receipt: M-Clone's
  `evals/insights/explorer/`, the de facto review surface for the insights work). Never
  scaffolded speculatively; earned by iteration.
- **High-stakes specs get `/challenge` before I ever see them.** The agent self-invokes the
  critic on foundation-adjacent plans (an instruction line + an invocable skill is the whole
  mechanism). Receipt: the critic caught that the insights-v2 plan's own forcing mechanism
  would have dropped the "$10,500 short" figure, and that its red-first step was tautological —
  before a line of code existed.
- **Tasks chain.** Every evidence packet ends with a proposed next contract (the three lines
  for the most likely next task), so accepting evidence and approving the next spec is one
  touch. This is the loop's return arrow — the system proposes, I steer.
- **No time estimates. Ever.** Agents don't need them and I don't believe them.

Plan-before-code was already habit. The spec file, the automatic critic, and the chaining are
what turned it from ritual into a system that runs between my two touchpoints.

---

## 3. Evals

An eval is not a test. Tests check code paths (`assert total == 42.17`); evals judge _behavior
across cases_ — did the agent product make the right decision given this input, this history,
this catalog? Tests catch broken code; evals catch a system that confidently does the wrong
thing. Agent products live and die on the second category.

**The methodology is codified now (2026-07-25).** The operational spec is the **`/evals` skill**
(`claude/skills/evals/SKILL.md`) — the D1–D8 contract: programmatic-first grading, pass rates
over single runs, calibrated judges, holdout/versioning honesty, trajectory grading,
refusal-as-pass safety cases, the flywheel, and the `evals.sh` ops contract. The narrative
behind it is `docs/evals-and-tracing-summary.md`. This chapter keeps only the *why* and the
receipts; where it disagrees with the contract, the contract wins, and any project's legacy
eval convention migrates toward it, never the reverse.

**The maturity ladder for evals** (this is doctrine, decided, not aspirational):

- **Eval-alongside is the default.** While a product is moving fast, every feature task lands
  with its eval cases in the same diff — the contract's acceptance evidence, converted
  (chapter 2). Not before the plan; with the work.
- **Eval-first once mature.** When a product has real users or real money flowing, the cases
  ARE the spec: the plan isn't approved until the cases defining "working" exist. jim-agent is
  approaching this line; nothing else I own is there yet.

**How suites grow — from reality, never speculation:**

- **Every bug becomes a case before it's fixed.** The failing case is written first, it fails,
  then the fix makes it pass. The suite is a monotonically growing net of everything that has
  ever actually gone wrong. Anthropic's eval guidance says 20–50 cases drawn from real failures
  beats any elaborate framework — jim-agent's 99 offline cases and grocery-buddy's 28 mean I
  am _already at_ real-suite scale everywhere; the failure was wiring, not authoring.
- **Grader hierarchy, by cost.** Deterministic code-grader (free forever) > snapshot/replay
  against recorded traffic (cheap, offline) > LLM-as-judge (a paid call per case per run —
  pinned model version, calibrated against my own grading on a sample, with an "Unknown" escape
  so it never bluffs a verdict). I reach for a judge only when the behavior genuinely can't be
  code-graded. The full judge rules — narrow rubric, cross-family judging, order-swap,
  verbosity guard, and a calibration artifact committed to the repo rather than living on one
  laptop — are D3; the 07-25 audits found every existing judge violating at least one of them.
- **A score is a statistic, not a boolean (D2).** LLM-dependent cases run N times and report
  rates; a delta smaller than the suite's measured noise floor is not an improvement; anything
  unattended is held to pass^k, not pass@k. The audits' sharpest illustration: a single-run 0.8
  threshold on a 22-case suite sits inside one standard error of its own noise — a gate that
  would flap if it ever ran. (Fully deterministic suites are exempt, and should say so.)
- **Where suites run.** Full suites run nightly via the gate digest — machine time, while I
  sleep. The commit gate (`gate.sh`) gets only the deterministic sub-second subset. Never pay
  for a full eval run to land a one-line diff; never let a nightly pass mean less than the
  full suite.

**The metric is a product with its own bugs.** The M-Clone insights work added a doctrine
line the original manual missed: token-level metrics can read 1.000 while the output is
wrong, so measurement drift is a first-class failure class. Three receipts from one session:
an any-of citation metric silently blessed the exact figure-drop the feature existed to
prevent; the eval harness was sending *different prompt wording* than production (caught by
the critic, fixed with parity fences); and a per-row adjudication pass — actually reading
every output — found the model copying the prompt's own example phrase as advice on ~40% of
cards that scored perfect. The rules that follow: score predicates must be byte-identical to
what production enforces; harness/production prompt text gets parity-fenced; and any suite
that gates shipping earns a periodic every-row read, because the cases you grade are only as
honest as the ruler.

**Receipts, revised by the 2026-07-25 fleet audit** — five fresh-context critics, one per repo,
scored D1–D8; every suite had at least one trust-breaking finding, and every one was a *sensor*
problem (false greens, unversioned baselines, uncalibrated judges), not a case-authoring
problem. Headlines only — the full verdicts and ranked migration plans live in each repo's
`docs/evals/2026-07-25-methodology-audit.md`:

- **jim-agent** — strongest programmatic-first ladder in the fleet (99 model-free cases; the
  judge-blind-spot property test), but the judge that co-decides revenue traces to a
  calibration run that exists on no machine, and the regression gate no-ops on any fresh clone.
- **M-Clone** — deepest eval culture (sealed holdouts, preregistration, corrections ledger),
  and a nightly that cannot fail on a quality regression: it asserts a case count and silently
  rewrites its own committed accuracy record. The sealed holdout is being consumed with no read
  budget — the same pattern that already burned holdout-v1.
- **grocery-buddy** — the GitHub eval nightly was a **false green 47/47 runs**; a live
  injection surface (seller-controlled Amazon titles into the pantry-synthesis prompt) has zero
  adversarial coverage.
- **dj-agent** — nothing grades an LLM; the north-star metric is 100% by construction; two live
  injection surfaces untested. Its audit doubles as the bootstrap plan.
- **Attest** — the best eval *machinery* anywhere in the fleet (signal/provenance schema,
  enforced sealed holdout, anti-vacuous-green floors), invisible to the operator: scripts at
  the repo root, absent from the digest, holdout guarding an authored copy of the open suite.

> Backlog: execute each repo's `docs/evals/2026-07-25-methodology-audit.md` migration plan
> (trigger: next session in that repo). Cheapest highest-value starts: grocery-buddy Step 1
> (kill the false green) and Attest Steps 1–2 (doorknob placement + `repos.txt`). dj-agent's
> first suite now has its full bootstrap plan; procurement-agent still waits on its first
> user-visible bug — that bug becomes case #1, via `/evals case`.

---

## 4. Trusting "done"

This is the longest chapter because it attacks my measured bottleneck. Reviewing and verifying
agent output is where my time actually goes; every other chapter is scaffolding around this
one. The goal, stated plainly: **"done" arrives with enough machine-checked evidence that
accepting it takes minutes of judgment, not another manual pass through the product.**

### The evidence packet

No task is done on the agent's say-so. Done means a packet. The shape below is illustrative — the
**procedure agents actually follow is `/evidence-packet`**, and that skill (not this chapter) is what
changes when the packet changes:

```
## Evidence packet — <task>
Spec:     <path in docs/specs/ + the three contract lines, verbatim>
Changed:  <files + one-line why each>
Checks:
  [pass] <acceptance check 1> — <actual command + actual output>
  [pass] <acceptance check 2> — <actual output>
  [fail/waived] <check> — <why, and who waived it>
Eval delta: <cases passing before vs. after; cases added; cases retired>
Critic:   <adversarial review verdict — fresh context, read only diff + spec, told to refute>
Gate:     <gate.sh output incl. anti-cheat lines>
Screens:  <paths, for anything with a UI>
NOT verified: <the honest list — what I'd have to check by hand and why>
Next contract: <proposed three lines for the most likely next task>
```

The packet is nearly free — it's a reporting format for work the agent already did, not extra
compute. The `NOT verified` line is the most important one: an agent that says "everything
verified" is less trustworthy than one that says "I could not exercise the Stripe webhook
path; it needs a live key." Two rules harden it. **Self-assessment is not verification** —
the critic line exists because the agent that wrote the code is the worst judge of it; the
adversarial pass on the insights diff surfaced five real defects post-implementation,
pre-packet. And **gaps never close silently**: every NOT-verified item either blocks
acceptance or gets my explicit "accepted without X" plus a tracked follow-up in the
spec/handoff — PR #48 merged with an owed device run and nothing but a handoff line holding
it; that's the leak this rule plugs. I review evidence, not diffs — except where the tier
table below says otherwise.

### Anti-cheat gates: making green mean something

The 2026 result that changed how I read test output: Cursor sealed git history and network
access on a benchmark and a model's score dropped from 87.1% to 73.0% — 63% of audited
"passing" runs had cheated. Kent Beck's three tells for "the genie is cheating": unexplained
loops, **unrequested functionality**, and **tests disabled or deleted**. Those tells are
deterministic to check, so they live in `gate.sh`, not in my vigilance:

- Diff touches a test/eval file with net-negative assertions or adds `skip`/`xfail`/disable
  markers → gate goes red and says which file.
- Files changed outside the contract's stated scope → flagged in the packet for explanation.

A green gate that can't be gamed cheaply is what licenses everything else in this manual.

### Review tiers — by consequence, not habit

The only thing practitioners agree on about review depth is that it should track how
long-lived and consequential the code is (Hashimoto line-reviews Ghostty and skims elsewhere;
Cherny auto-accepts post-plan). My table:

| Tier             | What                                                                                                                                              | Review                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1 — line-level   | Anything touching money or acting on my behalf externally: jim-agent settlement/wallet paths, grocery-buddy checkout, procurement order placement | Read the core diff, line by line. Packet is context, not substitute.                     |
| 2 — packet-only  | Product logic behind a gate + evals: recommenders, parsers, briefing synthesis, dj-agent mixing logic                                             | Read the packet. Open the diff only if a check is waived or `NOT verified` is non-empty. |
| 3 — outcome-only | Spikes, research, scaffolding, throwaway                                                                                                          | Does the outcome exist? One look. Code unread.                                           |

The point of the tiers is what they _free up_: today I effectively tier-1 everything, which is
why review capacity caps my lane count. Machine-absorbed tiers 2 and 3 are what make "scale
lanes" (chapter 5) honest instead of reckless.

> Shipped: anti-cheat lines are live in jim-agent and M-Clone `gate.sh` (net-negative test
> assertions, skip/xfail markers, and test/eval deletions go red at commit). Backlog:
> grocery-buddy, procurement, dj — each lands with its first eval suite.

---

## 5. The two loops

One discipline, two timescales.

### The inner loop (per task)

Design what the agent runs inside, instead of prompting harder:

- **Context in.** The lane starts with the contract, the relevant AGENTS.md, and the latest
  handoff — injected by the session-context hook, not pasted by me. State lives in git, files,
  and handoffs, never only in a context window. Practitioners call the quality cliff past
  ~100–150k tokens the Dumb Zone; the fresh-context discipline (state on disk, lanes
  restartable at any time) is how you never meet it.
- **Verifiers the agent can run itself.** `gate.sh` (seconds), the eval subset, the project's
  `/verify` skill (Playwright flows + screenshots for web UIs). Verification the agent can't
  run becomes _my_ job at review time — so the cheapest missing verifier gets built as part of
  the task, not deferred.
- **Stop conditions.** The lane ends at an evidence packet, a blocked-on-input question, or a
  failed retry budget — never at "I think this is probably right." An agent that can't satisfy
  a check says so in `NOT verified` and stops. Anything unattended names its five parts before
  it runs — **trigger, goal, verifier, stop rule, memory** — and the stop/budget caps are
  load-bearing, not hygiene: a 2026 scan of 6,549 agent repos confirmed 68 runaway-loop
  failures across 47 of them ([arXiv 2607.01641](https://arxiv.org/abs/2607.01641)).
- **Two iterations, no new hypothesis → fresh eyes.** The session that produced the confusion
  is the worst place to resolve it. After two failed attempts on the same problem, the next
  move is a fresh-context review (critic or `/challenge`, reading only repo + spec) — not a
  third argument in the same chat.
- **Fan out for reads, single-lane for writes** (the rule itself lives in the global CLAUDE.md;
  this is why it exists). The reads half earned itself on the insights session: two read-only
  investigators did ~150k tokens of digging that never touched the main context. The writes half
  earned itself the expensive way — two of my own parallel lanes collided on the same explorer
  HTML and cost a merge-conflict cleanup inside PR #48. That's the receipt for "worktrees isolate
  files, not simulators, ports, or datastores." Topology is also the cost-and-latency lever:
  pipeline stages by default, add a barrier only when a stage genuinely needs the whole prior
  set — the slowest branch sets wall-clock, and every fan-in is a context chokepoint.
- **Self-paced background verification.** Long verification (device eval runs, full XCTest)
  runs as background tasks with scheduled wakeups; the lane sleeps between rounds instead of
  burning context polling. The insights session chained five A/B eval rounds this way —
  including correctly recognizing a stale wakeup after the work was done and doing nothing.

### The outer loop (standing)

- **Nightly, 6:17am:** every focus repo's gate + eval suite runs, digest written, macOS
  notification on any red/yellow. Hard 900-second per-gate timeout in its own process group —
  installed after 2026-07-07, when uv cache-lock contention turned jim-agent's 9-second gate
  into a 37-minute hang. The outer loop caught it; the fix is now permanent. That's the outer
  loop doing its job: drift gets caught by machinery, on a schedule, not by me noticing.
- **Weekly, Sunday:** the improvement proposer (chapter 7) mines the week's digests and logs.
- **On-trigger:** model requalification when a provider ships a new model — rerun the eval
  suites, compare, then switch. Never switch on vibes or launch-day hype.

What earns a place in the outer loop: **regulators, not reference-setters.** A standing loop
maintains known behavior against a check that already exists — gate drift, eval regressions,
dependency bumps, digest triage. It does not choose what to build. If a candidate automation's
output can't be graded by an existing verifier (or one built in the same diff), it isn't a loop
candidate yet; it's a judgment task — the same line model tiering draws below: the call that
sets direction never delegates.

### Model tiering (adopted doctrine)

Willison calls it Judgment-Driven Development: the top model is reserved for what needs
judgment — planning, reviewing evidence, judging evals, this manual — and well-specified
execution goes to a cheaper, faster tier. The contract is what makes this safe: a task specified
to runnable-acceptance-check precision doesn't need the smartest model, it needs an obedient
one. My routing: **plans, packet review, eval judging → top tier; contracted execution lanes,
mechanical refactors, collectors → cheap tier.**

**Where "top tier" points, as of 2026-07-25 (rule in global CLAUDE.md).** When the session runs on
Fable, Fable stays in the main loop and the latest Opus takes the churn — breadth recon, mechanical
migrations, doc sweeps, eval babysitting. That inverts the older habit of orchestrating on the
biggest model and delegating downward to Sonnet, and it follows from where the two models actually
differ: the orchestrator's job is holding the contract and judging what comes back, which is
cheapest to get wrong and most expensive to delegate. The one thing that never delegates, on any
tier, is the judgment call that sets direction.

> Backlog: routing stays manual per lane. The trial scoreboard that was going to instrument it
> is retired (Appendix B); a routing record earns a config only if the Sunday proposer surfaces
> tier-mismatch friction (wrong-tier rework showing up in the babysit log).

### Terminology note — the loop/graph wave (2026-06/07)

The discourse label for this chapter changed twice while the chapter existed. "Loop
engineering" (coined 2026-06-07/08, Steinberger's slogan → Osmani's essay, after Boris Cherny's
"my job is to write loops") was abandoned by its own coiner 41 days later for "graph
engineering" — a term launched as satire, carrying three incompatible meanings within its first
week, and propagated mainly by engagement accounts (the viral "14-step graph roadmap" article
reused the exact template its author had published for loops six weeks earlier). Anthropic
published under neither label; the writers with the best track record on rigor (Willison,
Fowler) kept their own vocabulary. So this manual keeps neutral terms — the inner and outer
loop, harness design — and adopted only what arrived with evidence: the five-part
unattended-run spec and its runaway-loop receipt (inner loop, above), the
regulator/reference-setter test (outer loop, above), the topology-as-cost-lever line (fan-out
bullet), and the graph-memory tradeoff (`AGENT_ANATOMY.md` question #6). Mechanisms in, labels
out: a term that can't hold still for six weeks doesn't get written into doctrine.

### Anti-patterns the receipts warn about

Each of these traces to evidence cited in this chapter or right here — they're the two loops
run wrong:

- **A critic loop with no programmatic verifier.** LLMs don't reliably self-correct without
  external feedback, and reflection without a real check can degrade output
  ([Huang et al., ICLR 2024](https://arxiv.org/abs/2310.01798)). An LLM-judged loop is spend
  without signal until the judge is calibrated —
  that's `/evals` D1/D3's territory.
- **An unattended loop without stop and budget caps.** The dominant observed failure class in
  the wild (the 68 runaway loops, above). Caps are load-bearing, not hygiene.
- **Premature fan-out.** Reaching for parallel agents before one loop demonstrably isn't
  enough: tokens multiply, the slowest branch sets wall-clock, and every fan-in is a context
  chokepoint. The topology lever (above) exists to be pulled late, not first.
- **Automating a reference-setter.** If no existing verifier can grade the output, it isn't a
  loop candidate — it's a judgment task wearing a cron schedule (the regulator test, above).
- **Writing the term-of-the-week into doctrine.** The terminology note above is the standing
  receipt: mechanisms in, labels out.

---

## 6. The harness

The harness's one-sentence job: **the model proposes, deterministic code disposes.** Everything
probabilistic gets a deterministic boundary around it.

What's real and installed today (this repo):

| Layer                | Installed                                                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hooks (6, fail-open) | guard-bash (catastrophic commands), guard-commit (runs the repo's gate on every commit), guard-secrets, format-on-edit, session-context (git state + digest + latest handoff's next-steps, per repo, newest by filename timestamp), notify (lane-finished notifications) |
| Gates                | `.claude/gate.sh` per focus repo (5 repos incl. M-Clone since 2026-07-20), enforced at commit; anti-cheat lines live in jim-agent + M-Clone                                                            |
| Outer loop           | `nightly-gate-digest.sh` + launchd 6:17am + dated digests + slow-gate flagging + per-repo `.claude/evals.sh` (jim-agent, M-Clone)                                                                      |
| Skills (24 + project)| task loop (**spec, evidence-packet** — the two procedures extracted from CLAUDE.md on 2026-07-25), planning (spike, brainstorm×2, challenge×2, deep-plan), lifecycle (onboard, handoff, end-session, update-docs, changelog), building (new-agent, setup-verify, retro, hack), meta (propose-improvements), cost (token-breakdown ×6); per-project `verify` skills (M-Clone) |
| Agents (2)           | critic (adversarial, read-only, top tier — self-invoked via `/challenge` on high-stakes specs, and via `/evidence-packet` on every finished diff, scored against `skills/evidence-packet/references/diff-vs-spec.md`), researcher (cited web synthesis) |

Two orientation notes that keep getting re-derived (full versions: OPERATING_MANUAL.md §0):
gate.sh and evals.sh are *time slots*, not check types — deterministic code checks fit the
every-commit slot, scored behavior suites fit the nightly slot, and placement is cost. And
AGENTS.md-vs-CLAUDE.md is naming, not function — one project file (`AGENTS.md`, the
cross-tool standard) with an `@AGENTS.md` pointer as the repo's CLAUDE.md; the real axis is
global (how I work) vs project (what this repo is).

Two standing rules:

1. **Harness changes are product changes.** A new hook or skill goes through the same
   contract → evidence packet loop as feature code. The harness repo has its own gate; it eats
   its own dog food.
2. **Nothing in the harness is described as protection.** Hooks fail open; a worktree is not a
   sandbox. These are conveniences that make the right thing cheap, not walls. The day I need
   walls (an agent spending real money autonomously), that's an infrastructure project with
   its own contract — Willison's move: make autonomy a _sandbox_ question (disposable, sealed,
   budgeted environments), not a trust question.

**The harness backlog** (methodology currently leading reality — each with its trigger). This
table is the harness's trigger registry, the one deliberate carve-out from "this manual never
specifies": a deferred item is recorded next to its why, and graduates into a skill, gate line,
or hook when its trigger fires.

| Gap                         | Status 2026-07-25 / trigger                                                                        | Cheapest build                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| grocery-buddy evals unwired | **Still open** — flagged since v1; next M-Clone-free working day                                    | `.claude/evals.sh` calling the existing runner           |
| Anti-cheat gate lines       | **Shipped** in jim-agent + M-Clone; procurement/dj on first eval suite                              | grep-level checks in gate.sh                             |
| Weekly improvement proposer | **Shipped** (propose-improvements + Sunday launchd) — but one run on record; 07-19 missing → check the launchd job | `launchctl print` the job; kickstart if dead             |
| Model routing record        | Deferred with the trial (Appendix B status)                                                         | a column in the scoreboard, then a config if it earns it |
| Mobile verification path    | **Partial**: M-Clone `/verify` runs gate + XCTest + eval delta with a mandatory UI-honesty line; eye-check stays manual — trigger: manual mobile testing reappears as a top babysit-log item, or the first UI regression the evals miss | build + launch + screenshot smoke on simulator (`xcrun simctl`) first; grow into Maestro flows for the 2–3 most-tested journeys only |
| Remote session experiment   | Trigger: a self-contained Next.js project and one T1 feature to delegate end-to-end. Remote sandboxes give real containment (the honest answer to "worktree is not sandbox") plus preinstalled Chromium for browser verification; costs draw from existing subscription usage | one remote lane; promote to default-for-web-lanes only if the first evidence packets come back clean |
| Portable deep-* skills      | Trigger: running `/deep-plan`, `/deep-challenge`, or `/deep-brainstorm` anywhere but the primary Mac. Skill files hardcode `/Users/geoandr/...` paths (install.sh rewrites them in copy mode only, macOS-specific `sed -i ''`) and lean on `~/dev/docs/DEEP_SKILLS.md`, outside this repo | path indirection or install-time rewrite that works beyond copy-mode macOS |
| Nightly-loop upgrades       | Not yet live: content-addressed skipping of unchanged repos, repeated-trial eval handling, live-model canaries — trigger: digest wall-clock growth, or a drift incident the zero-spend nightly structurally can't catch | one at a time, cheapest first |

---

## 7. The self-improving system

Doctrine: **agent-proposed, human-approved.** The system watches its own exhaust and proposes
its own fixes; I stay the approval gate. Fully autonomous harness changes are an L4 ambition
with a trust bar I haven't earned yet; purely human-triggered retros are what I had before, and
they under-fired because noticing friction was itself work.

The loop, concretely:

1. **Exhaust accumulates automatically.** Gate digests (nightly), `BABYSIT_LOG.md` (one line
   per babysitting incident: what I had to do by hand, observed cost — never the solution),
   handoffs (per session).
2. **Sunday: the proposer runs.** A scheduled agent reads the week's digests, the log, and
   recent handoffs, clusters recurring friction, and files `~/dev/docs/proposals/<date>.md`.
   Each proposal: the friction (evidence quoted) → the cheapest durable fix on the ladder →
   estimated cost to build and run. The ladder, in strict order:
   **hook < gate.sh line < instruction line < skill < eval case < accept-as-is.**
   It also audits the week's fix-shaped commits: a bug fix that landed without a matching
   eval-suite diff gets flagged, so the bugs-become-cases rule (ch.3) is enforced by weekly
   audit rather than by my memory. The proposer cannot apply anything. Propose-only, by
   construction.
3. **I approve or reject in minutes.** Approved proposals become contracted tasks like any
   other work.

Retro triage speaks a shared vocabulary now: each friction item is classified before it's
fixed — **victory-declaration bias** (claimed done without evidence), **context anxiety**
(degraded work near context limits), **one-shotting overreach** (a meaty plan that should
have been phases), **babysat verification**, **re-explained context**. The bucket usually
picks the rung on the fix ladder; free-form postmortems don't compound, named ones do.

Two receipts that this loop finds real things: the babysit log's resolved section already
contains a genuine bug found by exhaust-reading (guard-commit resolving the wrong repo's gate
on `cd other-repo && git commit`), and this week's digests contain a proposal the Sunday run
would file on its first pass — three repos SLOW-flagged four nights running, jim-agent at
5,735 seconds last night against a 120-second budget.

Instruction files obey the same philosophy. My CLAUDE.md and each repo's AGENTS.md are
**reactive failure logs**: a line gets added because an agent actually misbehaved, and a line
that stops paying gets deleted (Hashimoto: each earned line "almost completely resolved" the
bad behaviors). The audit this rule triggers immediately: dj-agent's AGENTS.md is 221 lines
against grocery-buddy's 30 — either dj-agent had 7× the earned failures or that file is
speculative style-guide bloat. The proposer gets to make that case.

---

## 8. Economics

Measure before optimizing — the six token-breakdown skills exist so that cost arguments in
this household use numbers, not feelings.

The cost model of trust, cheapest first:

| Mechanism                    | Cost curve                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| Evidence packet              | ~Free — formatting of work already done                                            |
| Anti-cheat gate lines        | Free forever — grep is not billed                                                  |
| Code-graded eval case        | Free per run after authoring                                                       |
| Snapshot/replay eval         | Cheap; storage + occasional re-record                                              |
| LLM-judge eval case          | A paid model call per case per run, forever                                        |
| Independent verifier session | A whole second agent per task — rejected as default policy for exactly this reason |

Three spending rules:

1. **Verification spend follows the consequence tier** (chapter 4). Tier-1 code earns LLM
   judges and thick suites. Tier-3 code earns a gate and nothing else.
2. **Fan-out must pay rent.** Anthropic's own research: multi-agent beat single-agent while
   burning ~15× the tokens, and token volume explained most of the gain. A parallel lane is
   justified by the review tier it lands in, not by the thrill of concurrency.
3. **The kill rule.** Any ritual, eval, hook, or standing loop that hasn't changed a decision
   or caught a regression in ~3 cycles is a deletion candidate — the proposer is required to
   nominate candidates, and "we've always run it" is not a defense.

> Retired with the trial (Appendix B): per-task token logging. Cost questions get answered on
> demand with the token-breakdown skills — measurement a machine emits when asked beats a
> ledger a human forgets to keep.

---

## 9. A day in practice

The proof that chapters 1–8 compose. The substitutions walkthrough below is an **illustrative
composite** (the digest snippet, tools, and paths are real; the task hasn't run). The *actual*
end-to-end receipt is the M-Clone insights-v2 session (2026-07-22, PR #48): hypothesis brief →
two parallel read-only investigators → mechanical root cause → spec → self-invoked critic
(caught the plan's own flaw) → red-first metric → five self-paced eval rounds with per-row
adjudication → evidence packet with eval delta and owed-items list → merged PR. Roughly five
human turns across 561 agent events. Read that session's spec and packet before this fiction.

**08:10 — Open.** A session in `~/dev/grocery-buddy` — terminal or desktop app, same hooks
either way. The session-context hook injects git state, the last handoff's next-steps, and the
overnight digest into the agent's context. This is silent: nothing is shown in the chat. The
check that it fired is behavioral — the agent's first reply already knows the branch and the
digest — or just ask "what did the session-start hook tell you?" This morning's real one:

```
jim-agent — 🟡 pass — SLOW (budget 120s) (5735s)
jim-agent evals — ✅ evals pass (5s)
grocery-buddy — 🟡 pass — SLOW (budget 120s) (665s)
procurement-agent — ✅ pass (2s)
dj-agent — 🟡 pass — SLOW (budget 120s) (978s)
```

Triage by severity (ch.1: judgment on decisions): no reds, evals green — nothing is broken for
users, so nothing preempts the day. Three SLOW flags, fourth night running → one line appended
to BABYSIT_LOG. Sunday's proposer will do the clustering; I don't debug gates at 8am.

**08:20 — Contract.** Today's outcome: grocery-buddy handles out-of-stock substitutions. I
brief in two sentences; the agent drafts the contract; I correct Non-goals (ch.2):

```
Outcome:             When a cart item is out of stock at checkout, the agent proposes the
                     closest substitute (same category, ±20% price) and requires my
                     confirmation before swapping.
Non-goals:           No auto-substitution without confirmation. No multi-store fallback.
Acceptance evidence: evals/datasets/substitutions.jsonl — 3 new cases (exact-match available;
                     nearest-in-category; nothing acceptable → item dropped with note), all
                     passing via evals/run.py. Checkout-flow screenshot showing the
                     confirmation prompt (grocery-buddy has no /verify skill yet — scaffolding
                     it via /setup-verify is in scope for this task, per ch.5: the cheapest
                     missing verifier becomes part of the task). gate.sh green incl.
                     anti-cheat lines.
```

Note what happened: the acceptance evidence _is_ three eval cases (ch.3, eval-alongside). They
outlive the task.

**08:35 — Delegate, tiered.** Plan drafted and approved on the top model; the execution lane
launches in a worktree on the cheap tier (ch.5) with the contract, AGENTS.md, and handoff as
its entire context. Two equivalent shapes: a subagent spawned from the planning session itself
(model override + worktree isolation — the planning session stays open and relays the packet
when the lane finishes), or a separate session opened by hand. The subagent shape is the
default; a separate session only when I want to steer the lane interactively. Kickoff: _"Execute the approved plan for the substitutions contract.
Self-verify: run gate.sh, run evals/run.py on the new dataset, run /verify for the checkout
flow. End with an evidence packet; anything you can't verify goes in NOT verified."_

**08:40 — Second lane.** While lane 1 runs: a tier-3 research spike (ch.4 — outcome-only
review) on whether dj-agent's gate slowness is the same uv-lock class as jim's 2026-07-07
incident. Lane count is set by what review absorbs — a tier-1 lane and a tier-3 lane is a
comfortable day; two tier-1 lanes is not (ch.8, rule 2).

**11:30 — Evidence packet arrives** (notify hook pings; ch.4). The packet shows: 4 files
changed; 3/3 new eval cases pass with runner output inline; gate green including anti-cheat
(no test modified, no out-of-scope files); screenshot of the confirmation prompt;
`NOT verified: live Instacart API path — exercised against the recorded fixture only.`
Substitutions touch checkout → tier 1: I line-review `substitute.py` (~90 lines), skim the
rest via the packet. The NOT-verified line is honest and acceptable — the live path is behind
the same fixture contract as everything else. **Accept.** Total review: 15 minutes, zero
manual cart-driving. That — not heroics — is the whole manual working.

**14:00 — A bug.** Briefing email misprices a substituted item. Old me: fix it, move on. The
loop (ch.3): first write the failing case into `substitutions.jsonl` (case 4: substituted item
price must propagate to the briefing total), watch it fail, then contract the fix. The suite
just grew from reality; the nightly now guards this forever.

**17:40 — Close.** `/end-session`: docs updated, handoff written with next-steps. Tonight at
6:17 the outer loop re-verifies everything I merged today against every suite I own. Sunday
the proposer reads the week and files its proposals. The system keeps working after I stop.

---

## Appendix A — The interview map

Every probe an Applied AI Engineer loop actually asks, answered in first person with a receipt,
and where the full argument lives.

| Probe                                                | My two-sentence answer                                                                                                                                                                                                                                                                 | Where    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| How do you design evals for an agent product?        | Acceptance evidence in every task contract is written as runnable checks, which land as eval cases in the same diff — suites only ever grow from real failures and real features. jim-agent runs 13 scenarios nightly with baseline-compare in 5 seconds, zero credentials.            | Ch. 2, 3 |
| When do you use LLM-as-judge, and what does it cost? | Last resort after code-graders and snapshot/replay, because a judge is a paid call per case per run forever; when I do, the judge model is pinned, calibrated against my own grading, and given an "Unknown" escape.                                                                   | Ch. 3, 8 |
| How do you know agent output actually works?         | Never by its say-so: an evidence packet with actual check output, an eval suite the agent can't game, and anti-cheat gate lines for Beck's tells — tests deleted/disabled, unrequested changes. Cursor showed 63% of audited benchmark passes cheated; my gates assume mine would too. | Ch. 4    |
| What agent failure modes do you design against?      | Reward hacking (anti-cheat gates), context degradation past ~100–150k tokens (state on disk, restartable lanes), and confident wrongness (the mandatory NOT-verified list in every packet).                                                                                            | Ch. 4, 5 |
| How do you manage context?                           | The lane starts from contract + AGENTS.md + handoff injected by hook; state lives in git and files so any lane can be killed and restarted fresh. Instruction files are reactive failure logs — every line earned by a real misbehavior, audited for bloat.                            | Ch. 5, 7 |
| How do you control cost?                             | Tiered models (top tier judges, cheap tier executes contracted work), verification spend tied to consequence tiers, and a kill rule for machinery that stops earning — measured with per-session token breakdowns, not feelings.                                                       | Ch. 5, 8 |
| Multi-agent or single-agent?                         | Fan-out must pay rent: Anthropic's own data shows multi-agent winning mostly by 15× token burn. I scale lanes only as machine-absorbed review capacity grows — the bottleneck is acceptance, not generation.                                                                           | Ch. 4, 8 |
| How does your system improve over time?              | Agent-proposed, human-approved: nightly digests and a babysit log accumulate exhaust automatically, a Sunday agent clusters it into proposals on a strict cheapest-fix ladder, I approve in minutes. Every bug becomes an eval case before its fix.                                    | Ch. 3, 7 |
| How do you evaluate a new model?                     | Requalification on trigger: rerun my suites against it, compare to baseline, switch on evidence. Never on launch-day vibes.                                                                                                                                                            | Ch. 5    |
| How do you know your evals aren't lying?             | Measurement drift is a first-class failure class: my metrics' predicates are byte-identical to what production enforces, eval-harness prompts are parity-fenced against app prompts, and shipping-gate suites earn a periodic every-row read. Receipt: an any-of metric read 1.000 while the flagship figure was being dropped; the fix went red-first before the feature fix. | Ch. 3    |
| Generation is cheap now — what about review?         | Review is the bottleneck, so I mechanize the compressible parts before my eyes arrive: deterministic gates, eval deltas, then a fresh-context adversarial critic told to refute the diff against its spec. My judgment lands only on architecture, tradeoffs, and intent — five human turns steered a 561-event feature to a merged PR.                                       | Ch. 4    |
| How do you know your methodology works?              | I pre-registered five metrics and ran a baseline week against an adoption week on my own products — the scoreboard is in the manual, including the commitment to revise it where the numbers say it lied.                                                                              | App. B   |

---

## Appendix B — The scoreboard

The two-week proof-of-value trial. Pre-registered before week 1, so the success bar can't
quietly move. Live log: `~/dev/docs/trial-scoreboard.md`.

**Design.** Week 1: work exactly as today; instrument only. Week 2: every task ends in an
evidence packet, eval cases land with features (starting with wiring grocery-buddy's 28
existing cases into the nightly), anti-cheat lines active in grocery-buddy and jim-agent gates.

**Metrics** (one scoreboard line per task, ~30 seconds of discipline):

1. Accepted outcomes per week
2. Manual re-tests per task — times I personally exercised the change after the agent said done
3. Minutes from "agent claims done" → my acceptance
4. Regressions caught by evals/gates vs. caught by me
5. Token spend per accepted task (token-breakdown-past-session)

**Pre-registered success bar.** Metrics 2 and 3 drop materially (target: −50%); metric 1
non-decreasing; metric 5 may rise up to +25% (verification isn't free — the claim is that it
buys back my time, not that it's cheaper in tokens); metric 4 shifts toward machine-caught.

**The commitment.** Whatever the numbers say gets written here — pass, and these receipts are
what make the manual worth sharing; fail, and the chapters the numbers indict get revised.
A methodology that won't sit for its own eval doesn't deserve one.

_Results, written 2026-07-23, per the commitment above:_ **the instrumented trial did not
run.** The scoreboard log is empty — week 1 (baseline) logged zero lines, and week 2's
adoption tasks happened without their metrics. Receipt: `~/dev/docs/trial-scoreboard.md`,
Log section, blank. What actually happened instead: the adoption the trial was meant to
measure occurred organically on M-Clone (harness wiring 2026-07-20; the insights-v2 session
2026-07-22 ran the full loop — spec, self-invoked critic, red-first metric, five eval rounds,
adjudicated evidence packet, merged PR at roughly five human turns per 561 agent events),
while the instrumentation discipline — one 30-second line per task — was the part that never
survived contact with real work.

The honest verdict the numbers permit: **the methodology shipped; the measurement of the
methodology didn't.** Per-task self-logging is hereby retired as the mechanism (it failed
its own trigger twice). Replacement: metrics that machines already emit — nightly digest
pass/slow/fail history (M4), evidence-packet artifacts per merged PR (M1), and
token-breakdown skills on demand (M5). M2/M3 (re-tests and done→accept minutes) remain
unmeasured; the M-Clone receipts are directional evidence, not the pre-registered proof.
This paragraph is the revision the original commitment demanded.
