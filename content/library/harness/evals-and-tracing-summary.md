---
title: Evals & Tracing for AI Products — A Working Reference
collection: harness
source: ~/dev/agentic-harness/docs/evals-and-tracing-summary.md
sourceMtime: '2026-07-26T02:33:10.193Z'
sourceCommit: a25de5e
syncedAt: '2026-09-01'
summary: >-
  A summary of everything we walked through: what evals are, how they're graded,
  how tracing fits in, and how to bootstrap an eval suite from zero.
contentHash: 'sha256:ee77608606bb6d5a40e13338e64145c72d74ffa08c819def35ebcd3f13d2ef28'
---
# Evals & Tracing for AI Products — A Working Reference

A summary of everything we walked through: what evals are, how they're graded, how tracing fits in, and how to bootstrap an eval suite from zero.

> **This document is the narrative, not the spec.** The operational north star — the contract every
> project's suite is held to — is the `/evals` skill ([claude/skills/evals/SKILL.md](../claude/skills/evals/SKILL.md)).
> When this prose and that contract disagree, the contract wins.

---

## 1. What an eval actually is

An **eval is a test for a non-deterministic system.** It has the same skeleton as a unit test — an input, run it through your system, check the output against an expectation — but the output is fuzzy and varies run to run, so the interesting part is entirely in *how you check*.

**Unit test:** hard assertion. `2 + 2 == 4`. Done.
**Eval:** the output can't always be pinned to an exact string, so grading gets more flexible.

---

## 2. The three flavors of grading

These aren't three "kinds of eval" so much as three ways to check an output. A mature suite mixes all three.

### a) Programmatic / exact checks
Assert directly in code — no LLM involved. Use this whenever you can:
- Is the output valid JSON?
- Did it call a specific tool?
- Did it land on the correct number / value?

Cheap, fast, fully trustworthy. **Underused** — reach for this first.

### b) LLM-as-judge
When the output is fuzzy (tone, helpfulness, faithfulness), hand a *second* model the output plus a **rubric**:
- "Does this response resolve the user's request? Yes/No"
- "Score 1–5 on faithfulness."

The judge does the grading your assertion can't. **But the judge itself has to be validated** (see §4).

### c) Human grading
The gold standard, but slow and expensive. Usually reserved for **calibrating** your automated graders, not for grading everything.

---

## 3. The ground-truth ("golden") set — the foundation

This is not a third grading method — it's the **ground truth that the other methods get measured against.** Everything stands on it.

