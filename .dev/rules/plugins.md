# Plugin / Extension Development

Extensions live under `extensions/*/` as workspace packages. They extend OpenClaw with new channels, tools, auth providers, and capabilities.

## Directory structure

Each extension is a self-contained npm package:

```
extensions/
├── telegram/
│   ├── package.json    # name: @openclaw/ext-telegram
│   ├── src/
│   │   └── index.ts    # default export: plugin definition
│   └── tsconfig.json
├── matrix/
├── msteams/
└── ...
```

## Dependency rules

- **Runtime deps** → `dependencies` in the extension's `package.json` (installed with `npm install --omit=dev`)
- **`openclaw`** → put in `devDependencies` or `peerDependencies`, NOT `dependencies` (runtime resolves `openclaw/plugin-sdk` via jiti alias)
- **Do NOT use `workspace:*`** in `dependencies` — breaks `npm install`
- **Do NOT add extension-only deps** to the root `package.json` unless core also uses them

## Creating a new extension

1. Create directory: `extensions/<name>/`
2. Create `package.json` with `name: "@openclaw/ext-<name>"`, set `main` to the entry point
3. Export a plugin definition from the entry point using the plugin SDK: `import { definePlugin } from 'openclaw/plugin-sdk'`
4. Add runtime deps to the extension's `dependencies`
5. Test with `vitest` (config: `vitest.extensions.config.ts`)

## Plugin SDK

The SDK is exported from `openclaw/plugin-sdk` (built to `dist/plugin-sdk/`). Type declarations generated via `pnpm build:plugin-sdk:dts`.

## Testing extensions

```bash
# Run extension-specific tests
pnpm vitest run --config vitest.extensions.config.ts

# Run all tests (includes extensions)
pnpm test

# Docker plugin tests
pnpm test:docker:plugins
```

## Version syncing

```bash
# Sync all extension package versions with root
pnpm plugins:sync
```

This runs `scripts/sync-plugin-versions.ts`.

## Extension categories

| Category               | Extensions                                                                                                                                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Messaging channels** | `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `tlon`, `twitch`, `voice-call`, `whatsapp`, `zalo`, `zalouser` |
| **Auth providers**     | `google-antigravity-auth`, `google-gemini-cli-auth`, `minimax-portal-auth`, `qwen-portal-auth`                                                                                                                                    |
| **AI/Tools**           | `copilot-proxy`, `llm-task`, `lobster`, `open-prose`                                                                                                                                                                              |
| **Memory**             | `memory-core`, `memory-lancedb`                                                                                                                                                                                                   |
| **Diagnostics**        | `diagnostics-otel`                                                                                                                                                                                                                |

## When adding a new channel extension

- Update every UI surface and docs (macOS app, web UI, mobile if applicable)
- Add onboarding/overview docs
- Add matching status + configuration forms
- Review `.github/labeler.yml` for label coverage

## Tool schema guardrails

When defining tool input schemas in extensions:

- Avoid `Type.Union` — no `anyOf`/`oneOf`/`allOf`
- Use `stringEnum`/`optionalStringEnum` (Type.Unsafe enum) for string lists
- Use `Type.Optional(...)` instead of `... | null`
- Keep top-level schema as `type: "object"` with `properties`
- Avoid raw `format` property names (some validators treat it as reserved)
