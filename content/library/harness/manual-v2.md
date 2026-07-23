---
title: 'The Manual v2 — engineering loops, not supervising agents'
collection: harness
source: ~/dev/agentic-harness/docs/MANUAL_V2.md
sourceMtime: '2026-07-15T07:03:18.387Z'
syncedAt: '2026-07-23'
summary: >-
  Comparison draft, 2026-07-14. This file does not replace The Manual, the daily
  Operating Manual, or installed policy. It is deliberately parallel so the old
  and proposed systems can be compared bef…
contentHash: 'sha256:e275e5bd7ac7356eae31c7e59b1f188ca8a846e8d23e1b729fb1ea5731ec4109'
---
# The Manual v2 — engineering loops, not supervising agents

_Comparison draft, 2026-07-14. This file does not replace [The Manual](MANUAL.md), the daily
[Operating Manual](OPERATING_MANUAL.md), or installed policy. It is deliberately parallel so the
old and proposed systems can be compared before anything is promoted. Status labels describe the
mechanism, not the confidence of the prose._

The objective is unchanged:

> Ship more accepted product outcomes per unit of human attention, without increasing escaped
> defects, security exposure, rework, or uncontrolled cost.

The v2 thesis is more precise:

> A harness makes task state, context, feedback, authority, and evidence legible and enforceable.
> Autonomy is earned by environment and verifier coverage, not declared by prompting.

---

## What changed from the current manual

| Current manual | v2 proposal | Why |
|---|---|---|
| Inner and outer loops | Four-loop topology, independent cadence, risk, and maturity axes | A per-task loop can be event-driven; a standing loop can be deterministic. The dimensions should not collide. |
| Verification proves a task before the packet | Verification is a fallible control signal with classified failure and bounded repair | Red can mean product, grader, infrastructure, policy, missing-input, or uncertain-side-effect failure. |
| Every bug becomes an eval; suites grow monotonically | Every material failure gets the cheapest durable reproduction; the failure registry is append-only and the active suite is curated | Not every defect needs a paid behavior eval, and active suites need deduplication, reweighting, quarantine, and retirement with lineage. |
| Deterministic checks are “free forever” | Deterministic checks have low marginal token cost and high reproducibility, but still consume compute, maintenance, and attention | Infrastructure and flaky environments can materially move results. |
| `AGENTS.md` as a reactive failure log | `AGENTS.md` as a lean map plus always-true invariants and entry points | Failure history belongs in cases, incidents, and versioned docs; enforceable rules should move into code. |
| A numeric 100–150k-token “Dumb Zone” | Behavioral reset triggers | Context quality depends on relevance, structure, model, and task; there is no useful universal cliff. |
| Top model judges, cheaper model executes | A routing hypothesis qualified per task class | Model, cost, latency, data policy, and actual served route require local evidence. |
| Fixed WIP ≤ 2 as general doctrine | WIP ≤ 2 remains this operator’s current attention limit; parallel admission also requires separable work and integration capacity | A local safety rail is not a universal optimum. |
| Friction → cheapest fix | Reproduce → classify → choose the cheapest effective control → backtest → approve → canary → promote/rollback | Evidence and interventions are different things. |
| Sunday proposer described as standing behavior | Repository-ready but optional until runtime installation and first successful cycle are verified | A script and plist template are not an operating loop. |

### Status language

| Label | Meaning |
|---|---|
| **LIVE** | Installed, observable, and able to run without remembering a ritual |
| **HABIT** | A human practice used now but not mechanically enforced |
| **NEXT** | The trigger exists and the smallest implementation is identified |
| **LATER** | Designed only; its trigger has not been observed |
| **EXCEPTION** | A deliberate bounded deviation with owner and reason |

Never label a whole idea LIVE. Label the gate, trigger, trace, grader, or promotion step that
actually exists.

---

## 1. Four independent axes

