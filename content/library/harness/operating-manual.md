---
title: Operating Manual — evidence-driven agentic development (v3)
collection: harness
source: ~/dev/agentic-harness/docs/OPERATING_MANUAL.md
sourceMtime: '2026-07-10T10:02:58.531Z'
sourceCommit: c48ce56
syncedAt: '2026-07-12'
summary: >-
  Single source for both the system design and the daily runbook. Consolidates
  the former TOPPERCENTWORKFLOW.md (strategy, v2) and OPERATINGMANUAL.md
  (runbook, v2); the old strategy filename remains …
contentHash: 'sha256:ec627fe9825bc5038187fe84ce76e21d16e2a560d5c93bc10f56455f16e20aca'
---
# Operating Manual — evidence-driven agentic development (v3)

*Single source for both the system design and the daily runbook. Consolidates the former
`TOP_PERCENT_WORKFLOW.md` (strategy, v2) and `OPERATING_MANUAL.md` (runbook, v2); the old strategy
filename remains as a pointer stub for stable links. Companion: `CLAUDE_CODE_BIBLE.md` (the
Claude-specific reference). "Top percent" is a hypothesis to test with outcomes, not a status this
document can award. Last reviewed 2026-07-10.*

---

## 1. Status vocabulary

This document deliberately separates installed behavior from desired behavior:

- **LIVE** — implemented and observed in the current harness.
- **HABIT** — supported by the harness, but its value depends on doing it consistently.
- **NEXT** — the agreed next operating contract; documented here, not yet enforced.
- **LATER** — useful only after measured scale or risk justifies the machinery.
- **EXCEPTION** — live behavior that conflicts with the target policy and needs explicit handling.

Do not describe a `NEXT` control as protection. A written policy is not an enforcement boundary.

Inline status tags appear below only where mistaking policy for protection is dangerous (the
envelope, containment, publication, the model registry). Section 18 is the single authoritative
status list; when it and an inline tag disagree, trust §18, the code, and the latest digest.

## 2. The outcome

The objective is not maximum agent activity, token usage, commits, or parallel sessions. It is:

> Ship more accepted product outcomes per unit of human attention, without increasing escaped
> defects, security exposure, rework, or uncontrolled cost.

The harness exists to make that outcome more likely by doing four things:

1. **Make intent executable.** A task has observable acceptance checks before implementation.
2. **Make work agent-verifiable.** Agents can run the relevant tests, evals, previews, and traces.
3. **Bound authority and failure.** Deterministic policy owns irreversible actions; tools and
   credentials are scoped to the task.
4. **Turn real friction into infrastructure.** Repeated interventions become tests, instructions,
   hooks, skills, or a deliberate decision to accept the cost.

This is two systems, not one:

- The **development harness** governs how agents plan, edit, verify, review, and integrate code.
- The **runtime agent architecture** governs how built agents gather, decide, remember, and act in
  the world.

Both use the same thesis — probabilistic models propose, deterministic systems constrain — but
their gates and failure modes are different.

## 3. Operating principles

### 3.1 Outcome before implementation

Start from a user-visible or operator-visible result. "Refactor the workflow engine" is an
activity; "duplicate supplier orders cannot be created during retry" is an outcome. An agent can
optimize the first while making the second worse. Every meaningful task names the result that
should become true, what is deliberately out of scope, the observations that prove the result, and
the risks that must not increase.

### 3.2 Verification before delegation

Before implementation, ask: *can the executor determine whether this task is correct without
waiting for my eyeballs?* If not, first add the cheapest useful verifier: a unit test, contract
test, fixture, seeded account, browser path, recorded replay, eval case, trace query, or dry-run
mode. Verification should match the risk; a prototype needs a kill criterion, not a production
compliance program. If verification would cost more than the reversible experiment, define a kill
criterion and learn cheaply.

### 3.3 Runtime authority stays deterministic

Money, publication, consent, deletion, deployment, external messages, and other consequential side
effects must have a deterministic owner. A model may recommend the action; it must not be the
final allow/deny authority. This rule does not imply that all development checks should be
non-blocking — build and integration gates may block a commit or merge because their purpose is
code health. Section 6 names the three verification surfaces explicitly.

### 3.4 Artifacts are the unit of coordination

Chat is transport, not durable state. Plans, task contracts, patches, review findings, eval
reports, receipts, and handoffs live as inspectable artifacts. A fresh session should be able to
resume from the repository and artifact paths without reconstructing a vanished conversation.

### 3.5 Parallel when separable

Parallelism is valuable only when lanes have stable contracts, independent ownership, and
independent verification. Two agents editing coupled modules against a moving interface create
review debt faster than throughput. The normal starting topology is one conductor, one executor,
and optionally one read-only researcher or fresh-context evaluator. Normal implementation WIP is
at most two changes; increase it only after accepted outcomes show that review and integration are
not the bottleneck. The scarce resource is review attention.

### 3.6 Checkpoints follow evidence, not a universal clock

Thirty to 120 minutes is a useful default checkpoint range, not a hard maximum. Continue a longer
contained run when verifiers show progress, the task remains within budget, context is healthy,
and the work is resumable. Stop early when the lane repeats a failure, changes the contract
without permission, consumes budget without new evidence, or approaches a side effect outside its
authority.

### 3.7 Human attention is the scarce resource

Track three budgets together: **attention** (briefing, interruption, review, decision time),
**execution** (wall-clock, retries, queueing, concurrency), and **compute** (tokens, model spend,
tool spend, cache behavior, infrastructure). A cheap swarm that produces four hours of review debt
is not cheap.

### 3.8 Models are versioned dependencies

A model and prompt pair is a dependency, not a personality on the org chart. Exact model,
provider, effort, prompt/policy versions, and fallback behavior must be observable and
eval-qualified before promotion. Marketing tiers suggest candidates; local task outcomes choose
routes.

## 4. The day

### 4.1 The entire day in one page

1. **Open briefed.** Read Git state, the overnight digest, and the last handoff.
2. **Classify, do not react to color alone.** Spend at most 10–15 minutes assigning S0–S3
   severity, an owner, and a response target to any red/yellow item.
3. **Choose one primary outcome.** A handoff suggests continuity; it does not outrank today's
   product priority automatically.
4. **Write the smallest useful Task Envelope.** Name outcome, non-goals, acceptance evidence,
   risk, authority, base, integration, rollback, budgets, and artifacts.
