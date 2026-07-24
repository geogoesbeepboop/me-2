---
name: update-method
description: >
  Sync the METHOD page (n°000) from the real harness on this machine. Use
  when the harness changes — skills added or removed, hooks, subagents,
  LaunchAgents, gate/eval conventions, workflow docs — or when the weekly
  curator detects harness drift. Every count and excerpt is measured from
  ~/.claude and the automation scripts; nothing is invented.
---

# update-method

Sync `content/method.mdx` and `lib/inspect/method.ts` with the harness as it
actually exists on this machine. The method page's authority is that it never
disagrees with the machine — this skill is how that stays true.

## 0 · Resolve the subject

Read `content/method.mdx` (frontmatter metrics + every numeric claim in the
prose and diagram subs) and `lib/inspect/method.ts` (verbatim excerpts).

## 1 · Measure the harness (run these, don't estimate)

- **Skills:** `find ~/.claude/skills -maxdepth 2 -name SKILL.md | wc -l` —
  the "N skills" figure. Token lenses: how many of those match
  `token-breakdown`.
- **Subagents:** `ls ~/.claude/agents/*.md`.
- **Hooks:** read the hooks block of `~/.claude/settings.json`; count the
  distinct hook scripts actually wired (guard-bash, guard-secrets,
  format-on-edit, session-context, guard-commit, …).
- **LaunchAgents:** `ls ~/Library/LaunchAgents | grep -Ei 'geoandr|^me\.'` —
  the "launchd agents running the loop" figure.
- **Fleet conventions:** the repo list is
  `~/.config/agentic-harness/repos.txt` (currently jim-agent, grocery-buddy,
  procurement-agent, dj-agent, M-Clone) — for each: does `.claude/gate.sh`
  exist and is it executable? `.claude/evals.sh`? That's the "repos gated"
  figure.
- **Eval cases:** count by importing, never by grepping constructors (they
  span lines): `cd ~/dev/jim-agent && .venv/bin/python -c "from
  jim.eval.dataset import GATE_REGRESSION; from jim.eval.dataset_guards
  import GUARD_CASES; from jim.eval.scenarios import SCENARIOS;
  print(len(GATE_REGRESSION)+len(GUARD_CASES)+len(SCENARIOS))"`. If not
  cheaply derivable, leave the existing figure and say so in the summary.
- **Workflow docs:** `~/dev/agentic-harness/docs/MANUAL.md` (doctrine) and
  `~/dev/agentic-harness/docs/OPERATING_MANUAL.md` (runbook) — skim for
  conventions the page doesn't yet describe (new rituals, changed cadences).
  These are also mirrored on /library; the manifest features exactly these
  two.

## 2 · Update the page

- Fix every stale number **everywhere it appears**: frontmatter `metrics`,
  the summary line, the deep-dive node subs ("21 front doors", "5 guards"),
  and the `layers` notes ("Twenty-one front doors…", "Five hooks…"). A
  number that appears in three places changes in three places.
- The page is organized around the task loop (WHILE I SLEPT → the contract →
  you appear exactly twice → evidence, not vibes → evals from reality →
  loop engineering → the self-improving system → the machine). Its UI
  surfaces carry the facts: the night-shift `TerminalLog` quotes a real
  morning's digest (keep it a verbatim recent run); the contract
  `TerminalLog` quotes the three lines of a real spec in `docs/specs/`; the
  `Ladder` rungs are the real skill front doors — a new shaping/starter
  skill gets a rung, a retired one loses it (token lenses and session
  bookends don't get rungs); the task-loop, commit-flow, and flywheel
  `ArchitectureDiagram`s name real hooks, files, and gates.
- If a harness component was added/removed (a new hook, a new LaunchAgent,
  a retired skill family), update the deep-dive topology and the relevant
  section — smallest truthful edit, never a rewrite.
- Refresh `lib/inspect/method.ts` excerpts that no longer match their
  source files. Merged chunks hold tabbed `files` (skills · rim · memory ·
  fleet · night) — diff each tab's excerpt against the file its `path:`
  names. Excerpts stay trimmed to the definition-is-the-story lines.

## 3 · Editorial rules (non-negotiable)

- Never invent. Every figure traces to a command you ran or a file you read.
- Only touch what actually changed — a no-op sync makes no edits.
- No internal jargon in visible copy; the voice of the page is already set,
  match it.

## 4 · Verify

1. `node scripts/check-content.mjs`
2. `npm run build`
3. Summarize: each figure that changed (old → new, with the command that
   measured it), and anything you chose NOT to surface.
