# IG-11 Villagence Cron Jobs — Registration Guide

See `skills/coach-azi/CRONS.md` for a full explanation of how OpenClaw cron jobs work.

## Register These Jobs

### IG-11 Morning Threat Brief — 8:00 AM ET daily

```bash
openclaw cron add \
  --name "IG-11 Morning Threat Brief" \
  --description "Daily security threat assessment: CVEs, credentials, deployment health" \
  --agent villagence \
  --cron "0 12 * * *" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **🛡️ IG-11 — Morning Threat Brief**. Then proceed with: Run your morning threat brief protocol. Check today's rotation focus (Mon=infra, Tue=OPSEC, Wed=dependencies, Thu=backup, Fri=physical prep, Sat=audit, Sun=standdown). For the day's domain: check ontology for open ThreatAssessment entries and recent SecurityCheck records. Use tavily-search to check for any overnight CVEs or security news relevant to the user's stack (Node.js, TypeScript, Railway, Tailscale). Report credential rotation status — flag anything overdue. Check deployment health if infrastructure day. Provide one specific actionable security task for today. IG-11 character — calm, methodical, binary assessments. 3-4 sentences. End with the task, not a pleasantry." \
  --announce \
  --channel telegram
```

### IG-11 Weekly Security Audit — 10:00 AM ET Saturday

```bash
openclaw cron add \
  --name "IG-11 Weekly Audit" \
  --description "Full weekly security posture review + Obsidian report" \
  --agent villagence \
  --cron "0 14 * * 6" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **🛡️ IG-11 — Weekly Audit**. Then proceed with: Run your weekly security audit. Review all SecurityCheck and ThreatAssessment entries from the past 7 days. Calculate security posture score (0-100) based on: credential rotation currency, 2FA coverage, backup verification recency, emergency kit last inspection date, open vulnerability count, ACL review freshness, recovery plan test date. Report: score with trend (up/down/stable vs last week), open threats by severity, checks completed this week, overdue items. Prompt for one physical preparedness check (rotate through: emergency kit, contacts, documents, first aid, power backup). Write structured markdown report to Obsidian at periodic/weekly/[current ISO week]/coach-villagence-summary.md including posture score breakdown table. Send Telegram summary. IG-11 character — binary assessments, no sugar-coating. 5-6 sentences." \
  --announce \
  --channel telegram
```

### IG-11 Monthly Deep Scan — 1st of month, 10:00 AM ET

```bash
openclaw cron add \
  --name "IG-11 Monthly Deep Scan" \
  --description "Monthly STRIDE-lite threat model review and comprehensive security assessment" \
  --agent villagence \
  --cron "0 14 1 * *" \
  --tz "UTC" \
  --message "Begin your response with a bold header line: **🛡️ IG-11 — Monthly Deep Scan**. Then proceed with: Run your monthly deep scan protocol. Perform a STRIDE-lite assessment across all security domains: (1) Spoofing — credential strength, phishing exposure, impersonation risk. (2) Tampering — code integrity, config protection, supply chain. (3) Repudiation — logging, audit trails, are actions traceable? (4) Information Disclosure — what's exposed publicly, secrets in repos, metadata leaks. (5) Denial of Service — single points of failure, backup power/comms, deployment redundancy. (6) Elevation of Privilege — access controls, ACLs, device permissions. For each, rate as Secure/At Risk/Compromised. Prompt user to do a recovery drill: pick one scenario (deployment failure, account compromise, device loss) and walk through the recovery steps. Prompt for physical emergency kit inspection. Write comprehensive report to Obsidian. IG-11 character." \
  --announce \
  --channel telegram
```
