#!/usr/bin/env node
import { execSync, spawn } from "node:child_process";
// Railway startup: patch old config for v2026.3.12 compatibility, then start gateway
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from "node:fs";

const CONFIG = "/data/.openclaw/openclaw.json";
const PORT = process.env.PORT || "8080";

// Step 0: Fix git safe.directory (volume owned by node, shell runs as root)
try {
  execSync("git config --global --add safe.directory '*'", { stdio: "ignore" });
} catch {}

// Step 0a: Symlink gog config from persistent volume
const GOG_CONFIG_VOL = "/data/.openclaw/gogcli-config";
const GOG_CONFIG_HOME = "/root/.config/gogcli";
if (existsSync(GOG_CONFIG_VOL)) {
  try {
    const stat = lstatSync(GOG_CONFIG_HOME);
    if (!stat.isSymbolicLink()) {
      rmSync(GOG_CONFIG_HOME, { recursive: true, force: true });
      mkdirSync("/root/.config", { recursive: true });
      symlinkSync(GOG_CONFIG_VOL, GOG_CONFIG_HOME);
      console.log(`[startup] symlinked gog config → ${GOG_CONFIG_VOL}`);
    }
  } catch {
    mkdirSync("/root/.config", { recursive: true });
    symlinkSync(GOG_CONFIG_VOL, GOG_CONFIG_HOME);
    console.log(`[startup] symlinked gog config → ${GOG_CONFIG_VOL}`);
  }
}

// Step 0b: Install gog CLI (Google Workspace) if missing
try {
  execSync("which gog", { stdio: "ignore" });
} catch {
  console.log("[startup] installing gog CLI...");
  try {
    const arch = execSync("dpkg --print-architecture", { encoding: "utf8" }).trim();
    execSync(
      `curl -fsSL https://github.com/steipete/gogcli/releases/download/v0.12.0/gogcli_0.12.0_linux_${arch}.tar.gz | tar xz -C /usr/local/bin gog`,
      { stdio: "inherit", timeout: 30000 },
    );
    console.log("[startup] gog CLI installed");
  } catch (e) {
    console.log("[startup] gog install failed:", e.message, "(continuing)");
  }
}

// Step 0b: Install gh CLI if missing and GH_TOKEN is set
if (process.env.GH_TOKEN) {
  try {
    execSync("which gh", { stdio: "ignore" });
  } catch {
    console.log("[startup] installing gh CLI...");
    try {
      execSync(
        "curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg 2>/dev/null && " +
          'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list && ' +
          "apt-get update -qq && apt-get install -y -qq gh >/dev/null 2>&1",
        { stdio: "inherit", timeout: 60000 },
      );
      // Configure gh auth (pipe token via env to avoid shell escaping issues)
      execSync("gh auth login --with-token", {
        input: process.env.GH_TOKEN,
        stdio: ["pipe", "ignore", "ignore"],
      });
      // Configure git credential helper
      execSync("gh auth setup-git", { stdio: "ignore" });
      console.log("[startup] gh CLI installed and authenticated");
    } catch (e) {
      console.log("[startup] gh CLI install failed:", e.message, "(continuing)");
    }
  }
}

