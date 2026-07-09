---
title: Leech
collection: dossiers/personal
source: ~/dev/docs/personal/subscription-spend-watchdog.md
sourceMtime: '2026-06-05T07:25:31.255Z'
syncedAt: '2026-07-09'
summary: >-
  A read-only money watchdog that finds your forgotten subscriptions and
  price-creep across accounts, then drives the cancel/downgrade flow on approval
  — never touching a cent itself.
contentHash: 'sha256:a9ad662b13ae096417cbaa6e6f874c883f2d2ab26b590d3eb520f8932beca2d8'
---
# Leech
> A read-only money watchdog that finds your forgotten subscriptions and price-creep across accounts, then drives the cancel/downgrade flow on approval — never touching a cent itself.

**Bucket:** personal · **Effort:** M · **Reuses:** agent-core tracing/budgeting, Temporal durable monitor + HITL signal, pure-Python materiality gate (jim pattern), Playwright/computer-use actuation (grocery pattern), Telegram inline-button approval, Haiku/Sonnet tiering, pgvector merchant memory, Langfuse + precision/recall eval suite, graceful degradation to heuristic detector

---

## TL;DR

Leech is a scheduled personal-finance watchdog that scans your bank transactions and inbox receipts for zombie subscriptions, silent price increases, and free-trial conversions — then ranks them by dollar leakage with evidence attached. When you approve a cancellation, a Playwright/computer-use agent drives the retention flow live, screenshots every step as a proof trail, and structurally refuses to click upsell or "keep my plan" buttons even when dark-pattern design buries the cancel option. The detection is fully deterministic Python — no LLM touches raw transaction figures — so false positives stay low and every finding is explainable. The wow is that it recovers real money without ever holding payment authority: read-only on money, gated-write on actions.

---

## The Problem

The average household leaks $200–300/month to subscriptions they forgot, free trials that silently converted, and recurring charges that quietly raised their price. The "gym membership problem" has metastasized: streaming add-ons, SaaS trials, app store subscriptions, regional news paywalls, cloud-storage tiers — each charge is small enough to miss individually but devastating in aggregate.

Current tools fail in three predictable ways:

1. **Categorisation apps (Mint, YNAB, Copilot)** surface all recurring charges but require the user to manually audit the list. There is no detection of zombies, price deltas, or trial transitions — just categorised history.
2. **Cancel-for-me services (Rocket Money, Truebill)** require linking payment access or handing cancellation to opaque human agents. Users trade one trust problem (unknown subscriptions) for another (third-party write-access to accounts). They do not show the cancel flow or provide a proof trail.
3. **Manual trawling** is the fallback most people use: download a statement, grep for merchant names, find the cancellation page buried three layers deep, navigate a retention dark-pattern, and hope the cancellation actually processed.

In mid-2026 this problem is sharper than ever. EU AI Act Article 14 and the general governance conversation have trained enterprise buyers — and increasingly sophisticated consumers — to demand auditable, human-in-the-loop automation for irreversible financial actions. The right product is not "AI takes over your money"; it is "AI finds the problem, shows you the evidence, and executes your decision with a proof trail."

---

## What It Does

**Core capabilities:**

- **Recurring-charge detection** — clusters transactions into recurring series by merchant + amount + period (weekly/monthly/annual); uses cadence-aware clustering that tolerates ±3-day jitter and amount rounding.
- **Anomaly scoring** — flags three signal types: (a) price-delta detections (same merchant, new amount, first occurrence), (b) trial-to-paid transitions (first charge appearing ~7/14/30 days after a $0 or $1 auth), (c) zombie detection (active recurring charge + zero product engagement signals from inbox/browser history heuristics).
- **Materiality gate with cooldown** — pure-Python gate scores each finding by annual dollar impact, recency, and prior-alert history. Suppresses annual renewals you know about, charges below your personal noise floor, and findings that already surfaced in the last N days. Zero LLM involvement in this gate.
- **Human-readable briefing** — Sonnet synthesises the ranked leak list into a plain-English briefing with evidence (the receipt email, the price-change date, the engagement signal). Haiku canonicalises merchant names and categories first.
- **Approval-gated cancellation** — Telegram inline buttons per finding: Keep / Cancel / Downgrade / Snooze. On Cancel, Leech dispatches a Playwright/computer-use agent that navigates to the cancellation flow, handles the retention dark-pattern (clicking "Continue to Cancel" even when "Keep Plan" is visually dominant), screenshots each step, and returns a confirmation receipt.
- **Merchant memory** — pgvector stores normalised merchant embeddings and your keep-list so Leech learns which annual charges are intentional and which merchants have previously tried dark-pattern retention flows.

