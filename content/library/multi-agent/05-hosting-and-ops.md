---
title: 05 — Hosting & Ops (the concrete setup)
collection: multi-agent
source: ~/dev/multi-agent-docs/05-hosting-and-ops.md
sourceMtime: '2026-06-04T22:12:18.388Z'
syncedAt: '2026-07-09'
summary: >-
  Target: 1× Hetzner CAX21, disposable, lowest-babysitting, money live. This doc
  is the buildable detail. Commands are illustrative — adapt names/regions.
contentHash: 'sha256:7d5e2df18a19516711a6266d6524ae04efb255322becec7abef6275dc1370e17'
---
# 05 — Hosting & Ops (the concrete setup)

Target: **1× Hetzner CAX21**, disposable, lowest-babysitting, money live. This doc is
the buildable detail. Commands are illustrative — adapt names/regions.

---

## 1. The box

| Spec | Value | Why |
|---|---|---|
| Provider | Hetzner Cloud | Cheapest credible always-on |
| Type | **CAX21** (Ampere ARM, 4 vCPU / 8 GB / 80 GB) | 8 GB is the floor once Chromium (~1 GB) and dj torch (~1.5 GB) are in the picture; ARM is ~20% cheaper and Chromium/torch both have arm64 builds |
| Region | `fsn1`/`nbg1` (EU) or `ash`/`hil` (US) | Pick by latency to you; US if you want lower latency to Amazon/US APIs |
| OS | Ubuntu 24.04 LTS | Boring, long support, great Docker story |
| IPv4 | +€0.50/mo | Keep it; some APIs are v4-only. (Or go v6-only + Cloudflare to save it.) |
| Backups | Hetzner snapshots ~20% of instance | Cheap insurance even though the box is disposable |
| **~Cost** | **~$9/mo** all-in | |

> The box runs **only Docker + cloudflared + a non-root user.** Everything else is a
> container. That's the whole host.

---

## 2. Provision once, reproducibly (cloud-init)

Define the box so a rebuild is one paste. A `cloud-init` user-data script (or a
~30-line Terraform `hcloud_server` module) that:

```bash
# (illustrative cloud-init runcmd)
# 1. non-root user + SSH key only, disable password auth
# 2. ufw: default-deny INBOUND, allow OUTBOUND  (no app ports opened — tunnel is outbound)
ufw default deny incoming && ufw default allow outgoing && ufw allow 22/tcp && ufw enable
# 3. fail2ban + unattended-upgrades (security patches apply themselves → less babysitting)
apt-get install -y fail2ban unattended-upgrades
# 4. Docker + compose plugin
curl -fsSL https://get.docker.com | sh
# 5. pull the deploy repo, fetch secrets, bring up the stack
git clone <your-deploy-repo> /opt/agents && cd /opt/agents
doppler run -- docker compose up -d        # secrets injected at runtime, never written to disk
```

Keep `/opt/agents/docker-compose.yml` + the per-agent images in a small **deploy
repo**. That repo + the secrets manager = the entire reproducible definition of your
production. Rebuild target: **~10 minutes from blank CAX21 to running.**

---

## 3. Containers & the compose file

One `docker-compose.yml` declares the always-on services with
`restart: unless-stopped` (auto-recovery on crash/reboot → lowest babysitting). dj is
behind a `profile` so it doesn't run by default.

```yaml
# illustrative — names/ports per the agents you already have
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel run
    restart: unless-stopped
    # token from secrets manager; dials OUT to Cloudflare, no inbound ports

  grocery-worker:
    build: ../grocery-buddy
    command: uv run grocery-buddy worker
    restart: unless-stopped
    volumes: ["amazon_session:/app/.amazon-session"]
    mem_limit: 1500m          # Chromium headroom; hard cap so a leak can't take the box
    shm_size: 1gb             # see §6 — Chromium /dev/shm

  grocery-webhook:
    build: ../grocery-buddy
    command: uv run grocery-buddy webhook --port 8080
    restart: unless-stopped

  jim-seller:
    build: ../jim-agent
    command: uv run jim-seller
    restart: unless-stopped

  jim-monitor:
    build: ../jim-agent
    command: uv run jim-monitor serve
    restart: unless-stopped

  procurement-worker:
    build: ../procurement-agent
    command: uv run python -m procurement_agent.workflows.worker
    restart: unless-stopped

  procurement-webhook:
    build: ../procurement-agent
    command: uv run uvicorn procurement_agent.webhook.app:app --host 0.0.0.0 --port 8090
    restart: unless-stopped

  dj-job:
    build: ../dj-agent
    profiles: ["dj"]          # NOT started by `up`; run with `docker compose run --rm dj-job ...`
    mem_limit: 2500m

volumes:
  amazon_session:
```

