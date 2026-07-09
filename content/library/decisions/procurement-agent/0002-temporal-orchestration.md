---
title: 0002. Temporal orchestrates; the LLM runs only as discrete activities
collection: decisions/procurement-agent
source: ~/dev/procurement-agent/docs/adr/0002-temporal-orchestration.md
sourceMtime: '2026-06-04T07:00:37.840Z'
syncedAt: '2026-07-09'
summary: >-
  A purchase is a multi-step, long-lived, partly-human process: source → propose
  → validate → maybe wait for a human → activate a card → wait for an auth →
  confirm → audit. It can span seconds or day…
contentHash: 'sha256:a11cad20308921d30c939182932cc72c0da9d3cddc3290324272dd3ca77e40fa'
---
# 0002. Temporal orchestrates; the LLM runs only as discrete activities

- **Status:** Accepted
- **Date:** 2026-06-03

## Context

A purchase is a multi-step, long-lived, partly-human process: source → propose → validate →
maybe wait for a human → activate a card → wait for an auth → confirm → audit. It can span
seconds or days (a HUMAN-class approval), must survive process restarts without
double-charging, and must leave an immutable trail.

There are two tempting but wrong shapes:

1. **An autonomous agent loop** — a `while` loop the model controls, calling tools until it
   decides it's done. This puts the model in charge of control flow, which is exactly what
   [ADR 0001](0001-deterministic-money-authority.md) forbids on the money path, and it has no
   durability: a crash mid-purchase loses or repeats state.
2. **Ad-hoc async code + a queue + a database of "where are we"** — we'd be hand-rolling
   retries, idempotency, timers, and signal handling that a workflow engine already solves.

We need durable, deterministic control flow with first-class support for *waiting* (for a
human, for an auth, for a TTL) — and we need the model to be a *step*, not the *driver*.

## Decision

> Temporal owns control flow; the LLM is invoked only inside bounded activities, never as
> the loop that drives the purchase.

A purchase is a **Temporal workflow**. Each model call (source candidates, route class,
draft mandate) is a discrete **activity** with a bounded input and output. The deterministic
steps (classify, validate, sign, activate, confirm, audit) are also activities. Waiting for a
human is a **signal**; the mandate TTL is a **durable timer**.

This makes the "agentic loop" the workflow graph — readable, durable, and deterministic —
rather than an opaque model-controlled loop. We use the **Anthropic SDK directly inside
activities** (optionally the Claude Agent SDK for tool-loop ergonomics *within* a single
activity), but the durable sequencing always lives in Temporal.

**Alternatives rejected:**
- *Model-driven autonomous loop* — rejected: no durability, and it hands control flow to the
  untrusted plane.
- *Hand-rolled orchestration* — rejected: we'd reimplement retries/idempotency/timers/signals
  worse than Temporal does, on the one path where correctness is money.
- *A generic task queue (e.g. Celery)* — rejected: no native long-running workflow state,
  signals, or durable timers; the human-approval wait becomes painful.

## Consequences

What we gain:
- Crash-safety and exactly-once effects: a restart between "activate card" and "purchase"
  resumes deterministically; `mandate_id` idempotency prevents double-orders.
- Human-in-the-loop is a first-class `signal` + durable timer, not a bespoke state machine.
- Control flow is inspectable and testable; the model is confined to bounded activity calls,
  reinforcing "model off the hot path."

What we give up / live with:
- An operational dependency (Temporal: `start-dev` locally, Cloud later) and the discipline
  of writing workflow-safe (deterministic) code — no wall-clock or randomness in workflows.
- LLM calls must be shaped as activities with clear inputs/outputs, which is slightly more
  ceremony than calling the model inline.

## ELI5 / what I learned

Think of Temporal as the **recipe and the timer**, and the AI as **one cook who does one
step when told**. The recipe says: chop, then wait for the oven, then plate. If the kitchen
loses power, the recipe remembers exactly which step we were on and never re-bakes the same
dish. The AI isn't allowed to run the kitchen — it just does the step it's handed and reports
back. That keeps the dangerous part (who's *in charge*) in boring, reliable, restart-proof
code, and keeps the AI as a helper, not the boss.
