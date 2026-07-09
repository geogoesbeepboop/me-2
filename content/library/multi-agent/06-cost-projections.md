---
title: 06 — Cost Projections
collection: multi-agent
source: ~/dev/multi-agent-docs/06-cost-projections.md
sourceMtime: '2026-06-04T22:13:20.233Z'
syncedAt: '2026-07-09'
summary: >-
  You said you're willing to spend but want projections, not vibes. Here's the
  model, the per-agent token math, three scenarios, and the levers that move the
  bill.
contentHash: 'sha256:fda3e848870b09ec8906853bdc38b1f549b9d0e91226ec06ec20935480fa3420'
---
# 06 — Cost Projections

You said you're willing to spend but want projections, not vibes. Here's the model,
the per-agent token math, three scenarios, and the levers that move the bill.

> **Pricing basis (verify before relying):** approximate 2026 Anthropic list prices —
> Haiku 4.5 ≈ $1/M in, $5/M out · Sonnet 4.6 ≈ $3/M in, $15/M out · Opus 4.8 ≈
> $15/M in, $75/M out · prompt cache reads ≈ 90% off input. `agent-core` already
> does tier-routing + caching, so these are achievable, not aspirational.

---

## Two cost buckets

1. **Fixed infrastructure** — predictable, flat. The box, Postgres, Temporal, domain.
2. **Variable usage** — LLM tokens + money-rail fees. Scales with how hard you use the agents.

---

## Fixed infrastructure

| Line item | Cost/mo | Notes |
|---|---|---|
| Hetzner CAX21 (8 GB ARM) + IPv4 + snapshots | **~$9** | The whole compute footprint |
| Supabase Pro (managed Postgres + pgvector, shared) | **$25** | No auto-pause, automated backups/PITR. The "lowest babysitting" line item. |
| Temporal Cloud | **$0 → $100** | $0 on $1,000 free credits (months); $100/mo floor after. **This is the swing line.** |
| Langfuse Hobby | **$0** | 50k units/mo free |
| Cloudflare (Tunnel + DNS + TLS) | **$0** | Free tier |
| Domain | **~$1** | ~$10–12/yr at-cost registrar |
| Secrets (Doppler/Infisical free) | **$0** | |
| Monitoring (healthchecks.io + UptimeRobot free) | **$0** | |
| **Fixed subtotal** | **~$35 (credits) / ~$135 (Temporal paid)** | |

---

## Variable: LLM tokens, per agent (personal use)

Estimates for **low / typical / heavy** personal usage. "Typical" = you and your
partner actually using these daily-ish.

| Agent | Model mix | Per-invocation | Frequency (typical) | Low | Typical | Heavy |
|---|---|---|---|---|---|---|
| **grocery-buddy** | Sonnet reason + Haiku match + browser DOM tokens | ~$0.15–0.40/run | 1 run/day | $4 | **$9** | $15 |
| **jim-agent** | Sonnet synth + optional bull/bear/judge debate + Haiku judge | ~$0.10–0.50/research; monitors mostly deterministic | a few research/day + monitors | $5 | **$18** | $40 |
| **procurement-agent** | Haiku route (cheap) + Sonnet source (only on buy) + Opus escalate (rare) | ~$0.02 route / ~$0.10 source | a few buys/week | $2 | **$6** | $15 |
| **dj-agent** | Sonnet "hard" architect + selector w/ revisions; **curator = no LLM** | ~$0.05–0.20/set | a few sets/week | $1 | **$4** | $10 |
| **LLM subtotal** | | | | **~$12** | **~$37** | **~$80** |

Notes that matter:
- **dj's expensive part (CLAP embedding) costs $0 in LLM** — it's local torch inference, not API. Its LLM use is tiny.
- **procurement is cheap** because it's event-driven and Haiku does the routing; Sonnet/Opus fire only on an actual purchase/escalation.
- **jim is the swingiest** because debate mode (bull + bear + judge) triples synthesis tokens. Turn debate off for cheap runs; on for the ones you care about.
- **Caching is doing real work** — the system prompts and tool schemas are stable across runs; cache reads at ~10% of input price keep these numbers down. Without caching, roughly double them.

