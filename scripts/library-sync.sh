#!/usr/bin/env bash
# library-sync.sh — the stacks mirror themselves, daily.
#
# Scheduled by ~/Library/LaunchAgents/me.library-sync.plist at 07:00 —
# after the gate digest (06:17) and the ops report (06:45), so the
# morning's publishing rhythm is digest → report → library.
#
# Publishes through its own detached worktree pinned to origin/main
# (~/dev/me-2--library): separate from the reports pad so the two daily
# automations can never race, and pinned to MERGED main because the
# manifest that governs what may publish is the merged one. The sync runs
# IN the pad (manifest + projects registry read from main); sources are
# absolute ~/dev paths, so where the code runs doesn't change what it reads.
#
# Autonomy (George, 2026-07-09): pushes straight to main behind the same
# deterministic triple gate the curator earned —
#   1. content check (node scripts/check-content.mjs — includes the
#      library integrity check)
#   2. production build (npm run build)
#   3. diff scope: content/library/** only
# Any gate red → parked on site/library-sync-<date>. No model in the loop;
# the mirror is a copy, not a judgment. Log: ~/Library/Logs/me.library-sync.log
set -euo pipefail

# launchd runs with a bare PATH — node/npm live in homebrew
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PAD="$HOME/dev/me-2--library"
stamp() { date '+%F %H:%M'; }
log() { echo "library-sync [$(stamp)] $*"; }

cd "$REPO"
git fetch origin --quiet

if [ ! -d "$PAD" ]; then
  git worktree add --detach "$PAD" origin/main
  log "publishing pad created at $PAD"
fi
git -C "$PAD" reset --hard origin/main --quiet
git -C "$PAD" clean -fd --quiet
[ -e "$PAD/node_modules" ] || ln -s "$REPO/node_modules" "$PAD/node_modules"

# the sync itself — deterministic, no model, no key
(cd "$PAD" && ./node_modules/.bin/tsx scripts/sync-library.ts)

if [ -z "$(git -C "$PAD" status --porcelain)" ]; then
  log "no source moved — mirrors already current. nothing to publish."
  exit 0
fi

# ── the triple gate — code decides what ships ──
SCOPE_OK=1
while IFS= read -r p; do
  case "$p" in
    content/library/*) ;;
    *) SCOPE_OK=0; log "OUT OF SCOPE: $p" ;;
  esac
done < <(git -C "$PAD" status --porcelain | sed 's/^...//; s/^"//; s/"$//')

GATES_OK=1
(cd "$PAD" && node scripts/check-content.mjs) || { GATES_OK=0; log "content check FAILED"; }
(cd "$PAD" && npm run build >/dev/null 2>&1) || { GATES_OK=0; log "production build FAILED"; }

git -C "$PAD" add content/library
git -C "$PAD" commit --quiet -m "library: mirror the stacks ($(stamp))

Daily deterministic sync (scripts/sync-library.ts) — sources moved on
disk, mirrors follow. Gated by the content check, the production build
and the content/library scope allowlist; merged to main per the
2026-07-09 sync-autonomy decision.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"

if [ "$SCOPE_OK" -eq 1 ] && [ "$GATES_OK" -eq 1 ]; then
  if git -C "$PAD" push origin HEAD:main; then
    log "published to main — the deploy will serve the fresh stacks."
  else
    branch="site/library-sync-$(date +%Y%m%d)"
    git -C "$PAD" push -f origin "HEAD:refs/heads/$branch"
    log "main push rejected — parked on $branch for review."
  fi
else
  branch="site/library-sync-$(date +%Y%m%d)"
  git -C "$PAD" push -f origin "HEAD:refs/heads/$branch"
  log "gates failed (scope=$SCOPE_OK checks=$GATES_OK) — parked on $branch for review."
fi
