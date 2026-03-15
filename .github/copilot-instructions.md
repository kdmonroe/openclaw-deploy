# OpenClaw — GitHub Copilot Instructions

This file provides project context for GitHub Copilot. For detailed rules, see `.dev/rules/` and `AGENTS.md`.

## What is this

OpenClaw is a gateway-centric personal AI assistant platform. TypeScript (ESM), Node 22+, pnpm.

## Architecture

The **gateway** process is the hub. Channels (Telegram, Discord, Slack, etc.), CLI, web UI, and ACP clients all connect to it.

- `src/gateway/` — Core server (WebSocket, HTTP, sessions)
- `src/routing/` — Message routing to agents
- `src/agents/` — Agent orchestration
- `src/providers/` — LLM providers (Anthropic, OpenAI, Google, etc.)
- `src/plugins/`, `src/plugin-sdk/` — Extension system
- `src/channels/` — Shared channel abstractions
- `src/acp/` — Agent Client Protocol bridge (IDE integration)
- `src/cli/`, `src/commands/` — CLI
- `extensions/` — Plugin packages (channels, auth, tools, memory)
- `ui/` — Vite web UI
- `apps/` — Native apps (iOS, Android, macOS)
- `Swabble/` — Swift 6.2 macOS 26 speech daemon

## Commands

```bash
pnpm install          # install deps
pnpm build            # full build
pnpm check            # type-check + lint + format (tsgo + oxlint + oxfmt)
pnpm test             # vitest parallel
pnpm openclaw ...     # run CLI in dev
pnpm gateway:dev      # dev gateway
pnpm ui:dev           # web UI dev
pnpm docs:dev         # Mintlify docs
```

Full CI gate: `pnpm build && pnpm check && pnpm test`

## Code style

- TypeScript ESM, strict typing, no `any`
- Oxlint (type-aware) + Oxfmt
- Files under ~500 LOC
- Use `src/cli/progress.ts` for spinners, `src/terminal/table.ts` for tables, `src/terminal/palette.ts` for colors
- Commits via `scripts/committer "<msg>" <file...>`

## Writing / response style

For consistent assistant outputs (headings, bullets, sparing **bold**, callouts, etc.), follow `STYLE.md`.

## Testing

- Vitest, V8 coverage (70% thresholds), colocated `*.test.ts`
- E2E: `*.e2e.test.ts`, config: `vitest.e2e.config.ts`
- Max 16 test workers

## Deployment

- **Railway**: `railway.json` + `Dockerfile.railway` + `railway-entrypoint.sh`. Config: `openclaw.json` (auto-provisioned). SSH: `railway ssh`.
- **Fly.io**: `fly.toml` (public) / `fly.private.toml` (private). SSH: `fly ssh console -a openclaw`.
- **Docker**: `Dockerfile` + `docker-compose.yml`. Non-root `node` user. Gateway: 18789, bridge: 18790.
- **Render**: `render.yaml`. Health: `/health`, port 8080.

Config is always `openclaw.json` (never `config.json`). `--allow-unconfigured` enables first-run web setup.

## Extensions

Extensions in `extensions/*/`. Runtime deps in `dependencies`, `openclaw` in `devDependencies`/`peerDependencies`. No `workspace:*` in `dependencies`. Plugin SDK: `openclaw/plugin-sdk`.

## Swift conventions

- Prefer `@Observable`/`@Bindable` (Observation framework) over `ObservableObject`/`@StateObject`
- SwiftLint + SwiftFormat configured (`.swiftlint.yml`, `.swiftformat`)

## Mobile

- iOS: `pnpm ios:gen` (xcodegen) → `pnpm ios:build` → `pnpm ios:run`. Prefer real devices.
- Android: `pnpm android:run`. Prefer real devices.
- macOS: `pnpm mac:package`. Gateway runs as menubar app.

## More details

- `.dev/rules/` — Shared developer rules (architecture, deployment, workflow, Swabble, mobile, plugins)
- `AGENTS.md` — Agent-behavior rules (PR workflow, multi-agent safety, commit conventions)
- `docs.acp.md` — ACP bridge protocol spec
