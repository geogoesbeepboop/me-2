---
title: The Pantry — reusable ingredients for hackathon builds
collection: hackathons
source: ~/dev/hackathons/INGREDIENTS.md
sourceMtime: '2026-07-06T00:57:06.314Z'
syncedAt: '2026-07-09'
summary: >-
  Copy, don't import: take the file, strip what's unused, own it in the new
  repo. Declare reused code to organizers when rules require. /hack reads this
  file during scaffolding.
contentHash: 'sha256:dd6f24689b69c8b83e76ee90e33fbde742a2835f7488d64017c512c4014dca3b'
---
# The Pantry — reusable ingredients for hackathon builds

*Copy, don't import: take the file, strip what's unused, own it in the new repo. Declare reused
code to organizers when rules require. `/hack` reads this file during scaffolding.*

## Tier 1 — Core mechanisms (the demos are made of these)

| Ingredient | Path | What it gives you |
|---|---|---|
| Deterministic policy gate | `~/dev/procurement-agent/src/procurement_agent/policy/engine.py` | Pure `decide()` — no network, no model on the hot path |
| Signed TTL'd mandates | `~/dev/procurement-agent/src/procurement_agent/policy/mandate.py` | HMAC-signed, expiring authority tokens |
| Money-live gating spine | `~/dev/grocery-buddy/src/grocery_buddy/gating.py` | Refuses unapproved irreversible actions |
| Citation/sourcing gate | `~/dev/jim-agent/src/jim/research/gate.py` | Deterministic per-claim verification (hallucination firewall) |
| Faithfulness judge | `~/dev/jim-agent/src/jim/research/judge.py` | Per-claim LLM checklist, post-gate |
| Research pipeline | `~/dev/jim-agent/src/jim/research/engine.py` | LangGraph gather→synthesize→gate→judge with retry |
| x402 buyer | `~/dev/jim-agent/src/jim/buyer/client.py` | httpx client that pays 402s (testnet USDC) |
| x402 seller | `~/dev/jim-agent/src/jim/seller/app.py` | FastAPI paywall + route wiring |
| MCP server scaffolds | `~/dev/grocery-buddy/src/grocery_buddy/mcp_server.py` · `~/dev/jim-agent/src/jim/marketplace/mcp_server.py` | Tool registry + gating; x402-gated variant |
| Temporal workflow pattern | `~/dev/grocery-buddy/src/grocery_buddy/workflows/grocery_run.py` + `activities.py` | Durable, replay-deterministic agent runs; approval signals + timers |
| Unified LLM client | `~/dev/agent-core/src/agent_core/llm.py` | One `complete()` over Anthropic/OpenAI, tier routing, caching |
| Budget circuit-breaker | `~/dev/agent-core/src/agent_core/budget.py` | Per-task cost ceiling (Swarm ER's kill switch) |
| Workflow fan-out pattern | `~/.claude/skills/deep-plan/workflow.js` (and siblings) | Sonnet-breadth → Opus-synthesis orchestration (Harness Bake-off) |

## Tier 2 — Quality & observability

| Ingredient | Path | Notes |
|---|---|---|
| Eval harness (runs/baselines) | `~/dev/jim-agent/src/jim/eval/` | Persisted runs, regression detection |
| Cost/predictor evals | `~/dev/grocery-buddy/src/grocery_buddy/evals.py` | Per-run cost tracking pattern |
| Langfuse tracing (graceful no-op) | `~/dev/agent-core/src/agent_core/tracing.py` | Works unconfigured — safe default in a rush |

## Tier 3 — Interfaces & automation

| Ingredient | Path | Notes |
|---|---|---|
| Telegram approval loop | `~/dev/grocery-buddy/src/grocery_buddy/notifications.py` | Send + approval signaling (Second Opinion, Tripwire) |
| Resilient Playwright scraping | `~/dev/grocery-buddy/src/grocery_buddy/automation/amazon.py` | Persistent session, self-healing selectors |
| Next.js/Tailwind/Framer shell | `~/dev/me-2/` (`app/globals.css`, `components/`) | Polished dark UI fast; reduced-motion aware |
| Fleet ops dashboard | `~/dev/me-2/lib/ops/` + `components/city/` | Agent telemetry board (Swarm ER) |
| Content graph + backlinks | `~/dev/me-2/lib/content.ts` | Post-event portfolio publishing via `/update-project` |

## Pre-event flight check (night before, ~30 min)

- [ ] `.env.hackathon` template current: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, Telegram bot
      token, Supabase URL/key, Alpaca paper keys, Base Sepolia wallet + faucet USDC, Langfuse
      keys (optional).
- [ ] Credits/quota verified on Anthropic + any sponsor API from the event page; know your
      rate-limit tier — demos die on 429s.
- [ ] Warm caches: `uv sync` / `npm i` a scratch project on today's versions; pre-pull Docker
      images (Temporal dev server, Postgres) if the idea needs them.
- [ ] Logged-in sessions: GitHub, Vercel/Fly, Telegram bot tested end-to-end.
- [ ] Phone hotspot tested (venue wifi is a gamble).
- [ ] Read the event's boilerplate/team-size/judging rules; note sponsor-prize criteria.
- [ ] Pick primary idea + one-tier-smaller backup from [IDEAS.md](IDEAS.md).
- [ ] Rehearse the 30-second intro ([PLAYBOOK.md §6](PLAYBOOK.md)).

## Known gaps (pre-buildable, each ~an evening)

- **Extract Tripwire as a real mini-library** — the gate pattern lives in three codebases;
  a clean 200-line `gate.py` + MCP wrapper would make idea #1 a 30-minute setup instead of 2h.
- **Voice pipeline spike** (for Keepsake Slice) — pick and test a speech API before, not during.
- **Tariff dataset** (for Joule Sandbox) — download ERCOT/CAISO/Octopus Agile samples ahead.
