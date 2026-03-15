#!/bin/bash
# Local Skills Sync Script
# Triggers skills sync on Railway VPS via SSH
# Run from local machine to sync skills bidirectionally

set -euo pipefail

RAILWAY_SERVICE="${RAILWAY_SERVICE:-}"
SYNC_SCRIPT="/app/scripts/vps-skills-sync.sh"

usage() {
  cat <<EOF
Usage: $0 [options]

Sync skills between GitHub repo and Railway VPS.

Options:
  --push       Push local skills to VPS (git push first, then trigger VPS pull)
  --pull       Pull VPS skills to local (trigger VPS push first, then git pull)
  --status     Check sync status on VPS
  -h, --help   Show this help

Environment:
  RAILWAY_SERVICE   Railway service name (optional, uses default if not set)

Examples:
  $0 --push      # Push local changes to VPS
  $0 --pull      # Pull VPS changes to local
  $0 --status    # Check VPS sync status
EOF
}

check_railway() {
  if ! command -v railway &>/dev/null; then
    echo "Error: railway CLI not found. Install with: npm i -g @railway/cli"
    exit 1
  fi
}

run_on_vps() {
  local cmd="$1"
  echo "Running on VPS: $cmd"
  if [[ -n "$RAILWAY_SERVICE" ]]; then
    railway run --service "$RAILWAY_SERVICE" -- bash -c "$cmd"
  else
    railway run -- bash -c "$cmd"
  fi
}

do_push() {
  echo "=== Pushing local skills to VPS ==="
  
  # First, commit and push any local changes
  echo "1. Pushing local git changes..."
  git add skills/
  if ! git diff --cached --quiet; then
    git commit -m "Skills update $(date '+%Y-%m-%d %H:%M')"
  fi
  git push origin main
  
  # Then trigger VPS to pull
  echo "2. Triggering VPS pull..."
  run_on_vps "$SYNC_SCRIPT"
  
  echo "=== Push complete ==="
}

do_pull() {
  echo "=== Pulling VPS skills to local ==="
  
  # First, trigger VPS to push its changes
  echo "1. Triggering VPS push..."
  run_on_vps "$SYNC_SCRIPT"
  
  # Then pull locally
  echo "2. Pulling to local..."
  git pull origin main
  
  echo "=== Pull complete ==="
}

do_status() {
  echo "=== VPS Sync Status ==="
  run_on_vps "cat ~/.openclaw/logs/skills-sync.log | tail -20 2>/dev/null || echo 'No sync log found'"
}

main() {
  check_railway
  
  case "${1:-}" in
    --push)
      do_push
      ;;
    --pull)
      do_pull
      ;;
    --status)
      do_status
      ;;
    -h|--help)
      usage
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"