Each agent's image is the grocery `Dockerfile` pattern (python:3.12-slim + uv +
deps; grocery adds the Playwright/Chromium apt libs). dj's image adds torch/CLAP —
keep it separate so its 1.5 GB of weights aren't in the always-on images.

---

## 4. Ingress — Cloudflare Tunnel (D8)

You have three public endpoints, all money-or-control-sensitive. One tunnel handles
all of them with **no open inbound ports** and the **origin IP hidden**:

```yaml
# cloudflared config (ingress rules)
ingress:
  - hostname: jim.example.com      # marketplace — money in
    service: http://jim-seller:4021
  - hostname: grocery.example.com  # approve/reject webhook
    service: http://grocery-webhook:8080
  - hostname: proc.example.com     # Lithic ASA webhook — card auth, <3s
    service: http://procurement-webhook:8090
  - service: http_status:404
```

Why this matters with money live:
- **No inbound attack surface.** ufw denies all inbound; the only ingress is the outbound tunnel. A port scan of your IP finds nothing (and your IP isn't in DNS anyway).
- **Free TLS + WAF + rate-limiting** at Cloudflare's edge, in front of the payment endpoints.
- **Stable hostnames** survive box rebuilds — `jim.example.com` doesn't change when you reprovision.
- **Latency note for procurement:** the ASA webhook must answer in < 3 s. Cloudflare adds a few ms; the pure `decide()` is sub-second; you're fine. Keep that endpoint's container warm (it is — `restart: unless-stopped`).

Domain: ~$10–12/yr at Cloudflare Registrar (at-cost). Caddy on the box (auto-TLS) is
the documented fallback if you ever drop Cloudflare, but then you re-expose ports and
the IP — worse for money live.

---

## 5. Secrets — never plaintext on a box holding mainnet keys (D9)

Today each agent has a `.env` on disk. With **mainnet wallet keys and live card
APIs**, that's the highest-value target on the box. Fix:

- **Doppler or Infisical (free tier).** One project, a config per agent. Containers fetch secrets at startup (`doppler run -- ...` or the Infisical agent), so secrets live in **process env, not on disk**. A stolen disk image leaks nothing.
- **Scope tightly:** jim's wallet creds in jim's config only; procurement's card keys in procurement's config only. No shared blast radius.
- **Rotate** the Anthropic key and card API keys on a schedule (the secrets manager makes this a one-click; rotation is also an enterprise-tier checkbox you get for free here).
- **Never** commit secrets; `.env.example` files stay (they're good docs), real `.env` files leave the box entirely.

---

## 6. Chromium & heavy jobs — the gotchas that actually bite

grocery's Playwright/Chromium is the #1 way this box falls over. Build for it:

1. **`/dev/shm` is 64 MB in Docker → Chromium crashes mid-render**, often leaving a zombie while Python hangs. Fix: `shm_size: 1gb` in compose (shown above) **and** launch Chromium with `--disable-dev-shm-usage`. Belt and suspenders.
2. **Size RAM for the browser, not the average.** ~1 GB per live browser. The grocery worker gets `mem_limit: 1500m`. This is *the* reason for the 8 GB box over 4 GB.
3. **Chromium leaks over long runs.** Don't keep one browser alive forever. Launch per-job, `await browser.close()`/`context.close()` in a `finally`, recycle the process. grocery's run model (price → gate → wait for you → maybe purchase) already implies short browser lifetimes — enforce it.
4. **Run it as a discrete job, not co-resident with the money agents.** On one box, the `mem_limit` + per-job lifecycle does this. Add `--init` (PID-1 reaper) to kill zombies. Flags: `--no-sandbox --disable-gpu --disable-dev-shm-usage`, small fixed viewport.
5. **Don't run dj and a grocery scrape at the same time.** 1.5 GB + 1 GB + ~2.5 GB always-on > 8 GB. Schedule the daily grocery run and any dj ingest in different windows (trivial at one user). dj's `profile` keeps it from being resident; run ingest overnight or on your Mac.

> If Chromium ever becomes a reliability headache, the clean escape hatch is to move
> *just the browser job* to a scale-to-zero serverless runner (Cloud Run Job / a Fly
> Machine that wakes, scrapes, exits) — you pay only while scraping and a leak can't
> touch Temporal. Note it; you probably won't need it at one user.

---

## 7. Money-path hardening (you chose live)

This is the part that earns the "I thought about agent infra professionally" claim.
The architecture already does the hardest thing right — **the LLM is never on the
spend hot path** in either money agent. Your job is to protect the *keys* and *caps*.

### jim — Base mainnet USDC

- **Use a Coinbase CDP MPC wallet for mainnet, not a raw `eth-account` private key (D10).** CDP keeps the key material in Coinbase's MPC infrastructure — there is **no raw private key sitting on your 24/7 box** to steal. (The `Coinbase Developer Platform Faucet.webloc` in the repo shows you're already in the CDP ecosystem.) Keep the raw `eth-account` key for **testnet only**.
- **Low hot float + sweeps.** The wallet only needs enough USDC to buy upstream data (per-query cap is $0.10). Keep a small float (e.g. < $50); **sweep earnings to a separate cold address** on a schedule. A compromise caps out at the float, not your balance.
- **Keep the per-query upstream budget cap** (`PER_QUERY_BUDGET_USD`, default $0.10) and add a **daily global spend cap**. The sourcing gate already prevents paying for garbage.
- **Mainnet preflight** (jim already has a read-only readiness check) before flipping `NETWORK` to Base mainnet.

### procurement — real card rails

- **Lean on issuer-enforced caps as the backstop.** Privacy.com per-card limits are enforced *by the issuer*, not your code — even a total compromise of the box can't exceed them. Set conservative per-card / per-merchant / monthly caps.
- **Lithic ASA decision stays pure and fast.** The webhook runs `decide()` with no LLM, < 3 s, fail-safe = decline. An outage means cards *decline* (safe), never over-spend.
- **Mandate signing secret** (`MANDATE_SIGNING_SECRET`) is treated as card-key-sensitive — secrets manager only, rotated.
- **Start with one low-limit card** and a tight allow-list of merchants/MCCs; widen as you trust it.

### Both

- Spend caps are **defense in depth**: model gate → deterministic code gate → issuer/MPC cap → daily global cap → Langfuse cost alert. Document this stack; it's a great whiteboard.

---

## 8. Backups & state

- **Postgres:** Supabase Pro does automated daily backups + PITR. Nothing for you to do — this is why managed wins for "lowest babysitting." (Self-host alternative: `pg_dump` cron → Cloudflare R2/Backblaze B2; you own it.)
- **Temporal:** Cloud-managed, or (self-host) state in the same managed Postgres → backed up with it.
- **grocery `.amazon-session/`:** the one precious local volume. Snapshot it to R2/B2 weekly; if lost, you just re-auth Amazon once. Low stakes.
- **dj models/library:** reconstructable (re-download CLAP, re-ingest). Don't back up; do keep the source music on your Mac.
- **Secrets:** in the secrets manager (its own durability). Keep an offline encrypted copy of the *recovery* material (wallet seed if not pure-MPC, card API root keys).

---

## 9. Monitoring & alerting (so "lowest babysitting" is real)

You want to be paged **only** when something's actually wrong:

| Signal | Tool (free) | Alerts you when |
|---|---|---|
| Daily grocery run fired | **healthchecks.io** dead-man's-switch (workflow pings on completion) | the run *didn't* happen |
| 3 public endpoints up | **UptimeRobot** / Better Stack | jim/grocery/proc endpoint is down |
| LLM / money spend | **Langfuse** cost alerts + your daily-cap breaker | spend spikes past threshold |
| Box health | Hetzner alerts + `docker compose` healthchecks + `restart: unless-stopped` | CPU/disk pressure; container auto-restarts silently otherwise |
| Errors | agents already push to **Telegram** on error | a workflow errors out |

Wire alerts to Telegram (you already use it). The combination of auto-restart +
dead-man's-switch + uptime ping means the box mostly looks after itself and taps you
on the shoulder only for real problems — which is the entire point of the
"lowest babysitting" choice.

---

## 10. The ops loop in practice

- **Daily:** nothing. Auto-restart + alerts handle it.
- **Weekly:** glance at the Langfuse cost dashboard + Temporal UI; confirm the grocery healthcheck is green; check jim's margin/dashboard.
- **Monthly:** review spend vs the projections in [06](06-cost-projections.md); rotate any keys due; `apt` upgrades already auto-applied.
- **On alert:** Telegram tells you what broke; usually `docker compose logs <svc>` + a restart, or a redeploy from the deploy repo.
- **On box loss:** reprovision CAX21, re-run cloud-init, ~10 min, zero data loss.