**Walked-through example interaction:**

```
[Weekly scan fires, Tuesday 07:00]

Leech → Telegram:
"Weekly leak report — 3 findings worth $87.88/mo

1. 🔴 Acme Cloud Storage $8.99/mo
   Was $4.99 until March 11. You've opened the app twice in 90 days.
   Evidence: receipt email 2024-03-11, price-change delta +$4.00
   [Keep] [Cancel] [Snooze 30d]

2. 🟠 StreamPlus Add-on $6.99/mo
   Added during free trial 2023-11-02, converted silently Nov 30.
   Evidence: $0.00 auth 2023-11-02, first charge 2023-11-30
   [Keep] [Cancel] [Snooze 30d]

3. 🟡 ProductivitySuite Annual $71.88/yr (~$5.99/mo equiv)
   No price change, last login 8 months ago.
   Evidence: inbox receipt, last browser session heuristic"

[User taps Cancel on Acme Cloud Storage]

Leech → starts Playwright session
  Step 1/4: navigated to account settings — screenshot attached
  Step 2/4: located 'Manage Subscription' — screenshot attached
  Step 3/4: retention modal — dark-pattern 'Keep Plan' highlighted; 
            clicked 'Continue to Cancel' [deterministic guard active]
  Step 4/4: confirmed cancellation — screenshot attached

Leech → Telegram:
"Cancelled. Confirmation ID: XK-88291. Screenshot trail saved.
 Estimated savings: $8.99/mo · $107.88/yr"
```

---

## Who It's For / Enterprise Translation

**Personal personas:**
- Households with 10+ recurring charges who have never audited them
- Freelancers and solo founders who trial tools constantly and forget to cancel
- Anyone who has said "wait, I'm still paying for that?"

**Enterprise analog — this is the FinOps / SaaS spend management story:**

The $2.8B SaaS-spend management category (Ramp, Coupa, Torii, Zylo, Vendr) does exactly this for organisations: it discovers shadow IT subscriptions, detects price increases in vendor contracts, flags underutilised seats, and routes cancellation/downgrade approvals through a procurement workflow. The architectural pattern is identical — read-only data ingestion, anomaly detection on spend series, human-approval gates, auditable action execution.

Leech is a working personal implementation of that exact pattern. In an interview or demo context it maps directly to:

| Personal concept | Enterprise analog |
|---|---|
| Plaid transaction feed | ERP / accounts-payable export |
| Recurring-charge clustering | Vendor contract normalisation |
| Price-delta detection | Contract renewal anomaly alerts |
| Materiality gate + cooldown | Procurement policy engine |
| Playwright cancel flow | Vendor portal automation |
| Screenshot proof trail | Audit log / EU AI Act Article 12 evidence |
| Keep-list in pgvector | Approved-vendor registry |
| Telegram HITL approval | Slack/email procurement workflow |

**Value metrics to cite in any demo or conversation:**
- $/month recovered (primary)
- Zombie subscriptions found (recall)
- False-positive rate on materiality gate (precision)
- Cancellations completed with proof trail (execution reliability)
- Dark-pattern deflection rate (the "refused upsell" count)

---

## Architecture

### Prose overview

The system runs as a Temporal workflow on a weekly schedule (plus on-demand trigger via Telegram command). The workflow has three logical phases separated by deterministic gates.

