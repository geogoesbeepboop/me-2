---
title: Catch
collection: dossiers/personal
source: ~/dev/docs/personal/catch-opportunity-radar.md
sourceMtime: '2026-06-05T07:25:47.444Z'
syncedAt: '2026-07-09'
summary: >-
  A 24/7 opportunity radar that watches job boards, funding announcements, and
  your network's job changes, then pings you only when a role clears a
  deterministic fit-and-freshness gate — with a tailo…
contentHash: 'sha256:51b68a06f6a85aaa0f1190be5815060a3671054ac5e43460131750036af6beae'
---
# Catch
> A 24/7 opportunity radar that watches job boards, funding announcements, and your network's job changes, then pings you only when a role clears a deterministic fit-and-freshness gate — with a tailored, fully-cited application draft already staged behind a Telegram approval.

**Bucket:** personal · **Effort:** M · **Reuses:** agent-core harness, jim's monitor-diff-materiality-gate + cooldown + $0-quiet-poll economics, jim's sourcing-gate repurposed as a fit-evidence gate, grocery-buddy's Playwright-stages-never-submits + Telegram approval pattern, Temporal durable schedules + cursors, Supabase pgvector, multi-model tiering, MCP server exposure

---

## TL;DR

Catch is a standing agent that continuously polls job boards, company career pages, LinkedIn signals, and funding announcements, and stays completely silent unless a new opportunity clears a two-layer deterministic gate: the role must score above a configurable fit floor AND every point of that fit score must be traceable to a specific JD span and a specific resume fact — no citation, no score point. When a role clears, one Telegram message arrives with a cited breakdown and a staged cover letter awaiting a single tap before anything is submitted. The wow is structural silence: 200 polls, three cents, zero Telegram pings — then one high-confidence message that is right.

---

## The Problem

Good senior roles and warm-intro windows close in under 48 hours. Passive job seekers — engineers who will only move for a genuinely better seat — check eight boards manually or set up keyword alerts that fire 40 times a week on "AI Engineer," train themselves to ignore everything, and eventually miss the one that fit. The failure mode is not laziness; it is that the signal-to-noise ratio of every existing alert system is so low that rational actors turn them off.

The same problem is inverted for founders and recruiters who want to know the moment a specific target hire goes "open to work" or when a target company starts scaling a function. There is no standing, reasoned, evidence-gated monitor for either side.

Current tools fall short in a predictable way: LinkedIn and Indeed alerts are keyword triggers with zero fit reasoning. AI resume builders (Teal, Rezi, Kickresume) are one-shot tools, not continuous monitors. Neither category has a gate that asks "does this role actually match this person's hard criteria, and can you prove it?" In mid-2026, with the EU AI Act's Article 14 human-oversight mandate live and Fortune 500 AI-governance teams now asking "how do you prevent your agent from acting on fabricated evidence," the absence of a verifiable, deterministic fit gate is not just a UX problem — it is the core trust problem.

---

## What It Does

**Concrete capabilities:**

- Polls a configurable list of sources on a Temporal schedule: company career pages via Playwright (no-API boards — Lever, Greenhouse, Ashby, Workday), LinkedIn job postings, RSS/API feeds where available, Crunchbase/PitchBook funding announcements, and LinkedIn network activity (target people going open-to-work or changing roles).
- Runs `diff_postings()` — pure Python, no LLM — comparing each poll against a stored baseline in Supabase. New, changed, and removed listings are classified deterministically.
- Emits typed Signals: `new_role`, `comp_band_cross`, `hiring_manager_is_warm_intro`, `company_just_raised`. Each Signal is an immutable record with a source URL, a timestamp, and a raw snapshot hash.
- Scores each new role through the FIT GATE: a deterministic pipeline that extracts requirements from the JD (entity extraction + BM25), matches them against resume facts stored as pgvector embeddings (cosine + BM25 + entity-match hybrid), and assigns a score only to requirement-fact pairs where both a JD span and a resume span are on file. Unmatched requirements count against the score; unmatched claims are voided, not fabricated.
- Applies a materiality gate: minimum fit score (default 80/100), per-company cooldown (default 7 days), and a severity floor for network signals. Most polls are quiet and cost $0 in inference.
- On a material hit: Sonnet drafts a tailored cover letter referencing only verified resume facts; Telegram delivers a single message with the fit breakdown, cited evidence links, and inline approve/snooze/reject buttons. Playwright can autofill the application form but waits for a tap before submitting anything.

