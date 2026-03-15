# Mobile Development

## iOS

**Location:** `apps/ios/`

### Build commands

| Task                   | Command          |
| ---------------------- | ---------------- |
| Generate Xcode project | `pnpm ios:gen`   |
| Open in Xcode          | `pnpm ios:open`  |
| Build                  | `pnpm ios:build` |
| Build + run            | `pnpm ios:run`   |

### Key patterns

- Project generated via **xcodegen** (`apps/ios/project.yml` → `.xcodeproj`)
- Default simulator: iPhone 17 (override via `IOS_DEST` / `IOS_SIM` env vars)
- **Prefer real devices** over simulators when connected — check for connected devices before reaching for simulators
- Bundle ID: `ai.openclaw.ios`
- Team ID lookup: `security find-identity -p codesigning -v` or `scripts/ios-team-id.sh`
- Shared Swift code: `apps/shared/` (OpenClawKit)
- "Restart iOS app" means rebuild (recompile + install) and relaunch, not just kill/launch

### Swift conventions

- Prefer `Observation` framework (`@Observable`, `@Bindable`) over `ObservableObject`/`@StateObject`
- SwiftUI + structured concurrency
- Lint: `pnpm lint:swift`, Format: `pnpm format:swift`
- Config: `.swiftlint.yml`, `.swiftformat`

## Android

**Location:** `apps/android/`

### Build commands

| Task           | Command                 |
| -------------- | ----------------------- |
| Assemble debug | `pnpm android:assemble` |
| Install debug  | `pnpm android:install`  |
| Build + run    | `pnpm android:run`      |
| Unit tests     | `pnpm android:test`     |

### Key patterns

- Gradle-based (`apps/android/build.gradle.kts`, `app/build.gradle.kts`)
- Bundle ID: `ai.openclaw.android`
- Main activity: `.MainActivity`
- **Prefer real devices** over emulators when connected
- "Restart Android app" means rebuild + reinstall

## macOS app

**Location:** `apps/macos/`

### Build commands

| Task           | Command                                              |
| -------------- | ---------------------------------------------------- |
| Package        | `pnpm mac:package` (or `scripts/package-mac-app.sh`) |
| Open built app | `pnpm mac:open`                                      |
| Restart        | `pnpm mac:restart` (or `scripts/restart-mac.sh`)     |

### Key patterns

- Gateway runs as menubar app — no separate LaunchAgent
- Packaging script: `scripts/package-mac-app.sh` (defaults to current arch)
- Code signing: `scripts/codesign-mac-app.sh`
- Notarization: `scripts/notarize-mac-artifact.sh`
- DMG creation: `scripts/create-dmg.sh`
- Appcast (Sparkle updates): `scripts/make_appcast.sh`, `appcast.xml`
- Do NOT rebuild the macOS app over SSH — must run directly on the Mac
- Logs: `scripts/clawlog.sh` (queries unified logs for OpenClaw subsystem)
- Release checklist: `docs/platforms/mac/release.md`

## Version locations

| Platform | File                                               | Fields                                          |
| -------- | -------------------------------------------------- | ----------------------------------------------- |
| CLI/npm  | `package.json`                                     | `version`                                       |
| Android  | `apps/android/app/build.gradle.kts`                | `versionName`, `versionCode`                    |
| iOS      | `apps/ios/Sources/Info.plist` + `Tests/Info.plist` | `CFBundleShortVersionString`, `CFBundleVersion` |
| macOS    | `apps/macos/Sources/OpenClaw/Resources/Info.plist` | `CFBundleShortVersionString`, `CFBundleVersion` |

Do NOT change version numbers without explicit operator consent.
