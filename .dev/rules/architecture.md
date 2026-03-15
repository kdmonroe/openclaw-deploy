# Architecture

OpenClaw is a gateway-centric personal AI assistant platform. Everything revolves around the **gateway** process — channels, CLI, web UI, and ACP clients all connect to it.

## Core flow

```
Channels (Telegram, Discord, Slack, WhatsApp, …)
        ↓
    Gateway (src/gateway/)
        ↓
    Routing (src/routing/)
        ↓
    Agents (src/agents/) ←→ Providers (src/providers/)
        ↓
    Hooks, Memory, Tools, Media pipeline
```

## Module map (`src/`)

| Module                           | Purpose                                                     |
| -------------------------------- | ----------------------------------------------------------- |
| `gateway/`                       | Core gateway server — WebSocket, HTTP, session management   |
| `routing/`                       | Message routing from channels to agents                     |
| `channels/`                      | Shared channel abstractions                                 |
| `agents/`                        | Agent orchestration, conversation management                |
| `providers/`                     | LLM provider integrations (Anthropic, OpenAI, Google, etc.) |
| `plugins/`, `plugin-sdk/`        | Extension system — runtime loading, SDK API surface         |
| `config/`                        | Configuration loading, validation, migration                |
| `sessions/`                      | Session store (transcripts, persistence, compaction)        |
| `security/`                      | Auth, token validation, gateway passwords                   |
| `hooks/`                         | Lifecycle hooks (pre/post message, session events)          |
| `memory/`                        | Conversation memory, summarization                          |
| `media/`, `media-understanding/` | Media processing, transcription, image understanding        |
| `tts/`                           | Text-to-speech                                              |
| `link-understanding/`            | URL content extraction                                      |
| `browser/`                       | Headless browser for web content                            |
| `acp/`                           | Agent Client Protocol bridge (stdio ↔ WebSocket)            |
| `cli/`, `commands/`              | CLI wiring and command implementations                      |
| `tui/`, `terminal/`              | Terminal UI components, table formatting, palette           |
| `wizard/`                        | Interactive setup and onboarding                            |
| `cron/`                          | Scheduled task execution                                    |
| `canvas-host/`                   | A2UI canvas rendering host                                  |
| `macos/`                         | macOS-specific integrations                                 |
| `logging/`, `logger.ts`          | Log infrastructure                                          |
| `infra/`                         | Infrastructure utilities                                    |
| `process/`, `daemon/`            | Process management, daemonization                           |

## Built-in channels (`src/`)

`telegram/`, `discord/`, `slack/`, `signal/`, `imessage/`, `web/` (WhatsApp web), `whatsapp/`, `line/`

## Extension channels (`extensions/`)

`bluebubbles/`, `copilot-proxy/`, `discord/`, `feishu/`, `googlechat/`, `imessage/`, `line/`, `matrix/`, `mattermost/`, `msteams/`, `nextcloud-talk/`, `nostr/`, `signal/`, `slack/`, `telegram/`, `tlon/`, `twitch/`, `voice-call/`, `whatsapp/`, `zalo/`, `zalouser/`

Also: `diagnostics-otel/`, `google-antigravity-auth/`, `google-gemini-cli-auth/`, `llm-task/`, `lobster/`, `memory-core/`, `memory-lancedb/`, `minimax-portal-auth/`, `open-prose/`, `qwen-portal-auth/`

## Web UI (`ui/`)

Vite-based web interface. Build: `pnpm ui:build`. Dev: `pnpm ui:dev`.

## Packages (`packages/`)

- `clawdbot/` — Primary bot package
- `moltbot/` — Secondary bot package

## ACP bridge

`openclaw acp` exposes an Agent Client Protocol agent over stdio (NDJSON), forwarding prompts to the gateway via WebSocket. Used for IDE integration (Zed, etc.). See `docs.acp.md` for the full protocol spec.

Key patterns:

- ACP `prompt` → Gateway `chat.send`; ACP `cancel` → Gateway `chat.abort`
- Default session key: `acp:<uuid>`; override with `--session agent:<name>:<id>`
- Auth from CLI flags or `gateway.remote.*` config

## Config file

The gateway reads `openclaw.json` (not `config.json`). State directory: `~/.openclaw/`. Workspace: `~/.openclaw/workspace/`.

## Entry points

- `openclaw.mjs` → CLI entry (bin)
- `src/entry.ts` → main entry
- `src/index.ts` → module exports
- `src/runtime.ts` → runtime setup
- `dist/index.js` → built output (production)
