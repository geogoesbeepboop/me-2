#!/usr/bin/env bash
# curate.sh — the archive maintains its own content.
#
# Scheduled by ~/Library/LaunchAgents/me.curator.plist (Sunday 07:15).
# Three jobs, in one worktree, behind one set of gates:
#
#   PROJECTS — for every entry whose source repo has commits newer than the
#   entry's `updated:` date, run /update-project headless. FACTS → merged
#   straight to main (George's 2026-07-06 autonomy decision), gated
#   deterministically:
#     1. content check passes (node scripts/check-content.mjs)
#     2. production build passes (npm run build)
#     3. diff stays inside content/ · lib/inspect/ · lib/ops/profiles.ts
#   Any gate failing → parked on site/auto-curate-<date>. The model
#   writes; code decides what ships.
#
#   METHOD — a fingerprint of the real harness (~/.claude skills/agents/
#   hooks, LaunchAgents, workflow docs, fleet gate files) is compared to
#   the last run's; on change, /update-method re-measures the harness and
#   fixes every stale number and excerpt. Facts again → same gates, same
#   merge to main. No harness change → no model run → $0.
#
#   WRITING — when a sync actually PUBLISHED project changes, a second
#   headless run drafts a reflection post in the house voice and opens a
#   PR (site/draft-field-notes-<date>). Essays are voice, not facts, so
#   they wait for George's one-tap review — set WRITING_AUTOPUBLISH=1 to
#   override and merge drafts straight to main like everything else.
#
#   ABOUT (added 2026-07-09) — a fingerprint of fleet reality (each entry's
#   status/stage/updated, the roster, the method metrics) is compared to
#   the last run's; on change, /update-about refreshes the auto:now zone
#   of content/about.mdx. About is voice-adjacent → PR
#   (site/auto-about-<date>), never auto-merge.
#
# The worktree lives at .claude-worktrees/curator so the curator's own
# sessions appear on the ops board like any other agent labor. The board
# is the notification.
#
# Usage:
#   scripts/curate.sh                 # full weekly pass
#   scripts/curate.sh --dry-run      # report drift and exit; no model, $0
#   CURATE_ONLY=dj-agent scripts/curate.sh   # force one entry
#   CURATE_ONLY=method scripts/curate.sh     # force the method sync
#   CURATE_ONLY=about scripts/curate.sh      # force the about refresh
#
# Log: ~/Library/Logs/me.curator.log
set -uo pipefail

# launchd runs with a bare PATH — node/npm in homebrew, claude in ~/.local
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

REPO="$(cd "$(dirname "$0")/.." && pwd)"
WT="$REPO/.claude-worktrees/curator"
STATE_DIR="$HOME/.local/state/me2-curator"
DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1
ONLY="${CURATE_ONLY:-}"
log() { echo "curator [$(date '+%F %H:%M')] $*"; }
mkdir -p "$STATE_DIR"

cd "$REPO"
git fetch origin --quiet

# ── PROJECT drift: repo's last commit vs the entry's updated date ──
DRIFTED=()
for f in content/projects/*.mdx; do
  slug="$(basename "$f" .mdx)"
  if [ -n "$ONLY" ] && [ "$slug" != "$ONLY" ]; then continue; fi
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
  if [ -n "$ONLY" ] || [ "$last_commit" -gt "$updated_epoch" ]; then
    DRIFTED+=("$slug")
    log "$slug: drift — repo moved $(git -C "$repo_path" log -1 --format=%as), entry updated ${updated:-never}"
  fi
done

# ── METHOD drift: fingerprint the real harness ──
harness_fingerprint() {
  {
    find "$HOME/.claude/skills" -maxdepth 2 -name SKILL.md 2>/dev/null | sort
    ls -1 "$HOME/.claude/agents" 2>/dev/null
    ls -1 "$HOME/.claude/hooks" 2>/dev/null
    ls -1 "$HOME/Library/LaunchAgents" 2>/dev/null | grep -Ei 'geoandr|^me\.'
    stat -f '%m' "$HOME/dev/agentic-harness/docs/MANUAL.md" "$HOME/dev/agentic-harness/docs/OPERATING_MANUAL.md" 2>/dev/null
    for r in jim-agent grocery-buddy procurement-agent dj-agent M-Clone; do
      ls "$HOME/dev/$r/.claude/gate.sh" "$HOME/dev/$r/.claude/evals.sh" 2>/dev/null
    done
  } | shasum | awk '{print $1}'
}
FP_NOW="$(harness_fingerprint)"
FP_OLD="$(cat "$STATE_DIR/method.fingerprint" 2>/dev/null || true)"
METHOD_DRIFT=0
if [ "$ONLY" = "method" ] || { [ -z "$ONLY" ] && [ "$FP_NOW" != "$FP_OLD" ]; }; then
  METHOD_DRIFT=1
  log "method: harness fingerprint moved (${FP_OLD:0:8}… → ${FP_NOW:0:8}…)"
fi

# ── ABOUT drift: fingerprint fleet reality against the resume surface ──
about_fingerprint() {
  {
    for f in content/projects/*.mdx; do
      basename "$f"
      sed -n 's/^\(status\|stage\|updated\): *//p' "$f"
    done
    sed -n '/^metrics:/,/^sections:/p' content/method.mdx 2>/dev/null
  } | shasum | awk '{print $1}'
}
AB_FP_NOW="$(about_fingerprint)"
AB_FP_OLD="$(cat "$STATE_DIR/about.fingerprint" 2>/dev/null || true)"
ABOUT_DRIFT=0
if [ "$ONLY" = "about" ] || { [ -z "$ONLY" ] && [ "$AB_FP_NOW" != "$AB_FP_OLD" ]; }; then
  ABOUT_DRIFT=1
  log "about: fleet reality moved (${AB_FP_OLD:0:8}… → ${AB_FP_NOW:0:8}…)"
