#!/usr/bin/env node
// Railway startup: patch old config for v2026.3.12 compatibility, then start gateway
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync, spawn } from "node:child_process";

const CONFIG = "/data/.openclaw/openclaw.json";
const PORT = process.env.PORT || "8080";

// Step 1: Patch config
if (existsSync(CONFIG)) {
  try {
    const config = JSON.parse(readFileSync(CONFIG, "utf8"));
    let changed = false;

    // Log current plugin state for debugging
    if (config.plugins) {
      console.log("[startup] plugins keys:", Object.keys(config.plugins));
      if (config.plugins.installed)
        console.log("[startup] plugins.installed:", JSON.stringify(config.plugins.installed));
      if (config.plugins.entries)
        console.log("[startup] plugins.entries keys:", Object.keys(config.plugins.entries));
    }

    // Remove plugins with entry='.' from installed array (incompatible with v2026.3.12)
    if (config.plugins?.installed) {
      const before = config.plugins.installed.length;
      config.plugins.installed = config.plugins.installed.filter(
        (p) => p.entry !== "." && p.entry !== "./"
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

    // Clear all plugins config — old entries are incompatible with v2026.3.12
    // Extensions auto-discover from the extensions/ directory
    if (config.plugins) {
      console.log("[startup] clearing old plugins config (auto-discovery will handle extensions)");
      delete config.plugins;
      changed = true;
    }

    // Set gateway.mode if missing
    if (!config.gateway) config.gateway = {};
    if (!config.gateway.mode) {
      config.gateway.mode = "local";
      console.log("[startup] set gateway.mode=local");
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

// Step 1b: Remove stale extension directories from volume
import { rmSync } from "node:fs";
const staleExtDirs = ["/data/.openclaw/extensions/openclaw-telegram-file-browser"];
for (const dir of staleExtDirs) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
    console.log(`[startup] removed stale extension: ${dir}`);
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
  [
    "/app/openclaw.mjs",
    "gateway",
    "--allow-unconfigured",
    "--bind",
    "lan",
    "--port",
    PORT,
  ],
  { stdio: "inherit" }
);
child.on("exit", (code) => process.exit(code ?? 1));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
