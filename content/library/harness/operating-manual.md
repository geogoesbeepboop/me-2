---
title: Operating Manual — the solo runbook (v4)
collection: harness
source: ~/dev/agentic-harness/docs/OPERATING_MANUAL.md
sourceMtime: '2026-07-14T02:30:51.606Z'
sourceCommit: cd639d2
syncedAt: '2026-07-18'
summary: >-
  Rewritten 2026-07-13. The v3 manual grew into a 1,100-line platform spec that
  taxed every read and got skipped under pressure — which showed up as burnout
  from juggling sessions, manual UI testing …
contentHash: 'sha256:b423e79f7179d0925816f1f762c267560bf15e1c74207b82e8af1fdab3324f56'
---
# Operating Manual — the solo runbook (v4)

*Rewritten 2026-07-13. The v3 manual grew into a 1,100-line platform spec that taxed every read
and got skipped under pressure — which showed up as burnout from juggling sessions, manual UI
testing as the bottleneck, and rework from skipped planning. v4 keeps only what changes daily
behavior. The agent-design material lives in `AGENT_ANATOMY.md`; the deferred platform machinery
and its triggers live in `ROADMAP.md`; the Claude-specific reference is `CLAUDE_CODE_BIBLE.md`.*

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
messy brief → PLAN MODE → you approve the contract → agent implements + self-verifies
                                                   → EVIDENCE PACKET → you accept/reject
