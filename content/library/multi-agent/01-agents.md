---
title: 01 — Agent Inventory & Runtime Profiles
collection: multi-agent
source: ~/dev/multi-agent-docs/01-agents.md
sourceMtime: '2026-06-04T22:08:08.194Z'
syncedAt: '2026-07-09'
summary: >-
  The single most important realization for hosting: your four agents have four
  different runtime shapes. Treating them uniformly ("run them all 24/7") is the
  mistake. Here's what each actually is, w…
contentHash: 'sha256:5c6684957cab9a0cfcc5eecbede5cf9173daa9dc558b7d0ea392e6d582de5115'
---
# 01 — Agent Inventory & Runtime Profiles

The single most important realization for hosting: **your four agents have four
different runtime shapes.** Treating them uniformly ("run them all 24/7") is the
mistake. Here's what each actually is, what it needs, and what's shared.

> Naming note: you referred to a `procedural-agent`. There is no such directory —
> the agent is **`procurement-agent`** (`/Users/geoandr/dev/procurement-agent`).
> This plan uses the real name.

---

## The four agents + the spine

### 1. `grocery-buddy` — your most production-shaped agent

- **What:** 24/7 pantry tracker → predicts low items → builds & prices an Amazon cart → stops at an **approval gate** (it never auto-buys today; ends by handing you a checkout link).
- **Stack:** Anthropic SDK (Sonnet 4.6 / Haiku 4.5) · **Temporal** (self-hosted) · Supabase Postgres via asyncpg · Langfuse · **Playwright/Chromium** (Amazon automation) · FastAPI webhook · Telegram push.
- **Runtime shape:** **Always-on.** A Temporal worker runs forever; a webhook server listens for approve/reject taps; a Temporal Schedule fires the daily run.
- **Public endpoint?** **Yes** — webhook converts Telegram button taps into Temporal signals (`webhook.py`).
- **Heavy deps:** Chromium (~1 GB resident when scraping). The biggest memory driver on the box.
- **Money:** Not today — ends at a cart + checkout link. (Auto-purchase under a cap is designed but gated off.)
- **Key files:** `workflows/grocery_run.py`, `workflows/activities.py`, `workflows/worker.py`, `automation/amazon.py`, `webhook.py`, `fly.toml`, `docker-compose.yml`.

### 2. `jim-agent` — x402 financial-research marketplace (the fintech centerpiece)

- **What:** An impersonal, fully-cited financial-research service that **sells over x402** (HTTP 402) and **pays for upstream data over x402**. A deterministic sourcing gate rejects any memo with an uncited number. Two-sided: tracks margin (price_out − data_cost − inference_cost).
- **Stack:** FastAPI · `x402[fastapi,httpx,evm]` · `eth-account` wallet (CDP MPC planned) · **LangGraph** (fixed-topology pipeline) · Anthropic (Sonnet synthesis, Haiku judge) · Postgres + pgvector · SEC EDGAR / The Graph / Yahoo · optional MCP server.
- **Runtime shape:** **Always-on, and the only one that *must* be publicly reachable as a server.** It's a marketplace: the seller (`jim-seller`, :4021) listens for paid HTTP requests; a monitor scheduler polls for due monitors; an optional MCP server (:4022) exposes paid tools.
- **Public endpoint?** **Yes, hard requirement** — buyers and agents must reach it over public HTTPS to pay. Needs a stable domain.
- **Heavy deps:** None unusual (async I/O bound).
- **Money:** **Yes.** Testnet (Base Sepolia) by default; **you chose mainnet/live** → real USDC on Base, Coinbase CDP facilitator. Holds a wallet key. Per-query upstream budget cap ($0.10 default).
- **Key files:** `research/engine.py` (LangGraph), `monitors/scheduler.py`, `store/`, `docker-compose.yml`. Entry points: `jim-seller`, `jim-monitor serve`, `jim-research`, `jim-mcp`, `jim-wallet`.

### 3. `procurement-agent` — autonomous purchasing with a deterministic money gate

