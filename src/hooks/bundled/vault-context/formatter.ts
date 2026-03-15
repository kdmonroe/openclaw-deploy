import type { AgentVaultConfig } from "./agent-config.js";
import type { DailyNoteData, WeeklyNoteData } from "./vault-reader.js";

const MAX_CONTEXT_CHARS = 3000;
const MAX_SECTION_CHARS = 500;
const MAX_WEEKLY_CHARS = 800;

export function formatVaultContext(params: {
  agentConfig: AgentVaultConfig;
  todayNote: DailyNoteData | null;
  yesterdayNote: DailyNoteData | null;
  weeklyNote: WeeklyNoteData | null;
  today: string;
  yesterday: string;
}): string | null {
  const { agentConfig, todayNote, yesterdayNote, weeklyNote, today, yesterday } = params;
  const lines: string[] = [];

  lines.push(`# ${agentConfig.contextHeader} (auto-injected from vault)`);
  lines.push("");

  // Today's metrics
  lines.push(`## Today (${today})`);
  if (todayNote) {
    const fmLines = formatFrontmatterKeys(agentConfig.frontmatterKeys, todayNote.frontmatter);
    if (fmLines.length > 0) {
      lines.push(...fmLines);
    }
    for (const section of agentConfig.sections) {
      const content = findSection(todayNote.sections, section);
      if (content) {
        lines.push("");
        lines.push(`### ${section}`);
        lines.push(truncate(content, MAX_SECTION_CHARS));
      }
    }
  } else {
    lines.push("_No daily note yet._");
  }

  // Yesterday's metrics (frontmatter only, compact)
  lines.push("");
  lines.push(`## Yesterday (${yesterday})`);
  if (yesterdayNote) {
    const fmLines = formatFrontmatterKeys(agentConfig.frontmatterKeys, yesterdayNote.frontmatter);
    if (fmLines.length > 0) {
      lines.push(...fmLines);
    }
  } else {
    lines.push("_No daily note._");
  }

  // Weekly note (truncated summary)
  if (weeklyNote) {
    lines.push("");
    lines.push(`## Weekly Note (${weeklyNote.week})`);
    lines.push(truncate(weeklyNote.content, MAX_WEEKLY_CHARS));
  }

  const result = lines.join("\n");

  if (result.length > MAX_CONTEXT_CHARS) {
    return result.slice(0, MAX_CONTEXT_CHARS - 20) + "\n\n...(truncated)";
  }

  // Return null if we have basically no data
  const hasData = todayNote || yesterdayNote || weeklyNote;
  return hasData ? result : null;
}

function formatFrontmatterKeys(keys: string[], frontmatter: Record<string, unknown>): string[] {
  const lines: string[] = [];
  for (const key of keys) {
    const val = frontmatter[key];
    if (val === undefined || val === null) {
      continue;
    }
    lines.push(`- **${formatKeyLabel(key)}:** ${formatValue(val)}`);
  }
  return lines;
}

function formatKeyLabel(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatValue(val: unknown): string {
  if (typeof val === "boolean") {
    return val ? "Yes" : "No";
  }
  if (typeof val === "number") {
    return String(val);
  }
  return String(val);
}

function findSection(sections: Record<string, string>, name: string): string | null {
  // Try exact match first, then case-insensitive substring
  const lower = name.toLowerCase();
  if (sections[lower]) {
    return sections[lower];
  }
  for (const [key, content] of Object.entries(sections)) {
    if (key.includes(lower)) {
      return content;
    }
  }
  return null;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return text.slice(0, max - 15) + "\n...(truncated)";
}
