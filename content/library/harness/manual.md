---
title: 'The Manual — how this harness works, as built'
collection: harness
source: ~/dev/agentic-harness/docs/MANUAL.md
sourceMtime: '2026-09-20T02:26:30.342Z'
sourceCommit: cce8b02
syncedAt: '2026-09-21'
summary: >-
  As-built 2026-09-19. Picture first: docs/visuals/manual.html (four diagrams:
  layers, session lifecycle, ceremony ladder, digest postmortem). This file is
  canonical; the visual renders it.
contentHash: 'sha256:cefd8c518bdbae46ef2b0e2742edfcab3966c354e7360d2cee15b190a17b5701'
---
# The Manual — how this harness works, as built

*As-built 2026-09-19. Picture first: `docs/visuals/manual.html` (four diagrams: layers, session
lifecycle, ceremony ladder, digest postmortem). This file is canonical; the visual renders it.*

*Supersedes `MANUAL.md` + `OPERATING_MANUAL.md` (now in `archive/docs/`), which went stale: each
edit cost a paired-visual update plus a manifest bump, and they described machinery that had
stopped running. Every row here exists today, or is marked **parked**, **prototype** or **retracted**.*

**One rule, one home.** Rules agents obey live in global `claude/CLAUDE.md` and each repo's
`AGENTS.md`; procedures live in the skill that runs them. This manual explains why and shows where
things sit. If a sentence here would change an agent's behaviour, it is in the wrong file.
`AGENT_ANATOMY.md` and `PRODUCT_ANATOMY.md` are about the thing being built; this is about the way
of working that builds it.

---

## 1. Doctrine

| Principle | What it means in practice |
|---|---|
| Human judgment is the scarce resource | Anthropic's economic data: AI is used in ~60% of engineering work, fully delegated in 0–20%. Spend judgment on decisions, never on re-testing what a machine could have checked |
| Verification beats prompting | The agent needs a check it can run itself (Willison). Prompting harder is what you do when the loop is not engineered |
| Authority is deterministic, not positional | Models do not reliably privilege system-slotted or earlier text over later hostile text. Anything that must hold regardless of the window (spend, send, publish, delete) is owned by code — a gate, a broker, a permission rule — never by where a sentence sits in a prompt (`AGENT_ANATOMY.md` §1.1) |
| Hooks reduce accidents; they are not security | Every hook here fails open. A worktree is not a sandbox. The day an agent acts with real money or credentials unattended, containment is an infrastructure project (sealed, budgeted, disposable environments), not another hook |
| Ceremony scales with stakes | Process is a cost. It is bought per task, by blast radius (§3) |
| Mechanisms in, labels out | Adopt a mechanism when it arrives with evidence; do not write the term of the month into doctrine (§7) |
| Token cost is a design input | Deterministic checks are free forever; an LLM judge is a tax on every run; fan-out multiplies tokens |
| Subtract by default | Instruction files, rituals and sensors are deletion candidates until they show they change an outcome (§8, §9) |

## 2. The stack, as built

Three layers. **Context** is what the model reads. **Harness** is deterministic code around it.
**Loop** is how work flows and where a human appears.

