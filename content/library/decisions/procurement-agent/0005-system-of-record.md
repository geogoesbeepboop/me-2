---
title: '0005. Postgres (Supabase) as system of record, with an append-only audit log'
collection: decisions/procurement-agent
source: ~/dev/procurement-agent/docs/adr/0005-system-of-record.md
sourceMtime: '2026-06-04T07:01:37.681Z'
syncedAt: '2026-07-09'
summary: >-
  The agent needs durable state with strong integrity guarantees: budgets that
  can only be drawn down by authorized spend, mandates with a status lifecycle,
  purchase history that feeds consumption an…
contentHash: 'sha256:019644858e55d8328f050aea58ddff9123cdcc4988eb34d3988c0488ef71a2cd'
---
# 0005. Postgres (Supabase) as system of record, with an append-only audit log

- **Status:** Accepted
- **Date:** 2026-06-03

## Context

The agent needs durable state with strong integrity guarantees: budgets that can only be
drawn down by authorized spend, mandates with a status lifecycle, purchase history that feeds
consumption and price-band models, and — non-negotiably — an immutable record of *why* every
purchase happened and under what authority. These are highly relational (budgets ↔ mandates ↔
purchases ↔ merchants) and correctness-critical: this is the money's paper trail.

The data is naturally relational with invariants worth enforcing in the schema (a purchase
must reference a mandate; budget only decreases via authorized mandates). We also already have
the **Supabase MCP connected to this workspace**, which lowers the cost of managing migrations
and generating types.

## Decision

> Use Postgres (via Supabase) as the system of record, and model the decision trail as an
> append-only `audit_log` the application role cannot UPDATE or DELETE.

Postgres gives us relational integrity (foreign keys, constraints) for the budget/mandate/
purchase graph. The `audit_log` is **append-only by construction**: the app database role is
granted INSERT/SELECT only, so the history is tamper-evident at the database level, not just
by convention. Mandates are additionally HMAC-signed ([04](../04-policy-and-mandate.md)), so
the authority records themselves resist forgery. Supabase is the chosen Postgres host because
its MCP is already wired here and it bundles auth/type-gen we'll use.

**Alternatives rejected:**
- *A document store (e.g. Mongo)* — rejected: the data is relational with cross-entity
  invariants we want the database to enforce, not the app.
- *Event-sourcing / a dedicated ledger DB* — rejected as over-engineering for now; an
  append-only table in Postgres gives the auditability we need without a second datastore. We
  can graduate to a ledger later if regulatory needs demand it.
- *Plain Postgres (no Supabase)* — viable, and the seam is just a connection string; we pick
  Supabase for the already-connected MCP + auth/type-gen, and can drop the extras if unused.

## Consequences

What we gain:
- Schema-enforced invariants on the money graph; a tamper-evident, append-only audit trail
  that answers "why did it buy that, under what authority?" directly.
- Low operational friction via the connected Supabase MCP (migrations, type generation).

What we give up / live with:
- A dependency on Supabase's hosting/MCP; mitigated by the fact that the underlying store is
  standard Postgres, so migrating off is a connection-string change, not a rewrite.
- Append-only audit means storage grows monotonically and we must plan retention/archival —
  an acceptable cost for an immutable trail.

## ELI5 / what I learned

There's a **filing cabinet** (Postgres) that holds the budgets, the permission slips
(mandates), and the receipts — all cross-referenced so a receipt can't exist without a
matching permission slip, and the budget can only shrink when a real slip is used. And there's
a **logbook written in pen, never pencil**: every decision gets a line, and nobody — not even
our own app — is allowed to erase or edit a line. If someone later asks "why on earth did it
buy that?", we open the logbook and the answer is right there, in ink, next to the rule that
allowed it.
