# Hearth Android TV shell

This small Kotlin launcher hosts the shared Hearth web product on Google/Android TV. Household
logic remains in the server, web and shared packages.

## Security boundary

- exact-origin WebView allowlist
- short-lived adult-approved pairing
- Android Keystore-protected device credential
- `HttpOnly`, `SameSite=Strict` device session
- native offline, revoked and recovery states
- Back/D-pad forwarding and route restoration
- foreground screen retention, released on pause (D-094)
- no arbitrary intents, JavaScript bridge, files, provider credentials or media control

Jellyfin and other media apps remain independent. The shell targets API 24+ and a fixed 1920-pixel
logical canvas across 1080p and 4K output.

The native shell sets that viewport at document start for the exact paired origin, with a
post-parser fallback on older WebViews. Reloads therefore retain TV layout independently of the
server startup script. The wide and square launcher assets retain the original Hearth fern to
the left of the Nunito Sans wordmark, with outline attribution in `design/OFL.txt`. Only the
launcher composition tints the existing transparent mark cream; the original brand file is unchanged.

Bounded native layer lists compose the original mark and vector lettering. Matching xhdpi PNG
renditions keep bitmap-oriented launchers compatible without stretching a square icon into the
wide banner. From `hearth/`, regenerate with `node apps/tv/design/render-launcher.mjs` or verify
their pixels against the native source resources with the same command plus `--check`.

## Build

Install Java 17+, Android SDK/platform/build-tools 36, then set `sdk.dir` in ignored
`local.properties`.

```sh
pnpm tv:test
pnpm tv:lint
pnpm tv:build
pnpm verify:tv
```

The debug APK is `app/build/outputs/apk/debug/app-debug.apk`. Release builds require the household
signing key outside this repository.

Update an existing signed installation with `adb install -r`; do not uninstall or clear pairing.

### Android-runtime bridge and recovery regressions

Desktop JVM tests do not use Android's ICU regex engine. Run the dependency-free platform
instrumentation against an explicitly selected disposable Android emulator as well:

```sh
./apps/tv/gradlew -p apps/tv assembleDebug assembleDebugAndroidTest
adb -s EMULATOR_SERIAL install -r apps/tv/app/build/outputs/apk/debug/app-debug.apk
adb -s EMULATOR_SERIAL install -r apps/tv/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb -s EMULATOR_SERIAL shell am instrument -w \
  app.hearth.tv.debug.test/app.hearth.tv.BridgeProtocolInstrumentation
```

Require `OK (10 Android bridge/recovery tests)` with no failing status, not merely a successful ADB shell
exit. This checks first-message initialization, the four existing message types, JSON whitespace,
malformed/extended/oversized rejection and the original Android-only closing-brace failure.
The six loopback recovery cases also cover transient validation and HTTP page errors, pause/resume,
exhaustion plus D-pad Retry, revoked credentials and Back cancellation. They replace/clear fictional
credentials on the disposable emulator and capture connecting/offline screenshots in the test app's
external files directory. Never run this fixture on a household TV.
The test harness adds nothing to the production APK, no bridge capability and no external dependency.
Do not install the test APK on a paired household TV: instrumentation can stop its target app.
Hosted verification still runs JVM tests/lint/builds; it does not run these emulator cases.

## Wake/start recovery

Version 0.1.3 / code 4 retries temporary network/server failures automatically while foregrounded:
up to five attempts within 30 seconds, then Try again. Pause/Back stop scheduled work; resume can
start a fresh window. Authentication, certificate and malformed-response failures are not treated
as temporary outages. Existing pairing and last route survive connection failures. Only validation
GETs and page loading retry; no household writes, background jobs or new network permissions.
The web runtime gate independently retries transient reads twice, with its own bounded deadline.

## Pair

1. Start Hearth with `pnpm dev`.
2. Install and open the debug APK.
3. In the phone web app, open **More → Televisions** and approve the displayed code.

For a physical debug TV without private HTTPS, use `adb reverse tcp:4320 tcp:4320`. Production
requires the stable private Synology HTTPS origin. Current evidence and remaining physical-TV gates
are in [`../../docs/evidence/phase-6/README.md`](../../docs/evidence/phase-6/README.md).