**Format:** a table / CSV of `input → expected output` (plus maybe a note on *why* it's correct). Shape depends on the product — structured output, expected tool calls, ideal final answer, etc.

**Where the cases come from:**
1. **Handwritten** — you and your team imagine the 20–50 situations the product must nail and write out what "great" looks like. Painful, but it forces you to *define quality*. Doubles as a product spec.
2. **Production traffic** — real conversations, labeled. Captures how users *actually* talk (never how you imagined). Every failure gets frozen into a new case so it can't silently regress. This is the flywheel.
3. **Synthetic generation** — use a strong model to brainstorm edge cases / adversarial inputs, then **a human vets them** (skip the vetting and you're just testing a model against itself).

**The mistake to avoid:** chasing volume. 50–100 genuinely well-chosen, well-labeled cases that cover your real failure modes beat a giant noisy set. **Quality of labels over quantity.**

---

## 4. Why you can trust an LLM judge (and how to earn it)

You don't blindly trust the judge — you validate it like any measuring instrument.

- **Calibration:** run the judge against your human-labeled ground truth and measure agreement. 80%? 90%? If it's near coin-flipping, the judge is useless — fix the rubric or prompt. *The judge gets evaluated before it's allowed to evaluate your product.* (Note: "calibrated," not "trained" — you're tuning the rubric/prompt, not retraining a model.)
- **Make the job narrow and concrete:** "is this good?" invites hallucination and drift. "Does this response contain the refund policy? Yes/No" is nearly mechanical. Tighter rubric → less room for false signal.
- **Pairwise comparison** (great for model upgrades): instead of scoring in a vacuum, show the judge the old answer and the new answer side by side and ask which better matches your desired voice. **Relative judgments are far more stable than absolute scores.**
- **Know the judge's biases.** LLM judges have documented, repeatable failure modes: **position bias** (favoring whichever answer appears first in a pairwise comparison — run both orderings and average), **verbosity bias** (longer reads as better, even when it's padding), and **self-preference** (favoring text written by its own model family). The mitigations are cheap: swap orderings, tell the rubric length is not quality, and judge with a different model family than the one that generated the output.

**The ceiling:** a judge is never better than your ability to define what "good" means.

---

## 5. Grading agent trajectories (multi-step)

A single chat response = grade one output. An agent produces a *sequence* (plan → tool call → read result → another call → answer), so you grade two different things:

### Outcome
Did it land on the correct final answer? Did the refund actually get issued? Closest to a classic unit test — use exact checks where possible.

### Process (the trajectory)
Did it get there *sensibly*? An agent can reach the right answer for terrible reasons — wrong tool called four times, or data leaked it shouldn't have touched. **In fintech especially, a correct answer via an unsafe route is still a failure.**

Things you check:
- Did it call the expected tools in a reasonable order?
- Did it avoid redundant or forbidden calls?
- Did it recover gracefully when a tool errored?

Some of this is **programmatic** (inspect the logged tool calls against what you expected — e.g. "did it call tool X at step 3?" is almost always code, no judge needed). Some needs a **judge** looking at the whole reasoning chain.

**The trap:** over-specifying the path. Demand an exact tool sequence and the eval shatters every time the agent finds a valid alternative route. **Assert the steps that genuinely matter (safety- and correctness-critical); stay loose on the rest.**

---

## 6. One run is not a result — scores are statistics

The very thing that makes evals necessary — non-determinism — also means **a single run of the suite tells you almost nothing.** A case that passes today can fail tomorrow with zero changes to your code.

- **Run each case multiple times and report a pass *rate*, not a pass/fail bit.** "Passes 8 of 10 runs" and "passes 10 of 10" are very different products, even though one lucky run makes them look identical.
- **Decide what reliability you're actually claiming.** *pass@k* ("succeeds at least once in k tries") fits assistive tools where a human sees the output and can retry. *pass^k* ("succeeds all k times") fits automation running unattended. Fintech automation is firmly in the second camp — and the gap between the two numbers is usually enormous.
- **Know your noise floor before celebrating a delta.** Run the identical suite twice and see how much the score moves on its own — and treat that as the crudest possible estimate, not the answer. Better: report deltas as *case-flips with a paired interval*, and know the arithmetic of a curated suite — at 25 cases, one flip is 4 points, so a delta smaller than one case is not a delta. If your prompt change "improved" the score by less than that, you've learned nothing. This is the single most common way teams fool themselves with evals.
- **Noise isn't only the model.** Anthropic measured infrastructure configuration alone swinging an agentic coding benchmark by ~6 points, with 5.8% of "task failures" actually being OOM kills at strict resource limits. Trials must start from clean, isolated environments (shared state correlates failures and invalidates pass^k), infra errors get counted as their own category — never as case failures — and the execution environment (resource caps, concurrency, harness version) is versioned like a prompt.
- **Budget for it.** N runs × M cases × judge calls means the suite itself has a real token bill and wall-clock cost — one more reason the golden set should be curated (§3), not huge.

---

## 7. Tracing vs. evaluation

Related but genuinely different — people conflate them constantly. (Tools in this space: LangSmith, LangTrace, etc.)

| | **Tracing** | **Evaluation** |
|---|---|---|
| What it is | **Observation** | **Judgment** |
| Question it answers | "What did my agent actually do just now?" | "Was that good — yes/no, and how good?" |
| Nature | Descriptive; judges nothing | The grading layer |
| Content | Every prompt, tool call, intermediate output, latency, token cost — the full breadcrumb trail | Scores / pass-fail against expectations |

**How they interlock:**
- Tracing is the **raw material** evals feed on. When an eval says "this run failed," you open the trace to see *why* (oh — wrong tool at step 3).
- Production traces become the **source of new eval cases** (the flywheel again).

**On rolling your own:** as a skill-building exercise, building even a simple structured log (every model call + tool invocation with inputs, outputs, timings) teaches you what actually matters to capture — off-the-shelf tools hide that. In real production you'd usually adopt a solved tool rather than maintain your own. For a fintech narrative, "I understand observability from the ground up" is worth a lot.

---

## 8. Keeping the suite honest

The flywheel (§3) has a failure mode: **iterate the prompt until the suite passes, and the suite now measures your prompt's fit to the suite** — Goodhart's law. The score climbs; the product may not.

- **Hold cases out.** Keep a slice of the golden set you never look at while iterating. Check it occasionally — if the main set improves and the holdout doesn't, you're overfitting to your own tests.
- **Retire dead sensors.** A case every candidate passes no longer discriminates anything — it's cost without signal. Prune and merge as deliberately as you add (the suite should grow from reality, not just accumulate).
- **Version everything together** — prompt, model, eval set, judge rubric. "78% last month vs 84% today" is meaningless if the suite gained fifteen cases in between. A score is only comparable to another score if you know exactly what produced each.
- **Re-calibrate the judge when it changes** (§4) — new judge model or rubric means trend lines across the change are suspect until you've re-validated against ground truth.

---

## 9. Evals don't stop at deploy

Everything above is *offline* — curated cases, run before shipping. Production adds an **online** layer, because your golden set will never cover what real traffic does next:

- **Sample live traffic and grade it** with the same judges you calibrated offline — a rolling quality score on real usage, not just on the cases you thought to write.
- **Harvest cheap user signals** — thumbs down, retries, rephrased questions, escalations to a human. Individually noisy, collectively a good trend detector, and above all *pointers to traces worth reading* — which become new eval cases (the flywheel, one more time).
- **Alert on drift, not just errors.** A model provider silently updates, a tool's API changes shape, traffic shifts toward a topic your suite never covered. Nothing "fails," but quality moves. Tracing (§7) is what makes any of this observable at all.

---

## 10. Context worth having on your radar

- **Cost and latency are first-class eval metrics**, not just correctness. A right answer that takes 30s or burns huge tokens can still fail the product.
- **Eval-driven development** — write the eval before/alongside the feature, like TDD.
- **Regression guarding** — every model or prompt change reruns the whole suite so you catch silent backslides. Decide *where* the suite runs (pre-merge gate vs. nightly job) based on its cost and runtime — a suite too slow or expensive to run stops being run.
- **Adversarial and safety evals deserve their own section of the suite** — prompt injection, jailbreak attempts, PII in inputs, out-of-scope requests. Crucially, these are cases where the *correct* behavior is refusing or escalating — in fintech, "the agent declined and handed off to a human" is often the passing answer.

---

## 11. Building an eval suite from scratch (zero production traffic)

1. **Handwrite 10–20 cases** encoding what you believe "good" looks like. This doubles as your product spec.
2. **Lean on programmatic checks first** — free and trustworthy.
3. **Add a judge only where fuzziness demands it.**
4. **Dogfood as your first traffic** — every time you use it and wince, that becomes case #21. The suite grows with the product.

---

## 12. When a new model lands

Two rituals, both from Anthropic's own practice:

- **Run the full suite before changing anything** and record the delta. The capability tier is
  where upgrades show — teams with a suite upgrade in days, teams without one take weeks of
  vibes. Watch for saturation: if only your hardest cases remain unsolved, a big capability
  jump reads as a small score move, and you'll under-rate the new model (this happened to real
  teams on real upgrades).
- **Ablate the harness, one component at a time.** Every scaffolding component — a
  decomposition step, a review loop, a subagent tier — encodes an assumption about what the
  *previous* model couldn't do, and those assumptions go stale silently. After the suite delta
  is in, remove one component at a time and measure; keep only what still earns its cost. A
  radical teardown fails; methodical ablation works.

---

## Sources absorbed (2026-07-25)

The contract and this doc were gap-checked against these — where they taught us something it's
folded in above; where our contract goes further (judge-bias mitigations, Goodhart/holdouts,
refusal-as-pass with matched negatives), that's noted here so nobody re-litigates it:

- [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) — capability-vs-regression tiering, reference solutions, trial isolation, balanced problem sets, "read the transcripts," pass@k/pass^k by product shape.
- [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) — judge leniency bias and tuning a standalone evaluator skeptical, few-shot scale anchors, rubric wording steering the artifact, component ablation on model upgrades.
- [Quantifying infrastructure noise in agentic coding evals](https://www.anthropic.com/engineering/infrastructure-noise) — the ~6-point infra swing, infra errors miscounted as task failures, environment as a controlled variable, and the statistics of small suites.

---

## Glossary

- **Dogfooding** — from "eating your own dog food." Using your own product yourself, as a real user would, before/alongside shipping it. Every rough edge you hit becomes a fresh eval case.
- **Capability vs. regression tiers** — capability cases are supposed to fail (the hill to climb; where eval-driven development lives); regression cases sit near 100% as guards. A universally-passing regression case is a guard, not a dead sensor; a capability case graduates to regression once stable.
- **Goodhart's law** — "when a measure becomes a target, it ceases to be a good measure." Tune your prompt against your eval suite long enough and the score stops meaning quality.
- **Ground-truth / golden set** — curated `input → correct output` pairs; the reference everything else is measured against.
- **Holdout** — eval cases deliberately kept out of the iterate-and-check loop, used to detect overfitting to the rest of the suite.
- **LLM-as-judge** — a second model grading your product's output against a rubric.
- **Online vs. offline evals** — offline: curated cases run before shipping. Online: grading sampled live traffic and user signals after deploy.
- **pass@k vs. pass^k** — "succeeds at least once in k runs" vs. "succeeds all k runs." The honest claim depends on whether a human retries or automation runs unattended.
- **Position / verbosity / self-preference bias** — the standard LLM-judge failure modes: favoring the first-shown answer, the longer answer, or its own model family's writing.
- **Trajectory** — the full sequence of steps (plans, tool calls, intermediate outputs) an agent takes to reach an answer.
- **Trace** — the detailed log of a single run.
