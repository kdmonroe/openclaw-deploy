import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../../../config/config.js";
import { makeTempWorkspace } from "../../../test-helpers/workspace.js";
import type { AgentBootstrapHookContext } from "../../hooks.js";
import { createHookEvent } from "../../hooks.js";
import { AGENT_VAULT_CONFIG } from "./agent-config.js";
import { formatVaultContext } from "./formatter.js";
import handler from "./handler.js";
import { parseFrontmatter, parseSections, computeDates } from "./vault-reader.js";

function makeConfig(overrides?: Record<string, unknown>): OpenClawConfig {
  return {
    hooks: {
      internal: {
        entries: {
          "vault-context": { enabled: true, ...overrides },
        },
      },
    },
  };
}

function makeContext(
  agentId: string,
  cfg: OpenClawConfig,
  extra?: Partial<AgentBootstrapHookContext>,
): AgentBootstrapHookContext {
  return {
    workspaceDir: "/tmp/test",
    bootstrapFiles: [],
    cfg,
    sessionKey: `agent:${agentId}:main`,
    agentId,
    ...extra,
  };
}

async function createDailyNote(
  vaultBase: string,
  date: string,
  frontmatter: Record<string, unknown>,
  body = "",
): Promise<void> {
  const [year, month] = date.split("-");
  const dir = path.join(vaultBase, "periodic", "daily", year, month);
  await fs.mkdir(dir, { recursive: true });

  const yamlLines = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n");
  const content = `---\n${yamlLines}\n---\n${body}`;
  await fs.writeFile(path.join(dir, `${date}.md`), content);
}

describe("vault-context hook", () => {
  it("skips non-bootstrap events", async () => {
    const context = makeContext("ap5", makeConfig());
    const event = createHookEvent("gateway", "startup", "test", context);
    await handler(event);
    expect(context.bootstrapFiles).toHaveLength(0);
  });

  it("skips when hook is disabled", async () => {
    const cfg = makeConfig({ enabled: false });
    const context = makeContext("ap5", cfg);
    const event = createHookEvent("agent", "bootstrap", "agent:ap5:main", context);
    await handler(event);
    expect(context.bootstrapFiles).toHaveLength(0);
  });

  it("skips unknown agents", async () => {
    const context = makeContext("default", makeConfig());
    const event = createHookEvent("agent", "bootstrap", "agent:default:main", context);
    await handler(event);
    expect(context.bootstrapFiles).toHaveLength(0);
  });

  it("skips subagent sessions", async () => {
    const context = makeContext("ap5", makeConfig());
    context.sessionKey = "agent:ap5:subagent:abc";
    const event = createHookEvent("agent", "bootstrap", "agent:ap5:subagent:abc", context);
    await handler(event);
    expect(context.bootstrapFiles).toHaveLength(0);
  });

  it("skips agents disabled via config", async () => {
    const cfg = makeConfig({ agents: { ap5: false } });
    const context = makeContext("ap5", cfg);
    const event = createHookEvent("agent", "bootstrap", "agent:ap5:main", context);
    await handler(event);
    expect(context.bootstrapFiles).toHaveLength(0);
  });

  it("injects VAULT_CONTEXT.md for configured agent with daily note", async () => {
    const tempDir = await makeTempWorkspace("vault-ctx-");
    const today = new Date().toISOString().slice(0, 10);

    await createDailyNote(tempDir, today, {
      pomodoro_total: 6,
      pomodoro_target: 10,
      pomodoro_dev: 4,
      pomodoro_work: 2,
      github_commits: 3,
    });

    const cfg = makeConfig({ vaultPath: tempDir });
    const context = makeContext("ap5", cfg);
    const event = createHookEvent("agent", "bootstrap", "agent:ap5:main", context);
    await handler(event);

    expect(context.bootstrapFiles).toHaveLength(1);
    const injected = context.bootstrapFiles[0];
    expect(injected.name).toBe("VAULT_CONTEXT.md");
    expect(injected.content).toContain("Pomodoro Total");
    expect(injected.content).toContain("6");
    expect(injected.content).toContain("Github Commits");
    expect(injected.missing).toBe(false);
  });

  it("handles missing daily note gracefully", async () => {
    const tempDir = await makeTempWorkspace("vault-ctx-empty-");

    const cfg = makeConfig({ vaultPath: tempDir });
    const context = makeContext("ap5", cfg);
    const event = createHookEvent("agent", "bootstrap", "agent:ap5:main", context);
    await handler(event);

    // No notes at all -> null content -> no injection
    expect(context.bootstrapFiles).toHaveLength(0);
  });
});

