---
title: Multi-Agent Hosting & Architecture Plan
collection: multi-agent
source: ~/dev/multi-agent-docs/README.md
sourceMtime: '2026-06-04T22:07:11.406Z'
syncedAt: '2026-07-09'
summary: >-
  How to run grocery-buddy, jim-agent, procurement-agent, and dj-agent reliably,
  cheaply, and credibly — for one user today, scalable to an enterprise
  reference architecture on paper.  Author's const…
contentHash: 'sha256:6a10523afa6a745f552055d637c811eb7eb80d0f635430b20e048306fed1f63e'
---
# Multi-Agent Hosting & Architecture Plan

> How to run `grocery-buddy`, `jim-agent`, `procurement-agent`, and `dj-agent`
> reliably, cheaply, and credibly — for one user today, scalable to an
> enterprise reference architecture on paper.
>
> **Author's constraints (chosen 2026-06-04):** cheapest credible box (Hetzner),
> optimize for *lowest babysitting*, money agents run *live* (real USDC / real
> card rails). Everything below is shaped by those three choices.

---

## TL;DR

You don't have a "run 4 agents 24/7" problem. You have:

1. **2 always-on services** (`jim-agent` marketplace + monitors, `grocery-buddy` worker + webhook),
2. **1 event-driven service** (`procurement-agent`, idle until a webhook/schedule wakes it),
3. **1 batch/triggered job** (`dj-agent`, compute-heavy, should *never* run 24/7), and
4. **1 shared spine** (`agent-core`) that you're currently *not* reusing consistently — the only thing in this whole setup a senior engineer would actually frown at.

The plan is a **single small Hetzner box that holds nothing precious**, running each agent as a container, with **state, durability, and secrets pushed out to managed/free tiers**, public traffic through a **Cloudflare Tunnel** (no open ports, IP hidden), and a **hardened money path** for the two financial agents. You can `terraform destroy` the box and rebuild it in ~10 minutes with zero data loss. That property — disposable compute, durable state elsewhere — is what reconciles "cheap VPS I own" with "lowest babysitting."

