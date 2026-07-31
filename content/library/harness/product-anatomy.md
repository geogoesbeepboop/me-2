---
title: Product Anatomy — the platform-scope design reference
collection: harness
source: ~/dev/agentic-harness/docs/PRODUCT_ANATOMY.md
sourceMtime: '2026-07-26T23:59:52.809Z'
sourceCommit: c90c827
syncedAt: '2026-07-31'
summary: >-
  Visual companion:
  <https://claude.ai/code/artifact/71d81606-c4a2-4578-a623-e11a5d6fc845> — this
  file is canonical; the visual renders it (docs/visuals/README.md).
contentHash: 'sha256:db20f58d39e801dd489e92f501fd04d12c768885af6ad008e0c55749866dffb4'
---
# Product Anatomy — the platform-scope design reference

*Visual companion: <https://claude.ai/code/artifact/71d81606-c4a2-4578-a623-e11a5d6fc845> —
this file is canonical; the visual renders it (`docs/visuals/README.md`).*

*The scope boundary in one line: **one agent, one demoable outcome → `AGENT_ANATOMY.md`; an
agent fleet plus deterministic services plus human surfaces → this doc.** Read it when planning
a product (Attest is the first at this scope), when a "which agent owns this?" question has no
answer, or when per-agent ceremony starts being applied to platform decisions and doesn't fit.
Companion docs: `AGENT_ANATOMY.md` (the single-agent reference), `OPERATING_MANUAL.md` (the
daily runbook), `MANUAL.md` (why the workflow works). Most sections here were extracted from
the retired `ROADMAP.md` (2026-07-25), which was this document waiting for a product to need
it — each deferred item keeps its trigger, and nothing in this file is protection until it is
installed.*

The thesis is the same one AGENT_ANATOMY serves — **probabilistic models propose, deterministic
systems constrain** — applied to a third system. A product at this scope composes three kinds of
parts: probabilistic agents, deterministic gates and services, and human-facing surfaces. The
twelve design questions survive the altitude change; their answers don't. The failure mode this
doc exists to prevent: planning a platform with single-agent material and never seeing the whole
elephant.

---

## 1. The altitude shift — the twelve questions at product scope

Same questions, re-asked at the higher altitude. The per-agent column is `AGENT_ANATOMY.md`
§1's job. The product column below is deliberately **questions, not answers**: with one product
at this scope, confident platform prescriptions would be exactly the un-receipted doctrine this
doc's charter forbids. Each question gets an owner and a per-product decision; where existing
material grounds it, the pointer is given. Attest answers first, and answers that prove out
graduate into this file with their receipts.

