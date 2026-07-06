#!/usr/bin/env bash
# curate.sh — the archive maintains its own content.
#
# Scheduled by ~/Library/LaunchAgents/me.curator.plist (Sunday 07:15).
# For every project entry whose source repo has commits newer than the
# entry's `updated:` date, run the update-project skill headless in a
# worktree, then — George's explicit 2026-07-06 decision — merge the
# result straight to main, gated deterministically instead of by review:
#
#   1. the content graph check must pass  (node scripts/check-content.mjs)
#   2. the production build must pass     (npm run build)
#   3. the diff must stay inside the content allowlist
#      (content/ · lib/inspect/ · lib/ops/profiles.ts)
#
# Any gate failing → the work is pushed to a site/auto-curate-<date>
# branch instead and logged — it fails open to review, never to publish.
# The model writes; code decides what ships.
#
# The worktree lives at .claude-worktrees/curator, which lib/ops/sessions.ts
# already resolves — so the curator's own sessions appear on the ops board
# as archive labor, and its commits land in the shift log like anyone
# else's. The board is the notification.
#
# Usage:
#   scripts/curate.sh                # detect drift, curate every drifted entry
#   scripts/curate.sh --dry-run     # report drift and exit; no model, $0
#   CURATE_ONLY=dj-agent scripts/curate.sh   # curate one entry regardless
#
# Log: ~/Library/Logs/me.curator.log
set -uo pipefail

# launchd runs with a bare PATH — node/npm in homebrew, claude in ~/.local
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

REPO="$(cd "$(dirname "$0")/.." && pwd)"
WT="$REPO/.claude-worktrees/curator"
DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1
log() { echo "curator [$(date '+%F %H:%M')] $*"; }

cd "$REPO"
git fetch origin --quiet

# ── drift detection: repo's last commit vs the entry's updated date ──
DRIFTED=()
for f in content/projects/*.mdx; do
  slug="$(basename "$f" .mdx)"
  if [ -n "${CURATE_ONLY:-}" ] && [ "$slug" != "$CURATE_ONLY" ]; then continue; fi
  repo_path="$(sed -n 's/^repo: *"\{0,1\}\([^"]*\)"\{0,1\} *$/\1/p' "$f" | head -1)"
  updated="$(sed -n 's/^updated: *"\{0,1\}\([0-9-]*\)"\{0,1\} *$/\1/p' "$f" | head -1)"
  # an entry that's never been re-synced measures from its publish date
  [ -z "$updated" ] && updated="$(sed -n 's/^date: *"\{0,1\}\([0-9-]*\)"\{0,1\} *$/\1/p' "$f" | head -1)"
  [ -z "$repo_path" ] && continue
  [ ! -d "$repo_path" ] && { log "$slug: repo path missing — skipping"; continue; }
  last_commit="$(git -C "$repo_path" log -1 --format=%ct 2>/dev/null || true)"
  if [ -z "$last_commit" ]; then
    log "$slug: repo has no commits — drift undetectable, skipping"
    continue
  fi
  updated_epoch="$(date -j -f "%Y-%m-%d %H:%M:%S" "${updated} 23:59:59" +%s 2>/dev/null || echo 0)"
  if [ -n "${CURATE_ONLY:-}" ] || [ "$last_commit" -gt "$updated_epoch" ]; then
    DRIFTED+=("$slug")
    log "$slug: drift — repo moved $(git -C "$repo_path" log -1 --format=%as), entry updated ${updated:-never}"
  fi
done

if [ "${#DRIFTED[@]}" -eq 0 ]; then
  log "no drift — every entry is current. nothing ran, nothing spent."
  exit 0
fi
if [ "$DRY" -eq 1 ]; then
  log "dry run — would curate: ${DRIFTED[*]}"
  exit 0
fi

# ── the worktree: fresh from main, node_modules shared with this checkout ──
if [ ! -d "$WT" ]; then
  git worktree add --detach "$WT" origin/main
  log "curator worktree created at $WT"
fi
git -C "$WT" reset --hard origin/main --quiet
git -C "$WT" clean -fd --quiet
[ -e "$WT/node_modules" ] || ln -s "$REPO/node_modules" "$WT/node_modules"

# ── one headless skill run per drifted entry ──
for slug in "${DRIFTED[@]}"; do
  log "$slug: running /update-project headless…"
  (
    cd "$WT" && claude -p "/update-project $slug

Headless curator run — no human is watching. Constraints on top of the skill:
- Do NOT start a dev server or eyeball anything; verify with 'node scripts/check-content.mjs' and 'npm run build' only.
- Do NOT ask questions; when unsure, make the editorially conservative choice or leave the passage as it is.
- Touch ONLY content/, lib/inspect/, and lib/ops/profiles.ts — nothing else.
- Do NOT commit or push; the harness gates and commits after you finish." \
      --permission-mode acceptEdits \
      --allowedTools "Bash"
  ) 2>&1 | tail -4
  log "$slug: skill run finished (exit ${PIPESTATUS[0]:-?})"
done

cd "$WT"
if [ -z "$(git status --porcelain)" ]; then
  log "curator made no changes — entries already truthful. nothing to publish."
  exit 0
fi

# ── deterministic gates — the code decides what ships ──
SCOPE_OK=1
while IFS= read -r path; do
  case "$path" in
    content/*|lib/inspect/*|lib/ops/profiles.ts) ;;
    *) SCOPE_OK=0; log "OUT OF SCOPE: $path" ;;
  esac
done < <(git status --porcelain | sed 's/^...//; s/^"//; s/"$//')

GATES_OK=1
node scripts/check-content.mjs || { GATES_OK=0; log "content check FAILED"; }
npm run build >/dev/null 2>&1 || { GATES_OK=0; log "production build FAILED"; }

git add -A
git commit --quiet -m "curator: sync ${DRIFTED[*]} from source repos

Autonomous weekly curation (headless /update-project). Gated by the
content check, the production build and the content-scope allowlist;
merged to main per the 2026-07-06 autonomy decision.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"

if [ "$SCOPE_OK" -eq 1 ] && [ "$GATES_OK" -eq 1 ]; then
  if git push origin HEAD:main; then
    log "published to main: ${DRIFTED[*]} — the deploy will serve it."
  else
    branch="site/auto-curate-$(date +%Y%m%d)"
    git push -f origin "HEAD:refs/heads/$branch"
    log "main push rejected — parked on $branch for review."
  fi
else
  branch="site/auto-curate-$(date +%Y%m%d)"
  git push -f origin "HEAD:refs/heads/$branch"
  log "gates failed (scope=$SCOPE_OK checks=$GATES_OK) — parked on $branch for review."
fi