**Starting cost: ~$50–85/mo** (box + managed Postgres + LLM tokens; Temporal on free credits). **~$135–185/mo** if you keep Temporal Cloud after credits. A documented **enterprise reference tier** (which you describe but don't run) lands at ~$300–800/mo.

**Do not scrap your code for openclaw / hermes / opencode.** They're a different category (multi-channel chat assistants and coding agents). Your differentiator is *domain-specific autonomous-commerce agents*. The real move is consolidating the four onto your own `agent-core` spine. Details in [04](04-harness-and-frameworks.md).

---

## The two-scope question, answered directly

You asked whether this is (a) credible to engineers/enterprises and (b) practical for personal use. These are not in tension if you frame the deployment as **two tiers of the same logical design**:

| | **Personal tier (what you run)** | **Enterprise tier (what you document)** |
|---|---|---|
| Audience | You + your partner | Coinbase / Visa / Bloomberg interview |
| Compute | 1 Hetzner CAX21 (~$9/mo) | ECS Fargate / EKS, multi-AZ |
| Postgres | Supabase Pro (managed, $25/mo) | RDS Multi-AZ + PITR |
| Durability | Temporal Cloud (free credits) or self-host trimmed | Temporal Cloud Business + Elasticsearch |
| Ingress | Cloudflare Tunnel | ALB + WAF + multi-region |
| Secrets | Doppler/Infisical free tier | Vault / AWS Secrets Manager + rotation |
| Money custody | CDP MPC hot wallet, low float | HSM / qualified custodian, segregation |
| Cost | ~$50–185/mo | ~$300–800+/mo |

> The credibility doesn't come from running the expensive version. **It comes
> from running the cheap version *and being able to draw the expensive one on a
> whiteboard, explaining exactly which line items you'd swap and why.*** That's
> the difference between "resume-driven over-engineering" and "senior judgment."
> See [07-enterprise-reference-architecture.md](07-enterprise-reference-architecture.md).

---

## Headline decisions

| # | Decision | Choice | Rationale | Detail |
|---|----------|--------|-----------|--------|
| D1 | Where it runs | **1× Hetzner CAX21** (4 vCPU / 8 GB ARM, ~$9/mo) | Cheapest credible always-on; 8 GB gives Chromium headroom | [05](05-hosting-and-ops.md) |
| D2 | Box philosophy | **Disposable / stateless** | Reconciles "VPS I own" with "lowest babysitting"; rebuildable in ~10 min | [02](02-architecture.md), [05](05-hosting-and-ops.md) |
| D3 | Postgres | **Supabase Pro** (managed, shared, $25/mo) | No DB babysitting, no auto-pause, pgvector for dj+jim | [02](02-architecture.md) |
| D4 | Durable execution | **Temporal Cloud on free credits → reassess at exhaustion** | Zero ops now; defensible enterprise name; self-host-trimmed is the $0 fallback | [03](03-orchestration-and-scale.md) |
| D5 | Per-agent orchestration | grocery+procurement → Temporal; jim → keep async scheduler; dj → on-demand job | Right-size to each agent's actual shape | [03](03-orchestration-and-scale.md) |
| D6 | Agent harness | **Consolidate all 4 onto `agent-core` + Claude Agent SDK for the loop** | Stop maintaining 3–4 copies of model-calling/tracing/budget | [04](04-harness-and-frameworks.md) |
| D7 | openclaw/hermes/opencode | **Study, don't adopt.** Keep your domain agents | Different category; your edge is autonomous commerce | [04](04-harness-and-frameworks.md) |
| D8 | Ingress | **Cloudflare Tunnel** (no inbound ports) | Hides box IP, free TLS, DDoS protection — matters with money live | [05](05-hosting-and-ops.md) |
| D9 | Secrets | **Doppler/Infisical free tier, injected at runtime** | No plaintext `.env` on a box holding mainnet keys | [05](05-hosting-and-ops.md) |
| D10 | jim mainnet custody | **Coinbase CDP MPC wallet + low hot float + sweeps** | Don't keep a raw mainnet private key on a 24/7 box | [05](05-hosting-and-ops.md) |

---

## Cost at a glance

| Line item | Start (Temporal on credits) | Steady (Temporal Cloud paid) | Cost-saver (self-host all) |
|---|---|---|---|
| Hetzner CAX21 box | $9 | $9 | $9 |
| Managed Postgres (Supabase Pro) | $25 | $25 | $0 (on-box) |
| Temporal | $0 (credits) | $100 | $0 (self-host trimmed) |
| Langfuse | $0 (Hobby) | $0 | $0 |
| Cloudflare + domain | ~$1 | ~$1 | ~$1 |
| Secrets / monitoring | $0 (free tiers) | $0 | $0 |
| LLM tokens (4 agents, personal) | $15–50 | $15–50 | $15–50 |
| Money rails (live) | cents–$5 | cents–$5 | cents–$5 |
| **Total** | **~$50–90/mo** | **~$150–190/mo** | **~$25–65/mo** |

Full model, token math, and scenarios in [06-cost-projections.md](06-cost-projections.md).

---

## Document index

| Doc | What it covers |
|---|---|
| [01-agents.md](01-agents.md) | Inventory of the 4 agents + `agent-core`; runtime profiles; the shared-vs-per-agent matrix |
| [02-architecture.md](02-architecture.md) | Target topology (personal tier), layer map, networking, data, the disposable-box model |
| [03-orchestration-and-scale.md](03-orchestration-and-scale.md) | Durable execution decision; **personal-scale vs enterprise-scale orchestration**; per-agent choices |
| [04-harness-and-frameworks.md](04-harness-and-frameworks.md) | Build vs adopt vs scrap; **openclaw/hermes/opencode verdict**; `agent-core` as the spine |
| [05-hosting-and-ops.md](05-hosting-and-ops.md) | The box, hardening, containers, Chromium gotchas, secrets, money-path security, backups, monitoring |
| [06-cost-projections.md](06-cost-projections.md) | Detailed cost model, token projections, scenarios, "willing to spend" tables |
| [07-enterprise-reference-architecture.md](07-enterprise-reference-architecture.md) | The "how a real company does it" tier + interview talking points |
| [08-implementation-roadmap.md](08-implementation-roadmap.md) | Phased plan from today to live-24/7, with checklists |

---

## The one-paragraph version (for when someone asks)

> "I run four autonomous agents — grocery replenishment, an x402 financial-research
> marketplace, a card-rail procurement agent, and a music/DJ agent — on a single
> ARM VPS. The box is deliberately disposable: all durable state is in managed
> Postgres, orchestration is Temporal, secrets come from a secrets manager at
> runtime, and public traffic is tunneled through Cloudflare so there are no open
> ports and the origin IP is hidden. The two money-handling agents never let the
> model touch funds — spend authority is enforced by deterministic code and by the
> card issuer / an MPC wallet with a capped hot float. It costs me well under
> $200/month. At enterprise scale the *logical* design is identical; I'd swap the
> single box for Fargate behind an ALB, Supabase for RDS Multi-AZ, and add secret
> rotation and a qualified custodian — same diagram, different SLAs."
