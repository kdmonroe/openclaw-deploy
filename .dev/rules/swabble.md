# Swabble — macOS 26 Speech Daemon

Swabble is a Swift 6.2 always-on speech hook daemon that uses Apple `Speech.framework` (`SpeechAnalyzer` + `SpeechTranscriber`) instead of whisper.cpp. Fully local — no network calls during transcription.

**Location:** `Swabble/` (separate SwiftPM package)

## Architecture

```
AVAudioEngine → SpeechAnalyzer → SpeechTranscriber → async stream
    ↓                                                      ↓
 mic input                                          partial/final transcripts
                                                          ↓
                                                    Wake gate (keyword match)
                                                          ↓
                                                    HookExecutor (shell command)
```

## Source layout

| Target          | Path                   | Purpose                                               |
| --------------- | ---------------------- | ----------------------------------------------------- |
| `swabble` (CLI) | `Sources/swabble/`     | Commander-based CLI executable                        |
| `SwabbleCore`   | `Sources/SwabbleCore/` | Core pipeline, config, hook executor                  |
| `SwabbleKit`    | `Sources/SwabbleKit/`  | Multi-platform (iOS/macOS) wake-word gating utilities |

## CLI subcommands

`serve`, `transcribe`, `test-hook`, `mic list|set`, `doctor`, `health`, `tail-log`, `setup`

## Key patterns

- **Config:** `~/.config/swabble/config.json` (Codable JSON, no TOML)
- **Wake word:** Default "clawd" (alias "claude"), with `--no-wake` bypass
- **SwabbleKit gap-based gating:** Uses speech segment timing to require a pause between wake word and utterance
- **Hook executor:** Spawns `Process` with env vars `SWABBLE_TEXT`, `SWABBLE_PREFIX`, enforces cooldown + timeout
- **Transcripts:** In-memory ring buffer, optional persisted JSON lines at `~/Library/Application Support/swabble/transcripts.log`
- **CLI framework:** Commander (`steipete/Commander` SwiftPM package)

## SwiftUI / Swift conventions (applies to all Swift code in repo)

- Prefer `Observation` framework (`@Observable`, `@Bindable`) over `ObservableObject`/`@StateObject`
- Don't introduce new `ObservableObject` unless required for compatibility
- Migrate existing `ObservableObject` usages when touching related code
- Swift 6.2 concurrency: use structured concurrency, async/await throughout
- Target: macOS 26+ (Swabble), iOS/macOS shared (SwabbleKit)

## Build / test

```bash
cd Swabble
swift build
swift test
```
