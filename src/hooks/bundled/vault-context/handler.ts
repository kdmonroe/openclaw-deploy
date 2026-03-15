import type { WorkspaceBootstrapFile } from "../../../agents/workspace.js";
import { isSubagentSessionKey } from "../../../routing/session-key.js";
import { resolveHookConfig } from "../../config.js";
import { isAgentBootstrapEvent, type HookHandler } from "../../hooks.js";
import { AGENT_VAULT_CONFIG, DEFAULT_VAULT_PATH } from "./agent-config.js";
import { formatVaultContext } from "./formatter.js";
import { computeDates, readVaultDailyNote, readVaultWeeklyNote } from "./vault-reader.js";

const HOOK_KEY = "vault-context";
const LOG_PREFIX = `[${HOOK_KEY}]`;

const vaultContextHook: HookHandler = async (event) => {
  if (!isAgentBootstrapEvent(event)) {
    return;
  }

  const context = event.context;

  // Skip subagent sessions
  if (context.sessionKey && isSubagentSessionKey(context.sessionKey)) {
    return;
  }

  const cfg = context.cfg;
  const hookConfig = resolveHookConfig(cfg, HOOK_KEY);
  if (!hookConfig || hookConfig.enabled === false) {
    return;
  }

  // Check if this agent has a vault config
  const agentId = context.agentId;
  if (!agentId) {
    return;
  }

  const agentVaultCfg = AGENT_VAULT_CONFIG[agentId];
  if (!agentVaultCfg) {
    return;
  }

  // Check per-agent disable
  const agentOverrides = hookConfig.agents as Record<string, boolean> | undefined;
  if (agentOverrides?.[agentId] === false) {
    return;
  }

  if (!Array.isArray(context.bootstrapFiles)) {
    return;
  }

  // Resolve vault base path
  const vaultBase = (hookConfig.vaultPath as string) ?? DEFAULT_VAULT_PATH;

  // Compute dates in user timezone
  const timezone =
    cfg?.agents?.defaults?.userTimezone ??
    cfg?.agents?.list?.find((a) => a.id === agentId)?.heartbeat?.activeHours?.timezone ??
    "America/New_York";
  const { today, yesterday } = computeDates(new Date(), timezone);

  // Read daily notes
  const [todayNote, yesterdayNote] = await Promise.all([
    readVaultDailyNote(vaultBase, today),
    readVaultDailyNote(vaultBase, yesterday),
  ]);

  // Read weekly note if configured
  const weeklyNote = agentVaultCfg.includeWeekly
    ? await readVaultWeeklyNote(vaultBase, today)
    : null;

  // Format context
  const content = formatVaultContext({
    agentConfig: agentVaultCfg,
    todayNote,
    yesterdayNote,
    weeklyNote,
    today,
    yesterday,
  });

  if (!content) {
    return;
  }

  // Inject into bootstrap files
  const bootstrapFile: WorkspaceBootstrapFile = {
    name: "VAULT_CONTEXT.md" as WorkspaceBootstrapFile["name"],
    path: `vault-context:${agentId}`,
    content,
    missing: false,
  };

  context.bootstrapFiles = [...context.bootstrapFiles, bootstrapFile];

  console.debug?.(
    `${LOG_PREFIX} Injected vault context for ${agentId} (today=${today}, ` +
      `hasToday=${!!todayNote}, hasYesterday=${!!yesterdayNote}, len=${content.length})`,
  );
};

export default vaultContextHook;
