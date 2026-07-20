---
title: Roadmap — deferred platform machinery and its triggers
collection: harness
source: ~/dev/agentic-harness/docs/ROADMAP.md
sourceMtime: '2026-07-14T02:30:29.303Z'
sourceCommit: cd639d2
syncedAt: '2026-07-20'
summary: >-
  Extracted from the v3 operating manual (2026-07-13). Everything here was NEXT
  or LATER: designed on paper, not installed. It was moved out of the daily
  runbook because reading a platform spec every…
contentHash: 'sha256:d8fa4e75b07836c9ffa2715b68b1de1effbbec5d1c6bcff9c648bc73249776d9'
---
# Roadmap — deferred platform machinery and its triggers

*Extracted from the v3 operating manual (2026-07-13). Everything here was `NEXT` or `LATER`:
designed on paper, not installed. It was moved out of the daily runbook because reading a
platform spec every morning taxed attention without changing behavior — but none of it is
abandoned. Each item keeps its trigger: the observed condition that justifies building it.
Do not describe anything in this file as protection. A written policy is not an enforcement
boundary.*

---

## 1. Adoption order (build and prove in this sequence)

1. ~~Adopt Task Envelope v1 manually on one real feature.~~ **Superseded 2026-07-13:** the
   envelope is demoted to the T2/T3 checklist (`AGENT_ANATOMY.md` §3.1); daily alignment is the
   plan-mode contract.
2. Use S0–S3 classification when a digest is red; update notification/digest tooling only after
   the manual policy proves useful.
3. Run the first worktree task with explicit tool/credential scope and fresh-context review.
4. Add latest-main integration evidence and rollback fields to T2+ plans/handoffs.
5. Add minimal JSONL trace/provenance and repeated-trial/flake classification to one agent.
6. Create a static multi-model registry and qualify two implementation routes plus one
   cross-provider reviewer on real tasks.
7. Add CI/PR enforcement when a repository is shared or deployed.
8. Move public-library intake toward explicit allowlisting/default-private publication (§7).
9. Add product/delivery metrics to the retro; keep harness metrics subordinate.

New since 2026-07-13:

10. **Mobile UI verification** — trigger: manual mobile testing reappears as a top babysit-log
    item after web verification lands. Start with build + launch + screenshot smoke on simulator
    (`xcrun simctl`), grow into Maestro flows for the 2–3 most-tested journeys only.
11. **Remote session experiment** — trigger: a self-contained Next.js project and one T1 feature
    to delegate end-to-end. Remote sandboxes give real containment (the honest answer to
    "worktree is not sandbox") plus preinstalled Chromium for browser verification; costs are
    drawn from existing subscription usage. Promote to default-for-web-lanes only if the first
    evidence packets come back clean.
12. **Portable deep-* skills** — trigger: running `/deep-plan`, `/deep-challenge`, or
    `/deep-brainstorm` anywhere but the primary Mac. Their skill files hardcode
    `/Users/geoandr/...` paths (install.sh rewrites them in copy mode only, with a
    macOS-specific `sed -i ''`) and lean on `~/dev/docs/DEEP_SKILLS.md`, which lives outside
    this repo.

## 2. Task states — for when a tracker arrives

`proposed → ready → running → review → integrated → observed → done`

- `ready` means the contract and verifier exist.
- `review` means an executor stopped; it does not mean the task succeeded.
- `integrated` means the result passed against the actual target head.
- `observed` means the canary, dry run, or post-merge check ran where required.
- `done` means the outcome, not merely the implementation, was accepted.

`blocked` is an annotated side state with an owner and next event. A stalled chat is not task
state.

## 3. Eval reliability operations

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

Also not yet live in the nightly loop: content-addressed skipping of unchanged repos,
repeated-trial eval handling, and live-model canaries.

## 4. Fleet integration contract

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

## 6. Minimum trace schema

Correlate: task/contract version and parent/child lane IDs; repo, base SHA, integrated commit,
environment fingerprint; requested and served model/provider/family, effort, prompt, policy, and
tool versions; tool calls, result hashes, retries, approvals, capability grants; token classes,
cache usage, spend, latency, queue time; build/eval/review results and artifact pointers;
release/canary/rollback state and accepted outcome.

Raw prompts, tool arguments, and results may contain source, secrets, personal data, or hostile
content. Keep sensitive payloads separate from low-risk metadata, redact by default, and define
retention before collecting everything. OpenTelemetry's GenAI semantic conventions are a portable
starting vocabulary:
[OpenTelemetry GenAI conventions](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/).

## 7. Public library — target publication policy

Current behavior (LIVE, an exception to the target): the personal site mirrors selected source
directories daily, default-public with deny rules, private markers, scanning, and no settle
window. A saved half-draft may publish at the next sync. See the runbook's caution for the
day-to-day rules.

**Target:** move new library sources to default-private or explicit public allowlisting, with a
preview, provenance, and fast takedown. Until then: mark drafts private before first save in a
mirrored tree; keep career/resume/babysit/secret/personal-data paths behind hard deny walls;
sample the actual public shelf periodically; treat any visibility automation change as T3
publication work.

## 8. LATER — require an observed trigger

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

## 9. Maturity modes

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

## 10. Evidence and limits

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
