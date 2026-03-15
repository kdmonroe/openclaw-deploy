# Upgrade Notes: v2026.2.6-3 → v2026.3.12

**Date:** 2026-03-14
**Upstream repo:** [openclaw/openclaw](https://github.com/openclaw/openclaw)

## Why upgrade

The previous version (v2026.2.6-3) had multiple critical security vulnerabilities:

1. **ClawJacked (CVE, fixed v2026.2.25)** — Any website could silently take full control of your AI agent with no plugins, extensions, or user interaction required. Classified as High severity.
2. **WebSocket hijacking (fixed v2026.3.11)** — Cross-site WebSocket hijacking through trusted-proxy paths. Directly relevant to Tailscale serve deployments.
3. **SSRF, path traversal, missing auth** — Six additional vulnerabilities patched across the v2026.2.x and v2026.3.x series.
4. **Workspace plugin auto-load** — Cloned repositories could execute plugin code without explicit trust decisions. Now disabled by default.
5. **Device pairing credentials leak** — QR pairing payloads no longer embed shared gateway credentials; short-lived bootstrap tokens are used instead.

## What changed upstream (highlights)

### New features

- **Dashboard v2** — Modular overview, chat, config, agent, and session views. Command palette, mobile bottom tabs, slash commands, search, export, and pinned messages.
- **Fast mode** — Session-level speed toggle for model interactions via `/fast`, TUI, Control UI, and ACP.
- **Context Engine plugins** — Full lifecycle hooks (bootstrap, ingest, assemble, compact, afterTurn), slot-based registry, config-driven resolution.
- **Backup CLI** — `openclaw backup create` and `openclaw backup verify` for local state archives.
- **Talk mode** — Configurable `talk.silenceTimeoutMs` for auto-send delay.
- **Provider plugins** — Ollama, SGLang, vLLM moved to plugin architecture (smaller core footprint).
- **Brave search LLM context** — Opt-in `tools.web.search.brave.mode: "llm-context"` for grounding snippets.
- **Setup wizard** — New `/setup` web endpoint for initial configuration (replaces manual config file editing).

### Infrastructure changes

- **Node 24** (up from Node 22)
- **Single Dockerfile** — `Dockerfile.railway` and `railway-entrypoint.sh` removed. The standard `Dockerfile` now supports build args:
  - `OPENCLAW_INSTALL_BROWSER=1` — Chromium for Playwright
  - `OPENCLAW_EXTENSIONS="telegram discord"` — opt-in extension deps
  - `OPENCLAW_VARIANT=slim` — smaller image
  - `OPENCLAW_INSTALL_DOCKER_CLI=1` — Docker CLI for sandbox
- **Podman/SELinux** — Auto-detect enforcing mode, `:Z` relabel for bind mounts.

### Security hardening

- WebSocket browser-origin validation
- Workspace plugin trust-on-demand (no implicit auto-load)
- Bootstrap tokens for device pairing
- Gateway client RPC timeout (prevents hanging promises from stale connections)

## What changed in this fork

### Removed (handled by upstream now)

- `Dockerfile.railway` — replaced by standard `Dockerfile` with build args
- `railway-entrypoint.sh` — replaced by `/setup` web wizard + env vars
- `railway.json` — no longer needed

### Preserved customizations

- **Skills** — All custom coaching agents (AP-5, Azi, Huyang, Kaytoo, Threepio, Villagence), plus linear, gitclaw, gemini-image-gen, tavily-search, self-improving, ontology, workspace-files, cron-manager, and others.
- **CLAUDE.md** — Updated for v2026.3.12 with deployment-specific notes (Tailscale, Railway, local CLI).
- **STYLE.md** — House response style guide.
- `.dev/rules/` — Shared developer rules including deployment patterns.
- `scripts/vps-skills-sync.sh` — Skills sync for Railway startup.
- `scripts/sync-skills.sh` — Manual skills sync helper.
- `src/hooks/bundled/vault-context/` — Bootstrap hook for automatic daily note injection.

### Skipped (no longer applicable)

- Railway entrypoint config patching (Telegram token sync, provider provisioning, proxy trust) — now handled by `/setup` wizard
- Dockerfile.railway Tailscale/Chromium/gh installs — use build args instead
- MiniMax model config changes in entrypoint — configure via `/setup` or `openclaw.json`
- Telegram file browser plugin install — use `/setup` or manual install
- Various `src/` bug fixes — already addressed (or superseded) by upstream's 18K+ commits

## Railway migration steps

Since the Railway-specific files are gone, the deployment needs reconfiguration:

1. **Build args** — Set in Railway service settings:
   - `OPENCLAW_INSTALL_BROWSER=1`
   - `OPENCLAW_EXTENSIONS=telegram` (if needed at build time)
2. **Env vars** — Ensure these are set:
   - `SETUP_PASSWORD` (new, for web wizard)
   - `PORT=8080`
   - `OPENCLAW_STATE_DIR=/data/.openclaw`
   - `OPENCLAW_WORKSPACE_DIR=/data/workspace`
   - `OPENCLAW_GATEWAY_TOKEN` (existing)
   - `TS_AUTHKEY` (existing, for Tailscale)
3. **First deploy** — Visit `https://<domain>/setup` to configure providers, channels, etc.
4. **Tailscale** — May need to be configured separately (no longer in entrypoint). Consider a Railway sidecar service or custom startup script.

## Post-upgrade checklist

- [ ] Railway build completes successfully
- [ ] Health endpoint responds: `curl https://openclaw.tail987e19.ts.net/health`
- [ ] Dashboard v2 loads in browser
- [ ] Telegram bot responds to messages
- [ ] Skills load correctly
- [ ] Tailscale connectivity works
- [ ] Device pairing still works (may need re-pairing with bootstrap tokens)