**Walked-through example interaction:**

1. Catch polls Anthropic's careers page at 02:14 — no change, no inference, log entry written, cost: $0.
2. At 09:47, a new "Forward-Deployed AI Engineer" listing appears. `diff_postings()` flags it. The fit gate runs: 6 of your 6 hard criteria (Temporal, Claude API, Python, x402, agent observability, ≥$250k comp band) are matched to JD spans and resume spans. Score: 94/100.
3. Materiality gate passes (score > 80, no Anthropic cooldown active).
4. Sonnet drafts a 3-paragraph cover letter citing "your Temporal-based procurement orchestration" linked to the JD line "experience with durable workflow engines required." No resume fact is invented.
5. Telegram delivers: "Anthropic · Forward-Deployed AI Eng · posted 3h ago · 94/100 fit (6/6 hard criteria met, see breakdown) · cover letter staged." Three inline buttons: Approve, Snooze 24h, Dismiss.
6. You tap Approve. Playwright opens the application form, autofills from a stored profile, attaches resume, pastes the cover letter. It stops at the Submit button and sends a second Telegram: "Ready to submit — confirm." You confirm. Submitted.

---

## Who It's For / Enterprise Translation

**Personas:**

- **Passive senior job-seeker** — employed, will only move for a 30%+ comp bump + mission upgrade, cannot afford to monitor 8 boards daily. Wants one message a week that is always right.
- **Founder / talent-spotter** — watching a list of 20 target engineers for open-to-work signals, tracking competitor engineering headcount changes, wants a first-mover notification without a recruiter headcount.
- **Investor / BD** — watching a portfolio company's key hires or watching when a target acquisition company starts losing senior staff.

**Enterprise translation:**

Catch is the candidate-side inversion of the Sales/RevOps "always-on account monitoring + intent signals" pattern that Outreach, Clay, and 11x are built on. The identical diff-materiality-gate engine becomes:

- **Inbound talent radar**: enterprise HR watches when target candidates go open-to-work; the fit gate scores against a role profile instead of a resume. Value metric: time-to-first-contact, false-positive alert rate.
- **Competitive-intel radar**: watches competitor pricing pages, exec departures, funding rounds, job-posting velocity as a hiring-intent signal. Value metric: opportunities surfaced per analyst-hour vs. a manual research team.
- **Startup framing**: a B2B SaaS sold to recruiting teams at Series A–C companies that cannot afford a Beamery/Eightfold enterprise contract but need standing, reasoned candidate-market surveillance.
- **F500 framing**: a module inside an enterprise talent-intelligence platform (Workday, Greenhouse, Beamery) that replaces keyword-alert pipelines with evidence-gated fit scoring, directly satisfying EU AI Act Article 14 (human oversight) and Article 12 (traceable event logging) requirements for any HR system classified as high-risk AI.

---

## Architecture

Catch is a Temporal-orchestrated, multi-agent system with a hard deterministic gate between data collection and human notification. The LLM is never in the critical path for polling, diffing, or fit scoring — it is only invoked when the gate passes and a draft is needed.

**Agent topology:**

