#!/usr/bin/env bash
# publish-visibility.sh — commit + push a visibility flip, nothing else.
#
# Called by the ops route (and usable by hand) after lib/library-admin.ts
# has edited config/library.manifest.json and re-run the sync. The scope
# is a hard wall: only the manifest and content/library may ride this
# commit — anything else staged aborts the run. The content check gates
# it; there is deliberately NO build gate (a manifest edit plus a mirror
# add/delete cannot break the build — curated content may never reference
# library paths) because a private-flip is a takedown and minutes matter
# (autonomy granted by George, 2026-07-09).
#
# Usage: scripts/publish-visibility.sh "<summary, e.g. ~/dev/x.md → private>"
#        NO_PUSH=1 …  # commit locally, skip the push (testing / offline)
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

REPO="$(cd "$(dirname "$0")/.." && pwd)"
SUMMARY="${1:-visibility flip}"
cd "$REPO"

# never sweep someone's in-progress commit along
if [ -n "$(git diff --cached --name-only)" ]; then
  echo "publish-visibility: staging area not empty — finish or unstage that work first" >&2
  exit 1
fi

git add config/library.manifest.json content/library

STAGED="$(git diff --cached --name-only)"
if [ -z "$STAGED" ]; then
  echo "publish-visibility: nothing to publish — flip made no repo change"
  exit 0
fi
while IFS= read -r p; do
  case "$p" in
    config/library.manifest.json|content/library/*) ;;
    *)
      echo "publish-visibility: OUT OF SCOPE staged path: $p — aborting" >&2
      git reset --quiet
      exit 1
      ;;
  esac
done <<< "$STAGED"

node scripts/check-content.mjs || {
  echo "publish-visibility: content check failed — flip staged locally, not committed" >&2
  git reset --quiet
  exit 1
}

git commit --quiet -m "ops: library visibility — ${SUMMARY}

Operator flip via the library toggle (CLI or ops surface). Scope-bounded
to the manifest + mirrors, content-check gated; pushes straight to main
per the 2026-07-09 flip-autonomy decision.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"

if [ "${NO_PUSH:-0}" = "1" ]; then
  echo "publish-visibility: committed locally (NO_PUSH=1) — '${SUMMARY}'"
elif git push origin HEAD:main; then
  echo "publish-visibility: pushed — the deploy will reflect '${SUMMARY}'"
else
  echo "publish-visibility: push rejected — commit is local; pull/rebase then push" >&2
  exit 1
fi
