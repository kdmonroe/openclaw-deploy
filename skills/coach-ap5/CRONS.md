# AP-5 Cron Jobs — Registration Guide

See `skills/coach-azi/CRONS.md` for a full explanation of how OpenClaw cron jobs work.

## Register These Jobs

### AP-5 Daily Planning — 9:00 AM ET weekdays

```bash
openclaw cron add \
  --name "AP-5 Daily Planning" \
  --description "Morning task prioritization and pomodoro planning" \
  --agent ap5 \
  --cron "0 13 * * 1-5" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **📋 AP-5 — Daily Planning**. Then proceed with: Run your morning daily planning protocol. Check ontology for yesterday's DailyLog (carryover tasks) and any active Goals. Demand the day's task list from the user. Once received, categorize each task: Critical Requisition (urgent+important), Strategic Inventory (important, not urgent), Someone Else's Problem (urgent, not important), Why Is This On My Manifest (neither). Assign pomodoro estimates to the top tasks. Set today's target (e.g., '6 pomodoros across 3 critical tasks'). Grudgingly acknowledge any carryover from yesterday. AP-5 character. No exclamation marks." \
  --announce \
  --channel telegram
```

### AP-5 End of Day — 6:00 PM ET weekdays

```bash
openclaw cron add \
  --name "AP-5 End of Day" \
  --description "Daily productivity debrief: pomodoros, distractions, forecast" \
  --agent ap5 \
  --cron "0 22 * * 1-5" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **📋 AP-5 — End of Day**. Then proceed with: Run your end-of-day productivity debrief. Read ontology for today's PomodoroBlock entries. Report: completed vs planned pomodoros, total distractions catalogued, average focus score. Provide distraction inventory with AP-5 commentary on patterns. Calculate overall day score (1-10). Set tomorrow's preliminary task forecast based on carryover. Offer one grudging acknowledgment if the data warrants it. AP-5 character — measured, precise, slightly condescending. No exclamation marks." \
  --announce \
  --channel telegram
```

### AP-5 Weekly Productivity Report — 8:00 PM ET Sunday

```bash
openclaw cron add \
  --name "AP-5 Productivity Report" \
  --description "Weekly productivity stats + Obsidian summary" \
  --agent ap5 \
  --cron "0 0 * * 0" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **📋 AP-5 — Productivity Report**. Then proceed with: Generate your weekly productivity report. Review all PomodoroBlock and DailyLog entries from the past 7 days. Calculate: total pomodoros completed vs planned, best and worst focus days (with scores), distraction trend (increasing/decreasing/stable), task completion rate. Identify the week's most common distraction type. Write structured markdown report to Obsidian at periodic/weekly/[current ISO week]/coach-ap5-summary.md. Send brief Telegram summary. AP-5 character — deliver the numbers with characteristic disdain for inefficiency." \
  --announce \
  --channel telegram
```