5. **Ask whether the agent can verify it.** Add the cheapest missing verifier before delegating.
6. **Choose the topology.** Default to one conductor + one executor; add research/evaluation only
   when work is separable and review capacity exists.
7. **Conduct from artifacts.** Review checkpoints, diffs, tests, evals, cost, and risk — not
   token streams.
8. **Integrate against the real target.** Refresh main, combine changes, rerun checks, apply the
   required independent review, and dry-run/canary when risk requires it.
9. **Close on an accepted outcome.** Record what shipped, evidence, remaining risk, rollback, and
   the next product outcome in durable artifacts and the handoff.

### 4.2 While you slept — **LIVE**

At 06:17 the LaunchAgent runs `scripts/nightly-gate-digest.sh` over the configured focus repos:

- Each executable `.claude/gate.sh` runs with a hard timeout.
- Each optional executable `.claude/evals.sh` runs after the build gate.
- Passing gates over the current 120-second slow budget are marked yellow.
- Failing build gates are red; eval regressions are yellow.
- A dated digest lands in `~/dev/docs/gate-digests/`.
- Red/yellow findings trigger a fail-open macOS notification where available.

Runtime varies with the repository and environment; read the actual digest rather than copying
historical claims. If the laptop is asleep at the scheduled time, launchd runs the job on wake; if
the machine is off, that run is skipped. The digest produces **raw signals**, not S0–S3
classifications — morning triage remains manual until the policy proves stable enough to automate.

The SessionStart hook injects Git branch/dirty count/last commit, the recent gate-digest summary,
and the latest handoff's next steps. On first read ask:

- Is this the repository and branch I intended to work in?
- Are there existing uncommitted changes, and who owns them?
- Did the overnight finding affect this repo, the critical path, or an irreversible action?
- Is yesterday's next step still the highest-value outcome?

Do not begin a new lane on top of unexplained dirty changes.

### 4.3 Classify health findings

Colors are observations; severity is a decision. Use the evidence, not the emoji:

| Severity | Meaning / example | Response |
|---|---|---|
| **S0** | Security exposure, data loss, unauthorized publish/spend/send/delete, compromised release | Stop; contain; fail closed; name the incident owner |
| **S1** | Reproducible main-branch or critical-path build failure | Same-day owner; block dependent work only, not unrelated isolated work |
| **S2** | Credible, reproducible user-facing behavior regression or qualified model route failure | Quarantine the affected route; investigate within 1–3 days; continue unrelated work |
| **S3** | Slow-but-correct gate, flaky test, provider incident, cache/resource contention | Record/reproduce; weekly maintenance SLO; continue product work |

For every S0–S3 item record: evidence and reproduction result; affected repo/route/users; last
known good version; owner and response target; whether unrelated work may continue.

A gate that passes in 917 seconds is an S3 performance signal, not automatically a broken product
foundation. A deterministic critical-path test failure is S1 even if its terminal coloring is
imperfect.

**Slow-gate escalation rule.** S3 is not a parking lot. A slow gate that survives two consecutive
weekly retros, or runs at roughly five times its budget or worse, gets scheduled work (usually
splitting fast commit checks from integration/nightly checks) rather than another log line. Slow
commit gates are how `--no-verify` becomes a habit, and that erodes the control the whole harness
leans on.

### 4.4 Choose the day's primary outcome

Write it as a result, not an activity:

- Weak: "Continue refactoring the procurement workflow."
- Strong: "A retried supplier-order draft cannot create a duplicate and leaves an auditable
  receipt."

If there is an S0, containment is the outcome. If there is an S1 in the active critical path,
repair is usually the outcome. Otherwise choose product value over harness tidiness.

## 5. The Task Envelope — the unit of work

**Status: NEXT as a standard artifact.** Existing lane briefs contain much of this information,
but there is not yet one versioned, provider-neutral envelope or state machine.

The Task Envelope is the smallest contract that lets a person, model, or provider execute the same
work without hidden context. It may be a Markdown section, issue template, or `task.yaml`; the
schema matters more than the storage format.

### 5.1 Required fields

| Field | Question it answers |
|---|---|
| `id` and `version` | Which exact contract is being executed? |
| `outcome` | What observable result should become true? |
| `non_goals` | What must not be expanded into this task? |
| `acceptance` | Which commands, scenarios, traces, or observations prove success? |
| `risk_tier` | How much review, isolation, and rollout control is required? |
| `data_class` | May the task see public, internal, personal, secret, or regulated data? |
| `base` | Which repo, branch/base SHA, environment, and dependencies are assumed? |
| `contracts` | Which schemas, interfaces, invariants, and files must remain stable? |
| `capabilities` | Which model/tool abilities are required? |
| `tools_and_egress` | What may the executor read, write, call, publish, or message? |
| `integration` | Who owns merge order, target-head validation, and conflicts? |
| `rollback` | How is the change disabled, reverted, compensated, or retracted? |
| `budgets` | Token, spend, wall-clock, retry, and concurrency ceilings for the whole tree. |
| `artifacts` | Where plan, diff, review, eval, trace, and handoff outputs must live. |
| `done` | Which state transition closes the task: reviewed, integrated, observed, or shipped? |

Until a template is implemented, put this compact block in the plan or issue:

```markdown
## Task Envelope v1
- Outcome:
- Non-goals:
- Acceptance evidence:
- Risk tier / data class:
- Repo / branch / base SHA:
- Contracts and files to respect:
- Capabilities / allowed tools, credentials, and egress:
- Integration owner and order:
- Rollback or compensation:
- Token / spend / wall / retry / concurrency budgets:
- Required artifact paths:
- Done means:
```

For T0/T1, one line per field is enough and irrelevant fields may say `N/A`. For T2/T3, ambiguity
is a design hole to resolve or assign before execution.

### 5.2 Risk tiers

Use task risk to scale ceremony:

| Tier | Typical work | Minimum control |
|---|---|---|
| **T0 — local/reversible** | Formatting, docs, obvious mechanical change | Direct execution, deterministic check if available |
| **T1 — shared/reversible** | Ordinary feature or refactor | Lightweight envelope, build gate, self-review |
| **T2 — consequential** | Cross-module behavior, data migration, auth, model/prompt route | Full envelope, independent review, latest-main integration, rollback/dry run |
| **T3 — irreversible/high-trust** | Spend, send, publish, delete, consent, production credentials | Enforced sandbox/capabilities, deterministic runtime gate, human or policy approval, canary/soak, incident owner |

