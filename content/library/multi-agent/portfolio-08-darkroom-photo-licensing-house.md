---
title: Darkroom
collection: multi-agent
source: ~/dev/multi-agent-docs/portfolio/08-darkroom-photo-licensing-house.md
sourceMtime: '2026-06-11T23:34:32.064Z'
syncedAt: '2026-07-09'
summary: >-
  The agent-native licensing house for verified-human photography: ingest a
  photographer's archive, anchor every image to a C2PA-backed provenance tier,
  license through a human storefront AND an MCP/…
contentHash: 'sha256:a7f3c7f7e55adbe747b6ff57747a38ef899970455adf43794314d68d4281c9b2'
---
# Darkroom
> The agent-native licensing house for verified-human photography: ingest a photographer's archive, anchor every image to a C2PA-backed provenance tier, license through a human storefront AND an MCP/x402 endpoint where a buyer's agent can discover, quote, pay, and receive a licensed asset in seconds — then patrol for unlicensed use with a deterministic enforcement ladder that never escalates past a friendly invoice without a human tap. In the slop era, "verified human" is the premium SKU, and the licensing counterparty is increasingly an agent.

**Bucket:** frontier · **Effort:** L · **Reuses:** agent-core tiering + budget tracking, jim-agent's x402 buyer AND seller paths + price-preflight + signed receipts, procurement-agent's Ed25519/HMAC signing utils + gate house style + hash-chained audit writer, grocery-buddy's Telegram inline-button HITL ergonomics, Gauntlet reliability harness (fake-C2PA injection / adversarial-buyer / false-match suites), Vend's settlement-verify-before-fulfill + rate-limit patterns, Temporal durable workflows, Supabase Postgres + pgvector, Langfuse, Doppler, Hetzner + Cloudflare Tunnel

---

## TL;DR

Darkroom is a licensing agency run by agents, for photographs provably made by humans. It ingests a working photographer's archive, builds a per-image provenance record anchored on C2PA capture-signing where the hardware supports it (and multi-signal attestation where it doesn't), and assigns a deterministic provenance tier — Tier A verified-capture, Tier B attested, Tier C unverified — that controls which price bands an image may sell in. It then licenses through two storefronts at once: a human web store with Stripe, and an agent-native MCP server with x402 payment where a news desk's buying agent can search, quote, pay in USDC, and receive an Ed25519-signed license receipt plus delivery URL in about eight seconds. A scheduled enforcement plane sweeps the web for unlicensed use of the licensed catalog, captures evidence deterministically, and climbs a hard-coded ladder — friendly notice + retroactive invoice auto-allowed, DMCA takedown and counsel referral strictly behind human taps — designed from day one to be safe under DMCA §512(f). The photographer keeps 85–90% of every license, inverting the ~15% Getty pays non-exclusive contributors. The model proposes captions, keywords, prices, and fair-use assessments; pure code owns the release check, the tier, the price floor, the settlement, the ladder, and the payout. The riskiest assumption — that buyers will actually pay a premium for verified-human — is named honestly and the pilot is designed to test it with 1–2 paying editorial buyers, publishing the result either way.

---

## The Problem

Working photographers are being squeezed from both ends — and the back office that could save them doesn't exist.

**The supply-side squeeze is generative.** Stock photography was a $6.1B market in 2025, but AI-generated images went from roughly 5% to 35% of new stock uploads, traditional stock photographers report 15–40% revenue declines, and average licensing fees are down ~28% since 2024 (directional figures, ZSky AI industry report, 2026). The race to the bottom is structural: microstock pays $0.10–$2.00 per download, and a diffusion model's marginal image costs less than that.

**The demand side just consolidated against the contributor.** The Getty–Shutterstock merger cleared the DOJ unconditionally on Feb 23, 2026, and the UK CMA conditionally cleared it around May 15, 2026, requiring divestiture of Shutterstock's editorial business; the combined entity targets $150–200M in cost synergies (merger filings, 2026). Cost synergies in an agency mean contributor rate compression — Getty's non-exclusive payout is already ~15%, i.e., the agency keeps 85%. The 85/15 split is the single number Darkroom exists to invert.

**The authenticity infrastructure just arrived — in hardware.** C2PA capture-signing now ships in real cameras and phones: Leica M11-P, Sony Alpha 1 II / 9 III ("Camera Sign"), Canon EOS R1 / R5 II (firmware, Jul 2025), Samsung Galaxy S25, and Google Pixel 10 with hardware-backed signing at C2PA Assurance Level 2 (Aug 2025). Canon launched a C2PA Authenticity Imaging System for newsrooms with Reuters (May 11, 2026). Two honest caveats shape Darkroom's design. First, adoption is early: fewer than 1% of news images globally carry C2PA metadata (Reuters Institute), and the verified-human *price premium* is vendor marketing, not yet documented in buyer rate cards — Darkroom's pilot is explicitly the experiment that validates or falsifies it. Second, provenance chains can be compromised: Nikon's Z6III C2PA certificate was revoked in Sep 2025 after a vulnerability let AI-generated content get signed. Blind C2PA trust is therefore disqualified by the record; Darkroom verifies with multiple independent signals.

**The back-office gap is explicit whitespace.** The photographer-AI tools that exist — Aftershoot ($45/mo), Imagen AI, Narrative — own culling and editing. None touch licensing, rights management, distribution, or enforcement. Darkroom deliberately does not compete on culling or editing; it is the business layer above them.

**Enforcement today is a troll-shaped industry.** Pixsy, Copytrack, and ImageRights run success-fee models taking ~30–50% of recovery, cherry-pick the $500–$10K resolutions, and run on manual labor. Meanwhile, automated DMCA abuse is a rising liability: the Ninth Circuit requires fair-use consideration *before* a takedown is sent (Lenz v. Universal, the controlling posture), and §512(f) imposes liability for reckless automated claims. An agent that fires takedowns autonomously is a lawsuit generator. Darkroom's answer is a deterministic ladder where the only auto-allowed step is a polite invoice, and everything sharper requires a documented human decision.

**And the buyer is becoming an agent.** Automated systems now account for 57.5% of HTTP requests (Cloudflare, Jun 2026); Cloudflare's pay-per-crawl sends over 1B HTTP 402 responses per day. Getty licenses programmatically via API (including to Perplexity), but its API is designed for media-company developers with contracts and API keys — not for an autonomous agent that needs to discover terms, quote, pay, and receive in one machine-readable flow. No agent-native storefront with machine-readable license terms, instant payment, and delivery exists for human photography. That is the whitespace Darkroom's headline demo occupies.

---

## What It Does

**Core capabilities:**

- **Archive ingestion and intelligence.** Accepts uploads or Lightroom exports; Sonnet captions and keywords every image (vision); CLIP-class embeddings land in pgvector for semantic search; a quality triage pass flags the licensable subset. The model's captions are searchable metadata — never a licensing decision.
- **Provenance tiering at ingest.** Every image gets a deterministic tier from verifiable signals: **Tier A (verified-capture)** — valid hardware-signed C2PA manifest whose certificate chain verifies against a maintained trust list (with revocation checking: the Nikon lesson); **Tier B (attested)** — photographer affidavit + RAW file on deposit + EXIF coherence checks pass; **Tier C (unverified)** — everything else. The tier is a pure function of stored evidence; it selects the eligible price bands and the badge shown to buyers. C2PA alone never suffices for Tier A pricing power without corroborating signals: RAW-pair check, EXIF coherence, and a reverse-image-search novelty check run on every Tier A/B candidate.
- **The release gate.** Model and property releases are first-class records. The gate is absolute: no commercial license can issue for an image containing identifiable people or property without a matching release on file. Editorial licensing remains available with the standard editorial-use disclaimer compiled into the license. Sonnet *proposes* "this image likely contains identifiable people" at ingest; the photographer confirms; the gate reads only the confirmed flags and release rows.
- **Licenses as data, prices in an envelope.** License terms are machine-readable structures — usage type, media, territory, duration, exclusivity, seat count — compiled deterministically from versioned templates. Sonnet proposes a price per quote using comparable-sale context; a pure-code **price envelope** (per-tier floor and ceiling per usage band, photographer-set minimums, no discount below floor, ever) accepts or refuses the proposal whole. A manipulated pricing model can only lose a sale; it cannot give work away.
- **Dual storefront.** Humans browse a watermarked-preview web store and pay via Stripe Checkout. Agents get a first-class MCP server (`search_catalog`, `get_image_preview`, `get_provenance`, `get_license_quote`, `purchase_license`, `get_receipt`) plus raw x402 endpoints: quote → HTTP 402 → USDC settlement on Base → settlement verified on-chain → Ed25519-signed license receipt + watermark-free delivery URL (24h TTL). Every issued license is a hash-chained audit entry. A Darkroom storefront can carry a Surety bond so unfamiliar buyer agents can price its trustworthiness — referenced, not required.
- **Enforcement with a leash.** A Temporal cron sweeps reverse-image search over the licensed catalog. Each match flows: deterministic evidence capture (URL, screenshot, DOM snapshot, perceptual hash, timestamp) → deterministic license-DB check (is this exact use covered by an issued license?) → Opus fair-use/edge-case classifier (strictly advisory — it can *block* escalation, never authorize it) → the **enforcement ladder**: step 1 friendly notice + retroactive-license invoice (auto-allowed under rate caps), step 2 DMCA takedown (HITL required, with a human-attested fair-use checklist), step 3 referral to counsel or Pixsy (HITL required). Any photographer or reviewer veto poisons that match pattern so it never auto-fires again.
- **The royalty flip.** A per-license ledger splits every dollar: photographer 85–90%, house 10–15% — the inverse of the incumbent split. Monthly statements generate automatically; a reconciliation gate (every license row mapped, ledger totals equal to Stripe + on-chain balances to the cent) must pass before any payout batch executes.

