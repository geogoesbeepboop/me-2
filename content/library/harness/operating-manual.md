---
title: 'The Operating Manual — how the day runs (solo runbook, v4)'
collection: harness
source: ~/dev/agentic-harness/docs/OPERATING_MANUAL.md
sourceMtime: '2026-08-04T04:18:50.687Z'
sourceCommit: 35c12f5
syncedAt: '2026-08-06'
summary: >-
  Visual companion:
  <https://claude.ai/code/artifact/9dd825bf-3846-4015-bbc8-2430455e3a9a> — this
  file is canonical; the visual renders it (docs/visuals/README.md).
contentHash: 'sha256:b3d7c50dab9bebdc857a179c4159d0e71317b05a255a07712c9b626ce1a671f5'
---
# The Operating Manual — how the day runs (solo runbook, v4)

*Visual companion: <https://claude.ai/code/artifact/9dd825bf-3846-4015-bbc8-2430455e3a9a> —
this file is canonical; the visual renders it (`docs/visuals/README.md`).*

*Rewritten 2026-07-13. The v3 manual grew into a 1,100-line platform spec that taxed every read
and got skipped under pressure — which showed up as burnout from juggling sessions, manual UI
testing as the bottleneck, and rework from skipped planning. v4 keeps only what changes daily
behavior. The agent-design material lives in `AGENT_ANATOMY.md`; the platform-scope design
material (fleet, tracing at scale, eval portfolio, model routing) lives in `PRODUCT_ANATOMY.md`.*

*Ownership rule (2026-07-23, amended 2026-07-25): workflow rules are canonical in global CLAUDE.md
and each repo's AGENTS.md; **procedures** are canonical in the skill that runs them (`/spec`,
`/evidence-packet`, `/verify`), which CLAUDE.md points to rather than restates. Those are the only
copies agents obey. This runbook summarizes them for human use and must never redefine them;
MANUAL.md argues why they work and must never specify them. When a rule changes, CLAUDE.md /
AGENTS.md / the skill changes first; the manuals follow. One rule, one home — a rule stated in two
loaded layers is a bug (Claude 5 context engineering, 2026-07-24).*

## 0. The stack at a glance

Every piece of the harness, one line each. Details: MANUAL.md §6 (doctrine), sections below (use).

| Layer | What it is | Fires |
|---|---|---|
| Global CLAUDE.md | Stance + the receipts-backed rules, thin: fan-out for reads only, rendered-artifact diagrams, Fable-orchestrates model tiering, two-iterations-then-fresh-eyes, bugs-become-eval-cases, gaps never close silently. The spec and packet *procedures* live in skills it points to | Every session |
| `/spec` + `/evidence-packet` | The two extracted procedures: contract → living spec in `docs/specs/` with a rendered diagram; and verify → rubric-scored critic → eval delta → NOT-verified → next contract | Per task, at both ends |
| `/evals` | The eval methodology contract (D1–D8) and its ceremonies: `case` (bug → failing case before the fix), `plan` (eval delta drafted at plan time), `audit`, `bootstrap`. North star over any repo's legacy eval convention | Plan time for LLM-touching work; failure time, before the fix; suite work |
| Per-repo AGENTS.md | Project map, invariants, run/verify commands (CLAUDE.md → `@AGENTS.md`) | Every session in that repo |
| Specs (`docs/specs/`) | Approved plans as living documents, Mermaid-led for multi-module work, committed with the work | Per task |
| Handoffs (`.claude/handoffs/`) | Resumable session state; latest one's next-steps auto-injected at session start | Per session |
| Hooks (6, fail-open) | session-context (briefing in), guard-commit (gate on commit), guard-bash / guard-secrets (catastrophe filters), format-on-edit, notify | Automatically, on their events |
| Gates (`.claude/gate.sh` ×5) | Per-repo fast health check (<120s): tests, validators, guards, anti-cheat | Every `git commit` + nightly |
| Evals (`.claude/evals.sh` + suites) | Per-repo behavior suites held to the `/evals` D8 ops contract (jim: 99 offline cases; M-Clone: routing gate + insights corpus) | Nightly + per task |
| Verify skills (per project) | The agent proving its own work end-to-end (M-Clone: gate + XCTest + eval delta + UI-honesty line) | Before every evidence packet |
| Nightly gate digest | 6:17 launchd (caffeinated): every repo's gate + evals → dated digest → session-start banner | Nightly |
| Weekly proposer | Sunday launchd: mines digests + babysit log + handoffs, files improvement proposals; propose-only | Weekly |
| Subagents (2) | critic (adversarial, self-invoked via /challenge; scores diffs against `skills/evidence-packet/references/diff-vs-spec.md` when handed a rubric), researcher (cited web synthesis) | On demand / self-invoked |
| Skills (24) | Planning, lifecycle, building, meta, cost — see MANUAL.md §6 | Slash or self-invoked |
| Exhaust | BABYSIT_LOG.md, gate-digests/, trial scoreboard, token breakdowns → fuel for /retro and the proposer | Continuous |

