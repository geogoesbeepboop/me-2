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

## The library (mirrored docs) — added 2026-07-09

- **The stacks, not the collection.** `content/library/<collection>/*.md`
  holds committed mirrors of documents that live elsewhere on disk (idea
  lenses in `~/dev/hackathons`, dossiers in `~/dev/docs/{enterprise,personal}`,
  per-repo `docs/adr`, the harness manuals). Written ONLY by
  `scripts/sync-library.ts` (deterministic, no LLM, idempotent) — **never
  hand-edit a mirror**; edit the source and re-run `npm run sync:library`.
  Provenance frontmatter (`source`, `sourceMtime`, `sourceCommit`,
  `syncedAt`, `contentHash`) is generated; `check-library.mjs` (inside
  `npm run check`) fails on hand-edits, deny violations, or misplacement.
- **Visibility is `config/library.manifest.json`**, precedence
  `deny > in-doc marker > private[] > public (default)`. The in-doc marker
  is `site: private` frontmatter or `<!-- me2: private -->` in the source's
  first 10 lines. An excluded doc never enters `content/library`, so it can
  never reach git or a deploy. The deny-scan (guard-secrets patterns + soft
  PII) skips hot docs loudly.
- **Outside the graph.** Library docs carry no archive numbers and are
  invisible to `allNodes()`/backlinks. Curated `refs:` must never point
  into `library/` (the check enforces resolution); linking INTO the library
  from prose/dossiers is fine. Dossiers list their repo's mirrored ADRs via
  `DecisionNotes` (derived from `repo:` — the registry rule holds).
- **Rendering:** mirrors are foreign text — they render through
  `lib/markdown.tsx` (react-markdown, no raw HTML), never through
  `lib/mdx.tsx` (trusted-content-only). Decision records show their
  `sourceMeta.status` in plain ink.
- **Nav doctrine amendment (2026-07-09):** the CityBar's instrument row
  gained `05 LIBRARY`; the one-row rule stands.

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
  nav, the real SF clock + weather + a scene-tint dot, and NOTHING else:
  the bar is one instrument row. The live/recorded chip (`FeedChip`)
  lives at the fleet board's foot on both floors, and the clock alone
  decides the scene (the scene switch is gone — don't reintroduce
  either into the bar). Editorial pages get the chrome via
  `ContentShell`/`ContentChrome` plus a slim horizon strip (a cropped
  `SfScene`) and a clamped scene wash. `app/city.css` (the old v2.css,
  now global) holds all `.v2-*`/`.sf-*`/`.city-*` styles; `globals.css`
  editorial tokens stay untouched, the namespaces are disjoint.
- **Scroll performance is doctrine.** No `backdrop-filter` anywhere (the
  panels sit on flat void; translucency bought nothing and the blur cost
  every scrolled frame). The scene never uses SVG filter blur — soft
  bodies (fog, clouds) are gradient-filled (`#sf-fogsoft`/`#sf-cloudsoft`);
  a Gaussian blur re-rasterizes every animation frame. `.sf-scene` is
  promoted/contained (`will-change` + `contain`), only a subset of
  stars/bay-lights animate, and the cropped strips (`.city-strip`,
  `.v2-room-strip`) hold a STILL frame — the full scene performs only on
  the front door. Any new always-on animation must justify its frame
  budget.
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
- **The night watch** (`lib/ops/gates.ts`): the fleet's own health runs
  on the board. A LaunchAgent (`com.geoandr.nightly-gate-digest`, 06:17)
  runs each focus repo's `.claude/gate.sh` (lint + hermetic tests) and
  `.claude/evals.sh` (offline eval suites) and writes a dated markdown
  digest to `~/dev/docs/gate-digests/`; `gates.ts` parses those files —
  the site never runs a gate, it reads the record the night left.
  Surfaces: ☾ rows in the shift log (one per digest, expandable to
  per-repo results), a `nightly` line on each agent card, and the
  NightWatchLine under the landing digest. Statuses and durations file
  with the snapshot; failure-log tails are live-only (stripped in
  `sanitizeForRecord`, like patches and prompts). Pass renders in plain
  ink; only failure carries a hue (ember) — per the color doctrine.
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
  paths, patches, steering notes and gate-failure tails never enter the
  record; assigned titles and measured numbers only. **Filing is
  automated and branch-independent:**
  `~/Library/LaunchAgents/me.ops-report.plist` (INSTALLED, 06:45 daily —
  half an hour after the gate digest so the snapshot carries the fresh
  results) runs `scripts/file-report.sh`: measurement happens in this
  checkout (real repo paths and transcripts), but the record publishes
  through a detached worktree pinned to `origin/main`
  (`~/dev/me-2--reports`, auto-created), so the daily filing never
  depends on which branch the operator is working on. Log:
  `~/Library/Logs/me.ops-report.log`; manage with `launchctl
  print|kickstart|bootout gui/$UID/me.ops-report`.
- **Content curates itself weekly (the autonomy decision, 2026-07-06).**
  `~/Library/LaunchAgents/me.curator.plist` (INSTALLED, Sunday 07:15)
  runs `scripts/curate.sh` in the `.claude-worktrees/curator` worktree —
  placed there deliberately so the curator's own sessions appear on the
  ops board and its commits in the shift log; the board is the
  notification. Three jobs behind one set of gates:
  - **Projects** — each entry whose source repo has commits newer than
    its `updated:` date gets a headless `/update-project <slug>`.
  - **Method** — a fingerprint of the real harness (~/.claude skills/
    agents/hooks, LaunchAgents, workflow docs, fleet gate files, state
    in `~/.local/state/me2-curator/`) is compared to last run's; on
    change, headless `/update-method` re-measures the harness and fixes
    every stale number and excerpt on n°000.
  - **Writing** — when a sync actually PUBLISHED project changes, a
    drafting run writes one reflection post and opens a **PR**
    (`site/draft-field-notes-<date>`) — essays are voice, not facts, so
    they wait for George's one-tap review (`WRITING_AUTOPUBLISH=1`
    overrides). Existing posts are timeless and never auto-edited.
  George chose **fully autonomous merge to main** for the fact surfaces
  (projects + method); the counterweight is deterministic: a result
  publishes ONLY if the content check passes, the production build
  passes, and the diff stays inside content/ · lib/inspect/ ·
  lib/ops/profiles.ts. Any gate failing parks the work on
  `site/auto-curate-<date>` instead. No drift → no model run → $0.
  Human sessions still work on `site/*` branches for George's review —
  the autonomy applies to the curator alone. Manual levers:
  `scripts/curate.sh --dry-run` · `CURATE_ONLY=<slug|method>
  scripts/curate.sh`. Log: `~/Library/Logs/me.curator.log`.
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
