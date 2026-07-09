---
title: Portfolio 2026 — Verified Orchestration
collection: multi-agent
source: ~/dev/multi-agent-docs/portfolio/README.md
sourceMtime: '2026-06-12T01:21:51.621Z'
syncedAt: '2026-07-09'
summary: 'This folder is the second wave of the agent portfolio, in two sets:'
contentHash: 'sha256:c14cb83695bc1226a941691d67f86874276647e03b10befc8b9120c96e682c1e'
---
# Portfolio 2026 — Verified Orchestration

> **The one sentence to say in an interview:** *"One agent with a gate is trustworthy — I proved that sixteen ways. The frontier is making fleets trustworthy in places no one has put an agent yet: a talent agency where the talent is synthetic, a licensing house for provably-human photographs, a biographer that cannot fabricate a memory, a trust bureau for strangers' agents, an energy desk where the LLM never touches the battery, and a newsroom that is structurally unable to lie."*

This folder is the **second wave** of the agent portfolio, in two sets:

- **The Frontier Six (07–12)** — the headline set. Brand-new realms, niches no one has shipped an agent into, positioned for where the agent economy lands late 2026 / early 2027. Each one's whitespace was verified by research before a line was planned.
- **The Foundation Six (01–06)** — the field-coverage set (infra, content, finance, GTM, creative, commerce), built closer to the existing fleet's DNA. Still valid; **Gauntlet (01)** in particular is the CI substrate every other project's test suite runs on.

The first wave (`~/dev/docs/`, 4 built agents + 13 documented plans) proved **Thesis 1: model proposes, code disposes** — a deterministic, unit-testable gate owns every irreversible action. This wave proves **Thesis 2: verified orchestration** — N unreliable agents composed through verification topologies (judge panels, adversarial verifiers, budget governors, durable execution, trajectory evals in CI) into one accountable system.

Every doc is a **self-contained build brief for Claude Opus 4.8 with a 1M-token context window**: context-loading manifest, verbatim phase prompts, per-phase verification commands, definition-of-done. Hand the doc to the model; the doc is the spec. All market claims are grounded in research sweeps dated **2026-06-11** (8 research tracks total), cited inline by source and date.

---

## The Frontier Six

