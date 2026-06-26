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

## The ops layer ("the city") — and one product

- **The city is the front door.** `/` (route group `app/(city)/`) is a
  drawn San Francisco that keeps real city time (morning/day/evening/
  night) AND real SF weather, over the live fleet board + the shift
  digest. `/v2/ops` is the working dashboard: a status ribbon (what needs
  you now), per-agent **dossier cards**, THE SHIFT LOG, steering. `/v2`
  permanently redirects to `/`. The editorial archive (`app/(site)/`:
  projects, writing, about, method) sits one click behind, **unwrecked** —
  ArchiveIndex/IndexRow, dossier templates, inspect, archive numbering all
  untouched; the reskin only FRAMES.
- **One chrome, everywhere.** Every page wears the shared `CityBar`
  (`components/city/`) — archive void/bone tokens (not indigo), numbered
  nav, the real SF clock + weather + a scene-tint dot — and one
  `CityFooter`. Editorial pages get it via `ContentShell`/`ContentChrome`
  plus a slim horizon strip (a cropped `SfScene`) and a clamped scene
  wash. The city/ops floors add the scene switch + live/recorded chip.
  `app/city.css` (the old v2.css, now global) holds all `.v2-*`/`.sf-*`/
  `.city-*` styles; `globals.css` editorial tokens stay untouched, the
  namespaces are disjoint.
- **Real weather.** `lib/ops/weather.ts` fetches SF conditions from
  open-meteo (no key, cached 15m, degrades to clear) → fog/rain/cloud/
  clear drive the scene via `data-weather`; the bar labels the live
  reading. Fetched in the server shells, so editorial pages became ISR
  (15m) — intended.
- **The shift digest** (`lib/ops/digest.ts`, `scripts/ops-digest.ts`,
  the landing's DigestPanel): "what got done while you slept" — the
  overnight (20:00–06:00 PT) rollup, or the most-recent active shift when
  the night was quiet, always labeled with the true window. `npm run
  ops:digest` prints it for a cron/notification.
- **Ops felt in the archive.** A project dossier whose `repo:` resolves
  in the fleet gets one slim `AgentStrip` (`components/dossier/`) under
  its breadcrumb: state + build/operate/verify summary from the **filed
  report** (`recordedFleet()`, never live polling on a reading page),
  labeled "report filed {stamp}", gated so un-instrumented entries show
  nothing (never a fake zero).
- `lib/ops/` measures everything: sessions from `~/.claude/projects`
  transcripts (resolved from each entry's `repo:` frontmatter, including
  `.claude-worktrees` checkouts), git telemetry from the repos
  themselves. The fleet roster = entries with `repo:` + the site's own
  repo ("The Archive").
- **The labor split is the spine.** Every session's tool calls are
  classified three ways and shown as three lanes: **BUILD** (edits to the
  agent's source — dev work *on* it, neutral), **OPERATE** (the agent
  running its *own* job — invocations of its entrypoints, the agent's
  accent), **VERIFY** (test/check runs, cyan). The operation surface that
  tells operate from build lives in `lib/ops/profiles.ts` — a committed,
  reviewed registry keyed by slug: each agent's `mandate`, `operate[]`
  tokens (a substring + a unit noun per run), `verify[]` tokens, and real
  headline `metrics[]` (sourced from the repo with citations in the
  commit that adds them; gate thresholds flagged `gate`, money `money`).
  **Honesty, enforced:** these agents persist no run output to disk
  in-checkout, so OPERATE counts are INVOCATIONS — copy says "23 ingests"
  / "ran its set pipeline", never "made 23 sets", and cards with operate
  activity carry "runs counted from transcripts — no output recorded on
  disk". `noGitHistory` agents (jim, procurement — no commits) size BUILD
  on transcript edits, never git. Fleet cards show the **whole record**
  (a dossier); the window picker governs only the shift log. Active time
  is inferred (event gaps capped at 5m) and labeled, as are states.
- Live mode exists only on George's machine. The deployed site serves the
  last **filed report** (`data/fleet-snapshot.json`), labeled with its cut
  time. Filing a report is the deploy-update path:
  `npm run ops:snapshot -- 24 --commit --push` cuts, sanitizes, commits
  only the snapshot file (refuses a dirty stage) and pushes; the host
  redeploys and serves it. Sanitization is enforced in
  `sanitizeForRecord` — prompts, prompt-derived titles, repo and file
  paths, patches and steering notes never enter the record; assigned
  titles and measured numbers only. The script commits to whatever branch
  is checked out — run it from the branch you publish from. To file
  automatically at shift change, schedule it with launchd
  (`~/Library/LaunchAgents/me.ops-report.plist` running
  `npm run ops:snapshot -- 24 --commit --push` in this repo at 06:00 PT)
  or any cron equivalent.
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
