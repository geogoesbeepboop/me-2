---
title: Concierge
collection: dossiers/personal
source: ~/dev/docs/personal/calendar-negotiator-agent.md
sourceMtime: '2026-06-05T07:25:13.290Z'
syncedAt: '2026-07-09'
summary: >-
  An always-on scheduling agent that negotiates meeting times over
  email/Telegram on your behalf, with a deterministic constraint-solver — not
  the LLM — choosing the final slot.
contentHash: 'sha256:dfe4c962c5c1d716942a429499c9f81a08170f1a5883132cf54e8f8e2f54e77a'
---
# Concierge
> An always-on scheduling agent that negotiates meeting times over email/Telegram on your behalf, with a deterministic constraint-solver — not the LLM — choosing the final slot.

**Bucket:** personal · **Effort:** M · **Reuses:** agent-core harness, Temporal durable workflow + HITL approval signal + durable timer, deterministic gate as sole authority (jim/procurement pattern), HMAC-signed pre-authorization mandate (procurement), Calendar MCP + Gmail MCP, Haiku/Sonnet tiering, pgvector preference memory, Telegram front-end, Langfuse + eval corpus, graceful degradation / heuristic fallback

---

## TL;DR

Concierge is a durable scheduling agent that lives inside your email inbox and negotiates meeting times on your behalf — reading the thread, computing conflict-free candidate windows against live free/busy data, drafting the reply, and waiting for your single Telegram tap before creating the event. The signature move is that the LLM never names a slot; a pure-Python constraint solver is the sole authority that determines what is confirmable, making double-bookings and hallucinated times structurally impossible. For anyone who lives in back-and-forth scheduling threads — founders, consultants, recruiters, freelancers — it collapses a five-volley email exchange to a single exchange while preserving full human control over the final commit.

---

## The Problem

Scheduling is friction disguised as coordination. A typical external meeting request generates four to seven email volleys: timezone math errors, "does Tuesday work?" with no time given, counter-proposals that land while you are in another meeting, and the chronic risk of booking over a focus block or a child's school pickup. The problem is not calendar software — it is the unstructured negotiation that happens in email *before* anything reaches the calendar.

Calendly partially solves this by giving the requester a booking link, but that requires the requester to adopt your link, which roughly half of external parties resist on principle, and it gives you zero say in the conversational framing. Motion, Reclaim, and Google's Gemini day-ahead briefing all operate on your calendar *after* agreements are made; none of them negotiate inside an arbitrary email thread.

The deeper problem, the one that makes naive LLM automation dangerous here, is trust. Calendar slots are attached to real-world commitments — childcare, flights, in-person travel time. An LLM that can hallucinate a slot you are not actually free for, or mis-convert a timezone by one hour, causes real-world damage. As of mid-2026, this is precisely the governance bottleneck that the enterprise AI market has surfaced: the EU AI Act's Article 14 (effective August 2, 2026) mandates human oversight for consequential automated decisions, and Article 12 mandates immutable, traceable event logs for high-risk agent actions. Booking a meeting on someone's behalf is exactly the kind of irreversible, externally-visible action that needs a verifiable, auditable decision boundary — not "the model was pretty sure it was free."

---

## What It Does

**Core capabilities:**

- **Thread parsing.** Haiku reads an incoming email thread and extracts the counterpart's proposed times, constraints ("mornings only"), and timezone signals into a structured `NegotiationIntent` object.
- **Constraint solving.** A pure-Python solver intersects real free/busy data (Calendar MCP) against hard rules: working hours, minimum buffer between calls, maximum meetings per day, named protected focus blocks, in-person travel time, and timezone correctness. Returns a ranked list of confirmed-open windows, or an empty set with a reason code.
- **Reply drafting.** Sonnet takes the solver's output and writes a human-quality reply: proposes up to three slots in the counterpart's timezone, handles the "no slots found, requesting alternatives" case gracefully.
- **HITL approval gate.** The drafted reply and proposed slots surface as a Telegram inline-button card. You tap Confirm, Revise, or Reject. Only a Confirm signal — a Temporal external signal — allows execution.
- **Live re-verification before write.** Between your approval tap and the calendar write, the solver re-queries free/busy one final time. If the slot was grabbed in the interim, it surfaces the conflict and re-proposes rather than double-booking.
- **Event creation + invite send.** Calendar MCP creates the event; Gmail MCP sends the acceptance reply. Both writes happen in a single Temporal activity with compensating rollback.
- **Preference learning.** Post-booking, the agent logs the accepted slot's attributes (time-of-day, day-of-week, duration, meeting type) to pgvector. Over time, the solver's soft-preference scoring personalizes the ranking without ever relaxing the hard rules.
- **Agent-to-agent negotiation.** The agent can exchange structured availability proposals over MCP/A2A with a counterpart scheduling agent (e.g., another Concierge instance), converging without human-visible volleys until the final confirmation.