**Phase 1 — Ingest (read-only, no LLM)**

A financial MCP adapter (Plaid or a Truthifi-style aggregator) pulls 90 days of transactions as a read-only feed. A Gmail MCP adapter scans the inbox for receipt emails matching known billing domains. Both feeds are written to Supabase Postgres with a content-addressed hash to avoid reprocessing.

**Phase 2 — Detect (pure Python, no LLM)**

`detector.py` runs against the ingested feed:
- Groups transactions into merchant series using fuzzy-matched canonical names (pre-computed with Haiku at ingest time, stored in pgvector)
- Identifies recurring series (cadence classifier: weekly/monthly/quarterly/annual)
- Scores each series for three anomaly types: price delta, trial transition, zombie
- Applies the materiality gate: annual_impact × recency_weight × (1 - cooldown_suppression)
- Cross-references the keep-list (pgvector similarity search on merchant name)
- Outputs a ranked `List[Finding]` dataclass — fully typed, no free text, unit-testable

The gate is the trust boundary. Nothing downstream can manufacture a finding that did not pass this gate. No LLM participates in flagging, scoring, or suppressing findings.

**Phase 3 — Summarise and brief (LLM, read-only)**

Haiku canonicalises any merchant names not already in pgvector and assigns categories. Sonnet receives the structured `List[Finding]` (not raw transactions) and writes the human briefing. The LLM sees only already-validated structured data; it cannot alter the scores or suppress findings.

**HITL gate — Temporal signal**

The Temporal workflow pauses at a `WaitForSignal` activity after the Telegram message is sent. Each inline-button press routes a typed signal (`{finding_id, action: "cancel" | "keep" | "downgrade" | "snooze"}`) back to the workflow. The workflow validates signal shape deterministically before dispatching.

**Phase 4 — Execute (Playwright/computer-use, irreversible, post-approval only)**

On a validated `cancel` signal, the `CancelExecutor` activity launches a Playwright session. A deterministic guard list of CSS/text selectors for upsell/retain buttons is loaded from a YAML config; the executor refuses to click any element matching those patterns and logs the refusal. Every page transition is screenshotted and stored in Supabase Storage. Cancellation confirmation (or failure with reason) is sent back to Telegram with the screenshot trail URL.

### Mermaid diagram

```mermaid
flowchart TD
    subgraph INGEST["Ingest (read-only)"]
        A[Temporal Scheduled Monitor\nweekly + on-demand] --> B[Financial MCP\nPlaid / Truthifi-style]
        A --> C[Gmail MCP\nreceipt scanner]
        B --> D[Supabase Postgres\ntransaction store]
        C --> D
    end

    subgraph DETECT["Detect (pure Python — no LLM)"]
        D --> E[detector.py\nrecurring-series clustering\nprice-delta · trial-transition · zombie]
        E --> F{Materiality Gate\nannual_impact × recency\n× cooldown_suppression}
        F -->|suppressed| G[Supabase: snooze log]
        F -->|passed| H[pgvector keep-list\nmerchant similarity check]
        H -->|on keep-list| G
        H -->|not on keep-list| I[List[Finding]\ntyped dataclass]
    end

    subgraph SUMMARISE["Summarise (LLM, read-only)"]
        I --> J[Haiku\nmerchant canonicalisation\n+ pgvector upsert]
        J --> K[Sonnet\nhuman briefing writer]
        K --> L[Telegram: ranked leak report\nwith evidence + inline buttons]
    end

    subgraph HITL["HITL Gate (Temporal WaitForSignal)"]
        L -->|Keep / Snooze| M[Temporal: log + cooldown]
        L -->|Cancel signal| N{Signal validator\ndeterministic}
        N -->|invalid shape| O[Telegram: error + re-prompt]
        N -->|valid cancel| P[CancelExecutor activity]
    end

    subgraph EXECUTE["Execute (Playwright, post-approval only)"]
        P --> Q[Playwright / computer-use\nbrowse to cancellation flow]
        Q --> R{Dark-pattern guard\nCSS/text upsell blocklist}
        R -->|upsell match| S[Log refusal · skip element]
        R -->|safe element| T[Click · screenshot · continue]
        T --> U[Cancellation confirmed\nreceipt ID captured]
        U --> V[Supabase Storage\nscreenshot trail]
        U --> W[Telegram: confirmed + trail URL\npgvector: update merchant memory]
    end

    subgraph OBS["Observability"]
        X[Langfuse\ntrace every LLM call\ndetector precision/recall evals]
    end

    K -.-> X
    P -.-> X
```