**Mental models — clarifications already needed once (2026-07-23), kept so they aren't needed twice:**

- **Evals are a kind of check; gate.sh and evals.sh are time slots.** Code checks (unit tests,
  lint, guards) are deterministic and free → they fit the every-commit slot, which is all
  `gate.sh` is. Behavior checks (the eval suites — scored against a corpus, they move when the
  model or prompt changes) are slow/expensive → they get the nightly slot, which is all
  `evals.sh` is. Placement is cost, not category: a sub-second deterministic eval case may live
  in the gate (jim does this).
- **The digest is the clock, the coverage, and the memory — not just a trigger.** It checks
  repos nobody touched (drift appears without commits: the 07-22 launchd-python failure had
  zero code changes), runs what commits can't afford (simulator suites), and keeps the dated
  trend line that turns "8s → 1919s → 3115s" into an escalation instead of a vibe.
- **`evals.sh` is the nightly's doorknob, not the only door.** In-session, agents run the
  fitting entry point — targeted slices while iterating, the affected suite end-to-end for the
  packet's eval delta. The repo's AGENTS.md "Run / verify" section is where the entry points
  are listed. What a valid run *reports* — rates for LLM-dependent cases, delta vs a committed
  baseline — is defined by the `/evals` contract (D8), not by whatever the runner happens to print.
- **The `/evals` contract is the north star; suites migrate toward it (2026-07-25).** D1–D8:
  programmatic-first, rates-not-booleans with a measured noise floor, calibrated judges,
  holdouts + committed baselines, trajectory grading, refusal-as-pass safety cases, the
  flywheel, the `evals.sh` ops contract. Contract over format — native harnesses (jim-eval,
  XCTest corpora, jsonl + judges) stay, reshaped to report honestly. Each focus repo carries a
  scored audit + ranked migration plan at `docs/evals/2026-07-25-methodology-audit.md`; read it
  before touching that repo's suite. Details live in the skill and
  `docs/evals-and-tracing-summary.md`, not here.
- **AGENTS.md vs CLAUDE.md is naming, not function.** One project instruction file per repo:
  content lives in `AGENTS.md` (the cross-tool standard), and the repo's `CLAUDE.md` is an
  11-byte `@AGENTS.md` pointer so Claude Code auto-loads it. The axis that matters is
  global-vs-project: global `~/.claude/CLAUDE.md` = how *I* work everywhere; repo `AGENTS.md`
  = what *this repo* is, for anyone and any tool. (Different again: `claude/agents/*.md` are
  subagent persona definitions — critic, researcher.)
- **Gates and eval runners never update themselves.** They change only as contracted work with
  receipts (a retro line, an observed failure), and AGENTS.md forbids editing a guard to make
  a failing check pass — anti-cheat watches the test/eval dirs on every commit. What grows
  in-diff automatically is the *suites they run* (bugs-become-cases), never the runners.
- **Known gap, deliberate:** M-Clone's `evals.sh` covers assistant routing only; the insights
  corpus needs the on-device model and is re-run per-session, not nightly. Revisit if the mac
  harness proves headless-safe. (Its 07-25 audit proposes a partial fix: the offline
  `rescore.py --verify` slice is pure Python and could join the nightly today.)

## 1. The outcome

> Ship more accepted product outcomes per unit of human attention, without increasing escaped
> defects, security exposure, rework, or uncontrolled cost.