- **Poller Workers** (one per source family): Playwright-based for career pages; HTTP/RSS for API-backed sources; LinkedIn scraper for network signals. Each runs as a Temporal Activity with a durable cursor stored in Supabase so a restart never re-alerts on already-seen postings.
- **Diff Engine** (`diff_postings()`): pure Python function, no LLM. Compares current poll snapshot against `postings_baseline` table. Emits `PostingDelta` records (new/changed/removed).
- **Signal Crew**: a set of pure-function triggers that map `PostingDelta` events to typed `Signal` objects. No LLM, no ambiguity — rule-based (e.g., "company raised a round in last 30 days AND posted 3+ engineering roles" → `company_just_raised_and_hiring` signal).
- **Fit Gate** (deterministic): extracts requirements from JD text (spaCy NER + BM25), retrieves resume fact candidates from pgvector (cosine hybrid), runs entity-match scoring. Returns a `FitScore` with per-criterion evidence pairs (`jd_span`, `resume_span`) or a `VOIDED` marker. No evidence pair = no score point. This gate runs entirely in Python; no LLM call.
- **Materiality Gate**: checks fit score floor, per-company cooldown, and signal severity. If it does not pass, the run costs $0 in inference and logs a quiet entry.
- **Draft Crew** (LLM, Sonnet): invoked only on gate pass. Drafts a cover letter constrained to a system prompt that lists verified resume facts only. The prompt is generated by the Fit Gate output, not by the LLM itself.
- **Notification & Approval**: Telegram bot sends a single message with the fit breakdown, evidence links, and inline buttons. Approval signal is received by a Temporal `waitForSignal` Activity.
- **Actuation** (Playwright): autofills application form, pauses at Submit. Second Telegram confirmation required. Never submits autonomously.
- **MCP Server**: exposes `watch_role(url)`, `list_signals()`, `get_fit_score(role_id)`, `snooze_company(name, days)` for integration with other agents or a Claude Desktop session.

```mermaid
flowchart TD
    subgraph Sources
        A1[Company Career Pages\nPlaywright poller]
        A2[Lever / Greenhouse / Ashby\nAPI poller]
        A3[RSS / Job APIs]
        A4[LinkedIn Network\nopen-to-work signals]
        A5[Crunchbase / PitchBook\nfunding signals]
    end

    subgraph Temporal["Temporal Workflow (durable cursors)"]
        B[diff_postings()\npure Python · no LLM]
        C[Signal Crew\npure-function triggers]
    end

    subgraph Gate["Deterministic Gates"]
        D[FIT GATE\nspaCy NER + BM25 + pgvector\ncosine hybrid\nevery score point needs\njd_span + resume_span]
        E[MATERIALITY GATE\nscore floor · cooldown · severity\n$0 if silent]
    end

    subgraph Store["Supabase / pgvector"]
        F[(postings_baseline)]
        G[(resume_facts\n+ embeddings)]
        H[(fit_scores\n+ evidence pairs)]
        I[(signal_log\nappend-only)]
    end

    subgraph LLM["LLM Tier — only on gate pass"]
        J[Haiku\nrouting · dedup]
        K[Sonnet\ncover letter draft\nconstrained to verified facts]
        L[Opus\nescalation only\nambiguous senior-role judgment]
    end

    subgraph HITL["Human-in-the-Loop"]
        M[Telegram message\ncited fit breakdown\n+ staged cover letter\ninline approve / snooze / dismiss]
        N[Temporal waitForSignal]
    end

    subgraph Actuation
        O[Playwright\nautofill form\nstop at Submit]
        P[Telegram confirm\n'Ready to submit']
    end

    A1 & A2 & A3 & A4 & A5 --> B
    B --> F
    B --> C
    C --> I
    C --> D
    G --> D
    D --> H
    D --> E
    E -- silent --> I
    E -- material hit --> J
    J --> K
    K --> M
    M --> N
    N -- approved --> O
    O --> P
    P -- confirmed --> O

    style Gate fill:#1a1a2e,color:#e0e0e0
    style HITL fill:#16213e,color:#e0e0e0
    style LLM fill:#0f3460,color:#e0e0e0
```