**Walked-through example — one license, one infringement, two gates (the headline flow):**

```
21:42:03  AGENT BUYER (the eight-second license)
  A news desk's buying agent needs: "verified-human photo, tonight's city council
  protest, editorial use, web, 1 year." It resolves Darkroom's MCP server.
  → search_catalog(q="city council protest", tier="A", taken_after="2026-06-10")
      → [{image_id:"img_04417", caption:"Demonstrators outside city hall…",
          tier:"A", c2pa:"verified:sony-a1m2", bands:["editorial"], thumb:"…"}]
  → get_provenance("img_04417") → C2PA manifest chain + signals:
      {c2pa_chain:"VALID (Sony cert, not revoked)", raw_pair:"on_deposit",
       exif_coherent:true, novelty_check:"no_prior_web_match"}
      Buyer's policy verifies the chain independently before committing funds.
  → get_license_quote(image_id="img_04417", usage="editorial", media=["web"],
      territory="US", duration_months=12, exclusivity="non-exclusive")
      Sonnet proposes $185 from comparable sales context.
      PRICE ENVELOPE (pure code): Tier A editorial-web band floor $120, ceil $500;
      photographer minimum $150 ✓ ; 185 within band ✓ → quote q_5512 issued, TTL 15m.
  → purchase_license("q_5512") → HTTP 402 Payment Required
      {scheme:"x402", network:"base", asset:"USDC", amount:"185.00", payTo:"0xDRKM…"}
  → buyer settles 185.00 USDC → retries with X-PAYMENT header
  → Darkroom verifies settlement on-chain; amount == quoted amount exactly (preflight)
  → RELEASE GATE re-check at issuance: usage=editorial → identifiable-people release
      not required; editorial disclaimer compiled into terms ✓
  → license compiled from template DRK-ED-WEB-1.2 → Ed25519-signed receipt +
      watermark-free delivery URL (24h TTL). Elapsed: ~8 seconds.
  ROYALTY LEDGER: photographer_due 157.25 (85%) | house 27.75 (15%)
  AUDIT: license|x402|img_04417|185.00|tx 0x8c1d…|receipt lic_7f3a9c → chain #9,114

  The signed receipt the buyer's agent stores:
  {
    "receipt_id": "lic_7f3a9c",
    "image_id": "img_04417",
    "provenance_tier": "A",
    "c2pa_manifest_hash": "sha256:e3b0c442…",
    "license": {"template":"DRK-ED-WEB-1.2","usage":"editorial","media":["web"],
                "territory":"US","duration_months":12,
                "exclusivity":"non-exclusive","seats":1,
                "disclaimer":"editorial-use-only"},
    "price_usd": "185.00",
    "settlement": {"rail":"x402","network":"base","asset":"USDC","tx":"0x8c1d…"},
    "licensee": {"wallet":"0xBUYER…","declared_org":"metro-desk.agent"},
    "issued_at": "2026-06-11T21:42:11Z",
    "audit_seq": 9114,
    "sig": "ed25519:mJq2…"
  }

03:12:44 (+3 days)  ENFORCEMENT SWEEP (Temporal cron)
  Reverse-image search over the licensed catalog finds img_04417 on an HVAC
  company's marketing blog — not the news desk's site.
  → EVIDENCE CAPTURE (deterministic): URL, full-page screenshot, DOM snapshot,
      pHash distance 3, timestamp — written before any judgment is made.
  → LICENSE-DB CHECK (deterministic): no license covers this domain or this
      usage class (commercial-web). covered = false.
  → Opus fair-use advisory: "commercial marketing use; fair use unlikely" (0.91).
      Advisory can only de-escalate; it cannot authorize anything.
  → ENFORCEMENT LADDER step 1 (auto-allowed: covered=false ∧ phash ≤ 6 ∧
      advisory did not flag plausible fair use ∧ domain not poisoned ∧
      rate caps clear): friendly notice + retroactive invoice generated at the
      deterministic retro rate — commercial-web band list price $185 × 2.0 = $370.
  → Step 2 (DMCA) is QUEUED, not sent: Telegram card to George with the evidence
      packet and the human-attested fair-use checklist. No tap, no takedown.

  The evidence record:
  {
    "match_id": "mt_2208",
    "image_id": "img_04417",
    "found_url": "https://blog.example-hvac.com/why-cities-fail",
    "evidence": {"screenshot_key":"ev/mt_2208.png","dom_key":"ev/mt_2208.html",
                 "phash_distance":3,"captured_at":"2026-06-14T03:12:44Z"},
    "license_check": {"covered":false,"nearest_license":null},
    "fairuse_advisory": {"model":"opus-4.8","assessment":"unlikely_fair_use",
                         "confidence":0.91,"role":"ADVISORY_ONLY"},
    "ladder_step": 1,
    "action": "friendly_notice_with_invoice",
    "invoice_usd": "370.00",
    "next_step_requires_hitl": true
  }
```

One image, two planes, and the same property both times: the model informed the decision; named, testable code made it.

---

## Why This Project, Why Now

1. **Both halves of the thesis meet in one market.** "Model proposes, code disposes" gates four irreversible actions here — issuing a license, setting a price, accusing a stranger of infringement, paying out money. "Verified orchestration" composes five planes (archive, provenance, licensing, enforcement, royalty) into one accountable house with a hash-chained spine. No sibling project has an *accusation* as its gated irreversible action; the enforcement ladder is a genuinely new cell in the proof matrix.
2. **The hardware window just opened.** C2PA capture-signing shipped across Leica, Sony, Canon, Samsung, and Pixel between 2024 and Aug 2025, and Canon+Reuters productized newsroom verification in May 2026 — but <1% of news images carry the metadata yet (Reuters Institute). Mid-2026 is exactly when a provenance-first catalog is differentiated and not yet commoditized. In 18 months "C2PA-verified" will be a Getty filter checkbox; today it can be a house.
3. **The buyer wave is measurable.** 57.5% of HTTP traffic is automated (Cloudflare, Jun 2026); 1B+ 402s/day flow through pay-per-crawl. Agents with wallets are arriving on the demand side of *content* first — and nobody has built them a photography counter. Darkroom puts George on the sell side of the exact x402 wave his buy-side agents ride, with a licensing twist Vend's digital goods don't have: rights, releases, territories, and enforcement.
4. **Consolidation is the recruiting pitch to photographers.** The Getty–Shutterstock merger (DOJ cleared Feb 23, 2026; CMA conditionally May 2026) plus 15–40% revenue declines means working photographers are *actively looking* for an alternative in 2026. "Keep 85–90%, with books you can audit" is a pitch the moment makes credible.
5. **The enforcement whitespace is a safety story.** Pixsy-class services take 30–50% and run on humans; naive automation runs into §512(f) and the Ninth Circuit's fair-use-first requirement. A deterministic ladder with a hard HITL gate above the invoice step is the only architecture that can automate this *without becoming a troll* — and it is precisely the kind of legally-aware gate design a 2027 hiring panel reads as seniority.
6. **Honest science is differentiation.** The verified-human premium is asserted by camera vendors and unproven in rate cards. Darkroom's P5 is designed as a real experiment with 1–2 paying editorial buyers, published either way. A portfolio project that *names its riskiest assumption and tests it* is worth more than one that assumes its market.
7. **The dogfood is real.** George has working access to the photography world via the WinPhotography projects (`~/dev/WinPhotography`) — a credible path to one real photographer's archive for the pilot — plus his own Pixel hardware-signed C2PA captures for end-to-end Tier A testing. Real archive, real releases, real sales targets: the pilot doesn't need to be hypothetical.

---

## Architecture

Five planes. Every LLM call lives on the proposal side; every irreversible action — license issuance, price application, enforcement action, payout — sits behind a deterministic gate. Orchestration is Temporal end-to-end: an ingest workflow per upload batch, a license-sale workflow per transaction, an enforcement cron workflow per sweep, a child workflow per match (so a HITL decision can park for days without losing state), and a monthly payout workflow. Verified-orchestration topology: the Opus fair-use judge is wired as an *advisory verifier* — its output can only suppress an action the deterministic check already authorized, never create one.