Human attention is the scarce resource. Every rule below exists to spend less of it per shipped
outcome — a ceremony that stops changing outcomes is a candidate for deletion.

## 2. The task loop — you appear exactly twice

The core failure mode this loop replaces: an agent blocks on you (test this, review this, decide
this), you start another session while waiting, and interrupts stack until the day is pure
supervision. The fix is not juggling better — it is lanes that don't need you in the middle.

```
messy brief → PLAN MODE → SPEC (docs/specs/, diagram-led) → you correct + approve the spec
            → agent implements single-lane + self-verifies (gate, evals, eval delta)
            → adversarial critic review → EVIDENCE PACKET (ends with proposed next contract)
            → you accept/reject — and approving the next spec is the same touch
```

**Touchpoint 1 — spec approval.** Every non-trivial task starts in plan mode. The plan opens
with the three-line contract (Outcome / Non-goals / runnable Acceptance evidence), drafted by
the agent from your messy brief. At approval it is saved to the repo's `docs/specs/` as a
living spec — multi-module work leads with a Mermaid diagram (current → proposed), and you
review the diagram before the prose. High-stakes specs get `/challenge` (the critic) before
you ever see them; the agent self-invokes it. You correct the spec at approval — that
two-minute pass is where misalignment dies, before any code exists. Surviving plan rules: no
time estimates, ever; phases are dense (single digits total); each phase ends at a checkpoint.

**The middle — not your job.** The agent implements in a lane (worktree for anything
delegated), single-lane for writes — subagents fan out only for investigation and review.
Before declaring done it verifies itself: the project's `verify` skill and eval suite whenever
they exist, the build gate always. Two iterations on the same problem with no new hypothesis
means it stops for a fresh-context review instead of arguing with itself. "Done, please test
it" is a malformed result.

**Touchpoint 2 — the evidence packet.** A task ends with:

- The spec cited, and what changed (diff summary, commits, artifact paths).
- Each acceptance check, pass/fail, with the actual command/output.
- The **eval delta** — cases passing before vs. after, added, retired.
- The **critic's verdict** — a fresh-context adversarial review of diff vs. spec.
- Screenshots (web) or run output; the spec's diagram brought to as-built for multi-module diffs.
- The honest **NOT verified** list — each item blocks acceptance or gets your explicit
  "accepted without X" plus a tracked follow-up. Gaps never close silently.
- A **proposed next contract** for the most likely next task.

You review evidence like a PR, on your schedule (PR bodies carry the spec's Mermaid delta, so
merge review starts at the same altitude). Accept, or reject with the specific failing
expectation — and accepting usually doubles as approving the next spec.

## 3. Verification — make the agent the tester

The old bottleneck: you were the human Playwright, and every UI change queued on your eyeballs.
The standing rule is **verification before delegation**: before handing work to a lane, ask
whether the executor can prove it correct without you. If not, the cheapest missing verifier is
part of the task.

- **Web (React/Next.js):** each project gets a `verify` skill — scaffolded once via
  `/setup-verify` — that launches the dev server, reaches a seeded login/test state, drives the
  3–5 flows you used to click through manually (Playwright), and captures screenshots into the
  evidence packet. Spot-check screenshots instead of clicking.
