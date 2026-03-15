#!/bin/bash
# VPS Skills Sync Script
# Syncs skills between ~/.openclaw/skills and the GitHub repo
# Designed to run on Railway VPS via cron or manual trigger

set -euo pipefail

SKILLS_DIR="${OPENCLAW_SKILLS_DIR:-$HOME/.openclaw/skills}"
REPO_URL="${OPENCLAW_REPO_URL:-https://github.com/kdmonroe/openclaw-deploy.git}"
LOG_FILE="${OPENCLAW_SYNC_LOG:-$HOME/.openclaw/logs/skills-sync.log}"
BRANCH="${OPENCLAW_SYNC_BRANCH:-main}"

log() {
  local msg="[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $*"
  echo "$msg"
  mkdir -p "$(dirname "$LOG_FILE")"
  echo "$msg" >> "$LOG_FILE"
}

error_exit() {
  log "ERROR: $*"
  exit 1
}

# Ensure git is configured for commits
setup_git() {
  if ! git config user.email &>/dev/null; then
    git config user.email "vps-sync@openclaw.local"
  fi
  if ! git config user.name &>/dev/null; then
    git config user.name "OpenClaw VPS Sync"
  fi
}

# Initialize skills directory as git repo if needed
init_skills_repo() {
  mkdir -p "$SKILLS_DIR"
  cd "$SKILLS_DIR"

  if [[ ! -d "$SKILLS_DIR/.git" ]]; then
    log "Initializing skills directory as git repo..."
    git init
    git remote add origin "$REPO_URL" || true
  fi

  # Ensure remote URL is current
  git remote set-url origin "$REPO_URL" 2>/dev/null || git remote add origin "$REPO_URL"
  git fetch origin "$BRANCH" || { log "ERROR: fetch failed"; return 1; }

  # If HEAD is invalid (no commits yet), reset to origin/BRANCH to bootstrap
  if ! git rev-parse HEAD &>/dev/null; then
    log "No valid HEAD — bootstrapping from origin/$BRANCH..."
    git reset "origin/$BRANCH"
    git checkout -- . 2>/dev/null || true
  fi
}

# Main sync logic
sync_skills() {
  log "Starting skills sync..."
  
  cd "$SKILLS_DIR" || error_exit "Skills directory not found: $SKILLS_DIR"
  setup_git
  
  # Fetch latest from remote
  log "Fetching from origin/$BRANCH..."
  git fetch origin "$BRANCH" || error_exit "Failed to fetch from origin"

  # If HEAD is still invalid after init, hard-reset to origin (first sync)
  if ! git rev-parse HEAD &>/dev/null; then
    log "No HEAD — performing initial reset to origin/$BRANCH..."
    git reset "origin/$BRANCH"
    git checkout -- . 2>/dev/null || true
    log "Initial sync complete"
    return 0
  fi

  # Check for local changes
  local has_local_changes=false
  if ! git diff --quiet HEAD 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
    has_local_changes=true
    log "Local changes detected, stashing..."
    git stash push -m "auto-stash-$(date +%Y%m%d-%H%M%S)" || true
  fi

  # Rebase onto latest
  log "Rebasing onto origin/$BRANCH..."
  if ! git rebase "origin/$BRANCH"; then
    log "Rebase failed, aborting..."
    git rebase --abort || true
    if [[ "$has_local_changes" == "true" ]]; then
      git stash pop || true
    fi
    # Fall back to hard reset instead of failing entirely
    log "Falling back to hard reset..."
    git reset --hard "origin/$BRANCH"
    return 0
  fi

  # Pop stash if we had local changes
  if [[ "$has_local_changes" == "true" ]]; then
    log "Restoring local changes..."
    git stash pop || log "Warning: stash pop failed (may be empty)"
  fi
  
  # Stage any new/modified files
  git add -A
  
  # Commit if there are changes
  if ! git diff --cached --quiet; then
    local commit_msg="VPS skills sync $(date -u '+%Y-%m-%d %H:%M UTC')"
    log "Committing changes: $commit_msg"
    git commit -m "$commit_msg"
    
    # Push to remote
    log "Pushing to origin/$BRANCH..."
    git push origin "$BRANCH" || error_exit "Failed to push to origin"
    log "Sync complete - changes pushed"
  else
    log "Sync complete - no changes to push"
  fi
}

# Entry point
main() {
  log "=== VPS Skills Sync Started ==="
  init_skills_repo
  sync_skills
  log "=== VPS Skills Sync Finished ==="
}

main "$@"
