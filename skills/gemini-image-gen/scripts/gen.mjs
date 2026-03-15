#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, basename } from "node:path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text) {
  let s = text.toLowerCase().trim();
  s = s.replace(/[^a-z0-9]+/g, "-");
  s = s.replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
  return s || "image";
}

function defaultOutDir() {
  const now = new Date().toISOString().replace(/[T:]/g, "-").replace(/\..+/, "");
  const preferred = join(homedir(), "Projects", "tmp");
  const base = existsSync(preferred) ? preferred : "./tmp";
  mkdirSync(base, { recursive: true });
  return join(base, `gemini-image-gen-${now}`);
}

function writeGallery(outDir, items) {
  const thumbs = items
    .map(
      (it) =>
        `<figure>\n  <a href="${it.file}"><img src="${it.file}" loading="lazy" /></a>\n  <figcaption>${escapeHtml(it.prompt)}</figcaption>\n</figure>`,
    )
    .join("\n");

  const html = `<!doctype html>
<meta charset="utf-8" />
<title>gemini-image-gen</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 24px; font: 14px/1.4 ui-sans-serif, system-ui; background: #0b0f14; color: #e8edf2; }
  h1 { font-size: 18px; margin: 0 0 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
  figure { margin: 0; padding: 12px; border: 1px solid #1e2a36; border-radius: 14px; background: #0f1620; }
  img { width: 100%; height: auto; border-radius: 10px; display: block; }
  figcaption { margin-top: 10px; color: #b7c2cc; }
  code { color: #9cd1ff; }
</style>
<h1>gemini-image-gen</h1>
<p>Output: <code>${outDir}</code></p>
<div class="grid">
${thumbs}
</div>
`;
  writeFileSync(join(outDir, "index.html"), html, "utf-8");
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Arg parsing (manual, tavily-search style)
// ---------------------------------------------------------------------------

function usage() {
  console.error(
    `Usage: gen.mjs "prompt" [--aspect 1:1] [--count N] [--size 1k|4k] [--out-dir PATH] [--model ID]
       gen.mjs --edit "instruction" --input image.png [--aspect 1:1] [--size 1k|4k] [--out-dir PATH]`,
  );
  process.exit(2);
}

const argv = process.argv.slice(2);
if (argv.length === 0 || argv[0] === "-h" || argv[0] === "--help") usage();

let prompt = "";
let editMode = false;
let inputPath = "";
let count = 1;
let aspect = "";
let size = "";
let outDirArg = "";
let model = "gemini-3.1-flash-image-preview";

// First pass: check for --edit flag to determine if first positional is prompt
let hasEdit = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--edit") {
    hasEdit = true;
    break;
  }
}

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--edit") {
    editMode = true;
    prompt = argv[i + 1] ?? "";
    if (!prompt || prompt.startsWith("--")) {
      console.error("--edit requires an instruction string");
      process.exit(2);
    }
    i++;
    continue;
  }
  if (a === "--input") {
    inputPath = argv[i + 1] ?? "";
    i++;
    continue;
  }
  if (a === "--count") {
    count = Number.parseInt(argv[i + 1] ?? "1", 10);
    i++;
    continue;
  }
  if (a === "--aspect") {
    aspect = argv[i + 1] ?? "";
    i++;
    continue;
  }
  if (a === "--size") {
    size = argv[i + 1] ?? "";
    i++;
    continue;
  }
  if (a === "--out-dir") {
    outDirArg = argv[i + 1] ?? "";
    i++;
    continue;
  }
  if (a === "--model") {
    model = argv[i + 1] ?? model;
    i++;
    continue;
  }
  if (a.startsWith("-")) {
    console.error(`Unknown flag: ${a}`);
    usage();
  }
  // Positional arg = prompt (only in non-edit mode)
  if (!hasEdit && !prompt) {
    prompt = a;
    continue;
  }
  console.error(`Unexpected argument: ${a}`);
  usage();
}

if (!prompt) {
  console.error("Missing prompt");
  usage();
}

if (editMode && !inputPath) {
  console.error("--edit mode requires --input <image-path>");
  process.exit(2);
}

// ---------------------------------------------------------------------------
// API key
// ---------------------------------------------------------------------------

const apiKey = (process.env.GOOGLE_API_KEY ?? "").trim();
if (!apiKey) {
  console.error("Missing GOOGLE_API_KEY");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Output directory
// ---------------------------------------------------------------------------

const outDir = outDirArg ? resolve(outDirArg) : defaultOutDir();
mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------------------
// Build request body
// ---------------------------------------------------------------------------

function buildRequestBody(promptText) {
  const parts = [];

  // In edit mode, include the source image first
  if (editMode) {
    const imgBytes = readFileSync(resolve(inputPath));
    const b64 = imgBytes.toString("base64");
    const ext = basename(inputPath).split(".").pop().toLowerCase();
    const mimeMap = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
    };
    const mimeType = mimeMap[ext] || "image/png";
    parts.push({ inlineData: { data: b64, mimeType } });
  }

  parts.push({ text: promptText });

  const imageConfig = {};
  if (aspect) imageConfig.aspectRatio = aspect;

  const generationConfig = {
    responseModalities: ["IMAGE", "TEXT"],
    imageConfig,
  };

  // Map --size flag to imageConfig
  if (size === "4k") {
    imageConfig.outputImageHeight = 2160;
    imageConfig.outputImageWidth =
      aspect === "9:16"
        ? 1215
        : aspect === "16:9"
          ? 3840
          : aspect === "4:3"
            ? 2880
            : aspect === "3:4"
              ? 1620
              : 2160;
  }

  return {
    contents: [{ role: "user", parts }],
    generationConfig,
  };
}

// ---------------------------------------------------------------------------
// Generate images
// ---------------------------------------------------------------------------

const items = [];
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

for (let idx = 1; idx <= count; idx++) {
  const label = prompt.length > 60 ? `${prompt.slice(0, 57)}...` : prompt;
  process.stderr.write(`[${idx}/${count}] generating: "${label}"\n`);

  const body = buildRequestBody(prompt);

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    console.error(`Gemini API error (${resp.status}): ${errText}`);
    process.exit(1);
  }

  const data = await resp.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);

  if (!imagePart) {
    // Check if there's a text response (sometimes the model returns text instead of image)
    const textPart = parts.find((p) => p.text);
    if (textPart) {
      console.error(`Model returned text instead of image: ${textPart.text.slice(0, 200)}`);
    } else {
      console.error(`No image in response: ${JSON.stringify(data).slice(0, 400)}`);
    }
    process.exit(1);
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  const ext = mimeType.split("/")[1] || "png";
  const filename = `${String(idx).padStart(3, "0")}-${slugify(prompt).slice(0, 40)}.${ext}`;
  const filepath = join(outDir, filename);

  const imgBuffer = Buffer.from(imagePart.inlineData.data, "base64");
  writeFileSync(filepath, imgBuffer);

  items.push({ prompt, file: filename });
  // Print file path to stdout for agent consumption
  console.log(filepath);
}

// Write metadata + gallery
writeFileSync(join(outDir, "prompts.json"), JSON.stringify(items, null, 2), "utf-8");
writeGallery(outDir, items);
console.log(join(outDir, "index.html"));