LangChain’s loop-engineering vocabulary is useful if it is treated as topology, not a maturity
ladder. It describes four kinds of return arrow: an agent acts, a verifier feeds back, an event
starts work, and production evidence changes the harness. It does not show that every product
needs every loop. [The Art of Loop Engineering](https://www.langchain.com/blog/the-art-of-loop-engineering)

Keep four axes separate:

| Axis | Question | Values used here |
|---|---|---|
| **Topology** | What does the return arrow change? | agent, verification, event, improvement |
| **Cadence** | When does it run? | per-step, per-task, commit, release, scheduled, production-triggered |
| **Risk** | What can go wrong and how far can it spread? | development change T0–T3; runtime action classes live in `AGENT_ANATOMY_V2.md` |
| **Maturity** | How much of the loop is installed and evidenced? | LIVE, HABIT, NEXT, LATER, EXCEPTION; product maturity may separately use L0–L4 |

The same topology appears in two different systems:

| Loop | Agentic development harness | Runtime AI product |
|---|---|---|
| **Agent** | A coding, research, or review lane works a contract | A model gathers context, decides, and calls tools for a user outcome |
| **Verification** | Build checks, behavior evals, UI flows, and review feed evidence or repair feedback to the lane | Output/outcome graders, policy checks, runtime action gates, and humans assess a run or proposed action |
| **Event** | A brief, issue, commit, schedule, incident, or provider change starts work | A user message, webhook, schedule, queue item, or state transition starts a run |
| **Improvement** | Bugs, digests, handoffs, and accepted outcomes become cases and harness changes | Traces, corrections, incidents, and outcomes become eval-backed agent releases |

Do not transfer controls between the columns by analogy. A commit hook may block code integration;
it does not authorize a production payment. A runtime spend gate may authorize one transaction;
it does not prove the agent is useful or its implementation is correct.

---

## 2. The unit of work

Scale the task contract to development-change risk:

| Change tier | Minimum contract |
|---|---|
| **T0 — local and reversible** | State the outcome; make the change; run the obvious check |
| **T1 — ordinary product work** | Three-line contract below; plan in single-digit evidence-bearing phases |
| **T2 — consequential or cross-system** | Three-line contract + loop profile + relevant fields from the [Agent Anatomy v2 design review](AGENT_ANATOMY_V2.md#16-compact-design-review) + independent review/integration evidence |
| **T3 — authority, publication, money, credentials, destructive migration** | T2 controls + enforced containment + deterministic action boundary + rehearsal/canary/rollback or explicit non-reversibility decision |

The default T1 contract stays deliberately small:

```text
Outcome:             <observable result>
Non-goals:           <what must not expand into this task>
Acceptance evidence: <checks and flows the executor can run>
```

Acceptance evidence names the environment and observable postcondition, not only the command.
“Tests pass” is incomplete; “`uv run pytest tests/test_substitution.py` passes against fixture
catalog v7 and the checkout total equals the committed substitute price” can become durable
evidence.

### 2.1 Loop profile — only when the task needs it

Use this for T2/T3, triggered/background work, multi-lane work, or any task with a repair loop:

```text
Active loops:        <agent / verification / event / improvement>
Trigger and owner:   <who or what starts it; who owns failure>
Durable state:       <contract, plan, checkpoint, base SHA, artifacts>
Feedback:            <verifier identity/version; target of feedback>
Budgets:             <attempt, time, token, spend, tools, concurrency>
Human boundaries:    <contract, authority, output, promotion decisions>
Exit/escalation:     <pass, blocked, exhausted, uncertain side effect, incident>
```

Do not add this to a one-file T0 edit. Ceremony that does not change the decision is waste.

### 2.2 Long work gets a living plan

A multi-hour or cross-milestone task gets a durable execution plan with progress, discoveries,
decisions, validation, recovery/idempotence, and outcome notes. A fresh lane must be able to resume
from repository + plan without the original chat. Small T1 work keeps the ordinary plan; it does
not pay for a project journal. This follows the restartable-plan pattern in OpenAI’s
[Codex ExecPlans](https://developers.openai.com/cookbook/articles/codex_exec_plans).

---

## 3. The development state machine

The chat is transport. Task truth lives in versioned artifacts and observable state:

```text
proposed → ready → running → verifying → review → integrated → observed → done
                         ↘ repair ↗

blocked, canceled, failed, and effect-unknown are explicit side states.
```

- **Ready** means contract, base, authority, and a runnable verifier exist.
- **Verifying** means the executor stopped changing the object under test and ran declared checks.
- **Review** means evidence is available; it does not imply acceptance.
- **Integrated** means the actual target head passed the combined gate.
- **Observed** means any required dry-run, canary, or post-merge check ran.
- **Done** means the outcome was accepted, not merely that a lane stopped.

This is a conceptual state contract today, not a claim that a tracker or fleet orchestrator is
installed.

### 3.1 Verification feedback is not truth

Classify a failed attempt before deciding whether to retry:

| Classification | Response |
|---|---|
| **OUTPUT_FAILURE** with actionable evidence | Make one new attempt with a recorded, distinct hypothesis |
| **TRANSIENT_INFRA** | Back off/retry under system policy; do not teach the model that infrastructure noise is product feedback |
| **GRADER_ERROR / AMBIGUOUS** | Abstain; route to a calibrated alternate grader or human; repair the measurement plane separately |
| **POLICY / AUTHORIZATION_FAILURE** | Stop; never retry around a gate |
| **MISSING_INPUT** | Persist state and ask the smallest blocking question |
| **SIDE_EFFECT_UNKNOWN** | Reconcile durable external state; never blind-retry |
| **NO_PROGRESS / BUDGET_EXHAUSTED** | Stop and escalate, re-plan, or narrow the contract |

LangGraph’s current guidance similarly separates transient, model-recoverable, user-fixable, and
unexpected failures rather than feeding every error back to the model.
[Thinking in LangGraph](https://docs.langchain.com/oss/python/langgraph/thinking-in-langgraph)

Every repair attempt records:

```text
attempt · hypothesis · verifier feedback · evidence delta · cost · stop reason
```

The same failure twice with no evidence delta is non-progress. A larger model is a new route, not
a new hypothesis, and it does not expand authority or budget.

---

## 4. Context is an interface

The executor should receive the smallest complete context packet, not the largest available
transcript:

```text
contract and version
repo, worktree, branch, and base SHA
relevant path-scoped instructions and invariants
exact build/test/app startup entry points
current plan or handoff
allowed tools, credentials, data, and egress
decisive logs and artifact pointers
```

### Instruction hierarchy

- A root `AGENTS.md` or equivalent is a lean map: architecture, invariants, entry points, and where
  deeper truth lives.
- Path-scoped instructions carry local rules only where they apply.
- Skills hold procedures loaded on demand.
- Versioned docs hold explanations and decisions.
- Gates and scripts enforce rules that machines can check.
- Incidents and eval cases preserve failure history.

OpenAI reports that a large monolithic instruction file became stale and ineffective; its internal
team moved to a short map backed by structured, versioned repository knowledge and mechanical
checks. Treat that as a useful vendor case study, not universal proof.
[Harness engineering](https://openai.com/index/harness-engineering/)

### Reset behavior, not a token number

Reset into a fresh lane when assumptions are stale, the agent repeatedly rediscovers the same
facts, tool output crowds out the contract, a milestone produced a complete handoff, or a verifier
failure needs an independent hypothesis. Persist decisive state first. Anthropic’s current context
guidance emphasizes compaction, structured note-taking, and subagents as ways to preserve relevant
signal rather than relying on a universal context-window threshold.
[Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

Full logs belong in files. The chat gets a concise failure summary and pointer. Anthropic’s
parallel compiler experiment found that huge command outputs polluted agent context and used
short error summaries plus full log artifacts instead.
[Building a C compiler with parallel agents](https://www.anthropic.com/engineering/building-c-compiler)

---

## 5. A lane is an environment, not only a branch

Every mutating lane has an identity:

```text
worktree + branch/base
process and port namespace
test data, seed, tenant, and fixture version
logs, screenshots, metrics, and traces
credential/capability scope
resource budgets
teardown owner
```

A worktree isolates checkout files. It still shares the host, Git metadata, home directory,
processes, ports, caches, network, and often credentials. T2/T3 work requires an actual OS,
container, VM, remote-session, credential-broker, or network boundary appropriate to the threat.
OpenAI and Anthropic both describe containment as a system property, not a permission-prompt
ritual. [Codex Windows sandbox](https://openai.com/index/building-codex-windows-sandbox/),
[How Anthropic contains Claude](https://www.anthropic.com/engineering/how-we-contain-claude)

### Parallel lane admission

Open another implementation lane only if all answers are explicit:

| Admission field | Required answer |
|---|---|
| Acceptance separability | Can each lane prove its part without the other lane’s uncommitted state? |
| Exclusive scope | Which files, resources, schemas, or locks does the lane own? |
| Base | Which target SHA and dependency/environment versions does it assume? |
| Environment | Which worktree, ports, data, tenant, and credentials are isolated? |
| Authority | What may it change or call? |
| Integration | Who owns order and conflicts? |
| Combined proof | Which gate runs after integration on the actual target head? |
| Recovery | How is either lane dropped or rolled back? |

Parallel generation is useful only when review, environments, and integration can absorb it.
Anthropic’s compiler work scaled on separable tests but required explicit partitioning to stop
agents duplicating or overwriting work. That was a research prototype, not a universal lane-count
result. [Building a C compiler with parallel agents](https://www.anthropic.com/engineering/building-c-compiler)

**Current local policy:** WIP ≤ 2 implementation lanes across projects remains a HABIT because it
matches this operator’s attention. Raise it only after evidence shows acceptance and integration,
not generation, can absorb more work.

---

## 6. Executable feedback and eval integrity

Three planes must remain distinguishable:

| Plane | Contains | Decides |
|---|---|---|
| **Object** | code, model, prompt, tools, memory, orchestration | What the system does |
| **Measurement** | task, dataset, environment, grader, trace, uncertainty | What evidence says happened |
| **Promotion** | thresholds, reviewer, aliases, canary, abort, rollback | What is allowed to ship |

For T2/T3, the object plane cannot write the measurement or promotion plane. A change that alters
both the system and the definition of passing is two changes: split it, or require human-labelled
adjudication and dual-score the old and new graders on frozen cases.

### 6.1 Three verification surfaces

| Surface | Development purpose | Feedback behavior |
|---|---|---|
| **Build gate** | Syntax, types, lint, fast tests, architectural invariants | Return concise deterministic failures to the executor |
| **Behavior eval** | Product behavior across cases/trials | Return development-set feedback; preserve regression and promotion independence |
| **Runtime action gate** | Authorize a consequential side effect in the shipped product | Fail closed or escalate; never become “try wording it differently” feedback |

### 6.2 Verification ladder

Use the lowest-cost mechanism that measures the actual postcondition:

1. Static checks, schemas, unit/property tests, and planted gate failures.
2. Integration, replay, browser/mobile flow, and external-state postcondition checks.
3. Independent rubric evaluator for genuinely semantic behavior.
4. Human grading or domain-expert adjudication for high-consequence or ambiguous outcomes.

Deterministic checks usually have the lowest marginal run cost and best reproducibility, but they
still carry compute, brittleness, authoring, maintenance, and false-confidence costs. Anthropic
measured benchmark movement of up to six points from infrastructure configuration alone, so the
environment is a versioned experimental variable.
[Infrastructure noise in agent evaluations](https://www.anthropic.com/engineering/infrastructure-noise)

### 6.3 Eval sets have different visibility

| Set | Visibility and use |
|---|---|
| **Development** | Transparent acceptance cases; actionable feedback may drive bounded repair |
| **Regression** | Stable broad corpus; repeated during development and release |
| **Promotion holdout** | Private or rotating; candidate freezes before the run; results do not feed another attempt of that candidate |
| **Online monitor** | Sampled production traces, outcomes, corrections, and incidents; failures become dataset candidates only after labeling |

This resolves the tension between useful verifier feedback and optimizing against the grader. The
system under optimization must not control hidden fixtures, the promotion threshold, the release
alias, or the rollback pointer. Anthropic’s eval guidance also recommends multiple trials, balanced
cases, isolated environments, human-calibrated graders, transcript audits, and saturation review.
[Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

### 6.4 Failure history grows; active suites are curated

- Every material escaped failure gets the cheapest durable reproduction at the correct layer:
  unit/property test, fixture/replay, behavior eval, runtime monitor, or planted action-gate case.
- The failure registry is append-only.
- The active suite is versioned and may deduplicate, reweight, quarantine, or retire cases with
  lineage, owner, reason, and expiry. Never silently delete the inconvenient case.
- A suite at 100% may be a regression net but no longer a useful improvement signal. Add harder
  or shifted cases before declaring maturity from the score.

Cadence scales with cost:

| Cadence | Evidence |
|---|---|
| Commit | Fast deterministic subset |
| Scheduled | Sharded or rotating broad suite with declared full-coverage window |
| Release | Full target + regression + frozen promotion evidence |
| Production | Risk-based sampling, outcome monitors, and incident triggers |

Anthropic describes twenty to fifty real cases as a strong starting point, not proof of a mature
suite. [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

### 6.5 Verifier contract

Every verifier declares:

```text
target · assertions/rubric · deterministic/model/human type · immutable version
required evidence · confidence/abstention · calibration set · known blind spots
executor access to internals · blocking authority · failure behavior · owner
```

Test the verifier with reference solutions, near misses, negative controls, and planted bypass
attempts. A model grader gets an explicit `Unknown`/abstain path and calibration against human
anchors. “No manual review” applies only to the classes the verifier actually covers.

---

## 7. Evidence and acceptance

Done arrives as an evidence packet v2:

```text
## Evidence packet — <task>
Contract/version: <outcome, non-goals, acceptance evidence>
Provenance:       <repo, base SHA, lane head, integrated target SHA if applicable>
Changed:          <files/surfaces + why; scope deviations>
Environment:      <dependency, data/fixture, app, model, prompt/policy versions>
Checks:           <verifier/version, command, concise result, artifact/hash>
Evals:            <dataset split/version, trials, scorer/judge, baseline and delta>
Attempts:         <hypotheses, feedback, evidence delta, stop reason>
Artifacts:        <screens, videos, logs, traces, receipts>
NOT VERIFIED:     <what, why, consequence, owner/next event>
Residual risk:    <known uncertainty and blast radius>
Rollback:         <last-known-good or why compensation is impossible>
Decision:         <accepted/rejected/waived by whom and against which version>
```

Review depth follows consequence, subjectivity, and ability to redefine green:

| Review | Typical change |
|---|---|
| **Outcome/packet** | Local reversible work with independent deterministic proof |
| **Focused diff + packet** | Ordinary product logic, integration, semantic behavior |
| **Independent review + rehearsal** | T2/T3; authority, policy, credential, migration, release, or irreversible path |

Changes to graders, rubrics, datasets, gates, traces, promotion thresholds, tool permissions,
credentials, or runtime action policy always tier up. They can change what “green” or “allowed”
means even when the diff is small.

---

## 8. Human supervision is escalation, not polling

The ordinary T1 task still aims for two human touchpoints:

1. Approve or correct the contract.
2. Accept or reject the evidence packet.

Interrupt between them only for:

- contract or non-goal mutation;
- expanded tool, data, credential, network, publication, or spend authority;
- budget/deadline breach;
- repeated verifier failure with no new hypothesis;
- integration conflict that changes the intended behavior;
- ambiguous grading or an effect-unknown state requiring human/domain judgment.

Frequent low-information permission prompts are supervision debt, not strong control. Anthropic
reported very high approval rates in its containment work and argues for bounding blast radius so
fewer approvals carry more information.
[How Anthropic contains Claude](https://www.anthropic.com/engineering/how-we-contain-claude)

The operator reviews artifacts on their schedule. Watching a token stream is never supervision.

---

## 9. Event-driven work is an operations contract

A cron expression or webhook is only a trigger. An operating event loop also defines:

```text
event identity/schema/authentication · durable intake · deduplication/idempotency
acknowledgement point · lease/concurrency/coalescing · retry/backoff · deadline
stale-event and replay policy · dead-letter/incident owner · kill switch
result pointer · cost ceiling · retention
```

Assume at-least-once delivery unless the infrastructure proves otherwise. Approximate exactly-once
business effect with durable intake, dedupe, idempotent side effects, leases, and reconciliation.
Persist before acknowledging slow work. LangSmith’s Engine webhook guidance likewise requires
deduplication by event ID. [Engine webhooks](https://docs.langchain.com/langsmith/engine-webhooks)

### Current harness event status at this draft

| Mechanism | Status | Evidence / gap |
|---|---|---|
| Commit build gate | **LIVE** | `guard-commit` invokes each repo’s gate; explicit bypass remains possible and auditable only by habit |
| Nightly gate/eval digest | **LIVE** | LaunchAgent and dated digest are running; gate timeout/process-group handling exists |
| Completion notification | **NEXT / AVAILABLE** | Hook exists in the repository but is not wired in the current user settings; even when installed it is fail-open, not a delivery guarantee |
| On-trigger retro | **HABIT** | Trigger policy exists; execution remains human-initiated |
| Weekly improvement proposer | **NEXT / OPTIONAL** | Script, skill, installer flag, and plist template exist; the LaunchAgent was not loaded on the primary Mac when this draft was written |
| Trace-driven production improvement | **LATER** | Minimum trace schema is designed in `ROADMAP.md`; no portfolio-wide trace-to-eval plane is installed |

Do not install the weekly proposer merely to make the table greener. Pilot it when the babysit log,
digests, and handoffs contain enough labeled evidence to judge whether its proposals save attention.

---

## 10. Routing and economics

The contract makes cheaper execution plausible; it does not prove a fixed model hierarchy.

Qualify routes per task class using:

- requested and actual served model/provider/version;
- target, regression, and held-out outcomes over repeated trials;
- cost, latency, failure and fallback behavior;
- data retention/residency and allowed data classes;
- tool and modality support;
- last-qualified date and requalification trigger.

Use deterministic transformation before a model when it is sufficient. Use a strong route when
judgment, ambiguity, or consequence requires it. Escalate after evidence of failure, not as a
substitute for a new hypothesis. `ROADMAP.md` owns the uninstalled registry and promotion design.
OpenAI’s Basis case study is useful evidence for workflow-specific benchmark routing, but remains a
vendor report. [Basis model routing](https://openai.com/index/basis/)

### Cost of trust

Measure the whole accepted outcome:

| Mechanism | Marginal cost and risk |
|---|---|
| Evidence formatting | Low if generated from captured artifacts; high if reconstructed by hand |
| Deterministic checks | Low marginal token cost; compute, maintenance, flake, and false-confidence costs remain |
| Replay/integration/UI flow | Environment and storage cost; often the best behavioral evidence |
| Model grader | Paid per case/trial; correlated error, calibration, and drift risk |
| Independent evaluator | A second context/run; justified by subjectivity or T2/T3 consequence |
| Human expert | Scarcest; reserve for ambiguity, taste, authority, calibration, and promotion |

Primary metric:

> Accepted outcomes per 100 human-attention minutes.

Supporting metrics: intervention count/minutes; claim-to-acceptance latency; manual retests;
integration/rework/rollback time; escaped defects; compute and token cost per accepted outcome.
PRs, tokens, and agent-hours are diagnostics, not value. METR cautions that concurrency, task
selection, and substitution make apparent transcript time savings a weak proxy for delivered value.
[2026 uplift study-design update](https://metr.org/blog/2026-02-24-uplift-update/)

---

## 11. Improvement is a governed release loop

The improvement spine is:

```text
repeated evidence
→ human-validated finding
→ cheapest durable reproduction
→ explicit hypothesis
→ smallest mutable-surface change
→ target eval + broad regression + held-out backtest
→ review
→ zero-authority shadow or dry run
→ bounded canary
→ observe
→ promote or rollback
→ feed new evidence back
```

Production corrections are signals, not automatically truth. OpenAI’s tax-agent case study
describes experts separating recurring product errors from expected preference/workflow noise,
turning accepted findings into targeted evals, running targeted and broad regressions, and proposing
reviewable code changes. [Building self-improving tax agents with Codex](https://openai.com/index/building-self-improving-tax-agents-with-codex/)

### Improvement case

```text
Evidence:           <occurrences, opportunity count, traces/artifacts, consequence>
Classification:     <object / measurement / promotion / infrastructure / process>
Reproduction:       <case and baseline; expected postcondition>
Hypothesis:         <why the proposed control should change the outcome>
Change surface:     <instruction / skill / hook / gate / code / tool / model / grader / data / policy>
Comparison:         <target, regression, held-out, cost/latency, false-pass/false-fail>
Release:            <review, shadow/dry-run, canary, abort threshold, observation window>
Recovery:           <last-known-good, rollback/compensation owner>
Decision:           <promote / revise / reject / accept-as-is>
```

The proposer may file findings, cases, and candidate patches. It may not change production aliases,
delete or relax a grader, expand permissions, or promote its own work. For T2/T3, proposer,
evaluator, and promoter are independent roles.

LangSmith Engine is a useful reference architecture—traces become recurring issues, examples,
evaluators, proposed fixes, and reviewable pull requests—but it is beta and not evidence that
autonomous mutation is safe. [LangSmith Engine](https://docs.langchain.com/langsmith/engine)

### Kill rule v2

Review a control after three relevant opportunities, not merely three calendar cycles:

- Did it catch a defect, prevent an action, shorten acceptance, or change a decision?
- Is the measured opportunity common enough to justify its running and maintenance cost?
- Is it a rare S0/T3 boundary whose value is limiting catastrophe rather than firing often?

Delete or simplify controls that repeatedly see relevant opportunities and add no value. Do not
delete a rare catastrophic boundary merely because no incident occurred.

---

## 12. A day in practice

**Open.** Read the actual digest and repository state. Today’s 2026-07-14 digest is green across
the four focus repos and the one wired eval suite, so product work starts; no calendar triage ritual
is invented.

**Contract.** Pick one accepted outcome. Draft the T1 contract. Add the loop profile only if the
task is triggered, risky, multi-lane, or repair-heavy. Confirm the lane can run its acceptance flow
without asking the operator to become the tester.

**Context.** Start the lane with its contract/version, base SHA, scoped instructions, verifier
commands, authority, and decisive artifacts. Do not paste the research journey.

**Execute and verify.** The lane implements, freezes the candidate, runs the build/behavior/UI
checks, and classifies failures. An output failure gets a bounded new hypothesis; infrastructure
noise gets an infrastructure retry; policy failure stops; uncertain side effects reconcile.

**Accept.** The packet records provenance, actual outputs, attempts, residual risk, and what was not
verified. Review depth follows consequence and whether the diff can redefine green.

**Integrate and observe.** Refresh the real target, run the combined gate, then perform any required
dry-run/canary/post-merge check. “Passed in a worktree” is not integrated evidence.

**Improve.** A material escaped failure becomes the cheapest durable reproduction. Repeated friction
becomes an improvement case, not an instruction line by reflex. The nightly loop checks drift after
the operator stops; the optional proposer does not become standing behavior until its own pilot
earns promotion.

---

## 13. Adoption order for this draft

1. Use evidence packet v2 on one real T1 product task; measure whether it reduces manual retesting.
2. Use the retry classification/ledger on the first task with a genuine verifier failure.
3. Correct instruction-file policy: lean map, scoped invariants, executable enforcement.
4. Split one product eval corpus into development, regression, and promotion evidence.
5. Exercise latest-head integration evidence on the next concurrent change.
6. Run the weekly proposer once manually against labeled exhaust; score proposal usefulness before
   installing the schedule.
7. Add the minimal trace/action provenance to one runtime agent only when a real improvement or
   incident workflow will consume it.
8. Qualify a second model route only when a current route’s cost, latency, or failure evidence makes
   the comparison decision-relevant.

Do not build a fleet scheduler before dispatch, retry, and integration are measured human
bottlenecks. Do not build an observability platform before a concrete investigation, evaluation, or
release decision consumes the trace.

---

## Appendix A — monthly scoreboard

| Metric | Decision it changes | Gaming risk |
|---|---|---|
| Accepted outcomes / 100 human-attention minutes | Whether the harness buys back judgment | Splitting or inflating “outcomes” |
| Manual retests and acceptance minutes / task | Whether packets and verifiers replace human repetition | Under-reporting informal checks |
| Escaped defects by consequence | Whether speed increases risk | Hiding near misses or changing severity |
| Rework/integration/rollback minutes | Whether parallelism and plans reduce churn | Counting only successful lanes |
| Machine-caught vs human-caught regressions | Whether feedback is moving into the harness | Easy checks crowding out meaningful gaps |
| Compute/token cost / accepted outcome | Whether routing and eval spend pay rent | Optimizing cost while quality falls |
| Improvement-case win rate | Whether meta-loops compound value | Proposer defines its own success |

Record the denominator and source. A methodology that cannot sit for its own eval is a story, not
an operating system.

## Appendix B — evidence limits

- LangChain’s four loops are a useful topology and product framing, not proof every agent needs all
  four or that more loops improve bad criteria.
- OpenAI and Anthropic engineering reports provide current implementation evidence, but are vendor
  case studies and research prototypes rather than universal controlled results.
- Model graders can share correlated errors with generators. Independent providers reduce some
  correlation but do not create ground truth; deterministic postconditions, human anchors, and
  abstention remain necessary.
  [ICML 2025 correlated-errors study](https://proceedings.mlr.press/v267/kim25e.html)
- Traces are liabilities as well as assets. Minimize, redact, separate metadata from payloads, and
  define access, retention, and deletion before collection.
- Canary and rollback cannot undo an irreversible side effect. T3 paths need deterministic
  pre-action gates, preview/shadow modes, or an explicit decision that compensation is impossible.

The proposed runtime contracts behind these rules live in
[Agent Anatomy v2](AGENT_ANATOMY_V2.md).