// Step 1: Patch config
if (existsSync(CONFIG)) {
  try {
    const config = JSON.parse(readFileSync(CONFIG, "utf8"));
    let changed = false;

    // Log current plugin state for debugging
    if (config.plugins) {
      console.log("[startup] plugins keys:", Object.keys(config.plugins));
      if (config.plugins.installed) {
        console.log("[startup] plugins.installed:", JSON.stringify(config.plugins.installed));
      }
      if (config.plugins.entries) {
        console.log("[startup] plugins.entries keys:", Object.keys(config.plugins.entries));
      }
    }

    // Remove plugins with entry='.' from installed array (incompatible with v2026.3.12)
    if (config.plugins?.installed) {
      const before = config.plugins.installed.length;
      config.plugins.installed = config.plugins.installed.filter(
        (p) => p.entry !== "." && p.entry !== "./",
      );
      if (config.plugins.installed.length < before) {
        console.log("[startup] removed bad plugin.installed entries");
        changed = true;
      }
    }

    // Remove plugins.entries with entry='.' (object form)
    if (config.plugins?.entries) {
      for (const [name, val] of Object.entries(config.plugins.entries)) {
        if (val?.entry === "." || val?.entry === "./" || val === ".") {
          delete config.plugins.entries[name];
          console.log(`[startup] removed bad plugins.entries.${name}`);
          changed = true;
        }
      }
    }

    // Clear stale plugins config EXCEPT lossless-claw context engine slot
    if (config.plugins) {
      const lcmSlot = config.plugins?.slots?.contextEngine;
      const lcmConfig = config.plugins?.config?.["lossless-claw"];
      console.log("[startup] clearing old plugins config (preserving context engine slot)");
      delete config.plugins;
      if (lcmSlot === "lossless-claw") {
        config.plugins = { slots: { contextEngine: "lossless-claw" } };
        if (lcmConfig) {
          config.plugins.config = { "lossless-claw": lcmConfig };
        }
        console.log("[startup] preserved lossless-claw context engine slot");
      }
      changed = true;
    }

    // Ensure LCM database uses persistent volume path
    if (
      config.plugins?.config?.["lossless-claw"] !== undefined ||
      config.plugins?.slots?.contextEngine === "lossless-claw"
    ) {
      if (!config.plugins) {
        config.plugins = {};
      }
      if (!config.plugins.config) {
        config.plugins.config = {};
      }
      if (!config.plugins.config["lossless-claw"]) {
        config.plugins.config["lossless-claw"] = {};
      }
      if (config.plugins.config["lossless-claw"].dbPath !== "/data/.openclaw/lcm.db") {
        config.plugins.config["lossless-claw"].dbPath = "/data/.openclaw/lcm.db";
        console.log("[startup] set LCM dbPath to /data/.openclaw/lcm.db (persistent volume)");
        changed = true;
      }
    }

    // Set gateway.mode if missing
    if (!config.gateway) {
      config.gateway = {};
    }
    if (!config.gateway.mode) {
      config.gateway.mode = "local";
      console.log("[startup] set gateway.mode=local");
      changed = true;
    }

    // Configure Tailscale if TS_AUTHKEY is set and tailscale binary is available
    const tsAvailable = (() => {
      try {
        execSync("which tailscale", { stdio: "ignore" });
        return true;
      } catch {
        return false;
      }
    })();
    if (process.env.TS_AUTHKEY && tsAvailable) {
      // Don't set tailscale.mode — gateway enforces bind=loopback for serve mode,
      // which breaks Railway health checks. Instead, run tailscale serve independently
      // in the startup script and let the gateway stay on --bind lan.
      if (config.gateway?.tailscale?.mode) {
        console.log(
          `[startup] clearing tailscale.mode=${config.gateway.tailscale.mode} (managed externally)`,
        );
        delete config.gateway.tailscale.mode;
        changed = true;
      }
      if (!config.gateway.auth) {
        config.gateway.auth = {};
      }
      if (!config.gateway.auth.allowTailscale) {
        config.gateway.auth.allowTailscale = true;
        console.log("[startup] set auth.allowTailscale=true");
        changed = true;
      }
      // trustedProxies: tailscale serve proxies from loopback
      if (!config.gateway.trustedProxies) {
        config.gateway.trustedProxies = [];
      }
      if (!config.gateway.trustedProxies.includes("127.0.0.1")) {
        config.gateway.trustedProxies.push("127.0.0.1");
        console.log("[startup] added 127.0.0.1 to trustedProxies for tailscale serve");
        changed = true;
      }
    } else if (
      config.gateway?.tailscale?.mode === "serve" ||
      config.gateway?.tailscale?.mode === "funnel"
    ) {
      // No Tailscale available — disable serve/funnel to avoid startup errors
      console.log(
        `[startup] disabling tailscale mode=${config.gateway.tailscale.mode} (binary not available)`,
      );
      delete config.gateway.tailscale.mode;
      changed = true;
    }

    // Clear entire models config — stale model refs from v2026.2.x trigger
    // ANTHROPIC_MODEL_ALIASES circular reference in v2026.3.12 config loader
    if (config.models) {
      console.log("[startup] clearing stale models config:", Object.keys(config.models));
      delete config.models;
      changed = true;
    }

    // Clear agents.defaults model refs — model refs in config trigger the
    // ANTHROPIC_MODEL_ALIASES circular reference bug during config loading.
    // The source code defaults (DEFAULT_PROVIDER=minimax, DEFAULT_MODEL=MiniMax-M2.7)
    // handle the fallback when config has no model set.
    if (config.agents?.defaults) {
      const cleared = [];
      for (const key of ["model", "imageModel", "pdfModel"]) {
        if (config.agents.defaults[key]) {
          delete config.agents.defaults[key];
          cleared.push(key);
        }
      }
      if (cleared.length) {
        console.log("[startup] cleared stale model refs from agents.defaults:", cleared.join(", "));
        changed = true;
      }
    }

    // Clear per-agent model overrides — all agents use the global default (minimax/MiniMax-M2.7)
    if (Array.isArray(config.agents?.list)) {
      for (const agent of config.agents.list) {
        if (agent.model) {
          console.log(
            `[startup] cleared model override for agent "${agent.id}": ${JSON.stringify(agent.model)}`,
          );
          delete agent.model;
        }
      }
      changed = true;
    }

    // Clear channel-specific model overrides
    if (config.channels?.modelByChannel) {
      console.log("[startup] cleared channel model overrides");
      delete config.channels.modelByChannel;
      changed = true;
    }

    // Standardize response prefix for consistent Telegram headers
    if (!config.messages) {
      config.messages = {};
    }
    config.messages.responsePrefix = "[{identity.name}] [{model}]";
    changed = true;

    // Ensure Control UI allows Railway and Tailscale origins (required for --bind lan)
    if (!config.gateway.controlUi) {
      config.gateway.controlUi = {};
    }
    const requiredOrigins = [
      `https://openclaw-production-8709.up.railway.app`,
      `https://openclaw.tail987e19.ts.net`,
    ];
    const current = config.gateway.controlUi.allowedOrigins || [];
    const missing = requiredOrigins.filter((o) => !current.includes(o));
    if (missing.length > 0) {
      config.gateway.controlUi.allowedOrigins = [...new Set([...current, ...requiredOrigins])];
      console.log(
        "[startup] set controlUi.allowedOrigins:",
        config.gateway.controlUi.allowedOrigins,
      );
      changed = true;
    }

    // Throttle web search to stay within Brave free plan limits (1 req/sec, 2000/month)
    // Increase cache TTL to 6 hours and reduce max results per query
    if (!config.tools) {
      config.tools = {};
    }
    if (!config.tools.web) {
      config.tools.web = {};
    }
    if (!config.tools.web.search) {
      config.tools.web.search = {};
    }
    const search = config.tools.web.search;
    if (!search.cacheTtlMinutes || search.cacheTtlMinutes < 360) {
      search.cacheTtlMinutes = 360;
      console.log("[startup] set web search cache TTL to 360 minutes");
      changed = true;
    }
    if (!search.maxResults || search.maxResults > 3) {
      search.maxResults = 3;
      console.log("[startup] set web search maxResults to 3");
      changed = true;
    }
    // Auto-switch to Gemini search if GOOGLE_API_KEY is available (higher limits than Brave free)
    if (process.env.GOOGLE_API_KEY && search.provider !== "gemini") {
      search.provider = "gemini";
      console.log("[startup] switched web search provider to gemini (GOOGLE_API_KEY detected)");
      changed = true;
    }

    if (changed) {
      writeFileSync(CONFIG, JSON.stringify(config, null, 2));
      console.log("[startup] config saved");
    } else {
      console.log("[startup] config OK, no patches needed");
    }
  } catch (e) {
    console.error("[startup] config patch error:", e.message);
  }
}