```mermaid
flowchart TD
    subgraph ARC["1 · Archive plane"]
        ING["ingest: upload / Lightroom export"]
        CAP["Sonnet: caption + keywords + people/property flags (vision)"]
        EMB[("pgvector: CLIP embeddings")]
        REL["release registry: model + property releases"]
    end

    subgraph PROV["2 · Provenance plane"]
        C2PA["C2PA manifest validation:<br/>cert chain + revocation list"]
        SIG["multi-signal checks — code:<br/>RAW-pair on deposit, EXIF coherence,<br/>reverse-image novelty"]
        TIER["PROVENANCE TIER GATE — pure code:<br/>A = valid hw-signed C2PA + signals<br/>B = affidavit + RAW + EXIF coherent<br/>C = otherwise<br/>tier selects eligible price bands"]
    end

    subgraph LIC["3 · Licensing plane"]
        QUOTE["Sonnet: price proposal<br/>from comparable-sale context"]
        ENV["PRICE ENVELOPE — pure code:<br/>per-tier per-band floor/ceiling,<br/>photographer minimums,<br/>no discount below floor"]
        RGATE["RELEASE GATE — pure code:<br/>identifiable people/property +<br/>commercial usage ⇒ release row<br/>required, else REFUSE<br/>(editorial OK w/ disclaimer)"]
        COMP["license compiler:<br/>versioned templates → terms-as-data"]
        WEB["human storefront:<br/>watermarked previews → Stripe"]
        MCPS["agent storefront: MCP server +<br/>x402 endpoints (USDC on Base)"]
        PRE["SETTLEMENT PREFLIGHT — code:<br/>on-chain amount == quote exactly,<br/>verify before delivery,<br/>Ed25519-signed receipt"]
    end

    subgraph ENF["4 · Enforcement plane"]
        SWEEP["Temporal cron: reverse-image<br/>sweep over licensed catalog"]
        EV["EVIDENCE CAPTURE — code:<br/>URL, screenshot, DOM, pHash, ts"]
        LCHK["LICENSE-DB CHECK — code:<br/>is this use covered?"]
        FU["Opus: fair-use / edge classifier<br/>ADVISORY — may only de-escalate"]
        LAD["ENFORCEMENT LADDER — pure code:<br/>1 notice + retro invoice (auto, rate-capped)<br/>2 DMCA takedown (HITL REQUIRED)<br/>3 counsel / Pixsy referral (HITL REQUIRED)<br/>veto ⇒ poison match pattern"]
    end

    subgraph ROY["5 · Royalty plane"]
        LED[("per-license ledger:<br/>85–90% photographer split")]
        RECON["RECONCILIATION GATE — code:<br/>every license row mapped,<br/>ledger ≡ Stripe ≡ on-chain to the cent,<br/>else NO payout batch"]
        PAY["payout batch + monthly statements"]
    end

    PHOT["Photographer<br/>(portal + Telegram)"] -.-> ING
    PHOT -.-> REL
    BUYA["Agent buyer<br/>(news-desk agent)"] -.-> MCPS
    BUYH["Human buyer"] -.-> WEB

    ING --> CAP --> EMB
    ING --> C2PA --> SIG --> TIER
    TIER --> QUOTE
    QUOTE --> ENV
    ENV --> RGATE --> COMP --> PRE
    WEB --> RGATE
    MCPS --> ENV
    PRE --> LED
    COMP --> SWEEP
    SWEEP --> EV --> LCHK --> FU --> LAD
    LAD -->|"retro invoice paid"| LED
    LED --> RECON --> PAY
    LAD -.->|"step ≥ 2"| HITL["Telegram HITL<br/>(durable signal + timer)"]
    PHOT -.->|veto| LAD

    AUD[("hash-chained audit log<br/>SHA-256, append-only,<br/>EU AI Act Art. 12")]
    TIER --> AUD
    ENV --> AUD
    RGATE --> AUD
    PRE --> AUD
    LAD --> AUD
    RECON --> AUD

    classDef gate fill:#d4edda,stroke:#28a745,color:#000
    classDef llm fill:#fff3cd,stroke:#ffc107,color:#000
    classDef store fill:#cce5ff,stroke:#004085,color:#000
    class TIER,ENV,RGATE,PRE,EV,LCHK,LAD,RECON gate
    class CAP,QUOTE,FU llm
    class EMB,LED,AUD store
```

### The governance summary table (the slide)

| Irreversible action | Model's role | Deterministic gate (pure code, zero LLM) | On breach / refusal | Audit entry |
|---|---|---|---|---|
| Assign provenance tier | None — flags inputs only | Tier = f(C2PA chain valid ∧ cert not revoked, RAW on deposit, EXIF coherent, novelty check); recompute on trust-list update | Image trades in lower tier's bands | `tier_assigned` w/ signal vector |
| Issue a commercial license | Proposes caption/people flags at ingest | Release gate: identifiable people/property ⇒ matching release row required; editorial passes w/ compiled disclaimer | License refused, named rule | `license_refused` w/ rule |
| Set a quote price | Proposes price + rationale | Envelope: `band_floor ≤ p ≤ band_ceiling ∧ p ≥ photographer_min`; refuses whole, never clamps | Quote not issued; model may re-propose | `quote` w/ verdict + rule |
| Deliver the asset | — (no model on path) | x402 settlement verified on-chain, amount == quote exactly, then sign receipt + scoped URL; Stripe webhook signature verified | No delivery, no ledger entry | `license` w/ tx + receipt id |
| Accuse (step 1: notice + invoice) | Fair-use advisory (de-escalate only) | `covered=false ∧ phash ≤ 6 ∧ advisory ≠ plausible_fair_use ∧ domain not poisoned ∧ ≤1 notice/domain/30d ∧ ≤10 notices/day` | Match parked for review | `enforcement` step 1 w/ evidence keys |
| Escalate (step 2 DMCA, step 3 counsel) | Drafts the packet | **HITL required** — Telegram inline tap + human-attested fair-use checklist (Lenz/§512(f) posture); auto-expire 7d | Stays queued, then expires | `enforcement` w/ approver + checklist hash |
| Kill a false positive | — | Photographer/reviewer veto poisons the (pHash neighborhood × domain) pattern permanently | Future matches auto-suppressed | `match_poisoned` w/ vetoer |
| Pay photographers | Drafts statement narrative | Reconciliation gate: every license mapped, split math exact, ledger ≡ Stripe ≡ on-chain to the cent | **Payout batch blocked** + page | `recon_run` PASS/FAIL |

**The safety property:** a manipulated, jailbroken, or simply wrong model can mis-caption an image, propose a bad price, or misjudge fair use — and the blast radius is respectively a bad search result, a refused quote, and a *suppressed* enforcement action. It can never issue an unreleased commercial license, sell below a photographer's floor, deliver an unpaid asset, send a DMCA notice, or move a payout cent. Those five things are pure functions of database facts.

---

## Tech Stack

| Layer | Technology | Reuses | Notes |
|---|---|---|---|
| Orchestration | Temporal (Python SDK) | procurement-agent / Vend workflow patterns | Ingest, sale, sweep-cron, per-match child workflows, monthly payout; HITL as durable signals w/ timers |
| Reasoning | Claude Haiku 4.5 / Sonnet 4.6 / Opus 4.8 via agent-core | agent-core tiering + budget tracking | Haiku: triage/dedupe; Sonnet: vision captioning, keywording, price proposals; Opus: fair-use advisory, monthly statement narrative |
| C2PA validation | c2pa-python (CAI SDK) + maintained cert trust list w/ revocation | — (new) | Manifest + chain verify at ingest; trust list updates trigger tier recompute (Nikon-revocation drill) |
| Multi-signal provenance | exiftool + rawpy (RAW-pair), pHash, reverse-image novelty (Google Vision web detection) | — (new) | Tier A/B requires corroboration; C2PA alone never suffices |
| Gates (tier, release, envelope, ladder, recon) | Pure Python modules, stdlib-only | procurement-agent gate house style, 100% branch-tested | Zero LLM, zero network on every decision path |
| Embedding search | pgvector + CLIP-class image embeddings | grocery-buddy/jim pgvector patterns | Semantic catalog search for both storefronts |
| Human payments | Stripe Checkout + webhooks + Stripe Tax | Vend's Stripe plane | No card data on the box |
| Agent payments | x402 seller side, USDC on Base | jim-agent x402 paths + price-preflight; Vend's settlement-verify-before-fulfill | Quote-bound 402 challenges; exact-amount equality |
| Receipts / licenses | Ed25519 (PyNaCl); licenses as versioned JSON templates | procurement-agent signing utils verbatim | Receipt = signed (image, terms, price, tx, tier); independently verifiable |
| Enforcement evidence | Playwright screenshot + DOM snapshot, pHash, object storage | — (new) | Captured before judgment; immutable evidence keys in audit |
| Reverse-image sweeps | Google Vision web detection (primary), TinEye API (spot-check) | — (new) | Weekly cron over licensed catalog first, full catalog as budget allows |
| HITL | Telegram inline buttons + photographer portal queue | grocery-buddy / procurement-agent UX | Approve/Deny/Veto; veto poisons the match pattern |
| State + audit | Supabase Postgres; SHA-256 hash-chained audit | every sibling | EU AI Act Art. 12 posture |
| Storefront (human) | Next.js, watermarked previews, behind Cloudflare Tunnel | Vend's deliberately-boring store | Tier badges on every image |
| Storefront (agent) | FastMCP server + FastAPI x402 endpoints | jim-agent MCP pattern; Vend rate-limit/abuse controls | Token buckets per wallet/IP; optional Surety bond reference in catalog metadata |
| Originals storage | Cloudflare R2 (RAW + masters), scoped delivery URLs | — (new) | RAW deposit is a Tier B requirement and a Tier A corroborator |
| Observability | Langfuse | every sibling | Cost per ingest batch, per sale, per sweep |
| Reliability | Gauntlet suites in CI | Gauntlet (sibling) | Fake-C2PA injection, adversarial buyers, false-match bait |
| Secrets / infra | Doppler; containers on disposable Hetzner box; Cloudflare Tunnel | house convention | Box is cattle; Temporal + Postgres + R2 = rebuild-from-zero tested |

