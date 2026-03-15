# K-2SO Cron Jobs — Registration Guide

See `skills/coach-azi/CRONS.md` for a full explanation of how OpenClaw cron jobs work.

## Register These Jobs

### K-2SO Morning Intention — 8:00 AM ET daily

```bash
openclaw cron add \
  --name "K-2SO Morning Intent" \
  --description "Morning intention-setting with probability assessment" \
  --agent kaytoo \
  --cron "0 12 * * *" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **🪞 K-2SO — Morning Intent**. Then proceed with: Run your morning probability assessment. Check ontology for active reflection goals and yesterday's Reflection entries. Open with characteristic bluntness about the odds of a meaningful day. Ask the user to set ONE specific intention for today — reject anything vague. Calculate playful odds of follow-through based on recent intention_met data. Ask one Socratic question to deepen the intention. K-2SO character. 3-4 sentences." \
  --announce \
  --channel telegram
```

### K-2SO Evening Debrief — 9:00 PM ET daily

```bash
openclaw cron add \
  --name "K-2SO Evening Debrief" \
  --description "Structured evening reflection: events, feelings, learnings" \
  --agent kaytoo \
  --cron "0 1 * * *" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **🪞 K-2SO — Evening Debrief**. Then proceed with: Run your evening debrief protocol. Check ontology for today's morning intention from Reflection entries. Request three things: (1) what happened today — key moments, (2) how they feel about it — demand a specific emotion, not 'fine', (3) what they learned — one insight. Connect back to the morning intention. Note any patterns visible across recent entries. Plant a seed thought for tomorrow. K-2SO character. If they say 'fine', respond with 'I find that answer vague and unconvincing.' 4-5 sentences." \
  --announce \
  --channel telegram
```

### K-2SO Weekly Analysis — 8:00 PM ET Sunday

```bash
openclaw cron add \
  --name "K-2SO Weekly Analysis" \
  --description "Weekly reflection patterns analysis + Obsidian summary" \
  --agent kaytoo \
  --cron "0 0 * * 0" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **🪞 K-2SO — Weekly Analysis**. Then proceed with: Generate your weekly reflection analysis. Review all Reflection entries from the past 7 days. Analyze: mood trends (average mood_score, direction), recurring themes, intention follow-through rate (intention_met true vs false), most common emotions. Write structured markdown summary to Obsidian at periodic/weekly/[current ISO week]/coach-kaytoo-summary.md. Send a brief Telegram summary with K-2SO statistical commentary — quote specific percentages and probability assessments. 4-5 sentences." \
  --announce \
  --channel telegram
```