**Tech-stack table:**

| Layer | Choice | Rationale |
|---|---|---|
| Orchestration | Temporal | Durable cursors, restart safety, `waitForSignal` for HITL |
| Fixed pipelines | LangGraph | Fit Gate scoring pipeline (fixed topology) |
| Polling / actuation | Playwright | No-API career pages, application autofill |
| Vector store | Supabase pgvector | Resume + role embeddings, postings baseline, signal log |
| LLM routing | Haiku / Sonnet / Opus | Tiered by task complexity; Opus only on escalation |
| Observability | Langfuse | Per-run traces, fit score audit, token budget tracking |
| HITL | Telegram Bot API | Inline buttons, `waitForSignal` bridge |
| Agent harness | agent-core | Tracing, budgeting, evals — shared with existing agents |
| MCP server | FastMCP | `watch_role`, `list_signals`, `get_fit_score`, `snooze_company` |
| NLP (gate) | spaCy + BM25 (rank-bm25) | Deterministic, no inference cost in the gate itself |

---

## The "Model Proposes, Code Disposes" Boundary

This is the signature design decision and the direct analog to jim-agent's sourcing gate.

**What the LLM is allowed to propose:**
- The cover letter draft (Sonnet), constrained to a system prompt built entirely from `FitScore.evidence_pairs` — a list of `(jd_span, resume_span)` tuples produced by the deterministic gate. The LLM cannot introduce a fact that is not in that list.
- The phrasing of the Telegram notification summary (Haiku).
- Escalation judgment on ambiguous senior-role signals (Opus, rare).

**What deterministic code verifies and controls:**

| Action | Who controls it | Mechanism |
|---|---|---|
| Deciding whether a posting is new/changed | Pure Python `diff_postings()` | SHA-256 hash comparison against stored baseline |
| Scoring fit | Pure Python + spaCy + pgvector | Score point only exists if `jd_span` and `resume_span` both present |
| Voiding unverified claims | Fit Gate | Any score point without dual citation is set to 0, not estimated |
| Deciding whether to notify | Materiality Gate | Threshold + cooldown check in Python; no LLM involvement |
| Submitting an application | Playwright + Telegram confirm | Two-tap HITL; code never calls `.submit()` without `approved == True` |
| Logging | Supabase append-only `signal_log` | Every poll result written regardless of materiality (EU AI Act Article 12 compliance) |

**The consequence:** hallucinated fit is structurally impossible. If Sonnet were to hallucinate that your resume mentions "CUDA kernel optimization" and the JD requires it, that claim was never in `evidence_pairs` — it was never scored — and it cannot appear in the cover letter because the cover letter system prompt is generated from `evidence_pairs`, not from a free-form prompt. The gate does not just check the LLM's output; it constrains the LLM's input.

---

## Why It's Impressive (Resume + Demo Signal)

**Seniority signals:**

1. **Deterministic trust boundary as a first-class design artifact.** Most engineers bolt safety on as a filter after the LLM responds. Catch's gate constrains the LLM's input, making the unsafe state unreachable. This is the difference between a guardrail and an architecture decision.

2. **Zero-cost quiet-poll economics.** The system makes 200 network calls per day and spends $0.03 in inference on a typical day. Interviewers at infrastructure or platform companies recognize this as real production thinking, not a demo that burns GPT-4 on every heartbeat.

3. **EU AI Act Article 12/14 readiness by default.** The append-only `signal_log` with source hashes is a traceable event log. The two-tap HITL gate is a human oversight mechanism. In mid-2026, enterprise buyers are asking for these properties explicitly. Catch demonstrates them without retrofitting.

4. **Portfolio coherence.** Catch extends george's house style (diff → gate → HITL → actuation) to a new domain (opportunity monitoring), demonstrating the pattern is a transferable methodology, not a one-off hack. It reuses agent-core, Temporal, pgvector, Playwright, and Telegram — the same stack, a new problem.