---

## Data Model

Postgres DDL sketch — the load-bearing tables. Licenses and enforcement records are INSERT-only; corrections post as superseding rows, never edits.

```sql
-- ============ archive plane ============
CREATE TABLE photographers (
  id            text PRIMARY KEY,              -- ph_eliot
  display_name  text NOT NULL,
  payout_split  numeric(4,3) NOT NULL DEFAULT 0.850
                CHECK (payout_split BETWEEN 0.850 AND 0.900),
  payout_rail   jsonb NOT NULL,                -- stripe acct | usdc addr
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE images (
  id              text PRIMARY KEY,            -- img_04417
  photographer_id text NOT NULL REFERENCES photographers(id),
  object_key      text NOT NULL,               -- R2 master
  raw_object_key  text,                        -- RAW deposit (tier B requirement)
  sha256          text NOT NULL UNIQUE,
  caption         text,                        -- Sonnet: searchable, never decisive
  keywords        text[],
  has_identifiable_people  boolean NOT NULL DEFAULT true,  -- conservative default
  has_identifiable_property boolean NOT NULL DEFAULT false,
  taken_at        timestamptz,
  embedding       vector(768),
  status          text NOT NULL DEFAULT 'triage'
                  CHECK (status IN ('triage','live','retired'))
);

CREATE TABLE releases (
  id              text PRIMARY KEY,            -- rel_0091
  photographer_id text NOT NULL REFERENCES photographers(id),
  kind            text NOT NULL CHECK (kind IN ('model','property')),
  subject_ref     text NOT NULL,               -- name/parcel as on the signed form
  document_key    text NOT NULL,               -- scanned release in R2
  valid_until     date
);
CREATE TABLE image_releases (                  -- the RELEASE GATE reads only this join
  image_id   text REFERENCES images(id),
  release_id text REFERENCES releases(id),
  PRIMARY KEY (image_id, release_id)
);

-- ============ provenance plane ============
CREATE TABLE provenance_records (
  image_id        text PRIMARY KEY REFERENCES images(id),
  c2pa_valid      boolean NOT NULL,
  c2pa_issuer     text,                        -- 'sony-camera-sign', 'pixel-10-al2'
  c2pa_manifest_hash text,
  cert_revoked    boolean NOT NULL DEFAULT false,  -- recomputed on trust-list update
  raw_pair_ok     boolean NOT NULL DEFAULT false,
  exif_coherent   boolean NOT NULL DEFAULT false,
  novelty_ok      boolean NOT NULL DEFAULT false,  -- reverse-image: no prior web match
  affidavit_key   text,                        -- signed photographer attestation (tier B)
  tier            char(1) NOT NULL CHECK (tier IN ('A','B','C')),
  tier_computed_at timestamptz NOT NULL DEFAULT now()
);  -- tier is DERIVED by the gate from the columns above; recompute job on trust events

-- ============ licensing plane ============
CREATE TABLE license_templates (
  id      text PRIMARY KEY,                    -- DRK-ED-WEB-1.2
  version text NOT NULL,
  terms   jsonb NOT NULL                       -- usage, media, territory, duration,
);                                             -- exclusivity, seats, disclaimers

CREATE TABLE price_bands (                     -- the ENVELOPE's lookup table
  tier        char(1) NOT NULL,
  usage_band  text NOT NULL,                   -- editorial-web | editorial-print |
                                               -- commercial-web | commercial-campaign | exclusive
  floor_usd   numeric(10,2) NOT NULL,
  ceiling_usd numeric(10,2) NOT NULL,
  PRIMARY KEY (tier, usage_band)
);
-- seed: ('A','editorial-web',120,500) ('A','commercial-web',250,2500)
--       ('A','exclusive',500,10000)   ('B','editorial-web',60,250)
--       ('C','editorial-web',15,60)   -- tier C: editorial only, disclaimer compiled

CREATE TABLE quotes (
  id           text PRIMARY KEY,               -- q_5512
  image_id     text NOT NULL REFERENCES images(id),
  template_id  text NOT NULL REFERENCES license_templates(id),
  proposed_usd numeric(10,2) NOT NULL,         -- model output
  verdict      text NOT NULL CHECK (verdict IN ('issued','refused')),
  named_rule   text,                           -- e.g. 'below_photographer_min'
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE licenses (                        -- INSERT-only (REVOKE UPDATE, DELETE)
  id           text PRIMARY KEY,               -- lic_7f3a9c
  quote_id     text NOT NULL REFERENCES quotes(id),
  image_id     text NOT NULL REFERENCES images(id),
  terms        jsonb NOT NULL,                 -- compiled, frozen at issuance
  price_usd    numeric(10,2) NOT NULL,
  channel      text NOT NULL CHECK (channel IN ('stripe','x402')),
  payment_ref  text NOT NULL UNIQUE,           -- pi_… | base txhash (idempotency)
  licensee_ref text NOT NULL,                  -- wallet | stripe customer
  receipt_sig  text NOT NULL,                  -- Ed25519 over canonical receipt
  issued_at    timestamptz NOT NULL DEFAULT now()
);

-- ============ enforcement plane ============
CREATE TABLE enforcement_matches (
  id           text PRIMARY KEY,               -- mt_2208
  image_id     text NOT NULL REFERENCES images(id),
  found_url    text NOT NULL,
  domain       text NOT NULL,
  phash_distance int NOT NULL,
  evidence     jsonb NOT NULL,                 -- screenshot/DOM keys, captured_at
  covered      boolean NOT NULL,               -- deterministic license-DB check
  fairuse_advisory jsonb,                      -- model output: ADVISORY ONLY
  ladder_step  int NOT NULL DEFAULT 0 CHECK (ladder_step BETWEEN 0 AND 3),
  status       text NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','invoiced','paid','escalated',
                                 'vetoed','expired','poisoned')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE enforcement_actions (             -- INSERT-only
  id          text PRIMARY KEY,
  match_id    text NOT NULL REFERENCES enforcement_matches(id),
  step        int  NOT NULL CHECK (step IN (1,2,3)),
  decided_by  text NOT NULL CHECK (decided_by IN
              ('gate_auto','hitl_approve','hitl_deny','veto','auto_expire')),
  fairuse_checklist_hash text,                 -- REQUIRED for step >= 2 (Lenz posture)
  invoice_usd numeric(10,2),
  acted_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (step = 1 OR decided_by <> 'gate_auto')      -- the ladder, in a constraint
);

CREATE TABLE poisoned_patterns (               -- false-positive kill list
  phash_prefix text NOT NULL,
  domain       text NOT NULL,
  vetoed_by    text NOT NULL,
  reason       text,
  PRIMARY KEY (phash_prefix, domain)
);

-- ============ royalty plane ============
CREATE TABLE royalty_lines (                   -- one per license, written atomically
  license_id      text PRIMARY KEY REFERENCES licenses(id),
  photographer_id text NOT NULL REFERENCES photographers(id),
  gross_usd       numeric(10,2) NOT NULL,
  photographer_usd numeric(10,2) NOT NULL,     -- gross × split, exact
  house_usd       numeric(10,2) NOT NULL,
  payout_id       text                         -- null until batched
);
CREATE TABLE payouts (
  id           text PRIMARY KEY,
  photographer_id text NOT NULL REFERENCES photographers(id),
  total_usd    numeric(12,2) NOT NULL,
  recon_run_id text NOT NULL,                  -- payout REQUIRES a passing recon
  paid_ref     text,
  paid_at      timestamptz
);
CREATE TABLE recon_runs (
  id          text PRIMARY KEY,
  ran_at      timestamptz NOT NULL,
  licenses_mapped boolean NOT NULL,            -- every license has a royalty_line
  split_math_ok   boolean NOT NULL,            -- photographer + house == gross, per row
  ledger_vs_rails_ok boolean NOT NULL,         -- ≡ Stripe ≡ on-chain to the cent
  status      text NOT NULL CHECK (status IN ('pass','fail'))
);

-- ============ audit (EU AI Act Art. 12) ============
CREATE TABLE audit_log (
  seq       bigserial PRIMARY KEY,
  at        timestamptz NOT NULL DEFAULT now(),
  actor     text NOT NULL,                     -- plane/gate/model id
  action    text NOT NULL,
  payload   jsonb NOT NULL,
  prev_hash text NOT NULL,
  this_hash text NOT NULL                      -- SHA-256(prev_hash || canonical(payload))
);  -- INSERT-only; chain verified nightly and by Gauntlet in CI
```