Risk is based on blast radius, not code size. A three-line permission change may be T3; a large
local refactor may be T1.

### 5.3 Match ceremony to risk

| Situation | Start |
|---|---|
| T0 trivial/local/reversible | Ask directly; run the obvious check |
| Unknown feasibility / prototype | `/spike <brief>` with one approach, one alternative, verifier, and kill criteria |
| T1 feature in an existing repo | `/plan` with a lightweight Task Envelope |
| T2 architecture/cross-module/high ambiguity | `/deep-plan` and/or `/challenge`; require independent review and rollback |
| New agent | `/new-agent <name> <outcome>`; answer the twelve design questions (§13) |
| Hackathon | `/hack <idea> <duration>`; use the compressed risk/anatomy review |
| T3 irreversible/high-trust | Full envelope, enforced containment/capabilities, deterministic runtime gate, canary/soak, incident owner |

The twelve-question anatomy belongs to agent/product design, not every spelling fix.

### 5.4 Verify-first readiness check

The task is ready when:

- Acceptance is observable.
- The executor has a command, fixture, preview, eval, or trace query it can run.
- Required test data and login state exist without borrowing production authority.
- Failure and stop conditions are explicit.
- The base SHA and integration owner are known.
- The executor can write its result to an artifact path.

### 5.5 Task states

Use a small, explicit state machine even before adopting an issue tracker:

`proposed → ready → running → review → integrated → observed → done`

- `ready` means the envelope and verifier exist.
- `review` means an executor stopped; it does not mean the task succeeded.
- `integrated` means the result passed against the actual target head.
- `observed` means the canary, dry run, or post-merge check ran where required.
- `done` means the outcome, not merely the implementation, was accepted.

`blocked` is an annotated side state with an owner and next event. A stalled chat is not task
state.

## 6. Verification architecture

### 6.1 Three things currently called "the gate"

Use precise names:

| Surface | Purpose | Example | Blocking behavior |
|---|---|---|---|
| **Build gate** | Prove local code-health properties | `.claude/gate.sh`: syntax, lint, types, fast tests | Blocks commit when installed |
| **Behavior eval** | Measure probabilistic or end-to-end quality | replay dataset, rubric grader, browser scenario | Usually reports/regresses; may quarantine a route |
| **Runtime action gate** | Own authorization for a consequential side effect | spend cap, consent check, publication mandate | Fails closed before the action |

A build gate should never be mistaken for authorization, and a runtime action gate does not prove
the implementation is generally correct.

### 6.2 Eval layers

- **L0 — verifier tests.** Deterministic tests of gates and invariants, including planted
  failures that prove the verifier catches what it claims.
- **L1 — offline replay.** Recorded model/tool outputs re-run without live credentials. Catches
  logic regressions around the model cheaply and reproducibly.
- **L2 — controlled live-model evaluation.** Versioned cases, repeated trials, scorers,
  baselines, cost, and latency. Deterministic graders first; human-calibrated model graders where
  needed.
- **L3 — production sampling.** Real shipped outputs, traces, user feedback, incidents, A/B
  tests, and periodic human review. Detects distribution shift and gaps in the offline corpus.

The model and prompt under test, judge model, dataset version, environment fingerprint,
seed/trial, and scorer version belong in the result.

### 6.3 Eval reliability operations — **NEXT**

A growing case count is insufficient. Each eval suite should eventually have:

- A clean, isolated starting environment.
- Balanced success/failure cases and planted verifier failures.
- Multiple trials for nondeterministic scenarios.
- A minimum-delta or confidence rule before calling a regression.
- Separate product failure, provider failure, and infrastructure error classifications.
- A held-out or rotating subset that the implementing agent cannot tune against.
- Human-graded anchors for subjective judges and a pinned judge version.
- Flake quarantine with owner, reason, expiry, and a ban on silently deleting hard cases.
- Transcript sampling to determine whether the task, environment, agent, or grader was wrong.
- Saturation review: a suite at 100% may preserve regressions but no longer guide improvement.

Current Anthropic guidance similarly combines automated evals, production monitoring, transcript
review, and periodic human calibration rather than trusting one score:
[Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).

### 6.4 Fast, integration, and nightly loops

| Loop | Target role | Contents |
|---|---|---|
| **Edit/local** | Seconds | Focused test, type/lint check, fixture or preview relevant to the change |
| **Commit build gate** | Fast enough to preserve flow | Deterministic high-signal repository health |
| **Integration/PR** | Minutes are acceptable | Latest-target combined gate, cross-module tests, security/dependency review |
| **Nightly** | Broad drift detection | Exhaustive deterministic suites, offline evals, selected live-model canaries |
| **Production** | Continuous/sampled | Runtime policy, traces, outcome monitoring, rollback signals |

The nightly digest is **LIVE** and emits raw red/yellow signals. Content-addressed skipping of
unchanged repos, repeated-trial eval handling, and live-model canaries are **NEXT**, not live.

### 6.5 What green means

Green means the checks that ran passed in the environment in which they ran. It does not prove:

- The acceptance criteria were complete.
- The tests are independent of the implementation error.
- Two branches integrate cleanly.
- The latest target head behaves the same as the lane base.
- Production data or provider behavior matches fixtures.
- The change is secure, useful, maintainable, or reversible.

Treat green as scoped evidence, then apply review and rollout controls proportional to task risk.

## 7. Execution

### 7.1 Choose a topology, not a lane count

**Single session.** Use the main session directly when the work is trivial, tightly coupled, or
faster to execute than to brief. The conductor role is a tool, not an identity to preserve at all
costs.

**Background subagent.** Use for noisy, read-only, or specialized work: codebase reconnaissance,
current-source research, adversarial review, eval/transcript analysis, migration inventory. The
result must be synthesized into an artifact or directly actionable finding; raw research belongs
in the worker context.

**One executor worktree — the normal delegated shape (HABIT).** Use one conductor + one executor
when implementation is expected to take more than roughly 30 minutes and the task has a stable
contract. A worktree isolates checkout files and the branch; it does **not** isolate the host,
home directory, credentials, network, caches, processes, ports, or external accounts (§11.2). For
T2/T3, name the actual containment mechanism — "it is in a worktree" is not an answer.

