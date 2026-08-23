---
title: The Manual — why this workflow works
collection: harness
source: ~/dev/agentic-harness/docs/MANUAL.md
sourceMtime: '2026-08-03T01:26:45.998Z'
sourceCommit: 753b16e
syncedAt: '2026-08-23'
summary: >-
  Visual companion:
  <https://claude.ai/code/artifact/674b8a51-7bf4-44f4-8ab5-64591f620444> — this
  file is canonical; the visual renders it (docs/visuals/README.md).
contentHash: 'sha256:70b89bfea8f03654a2f27b3d0653ea7c04552b9cc415569380792628ddbb109f'
---
# The Manual — why this workflow works

*Visual companion: <https://claude.ai/code/artifact/674b8a51-7bf4-44f4-8ab5-64591f620444> —
this file is canonical; the visual renders it (`docs/visuals/README.md`).*

_Why this way of building with agents works. Every claim here is either backed by published
evidence, by a failure pattern observed often enough to name, or marked `> Backlog:` with the
trigger that would make it real._

_De-specified 2026-07-26. This chapter used to argue from one person's fleet, naming the repos.
The arguments survived the removal of the names; what did not survive is now marked as a pattern
rather than a receipt. Appendix B is the deliberate exception — it is a personal record, kept
because a document claiming "the methodology evals itself" cannot delete its own failed self-eval._

_Ownership rule: this is doctrine — the why. Workflow rules are canonical in global CLAUDE.md and
per-repo AGENTS.md (the copies agents obey); the daily how lives in OPERATING_MANUAL.md. If a
sentence here would change an agent's behavior, it's in the wrong file._

_How this differs from its neighbors: `AGENT_ANATOMY.md` and `PRODUCT_ANATOMY.md` are about the
thing being built — one agent, or a product made of several. This file is about the way of working
that builds it. Same thesis, different object._

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

**Placing a product honestly is harder than the ladder makes it look**, because the failure is
almost always in the *sensor*, not the cases. A product looks a level higher than it is whenever
the machinery exists but does not actually report. Place by asking what would have to break for
your warning light to go red — then check that it can:

| If you find… | You are not at | Because |
| --- | --- | --- |
| A nightly that asserts a case *count* rather than correctness | L2 | It cannot fail on a quality regression, so it is decoration |
| A suite whose runner exits 0 when its API key is missing | L2 | A green that means "did not run" is worse than no green |
| A judge whose calibration artifact exists on no machine | L2 | An uncalibrated judge is spend without signal |
| A regression gate whose baseline is gitignored | L2 | It silently no-ops on any fresh clone |
| Excellent eval machinery that the nightly does not reach | L2 | A suite the operator has to remember to run is not a sensor |
| A north-star metric that is 100% by construction | L1 | The documented path bypasses the thing being measured |

Every row above is something I actually found, most of them more than once. **Every one is a false
green**, and that is the point: the common failure is not authoring too few cases, it is a warning light wired to nothing.

What I found placing my own products: **L2 where I actually work, L1 everywhere else.** I do not
know how general that is — it is one person's fleet, and it is the shape I would look for first
rather than a finding about teams. Once the loop is proven end-to-end in one product — contract, machine verification, adversarial
review, eval-backed evidence — the remaining question stops being "does the methodology work" and
becomes "does it exist anywhere but the repo I point it at." That is a rollout problem, and it does
not solve itself.

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
  Learned the hard way: a contract that lives in the planning tool rather than the repo is
  invisible to the diff it governs.
- **Heavy specs are reviewed at diagram altitude first.** A spec that spans modules leads
  with a Mermaid diagram — architecture or flow, current → proposed — and I read the boxes
  and arrows before the paragraphs: structural wrongness (a dependency pointing the wrong
  way, a layer that shouldn't know about another) is visible in a diagram in seconds and
  invisible in prose for pages. The evidence packet closes the loop by bringing the diagram
  to as-built, which keeps the repo's architecture docs true as a side effect of shipping.
  Two extensions of the same idea: PR bodies carry the spec's Mermaid delta (GitHub renders
  it, so merge review starts at plan-review altitude), and a feature with an eval suite and
  ~3+ sessions of iteration earns a living **explorer page** — an HTML dashboard of its
  architecture, guards, and metrics, updated in-diff. Once one exists it tends to become the de
  facto review surface for that work. Never scaffolded speculatively; earned by iteration.
