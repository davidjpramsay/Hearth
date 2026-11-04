# TV wake/start recovery — 4 November 2026

Local branch `codex/tv-wake-recovery`, based on `e7a84e2` (the pending Games footer removal).
Native version **0.1.3 / code 4**. This page records the original local build/browser/emulator
checkpoint. The subsequent approved GitHub release, deployment and physical TV installation are
recorded separately in [the release evidence](RELEASE.md). Neither reproduces the household TV's
intermittent wake-time network delay.

## Behaviour

- A paired TV quietly retries temporary validation or page failures, at most five attempts within
  30 seconds. Back/pause cancel the window; late results cannot reopen it. Resume restarts an
  interrupted/disconnected attempt. An already-ready page is retained during ordinary validation.
- A persistent failure leaves native Try again/Change address, usable by D-pad. Pairing survives
  reachability failures; an explicit invalid/revoked session still clears it once.
- Android can report HTTP failure before page-start. The emulator reproduced an error document
  being marked ready; sticky failure state now blocks that and the retry creates a fresh WebView.
- The web runtime gate retries transient reads twice with five-second deadlines and 2/4-second
  delay. It never starts household queries until runtime succeeds. Authentication/schema failures
  are not repeatedly requested; existing mutation retry/idempotency behaviour is unchanged.
- SSL handling still cancels invalid certificates. No trusted-origin, permission, API/schema,
  household data, HA, server configuration or network change.

## Commands and results

Run from the worktree root, with Homebrew tools on PATH. The Mac's system Git/Python shims request
an Xcode licence acceptance; Homebrew Git/Python were used instead. No licence or system setting
was changed. Android SDK is `/opt/homebrew/share/android-commandlinetools`; ignored local.properties
points there. Java is `/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`.

| Check                                                                                                                                                                                                                                                               | Result                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PATH=/opt/homebrew/bin:$PATH pnpm -C hearth install --frozen-lockfile`                                                                                                                                                                                             | Passed; lockfile unchanged                                                                                                                                                                                                                    |
| `PATH=/opt/homebrew/bin:$PATH pnpm -C hearth verify:code`                                                                                                                                                                                                           | Passed: format, lint, strict typecheck; 108 shared + 48 core + 117 server + 473 web unit tests; 290 API/repository integration tests; 30 migration tests; deployment/installer checks; production web/server build; isolated no-HA fresh boot |
| `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home hearth/apps/tv/gradlew -p hearth/apps/tv testDebugUnitTest lintDebug lintRelease assembleDebug assembleRelease assembleDebugAndroidTest`                                                  | Passed: 28 JVM tests; Debug/Release lint has 0 errors, 19 non-blocking warnings each; Debug/Release and test APKs built                                                                                                                       |
| `adb -s emulator-5554 install -r hearth/apps/tv/app/build/outputs/apk/debug/app-debug.apk` and matching `androidTest/debug/app-debug-androidTest.apk`                                                                                                               | Success on disposable API 36 Google TV emulator only                                                                                                                                                                                          |
| `adb -s emulator-5554 shell am instrument -w app.hearth.tv.debug.test/app.hearth.tv.BridgeProtocolInstrumentation`                                                                                                                                                  | **OK (10 Android bridge/recovery tests)**; actual MainActivity/WebView, loopback HTTP server and fictional credentials                                                                                                                        |
| `PATH=/opt/homebrew/bin:$PATH pnpm -C hearth test:e2e:built tests/e2e/startup-recovery.spec.ts tests/e2e/reliability.spec.ts tests/e2e/native-tv-viewport.spec.ts tests/e2e/production-bootstrap.spec.ts --reporter=line --output=/tmp/hearth-wake-browser-results` | **37 passed** in 1.4 minutes; phone/TV startup, delayed/hung responses, auth denial, mutation retry safety, keyboard/D-pad, 1080p/4K native viewport and production CSP                                                                       |
| `PATH=/opt/homebrew/bin:$PATH pnpm -C hearth verify:ci`                                                                                                                                                                                                             | 5 policy checks passed; 1,346 browser tests partitioned exactly once (inventory check, not a full browser run)                                                                                                                                |
| `git diff --check`                                                                                                                                                                                                                                                  | Passed                                                                                                                                                                                                                                        |

The final instrumentation test revision was rebuilt with `assembleDebugAndroidTest` before the
successful run. It additionally presses Right/Left/Select on the offline view and Back during
recovery. The persistent-outage fixture proves no further automatic requests after exhaustion,
then a successful manual retry. The pause/resume case verifies no scheduled request while paused.
The pure clock tests separately prove the hard 30-second deadline, five-attempt limit and rejection
of late/duplicate callbacks. No live network or household credential participates.

Initial checks caught and corrected an optional AbortSignal type error and the Android callback
ordering defect. A first browser assertion counted the normal post-start SSE refresh as another
startup retry; the corrected assertion counts reads before the first household query. All final
checks above passed. Logs are local `/tmp/hearth-wake-{web-code,android,instrumentation,browser,ci}.log`.

## Inspected screenshots

- [Native connecting](tv-connecting.png)
- [Native outage with focused Retry](tv-offline.png)
- [Phone startup retry](web-phone-connecting.png)
- [TV startup retry](web-tv-connecting.png)

Screenshots contain isolated test UI only. Native outage copy “Fixture unavailable” is supplied by
the fictional server. Text and controls fit the rendered bounds; the native focused action remains
visible and Right/Left navigation reaches both actions. The phone and TV gates fit their viewports.

## Original local checkpoint / installation boundary

These were the boundaries before the approved rollout; see [RELEASE.md](RELEASE.md) for current
passed and unverified checks.

- No GitHub push, merge, hosted workflow, NAS deployment, live HA change or physical-TV APK update.
- No physical standby/wake or Wi-Fi-delay proof, no actual household revocation/certificate test.
- Last recorded physical install remains 0.1.2-debug / code 3; no claim this repair is live.
- Release the web/server build and update the TV APK with its existing package/signing identity,
  using `adb install -r` after approval. The phone's server Update button cannot replace the APK.
- Never put the test APK on a paired TV: it replaces/clears fictional test credentials.