**Walked-through example:**

> 1. An email arrives: "Hey George, can we find 30 min next week to sync on the contract? I'm on EST."
> 2. Concierge detects the scheduling intent (Gmail MCP watch trigger → Temporal signal).
> 3. Haiku parses the thread → `NegotiationIntent { duration: 30, timezone: "America/New_York", week: "2026-06-08/14", type: "external_sync" }`.
> 4. The solver pulls live free/busy from Calendar MCP, applies George's rules (no calls before 9 AM PT, 15-min buffers, Tuesday is deep-work day, no more than 3 external calls per day), and returns three open windows.
> 5. Sonnet drafts: "Happy to connect — here are three options in your timezone: Mon 2–2:30 PM EST, Wed 11–11:30 AM EST, Thu 3–3:30 PM EST. Let me know what works."
> 6. A Telegram card shows the draft + calendar preview. George taps Confirm.
> 7. The solver re-verifies all three slots are still open. They are.
> 8. Calendar event created. Reply sent. Total elapsed time from inbound email: under 90 seconds. Volleys-to-booked: 1.

---

## Who It's For / Enterprise Translation

**Personal personas:** Founders who schedule 8–12 external calls per week. Independent consultants and freelancers for whom every booking friction is revenue friction. Recruiting coordinators handling high-volume candidate scheduling. Executive assistants managing a principal's calendar.

**Enterprise buyer analog:** Sales and Revenue Operations teams (SDR/AE handoff scheduling, prospect → demo booking), recruiting coordination platforms (Greenhouse, Lever integration), and executive-assistant tooling. The direct commercial comp is Paradox's Olivia (AI recruiting coordinator, $400M+ ARR territory), Clockwise, and emerging agent-native scheduling startups. The value metric that resonates in a sales conversation: scheduling cycle time (days from first email to booked meeting), coordinator hours reclaimed per week (industry estimate: 3–4 hrs/day per coordinator), and zero double-booking SLA.

**The EU AI Act framing for enterprise buyers:** the deterministic solver + immutable Langfuse trace + HITL approval gate satisfies Article 12 (automatic logging) and Article 14 (human oversight) out of the box, making this the scheduling automation that can actually pass a legal and security review in Q3 2026. That is the answer to the governance bottleneck, not a feature.

---

## Architecture