- **High-stakes specs get `/challenge` before I ever see them.** The agent self-invokes the
  critic on foundation-adjacent plans (an instruction line + an invocable skill is the whole
  mechanism). The class of finding this catches: a plan whose own forcing mechanism would have
  discarded the very output the feature existed to produce, and a red-first step that was
  tautological — both caught before a line of code existed.
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
  ARE the spec: the plan isn't approved until the cases defining "working" exist. Most products
  never cross this line; crossing it is worth naming out loud when it happens, because the
  approval bar changes.

**How suites grow — from reality, never speculation:**

- **Every bug becomes a case before it's fixed.** The failing case is written first, it fails,
  then the fix makes it pass. The suite is a monotonically growing net of everything that has
  ever actually gone wrong. Anthropic's eval guidance says 20–50 cases drawn from real failures
  beats any elaborate framework. A suite of 30–100 cases is already real-suite scale — so when
  such a suite is catching nothing, suspect the wiring long before the authoring.
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

**The metric is a product with its own bugs.** Token-level metrics can read 1.000 while the output
is wrong, so measurement drift is a first-class failure class. Three failure shapes, all observed
in a single session's work and all worth checking for by name:

- An **any-of** citation metric silently blessed the exact figure-drop the feature existed to
  prevent — the predicate was satisfiable without the behavior.
- The eval harness sent **different prompt wording than production**, so the thing measured was not
  the thing shipped.
- A per-row adjudication pass — actually reading every output — found the model copying the
  prompt's own example phrase back as advice on roughly 40% of items that scored perfect.

The rules that follow: score predicates must be byte-identical to what production enforces;
harness and production prompt text gets parity-fenced; and any suite that gates shipping earns a
periodic every-row read, because the cases you grade are only as honest as the ruler.

**The five sensor failures — audit for these by name.** One fresh-context critic per repo, scoring
every suite in my fleet against D1–D8, found at least one trust-breaking problem in every single
one. Not one was a case-authoring problem. Every one was a **sensor** problem: the suite existed,
and it could not have told you it was broken. Six repos is not a study — but the failures were
identical enough across products to be worth naming.

1. **The false green.** A runner that exits 0 when its credentials are missing, reported as passing
   for dozens of consecutive nights. The most dangerous state a suite can be in, because it
   actively suppresses the alarm.
2. **The count-not-correctness nightly.** A job that asserts how many cases ran rather than whether
   they passed — and worse, silently rewrites its own committed accuracy record. It cannot fail on
   a quality regression by construction.
3. **The uncalibrated judge.** A judge co-deciding a consequential outcome, tracing back to a
   calibration run whose artifact exists on no machine. An uncalibrated judge is spend without
   signal.
4. **The gate that no-ops off one machine.** A regression gate whose baseline is gitignored, so it
   silently passes on any fresh clone — including CI.
5. **The invisible suite.** Excellent eval machinery unreachable by the rollup, because its scripts
   sit outside the doorknob convention and it is absent from the nightly. A suite you have to
   remember to run is not a sensor.

Two more for the same checklist: a **north-star metric that is 100% by construction** because the
documented path bypasses the gate it claims to measure, and **live injection surfaces with zero
adversarial coverage** — untrusted third-party text flowing into a synthesis prompt is the common
shape. A related trap worth naming: a **sealed holdout consumed with no read budget**, which burns
the holdout's value silently and tends to repeat once it has happened.

The uncomfortable implication: the products with the *deepest* eval culture were not the safest.
Sophisticated machinery — sealed holdouts, preregistration, corrections ledgers — coexisted
happily with a nightly that could not fail. Depth of investment says nothing about whether the
alarm is wired.

