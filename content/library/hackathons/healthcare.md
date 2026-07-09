---
title: Healthcare Hackathon Slate (Abridge event)
collection: hackathons
source: ~/dev/hackathons/HEALTHCARE.md
sourceMtime: '2026-07-06T19:48:02.455Z'
syncedAt: '2026-07-09'
summary: >-
  Event prompt: pick one clinical or operational workflow; build an agentic
  system that makes it faster, smarter, or safer; ship something a clinician or
  patient-facing team could use Monday. Abridge…
contentHash: 'sha256:4d0487dd9b9eaeb3610bb082fc382d4a3616893adb6d671320de8e250d5b230e'
---
# Healthcare Hackathon Slate (Abridge event)

*Event prompt: pick one clinical or operational workflow; build an agentic system that makes it
faster, smarter, or safer; ship something a clinician or patient-facing team could use Monday.
Abridge engineers + clinicians pressure-testing on the floor.*

*Doctrine applied: the prompt's own examples (trial matching, prior auth) are what half the room
builds — avoided. Abridge = ambient transcription, so ideas sitting ON TOP of encounter
transcripts land hardest with the judges. All demos on synthetic data (generated transcripts +
Synthea FHIR); paperwork and logistics, never diagnosis; every irreversible step gated.*

---

## The slate

1. **Loose Ends** *(first pick — the follow-through engine; merges "Said vs. Signed" +
   referral-loop closure)* — Healthcare's deadliest mundane failure is the dropped thread: the
   doctor says "we'll get you a cardiology referral and check your thyroid," the note looks
   complete (increasingly because an AI scribe wrote it), but no referral order exists and no
   TSH was placed — and even when the referral IS sent, ~half never complete: faxes vanish,
   patients don't book, reports never return. One agent owns the whole thread lifecycle:
   **(a) catch** — diff what was *said* in the encounter transcript against what was actually
   *ordered and documented*, flagging gaps before signature; **(b) chase** — track every open
   thread (referrals, orders, results), detect the stall (no state change in N days, urgency-
   tiered), and nudge through the right channel (fax rail, portal, patient text); **(c) close** —
   file the consult note back and mark the loop closed, or escalate. Demo arc: visit transcript
   promises three things → chart shows two → the missing referral turns red pre-signature; then
   time-compress three weeks → the urgent derm referral stalls at day 12 → chased → closed. The
   scribe writes what was said; we catch what was promised and make sure it happens. Spine:
   eval=catch-rate on transcripts seeded with dropped intentions + stall-detection precision on
   a synthetic referral cohort · measure=dropped threads per 100 visits, referral closure rate ·
   orch=transcript-differ + thread tracker + channel executors · tools=transcript ingestion,
   FHIR, fax/portal rails · gate=flags and chases, never places orders; urgency tiers and
   deadline math are code; sign-off stays human. Why it wins the room: Abridge-native
   (verification layer on top of their category), a guarantee rather than a drafting wrapper,
   and a pure appreciation play — the more AI writes the notes, the more the world needs the
   thing that checks follow-through. Extensions (same engine, more thread classes): tests pending at
   discharge (open whitespace — see Pending, #4); NOT incidental imaging findings (Rad AI
   Continuity and inflo Health own that category). ⚠ Floor-test first: Abridge's June 2026
   platform keynote includes order generation from conversation — ask their engineers where
   their roadmap stops; the downstream chase-to-closure half is safely beyond it, the
   said-vs-signed diff may be adjacent.