| Layer | Component | What it does | Fires |
|---|---|---|---|
| Context | Global `claude/CLAUDE.md` | Picture first; ceremony scales with stakes; fan-out for reads only; two-iterations-then-fresh-eyes; bugs become eval cases; gaps never close silently | Every session |
| Context | Per-repo `AGENTS.md` (`CLAUDE.md` = `@AGENTS.md`) | Project map, invariants, run/verify commands | Every session in that repo |
| Context | Skills (5): `spec`, `evidence-packet`, `evals`, `challenge`, `handoff` | Procedures loaded on demand, so they cost nothing until used | Slash or self-invoked |
| Context | Specs (`docs/specs/`), handoffs (`.claude/handoffs/`) | Durable task state on disk; chat is transport, not memory | Per risky task / per session |
| Harness | `session-context` hook | Injects git state + last handoff's next steps (the digest block was removed) | SessionStart |
| Harness | `guard-bash` hook | Blocks catastrophic `rm` shapes | PreToolUse: Bash |
| Harness | `guard-commit` hook | Runs the repo's `.claude/gate.sh` on `git commit` | PreToolUse: Bash |
| Harness | `guard-secrets` hook | Blocks writes that contain secret-shaped strings | PreToolUse: Edit/Write |
| Harness | `format-on-edit` hook | Formats the touched file | PostToolUse: Edit/Write |
| Harness | `notify` hook | Desktop notification when a lane finishes or needs input | Stop, Notification |
| Harness | `verify-done` hook — **prototype** | Blocks "done" once when code was edited and no test/gate command ran afterwards | Stop |
| Harness | `.claude/gate.sh` per repo | Fast health check. Convention: **under 10 seconds**. Anything slower is a manual or CI gate, or `--no-verify` becomes habit | Every commit |
| Harness | `.claude/evals.sh` + suites per repo | Behaviour suites under the `/evals` contract | In-session per task; CI where a project has it |
| Loop | Subagents (2): `critic`, `researcher` | Fresh-context adversarial review; cited web synthesis. Both read-only | On demand / via `/challenge`, `/evidence-packet` |
| Loop | Two human touchpoints | Approve the contract; accept the evidence | Per task |

**Not running.** The nightly gate digest is **disabled and parked** (§8). The weekly proposer was
never installed. Twenty skills (all `deep-*`, all `token-breakdown-*`, `retro`,
`propose-improvements`, `hack`, `new-agent`, `spike`, `onboard`, `end-session`, `update-docs`,
`changelog`, `brainstorm`, `setup-verify`) are in `archive/skills/`: zero uses across the last 30
sessions. Nothing schedules a full eval run today; that is a stated gap, not a hidden one.

**`gate.sh` and `evals.sh` are time slots, not check types.** Deterministic and sub-second goes in
the commit slot; scored, slow or paid goes in the eval slot. Placement is cost, not category.
Gates and runners never edit themselves to pass; only the suites they run grow.

## 3. Ceremony scales with stakes

The motivating failure: a portfolio project built under always-on ceremony produced an audit of an
audit of its eval methodology **before its first model call**. Nothing ran end to end; there was
nothing to evaluate. Process had become the product.

| Situation | Ceremony | Done means |
|---|---|---|
| Nothing runs end to end yet | Thinnest working slice first. No specs, audits or eval methodology | It runs, and you saw it run |
| Trivial, local, reversible | Just do it; run the obvious check | The check passed |
| Normal change in a working project | Three-line contract: **Outcome / Non-goals / Acceptance evidence** (checks the agent can run). No time estimates | Verified by the agent, plus an honest NOT-verified list |
| Multi-module, risky, or LLM-behaviour change | Also `/spec` (living file in `docs/specs/`, diagram first, re-read on later iterations) + eval delta drafted at plan time (`/evals plan`); `/challenge` on foundation-adjacent plans | `/evidence-packet`: self-run checks, fresh-context critic against a rubric, eval delta, NOT-verified, next contract |
| Irreversible or acts externally (money, send, publish, delete) | All of the above + deterministic runtime gate + human approval + line-level review of the core diff | Packet is context, not a substitute for reading the diff |

Standing tripwire: **if a session is producing documents about documents, stop and say so.**

Two rules hold at every rung. Acceptance evidence must be *runnable* — "feels right" is not
evidence, "cases 1–3 pass and the screenshot shows the recalculated total" is; runnable acceptance
checks are eval cases wearing a different hat. And **gaps never close silently**: each NOT-verified
item blocks acceptance, or gets an explicit "accepted without X" and a tracked follow-up.

