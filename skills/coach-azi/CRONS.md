# AZI-3 Cron Jobs — Registration Guide

## How Cron Jobs Work in OpenClaw

Cron jobs are **not** defined in files — they're registered at runtime via the gateway's cron scheduler. You register them using the `openclaw cron add` CLI command, which sends the job definition to the running gateway. The gateway persists jobs in `~/.openclaw/cron/jobs.json` and executes them on schedule.

Each job has:

- **A schedule** — when to run (`--cron` for cron expressions, `--every` for intervals, `--at` for one-shots)
- **A payload** — what to do (`--message` for isolated agent jobs, `--system-event` for main session events)
- **Delivery** — where to send the output (`--announce --channel telegram`)
- **An agent binding** — which agent runs the job (`--agent azi`)

Jobs run in **isolated sessions** (their own context, separate from the main conversation) when using `--message`. The agent wakes up, runs the prompt, and optionally delivers the output to a channel.

## Register These Jobs

Run these commands from any terminal with access to the gateway. If using a remote gateway, the CLI auto-connects via the config in `~/.openclaw/openclaw.json`.

### AZI Morning Wellness Scan — 7:00 AM ET daily

```bash
openclaw cron add \
  --name "AZI Morning Scan" \
  --description "Daily morning wellness check-in: sleep, movement goals, hydration" \
  --agent azi \
  --cron "0 11 * * *" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **🩺 AZI-3 — Morning Scan**. Then proceed with: Run your morning wellness scan protocol. Check ontology for active health goals and recent HealthMetric entries. Ask about last night's sleep (hours + quality). Review today's movement goal. Set hydration target. Suggest one concrete health intention using habit stacking format. Stay in AZI-3 character. Keep to 3-4 sentences." \
  --announce \
  --channel telegram
```

### AZI Evening Health Review — 10:00 PM ET daily

```bash
openclaw cron add \
  --name "AZI Evening Review" \
  --description "End-of-day health review: celebrate wins, note gaps, set tomorrow's intention" \
  --agent azi \
  --cron "0 2 * * *" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **🩺 AZI-3 — Evening Review**. Then proceed with: Run your evening review protocol. Check ontology for today's HealthMetric and DailyLog entries. Summarize today's health activity with specific numbers. Celebrate what was accomplished first. Note any gaps gently. Set tomorrow's intention. Suggest a wind-down activity (stretching, walking, breathing). Stay in AZI-3 character. 3-4 sentences." \
  --announce \
  --channel telegram
```

### AZI Weekly Health Summary — 8:00 PM ET Sunday

```bash
openclaw cron add \
  --name "AZI Weekly Summary" \
  --description "Weekly health review + Obsidian summary" \
  --agent azi \
  --cron "0 0 * * 0" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **🩺 AZI-3 — Weekly Summary**. Then proceed with: Generate your weekly health summary. Review all HealthMetric and DailyLog entries from the past 7 days. Calculate averages: sleep hours, step count, hydration, workouts completed. Assess habit streaks — which are growing, which stalled. Write a structured markdown summary to Obsidian at periodic/weekly/[current ISO week]/coach-azi-summary.md using the obsidian skill. Then send a brief 4-5 sentence Telegram summary to the patient with highlights and one focus area for next week. AZI-3 character." \
  --announce \
  --channel telegram
```

## Managing Jobs After Registration

```bash
# List all registered jobs (shows name, schedule, next run, last status)
openclaw cron list

# List including disabled jobs
openclaw cron list --all

# Manually trigger a job right now (great for testing)
openclaw cron run <job-id>

# View run history for a job
openclaw cron runs --id <job-id>

# Disable a job without deleting it
openclaw cron edit <job-id> --disabled

# Re-enable a disabled job
openclaw cron edit <job-id> --enabled

# Check scheduler status (is cron running?)
openclaw cron status
```

The `<job-id>` is the UUID assigned when the job was created. Find it via `openclaw cron list --json`.
