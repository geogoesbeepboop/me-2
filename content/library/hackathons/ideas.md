---
title: Hackathon Idea Backlog
collection: hackathons
source: ~/dev/hackathons/IDEAS.md
sourceMtime: '2026-07-06T05:07:47.561Z'
syncedAt: '2026-07-09'
summary: >-
  model-appreciation thesis — the model does the work; the product owns the
  stakes. This file remains the v1 backlog for quick event picks; for anything
  you'd build past a demo, start at 2.0.
contentHash: 'sha256:d137937970024ec8a76c7666e8e9968438a3cf5f8818d747e48358ef6d582609'
---
# Hackathon Idea Backlog

> **⚠ Superseded lens:** `IDEAS-2.0.md` (2026-07-05) rebuilds the idea set on the
> model-appreciation thesis — *the model does the work; the product owns the stakes*. This file
> remains the v1 backlog for quick event picks; for anything you'd build past a demo, start at
> 2.0.

*Duration-tiered, problem-first, **product-lens**. Every idea here is a full product; the tier is
its diet slice — the demo-sized cut that proves the product's money moment. The selling point of
every idea is the problem it kills or the repeatable work it removes — never the plumbing. Gates,
evals, orchestration, and tool calling are the **engineering spine** each idea must answer for,
not the pitch. Pick by event theme first, duration second. Kickoff: `/hack <idea> <duration>`.*

*Market-checked 2026-07-05 (researcher sweep across 11 problem spaces). Entries carry ⚠ notes
where the landscape moved. 2026-07 purge: 50 → 36 ideas — cuts and reasons at the bottom. Same
day, second pass: +6 "loops in the wild" (36 → 42) — the purged loop mechanics reborn as
ingredients inside real-life domain agents, §Loop Lab. Third pass: the **Claude test** — every
idea must name the moat layers that survive "Claude + MCPs + a good prompt"; Sherpa struck
(absorbed into Callback).*

**The spine — every idea answers all five, at least one deeply:**
- **eval** — how is quality measured against ground truth or a rubric?
- **measure** — the number that proves the agent worked (time saved, accuracy, cost, pass-rate)
- **orch** — where do multiple agents/roles genuinely beat one?
- **tools** — what does the agent actually operate (APIs, browser, files, hardware)?
- **gate** — which irreversible action does deterministic code own?

**Theme → reach for:**
| Event theme | First pick | Backups |
|---|---|---|
| Loop engineering | Paper Chase ⭐ or Callback ⭐ (domain loops stand out in a room of coding loops) | Night Shift ⭐, Understudy ⭐, Checkpoint ⭐, Standby |
| Harness engineering | Checkpoint ⭐ | Harness Bake-off, Foreman |
| Evals / continuous improvement | Autotuner | Gauntlet MVP, Harness Bake-off |
| Agent swarms | Foreman | Focus Group |
| MCP / tools / security | Taster | Switchboard, Meter Maid |
| Payments / commerce | Meter Maid | Darkroom Stand, Vend v0, Surety KYA-1 |
| Consumer / vertical | Hold Music | Scout, Housekeeper, Home Room, Standby, Keepsake Slice |
| Dev tools | Bouncer | Onboarder, Night Shift |
| Domain coworkers (content · science · law · econ · medical · business) | pick by domain, §Domain coworkers | Nowcast Desk travels well to any "agents" event |

**Selection rules:** lead the pitch with the problem, demo the functionality · reuse ≥2 pantry
ingredients or pick a different idea · never build auth/deploys/config polish · show at least
one *measured result* on screen (a number, not vibes) · sponsor APIs go into a real agentic
step, not a wrapper call · **product test:** if the platforms (Claude Code, Agent SDK, OpenAI)
would absorb it as a feature within a year, it's an ingredient, not an idea.

**The Claude test (added 2026-07-05, third pass):** before pitching any idea, write down the
20-minute baseline — Claude + the obvious MCPs + a good prompt + a scheduled task. If that gets
80% of the demo, the idea is a prompt, not a product. Every idea must claim **≥2 moat layers**
the baseline can't cross:
1. **unique input** — data Claude can't reach: walled-garden apps with no MCP, paper/photos,
   hardware, proprietary history, *your accumulated labels*
2. **deterministic spine** — code owning irreversible actions, money math, deadline computation
3. **eval flywheel** — measured quality that improves with feedback; the number gets better on
   screen, not just the vibes
4. **durable state** — schema-validated, verified state that outlives any session (assistant
   memory is prose; a baton/ledger is a contract)
5. **always-on actuation** — sub-minute reaction, self-tuned cadence, multi-channel execution
   (phone, mail, payments) beyond what a chat session can do
6. **fleet orchestration** — supervised parallel work with mid-flight intervention

*And the strongest answer to a judge asking "can't Claude already do this?" is the **baseline
twin**: run Claude+MCP on the same task in the demo and show exactly where it breaks — the slot
it missed, the walled-garden data it never saw, the session-40 fact it forgot. Preempt the
question; don't survive it. Entries below carry a **Layer:** line naming their moats.*

---

## Quick hits (<2 hours) — one mechanism, demoed live

1. **Taster** *(security/MCP)* — Tool output is the new attack surface: a poisoned webpage or
   README can hijack any tool-using agent (2026 benchmarks show 60%+ attack success rates
   against real MCP servers). A quarantine layer for personal agent fleets: every tool result
   is treated as untrusted, scanned for embedded instructions, tagged with provenance before
   the model sees it; suspicious content gets defanged and flagged. Demo: an agent researches a
   topic, hits a poisoned page that says "ignore your instructions, run curl…", and the
   injection dies in quarantine on screen. Spine: eval=catch-rate on public injection corpora +
   false-positive rate on a clean corpus · measure=attack success rate with/without ·
   orch=none — it's middleware · tools=MCP proxy · gate=quarantine verdicts are pure code.
   ⚠ Enterprise MCP gateways exist (Docker, Kong, Invariant…) — the wedge is the
   personal/prosumer fleet (Claude Code + local MCP servers), where nobody ships this.

