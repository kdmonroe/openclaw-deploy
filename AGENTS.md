# CLAUDE.md — Claude Code Context

This file provides repository context for Claude Code sessions. For agent-behavior rules (PR workflow, multi-agent safety, commit conventions), see `AGENTS.md`.

## What is this repo

OpenClaw — a gateway-centric personal AI assistant platform. TypeScript (ESM), Node 24+, pnpm. The gateway process is the hub; channels, CLI, web UI, and ACP clients connect to it.

This is a **deployment fork** of [openclaw/openclaw](https://github.com/openclaw/openclaw) (v2026.3.12) with custom skills, coaching agents, and Railway deployment configuration.

## Quick reference

```bash
pnpm install          # install deps
pnpm build            # full build
pnpm check            # type-check + lint + format
pnpm test             # run tests (vitest, parallel)
pnpm openclaw ...     # run CLI in dev
pnpm gateway:dev      # dev gateway (skip channels)
```

Full CI gate: `pnpm build && pnpm check && pnpm test`

## Upstream sync

```bash
git remote add upstream https://github.com/openclaw/openclaw.git  # once
git fetch upstream --tags
git merge v2026.X.Y   # merge a release tag
```

Local customizations live in: `skills/`, `STYLE.md`, `.dev/rules/deployment.md`, `scripts/vps-skills-sync.sh`, and this file.

## Key directories

- `src/` — Core source (gateway, channels, providers, agents, CLI, hooks, media, ACP)
- `extensions/` — Plugin packages (channels, auth, tools, memory)
- `ui/` — Vite-based web UI
- `apps/` — Native apps (iOS, Android, macOS)
- `Swabble/` — Swift 6.2 macOS 26 speech daemon
- `packages/` — Shared packages (clawdbot, moltbot)
- `scripts/` — Build, test, release tooling
- `docs/` — Mintlify documentation
- `skills/` — Runtime agent skills (includes custom coaching agents)
- `.dev/rules/` — Shared developer rules (deployment, architecture, etc.)

## Deployment (Railway + Tailscale)

Railway deployment uses the standard `Dockerfile` with build args:
- `OPENCLAW_INSTALL_BROWSER=1` — installs Chromium for Playwright skills
- `OPENCLAW_EXTENSIONS="telegram"` — opt-in extension dependencies
- Setup wizard at `https://<domain>/setup`

### Railway Tailscale sidecar (production)

The Railway deployment has a Tailscale sidecar enabled via `TS_AUTHKEY` env var. Key operational details:

- **Tailnet:** `tail987e19.ts.net`, hostname `openclaw`
- **URL:** `https://openclaw.tail987e19.ts.net/` (Control UI + WSS gateway)
- **Gateway token:** set via `OPENCLAW_GATEWAY_TOKEN` in Railway env vars
- **Local CLI config:** `~/.openclaw/openclaw.json` with `gateway.mode: "remote"` pointing to `wss://openclaw.tail987e19.ts.net`
- **State:** Tailscale state persists at `/data/.tailscale/` (Railway volume). Use `--statedir` (not `--state`) for TLS cert storage.

**Gotchas discovered during setup:**

- `tailscale serve` must be enabled per-node in the Tailscale admin console (first-time approval URL shown in logs)
- HTTPS certificates must be enabled in Tailscale DNS settings (`https://login.tailscale.com/admin/dns`)
- Use `--statedir` not `--state` for `tailscaled` — the latter doesn't create a directory for TLS certs, causing `no TailscaleVarRoot` errors
- Userspace networking (`--tun=userspace-networking`) is required in Railway containers (no TUN device)
- Node.js v25 + OpenSSL 3.6.1 TLS 1.3 hangs through Tailscale on macOS; workaround: `export NODE_OPTIONS="--tls-max-v1.2"` in `~/.zshrc`
- `trustedProxies` must include `127.0.0.1` when using `tailscale serve` (serve proxies from loopback, forwarding client IP via headers)
- Device pairing: Tailscale-authenticated connections auto-approve pairing. Token-only connections from new devices still require manual `devices approve`.
- Chrome on macOS cannot resolve `.ts.net` domains (Chrome's async DNS bypasses Tailscale MagicDNS); use Safari, or set Chrome > Settings > Security > "Use secure DNS" to "With your current service provider"

**GitHub auth on Railway:**

- `GH_TOKEN` env var: automatically configures `gh` CLI auth and git credential helper
- Skills persist at `/data/.openclaw/skills/` (symlinked from `~/.openclaw/skills/`)
- Startup skills sync runs `scripts/vps-skills-sync.sh` if `GH_TOKEN` is set

**Local Mac CLI setup:**

- Install: `pnpm link --global` from the repo root (requires `pnpm setup` first for global bin dir)
- Config at `~/.openclaw/openclaw.json` with `gateway.mode: "remote"` pointing to `wss://openclaw.tail987e19.ts.net`
- Requires `NODE_OPTIONS="--tls-max-v1.2"` in environment for TLS through Tailscale
- Test: `openclaw gateway health` should show OK + Telegram status

### Other deployment platforms

- **Fly.io** — `fly.toml` (public) / `fly.private.toml` (no public ingress). SSH: `fly ssh console -a openclaw`.
- **Docker** — `Dockerfile`, `docker-compose.yml`. Non-root `node` user. Gateway on 18789.
- **Render** — `render.yaml`. Health check at `/health`, port 8080.

See `.dev/rules/deployment.md` for full patterns.

## Coding style

- TypeScript ESM, strict typing, avoid `any`
- Oxlint + Oxfmt (run `pnpm check`)
- Files under ~500 LOC; split when it improves clarity
- Use `src/cli/progress.ts` for spinners, `src/terminal/table.ts` for tables, `src/terminal/palette.ts` for colors

## Writing / response style

For consistent assistant outputs (headings, bullets, sparing **bold**, callouts, etc.), follow `STYLE.md`.

## Extension development

Extensions in `extensions/*/`. Runtime deps in `dependencies`, `openclaw` in `devDependencies`/`peerDependencies`. No `workspace:*` in `dependencies`. See `.dev/rules/plugins.md`.

## Shared developer rules

Detailed rules for AI pair programmers live in `.dev/rules/`:

- `.dev/rules/architecture.md` — System architecture, module map
- `.dev/rules/deployment.md` — Railway, Fly, Docker, Render patterns
- `.dev/rules/dev-workflow.md` — Build, test, lint, PR conventions
- `.dev/rules/swabble.md` — Swift 6.2 speech daemon
- `.dev/rules/mobile.md` — iOS, Android, macOS app development
- `.dev/rules/plugins.md` — Extension/plugin development

## Commit & deploy workflow

When code changes are made (bug fixes, feature additions, config updates, model list changes, etc.), always follow through to deployment:

1. After implementing changes, run `pnpm build` and relevant tests to verify
2. **Proactively offer to commit and push** — don't wait for the user to ask
3. If changes affect the gateway (anything in `src/`), note that a Railway redeployment will be triggered by the push
4. When planning multi-step work, include commit/push/deploy as an explicit step in the plan

The Railway deployment auto-triggers on push to `main`. There is no hot-reload — code changes require a full redeployment.
