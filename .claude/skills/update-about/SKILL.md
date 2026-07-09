---
name: update-about
description: >
  Refresh /about's factual "now" zone from fleet reality. Use when the
  curator detects roster/status/method drift, or when George says "update
  the about page". Edits ONLY the auto:now fenced zone (and, rarely,
  factual frontmatter) of content/about.mdx — the voice prose is George's
  and is never rewritten.
---

# update-about

`content/about.mdx` is the person, not the fleet. The prose voice is
George's — this skill NEVER rewrites it. What this skill owns is the zone
between `{/* auto:now … */}` and `{/* /auto:now */}`: a short, factual
"what I'm building now" passage that should always match measured reality.

## 1 · Measure (every number traces to one of these)

- **Roster + stages:** `content/projects/*.mdx` frontmatter — count the
  entries, note `status` and `stage`, name what's `LIVE`.
- **The method's headline numbers:** `content/method.mdx` frontmatter
  `metrics`.
- **The library:** `find content/library -name '*.md' | wc -l` mirrored
  docs across the collections in `config/library.manifest.json`.
- **The automations:** the `me.*` LaunchAgents named in AGENTS.md (ops
  report daily, library sync daily, curator weekly).

No invention, no rounding up, no adjectives doing a number's job.

## 2 · Rewrite the zone

Between the markers, 1–3 sentences in George's register — confident,
concrete, no self-deprecation, no internal jargon. What the fleet is right
now, what's live, and what the site itself does (measures the fleet, files
its own reports, mirrors the library). Use one or two real counts, not a
dashboard. Keep the `**Now:**` lead.

## 3 · Frontmatter facts — rarely

Only when reality clearly moved and the change is stated somewhere real
(a repo, an entry): `work[]`, `location`. When in doubt, leave it.

## 4 · Verify

`node scripts/check-content.mjs` passes and `content/about.mdx` is the
ONLY modified file. Do not commit — the curator gates and commits.