> Backlog: every product with a suite earns a scored methodology audit and a ranked migration
> plan (trigger: next session in that product). The cheapest high-value fixes are almost always
> the same two — kill the false green, and move the suite behind the doorknob the nightly turns.
> A product with no suite yet waits for its first user-visible bug; that bug becomes case #1, via
> `/evals case`.

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
adversarial pass on one feature's diff surfaced five real defects post-implementation,
pre-packet. And **gaps never close silently**: every NOT-verified item either blocks
acceptance or gets my explicit "accepted without X" plus a tracked follow-up in the
spec/handoff. The leak this plugs is specific and common: a PR merges with an owed manual
verification, and the only thing holding that debt is a line in a handoff nobody re-reads. I
review evidence, not diffs — except where the tier table below says otherwise.

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
| 1 — line-level   | Anything touching money or acting on your behalf externally: settlement and wallet paths, checkout, order placement | Read the core diff, line by line. Packet is context, not substitute.                     |
| 2 — packet-only  | Product logic behind a gate + evals: recommenders, parsers, synthesis and briefing steps, domain logic                                            | Read the packet. Open the diff only if a check is waived or `NOT verified` is non-empty. |
| 3 — outcome-only | Spikes, research, scaffolding, throwaway                                                                                                          | Does the outcome exist? One look. Code unread.                                           |

The point of the tiers is what they _free up_: today I effectively tier-1 everything, which is
why review capacity caps my lane count. Machine-absorbed tiers 2 and 3 are what make "scale
lanes" (chapter 5) honest instead of reckless.

> Adoption note: anti-cheat lines are cheap enough to ship the day a repo gets a gate —
> net-negative test assertions, skip/xfail markers, and test/eval deletions going red at commit
> is a handful of grep lines. In practice they arrive with a product's first eval suite, which is
> later than they need to be.

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
  this is why it exists). The reads half earned itself on a single feature: two read-only
  investigators did ~150k tokens of digging that never touched the main context. The writes half
  earned itself the expensive way — two of my own parallel lanes collided on the same explorer
  HTML page and cost a merge-conflict cleanup. That is the whole argument for "worktrees isolate
  files, not simulators, ports, or datastores." Topology is also the cost-and-latency lever:
  pipeline stages by default, add a barrier only when a stage genuinely needs the whole prior
  set — the slowest branch sets wall-clock, and every fan-in is a context chokepoint.
- **Self-paced background verification.** Long verification (device eval runs, full XCTest)
  runs as background tasks with scheduled wakeups; the lane sleeps between rounds instead of
  burning context polling. One session chained five A/B eval rounds this way —
  including correctly recognizing a stale wakeup after the work was done and doing nothing.

### The outer loop (standing)

- **Nightly, 6:17am:** every focus repo's gate + eval suite runs, digest written, macOS
  notification on any red/yellow. Hard 900-second per-gate timeout in its own process group —
  installed after package-manager cache-lock contention turned a 9-second gate into a 37-minute
  hang. The outer loop caught it; the fix is permanent. That is the outer loop doing its job:
  drift gets caught by machinery, on a schedule, not by anyone noticing.
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
bullet), and the graph-memory tradeoff (`AGENT_ANATOMY.md`, the *Memory & retention* decision).
Mechanisms in, labels out: a term that can't hold still for six weeks doesn't get written into
doctrine.

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

The layers a working harness needs, and what each one is for:

| Layer | What it is for |
| --- | --- |
| **Hooks** (fail-open) | Make the right thing cheap at the moment of action: catastrophic-command and secret filters, format-on-edit, a session-start briefing that injects git state plus the latest digest and handoff, completion notifications. Conveniences, never walls |
| **Build gate** (per repo) | One fast script the commit hook runs — syntax, lint, types, fast tests, plus the anti-cheat lines above. Target: seconds, not minutes, or `--no-verify` becomes a habit |
| **Outer loop** | A scheduled job running every repo's gate *and* its eval suite while you sleep, writing a dated digest, flagging slow gates. Catches drift in repos nobody touched — which is where drift actually appears |
| **Skills** | The procedures, extracted so they have one home: the task loop (spec, evidence packet), planning, lifecycle, project scaffolding, the meta-loop, and cost accounting |
| **Subagents** | At minimum two: an adversarial read-only critic on the top tier, self-invoked on high-stakes specs and on every finished diff against a scored rubric; and a researcher for cited synthesis |
| **Exhaust** | A babysitting log, dated digests, handoffs, token breakdowns — the raw material the meta-loop (ch. 7) reads |

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