### Tech-stack table

| Layer | Technology |
|---|---|
| Orchestration | Temporal (durable workflows, HITL signals, retries) |
| Detection | Pure Python — `detector.py`, `pandas`, `scikit-learn` cadence classifier |
| LLM — routing | Claude Haiku (merchant canonicalisation, category tagging) |
| LLM — synthesis | Claude Sonnet (briefing writer) |
| Browser automation | Playwright + computer-use (cancellation executor) |
| Financial data | Financial MCP (Plaid adapter or Truthifi-style aggregator) |
| Inbox data | Gmail MCP |
| Primary store | Supabase Postgres (transactions, findings, screenshot metadata) |
| Vector store | pgvector in Supabase (merchant embeddings, keep-list) |
| File store | Supabase Storage (screenshot trail) |
| HITL channel | Telegram Bot API (inline buttons → Temporal signals) |
| Observability | Langfuse (LLM traces, cost tracking) |
| Eval suite | pytest + synthetic statement fixtures (precision/recall of zombie detection) |
| Harness | agent-core (tracing wrapper, budget guard, graceful degradation) |

---

## The "Model Proposes, Code Disposes" Boundary

This is the signature pattern, and Leech implements it at two distinct layers.

**Layer 1 — Detection boundary (no LLM in the critical path)**

The LLM is structurally excluded from finding, scoring, or suppressing anomalies. `detector.py` is the sole arbiter of what surfaces. Its outputs are typed Python dataclasses with no free-text fields that could carry hallucinated figures. Unit tests run against synthetic bank statement fixtures with known ground truth. The precision/recall of the detector is measurable, improvable, and fully explainable to a non-technical user ("we flagged this because the amount changed from $4.99 to $8.99 on March 11 and you haven't opened the app").

The LLM's role in this phase is strictly labelling (Haiku canonicalises merchant names) and summarising (Sonnet writes the briefing from the already-validated structured list). It cannot introduce a finding, elevate a suppressed finding, or alter a materiality score.

**Layer 2 — Execution boundary (no autonomous irreversible action)**

The Playwright executor only runs after a validated human-approval signal. The signal validator is deterministic Python — it checks schema, finding_id existence, and action membership. The dark-pattern guard is a YAML-driven blocklist of CSS selectors and button text patterns that represent upsell/retention elements; the executor checks every click target against this list before firing. This check is deterministic and cannot be overridden by the LLM.

The LLM does not participate in the cancellation flow at all. It does not decide which button to click. The Playwright session uses deterministic selectors (aria-label, data-testid, text matching against a priority list) and a fallback visual-similarity search via computer-use only when DOM-based targeting fails. Even then, the dark-pattern guard runs on the element description before any click is fired.

**Summary:**

| What the LLM does | What deterministic code does |
|---|---|
| Canonicalises merchant names | Clusters transactions into recurring series |
| Writes human-readable briefing | Scores materiality (annual impact × recency × cooldown) |
| — | Cross-references the keep-list |
| — | Validates HITL signal shape |
| — | Guards against dark-pattern upsell clicks |
| — | Executes browser automation |
| — | Captures screenshot trail |

---

## Why It's Impressive (Resume + Demo Signal)

**Seniority signals:**

1. **Layered trust architecture** — The separation between "LLM labels data" and "Python makes decisions" is not incidental; it is the design. Senior interviewers in 2026 are explicitly asking "where is your trust boundary and how do you enforce it?" Leech has a clean, demonstrable answer.

