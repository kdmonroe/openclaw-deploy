# Cron Manager Skill

List and manage scheduled cron jobs.

## Commands

### /jobs

List all scheduled cron jobs with their schedules and status.

**Usage:** `/jobs`

**Output:**

- Job name
- Schedule (with EST conversion)
- Next run time
- Last status (ok/error)

### /jobs run \<job-name\>

Manually trigger a specific job.

**Usage:** `/jobs run Financial Intelligence`

### /jobs disable \<job-name\>

Disable a cron job.

**Usage:** `/jobs disable Tech Scout`

### /jobs enable \<job-name\>

Enable a disabled cron job.

**Usage:** `/jobs enable Tech Scout`

## Implementation

The skill invokes the OpenClaw gateway cron API:

- `cron list` - Lists all jobs
- `cron runs <jobId>` - Gets run history
- `cron run <jobId>` - Triggers a job

## Schedule Reference (EST)

| Cron Expr     | EST Time                        |
| ------------- | ------------------------------- |
| 0 11 \* \* \* | 11 AM                           |
| 0 15 \* \* \* | 3 PM                            |
| 0 20 \* \* \* | 3 PM (UTC is 8 PM EST)          |
| 0 1 \* \* \*  | 8 PM (UTC is 1 AM EST next day) |
