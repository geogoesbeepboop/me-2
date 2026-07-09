---
title: >-
  0006. The mandate evolves toward a network-verifiable credential; HMAC is its
  Phase-0 form
collection: decisions/procurement-agent
source: ~/dev/procurement-agent/docs/adr/0006-network-verifiable-mandate.md
sourceMtime: '2026-06-04T21:14:03.483Z'
syncedAt: '2026-07-09'
summary: >-
  Today a PurchaseMandate is authenticated with an HMAC over its canonical
  serialization using one server-held secret (policy/mandate.py, MandateSigner).
  This is exactly right for the property it was…
contentHash: 'sha256:810057135f581ff0050c2ad1c79b0277e3b319fcaf4026a01aef881a83f830f0'
---
# 0006. The mandate evolves toward a network-verifiable credential; HMAC is its Phase-0 form

- **Status:** Proposed
- **Date:** 2026-06-04

## Context

Today a `PurchaseMandate` is authenticated with an **HMAC over its canonical serialization
using one server-held secret** (`policy/mandate.py`, `MandateSigner`). This is exactly right
for the property it was built for: *our* ASA hot path verifying that a mandate is genuinely
ours and unmodified before `decide()` runs ([ADR 0001](0001-deterministic-money-authority.md),
[05](../05-money-control.md)). Symmetric signing is fast, simple, and has no key-distribution
problem when there is exactly one signer and one verifier — us.

But three directions we want to grow in all require something HMAC structurally cannot give:
a verifier who is *not us*.

1. **Agent-to-agent commerce** ([15](../15-agent-to-agent-commerce.md)) — a merchant or seller
   agent we've never met must verify a mandate without holding our secret.
2. **The standards line** — Google's **AP2** carries mandates as **W3C Verifiable Credentials**
   with asymmetric signatures; Visa/Mastercard agentic tokens are network-verifiable. Our
   mandate is already conceptually an AP2 mandate; the signature is the only thing keeping it
   proprietary.
3. **Platform scale** ([13](../13-scaling-to-a-platform.md)) — a distributed, multi-tenant
   decision fleet wants per-tenant keys in a KMS/HSM with rotation, not one shared secret
   smeared across every node.

A shared symmetric secret cannot be handed to an external verifier without *becoming a signer*
— anyone who can verify can forge. That is the wall.

## Decision

> Keep HMAC as the Phase-0 single-party form, and evolve the mandate toward an **asymmetric,
> network-verifiable signature** (the authority service signs with a KMS-held private key;
> anyone verifies with the public key) behind the **same `MandateSigner` interface**.

Concretely:

- `MandateSigner` becomes an interface with two implementations: the existing **HMAC** signer
  (single-party, today) and an **asymmetric** signer (Ed25519/ECDSA, key in KMS/HSM).
- A signed mandate carries a **key id** so a verifier selects the right public key across a
  rotation window, and a **tenant id** in the signed payload so the hot path can refuse a
  cross-tenant match ([13 §1](../13-scaling-to-a-platform.md)).
- The canonical serialization and the pure `decide()` / `find_match` hot path **do not
  change** — only how the signature is produced and checked. The forward seam promised in
  [ADR 0001](0001-deterministic-money-authority.md) ("the gate gets smarter; the contract it
  honors does not move") is honored again here.
- The credential envelope can later be dressed as a **W3C Verifiable Credential** to be
  literally AP2-compatible, without changing the authority semantics underneath.

**Alternatives rejected:**

- *Stay HMAC-only* — rejected: structurally blocks A2A, AP2 alignment, and per-tenant key
  isolation. It's a dead end the moment a verifier isn't us.
- *Jump straight to a full VC/DID stack now* — rejected as premature: it's ceremony with no
  second party to verify against yet. We add the asymmetric *primitive* when the first
  external verifier appears, and the *VC envelope* when a counterparty actually speaks AP2.
- *Per-tenant shared secrets (HMAC, but one secret per tenant)* — rejected: improves blast
  radius but still can't be handed to an external verifier; solves the wrong half.

## Consequences

What we gain:

- A mandate any counterparty can verify against a public key — the precondition for
  cross-org A2A commerce and for being a standards-aligned (AP2) credential.
- Per-tenant keys in a KMS with rotation; compromise of one tenant's key doesn't forge
  another's, and no verifier ever holds signing power.
- The hot path and the safety property are untouched — this is a signature-layer change, not
  an authority-model change.

What we give up / live with:

- Asymmetric verify is slower than an HMAC compare. On the latency-critical hot path this is
  mitigated by caching verified public keys and (at scale) sharding by card so the verify is
  local and warm ([13 §3](../13-scaling-to-a-platform.md)). Still must be measured against the
  response window ([backlog D2](../16-iteration-and-robustness.md)).
- Key management is now real operational surface: KMS/HSM, rotation, key-id plumbing, a
  revocation story. That's the cost of letting strangers verify our authority — and it's the
  cost AP2/Visa already pay.

## ELI5 / what I learned

Right now the mandate is signed like a **wax seal only our own office can recognize** — great
for proving a letter is ours when *we're* the one reading it, useless the moment someone
across town needs to check it without trusting our office. To let other agents and payment
networks trust a mandate, we switch to the **signature/public-key model**: we sign with a
private pen kept in a safe, and we publish the matching way to check it, so *anyone* can
confirm "yes, the human really authorized exactly this much, for exactly this, and it hasn't
been edited" — without ever being able to forge one themselves. We don't need it the day we
have only one reader; we build it the day the first stranger has to verify. Same letter, same
rules inside it — just a seal the whole world can check.
