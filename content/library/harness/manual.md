---
title: The Manual
collection: harness
source: ~/dev/agentic-harness/docs/MANUAL.md
sourceMtime: '2026-07-14T19:33:29.486Z'
sourceCommit: 71b5a14
syncedAt: '2026-07-17'
summary: >-
  How I build real products with agents. Me first, shareable second. Every claim
  in here either carries a receipt from my own systems or is marked > Backlog:
  with the trigger that will make it real. …
contentHash: 'sha256:0b82cae50869402cb1c6cd724923e51466c72a1ff83cd3570934da6045604dda'
---
# The Manual

_How I build real products with agents. Me first, shareable second. Every claim in here either
carries a receipt from my own systems or is marked `> Backlog:` with the trigger that will make
it real. If the numbers in Appendix B don't move, this document gets revised — the methodology
evals itself._

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

My honest placement, July 2026:

| Product           | Level        | Evidence                                                                                                                                                                                 |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| jim-agent         | L2 (fragile) | 13 eval scenarios, baseline-compare, nightly run green in 5s — but only one growth commit (the adversarial/injection block) since the harness landed; features since haven't added cases |
| grocery-buddy     | L1           | 28 eval cases exist in `evals/datasets/` — and no `.claude/evals.sh`, so the nightly never runs them. Shelf-ware.                                                                        |
| procurement-agent | L1           | Gate green in 2s, 57 offline tests, zero evals                                                                                                                                           |
| dj-agent          | L1           | Gate SLOW-flagged 3 of the last 4 nights, zero evals                                                                                                                                     |

Overall: **L1.5**. Contracts and worktrees are habit. Self-verification and living evals are
not — which is exactly why building with agents still _feels_ like prompt-and-wait: I
parallelized the generation half and kept the verification half manual, so every lane still
ends in me re-testing. This manual exists to close that specific gap.

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
- **Pipeline, not vibes: idea → spec → plan → execute.** For anything bigger than a task,
  the brainstorm ends in a written spec, a reasoning pass turns the spec into a plan of small
  verifiable steps, and only then does an execution lane start (Harper Reed's pipeline; Boris
  Cherny gates every session the same way — plan first, then auto-accept).
- **No time estimates. Ever.** Agents don't need them and I don't believe them.

Plan-before-code is the one habit I already have (my global CLAUDE.md has enforced contracts
for months). The chapters that follow are about what I _didn't_ have: a reason to trust the
work when it comes back.

---

## 3. Evals

An eval is not a test. Tests check code paths (`assert total == 42.17`); evals judge _behavior
across cases_ — did the agent product make the right decision given this input, this history,
this catalog? Tests catch broken code; evals catch a system that confidently does the wrong
thing. Agent products live and die on the second category.

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
  beats any elaborate framework — jim-agent's 13 scenarios and grocery-buddy's 28 cases mean I
  am _already at_ real-suite scale everywhere; the failure was wiring, not authoring.
- **Grader hierarchy, by cost.** Deterministic code-grader (free forever) > snapshot/replay
  against recorded traffic (cheap, offline) > LLM-as-judge (a paid call per case per run —
  pinned model version, calibrated against my own grading on a sample, with an "Unknown" escape
  so it never bluffs a verdict). I reach for a judge only when the behavior genuinely can't be
  code-graded, and grocery-buddy's `evals/judges.py` gets audited against this rule.
- **Where suites run.** Full suites run nightly via the gate digest — machine time, while I
  sleep. The commit gate (`gate.sh`) gets only the deterministic sub-second subset. Never pay
  for a full eval run to land a one-line diff; never let a nightly pass mean less than the
  full suite.

Receipts: jim-agent runs `jim-eval --suite offline --compare-baseline` nightly — 13 scenarios,
zero credentials, zero network, 5 seconds, results persisted to `eval_runs/` with a trends UI.
That's the pattern. grocery-buddy has judges, datasets, and a runner and **none of it is wired
into the nightly** — the single highest-leverage fix in my whole system right now.

