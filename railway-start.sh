#!/bin/sh
set -e

# Fix volume permissions from the old root-owned deployment
if [ -d "/data/.openclaw" ]; then
  chown -R 1000:1000 /data/.openclaw 2>/dev/null || true
fi
if [ -d "/data/workspace" ]; then
  chown -R 1000:1000 /data/workspace 2>/dev/null || true
fi
if [ -d "/data/.tailscale" ]; then
  chown -R 1000:1000 /data/.tailscale 2>/dev/null || true
fi

# Start gateway as root (old deployment also ran as root).
# The gateway binds to 0.0.0.0 for Railway's HTTP proxy.
exec node /app/openclaw.mjs gateway --allow-unconfigured --bind lan --port "${PORT:-8080}"
