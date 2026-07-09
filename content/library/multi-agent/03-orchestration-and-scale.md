---
title: 03 — Orchestration & The Scale Question
collection: multi-agent
source: ~/dev/multi-agent-docs/03-orchestration-and-scale.md
sourceMtime: '2026-06-04T22:10:06.326Z'
syncedAt: '2026-07-09'
summary: >-
  You asked for "the distinction between an orchestration layer at scale in an
  enterprise setting vs. an orchestration layer in a me-and-my-partner setting."
  This doc is the answer.
contentHash: 'sha256:5ec40b1548173a6dc714348cedc3481caa0ae6f9a0cc7c4f996da42f8a94d15d'
---
# 03 — Orchestration & The Scale Question

> You asked for "the distinction between an orchestration layer at scale in an
> enterprise setting vs. an orchestration layer in a me-and-my-partner setting."
> This doc is the answer.

---

## First: what "orchestration" actually means here

There are **two different layers** people lump under "orchestration," and conflating
them is the source of most confusion:

| Layer | Question it answers | Your tools |
|---|---|---|
| **Agent loop** (a.k.a. the harness) | "What does the model do *this turn* — which tool, then what?" | Anthropic SDK / Claude Agent SDK / LangGraph. Covered in [04](04-harness-and-frameworks.md). |
| **Durable execution / workflow** | "How does a multi-step process survive crashes, retries, day-long waits, and run exactly-once?" | **Temporal** (or DBOS / Hatchet / cron). This doc. |

This doc is about the **durable-execution layer**. Your agents need it because they
have three properties that plain cron + a queue can't safely handle:

1. **Long human-in-the-loop waits** — grocery's 24 h approval gate; procurement's approval timer. The process must sleep through restarts.
2. **Exactly-once money/cart ops** — procurement activating a card; grocery's purchase idempotency key; jim recording a settled sale. Double-execution is a real-world bug with real-world cost.
3. **Retries over flaky I/O** — Amazon scraping, LLM calls, The Graph buys. Automatic backoff beats hand-rolled try/except.

A queue moves data; a workflow engine *knows where you are, what's done, what's
pending, and what to retry.* You genuinely have multi-step processes — so a
durable layer is justified. The only question is **how heavy** it should be.

---

## The honest take: is self-hosted Temporal overkill for you?

**On pure utility, yes.** Temporal's headline value — distributed correctness across
many teams/services, sagas, 10k–1M workflows/sec, multi-region, leader election — is
wasted on one user running a few workflows a day. None of that is your bottleneck.

**But the *useful subset* (durable HITL waits, auto-retries, full replay of a run) is
real and you do want it.** And there's a second, legitimate reason to keep Temporal:
it's the **de-facto enterprise standard for agent durability** (OpenAI, Netflix,
JPMorgan; $300M Series D at $5B in Feb 2026; OpenAI Agents SDK durability
integration). For a portfolio aimed at Coinbase/Visa/Bloomberg, running it — *and
being able to defend right-sizing it* — is a credible signal.

So the move isn't "drop Temporal" or "run Temporal like a FAANG." It's **run a
right-sized Temporal and say out loud where the line is.**

---

## Decision: Temporal Cloud on free credits → reassess (D4)

Given **lowest babysitting** + **willing to spend** + **money live (correctness
matters)**:

### Primary: Temporal Cloud, starting on the free credits