- **What:** Buys what you need / what you ask, with **spend authority enforced by deterministic code and the card issuer — never the LLM.** Mitigates OWASP's #1 agentic risk (excessive agency) by separating reasoning (model) from authority (code + rails).
- **Stack:** FastAPI · **Temporal** · Anthropic (Haiku route / Sonnet source / Opus escalate) · MCP (FastMCP) · **Privacy.com** (issuer-enforced caps) + **Lithic ASA** (code-enforced per-auth) · in-memory store today (Postgres planned).
- **Runtime shape:** **Event-driven, mostly idle.** Wakes on (a) a replenishment schedule, (b) an MCP/CLI request, or (c) a **Lithic ASA webhook** that must respond in **< 3 s** during a live card authorization.
- **Public endpoint?** **Yes** — the Lithic ASA webhook is in the card-auth hot path. Uptime + latency sensitive (fail-safe is "decline," so an outage is *safe* but cards won't work).
- **Heavy deps:** Optional browser fallback (Skyvern/Stagehand) behind the gate.
- **Money:** **Yes.** Sandbox by default; **you chose live** → real card rails. The deterministic gate (`policy/engine.py`) + HMAC-signed mandates mean a model can't move money even if compromised.
- **Key files:** `pipeline.py` (plan/execute), `policy/engine.py` (the gate), `workflows/purchase.py` (durable), `workflows/worker.py`, `mcp_server/server.py`, `webhook/app.py`.

### 4. `dj-agent` — music/DJ set generation (the odd one out)

- **What:** Analyzes your local music into a vibe vector DB (CLAP embeddings + taste model), then generates beatmatched DJ sets with a planned energy arc.
- **Stack:** Claude Agent SDK + **`agent-core`** (editable install — the only current consumer of the spine!) · CLAP (`torch`, ~1.5 GB) · sentence-transformers · Postgres + pgvector · librosa/soundfile/pydub audio.
- **Runtime shape:** **Batch / triggered. NOT always-on.** Three CLI flows: `curator` (bulk ingest), `taste.tag` (interactive), `agents.generate` (make a set). Generation is seconds; ingest is minutes; nothing daemonizes.
- **Public endpoint?** No.
- **Heavy deps:** **The heaviest by far** — `torch` + CLAP load ~1.5 GB; CLAP inference is CPU-bound (≈10–20 min to embed 500 tracks). This is why it must not be a resident process competing with the money agents for RAM.
- **Money:** No.
- **Key files:** `dj/curator.py`, `dj/agents/{architect,selector,generate}.py`, `dj/taste/tag.py`, `vibe/schema.sql`.

### 5. `agent-core` — the shared spine you already have (and under-use)

- **What:** A ~900-line, provider-agnostic substrate: `complete()` (tier-routed model calls — CHEAP/MID/HARD/LOCAL — with prompt caching + cost tracking), `trace()` (Langfuse, no-ops if unconfigured), a SQLite `TaskQueue`, a `run_loop` runner, `set_budget()` per-task cost caps, and extension `protocols.py`. Explicitly **substrate ≠ orchestrator ≠ supervisor** (ADR-0003).
- **Status:** Solid core, ADR-disciplined, **but only `dj-agent` imports it.** `code-migration-agent` carries a *vendored fork*. `grocery-buddy`, `jim-agent`, `procurement-agent` each re-implement their own model-calling, tracing, and budget logic.
- **Implication:** You are effectively maintaining **3–4 copies** of the model/trace/budget layer. This is the one thing in your portfolio that reads as a gap rather than a strength. Fixing it (D6) is both good engineering and a good story. See [04](04-harness-and-frameworks.md).

---

## Runtime profile matrix

| Agent | Always-on? | Public HTTPS? | Browser? | Heavy RAM? | Touches money? | Orchestrator |
|---|---|---|---|---|---|---|
| grocery-buddy | **Yes** (worker + webhook) | Yes (webhook) | **Yes (~1 GB)** | medium | No (cart only) | Temporal |
| jim-agent | **Yes** (seller + monitors) | **Yes (marketplace)** | No | low | **Yes (USDC live)** | async scheduler |
| procurement-agent | No (event-driven) | Yes (ASA webhook, <3 s) | optional | low | **Yes (cards live)** | Temporal |
| dj-agent | **No** (batch/triggered) | No | No | **Yes (~1.5 GB torch)** | No | none (on-demand) |

### What this matrix dictates for hosting

1. **8 GB box, not 4 GB.** grocery's Chromium (~1 GB) and dj's torch (~1.5 GB) can't both be resident with the always-on services. → Hetzner **CAX21 (8 GB)**, and **dj runs as an isolated on-demand job** that isn't co-resident with the money agents (see [05](05-hosting-and-ops.md) "Chromium & heavy jobs").
2. **Three public endpoints, all sensitive.** jim's marketplace (money in), grocery's webhook (approve/reject), procurement's ASA webhook (card auth, <3 s). All go through **one Cloudflare Tunnel** — no open ports, IP hidden, free TLS. Path-routed to the right container.
3. **Two money paths to harden.** jim (mainnet wallet) and procurement (card APIs). Both already keep the *model* off the money hot path by design — your job is to keep the *keys* off the disposable box surface (D9, D10).
4. **dj is not a 24/7 agent.** Don't pay to keep `torch` resident. Trigger it on demand (cron ingest + on-request generate), or honestly, run it on your Mac locally and only push results to the shared DB. It's the one agent where "host it 24/7" is the wrong answer.

---

## Shared vs per-agent services

| Service | Shared across all? | Notes |
|---|---|---|
| **Postgres (Supabase Pro)** | **Shared** — one project, schema-per-agent (or DB-per-agent via search_path) | grocery, dj, jim already use Postgres; procurement migrates off in-memory. pgvector serves dj + jim. |
| **Temporal** | **Shared** — one namespace, task-queue-per-agent | grocery + procurement today; jim/dj can join later. |
| **Langfuse** | **Shared** — one project, traces tagged by agent | grocery, dj, jim already wire it; procurement adds it via `agent-core`. |
| **`agent-core`** | **Shared** — the model/trace/budget layer | The consolidation target (D6). |
| **Secrets manager** | **Shared** — one Doppler/Infisical project, per-agent configs | Replaces the four `.env` files on disk. |
| **Cloudflare Tunnel** | **Shared** — one tunnel, path-routed | jim / grocery / procurement endpoints. |
| **LLM API key (Anthropic)** | **Shared** — one key, per-agent usage tagged | Cost attribution via Langfuse + `agent-core` cost tracking. |
| Wallet / card rails | **Per-agent** | jim (CDP wallet), procurement (Privacy/Lithic) — isolated, never shared. |
| Browser session | **Per-agent** | grocery's `.amazon-session/` profile is grocery-only. |
| Music library + models | **Per-agent** | dj's CLAP/torch + audio files — local to dj. |

> Rule of thumb: **stateless cross-cutting concerns are shared** (model calls,
> tracing, orchestration, Postgres, ingress, secrets store). **Stateful, trust-
> sensitive, or domain-specific things are isolated** (wallets, card keys, browser
> sessions, music files). This is also exactly how you'd explain multi-tenancy
> boundaries at enterprise scale — same principle, one tenant.