// Step 1b: Symlink workspace and state dirs so gateway finds persistent data
import { rmSync, symlinkSync, lstatSync } from "node:fs";
const HOME_OPENCLAW = "/root/.openclaw";
const WORKSPACE_LINK = `${HOME_OPENCLAW}/workspace`;
const WORKSPACE_TARGET = "/data/workspace";
// Symlink ~/.openclaw/workspace → /data/workspace (persistent volume)
if (existsSync(WORKSPACE_TARGET)) {
  if (existsSync(WORKSPACE_LINK)) {
    try {
      const stat = lstatSync(WORKSPACE_LINK);
      if (!stat.isSymbolicLink()) {
        rmSync(WORKSPACE_LINK, { recursive: true, force: true });
        symlinkSync(WORKSPACE_TARGET, WORKSPACE_LINK);
        console.log(`[startup] replaced ${WORKSPACE_LINK} with symlink → ${WORKSPACE_TARGET}`);
      }
    } catch {}
  } else {
    mkdirSync(HOME_OPENCLAW, { recursive: true });
    symlinkSync(WORKSPACE_TARGET, WORKSPACE_LINK);
    console.log(`[startup] created symlink ${WORKSPACE_LINK} → ${WORKSPACE_TARGET}`);
  }
}
// Symlink coaching agent workspaces from ephemeral home to persistent volume
for (const agent of ["kaytoo", "ap5", "threepio", "huyang", "villagence"]) {
  const target = `/data/.openclaw/workspace-${agent}`;
  const link = `${HOME_OPENCLAW}/workspace-${agent}`;
  if (existsSync(target)) {
    try {
      const stat = lstatSync(link);
      if (!stat.isSymbolicLink()) {
        rmSync(link, { recursive: true, force: true });
        symlinkSync(target, link);
        console.log(`[startup] symlinked ${link} → ${target}`);
      }
    } catch {
      symlinkSync(target, link);
      console.log(`[startup] symlinked ${link} → ${target}`);
    }
  }
}

