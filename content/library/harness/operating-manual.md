---
title: Operating Manual — a day in the new workflow
collection: harness
source: ~/dev/agentic-harness/docs/OPERATING_MANUAL.md
sourceMtime: '2026-07-09T21:02:14.983Z'
sourceCommit: c48ce56
syncedAt: '2026-07-09'
summary: >-
  Companion to TOPPERCENTWORKFLOW.md (the why) and CLAUDECODEBIBLE.md (the
  reference). This is the hour-by-hour how, written 2026-07-05 against what is
  actually installed. Everything named here exist…
contentHash: 'sha256:8909dad8289dc506da34f0b05cfd9cf006ee02d909e44411e6bfc9fd1772ccf4'
---
# Operating Manual — a day in the new workflow

*Companion to TOP_PERCENT_WORKFLOW.md (the why) and CLAUDE_CODE_BIBLE.md (the reference).
This is the hour-by-hour how, written 2026-07-05 against what is actually installed. Everything
named here exists; nothing is aspirational except where marked HABIT (things only you can do).*

---

## 1. While you slept

You did nothing; this ran anyway:

- **6:17am — nightly gate digest** (LaunchAgent `com.geoandr.nightly-gate-digest`): runs
  `.claude/gate.sh` in each of your focus repos — lint + the full hermetic test suites, 2–9s
  each — plus `.claude/evals.sh` (offline eval suites) where a repo has one. Result:
  `~/dev/docs/gate-digests/<today>.md`. If the laptop was asleep at 6:17, launchd runs it on
  wake instead. You never invoke this.

## 2. Opening the laptop (2 minutes)

Open Claude Code in whatever project you're working on. Before you type anything, the
SessionStart hook has already injected three things into the session:

1. **Git state** — branch, dirty count, last commit.
2. **Gate digest summary** — one status line per repo, with `→ failures/regressions above`
   called out if anything is red (❌ gate) or yellow (🟡 eval regression).
3. **Latest handoff's `## Next steps`** — what yesterday-you decided today-you should do.

**The triage rule, in order:**
- Digest shows ❌ or 🟡 → that IS the first task. Say "investigate the digest failure" — don't
  build on a broken foundation.
- Digest green → start from the handoff's next steps. If you need deeper context than the
  next-steps excerpt, run `/onboard`.
- No handoff (new thread of work) → go to §3.

That's it. No dashboard to visit, no status meeting with yourself — the session opens already
briefed.

## 3. Starting a piece of work — the ladder

Match the ceremony to the stakes; the fastest wrong choice is over-planning small things and
under-planning big ones.

| Situation | Do this |
|---|---|
| Trivial / you know exactly what you want | Just ask. No skill, no ceremony. |
| Prototype, PoC, "can this even work?" | `/spike <brief>` → one approach, one alternative, flat checklist, kill criteria → say "go" |
| Real feature in an existing project | `/plan` (phased, checkpointed) — approve, then execute phase by phase |
| Big/uncertain feature, architecture choice | `/deep-plan` (recon fan-out + competing designs) — or `/challenge` / `/deep-challenge` to pressure-test a decision |
| Brand-new agent project | `/new-agent <name> <one-liner>` — scaffolds the whole convention set; it forces the eleven-question agent anatomy (TOP_PERCENT_WORKFLOW), starting with "what's the gate?" |
| Hackathon | `/hack <idea> <duration>` — demo-first scaffold + T-minus schedule |

**The one question to ask before ANY task** (this is the highest-leverage habit in the whole
system): *"Can the agent verify this without me?"* If the answer is no — no test to run, no
seeded data, no eval case — build that first. It feels slower; it is faster by mid-session,
because the agent self-corrects instead of queueing on your eyeballs.

**And the scoping rule for how much ceremony the verification itself gets (2026-07-08):**
*gate the irreversible; evaluate the reversible.* A blocking deterministic gate is for
money/publication/consent/deletion paths; everything else gets evals + monitoring, not
friction. When choosing eval work, name the layer (L0 verifier tests / L1 offline replay /
L2 live-model graded / L3 production sampling — TOP_PERCENT_WORKFLOW §1).

## 4. During work — conduct, don't type

Your job in the main session is writing **briefs** and reviewing **diffs**, not watching tokens
stream.