2. **First 30 Days** *(the "saving lives" pick — discharge companion, voice-native)* —
   Readmissions cluster in the 30 days post-discharge and the causes are mundane: meds never
   picked up, instructions not understood, follow-ups never booked, symptoms ignored until day
   nine. A voice agent runs the transition: plain-language (and native-language) discharge
   recap, med-pickup confirmation, follow-up booking, short daily check-in calls *with memory*
   — and protocol-driven escalation where thresholds come from the discharge orders and live in
   code, never the model's judgment. Demo: synthetic CHF discharge; the day-3 call catches
   weight gain plus a missed diuretic pickup and pages the nurse. Spine: eval=escalation
   precision/recall on seeded red-flag scenarios · measure=readmission-driver interceptions,
   nurse minutes · orch=recap writer + caller + protocol sentinel · tools=ElevenLabs/telephony,
   discharge orders, pharmacy status · gate=escalation thresholds are deterministic; it never
   reassures away a red flag — ambiguity escalates. Risk to prep for: clinician judges will
   probe escalation safety hard — survivable precisely because the gates are code.

3. **Fax Desk** *(the most on-prompt pick — with an honest caveat)* — Clinics receive hundreds
   of faxes a day (referrals, outside records, results), hand-sorted by burned-out staff; the
   dangerous failure is the critical result sitting in the pile overnight. Agent: classify,
   extract, match to patient, route to the right queue, escalate urgent results in seconds —
   routing accuracy and urgent-catch-rate on screen as the evals. Demo: 50 synthetic faxes →
   sorted in a minute → one buried critical potassium escalated with a page. Spine:
   eval=routing accuracy + urgent catch-rate/false-alarm rate · measure=staff hours, time-to-
   escalation · orch=classifier + extractor + router + sentinel · tools=OCR, fax rail, FHIR ·
   gate=urgent escalations always page a human; nothing files to a chart unreviewed.
   ⚠ Caveat, stated out loud in the pitch: this category has a funded incumbent (Tennr) — great
   hackathon demo and Monday-shippable, weak product whitespace. Pick it for execution points,
   not novelty.

*(Cut from the original slate: standalone prior-auth — the example prompt everyone builds, and
the differentiated version's best parts [compile-or-fail evidence gate, outcome odds] fold into
Loose Ends and Casebook anyway.)*

## What we're deliberately NOT building (incumbent check, researched 2026-07-06)

*Walking in knowing this is ammo — "we checked; that ships already" is a credibility move with
clinician judges.*

- **Ambient scribing / chart summarization / pre-rounding** — Abridge (the sponsor) ships
  pre-round notes as of June 2026; Epic's Art Insights runs 16M uses/month. Oligopoly.
- **In-basket drafting** — Epic MyChart ART: 150+ orgs, 1M+ drafts/month. Solved at scale.
- **Nurse brain sheet / handoff** — Google Cloud + HCA Nurse Handoff (scaling to 99K nurses),
  Abridge for Nurses (250+ systems), Epic end-of-shift notes. Solved, consolidating.
- **Radiology incidental-finding tracking** — Rad AI Continuity (50+ finding categories) and
  inflo Health (RSNA 2025) own the category. Deployment gaps exist; the algorithm is claimed.
- **PA/benefits phone automation** — SuperDial, Prosper AI already do payer IVR calls.

## Cognitive-load batch — reduce what lives in a clinician's head

*Target: the tracking, chasing, and redundancy clinicians carry mentally between patients.
Verdicts and stats from the 2026-07-06 researcher sweep (peer-reviewed where possible;
vendor-sourced stats flagged). Each is whitespace or honestly-caveated partial whitespace.*

