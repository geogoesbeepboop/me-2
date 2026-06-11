# andrade-muñoz.dev

Personal site for George Andrade-Muñoz — all products, not just agents: a
living archive of projects and writing, fed directly by the docs the
projects already produce. Dark, editorial, one accent color per project.
Projects carry a stage — `ship` (polished dossier) or `bench` (raw, still
moving) — one index instead of separate work/lab sections.

## Signature interaction — "INDEX → DOSSIER"

The archive reads as a flat mono index until touched. Hover/focus inverts a
row, the project's accent bar drops in, and a clipped second layer opens
(thesis + dense metadata); click cuts to the dossier with a full-bleed wipe.
Identical on `/`, `/projects`, `/writing`. Declared in
`components/archive/IndexRow.tsx`; the cut lives in `app/template.tsx`.

Every project dossier also carries a **SystemDeepDive** — a one-click,
full-screen "complete architecture" modal: the full component map (zoomable),
the layers, and the invariants that always hold.

## Stack

- Next.js (App Router) + TypeScript, fully static
- Tailwind v4 — all tokens in the `@theme` block of `app/globals.css`;
  per-project accent colors flow through a `--accent` CSS variable set from
  frontmatter
- framer-motion (entrances, masked reveals, the route cut) ·
  react-three-fiber (the single hero point-field, reduced-motion aware)
- MDX via `next-mdx-remote/rsc` — content is files; the site grows by adding
  files (note: `blockJS: false` is set for local trusted content only)

## N°000 — /method

The meta-dossier: the Claude Code harness (global CLAUDE.md contract, 17
skills, 4 fail-open hooks, critic/researcher subagents, the 6-lens token
meter) documented with the same anatomy as a project — diagram, deep-dive
modal, state machines, terminal trace. Content lives in `content/method.mdx`
(outside the archive graph on purpose); it's reachable from the hero trace,
a pinned N°000 row on the home index, and the footer. When the harness
changes, update that one file.

## The content model

Every file in `content/{projects,writing}` is an entry. Frontmatter `refs:`
declares outbound links (`"projects/grocery-buddy#what-broke"`); `lib/content.ts`
builds the graph and computes backlinks, so "Related" blocks are real and
bidirectional. `reflection:` steers each dossier's outro to its paired essay.
`accent:` and `domain:` give each project its color and field label.
`stage:` sets the posture (`bench` entries keep the workbench look and the
dated update feed; flipping to `ship` switches the same URL to the polished
dossier layout). `repo:` points at the source repo on disk — it's the
registry the `update-project` skill reads.

## Growing the archive (the living-lab loop)

1. Build something; write docs in that repo as usual.
2. `npm run new projects "Project Name"` (or `writing`) — scaffolds a
   pre-filled entry from `content/_templates/`. Or run the
   `/update-project <slug>` skill, which mines the repo and writes the
   update for you.
3. Distill the project's own docs into the entry — real diagrams as
   `ArchitectureDiagram`/`SystemDeepDive` data, real runs as `TerminalLog`
   lines, ADRs as `Decision` blocks, incidents as `WhatBroke`.
4. Add `refs:` to related entries; backlinks appear everywhere automatically.

Artifact library available in every MDX file: `Section` ·
`ArchitectureDiagram` · `SystemDeepDive` · `AgentGraph` · `TerminalLog` ·
`BuildTimeline` · `WhatBroke` · `Decision` · `NextUp` · `Ref` · `Update` ·
`OpenQuestions` · `Bench`.

## Commands

```sh
npm run dev      # local dev
npm run build    # static production build
npm run lint
npm run new      # scaffold a new entry from a template
```

## Accessibility

Semantic landmarks, skip link, visible focus states, keyboard focus triggers
the row reveal, Esc closes the architecture modal, AA contrast, and every
animation honors `prefers-reduced-motion`.
