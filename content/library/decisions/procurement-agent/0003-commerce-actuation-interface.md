---
title: >-
  0003. One gated `commerce.purchase()` interface, ACP-first with browser
  fallback
collection: decisions/procurement-agent
source: ~/dev/procurement-agent/docs/adr/0003-commerce-actuation-interface.md
sourceMtime: '2026-06-04T07:00:58.274Z'
syncedAt: '2026-07-09'
summary: >-
  Merchants differ wildly in how an agent can buy from them: some support the
  Agentic Commerce Protocol (ACP) for sanctioned programmatic checkout, most
  don't and require driving a real browser check…
contentHash: 'sha256:099eba72aba40f4d520d3edb54b31301533f1999b3acfff47d3832bbb344ae1b'
---
# 0003. One gated `commerce.purchase()` interface, ACP-first with browser fallback

- **Status:** Accepted
- **Date:** 2026-06-03

## Context

Merchants differ wildly in how an agent can buy from them: some support the Agentic Commerce
Protocol (ACP) for sanctioned programmatic checkout, most don't and require driving a real
browser checkout, and a hostile minority actively resist automation. If the agent's
reasoning had to know which mechanism applied, two bad things happen: the model's logic
couples to checkout plumbing, and — worse — each backend risks growing its own path to money,
multiplying the surface the [money-control guarantees](0001-deterministic-money-authority.md)
have to cover.

We also want to be able to test the whole workflow without touching a real merchant.

## Decision

> All purchases go through a single `commerce.purchase(mandate, candidate)`; backend
> selection (ACP → browser → hostile) is deterministic and hidden, and the policy gate sits
> in front of the one interface.

Preference order, chosen by a deterministic `merchant → capability` lookup:

1. **ACP / Stripe Shared Payment Token** — merchant-sanctioned programmatic checkout
   (Etsy, Shopify first). The right way.
2. **Stagehand** — DOM-aware browser automation for mainstream non-ACP merchants.
3. **Skyvern** — vision/LLM-driven automation for hostile/anti-bot sites. Last resort.

`purchase()` runs **only** against a signed, validated mandate, and settlement always lands
on a controlled card (Privacy.com / Lithic) or bounded token (Shared Payment Token / Visa
agentic token) — so the money-control guarantees hold regardless of backend. The agent never
selects the backend.

**Alternatives rejected:**
- *Let the model choose how to check out* — rejected: couples reasoning to plumbing and
  invites a model-chosen path to money.
- *Per-merchant bespoke integrations with no shared interface* — rejected: every backend
  would need its own gating, and the safety surface fragments.
- *Browser-only (skip ACP)* — rejected: ACP is the sanctioned, more reliable rail and where
  the ecosystem is heading; browser automation is the fallback, not the default.

## Consequences

What we gain:
- One choke point to gate, audit, and test; the agent is backend-agnostic.
- We ride the sanctioned rail (ACP) when available and degrade gracefully when not.
- The money-control invariant ("settlement on a capped credential") is enforced in one place.

What we give up / live with:
- A capability table to maintain per merchant, and the operational weight of browser
  automation backends (Stagehand/Skyvern, possibly Browserbase) for the fallback path.
- Browser automation is inherently more fragile and an SSRF/navigation surface — mitigated by
  domain allow-listing and sandboxing, but it's real work.

## ELI5 / what I learned

The agent has **one button that says "buy this."** Behind the button, the system quietly
picks the best way to actually check out — the official agent-checkout if the store supports
it, otherwise it carefully clicks through the website like a person, and only for nasty
websites does it bring out the heavy robot. The agent doesn't know or care which happened.
The important part: there's exactly one button, the safety check is *in front of* that
button, and no matter which method runs, the money still comes from a card that can't
overspend. One door, one lock.