The agent is structured as a **Temporal workflow per active negotiation thread**. Durability is essential: a negotiation can span multiple days (waiting for the counterpart's reply), must survive process restarts, and must handle timeout/expiry gracefully (if no reply in 5 days, send a polite follow-up; if no reply in 10, archive).

```mermaid
flowchart TD
    subgraph Inputs
        G[Gmail MCP\nwatch / forward trigger]
        T_IN[Telegram\ninbound message]
    end

    subgraph Temporal Workflow — NegotiationRun
        direction TB
        A[Activity: parse_thread\nHaiku → NegotiationIntent]
        B[Activity: solve_constraints\nconstraint_solver.py\npure Python — NO LLM]
        C{Slots found?}
        D[Activity: draft_reply\nSonnet → ReplyDraft]
        E[Activity: send_telegram_card\nHTIL approval gate]
        F[Temporal: wait_for_signal\nexternal signal — timeout 48h]
        G2{Signal type?}
        H[Activity: re_verify_slots\nconstraint_solver.py — live re-check]
        I{Still open?}
        J[Activity: write_event\nCalendar MCP]
        K[Activity: send_reply\nGmail MCP]
        L[Activity: log_preference\npgvector — soft learning]
        M[Activity: draft_decline_counter\nSonnet — no slots, request alternatives]
        N[Activity: send_decline\nGmail MCP]
        O[Timer: follow_up / archive\ndurable Temporal timer]
        P[HITL: Revise\nback to draft]
        Q[End: Rejected\nlog + archive]
    end

    subgraph Data Stores
        CAL[Calendar MCP\nlive free/busy]
        VEC[Supabase + pgvector\nscheduling preferences]
        LF[Langfuse\ntraces + evals]
    end

    G --> A
    T_IN --> A
    A --> B
    B --> CAL
    B --> VEC
    B --> C
    C -- slots found --> D
    C -- no slots --> M
    M --> N
    N --> O
    D --> E
    E --> F
    F --> G2
    G2 -- Confirm --> H
    G2 -- Revise --> P
    G2 -- Reject --> Q
    P --> D
    H --> CAL
    H --> I
    I -- yes --> J
    I -- conflict re-emerged --> D
    J --> K
    K --> L
    L --> VEC
    A -.-> LF
    B -.-> LF
    H -.-> LF
    J -.-> LF
```

**Tech-stack table:**

| Layer | Choice | Rationale |
|---|---|---|
| Orchestration | Temporal | Durable multi-day workflow, HITL external signal, durable timer for follow-up/expiry |
| LLM — parsing | Claude Haiku | Low-latency, cheap, mechanical intent extraction |
| LLM — drafting | Claude Sonnet | Human-quality prose, handles edge cases in phrasing |
| LLM — escalation | Claude Opus | Ambiguous/contested threads (optional, cost-gated) |
| Constraint solver | Pure Python (`constraint_solver.py`) | Deterministic, unit-testable, zero hallucination risk |
| Calendar integration | Calendar MCP | Read free/busy; write event; canonical source of truth |
| Email integration | Gmail MCP | Read threads; send replies |
| State + memory | Supabase Postgres + pgvector | Negotiation state, preference embeddings |
| Observability | Langfuse | Full trace of every run; eval corpus on historical threads |
| HITL front-end | Telegram inline buttons | Confirm / Revise / Reject; same UX as grocery-buddy and procurement-agent |
| Agent harness | agent-core | Tracing, budgeting, eval wiring (sibling repo) |
| Pre-auth mandate | HMAC-signed policy window | For auto-confirm inside declared "booking windows" (procurement pattern) |

---

## The "Model Proposes, Code Disposes" Boundary

This is the architectural invariant the entire trust model rests on.

**What the LLM is allowed to do:**
- Parse unstructured email text into a structured `NegotiationIntent` (Haiku).
- Rank soft preferences and suggest how to frame the reply (Sonnet).
- Draft the human-readable reply body, including the proposed slots *already computed by the solver*.
- Draft decline/counter messages when the solver returns an empty slot set.
- Classify whether an inbound email is a scheduling request, a confirmation, a cancellation, or noise.

**What the LLM is never allowed to do:**
- Name, propose, or confirm any calendar time that has not been independently verified by `constraint_solver.py` against live free/busy data.
- Decide that a protected focus block "can probably be moved."
- Perform timezone arithmetic. The solver uses `zoneinfo` / `dateutil`; the LLM's output for times is always parsed and re-validated before use.
- Trigger the Calendar write or the Gmail send. These are executed only inside Temporal activities that are gated by a Confirm signal.
- Interpret whether a slot is "close enough" to the requested time — the solver does exact interval matching.

**What `constraint_solver.py` does (deterministic, pure Python, fully unit-tested):**
1. Pulls free/busy blocks from Calendar MCP for the candidate range.
2. Applies hard rules in order: working hours mask, protected focus blocks, minimum pre/post buffers, maximum meetings per day, in-person travel time padding.
3. Intersects the resulting open intervals with the requested duration.
4. Returns a ranked list of `ConfirmedSlot` objects, or raises `NoSlotsAvailable(reason_code)`.
5. On re-verification before write: repeats steps 1–4 and raises `SlotConflict` if any previously confirmed slot is no longer open.

The result: a hallucinated or conflicting slot is not "caught by a check" — it is **structurally impossible for the LLM to produce one that reaches the calendar**. The solver is the gate. This is the same architectural pattern as jim's sourcing gate (every published figure must trace to a primary source or the run fails pre-bill) and procurement's HMAC mandate (spend authority is enforced by deterministic policy, not model judgment).

**Pre-authorization mandate (optional):** For users who want frictionless booking within a declared window (e.g., "auto-confirm 30-min external calls on Tuesdays and Thursdays between 2–5 PM"), a signed policy object — same HMAC + TTL scheme as procurement-agent — authorizes the solver to skip the Telegram approval gate and execute directly. The mandate is revocable, time-bounded, and logged immutably.

---

## Why It's Impressive (Resume + Demo Signal)

**Seniority signals:**

1. **Deterministic authority over an irreversible external action.** Applying the "model proposes, code disposes" invariant to calendar writes — where the constraint space includes timezone arithmetic, buffer math, and live free/busy polling — shows understanding of *why* the boundary matters, not just that it exists. This is the answer to "how do you make an LLM agent safe for production use?" that most candidates answer with "we add a review step."

2. **Durable multi-day workflow design.** Using Temporal for a negotiation that spans days, survives restarts, and has a durable follow-up timer demonstrates that you think about agent workflows as state machines under failure, not just happy-path scripts.

3. **Agent-to-agent negotiation (A2A).** Structuring the agent so it can exchange structured availability proposals with a counterpart scheduling agent over MCP previews the architecture of agentic commerce — two autonomous agents reaching a binding agreement without human-visible volleys. This is the 2026 AI Act's "human oversight" question answered at the system level: the human approves the *outcome*, not every intermediate exchange.

4. **Preference learning that never relaxes hard rules.** The pgvector soft-scoring layer personalizes slot ranking without ever promoting a protected block to "probably fine." Showing the distinction between soft and hard constraints in an ML context signals production-grade ML thinking.

**The "aha" moment in a demo:** the interviewer or recruiter asks "but what if the LLM gets the timezone wrong?" — and you show the solver's test suite asserting correct UTC conversion for fifteen edge cases, then show the trace where Sonnet drafted a reply mentioning "11 AM EST" and the solver confirmed the underlying UTC interval independently before the draft was sent. The LLM's text and the solver's time are two separate artifacts that happen to agree. That separation is the answer.

---

## 3-Minute Demo Script

**Setup (30 sec):**
Show the running Temporal worker, the Langfuse dashboard with one previous completed negotiation run, and George's Google Calendar with a visible Tuesday deep-work block and a Thursday afternoon childcare block.

**The action (60 sec):**
Forward a real "can we meet next week?" email to the agent's trigger address (or paste it into the Telegram bot). Show the Temporal workflow start in the UI. Show Haiku's parse result in the Langfuse trace: `{ duration: 30, timezone: "America/Chicago", week: "next", type: "external" }`. Show the solver running in the terminal log: it pulls free/busy, masks Tuesday deep-work and Thursday afternoon, applies 15-min buffers, and returns three slots in CDT. Show Sonnet's drafted reply in the Telegram card alongside a mini calendar preview of the three proposed slots.

**The wow moment (30 sec):**
Tap Confirm on Telegram. Show the re-verification step (live free/busy check, all three slots still open). Show the Google Calendar event appear in real time. Show the sent Gmail reply. Show the Langfuse run summary: `volleys_to_booked: 1`, `solver_slots_evaluated: 47`, `slots_returned: 3`, `double_bookings: 0`.

**The failure-handling flex (45 sec):**
Re-run with a thread that proposes "Wednesday 9 AM PT" — which falls inside the Tuesday deep-work block. (Show the block visibly on screen.) The solver returns `NoSlotsAvailable(reason: "conflicts_with_focus_block: deep-work-tuesday")`. Sonnet drafts a decline with three alternatives. Show the Telegram card: "That time conflicts with a protected focus block. I've proposed three alternatives." The proposed times are not on Tuesday. No Tuesday slot was ever surfaced to the LLM. Show the Langfuse trace confirming the solver ran before the draft was generated.

**The metric you show (15 sec):**
Langfuse dashboard: last 10 negotiations, `avg_volleys_to_booked: 1.2`, `double_bookings: 0/10`, `scheduling_cycle_time: 4.3 min average`.

---

## Build Plan (Phased)

### Phase 0 — Skeleton and constraint solver (Days 1–3)
- Scaffold the repo from agent-core (tracing, budgeting, pytest harness).
- Implement `constraint_solver.py`: working-hours mask, buffer math, focus-block protection, max-meetings-per-day, timezone-correct UTC interval intersection.
- Write 40+ unit tests covering: DST transitions, cross-midnight intervals, empty free/busy, fully-blocked days, pre-authorization mandate bypass.
- No LLM, no MCP. The solver runs standalone against fixture free/busy data.
- **Exit check:** `pytest tests/test_solver.py` — 100% pass, zero flakiness on 3 consecutive runs.

### Phase 1 — Calendar MCP + live free/busy (Days 4–5)
- Wire Calendar MCP (Google Calendar OAuth, read free/busy, write event).
- Add a CLI harness: `python -m concierge.check --date 2026-06-10 --duration 30` prints available slots.
- Test against a real calendar with known blocks.
- **Exit check:** CLI correctly refuses a slot that is visibly blocked on the calendar, and returns correct UTC times for two distinct timezones.

### Phase 2 — Thread parsing + reply drafting (Days 6–8)
- Wire Gmail MCP (read thread, send reply).
- Implement Haiku `parse_thread` activity → `NegotiationIntent`.
- Implement Sonnet `draft_reply` activity → `ReplyDraft` using solver output only.
- Build offline eval corpus: 20 real (anonymized) scheduling threads, labeled with expected `NegotiationIntent` and correct slot set. Run `evals/run_parse_eval.py` — target ≥90% intent parse accuracy.
- **Exit check:** eval suite passes; draft reply for three fixture threads looks human-quality on manual inspection; no draft ever contains a time not in the solver's output.

### Phase 3 — Temporal workflow + Telegram HITL (Days 9–12)
- Implement `NegotiationRun` Temporal workflow with all activities wired.
- Add Telegram inline-button card (Confirm / Revise / Reject) as external signal.
- Add durable follow-up timer: if no counterpart reply in 5 days, send nudge; archive at 10 days.
- End-to-end test: forward a real email, tap Confirm, verify event appears on calendar.
- **Exit check:** full happy-path run completes; Temporal UI shows workflow graph; Langfuse shows complete trace with `volleys_to_booked` metric logged.

### Phase 4 — Re-verification, pre-auth mandate, preference learning (Days 13–16)
- Add live re-verification activity before calendar write (slot conflict → re-propose path).
- Implement HMAC-signed pre-authorization mandate for the auto-confirm window (port from procurement-agent).
- Add pgvector preference logging: embed slot attributes on accept; adjust soft scoring in solver.
- Test mandate: create a signed policy window, confirm it bypasses Telegram gate only for matching slots.
- **Exit check:** inject a slot-grab conflict between Confirm tap and calendar write — agent re-proposes correctly. Mandate auto-confirms a matching slot without Telegram.

### Phase 5 — A2A negotiation + hardening (Days 17–20)
- Expose an MCP server interface for structured availability exchange (publish available windows, accept a proposed slot).
- Test two Concierge instances negotiating with each other to a confirmed slot with zero human-visible volleys.
- Langfuse dashboard: `volleys_to_booked`, `double_bookings`, `scheduling_cycle_time` across 10 live negotiations.
- Write ARCHITECTURE.md, ADR-001 (solver-as-authority), ADR-002 (pre-auth mandate), SYSTEM_MAP, ROADMAP.
- **Exit check:** A2A negotiation converges in ≤2 machine exchanges; dashboard shows target metrics; all docs committed.

---

## Differentiation

**vs. Calendly:** Calendly requires the counterpart to use your booking link. Concierge negotiates inside arbitrary inbound email threads — no counterpart setup required. Calendly's "available slots" are LLM-unaware and static; Concierge's slots are dynamically solved against live state.

**vs. Motion / Reclaim:** Both operate on your existing calendar to reschedule and protect time. Neither negotiates externally. Neither applies a deterministic solver as the booking authority.

**vs. Google Gemini "day-ahead briefing" / Workspace scheduling assist:** Gemini drafts scheduling suggestions as text; the user still has to act on them. There is no solver, no durable negotiation state, no HITL gate, and no A2A capability.

**vs. Paradox / Olivia (enterprise):** Olivia is a recruiting-specific SaaS product with a hosted UI, priced per seat. Concierge is a composable agent that works in any scheduling context, surfaces the deterministic solver as the auditable decision layer (EU AI Act-compliant out of the box), and is extensible to A2A.

**vs. George's 4 existing agents:**
- *grocery-buddy:* similar Temporal + Telegram HITL structure, but grocery-buddy is a prediction-and-restock loop on a private pantry state. Concierge is an external-negotiation agent operating on calendar time with a constraint solver as its core. No overlap in domain or logic.
- *procurement-agent:* the HMAC-signed mandate and the "deterministic policy as authority" invariant are directly ported. But procurement operates on spend authority and vendor APIs; Concierge operates on time and calendar writes. The reuse is architectural, not functional.
- *dj-agent:* no overlap. DJ is a media-curation agent with audio analysis.
- *jim-agent:* the sourcing-gate invariant (hallucination structurally impossible) is the direct inspiration for the solver-as-authority design. jim gates on citation provenance; Concierge gates on verified temporal availability. The pattern is the same; the domain is entirely different. Jim also operates as an x402 commerce agent; Concierge has no monetization layer.

The portfolio effect: Concierge is the fifth agent in a coherent family, demonstrating the same safety-first invariant applied to a new class of irreversible action (calendar commitment), and adding a new capability the other four lack — multi-turn external negotiation with a durable state machine.

---

## Resume Bullets

- Built a durable scheduling agent (Temporal + Claude Haiku/Sonnet + Calendar/Gmail MCP) that negotiates meeting times inside arbitrary email threads; a pure-Python constraint solver — not the LLM — is the sole authority over confirmed slots, making double-bookings structurally impossible and reducing scheduling volleys from 5 to 1.2 on average.
- Designed and implemented the "solver-as-authority" trust boundary: LLM output is used only for text drafting; all time-slot decisions are independently verified by a deterministic, 40-test-covered constraint engine before any calendar write or email send — satisfying EU AI Act Article 14 HITL and Article 12 audit-trail requirements out of the box.
- Extended the agent with MCP-native A2A negotiation, enabling two scheduling agents to converge on a confirmed meeting slot without human-visible volleys, previewing the agent-to-agent commerce architecture at a practical calendar-coordination scale.

---

## Risks & Open Questions

**Technical risks:**

- **Gmail MCP reliability.** If the Gmail watch trigger misses an email (push notification failure, reconnect delay), a negotiation never starts. Mitigation: periodic poll fallback every 15 minutes, idempotent workflow start (deduplication key on thread ID).
- **Calendar MCP write conflicts.** Creating an event and sending the invite are two separate API calls; a crash between them leaves the event created without a sent reply. Mitigation: Temporal saga with compensating delete-event activity if the send fails.
- **Timezone parsing from freeform text.** "Let's meet Tuesday morning your time" is ambiguous — Haiku must infer or ask. The solver must never guess a timezone; it must either receive a confirmed `IANA` string or return `NeedsTimezone` and prompt the drafter to ask. This edge case needs dedicated eval fixtures.
- **Free/busy polling latency.** If the Calendar MCP free/busy call takes >2 seconds (large calendars, slow OAuth refresh), perceived latency degrades. Mitigation: cache free/busy with a 60-second TTL keyed on calendar ID + date range, invalidated on confirmed write.

**Design open questions:**

- **Multi-calendar support.** If George has work + personal calendars, which free/busy blocks apply to which meeting types? The solver needs a `calendar_policy` mapping (meeting type → applicable calendars). ADR needed.
- **Scope of auto-confirm mandate.** The pre-authorization window is powerful but risky if the mandate's time range is set too broadly. Should the mandate require re-signing after each use, or after a time window? The procurement-agent's TTL design is a starting point, but meeting bookings may warrant narrower scope.
- **Counterpart scheduling agent detection.** How does the agent know it is talking to another scheduling agent vs. a human? A heuristic on email headers (`X-Scheduling-Agent`, structured JSON in the body) is fragile. An MCP capability advertisement endpoint would be cleaner but requires the counterpart to support it.
- **Cancellation and rescheduling flows.** The current build plan covers initial booking. Cancellation requests, reschedule requests, and "I need to move this" threads are second-order complexity that warrant a Phase 6.
- **Pricing / x402 angle.** If Concierge is ever exposed as a service (scheduling on behalf of multiple users), an x402 per-booking charge becomes natural. This is explicitly out of scope for the personal-bucket MVP but worth an ADR note.
