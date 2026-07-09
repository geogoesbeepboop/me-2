---
title: 08 — Implementation Roadmap
collection: multi-agent
source: ~/dev/multi-agent-docs/08-implementation-roadmap.md
sourceMtime: '2026-06-04T22:15:13.078Z'
syncedAt: '2026-07-09'
summary: >-
  From where you are today (four agents that run locally, inconsistent
  harnesses, no shared host) to live-24/7 on the disposable box. Ordered by
  dependency and by risk — money go-live is deliberately…
contentHash: 'sha256:b634b705ead5eb009fcf259be31b41b9fc5661b61c2c24416ab526f1b6cd9993'
---
# 08 — Implementation Roadmap

From where you are today (four agents that run locally, inconsistent harnesses, no
shared host) to live-24/7 on the disposable box. Ordered by dependency and by
risk — **money go-live is deliberately late, after the boring parts are proven.**

> Sequencing principle: get the *cheap, reversible* things working first (spine,
> box, testnet), prove they're stable, then flip the *irreversible, real-money*
> switch last. Don't stand up a mainnet wallet on day one.

---

## Phase 0 — Consolidate the spine (local, no hosting yet)

**Goal:** stop maintaining 3–4 copies of the harness. Pay this down before
multiplying it across a host.

- [ ] Make `grocery-buddy`, `jim-agent`, `procurement-agent` import `agent-core` and route model calls through `agent_core.complete()` + `trace()` (dj already does). Keep each agent's domain logic untouched.
- [ ] Resolve the `agent-core` fork: upstream `code-migration-agent`'s good parts (sandbox, per-task cost), delete the vendored copy, everyone depends on the one package.
- [ ] Standardize each agent's `.env.example` (they're already good) and confirm every secret has a clear owner.
- [ ] Confirm all agents still pass their existing test suites after the swap.

**Definition of done:** one substrate, four consumers, green tests. *(This is also the
single biggest credibility fix — see [04](04-harness-and-frameworks.md).)*

**Reversibility:** fully local; nothing deployed.

---

## Phase 1 — Stand up the disposable box (no money yet)

**Goal:** the infrastructure spine runs, reproducibly, with nothing precious on the box.

- [ ] **Managed Postgres:** create the Supabase Pro project; one schema per agent (`grocery`, `jim`, `dj`, `procurement`); run each agent's migrations against it. Confirm pgvector is enabled (dj + jim).
- [ ] **Temporal Cloud:** sign up, claim the $1,000 credits, create one namespace, point grocery + procurement at it. (Keep the trimmed self-host compose as the documented fallback.)
- [ ] **Secrets manager:** Doppler/Infisical project, a config per agent, import the keys. Verify `doppler run -- env` shows them and nothing's on disk.
- [ ] **The box:** provision CAX21 (Ubuntu 24.04); apply the cloud-init hardening (non-root, ufw default-deny inbound, fail2ban, unattended-upgrades, Docker).
- [ ] **Deploy repo:** create `/opt/agents` repo with the `docker-compose.yml` (always-on services + dj profile) and per-agent image builds.
- [ ] **Cloudflare Tunnel:** register the domain, create the tunnel, add ingress rules for the three hostnames (jim/grocery/proc), run `cloudflared` as a container.

**Definition of done:** `doppler run -- docker compose up -d` brings up the stack; the
three hostnames resolve over HTTPS through the tunnel; box has zero open inbound ports.

**Reversibility:** high — no real money configured; tear down and retry freely.

---

## Phase 2 — Deploy the agents (testnet / sandbox / cart-only)

**Goal:** all four agents running on the box in their *safe* modes, end-to-end.

- [ ] **grocery-buddy:** worker + webhook containers up; re-auth the Amazon session into the `amazon_session` volume; run one full workflow → approval push to Telegram → tap → resume → cart built. (No purchase path; it ends at the cart — safe by default.)
- [ ] **jim-agent (testnet):** seller + monitor containers up on **Base Sepolia**; generate a testnet wallet; fund from faucet; run a paid `/research` end-to-end against testnet USDC; confirm the sourcing gate + margin ledger work.
- [ ] **procurement-agent (sandbox):** worker + ASA webhook up; Privacy/Lithic in **sandbox**; run a purchase workflow → approval gate → sandbox card activation; fire a test ASA auth at the webhook and confirm `decide()` answers < 3 s.
- [ ] **dj-agent (on-demand):** image builds; run `docker compose run --rm dj-job` for a generate; schedule curator ingest as a cron entry (or keep ingest on your Mac and push to the shared DB). Confirm it's *not* resident when idle.
- [ ] Verify the memory budget: trigger a grocery scrape and a dj job in *separate* windows; watch `docker stats` stay under 8 GB.

**Definition of done:** all four agents work on the box, none of them touching real
money, memory stays in budget.

**Reversibility:** high — everything testnet/sandbox.

---

## Phase 3 — Money go-live (the irreversible switch, done carefully)

**Goal:** flip jim and procurement to real money, with the hardened path from
[05 §7](05-hosting-and-ops.md).

