# Approved release and physical TV update — 4 November 2026

The owner explicitly approved pushing/deploying all pending work and updating the TV app.
Application release: `8cb1b244971d76dfe49e2662e700c9138173f2bd`, published to `main` and
`codex/tv-wake-recovery`. This includes Games footer cleanup `e7a84e2`, wake recovery `cd57dd9`
and the release-blocking dependency correction `8cb1b24`.

## Hosted and local checks

[Verify Hearth 41753581056](https://github.com/davidjpramsay/hearth-v2/actions/runs/41753581056)
passed all eight jobs, including verified image publication. Browser shards passed 337 + 337 +
336 + 336 = **1,346**, with no failed/flaky result in their final summaries.

- `pnpm audit:dependencies`: no known vulnerabilities. The earlier run `41752393110` failed this
  gate; that candidate was not deployed. The audit threshold and lint rules were not relaxed.
- `pnpm verify:code`: format, lint, strict typecheck, **108 shared + 48 core + 120 server +
  473 web unit tests**, **290 integration + 30 migration tests**, production builds, installer/
  deployment checks and isolated fresh boot without HA passed. The corrected tree was also
  tested locally with this entire gate and `pnpm install --frozen-lockfile`.
- Hosted HA component: `python3 -B -m unittest discover -s hearth/integrations/home_assistant/tests -v`,
  **69 passed**. The installed HA component and automations were not changed.
- Hosted Android: `./apps/tv/gradlew -p apps/tv --no-daemon testDebugUnitTest lintDebug lintRelease
assembleDebug assembleRelease`, passed. Prior local **28 JVM + 10 Android instrumentation** and
  **37 focused browser** checks are recorded in [the implementation evidence](README.md).
- The tracked minimatch export compatibility patch is included before frozen Docker installs;
  upstream matching/security logic is unchanged. Three regression checks cover its actual
  consumers, expansion bounds and accessibility-rule enforcement.

## Private server activation

Activation command:

```sh
PATH=/opt/homebrew/bin:$PATH hearth/deploy/synology/activate-private-release.sh 8cb1b244971d76dfe49e2662e700c9138173f2bd
```

**Passed:** activation exited 0; both running image tags are the exact release above. The existing
bounded, root-owned helper verified the commissioned bridge/DNS rules and returned private
readiness. External `/api/v1/readiness`, `/api/v1/health` and `/api/v1/runtime` each returned HTTP
200; readiness is `ready`, the database is `ready`/`sqlite-ready`, mode is `private`, and health
reports the exact full release SHA. An initial external probe overlapped container replacement
and returned 502; the post-activation probe passed all three endpoints. No ad-hoc container/
network replacement was used. Local logs: `/tmp/hearth-release-8cb1b24-deploy.log` and
`/tmp/hearth-release-8cb1b24-health.json`.

Static delivery also passed: `/`, `/hearth-bootstrap.js` and the HTML-referenced application
entry `/assets/index-cZP64AFP.js` returned HTTP 200; both scripts use `application/javascript`.
The first static checker incorrectly expected the bootstrap script to be under `/assets/`;
inspection of the served HTML corrected that checker assumption, with no application change.

## Physical TCL installation

The TV initially reported **0.1.2-debug / code 3** and `mWakefulness=Asleep`. HA's existing
authorized ADB connection was used; no new debugging trust, credentials, permissions or pairing.
The Mac's direct ADB connection was not available and was not bypassed.

The signed Debug APK was verified locally with `apksigner verify --print-certs`; its SHA-256
matched after transfer through HA and again on the TV:

```text
New APK: befde580d7e0d51c708f21b568cf1fe3a3dc877e78d6fd3cb2aca1a77e06dbdc
Previous APK: 29e7356d61c3d0de8c5c99b833125bd4866527809abcb37fa2b596c933633288
Signing certificate: bd4c5fd013aa4e918668381a0704be18bdf7b4d6aea9d91cf7e76ae554eae8d8
```

The following device commands were sent through HA Actions to the existing TCL ADB entity:

```sh
pm install -r /data/local/tmp/hearth-tv-0.1.3-debug.apk
dumpsys package app.hearth.tv.debug | grep -E "versionCode=|versionName="
run-as app.hearth.tv.debug sha256sum shared_prefs/hearth_secure_device.xml
input keyevent 224
am start -W -n app.hearth.tv.debug/app.hearth.tv.MainActivity
dumpsys window | grep mCurrentFocus
input keyevent 21
input keyevent 22
input keyevent 4
input keyevent 3
am start -W -n app.hearth.tv.debug/app.hearth.tv.MainActivity
```

**Passed:** in-place installation returned `Success`; package readback is **0.1.3-debug / code 4**.
The encrypted pairing-file digest is identical before/after installation and after Home/resume;
its contents were never read. Explicit cold launch returned `Status: ok`, `LaunchState: COLD`,
1,125 ms activity launch time. A private 1920×1080 screenshot was visually inspected: the real paired
Morning Routine rendered without the native connection-error screen. This is activity/UI proof,
not an exact end-to-end page load timing measurement. Left/Right/Back were sent without a crash;
individual focus transitions were not captured. Home reached the normal launcher, and reopening
returned `Status: ok`, `LaunchState: HOT`, 192 ms, with Hearth independently confirmed foreground.
These native checks ran against the preceding live web/server while hosted checks were finishing.
Physical rendering after the new server activation was not rechecked because ADB was unavailable;
the exact new web/server build has separate hosted-browser and live endpoint evidence above.

**Not passed / unverified:** after the bounded sleep command (`input keyevent 223`), the TV's ADB
entity became unavailable. Its existing HA power-on action and one normal network wake attempt
did not restore ADB. Thus a complete physical deep-standby/wake check, final Android power-state
readback, overnight wake with delayed Wi-Fi, and forced network-loss recovery remain unverified.
No TV networking/standby settings were changed and no alarm, music or volume action was run.
An explicit `media_player.turn_off` request to the existing TV power entity was sent at cleanup;
physical power-state confirmation is still unavailable, so no final Asleep readback is claimed.
The network-loss/deadline/Retry/Back cancellation cases are emulator proof only. The original
intermittent wake-time cause has not been captured from the household TV.

## Rollback and cleanup

The exact previous/new APKs and household capture are retained in HA's protected
`/config/.hearth-tv-update-20261104/` (File editor path `/homeassistant/...`), directory 0700/files 0600. The non-secret APK transfer path in `www` was moved out and its absence verified. Private
media copies were moved into protected configuration storage; no household screenshot entered
public staging or Git. The local capture is also retained privately in Downloads, outside this
repository. The Android temporary APK/rollback/capture paths remain because ADB was unavailable
after standby; do not claim their cleanup.

File editor was stopped after transfer. Its UI returned to **Start** with the existing controlled-
stop Error badge; all four autostart/watchdog/update/sidebar switches remain off. HA Core was not
restarted, and its configuration, automations, integrations and household data were not edited.
