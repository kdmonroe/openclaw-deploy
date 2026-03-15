# Deployment & Infrastructure

OpenClaw deploys as a gateway process on multiple platforms. This covers patterns agents need when debugging, redeploying, or modifying infrastructure.

## Railway

**Files:** `railway.json`, `Dockerfile.railway`, `railway-entrypoint.sh`
**Docs:** `docs/install/railway.mdx`

### Key patterns

- **Config file:** Gateway reads `openclaw.json` (NOT `config.json`). The entrypoint auto-migrates stale `config.json` → `openclaw.json`.
- **Port:** `$PORT` (Railway-provided) or default `18789`.
- **First-run provisioning:** If no `openclaw.json` exists and `ANTHROPIC_API_KEY` is set, the entrypoint auto-generates a full config with providers, model allowlist (sonnet/opus/haiku aliases), and optional Telegram channel.
- **Config patching:** An embedded Node.js script in the entrypoint idempotently patches existing configs to sync `TELEGRAM_BOT_TOKEN`, set `trustedProxies` for CGNAT (`100.64.0.0/10`), and remove `plugins.enabled=false`.
- **Workspace:** Symlink `~/.openclaw/workspace` → `$OPENCLAW_WORKSPACE_DIR` for persistence across redeploys.
- **Auth:** `OPENCLAW_GATEWAY_TOKEN` or `OPENCLAW_GATEWAY_PASSWORD` env vars.
- **Final exec:** `node openclaw.mjs gateway --port $PORT --bind lan --allow-unconfigured`

### Railway SSH access

```bash
# Connect to running Railway service
railway ssh

# Or via Railway CLI with service targeting
railway run bash

# View logs
railway logs
railway logs --tail

# Redeploy
railway up
```

### Common Railway debugging

```bash
# Check gateway config inside container
railway ssh
cat $OPENCLAW_STATE_DIR/openclaw.json | head -50

# Check if gateway is running
railway ssh
ps aux | grep openclaw

# Restart by redeploying
railway up --detach
```

### Tailscale sidecar (private tailnet access)

Set one env var to expose the gateway exclusively to your Tailscale tailnet:

- `TS_AUTHKEY` — Tailscale auth key (reusable, non-ephemeral). Generate at https://login.tailscale.com/admin/settings/keys
- `TS_HOSTNAME` — Optional tailnet hostname (default: `openclaw`)

**What happens automatically:**

1. `tailscaled` starts in userspace-networking mode
2. Node authenticates and joins your tailnet
3. Gateway binds to loopback; `tailscale serve` proxies HTTPS from `https://<hostname>.<tailnet>.ts.net`
4. Tailscale identity auth enabled (`auth.allowTailscale: true`)

**After verifying:** Remove the public Railway domain from Settings > Networking.

**Auth flow through Tailscale serve:**

1. Browser/CLI connects to `https://<hostname>.<tailnet>.ts.net`
2. Tailscale serve proxies from `127.0.0.1` with `x-forwarded-for` headers containing the real Tailscale client IP
3. `auth.ts:249` — Tailscale identity verified via `tailscale whois` (even though request arrives from loopback, proxy headers trigger the check)
4. `message-handler.ts:695` — Device pairing auto-approved for Tailscale-authenticated connections (`silent: authMethod === "tailscale"`)
5. No manual `devices approve` needed for tailnet users

**Key source files:**

- `src/gateway/auth.ts:249` — Tailscale serve auth bypass (allows whois check for proxied loopback requests)
- `src/gateway/auth.ts:148` — `hasTailscaleProxyHeaders()` detects Tailscale serve forwarded headers
- `src/gateway/server/ws-connection/message-handler.ts:695` — Silent pairing for Tailscale-authed connections
- `src/gateway/server-runtime-config.ts:94` — Enforces `bind=loopback` for tailscale serve/funnel mode

**Browser access (macOS):**

- Safari works out of the box with Tailscale MagicDNS
- Chrome's async DNS resolver may bypass system split-DNS for `.ts.net` domains — fix via Chrome Settings > Security > set "Use secure DNS" to "With your current service provider" or launch with `--disable-features=AsyncDns`
- `curl` and Node.js CLI always work (use system DNS resolver)

**GitHub CLI + git credentials:**

- `Dockerfile.railway` installs `gh` CLI
- Entrypoint configures git credential helper when `GH_TOKEN` env var is set
- `GH_TOKEN` is auto-detected by `gh` CLI (no `gh auth login` needed)
- Skills persist on Railway volume at `/data/.openclaw/skills/` with symlink from `~/.openclaw/skills/`

**Debugging:**

```bash
railway ssh
tailscale status
tailscale ip -4
tailscale serve status
curl -s http://localhost:$PORT/health
cat $OPENCLAW_STATE_DIR/openclaw.json | python3 -m json.tool | grep -A5 tailscale

# Non-interactive single commands from local Mac
railway ssh -- tailscale status
railway ssh -- node openclaw.mjs devices list --url ws://127.0.0.1:8080 --token "\$OPENCLAW_GATEWAY_TOKEN"
railway ssh -- gh auth status
```

**Deployment gotchas:**

- `pnpm-lock.yaml` must be committed (not gitignored) for git-triggered Railway deploys to work
- `railway up --detach` uploads from working directory (includes untracked files); git-triggered deploys only have committed files
- `NODE_OPTIONS="--tls-max-v1.2"` in shell env can break `railway up` (TLS BadRecordMac error); unset it before deploying or use `env -u NODE_OPTIONS railway up --detach`
- Container port is `$PORT` (Railway-assigned, typically 8080), not the config's `18789`; when running CLI inside the container, use `--url ws://127.0.0.1:$PORT`