**The specific aha:** paste a JD stuffed with your keywords but for a role you do not fit (wrong level, wrong domain). Catch's fit gate produces zero valid evidence pairs. Score: 12/100. Gate is silent. "It won't lie to flatter you" — said out loud in a demo, this lands harder than any capability claim.

---

## 3-Minute Demo Script

**Setup (30 s):** Open a terminal showing the Catch poller log. Langfuse dashboard visible in a browser tab. Telegram on your phone. Resume loaded in Supabase (visible as a pgvector table with 47 rows of fact embeddings).

**Beat 1 — The silence (30 s):** Scroll the poller log. "200 polls since midnight. Three cents. Zero Telegram pings. The system has been running all night." Open Langfuse: every trace shows "materiality_gate: SILENT." This is the first wow — an agent that does nothing most of the time, correctly.

**Beat 2 — The hit (45 s):** Live or pre-staged: a matching role (e.g., "Forward-Deployed AI Engineer" at a named company) appears on a career page. The poller fires. Watch the Langfuse trace in real time: `diff_postings` → `FIT GATE` → `evidence_pairs: 6 pairs found` → `fit_score: 94` → `MATERIALITY: PASS` → Sonnet invoked → Telegram sent. Phone lights up. Read the message aloud: role name, fit score, 3 cited criteria, cover letter staged. This is the second wow.

**Beat 3 — The kill shot (45 s):** Paste a JD for a COBOL mainframe position, heavily keyword-stuffed with "Python," "AI," "engineering." Run it through the fit gate live or show a pre-run trace. `evidence_pairs: 0 pairs found` — score: 8/100. Materiality gate: SILENT. "The model couldn't fabricate fit evidence, because the gate only counts pairs it can prove. It didn't ping you." Third wow — the trustworthy negative.

**Beat 4 — The failure-handling flex (20 s):** Show a Temporal workflow history with a poller Activity that failed (career page was down). Temporal retried with backoff; the durable cursor means no duplicate alerts when it recovered. "If this had been a cron job, it would have either spammed or missed the posting."

**Beat 5 — The metric (10 s):** Langfuse dashboard: 14-day summary. Alerts sent: 3. Fit gate pass rate: 1.4%. Cover letters staged: 3. Roles applied: 2. "Three messages in two weeks, two applications, both worth sending."

---

## Build Plan (Phased)

### Phase 0 — Scaffold (2–3 days)
- Fork agent-core harness; initialize `catch` repo with the same structure as `jim-agent` (ARCHITECTURE.md, BUILD_PLAN.md, ADR-001).
- Set up Supabase project: `postings_baseline`, `resume_facts`, `fit_scores`, `signal_log` tables; pgvector extension enabled.
- Load resume into `resume_facts`: chunked by bullet/sentence, embedded with `text-embedding-3-small`, stored with metadata (`section`, `raw_text`, `skills_entities`).
- Temporal local dev environment running.

**Exit check:** `pytest tests/test_schema.py` passes; resume is queryable by cosine similarity.

### Phase 1 — Poller + Diff Engine (3–4 days)
- Implement one Playwright poller (Lever API, simplest) as a Temporal Activity with durable cursor stored in Supabase.
- Implement `diff_postings()`: SHA-256 hash comparison, returns `PostingDelta` typed dataclass.
- Write `tests/test_diff.py`: 12 cases covering new/changed/removed/unchanged across restart scenarios.
- Add append-only `signal_log` write on every poll result (silent or not).

**Exit check:** poller runs for 24 hours on a live Lever board; zero duplicate deltas; log shows every poll; Langfuse traces visible.

