# Handoff — site revamp: agentic development workflow (2026-07-24)

**State:** PR #14 open from `site/agentic-workflow-revamp` (9 commits), all gates green.
Spec: `docs/specs/2026-07-23-agentic-workflow-revamp.md` (contract + as-built delta).

## What shipped
- /method fully rewritten around the contract → evidence-packet loop (8 sections); counts measured 2026-07-23 (22 skills · 5 hooks · 5 repos · 98 jim evals · 4 launchd).
- 3 old essays deleted, 5 new ones (you-appear-exactly-twice, evals-are-the-product, loop-engineering, harness-engineering, agent-anatomy); dossier refs/reflection repointed; /writing index deleted (308 → /library), essays shelved in "Working notes and lenses".
- Library: featuredDocs() rewired; featured[] = the two manuals, retitled at source (why vs how).
- m-clone ship dossier + lib/inspect/m-clone.ts + profiles.ts entry; deny wall verified (sync mirrors nothing from M-Clone).
- Curator machinery updated in-diff: update-method SKILL (new spine, repos.txt, manual paths), curate.sh fingerprint (+M-Clone, manual paths), README counts, jim 88→98.
- Critic pass found + fixed: brand leak via file paths in visible UI, jim#system soft anchors, two stale /writing links.

## Next steps (ordered)
1. **Owner: push agentic-harness main** (2 local commits: manual retitles 33e0e89 + runbook codename fix) — the site mirrors already carry the content, but source should be pushed before the next 07:00 library-sync re-syncs from it (sync reads local files, so no breakage either way).
2. Review + merge PR #14 (no self-merge; body carries the Mermaid delta + evidence packet).
3. Post-merge morning: confirm the 06:45 filing puts m-clone on the deployed board; watch Sunday's curator pass over the new /method and the new m-clone dossier (update-project may drift-fire on it — gates should park anything bad on site/auto-curate-*).
4. Carve-out on record: app/(x)/landing11/wall.tsx keeps two dead essay position-map keys (noindex, fallback positions).