// Move LCM database to persistent volume if it landed in the ephemeral home dir
const LCM_DB_EPHEMERAL = `${HOME_OPENCLAW}/lcm.db`;
const LCM_DB_PERSISTENT = "/data/.openclaw/lcm.db";
import { copyFileSync } from "node:fs";
if (existsSync(LCM_DB_EPHEMERAL) && !existsSync(LCM_DB_PERSISTENT)) {
  try {
    copyFileSync(LCM_DB_EPHEMERAL, LCM_DB_PERSISTENT);
    console.log(`[startup] copied LCM database to persistent volume: ${LCM_DB_PERSISTENT}`);
  } catch (e) {
    console.log(`[startup] LCM db copy failed: ${e.message}`);
  }
}

// Step 1c: Remove stale extension directories from volume
const staleExtDirs = ["/data/.openclaw/extensions/openclaw-telegram-file-browser"];
for (const dir of staleExtDirs) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
    console.log(`[startup] removed stale extension: ${dir}`);
  }
}

// Step 1c: Clean stale lock files from previous container runs
const AGENTS_DIR = "/data/.openclaw/agents";
if (existsSync(AGENTS_DIR)) {
  const cleanLocks = (dir) => {
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
          cleanLocks(full);
        } else if (entry.name.endsWith(".lock")) {
          unlinkSync(full);
          console.log(`[startup] removed stale lock: ${full}`);
        }
      }
    } catch {}
  };
  cleanLocks(AGENTS_DIR);
}

// Step 1d: Start Tailscale daemon if available and TS_AUTHKEY is set
import { mkdirSync } from "node:fs";
const TS_STATE_DIR = "/data/.tailscale";
if (process.env.TS_AUTHKEY) {
  let tsInstalled = false;
  try {
    execSync("which tailscale", { stdio: "ignore" });
    tsInstalled = true;
  } catch {}

  if (tsInstalled) {
    mkdirSync(TS_STATE_DIR, { recursive: true });
    mkdirSync("/var/run/tailscale", { recursive: true });
    console.log("[startup] starting tailscaled...");
    // Start tailscaled in background with userspace networking (no TUN device in Railway)
    const tsd = spawn(
      "tailscaled",
      [
        "--tun=userspace-networking",
        "--statedir",
        TS_STATE_DIR,
        "--socket",
        "/var/run/tailscale/tailscaled.sock",
      ],
      { stdio: "inherit", detached: true },
    );
    tsd.unref();

    // Wait for tailscaled socket
    for (let i = 0; i < 10; i++) {
      try {
        execSync("tailscale status 2>/dev/null", { stdio: "ignore", timeout: 2000 });
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Authenticate
    const hostname = process.env.TS_HOSTNAME || "openclaw";
    try {
      console.log(`[startup] tailscale up --hostname=${hostname}...`);
      execSync(
        `tailscale up --authkey="${process.env.TS_AUTHKEY}" --hostname="${hostname}" --accept-routes`,
        { stdio: "inherit", timeout: 30000 },
      );
      const ip = execSync("tailscale ip -4 2>/dev/null", { encoding: "utf8" }).trim();
      console.log(`[startup] tailscale connected: ${ip} (${hostname})`);

      // Defer tailscale serve until after the gateway starts — upstream v2026.3.12+
      // detects active tailscale serve and refuses --bind lan (requires loopback).
      // We need --bind lan for Railway health checks, so start serve after gateway.
      globalThis.__tsServeCmd = `tailscale serve --bg --yes https+insecure://127.0.0.1:${PORT}`;
      globalThis.__tsHostname = hostname;
    } catch (e) {
      console.error(
        "[startup] tailscale setup failed:",
        e.message,
        "(continuing without tailscale)",
      );
    }
  } else {
    console.log(
      "[startup] TS_AUTHKEY set but tailscale not installed (build with OPENCLAW_INSTALL_TAILSCALE=1)",
    );
  }
}

// Step 2: Run doctor --fix
try {
  console.log("[startup] running doctor --fix...");
  execSync("node /app/openclaw.mjs doctor --fix", {
    stdio: "inherit",
    timeout: 30000,
  });
  console.log("[startup] doctor complete");
} catch (e) {
  console.log("[startup] doctor exited with code", e.status, "(continuing)");
}

// Step 3: Start gateway (exec replaces this process)
console.log(`[startup] starting gateway on port ${PORT}...`);
const child = spawn(
  "node",
  ["/app/openclaw.mjs", "gateway", "--allow-unconfigured", "--bind", "lan", "--port", PORT],
  { stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 1));

// Deferred: start tailscale serve after the gateway is listening
if (globalThis.__tsServeCmd) {
  setTimeout(() => {
    try {
      execSync(globalThis.__tsServeCmd, { stdio: "inherit", timeout: 10000 });
      console.log(
        `[startup] tailscale serve active → https://${globalThis.__tsHostname}.tail987e19.ts.net/`,
      );
    } catch (e) {
      console.error("[startup] tailscale serve failed:", e.message);
    }
  }, 15000); // 15s delay for gateway to start listening
}
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