### Phase 2 — Fit Gate (4–5 days)
- Implement JD requirement extractor: spaCy NER for skills/titles/years-of-experience + BM25 keyword extraction.
- Implement `score_fit(jd_requirements, resume_facts_embeddings)`: hybrid cosine + BM25 + entity-match; returns `FitScore` with `evidence_pairs` and `voided_requirements`.
- Write `tests/test_fit_gate.py`: 20 cases including the "keyword-stuffed garbage JD" case that must return score < 20 with zero valid pairs.
- Integrate with Temporal workflow: fit gate runs as an Activity after every new `PostingDelta`.

**Exit check:** garbage-JD test passes deterministically; a role matching 5/6 resume criteria scores 80–90; a role matching 0/6 scores < 20 with no LLM calls made.

### Phase 3 — Materiality Gate + Notification (2–3 days)
- Implement materiality gate: configurable `fit_floor` (default 80), per-company cooldown (default 7 days), severity floor for network signals.
- Integrate Telegram bot: on gate pass, send formatted message with fit breakdown, cited `evidence_pairs`, inline buttons (Approve / Snooze 24h / Dismiss).
- Implement Temporal `waitForSignal` receiving Telegram callback.
- Write `tests/test_materiality.py`: cooldown respected, floor enforced, duplicate suppression across restarts.

**Exit check:** demo scenario from §3-Minute Demo Script runs end-to-end; phone receives one message; snooze correctly resets.

### Phase 4 — Cover Letter Draft + Playwright Actuation (3–4 days)
- Implement Sonnet cover letter prompt: system prompt built from `evidence_pairs` only; no free-form resume context injected.
- Playwright automation: open application URL, autofill fields from stored profile JSON, attach resume, paste cover letter, stop at Submit.
- Second Telegram confirm before final submit.
- Write integration test: cover letter output checked to contain only facts from `evidence_pairs`; no hallucinated facts.

**Exit check:** full flow from new posting → Telegram approve → Playwright autofill → second confirm → submit runs without error; cover letter passes fact-check against `evidence_pairs`.

### Phase 5 — Additional Sources + MCP Server (2–3 days)
- Add Greenhouse and Ashby pollers (API-backed, simpler than Playwright).
- Add LinkedIn network signal poller (target list: open-to-work detection).
- Add Crunchbase funding signal trigger.
- Implement FastMCP server: `watch_role`, `list_signals`, `get_fit_score`, `snooze_company`.
- Wire Haiku for dedup and routing across multiple simultaneous signals.

**Exit check:** MCP server usable from a Claude Desktop session; three sources polled in parallel without cursor collision; Haiku dedup test passes.

### Phase 6 — Hardening + Eval Suite (2 days)
- Offline eval: 50 (JD, resume, expected_score) triples with labeled evidence pairs; gate must score within ±5 and match ≥90% of expected pairs.
- Langfuse dashboard: per-run token cost, fit gate pass rate, false-positive rate (alerts sent that were snoozed/dismissed within 1h).
- ADR-002: fit gate tuning decisions (BM25 weight, entity-match bonus, cosine floor).
- README / SYSTEM_MAP / ROADMAP.

**Exit check:** eval suite passes on CI; 14-day live run shows ≤5% Telegram dismiss rate (proxy for false positives).

---

## Differentiation

**Vs. off-the-shelf tools:**

| Tool | What it does | What Catch adds |
|---|---|---|
| LinkedIn job alerts | Keyword trigger, email digest | Fit reasoning, evidence gate, zero-noise |
| Indeed alerts | Keyword trigger | Same |
| Teal / Rezi | One-shot resume + cover letter | Standing monitor, not a session tool |
| Clay / 11x (sales side) | Account monitoring + intent signals | Catch is the candidate-side inversion; same pattern, different domain |
| Mercor | Autonomous sourcing (platform) | Catch is a personal agent, not a marketplace |

**Vs. George's existing 4 agents:**