| # | Project | Realm | The irreversible action code owns | The whitespace (verified 2026-06-11) |
|---|---------|-------|-----------------------------------|--------------------------------------|
| 07 | **[Troupe](07-troupe-synthetic-creator-studio.md)** | Synthetic creators (TikTok / YouTube Shorts) | **what a synthetic persona publishes, replies, and signs** — disclosure-gated, parasocial-safety-gated, kill-switched | a16z is funding adjacent plays (Channel, Shizuku ~$80M val); Hololive runs 88 human-operated avatars; **nobody operates a governed multi-persona roster** with disclosure-by-construction, reply safety gates, and per-persona P&L |
| 08 | **[Darkroom](08-darkroom-photo-licensing-house.md)** | Photography licensing & rights | **every license issued and every enforcement action** — price envelope, release gate, §512(f)-safe escalation ladder | Aftershoot/Imagen stop at culling/editing; Getty pays ~15%; **no agent-native storefront for verified-human photography exists** — machine-readable terms + x402 payment + delivery in seconds |
| 09 | **[Keepsake](09-keepsake-family-biographer.md)** | Voice-first oral history / legacy | **every sentence of a family memoir** — provenance gate to the subject's own recorded words; fabricated memories structurally impossible | StoryWorth/Remento are static prompts; StorySage (UIST '25) is text-only academic; **nobody ships voice-first + adaptive longitudinal sessions + provenance discipline**; explicitly memoir-not-resurrection (Cambridge ethics framework) |
| 10 | **[Surety](10-surety-agent-trust-bureau.md)** | Agent-economy trust ("Know Your Agent") | **bond payouts and reputation** — published deterministic claims rulebook (KYA-1); the LLM can triage evidence but never touch a verdict | x402 carries 100M+ tx with **zero recourse when a deal goes bad**; Visa/Mastercard answer identity, not trustworthiness; Nava ($8.3M, Apr 2026) lists dispute resolution as *future work*; **nobody combines bonds + deterministic adjudication + appeals** |
| 11 | **[Joule](11-joule-home-energy-desk.md)** | Household energy / VPP | **every command that reaches hardware** — safety envelope (reserve floor, warranty cycles, comfort bands) with telemetry readback; **the LLM never dispatches** | Tesla/Enphase/Sunrun optimizers are closed; Predbat is UK-only; **an open, auditable, multi-vendor energy agent for US dynamic tariffs is demonstrably unbuilt** |
| 12 | **[Quorum](12-quorum-civic-accountability-desk.md)** | Civic accountability / news deserts | **every published claim** — citation gate (video timestamp or document page, or it doesn't exist) + HITL named-person gate with right-of-reply | 213 news-desert counties (record); Gannett/Hoodline failed on *governance*, not AI; **nobody ships provenance-gated civic journalism or a longitudinal promise-vs-vote registry** |

### Why now — the dated windows

| Project | The window, and when it closes |
|---|---|
| **Troupe** | Compliance just became the moat: NY Synthetic Performer Disclosure Law effective **Jun 9, 2026**; EU AI Act Art. 50 **Aug 2, 2026**; TikTok removed 2.3M synthetic videos in Q1 2026 (+180% YoY); FTC dual-disclosure at $53,088/violation; Character.AI settlements (Jan 2026) made parasocial safety a board-level issue. The ungoverned competitors are being purged *now* — a governed studio inherits the field. Production cost crossed $2–5/video. |
| **Darkroom** | C2PA hardware shipped (Pixel 10 / Galaxy S25, Aug 2025; Canon×Reuters newsroom verification, **May 11, 2026**) while <1% of news images carry credentials — supply-side head start. Getty-Shutterstock clears (DOJ Feb 2026, CMA May 2026) → contributor rate squeeze → photographer exodus moment. Bots are now 57.5% of HTTP traffic; Cloudflare serves 1B+ HTTP 402s/day — the agent buyers are already knocking. |
| **Keepsake** | Voice crossed the threshold (sub-800ms full-duplex; ElevenLabs at $11B, Feb 2026); $124T wealth transfer underway (Cerulli); StoryFile's bankruptcy (May 2024) cleared the lane; griefbot backlash makes the consent-first, no-resurrection posture a brand, not a constraint. Pilot by fall → **gift season Nov–Dec 2026**. |
| **Surety** | The standards window is open for months, not years: Sumsub claimed "KYA" Jan 29, 2026; ERC-8183 proposed Feb 2026; NIST agent-identity initiative Feb 2026; IETF AIMS draft Mar 2026; Nava funded Apr 2026 — everyone is circling, nobody has shipped the rulebook. Publishing **KYA-1** + a running reference implementation in 2026 is how you end up as prior art in the room when the real standard forms. |
| **Joule** | Record 9.7 GWh of US home storage in Q1 2026; Sunrun VPP enrollment +400% YoY; ERCOT real-time co-optimization went live Dec 2025 (new revenue streams); Octopus+Lunar's Texas bundle (Apr 22, 2026) shows retailers enclosing the spread — the open, user-side counterweight has to exist before the black boxes win by default. |
| **Quorum** | Record 213 desert counties (Medill, Oct 2025); Press Forward has mobilized $400M of $500M+ with active grant rounds ($22.7M in Jul 2025 alone); Reuters Institute (Oct 2025): 12% trust fully-AI news vs. 62% human-made, *and oversight + transparency closes the gap* — which is precisely Quorum's architecture. Documenters Network expanding 19→50 cities by 2027: the partner posture is available now. |

### The defense

The selection bar for this set (per the standing novelty rule):

1. **New realm** — no project shares a domain with the built fleet (carts, card-spend, research markets, music) or with each other.
2. **Verified whitespace** — each doc's "nobody has shipped this" claim came back confirmed from research *before* planning, with the closest competitor named (Channel, Nava, Predbat, StorySage, Pixsy, CDP) and the gap stated precisely.
3. **Arriving wave, not current wave** — each rides something that changes state in the next 6–12 months: disclosure laws biting, C2PA hardware diffusing, agent payments needing recourse, VPP enrollment compounding, trust-in-AI-news research maturing, the wealth transfer accelerating.
4. **The gate thesis transplants, the domain doesn't** — each project's deterministic gate guards a *new kind* of irreversible action: a synthetic persona's speech, a license, a memory, a verdict, a kilowatt, a published claim.
5. **Solo-buildable and honestly demoable** — simulation-first where hardware is involved (Joule), pilot-scoped where regulation is involved (Surety's counsel gate, Quorum's one town), falsifiable where the market premium is unproven (Darkroom's P5 experiment is designed to publish *either* result).

**What we're explicitly NOT building** (frontier candidates considered and cut): AI companions/dating (Character.AI litigation minefield; Troupe deliberately builds the *anti*-companion gates), griefbots/resurrection (ethically radioactive — Keepsake stops at the published ethics line by policy and architecture), AI tutors and voice receptionists (saturated by late 2026), deep-research and coding agents (the labs own those lanes), youth-sports media (capture-hardware dependency, Hudl incumbency), synthetic focus groups (Synthetic Users et al. already there), game liveops (requires owning a live game), robotics/agriculture (capital- and hardware-bound), agent-readiness consulting (a service, not a system).

**The honest counterargument, answered.** *"Aren't six unexplored niches riskier than six adjacencies?"* Yes — individually. That's why they're a portfolio: six independent claims on unexplored territory, each cheap to stand up on the shared spine, each with a falsifiable pilot, and each one a first-mover essay/spec/demo even if the business case dies (Darkroom's premium experiment, Surety's KYA-1 spec, Joule's published backtest are publishable outcomes *regardless of revenue*). The Foundation Six remains the lower-variance track; the Frontier Six is where "leading AI engineer with forward-thinking designs" actually gets earned.

---

## The Foundation Six (field coverage)

| # | Project | Field | One-liner |
|---|---------|-------|-----------|
| 01 | **[Gauntlet](01-gauntlet-agent-reliability-harness.md)** | Agent infrastructure (OSS) | Chaos engineering for agent fleets — fault injection + trajectory evals as a CI gate. **The substrate: every project above ships a Gauntlet suite.** |
| 02 | **[Byline](02-byline-content-engine.md)** | Dev-brand content | Commits in, claim-traced multi-platform content out; closed analytics→strategy loop. |
| 03 | **[Tape](03-tape-research-desk.md)** | Finance | Adversarial bull/bear panels propose; a pure-Python risk envelope releases (paper) orders. |
| 04 | **[Herald](04-herald-gtm-desk.md)** | Sales / GTM | Signal-grounded, citation-verified, approval-gated outbound. The anti-11x. |
| 05 | **[Atelier](05-atelier-creative-direction.md)** | Creative direction | Judge panels + anti-convergence novelty guard + budget-governed iteration. |
| 06 | **[Vend](06-vend-autonomous-storefront.md)** | Commerce (sell side) | A real storefront for human and agent buyers; every cent gated; public P&L. |

Foundation interlock (one economy): Gauntlet certifies → Byline publishes → Herald sells → Atelier supplies → Vend transacts → Tape narrates a season. Frontier interlock (selective, by design — these are diversified bets, not one machine): **Surety bonds Darkroom and Vend's storefronts** as its first merchants; **Darkroom supplies Quorum** with verified-human local photojournalism; **Troupe** is the consumer-content flagship; **Gauntlet's chaos suites are every project's adversarial exam** (grooming scripts at Troupe, fake-C2PA at Darkroom, false-premise probes at Keepsake, claim-fraud floods at Surety, sensor spoofs at Joule, misattribution faults at Quorum).

---

## Sequencing (frontier-led, 12 months)

| When | Milestone |
|---|---|
| Jun–Jul 2026 | **Troupe** P1–P3: one persona live on Shorts with the full disclosure gate (NY law and Art. 50 windows are *now*). **Gauntlet** P1–P2 interleaved as the CI substrate. |
| Jul–Sep 2026 | **Keepsake** P1–P4 with a family pilot over the summer → product-ready for **gift season**. Troupe P4–P5 (deals + roster). |
| Sep–Nov 2026 | **Darkroom** P1–P4: x402 agent-storefront demo + real-photographer pilot; the verified-human premium experiment starts. |
| Nov 2026–Jan 2027 | **Surety** P1–P4: registry, bonds, the KYA-1 rulebook; first bonded merchants = Darkroom (+ Vend if built). **Publish the KYA-1 spec + transparency log.** |
| Jan–Mar 2027 | **Joule** P1–P4: the 12-month simulation flagship on real 2024–26 ERCOT/Agile prices, published methodology; hardware-in-loop begins. |
| Feb–May 2027 | **Quorum** P1–P5: one pilot town, 8-week live season, Press Forward/AJP grant application. Joule live season runs in parallel. |
| Jun 2027 | Retrospective essay series — one per gate: the disclosure gate, the enforcement ladder, the provenance gate, the rulebook, the safety envelope, the citation gate. |

Foundation projects slot in opportunistically (Byline whenever distribution is wanted; Vend pairs naturally with Surety; Tape/Herald/Atelier as bandwidth allows). From wave 1, **Mnemo** remains the recommended substrate build when shared memory becomes blocking.

Aggregate run cost at full frontier operation: roughly **$150–400/mo** (Troupe's per-persona production is the swing factor; Surety/Quorum are nearly free to run; Joule is simulation-first), on top of the existing ~$50–90/mo hosting plan. Each doc carries its own detailed projection.

---

## How to execute a doc with Opus 4.8 (1M context)

Every doc ends with an **Opus 4.8 Execution Protocol** section following one convention:

1. **Context manifest** — exactly which repos/files/specs to load and in what order, with token budgets (~140k–320k; well inside 1M with working-set headroom).
2. **Phase prompts** — verbatim, quoted prompts per build phase. One phase per session; do not pipeline phases in one context.
3. **Verification commands** — each phase ends with runnable checks (pytest, CLI transcripts, Temporal queries). A phase isn't done until they pass.
4. **Definition of done** — a checklist including the project's Gauntlet suite passing in CI.
5. **Blocked protocol** — what the model does when a credential, dependency, or ambiguity blocks it (stop and surface; never improvise around a gate; Surety and Keepsake add legal/ethics freeze rules).

The convention itself is portfolio evidence: *plans engineered for model execution* is context engineering practiced, not preached.

---

## Folder map

| Doc | Set | One-liner |
|---|---|---|
| [07-troupe-synthetic-creator-studio.md](07-troupe-synthetic-creator-studio.md) | Frontier | The talent agency where the talent is synthetic and the management is code. |
| [08-darkroom-photo-licensing-house.md](08-darkroom-photo-licensing-house.md) | Frontier | The agent-native licensing house for provably-human photography; the 85% flip. |
| [09-keepsake-family-biographer.md](09-keepsake-family-biographer.md) | Frontier | A months-long voice biographer; no fabricated memories, no resurrection, ever. |
| [10-surety-agent-trust-bureau.md](10-surety-agent-trust-bureau.md) | Frontier | Bonds, reputation, and a published claims rulebook for strangers' agents (KYA-1). |
| [11-joule-home-energy-desk.md](11-joule-home-energy-desk.md) | Frontier | An open home-energy desk; the LLM never touches the battery. |
| [12-quorum-civic-accountability-desk.md](12-quorum-civic-accountability-desk.md) | Frontier | A civic newsroom that is structurally unable to publish an uncited claim. |
| [01-gauntlet-agent-reliability-harness.md](01-gauntlet-agent-reliability-harness.md) | Foundation | Chaos engineering for agent fleets; the shared CI substrate. |
| [02-byline-content-engine.md](02-byline-content-engine.md) | Foundation | Dev-artifact content engine with per-claim citation gates. |
| [03-tape-research-desk.md](03-tape-research-desk.md) | Foundation | Risk-enveloped investment-research desk (paper). |
| [04-herald-gtm-desk.md](04-herald-gtm-desk.md) | Foundation | Governed, signal-grounded GTM desk. |
| [05-atelier-creative-direction.md](05-atelier-creative-direction.md) | Foundation | Multi-modal creative direction with judge panels. |
| [06-vend-autonomous-storefront.md](06-vend-autonomous-storefront.md) | Foundation | Governed autonomous storefront with a real P&L. |

Related: first-wave plans and the Thesis-1 proof matrix at `~/dev/docs/README.md` · hosting/ops architecture for the running fleet in [the parent folder](../README.md).
