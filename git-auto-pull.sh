# /srv/myproject/git-auto-pull.sh
#!/usr/bin/env bash
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin"   # cron-safe PATH

REPO_DIR="/home/kirk-admin/projects/CSE3311-Project"
BRANCH="main"
LOG="$REPO_DIR/.git-auto-pull.log"
LOCK="$REPO_DIR/.git-auto-pull.lock"

# tiny logger
log() { printf '[%s] %s\n' "$(date -Is)" "$*" >> "$LOG"; }

# Prevent overlapping runs
exec 9>"$LOCK"
flock -n 9 || exit 0

cd "$REPO_DIR"
log "Run started (pid $$)"

git fetch -q origin --prune
LOCAL="$(git rev-parse "$BRANCH")"
REMOTE="$(git rev-parse "origin/$BRANCH")"

if [ "$LOCAL" != "$REMOTE" ]; then
  log "New commits on $BRANCH; pulling…"
  git checkout -q "$BRANCH" || true
  git pull --ff-only origin "$BRANCH" >> "$LOG" 2>&1
  if [ -f docker-compose.yml ] || [ -f docker-compose.yaml ]; then
    log "Updating compose…"
    docker compose build >> "$LOG" 2>&1 || true
    docker compose up -d >> "$LOG" 2>&1 || true
  fi
else
  log "No changes."
fi