**Review depth follows consequence:** money or external action → read the core diff line by line;
product logic behind a gate + evals → read the packet, open the diff only if a check is waived or
NOT-verified is non-empty; spikes and scaffolding → does the outcome exist, one look.

**Anti-cheat gate lines.** Sealing git history and network on one 2026 benchmark dropped a model's score from 87.1% to 73.0%;
63% of audited passing runs had cheated (Cursor). Beck's tells — tests disabled or deleted,
unrequested functionality — are greppable, so they live in `gate.sh`: a diff that removes
assertions or adds `skip`/`xfail` markers in a test or eval file goes red and names the file.
Cheap enough to ship the day a repo gets a gate.

## 4. Evals

An eval is not a test: tests check code paths, evals judge behaviour across cases. The operational
contract is the **`/evals` skill** (D1–D8); `docs/evals-and-tracing-summary.md` is the narrative.
Where this section disagrees with the skill, the skill wins.

| Rule | Why |
|---|---|
| Programmatic first: code grader > snapshot/replay > LLM judge | A judge is a paid call per case per run forever. Use one only when behaviour cannot be code-graded; then pin it, calibrate it against your own grading, commit the calibration artifact, and give it an "Unknown" escape |
| A score is a rate, not a boolean | LLM-dependent cases run N times. A delta inside the measured noise floor is not an improvement. Unattended work is held to pass^k, not pass@k |
| Suites grow from reality, and shrink | Every real bug becomes a failing case before its fix, same diff (`/evals case`). Merge near-duplicates and retire cases that guard nothing as readily as adding. 20–50 cases from real failures beats a framework |
| No evals before there is something to evaluate | §3, first row. A product with no suite waits for its first user-visible bug; that bug is case #1 (`/evals bootstrap`) |
| The metric is a product with its own bugs | Observed in one session: an any-of predicate satisfiable without the behaviour; harness prompt wording that differed from production; outputs scoring perfect while parroting the prompt's example. So: predicates byte-identical to production, prompt parity fenced, and a periodic every-row read of any suite that gates shipping |
| Refusal is a pass in safety cases; injection cases are mandatory wherever untrusted text reaches a prompt | Hostile-data posture is tested, not asserted |

### False greens — a warning light wired to nothing

Every row was found in my own repos, most more than once. None was a case-authoring problem; all
were **sensor** problems. Depth of eval culture did not predict whether the alarm was wired.

| If you find… | It is a false green because |
|---|---|
| A runner that exits 0 when its API key is missing | Green means "did not run" |
| A scheduled job asserting case *count*, not correctness | It cannot fail on a quality regression |
| A judge whose calibration artifact exists on no machine | Spend without signal |
| A regression gate whose baseline is gitignored | Silently no-ops on any fresh clone, CI included |
| A suite nothing runs unless someone remembers | Not a sensor |
| A north-star metric that is 100% by construction | The documented path bypasses what it measures |
| A sealed holdout read with no read budget | Its value burns silently |
| **A sensor nobody reads, or whose clock lies** | **A daily alert that is always yellow trains you to ignore it; a duration measured in wall-clock across a sleeping laptop measures the lid, not the gate (§8)** |

