---
title: '04 — Harness, Frameworks & The "Should I Scrap It?" Question'
collection: multi-agent
source: ~/dev/multi-agent-docs/04-harness-and-frameworks.md
sourceMtime: '2026-06-04T22:10:57.709Z'
syncedAt: '2026-07-09'
summary: >-
  You asked: "Should I be scrapping some of my impl and just use
  openclaw/opencode? hermes?" Short answer: no — but you should fix the one real
  gap, which is that you're maintaining ~4 copies of the …
contentHash: 'sha256:4b1b6b87b272d1e125c2d7c3ca7084c10ed14151ebc0f61f0901d1809062ad04'
---
# 04 — Harness, Frameworks & The "Should I Scrap It?" Question

> You asked: "Should I be scrapping some of my impl and just use
> openclaw/opencode? hermes?" Short answer: **no — but you should fix the one real
> gap, which is that you're maintaining ~4 copies of the same harness instead of
> one.**

---

## What openclaw, hermes, and opencode actually are (all real)

You had the names essentially right. Here's what they are and why none of them
replaces your domain agents:

| Tool | What it is | Stars / license | Category | Relevance to you |
|---|---|---|---|---|
| **opencode** | SST/Anomaly's open-source **terminal coding agent**; provider-agnostic; client/server; custom agents as markdown files | MIT, widely used | Coding agent | Use it as *your coding tool*. Coding-centric prompts/tools; you'd fight its grain for grocery/dj/jim. **Not a harness for your agents.** |
| **OpenClaw** | Self-hosted **personal-assistant gateway**: 20+ chat channels (WhatsApp/Telegram/Slack/iMessage…) → model-agnostic agents on your hardware; multi-session memory, cron, sub-agents, per-agent workspaces, browser/canvas tools, skills | MIT, ~377K★ (passed React as most-starred, Mar 2026) | Multi-channel personal assistant runtime | **Study it.** It already solved "route channels → per-agent workspaces with memory+cron+subagents." But it's a *chat-assistant* spine, not an *autonomous-commerce* spine. Security warnings: broad device access = real attack surface. |
| **Hermes Agent** (Nous Research) | Self-improving **agent runtime**, model-agnostic, 40+ tools, persistent cross-session memory, **agent-authored skills**, multi-channel deploy. Distinct from the Hermes *LLMs* | MIT, ~181K★ | Self-improving general agent runtime | **Study it** for its memory + skills model. Again: a general-assistant runtime, not domain commerce. |

**The pattern that matters:** OpenClaw and Hermes have *productized the generic
personal-assistant spine* — channels + memory + cron + subagents. That's a signal,
but it cuts the opposite way from "scrap your stuff": it means the **commodity** part
(the generic assistant shell) is solved and not worth hand-building — while your
**differentiated** part (an x402 research marketplace with a sourcing gate; a card-
rail procurement agent with a deterministic money gate; a CLAP-embedding DJ agent)
is *not* something any of these three do. You'd be scrapping your moat to re-buy a
commodity.

---

## Verdict: don't scrap. Here's the precise rule.

> **Rolling your own is *skill* when it's the thin, differentiating, evaluated layer.
> It's *NIH reinvention* when it's the thick, commodity, un-surveyed layer.**

Mapped to your code:

- **Keep (differentiating):** jim's LangGraph pipeline + sourcing gate; procurement's deterministic policy gate + mandate signing; grocery's Temporal approval/idempotency flow; dj's CLAP/taste/critic loop. None of openclaw/hermes/opencode does any of this. These *are* your portfolio.
- **Stop hand-rolling (commodity):** per-agent model-calling, prompt caching, cost tracking, tracing, per-task budget caps, retries. You're currently doing this **separately in grocery, jim, and procurement**, while `agent-core` already implements it once. That duplication is the only thing here a serious engineer would dock you for.
- **Don't adopt a heavyweight framework across all four.** Your agents are *heterogeneous*: grocery + procurement are **workflows** (scheduled, durable), jim is a **fixed-topology pipeline** (LangGraph already), dj is a **batch generator**. Forcing one orchestration framework onto all of them means fighting the abstraction in three directions. Match the tool to each agent's dominant constraint instead.

---

## The shape to standardize on (D6)

