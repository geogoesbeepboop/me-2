---
title: Agent Anatomy — the design reference
collection: harness
source: ~/dev/agentic-harness/docs/AGENT_ANATOMY.md
sourceMtime: '2026-07-14T02:30:29.302Z'
sourceCommit: cd639d2
syncedAt: '2026-07-19'
summary: >-
  The timeless agent-design material extracted from the v3 operating manual
  (2026-07-13) so the daily runbook could get short. This is product-design
  knowledge, not daily process: read it when design…
contentHash: 'sha256:7c02765ce41896d582e54e40f84ead8e0a0a56d88b38a934858f63b523883b2e'
---
# Agent Anatomy — the design reference

*The timeless agent-design material extracted from the v3 operating manual (2026-07-13) so the
daily runbook could get short. This is product-design knowledge, not daily process: read it when
designing or reviewing an agent, when scoping risky work, or when `/new-agent` and `/hack` point
you here. Companion docs: `OPERATING_MANUAL.md` (the daily runbook), `ROADMAP.md` (deferred
platform machinery), `CLAUDE_CODE_BIBLE.md` (the Claude-specific reference).*

The thesis everything below serves: **probabilistic models propose, deterministic systems
constrain.** This applies to two different systems — the development harness (how agents build
software) and the runtime agent architecture (how built agents act in the world) — with different
gates and failure modes. Don't confuse them.

---

## 1. The twelve design questions

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

## 2. Runtime authority stays deterministic

Money, publication, consent, deletion, deployment, external messages, and other consequential side
effects must have a deterministic owner. A model may recommend the action; it must not be the
final allow/deny authority. This rule does not imply that all development checks should be
non-blocking — build and integration gates may block a commit or merge because their purpose is
code health (see §4 below for the three surfaces).

Retries after side effects require idempotency keys and leases. Do not retry a possibly completed
side effect without durable state proving what happened. When the side effect cannot be reversed,
the absence of compensation is part of the risk decision, not an omitted field.

## 3. Risk tiers — scale ceremony to blast radius

| Tier | Typical work | Minimum control |
|---|---|---|
| **T0 — local/reversible** | Formatting, docs, obvious mechanical change | Direct execution, deterministic check if available |
| **T1 — shared/reversible** | Ordinary feature or refactor | Plan-mode contract, build gate, self-review |
| **T2 — consequential** | Cross-module behavior, data migration, auth, model/prompt route | T2/T3 checklist (§3.1), independent review, latest-main integration, rollback/dry run |
| **T3 — irreversible/high-trust** | Spend, send, publish, delete, consent, production credentials | Enforced sandbox/capabilities, deterministic runtime gate, human or policy approval, canary/soak, incident owner |

Risk is based on blast radius, not code size. A three-line permission change may be T3; a large
local refactor may be T1.

### 3.1 The T2/T3 checklist (formerly the Task Envelope)

For everyday T0/T1 work, the plan-mode contract (outcome / non-goals / acceptance evidence — see
the runbook) is the whole ceremony. When work is genuinely consequential or irreversible, walk
this fuller checklist before execution. Ambiguity here is a design hole to resolve or assign, not
a field to skip.

| Field | Question it answers |
|---|---|
| `outcome` | What observable result should become true? |
| `non_goals` | What must not be expanded into this task? |
| `acceptance` | Which commands, scenarios, traces, or observations prove success? |
| `risk_tier` / `data_class` | How much control is required; may the task see personal/secret/regulated data? |
| `base` | Which repo, branch/base SHA, environment, and dependencies are assumed? |
| `contracts` | Which schemas, interfaces, invariants, and files must remain stable? |
| `tools_and_egress` | What may the executor read, write, call, publish, or message? |
| `integration` | Who owns merge order, target-head validation, and conflicts? |
| `rollback` | How is the change disabled, reverted, compensated, or retracted? |
| `budgets` | Token, spend, wall-clock, retry, and concurrency ceilings for the whole tree. |
| `done` | Which state transition closes the task: reviewed, integrated, observed, or shipped? |

## 4. The three verification surfaces

Three different things get called "the gate." Use precise names:

| Surface | Purpose | Example | Blocking behavior |
|---|---|---|---|
| **Build gate** | Prove local code-health properties | `.claude/gate.sh`: syntax, lint, types, fast tests | Blocks commit when installed |
| **Behavior eval** | Measure probabilistic or end-to-end quality | replay dataset, rubric grader, browser scenario | Usually reports/regresses; may quarantine a route |
| **Runtime action gate** | Own authorization for a consequential side effect | spend cap, consent check, publication mandate | Fails closed before the action |

A build gate should never be mistaken for authorization, and a runtime action gate does not prove
the implementation is generally correct.

## 5. Eval layers

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
seed/trial, and scorer version belong in the result. Current Anthropic guidance similarly combines
automated evals, production monitoring, transcript review, and periodic human calibration rather
than trusting one score:
[Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).

## 6. What green means

Green means the checks that ran passed in the environment in which they ran. It does not prove:

- The acceptance criteria were complete.
- The tests are independent of the implementation error.
- Two branches integrate cleanly.
- The latest target head behaves the same as the lane base.
- Production data or provider behavior matches fixtures.
- The change is secure, useful, maintainable, or reversible.

Treat green as scoped evidence, then apply review and rollout controls proportional to task risk.

## 7. Fail-open versus fail-closed

Convenience hooks (format, session banner, notification, secret/bash guards) are useful local
guardrails and intentionally fail open. They reduce accidents; they are not security boundaries.

| Control | Appropriate failure behavior |
|---|---|
| Formatting, session banner, notification | Fail open; log missing convenience |
| Commit build gate | Fail closed for normal commits, with an explicit audited override |
| Production credential issuance | Fail closed |
| Runtime spend/send/publish/delete authorization | Fail closed |
| Network egress containing private data | Default deny or mediated allowlist for T3 |

Do not tell a collaborator "secrets cannot leak" because a fail-open regex hook exists.

## 8. Worktree is not sandbox

A worktree isolates checkout files and branches. It may still share the host, home directory, Git
metadata, caches, processes, ports, network, credentials, and external services. T2/T3 execution
needs an explicit containment mechanism: container/VM/OS sandbox, filesystem scope, credential
broker, network policy, or equivalent. (A remote/cloud session sandbox is one honest answer.)

Copying a broad `.env` into every worktree expands authority. Prefer short-lived, task-specific
credentials outside the worker filesystem, exposed through constrained tools or a proxy.
