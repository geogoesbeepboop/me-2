---
title: 07 — Enterprise Reference Architecture
collection: multi-agent
source: ~/dev/multi-agent-docs/07-enterprise-reference-architecture.md
sourceMtime: '2026-06-04T22:14:13.109Z'
syncedAt: '2026-07-09'
summary: >-
  This is the tier you document and can whiteboard, not the one you run. Its job
  is to answer the first of your two questions — "if I talk about this to
  engineers, managers, enterprises, is it suffic…
contentHash: 'sha256:d86a318ab9e92e9df4c4d9ad9499143b61bd7b02cef199871311d16c17f139ac'
---
# 07 — Enterprise Reference Architecture

This is the tier you **document and can whiteboard**, not the one you run. Its job is
to answer the first of your two questions — *"if I talk about this to engineers,
managers, enterprises, is it sufficient to show I've thought about agent infra
professionally?"* — with **yes**, by making the personal tier's enterprise lineage
explicit.

> The thesis of this whole plan: **credibility ≠ running the expensive version. It =
> running the cheap version while proving you can derive the expensive one and know
> exactly which knobs change.** This doc is that proof.

---

## Same logical design, different SLAs

The agents don't change. The *substrate* under them changes. Lay them side by side:

```
                 PERSONAL TIER (run)                ENTERPRISE TIER (document)
  ┌──────────────────────────────────┐   ┌──────────────────────────────────────────┐
  edge      Cloudflare Tunnel              │   ALB + WAF + Shield, multi-region, mTLS   │
  compute   1× Hetzner CAX21 (Docker)      │   ECS Fargate / EKS, autoscaling, multi-AZ │
  state     Supabase Pro (single PG)       │   RDS/Aurora Multi-AZ + read replicas, PITR│
  durable   Temporal Cloud (free→$100)     │   Temporal Cloud Business+ (ES, multi-rgn) │
  reasoning Anthropic SDK / LangGraph      │   same + model gateway, fallback providers │
  secrets   Doppler/Infisical free         │   Vault / AWS Secrets Mgr + auto-rotation  │
  money     CDP MPC float + issuer caps     │   HSM / qualified custodian, segregation  │
  observ.   Langfuse Hobby + UptimeRobot    │   Datadog/OTel, SLOs, on-call, audit trail │
  identity  you                            │   SSO/RBAC, per-tenant isolation, SOC2     │
  IaC       cloud-init + compose            │   Terraform + CI/CD + policy-as-code       │
  └──────────────────────────────────┘   └──────────────────────────────────────────┘
```

**Every row is a one-line swap, not a redesign.** That's the property that makes the
personal build credible: it's the enterprise architecture with the HA/compliance/
scale line items dialed to "one user."

---

## The deltas that actually define "enterprise" (and why you skip each)

| Concern | Enterprise must-have | Why you skip it at 1 user | What you'd add first if scaling |
|---|---|---|---|
| **High availability** | Multi-AZ, active-active, DR drills | One box outage = you wait 10 min; no SLA owed | Multi-AZ Postgres, then 2nd compute node |
| **Horizontal scale** | Autoscaling fleets, queue depth triggers | You peak at a few workflows/min | Fargate service autoscaling on Temporal task-queue depth |
| **Multi-tenancy** | Namespace/DB-per-tenant, RBAC, network isolation | One tenant (you) | Temporal namespace-per-tenant; Postgres schema/DB-per-tenant (you already isolate by schema!) |
| **Compliance** | SOC2/PCI, audit logs, data residency | No external users, no auditor | Immutable audit log (procurement already has one), retention policies, access logs |
| **Secret rotation** | Automated, short-lived, HSM-backed | Manual rotation is fine | You already use a secrets manager — turn on rotation |
| **Money custody** | HSM, qualified custodian, fund segregation | MPC wallet + issuer caps + low float is proportionate | Custodian integration; multi-sig; treasury controls |
| **Observability** | SLOs, distributed tracing, on-call, paging tiers | Langfuse + Telegram + a dead-man's-switch | OTel everywhere → Datadog; define SLOs; PagerDuty |
| **Model ops** | Gateway, multi-provider fallback, eval gates in CI | One provider, evals run ad hoc | Model gateway (fallback Anthropic↔Bedrock), eval suite as a merge gate |