**Multiple implementation lanes.** Add another lane only when all five separability answers are
yes:

1. File/module ownership does not overlap.
2. Shared schemas/interfaces are written and stable.
3. Each lane has an independent verifier.
4. Integration order and owner are explicit.
5. The conductor has no growing review queue.

If any answer is no, keep the work serial or stabilize the contract first. If two lanes need the
same file, one owns it and the other requests a contract change at a checkpoint.

Model route selection for the lane is §10.3.

### 7.2 The lane brief

A lane receives:

- The Task Envelope and current base SHA.
- Its narrow role and exact ownership boundary.
- Files, contracts, and invariants to respect.
- Exact verification commands.
- Stop/escalation conditions.
- Artifact paths and required output schema.
- The remaining parent budget; children draw down the parent budget and never mint fresh ones.

The lane reports only when it needs a decision, reaches a checkpoint, or finishes.

### 7.3 How to supervise

Do:

- Continue useful conductor work while a lane runs.
- Respond when a lane requests a decision.
- Review checkpoint artifacts and evidence.
- Check whether the contract or risk changed.
- Stop duplicated, circular, or budget-exhausting work.

Do not:

- Watch a token stream as proof of progress.
- Give continuous micro-corrections that destroy executor ownership.
- Accept "tests pass" without the command/result and scope.
- Let an executor silently expand tools, egress, risk, or deliverables.

### 7.4 Checkpoints

At a checkpoint require:

- Commit/patch and artifact paths.
- Acceptance checks run and their result.
- New assumptions or contract changes.
- Cost, elapsed time, retries, and context condition where available.
- Remaining risk and next bounded step.

Continue a longer run when evidence is accumulating and the task remains contained. Stop or
re-plan when the same failure repeats twice without a new hypothesis, the verifier cannot be
trusted, the contract changed, or the lane approaches unauthorized side effects.

### 7.5 Commits and build gates

Commit coherent changes. The installed guard-commit hook runs the repo's `.claude/gate.sh` and
blocks normal commits on failure. `git commit --no-verify` remains a deliberate escape hatch; use
it only with the reason in the commit/handoff. Passing the build gate means its covered checks
passed in that environment — it does not authorize a runtime side effect or prove integration,
security, usefulness, or rollback.

### 7.6 Babysitting intake

When you manually re-explain context, verify something scriptable, fix the same tooling problem,
wait on an avoidable queue, or recover from a preventable agent mistake, add one line to
`~/dev/docs/BABYSIT_LOG.md`. Capture the observed cost, not a speculative solution. Production
incidents, review findings, flaky evals, and user-visible failures belong in the same evidence
pool.

Do not automate automatically on the third occurrence. Automate when the procedure repeated at
least three times in a stable form, the desired behavior is understood and has a verifier, the
expected attention savings or safety value exceeds maintenance cost, and encoding it will not
freeze a temporary workaround. Risk controls may be encoded after the first incident; repetitive
convenience should earn its place.

## 8. Integration, review, and release

### 8.1 Lane completion is not task completion

A lane finishes when its scoped artifact exists and its focused checks pass. The task moves to
`review`, not `done`. Worktrees prevent file collisions; they do not solve integration.

### 8.2 Integration sequence — **NEXT as a consistent fleet contract**

The conductor/integration owner:

1. Reads the diff and completion artifact.
2. Confirms the lane stayed inside the envelope.
3. Refreshes the real target branch and records the actual integration base.
4. Rebases/merges in the declared order; resolves conflicts with the contract owner.
5. Runs the combined build/integration gate against the integrated tree.
6. Requests the review required by the risk tier.
7. Runs dry-run, canary, migration rehearsal, or post-merge observation where required.
8. Records integrated commit, evidence, review, rollback, and remaining risk.

Only then can the task move through `integrated → observed → done`. A merge queue becomes
worthwhile only after concurrent ready branches regularly contend; latest-head revalidation is
required before that scale.

### 8.3 Review policy

| Tier | Minimum review |
|---|---|
| T0 | Deterministic check where useful; no separate model required |
| T1 | Executor self-review plus build/integration evidence; conductor diff review when the work was delegated |
| T2 | Fresh-context independent review; prefer a qualified opposite-provider route where one exists |
| T3 | T2 controls plus deterministic runtime authorization and a human/policy owner for the irreversible action |

Fresh context is the requirement; provider diversity is a preference that depends on a qualified
route existing (§10). Give the reviewer the envelope, diff, and evidence — not the executor's
reasoning history. This reduces anchoring and prevents the reviewer from merely agreeing with the
generation story. Ask for missing acceptance, unsafe authority/egress, incorrect assumptions,
inadequate tests, integration risk, and unnecessary complexity.

Same-family agreement is not strong independence; provider diversity reduces some correlated
failures but never replaces deterministic checks or human calibration. Cross-provider agreement
still does not authorize an irreversible action.

### 8.4 Dry run, canary, and rollback

Model, prompt, policy, dependency, schema, and workflow changes are releases. For T2/T3 changes:

- Compare repeated offline evals with the current baseline.
- Shadow the candidate without authority where possible.
- Canary on bounded users, data, spend, or actions.
- Define soak time and observable rollback thresholds.
- Promote an explicit version/alias; never silently replace it.
- Preserve the last known good route and rollback mechanism.

Retries after side effects require idempotency keys and leases. Do not retry a possibly completed
side effect without durable state proving what happened. When the side effect cannot be reversed,
the absence of compensation is part of the risk decision, not an omitted field.

## 9. Close the session, then compound

### 9.1 End the session — five minutes

Run `/end-session`. It invokes documentation review and then writes a handoff recording:

- The product outcome accepted or the exact state reached.
- Integrated commit/branch and Task Envelope version.
- Build/eval/review/canary evidence and artifact paths.
- Model/prompt/policy provenance where available.
- Remaining risk, rollback, blocked owner/event, and open health item.
- The next **product outcome**, not merely "continue coding."

If the session did not reach an accepted outcome, say why. A truthful resumable state is better
than calling partial implementation done.

### 9.2 Instruction hygiene