**Keep a trigger registry, not a wish list.** The one deliberate carve-out from "this manual never
specifies": every gap between what the methodology prescribes and what is actually installed gets
recorded next to its *trigger* — the observed condition that will justify building it — and
graduates into a skill, gate line or hook when that trigger fires. A gap with no trigger is a wish,
and wishes are what turn an operating manual into shelf-ware.

The gaps that kept recurring in mine, with the trigger that should move each:

| Gap | Trigger to build it | Cheapest build |
| --- | --- | --- |
| A suite exists but nothing runs it | Immediately — this is a false green in waiting | The one-line doorknob script the nightly already looks for |
| Anti-cheat lines missing from a gate | The repo has a gate at all | grep-level checks; free forever |
| The weekly proposer never actually ran | A missing dated output — check the scheduler, not the code | Print the job status; restart if dead |
| Mobile or UI verification still manual | Manual testing reappears as a top babysitting item, or the first regression the evals miss | Build, launch and screenshot smoke first; grow into scripted flows for the 2–3 most-tested journeys only |
| No real containment for delegated work | The first task you would not want running against your own credentials | One remote or sandboxed lane; promote to default only if its first evidence packets come back clean |
| Tooling hardcoded to one machine | Trying to run it anywhere else | Path indirection or an install-time rewrite |
| Nightly loop outgrowing its slot | Digest wall-clock growth, or a drift incident the zero-spend nightly structurally cannot catch | One upgrade at a time, cheapest first: skip unchanged repos, then repeated-trial handling, then live-model canaries |

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
would file on its first pass — several repos SLOW-flagged four nights running, the worst at
5,735 seconds against a 120-second budget.

Instruction files obey the same philosophy. My CLAUDE.md and each repo's AGENTS.md are
**reactive failure logs**: a line gets added because an agent actually misbehaved, and a line
that stops paying gets deleted (Hashimoto: each earned line "almost completely resolved" the
bad behaviors). The audit this rule triggers is a line-count comparison across your own repos. Mine ran 221 lines
in one product against 30 in another; either the first earned 7× the failures, or that file is
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

The proof that chapters 1–8 compose. The shape below is what a full loop looks like end to end;
the product is a shopping assistant, but nothing about the day depends on that.

The strongest real version of this loop I have run went: hypothesis brief → two parallel
read-only investigators → mechanical root cause → spec → self-invoked critic, which caught a flaw
in the plan itself → red-first metric → five self-paced eval rounds with per-row adjudication →
evidence packet with eval delta and owed-items list → merged PR. Roughly **five human turns across
561 agent events**. That ratio is the whole point of everything above it.

**08:10 — Open.** A session opens in the product repo — terminal or desktop app, same hooks
either way. The session-context hook injects git state, the last handoff's next-steps, and the
overnight digest into the agent's context. This is silent: nothing appears in the chat. The check
that it fired is behavioral — the agent's first reply already knows the branch and the digest — or
just ask what the session-start hook told it. A representative digest:

```
product-a          — 🟡 pass — SLOW (budget 120s) (5735s)
product-a evals    — ✅ evals pass (5s)
product-b          — 🟡 pass — SLOW (budget 120s) (665s)
product-c          — ✅ pass (2s)
product-d          — 🟡 pass — SLOW (budget 120s) (978s)
```

Triage by severity (ch.1 — judgment goes on decisions): no reds, evals green, so nothing is broken
for users and nothing preempts the day. Three SLOW flags on a fourth consecutive night is one line
appended to the babysitting log. The weekly proposer does the clustering; nobody debugs gates at
8am.