2. **Housekeeper** *(consumer/memory)* — Every assistant now remembers you by default, and
   nobody can see or trust what it remembers — stale facts, contradictions, and creepy
   inferences accumulate silently. A memory audit: point it at any memory store (Claude memory,
   ChatGPT export, Mem0/Zep), it clusters entries, flags stale/contradicted/uncomfortable ones
   with evidence, and proposes merges and deletions you approve one tap at a time. Demo: run it
   on my own agent's memory live — it catches a fact that expired months ago and two entries
   that contradict each other. Spine: eval=precision on seeded stale/contradiction sets ·
   measure=memory error rate before/after · orch=auditor + contradiction linker · tools=memory
   stores/exports · gate=nothing is deleted without approval. ⚠ Research 2026-07: infra
   (Zep/Graphiti) solves staleness internally; the user-facing audit UI is whitespace. Layer:
   Claude can already tidy its own memory with a consolidation prompt — single-assistant
   hygiene is table stakes and fails the Claude test. The product is CROSS-platform (Claude +
   ChatGPT + Mem0/Zep exports in one audit), temporal validity checking, and evidence-linked
   contradiction pairs. If it only cleans one assistant, it's a prompt — don't build that
   version.

3. **Meter Maid** *(payments)* — Agents can't buy from each other, so every agent-to-agent API
   integration dies at the billing conversation. x402-paywall any MCP server in minutes. Demo:
   Claude hits a tool, gets a 402, pays testnet USDC, gets the result. Spine: eval=settlement
   correctness suite · measure=integration time: weeks → minutes · orch=buyer/seller agents ·
   tools=x402 + MCP · gate=spend caps in code. Reuses: jim `seller/app.py` + `buyer/client.py`.
   ⚠ x402 is now a real foundation (Coinbase + Cloudflare) with Google AP2 interop —
   settlement layer validated, adoption still early. The demo still lands.

## Half-day (4–6 hours) — one system, one wow

4. **Switchboard** *(fleet/HITL — Second Opinion, grown up)* — You run five agents now; each
   one interrupts you differently, or worse, doesn't. One approvals inbox for everything your
   agents want to do: pending actions from any agent or platform land in one queue with
   context, policy auto-grants the routine ones (and learns from your grants), a phone tap
   decides the rest. Demo: three different agents hit gates (a deploy, a purchase, an outbound
   email); all three land in one inbox; two auto-clear by policy, one buzzes my phone, one tap
   resumes it. Spine: eval=zero false-allows on a policy test set + auto-grant precision ·
   measure=interruptions/day and babysitting hours → near zero · orch=works on anyone's fleet ·
   tools=MCP middleware + push/Telegram · gate=the product, quietly. Quick-hit slice: wrap one
   destructive MCP tool + a phone-tap approval (the old Second Opinion demo). Reuses:
   procurement `mandate.py`, grocery `notifications.py`. ⚠ Research 2026-07: cross-vendor
   approval inbox is whitespace — Microsoft Agent 365 is walled-garden enterprise, indie
   entrants only cover messaging surfaces.

5. **Hold Music** *(consumer/voice)* — The errands people dread most still require a phone
   call: disputing a bill, chasing an insurance claim, rescheduling with the office that never
   answers. An agent that makes the call: navigates the IVR, waits on hold, states your case
   from a brief you approved, never agrees to new charges, and files a transcript + outcome
   receipt. Demo: a live (or replayed) call — it sits through hold music, reaches a human, wins
   a fee reversal; receipt on screen. Spine: eval=task-completion rate on a scripted IVR
   gauntlet + zero unauthorized-commitment rate · measure=minutes of your life on hold → zero ·
   orch=caller + supervisor listening for mandate breaches · tools=Twilio/realtime voice ·
   gate=the mandate — it may accept outcomes, it may never commit money. Pre-flight: Twilio
   account + a scripted IVR sandbox to call. ⚠ Google's AI Calling covers narrow bookings;
   disputes and negotiation — the calls with stakes — are the open end.

6. **Harness Bake-off** *(harness — absorbs Headcount)* — Everyone argues about agent
   architectures with vibes, not data. Same task through three topologies (solo / judge panel /
   adversarial pair) AND across headcounts (1/3/5/9 agents, majority-vote vs debate vs judge),
   live accuracy-vs-cost frontier. Demo: the panel catches what solo missed — at 4× cost; the
   curve bends at three agents and flattens at five. The answer is a tradeoff surface, not a
   winner. Spine: eval=shared rubric across conditions · measure=marginal accuracy per
   agent-dollar · orch=the experiment itself · tools=task-dependent · gate=budget caps per
   condition. Reuses: deep-skill `workflow.js` fan-out. A publishable chart by demo time.