- **Native mobile (iOS/Android):** the verify skill covers what machines can prove — M-Clone's
  runs the fast gate, the full XCTest routing gate on a simulator, and the eval delta — with a
  mandatory **UI-honesty line** naming the screens/flows not exercised. UI eye-checks stay
  manual, deliberately (the Maestro escalation trigger lives in `MANUAL.md` §6's harness backlog).
- **Every repo:** the commit build gate (`.claude/gate.sh`, enforced by guard-commit) stays the
  floor. `git commit --no-verify` remains a deliberate escape hatch; use it only with the reason
  recorded in the commit/handoff.

Green means the checks that ran passed where they ran — scoped evidence, not proof of security,
usefulness, or integration — green means the checks that ran passed where they ran. Scale
extra review to risk tier (`AGENT_ANATOMY.md` §2.1).

## 4. The day

1. **Open briefed.** The SessionStart hook shows git state, the latest digest summary, and the
   last handoff's next steps. Don't start a lane on top of unexplained dirty changes.
2. **Pick one primary outcome** per project-day, written as a result, not an activity. A handoff
   suggests continuity; it does not automatically outrank today's product priority.
3. **WIP ≤ 2 implementation lanes, total, across all projects.** The third thing you want to
   start is a queue entry, not a session. Waiting on a lane is not a reason to open another —
   with self-verifying lanes the wait is short, and notifications (the `notify` hook) ping you
   when a lane finishes or needs input. Watching a token stream is never supervision.
4. **Delegate into worktrees; conduct from artifacts.** Review checkpoints, diffs, and evidence —
   at a checkpoint, require the acceptance checks run and their results, new assumptions or
   spec changes (updated in the spec file, not just said), and the next bounded step. Stop a
   lane that repeats the same failure twice
   with no new hypothesis, drifts from the spec, or approaches a side effect outside its
   authority.
5. **Close every worked repo with `/end-session`** (docs check + handoff). A truthful resumable
   state beats calling partial work done. A fresh session must be able to resume from the repo
   and artifacts alone — chat is transport, not durable state.

## 5. Health signals — react to evidence, not the calendar

The nightly digest (6:17 LaunchAgent, `~/dev/docs/gate-digests/`) runs every focus repo's gate
and eval suite while you sleep. **There is no mandated morning triage.** All green or a known
S3 → start product work. Something red or newly yellow → spend the ten minutes classifying it:

| Severity | Meaning / example | Response |
|---|---|---|
| **S0** | Security exposure, data loss, unauthorized publish/spend/send/delete | Stop; contain; fail closed; it *is* the day's outcome |
| **S1** | Reproducible main-branch or critical-path build failure | Same-day fix; block dependent work only |
| **S2** | Credible, reproducible user-facing regression or route failure | Quarantine the route; investigate within days; unrelated work continues |
| **S3** | Slow-but-correct gate, flaky test, provider incident | Log it; batch into the next retro; product work continues |

Colors are observations; severity is a decision — a gate passing in 917 seconds is S3, not a
broken foundation. **Slow-gate escalation rule:** S3 is not a parking lot. A slow gate that
survives two consecutive retros, or runs at ~5× its budget, gets scheduled work (usually
splitting fast commit checks from nightly checks). Slow commit gates are how `--no-verify`
becomes a habit, and that erodes the control the harness leans on.

When friction burns your time — re-explaining context, hand-verifying something scriptable,
fixing the same tooling problem — add one line to `~/dev/docs/BABYSIT_LOG.md`. Cost observed, not
solution speculated. That log is what makes the retro trigger honest.

## 6. On-trigger ceremonies

**Retro (`/retro`) — when the evidence accumulates, not weekly.** Triggers: the babysit log has
roughly five or more open items; a digest shows repeated red on the same repo; a gate breaches
the slow-gate escalation rule; or a month has passed without one (drift check). Classify each
item into a named failure mode first (victory-declaration bias, context anxiety, one-shotting
overreach, babysat verification, re-explained context — the bucket usually picks the rung),
then convert the top
recurring friction into the cheapest durable fix — `hook < gate.sh line < instruction line <
skill < accept-as-is` — and verify the fix before closing. One material harness improvement per
retro unless an S0/S1 demands more.

**Model requalification — on trigger only** (a relevant release, degrading route evidence, a
repeated escalation pattern, a new task class). Procedure and routing tables: `PRODUCT_ANATOMY.md`
§8, the model control plane.

**Instruction hygiene — as you go.** New invariants land in the repo's `AGENTS.md` as small
scoped deltas; dated guidance gets an expiry; rules better enforced by code become hooks or gate
lines. `AGENTS.md` is a lean map, not a diary.

## 7. Escalation tier — when a task outgrows the loop

| Situation | Reach for |
|---|---|
| Trivial, local, reversible (T0) | Just do it; run the obvious check |
| Unknown feasibility / prototype | `/spike` — one approach, one alternative, kill criteria |
| Ordinary feature (T1) | The task loop above — plan mode + spec is the whole ceremony |
| High-stakes plan worth attacking | `/challenge` (critic subagent) or `/deep-challenge` |
| Architecture, cross-module, high ambiguity (T2) | `/deep-plan`; independent fresh-context review; rollback plan; walk the T2/T3 checklist (`AGENT_ANATOMY.md` §2.2) |
| Irreversible or high-trust actions (T3) | Full checklist + enforced containment + deterministic runtime gate + human approval — see `AGENT_ANATOMY.md` |
| New agent project | `/new-agent` — walk the decisions (`AGENT_ANATOMY.md` §3) |
| Hackathon | `/hack` — compressed anatomy, demo-freeze discipline |

Risk is blast radius, not code size. The deep-* skills currently depend on machine-local paths
and run reliably only on the primary Mac (`MANUAL.md` §6 harness backlog).

**Failure quick-moves:** build gate fails → read the exact check, reproduce, fix or classify —
never reflexive `--no-verify`. Eval regresses → re-run controlled, separate product/provider/
judge/infra causes, inspect transcripts, never delete the inconvenient case. Lane stalls → demand
checkpoint evidence; no new hypothesis after two failures means stop and re-plan, tighten the
contract, or escalate the model deliberately. Incident after release → contain authority, roll
back to last known good, preserve provenance, add the escaped scenario to a verifier.

## 8. Standing cautions

**The public library syncs daily and is default-public** (target: default-private or explicit
public allowlisting, with a preview, provenance, and fast takedown; until then the rules below
are the policy). A saved half-draft in a mirrored tree may publish at the next sync. Mark drafts
`<!-- me2: private -->` (first ten lines) or `site: private` frontmatter *before* first save;
keep career/resume/babysit/secret/personal-data paths behind manifest `deny[]` walls; **sample
the actual public shelf periodically** (the only detection, not just prevention, in this
caution); treat
visibility-automation changes as T3 publication work. Scanning is not proof private content
cannot publish.

**Hooks are conveniences, not walls.** Format/session/notify/secret/bash hooks fail open by
design. A worktree is not a sandbox (`AGENT_ANATOMY.md` §1.3). Runtime authority — spend, send,
publish, delete — always has a deterministic owner (`AGENT_ANATOMY.md` §1.1).

## 9. Is the automation alive?

```bash
launchctl print gui/$(id -u)/com.$(id -un).nightly-gate-digest   # job loaded? last exit code?
ls -la ~/dev/docs/gate-digests/                                   # fresh dated digest = it ran
launchctl kickstart gui/$(id -u)/com.$(id -un).nightly-gate-digest  # force a run now
launchctl bootout gui/$(id -u)/com.$(id -un).nightly-gate-digest    # off
launchctl bootstrap gui/$(id -u) \
  ~/Library/LaunchAgents/com.$(id -un).nightly-gate-digest.plist    # on
```

Asleep at 6:17 → runs on wake; powered off → that day skips. Read the actual digest, not
historical claims. Harness config: `~/dev/agentic-harness`, focus repos in
`~/.config/agentic-harness/repos.txt`.

**Any new unattended run names five parts before it ships:** trigger (what starts it), goal
(a result, not an activity), verifier (the check that grades its output — programmatic first),
stop rule (iteration/budget/wall-clock caps; load-bearing, not hygiene), and memory (what
persists between runs and who may write it). The digest and the Sunday proposer already answer
all five; the next scheduled job answers them in its PR description (why: `MANUAL.md` §5).

## 10. Quick reference

**Runs without you:** nightly gates/evals + digest (caffeinated), session-start briefing,
commit build gate, the self-invoked critic on high-stakes specs, Sunday improvement proposer,
completion/input notifications, fail-open convenience hooks, public library sync (§8 caution).

**You do:** correct + approve the spec (touchpoint 1, diagram first on multi-module work) ·
review the evidence packet and rule on its NOT-verified items (touchpoint 2; accepting usually
approves the next spec) · keep WIP ≤ 2 · classify red digests when they appear · log
babysitting as it happens · close sessions with `/end-session` · run `/retro` when triggered ·
approve or reject Sunday's proposals.

**The monthly test:** did more useful changes reach a verified outcome with less of your
attention, lower rework, and controlled risk? If not — simplify the harness, reduce WIP, improve
verifiers, or change routes. Do not answer a workflow problem by adding agents.

> Useful changes should reach accepted, observable outcomes with less human attention and rework,
> while authority, cost, and failure remain bounded.