4. **Pending** *(hospitalist — tests pending at discharge; the strongest whitespace in the
   sweep)* — ~40% of hospital discharges leave with a test still pending; 30–40% of those
   return actionable results; physicians are unaware of 62% of them. Today the coping
   mechanism is whoever happens to remember. The agent: at discharge, inventories every
   pending lab/micro/path, binds each to an accountable owner, watches for results, and when
   an actionable one returns runs an *action-forcing* loop — not notify-only (the systematic
   review found notification-only interventions underperform): the result arrives with a
   drafted next step, requires acknowledgment, escalates up the chain if unacknowledged, and
   notifies the patient once the owner acts. Demo: synthetic discharge with three pending
   tests → the day-6 pathology result returns actionable → routed with draft plan → unacked
   for 48h → escalated → closed, patient notified. Spine: eval=catch + acknowledgment rate on
   a seeded TPAD cohort vs notify-only baseline · measure=actionable results reaching an
   accountable owner, days-to-action · orch=inventory + watcher + escalator · tools=FHIR,
   results feeds, paging/messaging · gate=ownership assignment and escalation ladders are
   code; it never interprets the result, it delivers it with the chart context. Composes with
   Loose Ends as a thread class, or stands alone. Evidence base is strong (AHRQ/JHM) and no
   incumbent owns it.

5. **Quiet Read** *(radiologist — the reading-room phone, and the creative standout)* —
   On-call radiologists field ~72 phone calls per 12-hour shift — ~108 minutes on the phone —
   and there's a 59% chance of interruption in any 10-minute CT read; interruptions during
   interpretation are an error risk, not just an annoyance. The agent answers the reading-room
   phone: identifies the caller and ask ("has the head CT been read?" → answers from PACS
   status directly), takes structured messages, batches non-urgent queries for delivery at
   natural between-study breakpoints, and passes true emergencies (stroke, trauma, unstable
   patient) through instantly by a policy that lives in code. The mental-load frame: protect
   the read. Demo (voice — ElevenLabs makes this land): a simulated reading session under a
   call flood — the agent resolves eight inquiries itself, batches seven for the break, and
   passes the one stroke call through in seconds; interruption count and protected reading
   minutes on screen. Spine: eval=zero false-holds on an emergency-scenario set (the critical
   number) + resolution rate on routine inquiries · measure=interruptions per read,
   phone-minutes returned · orch=answerer + PACS-status resolver + batcher + escalation
   sentinel · tools=telephony, PACS/RIS status APIs · gate=the pass-through policy is
   deterministic; when in doubt, interrupt the radiologist — the failure mode must be
   over-interruption, never under. Whitespace confirmed: triage AI (Aidoc) reduces some call
   volume upstream, but nobody answers the phone.

6. **Page One** *(on-call/cross-cover — context-wrapped paging)* — Cross-covering physicians
   get blind pages ("pt in 412, BP 180/100") about patients they've never met, then pull the
   chart cold at 3am; vendor data claims ~70% faster response when context arrives with the
   call. The agent intercepts the page and wraps it: a three-line snapshot — who the patient
   is, why they're admitted, code status, the meds/labs/trends relevant to *this* page, and
   what the caller wants — assembled in seconds, stamped with data freshness (a stale summary
   in an emergency is a safety failure, so every snapshot carries its generated-at time and
   true emergencies bypass entirely). Demo: same page, blind vs wrapped, decision time on a
   stopwatch. Spine: eval=snapshot factual accuracy vs chart + relevance rating by clinicians
   + zero-delay pass-through on emergencies · measure=time-to-decision, cold chart pulls
   avoided · orch=page listener + context assembler · tools=paging integration, FHIR ·
   gate=emergency classes bypass unconditionally; staleness threshold refuses to send old
   data. Partial whitespace: point products exist (healow Genie), no category leader.

7. **Form Feeder** *(cross-role — FMLA/disability/DME/school notes)* — Every form is 10–20
   minutes of focused physician work — "an appointment slot's worth" — with zero clinical
   value, and the sweep found no dedicated incumbent. The agent: inbound form → every field
   mapped to a specific chart element (citation-or-flag — unanswerable fields flag for the
   human, *never* improvised, because a hallucinated clinical justification on a federal form
   is fraud-adjacent, not a typo), drafted for signature, plus the part nobody does: a durable
   registry of what's pending, expiring, and due for renewal so recurring forms auto-restart.
   Demo: FMLA cert in → drafted with per-field chart citations + two honest flags in 60
   seconds → signature → the renewal appears on the registry. Spine: eval=field accuracy vs
   labeled forms + zero-fabrication rate · measure=minutes per form, renewals never missed ·
   orch=parser + evidence mapper + registry sentinel · tools=chart/FHIR, form templates,
   docx/PDF · gate=citation-or-flag; nothing leaves unsigned. RFP Machine's mechanic in
   clinic clothes.