| Agent | Domain | Core novel pattern |
|---|---|---|
| grocery-buddy | Commerce / restock | Depletion prediction → cart staging |
| procurement-agent | B2B spend authority | HMAC-signed mandates, real-time card auth |
| dj-agent | Music / taste | Acoustic + semantic embeddings, verifier loop |
| jim-agent | Financial research sales | Sourcing gate (cited figures), x402 buy + sell |
| **Catch** | **Opportunity monitoring** | **Fit-evidence gate (cited criteria), standing radar** |

Catch is the only agent in the portfolio that monitors an external opportunity stream and performs evidence-gated reasoning about personal fit. It reuses jim's provability principle (every claim must be traceable) applied to a fundamentally different domain (career/network signals vs. financial data). The novel core is the combination of: (a) standing monitor with zero-cost quiet polls, (b) fit evidence gate that makes hallucinated fit structurally impossible, and (c) the staged-application HITL pattern applied to the highest-stakes personal action (job applications) rather than a grocery order.

---

## Resume Bullets

- Built Catch, a 24/7 opportunity-radar agent (Temporal + Playwright + pgvector) with a deterministic fit-evidence gate that scores job-fit only when every criterion can be traced to a JD span and a resume fact — making hallucinated fit structurally impossible and reducing Telegram alert volume by 98% vs. keyword-based alerts.
- Designed and implemented a zero-cost quiet-poll architecture (200 daily polls, <$0.05/day inference) with durable Temporal cursors ensuring no duplicate alerts across worker restarts; extended a reusable agent-core harness shared across a 5-agent portfolio spanning commerce, procurement, financial research, and opportunity monitoring.
- Delivered EU AI Act Article 12/14-ready observability by default: append-only SHA-256-hashed signal log on every poll, two-tap HITL Telegram gate before any application submission, and full Langfuse traces linking each fit-score point to its source evidence pair.

---

## Risks & Open Questions

**Technical risks:**

- **LinkedIn scraping fragility.** LinkedIn actively blocks scrapers; Playwright-based network signal polling may require frequent selector updates or a paid LinkedIn API tier. Mitigation: treat LinkedIn signals as best-effort; system degrades gracefully to career-page + RSS sources only.
- **JD requirement extraction quality.** spaCy NER misses implicit requirements ("you'll be leading a team" → management experience required). BM25 alone does not capture semantic equivalence. Mitigation: hybrid scoring with a low entity-match bonus caps the damage; ADR-002 should document tuning choices with eval numbers.
- **Cover letter fact leakage.** If the system prompt is constructed incorrectly, Sonnet could draw on training-time knowledge of the user's background rather than only `evidence_pairs`. Mitigation: explicit system prompt instruction plus a post-generation fact-check that diffs letter content against `evidence_pairs` list.
- **Playwright anti-bot detection on application forms.** Workday and Taleo have aggressive bot detection. Mitigation: human-visible slowdown mode, fallback to "open form in browser" rather than autofill.

**Product / design open questions:**

- What is the right fit score floor? 80/100 is a starting guess. Needs a calibration run over 2–3 weeks of real data before it is trustworthy.
- Should the agent monitor compensation data (Levels.fyi, Glassdoor) to validate the comp-band criteria? Adds a scraping dependency but increases the signal quality of `comp_band_cross` signals significantly.
- Multi-user / shared model: the resume facts and fit criteria are deeply personal. Is there a clean abstraction that lets two people (e.g., a couple both job-searching) share one Catch instance with separate profiles, or is single-user the right scope for v1?
- Application autofill creates a stored profile JSON with PII (name, address, work history). This needs explicit encryption-at-rest in Supabase and a clear data-retention policy before the agent is used in production.
- The EU AI Act high-risk classification question: if Catch were productized as a B2B tool for HR teams, the fit-scoring pipeline would likely qualify as a high-risk AI system under Annex III (employment decisions), requiring conformity assessment before August 2, 2026. The personal-use version is out of scope, but the enterprise translation in §4 should carry this disclaimer.
