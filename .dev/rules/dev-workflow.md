# Development Workflow

Runtime baseline: **Node 22+** (keep Node + Bun paths working). Package manager: **pnpm** (`pnpm-lock.yaml` is canonical). Bun preferred for TypeScript execution.

## Essential commands

| Task                   | Command                               |
| ---------------------- | ------------------------------------- |
| Install deps           | `pnpm install`                        |
| Build                  | `pnpm build`                          |
| Type-check             | `pnpm tsgo`                           |
| Lint + format          | `pnpm check` (= tsgo + lint + format) |
| Test                   | `pnpm test` (vitest, parallel)        |
| Test with coverage     | `pnpm test:coverage`                  |
| E2E tests              | `pnpm test:e2e`                       |
| Live tests (real keys) | `OPENCLAW_LIVE_TEST=1 pnpm test:live` |
| Docker tests           | `pnpm test:docker:all`                |
| Run CLI (dev)          | `pnpm openclaw ...` or `pnpm dev`     |
| Gateway (dev)          | `pnpm gateway:dev`                    |
| Gateway (watch)        | `pnpm gateway:watch`                  |
| Web UI build           | `pnpm ui:build`                       |
| Web UI dev             | `pnpm ui:dev`                         |
| Docs dev               | `pnpm docs:dev`                       |
| Docs build             | `pnpm docs:build`                     |
| Check file LOC         | `pnpm check:loc`                      |
| Protocol gen           | `pnpm protocol:gen`                   |
| Mac app package        | `pnpm mac:package`                    |

## Full CI gate (run before pushing)

```bash
pnpm build && pnpm check && pnpm test
```

## Formatting and linting

- **Formatter:** Oxfmt (`pnpm format` to check, `pnpm format:fix` to fix)
- **Linter:** Oxlint with type-aware rules (`pnpm lint`, `pnpm lint:fix`)
- **Swift:** `pnpm lint:swift` + `pnpm format:swift`
- **Docs:** `pnpm format:docs` + `pnpm lint:docs`

## Testing

- Framework: **Vitest** with V8 coverage (70% thresholds for lines/branches/functions/statements)
- Test files: colocated `*.test.ts`; E2E in `*.e2e.test.ts`
- Parallel runner: `scripts/test-parallel.mjs` (max 16 workers)
- Config variants: `vitest.config.ts` (unit), `vitest.e2e.config.ts`, `vitest.live.config.ts`, `vitest.gateway.config.ts`, `vitest.extensions.config.ts`

## Commit conventions

- Use `scripts/committer "<msg>" <file...>` — avoid manual `git add`/`git commit`
- Concise, action-oriented messages: `CLI: add verbose flag to send`
- Changelog: keep latest released version at top (no "Unreleased" section)
- PR workflow: review → prepare → merge (see `AGENTS.md` and `.agents/skills/`)
- After merging contributor PRs: run `bun scripts/update-clawtributors.ts`

## Key directories

| Dir               | What lives there                                             |
| ----------------- | ------------------------------------------------------------ |
| `src/`            | Core source code (CLI, gateway, channels, providers, agents) |
| `extensions/`     | Plugin/extension packages (workspace packages)               |
| `ui/`             | Vite-based web UI                                            |
| `apps/`           | Native apps (iOS, Android, macOS)                            |
| `packages/`       | Shared packages (clawdbot, moltbot)                          |
| `scripts/`        | Build, test, release, and dev tooling scripts                |
| `docs/`           | Mintlify documentation site                                  |
| `skills/`         | Runtime agent skills                                         |
| `Swabble/`        | Swift 6.2 speech daemon (macOS 26)                           |
| `dist/`           | Built output                                                 |
| `.agents/skills/` | AI pair programmer workflow skills (PR review/prepare/merge) |

## TypeScript conventions

- ESM module system, strict typing, avoid `any`
- Keep files under ~500 LOC (guideline, not hard limit)
- Brief code comments for tricky/non-obvious logic
- Use existing patterns from `src/cli/` for CLI options and `createDefaultDeps` for DI
- CLI progress: use `src/cli/progress.ts` (not custom spinners)
- Terminal tables: use `src/terminal/table.ts`
- Colors: use `src/terminal/palette.ts` (no hardcoded ANSI)

## Pre-commit hooks

```bash
prek install
```

Runs the same checks as CI. Git hooks live in `git-hooks/`.
