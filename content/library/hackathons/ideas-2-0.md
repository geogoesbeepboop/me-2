---
title: 'IDEAS 2.0 — Build the Stakes, Not the Smarts'
collection: hackathons
source: ~/dev/hackathons/IDEAS-2.0.md
sourceMtime: '2026-07-06T06:44:03.002Z'
syncedAt: '2026-07-09'
summary: >-
  A clean-slate idea doc (2026-07-05) that supersedes IDEAS.md's lens. Prior doc
  remains the v1 hackathon backlog; this one is built on a different question.
  v1 asked "can Claude + MCPs do this today…
contentHash: 'sha256:0a728910b0b89ede8e4971c948e5b169dd1d1eb178b962c849f70f252b4b2c36'
---
# IDEAS 2.0 — Build the Stakes, Not the Smarts

*A clean-slate idea doc (2026-07-05) that supersedes IDEAS.md's lens. Prior doc remains the v1
hackathon backlog; this one is built on a different question. v1 asked "can Claude + MCPs do
this today?" This asks: **when the model can do everything, what's left that's ours?***

*Same-day addition: Part 4 (moonshots — the barrier is the moat) and Part 5 (the Voice & Memory
Lab: Sauna-grade working memory × ElevenLabs-grade voice, pointed where the keyboard isn't).*

## The philosophy

**The model is the engine, not the car — and we don't build engines.** Anthropic, OpenAI, and
Google will keep shipping better engines on a curve we can't touch and shouldn't fight. We build
the car: the chassis (state), the title and license (authority), the roads (rails), the brakes
(guarantees), and the odometer (outcome data). Every horsepower increase makes the car better.

**Tagline for every idea here: the model does the WORK; the product owns the STAKES.**

An agent becomes self-sustaining and proactive not through clever prompting but through
infrastructure: it wakes because *state* demands it (an expiring fact, a deadline graph, an
anomalous receipt), acts because *authority* permits it, reaches the world because *rails* exist,
is trusted because *guarantees* hold, and improves because *outcomes* are recorded. Swap in a
smarter model and every layer gets more valuable, not less.

## Frontier assumptions (what we assume future Claude does natively — so we cross ideas off early)

Per the user rule: we don't need to execute the Claude test, we reason it. Assume within 1–2
model generations, out of the box:

- **Week-long autonomous task horizons** with self-correction (rut detection, replanning, and
  context management are the platform's problem, solved)
- **Human-level computer use** on arbitrary websites and apps
- **Native memory, scheduling, and proactive nudges** in consumer assistants
- **Indistinguishable, near-free voice** in and out
- **Near-expert drafting, analysis, negotiation-quality reasoning** in every domain
- **10–100× cheaper tokens** — orchestration topology stops being a cost decision
- **Official MCPs for every mainstream SaaS** — access to popular APIs is not a moat

**If an idea's value proposition appears on this list, it is already dead — cross it off at the
whiteboard, not at the demo.**

## The five assets that appreciate (each idea must own ≥2)

1. **STATE** — a schema-validated, provenance-tagged, self-verifying world model of a domain.
   Assistant memory is prose; a ledger is a contract. Models read/write it; they never own it.
2. **AUTHORITY** — mandates, consent, verifiable delegation, legal standing to act on someone's
   behalf — and the counterparty's ability to *check* it.
3. **RAILS** — maintained, tested, liability-bearing actuation into institutions and the
   physical world: phone, fax, certified mail, filings, payments, hardware.
4. **GUARANTEES** — deterministic properties code can promise and a model can't: gates,
   receipts, ledgers, deadline math, anonymization, compliance. A guarantee is a product; a
   capability is a feature.
5. **GROUND TRUTH** — accumulated outcome data the internet doesn't have: what actually won,
   what you actually corrected, what actually got adopted. The domain's fitness function.

(+ **NETWORK** for marketplace plays: two-sided liquidity, standards, published prior art.)

## What we never build anymore (kill-list heuristics)

- **Capability patches** — anything compensating for today's model weakness: routing, context
  surgery, prompt optimization, rut detection, memory hygiene. The platform absorbs these.
- **Thin orchestration** — pipelines whose only asset is a clever prompt-graph. Multi-step
  planning is the engine's job now.
- **Access arbitrage that expires** — scraping/bridging anything that's one official MCP away
  from being native.
- **UI wrappers** — a nicer chat over the same tools, unless the UX *is* a trust guarantee.
- Anything whose pitch contains the phrase **"models can't yet…"**

---

# Part 1 — The Stack (infrastructure; each is a product AND a layer the verticals stand on)

1. **Registry** *(STATE + GUARANTEES — the substrate)* — Every agent, every session, rebuilds
   your world from scratch. Assistant memory is scattered prose that goes stale silently — and
   assistants can't be proactive because nothing tells them what's *about to be true*. Product:
   the household source of truth — people, documents, policies, accounts, deadlines,
   commitments — every fact schema-validated, provenance-linked to a source document, and
   stamped with an expiry/freshness model. The loop that makes it alive: a sentinel re-verifies
   expiring facts proactively ("passport expires in 6 months; renewal backlog is 8 weeks —
   start now"), and any agent from any vendor reads/writes through one API that *requires*
   provenance. Claude-test reasoning: native memory recalls what you said; it doesn't verify,
   expire, share across vendors, or serve as a substrate a third party would accept. Why it
   appreciates: smarter models extract, verify, and act better — but they act ON the substrate;
   trust in the substrate is the product. Diet slice *(fullday)*: ingest a shoebox of real
   family documents → live registry with provenance and an expiry graph; money moment: it flags
   the insurance policy that quietly lapsed. Spine: eval=fact accuracy + staleness catch-rate
   on seeded sets · measure=surprises prevented · orch=extractor + verifier + sentinel ·
   tools=OCR, email, storage · gate=no provenance, no entry; expiry math is code.

2. **Mandate** *(AUTHORITY + GUARANTEES)* — The errand agent works; the institution hangs up.
   As models get more capable, the bottleneck flips from "can it?" to "*may* it — and can it
   prove it?" Product: scoped, signed, revocable delegation — "this agent may negotiate bills
   to $500/mo, sign category-X forms, access accounts A and B" — issued from your phone as
   verifiable credentials any counterparty can check in one call, with every agent action
   chained to the mandate that authorized it. Consumer-side compatible with AP2-style intent
   mandates. Claude-test reasoning: Claude can *claim* authority; nothing lets the other side
   verify scope, expiry, or revocation — that's cryptographic infrastructure, not a prompt.
   Why it appreciates: more capable agents take more consequential actions; provable permission
   compounds in value. ⚠ Identity/risk-scoring for *commerce* is incumbent territory (Experian
   Agent Trust, AP2) — personal delegation for errands and admin is the open lane; build on
   their identity, own the mandate UX. Diet slice *(halfday)*: issue a scoped mandate → agent
   executes an errand → counterparty verifies the credential live → revoke → the next attempt
   is correctly refused. Spine: eval=verification matrix (forged/expired/out-of-scope all
   refused) · gate=scope enforcement is code, the whole point.

3. **Clerk** *(RAILS + GUARANTEES)* — The institutions that eat your life — payers, courts,
   DMVs, utilities, county offices, school districts — will be the *last* to ship MCPs; half
   still run on fax, certified mail, PDF forms, and phone trees. Product: bureaucracy
   rails-as-a-service — maintained adapters (fax bridge, certified mail, portal automations,
   IVR maps, e-filing) exposed as clean, *tested* tool APIs with delivery receipts and SLAs.
   Twilio for red tape. Claude-test reasoning: computer use can fight one portal in-session —
   brittle, unattended-unsafe, and nobody re-tests the path when the portal changes on Tuesday;
   and no model will ever hold a fax line or post certified mail. Why it appreciates: better
   models generate MORE institutional actions, all of which need rails; the maintenance,
   receipts, and liability are the business — boring on purpose. Diet slice *(fullday)*: one
   rail trio (fax + certified mail + one payer portal) as an MCP server; an agent files a real
   document and the delivery receipt lands on screen. Spine: eval=delivery success matrix + an
   adapter regression suite (the rails are TESTED — that's the moat) · measure=institutional
   actions per human minute · gate=every send is approved and receipted.

4. **Paper Trail** *(GUARANTEES + STATE)* — When your agents do a hundred things a week, the
   product you need isn't more autonomy — it's the five-minute Sunday review that proves the
   fleet did what it claimed, spent what it said, under the authority it had. Product: signed
   action receipts (what, why, whose mandate, what it cost, what changed) emitted by any agent
   through drop-in middleware, rolled into anomaly-surfaced weekly reviews and a dispute-grade
   evidence ledger. Mandate's post-action twin. Claude-test reasoning: transcripts exist, but
   they're prose, per-vendor, unsigned, and four hundred pages — a receipt schema plus anomaly
   review is a guarantee, not a recap. Why it appreciates: autonomy grows on the model curve
   while human review bandwidth stays flat — the gap IS the market. Diet slice *(halfday)*:
   instrument a small fleet; the Sunday review screen — "84 actions, 3 flagged" — and one
   caught overreach traced through its receipt chain. Spine: eval=anomaly catch-rate on seeded
   overreaches + false-flag rate · measure=review minutes per agent-week · orch=any fleet ·
   gate=unreceipted actions are blocked by the middleware.

5. **Casebook** *(GROUND TRUTH + NETWORK)* — Models know how to *write* an insurance appeal;
   nobody knows what *wins* one — outcome data is trapped in filing cabinets and never fed
   back. Product: the outcome registry for one adversarial domain (start: claim denials):
   anonymized, structured case outcomes — payer, denial code, argument used, evidence attached,
   result — contributed by every participating agent and informing every next case. The model
   drafts; the casebook aims. Claude-test reasoning: Claude writes a beautiful appeal from
   priors, but it cannot know that argument B beats argument A at this payer 3-to-1 — that data
   isn't on the internet. (Seed exists: states publish external-review outcomes.) Why it
   appreciates: this is the purest play in the file — better models make drafting free, which
   makes win-rate data the *only* edge, and every case makes the next one stronger. Diet slice
   *(fullday)*: seed from public external-review decisions, mine arguments, then demo the same
   denial answered naive vs casebook-aimed — with the odds on screen. Spine: eval=win-rate
   calibration (predicted vs actual) · measure=overturn rate lift · orch=miner + matcher +
   drafter · tools=public decision corpora · gate=anonymization is code; no outcome enters
   unverified.

# Part 2 — The Verticals (products assembled from the stack)

6. **Steward** *(flagship consumer product — STATE + AUTHORITY + RAILS + GUARANTEES)* — Life
   admin is a silent part-time job (5–10 hrs/week), and assistants only help when summoned —
   reactive by design, because they have no state to be proactive FROM. Product: the household
   chief of staff standing on the whole stack: Registry tells it what's about to be true
   (expiries, renewals, deadlines, price creep); Mandate bounds what it may do; Clerk lets it
   act on institutions; Paper Trail reports back; your corrections tune its materiality
   threshold. Self-sustaining in the literal sense: it wakes because *state* demands it, not
   because a cron fired. Claude-test reasoning: scheduled tasks + memory + MCPs make a reactive
   butler with prose memory — no verified state graph, no counterparty-checkable authority, no
   receipts, no guarantee it didn't miss something. Why it appreciates: every model upgrade
   converts more of the queue from "drafted for you" to "done — receipt attached," and the
   stack is what makes that increase in autonomy *safe to accept*. Diet slice *(weekend)*: a
   time-compressed month — it catches a lapsed policy (Registry), renegotiates one bill
   (Clerk + Mandate), files receipts (Paper Trail), and correctly ignores forty non-events;
   the triage log is the demo. Spine: eval=intervention precision vs my labels + zero mandate
   breaches · measure=admin hours/week → review minutes/week.

7. **Ward** *(vertical: family care — AUTHORITY + STATE + RAILS)* — Coordinating an aging
   parent's care is a second job smeared across siblings, portals, pharmacies, and payers — and
   because nobody holds the full picture, things drop *between* people. Product: shared care
   operations: one care Registry (meds, providers, coverage, appointments, preferences) with a
   family authority graph (who may decide what, the parent's consent anchored at the root),
   agents running refills, scheduling, and claims through Clerk rails, receipts flowing to the
   whole family. Claude-test reasoning: any one sibling's Claude can call a pharmacy; it cannot
   be the shared, consented, auditable coordination layer between four adults and one parent.
   Why it appreciates: models absorb ever more of the calls and paperwork; the family trust
   structure and longitudinal care state are the product — and demographics only push demand
   up. ⚠ market-check pending: care-coordination apps exist; verify none owns the
   agentic + consent-graph frame before committing. Diet slice *(fullday)*: replay a parent-care
   month — a refill crisis resolved autonomously, an appointment conflict escalated to the
   *right* sibling, the monthly family digest with receipts. Spine: eval=dropped-ball rate vs
   the group-chat baseline · gate=the consent graph is code; it does logistics, never clinical
   judgment.

8. **Middleman** *(NETWORK + GUARANTEES)* — Consumer agents are about to flood business phone
   lines with disputes, cancellations, and negotiations — an arms race of hold music versus IVR
   walls where both sides pay and nobody wins. Product: the neutral settlement venue:
   businesses expose structured negotiation endpoints (retention offers, cancellations, billing
   disputes) and consumer agents settle asynchronously under mandates, producing signed,
   binding outcomes. Cheaper than call centers for the business, instant for the consumer — and
   the venue accumulates the outcome data both sides price against. Claude-test reasoning:
   Claude can call and argue (so can Google's AI Calling — that's the *demand* side); it cannot
   be the counterparty-accepted venue where a settlement is structured, signed, and enforceable.
   Why it appreciates: better models negotiate better ON the venue; liquidity and outcome data
   are the moat, and rising agent call volume is what drives businesses to the exit ramp. ⚠
   Two-sided cold-start is the real risk — the hackathon proves the protocol, not liquidity.
   Diet slice *(fullday)*: a mock business endpoint + a consumer agent: cancellation →
   counter-offer → mandate-checked acceptance → signed settlement on both screens, next to the
   40-minute phone-call baseline. Spine: eval=settlement validity matrix · gate=mandate caps +
   signatures; the venue never negotiates, it notarizes.

9. **Countersign** *(NETWORK + GUARANTEES — humans move up the stack)* — Agents now produce
   professional-grade work product — tax packets, contracts, filings — that legally and
   practically needs an accountable human, and today "review" means re-doing the work. Product:
   the sign-off marketplace: agent output arrives as a structured review packet (every claim
   mapped to evidence, diffs highlighted, risk flags ranked) that a licensed professional —
   CPA, attorney, notary, clinician — can verify in minutes and countersign, staking their
   license. The packet format and the reviewer network are the assets. Claude-test reasoning:
   Claude makes the packet; it cannot BE the accountable signature — accountability is a legal
   property, not a capability. Why it appreciates: agent output volume explodes on the model
   curve → sign-off demand explodes with it; better models produce cleaner packets, which means
   faster reviews and better margins — the marketplace gets *more* efficient as models improve.
   ⚠ market-check pending. Diet slice *(fullday)*: one tax or contract packet → a real reviewer
   approves in 90 seconds on the evidence-map UI → signed artifact; eval=review time +
   reviewer catch-rate on seeded flaws · gate=nothing files unsigned.

# Part 3 — Inverse plays (get MORE necessary as models improve)

10. **Witness** *(GUARANTEES + RAILS — provenance)* — As generation approaches perfect,
    *real* becomes the scarce good — and photographers, journalists, and anyone selling
    authenticity has no way to prove it. Product: capture-to-publish provenance — C2PA signing
    at capture, an edit chain that survives a real working workflow (cull, edit, export), and
    a verifier badge that clients, marketplaces, and platforms can check. Sell to working
    creators first: wedding and news photographers whose livelihood is "this actually
    happened." Claude-test reasoning: nothing here is a prompt — it's cryptographic workflow
    infrastructure the model sits inside. Why it appreciates: the cleanest inverse play in the
    file — every generative-model improvement makes authenticity scarcer and this more
    necessary. ⚠ Capture-side signing is shipping in bodies (Leica/Nikon/Sony C2PA) — the open
    ground is the *workflow* (provenance surviving the edit chain) and the verification UX,
    not the camera. Diet slice *(halfday)*: shoot → edit → publish with the chain intact; a
    pixel-identical AI fake fails the check live. Spine: eval=chain survival across real edit
    workflows · measure=verified assets, premium vs unverified · gate=signatures, everywhere.
    Personal edge: I'm the first user, with a working photography business as the testbed.

11. **Gatehouse** *(AUTHORITY + RAILS + GUARANTEES — defense)* — The same curve powering your
    agents powers voice-cloned, personalized, infinitely patient scams — and the most-targeted
    people (elders) have the least defense. Product: the household perimeter: screens inbound
    calls and messages, challenges unverified callers, detects manipulation patterns
    mid-conversation, and gates money movement behind cool-downs and family escalation — the
    family authority graph decides who can approve what. Claude-test reasoning: Claude can
    tell you a pasted text looks scammy; it isn't in the call path, and it can't *hold* a
    mandatory 24-hour cool-down on a wire transfer — interception and gates are infrastructure.
    Why it appreciates: the dark inverse — scam quality rides the model curve, so demand
    compounds forever; the trust graph, telecom integration, and transaction gates are the
    product. ⚠ Carrier/bank integration is the hard part; the slice fakes the carrier, the
    product needs one — and market-check pending on elder-protection incumbents. Diet slice
    *(fullday)*: a live voice-cloned "grandson needs bail money" call gets challenged, flagged,
    and escalated to family while the transfer gate holds — the most visceral demo in this
    file. Spine: eval=catch rate on a scam-scenario corpus + false-positive rate on real
    benign calls · gate=cool-downs and caps are code, never the model's judgment.

12. **Backstop** *(GUARANTEES + NETWORK — recourse, spec play)* — When an agent acts wrongly
    with real money or consequences, the loss just lands on you — and that missing recourse
    layer is what caps how much anyone will ever delegate. Product: agent liability coverage:
    mandates (who authorized) plus receipts (what happened) make agent actions *underwritable*
    for the first time — bonded agents, deterministic adjudication for the clear cases, human
    arbitration hooks for the rest, premiums priced from Paper Trail data. Why it appreciates:
    delegation volume grows with model quality, so the insurable surface grows with it — and
    whoever holds the receipts holds the pricing edge. Reality check: this is not a prompt OR
    a weekend product — it needs capital and actuarial partners. The hackathon play is the
    SPEC: reference adjudicator + a staged claim end-to-end, published as timestamped prior
    art. ⚠ AAA and Experian are circling this layer per the 2026-07 research — move or watch,
    don't drift.

# Part 4 — Moonshots (the barrier IS the moat)

*Bolder tier: ideas where the moat includes work nobody wants to do — legal engineering,
clinical validation, field expertise, capital formation, community governance. Under the
appreciation thesis this is exactly backwards from how it looks: anything a weekend can build, a
model update can absorb; the dig is what a smarter model can't do for a competitor. These are
not hackathon builds — the hackathon slice is the wedge that proves the thesis and timestamps
the prior art.*

13. **Persona Ficta** *(AUTHORITY + GUARANTEES — legal engineering)* — Agents can work but they
    cannot BE anyone: no signature, no bank account, no standing to contract — so every
    "autonomous business" demo dies the moment a counterparty asks "who am I dealing with?"
    Product: the legal wrapper for an agent operation — an incorporation kit (entity, EIN, bank
    account, signing protocol) where the agent operates inside a charter: humans hold
    membership and ultimate liability, the charter + mandates define what the agent may commit,
    and every binding act is signed through a deterministic protocol with receipts. "Incorporate
    your agent." Claude-test reasoning: no model will ever hold a bank account or an EIN —
    standing is conferred by law, not capability. Why it appreciates: as agents get good enough
    to run real operations (stores, newsletters, services), the scarce thing becomes a
    counterparty-recognizable, liability-bounded shell to run them IN. ⚠ The dig: real legal
    engineering per jurisdiction + unauthorized-practice-of-law lines — partner with a firm; the
    dig is the moat. Diet slice *(weekend)*: charter one agent entity end-to-end (sandbox), have
    it sign a real contract and pay a real invoice under its mandate, every act receipted.
    Spine: eval=charter-violation matrix (out-of-scope commitments refused) · gate=signing
    protocol is code; humans hold the pen for anything outside charter.

14. **Testament** *(AUTHORITY + STATE + GUARANTEES — succession)* — Everyone now accumulates a
    digital-agentic estate — accounts, keys, subscriptions, agent fleets, memory stores, soon
    voice models — and when you're incapacitated or gone, none of it knows what to do; families
    spend months guessing at passwords and canceling subscriptions from paper statements.
    Product: the succession protocol for your agentic life: dead-man verification, executor
    mandates that activate in stages (incapacity → death), custody transfer of memory/keys/
    voice under pre-consented rules, staged disclosure (some things transfer, some things
    delete, provably), receipts to the estate. Claude-test reasoning: this is key custody +
    legal instruments + verification rails — a domain where "the model got smarter" changes
    nothing about what must be *guaranteed*. Why it appreciates: the more of life runs through
    agents, the larger the estate this protocol governs; universal, inevitable, and nobody's
    building it because it's unglamorous. Diet slice *(fullday)*: a staged incapacity event —
    the protocol verifies, freezes spend, activates the executor's scoped mandate, transfers
    custody of one memory store, deletes what was marked private, receipts throughout. Spine:
    eval=protocol test matrix (false-trigger rate is the critical number) · gate=every
    transition is code + multi-party verification; the model never decides anyone is dead.

15. **Commons** *(GROUND TRUTH + NETWORK — economic engineering)* — As intelligence
    commoditizes, the residual asset is outcome data — and right now users generate it (what
    worked, what won, what got adopted) while platforms silently keep it. Product: the outcome
    data union: users pool anonymized agent outcomes across domains (appeals won, negotiations
    settled, applications converted) into a collectively-owned commons, governed by members,
    licensed back to labs and products with revenue share — Casebook generalized and turned
    into a cooperative. Claude-test reasoning: not a capability at all — it's governance,
    aggregation rights, and bargaining position; a smarter model makes the pooled data MORE
    valuable, never less. Why it appreciates: the purest expression of the whole thesis — the
    model does the work, the members own the stakes. ⚠ The dig is economic/legal design
    (cooperative structure, anonymization guarantees, licensing terms), not code. Diet slice
    *(weekend)*: a three-domain outcome pool + anonymization gate + license endpoint + a
    revenue-share ledger, with a mock lab consuming the license. Spine: eval=anonymization
    red-team (re-identification attempts fail) · gate=no raw records ever leave; the ledger
    reconciles to the cent or licensing freezes.

# Part 5 — The Voice & Memory Lab

*The special subset: what happens when our agents get **memory** and a **voice**? The two
ingredients just became real products: Sauna (sauna.ai, by Wordware) proved always-on,
multiplayer working memory — an agent that learns how a team works, remembers what matters, and
keeps work moving across every surface — and ElevenLabs made voice indistinguishable and cheap.
But Sauna points at desk teams typing into Slack and email. **The whitespace is everywhere the
keyboard isn't.***

*Two shared moats run through this subset. First, **voice + memory = relationship** — an agent
that has talked with you for a year is not interchangeable with a fresh one, whatever the model
underneath. Second, and bolder: **time-locked corpora** — a grandmother's stories, a fading
dialect, a pre-decline voice baseline, a retiring machinist's judgment. Models improve forever,
but they cannot interview the dead. Capture rails beat model progress — every one of these has
a "the data can only be captured NOW" urgency, the strongest moat the appreciation thesis
allows. Consent is the product throughout: Timbre is the authority layer the rest stand on.
Rule inherited from the kill-list: do NOT build "Sauna, but slightly different" — desk-team
memory is claimed; go voice-native and non-desk.*

16. **Timbre** *(AUTHORITY + GUARANTEES — the Mandate of voice)* — Voice cloning is now
    trivial, which means everyone's voice is now an unsecured asset: no custody, no consent
    trail, no licensing, no revocation. Product: voice identity custody — record and bank your
    voice under cryptographic consent (who may synthesize, saying what categories, until when),
    provenance-marked synthesis (every generated utterance carries its license), one-call
    revocation, estate rules (via Testament). Beachheads where this is urgent today: ALS
    patients banking voices pre-loss, creators licensing voices, families consenting to
    legacy use. Claude-test reasoning: ElevenLabs sells the synthesis; nobody owns the
    consent/custody/provenance layer — a guarantee, not a capability. Why it appreciates:
    every voice-model improvement raises both the value of a banked voice and the cost of an
    unsecured one — appreciation on both sides. Diet slice *(halfday)*: bank a voice → issue a
    scoped license → synthesis carries the watermark+license → revoke → next request correctly
    refused; an unlicensed clone attempt is flagged by the verifier. Spine: eval=license
    matrix + watermark survival · gate=no license, no synthesis; revocation is code.

17. **Walkie** *(STATE + RAILS — Sauna for the deskless)* — Sauna-style team memory assumes
    the team types; the 2.7-billion-person deskless workforce — construction crews,
    restaurants, clinics, warehouses, farms — runs on speech, and their tribal knowledge
    (handoffs, safety issues, "the trick to the freight elevator") evaporates every shift.
    Product: the crew radio that remembers: a voice-first team agent on the channel crews
    already use (radio/phone/headset), capturing commitments, incidents, and handoffs into
    shared, structured crew memory — briefing the next shift in its own words, flagging unclosed
    loops, surfacing "we solved this last month" mid-job. Claude-test reasoning: Claude +
    Slack MCP does nothing here — there is no Slack; the moat is voice-native rails into
    radios/phones + the accumulated crew corpus no platform holds. Why it appreciates: better
    speech models make the ambient capture better; the crew's longitudinal memory is the asset,
    and the deskless market has no incumbent substrate at all. Diet slice *(fullday)*:
    replay a crew's week of radio chatter → shift-change briefing generated, one unclosed
    safety loop caught and escalated; the "ask the channel history" moment mid-demo. Spine:
    eval=commitment-extraction precision + briefing usefulness rated by a real crew lead ·
    measure=unclosed loops caught, onboarding time · orch=capture + structurer + briefer ·
    tools=telephony/radio bridge, speech · gate=safety escalations always page a human;
    nothing is deleted, ever (it's an evidence trail).

18. **Echo** *(STATE + AUTHORITY — the standing family interviewer)* — Family stories die
    untold because "record grandma someday" never comes — and someday has a deadline nobody
    knows. Product: a standing interviewer with a relationship: it calls Sunday at 4pm, in a
    warm voice, and *remembers* — follows up in October on the farm story from March, notices
    the gaps in the timeline, asks about the sister nobody mentions. Years of conversations
    become a provenance-gated living archive (every sentence traces to a recording — no source,
    no sentence) that the family can converse with; with documented consent via Timbre, it can
    eventually answer in her voice. Claude-test reasoning: a chat can conduct one nice
    interview; the product is the multi-year interviewing *relationship*, the proactive
    call rail, and the provenance guarantee — and the corpus is unrecoverable once it's too
    late, which is also the sales urgency. Why it appreciates: better models interview more
    deftly and synthesize more beautifully — from a corpus only you hold. Diet slice
    *(fullday)*: three compressed "calls" with follow-ups across them → the archive answers a
    grandchild's question with cited audio; a fabricated embellishment is struck on screen.
    Spine: eval=sentence-provenance coverage + follow-up quality across sessions ·
    measure=stories captured before it's too late · orch=interviewer + archivist + provenance
    gate · tools=telephony, ElevenLabs, archive store · gate=consent (Timbre) for any voice
    synthesis; no source, no sentence.

19. **Landline** *(STATE + GUARANTEES + RAILS — the companion that notices)* — Millions of
    elders are isolated (loneliness now carries mortality risk comparable to smoking), and
    families find out something's wrong months late. Product: a daily companion call with true
    memory — it knows the doctor's appointment, the granddaughter's recital, yesterday's
    mood — and, the bold half: longitudinal voice biomarkers. Speech rate, word-finding
    pauses, vocabulary drift measured against the person's OWN multi-month baseline are
    early signals of cognitive and health decline; deviations escalate through the family
    authority graph (Ward's sibling). Claude-test reasoning: any voice bot can chat warmly
    for one call; the product is the years-long baseline corpus (time-locked — you can't
    retroactively record last year's voice), the daily call rail, and escalation gates.
    Why it appreciates: better speech models sharpen the biomarkers against the same
    irreplaceable baseline. ⚠ The dig: clinical validation for the biomarker claims — real
    research field, real IRB work; ship the companion first, earn the biomarkers. Diet slice
    *(fullday)*: replay six months of daily calls compressed → the companion-with-memory
    moments land, then the trend line drifts and the right daughter gets the right call.
    Spine: eval=escalation precision vs labeled events + biomarker correlation on public
    speech-pathology datasets · measure=days-earlier detection · orch=companion + trend
    sentinel + escalator · tools=telephony, ElevenLabs, speech analysis · gate=escalation
    thresholds and family graph are code; it never diagnoses, it notices.

20. **Reprise** *(GROUND TRUTH + GUARANTEES — music as a memory rail)* — Musical memory is
    the last memory to go: dementia patients who can't name their children still sing every
    word of their wedding song — and clinical practice (personalized music therapy) is
    documented, effective, and almost entirely manual. Product: the memory-care music
    companion: builds each patient's musical biography (from family interviews + era/region
    inference), runs voice-guided reminiscence sessions weaving their actual songs with
    era-authentic transition arrangements, and — the stakes — records outcome ground truth:
    engagement, agitation, sleep, med-use deltas per session, per song, building the outcome
    registry personalized music therapy has never had. Claude-test reasoning: a playlist is a
    prompt; the session protocol, the family consent/biography pipeline, and the per-patient
    outcome data are infrastructure. Why it appreciates: better music models make sessions
    richer; the therapy outcome registry (Casebook's clinical cousin) is the moat. ⚠ Dig:
    music-therapy domain expertise + facility partnerships; licensing questions on original
    recordings (generated transitions vs. masters). Diet slice *(fullday)*: one synthetic
    patient's musical biography → a guided session → the outcome dashboard across simulated
    weeks. Spine: eval=engagement/agitation deltas vs standard-care baseline ·
    measure=agitation incidents, caregiver hours · orch=biographer + session guide + outcome
    scribe · tools=music gen, ElevenLabs, family intake · gate=clinical boundaries in code;
    families consent to everything; it soothes, never treats.

21. **Mother Tongue** *(STATE + AUTHORITY + NETWORK — a language is a corpus with a
    deadline)* — Roughly half of the world's ~7,000 languages will lose their last fluent
    speakers this century; when that happens, everything not recorded is gone — the hardest
    time-locked corpus there is. Product: the revival loop: voice agents conduct
    elder-in-the-loop recording sessions (stories, vocabulary, the untranslatable), build the
    community-owned corpus under community governance (consent + ownership are the product —
    this field has a real history of extraction), then become conversational *practice
    partners* for descendants: patient, tireless, speaking grandmother's dialect. Claude-test
    reasoning: frontier models speak the big-500 languages; a specific dialect's living corpus
    plus the community's trust cannot be scraped. Why it appreciates: every model improvement
    revives more from the same corpus — better synthesis, better tutoring — while the capture
    window only narrows. ⚠ Dig: field linguistics methodology + community partnerships;
    grant-fundable (endowments exist for exactly this). Diet slice *(fullday)*: one dialect
    (even a family's heritage language) → recording session → corpus with consent ledger → a
    descendant has a beginner conversation with the practice partner. Spine: eval=speaker-
    panel fidelity rating + learner retention · measure=hours of corpus banked, active
    learners · orch=recorder + corpus builder + tutor · tools=ElevenLabs, speech, archive ·
    gate=community consent ledger governs every use; the corpus belongs to them, contractually.

22. **Shift Change** *(GROUND TRUTH + STATE — the expertise exit interview, done for years)* —
    The knowledge cliff is here: the veterans who keep plants, utilities, refineries, and
    legacy systems alive are retiring en masse, and their judgment — not the manuals, the
    *judgment* — walks out with them. (Sauna remembers a team's forward motion; this captures
    what's about to leave.) Product: a standing voice relationship with each expert's final
    years: ride-along interviews ("walk me through why you didn't trust that gauge"),
    incident debriefs, war stories — structured into a queryable expert memory that future
    workers *talk to* on the floor, hands busy, headset on: "Rodriguez retired in '27 but
    says: check the bleed valve first, and here's the story of why." Claude-test reasoning:
    the model can interview and synthesize; the accumulated expert corpus, the multi-year
    capture relationship, and the floor-side voice rail are the assets — enterprises already
    pay for knowledge-transfer programs that produce binders nobody reads. Why it
    appreciates: time-locked (retirement dates are hard deadlines) and better models mine the
    same corpus deeper forever. Diet slice *(fullday)*: interview a real expert (any trade,
    even a master photographer) for one hour → queryable voice archive → a novice solves a
    staged problem by talking to it; the money moment is an answer with the war story
    attached. Spine: eval=novice task success with vs without the archive + expert fidelity
    sign-off · measure=hours of judgment banked before the retirement date ·
    orch=interviewer + structurer + floor-side answerer · tools=ElevenLabs, speech, headset
    rail · gate=the expert reviews and owns their archive; safety-critical answers cite or
    refuse.

---

## How it composes

```
            Steward · Ward · Middleman · Countersign · Witness · Gatehouse   ← products
            ──────────────────────────────────────────────────────────────
  learning  Casebook (outcomes → aim)                                        ← the flywheel
guarantees  Paper Trail (receipts) · gates · deadline math                    ← the brakes
     rails  Clerk (fax/mail/portals/IVR) · voice · payments                   ← the roads
 authority  Mandate (delegation, consent, verification) · Timbre (voice)      ← the license
     state  Registry (provenance, expiry, verification loop)                  ← the chassis
            ──────────────────────────────────────────────────────────────
            [ the model — swappable, improving, not ours ]                     ← the engine
```

Build order intuition: every vertical needs 2–3 stack layers; every stack layer is
independently demoable. A hackathon buys you one cell; a weekend buys a column.

## Event-theme mapping (diet slices)

| Event theme | Reach for |
|---|---|
| Loop engineering | Steward slice (state-driven wakes — the loop fires off the expiry graph, not a cron) |
| Harness / orchestration | Paper Trail (fleet receipts + anomaly review) |
| Evals / continuous improvement | Casebook (win-rate calibration is the eval) |
| Payments / commerce | Middleman, Mandate |
| Consumer | Steward, Gatehouse, Ward |
| Security / trust | Gatehouse, Mandate, Witness |
| Voice | Walkie, Landline, Echo (voice-native by design) · Gatehouse (scam interception) |
| Memory / personalization | Echo, Shift Change, Landline, Walkie (the time-locked-corpus plays) |
| Health / accessibility | Reprise, Landline, Timbre (ALS voice banking) |
| MCP / tools | Clerk (bureaucracy rails as MCP) |
| Open track / moonshot | Persona Ficta, Testament, Commons, Mother Tongue |

## Standing rules

- **The appreciation test replaces the arms race:** for every idea ask, "when Claude 6 ships,
  does this get stronger or die?" Only stronger survives the doc.
- **Claude test stays, executed as reasoning:** write the honest baseline (Claude + MCPs +
  prompt + scheduled task, assuming next-gen capability) and name the ≥2 assets it can't own.
  Cross off at the whiteboard.
- **Market-check before committing:** entries tagged ⚠ market-check pending were NOT covered by
  the 2026-07-05 researcher sweep — run a fresh sweep on the chosen idea before a weekend build.
- After any event: capture what shipped in DEMO.md, promote or strike here.