---

## Variable: money-rail fees (live)

| Rail | Fee shape | Personal/mo |
|---|---|---|
| jim x402 / Base mainnet | gas (cents on Base) + USDC you spend on upstream data (capped $0.10/query) | **cents–$5** |
| jim **revenue** (sells research) | USDC *in* per sale | **offset / possibly net-positive** |
| procurement Privacy.com | free virtual cards; you spend what you buy (not a fee) | **$0 fees** |
| procurement Lithic ASA | sandbox free; live = per-card/interchange, minimal at personal volume | **~$0–few** |

> jim is the one agent that can **earn**. At personal scale that's noise, but it's a
> real talking point: "the financial-research agent is designed to run at a positive
> margin — it tracks price_out − data_cost − inference_cost per query." Net token
> cost for jim could be lower than the table if it makes any sales.

---

## Three total scenarios

| | **Start** (credits, typical use) | **Steady** (Temporal paid, typical) | **Cost-saver** (self-host all, typical) |
|---|---|---|---|
| Fixed infra | ~$35 | ~$135 | **~$10** (box + domain only; Postgres + Temporal on-box) |
| LLM tokens | ~$37 | ~$37 | ~$37 |
| Money rails | ~$3 | ~$3 | ~$3 |
| **Total** | **~$75/mo** | **~$175/mo** | **~$50/mo** |
| Babysitting | low | lowest | **medium** (you own Postgres backups + Temporal) |

**Recommendation given your priorities:** run **Start** (~$75/mo) now. When Temporal
credits run low, you'll have months of real usage data — decide then whether the
$100/mo for managed Temporal is worth it (for "lowest babysitting," it usually is) or
whether to flip Temporal (and optionally Postgres) onto the box to land near
**~$50/mo**. You're not locked in either way.

> All three scenarios are **well under what "willing to spend on my agents"
> typically means.** The dominant cost is your attention, which is exactly why the
> plan optimizes for babysitting over squeezing the last $25.

---

## What moves the bill (levers, biggest first)

1. **Temporal Cloud paid vs not** (±$100/mo) — the single biggest lever. Credits delay the decision.
2. **Managed vs on-box Postgres** (±$25/mo) — managed buys you zero-babysitting backups; on-box buys you $25 and a chore.
3. **jim debate mode** (±$10–20/mo) — triples synthesis tokens; gate it to high-value runs.
4. **dj run cadence** — generation is cheap; ingest is free (no LLM). Barely moves.
5. **Heavy vs typical usage** (±$40/mo) — you control this directly.

---

## 12-month projection (the realistic path)

| Months | State | Est. total |
|---|---|---|
| 1–2 | Stand-up; light use; Temporal credits | ~$50/mo |
| 3–6 | Daily use; money live; credits still covering Temporal | ~$75/mo |
| 6–9 | Credits near exhaustion → decision point | ~$75 → $175 or $50 |
| 9–12 | Steady state (your call on Temporal) | **$50–175/mo** |
| **Year 1 total** | | **~$700–1,500** |

So: **roughly $60–125/month averaged over year one**, your choice of where in that
band via the two big levers. That's the real "willing to spend" number.

---

## Enterprise tier (for contrast — you document, don't pay this)

So you can state the delta credibly:

| Line item | Enterprise | vs personal |
|---|---|---|
| Compute | ECS Fargate / EKS multi-AZ | $150–400 vs $9 |
| Postgres | RDS Multi-AZ + PITR | $50–200 vs $25 |
| Temporal | Cloud Business (≥$500 floor) or platform-team cluster | $500+ vs $0–100 |
| Ingress | ALB + WAF + multi-region | $30–100 vs $0 |
| Secrets | Vault / Secrets Manager + rotation | $20–50 vs $0 |
| Observability | self-host or Datadog | $100–500 vs $0 |
| **Total** | | **~$850–1,750+/mo** vs **~$50–175/mo** |

The point of this table isn't to run it — it's to show, on a whiteboard, that you
know **which line items scale and by how much**, and that you deliberately chose the
$75/mo version for a one-user system. See [07](07-enterprise-reference-architecture.md).
