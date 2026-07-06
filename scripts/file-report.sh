#!/usr/bin/env bash
# file-report.sh — the fleet files its own morning report.
#
# Scheduled by ~/Library/LaunchAgents/me.ops-report.plist at 06:45, half an
# hour after the nightly gate digest (06:17) so the snapshot it cuts already
# contains the fresh gate/eval results. The pipeline is ops-snapshot's own:
# cut → sanitize (enforced in code) → commit only the snapshot file → push →
# the host redeploys and serves the new record.
#
# Fail-open guards, in keeping with the rest of the automation:
#   - not on main            → skip (file from the branch you publish from;
#                              a feature-branch night just misses one filing)
#   - anything already staged → skip (the data commit must carry data only —
#                              ops-snapshot would refuse anyway; we skip
#                              earlier and quieter)
# A skipped filing is a log line, never a stuck morning.
set -euo pipefail

# launchd runs with a bare PATH — node/npm live in homebrew
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

cd "$(cd "$(dirname "$0")/.." && pwd)"

branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "main" ]; then
  echo "file-report [$(date '+%F %H:%M')]: checkout is on '$branch', not main — skipping today's auto-file."
  exit 0
fi
if [ -n "$(git diff --cached --name-only)" ]; then
  echo "file-report [$(date '+%F %H:%M')]: staged changes present — skipping."
  exit 0
fi

echo "file-report [$(date '+%F %H:%M')]: filing the morning report…"
npm run ops:snapshot -- 24 --commit --push
