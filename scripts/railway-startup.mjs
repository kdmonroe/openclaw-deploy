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

    // Remove plugins with entry='.' (incompatible with v2026.3.12)
    if (config.plugins?.installed) {
      const before = config.plugins.installed.length;
      config.plugins.installed = config.plugins.installed.filter(
        (p) => p.entry !== "."
      );
      if (config.plugins.installed.length < before) {
        console.log("[startup] removed bad plugin entries");
        changed = true;
      }
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
