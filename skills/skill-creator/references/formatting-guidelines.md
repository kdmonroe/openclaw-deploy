# Cross-Platform Formatting Guidelines

This reference provides guidelines for consistent AI output formatting across different messaging platforms. Use these rules when crafting responses to ensure optimal display on each channel.

## Platform Capabilities Matrix

| Feature     | Telegram              | Discord               | Web UI    | WhatsApp        | SMS/Voice         |
| ----------- | --------------------- | --------------------- | --------- | --------------- | ----------------- |
| **Bold**    | ✅ `*text*`           | ✅ `**text**`         | ✅ Full   | ✅ `*text*`     | ❌                |
| Italic      | ✅ `_text_`           | ✅ `*text*`           | ✅ Full   | ✅ `_text_`     | ❌                |
| Code inline | ✅ `` `code` ``       | ✅ `` `code` ``       | ✅ Full   | ❌              | ❌                |
| Code blocks | ✅ (limit 4000 chars) | ✅ (limit 2000 chars) | ✅ Full   | ❌              | ❌                |
| Links       | ✅ `[text](url)`      | ✅ Auto-embeds        | ✅ Full   | ✅ Raw URLs     | ❌                |
| Lists       | ⚠️ Basic              | ✅ Full               | ✅ Full   | ⚠️ Basic        | ❌                |
| Tables      | ❌                    | ⚠️ Code blocks        | ✅ Full   | ❌              | ❌                |
| Images      | ⚠️ Separate msg       | ✅ Embeds             | ✅ Inline | ⚠️ Separate msg | ❌                |
| Emoji       | ✅                    | ✅                    | ✅        | ✅              | ⚠️ May not render |

## Platform-Specific Guidelines

### Telegram

- **Message length**: Max ~4096 characters per message
- **Code blocks**: Keep under 4000 characters; split longer code
- **Formatting**: Use sparingly; Telegram markdown is limited
- **Images**: Send as separate messages, not inline
- **Links**: Use `[text](url)` format; raw URLs auto-link
- **Lists**: Use simple `-` or `•` bullets; numbered lists work
- **Bold for emphasis**: Use `*bold*` for key terms

````markdown
✅ Good Telegram response:
Here's the fix for your issue:

`config.json` needs this change:

```json
{ "key": "value" }
```
````

_Note_: Restart after saving.

````

### Discord

- **Message length**: Max 2000 characters per message
- **Code blocks**: Full syntax highlighting; keep under 2000 chars
- **Embeds**: Rich formatting available but keep simple for chat
- **Formatting**: Full markdown support
- **Bold for headers**: Use `**Header**` for section titles
- **Lists**: Full support for nested lists

```markdown
✅ Good Discord response:
**Solution**
The issue is in your config:
```js
const config = { key: "value" };
````

**Next steps:**

1. Update the file
2. Restart the service

````

### Web UI

- **Full HTML/Markdown**: All formatting supported
- **Tables**: Use markdown tables freely
- **Images**: Inline images work well
- **Code blocks**: Full syntax highlighting, no practical limit
- **Length**: No strict limit; break into sections for readability

### WhatsApp

- **Message length**: Max ~65536 characters but keep concise
- **Formatting**: Basic only (`*bold*`, `_italic_`, `~strike~`)
- **Code**: No code block support; use plain text or screenshots
- **Links**: Raw URLs only; no markdown links
- **Lists**: Use emoji bullets (•, ▸) or numbers

```markdown
✅ Good WhatsApp response:
*Solution*

The config needs this change:
key: value

_Note:_ Restart after saving.

• Step 1: Edit config
• Step 2: Save file
• Step 3: Restart
````

### SMS/Voice

- **Plain text only**: No formatting whatsoever
- **Brevity**: Keep messages short and direct
- **Numbers**: Spell out or use digits based on context
- **No special characters**: Avoid emoji, symbols that may not render
- **Voice**: Write for text-to-speech (avoid abbreviations, spell out acronyms)

```markdown
✅ Good SMS response:
The fix: change the config key to value, then restart. Let me know if it works.
```

## Tone and Personality Guidelines

### General Principles

1. **Match the platform's tone**:
   - Telegram/Discord: Casual, conversational
   - Web UI: Can be more detailed/technical
   - SMS: Brief, direct
   - Voice: Natural speech patterns

2. **Personality notes**:
   - Add light personality on casual platforms (Telegram, Discord)
   - Stay professional but friendly
   - Use emoji sparingly to add warmth (1-2 per message max)
   - Avoid excessive punctuation (!!!, ???)

3. **Adaptive formality**:
   - Mirror the user's tone
   - Technical questions → technical answers
   - Casual questions → casual answers

### Examples of Personality

```markdown
❌ Too robotic:
"The operation completed successfully. The file has been saved."

✅ With personality:
"Done! Your file is saved and ready to go. 👍"

❌ Too casual:
"lol yeah that's broken af, lemme fix it real quick"

✅ Balanced:
"Ah, found the issue! Let me fix that for you."
```

## When to Use Bold

Use **bold** for:

- Key terms being introduced
- Important warnings or notes
- Action items or commands
- Section headers (on platforms that support it)

Avoid bold for:

- Entire sentences
- Common words
- Code or technical terms (use code formatting instead)

## Code Formatting Best Practices

1. **Always specify language** for syntax highlighting:

   ````markdown
   ```typescript
   const x = 1;
   ```
   ````

2. **Keep code blocks focused**: Show only relevant code, not entire files

3. **Add context before code**: Explain what the code does

4. **For platforms without code support**: Use indentation or describe the changes in prose

## Response Length Guidelines

| Platform | Ideal Length   | Max Before Split |
| -------- | -------------- | ---------------- |
| Telegram | 200-500 chars  | 4000 chars       |
| Discord  | 200-500 chars  | 2000 chars       |
| WhatsApp | 100-300 chars  | 1000 chars       |
| SMS      | 50-160 chars   | 160 chars        |
| Web UI   | 300-1000 chars | No limit         |
| Voice    | 50-100 words   | 30 seconds       |

## Checklist Before Responding

- [ ] Is the formatting supported on this platform?
- [ ] Is the message length appropriate?
- [ ] Are code blocks under the platform's limit?
- [ ] Is bold used appropriately (not overused)?
- [ ] Does the tone match the platform and user?
- [ ] Would this read well if spoken aloud (for voice)?