- **Two lanes (HABIT — the one unstarted piece).** For anything >30 min, or two independent
  workstreams: keep the main session as conductor, send implementation to a background agent or
  a worktree. A good brief has six parts (sixth added 2026-07-08): the goal, the constraints,
  the files to respect, the exact verify command it must pass (usually `.claude/gate.sh`),
  what "done" means, and **the artifact path** — the file the lane writes its deliverable to
  (report/diff/log). Chat-only output goes stale and invisible; artifacts get reviewed. A vague
  brief is how parallel work becomes rework.
- **Bound every lane at ~2 hours (2026-07-08).** The evidence (RE-Bench): agent advantage is
  front-loaded and erodes over long horizons. Long work = a chain of bounded lanes with your
  review between them, never one long autonomous leash.
- **Long-running things go to background** — test suites, migrations, research agents. You get
  notified on completion; don't idle-wait.
- **Commit whenever a coherent step is done.** You don't run the checks — `git commit` triggers
  the guard-commit hook, which runs that repo's `gate.sh` and blocks the commit with the
  failure output if it's red. Green = it committed, and you *know* lint + the fast suite
  passed. Deliberate override: `git commit --no-verify` (rare; say why in the message).
- **Invisible guardrails you should never think about** (all fail-open): format-on-edit
  auto-formats every file Claude touches; guard-secrets blocks API keys landing in tracked
  files; guard-bash blocks catastrophic commands. If one blocks something legitimate, that's a
  retro item, not a fight.
- **The moment you catch yourself babysitting** — re-explaining a project, hand-verifying
  something scriptable, doing the same dance a third time — one line in
  `~/dev/docs/BABYSIT_LOG.md` (or just say "log this babysit"). Ten seconds now; the retro
  converts it later. This log is the flywheel's intake.
- **Rule of three:** the third time you perform or explain the same procedure, turn it into a
  skill *that session* (project skill in the repo's `.claude/skills/`, or global if it's
  universal). A migration-helper skill like an `add-migration` command is the model: the
  convention self-serves forever after.

## 5. Ending a session (5 minutes)

Run `/end-session` — it chains `/update-docs` (with your approval gate) and `/handoff`. The
handoff's `## Next steps` section is literally what greets you at the next session start. The
five minutes you spend here is why §2 takes two minutes instead of twenty.

If a session revealed something a future agent should know — an invariant, a gotcha, a
convention — it goes in that repo's **AGENTS.md** now, not "someday." One line. Instruction
files are code; re-explanation is a bug. **Add by delta, don't rewrite** (2026-07-08, from
ACE): wholesale rewrites of instruction files degrade accumulated knowledge — add/deprecate
dated lines; save full rewrites for deliberate, diffed occasions.

## 6. Weekly — the retro (30 minutes, HABIT)

Run `/retro` once a week (calendar it — Friday afternoon works). It walks the babysit log, the
week's digests, and recent handoffs; for each friction item it proposes the cheapest permanent
fix (hook < gate line < instruction line < skill < accept), applies approved fixes in-session,
and appends the metric line. Standing agenda when relevant: token-skill consolidation, eval
coverage gaps, whether any slash-only skill should become auto-invocable. Added 2026-07-08,
the reward-hacking sweep: did any eval improve suspiciously fast (overfit to cases, not
better behavior)? has a judge model drifted vs its human-graded anchors? and should any
approval-required action *graduate* to notify-after / autonomous-within-budget on the strength
of its eval streak — or be demoted after an incident?

**This ritual is the difference between a static setup and a compounding one.** Skip it for a
month and the setup is exactly as good as today. Do it weekly and every annoyance you feel is
felt approximately once.

## 7. When something breaks

- **Digest ❌ (gate failure):** a suite broke overnight or a gate rotted. Open the digest file
  (path is in the session banner), see the tail of the failure, fix or delegate the fix. This
  is drift caught within 24h instead of at the worst moment.
- **Digest 🟡 (eval regression):** behavior changed without a test failing — prompt drift,
  model update, data shift. Treat as real: find what moved via the eval run's diff.
- **Commit blocked:** read the gate output in the error — it's the exact failing check. Fix it;
  don't reflex to `--no-verify`.