```

**Touchpoint 1 — plan approval.** Every non-trivial task starts in plan mode. The plan must open
with the three-line contract, drafted by the agent from your messy brief:

- **Outcome** — the observable result that should become true (a result, not an activity).
- **Non-goals** — what must not be expanded into this task.
- **Acceptance evidence** — the commands, flows, or observations that will prove it, each one
  runnable by the agent.

You correct the contract at approval — that two-minute pass is where misalignment dies, before
any code exists. Plan rules that survive from `/plan` (retired 2026-07-13): no time estimates,
ever; phases are dense (roughly one execution request each, single digits total); each phase ends
at a checkpoint — "run X, confirm Y" or "I need you to decide Z."

**The middle — not your job.** The agent implements in a background lane (worktree for anything
delegated), then runs verification itself before declaring done: the project's `verify` skill for
web flows, build + tests for mobile, the build gate always. "Done, please test it" is a
malformed result.

**Touchpoint 2 — the evidence packet.** A task ends with:

- What changed (diff summary, commits, artifact paths).
- Each acceptance check from the contract, with pass/fail and the actual command/output.
- Screenshots of the driven flows (web) or the run's observable output.
- An honest list of what could **not** be verified and why — flagged, never glossed.

You review evidence like a PR, on your schedule. Accept, or reject with the specific failing
expectation.

## 3. Verification — make the agent the tester

The old bottleneck: you were the human Playwright, and every UI change queued on your eyeballs.
The standing rule is **verification before delegation**: before handing work to a lane, ask
whether the executor can prove it correct without you. If not, the cheapest missing verifier is
part of the task.

- **Web (React/Next.js):** each project gets a `verify` skill — scaffolded once via
  `/setup-verify` — that launches the dev server, reaches a seeded login/test state, drives the
  3–5 flows you used to click through manually (Playwright), and captures screenshots into the
  evidence packet. Spot-check screenshots instead of clicking.
- **Native mobile (iOS/Android):** UI verification stays manual for now — deliberately (see
  `ROADMAP.md` for the escalation trigger). The agent still verifies build + unit tests and says
  plainly that UI was not exercised.
- **Every repo:** the commit build gate (`.claude/gate.sh`, enforced by guard-commit) stays the
  floor. `git commit --no-verify` remains a deliberate escape hatch; use it only with the reason
  recorded in the commit/handoff.

Green means the checks that ran passed where they ran — scoped evidence, not proof of security,
usefulness, or integration (`AGENT_ANATOMY.md` §6). Scale extra review to risk tier
(`AGENT_ANATOMY.md` §3).

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
   contract changes, and the next bounded step. Stop a lane that repeats the same failure twice
   with no new hypothesis, drifts from the contract, or approaches a side effect outside its
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
the slow-gate escalation rule; or a month has passed without one (drift check). Convert the top
recurring friction into the cheapest durable fix — `hook < gate.sh line < instruction line <
skill < accept-as-is` — and verify the fix before closing. One material harness improvement per
retro unless an S0/S1 demands more.

**Model requalification — on trigger only** (a relevant release, degrading route evidence, a
repeated escalation pattern, a new task class). Procedure and routing tables: `ROADMAP.md` §5.

**Instruction hygiene — as you go.** New invariants land in the repo's `AGENTS.md` as small
scoped deltas; dated guidance gets an expiry; rules better enforced by code become hooks or gate
lines. `AGENTS.md` is a lean map, not a diary.

## 7. Escalation tier — when a task outgrows the loop

| Situation | Reach for |
|---|---|
| Trivial, local, reversible (T0) | Just do it; run the obvious check |
| Unknown feasibility / prototype | `/spike` — one approach, one alternative, kill criteria |
| Ordinary feature (T1) | The task loop above — plan mode + contract is the whole ceremony |
| High-stakes plan worth attacking | `/challenge` (critic subagent) or `/deep-challenge` |
| Architecture, cross-module, high ambiguity (T2) | `/deep-plan`; independent fresh-context review; rollback plan; walk the T2/T3 checklist (`AGENT_ANATOMY.md` §3.1) |
| Irreversible or high-trust actions (T3) | Full checklist + enforced containment + deterministic runtime gate + human approval — see `AGENT_ANATOMY.md` |
| New agent project | `/new-agent` — answer the twelve questions (`AGENT_ANATOMY.md` §1) |
| Hackathon | `/hack` — compressed anatomy, demo-freeze discipline |

Risk is blast radius, not code size. The deep-* skills currently depend on machine-local paths
and run reliably only on the primary Mac (`ROADMAP.md` §1.12).

**Failure quick-moves:** build gate fails → read the exact check, reproduce, fix or classify —
never reflexive `--no-verify`. Eval regresses → re-run controlled, separate product/provider/
judge/infra causes, inspect transcripts, never delete the inconvenient case. Lane stalls → demand
checkpoint evidence; no new hypothesis after two failures means stop and re-plan, tighten the
contract, or escalate the model deliberately. Incident after release → contain authority, roll
back to last known good, preserve provenance, add the escaped scenario to a verifier.

## 8. Standing cautions

**The public library syncs daily and is default-public** (target policy is default-private —
`ROADMAP.md` §7). A saved half-draft in a mirrored tree may publish at the next sync. Mark drafts
`<!-- me2: private -->` (first ten lines) or `site: private` frontmatter *before* first save;
keep career/babysit/personal paths behind manifest `deny[]` walls; treat visibility-automation
changes as T3 publication work. Scanning is not proof private content cannot publish.

**Hooks are conveniences, not walls.** Format/session/notify/secret/bash hooks fail open by
design. A worktree is not a sandbox (`AGENT_ANATOMY.md` §8). Runtime authority — spend, send,
publish, delete — always has a deterministic owner (`AGENT_ANATOMY.md` §2).

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

## 10. Quick reference

**Runs without you:** nightly gates/evals + digest, session-start briefing, commit build gate,
completion/input notifications, fail-open convenience hooks, public library sync (§8 caution).

**You do:** approve the contract (touchpoint 1) · review the evidence packet (touchpoint 2) ·
keep WIP ≤ 2 · classify red digests when they appear · log babysitting as it happens · close
sessions with `/end-session` · run `/retro` when triggered.

**The monthly test:** did more useful changes reach a verified outcome with less of your
attention, lower rework, and controlled risk? If not — simplify the harness, reduce WIP, improve
verifiers, or change routes. Do not answer a workflow problem by adding agents.

> Useful changes should reach accepted, observable outcomes with less human attention and rework,
> while authority, cost, and failure remain bounded.