fi

if [ "${#DRIFTED[@]}" -eq 0 ] && [ "$METHOD_DRIFT" -eq 0 ] && [ "$ABOUT_DRIFT" -eq 0 ]; then
  log "no drift anywhere — entries, the method page and /about are current. nothing ran, nothing spent."
  exit 0
fi
if [ "$DRY" -eq 1 ]; then
  [ "${#DRIFTED[@]}" -gt 0 ] && log "dry run — would curate projects: ${DRIFTED[*]}"
  [ "$METHOD_DRIFT" -eq 1 ] && log "dry run — would re-measure the method page"
  [ "$ABOUT_DRIFT" -eq 1 ] && log "dry run — would refresh /about's now zone"
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

HEADLESS_RULES="Headless curator run — no human is watching. Constraints on top of the skill:
- Do NOT start a dev server or eyeball anything; verify with 'node scripts/check-content.mjs' and 'npm run build' only.
- Do NOT ask questions; when unsure, make the editorially conservative choice or leave the passage as it is.
- Touch ONLY content/, lib/inspect/, and lib/ops/profiles.ts — nothing else.
- Do NOT commit or push; the harness gates and commits after you finish."

# ── one headless skill run per drifted entry ──
for slug in "${DRIFTED[@]:-}"; do
  [ -z "$slug" ] && continue
  log "$slug: running /update-project headless…"
  (cd "$WT" && claude -p "/update-project $slug

$HEADLESS_RULES" --permission-mode acceptEdits --allowedTools "Bash") 2>&1 | tail -4
  log "$slug: skill run finished"
done

# ── the method sync, when the harness moved ──
METHOD_RAN=0
if [ "$METHOD_DRIFT" -eq 1 ]; then
  if [ -d "$WT/.claude/skills/update-method" ]; then
    log "method: running /update-method headless…"
    (cd "$WT" && claude -p "/update-method

$HEADLESS_RULES" --permission-mode acceptEdits --allowedTools "Bash") 2>&1 | tail -4
    METHOD_RAN=1
    log "method: skill run finished"
  else
    log "method: /update-method not on main yet — skipping until it merges"
  fi
fi

cd "$WT"
FACTS_CHANGED=1
PUBLISHED=0
if [ -z "$(git status --porcelain)" ]; then
  log "no fact changes — entries and the method page already truthful."
  # a no-op still proves the fingerprint was checked against reality
  [ "$METHOD_RAN" -eq 1 ] && echo "$FP_NOW" > "$STATE_DIR/method.fingerprint"
  FACTS_CHANGED=0
fi

# ── deterministic gates — the code decides what ships ──
if [ "$FACTS_CHANGED" -eq 1 ]; then
SCOPE_OK=1
while IFS= read -r p; do
  case "$p" in
    content/*|lib/inspect/*|lib/ops/profiles.ts) ;;
    *) SCOPE_OK=0; log "OUT OF SCOPE: $p" ;;
  esac
done < <(git status --porcelain | sed 's/^...//; s/^"//; s/"$//')

GATES_OK=1
node scripts/check-content.mjs || { GATES_OK=0; log "content check FAILED"; }
npm run build >/dev/null 2>&1 || { GATES_OK=0; log "production build FAILED"; }

SYNCED="${DRIFTED[*]:-}"
[ "$METHOD_RAN" -eq 1 ] && SYNCED="$SYNCED method"
git add -A
git commit --quiet -m "curator: sync ${SYNCED## } from the machine

Autonomous weekly curation (headless /update-project, /update-method).
Gated by the content check, the production build and the content-scope
allowlist; merged to main per the 2026-07-06 autonomy decision.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"

if [ "$SCOPE_OK" -eq 1 ] && [ "$GATES_OK" -eq 1 ]; then
  if git push origin HEAD:main; then
    PUBLISHED=1
    log "published to main: ${SYNCED## } — the deploy will serve it."
    [ "$METHOD_RAN" -eq 1 ] && echo "$FP_NOW" > "$STATE_DIR/method.fingerprint"
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
fi

# ── WRITING: draft a field-note when a sync actually shipped ──
# Essays are voice, not facts: they go out as a PR for one-tap review.
# WRITING_AUTOPUBLISH=1 merges them straight to main instead.
CHANGED_ENTRIES="$(git diff HEAD~1 --name-only -- content/projects/ 2>/dev/null | tr '\n' ' ')"
if [ "$PUBLISHED" -eq 1 ] && [ -n "${CHANGED_ENTRIES// /}" ] && [ "${WRITING_DRAFTS:-1}" != "0" ]; then
  log "drafting a field note on: $CHANGED_ENTRIES"
  (claude -p "A weekly sync just updated these archive entries: $CHANGED_ENTRIES

Read 'git show HEAD -- content/projects/' to see exactly what changed, read the updated entries in full, and study content/writing/*.mdx for the house voice and frontmatter shape (title, summary, date — today —, thesis, refs).

Then draft ONE new writing entry in content/writing/: a reflection on what this change means — the transferable lesson, not a changelog. House rules: every number and claim traces to the entries or their source repos, no invention, refs point at the project entries it reflects on, confident voice, no self-deprecation. It ships via pull request for George's review, so write it at final quality.

Verify with 'node scripts/check-content.mjs'. Do NOT commit." --permission-mode acceptEdits --allowedTools "Bash") 2>&1 | tail -3
  NEW_POST="$(git status --porcelain content/writing/ | sed -n 's/^?? //p' | head -1)"
  if [ -n "$NEW_POST" ] && node scripts/check-content.mjs && npm run build >/dev/null 2>&1; then
    git add -A
    git commit --quiet -m "curator draft: $(basename "$NEW_POST" .mdx)

Drafted from this week's synced entries ($CHANGED_ENTRIES). Voice piece —
publishes via review, not autonomy, unless WRITING_AUTOPUBLISH=1.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
    if [ "${WRITING_AUTOPUBLISH:-0}" = "1" ]; then
      git push origin HEAD:main && log "field note published to main: $NEW_POST"
    else
      dbranch="site/draft-field-notes-$(date +%Y%m%d)"
      git push -f origin "HEAD:refs/heads/$dbranch"
      gh pr create --base main --head "$dbranch" \
        --title "curator draft: $(basename "$NEW_POST" .mdx)" \
        --body "Drafted autonomously from this week's synced entries ($CHANGED_ENTRIES). Facts are mined; the voice is yours to approve. Merge to publish, close to discard." \
        2>&1 | tail -1
      log "field note drafted → PR opened ($dbranch) for review."
    fi
  else
    log "no publishable draft produced (missing file or gates red) — skipped."
  fi
fi

# ── ABOUT: refresh the resume surface when fleet reality moved ──
# About is voice-adjacent → always a PR, never auto-merge. Runs last so
# it can't be swept into the facts commit; skipped when facts got parked
# (a parked base would drag unreviewed changes into the PR).
if [ "$ABOUT_DRIFT" -eq 1 ] && { [ "$FACTS_CHANGED" -eq 0 ] || [ "$PUBLISHED" -eq 1 ]; }; then
  if [ -d "$WT/.claude/skills/update-about" ]; then
    log "about: running /update-about headless…"
    (cd "$WT" && claude -p "/update-about

Headless curator run — no human is watching. Constraints on top of the skill:
- Touch ONLY content/about.mdx: the {/* auto:now */} fenced zone, and factual frontmatter only when reality clearly moved.
- Never rewrite the voice prose outside the fence.
- Verify with 'node scripts/check-content.mjs'. Do NOT commit." --permission-mode acceptEdits --allowedTools "Bash") 2>&1 | tail -3
    if [ -n "$(git status --porcelain content/about.mdx)" ] \
       && [ -z "$(git status --porcelain | grep -v 'content/about.mdx')" ] \
       && node scripts/check-content.mjs && npm run build >/dev/null 2>&1; then
      git add content/about.mdx
      git commit --quiet -m "curator draft: refresh /about from fleet reality

Drafted autonomously from measured drift (roster/status/method metrics).
Voice-adjacent surface — publishes via review, never autonomy.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
      abranch="site/auto-about-$(date +%Y%m%d)"
      git push -f origin "HEAD:refs/heads/$abranch"
      gh pr create --base main --head "$abranch" \
        --title "curator: refresh /about's now zone" \
        --body "The fleet's reality moved (roster, statuses, or method metrics) — the curator refreshed the auto:now zone of /about to match. The zone is measured facts; the voice around it is untouched. Merge to publish, close to discard." \
        2>&1 | tail -1
      echo "$AB_FP_NOW" > "$STATE_DIR/about.fingerprint"
      log "about refreshed → PR opened ($abranch) for review."
    else
      git checkout -- content/about.mdx 2>/dev/null || true
      log "about: no clean change produced (wrong files or gates red) — skipped."
    fi
  else
    log "about: /update-about not on main yet — skipping until it merges"
  fi
fi