- [ ] **jim mainnet:** create a **Coinbase CDP MPC wallet** (no raw key on the box); run jim's mainnet readiness preflight; fund a **small float** (e.g. < $50 USDC); set the per-query upstream cap ($0.10) + a daily global cap; switch `NETWORK` to Base mainnet; do one tiny real research buy; confirm the sweep-to-cold job works.
- [ ] **procurement live:** create **one low-limit Privacy.com card** with conservative per-merchant/monthly caps (issuer-enforced backstop); move the Lithic ASA config to live; tighten the merchant/MCC allow-list to a known-safe set; run one small real purchase end-to-end.
- [ ] **Secrets:** confirm all money keys are in the secrets manager only, scoped per-agent, with rotation enabled.
- [ ] **Caps audit:** write down the full defense-in-depth stack per agent (model gate → code gate → issuer/MPC cap → daily cap → Langfuse alert) and confirm each layer fires in a test.

**Definition of done:** one real, small transaction succeeds on each money agent;
every spend cap is verified; no raw mainnet key or plaintext card key exists on the box.

**Reversibility:** low — this is real money. Hence the small float, tight caps, and
"one tiny transaction first." Go slow here.

---

## Phase 4 — Make "lowest babysitting" real

**Goal:** the box looks after itself; you're paged only for real problems.

- [ ] **healthchecks.io** dead-man's-switch: grocery's workflow pings on completion → alert if the daily run *doesn't* fire.
- [ ] **UptimeRobot/Better Stack** on the three public endpoints → alert on downtime.
- [ ] **Langfuse cost alerts** + the daily-spend breaker → alert on spend spikes.
- [ ] Confirm `restart: unless-stopped` recovers a killed container; confirm the box reboots cleanly and the stack comes back.
- [ ] Route all alerts to Telegram (you already use it).
- [ ] Do one **rebuild drill:** destroy the box, reprovision from cloud-init + deploy repo + secrets, confirm ~10 min to green. This validates the disposable-box claim.

**Definition of done:** you can ignore the system for a week and trust it'll tap you
if something breaks; a box loss is a 10-minute fix, not a disaster.

---

## Phase 5 — Enterprise-credibility polish (optional, high-leverage)

**Goal:** maximize the portfolio/interview value. Do as much or little as you want.

- [ ] **ADRs at the multi-agent level:** "Temporal Cloud over self-host," "one substrate over per-agent harnesses," "MPC over raw key," "Cloudflare Tunnel over open ports." (This docs folder is the seed.)
- [ ] **Terraform** the box + Cloudflare DNS (even minimal) so "it's all IaC" is literally true.
- [ ] **Eval suites as CI gates:** wire grocery/jim/dj's existing evals to run before deploy.
- [ ] Keep this system diagram + per-agent diagrams current.
- [ ] Be able to whiteboard the [07](07-enterprise-reference-architecture.md) two-column table from memory.

**Definition of done:** you can hand someone this folder and walk the personal↔
enterprise mapping without notes.

---

## Critical path & "start this week"

```
P0 consolidate spine ──► P1 box + infra ──► P2 deploy (safe modes) ──► P3 money live
   (local, ~days)          (~1–2 days)         (~2–3 days)              (slow, careful)
                                                       └──► P4 monitoring (parallel-able)
                                                       └──► P5 polish (anytime after P2)
```

**This week, in order:**
1. **P0** — make all four agents import `agent-core`. Highest credibility-per-hour; entirely local; de-risks everything downstream.
2. Stand up **Supabase Pro + Temporal Cloud + the secrets manager** (P1 services) — no box needed yet, all free/credits.
3. Provision the **CAX21 + Cloudflare Tunnel** and deploy **grocery in cart-only mode** first (it's your most mature agent and touches no money) — proves the whole pipeline safely.

Then jim/procurement on testnet/sandbox (P2), prove stability for a week (P4), and
only then flip to real money (P3). Don't reorder P3 earlier — the entire sequence is
designed so the irreversible step happens on infrastructure you've already proven.

---

## Risk register (the things that actually bite)

| Risk | Likelihood | Mitigation |
|---|---|---|
| Chromium OOMs the box | medium | 8 GB box, `shm_size`, `mem_limit`, per-job lifecycle, don't co-run with dj ([05 §6](05-hosting-and-ops.md)) |
| Mainnet key/card key theft | low/high-impact | MPC wallet (no raw key), secrets manager, low float + sweeps, issuer caps ([05 §7](05-hosting-and-ops.md)) |
| procurement ASA webhook down at swipe | low | fail-safe = decline (safe); `restart: unless-stopped`; uptime alert |
| Temporal credits run out unnoticed | medium | calendar reminder at ~75% credit burn; the decision is documented ([03](03-orchestration-and-scale.md)) |
| Spend runaway (LLM or money) | low | per-task budget (`agent-core`) + daily cap + Langfuse alert; gates already cap money |
| Box lost / corrupted | low | disposable-box: rebuild from IaC + secrets in ~10 min (validated in P4) |
