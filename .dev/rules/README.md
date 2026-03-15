# Shared Developer Rules

These rules provide context for AI pair programming tools (Claude Code, Cursor, GitHub Copilot, Gemini CLI, etc.) working in this repository.

## Structure

| File              | Scope                                                     |
| ----------------- | --------------------------------------------------------- |
| `architecture.md` | High-level system architecture, module map, gateway model |
| `deployment.md`   | Railway, Fly.io, Docker, Render deployment patterns       |
| `dev-workflow.md` | Build, test, lint, PR flow, commit conventions            |
| `swabble.md`      | Swabble speech daemon (Swift 6.2, macOS 26)               |
| `mobile.md`       | iOS and Android build, signing, device testing            |
| `plugins.md`      | Extension/plugin development in `extensions/`             |

## How tool-specific configs consume these

- **Claude Code** → `CLAUDE.md` (repo root) references these rules
- **Cursor** → `.cursor/rules/*.mdc` files contain rule content with glob-based activation
- **GitHub Copilot** → `.github/copilot-instructions.md` inlines key rules
- **Gemini CLI** → `GEMINI.md` (repo root) references these rules
- **Agent behavior** → `AGENTS.md` covers PR workflow, multi-agent safety, and commit conventions (not duplicated here)

## When to update

When you change deployment config, add a new platform, restructure `src/`, or add a new extension pattern, update the relevant rule file here. The tool-specific wrappers should then be regenerated or updated to stay in sync.
