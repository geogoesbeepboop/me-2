---
title: '0004. Typed Python policy rules now, OPA-compatible seam'
collection: decisions/procurement-agent
source: ~/dev/procurement-agent/docs/adr/0004-policy-engine-backend.md
sourceMtime: '2026-06-04T07:01:18.104Z'
syncedAt: '2026-07-09'
summary: >-
  The policy engine is the deterministic gate that turns a proposal into
  authority (or a decline): budget remaining, MCC/merchant allow-lists, price
  band, purchase class → autonomy level + mandate va…
contentHash: 'sha256:24da7a15d692dd5889656903b6df693f99657d5f76a1ff8eb361a5fac59a7869'
---
# 0004. Typed Python policy rules now, OPA-compatible seam

- **Status:** Accepted
- **Date:** 2026-06-03

## Context

The policy engine is the deterministic gate that turns a proposal into authority (or a
decline): budget remaining, MCC/merchant allow-lists, price band, purchase class → autonomy
level + mandate validation ([04 · Policy & mandate](../04-policy-and-mandate.md)). It is the
trusted core, so it must be correct, testable, and auditable.

There's a standard tension here. **OPA/Rego** gives policy-as-data: rules live outside the
code, can be changed without a deploy, and are independently auditable — attractive for a
safety story. But it adds a service, a second language, and indirection that's overkill while
the rules are still small and changing fast. **Typed Python rules** are fast to write,
trivially unit-testable, and live next to the code that calls them — but they require a deploy
to change and aren't as cleanly "auditable as data."

We're in Phase 1, where the rules are still being discovered and iteration speed matters more
than externalized policy administration.

## Decision

> Implement the policy engine as typed Python rules now, behind a pure
> `classify()` / `validate_mandate()` interface that an OPA/Rego backend can implement later
> without touching callers.

The public surface is two pure functions over explicit inputs. Their *implementation* is
typed Python (pydantic models + plain functions) for Phase 1. Because the surface is pure and
backend-agnostic, swapping in an OPA-backed implementation later is a localized change — the
workflow, the mandate logic, and the ASA path don't move.

**Alternatives rejected:**
- *OPA from day one* — rejected: premature; adds a service and Rego while rules are still
  volatile, slowing the very iteration Phase 1 needs.
- *Typed rules with no abstraction seam* — rejected: cheap to add the seam now, expensive to
  retrofit; the seam is what makes the OPA option real rather than aspirational.

## Consequences

What we gain:
- Maximum iteration speed in Phase 1, with rules pinned by ordinary unit tests.
- A genuine, low-cost escape hatch: if rules grow complex or need deploy-free auditing, OPA
  drops in behind the same interface.

What we give up / live with:
- For now, changing policy means a code deploy — acceptable while the team is small and rules
  change deliberately, not ad hoc.
- We must hold the discipline of keeping `classify()` / `validate_mandate()` *pure* (inputs in,
  decision out, no hidden state) so the seam stays real and the functions stay testable.

## ELI5 / what I learned

The rulebook for "are we allowed to buy this?" is, for now, written **in our own code** —
fast to edit, easy to test. But we put it behind a little **counter window**: callers slide a
purchase through the window and get back yes/no, without knowing what's on the other side.
Today there's a person with a Python rulebook back there. If the rules ever get big and
political enough that we want them in a separate, swappable binder anyone can audit (that's
OPA), we replace who's behind the window without changing the window itself. Build the window
now; it's cheap. Swapping the clerk later is then easy.