- **$1,000 trial credits** (and **$6,000 startup credits** if you ever incorporate with <$30M funding). At your volume — a few hundred workflows/day, tens of "Actions" each → low single-digit millions of Actions/month at most — credits last **many months**.
- **Zero Temporal ops.** No cluster, no Postgres-for-Temporal, no Elasticsearch JVM to babysit. This is the single biggest "lowest babysitting" win available — Temporal self-hosting's main tax (Elasticsearch memory, the dev-only `auto-setup` image you're currently on) simply disappears.
- **The reassessment point:** when credits run out, Temporal Cloud's floor is **"greater of $100/mo or 5% of usage"** = effectively **$100/mo** at your scale. At that moment you make an explicit, documented call:
  - keep paying $100/mo (fine, you're "willing to spend"; cleanest), **or**
  - flip to **self-hosted-trimmed** Temporal on the box for $0 (below).

> Wiring up Temporal Cloud is *itself* a credibility move — it shows you understand
> the managed-vs-self-hosted economics, not just that you can run a docker-compose.

### Documented fallback: self-hosted Temporal, trimmed

If/when you want $0, run Temporal on the box but **not the way you do now**:

- **Delete Elasticsearch.** Use **Postgres-backed Advanced Visibility** (Postgres 12+). This removes the heaviest, most OOM-prone component while keeping UI search/filter. Your current `docker-compose.yml` uses `temporalio/auto-setup` (which doesn't include ES — good) but is the **dev image**; for a real runtime, provision the schema once, then run the plain `temporalio/server` image against your **managed** Supabase Postgres (not on-box disk — disposable-box principle).
- Net footprint: ~1–2 GB RAM for Temporal, persistence in Supabase. Keeps all your existing code.

### The even-lighter option (know it exists, probably don't need it)

For a single-user system, a **Postgres-backed durable-execution *library*** — **DBOS
Transact (Python)** or Armin Ronacher's "absurd workflows" pattern — gives you durable
steps, retries, crash-resume, and HITL (a status row you await) with **zero extra
infrastructure**, on the Postgres you already run. It's the answer a skeptical senior
engineer would *respect* for one user. **Why it's not the primary here:** your
grocery + procurement code is already written against Temporal's API, and your
portfolio benefits from the Temporal name. Ripping out working Temporal code to save
$100/mo on a personal project is itself questionable judgment. Keep DBOS in your back
pocket as the "if I were optimizing purely for minimalism, here's what I'd do"
talking point.

---

## Per-agent orchestration (D5) — right-size each, don't uniform-ify

| Agent | Needs durable execution? | Recommendation |
|---|---|---|
| **grocery-buddy** | **Yes** — 24 h approval wait, purchase idempotency | **Temporal** (already built). Task queue `grocery`. |
| **procurement-agent** | **Yes** — approval timer, exactly-once card activation | **Temporal** (already built). Task queue `procurement`. The card-auth webhook hot path *bypasses* Temporal (pure `decide()`, <3 s) — correct design. |
| **jim-agent** | **Partially** — monitors re-run on a schedule; a missed run isn't catastrophic (idempotent re-fetch) | **Keep the existing lightweight async scheduler** for now. It's built, tested, and fine. *Optionally* migrate monitors to Temporal Schedules later for one-pane-of-glass consistency — a nice-to-have, not a need. |
| **dj-agent** | **No** — stateless, fast, triggered | **No durable engine.** Run `generate` on demand; run `curator` ingest from a cron entry or your Mac. Don't add Temporal here just for symmetry. |

> The discipline of saying "jim keeps its scheduler, dj gets nothing, only the two
> money/HITL agents get Temporal" **is** the senior signal. Uniformly forcing
> Temporal onto all four would be the over-engineering tell.

---

## The scale question, head-on

### Orchestration for "me and my partner"

- **There is no scale.** Concurrency is a few workflows per hour, peaking at a few per minute. You will *never* stress Temporal, Postgres, or the box.
- The orchestration "layer" is **one namespace, one or two task queues, a handful of schedules.** Visibility is "did my grocery run fire last night?" — answered by the Temporal UI or a healthchecks.io ping, not a dashboard team.
- Failure handling is "retry the activity, and if it's still broken, Telegram me." Not an on-call rotation.
- **Right-sized = the cheapest thing that gives you durable HITL + retries + replay.** That's Temporal Cloud on credits, or trimmed self-host, or DBOS. All three are defensible; anything heavier is theater.

### Orchestration at enterprise scale

The *same logical workflow* (`plan → approve → execute → record`) but the
non-functional requirements explode:

| Dimension | You (1 user) | Enterprise (N teams, M users) |
|---|---|---|
| Concurrency | a few/min | 10k–1M+ workflows/sec |
| Why durable | don't lose a 6-step run; sleep through approval | correctness across many services, SLAs, audit, sagas/compensation |
| Visibility | Temporal UI / one healthcheck | Elasticsearch + Grafana + on-call + SOC2 evidence |
| Multi-region / HA | irrelevant | required (active-active, DR drills) |
| Persistence | managed Postgres, single instance | Cassandra/sharded, multi-AZ, retention tiers |
| Tenancy | one tenant, one namespace | namespace-per-tenant, RBAC, network isolation |
| Cost driver | $100/mo floor or one VM | millions of Actions/mo + support tier + platform team salaries |
| Who runs it | you, part-time | a dedicated platform/SRE team or Temporal Cloud Business+ |

**The key insight to articulate:** *you can have the multi-step + HITL + exactly-once
needs **without** the scale.* That decoupling is exactly why a library (DBOS) or a
trimmed/cloud Temporal fits you, while the full Cassandra + Elasticsearch + multi-
region cluster fits them. The workflow code barely changes between the two — what
changes is the **substrate's SLAs and the operational organization around it.**

### What an enterprise actually runs (so you can name it)

Temporal Cloud (Business/Enterprise plan) or a platform-team-run self-hosted cluster
(Cassandra + Elasticsearch + multi-region), with the **agent reasoning layer**
(LangGraph or the OpenAI Agents SDK) sitting *on top* of Temporal for durability —
the canonical 2026 production pattern. Your grocery/procurement design (Anthropic SDK
reasoning *inside* Temporal activities) is a single-node version of exactly this
division of labor, which is why it reads as production-aware.

---

## The interview-ready paragraph

> "For a single-user system, full Temporal is over-engineered on pure utility — so I
> run it managed on Temporal Cloud's free credits to eliminate the ops tax, and I'd
> flip to a Postgres-only self-host or even a DBOS-style library if I were optimizing
> for cost. I reserve durable execution for the two agents that actually need it —
> the ones with day-long human-approval waits and exactly-once money operations —
> and leave the stateless music agent and the idempotent monitor scheduler off it
> entirely. At enterprise scale the *workflows* are the same; what changes is the
> substrate — Cassandra + Elasticsearch + multi-region, namespace-per-tenant, a
> platform team — and the agent-reasoning layer (LangGraph) sits on top of Temporal
> for durability, which mirrors how OpenAI and the big fintechs wire it. The signal
> isn't that I ran Temporal; it's that I can tell you exactly when I would and
> wouldn't."
