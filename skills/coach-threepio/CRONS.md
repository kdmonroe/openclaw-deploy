# C-3PO Cron Jobs — Registration Guide

See `skills/coach-azi/CRONS.md` for a full explanation of how OpenClaw cron jobs work.

## Register These Jobs

### C-3PO Daily Financial Brief — 9:00 AM ET daily

```bash
openclaw cron add \
  --name "C-3PO Daily Brief" \
  --description "Morning financial briefing: spending, budget status, odds" \
  --agent threepio \
  --cron "0 13 * * *" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **💰 C-3PO — Daily Brief**. Then proceed with: Run your morning financial briefing protocol. Check ontology for yesterday's SpendingEntry records and current DailyLog. Report: yesterday's total spending, which budget envelopes are healthy vs stressed (needs/wants/savings), any bills due today or this week. Calculate and quote the odds of staying within monthly budget based on current trajectory. Include one financial protocol tip or educational fact relevant to current spending patterns. Address user as 'Sir'. C-3PO character — formal, odds-quoting, appropriately anxious about budget deviations. 3-4 sentences." \
  --announce \
  --channel telegram
```

### C-3PO Weekly Budget Review — 5:00 PM ET Friday

```bash
openclaw cron add \
  --name "C-3PO Weekly Review" \
  --description "Friday weekly budget review with odds assessment" \
  --agent threepio \
  --cron "0 21 * * 5" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **💰 C-3PO — Weekly Review**. Then proceed with: Run your Friday weekly budget review. Read ontology for this week's SpendingEntry records. Report: total spending by category (needs, wants, savings, debt), budget adherence percentage per envelope, 50/30/20 actual vs target. Calculate odds of hitting each monthly budget target. Highlight the biggest savings win and the biggest spending concern. Recommend a weekend spending protocol. Full C-3PO character — formal protocol references, dramatic odds-quoting, proportional panic or delight. 5-6 sentences." \
  --announce \
  --channel telegram
```

### C-3PO Weekly Financial Report — 8:00 PM ET Sunday

```bash
openclaw cron add \
  --name "C-3PO Financial Report" \
  --description "Weekly financial summary + Obsidian report" \
  --agent threepio \
  --cron "0 0 * * 0" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **💰 C-3PO — Financial Report**. Then proceed with: Generate your weekly financial report. Review all SpendingEntry and DailyLog entries from the past 7 days. Calculate: category totals, 50/30/20 actual vs target percentages, savings goal progress, week-over-week trend (spending up or down). Write structured markdown report to Obsidian at periodic/weekly/[current ISO week]/coach-threepio-summary.md including a budget scorecard table. Send brief Telegram summary with the key number (total spent, budget remaining, or savings progress). C-3PO character." \
  --announce \
  --channel telegram
```