Place a product by asking what would have to break for its light to go red — then check that it
can. Maturity ladder: **L0** prompt-and-wait → **L1** "done" arrives with checks you can accept
without re-running the flow → **L2** cases land with features and a run you did not have to
remember catches regressions → **L3** lane count is set by machine-absorbed review. Honest
placement today: L1 everywhere, L2 only inside sessions where I run the suite. The old L4 ("the
system proposes its own improvements") is **retracted** — it never ran (§8).

## 5. The session loop

```
brief → contract (3 lines) → [risky: /spec + diagram + /challenge] → you approve
      → single-lane implementation, agent self-verifies (gate, evals)
      → [risky: /evidence-packet: critic + eval delta] → you accept or reject
```

| Rule | Why |
|---|---|
| State lives on disk — git, specs, handoffs | Any lane can be killed and restarted fresh; quality degrades in very long windows, and a restartable lane never meets that cliff |
| Verification before delegation | If the executor cannot prove the work without you, the cheapest missing verifier is part of the task |
| A lane ends at evidence, a blocking question, or a spent retry budget | Never at "probably right" |
| Two iterations, no new hypothesis → fresh eyes | The session that produced the confusion is the worst place to resolve it. Critic or `/challenge`, reading only repo + spec |
| Fan out for reads, single lane for writes | Read-only investigators keep ~100k+ tokens of digging out of the main window. Two of my own parallel write lanes collided on one HTML file. Worktrees isolate files, not ports, simulators or databases |
| WIP ≤ 2 implementation lanes | Waiting on a lane is not a reason to open another; `notify` pings you |
| Close with `/handoff` | The next session resumes from the repo, not from chat |
| Anything unattended names five parts first: trigger, goal, verifier, stop rule, memory | Stop and budget caps are load-bearing: a scan of 6,549 agent repos confirmed 68 runaway loops across 47 projects ([arXiv 2607.01641](https://arxiv.org/abs/2607.01641)). §8 adds a sixth question: **who reads the output?** |

## 6. One agent until measured otherwise

| Claim | Evidence | Rule |
|---|---|---|
| Multi-agent wins mostly by spending more | Anthropic's research system beat single-agent while using ~15× the tokens of a chat; token volume explained most of the variance | Compare at **equal token budget** |
| Reflection without an external check can degrade output | [Huang et al., ICLR 2024](https://arxiv.org/abs/2310.01798) | A critic loop needs a programmatic verifier, or a calibrated judge |
| Every fan-in is a context chokepoint; the slowest branch sets wall-clock | Topology is the cost and latency lever | Pipeline by default; add a barrier only when a stage needs the whole prior set |

**The anchor:** before adding an agent, record the single-agent score on the same suite at the same
token budget. The second agent ships only if it beats that number by more than the suite's noise
floor. No anchor, no fan-out. (`PRODUCT_ANATOMY.md`, *The one-agent gate*, carries the full case.)

What survives in this harness: subagents as **context isolation for reads** and as **fresh-context
review**. Not as parallel writers. The model-tiering rule ("Fable orchestrates, Opus churns") was
dropped from global CLAUDE.md: it was a label-shaped rule with no measured win behind it. Model
choice per task is requalification on evidence — rerun the suite, compare, then switch.

## 7. Mechanisms over labels

"Loop engineering" was coined in June 2026 and abandoned by its own coiner 41 days later for "graph
engineering" — a term launched as satire, carrying three incompatible meanings in its first week,
spread mainly by engagement accounts recycling a six-week-old template. Anthropic published under
neither label; Willison and Fowler kept their own vocabulary. **This manual refuses "graph
engineering" as a label** and keeps what arrived with evidence:
the five-part spec for unattended runs (§5), the regulator / reference-setter test (§8), topology
as the cost lever (§6), and the graph-memory tradeoff (`AGENT_ANATOMY.md`, *Memory & retention*).
A term that cannot hold still for six weeks does not get written into doctrine.

## 8. Postmortem — the digest and the meta-loop

The old chapter here was "the harness improves itself". It did not. Blameless record:

| | |
|---|---|
| **What was built** | launchd job, 06:17 daily: run every focus repo's gate + evals, write a dated digest, notify on yellow/red, inject a banner at session start. A Sunday proposer to mine digests + `BABYSIT_LOG.md` into improvement proposals. `/retro` and `/propose-improvements` to act on them |
| **What happened** | 2026-08-18 → 2026-09-19: every digest yellow "SLOW". It notified every day. Nobody read it |
| **Root cause** | The laptop slept during runs. The process froze while wall-clock kept counting. One repo's gate was bimodal: 26–47 s on 6 days, 2,600–6,500 s on 25 days. The 900 s timeout never fired — a frozen process gets no alarm. `caffeinate -im` does not prevent standby or lid-closed sleep |
| **What it cost** | It buried a real failure: that repo's Plaid `LinkKit.xcframework` build was broken from 2026-09-09 and sat under the same yellow as every other day |
| **The rest of the loop** | The weekly proposer LaunchAgent was never installed. `BABYSIT_LOG.md` was last touched 2026-07-07. `/retro` and `/propose-improvements` had nothing to mine; both are archived |
| **Disposition** | Digest disabled and parked. Banner removed from `session-context`. No replacement scheduled |

**Lesson: a sensor nobody reads, or whose clock lies, is a false green.** (Row added to §4.)

**Retracted.** Earlier versions cited long gate durations as proof the loop worked: "5,735 seconds
against a 120-second budget", the "8s → 1919s → 3115s" trend line, "917 seconds is S3, not a broken
foundation", and the slow-gate escalation rule built on them. All of those numbers were the sleep
artifact. They measured the lid. The earlier pre-registered two-week trial of this methodology also
**did not run** (its scoreboard stayed empty); per-task self-logging failed twice and is retired.

| Before un-parking any scheduled sensor | |
|---|---|
| Runs on a machine that does not sleep (CI, server) | or measures CPU/monotonic-awake time, never wall-clock |
| Silent on green and on known-yellow | alerts only on a **state change** |
| Names its reader and the decision the output feeds | no reader, no sensor |
| Heartbeat is checked by something else | "did it run" is a separate signal from "did it pass" |
| Has an unbuild trigger | §9 kill rule |

Still true from the old chapter: automate **regulators, not reference-setters**. A standing loop
maintains known behaviour against a check that already exists. If no verifier can grade the
output, it is a judgment task wearing a cron schedule.

## 9. Instruction files: subtract, then measure

The old model was "instruction files are failure logs — add a line per misbehaviour." That model
only grows, and lines written for a weaker model become noise or over-constraint for a stronger one.
Anthropic reports removing over 80% of Claude Code's system prompt for Claude 5 generation models
with no measurable loss on their coding evaluations, and recommends deleting repeated instructions,
putting tool guidance in tool descriptions, and moving detail into skills loaded on demand (Thariq
Shihipar, ["The new rules of context engineering for Claude 5 generation models"](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models),
2026-07-24).

The routine, replacing add-a-line:

| Step | Action |
|---|---|
| 1 | Pick a line (or block) in `CLAUDE.md` / `AGENTS.md` / a skill |
| 2 | Delete it |
| 3 | Rerun the evals, or the task that line was written for |
| 4 | Nothing regresses beyond the noise floor → **keep the cut**. Something regresses → restore it, and now the line has a receipt |

Placement: a rule stated in two loaded layers is a bug; anything enforceable by code becomes a hook
or gate line (prose is the most expensive, least reliable enforcement); tool guidance goes in the
tool description; sometimes-needed detail goes in a skill. With no suite to rerun, a cut is a
judgment call — say so rather than pretend it was measured.

The same kill rule covers everything in this repo: any ritual, eval, hook or sensor that has not
changed a decision or caught a regression in ~3 cycles is a deletion candidate. This pass applied
it: 20 skills archived, the digest parked, the tiering rule dropped, two manuals merged into one.

**Cost of trust, cheapest first:** NOT-verified list and three-line contract (free) → anti-cheat
lines and code-graded cases (free per run) → snapshot/replay (cheap) → fresh-context critic (one subagent run per risky task) → LLM judge
(a paid call per case per run, forever) → a second verifier agent per task (rejected as a default).
Verification spend follows the review tier (§3); fan-out must pay rent (§6).

**The standing test:** did more useful changes reach a verified outcome with less of my attention,
lower rework and bounded risk? If not — simplify the harness, reduce WIP, improve verifiers. Do not
answer a workflow problem by adding agents, and do not answer it by adding documents.