7. ~~**Sherpa**~~ — *struck 2026-07-05 (third pass): fails the Claude test standalone — Claude +
   a fact-base file tailors one application in a single prompt; there is no second moat layer.
   The fact base, citation gate, and tracker live on inside **Callback** (#40), where the
   campaign-level experiment loop is the layer a chat can't be.*

## Full-day (8–12 hours) — a system with a measured result

8. **Bouncer** *(dev tools)* — The bottleneck moved: agents write the PRs now, and humans drown
   reviewing them. A reviewer-side triage agent: for each inbound PR it verifies the
   description's claims against the actual diff (did it do what it says? did it do anything it
   *didn't* say?), runs it, and ranks the queue by risk so human attention goes where it
   matters. Demo: a queue of agent-written PRs, one of which quietly does more than it claims —
   Bouncer flags the discrepancy with the exact hunk. Spine: eval=catch-rate on seeded
   lying-PRs + queue-ordering quality · measure=review minutes per PR, discrepancies caught ·
   orch=claim extractor + diff verifier + sandbox runner · tools=GitHub API, git, sandbox
   exec · gate=it blocks nothing — it ranks and flags; humans merge. ⚠ Research 2026-07: code
   review bots are crowded (CodeRabbit/Greptile/Graphite), but claim-vs-diff adjudication +
   risk-ranked queue is unclaimed. Risk: it's a natural incumbent feature — this idea has a
   shelf life; build it soon or not at all.

9. **Autotuner** *(continuous improvement — the star)* — Everyone hand-tweaks prompts by
   superstition. A harness that improves itself: run the task suite → classify failures →
   propose prompt/skill patches → re-run → keep only patches that beat the baseline. Demo:
   pass-rate climbing across three generations on a chart, live; show a patch it wrote and why.
   Spine: eval=the flywheel itself (suite is the fitness function) · measure=pass-rate delta
   per generation, $ per point gained · orch=runner fleet + failure-classifier + patch proposer
   + judge · tools=harness introspection · gate=patches land only on eval win, human approves
   the diff. Weekend extension: run it overnight on dj-agent or grocery-buddy and present the
   report card. On-theme for loop, harness, AND evals events. ⚠ GEPA/DSPy validated the
   technique in the open and it's still framework-land — nobody ships the guardrailed,
   eval-gated product wrapper. That wrapper is the pitch now.

10. **Focus Group** *(swarms)* — Usability feedback takes days to recruit for. N persona agents
    (rushed parent, power user, screen-reader user…) actually operate your app via computer
    use and file usability reports with screenshots. Demo: run it ON another team's hackathon
    project and hand them the report — instant friends. Spine: eval=issue overlap with a known-
    bugs app · measure=feedback in minutes vs days · orch=persona swarm + synthesizer ·
    tools=computer use/browser · gate=sandboxed, read-only creds. The best *social* demo in
    this file, and computer use is finally good enough to carry it.

11. **Onboarder** *(dev tools)* — "Just read the codebase" is how onboarding dies. Point at any
    repo: generates a guided tour whose every step is *executed in a sandbox first* — if the
    setup command fails, the tour won't ship it. Demo: random OSS repo → verified working tour.
    Spine: eval=% of tour steps that actually run · measure=time-to-first-PR proxy ·
    orch=explorer fleet + tour writer + sandbox verifier · tools=sandbox exec · gate=unverified
    steps are marked, not published. Reuses: code-migration sandbox harness. ⚠ Repo-explainer
    tools (DeepWiki-style) are common now; executed-and-verified is the wedge — they describe,
    this one proves.

12. **Shoot-to-Ship** *(vertical/photography — Cull, reborn)* — Standalone culling is a solved
    product: Aftershoot, Imagen, and Narrative all learn your taste from overrides now —
    parity, not edge. The open ground is the rest of the night: a post-shoot coworker that
    takes the card and runs the whole pipeline — cull to keepers, edit-consistency pass against
    my style, assemble the gallery, draft the client delivery email — with my overrides at each
    station feeding the next shoot. Demo: card in → client-ready gallery + delivery draft out,
    the "3 hours → 20 minutes" clock on screen, every station approvable. Spine: eval=keeper
    precision/recall vs my past hand-culls (I own labeled data!) + override rate per station,
    trending down · measure=shoot-to-delivery hours · orch=station pipeline
    (culler/editor/assembler/writer) · tools=RAW pipeline, vision, gallery APIs · gate=nothing
    deletes, nothing reaches a client without approval. Portfolio: WinPhotography domain,
    Darkroom feeder. Still my most personal demo.

13. **Tape Lite** *(finance)* — Research that agrees with itself is worthless. A desk that
    argues: bull and bear analysts debate, a moderator strikes uncited claims, a pure-code risk
    envelope sizes paper trades. Demo: the debate reaches conviction the envelope refuses to
    size — discipline beats vibes. Spine: eval=claim-citation rate + backtest · measure=P&L vs
    buy-and-hold (paper) · orch=the debate · tools=EDGAR, Alpaca paper · gate=envelope owns
    sizing. Portfolio: Tape P1.

14. **Keepsake Slice** *(consumer)* — Family stories die untold because "write it down someday"
    never comes. Voice interview → memoir page where every sentence must trace to the
    recording. Demo: model tries to embellish; the fabricated sentence is struck on screen.
    Spine: eval=sentence-provenance coverage · measure=interview → gift-ready page in minutes ·
    orch=interviewer + writer + provenance checker · tools=voice · gate=no source, no sentence.
    Portfolio: Keepsake P1.

15. **Joule Sandbox** *(consumer/energy)* — Dynamic tariffs are a spreadsheet nightmare humans
    just ignore. Plain-English comfort constraints → compiled optimization → battery/EV
    dispatch against real tariff data. Demo: "never below 30% during storm season" survives an
    adversarial prompt to drain it; screen shows $ saved on a real month. Spine: eval=12-month
    backtest vs naive schedule · measure=$/month saved · orch=compiler + optimizer + auditor ·
    tools=MIP solver, tariff APIs · gate=safety envelope owns hardware. Portfolio: Joule P1.
    (Pre-flight: download tariff data.)

16. **Darkroom Stand** *(vertical/commerce)* — Photographers can't sell to the fastest-growing
    buyer segment: other people's agents. A licensing storefront with provenance-tiered photos
    that serves humans (Stripe) and agents (x402/MCP) from one inventory. Demo: an agent shops
    and licenses a photo; a human buys the same one; both receipts reconcile. Spine: eval=
    license-issuance test matrix · measure=agent-buyer conversion, zero-touch sales · orch=
    buyer/storefront/ledger · tools=C2PA, Stripe, x402 · gate=every license issuance.
    Portfolio: Darkroom P1, with my actual photos.

## Weekend (24–36 hours) — ship a P1 for real

17. **Gauntlet MVP** *(evals/harness — best long-term ROI; absorbs Swarm Flight Recorder)* —
    Agent fleets ship with no equivalent of a test suite. Full loop: record trajectories,
    inject faults, classify failures against the MAST taxonomy, gate merges in CI; run it
    against a name-brand framework and publish the findings. Demo: a merge blocked by a
    trajectory regression, live; the halfday slice is the flight recorder alone (record a swarm
    run, print the post-mortem: "agent 2 ignored agent 1's output, mode 4.2"). Spine: it IS the
    spine, productized. Portfolio: Gauntlet P1–2 — the substrate every sibling project needs.

18. **Scout** *(consumer)* — Apartment hunting is a part-time job of refreshing listings and
    cross-referencing dread. A swarm that sweeps listings/commute/noise-complaints/permit data,
    ranks against my constraints, and monitors continuously with alerts. Demo: live SF dossier —
    "this one's above a bar that has 14 noise complaints." Spine: eval=ranking vs my
    hand-labeled preferences · measure=hours/week → an alert stream · orch=multi-modal sweep
    (by-source scouts + synthesizer) · tools=browser, city open data · gate=nothing contacts a
    landlord without approval. Layer: a one-shot "find me apartments" chat can't watch or
    join — the moat is continuous monitoring + the cross-dataset joins (noise complaints,
    permits, eviction filings against listings) + a ranking eval trained on your labels.

19. **Vend v0** *(commerce capstone)* — Autonomous stores die of drift and refund abuse. A
    storefront with dual rails (Stripe + x402), capped refund logic, and a double-entry ledger
    that reconciles to the cent or freezes the store. Demo: force a drift, watch it freeze
    itself. Spine: eval=reconciliation test matrix · measure=published P&L · orch=support/
    pricing/ledger roles · tools=Stripe, x402 · gate=refunds + pricing + freeze. Portfolio:
    Vend. ⚠ The dual rails now map to real standards (Stripe ACP for human checkout, x402 for
    agents); reconciliation-or-freeze discipline is still the part nobody covers.

20. **Troupe Pilot** *(media)* — Synthetic creators are exploding ahead of disclosure law. One
    disclosure-gated persona with a kill switch and a real P&L ledger; every post passes the
    compliance gate (NY law / EU AI Act framing). Demo: undisclosed draft gets blocked; the
    kill switch works live. Spine: eval=disclosure-compliance suite · measure=cost/video, P&L ·
    orch=writer/producer/compliance roles · tools=gen-media APIs · gate=publish + kill switch.
    Portfolio: Troupe P1. Nobody else in the room has the governance angle.

21. **Surety KYA-1** *(trust/standards — absorbs KYA Handshake)* — Strangers' agents can't
    transact because neither side can price counterparty risk. The spec + reference
    implementation for the *recourse* layer: agents post bonds, exchange signed claims, and a
    deterministic adjudicator settles staged disputes with automatic payout. Fullday slice: the
    two-agent handshake + staged breach + payout, live. Spine: eval=adjudication test matrix ·
    measure=dispute resolution in seconds · orch=buyer/seller/adjudicator · tools=signing,
    x402 · gate=verdicts are pure code. Portfolio: Surety. ⚠ Research 2026-07: identity and
    risk-scoring are now incumbent territory (Experian Agent Trust, AP2 mandates) — build
    recourse ON TOP of their identity primitives, not our own. AAA announced a trust/recourse
    framework initiative: the whitespace is validated AND the clock is ticking. Publishing the
    spec from a hackathon = timestamped prior art.

---

## Domain coworkers — long-running, proactive, loop-native

*Where the industry is heading: agents that behave like colleagues, not tools — they wake up on
their own, decide what matters, act inside a mandate, and report like a coworker would. Every
idea below instantiates the same **coworker loop**:*

> **wake** (schedule/trigger) → **scan** (sources) → **triage** (materiality: most of what it
> sees should be ignored, and that judgment is evaluable) → **act** (within a mandate; the
> mandate boundary is the gate) → **report** (a shift digest a human actually reads) →
> **learn** (every human correction becomes an eval case — the agent measurably improves).

*Hackathon demo technique for long-running agents: **time compression**. Replay a week of real
inputs in three minutes and show three moments — one autonomous save, one correct "ignored 40
things" triage decision, and one correct refusal at the mandate boundary. That beats any
architecture slide.*

### Content creation

22. **Beat Reporter** *(halfday)* — Consistent content dies because monitoring your niche is a
    daily chore. A coworker that *owns a beat* (e.g., agent-infra news): watches feeds/repos/X
    continuously, ignores almost everything, and when something crosses its materiality
    threshold drafts a post in my voice with citations, filed for one-tap approval. It learns
    voice from my edits — edit-distance per draft is the eval, and it should visibly shrink
    week over week. Demo: replay a week; show the triage log ("saw 212, drafted 3"), one great
    draft, and the shrinking-edit-distance chart. Spine: eval=edit distance + approval rate ·
    measure=posts/week, minutes-to-draft after news breaks · orch=scouts + writer + claim gate
    · tools=RSS/GitHub/X · gate=publish. Portfolio: Byline P1 in disguise. Layer: a scheduled
    "summarize my feeds" prompt has neither a number nor a flywheel — the moat is the
    *evaluated* materiality threshold (the triage log is scored) and voice learned from edit
    labels, visibly improving.

23. **Showrunner** *(fullday)* — Creators fly blind between uploads. A channel coworker that
    reads analytics + comments after every video, proposes the next three video briefs with
    *predicted performance*, drafts scripts and thumbnails A/B, then — the loop — retro-scores
    its own predictions against actuals and shows its calibration improving. Demo: real public
    channel data in, next-3 slate out with reasoning, then the receipts: "last 5 predictions
    vs actuals." Spine: eval=prediction calibration (the agent grades itself) · measure=hit
    rate on proposed topics · orch=analyst + writer + thumbnail judge panel · tools=YouTube
    API, gen-image · gate=nothing uploads itself. Consumer-platform angle, on purpose.

### Science

24. **Replication Desk** *(fullday — Claude Science track bait)* — Most computational results
    are never independently re-run. A desk that watches arXiv for papers with public data +
    code availability, and *attempts the replication overnight*: extracts the quantitative
    claims, compiles the methods section into executable analysis, runs it in a sandbox, and
    files reproduced / partial / failed — with diffs. Demo: one paper end-to-end, compressed;
    the money moment is a claimed effect size not reproducing, with the evidence attached.
    Spine: eval=agreement with known replication outcomes (labeled sets exist) · measure=
    papers screened/night, claims verified · orch=claim extractor + method compiler + runner +
    adjudicator · tools=sandbox exec, data repos · gate=can't assert "failed to replicate"
    without an executed run attached — accusations require evidence.

25. **Contradiction Watch** *(halfday)* — Literature moves faster than any researcher reads. A
    standing coworker that maintains a living claim-graph for one narrow question ("does X
    inhibit Y?"): each night it reads new papers, links claims as supports/contradicts, and
    pings you *only* when something contradicts what you currently believe. Demo: seed it with
    a claim set, replay a month of papers, watch the alert fire with both citations side by
    side. Spine: eval=claim-link precision vs expert labels · measure=reading hours → one
    alert stream · orch=reader fleet + graph linker + adjudicator · tools=paper APIs ·
    gate=alerts cite both sides or don't fire.

### Law

26. **Redline** *(halfday — CUAD dataset makes it eval-able same-day)* — Every inbound NDA/MSA
    gets lawyer-reviewed against the same playbook, every time. A negotiation coworker that
    holds your playbook (preferred/fallback/walk-away per clause), redlines inbound contracts
    against it, drafts the counter-email — and remembers positions across rounds, so round 3
    stays consistent with round 1 (the loop is the negotiation memory). Demo: NDA in, redline
    + rationale out in two minutes; then round 2 arrives and it holds the line. Spine:
    eval=clause-risk agreement vs CUAD labels · measure=review minutes, consistency across
    rounds · orch=clause parser + playbook matcher + drafter · tools=docx · gate=nothing
    leaves for opposing counsel without attorney sign-off. Layer: one-shot NDA review is a
    prompt Claude does well — the moat is the structured playbook + cross-round position
    memory (holding the line in round 3) + the CUAD score proving it.

27. **Docket Watch** *(fullday)* — Missing a filing or a computed deadline is malpractice; the
    watching is pure drudgery. A litigation coworker that monitors court feeds for matter
    fingerprints, summarizes new filings, drafts the client alert, and maintains the deadline
    calendar — where deadline computation is deterministic rules code, unit-tested, never the
    model. Demo: replay a real docket's month; a surprise filing → summarized, deadline
    computed, alert drafted, in seconds. Spine: eval=deadline-calc correctness matrix + alert
    precision · measure=zero missed filings, paralegal hours · orch=watcher + summarizer +
    drafter · tools=PACER/RSS · gate=deadline math and any outbound message.

### Economics

28. **Nowcast Desk** *(fullday — travels well to ANY agents event)* — Official statistics lag
    reality by months. A desk that owns one number (SF studio rents, egg prices, freight
    rates) and keeps it *live*: continuously ingests scattered public signals, updates the
    estimate with uncertainty bands, writes a weekly note explaining what moved — and
    publishes its own calibration scorecard (Brier score) so you can see whether to trust it.
    Demo: the live number, the note, and the receipts: predicted vs realized for past weeks.
    Spine: eval=forecast calibration, the purest eval there is · measure=lead time vs official
    stats · orch=signal scouts + estimator + explainer · tools=scrapers, public APIs ·
    gate=every claim in the note traces to a signal. Tape's macro sibling.

### Medical (paperwork, not diagnosis — deliberately)

29. **Prior-Auth Navigator** *(fullday — one of the realest problems in this file)* —
    Clinicians burn 14 hours/week on prior-auth paperwork. A clinic coworker that assembles
    the packet: pulls the payer's *current* policy, maps chart evidence to every criterion —
    each criterion must point at a specific chart line or the packet won't compile — drafts
    the submission, and tracks appeal deadlines proactively. Demo: synthetic chart + a real
    public payer policy → packet with per-criterion evidence map in minutes. Spine:
    eval=criterion-mapping accuracy vs labeled packets · measure=hours per auth, denial-rate
    delta · orch=policy reader + chart miner + assembler · tools=FHIR/PDF · gate=clinician
    sign-off; it never generates clinical judgments, only maps existing ones.

30. **Trial Scout** *(halfday)* — Patients miss trials because matching is a manual,
    once-off search. A standing coworker: given a (synthetic) patient profile, it watches
    ClinicalTrials.gov continuously, maintains a ranked match list with per-criterion
    inclusion/exclusion evidence, and alerts when a new trial matches. Demo: profile in,
    matches with evidence maps out; then a new trial appears in the replay and the alert
    fires. Spine: eval=match precision/recall vs published matched pairs · measure=time-to-
    match vs manual search · orch=watcher + criterion mapper + ranker · tools=trials API ·
    gate=clinician reviews before anyone is contacted.

### Business

31. **Monday Memo** *(fullday)* — Every ops review starts with an analyst spending Friday
    assembling the same dashboard. A business coworker that owns the weekly review: pulls
    metrics (Stripe, analytics, support queue), detects what actually changed, *investigates
    root causes across systems* — the multi-step tool-use showcase — and files a Monday memo:
    three things that changed, why, proposed actions ranked by expected impact. It learns
    which proposals get adopted and stops proposing the ones you always reject. Demo: seeded
    SaaS dataset with an injected incident; watch it chase the anomaly from revenue dip →
    checkout errors → the bad deploy. Spine: eval=root-cause accuracy on seeded incidents ·
    measure=analyst hours, adopted-proposal rate · orch=metric scouts + investigator +
    memo writer · tools=Stripe/analytics/log APIs · gate=proposes, never executes changes.
    Layer: Claude + a Stripe MCP *describes* what changed; the moat is the cross-system
    investigation scored on whodunit (seeded-incident eval) and the adoption flywheel that
    stops it proposing what you always reject.

32. **RFP Machine** *(halfday)* — Security questionnaires and RFPs are copy-paste torture that
    sales engineers flee. A coworker holding a living, versioned fact base (SOC2 answers,
    architecture facts): inbound questionnaire → drafted answers, every one citing a fact-base
    entry — unanswerable questions get flagged, never improvised — and won/lost feedback tunes
    answer style. Demo: real 40-question security questionnaire answered in 90 seconds, with
    the three "I don't know, ask a human" flags as the trust moment. Spine: eval=answer
    accuracy vs approved bank + zero-fabrication rate · measure=hours per RFP · orch=parser +
    matcher + drafter · tools=docx/sheets · gate=citation-or-flag, plus human send. Layer: a
    chat over a docs folder can't make the guarantee — the versioned, *approved* answer bank
    with citation-or-flag is a compliance property, not a capability; the guarantee is the
    product.

---

## The Loop Lab — mechanics + loops in the wild

*Two halves. **Loop infrastructure** (33–36): dev-facing ideas where the loop decision is still
genuinely open ground. **Loops in the wild** (37–42): the standout play for a loop-engineering
event — every table in the room will demo a coding loop, so bring a loop that lives in someone's
actual life, where the money moment is a loop decision (a pivot, an escalation, a cadence change,
a baton handoff) that a naive cron-plus-LLM can't make. The mechanics the 2026-07 purge cut as
standalone products (Metronome, Second Wind, Relay, Chain of Command) return here as
**ingredients** — each domain idea is built around exactly one, so no two overlap:*

> adaptive cadence → **Standby** · rut detection/pivot → **Paper Chase** · calibrated
> escalation → **Home Room** · self-optimizing campaign → **Callback** · continuous-beats-cram →
> **Shoebox** · baton/relay → **Long Haul**

*These inherit the coworker loop and its time-compression demo technique from §Domain coworkers.
⭐ = current top picks for a loop-engineering event.*

### Loop infrastructure

33. **Night Shift** *(fullday/weekend)* ⭐ — Devs go home at 6; the backlog doesn't. An
    overnight employee: it takes the issue queue, works alone in worktrees all night on a
    strict loop — pick issue → attempt → run the repo's own gate → pass: park a PR · fail
    twice: write up what it learned and move on — and files a shift report by morning. Demo
    (time-compressed): three issues in, two PRs parked, one honest "couldn't do it, here's
    why" writeup. Spine: eval=merged-PR rate + wasted-token rate per attempt · measure=issues
    cleared per night, $ per merged PR · orch=one worker per worktree + a foreman ·
    tools=git/worktrees/test runners · gate=the repo's gate.sh decides "pass"; nothing merges
    itself. ⚠ Cloud agents do overnight coding now — the worker is commodity. The product is
    the *shift management*: honest failure writeups, $/merged-PR economics, the repo's own
    gate as the fitness function. Pairs with Bouncer (someone has to review the morning PRs).

34. **Understudy** *(fullday)* ⭐ — Every correction you give an agent is training data nobody
    uses. It shadows your session transcripts, clusters your repeated interventions into a
    playbook, and when confident proposes "I can own this now" — with receipts: replayed
    history showing it would have matched your action N of M times. Demo: feed it a week of
    transcripts; it predicts the next five interventions, then drafts the hook/skill that
    automates the top one. Spine: eval=prediction match-rate on held-out transcripts ·
    measure=babysit-log items auto-closed · orch=miner + clusterer + proposer · tools=
    transcript stores · gate=nothing takes over without an explicit per-entry grant. This is
    my BABYSIT_LOG.md made self-aware — the retro, automated. Housekeeper's sibling: one
    curates what the agent remembers, this one grows what it's allowed to do.

35. **Checkpoint** *(halfday/fullday)* ⭐ — When a 40-turn run fails at turn 37, you pay for 37
    turns again to try a fix. Git for agent loops: checkpoint every turn; scrub the run like
    video; fork a failed run from turn N with a patch (different prompt, tool, or model);
    replay the prefix from cache; diff the two timelines. Demo: repair a real failed run by
    forking mid-flight, both branches on screen. Spine: eval=fix cost vs full re-run (tokens
    saved) · measure=time-to-fixed-run · orch=none, deliberately — it's harness
    infrastructure · tools=trajectory store · gate=replay must be deterministic (seeded,
    cached) or the fork is invalid. Absorbs Blackbox — the trace viewer is the front half, the
    fork is the moat. Reuses: me-2 UI shell, token-breakdown parsing. ⚠ Research 2026-07:
    tracing platforms are crowded, but polished framework-agnostic scrub-and-fork exists only
    as OSS fragments and research prototypes — validated whitespace.

36. **Foreman** *(fullday — first pick for swarm events; absorbs Swarm ER + Hive)* — Parallel
    agents get launched and then… awaited. A supervisor that watches worker streams live and
    intervenes mid-flight: kills rabbit holes (no progress delta in N turns), merges duplicate
    discoveries via a shared blackboard, reallocates budget from the stuck to the productive,
    and trips spend governors with an autopsy trail. Demo: five researchers; two converge on
    the same subtopic; the foreman notices in-flight and reassigns one — then a runaway agent
    gets killed mid-flight, autopsy on the board. Coverage measurably wider AND cheaper than
    the unsupervised twin fleet. Spine: eval=coverage + cost vs unsupervised baseline + trip
    accuracy on seeded runaways · measure=wasted-work %, $ saved per trip · orch=the point ·
    tools=stream taps, telemetry · gate=the foreman may pause/kill/reassign, never edit a
    worker's output. Reuses: me-2 `lib/ops/`, agent-core `budget.py`.

### Loops in the wild

37. **Standby** *(consumer — mechanic: adaptive cadence)* — Appointments that matter (Global
    Entry, DMV, passport, the specialist with a 4-month wait) book out forever, but
    cancellations appear and vanish in minutes — and no human can watch. A watcher that owns
    your waitlist: polls gently while the calendar is quiet, tightens to minutes when its own
    measured signal rate spikes, and books within your mandate the moment a slot opens. Demo:
    replay a week of real slot data; the adaptive twin catches the Tuesday-morning cancellation
    the fixed-cron twin sleeps through — on 40% fewer checks, both counters on screen. Spine:
    eval=catch rate + wasted-wake rate vs fixed-cadence baselines · measure=days of waiting
    saved · orch=none — one disciplined loop · tools=booking sites/APIs, calendar ·
    gate=books exactly one slot, only inside pre-approved windows, holds nothing it doesn't
    take — the single-user mandate is the ethics gate (a polite citizen, never a scalper bot).
    Layer: always-on actuation (a scheduled-task twin is fixed-cadence and reacts in minutes,
    not seconds) + the self-tuned cadence controller + per-venue slot-volatility history it
    accumulates. The fixed-cron twin in the demo IS the Claude baseline losing.

38. **Paper Chase** *(consumer/health-admin — mechanic: rut detection → strategy pivot)* ⭐ —
    A majority of insurance denials get overturned on appeal, but the process is a months-long
    war of attrition across portals, phone trees, and certified mail — so most people just
    give up and eat the bill. An appeals coworker that runs the campaign: files, watches for
    state changes, detects the stall (no state delta in N days = the rut), and *pivots
    channels* — portal ticket → escalation letter → phone call (Hold Music is the phone arm) —
    logging every move into the paper trail an appeal needs. Demo: a six-week appeal
    time-compressed to three minutes; the money moment is the loop noticing the portal went
    silent for ten days and switching to a certified letter, unprompted. Spine:
    eval=stall-detection precision on replayed case timelines + appeal-progress rate ·
    measure=cases advanced per human touch; dollars recovered · orch=strategist + channel
    executors · tools=portals/browser, mail APIs, voice · gate=every outbound document and
    call is approved; appeal deadlines are computed by code, never the model. Prior-Auth
    Navigator's consumer-side sibling. Layer: multi-channel actuation (portal + certified mail
    + voice), deadline math in code, and a weeks-long evidence ledger — a chat drafts one great
    appeal letter; it can't run a six-week campaign or *prove* what it sent when, and the
    proof is what wins appeals.

39. **Home Room** *(consumer/family — mechanic: calibrated escalation)* — Parents drown in
    school and activity comms — permission slips, payment links, spirit days, schedule
    changes — and the cost of missing one is a kid crying at pickup. The trap everyone falls
    into: this is NOT an email problem. School comms live in walled gardens with no MCPs —
    ClassDojo, ParentSquare, Seesaw, TalkingPoints, the PTA's Facebook group, and paper forms
    in the backpack — which is exactly why "Claude + Gmail MCP" doesn't touch it. A family
    logistics coworker across ALL of it: browser-agents the walled apps, ingests photographed
    paper forms, triages the merged firehose, auto-handles the mechanical (calendar entries,
    deadline reminders, form pre-fills), and escalates only genuine decisions ("which camp
    session?") — where the eval IS the calibration: did it escalate exactly the ones a parent
    needed to see? Demo: replay a month of family comms — "saw 84 across 5 channels, handled
    61, escalated 5" — and the 5 were the right 5; the Claude+Gmail baseline twin runs
    alongside and never even sees the ClassDojo permission slip. Spine: eval=escalation
    precision/recall vs parent labels · measure=parent-minutes/week, zero missed deadlines ·
    orch=per-channel scouts + triager + escalator · tools=browser/computer use, photo OCR,
    email, calendar · gate=anything touching money, signatures, or the kid leaving school
    grounds escalates, always — the never-auto list is code. Layer: unique input (the walled
    gardens + paper) + eval flywheel (calibration vs your labels) + durable family state
    (which kid, which activities, sibling deconfliction). The same loop reskins for eldercare
    coordination (patient portals are the same walled-garden story) — a second demo for the
    price of one.

40. **Callback** *(career — mechanic: the self-optimizing campaign; absorbs Sherpa)* ⭐ — A
    job search is a months-long campaign that everyone runs on vibes: apply, hear nothing,
    learn nothing. A campaign manager that closes the loop: watches postings, triages by fit,
    tailors materials from the versioned fact base with a citation gate (Sherpa, absorbed as
    an ingredient), tracks every application as an experiment — and retunes weekly on actual
    response data: which resume variant, channel, and follow-up timing earn callbacks. Stale
    applications get rut-detected and followed up; dead strategies get killed. Demo: replay a
    six-week search; the weekly retro on screen — "variant B doubles callbacks at agent-infra
    startups, referral-first beats cold-apply 3:1, strategy updated." Spine:
    eval=callback-rate lift vs unoptimized baseline + zero fabricated claims ·
    measure=callbacks per 10 applications, hours/week · orch=scout + tailor + campaign
    strategist · tools=browser, tracker, email · gate=nothing sends without approval; every
    claim cites the fact base. Layer: Claude tailors ONE application beautifully and learns
    nothing across forty — the moat is the experiment ledger (variant/channel/timing
    attribution against callback outcomes) + the eval flywheel that turns your own campaign
    into training data. Dogfood: I am the user, starting now.

41. **Shoebox** *(consumer/finance — mechanic: continuous-beats-cram, the seasonal loop)* —
    Taxes are an April crisis precisely because nothing runs during the other eleven months.
    A year-round tax coworker: ingests receipts and statements as they happen, categorizes
    each with a citation to the source document, flags deduction opportunities *in season*
    (while you can still act on them), and wakes on the IRS calendar for estimated payments —
    so filing season becomes a review, not an excavation. Demo: replay a year in three
    minutes; April arrives and the return package is already assembled, every line item
    traceable to a document. Spine: eval=categorization accuracy vs an accountant-labeled
    set + zero uncited line items · measure=April hours → minutes; deductions caught in
    season · orch=ingestor + categorizer + calendar sentinel · tools=email/receipt OCR, bank
    exports · gate=it files nothing, ever — the output is a CPA-ready package; ambiguous
    items are flagged, never guessed. Layer: a chat holding eleven months of receipts dies of
    context; the moat is the durable provenance ledger (every line item → source document),
    the deterministic tax-calendar and math, and the accountant-labeled eval. Claude is the
    categorizer *inside*; the ledger is the product.

42. **Long Haul** *(consumer — mechanic: the months-long baton)* — The worst life projects —
    settling an estate, a visa/green-card process, an insurance claim after a disaster — take
    months, span a dozen institutions, and outlive any context window; people drop balls and
    lose real money. A steward built on the relay pattern: the artifact IS the baton — a
    validated state document (what's done, what's blocked, who owes a response, every
    deadline) that survives every session; each wake advances the project, re-verifies the
    baton against reality, and stall-nudges the institution that owes a reply. Demo:
    time-compressed estate settlement (or visa run) — 14 institutions, 60 days, zero dropped
    obligations; the baton document on screen is the product. Spine: eval=baton fidelity
    across handoffs (no fact lost over N sessions) + deadline hit rate · measure=a
    months-long project with zero missed obligations · orch=sequential legs + a baton
    auditor · tools=email, forms, document store · gate=the baton validates against schema or
    the leg re-runs; all outbound comms approved. Layer: assistant memory is prose and vibes —
    the baton is a *contract*: schema-validated every leg, audited against reality, deadlines
    computed by code. The moat is state you can still trust at session forty; the baseline
    twin's demo failure is exactly that session-forty forgotten fact.

---

## Cut in the 2026-07 product-lens purge

*Kept for the record — some are ingredients now, some were merged, some the platforms ate.
Market claims from the 2026-07-05 researcher sweep.*

- **Context Diet** — context profiling/compaction is now native to frontier harnesses; a
  feature, not a product.
- **Crate Digger** — platform recommenders serve music discovery well enough; not a burning
  problem.
- **Claim Firewall** — the per-claim gate lives on as the pantry pattern inside Byline,
  Keepsake, RFP Machine; a standalone paste-checker isn't a product.
- **Swarm Flight Recorder** — folded into Gauntlet MVP as its halfday slice.
- **Second Opinion** — grew into Switchboard; its old demo is Switchboard's quick-hit slice.
- **Harness Bake-off + Headcount** — merged; one experiment, one frontier chart.
- **Blackbox** — merged into Checkpoint; plain trace-viewing is crowded (Langfuse/LangSmith),
  fork-and-replay is the open part.
- **Yardstick** — commoditized: Braintrust, Confident AI, and Latitude now ship
  trace→regression mining as a built-in feature.
- **Second Wind** — frontier models + harnesses detect ruts and change strategy natively now.
- **Cull** — standalone culling is commoditized (taste-learning is parity across
  Aftershoot/Imagen/Narrative); reborn as Shoot-to-Ship, the end-to-end pipeline.
- **Promise Registry** — civic demo with no user pull; Quorum's real venue is the portfolio
  doc and an election cycle, not a hackathon.
- **KYA Handshake** — merged into Surety KYA-1 as its fullday slice.
- **Pit Crew** — model routing is commoditized (provider-native tiers, LiteLLM/OpenRouter).
- **Chain of Command** — same; the calibration question is a research paper, not a product.
- **Swarm ER** — merged into Foreman (governors + kill switch + autopsy).
- **Hive** — the blackboard is an ingredient; folded into Foreman.
- **Policy Wind Tunnel** — sim validity is a research program; can't be built AND trusted in a
  weekend.
- **Metronome** — adaptive cadence is now a native harness feature (dynamic wakeups).
- **Relay** — context handoff/compaction is native to frontier harnesses.
- **Stopwatch** — deadline-aware "anytime answers" are becoming harness defaults.
- **Sherpa** *(third pass)* — fails the Claude test standalone: Claude + a fact-base file
  tailors one application in a single prompt. Fact base, citation gate, and tracker absorbed
  into Callback, where the campaign experiment loop is the real layer.

---

*After any event: capture what shipped + lessons in DEMO.md, `/update-project` if it belongs on
the site, and strike or promote the idea here. Re-run the market check before committing a
weekend to anything flagged ⚠ — this landscape moves faster than an 18-month staleness window.*