```
        per-agent (differentiated, KEEP)            shared spine (agent-core, CONSOLIDATE)
  ┌──────────────────────────────────────┐   ┌────────────────────────────────────────────┐
  │ grocery: Temporal workflow + gate     │   │ agent-core.complete()  — tier-routed model   │
  │ jim:     LangGraph pipeline + gate    │──▶│   calls, prompt caching, cost recording      │
  │ proc:    Temporal + policy gate       │   │ agent-core.trace()     — Langfuse spans      │
  │ dj:      curator/architect/selector   │   │ agent-core.set_budget()— per-run cost caps   │
  └──────────────────────────────────────┘   │ agent-core protocols   — tools, verifiers    │
                                              │ (loop itself: Claude Agent SDK where a free-  │
                                              │  form agent loop is needed; raw SDK / Lang-   │
                                              │  Graph where the flow is fixed)               │
                                              └────────────────────────────────────────────┘
```

Three rules:

1. **`agent-core` is the single substrate.** Every agent calls `agent_core.complete()` and `agent_core.trace()` instead of its own Anthropic wrapper. dj already does this — make grocery, jim, and procurement do it too. This is the one concrete refactor worth doing (roadmap P0, [08](08-implementation-roadmap.md)).
2. **The agent *loop* uses the Claude Agent SDK where you need a free-form loop** (e.g. grocery's onboarding intake, any future conversational agent), and **stays as raw-SDK / LangGraph where the flow is fixed** (jim's pipeline is deliberately fixed-topology — keep it; the sourcing gate *must* run every time, which is exactly why you didn't use a free-form loop there). You're already doing this correctly; just route the model calls through `agent-core`.
3. **Tools stay as MCP servers.** grocery, jim, and procurement already expose MCP. Keeping tools behind MCP makes them portable across loops and is the 2026 integration substrate — it de-risks every other choice (you can change the loop without rewriting tools).

### What `agent-core` is missing (and what to do about it)

The spine is solid (~900 lines, ADR-disciplined) but thin in three places. Don't
build all of this up front — add as the consuming agent needs it:

| Gap | When you'll feel it | Fix |
|---|---|---|
| No memory abstraction | When jim or a future assistant needs long-term recall | Add a `memory` protocol backed by pgvector (you already run it). If one agent needs *sophisticated* self-curating memory, bolt on **Letta/MemGPT** for that one agent rather than approximating it. |
| Queue is minimal (no deps/priority/DLQ) | If you ever chain agent A → agent B | You won't at this scale; Temporal covers cross-step needs. Leave it. |
| No sandbox impl | If procurement's browser fallback or code-exec goes live | `code-migration-agent`'s fork already has sandbox code — **upstream it into `agent-core`** instead of vendoring. |

> Also: `code-migration-agent` carries a **vendored fork** of `agent-core`. That's
> tech debt — pick the canonical package, upstream the fork's good parts (sandbox,
> per-task cost), delete the copy. "I had a fork and I consolidated it" is a fine
> story; "I have two diverging copies" is not.

---

## The credible position to hold (so you don't sound cringe either way)

The framework debate is genuinely contested. The non-cringe, defensible stance —
which concedes the real points on both sides — is:

> "The agent *loop* is simple enough to own — Anthropic themselves recommend
> starting on the raw API, and by 2026 the vendor APIs converged on tool-calling +
> structured output + MCP, so a generic orchestration abstraction mostly adds
> debugging overhead. So I own the loop via the vendor's Agent SDK and keep prompts
> and tool calls legible. The hard 70% — durable state, memory, scheduling,
> observability — I don't reinvent: that's Temporal, pgvector, Langfuse, and a thin
> shared substrate I factor across all my agents. I reach for a heavier framework
> only when one agent's dominant constraint matches its core abstraction — LangGraph
> for jim's fixed-topology gated pipeline, and I'd add Letta if an agent needed
> self-curating long-term memory. I evaluated the productized personal-assistant
> runtimes — OpenClaw and Hermes — and chose not to adopt them because my agents are
> domain-specific autonomous-commerce systems, not chat assistants; their
> contribution is commodity for my use case."

Avoid the absolutes: *"frameworks are for people who can't code"* (false — LangGraph
runs JPMorgan-scale systems) and *"always use a framework"* (ignores Anthropic's own
guidance). The senior signal is **naming what you evaluated and rejected, and why.**

---

## Bottom line

- **Scrap nothing.** Your domain logic is the moat; openclaw/hermes/opencode don't replicate it.
- **Consolidate the commodity layer** onto `agent-core` (currently duplicated 3–4×). One refactor, big credibility payoff.
- **Use opencode as your coding tool**, read OpenClaw + Hermes source for memory/routing ideas, and be able to say you did.
- **Match the loop to the agent**, route all model calls through the shared substrate, keep tools as MCP.