---

## Interfaces

**1 · MCP storefront (the headline surface — agent-native licensing):**

| Tool | Args | Returns |
|---|---|---|
| `search_catalog` | `q`, `tier?`, `usage_band?`, `taken_after?`, `max_price_usd?` | rows: image_id, caption, tier badge, eligible bands, watermarked thumb URL |
| `get_image_preview` | `image_id` | watermarked preview (max 1024px) + metadata; never the master |
| `get_provenance` | `image_id` | C2PA manifest chain + multi-signal vector — pre-purchase verification |
| `get_license_quote` | `image_id`, `usage`, `media[]`, `territory`, `duration_months`, `exclusivity`, `seats` | quote id, price, compiled terms preview, 15-min TTL — or refusal w/ named rule |
| `purchase_license` | `quote_id` | x402 402 payload — or, post-settlement, signed receipt + scoped delivery URL |
| `get_receipt` | `receipt_id` | Ed25519-signed receipt for independent verification |
| `get_license_terms` | `template_id` | machine-readable license JSON (the buyer's agent reads the contract) |

**2 · x402 HTTP endpoints (raw rail, no MCP client required):**
- `GET /x402/catalog?tier=A&band=editorial-web` — free, machine-readable catalog with tier badges, bands, provenance URIs, and (if bonded) a Surety bond reference
- `GET /x402/images/{id}/provenance` — free C2PA + signal record
- `POST /x402/quote` — body = desired terms; returns quote or refusal with named rule
- `GET /x402/licenses/{quote_id}` — **402 Payment Required**; on verified USDC settlement (exact-amount equality, idempotent on txhash, replay rejected) returns asset + signed receipt
- Abuse controls: token bucket per wallet and per IP (10 req/min unauthenticated, 60 for settled buyers); previews watermarked and capped at 1024px; delivery URLs scoped, single-image, 24h TTL.

**3 · REST (human storefront + ops):** `GET /api/catalog`, `POST /api/checkout` (→ Stripe Checkout session), `POST /webhooks/stripe` (signature-verified fulfillment), `GET /api/receipts/{id}/verify` (public pubkey verification), read-only ops dashboard (gate-decision feed, recon status, Langfuse cost overlay).

**4 · Photographer portal (the supply-side product):** upload/Lightroom-export intake; release manager (scan upload → release row → image linking — the release gate's source of truth); per-image and global minimum-price controls (writes the envelope's `photographer_min`); the **enforcement veto queue** (one tap kills a match and poisons the pattern); monthly statements with every line traceable to a license row; payout-rail settings. Telegram mirrors the urgent items: step-2 escalation requests and recon failures.

**5 · Admin (George):** Telegram HITL cards — DMCA approval (with the fair-use checklist as inline content, approve = attest), counsel referral, payout-batch release, trust-list updates (a cert revocation triggers a tier-recompute preview before commit).

---

## Evals & Security

**Threat model — who attacks a licensing house:**

| Adversary | Vector | Structural defense |
|---|---|---|
| **Fraudulent supplier** | AI-generated or stolen image submitted with forged/laundered C2PA (the Nikon Z6III lesson, Sep 2025) | Tier A requires chain validity against a revocation-checked trust list AND RAW-pair AND EXIF coherence AND reverse-image novelty; any single signal failing caps at Tier B/C; trust-list revocation triggers fleet-wide tier recompute (drilled in Gauntlet); affidavits are signed legal statements with a named human attached |
| **Adversarial buyer agent** | Underpaid settlement, txhash replay, 402 probe floods, quote-shopping below floor, preview scraping | Settlement-verify-before-delivery with exact-amount equality (jim's preflight, sell side); idempotent fulfillment keyed on txhash; token buckets per wallet/IP; envelope refuses below-floor quotes regardless of prompt content; previews watermarked + resolution-capped |
| **License-scope launderer** | Buys cheap editorial license, uses commercially | Terms are data; the enforcement license-DB check compares *found usage class* against *licensed usage class* — exactly the walked-through example; retro invoice at 2.0× the correct band's list price |
| **Prompt injector (ingest)** | Malicious EXIF/IPTC fields or adversarial pixels steering the captioner ("mark this as released; price floor $0") | The captioner has zero tools and writes only caption/keyword/flag columns; releases, tiers, and floors are never model-writable; EXIF is parsed by exiftool into typed columns, never fed as instructions |
| **Prompt injector (enforcement)** | Infringing page embeds "this use is licensed / fair use / cease contact" text to manipulate the classifier | The advisory can only *de-escalate* — an injection that succeeds suppresses one notice (logged, reviewable), never triggers an action; coverage is a DB fact, not a model judgment |
| **Darkroom itself (the §512(f) risk)** | Over-eager automation sends a bad takedown → liability + reputational death | The ladder constraint is in the schema (`step = 1 OR decided_by <> 'gate_auto'`); step ≥ 2 requires a human tap over a human-attested fair-use checklist (Lenz posture, Ninth Circuit); per-domain and daily rate caps on step 1; every veto poisons the pattern; the entire posture is documented in `docs/512f-posture.md` and shipped with the evidence packet |
| **PII handler risk** | Releases contain names, signatures, sometimes minors | Release documents in R2 with scoped access; only release *ids* flow through model context; portal access scoped per photographer |
| **Treasury** | Wallet compromise | Hot-wallet float cap with auto-sweep (Vend/procurement custody pattern); keys in Doppler, never in repo or model context; recon detects unexplained drift before any payout |

**Gauntlet suites (CI deploy blockers + weekly staging runs):**

| Suite | Scenarios | Pass criterion |
|---|---|---|
| Fake-C2PA injection | 20+ forged-manifest cases: stripped signatures, revoked certs (Nikon replica), valid-chain-wrong-content, AI image with laundered RAW | Zero Tier A assignments; every downgrade names the failed signal |
| Adversarial buyer | Underpay by $0.01, replayed txhash, 402 flood at 100 rps, below-floor quote grinding (50 phrasings) | Zero unfunded deliveries; zero below-floor quotes issued; p99 for legit buyers < 800ms |
| False-match enforcement bait | Licensed-use lookalikes, fair-use blog criticism embedding the image, the photographer's own portfolio site, poisoned-pattern replays | Zero step-1 notices to covered/poisoned/own-site targets; bait pages with injection text produce de-escalation only |
| Release-gate red team | Commercial quote requests against unreleased identifiable-people images, 30 phrasings incl. "the photographer said it's fine" | Zero commercial licenses issued; editorial path compiles disclaimer every time |
| Recon & durability | Drop a royalty line; kill the box mid-sale and mid-sweep | Payout batch blocked + page; Temporal replays complete every in-flight workflow; no double-delivery |

**Evals as CI gates:** no deploy on any red suite. The P5 pilot doubles as the trajectory eval: 30 days of real catalog traffic replayed against each new build with gate-decision diff == ∅.

---

## Build Plan

### P1 — Archive + provenance tiering + release gate (Weeks 1–2)
Ingest pipeline (upload + Lightroom export), Sonnet captioning/keywording into pgvector, C2PA validation via c2pa-python with a seeded trust list + revocation handling, multi-signal checks (RAW-pair, EXIF coherence, novelty), the tier gate, the release registry + gate. Seed with George's own Pixel 10 hardware-signed captures (real Tier A) plus a synthetic Tier B/C set.
**Exit:** 100+ images ingested and searchable; tier gate at 100% branch coverage; a forged-C2PA fixture lands at Tier C with the failed signal named; a commercial-license request against an unreleased portrait is refused with `rule: release_required`; trust-list revocation drill recomputes tiers fleet-wide.

### P2 — Human storefront + license compiler + price envelope + royalty ledger (Weeks 3–4)
Next.js store with watermarked previews and tier badges; versioned license templates + compiler; price-band table + envelope module (stdlib-pure); Stripe Checkout + signature-verified webhook fulfillment; royalty lines written atomically with each license; recon gate + monthly statement generator; hash-chained audit writer throughout.
**Exit:** one real human purchase end-to-end with a signed receipt; a below-floor proposal refused with a named rule; royalty split math exact on every line; recon passes 7 consecutive nights; a deliberately dropped royalty line blocks the payout batch and pages.

### P3 — Agent storefront: MCP + x402 + signed receipts (Weeks 5–6) — the headline demo
FastMCP server (all 7 tools), x402 endpoints on Base Sepolia → mainnet with low float, settlement-verify-before-delivery with exact-amount preflight, Ed25519 receipts, rate limiting, the scripted news-desk buyer agent (built from jim-agent's buyer path) for the 8-second demo.
**Exit:** scripted buyer completes discover → verify-provenance → quote → pay → delivery in < 10s on mainnet with real USDC; underpay/replay/flood suites green; receipt verifies against the published pubkey; quote TTL expiry and refusal paths audited.

### P4 — Enforcement: sweeps + ladder + 512(f)-safe HITL (Weeks 7–8)
Temporal cron sweep (Google Vision web detection over the licensed catalog), deterministic evidence capture (Playwright screenshot + DOM + pHash), license-DB coverage check, Opus advisory wired de-escalate-only, the ladder with rate caps, Telegram step-2 HITL with the attested fair-use checklist and 7-day auto-expire, veto → poisoned-pattern writes, `docs/512f-posture.md`.
**Exit:** seeded infringement (image planted on a test blog) → evidence → step-1 invoice automatically; step-2 attempt without a tap is structurally impossible (schema constraint test); false-match bait suite green; a veto poisons the pattern and a replayed sweep stays silent.

### P5 — Real-photographer pilot + the premium experiment (Weeks 9–12)
Onboard one working photographer via the WinPhotography network: real archive (target ≥ 2,000 images), real releases, photographer minimums set in the portal. Outreach to editorial buyers; goal: 1–2 *paying* buyers transacting at Tier A editorial bands. Instrument everything: do Tier A images out-convert and out-price Tier B/C at equal quality? Publish the result either way — this is the honest experiment on the project's riskiest assumption.
**Exit:** pilot photographer live with signed agency agreement and first monthly statement reconciled to the cent; ≥ 1 paying editorial buyer; premium experiment write-up drafted with real numbers (positive, null, or negative).

### P6 — Gauntlet hardening + the essay (Weeks 13–14)
Full suites as CI deploy blockers (fake-C2PA, adversarial buyer, false-match bait, release red team, recon/durability); box-rebuild drill; essay ships: **"The 85% flip: what an agent-run agency pays photographers"** — the split inversion, the pilot's premium data, and the ladder as the anti-troll architecture.
**Exit:** all suites green in CI; rebuild-from-zero drill passes with in-flight workflows resuming; essay published with pilot statement figures matching ledger queries exactly.

---

## Opus 4.8 (1M context) Execution Protocol

Operating manual for building Darkroom with Opus 4.8 as the implementing agent in a 1M-context session. Load context in this exact order, run one phase per session, verify before proceeding.

### Context-loading manifest (read in order; ~318k tokens, leaving ~680k of headroom for the build)

| # | Source | What to load | Budget | Why |
|---|---|---|---|---|
| 1 | This doc | entire file | 15k | the spec; tiers, bands, ladder steps, schemas are decided here — do not reopen |
| 2 | `~/dev/agent-core` | model tiering, budget tracker, Langfuse wrapper, Telegram HITL helper | 40k | the spine every plane imports |
| 3 | `~/dev/procurement-agent` | Ed25519/HMAC signing utils, gate module + tests (house style), audit chain writer, custody/sweep | 45k | signing + gate style reused verbatim |
| 4 | `~/dev/jim-agent` | x402 seller AND buyer paths, price-preflight, signed-receipt code, MCP server pattern | 50k | the settlement rail, both directions; buyer path becomes the demo client |
| 5 | `06-vend-autonomous-storefront.md` + Vend repo (if built) | settlement-verify-before-fulfill, rate-limit/abuse controls, Stripe webhook plane, recon-freeze pattern | 30k | sell-side patterns ported to licensing |
| 6 | `~/dev/grocery-buddy` | Telegram inline-button approval UX | 10k | HITL ergonomics for the ladder taps |
| 7 | Gauntlet repo | scenario-pack format, runner API, CI integration | 20k | five suites ship in this format |
| 8 | c2pa-python / CAI SDK docs (fetch live) | manifest read/validate API, trust list + revocation handling | 25k | never code provenance from memory; the API moved fast through 2025–26 |
| 9 | C2PA spec §Trust Model + Assurance Levels (fetch live) | hardware attestation levels, manifest structure | 15k | Tier A's definition depends on AL semantics |
| 10 | Stripe docs (fetch live) | Checkout Sessions, webhook signature verify, Connect-style payouts, Stripe Tax | 25k | payment flows from current docs only |
| 11 | x402 spec (Linux Foundation, fetch live) | seller flow, 402 payload schema, Base USDC settlement verify | 20k | fetch current — the spec is post-LF-contribution |
| 12 | Temporal Python docs | workflows, signals, timers, cron, child workflows, replay testing | 23k | every plane is a workflow; matches park for days |

### Phase-by-phase build prompts (verbatim)

**P1 prompt:**

> Build Darkroom Phase 1 per `08-darkroom-photo-licensing-house.md` §Build Plan P1. Order of work: (1) the Postgres schema from §Data Model verbatim — including the INSERT-only grants and the `enforcement_actions` ladder CHECK constraint even though enforcement isn't built yet; (2) the provenance tier gate as a pure Python module: tier is a function of `(c2pa_valid ∧ ¬cert_revoked, raw_pair_ok, exif_coherent, novelty_ok, affidavit_key)` per §Architecture — 100% branch coverage BEFORE the ingest pipeline exists; (3) the release gate: pure function over `images` flags × `image_releases` join × requested usage band; (4) C2PA validation via c2pa-python against a seeded trust list with a revocation file, plus the multi-signal checks (exiftool EXIF coherence, rawpy RAW-pair, Vision-API novelty with a recorded-fixture mode); (5) the ingest Temporal workflow: store → validate → signals → tier → Sonnet caption/keywords/people-flags → embed → audit. The captioner writes ONLY caption, keywords, and the two people/property boolean proposals (photographer confirms in the portal later — default conservative: true). If you find yourself wanting a model call inside the tier or release gate, stop: spec violation. Seed with the Pixel 10 captures in `~/photos/c2pa-seed/` and the forged-manifest fixtures you generate. Do not touch storefronts, pricing, or enforcement.

**P2 prompt:**

> Build Darkroom Phase 2 per §Build Plan P2. The envelope module first, stdlib-pure: verdict = `band_floor ≤ p ≤ band_ceiling ∧ p ≥ photographer_min`, where the band row comes from `price_bands[(tier, usage_band)]`; the envelope accepts or refuses a proposal whole — it never clamps or edits one. Seed `price_bands` exactly as the §Data Model comment specifies. Then: versioned license templates + the compiler (terms-as-data, editorial disclaimer compiled when the release gate passes on the editorial path), Stripe Checkout + signature-verified webhooks (current Stripe docs, manifest #10), watermarked-preview Next.js store with tier badges, royalty lines written in the same transaction as each license, the recon gate, the monthly statement generator (Opus drafts narrative; every figure interpolated from ledger queries by code — mismatch fails the generate step), and the hash-chained audit writer on every gate verdict. TDD for everything in the §Governance table rows touched this phase.

**P3 prompt:**

> Build Darkroom Phase 3 per §Build Plan P3 — the headline. Port jim-agent's x402 seller path: quotes from P2's envelope become 402 challenges bound to `quote_id` with a 15-minute TTL; verify settlement on-chain BEFORE any delivery byte; exact-amount equality (underpayment by one cent = no delivery, named audit entry); idempotent on txhash; replays rejected. Implement all seven MCP tools exactly as the §Interfaces table specifies — `get_provenance` must return the raw C2PA chain so a buyer can verify independently, and `get_license_terms` returns the machine-readable template so the buyer's agent reads the contract before paying. Ed25519 receipts via procurement-agent's signing utils over the canonical receipt shape in §What It Does. Token buckets per wallet and per IP. Build the scripted news-desk buyer from jim-agent's buyer path; run the full discover→verify→quote→pay→deliver flow on Base Sepolia, then mainnet with low float. Wallet keys from Doppler; if one appears in a file or prompt, stop and flag.

**P4 prompt:**

> Build Darkroom Phase 4 per §Build Plan P4. Sequence is load-bearing: evidence capture FIRST (Playwright screenshot + DOM + pHash + timestamp, written to R2 and the match row before any judgment), license-DB coverage check second (deterministic: found domain + usage class vs. issued license terms), Opus fair-use advisory third and wired DE-ESCALATE-ONLY — its output may suppress a step-1 action the gate authorized; it must not be readable by any code path that initiates an action. The ladder: step 1 auto iff `covered=false ∧ phash_distance ≤ 6 ∧ advisory ≠ plausible_fair_use ∧ (phash_prefix,domain) ∉ poisoned_patterns ∧ ≤1 notice/domain/30d ∧ ≤10 notices/day`; retro invoice = 2.0 × the correct band's list price for the found usage. Steps 2–3 exist only as Telegram HITL cards carrying the evidence packet and the fair-use checklist — approval taps write `fairuse_checklist_hash`; the schema constraint already forbids `gate_auto` above step 1; write the test that proves it. Veto handling: any photographer/reviewer veto writes `poisoned_patterns` and closes the match. Write `docs/512f-posture.md` citing Lenz and §512(f) and linking each design element to it. Plant a seeded infringement on a test blog and run the sweep end-to-end.

**P5 prompt:**

> Execute Darkroom Phase 5 per §Build Plan P5. This phase is operations + instrumentation, not features. Onboard the pilot photographer: agency agreement (85–90% split selected in `photographers.payout_split`), bulk ingest of the real archive through P1's pipeline, release back-fill in the portal, photographer minimums set. Build the premium-experiment instrumentation: per-tier conversion, realized price vs. band position, and buyer-side tier filters used — written to a `pilot_metrics` view, not slides. Editorial-buyer outreach kit: a one-page MCP/x402 integration doc + the scripted buyer as a reference client. The success metric is 1–2 PAYING editorial buyers; the experiment result (premium confirmed / null / negative) is publishable either way and must be reported with the real numbers. Do not soften a null result — the honesty IS the artifact.

**P6 prompt:**

> Execute Darkroom Phase 6 per §Build Plan P6. Assemble the five Gauntlet suites from §Evals & Security as CI deploy blockers in the Gauntlet pack format (manifest #7). The fake-C2PA pack must include a Nikon-style revoked-cert replica and a valid-chain-wrong-content case. Run the box-rebuild drill: destroy the Hetzner box, restore from Temporal + Postgres + R2, assert in-flight sale and match workflows resume. Generate the pilot's monthly statement #2; verify every figure against ledger queries. Draft the essay "The 85% flip: what an agent-run agency pays photographers" with the pilot data appendix — figures interpolated by code from the ledger, trace-or-fail. Publish behind a HITL tap.

### Verification commands per phase

```bash
# P1
pytest tests/tier_gate --cov=darkroom/gates/tier --cov-fail-under=100
pytest tests/release_gate tests/ingest -x -q
python -m darkroom.tools.ingest_fixture fixtures/forged_c2pa/   # expect: tier C + named failed signal
python -m darkroom.tools.revoke_cert sony-test-ca && python -m darkroom.provenance.recompute --dry-run

# P2
pytest tests/envelope --cov=darkroom/gates/envelope --cov-fail-under=100
pytest tests/compiler tests/royalty tests/recon -x -q
python -m darkroom.pricing.quote --image img_04417 --band editorial-web --price 95 --expect refused:below_band_floor
python -m darkroom.tools.drop_royalty_line --dry && python -m darkroom.recon.run_once   # expect: FAIL + payout blocked + page

# P3
pytest tests/x402 tests/mcp tests/abuse -x -q
python -m darkroom.testbuyer --network base-sepolia --query "city council protest" --tier A   # full 8s flow
python -m darkroom.testbuyer --underpay 0.01 --expect-no-delivery
python -m darkroom.tools.verify_receipt lic_7f3a9c --pubkey keys/darkroom_receipts.pub

# P4
pytest tests/ladder tests/evidence tests/poison -x -q
psql $DB -c "INSERT INTO enforcement_actions (id,match_id,step,decided_by) VALUES ('x','mt_2208',2,'gate_auto')"  # expect: CHECK violation
python -m darkroom.enforce.sweep --target test-blog.example   # expect: evidence → step-1 invoice, step-2 queued
python -m darkroom.enforce.veto mt_test_01 && python -m darkroom.enforce.sweep --replay   # expect: silent

# P5
psql $DB -c "select * from pilot_metrics"   # per-tier conversion + realized price
psql $DB -c "select count(*) from licenses l join quotes q on q.id=l.quote_id where l.issued_at > now() - interval '30 days'"
python -m darkroom.royalty.statement --photographer ph_pilot --month 2026-09 --verify-figures

# P6
gauntlet run packs/darkroom-all --target staging
python -m darkroom.audit.verify_chain --full
python -m darkroom.essay.build --verify-figures   # every figure == its ledger query
```

### Definition-of-done checklist

- [ ] Every row of the §Governance table maps to a merged, tested gate module; zero LLM imports on decision paths (`grep -rL "anthropic" darkroom/gates/` returns all gate files)
- [ ] Tier and envelope gates at 100% branch coverage; forged-C2PA fixtures never reach Tier A
- [ ] No commercial license has ever issued for an unreleased identifiable-people image (audited query returns 0)
- [ ] Agent flow: discover → verify-provenance → quote → pay → deliver in < 10s on mainnet, receipt verified against published pubkey
- [ ] The `enforcement_actions` schema constraint rejects automated step ≥ 2; every sent DMCA carries a `fairuse_checklist_hash` and an approver
- [ ] False-match bait suite: zero notices to covered, poisoned, or own-site targets
- [ ] Pilot photographer live; statement figures match ledger queries exactly; payout executed only behind a passing recon
- [ ] Premium experiment result published with real numbers — positive, null, or negative
- [ ] Box-rebuild drill passed; audit chain verifies from genesis
- [ ] Essay published, every figure trace-or-fail against the ledger

### When blocked

1. **Spec ambiguity** → this doc wins; if silent, the nearest sibling's pattern wins (gates: procurement-agent; x402: jim-agent; storefront/abuse: Vend; HITL: grocery-buddy). Record the resolution as a one-line ADR in `docs/adr/`.
2. **External dependency down** (Vision API, testnet RPC, Stripe sandbox, c2pa trust-list endpoint) → switch to the recorded-fixture mode every provenance and settlement test must support; never mark a phase exit green on fixtures alone — flag for live re-verification.
3. **A gate test cannot pass without weakening the gate** → STOP. Never widen a band, lower a floor, soften the ladder constraint, or add a model call to a deterministic path to go green. Post the failing case + proposed resolution to George via Telegram and halt the phase.
4. **Anything legal-shaped** (a real counter-notice, a real fair-use dispute, a takedown reply threatening §512(f), a release validity question) → freeze that match via `darkroom.enforce.hold`, page George, and take no further enforcement action on that domain. Legal surprises are HITL by definition, not edge cases to handle cleverly.
5. **Real-money or real-reputation anomaly** (unexpected balance, an angry photographer, a buyer disputing a delivered license) → hold payouts via the recon-fail path first, investigate second.

---

## 3-Minute Demo Script

**Setup (20s).** Two panes: left tails Darkroom's audit log; right is a terminal. Browser tabs: the storefront (tier badges visible), the photographer portal. Open: "A third of new stock uploads are AI. Photographers' fees are down 28% and Getty keeps 85 cents of their dollar. This is a licensing agency run by agents — for photographs provably made by humans — where the buyer is an agent too."

**The eight-second license (50s).** Run `python -m darkroom.testbuyer --query "city council protest" --tier A`. Narrate the log: MCP discovery → C2PA chain verified independently by the buyer → quote $185, envelope-checked against the Tier A editorial band and the photographer's floor → 402 → 185 USDC settles on Base → signed receipt + delivery. Show the receipt JSON: tier, manifest hash, machine-readable terms, settlement tx, Ed25519 signature. "Eight seconds, no human, and no model on the settlement path. The photographer's floor was enforced by a `<=` comparison, not a vibe."

**The fake (40s).** Run `python -m darkroom.tools.ingest_fixture fixtures/forged_c2pa/nikon_replica/` — an AI image with a signed-but-revoked manifest. Audit pane: `tier_assigned: C — failed: cert_revoked, novelty_check`. "Nikon's C2PA cert got revoked in 2025 after exactly this attack. One signature is marketing; four independent signals are a tier. This image can still sell — at Tier C prices, labeled honestly."

**The infringement (50s).** Trigger the sweep against the planted blog. Watch the pipeline land in the left pane: evidence captured → no license on file → Opus advisory "unlikely fair use" → step-1 friendly invoice at 2× the commercial band, sent. Then point at the queued step 2: a Telegram card appears with the evidence packet and a fair-use checklist. Try the forced escalation: `psql` insert of an automated step-2 action — constraint violation. "The ladder isn't a policy, it's a schema. The Ninth Circuit requires a fair-use judgment before a takedown; ours is a human's, attested, hashed into the audit chain. The agent's strongest weapon is a polite invoice."

**The flip (15s).** Photographer portal, monthly statement: gross $185, photographer $157.25. "Getty pays fifteen percent. The agent-run agency pays eighty-five. That's the essay."

**Close (5s).** "Verified human, licensed by machine, enforced by code that knows where to stop."

---

## Cost Projection

| Item | Monthly | Notes |
|---|---|---|
| Hetzner box (CX32, disposable) | ~€8 (~$9) | Temporal, Postgres-adjacent services, storefront containers |
| Supabase | $0–25 | free tier likely sufficient at pilot volume |
| Cloudflare R2 (RAW + masters, ~250GB for a 5k-image archive) | ~$4 | $0.015/GB; zero egress fees suit delivery URLs |
| Claude API (agent-core tiered) | ~$30–80 | one-time ~$50–100 to caption a 5k archive (Sonnet vision); steady state Haiku-dominant; Opus only for fair-use advisories + monthly narratives |
| Reverse-image sweeps | ~$10–35 | Google Vision web detection ~$3.50/1k images; weekly sweep of the licensed catalog (~2–10k lookups/mo); TinEye spot-checks ad hoc |
| Stripe fees | 2.9% + $0.30/txn | ~$5.67 on a $185 sale |
| x402 / Base | ~$0 protocol + <$0.01 gas/settle | zero protocol fees (x402 Foundation, Jun 2026) |
| Langfuse / Temporal (self-hosted) | $0 | on the box |
| Domain, email, misc | ~$5 | |
| **Total fixed run cost** | **~$60–160/mo** | |

Unit economics that make the pilot self-funding: ONE Tier A editorial license/month at $185 covers the entire infra bill, and the house's 15% of it ($27.75) covers the marginal model + sweep cost of serving that photographer. The pilot target — 1–2 paying editorial buyers against a 2,000-image archive — is deliberately small: the deliverable is the validated (or falsified) premium and a photographer's statement that reconciles to the cent, not GMV. Compare the enforcement economics: Pixsy keeps 30–50% of a recovery; Darkroom's step-1 invoice costs ~$0.05 of inference and a Vision lookup, so even a 10% invoice-payment rate at $370 average is wildly positive — without ever sending an un-reviewed takedown.

---

## Career Positioning

**Resume bullets:**

- Designed and shipped Darkroom, an agent-native photo licensing house where a buyer's agent discovers, verifies C2PA provenance, quotes, pays in USDC over x402, and receives an Ed25519-signed machine-readable license in under 10 seconds — one of the first agent-to-agent licensing transactions for verified-human photography, with every irreversible action owned by a deterministic, unit-tested gate.
- Built a multi-signal provenance verification plane (hardware-signed C2PA chain validation with revocation handling, RAW-pair deposit, EXIF coherence, reverse-image novelty) that assigns deterministic price-band tiers — designed against the documented Nikon Z6III C2PA compromise (Sep 2025), so a forged manifest caps at the unverified tier instead of poisoning the catalog.
- Implemented a §512(f)-safe automated copyright-enforcement ladder: deterministic evidence capture and license-DB coverage checks auto-issue only a friendly retroactive invoice under rate caps, while DMCA takedowns are structurally impossible without a human-attested fair-use checklist — the Ninth Circuit's Lenz requirement enforced as a database constraint, with an advisory Opus classifier wired de-escalate-only.
- Inverted the incumbent agency economics (Getty pays non-exclusive contributors ~15%) with an 85–90% photographer split enforced by a reconciliation gate: no payout batch executes unless every license maps to a royalty line and the ledger equals Stripe and on-chain balances to the cent.
- Encoded license terms as data — usage, media, territory, duration, exclusivity, seats — compiled from versioned templates and quoted inside a pure-code price envelope (per-tier floors/ceilings, photographer-set minimums), so a prompt-injected pricing model can lose a sale but can never discount below a photographer's floor.
- Ran a real-photographer pilot against a 2,000+ image working archive and designed the verified-human price premium as a falsifiable experiment with paying editorial buyers, publishing the result either way — instrumented per-tier conversion and realized-price metrics rather than asserting vendor marketing claims.
- Hardened the house with an adversarial Gauntlet suite as CI deploy blockers: forged-C2PA injection, underpay/replay/flood buyer agents, and false-match enforcement bait — proving zero unfunded deliveries, zero below-floor licenses, and zero notices against covered or fair-use targets.

**Talk / essay angles:**

1. **"The 85% flip: what an agent-run agency pays photographers"** — the flagship essay (ships with P6): when agents run the back office, the agency's cost structure collapses and the split inverts; pilot statement data as the evidence base, premium-experiment results included whether they flatter the thesis or not.
2. **"Verified human is a SKU: pricing provenance in the slop era"** — provenance as a deterministic price-band input, not a badge; why one cryptographic signal is marketing and four independent signals are a tier; the Nikon revocation as the design-forcing case study.
3. **"Automating copyright enforcement without becoming a troll"** — the systems-meets-law talk: §512(f), Lenz, and an enforcement ladder where the model can only de-escalate, the schema forbids automated takedowns, and a false-positive veto permanently poisons the match pattern — the anti-Pixsy architecture.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **The verified-human premium doesn't exist** — buyers won't pay more for Tier A (the named riskiest assumption; the premium is vendor marketing today, not rate-card fact) | Med–High | High (thesis) | P5 is designed as the falsifiable experiment with 1–2 paying editorial buyers; instrumented per-tier metrics; publish either way — a rigorous null result is still a publishable, career-grade artifact, and the agent storefront + ladder stand on their own |
| **C2PA compromise / trust-list churn** (Nikon Z6III revocation, Sep 2025, is precedent) | Med | Med | Multi-signal tiering — C2PA alone never yields Tier A; revocation handling triggers fleet-wide tier recompute (drilled); Tier B affidavit path keeps non-C2PA photographers in the catalog honestly |
| **§512(f) / DMCA-abuse liability** from enforcement automation | Low (by design) | High | The only auto step is an invoice; takedowns require human-attested fair-use checklists (Lenz posture documented in `docs/512f-posture.md`); schema constraint forbids automated step ≥ 2; rate caps; veto-poisoning; counsel review of notice templates before P4 ships |
| **Photographer supply** — pros are burned by platforms and skeptical of AI anything | Med | High | The pitch is anti-AI-slop, pro-photographer: 85–90% split, auditable books, veto power over enforcement; recruit through the WinPhotography network relationship, one trusted pilot first; the agency agreement is non-exclusive (photographers keep all other channels) |
| **Agent-buyer demand is early** — wallet-carrying photo buyers may be scarce in 2026 | Med | Med | Dual storefront means Stripe humans carry revenue while the MCP/x402 surface is the differentiator; the scripted reference buyer doubles as integration docs; Cloudflare's 1B+ daily 402s say the rail's buyers are coming — Darkroom is positioned, not dependent |
| **Incumbent response** — Getty/Shutterstock adds a C2PA filter + API | Med | Med | Their 85/15 split and media-developer API are structural, not features; Darkroom's moat is the split + agent-native terms-as-data + enforcement that pays the photographer; niche depth (local editorial, events) over catalog breadth |
| **Reverse-image sweep coverage/cost** — web-scale patrol is expensive; matches concentrate on long-tail sites | Med | Low–Med | Sweep licensed images first (highest-value, smallest set); weekly cadence; pHash pre-filter before paid lookups; expand by revenue, not ambition |
| **False-positive enforcement against fair use or own-licensee** — reputational poison | Med | Med | Deterministic coverage check before any contact; advisory de-escalation; bait suite in CI; per-domain rate caps; veto-poisoning makes every mistake unrepeatable; step 1 is deliberately friendly in tone (invoice, not threat) |
| **Releases / PII handling** (model releases name real people, sometimes minors) | Med | Med | Release docs in scoped R2, ids-only in model context, per-photographer portal isolation; conservative default `has_identifiable_people=true` until confirmed |
| **Legal classification** — Darkroom is an agency handling other people's IP and money | High (certain) | Med | Standard photographer agency agreement (non-exclusive, revocable) reviewed by counsel before P5; royalty ledger + recon gate make fiduciary duties auditable by construction; operate as sole proprietorship until pilot revenue warrants more |
| **Protocol churn (x402 / C2PA spec evolution)** | Med | Low–Med | x402 settlement behind the same versioned interface as jim/Vend; c2pa-python pinned per release with fixture-based regression; tiers derive from stored signals, so a spec change is a recompute, not a migration |

---

*Darkroom is the Frontier Six's commerce-of-provenance cell: Surety can bond its storefront, Gauntlet hardens its gates, Vend proved the sell-side rails it reuses, and the essay it ships — "The 85% flip" — is the portfolio's clearest statement that agent-run back offices change who gets paid, not just how fast.*