8. **Card Audit** *(surgeon/OR — preference-card hygiene)* — Surgical preference cards drift
   years out of date, so ORs over-pull instruments and supplies that get opened, unused, and
   wasted, and circulating nurses guess. The agent reconciles each card against what cases
   *actually* used (case logs, supply scans): proposes per-surgeon card diffs with evidence
   ("laparoscopic tray item X opened in 0 of last 25 cases — remove?"), surgeon one-tap
   approves. Understudy's learn-from-behavior mechanic in the OR. Demo: 25 synthetic case
   logs vs a stale card → a diff with dollar figures → approved card v2. Spine: eval=diff
   precision vs a nurse-manager-labeled card · measure=$ waste per case removed (⚠ be honest
   that the waste stats are vendor-sourced, not peer-reviewed — clinician judges will know) ·
   orch=usage miner + diff proposer · tools=case logs, supply data · gate=cards change only
   on surgeon approval; safety-stock items are never proposed for removal. Whitespace:
   LeanTaaS writes blog posts about this; nobody ships the auto-audit.

9. **Day-Of** *(pre-op — cancellation prevention, honestly caveated)* — Day-of-surgery
   cancellation rates run 2–24% and over 80% are preventable/administrative: the missing
   cardiology clearance, the lab never drawn, the consent unsigned, the NPO instructions
   never confirmed. The agent runs the readiness checklist per case: chases each item through
   the right channel days ahead (assessment ≥24h pre-op cuts postponement risk ~50%),
   forecasts which cases will cancel ("case 3 cancels Thursday unless cardiology clearance
   arrives — chased, ETA today 4pm"), and escalates while there's still time to backfill the
   slot. Spine: eval=cancellation prediction precision on a synthetic cohort ·
   measure=preventable cancellations caught, OR minutes saved · orch=per-case checklist
   sentinel + channel chasers · tools=scheduling, FHIR, fax/phone rails · gate=checklist
   completeness is deterministic; clinical fitness calls stay with anesthesia. ⚠ Qventus
   launched exactly this in Jan 2025 (early-stage, cohort deployments) — the honest angle is
   the long tail they don't serve: ambulatory surgery centers and small hospitals. Pick this
   only with that framing.

10. **P2P Corner** *(the peer-to-peer prep, kept deliberately small)* — Voice agents now do
    payer IVR and benefits calls (SuperDial, Prosper), but the physician-to-physician prior-auth
    call still requires the physician — and they walk in cold. The agent can't take the call
    (and shouldn't: state laws are moving against autonomous AI determinations) — it schedules
    it and preps the one-pager: the payer's own policy criteria mapped line-by-line to this
    patient's chart, the denial's weak points, and what overturned similar denials. The gate
    IS the pitch: it preps the human, never replaces them. Slice-sized; pairs with Casebook.

## Picks

- **Overall first pick: Loose Ends (#1)** — but pressure-test the said-vs-signed half with
  Abridge engineers in hour one (their order-generation roadmap may be adjacent); if it
  overlaps, pivot the same engine to **Pending (#4)**, which is the cleanest confirmed
  whitespace in the file and shares the thesis: follow-through as infrastructure.
- **Creative standout: Quiet Read (#5)** — voice-native, visceral demo, protects a
  safety-critical cognitive task, and nobody in the room will have it. Best "judges retell it
  later" candidate.
- **Fastest to Monday-shippable: Form Feeder (#7)** — smallest integration surface, clearest
  time-savings number, zero-fabrication gate as the trust moment.
