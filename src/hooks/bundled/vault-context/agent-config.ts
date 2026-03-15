export type AgentVaultConfig = {
  /** YAML frontmatter keys to extract from daily notes */
  frontmatterKeys: string[];
  /** h2 section names (lowercase) to extract from daily note body */
  sections: string[];
  /** Whether to include the weekly note */
  includeWeekly: boolean;
  /** Header line for the injected context */
  contextHeader: string;
};

export const AGENT_VAULT_CONFIG: Record<string, AgentVaultConfig> = {
  azi: {
    frontmatterKeys: ["exercise", "exercise_duration", "yoga", "yoga_duration", "mood", "meditate"],
    sections: [],
    includeWeekly: false,
    contextHeader: "Health & Fitness Data",
  },
  ap5: {
    frontmatterKeys: [
      "pomodoro_total",
      "pomodoro_target",
      "pomodoro_home",
      "pomodoro_dev",
      "pomodoro_work",
      "pomodoro_gym",
      "pomodoro_volunteer",
      "pomodoro_cleaning",
      "pomodoro_reading",
      "github_commits",
    ],
    sections: [],
    includeWeekly: true,
    contextHeader: "Productivity Data",
  },
  threepio: {
    frontmatterKeys: ["money_spent", "budget"],
    sections: [],
    includeWeekly: true,
    contextHeader: "Financial Data",
  },
  kaytoo: {
    frontmatterKeys: ["mood", "gratitude"],
    sections: ["gratitude log", "reflections"],
    includeWeekly: true,
    contextHeader: "Wellbeing Data",
  },
  huyang: {
    frontmatterKeys: ["github_commits", "pomodoro_dev", "code"],
    sections: [],
    includeWeekly: false,
    contextHeader: "Development Data",
  },
};

export const DEFAULT_VAULT_PATH = "/root/.openclaw/workspace/repos/general-icloud/icloud_git";
