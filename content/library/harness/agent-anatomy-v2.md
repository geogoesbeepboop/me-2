---
title: Agent Anatomy v2 — the runtime design reference
collection: harness
source: ~/dev/agentic-harness/docs/AGENT_ANATOMY_V2.md
sourceMtime: '2026-07-15T06:55:12.692Z'
syncedAt: '2026-07-18'
summary: >-
  Comparison draft, 2026-07-14. This is a proposed successor to Agent Anatomy,
  not installed policy. It expands the current twelve-question review into
  implementable contracts while preserving the th…
contentHash: 'sha256:918b5117e9c236033edb97bc7b367b4c124e0e1e900d511119862b8655874be7'
---
# Agent Anatomy v2 — the runtime design reference

_Comparison draft, 2026-07-14. This is a proposed successor to
[Agent Anatomy](AGENT_ANATOMY.md), not installed policy. It expands the current twelve-question
review into implementable contracts while preserving the thesis that consequential authority has a
deterministic owner. Read [The Manual v2](MANUAL_V2.md) for the development workflow._

The runtime thesis:

> An AI agent is a probabilistic decision component inside a versioned system of context, state,
> tools, authority, verification, containment, evidence, and release control. The model may propose
> an action; a deterministic executor decides whether the exact action may happen now.

Deterministic does not mean correct. It means inspectable, testable, and unable to reinterpret its
policy in the moment. The policy, implementation, and evidence can still be wrong and need their
own tests, review, and release controls.

---

## What changed from the current anatomy

| Current anatomy | v2 proposal | Why |
|---|---|---|
| One T0–T3 risk tier | Separate development `change_risk` from runtime `action_class` | A safe code diff can enable a dangerous action; a large refactor can preserve zero runtime authority. |
| Children inherit parent authority or less | Children receive zero ambient authority; parents mint explicit attenuated grants | “Inherit” can forward credentials and create a confused deputy. |
| Loop/state compressed into one design question | Four-loop topology + reusable loop contract + explicit task state machine | Triggers, verification, resume, retry, and mutation have different failure semantics. |
| Hostile inputs and egress | Source-to-sink threat model | An allowed destination can still exfiltrate protected data through an allowed operation. |
| Human involvement and graduation | Approval receipt bound to an exact proposed action | Approval without principal, arguments, policy, scope, expiry, and idempotency is ambiguous authority. |
| Memory types and poisoning | State/checkpoint/memory separation + versioned memory record | Durable workflow truth must not live in advisory model memory. |
| Three verification surfaces and L0–L3 evals | Retained, plus evaluator contract and object/measurement/promotion separation | A system must not redefine its own grader or promotion threshold. |
| Trace field list | State transitions, delegation, memory lineage, authorization/action receipts, schema version | Observability must reconstruct who could do what and whether an external effect committed. |
| Shadow/canary/rollback | Complete release bundle and independent improvement promotion | A model alias alone is not the deployed agent. |

---

## 1. Two systems and two risk axes

Do not confuse:

1. **The development harness** — how agents research, code, test, review, and integrate changes.
2. **The runtime agent** — how the shipped system accepts events, uses information, calls tools,
   and affects the world.

They share patterns but not authority. A build gate can block a commit; it cannot authorize a bank
transfer. A runtime action gate can authorize one transfer; it cannot prove the feature was
implemented safely.

### 1.1 Development change risk

Use T0–T3 from the manuals to decide planning, review, integration, and release ceremony for a
change to the system.

### 1.2 Runtime action class

Classify every tool operation independently:

| Class | Effect | Minimum runtime control |
|---|---|---|
| **A0 — observe/compute** | Read or compute without durable external mutation | Scoped read capability, data policy, egress control, trace as appropriate |
| **A1 — prepare** | Produce a draft, plan, preview, or transaction intent without committing it | Schema validation, provenance, postcondition check; no commit credential in the model toolset |
| **A2 — bounded commit** | Durable but bounded/reversible write with audit and tested undo | Deterministic authorization, idempotency, receipt, postcondition verification, compensation owner |
| **A3 — consequential commit** | Money, external send/publication, deletion, consent, credentials, destructive migration, or other irreversible/high-trust effect | Deterministic authorization + meaningful approval/policy mandate + enforced containment + preview/shadow where possible + incident/compensation decision |

