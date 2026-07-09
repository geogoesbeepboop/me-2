---
title: 02 — Target Architecture (Personal Tier)
collection: multi-agent
source: ~/dev/multi-agent-docs/02-architecture.md
sourceMtime: '2026-06-04T22:09:04.694Z'
syncedAt: '2026-07-09'
summary: >-
  This is the architecture for the constraints you chose: Hetzner box, lowest
  babysitting, money live. The governing idea is the disposable box.
contentHash: 'sha256:fe15aef1f4dd30088ad54198b77415377c073aa0b4cef4065fb214b71a232a01'
---
# 02 — Target Architecture (Personal Tier)

This is the architecture for the constraints you chose: **Hetzner box, lowest
babysitting, money live.** The governing idea is the **disposable box**.

---

## The disposable-box principle

A VPS you own usually means *more* babysitting (you patch it, you back it up, you
fix it at 3am). We invert that by making the box hold **nothing you'd cry over**:

- **No durable state on the box.** Postgres is managed (Supabase). Temporal state is in Temporal Cloud (or, if self-hosted, in the *managed* Postgres, not on the box's local disk).
- **No secrets baked into the box.** They're pulled at container start from a secrets manager. A stolen disk image leaks nothing.
- **No precious local files** except two well-defined volumes: grocery's `.amazon-session/` browser profile and dj's model cache — both reconstructable.
- **Infrastructure as code.** The box is defined by a `cloud-init` script + a `docker-compose.yml` (or a small Terraform module). Rebuild = re-run it.

> Result: if the box dies, you provision a new CAX21, run one script, and you're
> back in ~10 minutes with zero data loss. *That* is how a self-owned VPS becomes
> "lowest babysitting." It's also the cattle-not-pets discipline an enterprise
> reviewer wants to see.

---

## Layer map

```
┌────────────────────────────────────────────────────────────────────────┐
│  EDGE / INGRESS                                                          │
│  Cloudflare (DNS + Tunnel + TLS + WAF)                                   │
│  ── no inbound ports on the box; origin IP hidden ──                     │
│  routes:  jim.example.com      → jim-seller :4021                        │
│           grocery.example.com  → grocery webhook :8080                   │
│           proc.example.com     → procurement ASA webhook :8090           │
└────────────────────────────────────────────────────────────────────────┘
                              │  cloudflared (outbound-only tunnel)
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  COMPUTE — 1× Hetzner CAX21 (4 vCPU / 8 GB ARM)  ·  Docker + Compose     │
│                                                                          │
│   always-on containers                  on-demand / scheduled            │
│   ┌──────────────────────┐   ┌──────────────────────┐                   │
│   │ grocery-worker        │   │ dj-job (profile:dj)  │  ← `docker compose │
│   │ grocery-webhook       │   │  torch+CLAP, ~1.5GB  │     run`, exits     │
│   │ jim-seller            │   │  not co-resident     │                    │
│   │ jim-monitor           │   └──────────────────────┘                   │
│   │ procurement-worker    │   ┌──────────────────────┐                   │
│   │ procurement-webhook   │   │ grocery Chromium      │  ← spawned per     │
│   │ cloudflared           │   │  (~1GB, per-job)      │     run, killed    │
│   └──────────────────────┘   └──────────────────────┘                   │
│                                                                          │
│   shared on-box: agent-core (lib, in each image), Caddy (optional)       │
└────────────────────────────────────────────────────────────────────────┘
        │ asyncpg / TLS            │ gRPC / TLS           │ HTTPS
        ▼                          ▼                      ▼
┌──────────────────┐   ┌────────────────────┐   ┌────────────────────────┐
│ DATA             │   │ DURABILITY         │   │ OBSERVABILITY + SECRETS │
│ Supabase Pro     │   │ Temporal Cloud      │   │ Langfuse (Hobby)        │
│ Postgres+pgvector│   │ (free credits →     │   │ Doppler/Infisical       │
│ schema/agent     │   │  $100/mo) OR        │   │ healthchecks.io         │
│ managed backups  │   │  self-host trimmed  │   │ UptimeRobot             │
└──────────────────┘   └────────────────────┘   └────────────────────────┘
        │                                                  
        ▼ (money rails — isolated per agent)               
┌────────────────────────────────────────────────────────────────────────┐
│  MONEY (live)                                                            │
│  jim  → Coinbase CDP MPC wallet (Base mainnet USDC), capped hot float    │
│  proc → Privacy.com (issuer caps) + Lithic ASA (code-enforced per-auth)  │
│  both: model is NEVER on the spend hot path (deterministic gates)        │
└────────────────────────────────────────────────────────────────────────┘
        ▲
        │ external data the agents call
        └─ Anthropic API · Amazon (Playwright) · SEC EDGAR · The Graph · Yahoo
```

---

## Why each layer is where it is

### Compute — one box, containers, profiles

- **Each agent is a container** built from its existing `Dockerfile` (grocery has one; the others get a near-identical 4-line `uv`-based image). One `docker-compose.yml` on the box declares the always-on services with `restart: unless-stopped`.
- **dj uses a Compose `profile`** so it is *not* started with `docker compose up`. You run it on demand (`docker compose run --rm dj-job ...`) or from a cron entry; it loads torch, does its work, and exits — never holding 1.5 GB resident against the money agents.
- **grocery's Chromium** is spawned by the worker per run and killed in a `finally` (Playwright pattern), with `--disable-dev-shm-usage` and a hard memory ceiling so a leak can't OOM the box. See [05](05-hosting-and-ops.md).
- **8 GB headroom budget:** ~2.5 GB always-on services + OS, leaving ~5 GB for a transient Chromium *or* a dj job (not both at once — schedule them apart).

### Data — managed Postgres, shared, schema-per-agent

- **One Supabase Pro project** ($25/mo, no auto-pause, pgvector built in). Each agent gets its own schema (`grocery`, `jim`, `dj`, `procurement`) in the same database, or its own database if you prefer hard isolation. asyncpg from each container.
- **Why managed, not on-box:** directly serves "lowest babysitting" — backups, PITR, and upgrades are Supabase's job, and it keeps the box stateless (the disposable-box principle). The $0 alternative (Postgres in a container on the box) is the cost-saver lever if you ever want to drop $25/mo, at the price of owning backups.
- **Temporal's persistence** also lives in managed Postgres (if self-hosting Temporal) — never on the box's ephemeral disk.

### Durability — Temporal, shared namespace

- One Temporal namespace, **one task queue per agent** (`grocery`, `procurement`, later `jim`/`dj`). grocery + procurement need it (durable HITL waits, idempotent money/cart ops). Decision and the personal-vs-enterprise framing in [03](03-orchestration-and-scale.md).

### Edge — Cloudflare Tunnel, not open ports

- `cloudflared` runs as a container and dials *out* to Cloudflare. **No inbound ports** are opened on the box (ufw can default-deny inbound entirely). Cloudflare terminates TLS, can apply WAF/rate-limits, and the box's real IP never appears in DNS. With **money live**, hiding the origin and removing the inbound attack surface is worth far more than the 5 minutes it takes to set up. Caddy (on-box auto-TLS) is the documented alternative if you ever want to drop the Cloudflare dependency.

### Observability + secrets

- **Langfuse** (shared project, traces tagged by agent) gives per-run cost and the prediction/factuality evals these agents already emit.
- **Secrets manager** (Doppler or Infisical, free tier) holds every key; containers fetch at startup. No `.env` with a mainnet key sits on disk. (D9)
- **Liveness/uptime:** `healthchecks.io` for "did the daily grocery run fire?" cron-style dead-man's-switch; `UptimeRobot`/Better Stack for the three public endpoints. Both free, both feed the "lowest babysitting" goal — you get paged only when something's actually wrong.

---

## Data-flow examples (how a request actually moves)

**grocery daily run:** Temporal Schedule fires → `grocery-worker` runs the workflow → Playwright spawns Chromium, prices a cart → workflow hits the approval gate → push to Telegram → you tap → Cloudflare → `grocery-webhook` → Temporal signal → workflow resumes → writes cart status to Supabase. Chromium is dead the whole time you're deciding.

**jim sale (live):** buyer hits `jim.example.com/research/fundamentals` → Cloudflare → `jim-seller` returns 402 with price → buyer pays USDC → CDP facilitator settles on Base mainnet → seller runs the LangGraph pipeline (EDGAR + maybe a paid The-Graph buy under the $0.10 cap) → deterministic gate verifies every figure → returns the memo. Margin recorded in Supabase.

**procurement card auth (live):** you (or an agent) trigger a purchase → Temporal workflow plans + (maybe) waits on a human-approval signal → activates a Lithic/Privacy card → at swipe time, Lithic calls `proc.example.com` ASA webhook → Cloudflare → `procurement-webhook` runs the pure `decide()` (no LLM, < 3 s) → approve/decline. Issuer caps are the backstop even if everything else fails.

---

## What's deliberately *not* here (and why)

- **No Kubernetes.** One box, one user — Compose is correct. K8s here would be the textbook over-engineering signal. (The enterprise tier in [07](07-enterprise-reference-architecture.md) is where orchestration-at-scale appears.)
- **No message broker (Kafka/RabbitMQ).** Temporal + Postgres cover every queue/coordination need at this volume.
- **No multi-region / load balancer.** One user. Cloudflare gives you a stable hostname and edge caching; that's enough.
- **No self-hosted Langfuse/Grafana stack.** Hobby/free SaaS tiers keep the box thin and the babysitting near-zero. Self-hosting observability is an enterprise-tier line item.
