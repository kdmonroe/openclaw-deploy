---
name: gemini-image-gen
description: Generate and edit images using Google's Gemini image generation model.
homepage: https://ai.google.dev/gemini-api/docs/image-generation
metadata:
  {
    "openclaw":
      {
        "emoji": "\U0001F3A8",
        "primaryEnv": "GOOGLE_API_KEY",
        "requires": { "bins": ["node"], "env": ["GOOGLE_API_KEY"] },
      },
  }
---

# Gemini Image Gen

Generate and edit images via Google's Gemini image generation API.

## Run

```bash
node {baseDir}/scripts/gen.mjs "a golden retriever wearing sunglasses"
```

## Options

```bash
# Multiple images
node {baseDir}/scripts/gen.mjs "prompt" --count 4

# Aspect ratios: 1:1 (default), 16:9, 9:16, 4:3, 3:4
node {baseDir}/scripts/gen.mjs "wide landscape" --aspect 16:9

# Higher resolution
node {baseDir}/scripts/gen.mjs "detailed macro photo" --size 4k

# Edit an existing image
node {baseDir}/scripts/gen.mjs --edit "make the sky dramatic and stormy" --input photo.png

# Custom output directory
node {baseDir}/scripts/gen.mjs "prompt" --out-dir ./my-images

# Specific model
node {baseDir}/scripts/gen.mjs "prompt" --model gemini-3.1-flash-image-preview
```

## Edit Mode

Use `--edit` with `--input` to modify an existing image:

```bash
node {baseDir}/scripts/gen.mjs --edit "add a party hat" --input dog.png
node {baseDir}/scripts/gen.mjs --edit "change the background to a beach" --input portrait.jpg --aspect 16:9
```

## Output

- Image files (PNG by default) in `~/Projects/tmp/gemini-image-gen-<timestamp>/`
- `prompts.json` — prompt-to-file mapping
- `index.html` — thumbnail gallery (dark theme)

File paths are printed to stdout for agent consumption. Progress is printed to stderr.
