#!/usr/bin/env bash
# file-report.sh — the fleet files its own morning report, unconditionally.
#
# Scheduled by ~/Library/LaunchAgents/me.ops-report.plist at 06:45, half an
# hour after the nightly gate digest (06:17) so the snapshot already carries
# the fresh gate/eval results.
#
# Measurement runs in THIS checkout (real repo paths, real transcripts) —
# but the record publishes through a detached worktree pinned to origin/main
# (~/dev/me-2--reports), so filing never depends on which branch the
# operator's checkout happens to be on. The pad is a pure publishing pad:
# nothing builds or runs there; it receives one sanitized JSON file, commits
# it to main, pushes, and the host redeploys.
#
# Failure is fail-open: a rejected push or an asleep machine just means the
# next morning files instead. Log: ~/Library/Logs/me.ops-report.log
set -euo pipefail

# launchd runs with a bare PATH — node/npm live in homebrew
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PAD="$HOME/dev/me-2--reports"
stamp() { date '+%F %H:%M'; }

cd "$REPO"
git fetch origin

# bootstrap the publishing pad on first run
if [ ! -d "$PAD" ]; then
  git worktree add --detach "$PAD" origin/main
  echo "file-report [$(stamp)]: publishing pad created at $PAD"
fi

# the pad always publishes on top of the current main tip; a stray unpushed
# commit or dirty file from a crashed run is discarded — today's cut wins
git -C "$PAD" reset --hard origin/main --quiet

# cut the report HERE (live sources), write it straight into the pad
FLEET_SNAPSHOT_PATH="$PAD/data/fleet-snapshot.json" npm run ops:snapshot -- 24

if [ -z "$(git -C "$PAD" status --porcelain -- data/fleet-snapshot.json)" ]; then
  echo "file-report [$(stamp)]: record unchanged — nothing to file."
  exit 0
fi

git -C "$PAD" add data/fleet-snapshot.json
git -C "$PAD" commit --quiet -m "ops: file the fleet report ($(stamp))"
git -C "$PAD" push origin HEAD:main
echo "file-report [$(stamp)]: filed and pushed — the deploy will serve this report."