**08:20 — Contract.** Today's outcome: the assistant handles out-of-stock substitutions. Brief it
in two sentences, let the agent draft the contract, correct the Non-goals (ch.2):

```
Outcome:             When a cart item is out of stock at checkout, the agent proposes the
                     closest substitute (same category, ±20% price) and requires
                     confirmation before swapping.
Non-goals:           No auto-substitution without confirmation. No multi-store fallback.
Acceptance evidence: 3 new eval cases (exact match available; nearest in category; nothing
                     acceptable → item dropped with note), all passing via the suite runner.
                     Checkout-flow screenshot showing the confirmation prompt — this product
                     has no verify skill yet, so scaffolding one is in scope for this task
                     (ch.5: the cheapest missing verifier becomes part of the task).
                     gate.sh green including anti-cheat lines.
```

Note what happened: the acceptance evidence *is* three eval cases (ch.3, eval-alongside). They
outlive the task.

**08:35 — Delegate, tiered.** Plan drafted and approved on the top model; the execution lane
launches in a worktree on the cheap tier (ch.5) with the contract, the project's AGENTS.md, and
the handoff as its entire context. Two equivalent shapes: a subagent spawned from the planning
session itself — model override plus worktree isolation, planning session stays open and relays
the packet when the lane finishes — or a separate session opened by hand. The subagent shape is
the default; a separate session only when you want to steer interactively. Kickoff: _"Execute the
approved plan for the substitutions contract. Self-verify: run the gate, run the suite on the new
dataset, run the verify skill for the checkout flow. End with an evidence packet; anything you
can't verify goes in NOT verified."_

**08:40 — Second lane.** While lane 1 runs: a tier-3 research spike (ch.4 — outcome-only review)
on whether one product's gate slowness is the same dependency-lock class as an earlier incident
elsewhere. Lane count is set by what review absorbs — a tier-1 lane plus a tier-3 lane is a
comfortable day; two tier-1 lanes is not (ch.8, rule 2).

**11:30 — Evidence packet arrives** (the notify hook pings; ch.4). It shows: 4 files changed; 3/3
new eval cases passing with runner output inline; gate green including anti-cheat (no test
modified, no out-of-scope files); the screenshot of the confirmation prompt; and
`NOT verified: live vendor API path — exercised against the recorded fixture only.`

Substitutions touch checkout, so this is tier 1: line-review the ~90 lines that actually implement
the substitution, skim the rest through the packet. The NOT-verified line is honest and acceptable
— the live path sits behind the same fixture contract as everything else. **Accept.** Total
review: fifteen minutes, zero manual cart-driving. That, not heroics, is the whole manual working.

**14:00 — A bug.** The briefing email misprices a substituted item. The old move is to fix it and
move on. The loop (ch.3): write the failing case first — substituted item price must propagate to
the briefing total — watch it fail, then contract the fix. The suite just grew from reality, and
the nightly guards it from now on.

**17:40 — Close.** End the session properly: docs updated, handoff written with next steps.
Overnight the outer loop re-verifies everything merged today against every suite you own. On the
weekly cadence the proposer reads the week and files its proposals. The system keeps working after
you stop.

---

## Appendix A — The interview map

Every probe an Applied AI Engineer loop actually asks, answered in first person with a receipt,
and where the full argument lives.

| Probe                                                | My two-sentence answer                                                                                                                                                                                                                                                                 | Where    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| How do you design evals for an agent product?        | Acceptance evidence in every task contract is written as runnable checks, which land as eval cases in the same diff — suites only ever grow from real failures and real features. A mature suite runs ~100 model-free scenarios nightly with baseline-compare in seconds, needing zero credentials.            | Ch. 2, 3 |
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

## Appendix B — The scoreboard *(personal record — the one section that names names)*

> Everything above this line is deliberately portable. This appendix is not, and cannot be: it is
> the author's own pre-registered trial of the methodology in this manual, and its recorded verdict
> is that the trial *did not run*. A document arguing that a methodology should eval itself cannot
> delete the evidence of its own failed self-eval — so this stays specific, and stays here.

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