describe("parseFrontmatter", () => {
  it("parses boolean, number, and string values", () => {
    const content = `---
exercise: true
mood: 4
money_spent: 25.5
yoga: false
name: Keon
empty:
---
Body text`;

    const { frontmatter, body } = parseFrontmatter(content);
    expect(frontmatter.exercise).toBe(true);
    expect(frontmatter.mood).toBe(4);
    expect(frontmatter.money_spent).toBe(25.5);
    expect(frontmatter.yoga).toBe(false);
    expect(frontmatter.name).toBe("Keon");
    expect(frontmatter.empty).toBeNull();
    expect(body).toBe("Body text");
  });

  it("handles quoted values", () => {
    const content = `---
learn: "false"
note: 'hello world'
---
`;
    const { frontmatter } = parseFrontmatter(content);
    // "false" as string is parsed to boolean false (after stripping quotes)
    expect(frontmatter.learn).toBe(false);
    expect(frontmatter.note).toBe("hello world");
  });

  it("returns empty frontmatter for files without frontmatter", () => {
    const { frontmatter, body } = parseFrontmatter("# Just a heading\n\nSome text");
    expect(frontmatter).toEqual({});
    expect(body).toBe("# Just a heading\n\nSome text");
  });
});

describe("parseSections", () => {
  it("splits on h2 headings", () => {
    const body = `Some intro text

## Gratitude Log
1. Family
2. Health

## Reflections
Things went well today.

## Random
Other stuff`;

    const sections = parseSections(body);
    expect(sections["gratitude log"]).toContain("Family");
    expect(sections["reflections"]).toContain("Things went well");
    expect(sections["random"]).toContain("Other stuff");
  });
});

describe("computeDates", () => {
  it("returns today and yesterday in the given timezone", () => {
    const now = new Date("2026-03-07T10:00:00Z");
    const { today, yesterday } = computeDates(now, "America/New_York");
    expect(today).toBe("2026-03-07");
    expect(yesterday).toBe("2026-03-06");
  });

  it("handles timezone day boundary", () => {
    // 2 AM UTC on March 7 = still March 6 in New York (EST = UTC-5)
    const now = new Date("2026-03-07T02:00:00Z");
    const { today, yesterday } = computeDates(now, "America/New_York");
    expect(today).toBe("2026-03-06");
    expect(yesterday).toBe("2026-03-05");
  });
});

describe("formatVaultContext", () => {
  it("formats context under 3000 chars", () => {
    const agentConfig = AGENT_VAULT_CONFIG["ap5"];
    const result = formatVaultContext({
      agentConfig,
      todayNote: {
        frontmatter: {
          pomodoro_total: 6,
          pomodoro_target: 10,
          pomodoro_dev: 4,
          pomodoro_work: 2,
          github_commits: 3,
        },
        sections: {},
        raw: "",
        date: "2026-03-07",
      },
      yesterdayNote: {
        frontmatter: { pomodoro_total: 8, pomodoro_target: 10 },
        sections: {},
        raw: "",
        date: "2026-03-06",
      },
      weeklyNote: null,
      today: "2026-03-07",
      yesterday: "2026-03-06",
    });

    expect(result).not.toBeNull();
    expect(result!.length).toBeLessThan(3000);
    expect(result).toContain("Pomodoro Total");
    expect(result).toContain("6");
    expect(result).toContain("Yesterday");
  });

  it("returns null when no data exists", () => {
    const result = formatVaultContext({
      agentConfig: AGENT_VAULT_CONFIG["ap5"],
      todayNote: null,
      yesterdayNote: null,
      weeklyNote: null,
      today: "2026-03-07",
      yesterday: "2026-03-06",
    });
    expect(result).toBeNull();
  });
});
