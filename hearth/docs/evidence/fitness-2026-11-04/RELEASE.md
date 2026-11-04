# Fitness private release — 4 November 2026

The owner approved pushing and deploying the completed Fitness work. GitHub main and the private
Synology web/server now run application commit `4168955730e5362b1d9e674479e4290f668e4880`.
This includes multiple goals and weekly routines, scheduled-workout-day streaks, the reusable
exercise library and optional private demonstrations, and the Games → Connections display rename.
This evidence-only follow-up is published on `codex/fitness-module`; it does not replace the
verified application release or cause another deployment.

## Passed release checks

[Verify Hearth 41800297742](https://github.com/davidjpramsay/hearth-v2/actions/runs/41800297742)
passed all eight jobs, including publication of the exact verified web/server images.

- `pnpm verify:code`: format, lint, strict types, **764 unit tests** (114 shared, 57 core,
  120 server, 473 web), **309 API/integration tests**, **32 migration tests**, deployment
  checks, production builds and isolated first-owner setup without HA. Passed locally after
  the final storage change and again on GitHub.
- `pnpm verify:ci`: five policy checks and complete non-overlapping browser inventory.
- `pnpm test:e2e:built --shard=N/4`: **348 + 348 + 347 + 347 = 1,390 passed** on the matching
  production build, with no retries. Includes actual fixture MP4 decoding, player controls,
  Back/focus restoration, module/access isolation, phone/tablet/TV layouts and existing features.
- `python3 -B -m unittest discover -s hearth/integrations/home_assistant/tests -v`:
  **69 passed** on GitHub. The installed HA component was not changed.
- Android job: `./apps/tv/gradlew -p apps/tv --no-daemon testDebugUnitTest lintDebug lintRelease
assembleDebug assembleRelease`, passed. No Android source or APK installation changed here.
- Dependency audit: no known vulnerabilities. Container builds and a fresh generated private
  installation without HA passed.
- Targeted Calendar/Connections/System health browser regressions: **3 passed** locally;
  targeted formatting/lint and `git diff --check` passed.

Earlier candidates were not deployed. Run 41797787517 found an ambiguous Connections locator;
41798847200 found an outdated migration-36 expectation. Both exact assertions were corrected,
without removing checks or relaxing workflow gates. Run 41799737228 was deliberately cancelled
to include the NAS file-permission correction before release. A temporary local admin locator
change was reverted after its targeted failure; the unchanged admin navigation subsequently passed.

## Backup and storage

A consistent online SQLite backup was retained on the NAS in the private data directory's
`.release-backups/`, with directory mode 0700 and file mode 0600. Integrity was `ok`, foreign-key
errors zero, migration 35, size 3,063,808 bytes. No database or private media was copied to Git or
the Mac. The existing activation helper also took its stopped database rollback checkpoint.

There was **no pre-existing Fitness media directory or clip** in this pre-Fitness installation;
the matching pre-upgrade Fitness media set is therefore empty. Existing photos remained in their
unchanged mount; this is not a claim that a new complete photo backup was made. Future upgrades
after clips are uploaded need matching database and media checkpoints as OPERATIONS specifies.

The backup preflight demonstrated that NAS inheritance could produce 0777 despite a requested
0700 creation mode. The empty directory was restricted before writing any backup. The new store
explicitly enforces 0700 on its own directory and 0600 on clips, including before new bytes are
written; the restart regression confirms existing broader permissions are corrected without
changing content or retry receipts. The actual deployed Fitness directory is **0700**. No real
exercise clip was uploaded during this release.

## Private activation and readback

```sh
PATH=/opt/homebrew/bin:$PATH hearth/deploy/synology/activate-private-release.sh 4168955730e5362b1d9e674479e4290f668e4880
```

Activation exited **0**. Both running image tags match the exact release. The commissioned helper
verified the existing bridge/DNS policy and returned readiness `ready`, database `ready`, mode
`private`. The firewall boot-file digest is unchanged. The runtime environment digest is unchanged
after excluding only `HEARTH_VERSION`; no networking, mounts, credentials or pairings were edited.

Trusted HTTPS checks through the existing NAS LAN address returned **200** for health, readiness,
runtime, the root document, `/hearth-bootstrap.js` and `/assets/index-CJJmnnDu.js`. Health reports
the exact release and `sqlite-ready`; both JavaScript assets have the correct content type.
TLS certificate/hostname verification stayed enabled; only this checking process selected the
existing private IPv4 route. No hosts, DNS, router, firewall or proxy configuration was changed.

**Network observation, not resolved:** before deployment this Mac's default DNS lookup supplied
only an IPv6 address and that path returned a NAS HTML **403**. IPv4-only name resolution failed.
Using the same trusted origin with `--resolve` to the existing NAS LAN address returned 200 before
and after activation. Default-DNS reachability and actual phone/TV reachability are not implied
by the successful explicit-LAN checks.

Privacy-safe post-deploy readback: migration **37**, database quick check `ok`, zero foreign-key
errors. Existing counts remain one household, five members, six paired-device records, six
controller-phone records and 38 photo records. The module-setting digest is unchanged. Fitness
plans, progress and library tables are empty; its default remains off. No household contents,
tokens, raw device IDs or credentials were printed or committed.

Local logs: `/tmp/hearth-fitness-private-media-verify.log`,
`/tmp/hearth-fitness-release-regressions.log`, `/tmp/hearth-fitness-hosted-final.json`,
`/tmp/hearth-fitness-browser{1,2,3,4}.log`, `/tmp/hearth-fitness-4168955-deploy.log`,
`/tmp/hearth-fitness-health-after.json`, and `/tmp/hearth-fitness-preserved-state-after.json`.
Rendered demo evidence remains listed in ACCEPTANCE; no live household screenshots were taken.

## Next use and unverified boundaries

Enable **More → Modules → Fitness**, then use **Fitness settings → Exercise library** to add
instructions and chosen short MP4 demonstrations. Link a library exercise to each relevant workout;
individual weights/sets/reps stay in the workout. No personal plans or real demonstrations were seeded.

Physical Google TV/iPhone/iPad playback, suspend/resume and real-user clips remain **not run**.
The browser evidence is not physical-device evidence. HA installation, permissions, automations,
TV power/current content, and the Android package were unchanged. Fitness does not require HA.