2. **Adversarial automation** — Cancelling subscriptions through dark-pattern retention UIs is a genuinely hard computer-use problem. The dark-pattern guard (a deterministic YAML blocklist checked before every click) shows understanding of both the failure mode (the agent gets manipulated into clicking "upgrade") and the architectural remedy (deterministic pre-click validation, not post-hoc review).

3. **Read-only-first then gated-write** — The agent has zero write-access to financial accounts. The only irreversible action (cancellation) requires explicit human approval and leaves an immutable screenshot trail. This is exactly the EU AI Act Article 12 (automatic logging) + Article 14 (human oversight) compliance architecture — and it maps directly to enterprise procurement policy engines.

4. **Offline-first, explainable detection** — A precision/recall eval suite on synthetic statements demonstrates engineering rigour. The detector degrades gracefully (heuristic-only mode if the financial MCP is unavailable), which shows production-readiness thinking.

5. **End-to-end demo-ability** — Unlike many agent demos that show scaffolding, Leech has a visible output (money recovered), a visible process (live Playwright session with screenshots), and a visible guardrail (the refused dark-pattern button). All three are concrete and non-abstract.

**The specific "aha":** The moment the demo shows Leech refusing to click the visually-dominant "Keep My Plan" button and instead clicking the grey, de-emphasised "Continue to Cancel" link — that is when the architectural discipline becomes viscerally obvious. It is a one-screen illustration of "model proposes, code disposes."

---

## 3-Minute Demo Script

**Setup (30 seconds)**

Open Telegram. Show a clean, ordinary transaction feed in a second window — a realistic mix of rent, groceries, and 12+ recurring charges of varying sizes. Say: "This is a real-looking 90-day statement. Most people have something like this. Let's ask Leech to audit it."

**The action (45 seconds)**

Type `/scan` in the Telegram chat. Show the Temporal workflow starting in the Temporal UI (or a simplified terminal view). Show `detector.py` running — highlight that no LLM call is made during detection. After ~10 seconds, the Telegram briefing arrives. Read the top finding aloud: "You've paid $71.88 for an app you opened twice. Price went $4.99 to $8.99 in March." Show the receipt email evidence linked inline.

**The wow moment (45 seconds)**

Tap the Cancel button on that finding. Switch to a screen-share or browser window showing the live Playwright session navigating to the subscription settings page. Watch it arrive at the retention modal. Pause and point out: the page has a large green "Keep My Plan — 50% off!" button and a small grey "Continue to Cancel" link. Watch Leech click "Continue to Cancel." Narrate: "The dark-pattern guard checked every clickable element on this page before acting. It matched 'Keep My Plan' against the upsell blocklist and refused it. This is deterministic — the LLM is not involved in this decision."

**The failure-handling flex (30 seconds)**

Switch back to the briefing. Point to the annual insurance renewal that was in the raw transactions but did not appear in the findings list. Explain: "This charge looked new because it's annual. The materiality gate recognised the 12-month cadence and cross-referenced the keep-list. It was suppressed before it ever reached the LLM or you. That's precision — not every anomaly is a problem."

**The metric close (30 seconds)**

Show the Supabase dashboard: findings this week, cancellations completed with proof, false positives (zero from the known-good fixture). Show the screenshot trail for the completed cancellation. Close with: "Forty-seven dollars a month recovered. Every step is auditable. I never had write-access to the bank account."

---

## Build Plan (Phased)

### Phase 0 — Detector core (exit: unit-testable, no agents)
- Implement `detector.py`: transaction ingestion from CSV/JSON fixture, merchant fuzzy-grouping, cadence classifier, price-delta and trial-transition detectors, materiality scorer with cooldown
- Write pytest suite against 3 synthetic statement fixtures with labelled ground truth; target >90% precision, >85% recall on zombie detection
- Implement keep-list as a simple JSON file (pgvector comes later)
- Exit check: `pytest tests/detector/` green, recall/precision printed to stdout

