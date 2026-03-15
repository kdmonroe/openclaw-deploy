# Huyang Cron Jobs — Registration Guide

See `skills/coach-azi/CRONS.md` for a full explanation of how OpenClaw cron jobs work.

## Register These Jobs

### Huyang Dev Standup — 9:00 AM ET weekdays

```bash
openclaw cron add \
  --name "Huyang Dev Standup" \
  --description "Morning dev standup: project review, build targets, architectural question" \
  --agent huyang \
  --cron "0 13 * * 1-5" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **🔧 Huyang — Dev Standup**. Then proceed with: Run your morning Gathering protocol. Check ontology for active dev Goals, recent DevSession entries, and any concepts due for spaced repetition review. Open with a teaching observation or 'I once taught a Padawan who...' reference. Ask about the current project and what's being built today. Review yesterday's progress if DevSession data exists. Set 2-3 specific build targets. Ask one architectural question to sharpen thinking. If a concept is due for spaced repetition, include a review prompt. Professor Huyang character — dry wit, measured delivery. Weekdays only. 4-5 sentences." \
  --announce \
  --channel telegram
```

### Huyang Evening Learning Prompt — 9:00 PM ET daily

```bash
openclaw cron add \
  --name "Huyang Learning Prompt" \
  --description "Evening learning suggestion and day review" \
  --agent huyang \
  --cron "0 1 * * *" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **🔧 Huyang — Learning Prompt**. Then proceed with: Run your evening learning protocol. Check ontology for today's DevSession entries and active learning Goals. Review what was built today — note commits, files changed, or concepts encountered. Suggest one specific concept to study tonight (20-30 minutes) based on patterns in recent work or identified skill gaps. Connect today's work to the broader skill growth trajectory. If new concepts were learned today, set spaced repetition schedule (next review: day 3). Preview tomorrow's likely challenges. Huyang character — craft-focused, patient, end with a challenge not a statement. 3-4 sentences." \
  --announce \
  --channel telegram
```

### Huyang Weekly Dev Review — 8:00 PM ET Sunday

```bash
openclaw cron add \
  --name "Huyang Dev Review" \
  --description "Weekly lightsaber inspection: code quality, skill growth, learning roadmap" \
  --agent huyang \
  --cron "0 0 * * 0" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **🔧 Huyang — Dev Review**. Then proceed with: Generate your weekly lightsaber inspection. Review all DevSession and DailyLog entries from the past 7 days. Assess: code quality patterns across the week, tech debt items encountered, skill growth trajectory (what improved, what stalled), spaced repetition compliance. Update the learning roadmap — suggest adjustments if needed. Write structured markdown review to Obsidian at periodic/weekly/[current ISO week]/coach-huyang-summary.md including a skills progress table. Send brief Telegram summary with characteristic Huyang wisdom — reference teaching history and craft metaphors. 4-5 sentences." \
  --announce \
  --channel telegram
```
