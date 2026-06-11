---
name: update-project
description: >
  Sync a project's site entry from its source repo. Use when the user says
  "update-project <slug>", "sync <project> to the site", "I made changes to
  <project>, update the site", or after substantial changes land in a sibling
  project repo. Mines the repo's current branch (docs, ADRs, git log, tests),
  updates the entry's frontmatter/bench/updates, refreshes the deep-dive and
  inspect files if the architecture moved, and optionally drafts a writing
  post. Also handles onboarding a brand-new project onto the site.
---

# update-project

Sync `content/projects/<slug>.mdx` (and its `lib/inspect/<slug>.ts`) from the
project's source repo, on whatever branch that repo currently has checked out.

**Input:** a project slug (e.g. `dj-agent`), plus optional `--writing` to also
draft a writing post from the update.

## 0 · Resolve the entry

- The entry is `content/projects/<slug>.mdx`. Its frontmatter `repo:` field is
  the source-repo path — that's the registry; never hardcode repo locations.
- **Entry missing?** This is an onboarding run: ask for the repo path, then
  `npm run new projects "<Title>"`, fill `repo:`, pick an unused accent that
  fits the color doctrine (`app/globals.css` `@theme` block — the accent is
  the project's dominant real-world domain), and continue below as if
  everything changed.

## 1 · Mine the repo (current branch — do not switch branches)

Launch the `repo-miner` agent (`.claude/agents/repo-miner.md`) with:
the repo path, the entry's `updated:` date, and the current entry body
(so it knows what the site already says). It returns new facts since that
date: commits, ADRs, docs changes, test counts, new/removed modules,
threshold/schema changes — every fact with a file path, verbatim where the
definition is the story.

## 2 · Update the entry

Work top-down; touch only what actually changed:

- **Frontmatter:** bump `updated:` to today. Adjust `status:` only if the
  repo's real state changed (LIVE / SHIPPED / SPINE PROVEN…). If the project
  graduated to polished-and-done, flip `stage: bench` → `ship` and add the
  ship fields (thesis, role, stack, timeline, metrics, sections) — see
  `content/_templates/project.mdx` for the shape.
- **Bench rows / metrics:** refresh numbers (test counts, phases, gates) to
  the repo's current truth.
- **Prepend an `<Update date="YYYY.MM.DD" title="…">`** distilling what
  landed — dated today, newest first. Honest prose, the why included.
- **Architecture moved?** Update the `SystemDeepDive` nodes/edges/state
  machines in the entry, and re-mine `lib/inspect/<slug>.ts` — inspect
  entries quote the repo **verbatim** (excerpts) or render designed blocks
  built strictly from real wiring. Drop inspect entries for deleted modules.
- **Open questions:** retire any the update answered; add new real ones.

## 3 · Editorial rules (non-negotiable)

- **Never invent content.** Every number, threshold, name, and quote comes
  from the repo. No imaginary runs, no rounded-for-effect figures.
- A **representative visual** (e.g. `SetConsole`) is allowed only when built
  from real wiring AND labeled as representative in visible text.
- Plain language in UI copy — no internal jargon (users never see "nodes").
- Code earns click-to-inspect only when the definition IS the story
  (prompts, schemas, gates, thresholds); plumbing gets designed blocks or
  nothing.
- Refs (`refs:` / `<Ref>`) point at entries that genuinely relate; anchors
  may exist in frontmatter but links land at the top of a piece.
- Voice: confident, concrete, no self-deprecation. "Build fast, adapt
  faster."

## 4 · Optional writing insert

If the user passed `--writing` (or asks): scaffold with
`npm run new writing "<Title>"`, draft from the mined material — the
transferable lesson, not a changelog — add `refs:` both ways (the new post
references the project; consider pointing the project's `reflection:` at it
if it's now the best companion piece). Mark clearly that it's a draft for
George's review.

## 5 · Verify

1. `node scripts/check-content.mjs` — graph and frontmatter validation.
2. `npm run build` — must pass.
3. Start the dev server (port 3777, `.claude/launch.json`) and eyeball the
   entry — especially any visual you touched.
4. Summarize what changed in the entry vs. what changed in the repo, and
   flag anything you chose NOT to surface (so George can overrule).