### Phase 1 — Data ingest + Supabase (exit: real data, no LLM)
- Stand up Supabase project; define `transactions`, `findings`, `merchant_embeddings`, `cancellation_events` tables
- Build financial MCP adapter (Plaid sandbox or CSV import fallback for graceful degradation)
- Build Gmail MCP adapter (receipt email scanner with domain allowlist)
- Wire detector to real feed; confirm findings populate Supabase
- Exit check: scan a real 90-day statement, findings written to DB, no LLM calls made

### Phase 2 — LLM summarisation + Telegram HITL (exit: full briefing loop, no execution)
- Integrate agent-core harness (tracing, budget guard)
- Add Haiku merchant canonicalisation; upsert embeddings to pgvector; update keep-list cross-reference to use vector similarity
- Add Sonnet briefing writer (receives `List[Finding]` only)
- Build Telegram bot with inline buttons; wire Temporal `WaitForSignal` for HITL approval
- Add Langfuse tracing for all LLM calls
- Exit check: full scan-to-briefing loop working end-to-end; Telegram buttons send signals back to Temporal; Langfuse shows traces

### Phase 3 — Cancellation executor (exit: one real cancellation with proof trail)
- Build `CancelExecutor` Temporal activity wrapping Playwright
- Implement dark-pattern guard: YAML blocklist, pre-click validator, refusal logging
- Add computer-use fallback for sites where DOM targeting fails
- Build screenshot capture and Supabase Storage upload
- Send confirmation + trail URL back to Telegram
- Exit check: execute one real cancellation end-to-end; screenshot trail stored; Telegram confirmation delivered; dark-pattern guard logged at least one refusal on a known retention UI

### Phase 4 — Hardening + eval suite (exit: demo-ready)
- Expand synthetic statement fixtures to 10+ scenarios; tune detector thresholds
- Add graceful degradation: heuristic-only mode when financial MCP unavailable; offline fixture mode for demo
- Build `downgrade` flow variant (Playwright navigates to plan management, proposes lower tier for human to confirm)
- Add scheduled weekly Temporal cron; on-demand `/scan` Telegram command
- Langfuse eval suite: run synthetic statements nightly, alert on precision/recall regression
- Exit check: demo script runs clean; eval suite green; all phases documented

---

## Differentiation

**vs. Rocket Money / Truebill:**
- Those services often require linking payment credentials or handing off to human agents who execute cancellations opaquely. You cannot see the cancellation flow, there is no screenshot proof trail, and you cannot verify the cancellation actually happened.
- Leech is self-hosted, read-only on money, and executes every cancellation visibly with a screenshot at each step. The dark-pattern guard is explicit and auditable; Rocket Money's equivalent (if it exists) is not.
- Leech's detector is open, unit-tested Python. Rocket Money's categorisation is a black box.

**vs. grocery-buddy:**
- Grocery-buddy spends money to acquire things (Amazon restock). Leech's entire job is to stop spend. Same gate discipline, opposite polarity.
- Grocery-buddy's actuation is a Playwright cart-staging flow that ends in a human placing an order. Leech's actuation is a Playwright cancellation flow that ends in confirmed deletion. The HITL gate is structurally identical; the action is inverted.
- No domain overlap. Grocery-buddy knows nothing about financial anomaly detection or merchant memory.

**vs. procurement-agent:**
- Procurement-agent manages B2B purchasing with HMAC-signed spend mandates and Lithic ASA auth loops. It holds payment authority in a carefully governed way. Leech never holds payment authority and cannot initiate spend of any kind.
- The problem domains are orthogonal: procurement-agent is about responsible spend initiation; Leech is about spend elimination.
- Leech borrows the gate discipline (approval before irreversible action) but applies it to a consumer personal-finance context with a different threat model (dark-pattern UIs vs. prompt injection in B2B contexts).