Notice how many enterprise concerns your agents **already gesture at**: procurement
has an immutable audit log and a deterministic policy gate; jim has a sourcing gate +
margin ledger + a mainnet readiness preflight; grocery has idempotency keys + an
approval gate. **You designed the controls; the enterprise version just adds HA and
auditors around them.** That's a strong story.

---

## The 2026 production pattern you're mirroring

The canonical enterprise agent stack in 2026 is **agent-reasoning layer (LangGraph or
the OpenAI/Claude Agent SDK) on top of Temporal for durability**, behind a managed
data tier — the exact division of labor used by OpenAI (Agents SDK + Temporal
durability integration), Netflix, and the big fintechs. Your grocery/procurement
design — **Anthropic SDK reasoning *inside* Temporal activities, deterministic gates
outside the model** — is a single-node instance of precisely that pattern. When you
say "this scales to the standard production topology," you're not hand-waving; the
shape is already right.

---

## Why the money agents are your sharpest credibility asset

For a Coinbase/Visa/Bloomberg audience, the two financial agents demonstrate the
thing those companies care most about: **agentic systems that touch money without
letting the model touch money.**

- **procurement-agent** is a clean articulation of OWASP LLM-agent risk #1 (excessive agency): reasoning is untrusted model output; *authority* is deterministic code + the card issuer. The model proposes; code and rails dispose. That's a sentence a Visa architect nods at.
- **jim-agent** is a working **agent-to-agent commerce** system over x402 — it *pays* for data and *gets paid* for research, tracks margin, and refuses to emit an uncited number. That's the agentic-commerce thesis Coinbase is betting on, implemented.
- Both keep **spend caps as defense-in-depth** (model gate → code gate → issuer/MPC cap → daily cap → cost alert). Layered controls are the language of financial-infra review.

> Lead with these two in any conversation. The grocery and DJ agents prove breadth
> (autonomous web automation; local-ML + LLM hybrid); the money agents prove the
> thing that gets you hired in fintech.

---

## Talking points (memorize these)

1. **"I right-sized, deliberately."** "Full Temporal cluster + multi-AZ is overkill for one user, so I run managed Temporal on free credits and reserve durable execution for the two agents with human-approval waits and exactly-once money ops. Here's the exact line where I'd add Elasticsearch and multi-region." → demonstrates judgment, not just capability.
2. **"The model never touches money."** Walk the procurement gate and jim's sourcing gate. → demonstrates security-first agentic design.
3. **"The box is cattle, not a pet."** Disposable compute, durable state elsewhere, rebuild in 10 minutes from IaC + a secrets manager. → demonstrates ops maturity.
4. **"I evaluated the field."** "OpenClaw and Hermes productized the generic assistant spine; I didn't adopt them because my agents are domain-specific commerce systems. I consolidated my own thin substrate instead and use Temporal/pgvector/Langfuse for the hard 70%." → demonstrates you survey before you build.
5. **"Same diagram, different SLAs."** Show the two-column table above. → demonstrates you understand the personal↔enterprise mapping, which is the whole point.

---

## What would make it *more* enterprise-credible (optional, high-leverage)

If you want to push the credibility further without running the expensive tier:

- **Write 3–5 ADRs** at the multi-agent level (this docs folder is the start). "Why Temporal Cloud over self-host," "why one shared substrate over per-agent harnesses," "why MPC over a raw key." ADRs are the single highest-signal artifact for senior reviewers; your agents already use them internally.
- **Put the deploy in Terraform** (even just the `hcloud_server` + Cloudflare DNS). "It's all IaC" is a free credibility point and makes the disposable-box claim real.
- **Stand up the eval suites as CI gates.** grocery, jim, and dj already emit evals (precision/recall, factuality, set-acceptance). Running them in CI before deploy is the "I gate on evals" story.
- **One architecture diagram per agent + this system diagram**, kept current. You already have per-agent ARCHITECTURE.md / SYSTEM_REFERENCE.md files — this folder is the system-level peer.