## Fly.io

**Files:** `fly.toml` (public), `fly.private.toml` (no public ingress)
**Docs:** `docs/install/fly.md`

### Topology

- **Public (`fly.toml`):** HTTP service on port 3000, force HTTPS, `auto_stop_machines=false` (persistent connections), `min_machines_running=1`. Region `iad`.
- **Private (`fly.private.toml`):** No `[http_service]` block = no public ingress. Access only via `fly proxy`, WireGuard, or `fly ssh console`. Outbound-only.

### Key patterns

```bash
# SSH into Fly machine
fly ssh console -a openclaw

# SSH with specific command
fly ssh console -a openclaw -C "cat /data/openclaw.json"

# Proxy to local port
fly proxy 18789:3000 -a openclaw

# View logs
fly logs -a openclaw

# Deploy
fly deploy

# Restart machines
fly machines restart -a openclaw
```

- **VM:** `shared-cpu-2x`, 2048MB RAM
- **Volume:** `openclaw_data` at `/data`
- **Process:** `node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan`
- **Env:** `NODE_ENV=production`, `OPENCLAW_STATE_DIR=/data`, `NODE_OPTIONS=--max-old-space-size=1536`

## Docker

**Files:** `Dockerfile`, `docker-compose.yml`, `Dockerfile.sandbox`, `Dockerfile.sandbox-browser`, `docker-setup.sh`
**Docs:** `docs/install/docker.md`

### Key patterns

- **Base:** `node:22-bookworm` with Bun for build, corepack for pnpm
- **Security:** Runs as non-root `node` user (uid 1000)
- **Default CMD:** `node openclaw.mjs gateway --allow-unconfigured` (binds loopback)
- **Optional build arg:** `OPENCLAW_DOCKER_APT_PACKAGES` for extra apt packages

### Docker Compose services

1. **`openclaw-gateway`** — Gateway process, ports `18789` (gateway) + `18790` (bridge), volumes for config + workspace, `restart: unless-stopped`, `init: true`
2. **`openclaw-cli`** — Interactive CLI, `stdin_open: true` + `tty: true`, same env/volumes

```bash
# Build and run locally
docker compose build
docker compose up -d openclaw-gateway

# Interactive CLI session
docker compose run --rm openclaw-cli chat

# View logs
docker compose logs -f openclaw-gateway

# Exec into running container
docker compose exec openclaw-gateway bash
```

### Sandbox containers

- `Dockerfile.sandbox` — Isolated execution environment for agent tools
- `Dockerfile.sandbox-browser` — Sandbox with headless browser support

## Render

**Files:** `render.yaml`
**Docs:** `docs/install/render.mdx`

### Key patterns

- **Service:** Web, Docker runtime, `starter` plan
- **Health check:** `/health` endpoint
- **Port:** 8080
- **Persistent disk:** `openclaw-data` at `/data`, 1GB
- **State dir:** `/data/.openclaw`, workspace: `/data/workspace`
- **Auth:** Auto-generated `OPENCLAW_GATEWAY_TOKEN`

## General deployment notes

- Config file is always `openclaw.json` (never `config.json`)
- `--allow-unconfigured` enables first-run setup via web UI
- `--bind lan` exposes to container network; `--bind loopback` for local only
- Default gateway port: `18789`, bridge port: `18790`
- State directory convention: `/data` or `/data/.openclaw` on cloud, `~/.openclaw` locally

## Skills Sync (VPS ↔ GitHub)

For bidirectional sync of skills between VPS (`~/.openclaw/skills/`) and the GitHub repo:

### Manual sync (from local machine)

```bash
# Push local skill changes to VPS
scripts/sync-skills.sh --push

# Pull VPS skill changes to local
scripts/sync-skills.sh --pull

# Check sync status
scripts/sync-skills.sh --status
```

### Automated daily sync (on VPS)

Use OpenClaw's built-in cron system to schedule automatic sync:

```bash
# Add a daily sync job at 23:00 UTC
openclaw cron add \
  --name "skills-sync" \
  --schedule "0 23 * * *" \
  --payload '{"kind":"agentTurn","message":"Run /app/scripts/vps-skills-sync.sh and report any errors"}' \
  --session-target main
```

Or configure via `openclaw.json`:

```json5
{
  cron: {
    jobs: [
      {
        name: "skills-sync",
        schedule: { kind: "cron", expr: "0 23 * * *", tz: "UTC" },
        sessionTarget: "isolated",
        wakeMode: "now",
        payload: {
          kind: "systemEvent",
          text: "Execute: bash /app/scripts/vps-skills-sync.sh",
        },
        enabled: true,
      },
    ],
  },
}
```

### Direct VPS execution

```bash
# Via Railway SSH
railway ssh -c "bash /app/scripts/vps-skills-sync.sh"

# View sync logs
railway ssh -c "tail -50 ~/.openclaw/logs/skills-sync.log"
```

### Environment variables for sync

- `OPENCLAW_SKILLS_DIR` — Override skills directory (default: `~/.openclaw/skills`)
- `OPENCLAW_REPO_URL` — Git remote URL (default: configured origin)
- `OPENCLAW_SYNC_LOG` — Sync log file path (default: `~/.openclaw/logs/skills-sync.log`)
- `OPENCLAW_SYNC_BRANCH` — Branch to sync (default: `main`)
