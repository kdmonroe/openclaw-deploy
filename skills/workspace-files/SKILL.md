# Workspace Files Skill

Read and display key workspace files.

## Commands

### /memory

Display the long-term memory file — key facts about Champ.

**Usage:** `/memory`

**Reads:** `/data/workspace/MEMORY.md`

### /soul

Display the agent's personality and core values.

**Usage:** `/soul`

**Reads:** `/data/workspace/SOUL.md`

### /user

Display Champ's profile — preferences, goals, timezone.

**Usage:** `/user`

**Reads:** `/data/workspace/USER.md`

### /agents

Display behavior rules and agent configuration.

**Usage:** `/agents`

**Reads:** `/data/workspace/AGENTS.md`

### /today

Display today's daily note summary.

**Usage:** `/today`

**Reads:** Current day's note from Obsidian vault

### /week

Display current week's notes.

**Usage:** `/week`

**Reads:** Daily notes from current week

### /status

Display OpenClaw session status.

**Usage:** `/status`

**Shows:** Current model, token usage, context, runtime info

### /help-files

Show this help message.

**Usage:** `/help-files`

## Implementation

The skill reads files from:

- `/data/workspace/` — Main workspace (MEMORY.md, SOUL.md, USER.md, AGENTS.md)
- `/root/.openclaw/workspace/repos/general-icloud/icloud_git/periodic/daily/` — Daily notes

## Examples

```
/memory          → Shows long-term memory
/soul            → Shows agent personality
/user            → Shows Champ's profile
/today           → Shows today's note
/week            → Shows this week's notes
/status          → Shows session metrics
```