| # | Question | At agent scope (AGENT_ANATOMY §1) | The question at product scope |
|---|---|---|---|
| 1 | Outcome | One demoable/sellable result this agent owns | Which single sellable result does the *product* own, and which sub-outcome does each agent contribute to it? What justifies an agent whose sub-outcome no user-visible result depends on? |
| 2 | Runtime authorization | Which deterministic path owns each irreversible action | What owns consequential actions product-wide, and do any two agents hold independent paths to the same side effect? (`AGENT_ANATOMY.md` §2's deterministic-owner rule is the floor.) |
| 3 | Eval/dependency versions | Which L0–L3 layers apply; versions per result | What is in the eval portfolio (§3), and what set of versions moves together per release? |
| 4 | Loop and state | Gather → decide → act, exit conditions, retries | What is the cross-agent topology — handoffs, queues, task states (§4) — and who owns a task no agent is currently running? |
| 5 | Inputs and egress | Which inputs may be hostile; which channels act | Every agent-to-agent edge is also an input (peer output is untrusted — AGENT_ANATOMY Q7). What is the union egress list, and who audits it as one list? |
| 6 | Memory and retention | Who writes it, staleness, poisoning | Which stores are shared, who owns each, and what does one poisoned write reach? |
| 7 | Tools, credentials, authority | Sandbox/allowlist per agent; children inherit less | How are credentials issued across the fleet, and what is the union blast radius of every agent's grants? |
| 8 | Human involvement | Who approves what; graduation per action | Where do approvals consolidate, and is graduation policy set per product or per agent? |
| 9 | Budget and latency | Ceilings binding one execution tree | How do ceilings nest — can a fan-out that honors each child ceiling still breach the product's? Where are surface latency budgets allocated down? |
| 10 | Observability | One append-only trace per execution | How is one user-visible outcome reconstructed across agents, gates, and surfaces? (§2 carries the correlation framing and schema.) |
| 11 | Durability | Fresh process distinguishes 4 states | Where does task state live so that it outlives every agent (§4 task states)? |
| 12 | Failure and compensation | Idempotency, leases, undo per side effect | When undoing agent A's side effect requires agent B's context, who owns the compensation, and when is that decided? |

The test, unchanged from agent scope: a fresh builder answers these from the repository, runtime
policy, and trace — without asking the original author. Only now "the repository" is plural.

## 2. Tracing at product scale

At agent scope, question #10 asks for one append-only trace per execution. At product scale the
unit of tracing is the **user-visible outcome**: one correlation ID minted at the surface where
the request enters, propagated through every agent, deterministic gate, queue, and service it
touches, so a single outcome can be reconstructed end-to-end without knowing in advance which
agents participated.

Per hop, correlate: task/contract version and parent/child lane IDs; repo, base SHA, integrated
commit, environment fingerprint; requested and served model/provider/family, effort, prompt,
policy, and tool versions; tool calls, result hashes, retries, approvals, capability grants;
token classes, cache usage, spend, latency, queue time; build/eval/review results and artifact
pointers; release/canary/rollback state and accepted outcome.

Raw prompts, tool arguments, and results may contain source, secrets, personal data, or hostile
content. Keep sensitive payloads separate from low-risk metadata, redact by default, and define
retention before collecting everything. OpenTelemetry's GenAI semantic conventions are a portable
starting vocabulary:
[OpenTelemetry GenAI conventions](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/).

Two scope notes. The per-agent trace schema above is necessary but not sufficient — without the
correlation ID it produces N private diaries and no story. And spend attribution changes
direction: at agent scope you ask "what did this run cost"; at product scope you ask "what did
this *outcome* cost across every agent it touched," which is what makes a fan-out's economics
visible at all.

## 3. The eval portfolio — what "suite" means at product scope

"Eval suite" is a per-agent term. At product scope the object is a **portfolio**, with three
floors and a rollup:

1. **Per-agent suites.** Each agent keeps its own suite, held to the `/evals` contract (D1–D8 —
   the skill is the spec; this section deliberately does not restate it). Eval reliability
   operations — trials, flake classes, holdouts, judge calibration, saturation review — live in
   that contract, not here.
2. **Integration evals.** Cases that exercise a cross-agent path — a handoff, a shared store, an
   authorization request — where every participating agent can be individually green while the
   composition fails. These are the product's own regression tier; they live with the product,
   not inside any one agent's repo.
3. **Product outcome metrics.** The L3 layer at product altitude: shipped outputs, user feedback,
   incidents, cost-per-outcome. This is where "is the product good" is answered; no rollup of
   per-agent pass rates can answer it, because per-agent green does not compose into user value
   (see `AGENT_ANATOMY.md` §6, "what green means").

The **rollup already exists**: the nightly digest turning every repo's `.claude/evals.sh`
doorknob is the portfolio's floor-1 dashboard. Its lesson from the 07-25 fleet audit is the
portfolio rule: **membership is explicit and single-sourced.** Attest had the best eval machinery
in the fleet and was invisible to the operator because its scripts sat outside the doorknob
convention — a portfolio you have to remember to check is not a portfolio. One membership list
(today: `repos.txt` for the digest; the ladder table in `MANUAL.md` §1), every scorecard derived
from it, and a product that appears in one view but not another is a bug, not a nuance.

## 4. Fleet integration contract and task states

When multiple lanes regularly land concurrently, the integration owner:

1. Reads the diff and completion artifact.
2. Confirms the lane stayed inside its contract.
3. Refreshes the real target branch and records the actual integration base.
4. Rebases/merges in the declared order; resolves conflicts with the contract owner.
5. Runs the combined build/integration gate against the integrated tree.
6. Requests the review required by the risk tier.
7. Runs dry-run, canary, migration rehearsal, or post-merge observation where required.
8. Records integrated commit, evidence, review, rollback, and remaining risk.

A merge queue becomes worthwhile only after concurrent ready branches regularly contend;
latest-head revalidation is required before that scale.

For T2/T3 releases (model, prompt, policy, dependency, schema, and workflow changes are
releases): compare repeated offline evals with baseline; shadow without authority where possible;
canary on bounded users/data/spend; define soak time and rollback thresholds; promote an explicit
version/alias; preserve the last known good route.

**Task states — for when a tracker arrives:**

`proposed → ready → running → review → integrated → observed → done`

- `ready` means the contract and verifier exist.
- `review` means an executor stopped; it does not mean the task succeeded.
- `integrated` means the result passed against the actual target head.
- `observed` means the canary, dry run, or post-merge check ran where required.
- `done` means the outcome, not merely the implementation, was accepted.

`blocked` is an annotated side state with an owner and next event. A stalled chat is not task
state.

## 5. Multi-model control plane

Route selection is manual today. The installed environment exposes Claude Fable/Opus/Sonnet and
GPT-5.6 Sol/Terra/Luna model IDs, but there is no provider-neutral registry, requested-vs-served
provenance, qualified fallbacks, or automatic cross-provider review.

### 5.1 Candidate families (hypotheses, not routes)

- Anthropic: **Claude Fable 5** (most capable long-running class), **Opus 4.8** (high-capability
  collaboration/reasoning), **Sonnet 5** (economical agentic execution). See
  [Fable](https://www.anthropic.com/claude/fable),
  [Opus 4.8](https://www.anthropic.com/news/claude-opus-4-8),
  [Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5).
- OpenAI: **GPT-5.6 Sol** (flagship), **Terra** (balanced), **Luna** (fast/cost-efficient). See
  [GPT-5.6 Sol, Terra, and Luna](https://openai.com/index/previewing-gpt-5-6-sol/).

Do not promote a provider description into a permanent route without local task evidence.

### 5.2 Capability registry (per qualified route)

Exact requested model ID/provider/family; actual served model ID and routing disclosure;
supported tools/modalities/context/effort controls; data retention/residency and allowed data
classes; price, p50/p95 latency, error behavior, availability; eval results by task class with
dataset and prompt version; last-qualified date, known failure modes, eligible fallbacks. Stable
aliases (`implementation.default`, `review.high_risk`) resolve to a logged exact version.

### 5.3 Initial static routing policy

| Role | Initial candidates | Escalation/independence rule |
|---|---|---|
| Mechanical transformation | Deterministic script first; otherwise Luna | Escalate only after verifier failure |
| Research fan-out | Sonnet or Terra | 2–3 lanes only for separable research; frontier synthesis on conflict |
| Ordinary implementation | Sonnet or Terra, chosen by repo eval | Escalate to Opus/Sol after a failed bounded attempt |
| Architecture/planning | Opus or Sol | Fable for unusually broad, ambiguous, or persistent work |
| Long contained migration | Locally best qualified frontier model | Evidence checkpoints, hard tree budget, resumable artifacts |
| Review | Fresh-context opposite-provider model for T2/T3 | Anthropic implementation → qualified OpenAI reviewer, and vice versa |
| Judge/arbitrator | Strongest unused qualified provider or human | Invoke on disagreement/high risk; never authorize irreversible action alone |

Most tasks use one primary model and deterministic verification. Fable reviewing Sonnet is model
diversity, not provider independence.

### 5.4 Escalation triggers

Escalate capability only when: repeated verifier failure with distinct hypotheses exhausted;
cross-system ambiguity or high context load; T2/T3 risk; reviewer disagreement; or a frontier
route's expected value exceeds its added cost/latency. Model escalation does not expand tool
authority or budget.

### 5.5 Fallback policy

Never silently fall back. Retry only within bounded policy and only when side effects are
idempotent; use an alternate route only if it passed the task-class evals and data policy; record
requested and served routes plus the reason; pause or escalate when no qualified fallback exists.

### 5.6 Champion/challenger promotion

Start a task class on the strongest practical model to establish a quality ceiling. Replay or
shadow cheaper candidates on the same corpus. Promote a challenger only when it meets the
acceptance floor over repeated trials and improves a target constraint. Canary the route, retain
the old champion, make rollback explicit. OpenAI's Basis case study describes a similar
benchmark-driven approach: [Basis model routing](https://openai.com/index/basis/).

### 5.7 Requalification — on trigger, not calendar

Requalify when: a new model release is relevant to a qualified route; a route's eval or
cost/latency evidence degrades; a repeated escalation pattern appears; or a new task class has no
qualified route. Do not requalify on a schedule if neither the route nor the evidence changed.

## 6. Maturity modes

- **Mode 1 — lean conductor/executor (now).** One conductor, one implementation lane, optional
  read-only research, static model selection, local build gate, handoff. Breaks when ready work
  waits primarily on session management or integration rather than execution.
- **Mode 2 — review and evidence plane (next).** T2/T3 checklists, latest-main integration,
  independent review, trace schema, eval-flake operations, dry-run/canary/rollback, outcome
  metrics, model qualification. Breaks when task dispatch/retry/reconciliation becomes the
  recurring human bottleneck.
- **Mode 3 — task-driven fleet (later).** An issue/task system becomes the authoritative state
  machine; an orchestrator owns bounded concurrency, workspace isolation, retry, reconciliation,
  and operator-visible status. OpenAI's Symphony is a current example:
  [Symphony orchestration](https://openai.com/index/open-source-codex-orchestration-symphony/).
  Do not build the fleet scheduler before measured queueing and missed work justify it.

## 7. Deferred machinery — build on trigger, in this order

Proven-useful sequence for a product climbing the modes (from the retired roadmap; each item
waits for its observed condition, never the calendar):

1. Use S0–S3 classification when a digest is red; update notification/digest tooling only after
   the manual policy proves useful.
2. Run the first worktree task with explicit tool/credential scope and fresh-context review.
3. Add latest-main integration evidence and rollback fields to T2+ plans/handoffs.
4. Add minimal JSONL trace/provenance and repeated-trial/flake classification to one agent.
5. Create a static multi-model registry and qualify two implementation routes plus one
   cross-provider reviewer on real tasks.
6. Add CI/PR enforcement when a repository is shared or deployed.
7. Move public-library intake toward explicit allowlisting/default-private publication (the
   target policy lives in `OPERATING_MANUAL.md` §8).
8. Add product/delivery metrics to the retro; keep harness metrics subordinate.

LATER — each requires an observed trigger:

- **Merge queue:** after ready branches regularly contend.
- **Approvals dashboard:** after approvals are missed or exceed the response SLO.
- **Adaptive model router:** after static routes accumulate labeled outcome/cost data.
- **Full OpenTelemetry backend, SBOM, signed attestations:** for shared/production release risk.
  For shared or production releases meanwhile, progressively add locked dependencies,
  dependency/secret/code scanning, and trace-to-commit linkage — no attestation platform for
  local prototypes, no consequential artifacts with zero provenance.
- **Shared agent-core library:** only when a fix must propagate to a third consumer and there is
  a safe update/migration mechanism. Copying security machinery without patch propagation creates
  forks that age independently.

## 8. Anti-patterns at product scope

Each with its receipt — most from the 2026-07-25 fleet eval audit:

- **The invisible suite.** The best machinery in the fleet, unreachable by the rollup: scripts
  off the doorknob convention, absent from the digest (Attest, 07-25 audit). A portfolio you
  have to remember to check is not a portfolio (§3).
- **Two membership lists.** A product present in one view and missing from another — Attest in
  the audit but not the ladder until 07-25. Membership is explicit and single-sourced (§3).
- **Per-agent green read as product health.** Floor-1 pass rates don't compose into user value;
  that's what floors 2 and 3 exist to measure (§3).
- **A fan-out that honors every child ceiling and still breaches the product's.** Budgets nest
  or they don't bind (§1, Q9).
- **Silent fallback between routes.** Never fall back without recording requested vs served and
  the reason (§5.5).
- **Building the fleet scheduler before measured queueing justifies it** (§6, mode 3's own
  warning).

## 9. Evidence and limits

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
changes outcomes is a candidate for deletion — this file included.