**vs. jim-agent:**
- Jim is read-only financial research sold as a product over x402. Leech is financial monitoring that drives real-world action on your behalf. Jim never touches anything irreversible; Leech does (with a gate).
- Jim's deterministic gate is sourcing/citation integrity. Leech's deterministic gate is anomaly detection + dark-pattern refusal. Related discipline, different domain.
- Jim monitors market data and company filings; Leech monitors your personal transaction history.

**vs. dj-agent:**
- No overlap. Completely different domain.

---

## Resume Bullets

- Built a personal finance watchdog agent (Leech) that clusters 90 days of transactions into recurring series, detects zombie subscriptions and silent price increases with a pure-Python materiality gate (>90% precision, <5% false-positive rate on synthetic benchmarks), and drives cancellation through adversarial retention UIs via Playwright with a deterministic dark-pattern guard — recovering ~$47/mo in a live demo without ever holding payment authority.
- Designed and implemented a layered trust architecture for an irreversible-action agent: LLM restricted to merchant labelling and human-readable briefing; all anomaly scoring, keep-list lookup, signal validation, and browser-click decisions executed by deterministic Python and YAML-driven guardrails — directly mapping to EU AI Act Article 12 (automatic logging) and Article 14 (human oversight) compliance requirements.
- Delivered end-to-end approval-gated automation on no-API consumer sites using Temporal durable workflows, Telegram HITL inline buttons, and a Playwright computer-use executor with screenshot-per-step audit trail stored in Supabase — demonstrating the same read-only-first/gated-write trust architecture used in enterprise SaaS-spend management (Ramp/FinOps category).

---

## Risks & Open Questions

**Data access reliability**
- Plaid's transaction feed has a ~24-48 hour lag and limited merchant metadata quality. Credit card transactions from some issuers are heavily truncated (e.g., "AMZN*MK7Y2" instead of "Amazon Prime"). The merchant canonicalisation pipeline (Haiku + pgvector) must handle this gracefully. ADR needed: Plaid vs. a screen-scraping fallback vs. manual CSV import as the primary ingest path.

**Cancellation flow brittleness**
- Subscription cancellation UIs change frequently (A/B testing is common on retention flows). The Playwright selectors will break. The YAML dark-pattern blocklist needs a maintenance discipline. Consider: computer-use vision as the primary path (more robust to DOM changes) with DOM-based selectors as the fast-path optimisation. ADR needed: DOM-first vs. vision-first for the executor.

**Sites with no web cancellation flow**
- Some subscriptions can only be cancelled by calling a phone number or sending a certified letter (some gyms, ISPs, cable providers). The executor should detect this case (no cancellation URL found after N steps) and fall back to drafting a cancellation letter or surfacing the phone number — not silently fail.

**Keep-list cold start**
- The first scan will surface annual charges the user intentionally keeps (insurance, domain registration, software licenses) as potential zombies. The cold-start UX matters: either a one-time "tell me your intentional subscriptions" onboarding step, or an aggressively conservative materiality threshold on the first run.

**Gmail MCP scope**
- Scanning inbox receipts requires read access to email, which is a significant trust ask. The adapter should use the most restrictive OAuth scope possible (read-only, preferably filtered to a receipts label or sender domain allowlist). Document the exact scopes requested prominently.

**Financial MCP cost and rate limits**
- Plaid's personal-use pricing and rate limits need to be confirmed for a weekly-scan pattern. Evaluate whether a user-provided CSV export is a sufficient no-cost alternative for the MVP, with Plaid as an optional upgrade.

**Screenshot trail storage cost**
- A weekly scan that triggers multiple cancellations will accumulate significant Supabase Storage. Add a TTL/retention policy (e.g., 90-day auto-delete) and document it.

**Downgrade flow complexity**
- Downgrading a plan is significantly more complex than cancellation: it involves navigating to plan management, understanding the current vs. available tiers, and confirming the right option. Phase 4 scopes this conservatively — present the plan options to the human, let them choose, then execute the selection. Full autonomous downgrade recommendation is out of scope for MVP.