- **A hook misfires:** all hooks fail open by design, so worst case is a missing convenience,
  not a stuck session. Log it, retro it.

## 8. What improves over time (and how you'll know)

Five compounding loops, each fed by a habit above:

1. **Babysit log shrinks** (fed by §4 logging, converted by §6). Metric: open-item count,
   month over month.
2. **Eval suites grow** — every LLM misbehavior becomes a case in that repo's offline evals,
   run nightly forever. Metric: cases per repo; 🟡 catches that saved you.
3. **Instruction files sharpen** — every re-explanation becomes an AGENTS.md line. Metric: how
   often a fresh session gets something project-specific wrong.
4. **Skills accumulate** — rule of three. Metric: how much of a session is "run the procedure"
   vs re-deriving it.
5. **Gates thicken** — every bug that escapes to runtime earns a gate line or test. Metric:
   digest green-streak length; gate runtime (keep <120s — creep is a retro item).

**The single sentence to grade yourself with monthly:** sessions should increasingly start
with "run the plan" and end with "review the diffs" — and decreasingly contain you explaining,
verifying, or repeating anything.

## 9. Quick reference

**Runs without you:** nightly digest (6:17am) · session banner (every session start) ·
gate-on-commit (every `git commit`) · format/secrets/bash guards (every edit/command).

**You run:** `/spike` `/plan` `/deep-plan` `/challenge` — shaping work · `/hack` `/new-agent` —
starting things · `/onboard` `/end-session` — session bookends · `/retro` — weekly ·
`/token-breakdown-*` — when cost curiosity strikes.

**You maintain by habit:** brief-quality for parallel lanes · babysit log entries · one-line
AGENTS.md updates · the weekly retro · "can the agent verify this?" before starting.

**Daily shape:** 2 min triage → ladder-matched start → conduct in parallel → commit against
gates → 5 min handoff. Weekly: 30 min retro. Monthly: read the metrics in §8.

## 10. Multi-lane mechanics — how "conductor" actually works

There are two modes of parallelism; use both, for different shapes of work.

**Mode A — one session, background agents (start here, zero new mechanics).**
Inside a single Claude Code session, work fans out to background subagents: "spawn an agent to
do X in repo Y, brief: …" — the session keeps working, agents notify on completion. This is
what installed the gates across four repos simultaneously. Best for: research, bounded
implementation tasks, anything in *other* repos than the one you're sitting in. The session is
the conductor; you never leave it.

**Mode B — multiple sessions (the 5-terminal picture).**
Each lane is its own Claude Code session:
- **Different projects:** trivially safe — one terminal/session per repo (your focus four are
  four natural lanes). No coordination needed; each session self-orients from that repo's
  AGENTS.md and handoffs.
- **Same project, multiple features:** worktrees, so lanes can't stomp each other:
  `git worktree add ../my-project--feat-x -b feat-x` then start a session in that directory
  (in the desktop app, new sessions and task chips can start in a fresh worktree directly).
  Each worktree has its own checkout but shares the repo — merge back when the gate is green,
  then `git worktree remove`.

**The lane contract (what makes 5 lanes coordination-cheap instead of chaos):**
1. Every lane starts with a **written brief**: goal, constraints, files to respect, the verify
   command (`.claude/gate.sh`), and what "done" means. If you can't write the brief, the work
   isn't ready to delegate — plan it in the conductor first.
2. Lanes **verify themselves** (gate on commit, tests they can run) — you review diffs, not
   progress.
3. **Touch a lane only when it pings** (input-needed and completion notifications are already
   on) **or at its checkpoint** — never sit and watch a stream. Watching is the anti-pattern
   the whole setup exists to eliminate.
4. Every lane **ends with `/end-session`** so it can be resumed tomorrow by you or re-briefed
   to a fresh session.

**The ramp:** 1 conductor + 1 executor this week. Add a lane only when the current count feels
idle-ish, not heroic. The ceiling isn't Claude — it's your brief-writing and diff-review
bandwidth; most people plateau usefully at 3–5 lanes (e.g., 1 conductor/planning + 2–3
executors + 1 long-running research/background). If lanes are frequently blocked on you, you
have too many lanes or too-vague briefs.