> Backlog: write grocery-buddy's `.claude/evals.sh` (trigger: it's the trial's week-2 first
> task — the 28 cases exist, the digest convention exists, the wiring is an afternoon).
> Backlog: procurement-agent and dj-agent first suites (trigger: first user-visible bug in
> either — that bug becomes case #1).

---

## 4. Trusting "done"

This is the longest chapter because it attacks my measured bottleneck. Reviewing and verifying
agent output is where my time actually goes; every other chapter is scaffolding around this
one. The goal, stated plainly: **"done" arrives with enough machine-checked evidence that
accepting it takes minutes of judgment, not another manual pass through the product.**

### The evidence packet

No task is done on the agent's say-so. Done means a packet:

```
## Evidence packet — <task>
Contract: <the three lines, verbatim>
Changed:  <files + one-line why each>
Checks:
  [pass] <acceptance check 1> — <actual command + actual output>
  [pass] <acceptance check 2> — <actual output>
  [fail/waived] <check> — <why, and who waived it>
Evals:    <suite result: N green, M new cases added this task>
Gate:     <gate.sh output incl. anti-cheat lines>
Screens:  <paths, for anything with a UI>
NOT verified: <the honest list — what I'd have to check by hand and why>
```

The packet is nearly free — it's a reporting format for work the agent already did, not extra
compute. The `NOT verified` line is the most important one: an agent that says "everything
verified" is less trustworthy than one that says "I could not exercise the Stripe webhook
path; it needs a live key." I review evidence, not diffs — except where the tier table below
says otherwise.

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

> Backlog: anti-cheat lines land in grocery-buddy and jim-agent `gate.sh` during the trial
> (trigger: already committed — it's the smallest real implementation of this chapter).

---

## 5. Loop engineering

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
  a check says so in `NOT verified` and stops.

### The outer loop (standing)

- **Nightly, 6:17am:** every focus repo's gate + eval suite runs, digest written, macOS
  notification on any red/yellow. Hard 900-second per-gate timeout in its own process group —
  installed after 2026-07-07, when uv cache-lock contention turned jim-agent's 9-second gate
  into a 37-minute hang. The outer loop caught it; the fix is now permanent. That's the outer
  loop doing its job: drift gets caught by machinery, on a schedule, not by me noticing.
- **Weekly, Sunday:** the improvement proposer (chapter 7) mines the week's digests and logs.
- **On-trigger:** model requalification when a provider ships a new model — rerun the eval
  suites, compare, then switch. Never switch on vibes or launch-day hype.

### Model tiering (adopted doctrine)

Willison calls it Judgment-Driven Development: the top model is reserved for what needs
judgment — planning, reviewing evidence, judging evals, this manual — and well-specified
execution goes to a cheaper, faster tier. The contract is what makes this safe: a task specified
to runnable-acceptance-check precision doesn't need the smartest model, it needs an obedient
one. My routing: **plans, packet review, eval judging → top tier; contracted execution lanes,
mechanical refactors, collectors → cheap tier.**

> Backlog: per-lane routing recorded in the trial scoreboard so the tier split gets its own
> before/after eval (trigger: week 2 of the trial); until then routing is manual per lane.

---

## 6. The harness

The harness's one-sentence job: **the model proposes, deterministic code disposes.** Everything
probabilistic gets a deterministic boundary around it.

What's real and installed today (this repo):

| Layer                | Installed                                                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hooks (6, fail-open) | guard-bash (catastrophic commands), guard-commit (runs the repo's gate on every commit), guard-secrets, format-on-edit, session-context (orientation injection), notify (lane-finished notifications) |
| Gates                | `.claude/gate.sh` per focus repo (2s–15s green path), enforced at commit                                                                                                                              |
| Outer loop           | `nightly-gate-digest.sh` + launchd 6:17am + dated digests + slow-gate flagging                                                                                                                        |
| Skills (21)          | planning (spike, brainstorm×2, challenge×2, deep-plan), lifecycle (onboard, handoff, end-session, update-docs, changelog), building (new-agent, setup-verify, retro, hack), cost (token-breakdown ×6) |
| Agents (2)           | critic (adversarial, read-only, top tier), researcher (cited web synthesis)                                                                                                                           |

Two standing rules:

1. **Harness changes are product changes.** A new hook or skill goes through the same
   contract → evidence packet loop as feature code. The harness repo has its own gate; it eats
   its own dog food.
2. **Nothing in the harness is described as protection.** Hooks fail open; a worktree is not a
   sandbox. These are conveniences that make the right thing cheap, not walls. The day I need
   walls (an agent spending real money autonomously), that's an infrastructure project with
   its own contract — Willison's move: make autonomy a _sandbox_ question (disposable, sealed,
   budgeted environments), not a trust question.

**The harness backlog** (methodology currently leading reality — each with its trigger):

| Gap                         | Trigger                                    | Cheapest build                                           |
| --------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| grocery-buddy evals unwired | Trial week 2, task 1                       | `.claude/evals.sh` calling the existing runner           |
| Anti-cheat gate lines       | Trial week 2                               | grep-level checks in 2 repos' gate.sh                    |
| Weekly improvement proposer | Built alongside this manual                | propose-improvements skill + Sunday launchd              |
| Model routing record        | Trial week 2                               | a column in the scoreboard, then a config if it earns it |
| Mobile verification path    | First mobile UI regression that evals miss | Maestro or manual-with-checklist, decided then           |

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

> Backlog: per-task token cost recorded in the trial scoreboard via
> token-breakdown-past-session (trigger: trial week 1 — it's scoreboard metric #5).

---

## 9. A day in practice

The proof that chapters 1–8 compose. The digest, tools, numbers, and file paths below are all
real; the substitutions task is the worked example — it's queued as a week-2 trial task, and
this section gets its actual artifacts pasted in when it runs.

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

_Results: — (trial not yet run; week 1 starts Monday 2026-07-14)_
