---
name: Coaching Dashboard
slug: coach-dashboard
version: 1.0.0
description: Real-time HTML dashboard for the Droid Coaching Command Center. Displays active goals, habit streaks, daily schedules, and weekly progress across all 5 coaching agents. Rendered via OpenClaw's canvas system.
metadata: { "clawdbot": { "emoji": "📊", "requires": { "bins": [] }, "os": ["linux", "darwin"] } }
ontology:
  reads: [Goal, Habit, DailyLog, HealthMetric, PomodoroBlock, SpendingEntry, Reflection, DevSession]
  writes: []
---

# Droid Coaching Command Center Dashboard

## Overview

A unified HTML dashboard that aggregates coaching data from all 5 droid coaches and renders it via the canvas system. Provides at-a-glance progress tracking, habit streaks, scheduling, and recent coaching activity.

## Commands

### /dashboard

Render the full Coaching Command Center dashboard on the connected canvas.

**Usage:** `/dashboard`

Displays:

- All active goals with progress bars (per coach)
- Habit streaks with fire indicators
- Today's coaching schedule
- Weekly progress scores
- Recent coaching notes/interactions

### /dashboard \<agent-id\>

Show detail view for a specific coach.

**Usage:** `/dashboard azi`

Displays coach-specific deep dive:

- All goals (active + recent completed)
- Detailed habit tracking with streak history
- Domain-specific metrics (steps for AZI, pomodoros for AP-5, etc.)
- Recent session summaries
- Trend charts

**Valid agent IDs:** `azi`, `kaytoo`, `ap5`, `threepio`, `huyang`

### /progress

Quick text summary of all active goals across all coaches. No canvas needed.

**Usage:** `/progress`

Returns a concise text summary like:

```
📊 Coaching Progress

💊 AZI-3 Health
  - Walk 8k steps/day: ██████░░ 75% (🔥 12 day streak)
  - Sleep 7+ hours: ████████ 90%

🪞 K-2SO Reflection
  - Daily journaling: ██████░░ 73% (🔥 7 day streak)

⏱️ AP-5 Productivity
  - Complete 6 pomodoros/day: ████░░░░ 50%

💰 C-3PO Finance
  - Stay within budget: ████████░ 85%
  - Save $500/mo: ██████░░ 70%

⚔️ Huyang Dev
  - Master TypeScript generics: ████░░░░ 45%
```

## Dashboard HTML Structure

### Command Center (All Coaches)

```
+----------------------------------------------------------+
|  DROID COACHING COMMAND CENTER              [refresh btn] |
+----------------------------------------------------------+
|                                                          |
|  [💊 AZI]  [🪞 K-2SO]  [⏱️ AP-5]  [💰 C-3PO]  [⚔️ Huyang]  |
|                                                          |
+------------------+---------------------------------------+
| ACTIVE GOALS     | HABIT STREAKS                         |
| Coach-grouped    | Sorted by streak length               |
| with progress    | 🔥 indicators                         |
| bars             | Cue → Routine shown                   |
+------------------+---------------------------------------+
| TODAY'S SCHEDULE              | WEEKLY PROGRESS          |
| Time-sorted coaching          | Day-by-day scores        |
| touchpoints with              | Per-coach breakdown      |
| coach emoji + name            | Color-coded bars         |
+-------------------------------+--------------------------+
| RECENT COACHING ACTIVITY                                 |
| Last 5 coaching interactions across all agents           |
| With coach identity, timestamp, and key message          |
+----------------------------------------------------------+
```

### Coach Detail View

```
+----------------------------------------------------------+
|  [← Back]  💊 AZI-3 HEALTH DASHBOARD                    |
+----------------------------------------------------------+
| GOALS                        | METRICS THIS WEEK         |
| - Goal with progress bar     | Avg Sleep: 7.2h           |
| - Goal with progress bar     | Avg Steps: 7,400          |
| - Goal with progress bar     | Water: 68 oz/day          |
+------------------------------+---------------------------+
| HABITS                       | 7-DAY TREND               |
| Name: streak + status        | Sparkline/bar chart       |
| Cue → Routine                | for key metrics           |
+------------------------------+---------------------------+
| RECENT SESSIONS                                          |
| Last 7 coaching interactions with this coach             |
+----------------------------------------------------------+
```

## Implementation

### Data Pipeline

1. Read ontology `graph.jsonl` for all entity types
2. Filter by coach ID and date range
3. Aggregate metrics (averages, totals, streaks)
4. Generate HTML from template with data injected
5. Write to canvas root directory
6. Present via canvas system

### HTML Generation

Generate a self-contained HTML file with:

- Inline CSS (dark theme, Star Wars aesthetic)
- Inline JS for tab switching, auto-refresh
- CSS Grid layout for responsive design
- Progress bars via CSS `linear-gradient`
- Streak indicators via emoji
- Coach-colored accent borders (each coach gets a color)

### Coach Colors

| Coach  | Color     | Accent          |
| ------ | --------- | --------------- |
| AZI-3  | `#4CAF50` | Medical green   |
| K-2SO  | `#7E57C2` | Imperial purple |
| AP-5   | `#FF9800` | Tactical orange |
| C-3PO  | `#FFD700` | Protocol gold   |
| Huyang | `#2196F3` | Jedi blue       |

### Auto-Refresh

- Dashboard HTML includes meta refresh every 5 minutes
- Canvas live reload picks up file changes automatically
- Manual refresh via button triggers data re-read and HTML regeneration

### File Output

- **Command Center:** `~/clawd/canvas/coaching-dashboard.html`
- **Coach Detail:** `~/clawd/canvas/coaching-{id}.html`

## Workflow

1. User runs `/dashboard`
2. Skill reads ontology data for all coaches
3. Aggregates goals, habits, metrics, recent activity
4. Generates HTML dashboard file
5. Writes to canvas root directory
6. Presents canvas on connected node
7. Dashboard auto-refreshes every 5 minutes

## Behavior Rules

1. **Read-only** — this skill never writes to ontology, only reads.
2. **Graceful empty state** — if a coach has no data yet, show "No active goals — start by talking to [coach name]"
3. **Responsive** — layout works on desktop and mobile (Telegram WebApp)
4. **Fast** — generate HTML quickly, don't over-process data
5. **Star Wars aesthetic** — dark background, accent colors per coach, monospace headers
6. **Always current** — show most recent data, not cached/stale views

## Related Skills

- `canvas` — Rendering engine for dashboard HTML
- `ontology` — Data source for all coaching metrics
- `cron-manager` — Scheduled dashboard refresh