**Where you are most useful (spend your attention here, delegate everything else):** writing
briefs, design/scope judgment calls, reviewing diffs, HITL approvals at gates, and the retro.
If you're typing implementation code in more than one lane at a time, you've become the
bottleneck again.

## 11. The automation — trust, and how to verify

**Nothing is deployed anywhere.** Every piece is local files on this machine, and since
2026-07-07 the harness itself is a git repo — `~/dev/agentic-harness` — with `~/.claude/`
{hooks, skills, agents, CLAUDE.md} symlinked into it (edits are version-controlled; commit
them). Gates stay in each repo's `.claude/`; the digest script runs from the harness repo's
`scripts/`; the schedule is `~/Library/LaunchAgents/com.geoandr.nightly-gate-digest.plist`,
its repo list in `~/.config/agentic-harness/repos.txt`. No server, no cloud, no account.
(Optional later: mirror `gate.sh` as a CI job when repos get GitHub remotes — same file,
second enforcement point.)

**Is the LaunchAgent alive?**
```bash
launchctl print gui/$(id -u)/com.geoandr.nightly-gate-digest   # state, PID, last exit code
ls -la ~/dev/docs/gate-digests/                                 # fresh dated file = it ran
```
**Force a run right now** (exactly the path the 6:17 run takes):
```bash
launchctl kickstart gui/$(id -u)/com.geoandr.nightly-gate-digest
```
**Turn it off / back on:**
```bash
launchctl bootout gui/$(id -u)/com.geoandr.nightly-gate-digest      # off
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.geoandr.nightly-gate-digest.plist  # on
```

**Do you need to leave the machine on? No.** launchd semantics: machine *asleep* at 6:17 → the
job runs at next wake (you'll have a fresh digest by the time you're looking at a session
banner, which reads any digest <48h old). Machine *powered off* → that day's run is skipped;
the next day fires normally. If you ever want it to run at exactly 6:17 regardless:
`sudo pmset repeat wakeorpoweron MTWRFSU 06:15:00` — optional, not needed for the workflow.

## 12. Hackathon mode (added 2026-07-08) — the workflow under an event clock

Everything above still applies, compressed. What changes and what doesn't:

**Kickoff (first 15 minutes).** `/hack <idea> <duration>` — the scaffold now includes a
minimal `.claude/gate.sh` stub and a micro-eval file when an LLM decision sits on the demo
path. The verify-first question survives even here, in its cheapest form: before building a
feature, decide the *one command or click* that proves it works. A hackathon feature you can't
verify in 10 seconds is a feature you'll debug during the pitch.

**Lane shape.** You are the conductor; ~2 bounded lanes max under event pressure. Hackathon
briefs are the same six parts, just shorter — and the artifact rule matters MORE here: a lane
that ships `DEMO_NOTES.md` + a working diff can be merged while you're on stage; a lane whose
result lives in a chat scrollback cannot. Lane checkpoints align to the T-minus schedule
(`/hack` presets), not the 2h default.

**What gets gated at a hackathon:** anything irreversible stays gated — real spend, publishing,
external messages. Guards are already global, so this costs nothing. What does NOT get gated:
code quality, test coverage, lint perfection outside the gate stub — the demo is the verifier
of last resort, and demo-freeze discipline (`/hack` step 5) is the deadline gate.

**The money moment is the gate.** House pitch style: show the deterministic gate *catching a
planted failure* live — judges are tired of happy paths and single-prompt wrappers. A
planted-hallucination rejection on a money-moving agent is the archetype; every fleet agent has
an equivalent. Rehearse the failure case, not just the success case.

**End of day.** `/end-session` still runs — 5 minutes, even exhausted, even if the demo won.
The handoff is what turns a hackathon artifact into a fleet project instead of a dead repo.
Any babysitting you did under pressure is the highest-signal retro intake you'll ever log:
friction that shows up when you're rushed is the friction that actually matters.

## 13. Working as a 2–3 person team (2026-07-08)

Everything above assumes one conductor with background agents. On a 2–3 person build the lane
contract (§10) still holds — the coordination seam just moves from "brief a subagent" to "humans
own lanes against shared, written contracts." What changes:

**Hours 0–2 happen together, at one screen.** Before anyone splits, the team agrees three things:
(1) the use case as one demoable sentence; (2) the **agent anatomy** — the eleven questions in
TOP_PERCENT_WORKFLOW — with every blank either assigned to a lane or deliberately deferred; and
(3) the two contracts that make parallel work merge cleanly: the **data shapes** (what a
Fact/Result/Receipt looks like) and the **gate function signature**. Those two are the API everyone
codes against — get them wrong and integration is a rewrite. You cannot split until the shared
verify command (`gate.sh`) exists; that IS "can the agent verify this without me?" at team scale.

**Then split into ownership lanes, not a task queue.** Three natural lanes for an agent build:
- **Spine (conductor / integrator):** use case, the deterministic gate + verification contract, the
  eval harness skeleton, integration and review. Owns the interfaces the others plug into. On a
  two-person team this lane also carries durability.
- **Capability:** the loop/workflow engine + tool wiring (gather → decide → act).
- **Durability & operability:** state store + resume, the audit/receipt trail, and the one-command
  "run it" demo harness.

**Each person runs the solo playbook inside their lane** — the ladder (§3), conduct-don't-type
(§4), commit against the shared `gate.sh`, bounded ~2h checkpoints. The gate is the referee: green
means a lane's diff is safe to merge without the integrator re-reviewing correctness by hand.

**Coordinate at checkpoints, not continuously** (the §10 rule, applied to humans). A 15-minute
sync at each ~2h checkpoint — "here's my diff, here's the gate output, here's what I need from your
contract" — beats a running chat thread. The integrator merges green lanes and keeps the
end-to-end demo path alive from hour two (the `/hack` "walk the demo path first" rule, owned by the
spine).

**The failure mode to design out:** two people editing the same files. Lanes own *modules*, not
*cross-cutting features*. If two lanes must touch the gate, one owns it and the other requests the
change at a checkpoint. Worktrees (§10 Mode B) are the mechanism when lanes must diverge on the
same repo before merge.

**Roles rotate; the contract doesn't.** Who conducts can change between sessions — the shared data
shapes, gate signature, and `AGENTS.md` invariants are what keep three people (or three fresh
sessions) coherent. That is why the anatomy checklist and instruction files are load-bearing for a
team in a way they aren't solo: they are the team's shared memory.

## 14. The site is the library (added 2026-07-09)

The personal site (`~/dev/me-2`) is the workflow's public face AND your own reading surface —
stop searching Finder; hit ⌘K on the site. Docs stay where they live; the site mirrors them
with provenance, deterministically (no model in the loop).

**What mirrors, daily at 07:00** (`me.library-sync` LaunchAgent → `me-2/scripts/library-sync.sh`,
after the 06:17 digest and the 06:45 ops report): `~/dev/hackathons/*.md`,
`~/dev/docs/{enterprise,personal}/*.md`, `~/dev/multi-agent-docs/` (+ `portfolio/`),
`~/dev/agentic-harness/docs/*.md`, and every fleet repo's `docs/adr/*.md` (derived from the
site's `repo:` registry — a new project entry auto-onboards its ADRs). Everything is
**default-PUBLIC**; the mirror publishes to main behind the curator-grade triple gate
(content check + production build + `content/library/**` scope), parking failures on
`site/library-sync-<date>`.

**Three ways to hide a doc** (precedence: deny wall > in-doc marker > private list):
1. In-doc: `<!-- me2: private -->` in the first 10 lines (or `site: private` frontmatter) —
   travels with the file, beats everything except deny.
2. `cd ~/dev/me-2 && npm run library -- private "~/dev/path/to/doc.md"` (then
   `scripts/publish-visibility.sh` or the ops toggle publishes the takedown).
3. The operator panel at the bottom of `/library` on your machine — PUBLIC/PRIVATE chips and
   the hidden-shelf list; flips commit + push automatically (2026-07-09 flip-autonomy grant).
Hard walls live in `me-2/config/library.manifest.json` `deny[]` (career-prep, resumes,
BABYSIT_LOG, M-Clone). A secrets/PII deny-scan skips hot docs loudly at sync time.

**Autonomy grants (2026-07-09):** the daily sync and the visibility flip both push to main
under deterministic gates — the third and fourth autonomous publishers after the ops report
and the weekly curator. The curator also gained job 4: `/update-about` refreshes the resume
surface's `auto:now` zone on fleet drift, always via PR (voice waits for George).
