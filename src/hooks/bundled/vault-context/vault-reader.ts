import fs from "node:fs/promises";
import path from "node:path";

export type DailyNoteData = {
  frontmatter: Record<string, unknown>;
  sections: Record<string, string>;
  raw: string;
  date: string;
};

export type WeeklyNoteData = {
  content: string;
  week: string;
};

/**
 * Parse YAML frontmatter from a markdown file.
 * Handles flat key-value pairs only (no nesting). No external YAML dependency.
 */
export function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const yamlBlock = match[1];
  const body = match[2];
  const frontmatter: Record<string, unknown> = {};

  for (const line of yamlBlock.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx < 1) {
      continue;
    }

    const key = trimmed.slice(0, colonIdx).trim();
    const rawValue = trimmed.slice(colonIdx + 1).trim();

    // Strip surrounding quotes
    const value = rawValue.replace(/^["'](.*)["']$/, "$1");

    if (value === "true") {
      frontmatter[key] = true;
    } else if (value === "false") {
      frontmatter[key] = false;
    } else if (value === "" || value === "null") {
      frontmatter[key] = null;
    } else if (/^-?\d+(\.\d+)?$/.test(value)) {
      frontmatter[key] = Number(value);
    } else {
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body };
}

/**
 * Parse h2 sections from markdown body.
 * Returns a map of heading text (lowercase) -> content below it.
 */
export function parseSections(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const parts = body.split(/^## /m);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const newlineIdx = part.indexOf("\n");
    if (newlineIdx < 0) {
      continue;
    }

    const heading = part.slice(0, newlineIdx).trim();
    const content = part.slice(newlineIdx + 1).trim();
    if (heading) {
      sections[heading.toLowerCase()] = content;
    }
  }

  return sections;
}

/**
 * Read and parse a daily note from the vault.
 * Path: {vaultBase}/periodic/daily/{YYYY}/{MM}/{YYYY-MM-DD}.md
 */
export async function readVaultDailyNote(
  vaultBase: string,
  date: string,
): Promise<DailyNoteData | null> {
  const [year, month] = date.split("-");
  const filePath = path.join(vaultBase, "periodic", "daily", year, month, `${date}.md`);

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(raw);
    const sections = parseSections(body);
    return { frontmatter, sections, raw, date };
  } catch {
    return null;
  }
}

/**
 * Read a weekly note from the vault.
 * Path: {vaultBase}/periodic/weekly/{YYYY}/{YYYY}-W{WW}.md
 */
export async function readVaultWeeklyNote(
  vaultBase: string,
  date: string,
): Promise<WeeklyNoteData | null> {
  const week = getISOWeekString(date);
  const year = date.split("-")[0];
  const filePath = path.join(vaultBase, "periodic", "weekly", year, `${week}.md`);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return { content, week };
  } catch {
    return null;
  }
}

/**
 * Compute today's and yesterday's dates in the given timezone.
 */
export function computeDates(now: Date, timezone: string): { today: string; yesterday: string } {
  const today = formatDateInTimezone(now, timezone);

  const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterday = formatDateInTimezone(yesterdayDate, timezone);

  return { today, yesterday };
}

function formatDateInTimezone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${year}-${month}-${day}`;
}

/**
 * Get ISO week string like "2026-W10" from a date string "2026-03-07".
 */
function getISOWeekString(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  // ISO week: Monday is first day of week, week 1 contains Jan 4
  const dayOfWeek = date.getUTCDay() || 7; // Sunday=7
  date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek); // Thursday of this week
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}