Risk follows the exact operation and resource, not the tool name. A database tool may perform A0
query, A1 migration preview, A2 reversible record update, or A3 destructive deletion.

---

## 2. Three planes

Version three planes independently:

| Plane | Components | Authority |
|---|---|---|
| **Object plane** | model, prompt/policy, context, tools, memory/retrieval, orchestration | Does the work and proposes actions |
| **Measurement plane** | task, dataset, environment, grader, trace, uncertainty model | Determines what evidence says happened |
| **Promotion plane** | thresholds, reviewers, release aliases, canary, abort, rollback | Decides what version receives traffic and authority |

For T2/T3 changes and A2/A3 actions, the object plane may not write the measurement or promotion
plane. A change that touches the system and its definition of passing is two changes. Split it, or
require frozen human-labelled anchors, old/new dual scoring, and explicit adjudication.

This is the structural defense against reward hacking: the optimizer does not own its exam,
promotion decision, or rollback pointer. Anthropic’s reward-hacking research shows that optimizing
against hackable graders can generalize into broader undesirable behavior.
[Emergent misalignment from reward hacking](https://www.anthropic.com/research/emergent-misalignment-reward-hacking)

---

## 3. Four loops are topology, not maturity

| Loop | Runtime purpose | Return arrow changes |
|---|---|---|
| **Agent loop** | Gather context, decide, and invoke tools until an exit state | Working state and proposed/committed outcome |
| **Verification loop** | Check an output, postcondition, policy, or outcome; feed bounded repair when appropriate | The current attempt or its disposition |
| **Event loop** | Turn authenticated messages, schedules, webhooks, queues, or state changes into runs | The population and timing of executions |
| **Improvement loop** | Convert labelled traces, corrections, and incidents into evaluated releases | The versioned agent bundle |

An agent can need strong verification without scheduling. A scheduled job may be entirely
deterministic. An improvement loop is not mature unless its evidence, promotion, and rollback
contracts are mature. LangChain’s four-loop article is the vocabulary source, not proof that every
product needs all four. [The Art of Loop Engineering](https://www.langchain.com/blog/the-art-of-loop-engineering)

### 3.1 Loop contract

Define every active loop independently:

```yaml
loop:
  id:
  purpose:
  trigger_and_owner:
  accepted_event_versions:
  input_trust_classes:
  authoritative_state:
  checkpoint_and_resume:
  tools_and_capability_grants:
  verifier_and_feedback_target:
  exit_states:
  escalation_states:
  retryable_failures:
  attempt_budget:
  deadline_and_idle_timeout:
  token_spend_tool_concurrency_budgets:
  deduplication_and_idempotency:
  trace_retention_and_redaction:
  mutable_surfaces:
  proposer_approver_deployer_rollback_owner:
  kill_switch:
```

A blank is an assigned design hole, not a surprise saved for production.

---

## 4. The complete agent bundle

The deployable unit is not “the prompt” or “the model.” Pin a compatible bundle:

```yaml
agent_bundle:
  bundle_id:
  outcome_and_non_goals:
  model_provider_route_and_fallbacks:
  system_prompt_and_policy:
  tool_registry_and_schemas:
  authorization_and_guardrail_policies:
  context_sources_and_retrieval_config:
  memory_schema_and_migrations:
  orchestration_and_state_schema:
  evaluator_dataset_and_environment_versions:
  runtime_and_dependency_versions:
  telemetry_schema_version:
  data_classes_and_retention:
  owner_and_last_known_good:
```

Changing a prompt, tool description, permission, memory index, route, grader, dataset, state
machine, or dependency can change behavior. Release and provenance must be able to name the exact
combination that produced an outcome.

---

## 5. Instruction, guardrail, approval, authorization, containment

Use the terms precisely:

| Control | Job | May be probabilistic? | Enforcement point |
|---|---|---:|---|
| **Instruction** | Shape proposed behavior | Yes | Model context |
| **Guardrail** | Detect, reject, or transform suspicious input/output/tool use | Often | Input, output, workflow, or tool boundary |
| **Approval** | Record a human or policy decision about one proposed action | Judgment may be involved | Durable approval service/record |
| **Authorization** | Decide whether this principal may perform this exact action now | No for A2/A3 | Tool gateway or executor |
| **Containment** | Bound maximum reachable damage if other controls fail | No | Sandbox, filesystem, network, credential broker, spend/tenant boundary |
| **Verification** | Determine whether an output/action met its postcondition | Mixed | After proposal or execution |

Guardrails are not universal authorization. In the OpenAI Agents SDK, agent-level input
guardrails run on the first agent and output guardrails on the final agent; tool coverage requires
tool guardrails. [OpenAI Agents SDK guardrails](https://openai.github.io/openai-agents-python/guardrails/)

Approval is not containment. Ask for fewer, higher-information approvals; use least privilege and
containment to make routine actions safe. Anthropic reports approval fatigue and an exfiltration
path through an allowed domain in its containment work, illustrating why destination allowlists do
not authorize arbitrary operations. [How Anthropic contains Claude](https://www.anthropic.com/engineering/how-we-contain-claude)

### 5.1 Consequential action path

Prefer:

```text
query → prepare intent → authorize exact intent → commit once → verify postcondition
                                                     ↘ receipt / reconcile / compensate
```

The model normally receives query and prepare tools. A deterministic executor owns commit. The
authorization decision binds the normalized arguments, resource/tenant, principal and delegation
chain, policy version, approval receipt, expiry, and idempotency key.

---

## 6. Tool contract and action evidence

### 6.1 Tool contract

```yaml
tool:
  id: crm.refund.v3
  owner:
  schema_version:
  action_class: A0 | A1 | A2 | A3
  input_and_output_schema:
  preconditions:
  postconditions:
  credential_audience_and_scopes:
  authorization_policy:
  approval_policy:
  dry_run_or_preview:
  idempotency_semantics:
  timeout_and_retryable_errors:
  rate_and_concurrency_limits:
  egress_and_data_classes:
  receipt:
  compensation:
  failure_owner:
  verifier_cases:
```

Tool descriptions, server metadata, results, and peer-agent messages are untrusted inputs. The
registry pins expected identity/schema; the executor validates runtime calls against local policy.

### 6.2 Action intent and receipt

```yaml
action:
  action_id:
  run_and_attempt_id:
  principal_and_delegation_chain:
  user_intent_reference:
  tool_operation_and_version:
  tenant_resource_and_data_class:
  normalized_arguments_hash:
  precondition_snapshot:
  policy_version_and_authorization_decision:
  approval_receipt_and_expiry:
  idempotency_key:
  commit_receipt:
  postcondition_result:
  compensation_status:
  final_state:
```

This distinguishes “the model requested it,” “policy authorized it,” “a human approved it,” and
“the external system actually committed it.” Do not collapse those into a single success flag.

---

## 7. State, durability, retry, concurrency, and cancellation

Recommended runtime lifecycle:

```text
RECEIVED
  → VALIDATING
  → READY
  → RUNNING
  → WAITING_INPUT | WAITING_AUTH
  → PREPARED
  → COMMITTING
  → VERIFYING
  → SUCCEEDED

Any active state
  → FAILED | CANCELED
  → COMPENSATING → COMPENSATED

COMMITTING with indeterminate external result
  → EFFECT_UNKNOWN → RECONCILING
```

“Canceled” is not proof that a side effect did not happen. Durable systems may replay work before
a checkpoint; side effects require idempotency keys, receipts, and reconciliation. LangGraph warns
that work before an interrupt may rerun. [LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)

Distinguish:

| Operation | Meaning |
|---|---|
| **Infrastructure retry** | Same action and idempotency key after a classified transient failure |
| **Model repair** | New proposal after structured verifier feedback; new attempt ID |
| **Business retry** | Domain policy authorizes another business operation |
| **Reconciliation** | Determine whether an uncertain side effect committed |
| **Compensation** | A new authorized action that mitigates a committed effect; not a retry |

Concurrency requires a declared policy: enqueue, reject, coalesce, supersede, interrupt, or allow
parallel execution. Use leases/locks with expiry and fencing for shared resources. Persist event ID,
idempotency key, attempt, lease, state transition, and result pointer.

For event delivery, assume at least once unless proven otherwise. A2A’s task lifecycle treats
cancellation as best effort and push delivery as potentially duplicated; receivers must be
idempotent. [A2A specification](https://a2a-protocol.org/latest/specification/)

---

## 8. Human oversight and approval receipts

Put humans at consequential boundaries:

| Boundary | Human contribution |
|---|---|
| Agent/tool | Authorize an A2/A3 action when policy requires judgment |
| Verification | Grade or adjudicate semantic/high-consequence ambiguity; calibrate model graders |
| Output/application | Approve an externally delivered result when release itself is consequential |
| Improvement/promotion | Approve a new bundle, measurement change, authority expansion, or rollback threshold |

Every approval records:

```yaml
approval:
  approver_identity_and_role:
  principal_and_action_id:
  exact operation_resource_and_arguments_hash:
  policy_and_agent_bundle_version:
  evidence_presented:
  decision_and_conditions:
  issued_at_and_expires_at:
  idempotency_key:
  revocation_or_use_status:
```

Approval for “send the email” is not approval for a regenerated email, different recipient, later
price, or second attempt. Bind the receipt to the exact intent. A timeout or missing approver fails
closed on required A2/A3 paths.

Graduation from approval-required to notify-after or autonomous-within-budget needs observed
evidence, bounded authority, and a demotion trigger. A model release alone does not graduate an
action.

---

## 9. State is authoritative; memory is advisory

Separate:

| Store | Purpose | Authority |
|---|---|---|
| **Workflow state/checkpoint** | Resume the current execution and reconstruct side-effect status | Authoritative for the state machine when validated |
| **External system of record** | Business truth such as ledger, order, consent, or publication state | Authoritative within domain policy |
| **Working memory** | Temporary task context | Advisory; expires with the run unless explicitly promoted |
| **Episodic/semantic/procedural memory** | Cross-run examples, facts, preferences, or procedures | Advisory input with provenance and trust policy |

Memory invariants:

1. Memory never grants authority.
2. Summarizing untrusted material does not raise its trust level.
3. Durable state and side-effect receipts do not live only in model memory.
4. Every durable memory item has tenant/subject/purpose scope, provenance, writer, trust label,
   sensitivity, expiry, validator, supersession, and revocation state.
5. Retrieval re-checks authorization, staleness, and trust at read time.

```yaml
memory:
  record_id:
  tenant_subject_and_purpose:
  type: working | episodic | semantic | procedural
  writer_identity:
  source_uri_and_hash:
  trust_label_and_sensitivity:
  created_at_and_expires_at:
  validation_status_and_validator_version:
  supersedes:
  use_constraints:
  content_reference:
  quarantine_or_revocation_state:
```

LangGraph’s distinction between thread checkpoints and cross-thread stores is a useful
implementation analogy. [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence)

Test persistent poisoning, stale instructions, cross-tenant retrieval, deletion, supersession,
revocation, and malicious content that attempts to turn memory into policy.

---

## 10. Multi-agent delegation has default-zero authority

Replace ambient inheritance with:

> Children receive no ambient authority. A parent may create an explicit child grant that is a
> strict subset of the parent’s currently valid grant. The executor validates the full delegation
> chain at action time. Model escalation, handoff, retry, or re-planning never expands authority.

```yaml
delegation:
  parent_and_child_identity:
  parent_grant_reference:
  task_and_purpose:
  allowed_actions_and_resources:
  allowed_data_classes_and_egress:
  expires_at:
  spend_token_tool_concurrency_limits:
  max_depth:
  redelegation_allowed:
  revocation_reference:
  issued_by:
  trace_id:
```

Root budgets are allocated, not copied, to children. A parent with a $10 budget cannot give three
children $10 each. Track remaining tree-wide spend, tokens, tools, concurrency, and depth at every
spawn.

Do not forward bearer credentials or tokens through an agent chain. MCP’s security guidance
forbids token passthrough and recommends audience-bound, incrementally scoped authorization because
ambient tokens create confused-deputy and accountability failures.
[MCP security best practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices),
[MCP authorization](https://modelcontextprotocol.io/specification/draft/basic/authorization)

Authentication proves which peer spoke; local authorization still decides whether its request may
act on this tenant, resource, and purpose. Peer output remains untrusted content.

---

## 11. Threat model from source to sink

Prompt injection matters when an untrusted source can influence a dangerous sink. Model the path,
not only the input:

| Source | Trust | Instruction channel | Protected data reachable | Dangerous sink | Enforcement | Recovery test |
|---|---|---|---|---|---|---|
| Email, web, file | Untrusted | Indirect prompt injection | Workspace/customer data | Send, upload, write, publish | Data-flow policy + action gateway + containment | Planted exfiltration and encoded variants |
| Tool/MCP metadata or result | Untrusted | Description/result text | Tool credentials and context | Tool selection/execution | Pinned registry + broker + local schema/policy | Tool substitution/confused deputy |
| Memory/retrieval | Trust of least-trusted writer | Retrieved fact/procedure | Historical user data | Future decision/action | Write admission + read screening + provenance | Persistent poison/stale memory |
| Child/peer agent | Untrusted principal/content | Handoff/request | Delegated context | Delegated tool | Attenuated grant + chain validation | Authority laundering/redelegation |
| Webhook/event | External | Payload fields | Task state | Background run | Authentication, schema, dedupe, rate limit | Replay, stale event, SSRF |
| Human-authored config | Privileged but fallible | Prompt/policy/tool schema | Entire agent bundle | Promotion/authority | Review, versioning, held-out tests, rollback | Malicious or mistaken config |

Destination allowlisting is insufficient. Bind source trust, data class, operation, destination,
tenant, and purpose. Mediate egress at the tool/network boundary and minimize what sensitive data
ever enters model context.

OpenAI’s current prompt-injection guidance likewise frames the problem as untrusted sources
connected to consequential sinks and recommends constraining impact even when detection fails.
[Designing agents to resist prompt injection](https://openai.com/index/designing-agents-to-resist-prompt-injection/)

Test bypass and exfiltration through every permitted egress path, including URLs, filenames,
tool arguments, rendered content, logs, child-agent messages, and memory writes.

---

## 12. Budget and latency are tree-wide policy

Specify separately:

- whole-tree spend, token, turn, tool-call, and concurrency ceilings;
- per-step tool timeout, model timeout, queue deadline, idle timeout, and overall deadline;
- maximum active children and delegation depth;
- allocation and return of unused child budgets;
- qualified fallback/degraded routes and prohibited silent fallback;
- budget-exhaustion and deadline-exhaustion states;
- verifier and authorization timeout behavior;
- cost and latency recorded against accepted outcome.

An A2/A3 action fails closed when its required authorization or verifier times out. A low-risk
answer may degrade to a qualified cheaper route if the task contract permits it. Model escalation
never expands authority or budget.

Current agent runtimes expose turns, usage limits, timeouts, and local-tool concurrency as distinct
controls, reinforcing that one `max_steps` field is not a budget contract.
[OpenAI Agents SDK — running agents](https://openai.github.io/openai-agents-python/running_agents/)

Anthropic’s multi-agent research used substantially more tokens and worked best on genuinely
parallel tasks, supporting “fan-out must pay rent” as a local design rule rather than a default
architecture. [Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)

---

## 13. Observability and provenance

An append-only trace should reconstruct:

- event ID, schema, authentication result, dedupe key, trigger provenance, and correlation IDs;
- every task-state transition with timestamp and reason;
- requested/served/fallback model route, prompt/policy, tools, dependencies, environment, and
  complete bundle version;
- context source IDs, memory record IDs, writer/trust/validation labels, and retrieval decisions;
- child spawn, delegation grant/revocation, and remaining root/child budgets;
- tool intent, normalized argument hash, authorization decision, approval receipt, idempotency key,
  commit receipt, postcondition, reconciliation, and compensation;
- verifier/dataset/environment versions, score/confidence/abstention, artifacts, and human decision;
- token classes, spend, latency, queue time, retries, canary/rollback, and user-visible outcome;
- trace coverage status: what was not captured and why.

Do not require hidden chain-of-thought. Record decisions, evidence, policy outcomes, state
transitions, and concise model-provided rationale when available.

Keep low-risk metadata separate from sensitive prompts, tool arguments, results, source, secrets,
and personal data. Redact/minimize by default; define access, sampling, retention, deletion, and
incident handling before collection. OpenTelemetry warns that GenAI prompts, retrieval queries,
and tool arguments/results may contain sensitive data; its conventions are still evolving, so pin
the semantic-convention version.
[OpenTelemetry GenAI observability](https://opentelemetry.io/blog/2026/genai-observability/)

---

## 14. Verification and evaluator trust

Retain three distinct surfaces:

| Surface | Question | Failure behavior |
|---|---|---|
| **Build gate** | Is the implementation locally healthy? | Block integration under development policy |
| **Behavior eval** | Does the agent produce acceptable behavior/outcomes across cases and trials? | Report/regress, repair on visible cases, quarantine or block promotion by policy |
| **Runtime action gate** | May this exact consequential action happen now? | Fail closed or escalate before commit |

### Eval layers

- **L0 — verifier tests:** deterministic invariants and planted failures proving the gate catches
  what it claims.
- **L1 — offline replay:** recorded model/tool/environment results without live authority.
- **L2 — controlled live evaluation:** repeated versioned trials with target, regression, and
  frozen promotion evidence; cost/latency included.
- **L3 — production sampling:** real outcomes, corrections, traces, incidents, A/B or shadow
  evidence, and periodic domain-expert review.

Grade resulting environment state and user outcome whenever possible. Grade trajectory when policy,
authority, provenance, or efficiency constrains the allowed path. Valid reasoning/tool paths may
vary even when the result is correct.

### Evaluator contract

```yaml
verifier:
  target_and_postcondition:
  assertions_or_rubric:
  type: deterministic | model | human | composite
  immutable_version:
  evidence_required:
  confidence_and_abstention:
  human_calibration_set:
  reference_near_miss_and_negative_controls:
  known_blind_spots:
  object_plane_access_to_internals:
  blocking_authority:
  timeout_and_failure_behavior:
  owner:
```

A model grader must have an abstain/`Unknown` outcome. Track false pass, false fail, and abstention
against human anchors. Use multiple trials where nondeterminism matters. Preserve private/rotating
promotion holdouts and keep the optimizer blind to them. Anthropic’s current guide provides the
most complete public treatment of these eval design issues.
[Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

Green means only that the declared checks passed in the recorded environment. It does not prove
the criteria were complete, the grader independent, the data uncontaminated, the integration safe,
the action authorized, or the product valuable.

---

## 15. Release, rollback, and improvement

### Release manifest

```yaml
release:
  bundle_id:
  changed_surfaces_and_risk:
  model_and_provider_route:
  prompt_policy_tools_permissions:
  memory_state_and_data_migrations:
  evaluator_dataset_environment_versions:
  runtime_dependency_and_telemetry_versions:
  offline_target_regression_holdout_results:
  cost_and_latency_delta:
  shadow_authority: none
  canary_slice_and_action_budget:
  promotion_and_abort_thresholds:
  observation_window:
  last_known_good:
  compatibility_and_compensation_plan:
  owner_and_kill_switch:
```

Model, prompt, policy, tool, permission, schema, memory, grader, dataset, route, orchestration, and
dependency changes are releases when they can change behavior or authority.

Use:

```text
production evidence
→ labelled candidate cases
→ explicit hypothesis and smallest change
→ frozen baseline + target/regression/held-out comparison
→ independent review
→ zero-authority shadow/dry-run
→ bounded canary
→ observe
→ promote or roll back
```

The improvement agent may propose findings, cases, and a candidate patch. It may not directly
change production authorization, tool scopes, memory policy, graders, promotion thresholds,
release aliases, or rollback pointers. Grader changes release independently after calibration
against frozen human anchors.

LangSmith Engine and OpenAI’s tax-agent case study are useful current examples of trace/correction
evidence becoming evals and reviewable changes; neither implies that autonomous self-modification
is safe. [LangSmith Engine](https://docs.langchain.com/langsmith/engine),
[Self-improving tax agents](https://openai.com/index/building-self-improving-tax-agents-with-codex/)

Canary and rollback cannot undo every A3 action. Use no-authority shadow/preview and deterministic
pre-action authorization for irreversible paths; record when compensation is impossible.

---

## 16. Compact design review

A fresh builder should answer these from the repository, policies, schemas, and traces without the
original author:

### Product and loops

1. What single observable outcome does the agent own, and what are its non-goals?
2. Which agent, verification, event, and improvement loops exist, and what is each loop contract?
3. Which complete bundle version produced the outcome, and what qualifies a release or rollback?

### Authority and trust

4. What are every tool operation’s A0–A3 action class, pre/postconditions, credentials, egress,
   authorization, approval, receipt, and compensation?
5. Where are instruction, guardrail, authorization, containment, and verification enforced—and
   which planted failures prove those boundaries?
6. Which untrusted sources can reach which sensitive data and dangerous sinks?
7. Which humans approve what exact intents, with what evidence, expiry, and demotion trigger?

### State and knowledge

8. What state machine distinguishes not-started, in-progress, waiting, prepared, committing,
   effect-unknown, reconciled, succeeded, failed, canceled, and compensated?
9. Which workflow state, external records, and memory persist; who writes them; how are trust,
   staleness, tenancy, validation, supersession, revocation, and deletion enforced?
10. Which event, retry, replay, dedupe, idempotency, lease, concurrency, cancellation, and recovery
    semantics apply?

### Delegation and economics

11. Which explicit attenuated grant does every child receive; how is the chain validated; which
    root budgets are allocated; can authority be re-delegated?
12. Which per-step and whole-tree time, token, spend, tool, queue, and concurrency ceilings apply,
    and what state results at exhaustion?

### Evidence and evolution

13. Which trace reconstructs trigger, state, context/memory lineage, model route, delegation,
    authorization, approvals, actions, receipts, cost, verification, and user-visible outcome?
14. How is every verifier calibrated, versioned, challenged, allowed to abstain, and kept
    independent from the object and promotion planes?
15. How does a labelled production failure become a regression case, evaluated bundle, shadow,
    bounded canary, promotion/rollback decision, and incident learning artifact?

The review is complete only when the answers point to executable policies, schemas, tests, and
receipts—not just prose.

---

## Appendix — minimum build order

1. Define outcome/non-goals and enumerate A0–A3 operations.
2. Split consequential tools into query/prepare/commit; put commit behind deterministic
   authorization and scoped credentials.
3. Implement state machine, action IDs, idempotency, receipts, effect-unknown reconciliation, and
   compensation decisions before adding retries.
4. Define the loop/event contract and smallest useful trace with redaction/retention.
5. Add L0 planted failures, L1 replay, and visible development cases.
6. Add approval receipts only where bounded authority and evidence leave a real judgment decision.
7. Add explicit child delegation only when a single loop cannot meet the outcome efficiently.
8. Add controlled live evals, frozen promotion evidence, and release bundle/versioning before
   canarying authority.
9. Add production sampling and trace-to-eval improvement only when an owner can label findings and
   safely promote/rollback changes.

Do not start with autonomous improvement, broad credentials, ambient child authority, or a fleet
orchestrator. Start with one outcome, one explicit state machine, one constrained action path, and
evidence that the boundary fails safely.