When a fresh session needs a new invariant or gotcha, update `AGENTS.md` with a small, scoped
delta — but do not make "additive forever" a law. Every durable instruction needs a scope and
owner; dated temporary guidance needs an expiry. Periodically remove contradictions, obsolete
commands, duplicated prose, and rules better enforced by code. `AGENTS.md` should be a lean map to
commands, architecture, invariants, and deeper artifacts — not a session diary or encyclopedia.

### 9.3 Weekly retro — **HABIT**, 45 to 60 minutes

Review:

- Accepted product outcomes and lead time.
- Human briefing, interruption, and review time.
- Escaped defects, incidents, rollback, and rework.
- Queueing, blocked lanes, and integration contention.
- Cost per accepted change and p50/p95 latency where available.
- Slow/flaky gates and evals (including the §4.3 slow-gate escalation rule).
- Representative real traces/outputs.
- Open babysit items and stale/contradictory instructions.

Select the highest-value recurring friction. Choose the cheapest durable response — accept,
instruction, test/gate, tool/hook, skill, or architecture change — and make at most one material
harness improvement unless an S0/S1 demands more. Verify the fix and record the metric it is
expected to change. The goal is conversion, not a growing backlog of clever harness ideas.

An empty log and healthy outcomes may produce a five-minute retro. The ritual serves the evidence,
not the calendar. (The current `/retro` skill still encodes the earlier 30-minute form and should
be aligned in a later implementation change.)

### 9.4 Model requalification — on trigger, not on calendar

Requalify routes when a trigger fires, not monthly by default: a new model release relevant to a
qualified route, a route's eval or cost/latency evidence degrading, a repeated escalation pattern,
or a new task class with no qualified route. On a trigger, run the champion/challenger procedure
(§10.6) on real internal task classes and review provider availability and requested-vs-served
provenance. Do not requalify every model on a schedule if neither the route nor the evidence
changed.

## 10. Multi-model control plane

**Status: NEXT.** The installed environment exposes Claude Fable/Opus/Sonnet and GPT-5.6
Sol/Terra/Luna model IDs, but the harness does not yet have a provider-neutral registry, requested
vs served provenance, qualified fallbacks, or automatic cross-provider review. Route selection is
manual today.

### 10.1 Current candidate families

Provider descriptions are starting hypotheses, not routes:

- Anthropic describes **Claude Fable 5** as its most capable long-running class, **Opus 4.8** as a
  high-capability collaboration/reasoning class, and **Sonnet 5** as a more economical agentic
  execution class. See [Fable](https://www.anthropic.com/claude/fable),
  [Opus 4.8](https://www.anthropic.com/news/claude-opus-4-8), and
  [Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5).
- OpenAI describes **GPT-5.6 Sol** as flagship, **Terra** as balanced, and **Luna** as fast and
  cost-efficient. See
  [GPT-5.6 Sol, Terra, and Luna](https://openai.com/index/previewing-gpt-5-6-sol/).

Do not promote a provider description into a permanent route without local task evidence.

### 10.2 Capability registry

For every qualified model route, record:

- Exact requested model ID, provider, and family.
- Actual served model ID and any provider-side routing disclosure.
- Supported tools, modalities, context behavior, and effort controls.
- Data retention/residency and task data classes allowed.
- Current price, p50/p95 latency, error/rate-limit behavior, and availability.
- Eval results by task class, with dataset and prompt/policy version.
- Last-qualified date, known failure modes, and eligible fallbacks.

The registry should expose stable aliases such as `implementation.default` or `review.high_risk`,
but an alias resolves to a logged exact version.

### 10.3 Initial static routing policy

| Role | Initial candidates | Escalation/independence rule |
|---|---|---|
| Mechanical transformation | Deterministic script first; otherwise Luna | Escalate only after verifier failure |
| Research fan-out | Sonnet or Terra | Use 2–3 lanes only for separable, valuable research; frontier synthesis on conflict |
| Ordinary implementation | Sonnet or Terra, chosen by repo eval | Escalate to Opus/Sol after a failed bounded attempt |
| Architecture/planning | Opus or Sol | Fable for unusually broad, ambiguous, or persistent work |
| Long contained migration | Locally best qualified frontier model | Evidence checkpoints, hard tree budget, resumable artifacts |
| Review | Fresh-context opposite-provider model for T2/T3 | Anthropic implementation → qualified OpenAI reviewer, and vice versa |
| Judge/arbitrator | Strongest unused qualified provider or human | Invoke on disagreement/high risk; never authorize irreversible action alone |

Most tasks use one primary model and deterministic verification. Do not run a six-model panel by
default. Fable reviewing Sonnet is model diversity, not provider independence; Sol reviewing Terra
has the same limitation. Record the exact requested and actually served model where the surface
exposes it.

### 10.4 Escalation triggers

Escalate model capability only when at least one trigger is present:

- Repeated verifier failure with distinct hypotheses exhausted.
- Cross-system ambiguity or high context load.
- T2/T3 risk.
- Reviewer disagreement.
- A frontier route's expected value exceeds its added cost/latency.

Model escalation does not expand tool authority or budget. A stronger model gets the same envelope
unless a human/policy owner explicitly changes it.

### 10.5 Fallback policy

Never silently fall back. On provider failure:

1. Retry only within the envelope's bounded policy and only when side effects are idempotent.
2. Use an alternate provider/model only if that exact route passed the task-class evals and data
   policy.
3. Record requested and served routes plus the reason.
4. Pause or escalate when no qualified fallback exists; never silently downgrade.

### 10.6 Champion/challenger promotion

Start a task class on the strongest practical model to establish a quality ceiling. Replay or
shadow cheaper candidates on the same corpus. Promote a challenger only when it meets the
acceptance floor over repeated trials and improves a target constraint such as cost or latency.
Canary the route, retain the old champion, and make rollback explicit.

OpenAI's Basis case study describes a similar benchmark-driven routing approach by complexity,
latency, and input type: [Basis model routing](https://openai.com/index/basis/).

## 11. Security: convenience, containment, and authority

### 11.1 Fail-open versus fail-closed

Current format, bash, and secret hooks are useful local guardrails and intentionally fail open.
They reduce accidents; they are not security boundaries.

| Control | Appropriate failure behavior |
|---|---|
| Formatting, session banner, notification | Fail open; log missing convenience |
| Commit build gate | Fail closed for normal commits, with an explicit audited override |
| Production credential issuance | Fail closed |
| Runtime spend/send/publish/delete authorization | Fail closed |
| Network egress containing private data | Default deny or mediated allowlist for T3 |

Do not tell a collaborator "secrets cannot leak" because a fail-open regex hook exists.

### 11.2 Worktree is not sandbox

A worktree isolates checkout files and branches. It may still share the host, home directory, Git
metadata, caches, processes, ports, network, credentials, and external services. T2/T3 execution
needs an explicit containment mechanism: container/VM/OS sandbox, filesystem scope, credential
broker, network policy, or equivalent.

Copying a broad `.env` into every worktree expands authority. Prefer short-lived, task-specific
credentials outside the worker filesystem, exposed through constrained tools or a proxy.

### 11.3 Public library publishing — **LIVE + EXCEPTION**

The personal site mirrors selected source directories and fleet ADRs on a daily schedule. Current
behavior is default-public with deny rules, private markers, scanning, and no settle window. A
saved half-draft may publish at the next sync. This belongs here because it is a daily
irreversible action affecting how development documents are handled.

Current ways to keep a document private:

1. Put `<!-- me2: private -->` in the first ten lines or use `site: private` frontmatter.
2. Add the path to the site's private list through its library command/operator UI.
3. Use the manifest `deny[]` list for hard walls.

Do not treat scanning as proof that private or unfinished content cannot publish.

**Target policy (NEXT):** move new library sources to default-private or explicit public
allowlisting, with a preview, provenance, and fast takedown. Until then:

- Mark drafts private before their first save in a mirrored source tree.
- Keep career, resume, babysit, secret, and personal-data paths behind hard deny walls.
- Sample the actual public shelf at weekly retro.
- Treat any visibility automation change as T3 publication work.

### 11.4 Supply chain and provenance

For shared or production releases, progressively add locked dependencies,
dependency/secret/code scanning, build provenance, an SBOM where warranted, and trace-to-commit
linkage. Do not build a full attestation platform for local prototypes; do not ship consequential
artifacts with no provenance.

## 12. Observability and metrics

### 12.1 Minimum trace — **NEXT as a fleet-wide schema**

Correlate:

- Task/envelope version and parent/child lane IDs.
- Repo, base SHA, integrated commit, environment image/fingerprint.
- Requested and served model/provider/family, effort, prompt, policy, and tool versions.
- Tool calls, result hashes, retries, approvals, and capability grants.
- Input/output token classes, cache usage, spend, latency, and queue time.
- Build/eval/review results and artifact pointers.
- Release/canary/rollback state and accepted outcome.

Raw prompts, tool arguments, and results may contain source, secrets, personal data, or hostile
content. Keep sensitive payloads separate from low-risk metadata, redact by default, and define
retention before collecting everything. OpenTelemetry's GenAI semantic conventions provide a
portable starting vocabulary:
[OpenTelemetry GenAI conventions](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/).

### 12.2 Metrics hierarchy

Measure and read in this order:

1. **Product outcome** — task-specific user value: correct order drafted, incident resolved,
   useful recommendation accepted, demo completed, revenue/time saved.
2. **Delivery** — lead time to accepted outcome, throughput, queue time, integration/review time.
3. **Quality and trust** — escaped defects, regressions, rollback/rework, incidents, unauthorized
   action attempts, eval precision/flake.
4. **Economics** — human intervention minutes, cost per accepted change, p50/p95 latency, tokens
   and provider failure.
5. **Harness health** — gate runtime, instruction errors, repeated babysitting, stale artifacts.

Case counts, skill counts, PRs, lines of code, green streaks, and agent counts are diagnostics,
not success metrics.

### 12.3 The monthly test

Compare agent-assisted work against your own baseline:

> Did more useful changes reach a verified outcome with less human attention, lower rework, and
> controlled risk?

If not, simplify the harness, reduce WIP, improve verifiers, or change model routes. Do not answer
a workflow problem by adding agents automatically.

## 13. Agent design review — twelve questions

Use the complete review for T2/T3 agents and new agent projects. Use only relevant fields for a
T0/T1 change. A blank is an assigned design hole, not a surprise reserved for integration.

### A. Correctness

1. **Outcome.** What single demoable or sellable result does this agent own? How is user value
   measured? Two unrelated outcomes usually indicate two products or bounded workflows.
2. **Runtime authorization.** Which irreversible actions exist, and which deterministic code path
   owns each? How is that gate itself tested with planted failures?
3. **Eval and dependency versions.** Which L0–L3 layers apply? Which model, prompt, policy, tool,
   dataset, environment, and judge versions produced the result? What qualifies an upgrade?
4. **Loop and state.** What are gather → decide → act steps, gates, exit conditions, maximum
   turns, retries, and escalation states?

### B. Trust and safety

5. **Inputs and egress.** Which inputs may be hostile? Which outbound channels can transmit data
   or trigger action? Test both gate bypass and exfiltration through every permitted egress path.
6. **Memory and retention.** What working, episodic, semantic, or procedural memory persists? Who
   may write it, when is it stale, how is it verified on read, and when is it deleted? Treat
   memory as an input with the trust level of its least-trusted writer; test poisoned memory.
7. **Tools, credentials, and child authority.** Which tools are available, what can their
   credentials touch, and which sandbox/allowlist/proxy enforces the boundary? Tool descriptions
   and peer-agent output are untrusted inputs. Children inherit the parent's authority and budget
   or less, never more.
8. **Human involvement and graduation.** Who approves what today? Which evidence and deterministic
   policy move an action from approval-required to notify-after to autonomous-within-budget, and
   what incident demotes it?

### C. Economics

9. **Budget and latency.** What token, spend, tool, wall-clock, retry, and concurrency ceilings
   bind the whole execution tree? What happens at each ceiling? A runtime authorization path
   fails closed when its required verifier times out.

### D. Operability

10. **Observability.** Which append-only trace reconstructs requested/served model, prompt/policy,
    tools, approvals, artifacts, decisions, cost, and outcome? What is redacted and retained?
11. **Durability.** What in-flight state persists after a kill? How does a fresh process
    distinguish "not started," "in progress," "side effect possibly happened," and "complete"?
12. **Failure, termination, concurrency, and compensation.** What happens on provider/tool
    refusal, timeout, partial success, or non-convergence? Which idempotency key and lease prevent
    retry or concurrent duplication? What is the undo for each side effect — or why is there
    none?

The test is that a fresh builder can answer these from the repository, runtime policy, and trace
without asking the original author.

## 14. Failure playbook

### Build gate fails

- Read the exact failing check.
- Reproduce in the lane environment.
- Determine whether the change or infrastructure caused it.
- Fix within the task if relevant; otherwise classify and assign.
- Do not reflexively use `--no-verify`.

### Behavior eval regresses

- Re-run under controlled conditions and the same versions.
- Separate product, provider, judge, and infrastructure failure.
- Inspect representative transcripts.
- Quarantine the affected route if the user-facing regression is credible.
- Preserve hard/held-out cases; do not delete the inconvenient example.

### Slow gate

- Classify as S3 unless it blocks a critical path or causes a fail-closed runtime verifier to
  time out.
- Record last normal runtime, environment/resource changes, cache/lock contention, and
  reproducibility.
- Split fast commit checks from broader integration/nightly checks where appropriate.
- Apply the escalation rule in §4.3 — two retros or ~5× budget means scheduled work, not another
  log line.

### Provider fails or rate-limits

- Retry only inside the envelope's bounded policy.
- Confirm side effects are idempotent before retry.
- Use only a qualified fallback whose data policy permits the task.
- Record requested and served model plus fallback reason.
- Pause when no qualified fallback exists; never silently downgrade.

### Lane stalls

- Ask for checkpoint evidence, not a status essay.
- If no new hypothesis/evidence exists after repeated failure, stop.
- Tighten the contract, improve the verifier, change topology, or escalate the model
  deliberately.

### Hook misfires

Format/session/notification hooks fail open by design. Secret/bash hooks also fail open and are
accident-reduction guardrails, not security boundaries. Log the failure and use the actual
sandbox, credential, network, and runtime policy controls appropriate to the task.

### Incident after release

- Contain authority and affected route first.
- Roll back to the last known good version.
- Preserve traces and exact model/prompt/policy/environment provenance.
- Add the escaped scenario to the right verifier/eval layer after root cause.
- Review whether autonomy or a route should be demoted.

## 15. Multiple people, lanes, and hackathons

### 15.1 Solo conductor with background agents

Start with one executor. Read-only research/eval may run in parallel when it does not contend for
the same contracts or attention. Add another executor only after the first output can be reviewed
without queueing.

### 15.2 Same repo, different repos

Worktrees prevent checkout collisions; assign module ownership and integration order. Shared
caches, databases, ports, credentials, external rate limits, and runtime services still need
explicit isolation or coordination. Separate repos reduce file conflicts, not shared-system
dependencies — check shared libraries, databases, providers, schemas, deployment targets, and
budgets before calling lanes independent.

### 15.3 Two- or three-person team

Before splitting, agree on: one product outcome and risk tier; task/agent design holes and
assigned owners; data shapes and runtime authorization signatures; module ownership and
integration order; a shared verification command and a latest-main integration owner.

Natural lanes for an agent product:

- **Spine/integration:** envelope, schemas, runtime gate, eval skeleton, integration/release.
- **Capability:** workflow loop, tool wiring, domain behavior.
- **Operability:** state/resume, receipts/traces, run/demo harness.

Coordinate at evidence checkpoints rather than continuous chat. Green lane checks make review
cheaper; they do not eliminate integration or correctness review.

### 15.4 Hackathon mode

The principles survive; the evidence is compressed. Run `/hack <idea> <duration>`. Within the
opening block: state the one demoable outcome; name the irreversible action and runtime owner if
one exists; define one fast success check and one planted failure; answer the compressed
twelve-question anatomy; choose at most one conductor + one or two truly separable lanes.

Always gate real spend, publication, messages, deletion, consent, and production mutation. Do not
spend the event perfecting lint/test coverage unrelated to the demo path — the demo itself may be
the verifier for reversible UI polish. Time pressure increases the value of contracts and artifact
paths: integrate continuously against a working demo branch, freeze the demo path on schedule, and
rehearse both success and the planted failure.

Run `/end-session` even when tired. Record whether this is a prototype to discard, a project to
continue, or a demo with unresolved T2/T3 gaps. Pressure-induced babysitting is high-signal retro
input.

## 16. A concrete day

Scenario: add duplicate-safe supplier-order drafting to a procurement agent. The agent may draft,
but must not send or pay.

- **08:45 — classify.** The digest shows core tests green and one gate passing in 379 seconds.
  Classify the latency S3, assign it to weekly maintenance, continue. It does not seize the day.
- **09:00 — envelope.** `procurement-order-draft/v1`, T2/internal. Outcome: a cited order draft
  from three quotes; retry cannot duplicate it. Non-goals: send, pay, mutate the supplier master.
  Acceptance: build gate, recorded replay, injection/duplicate/currency cases, dry-run receipt.
  Authority: read seeded quotes; write worktree/artifacts; deny email/payment/production supplier
  API. Rollback: revert commit and disable the route flag. Budget: one executor, two retries,
  120-minute checkpoint.
- **09:15 — split on a stable contract.** The conductor freezes the order/receipt schemas and
  acceptance cases; one implementation lane runs on the locally qualified Sonnet/Terra route; an
  optional read-only evaluator inventories adversarial cases into a separate artifact.
- **10:30 — checkpoint.** The executor returns commit/patch and artifact paths, gate results, a
  currency-edge case it added and fixed, cost/time/retries, and remaining risk. The conductor
  decides whether another bounded step is justified.
- **11:00 — integrate and review.** Refresh main, integrate, run the combined gate. Implementation
  used an Anthropic route and the task is T2, so a qualified opposite-provider reviewer receives
  fresh context: envelope, diff, and evidence. Findings go back to the implementation lane; review
  does not gain send/pay authority.
- **11:45 — observe.** Run the flow against seeded quotes in dry-run mode: one receipt per
  idempotency key; correct totals/currency/citations; injection-shaped supplier text cannot move
  runtime authorization; email/payment tools remain unavailable. Integrate behind the route flag
  and record rollback.
- **End of day.** The handoff records the exact outcome accepted, integrated commit, evidence
  paths, route versions, the remaining S3 latency item, and the next product outcome — not
  "implementation complete."

## 17. Automation verification

The harness is local and version-controlled in `~/dev/agentic-harness`. The installed Claude files
are symlinked into it in owner mode. Focus repos are configured in
`~/.config/agentic-harness/repos.txt`.

### Is the nightly job alive?

```bash
launchctl print gui/$(id -u)/com.$(id -un).nightly-gate-digest
ls -la ~/dev/docs/gate-digests/
```

A fresh dated digest proves the job wrote output. Check `last exit code` and the digest contents;
a loaded LaunchAgent alone does not prove healthy gates.

### Force the real scheduled path

```bash
launchctl kickstart gui/$(id -u)/com.$(id -un).nightly-gate-digest
```

### Turn it off and on

```bash
launchctl bootout gui/$(id -u)/com.$(id -un).nightly-gate-digest
launchctl bootstrap gui/$(id -u) \
  ~/Library/LaunchAgents/com.$(id -un).nightly-gate-digest.plist
```

## 18. Current state and adoption order

*Last verified 2026-07-10. This is a snapshot, not a substitute for the code and latest digest.*

### LIVE

- Harness-as-code repository and owner/copy install modes.
- Session-start Git/digest/handoff context.
- Repo-local commit build gates with deliberate override.
- Nightly focus-repo build gates and optional offline eval suites.
- Slow-gate flag and hard per-script timeout.
- Canonical `AGENTS.md` convention across the focus set.
- Planning, challenge, research, handoff, onboarding, end-session, new-agent, hack, and retro
  skills; `/new-agent` and `/hack` contain the twelve-question checklist.
- Babysit log intake and artifact-oriented subagent patterns.
- Public library daily sync for configured sources (**EXCEPTION** — see §11.3).

### HABIT — supported but not yet demonstrated consistently

- First ordinary feature executed as 1 conductor + 1 worktree executor.
- Weekly evidence-based retro as a recurring calendar habit.
- Consistent artifact paths for every implementation lane.
- Periodic real-output L3 sampling.

### NEXT — build and prove in this order

1. Adopt Task Envelope v1 manually on one real feature.
2. Use S0–S3 morning classification; update notification/digest tooling only after the manual
   policy proves useful.
3. Run the first worktree task with explicit tool/credential scope and fresh-context review.
4. Add latest-main integration evidence and rollback fields to feature plans/handoffs.
5. Add minimal JSONL trace/provenance and repeated-trial/flake classification to one agent.
6. Create a static multi-model registry and qualify two implementation routes plus one
   cross-provider reviewer on real tasks.
7. Add CI/PR enforcement when a repository is shared or deployed.
8. Move public-library intake toward explicit allowlisting/default-private publication.
9. Add product/delivery metrics to the retro; keep harness metrics subordinate.

Not installed yet (do not treat as protection): fleet-wide S0–S3 automatic classification,
content-addressed skipping of unchanged repos, provider-neutral model registry/routing, fleet-wide
requested/served model trace schema, mandatory cross-provider review, shared CI/PR mirror in every
repo, and general sandbox/credential/egress enforcement for worktree lanes.

### LATER — require an observed trigger

- Merge queue: after ready branches regularly contend.
- Approvals dashboard: after approvals are missed or exceed the response SLO.
- Adaptive model router: after static routes accumulate labeled outcome/cost data.
- Full OpenTelemetry backend, SBOM, and signed attestations: for shared/production release risk.
- Shared agent-core library: only when a fix must propagate to a third consumer and there is a
  safe update/migration mechanism. Copying security machinery without patch propagation creates
  forks that age independently.

### Maturity modes

- **Mode 1 — lean conductor/executor (use now).** One conductor, one implementation lane, optional
  read-only research, static model selection, local build gate, and a handoff. Breaks when ready
  work waits primarily on session management or integration rather than execution.
- **Mode 2 — review and evidence plane (build next).** Task Envelopes, latest-main integration,
  independent T2/T3 review, trace schema, eval-flake operations, dry-run/canary/rollback, outcome
  metrics, model qualification. Breaks when task dispatch/retry/reconciliation becomes the
  recurring human bottleneck.
- **Mode 3 — task-driven fleet (build later).** An issue/task system becomes the authoritative
  state machine; an orchestrator owns bounded concurrency, workspace isolation, retry,
  reconciliation, and operator-visible status. Agents pull ready tasks and leave reviewable
  artifacts. OpenAI's Symphony is a current example:
  [Symphony orchestration](https://openai.com/index/open-source-codex-orchestration-symphony/).
  Do not build the fleet scheduler, approvals dashboard, or merge queue before measured queueing
  and missed work justify them.

## 19. Evidence and limits

Current public evidence supports the direction, not a universal recipe:

- OpenAI reports that repo-local knowledge, executable feedback, worktree-local app/telemetry, and
  mechanically enforced architecture enabled an internal agent-first team to ship quickly — a
  vendor-reported case study, not controlled proof:
  [Harness engineering](https://openai.com/index/harness-engineering/).
- Anthropic reports that multi-agent research can cut latency on highly parallel search, but uses
  much more compute and notes that coding often has fewer independent branches:
  [Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system).
- RE-Bench found strong short-budget agent performance in seven ML research-engineering tasks,
  while humans gained more from longer budgets — foundational evidence, not a universal lane
  timer: [RE-Bench](https://arxiv.org/abs/2411.15114).
- METR's developer-productivity studies show why self-measurement matters: perceived acceleration
  can differ from observed lead time, and newer results remain uncertain:
  [2026 study-design update](https://metr.org/blog/2026-02-24-uplift-update/).

The workflow should become simpler as models and environments improve. Any ritual that no longer
changes outcomes is a candidate for deletion.

## 20. Quick reference

### Runs without you

- Nightly focus-repo build gates and optional offline evals.
- Session-start Git/digest/handoff context.
- Commit build gate.
- Fail-open formatting, secret, bash, and notification hooks.
- Current public library sync for configured sources.

### You do

- Classify health S0–S3.
- Choose one primary outcome.
- Create the right-sized Task Envelope.
- Ask whether the executor can verify it.
- Keep implementation WIP at two or less.
- Review against the envelope and latest target.
- Apply independent review/rollout proportional to risk.
- Close with evidence and a handoff.
- Run the weekly evidence retro and trigger-based model requalification.

### The sentence to grade the workflow

> Useful changes should reach accepted, observable outcomes with less human attention and rework,
> while authority, cost, and failure remain bounded.
