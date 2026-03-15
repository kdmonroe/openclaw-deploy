#!/bin/sh
# Fix volume permissions from the old root-owned deployment
if [ -d "/data/.openclaw" ]; then
  chown -R node:node /data/.openclaw 2>/dev/null || true
fi
if [ -d "/data/workspace" ]; then
  chown -R node:node /data/workspace 2>/dev/null || true
fi
if [ -d "/data/.tailscale" ]; then
  chown -R node:node /data/.tailscale 2>/dev/null || true
fi
# Drop to node user and start gateway
exec su -s /bin/sh node -c "node /app/openclaw.mjs gateway --allow-unconfigured --bind lan --port ${PORT:-8080}"
