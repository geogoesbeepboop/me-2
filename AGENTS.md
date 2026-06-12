<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# What this repo is

George Andrade-Muñoz's personal site: a living archive of **projects** and
**writing**, distilled from real sibling repos on this machine. Dark,
editorial, one accent color per project. The skim layer reads premium; the
explore layer reaches actual implementation depth.

## Content model

- Entries live in `content/{projects,writing}/*.mdx`. The site grows by
  adding files; archive numbers, cross-links and backlinks are computed at
  build time (`lib/content.ts`).
- Projects carry a **stage**: `bench` (raw, dated update feed, workbench
  look) or `ship` (polished dossier with role/stack/metrics/sections). One
  index at `/projects`, tagged by stage — there are no separate work/lab
  sections anymore (old URLs redirect; never reintroduce `work/` or `lab/`
  ref paths).
- Each project's frontmatter `repo:` points at its source repo on disk.
  That field is the registry for the `update-project` skill — keep it
  accurate, never hardcode repo paths elsewhere.
- `refs:` builds the bidirectional graph; links land at the top of a piece.
  `reflection:` steers a dossier's outro to its paired essay.
- Click-to-inspect: `SystemDeepDive inspect="<slug>"` resolves through
  `lib/inspect/index.ts` to per-project maps keyed by topology node id.

## The ops layer (v2 — "the city")

- `/v2` is the second face of the site: a drawn San Francisco that keeps
  real city time (morning / day / evening / night), over a live fleet
  board. `/v2/ops` is the working dashboard: fleet states, shift report
  with readable diffs, the temporal ledger, steering. v1 (`/`) stays
  canonical; content pages are shared between faces, never forked.
- `lib/ops/` measures everything: sessions from `~/.claude/projects`
  transcripts (resolved from each entry's `repo:` frontmatter, including
  `.claude-worktrees` checkouts), git telemetry from the repos
  themselves. The fleet roster = entries with `repo:` + the site's own
  repo ("The Archive"). States are inferred from transcript activity and
  must stay visibly labeled as inferred.
- Live mode exists only on George's machine. The deployed site serves
  `data/fleet-snapshot.json` — regenerate with `npm run ops:snapshot`,
  review the diff like any content change, commit — labeled RECORDED
  with its cut time. Prompts, patches and steering notes never enter the
  snapshot; titles and measured numbers only.
- Steering notes land in `~/.claude/fleet/steering/<repo basename>/`;
  nothing reads them automatically — repos opt in with the SessionStart
  hook shown in /v2/ops under PROTOCOL.
- The scene (`components/city/SfScene.tsx`) is scenery and may hold muted
  scenery color; the semantic-color doctrine still governs every DATA
  surface (state dots, legends, diffstat bars).

## Editorial doctrine (the part that gets changes rejected)

- **Real data only.** Every number, threshold, run and quote traces to a
  source repo. Representative visuals are allowed only when built from real
  wiring AND labeled as representative in visible text.
- Color is semantic, never decorative — the doctrine block in
  `app/globals.css` defines one meaning per hue. Accent OUTLINE always means
  "the model has no say here — code or a human decides", and every visual
  highlight needs a visible legend.
- No internal jargon in UI copy, no blinking carets, no self-deprecation,
  no filler sections. Landing copy stays durable (no product counts).
- Verbatim code in inspect entries only where the definition IS the story
  (prompts, schemas, gates, thresholds); plumbing gets designed blocks.

## Working on this repo

- Dev server: port 3777 (`.claude/launch.json`).
- `npm run check` validates the content graph (also runs automatically via
  the PostToolUse hook after any content/ or lib/inspect/ edit).
- `npm run new projects|writing "Title"` scaffolds from
  `content/_templates/`.
- Project skills/agents: `/update-project <slug>` syncs an entry from its
  repo (uses the `repo-miner` agent); run the `taste-editor` agent over any
  substantial copy/visual change before finishing.
- George reviews everything: commit on a `site/*` branch, never merge to
  main yourself.
