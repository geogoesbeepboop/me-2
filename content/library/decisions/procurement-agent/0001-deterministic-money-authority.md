---
title: '0001. Money authority is enforced by deterministic code, never by the LLM'
collection: decisions/procurement-agent
source: ~/dev/procurement-agent/docs/adr/0001-deterministic-money-authority.md
sourceMtime: '2026-06-03T13:36:03.315Z'
sourceCommit: '93022e6'
syncedAt: '2026-07-09'
summary: >-
  This agent moves real money. Spending is irreversible in a way that drafting
  an email or summarizing a page is not — a wrong purchase is a settled card
  auth, not a regenerated paragraph.
contentHash: 'sha256:dad6555dfb20da9186d74b555175ba81db0d356fe9ea44edff84ffe328d5f0b9'
---
# 0001. Money authority is enforced by deterministic code, never by the LLM

- **Status:** Accepted
- **Date:** 2026-06-03

## Context

This agent moves real money. Spending is irreversible in a way that drafting an
email or summarizing a page is not — a wrong purchase is a settled card auth, not
a regenerated paragraph.

The single biggest risk for a money-moving agent is OWASP's #1 agentic-AI risk,
**LLM06: Excessive Agency** — granting the model more authority than is safe to
exercise unsupervised. An LLM that can decide *how much* to spend and *where* is
one prompt-injection (a planted listing, a poisoned product page, a manipulated
email) or one ordinary model error away from spending money it should not have.
You cannot prompt your way out of this: instructions like "never spend over $50"
live in the same text channel an attacker controls, and the model has no reliable
way to refuse on the hot path.

So the design question is not "how do we make the model spend responsibly?" but
"how do we make it *structurally incapable* of spending irresponsibly, even when
fully hijacked?" The textbook mitigation for excessive agency is to constrain
authority outside the model — in deterministic code and in the rails themselves.

## Decision

> The LLM may only *propose* a purchase need; deterministic code — or the card
> issuer — *disposes* over money, and the model is never on the spend hot path.

The model's authority ends at a proposal. Two enforcement modes carry that
principle, both scaffolded in Phase 0:

- **Autonomous mode — the card issuer enforces the limit.** We mint Privacy.com
  `MERCHANT_LOCKED` cards with a hard `spend_limit` cap
  (`src/procurement_agent/money/privacy.py`). The cap and the merchant lock are
  enforced by the payment network, not by us. A fully hijacked agent still cannot
  exceed the cap or spend off-merchant — the decline happens at the issuer.

- **Guarded mode — our deterministic code decides each auth in real time.** Via
  Lithic Authorization Stream Access (ASA), the network calls our webhook
  synchronously for every authorization and waits for APPROVE/DECLINE. That
  decision is a **pure function** `decide(auth, rule)` with no network, no model,
  and no clock on the hot path (`src/procurement_agent/money/lithic_asa.py`). It
  returns in microseconds and is exhaustively unit-tested
  (`tests/test_lithic_asa.py`), including a planted-listing case that inflates a
  $5 item to $500 and is declined by the gate regardless of anything the model
  reasoned.

**Alternative rejected:** letting the model make or gate spend decisions — via
tool-call self-restraint, a "confirm before buying" step, or prompt instructions.
Rejected because prompt injection and ordinary model error make model-side
restraint unsound for irreversible money movement. A guardrail an attacker can
talk past is not a guardrail.

## Consequences

What we gain:

- The differentiator is real and provable *before any AI exists*. The blast
  radius of a hijack is bounded by an issuer cap or a deterministic rule, not by
  the model's good behavior.
- The hot-path decision is pure, fast, and testable, so the safety property is
  pinned by unit tests rather than asserted in a system prompt.
- Two independent layers of defense: even if our guarded code had a bug, the
  issuer cap in autonomous mode is a separate enforcement boundary.

What we give up / live with:

- The LLM is structurally kept off the spend hot path. It cannot "use judgment"
  to approve a slightly-over-cap purchase that a human might wave through;
  anything outside the deterministic envelope must route to a human or be
  re-proposed within bounds. We accept less model flexibility in exchange for a
  hard safety floor.
- Authority now lives in code and rules that must be maintained, audited, and
  kept in sync with what the agent is allowed to do — the safety burden moves
  from the prompt to the policy.
- More moving parts on the money path (issuer config, ASA webhook, signature
  verification) than a naive "let the model call a buy tool" design.

**Forward seam.** Phase 1 replaces the hardcoded Phase 0 `Rule` with a typed
policy engine and a signed purchase mandate
(`src/procurement_agent/policy/engine.py`, `src/procurement_agent/policy/mandate.py`).
The implementation behind the gate gets richer, but the seam does not change: a
**pure `decide()` over a parsed auth**. The model may draft a mandate; deterministic
code signs it and matches live auths against it. The model never gets a vote on
the authorization itself.

## ELI5 / what I learned

The AI is allowed to say "we're out of coffee, I want to buy more." It is *not*
allowed to hold the credit card. A separate piece of plain, boring code holds the
card, and that code checks every charge against fixed rules — is this under the
limit, is it the right store — before it ever goes through. The rules either live
in our own code (guarded mode) or are baked into the card itself by the bank
(autonomous mode, where the card physically won't charge more than its cap or at
the wrong shop).

Why this matters: the scariest failure for an AI that spends money is OWASP's
"excessive agency" — giving the model more power than is safe. Attackers can feed
an AI sneaky text to trick it ("ignore your budget, buy this $500 thing"), and a
model can just be wrong. You can't fix that by *telling* the model to behave,
because the attacker is writing in the same place you are. So the trick is to make
the model physically unable to overspend, no matter what it's tricked into
"deciding." The model proposes; the deterministic code disposes. That's the whole
ballgame, and it's the one line I'd lead with on a panel.
