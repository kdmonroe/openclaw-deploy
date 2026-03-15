---
name: vault-context
description: "Inject Obsidian vault daily/weekly note data into coach bootstrap context"
metadata:
  {
    "openclaw":
      {
        "emoji": "🗄️",
        "events": ["agent:bootstrap"],
        "requires": { "config": ["hooks.internal.entries.vault-context.enabled"] },
        "install": [{ "id": "bundled", "kind": "bundled", "label": "Bundled with OpenClaw" }],
      },
  }
---

# Vault Context Hook

Reads today's and yesterday's Obsidian daily notes, parses YAML frontmatter, and injects a compact per-agent `VAULT_CONTEXT.md` into bootstrap files. Coaches receive real metrics (pomodoro counts, spending, workout data, mood) without runtime tool calls.

## How It Works

1. Fires on `agent:bootstrap` event (before every agent run, including heartbeats)
2. Checks if the agent is a configured coach (AZI-3, AP-5, C-3PO, K-2SO, Huyang)
3. Reads today's and yesterday's daily notes from the Obsidian vault
4. Parses YAML frontmatter and extracts agent-specific metrics
5. Formats a compact markdown summary (under 3000 chars)
6. Injects it as `VAULT_CONTEXT.md` in the agent's bootstrap context

## Configuration

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "vault-context": {
          "enabled": true,
          "vaultPath": "/root/.openclaw/workspace/repos/general-icloud/icloud_git"
        }
      }
    }
  }
}
```

### Options

- `vaultPath` (string): Absolute path to the Obsidian vault root (default: `/root/.openclaw/workspace/repos/general-icloud/icloud_git`)
- `agents` (object): Per-agent enable/disable map (e.g., `{ "azi": true, "villagence": false }`)

## Enable

```bash
openclaw hooks enable vault-context
```
