#!/bin/sh
set -e

# Fix volume permissions from the old root-owned deployment.
# This runs as root; we exec as node at the end.
echo "[railway-start] Fixing volume permissions..."
chown -R 1000:1000 /data/.openclaw 2>/dev/null || true
chown -R 1000:1000 /data/workspace 2>/dev/null || true
chown -R 1000:1000 /data/.tailscale 2>/dev/null || true

echo "[railway-start] Starting gateway on port ${PORT:-8080}..."
# Use gosu or su-exec if available, otherwise exec with su
if command -v gosu >/dev/null 2>&1; then
  exec gosu node node /app/openclaw.mjs gateway --allow-unconfigured --bind lan --port "${PORT:-8080}"
else
  exec su -s /bin/sh -c "exec node /app/openclaw.mjs gateway --allow-unconfigured --bind lan --port '${PORT:-8080}'" node
fi
