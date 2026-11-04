# Hearth v2 acceptance and definition of done

## Repository naming migration — 2026-11-04 (D-132)

User-approved targets: current repository `davidjpramsay/Hearth` (ID 1327675743), original repository
`davidjpramsay/old_hearth` (ID 1174989270), canonical Pages `/Hearth/`. Existing container packages
and private runtime paths remain stable. GitHub naming is gated on the installed NAS verifier
accepting both explicit names for the same immutable repository; arbitrary redirects stay blocked.

Preparation passed: 10 release-safety tests in an isolated Linux-root Docker fixture, 14 portable
installer tests, `pnpm format:check`, `pnpm lint`, `pnpm verify:deploy`, `pnpm verify:ci`,
`node hearth/scripts/verify-public-site.mjs /tmp/hearth-rename-site-stage`, and `git diff --check`.
CI inventory covers 1,400 browser tests in four non-overlapping shards. The original fixture run
used a world-writable `/tmp` ancestor and correctly failed its protected-path checks; the final
fixture used a dedicated root-owned 0700 `/fixture` mount, with no policy relaxation.

At preparation, installed verifier hash matches the current baseline. The tested compatibility
policy, exact hash guard, private rollback and unchanged-configuration checks are prepared for one
owner-authorized NAS maintenance step. Completion of installation, GitHub renames, legacy notice,
archive, Pages, registry and live updater/readiness verification remains pending this step. No
app container update is part of repository naming. D-131's Games source remains in this branch;
its local verification is recorded separately below.

## Games menu and Connections submenu — 2026-11-04 (D-131)

Locally implemented on `codex/games-menu`: Games is the family navigation/module label and opens
a submenu containing Connections. The puzzle remains at `/games/connections`; old explicit
`/games?puzzle=N` links redirect there. Saved boards, guesses, shuffle order and completion markers
are preserved. Header/remote/native-message Back returns to Games, restores the opener and closes
dialogs first. The phone More tab stays active on the child route. Both routes obey Games off;
the existing HA `games` wire identifier recognises the explicit child as the same observed tab.

Passed locally under `hearth/`:

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck` and the final web typecheck.
  Lint exited 0 with the existing jsx-ast-utils TSNonNullExpression diagnostic twice.
- `pnpm test:unit`: 764 tests (114 shared, 57 core, 120 server, 473 web).
- `pnpm --filter @hearth/server exec vitest run src/modules.integration.test.ts
  src/home-assistant-bridge.integration.test.ts`: 65 API/integration tests.
- `python3 -B -m unittest discover -s hearth/integrations/home_assistant/tests -v`
  from the repository root: 69 offline HA tests.
- `pnpm build`, then the final web rebuild after the loading-focus correction. The macOS-provided
  Python launcher initially stopped at the existing Xcode licence prompt; the final build used
  the already-installed Python 3.12 via a temporary PATH entry, with no system setting change.
- `pnpm test:e2e:built tests/e2e/games-menu.spec.ts tests/e2e/games-remote.spec.ts
  tests/e2e/games.spec.ts tests/e2e/games-progression.spec.ts tests/e2e/games-resume.spec.ts
  tests/e2e/menu-focus.spec.ts tests/e2e/modules.spec.ts tests/e2e/rail-visibility.spec.ts
  tests/e2e/native-tv-viewport.spec.ts tests/e2e/calendar.spec.ts:405 --max-failures=1`:
  **67 passed, zero retries**. Coverage includes light/dark phone/tablet/TV/4K puzzle layouts,
  the new submenu, direct/legacy links, remote-only play, native Back messages, archive dismissal,
  saved-progress recovery, module isolation, menu focus and native logical sizing.
- `git diff --check`.

The first remote run exposed initial focus landing on the newly visible Back link while the board
loaded. The screen now marks that loading interval so automatic entry waits for the real board;
explicit Back remains available. Older tests expecting a board directly at `/games` were updated
to traverse the submenu. The final 67-test run passed after these corrections.

Independent in-app browser inspection used the compiled demo at `http://127.0.0.1:4320`, with
1920×1080 and 390×844 viewports. Games rail selection retained `nav-games` focus and no page
highlight; Right/Enter opened Connections at its first tile, and Back returned to the game link.
Page identity/content, layout, no framework overlay and no warning/error logs were checked.
Screenshots remain outside Git: `/tmp/hearth-games-menu-rail-entry-tv.jpg`,
`/tmp/hearth-connections-submenu-phone.jpg`, and `/tmp/hearth-games-menu-*-*.png`.

Not run for this local change: publication/deployment, live HA component installation, physical
TV/iPhone acceptance or the entire hosted release gate. No Android source/APK change is included.

## Public website and sharing boundary — 2026-11-04 (D-130)

The public README and static GitHub Pages preview use the Hearth name and the owner-selected MIT
licence. Preview captures are fictional local demo data. Static-file allowlisting, local assets,
keyboard gallery controls and responsive layouts at 1440, 820, 390 and 320 CSS pixels passed local
checks; details are in [public-site evidence](../../hearth/docs/evidence/public-site-2026-11-04/README.md).
Pages publication is separate from a household application deployment. Existing application
release gates are unchanged. A public website does not close independent security review, a
second-household recovery drill or physical-device acceptance gaps; see
[public release readiness](PUBLIC_RELEASE_READINESS.md).

## Fitness release gate — 2026-11-04

**Deployed:** application `4168955730e5362b1d9e674479e4290f668e4880`, following all eight hosted
jobs and **1,390 browser tests** passing. Private activation returned readiness; migration 37,
household counts, module settings and existing network configuration were checked. Exercise storage
is 0700 on the NAS. Fitness remains off with no real plans/clips seeded. Physical playback and this
Mac's default-DNS route remain unverified/blocked as detailed in the
[release record](../../hearth/docs/evidence/fitness-2026-11-04/RELEASE.md).

The owner approved publication and private deployment. Initial hosted run
[41797787517](https://github.com/davidjpramsay/hearth-v2/actions/runs/41797787517) passed
Web/server, Android and Synology image checks, but stopped at an ambiguous older Calendar test:
the phone More menu now intentionally has both the Connections puzzle and Connections settings.
The candidate was not deployed. The test now checks their separate focus IDs, accessible labels
and destinations. Both the changed Calendar check and existing service-settings navigation passed
locally: `pnpm test:e2e:built tests/e2e/calendar.spec.ts tests/e2e/admin.spec.ts --grep
'phone Calendar exposes|Connections contains only'` (**2 passed**). No application behaviour,
assertion threshold or workflow gate was relaxed. Final hosted and live evidence follows separately.

The second run, [41798847200](https://github.com/davidjpramsay/hearth-v2/actions/runs/41798847200),
also stopped before publication: the System health browser check still expected migration 36.
Its exact expectation now matches the exercise-library migration 37; this candidate was not deployed.

During the approved predeployment backup, the NAS gave a new, empty directory mode 0777 despite
requesting 0700. Explicit chmod corrected it before any backup contents were written. The exercise
store now likewise enforces 0700 on its directory, 0600 on referenced clips at startup, and 0600 on
new file descriptors before writing/flushing bytes. A restart regression deliberately broadens a
fixture directory/file, then verifies permissions are repaired with content and receipts retained.
Run 41799737228 was cancelled to include this storage correction before deployment.
After this correction, `pnpm verify:code` passed again in full (764 unit, 309 integration and
32 migration tests, format/lint/types, builds, deployment checks and isolated fresh boot).
The three targeted Calendar/Connections/System-health browser checks also passed after the
two expectation corrections. These remain local evidence until the final hosted run completes.

## Fitness demonstrations — D-129, local proof 2026-11-04

Implemented reusable adult exercise library, private optional MP4s, explicit plan references,
remote Play/Pause/Replay/Back and retained workout/scroll/focus state. Migration 0037 preserves
plans, progress and earlier request hashes. No real demonstration clip or household setup seeded.
The sole committed MP4 is an original synthetic test pattern, documented in tests/fixtures/README.md.

Passed in the isolated local Fitness worktree:

- `pnpm verify:code`: format, lint, workspace types, **764 unit tests** (114 shared, 57 core,
  120 server, 473 web), **309 integration tests**, **32 migration tests**, deployment-scaffold
  checks, production web/server builds and fresh private backend/setup proof.
- After final file/directory flush hardening,
  `pnpm --filter @hearth/server exec vitest run src/fitness-library.integration.test.ts`: **10 passed**;
  `pnpm --filter @hearth/server build`: passed.
- `pnpm test:e2e:built tests/e2e/fitness*.spec.ts tests/e2e/modules.spec.ts
  tests/e2e/menu-focus.spec.ts --max-failures=3 --output=/tmp/hearth-fitness-demonstration-final`:
  **58 passed**. Includes existing Fitness, module and menu behaviour.
- After final library input styling and quiet cancellation handling, `pnpm format:check`,
  `pnpm lint`, `pnpm -r --if-present typecheck`, `pnpm build`, then
  `pnpm test:e2e:built tests/e2e/fitness-demonstrations.spec.ts
  --output=/tmp/hearth-fitness-demonstration-polish`: **15 passed**. These overlap the first
  gate's 14 demonstration cases and add one cancellation/rejected-play case: **59 distinct browser
  checks across both gates**, not 73 distinct cases.
- `pnpm verify:ci`: **5 policy tests passed**, **1,390 browser cases inventoried** in disjoint shards.
  The full 1,390-case browser suite was **not run** locally for this feature.
- Homebrew `git diff --check`: passed.

Covered durable exact/changed retries, stale edits, unsupported/malformed/oversized clips, storage
bounds, safe audit, transaction rollback, orphan cleanup, private files, authenticated GET/HEAD/ranges,
foreign-home/child/screen/mixed/automation/anonymous isolation, module off/on preservation, two people
reusing one clip, ambiguous upload retry, adult drafts, unavailable/removed clips, actual browser MP4
decoding, pause/replay, exact Back focus/scroll in a 20-exercise Sunday workout, native presentation
message/pagehide pause and recoverable rejected/cancelled playback. No playback changes a check.

Browser plugin unavailable; repository Playwright used. Visually inspected current captures in
`/tmp/hearth-fitness-demonstrations/`: `player-1920-dark.png`, `player-1280-light.png`,
`player-393-light.png`, `library-phone.png`; additional tablet/light/dark captures are there.
Automated fitting and axe checks cover player 1920×1080, 1280×720, 393×852 and 768×1024 in both themes.
Logs: `/tmp/fitness-demonstration-verify.log`, `fitness-demonstration-browser-final2.log`,
`fitness-demonstration-polish.log`, `fitness-library-durable-final.log`, `fitness-final-*.log` and
`fitness-demonstration-ci-final.log`.

Failed/blocked: no unresolved local failure. Not run: physical Google TV/iPhone/iPad video playback,
real-user exercise clips, hosted release verification, push, deployment or live NAS/HA changes.
No Kotlin changes; native build/device testing is not implied by browser/native-message simulation.
Before an approved deployment preserve a matching full database/media backup (OPERATIONS/D-129).
After deployment, test one chosen clip on the actual phone and TV, including suspend/resume and Back.

## Connections display name — local verification, 2026-11-04

Renamed the Games destination to Connections in the TV rail, phone Family menu, page title,
Modules settings and matching Home Assistant labels. `games` routes, API/module/HA identifiers,
archive data and saved progress are unchanged. The TV focus key stays `nav-games`; the longer
label has room beside a full-size icon through tighter rail spacing, with unchanged text size.
Service settings remain a separate Connections entry under Manage Hearth.

Passed using isolated local demo data:

- `pnpm format:check`; targeted `pnpm exec eslint` for changed TS/TSX files with
  `--max-warnings 0`; `pnpm --filter @hearth/web typecheck`; `pnpm build`.
- `pnpm --filter @hearth/web test:unit`: **473 passed**.
- `python3.12 -m unittest discover -s integrations/home_assistant/tests`: **69 passed**.
- `pnpm test:e2e:built tests/e2e/games*.spec.ts tests/e2e/rail-visibility.spec.ts
  tests/e2e/modules.spec.ts tests/e2e/menu-focus.spec.ts tests/e2e/admin.spec.ts:69
  tests/e2e/admin.spec.ts:268 --output=/tmp/hearth-connections-rename-results`: **58 passed**.
  Covers phone/tablet/TV light/dark, D-pad/Back, puzzle resume, module switches, service-settings
  navigation, focus restoration and explicit checks against icon shrinkage or label overflow.
- `git diff --check`: passed with Homebrew Git.

Browser plugin not available; repository Playwright used. Visually inspected phone and TV captures
at `/tmp/hearth-games-phone-light.png` and `/tmp/hearth-games-tv-dark.png`. Additional screenshots
are in `/tmp/hearth-connections-rename-results`. Final logs: `/tmp/hearth-connections-rename-browser-final.log`,
`hearth-connections-rename-build-final.log`, `hearth-connections-rename-unit.log` and
`hearth-connections-rename-ha.log` under `/tmp`.
An initial test selected a hidden TV link on the phone; it now waits for the proper menu focus ID.
Visual review then caught icon shrinkage from the longer name; corrected and final checks passed.

Not run: full release suite, physical TV/phone, hosted checks, publication/deployment or live HA
component installation. No household data, network, TV playback or automation changes.

## Fitness goal routines (D-128) — local refinement, 2026-11-04

Each of up to five long-term goals per person now owns its own weekly focus and recurring workouts.
Fitness opens on the current day and combines due sessions across active goals, retaining the goal
label on each card/details. The goals dialog lists each routine and weekly progress. Adult settings
groups workouts under expandable goals; achieving/removing a goal changes future schedules only.
Streaks still count fully completed scheduled days across all goals. Earlier unassigned workouts,
stable IDs, current/past progress and exact saved request receipts are preserved. No new migration.

Passed on isolated local data (commands inside `hearth/`):

- `pnpm exec vitest run packages/shared/src/fitness.test.ts packages/core/src/fitness.test.ts
  apps/server/src/fitness.integration.test.ts`: **24 passed**, including same-person goal validation,
  independent schedules, combined streaks, achieved-goal handling, dated labels, preserved legacy
  JSON and exact replay after restart.
- `pnpm verify:code`: format/lint/types, **764 unit tests** (114 shared, 57 core, 120 server,
  473 web), **299 API/integration tests**, **31 migration tests**, deployment scaffolds,
  production web/server builds and private fresh boot passed.
- `pnpm verify:ci`: five policy checks and non-overlapping inventory of **1,375 browser cases**;
  this is inventory, not a full-suite browser execution.
- After the final scoped form styling corrections, `pnpm format:check`, `pnpm build` and
  `pnpm test:e2e:built tests/e2e/fitness.spec.ts` passed; **29 browser tests** in the final run.
  Covers two independent goals created on a phone, current-day aggregation/checks/streak, goal
  removal confirmation/isolation, legacy assignment with preserved checks, eight viewport sizes
  in light/dark, Axe, no visual-case console errors, modal/Back/D-pad and draft/offline/retry behavior.
- `git diff --check`: passed using Homebrew Git.

Final screenshot evidence under `/tmp/hearth-fitness-goals-evidence/`: `fitness-1920-dark.png`,
`fitness-390-light.png`, `goals-tv.png`, `goals-phone.png`, `settings-phone.png` and workout-detail
captures. TV overview, phone overview/editor and goal dialogs were visually inspected. The final
phone editor uses standard Hearth controls; the full-page capture places fixed bottom navigation
at the first viewport edge, not midway through a real scrolling page. Repository Playwright used.
Logs: `/tmp/hearth-fitness-goals-code.log`, `hearth-fitness-goals-ci.log`,
`hearth-fitness-goals-final-build.log`, `hearth-fitness-goals-browser-final.log`.
An initial browser attempt used the wrong accessible name for Remove goal; the corrected test
and both subsequent full Fitness runs passed. No remaining test failure.

**Not run:** all 1,375 browser cases, physical phone/TV checks, hosted publication or deployment.
No HA/NAS/TV, network, credential or real household changes. The broader initial checkpoint below
is historical evidence for the preceding implementation; it is not a new 167-case run of this patch.

## Initial Fitness checkpoint (D-128) — before the goal-routine refinement, 2026-11-04

Optional Fitness is implemented with explicit participants, five long-term goals per person,
weekly focus and recurring weekday sessions for running, swimming, weights and fitness class.
The family screen opens exercise / kg / sets / reps details and permits today's check/undo.
Streaks count consecutive fully completed scheduled days, skip rest days, and keep today open until
local midnight. First setup applies today; subsequent edits start tomorrow, preserving history.
The module starts off; enable it in More → Modules, then configure it in Fitness settings.
Canonical behavior and boundaries: [FITNESS_CONTRACT.md](FITNESS_CONTRACT.md).

Local checks (commands run inside `hearth/`, using isolated demo/test data):

- `pnpm verify:code`: format, lint, typecheck, **761 unit tests** (112 shared, 56 core,
  120 server, 473 web), **297 API/integration tests**, **31 migration tests**, deployment scaffold,
  web/server production builds and private fresh boot without HA/credentials.
- `pnpm verify:ci`: five CI-policy tests and complete non-overlapping inventory of **1,372**
  browser tests. This inventories the whole suite; it does not run all 1,372.
- `pnpm audit:dependencies`: no known vulnerabilities.
- `python3.12 -m unittest discover -s integrations/home_assistant/tests`: **69 passed**;
  adapter/entity stand-ins, not a live HA installation.
- `pnpm test:e2e:built tests/e2e/fitness.spec.ts tests/e2e/modules.spec.ts
  tests/e2e/screen-admin-isolation.spec.ts tests/e2e/phone-navigation.spec.ts
  tests/e2e/admin.spec.ts tests/e2e/morning-routine.spec.ts tests/e2e/morning-profiles.spec.ts`:
  **167 passed**. Includes 26 Fitness checks, surrounding adult settings, module gates,
  screen/admin isolation and both Morning Routine profiles.
- `git diff --check`: passed (Homebrew Git).

Fitness browser proof includes empty initial setup through a saved workout and streak, adult
goal/day/exercise editing, future-day read-only detail, check/undo/reload, exact lost-response retry,
offline saved content, draft retention/discard guard, module-off route exit, long instructions,
14-session paging, D-pad edge escape and modal focus restoration. Light/dark and Axe checks cover
1920×1080, 3840×2160, 1366×768, 1280×640, 390×844, 844×390, 820×1180 and 1180×820.
TV canvases fit vertically; touch layouts scroll naturally. No page/console errors on the visual
Fitness cases. A small labelled landmark correction covers the existing phone/admin clock.

Screenshots visually inspected: `/tmp/hearth-fitness-evidence/fitness-1920-light.png`,
`fitness-1920-dark.png`, `fitness-390-light.png`, `details-1920-light.png`,
`details-390-dark.png` and `settings-phone.png` in the same folder. Repository Playwright was used
because the Browser plugin was unavailable. Evidence logs: `/tmp/hearth-fitness-code.log`,
`hearth-fitness-regression.log`, `hearth-fitness-ci.log`, `hearth-fitness-ha.log` and
`hearth-fitness-audit.log` under `/tmp`.

Resolved during verification: unstylized detail buttons, a native select unsuitable for D-pad exit,
scroll-region edge trapping, clock landmark coverage, and an obsolete migration-35 browser assertion.
An earlier regression attempt was interrupted by Chromium `ERR_NETWORK_CHANGED` while loading
local scripts; trace preserved at `/tmp/hearth-fitness-network-interruption.zip`; the final run
is reported separately above.

**Not run:** full 1,372-browser execution, physical iPhone/iPad/TV viewing, hosted checks, publication,
deployment or HA component installation/reconnection. Android source/APK is unchanged. No live
household plan, device, secret, HA automation, NAS container, backup or networking was changed.
Migration 0036 preservation/atomic rollback and frozen old HA grants are locally tested.

## Private release and physical TV update — 2026-11-04

Release `8cb1b244971d76dfe49e2662e700c9138173f2bd` is published on GitHub main and deployed on the
private NAS after all eight jobs in [run 41753581056](https://github.com/davidjpramsay/hearth-v2/actions/runs/41753581056)
passed. This includes **1,346 browser tests**, a clean dependency audit, 749 unit tests, 290
integration tests, 30 migration tests, 69 HA component tests, Android checks and exact image
publication. External readiness/health/runtime return HTTP 200/private; health matches that SHA.
The normal bounded updater verified the preserved bridge/DNS policy.

The physical TCL was updated in place to **0.1.3-debug / code 4**, with matching APK hashes and
unchanged encrypted pairing-file digest. Cold launch, real household render and Home/warm resume
passed. Left/Right/Back did not crash; individual focus transitions were not captured. After the
sleep command, ADB became unavailable and remote wake did not restore it. Therefore physical
deep-standby recovery, final Android power-state readback, delayed-Wi-Fi wake and forced live
network-loss recovery remain **unverified**, despite passing emulator recovery tests. No alarm,
music, volume, network setting or household data was changed. File editor was stopped afterward.
Exact commands, rollback and limitations: [release evidence](../../hearth/docs/evidence/tv-wake-recovery-2026-11-04/RELEASE.md).

## Release dependency gate — 2026-11-04

The first published wake-recovery candidate `cd57dd9` was blocked before release publication by
hosted run `41752393110`: two transitive minimatch copies were covered by
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). No failed release was deployed.
The corrected dependency tree uses upstream 11.0.1 plus a four-line export-compatibility patch for
existing lint tooling, with no changes to the upstream security logic or the audit threshold.
The Docker build copies the tracked patch before installing. Three regressions cover import
compatibility, expansion bounds and continued accessibility-rule enforcement. Initial focused
run: 10/10 security-dependency tests and clean `pnpm audit:dependencies`; full release results follow
in the approved deployment evidence. Details: [dependency patch](../../hearth/patches/README.md).

## TV wake/start recovery — original local checkpoint, 2026-11-04

Native 0.1.3 / code 4 now uses a foreground-only five-attempt/30-second recovery window for
transient validation and page failures. Pause/Back cancel scheduled work, late callbacks are rejected,
and resume can restart the bounded window. An Android emulator reproduced HTTP failure arriving
before page-start; the failed document now remains rejected until a fresh WebView retry. Persistent
outages retain pairing and expose D-pad Retry. Explicit revoked sessions remain terminal.

Web runtime startup retries temporary failures twice (five-second attempts, 2/4-second backoff),
then offers manual recovery. Authentication/schema failures do not retry; no household query starts
before runtime succeeds. No schema, mutation, provider, credential or network changes.

**Passed:** complete `pnpm -C hearth verify:code` (108 shared + 48 core + 117 server + 473 web unit,
290 integration, 30 migration tests, format/lint/typecheck, deployment scaffold/installer checks,
production builds and no-HA fresh boot); Android 28 JVM tests, both lint variants and both builds;
10 API-36 Android instrumentation checks; 37 built-browser startup/reliability/native-viewport/CSP
checks; CI policy/shard inventory and `git diff --check`. Native lint has 19 non-blocking warnings
per variant, zero errors. Screenshots visually inspected at 390px phone and 1920px TV/native UI.

**Not run at this original checkpoint:** full 1,346-browser suite, GitHub publication, deployment, physical-TV install or a real
standby/wake reproduction. The user's symptom remains consistent with delayed network readiness,
not a captured physical diagnosis. Existing household devices and networking were untouched.
The approved release evidence above supersedes these original publication/installation boundaries.
See [exact commands, results and screenshots](../../hearth/docs/evidence/tv-wake-recovery-2026-11-04/README.md).

## Indoor chart copy cleanup — local, 2026-10-30

Removed the “Line: average · Shading: recorded low–high” explanation from both indoor charts.
The existing Saved history state appears on its own only when retained samples are being shown
after a history-read failure. Normal chart cards end with their Low/Average/High summaries.

`pnpm -C hearth --filter @hearth/web typecheck`, `pnpm -C hearth lint`, production web build,
formatting and `git diff --check` passed. Existing `indoorChartGeometry.test.ts` passed **21/21**.
`pnpm -C hearth test:e2e:built tests/e2e/indoor-weather.spec.ts --grep 'Indoors fits (390x844|1920x1080)'
--reporter=line --output=/private/tmp/hearth-indoor-key-removed` passed **4/4**, phone/TV light/dark,
including bounds, Back and accessibility checks. Screenshots were visually inspected there;
log `/private/tmp/hearth-indoor-key-browser.log`. Browser plugin unavailable; repository Playwright
used against isolated demo data. **Not run:** publication/deployment or actual phone/TV viewing.
No server, provider, data, HA or network change.

## Bible reading popup (D-055) — local cleanup, 2026-10-30

Today and Morning Routine share the updated reading dialog. It inherits Hearth's Source Sans
typeface, retains the exact quotation/reference and genuine saved-read warnings, and removes
the redundant eyebrow and publisher/demo paragraphs. An ESV link sits beside the reference,
with the provider's short marker retained in the text. Full attribution is on the read-only
**More → Credits** page. Its Back control restores the menu opener and the phone keeps More active.
The ESV link has a fixed official fallback when older nullable source metadata is absent.
Provider calls, quotation wording, cache, credentials, household authority and live runtime are unchanged.

Local checks in `/private/tmp/hearth-morning-routine`, `codex/shareable-setup`:

- `pnpm -C hearth --filter @hearth/web test:unit` — **468/468**;
  `/private/tmp/hearth-verse-popup-unit-final.log`.
- `pnpm -C hearth --filter @hearth/web typecheck`, `pnpm -C hearth lint`,
  `pnpm -C hearth --filter @hearth/web build`, `pnpm -C hearth format:check` and `git diff --check`
  — **PASS**. No new dependency, server or native app change.
- `pnpm -C hearth test:e2e:built tests/e2e/verse-popup.spec.ts tests/e2e/today-settings.spec.ts
tests/e2e/morning-routine.spec.ts tests/e2e/screen-admin-isolation.spec.ts tests/e2e/modules.spec.ts
--grep 'verse|Bible credits|paired .* has no administration|all modules off' --reporter=line
--output=/private/tmp/hearth-verse-popup-final` — **18/18**, Chromium. Four popup sizes
  (390×844, 844×390, 1366×768, 1920×1080), both themes, computed quote/body font-family equality,
  unchanged passage, absent publisher paragraphs, source fallback, a11y, contained Tab/Close/Back,
  credits navigation, Morning Routine stale/module-off behavior and shared-screen admin isolation.
- `pnpm -C hearth test:e2e:built tests/e2e/verse-popup.spec.ts --browser=webkit --reporter=line
--output=/private/tmp/hearth-verse-popup-webkit-pass` — **10/10**, Safari engine. Initial QA caught
  low-contrast dark Close text and Safari Tab leaving the popup via its link/button preferences.
  The popup now uses a contrasting dark foreground and cycles its two known controls explicitly;
  unrelated dialogs/navigation are unchanged. Log `/private/tmp/hearth-verse-popup-webkit-pass.log`.
- `pnpm -C hearth verify:ci` — **5/5** policy checks and a complete **1,340-case** shard inventory;
  this is not execution of the full hosted suite.

The publisher's current [API attribution guidance](https://api.esv.org/) and
[short-marker option](https://api.esv.org/docs/passage-text/) were checked on 2026-10-30.
Browser plugin unavailable; repository Playwright used with fictional fixture text and no real
household passages/credentials. Phone and TV screenshots were visually inspected under
`/private/tmp/hearth-verse-popup-final/` and `/private/tmp/hearth-verse-popup-webkit-pass/`.
**Not run:** actual iPhone/TV viewing, hosted verification, publication or deployment. The live
server, NAS/HA configuration and household data remain untouched.

## Main-menu focus refinement (D-087) — local, 2026-10-30

Selecting a TV, phone or desktop-admin main-menu item keeps focus in navigation, with no automatic
page-control outline. Safari taps explicitly focus the chosen link; a shell replacement restores
the current navigation item. Delayed content/background updates retain that focus. Right from a
rail deliberately enters the meaningful page control; native Tab, form keys, modal containment,
detail entry and exact Back restoration remain. New menu destinations start at the top.
Direct page entry keeps its existing meaningful default. No data, permissions, providers, server
contracts, native TV code, HA, Synology or networking changed.

The new remote-only Calendar regression failed before the fix because Calendar's view selector
took focus automatically. The same journey now retains Calendar in the menu, then explicitly
enters with Right, opens an event, closes its dialog and restores that event.

Release verification also caught an early Right being lost while a lazy page was loading,
including React retaining the outgoing page. Explicit entry now waits for the chosen route and
is cancelled by another menu/focus choice, direction, Tab, pointer interaction or Back. It never
replays Enter. The new delayed-entry unit regression failed before the fix; the final
`pnpm -C hearth --filter @hearth/web exec vitest run src/focus/useRemoteNavigation.test.tsx`
passes **7/7**, including cancellation and unchanged modal/Back behaviour. A built-browser check
holding Appearance's module request, plus both existing TV Appearance journeys and dark phone
Connections contrast/menu order, passes **4/4**; log
`/private/tmp/hearth-release-focus-confirmed.log`. Older Connections title/surface and Appearance
auto-entry assertions now verify the actual shared panel, its inset focus indicator, new menu
order and explicit Right. Hosted verification and private activation still gate publication.
The follow-up `pnpm -C hearth verify:code` passes formatting, lint, types, **743 unit / 290 API /
30 migration tests**, installer/deployment checks, production builds and the isolated fresh-backend
proof. `pnpm -C hearth verify:ci` passes **5/5** policy checks with complete, non-overlapping
**1,341-case** browser coverage. Logs: `/private/tmp/hearth-release-final-code.log` and
`/private/tmp/hearth-release-final-policy.log`.
The hosted fast-navigation check exposed a further one-paint gap before the current route's
keyboard handler was installed. Keyboard subscriptions now update during the same layout commit
as route/focus state. The three fast/held Appearance journeys pass **45/45** consecutive runs
(`--repeat-each=15`; `/private/tmp/hearth-release-keyboard-repeat.log`), and all **470 web unit
tests**, lint and web types pass. Readiness checks now wait for actual focus instead of sampling
before asynchronous data arrives; their assertions and a11y checks are retained. The affected
TV/tablet Pocket money and Appearance cases pass **18/18** (`--repeat-each=3`;
`/private/tmp/hearth-release-readiness-confirmed.log`). Failed candidates were not activated.
The remaining Home, NBA and Meals remote journeys now also require explicit Right after choosing
a main-menu destination, while retaining all action/confirmation/Back assertions. Their complete
Home/NBA/planning suites pass **74/74** (`/private/tmp/hearth-release-remote-audit-final.log`). The
wider NBA escape/return case caught an unselected rail item being treated as a chosen destination:
Right now returns to the current page unless a link was actually activated. The new unit regression
failed before this correction; the focus file now passes **8/8**, and all **471 web unit tests**,
lint, web types, formatting and diff checks pass. No Home Assistant or real TV command ran in these
isolated demo checks.
The hosted Home confirmation check then exposed focus restoration racing the mutation's pending
state. The active Home action now exposes its busy state and stays guarded but focusable, matching
the existing focus engine's busy-row rule. A held-response Back/duplicate-command regression fails
before this fix and passes after it. Both Home remote journeys pass **30/30** repeated runs, and
the full Home suite passes **16/16**, including phone, dark/TV visual, offline, errors and a11y;
logs `/private/tmp/hearth-release-home-busy-repeat.log` and
`/private/tmp/hearth-release-home-all-final.log`. All **471 web unit tests**, lint and web types
also pass. Command transport, permissions, idempotency and live HA configuration are unchanged.

Local verification from `/private/tmp/hearth-morning-routine`, `codex/shareable-setup`:

- `pnpm -C hearth --filter @hearth/web exec vitest run src/focus/focusGraph.test.ts
src/focus/useRemoteNavigation.test.tsx` — **26/26**. Covers retained/delayed menu focus, shell
  replacement, same-page activation, explicit Right/Tab, nested-modal containment and detail/Back.
- `pnpm -C hearth --filter @hearth/web test:unit` — **468/468**;
  `/private/tmp/hearth-menu-focus-web-unit-final.log`. Typecheck, lint and production web build passed:
  `pnpm -C hearth --filter @hearth/web typecheck`, `pnpm -C hearth lint`,
  `pnpm -C hearth --filter @hearth/web build`.
- `pnpm -C hearth test:e2e:built tests/e2e/menu-focus.spec.ts tests/e2e/remote.spec.ts
tests/e2e/keyboard-layout.spec.ts tests/e2e/rail-visibility.spec.ts --reporter=line
--output=/private/tmp/hearth-menu-focus-regression-pass` — **50/50**. All thirteen available family
  destinations including Morning/NBA/Appearance, desktop admin and shell exit, phone portrait/
  landscape taps, lazy transitions, D-pad reachability, short/4K rails, a11y, form editing and
  completion/undo/Back. Remote Calendar/Chores/Photos journeys now assert retained menu focus and
  explicitly press Right before using page controls; their existing action assertions remain.
- `pnpm -C hearth test:e2e:built tests/e2e/calendar.spec.ts tests/e2e/reliability.spec.ts
tests/e2e/photos.spec.ts --grep 'Calendar defaults|Agenda event details|Calendar preserves|delayed
Calendar route|explicit loading-screen Back focus|admin loading retains|remote-only navigation
opens Photos|meal drafts survive' --reporter=line --output=/private/tmp/hearth-menu-focus-lazy-back`
  — **10/10**. Existing delayed Calendar direction bursts, explicit loading Back, event details,
  photo/ambient exit, direct-entry defaults and unsaved-draft navigation remain intact.
- `pnpm -C hearth test:e2e:built tests/e2e/menu-focus.spec.ts --browser=webkit --reporter=line
--output=/private/tmp/hearth-menu-focus-webkit` — **6/6**, Safari engine, **not physical iPhone**.
  Includes exact current-menu state, full module crawl, loading, Right/dialog/Back and both phone
  orientations. Log `/private/tmp/hearth-menu-focus-webkit.log`.
- `pnpm -C hearth verify:ci` — **5/5** policy checks and **1,330-case** complete shard inventory,
  not full-suite execution. Formatting and `git diff --check` passed.

Browser plugin unavailable; repository Playwright used with isolated fictional demo data. Page
identity, meaningful content, no framework overlay, console health and visual focus/geometry were
checked. Screenshots inspected under `/private/tmp/hearth-menu-focus-regression-pass/` and
`/private/tmp/hearth-menu-focus-webkit/`. **Not run:** hosted release checks, publication/deployment
or physical TV/iPhone verification. Existing private runtime and household data remain untouched.

## D-126 indoor chart axes — local refinement, 2026-10-29

Replaced arbitrary start/middle/end axis labels with whole local hours, regular dates and actual
month boundaries while preserving trailing windows, elapsed sample positions and missing-data
gaps. Temperature has enclosing padded whole-number steps; humidity retains 0–100% with five or
six labelled values. Measured font/container size controls label density and padding. This changes
presentation only: no provider, DTO, history retention, authentication, HA, NAS or network changes.

Local checks from `/private/tmp/hearth-morning-routine`, `codex/shareable-setup`:

- `pnpm -C hearth --filter @hearth/web exec vitest run src/screens/indoorChartGeometry.test.ts`
  — **21/21**, including quarter/half-hour timezones, Sydney DST in both directions, odd-minute
  windows, true elapsed positions, negative/constant/outlying temperatures, compact vertical
  labels, 360/375/390px phone density, local dates/month starts, gaps and duration-weighted means.
- `pnpm -C hearth --filter @hearth/web test:unit` — **463/463**. The first broad attempt was
  blocked only by the restricted local listener required by five existing transport tests; the
  rerun with loopback access passed. Log `/private/tmp/hearth-indoor-axes-unit-pass.log`.
- `pnpm -C hearth --filter @hearth/web typecheck`, `pnpm -C hearth lint`, `pnpm -C hearth build`
  and the final `pnpm -C hearth --filter @hearth/web build` — **PASS**. No dependency added.
- `pnpm -C hearth test:e2e:built tests/e2e/indoor-weather.spec.ts --reporter=line
--output=/private/tmp/hearth-indoor-axes-chromium-pass` — **22/22**. Seven viewports, both themes,
  D-pad exit, Back/reopen, a11y, missing history, source privacy and exact settings-save retry.
  The four axis cases visit every period on phone/TV and measure real text bounds/clearance,
  assert correct sample replacement and capture deterministic synthetic-data screenshots.
- `pnpm -C hearth test:e2e:built tests/e2e/indoor-weather.spec.ts --browser=webkit
--grep 'Indoor axes|390x844|844x390|820x1180|1180x820|D-pad' --reporter=line
--output=/private/tmp/hearth-indoor-axes-webkit-pass` — **13/13**. Phone/tablet in both orientations,
  both themes and all period axes; Safari engine, not a physical iPhone. Initial checks exposed
  WebKit's taller label bounds and an unload/catch-up race in the reload test. Added font-sized
  bottom clearance and waited for catch-up before intentional reload; error/overlap assertions
  remain intact. Log `/private/tmp/hearth-indoor-axes-webkit-pass.log`.
- `pnpm -C hearth verify:ci` — **5/5** policy checks and a complete **1,324-case** shard inventory;
  inventory is not full-suite execution. `pnpm -C hearth format:check` and `git diff --check` passed.

Used repository Playwright because the Browser plugin is unavailable. Visually inspected the
phone and TV axes, including Month/Year and both themes. Final screenshots are under
`/private/tmp/hearth-indoor-axes-chromium-pass/` and `/private/tmp/hearth-indoor-axes-webkit-pass/`.
Private data was not used. **Not run:** physical phone/TV viewing, hosted verification or deployment
of this candidate. Existing live HA recording, networking and household data remain untouched.

## D-127 shareable setup — local work, 2026-10-29

Implemented a guarded fresh Docker installer and explicit portable update path, private first-phone
QR CLI, Get started adult route, resilient optional Connections and deterministic HA/server setup
ZIPs. HA remains optional. No live household, NAS networking, HA files, automations or grants changed.
The install/update fixtures are disposable local directories, not actual deployment or recovery proof.

Local verification **PASS** from `/private/tmp/hearth-morning-routine`, branch
`codex/shareable-setup`:

- `pnpm -C hearth verify:code` — format, lint, types, **718 unit**, **290 API/integration**,
  **30 migration**, existing deployment checks, production builds and the new fresh-private-backend
  smoke all passed. Log `/private/tmp/hearth-setup-final-verify-code.log`.
- Portable install/update fixtures: **14/14**, including the actual Docker Compose JSON parser,
  private files, refusal/consumed-key resume, supported verified-release selection, complete stopped
  checkpoints, integrity checks, insufficient-space refusal and matching rollback. HA component
  install/update fixtures: **6/6**, including deterministic allowlisted packaging, checksum/path/
  symlink refusal, retained old code and interruption rollback. Both run inside `verify:code`.
- `pnpm -C hearth test:e2e:built tests/e2e/guided-setup.spec.ts tests/e2e/admin.spec.ts
tests/e2e/screen-admin-isolation.spec.ts tests/e2e/phone-codes.spec.ts tests/e2e/modules.spec.ts
--reporter=line --output=/private/tmp/hearth-setup-final-browser` — **102/102**, 3.2 minutes.
  Phone/tablet/desktop, both themes, accessibility, provider failure isolation, six-letter approval,
  optional outbound controls, downloads, off-module I/O, D-pad/Back and all admin-route screen denial.
  Log `/private/tmp/hearth-setup-final-browser.log`.
- `pnpm -C hearth test:e2e:built tests/e2e/guided-setup.spec.ts --browser=webkit
--grep '390|820|HA install download|disabled modules' --reporter=line
--output=/private/tmp/hearth-setup-webkit` — **10/10**, 17.5 seconds. Safari engine in both phone/tablet orientations, not an iPhone.
- Extended `guided-setup.spec.ts` Chromium run — **16/16**, 29.5 seconds, all seven required
  viewports (390×844, 844×390, 820×1180, 1180×820, 1366×768, 1920×1080, 3840×2160), light/dark.
  Log `/private/tmp/hearth-setup-guided-final.log`; screenshots `/private/tmp/hearth-setup-guided-final/`.
- `python3.12 -B -m unittest discover -s hearth/integrations/home_assistant/tests -v` —
  **69/69**. The first attempt with this Mac's Python 3.9 lacked the component tests' documented
  modern-Python APIs; the supported Python 3.12 rerun passed without changing HA code.
- `pnpm -C hearth verify:ci` — **5/5** policy tests and complete non-overlapping inventory of
  **1,320 browser cases**. Inventory is not an execution of all those cases.
- `pnpm -C hearth audit:dependencies` — **no known vulnerabilities**. `git diff --check` passed.
  Both built ZIPs were compared with their exact source installers and explicit code-only lists.

The fresh-backend smoke creates an empty private SQLite installation with no HA/calendar/ESV
credentials, generates its local private PNG, claims one fixture adult, confirms first-use proof
consumption and successfully reads authenticated admin/Today with HA unconfigured. It removes all
fixture storage afterward. This is local HTTP backend/QR evidence, not trusted-HTTPS or device proof.
A new CI Docker boot step uses this run's preloaded labelled amd64 images and generated Compose,
checks real non-root mounted QR generation and core reads without HA, then removes its isolated
project. That container step remains **not run locally**; the Mac's Docker daemon is arm64 and this
first installer explicitly supports x86-64. Publication is gated on that job, not assumed from mocks.

Inspection caught a temporary-storage flow-list parse issue and a new-row navigation-order change;
both were corrected and covered by the passing parser/browser checks. Initial owner claims now
open Get started; replacement retains recovery guidance, with regression tests for both.
Rendered demo screenshots are under `/private/tmp/hearth-setup-final-browser/`, including the
390px Welcome/Connections views and 1920px dark Connections view. They contain fictional demo data.

**Not run:** hosted verification/publication, candidate image installation, fresh trusted-HTTPS
server commissioning, actual iPhone QR scan/Home Screen use, live HA install/restart/pairing,
power-loss recovery and consumer hardware acceptance. No Android app code changed; native checks
remain in the hosted release gate. Existing commissioned Synology/HA/data/networking remain untouched.
This is a tested private self-hosted setup candidate, not a factory plug-and-play appliance.
See SHARING_SETUP_CONTRACT.md.

## D-126 private deployment and backup commissioning — 2026-10-29

The owner explicitly approved publication, private activation, the HA read connection and a
restricted NAS backup account/destination. Application release
`a8c3a58af7264ab7e71a58506ef03d9e88157bd6` is installed privately after
[Verify Hearth run 40874622303](https://github.com/davidjpramsay/hearth-v2/actions/runs/40874622303)
passed every job, including all **1,304 browser cases** and immutable image publication.
The full web/server, dependency, migration, deployment-fixture and Android TV gates passed.

- `hearth/deploy/synology/activate-private-release.sh a8c3a58af7264ab7e71a58506ef03d9e88157bd6`
  — **PASS**, restricted installed helper, checked rollback snapshot, ready/private exact images.
  Log `/tmp/hearth-indoor-activation.log`.
- `python3 /private/tmp/hearth-indoor-postflight.py` — **PASS**, exact health/readiness/private
  runtime and hosted index plus **36 production assets**, including Indoor Weather/settings,
  manifest/icons and existing photo/calendar capabilities. No unauthenticated household disclosure.
- NAS-only preservation checker, `/private/tmp/hearth-indoor-preserve-on-nas.py`, before/after
  — **PASS**, checked v35 backup; both routine profiles/ticks/receipts and stable phone/screen/
  member/module/HA/photo/chore/reminder records preserved. Commissioned runtime/helper files and
  complete bridge configuration match. The only new access rule on existing shares is an explicit
  **DENY** for the new backup-only account; the original two allowed Hearth-data principals remain
  unchanged. The checker accepts only that additional denial, not a new grant or missing allowlist.

**Live sensor proof PASS:** the private source is mode 0600 and owned by the application service.
After the separately approved network exception, the running container returned HTTP 401 at HA's
unauthenticated API boundary and HTTP 200 for the selected authenticated measurement. Shape checks
passed; the real adapter returned **current**, **one room**, **38 temperature and 38 humidity samples**.
The deployed authenticated shared-screen page rendered both real charts without stale/unavailable
notices. Day, week, month and year requests all rendered two history charts; Day was restored.
There were **zero administration links**. No token, raw entity ID or sensor values enter this evidence.
This is real deployed browser/container proof; physical iPhone/TV viewing remains separate.

**HA-only network exception PASS:** the owner explicitly approved one persistent outbound allowance
from Hearth's existing bridge to the configured HA host, TCP/80 only. The operator helper verified
an exact protected-hook baseline, serialized with the existing release activation lock, retained
root-only originals and compared forwarding rules before/after. Every previous rule retained its
order; only the one host/port rule was added. Both the protected source and existing boot/update
hook contain it. Reachability was tested with rollback on failure; the normal restricted release
helper still passes its installation check. No global Docker/LAN bypass, router/DNS/bridge change,
new inbound port, device command or NAS/HA restart. An initial attempt used an optional rule-comment
match unavailable on DSM; it stopped and restored the original hook byte-for-byte. The approved
retry uses ordinary TCP/IP matches. Logs: `/private/tmp/hearth-indoor-ha-access.log` and the earlier
`/private/tmp/hearth-indoor-readcheck.log`. Installation supports reboot/update persistence; an
actual NAS reboot and later release activation were not performed as tests.

**Backup proof PASS:** HA's selected NAS network storage is active. Daily backups use the system
optimal time and retain **14** copies. Settings/history and all apps are included. Both local and
NAS locations are selected; encryption is enabled for the NAS location with global retention.
The first setup backup was local-only because the new NAS location was not yet selected in the
Core backup settings. After explicit selection, another automatic backup was invoked and HA
reported success in **two locations**. A nonempty NAS tar was independently inspected: normalized
`backup.json` is present, `protected=true`, the Home Assistant archive is present and
`homeassistant.exclude_database=false`. No private archive contents or encryption key were extracted.
The recovery-kit Download control was invoked, but a saved user file has not been verified.
The owner subsequently declined the additional recovery-key copy. Its staging was blocked after
that withdrawal; no recovery-key escrow was executed. HA retains its current key. Existing
NAS backups and their configured schedule remain intact; no backup was deleted or disabled.

Operational setup corrections were confined to one-off helpers outside source/runtime: HA's
REST Supervisor proxy does not expose mount management, so its supported administrator WebSocket
command was used; DSM 7's modify interface omits the legacy password argument; the unsupported
explicit SMB version override was removed in favour of normal current-protocol negotiation.
No older SMB protocol, new application package, HA restart, alarm/TV/media action or unrelated
account privilege was enabled. The temporary pure-Python client was official-PyPI/SHA-256 verified.

**Not run/open:** physical TV/iPhone inspection, actual NAS reboot/later-update persistence, next
scheduled backup execution and isolated restore onto spare/test media. Recovery-key custody
outside HA was declined by the owner, rather than verified complete. Sensor history
began on installation day; no historical year was fabricated. This commissioning checkpoint
supersedes the local-only publication/backup flags in the implementation evidence below.

## D-126 indoor climate — local implementation and real Recorder proof, 2026-10-29

**Live HA recording PASS:** the newly connected temperature and humidity measurements each show
recorded five-minute history; Recorder Statistics lists both with **No issue**. A bounded read-only
recorder.get_statistics query returned a completed hourly mean/min/max record for each. This is
real HA recording evidence, not a Hearth/server deployment claim. The source was connected today;
no year of pre-installation data is implied. No device command, purge or recording-setting change.

**Initial backup inspection (superseded by commissioning above):** no automatic backups and no
connected NAS network-storage destination were
configured at inspection. A backup-setup draft was reviewed but not saved. The attempted emergency
kit download is unverified; no key is retained in source/evidence. Do not claim NAS protection yet.
Live source commissioning, exact private deployment, actual Hearth TV/phone viewing, scheduled
backup operation and isolated HA restore remain open. No source credential, backup account or
NAS share was created, and no automatic backup configuration was saved during this checkpoint.

**Local implementation PASS:** Weather now has Outdoors/Indoors, adult-only named sensor selection,
separate temperature/humidity charts and trailing day/week/month/year views. Read-only provider
and private source-file boundaries are specified in [INDOOR_CLIMATE_CONTRACT.md](INDOOR_CLIMATE_CONTRACT.md).
No migration, inbound HA grant, HA custom component, recorder retention, networking, alarm or
TV command changed. Existing Outdoor Weather fit was restored after a compact-TV header overflow
was caught; its assertion was not relaxed.

Commands/results from `/private/tmp/hearth-morning-routine`, branch `codex/indoor-climate-ha`:

- `pnpm -C hearth verify:code` — **PASS**: format/lint/types, **714 unit** (108 shared, 48 core,
  115 server, 443 web), **290 API/integration**, **30 migration**, deployment validation/fixtures
  and production server/web builds. Log `/tmp/hearth-indoor-verify-code.log`. Initial sandbox-only
  localhost denial was rerun outside the sandbox; the complete gate passed. A subsequent CSS-only
  compact-header correction passed `pnpm -C hearth build` and the complete targeted browser run.
- `pnpm -C hearth verify:ci` — **PASS**, five policy tests and complete, non-overlapping inventory
  of **1,304** browser cases (326 per shard). This is an inventory check, not a full browser run.
- `pnpm -C hearth test:e2e:built tests/e2e/indoor-weather.spec.ts tests/e2e/weather.spec.ts
tests/e2e/screen-admin-isolation.spec.ts --reporter=line --output=/tmp/hearth-indoor-final-browser`
  — **PASS 60/60 (2.6 minutes)**. Includes 18 new indoor checks, seven phone/tablet/TV viewports
  in light/dark, serious/critical accessibility checks, D-pad escape, Back/reopen, exact settings
  retry after lost response, explicit unavailable readings, existing Outdoor Weather and screen
  isolation. Log `/tmp/hearth-indoor-final-browser.log`.
- `pnpm -C hearth test:e2e:built tests/e2e/indoor-weather.spec.ts --browser=webkit
--grep '390x844|820x1180|settings|missing history' --reporter=line
--output=/tmp/hearth-indoor-webkit` — **PASS 7/7 (16.8 seconds)**. iOS-engine phone/tablet
  layouts, source setup, unavailable history and lost-response exact retry; not physical Safari.
- `pnpm -C hearth test:e2e:built tests/e2e/screen-admin-isolation.spec.ts
--grep 'all admin routes|unconfigured weather' --reporter=line
--output=/tmp/hearth-indoor-added-isolation` — **PASS 2/2 (17.5 seconds)** after explicitly
  adding the Indoor sensors URL and configured Indoors view to shared-screen denial coverage.
- Final `pnpm -C hearth format:check`, `pnpm -C hearth lint` and `git diff --check` — **PASS**.

Rendered inspection: `/tmp/hearth-indoor-final-browser/indoor-weather-Indoors-fit-56a56-h-range-and-Back-navigation/indoors-light-390.png`
(phone), `indoor-weather-Indoors-fit-ac4ed-h-range-and-Back-navigation/indoors-dark-1920.png`
(TV, same output root), plus Outdoor Weather compact dark TV and phone rain images. These contain
**fictional demo data**; no real sensor history, source IDs, token, reminder or household contents
were placed in evidence. Mobile stacks and scrolls; TV remains one viewport. Full-page phone
screenshots retain the fixed navigation at the original viewport position.

**Not run:** hosted release gate, push/publication, private activation, real Hearth source reads,
physical iPhone/TV viewing, completed/scheduled NAS backup and spare-media HA restore. No Android
source changed; Gradle checks were not run for this local web/server addition.

## D-124/D-125 verified private correction release — 2026-10-29

Application release `c9af22401940616e86f1a155058df2ab522de9e5` is pushed and installed on the
existing private Synology. It restores **25 MiB per photo**, removes the ordinary settings limit
line and replaces routine calendar-refresh banners with a small heading indicator on Today,
Week, Month and Agenda. Real provider/auth/configuration/read/offline problems retain messages.
This completes the immediate correction to the owner's approved push/deploy request and the
calendar feedback request added during that work. There is no migration or new credential/grant.

[Hosted run 40817395958](https://github.com/davidjpramsay/hearth-v2/actions/runs/40817395958)
passed **all eight jobs**, including verified-image publication: **699 unit**, **284 API/integration**,
**30 migration**, **10 deployment fixtures**, dependency audit with no known vulnerabilities,
format/lint/types, production builds, Android TV tests/lint/build, container checks and **1,286
browser cases**. Browser shards passed **322/322/321/321** (9.6/10.0/8.2/5.9 minutes). Failed cap-only
runs remained blocked; no reduced gate, silent error swallowing or retry-policy change was used.

The additional local command `pnpm -C hearth test:e2e:built tests/e2e/today-polish.spec.ts
tests/e2e/photo-admin-management.spec.ts tests/e2e/screen-admin-isolation.spec.ts --reporter=line
--output=/tmp/hearth-calendar-quiet-today-photos` passed **412/412 (4.9 minutes)**, including all
384 Today composition combinations, the previously failing portrait fixture, photo queue/management
and screen/admin isolation. Its subsequent CI inventory/lint/format chain passed too. This closes
the pending local-matrix status in D-125 below. Separate 48 Chromium + 25 WebKit + four existing-state
checks and the photo boundary/queue tests remain detailed in the implementation entries.

Release commands/results:

- `gh run view 40817395958 --repo davidjpramsay/hearth-v2 --json status,conclusion,headSha,url`
  — **PASS**, completed/success for the exact application SHA. GitHub connector jobs/logs confirmed
  every job and each browser count. The hosted artifact is `/tmp/hearth-release-c9af224-artifact`.
- `ssh hearth-synology '/usr/bin/python3 - before' < /private/tmp/hearth-photo-cap25-preserve-on-nas.py`
  — **PASS**, checked v35 online backup/private baseline retained under
  `/volume1/hearth-v2-private/deployment-checkpoints/photo-cap25-20261029/`. Ancestors and new files
  were checked against the existing DSM ACL allowlist (NAS administrators + Hearth service);
  no ACL was changed. No private content, counts, hashes or credential were exported.
- `hearth/deploy/synology/activate-private-release.sh c9af22401940616e86f1a155058df2ab522de9e5`
  — **PASS**, the installed protected helper independently verified the release, pulled immutable
  images, took its normal stopped-database rollback snapshot and returned ready/private. Existing
  bridge/DNS and loopback publication were retained. Log: `/tmp/hearth-release-c9af224-activation.log`.
- Same NAS-only checker with `after` — **PASS**, database integrity and version **35**, both saved
  routine profiles, all dated ticks and original receipts unchanged; phone/screen/member/module/HA/
  NBA records, photo identity/curation metadata, chore templates and Hearth reminders matched.
  Runtime Compose/environment/helper hashes and commissioned bridge configuration matched. Ordinary
  photo view/index timestamps are excluded; normal provider projection refreshes were not frozen.
- `python3 /private/tmp/hearth-release-c9af224-postflight.py` — **PASS**, exact external health,
  readiness and private runtime without household disclosure; index + **31 production assets**
  byte-match the hosted build. Calendar/Today/photo assets, standalone manifest and all three fern
  icons match. The hosted shared capability is 25 MiB and all three DTOs include the typed refresh
  field. The deployed UI is therefore the same build exercised locally and in hosted Chromium.

No stored photo rewrite/deletion, calendar write, provider reconnection, pairing reset, TV APK/HA
component reinstall or HA alarm/music/power/navigation action occurred. The existing weekday alarm
and complete commissioned networking remain unchanged. The later evidence-only commit changes no
application bytes and needs no further activation. This checkpoint supersedes pending publication/
private-activation flags in the D-124/D-125 implementation entries below.

**Not run:** physical iPhone/iPad/TV viewing of this exact release, actual near-limit/bulk-upload
throughput through DSM's outer proxy, physical Home Screen installation and real alarm execution.
No such device/throughput proof is inferred from browser checks or exact deployed-asset validation.

## D-125 quiet calendar refresh — 2026-10-29

The owner requested a small spinner instead of the recurring calendar-updating message. Today,
Week, Month and Agenda now show a noninteractive ring beside the heading for a pending read or
routine server refresh. It has an accessible name but no repeated live-region announcement;
reduced motion uses a static ring. The normal background projection retains stale freshness and
saved events, reports `calendarRefreshing: true` and null statusMessage, then clears the flag after
completion. Provider/auth/configuration failures retain their issue messages. Cached HTTP read
failure and offline state remain visible and take precedence over a cached busy flag. Legacy DTOs
default the new boolean false. No migration, provider/cadence, credential, permission or HA change.

Browser plugin not available; repository Playwright uses the production build and isolated demo
data. Flow: Today/Calendar routine refresh → quiet heading indicator with no banner → current
data/no indicator → unavailable issue message → one offline message. Mobile/TV light/dark layouts
remain stable; heading height is unchanged and no horizontal overflow is introduced. This is local
browser evidence, not a physical-device or live provider claim.

- `pnpm -C hearth verify:code` — **PASS**: format/lint/types, **699 unit**, **284 API/integration**,
  **30 migration**, **10 deployment fixtures**, Compose validation and production builds. Provider
  tests hold a background read, prove the same events remain visible, then verify completion/error
  transitions, honest diagnostics, typed Today/Week/Month flags, legacy decoding, authentication
  messages and disabled-calendar no-I/O behavior. Log: `/tmp/hearth-calendar-quiet-code.log`.
- `pnpm -C hearth test:e2e:built tests/e2e/calendar-refresh-feedback.spec.ts
tests/e2e/calendar-header.spec.ts tests/e2e/calendar.spec.ts --reporter=line
--output=/tmp/hearth-calendar-quiet-browser` — **48/48 PASS (1.2 minutes)**. Includes 390/1920px
  quiet/current/unavailable/offline transitions in both themes, reduced motion, unchanged heading
  height, no framework overlay, console health and serious/critical a11y; existing 1366px headings,
  date navigation, event dialogs/Back and mobile/TV calendar layout pass.
- Same config under installed desktop WebKit: `pnpm -C hearth exec playwright test --config
/private/tmp/hearth-morning-times-webkit.config.mts tests/e2e/calendar-refresh-feedback.spec.ts
tests/e2e/calendar-header.spec.ts --reporter=line --output=/tmp/hearth-calendar-quiet-webkit`
  — **25/25 PASS (53.4 seconds)**. This is mobile/touch emulation, not physical Safari proof.
- `pnpm -C hearth test:e2e:built tests/e2e/visual.spec.ts --grep
'Month empty and stale|stale state|unavailable state|offline state' --reporter=line
--output=/tmp/hearth-calendar-quiet-existing-states` — **4/4 PASS (11.9 seconds)**. Existing visual
  checks now expect the quiet accessible indicator for a normal refresh, with real issue/offline
  expectations retained. Phone and TV Agenda screenshots were visually inspected under the first
  browser output directory; no private calendar data was used.
- `pnpm -C hearth verify:ci`, `pnpm -C hearth lint`, `pnpm -C hearth format:check` and
  `git diff --check` — **PASS**. Complete hosted inventory is **1,286** (322/322/321/321); inventory
  is not hosted execution. Logs: `/tmp/hearth-calendar-quiet-ci-final.log`,
  `/tmp/hearth-calendar-quiet-lint-prepush.log`, `/tmp/hearth-calendar-quiet-format-prepush.log`.

This candidate also contains D-124's 25 MiB cap and no ordinary size-limit settings line. The
preceding cap-only hosted run `40814928042` stopped before publication on an asynchronous Today
portrait-fixture `route.fulfill` already-handled error. The Today test helpers now read a base DTO
before registering static layout handlers and clone it for each response; the mutable reminder
count still changes per request. Existing route draining, assertions, timeouts and retry policy
remain. No application behavior was changed for that harness issue. Its previously failing 1366px
portrait case passed in the additional 412-case Today/photo/isolation local run, which was still
running when this source candidate was recorded. Final local-matrix, hosted and private-release
results are recorded separately; neither failed cap-only run was activated.

## D-124 restore 25 MiB per-photo uploads — 2026-10-29

Hosted follow-up: `fb56705` passed the code/API, Android and container checks, but run
`40813397255` stopped before publication on a photo geometry fixture's late `route.fetch()` response
being disposed during browser teardown. Its layout assertions completed in the retained trace;
this is not evidence of a rendered layout failure. The static portrait-rich fixture now reads
its gallery once before navigation, matching the existing `photoPlaybackFixture` pattern. Photos
tests also drain pending routes with `unrouteAll({ behavior: 'wait' })` before context disposal,
as supported by [Playwright's API](https://playwright.dev/docs/api/class-page#page-unroute-all).
No assertion, timeout, retry policy or application behavior was relaxed. The corrected case passed
**10/10 Chromium (25.3 seconds)** and **1/1 WebKit (6.7 seconds)**; logs
`/tmp/hearth-photo-cap25-race-repeat.log` and `/tmp/hearth-photo-cap25-race-webkit.log`.
The failed run was not activated; a fresh complete hosted gate is required.
The complete `photos.spec.ts` suite then passed **26/26 (58.4 seconds)** with the route-draining
hook; `pnpm lint`, `pnpm format:check` and `git diff --check` passed. Logs:
`/tmp/hearth-photo-cap25-cleanup-suite.log`, `/tmp/hearth-photo-cap25-cleanup-lint.log` and
`/tmp/hearth-photo-cap25-cleanup-format.log`. This follow-up changes the test harness and evidence
only; the correction's application code is identical to `fb56705`.

The owner clarified the intended limit immediately after the D-122 release: 25 MB per photo is
sufficient, and ordinary settings should not display the size-limit line. Restore the shared
capability, provider, Fastify raw-body and exact Nginx upload-route limit to **25 MiB**. Settings
retains supported formats and the multi-file picker. Size guidance remains in actionable rejection
errors. The two-transfer queue, progress/preparation, pause/exact retry, compact management and
300-second timeout remain. A batch may total more than 25 MiB when its individual files comply.
Previously accepted larger photos remain readable; there is no migration or stored-photo rewrite.

Browser plugin not available; the repository's built-app Playwright flow uses fictional data.
Flow: Manage photos → no ordinary limit text → choose multiple photos → pause/resume → safe exact
retry, with retained paging/filtering/curation and deletion guards. Page identity, meaningful UI,
no framework overlay, relevant console health, keyboard navigation and a11y checks passed.

- `pnpm -C hearth verify:code` — **PASS**: format/lint/types, **697 unit**, **279 API/integration**,
  **30 migration**, **10 deployment fixtures**, Compose validation and production builds. Real-image
  tests accept a roughly 17 MB TIFF, retain the 480px thumbnail and reject a roughly 27 MB TIFF plus
  a limit+1 byte payload. The HTTP adapter returns **413** above 25 MiB and leaves photo records
  unchanged; advertised capability is 25 MiB. The queue test proves valid files proceed even when
  combined bytes exceed the per-file cap. Log: `/tmp/hearth-photo-cap25-code.log`. An initial format
  check caught the shortened repository error fitting on one line; formatting was applied and the
  entire gate passed on rerun.
- `pnpm -C hearth verify:ci` — **PASS**, five policies and complete **1,270-case** shard inventory;
  `/tmp/hearth-photo-cap25-ci.log`. Inventory is separate from hosted execution.
- `pnpm -C hearth test:e2e:built tests/e2e/photo-admin-management.spec.ts tests/e2e/photos.spec.ts
--reporter=line --output=/tmp/hearth-photo-cap25-chromium` — **35/35 PASS (1.2 minutes)**.
  Phone 320/390px, tablet, desktop and TV views; light/dark, no ordinary limit copy, compact cards,
  batch/replay, curation/deletion, rotation/ambient, D-pad/Back and accessibility pass. Log:
  `/tmp/hearth-photo-cap25-chromium.log`.
- `pnpm -C hearth exec playwright test --config /private/tmp/hearth-morning-times-webkit.config.mts
tests/e2e/photo-admin-management.spec.ts tests/e2e/photos.spec.ts --grep 'photo management stays|batch queue|phone administration'
--reporter=line --output=/tmp/hearth-photo-cap25-webkit` — **12/12 PASS (31.0 seconds)**;
  `/tmp/hearth-photo-cap25-webkit.log`. This is desktop WebKit with mobile/touch emulation,
  not physical iOS/Safari proof. The first-viewport phone screenshot
  `/tmp/hearth-photo-cap25-chromium/photo-admin-management-pho-755c7-tays-compact-on-phone-light/photo-upload-settings.png`
  was visually inspected; settings contains formats and upload controls without the limit line.
- `git diff --check` — **PASS**. No database migration, permission/credential, import-source,
  TV APK, HA integration/automation or networking change is included.

Publication/private activation evidence follows separately. Actual iPhone/Wi-Fi throughput and
near-limit requests through DSM's outer proxy remain unverified; do not change that proxy merely
to establish this local correction. Historical D-122's 100 MiB statements below describe the former
release and are superseded by D-124's 25 MiB policy.

## D-121/D-122/D-123 verified private release — 2026-10-29

Owner approval: “please push and deploy everything.” Application release
`3fbd69ec76ab047a3e328a78f7503a2c9f1490bc` includes the Home Screen web app, compact photo management/
bounded uploads and scheduled School days/Weekends. It was pushed to `main` and the task branch.
[Hosted run 40810332971](https://github.com/davidjpramsay/hearth-v2/actions/runs/40810332971)
passed **all eight jobs**, including dependency audit, complete code/API gate, Android TV,
container builds, four browser shards and verified-image publication. The first run's stale
System health migration-number assertion was corrected and locally checked before this full run;
no failing or cancelled run was deployed.

Hosted evidence: **697 unit**, **279 API/integration**, **30 migration**, **10 deployment fixtures**,
five CI policies and production builds with 35 migrations passed. Browser shards passed
**318 + 318 + 317 + 317 = 1,270** cases (9.4, 8.5, 9.9 and 5.9 minutes respectively). No reduced
browser gate, retries-to-hide-failure or publication bypass was used. The exact hosted `browser-build`
artifact was downloaded to `/tmp/hearth-release-3fbd69e-artifact` for deployment comparison.

Before activation, an online SQLite backup passed `quick_check` and remained on the NAS under
`/volume1/hearth-v2-private/deployment-checkpoints/day-profiles-3fbd69e-20261029/`. Comparison
fingerprints also stayed there. The initial strict Unix-mode check stopped on DSM's inherited ACLs
before copying private data. Read-only ACL inspection confirmed that the private parent, checkpoint
parent and new directory allow only the existing NAS administrators and Hearth service; the checker
then validated that same allowlist on the newly created files. No ACL, owner, private content or
credential was changed/exported to work around this. The installed root-owned activation helper
also performed its normal stopped-database rollback snapshot and independently verified the release.

Commands/results from `/private/tmp/hearth-morning-routine`:

- `git push --atomic origin HEAD:refs/heads/main HEAD:refs/heads/codex/morning-day-profiles`
  — **PASS**, exact application commit above published.
- `gh run view 40810332971 --repo davidjpramsay/hearth-v2 --json status,conclusion,headSha,url`
  — **PASS**, completed/success with the exact release SHA. The GitHub connector's job/log tools
  independently confirmed every job and each browser count; its commit-run listing supports only
  PR events, so the CLI identified this push-triggered run.
- `ssh hearth-synology '/usr/bin/python3 - before' < /private/tmp/hearth-day-profiles-preserve-on-nas.py`
  — **PASS**, checked v34 backup/private baseline retained, no content/count/hash exported.
- `hearth/deploy/synology/activate-private-release.sh 3fbd69ec76ab047a3e328a78f7503a2c9f1490bc`
  — **PASS**, installed verified immutable server/web images, readiness `ready`, private mode,
  existing bridge/DNS compatibility and loopback publication retained. Log:
  `/tmp/hearth-release-3fbd69e-activation.log`.
- Same NAS-only checker with `after` — **PASS**, migration **35** and database integrity;
  exact School configuration/revision and dated progress (projected without the added profile ID)
  unchanged; original receipt bytes/hashes unchanged; independent Saturday–Sunday Weekend lists
  empty, saved participants/times retained and timer off. Phones/screens/members/module flags,
  HA approval, NBA preferences, photo identity/curation metadata, chore templates and Hearth reminder
  rows matched. Normal slideshow/index timestamps were deliberately excluded from photo comparison.
  Commissioned runtime Compose/environment/helper hashes and bridge configuration matched.
- `python3 /private/tmp/hearth-release-3fbd69e-postflight.py` — **PASS**, external health/readiness
  and exact release identity; private runtime discloses no household and does not require setup;
  index plus **27** production assets byte-match the hosted artifact. Standalone manifest MIME/bytes,
  unrestricted orientation and 180/192/512px fern icons also match.

No TV APK or HA integration reinstall was needed; neither changed in this release. The live HA
alarm remains weekday-only and no music/power/navigation command was sent as a deployment test.
No re-pairing, credentials, household seed, photo rewrite or network reset was performed.
This checkpoint supersedes the publication/private-deployment “not run” flags in the local D-121/
D-122/D-123 entries below; those entries retain their original local evidence. The later evidence-only
Git commit does not change the installed application bytes or require another activation.

**Still unverified:** physical iPhone/iPad Home Screen installation and rendered use, real bulk-upload
throughput/near-limit requests through DSM's outer proxy, physical phone/TV viewing of the profiles,
and actual weekday/weekend alarm execution. DSM's outer body/time limits were not changed or claimed
verified. No weekend alarm branch was added. Existing browser checks are not physical-device proof.

## D-123 School days and Weekends — 2026-10-29

Release follow-up: commit `5d59ea7` was pushed with D-121/D-122 included. Hosted run
`40809638472` passed code/API, Android TV and image builds, but stopped before publication when
the existing System health browser case still expected the pre-upgrade text “Migration 34”. The
test now expects 35; no runtime behavior was changed to satisfy it. No NAS activation occurred
from that failed run. A new complete hosted run is required before activation.
The focused command `pnpm test:e2e:built tests/e2e/admin.spec.ts --grep 'adult sees concise system health'
--reporter=line --output=/tmp/hearth-migration35-health-final` passed **1/1 (6.6 seconds)**;
`pnpm format:check` and `git diff --check` also passed. Logs are
`/tmp/hearth-migration35-health-final.log` and `/tmp/hearth-migration35-format.log`.

The requested two-profile refinement is implemented locally. School days retains the existing
participants, ordered steps and countdown times (07:00–08:00 by default). Weekends starts with the
same explicit participants, empty steps and countdown off. Each profile has independent people,
steps and timer settings. Seven day selectors assign either routine or No routine without overlap.
The family view chooses automatically by household-local date; no school-term/holiday inference.
Untimed routines stay fully checkable. Fresh dates start unchecked without erasing history;
same-date reassignment cannot transfer ticks between profiles, even when step IDs match.

Migration 0035 preserves School configuration, revisions and dated progress, adds profile identity
to progress, and leaves old receipt bytes/hashes untouched. The typed API accepts legacy School-only
saves without erasing Weekends or assignments; old completion retries retain their exact payload
hash. New checks validate date/profile/revision/version. No module, credential, HA grant, automation,
background sync or existing live household configuration change is included.

Browser plugin unavailable; repository Playwright ran against production builds with isolated
fictional fixtures. Flow: edit both profiles/day assignments → save/reload → automatically display
the assigned profile → check/reopen → change date/profile → fresh independent checks. Draft conflict,
unknown-outcome retry and module/auth isolation remain. All commands below run from the `hearth/`
directory of `/private/tmp/hearth-morning-routine` (equivalent to `pnpm -C hearth` from its root).

- `pnpm verify:code` — **PASS**: format/lint/types, **697 unit** (108 shared, 48 core, 103 server,
  438 web), **279 API/integration**, **30 migration**, **10 deployment fixtures**, Compose validation
  and production web/server builds with **35 SQL migrations**. Log:
  `/tmp/hearth-morning-profiles-code-final.log`. The database-upgrade fixtures start at v34 with
  existing School settings/ticks and an exact completion receipt; v35 retains these and safely
  replays the old receipt. Reapplying the migration runner is idempotent. Overlapping days, wrong
  profile/date, changed command reuse and stale revisions/versions are rejected. The migration was
  registered after the first migration test correctly caught the omitted registry entry.
- `pnpm verify:ci` — **PASS**: five policies and complete non-overlapping **1,270-case** browser
  inventory (318/318/317/317); `/tmp/hearth-morning-profiles-ci.log`. Inventory is not hosted execution.
- `pnpm test:e2e:built tests/e2e/morning-profiles.spec.ts tests/e2e/morning-routine.spec.ts
tests/e2e/today-settings.spec.ts tests/e2e/screen-admin-isolation.spec.ts --reporter=line
--output=/tmp/hearth-morning-profiles-final` — **57/57 PASS (1.8 minutes)**. Includes both editors,
  day assignment, retained hidden drafts, accepted-save/lost-response exact retry, immediate
  foreground midnight refresh, seven-step timed/untimed TV layouts and verse, Today regression,
  shared-screen/admin isolation, keyboard/Back focus, serious/critical a11y and relevant console
  health. Log: `/tmp/hearth-morning-profiles-final.log`.
- `pnpm exec playwright test --config /private/tmp/hearth-morning-times-webkit.config.mts
tests/e2e/morning-profiles.spec.ts tests/e2e/morning-routine.spec.ts --grep 'adult edits both|lost response|untimed weekend|foreground screen|invalid draft|countdown time|adult settings save|unassigned days|morning verse'
--reporter=line --output=/tmp/hearth-morning-profiles-webkit` — **19/19 PASS (33.4 seconds)**.
  Log: `/tmp/hearth-morning-profiles-webkit.log`. This is installed desktop WebKit with iPhone
  mobile/touch emulation, not iOS Simulator or physical Safari proof.

Visual cases cover 1280×640, 1366×768 and 1920×1080 TVs, 390×844 phones and 820×1180 tablets in
light/dark, plus a 320px overflow check. Compact TV, phone editor and dark tablet screenshots were
inspected outside source under the corresponding Playwright output directories. No private lists,
names or identifiers were captured. Review caught a shared-admin CSS rule overriding the selected
profile colour; the editor selector was scoped and both engines rechecked for a distinct selected
button in light/dark. `pnpm build` and `pnpm --filter @hearth/web build` passed after that CSS
refinement; logs `/tmp/hearth-morning-profiles-polish-build.log` and
`/tmp/hearth-morning-profiles-polish-build-final.log`. Final format/lint checks also pass.

The focused `adult edits both` case then passed again in Chromium (**1/1, 8.9 seconds**) and WebKit
(**1/1, 8.2 seconds**) with the same command/config above, outputs
`/tmp/hearth-morning-profiles-editor-final` and `/tmp/hearth-morning-profiles-editor-webkit-final`.
Those final phone editor screenshots and both-theme a11y results include the visible selected style.
Early theme-flip audits sampled intermediate inherited colours in WebKit; the final test uses
reduced motion and fresh pages in each theme, rather than treating an in-transition sample as a
settled contrast result. No speculative production theme workaround remains. A separate read-only
review of the D-123 migration, compatibility, progress isolation and retry seams reported no findings.

**Not run:** publication, hosted full browser execution, private v34→v35 migration/preservation,
actual phone/iPad/TV viewing, and real weekday/weekend alarm execution. The existing HA alarm is
unchanged and still selects Morning Routine only on weekdays; no weekend branch was added.
Existing data preservation is proved with migration fixtures, not a performed live upgrade.
Any future activation needs the normal checked pre-migration backup and logical School-data
comparison; v34 rollback must restore its matching database snapshot. Networking, pairings and
private runtime configuration were not changed. The preceding Home Screen and photo changes are
also still local release candidates, not implied live by these results.

## D-122 photo management and uploads — 2026-10-29

The owner requested a more manageable photo-admin layout and larger/faster uploads. Ordinary
management now uses compact whole-image cards (two phone columns, responsive wider grids), with
48 photos per page, All/Favourites/Hidden filters and Select page/Clear selection. Selection
survives paging/filtering. Mixed caption lengths keep actions aligned. Optional import details
are collapsed unless unavailable. Existing exact delete confirmation, imported-original protection,
partial failures, focus restoration and playback/ambient behavior remain.

The advertised raw-image limit rises from 25 to 100 MiB per photo, not per batch. A page-memory
queue overlaps at most two transfers, reports bytes sent separately from server preparation,
pauses new dispatch, resumes and retries only failed files with their original request IDs/Files.
Accepted File references are released; unfinished work registers with draft/reload guards. No
browser transcoding, persistent queue, background worker, new credentials or permissions. The
provider now serializes waiting work correctly, preserves master encoding/hash and generates new
480px upload thumbnails from its smaller TV derivative. Existing stored photos are not rewritten.

Authorization is checked before parsing the larger image body and checked again before mutation.
The shared screen's retained-adult-session retirement remains in both paths. The existing
120-million input-pixel bound remains. Nginx scopes its 100 MiB/300-second allowance to the upload
route; other API limits, networking and all private runtime configuration remain unchanged.

Browser plugin not available; the repository's production-build Playwright workflow uses isolated
fictional data. The flow is Manage photos → filter/page/select → safe curation/deletion, plus
multi-file upload → pause/resume → lost response → exact retry with a replay receipt.

- `pnpm verify:code` — **PASS**: format/lint/types, **693 unit**, **275 API/integration**,
  **29 migration**, **10 deployment fixtures**, Compose validation and production web/server
  builds; `/tmp/hearth-photos-code-final.log`. API tests prove child/service/screen uploads are
  rejected before a probe body parser runs, while an adult reaches parsing. Real image tests
  accept a roughly 27 MB uncompressed TIFF above the former limit, reject an over-100-MiB input,
  bound new thumbnails to 480px and safely deduplicate several waiting uploads. Queue/transport
  cases cover bounded dispatch, progress/preparation, pause/retry/leave, typed failures and exact
  File/request-ID reuse. A large DOM-state test was reduced to a sufficient 51-photo fixture and
  given a scoped 10-second ceiling after parallel-suite contention exceeded its default 5 seconds.
- `pnpm build` and `pnpm format:check` — final build/style checks after the caption-alignment and
  130-photo fixture refinement; `/tmp/hearth-photos-build-final.log` and
  `/tmp/hearth-photos-format-final.log`.
- `pnpm verify:ci` — **PASS**: five policies and a complete non-overlapping **1,256-case** browser
  inventory; `/tmp/hearth-photos-ci-policy.log`. Inventory is not hosted execution.
- Final Chromium command: `pnpm test:e2e:built tests/e2e/photo-admin-management.spec.ts
tests/e2e/photos.spec.ts tests/e2e/screen-admin-isolation.spec.ts --reporter=line
--output=/tmp/hearth-photos-browser-final` — **46/46 PASS (1.7 minutes)**. This includes
  130-photo libraries, 320/390px phones, iPad/desktop, light/dark, no horizontal overflow,
  whole-image previews, aligned controls for mixed caption lengths, 44px minimum targets,
  filters/page selection, keyboard/remote navigation, exact retry receipts, curation/deletion,
  playback/ambient and shared-screen/admin isolation. Page identity, meaningful content,
  no framework overlay, relevant console health and serious/critical a11y checks passed.
  Log: `/tmp/hearth-photos-browser-final.log`.
- Final WebKit command: `pnpm exec playwright test --config
/private/tmp/hearth-morning-times-webkit.config.mts tests/e2e/photo-admin-management.spec.ts
tests/e2e/photos.spec.ts --grep 'photo management stays|batch queue|phone administration'
--reporter=line --output=/tmp/hearth-photos-webkit-final` — **12/12 PASS (30.5 seconds)**,
  including phone/tablet/desktop light/dark layouts, two-transfer pause/resume, exact replay,
  optional-import failure guidance and managed deletion. Log: `/tmp/hearth-photos-webkit-final.log`.
  This is desktop WebKit with mobile/touch emulation, not physical iOS/Safari acceptance.

The final **58** browser cases include the early-body guard and mixed-caption fixture.
An initial mobile-header overflow was fixed. The old keyboard test was updated for the new import
disclosure/filters and uses arrow navigation across engines. WebKit's intercepted File request
does not expose POST text to this test, so interruption targets the third unique request ID;
both engines still verify the original accepted receipt and `replayed: true` retry. This is browser
and deterministic adapter evidence, not real iPhone/NAS throughput proof.

Screenshots remain outside source under the final Playwright output directories. Phone gallery,
paused queue, iPad dark and desktop layouts were visually inspected with fictional content. No
private photos, filenames, credentials or NAS configuration were copied into evidence.

**Not run:** full hosted browser execution, publication/deployment, real iPhone/iPad bulk upload,
NAS/Wi-Fi throughput and a live end-to-end upload near the new limit. Local Nginx-container runtime
validation remains unavailable without Docker's daemon. Read-only SSH could not read DSM's front
reverse-proxy file; its body/time limits remain unverified. No password or broader NAS privilege
was requested. The existing front proxy/network was not changed. A deployed large-file check must
verify that outer limit separately, without silently changing DSM or private runtime settings.

## D-121 iPhone/iPad Home Screen web app — 2026-10-29

Read-only inspection of the live public document confirmed an Apple touch icon but no manifest
or standalone declaration. The requested refinement now explicitly provides a Hearth standalone
entry, root identity/scope, safe `/today` fresh-launch URL, Apple title/default-status-bar metadata
and same-origin 192/512px fern icons. The canonical 180px Apple icon remains pixel-identical.
Orientation is unrestricted. No service worker, offline household cache, background sync, native
wrapper, auth/session change or device migration is added. New installed contexts still need the
existing connection approval if not already connected.

Browser plugin not available; the repository's production-build Playwright workflow was used.
The flow under test is manifest/icon fetch → Today launch → settings → People → Back → reload,
plus an unconnected iPad remaining at Connect to Hearth. Local HTTP uses isolated fictional demo
data; these browser checks are not proof of real Home Screen installation or cookie transfer.

- `pnpm verify:code` — **PASS**: format/lint/types, **681 unit**, **274 API/integration**,
  **29 migration**, **10 deployment fixtures**, Compose configuration and production web/server
  builds; `/tmp/hearth-home-screen-code.log`. The first sandboxed attempt could not open the local
  listeners used by five existing onboarding tests (`listen EPERM`); the complete gate passed on
  rerun with loopback access. No application fix was needed for that environment limitation.
- `pnpm verify:ci` — **PASS**: five policies and complete non-overlapping **1,247-case** browser
  inventory; `/tmp/hearth-home-screen-ci-policy.log`. This is inventory, not hosted execution.
- `pnpm test:e2e:built tests/e2e/home-screen-web-app.spec.ts --reporter=line
--output=/tmp/hearth-home-screen-chromium` — **7/7 PASS (14.0 seconds)**: built manifest MIME/JSON,
  icon availability/type/dimensions/opacity, launch, no worker registration and unconnected-device
  gate. Navigation/Back/reload and no horizontal overflow pass at **390×844**, **820×1180**,
  **1180×820**, **1366×1024** and **375×1024**. An initial test incorrectly selected the optional,
  disabled Morning Routine destination; the final test uses always-available People settings.
- `pnpm exec playwright test --config /private/tmp/hearth-morning-times-webkit.config.mts
tests/e2e/home-screen-web-app.spec.ts --reporter=line --output=/tmp/hearth-home-screen-webkit`
  — **7/7 PASS (16.7 seconds)** in installed desktop WebKit with mobile/touch emulation. The temporary
  configuration extends the built demo-server workflow. iPad portrait/landscape/large/split-view
  screenshots were visually inspected; page identity, meaningful content, no framework overlay,
  no page/console errors and interaction checks passed. This is not iOS Simulator/device proof.
- `pnpm test:e2e:built tests/e2e/phone-navigation.spec.ts
tests/e2e/screen-admin-isolation.spec.ts tests/e2e/production-bootstrap.spec.ts
tests/e2e/native-tv-viewport.spec.ts --reporter=line --output=/tmp/hearth-home-screen-regressions`
  — **29/29 PASS (1.7 minutes)**: light/dark dock, scrolling/keyboard recovery, strict CSP/startup,
  native TV canvas/keyboard activation and screen/admin isolation including mixed cookies, encoded URLs,
  history/reload and another open administration document. No TV or auth source was changed.
- `git diff --check` — **PASS**.

Screenshots: `/tmp/hearth-home-screen-webkit/home-screen-web-app-web-ap-6b221-vigation-fit-iPad-landscape/home-screen-settings.png`
and `.../home-screen-web-app-web-ap-6f8f2-igation-fit-iPad-split-view/home-screen-settings.png`.
Nginx's explicit same-origin manifest MIME/404/no-store policy is configured; a local Nginx
container run was **not run** because Docker's daemon/socket is unavailable. Compose validation
passed. XcodeBuildMCP found no booted simulator; none was booted or changed for this web-only slice.

Publication, full hosted checks, private deployment and actual iPhone/iPad Add to Home Screen,
status-bar safe areas, installed-icon caching and intended connection continuity remain **NOT RUN**.
Live networking, runtime configuration, pairings, household data and the installed TV APK remain
unchanged. Do not delete a working owner web app or clear its data to test this refinement.

## D-120 Morning Routine — 2026-10-28

### Up to seven visible steps — 2026-10-29

The owner requested room for up to seven steps per person, while approving publication/deployment
of the pending Bible-verse addition. This refinement keeps all three people and the verse visible
on TV. Six/seven-step compact layouts reclaim padding, row gaps and duplicate sun/progress
decoration, with an inline individual count. Step text/targets/checks keep their existing sizes.
Long labels and lists over seven retain paging; phone flow, data, settings and HA are unchanged.

- `pnpm verify:code` — PASS: format/lint/types, **681 unit**, **274 API/integration**, **29 migration**,
  **10** deployment fixtures and production builds; `/tmp/hearth-morning-seven-code-final.log`.
- `pnpm verify:ci` — PASS: five policies and complete non-overlapping **1,240-case** inventory;
  `/tmp/hearth-morning-seven-ci.log`. Inventory is separate from hosted execution.
- `pnpm test:e2e:built tests/e2e/morning-routine.spec.ts tests/e2e/today-settings.spec.ts
--output=/tmp/hearth-morning-seven-final` — **32/32 PASS (59.9 seconds)**. Nine light/dark viewport
  pairs now contain seven demo steps per person. All **21** TV rows and the verse are wholly in the
  viewport/card with no TV scrolling or step pager. Geometry asserts at least the existing **56px
  target / 20px text** baseline, including wrapped text inside the row. D-pad reaches the seventh
  step, verse and rail; popup Back restores focus. Mixed seven-/nine-step lists and all-nine-step
  short-TV cases retain accessible paging, while 80-character/12-step/four-person stress cases,
  module-off, saved/unavailable verse, settings/retry, weekend/stale and Today regressions pass.
  Page identity/content, console health, no framework overlay, a11y and reduced motion pass.
  The final compact layout places the title in the countdown rail and preserves the original outer
  insets. The TV canvas fills the viewport while the verse keeps its content height; no text,
  checkbox or target size is reduced. Final short-TV screenshots were inspected:
  `/tmp/hearth-morning-seven-final/morning-routine-Morning-Ro-aed2f--1280x640-light-visual-a11y/morning-routine.png`.

- `pnpm exec playwright test --config=/private/tmp/hearth-morning-times-webkit.config.mts
morning-routine.spec.ts --grep 'fits 390x844|countdown time fields|follows module availability'
--output=/tmp/hearth-morning-seven-webkit-final` — **4/4 PASS (12.3 seconds)** with iPhone emulation;
  both themes, verse popup/Back focus, module-off and time-field save/reopen pass.
- `git diff --check` — PASS.

The combined Bible-verse/seven-step release **`aa6c0782d2965997e671c99029b8fa5e01fbb384` is now
privately deployed**, including verse commit `2182e22`. [Verify Hearth run 40796288437](https://github.com/davidjpramsay/hearth-v2/actions/runs/40796288437)
passed all eight jobs and **1,240 browser tests** (310 per shard) before publishing the exact images.
Hosted summaries: `/tmp/hearth-morning-seven-hosted.log`.

`hearth/deploy/synology/activate-private-release.sh aa6c0782d2965997e671c99029b8fa5e01fbb384`
passed using the existing protected helper. `python3 /private/tmp/hearth-release-aa6c078-postflight.py`
passed exact-release health/readiness/private-runtime checks and matched the index plus **27
production assets** to that run's artifact. Logs: `/tmp/hearth-release-aa6c078-activation.log` and
`/tmp/hearth-release-aa6c078-postflight.log`. The NAS-local before/after comparison also passed for
saved routine settings/progress, approved HA connection, module settings, protected people/phone/
screen records, existing data counts, runtime configuration, complete bridge interface and database
integrity. No private comparison values were exported. No HA component/automation, APK, credential
or household record was edited by this release. Actual physical TV/iPhone rendering has not been
rechecked; refresh/reopen Hearth to load the assets.

### Bottom daily verse — 2026-10-29

The owner requested the daily Bible verse at the bottom of Morning Routine. A compact card beside
Today reuses the existing full-text/attribution dialog. Its household/module-gated daily read shares
the nonblocking Today verse cache and provider/key, independently of Today section visibility.
No new database state or HA change. Normal five-step lists must remain visible; cached/unavailable
states must not block checks. Source/local tests, publication and physical rendering remain separate.
Browser plugin not available; the repository's production-build Playwright workflow supplies
TV/mobile/keyboard evidence, with an additional iPhone WebKit check. The flow under test is
Morning Routine → compact daily verse → full text → Back to its opener, plus module-off and
unavailable/saved states without blocking checklist use.

- `pnpm verify:code` — PASS: format/lint/types, **681 unit**, **274 API/integration**, **29 migration**,
  **10** deployment safety fixtures and production server/web builds. Final log:
  `/tmp/hearth-morning-verse-code-final.log`. The API regressions prove independent Today visibility,
  shared pending-provider/cache behaviour, private/foreign/automation access denial, module gating
  before provider work and private no-store responses. No database migration is added.
- `pnpm verify:ci` — PASS: five policies and complete non-overlapping **1,239-case** inventory;
  `/tmp/hearth-morning-verse-ci.log`. This is inventory, not a full hosted browser run.
- `pnpm test:e2e:built tests/e2e/morning-routine.spec.ts tests/e2e/today-settings.spec.ts
--grep 'Morning Routine fits|morning verse|countdown time|adult settings save|weekend and failed|long steps|daily verse is optional'
--output=/tmp/hearth-morning-verse-final` — **27/27 PASS (52.7 seconds)**. Nine light/dark viewport
  pairs cover 4K/1080p/compact/short TV, tablet and phone; all 15 standard demo steps and the bottom
  verse stay visible on TV. D-pad reaches the verse, opens full text, closes with Back/Escape,
  restores focus and exits to the rail. Includes missing/retry, long saved text, focus containment,
  module-off/no read/dialog removal, settings save/reopen, exact check retry and prior Today popup.
  Page identity/content, no framework overlay, console health, serious/critical a11y and reduced
  motion pass. Initial test-only route matches were narrowed to the API before the final run.
- `pnpm exec playwright test --config=/private/tmp/hearth-morning-times-webkit.config.mts
morning-routine.spec.ts --grep 'fits 390x844|countdown time fields|follows module availability'
--output=/tmp/hearth-morning-verse-webkit-final` — **4/4 PASS (13.3 seconds)**, with iPhone emulation.
  A first Safari-engine check found tap activation did not focus the opener; the morning card now
  explicitly focuses its button before opening the existing dialog. The shared SummaryBand callback
  exposes its typed activation event; other consumers retain their behaviour. Both browsers now
  restore card focus after closing, and module-off removes the popup.
- `git diff --check` — PASS. Inspected fictional-demo screenshots include
  `/tmp/hearth-morning-verse-final/morning-routine-Morning-Ro-aed2f--1280x640-light-visual-a11y/morning-routine.png`.

These local results preceded the approved combined seven-step release recorded above, which now
includes this verse addition. Actual physical TV/iPhone rendering remains unverified. The release
preserved household data, credentials, HA configuration and networking.

### Remove combined routine count — 2026-10-29

At the owner's request, the routine footer no longer shows the household-wide “steps done
together” count. Each person's progress, countdown, Today/people navigation and the useful
weekend/empty/all-ready messages remain. Existing light/dark viewport cases assert the combined
count is absent and all three demo people's individual progress remains visible. This is included
with the explicitly approved phone time-field release below; no settings/data/HA change is needed.

- `pnpm verify:code` — PASS: format/lint/types, **681 unit**, **272 API/integration**, **29 migration**,
  **10** deployment safety checks and production builds; `/tmp/hearth-morning-footer-code.log`.
  The final scoped footer alignment also passed formatting/lint and a fresh web production build.
- `pnpm verify:ci` — PASS: five policy checks and complete non-overlapping **1,237-case** inventory;
  `/tmp/hearth-morning-footer-ci.log`.
- `pnpm test:e2e:built tests/e2e/morning-routine.spec.ts
--output=/tmp/hearth-morning-footer-chromium-final` — **24/24 PASS (41.7 seconds)**. Standard
  lists remain fully visible; individual progress, no aggregate count, both themes, real save/retry,
  stale/weekend states and D-pad exit pass. The first rendered run caught the text removal moving
  Today to the left and changing directional navigation; keeping the footer action aligned to the
  right resolves this without changing shared navigation. Final TV screenshots were inspected.

- `pnpm exec playwright test --config=/private/tmp/hearth-morning-times-webkit.config.mts
morning-routine.spec.ts --grep 'fits 390x844|countdown time fields'
--output=/tmp/hearth-morning-footer-webkit` — **3/3 PASS (8.5 seconds)** with iPhone emulation.
  Light/dark routine rendering has no aggregate count; time fields remain separated and persisted.
- `git diff --check` — PASS.

Both refinements are now privately deployed as **`af8168e6801a38d950f1d4ade4909fa14218e9fc`**,
including phone-field commit `e846b2b`. The owner explicitly approved push/deployment after the
initial automatic approval review held publication. [Verify Hearth run 40789769562](https://github.com/davidjpramsay/hearth-v2/actions/runs/40789769562)
passed all eight jobs, including **1,237 browser tests** (310 + 309 + 309 + 309), before publishing
the exact images. Hosted summaries: `/tmp/hearth-morning-footer-hosted.log`.

`hearth/deploy/synology/activate-private-release.sh af8168e6801a38d950f1d4ade4909fa14218e9fc`
passed using the existing protected helper. `python3 /private/tmp/hearth-release-af8168e-postflight.py`
passed exact-release health/readiness/private runtime and matched the index plus **27 production
assets** to that run's artifact. Logs: `/tmp/hearth-release-af8168e-activation.log` and
`/tmp/hearth-release-af8168e-postflight.log`. The NAS-local before/after comparison passed for
routine settings/progress, approved HA connection, module settings, protected people/phone/screen
records, existing data counts, runtime configuration, complete bridge interface and database
integrity. No private comparison values were exported. No HA component/automation, APK,
credential or household record was edited by this release.

Final fictional-demo screenshot:
`/tmp/hearth-morning-footer-chromium-final/morning-routine-Morning-Ro-aed2f--1280x640-light-visual-a11y/morning-routine.png`.
Actual physical TV and iPhone Safari have not been rechecked; refresh/reopen to load the assets.

### Phone countdown-field fit — 2026-10-29

The owner's iPhone screenshot shows Start time and Ready by overlapping and escaping the
Morning countdown panel. At phone widths up to 480 logical pixels, these native time fields now
stack with a full-width row each. Grid labels can shrink and all routine text/time inputs have a
maximum width of their cell. The native time picker, readable type, touch-target sizes and saved
settings behaviour are retained. Wider companion layouts keep the two-column row.

The flow under test is adult Morning Routine settings → both labelled time fields inside their
panel → edit both times → save → reopen with the same values. Browser plugin not available; the
repository's production-build Playwright workflow supplies Chromium and an additional local
iPhone-emulated WebKit check. Neither baseline browser reproduced the exact physical iOS native
control rendering; the regression explicitly checks separated rows on narrow phones, field/panel
bounds, readable control sizes and persisted values across six widths in both themes. This is
browser evidence, not a fresh physical iPhone Safari check.

- `pnpm verify:code` — PASS: format/lint/types, **681 unit**, **272 API/integration**, **29 migration**,
  **10** deployment safety fixtures and production web/server builds. Log:
  `/tmp/hearth-morning-times-code.log`.
- `pnpm verify:ci` — PASS: five policy checks and complete non-overlapping **1,237-case** browser
  inventory (inventory is not execution). Log: `/tmp/hearth-morning-times-ci.log`.
- `pnpm test:e2e:built tests/e2e/morning-routine.spec.ts
--output=/tmp/hearth-morning-times-chromium` — **24/24 PASS (40.7 seconds)**, including the
  existing TV/D-pad/full-list and retry/error checks. The added regression covers 320, 360, 390,
  430, 820 and 844-pixel layouts in both themes, then actual demo save/reload readback.
- `pnpm exec playwright test --config=/private/tmp/hearth-morning-times-webkit.config.mts
morning-routine.spec.ts --grep 'countdown time fields'
--output=/tmp/hearth-morning-times-webkit` — **1/1 PASS (5.7 seconds)** with iPhone 13 emulation.
  Local-only config extends the unchanged production-build demo servers. Page identity/content,
  no overlay, console errors/warnings, field geometry, real save/readback and serious/critical
  accessibility checks pass. WebKit 26.5 was downloaded to the local test cache, with no application
  dependency or lockfile change. Screenshots in both browser output directories were inspected.
- `git diff --check` — PASS. Physical iPhone Safari remains unverified; publication, hosted checks
  and private activation are separate from this local evidence. No HA/TV APK or contract change.

### Five-step TV fit refinement — 2026-10-29

The owner asked to fit the full current list on one screen and permitted removing subheadings.
Compact/short TVs previously paged ordinary five-step routines into three/two rows while repeating
the next step above the list. All supported TV sizes now show the five numbered rows together;
the repeated next-step heading, eyebrow and permanent instruction/status row are removed.
Save feedback remains in a live region, errors/refresh actions remain visible, and oversized
labels/lists retain their accessible paging fallback. Phone flow and all persisted routine,
countdown, HA and completion boundaries are unchanged.

The flow under test is Morning Routine → all five steps visible in each TV card → remote movement
to the final step and back to the rail, plus phone/error/weekend/long-list regressions. Browser
plugin not available; the repository's production-build Playwright workflow supplies the checks.

- `pnpm verify:code` — PASS: format/lint/types, **681 unit**, **272 API/integration**, **29 migration**
  tests, **10** deployment safety fixtures and production web/server builds. An initial restricted
  invocation stopped on the existing first-phone tests' loopback `listen EPERM`; the same source
  passed with the local-listener permission those tests require. Log:
  `/tmp/hearth-morning-full-list-code.log`.
- `pnpm verify:ci` — PASS: five policy checks and the unchanged complete **1,236-case** inventory.
  Log: `/tmp/hearth-morning-full-list-ci.log`.
- `pnpm test:e2e:built tests/e2e/morning-routine.spec.ts
--output=/tmp/hearth-morning-full-list-browser` — **23/23 PASS (37.2 seconds)** on the final build.
  Nine viewport sizes in light/dark cover full/compact/short TV, tablet and portrait/landscape phone.
  Each TV fixture has all 15 rows (five per child) fully inside the viewport/card, no step pager,
  no TV scrolling, and D-pad movement through the last row and back to the rail. Page identity,
  meaningful render, no overlay, clean error/warning console, accessibility and reduced motion pass.
  Save/reopen/exact retry, stale/weekend guards and oversized-label/participant paging still pass.
  Screenshots include `/tmp/hearth-morning-full-list-browser/morning-routine-Morning-Ro-aed2f--1280x640-light-visual-a11y/morning-routine.png`.
- `git diff --check` — PASS. Publication/deployment and the actual TV remain separate evidence;
  the baseline preservation comparison stays on the NAS and includes the saved routines/HA grant.

The layout application release **`f781354dcd1ad47a0ddd027d6329197483bfc944` is now deployed**.
[Verify Hearth run 40724037826](https://github.com/davidjpramsay/hearth-v2/actions/runs/40724037826)
passed all eight jobs, including all **1,236 browser tests**, before verified images were published.
`hearth/deploy/synology/activate-private-release.sh f781354dcd1ad47a0ddd027d6329197483bfc944`
completed using the existing protected helper. `python3 /private/tmp/hearth-release-f781354-postflight.py`
passed exact-release health/readiness/private-runtime checks and matched the index plus **27**
production assets to that run's hosted artifact. Logs: `/tmp/hearth-release-f781354/`.
The NAS-local before/after comparison also passed for the saved routine settings/progress, approved
HA connection, module flags, protected member/phone/screen records, existing data counts, runtime
configuration, bridge interface and database integrity. No private comparison values were exported.
No HA component/automation, APK, credentials or household records were edited by this layout release.
Actual physical TV rendering has not been rechecked; reopen the TV app to load the changed assets.

### Verified private release checkpoint

The initial application release `ce0320c1220a7cbd844967a832f02ccbb31e3959` was pushed to main and deployed
privately. [Verify Hearth run 40709250508](https://github.com/davidjpramsay/hearth-v2/actions/runs/40709250508)
passed all eight jobs, including **1,236 browser cases (309 per shard)**, the complete code/API
gate, dependency audit, Android checks, container builds and verified image publication.
This release also includes D-119's previously undeployed compact Today modules.

`hearth/deploy/synology/activate-private-release.sh ce0320c1220a7cbd844967a832f02ccbb31e3959`
completed successfully using the existing protected helper. External health/readiness/runtime are
HTTP 200, private, database ready and on the exact release, with no fresh-setup or unauthenticated
household disclosure. `python3 /private/tmp/hearth-release-ce0320c-postflight.py` passed: the index
and **27 production assets**, including Morning Routine and NBA, match the exact hosted artifact.
Logs are retained under `/tmp/hearth-release-ce0320c/`.

The preservation comparison runs entirely on the NAS and returns pass/fail only. It passed for
protected phone/screen/member records, existing module/NBA settings, household data counts,
runtime configuration, the complete existing bridge interface and database integrity; migration 34
is active. No private counts, hashes, contents or credentials are exported for that comparison.

The matching HA component **1.4.0** is installed, byte-verified and visibly loaded after a
Core-only restart. Previous component code remains backed up locally on HA. HA's configuration
check passed, and its restart dialog confirmed no running automations/scripts. The temporary File
editor is no longer running (its service log confirms successful SIGTERM shutdown); its original
startup/watchdog/sidebar/auto-update settings remain off. No TV, music or chore command was sent.

The subsequent owner-phone approval completed successfully in HA's existing reauthentication
repair. The integration now exposes the server's module switches and both already-paired screen
selectors. Morning Routine was enabled through that approved HA grant; the other module settings
were preserved. The actual living-room selector was identified from its registered entity details,
not inferred from a physical-TV or media-player entity. That TV was unavailable during setup.

At the owner's explicit request, the personal checklist was applied privately using the unchanged
`MorningRoutineService` and its existing shared schema. An SSH-authenticated, temporary bundled
maintenance command ran on the NAS's Node 22.22.3 with built-in SQLite, the existing household
reader with demo seeding disabled, a unique owner/child match and an expected-revision-zero guard.
`--check` passed without writes; `--apply` passed typed validation, transactional protected-record
comparison, settings readback, database integrity and atomic audit/receipt checks. Its audit source
is automation under the requesting owner. All current children are selected, the window is
07:00–08:00, the requested person's five steps are present and the other child lists remain empty.
No private titles/identifiers entered Git or command output. The temporary NAS code was removed.
The existing paired browser then rendered the live routine; both step pages matched the requested
five items and all checks remained undone. This is production browser evidence, not physical TV
or iPhone Safari rendering evidence.

The existing 06:30 alarm now has one final **Open Morning Routine on weekdays** choice. Monday–Friday
waits at most 60 seconds for the registered Hearth selector to be available and offer the approved
tab, stops that branch on timeout, then selects `morning_routine`. Weekend behaviour is unchanged.
Parsed fresh saved readback proved the original 22 actions, trigger, conditions, description, mode
and trace settings unchanged; only the intended 23rd action was added. An interrupted unsaved
editor draft was discarded before the final verified save. HA's built-in configuration check
passed. No wake, music, navigation-to-TV or chore action was run as a test.

Retained local evidence: `/private/tmp/hearth-ha-reauth-success.png`,
`/private/tmp/hearth-morning-module-enabled.png`, `/private/tmp/hearth-morning-live-configured.png`,
`/private/tmp/hearth-weekday-morning-alarm-saved.png` and
`/private/tmp/hearth-morning-ha-config-check.png`. Personal screenshots stay outside Git.
Still not run: physical TV/iPhone Safari routine rendering and the real weekday wake/music/alarm
path. The next weekday alarm is the remaining end-to-end operational proof.

### Authorised release follow-up

Hosted run 40706545301 for `8ef2fc7` stopped before browser/publication at the dependency advisory
gate (18 findings); Android and container builds passed, but this was not a releasable run. Updated
only within existing majors: Fastify 5.12.6, Zod 4.6.6, Vite 8.2.4, Vitest 4.1.12 and fast-uri
3.1.9/4.2.3 through the existing scoped overrides. Fresh `pnpm audit` reports **no known
vulnerabilities**. No audit bypass or changed application permission is used. Full verification is
repeated before publication.

Hosted run 40707967616 then passed code/API, Android and container builds but correctly stopped
on the System Health browser assertion still expecting migration 33. Updated that assertion to
the new migration 34; its focused production-build browser regression passed **1/1 (5.5 seconds)**
in `/tmp/hearth-morning-system-health-proof`. Publication still requires a fresh complete run.

The owner authorised pushing/deploying all pending updates, including the prior NBA release blocker
and the matching HA update. Test-only keyboard diagnostics identified a focused NBA **Check stats**
button becoming natively disabled during background query invalidation; focus fell to the body,
then Tab reached the phone dock. The narrow fix keeps this busy button focusable with aria-disabled/
aria-busy and guards activation. Shared focus/navigation code is unchanged. A deterministic held
response verifies retained focus, duplicate-activation rejection and forward/reverse containment.
The phone scenario now exercises 24 forward and 24 reverse tabs. Ten repetitions of both cases
**passed 20/20 (43.8 seconds)** in `/tmp/hearth-focus-proof`. This was local evidence; the later
successful hosted gate and private activation are recorded separately above.

Implemented on `codex/morning-routine` from GitHub main `1de910e`, in an isolated worktree. The
historical dirty iOS checkout and the prior compact-module branch are preserved. The independent
module defaults off; first settings derive all current children, 07:00–08:00 and empty lists.
Adult settings edit participants, steps and ordering. Suggested ordering permits any step, with
check/undo, durable day-specific progress and versioned exact retries. The countdown bar drains
downward according to household time. TV cards/step lists page; phone content flows naturally.
Long step labels reserve extra vertical space rather than shrinking text or clipping actions.
Empty/weekend states retain an explicit, remote-focusable Today action. Private household steps
are prepared outside Git and have not been applied to live data.

### Verified locally

- `pnpm verify:code` — PASS: formatting, lint, workspace types, **105 shared + 47 core +
  101 server + 428 web unit tests**, **272 API/integration tests**, **29 migration tests**,
  deployment scaffold checks and production web/server builds. Final log:
  `/tmp/hearth-morning-verify-final.log`.
- `python3.12 -B -m unittest discover -s hearth/integrations/home_assistant/tests` — **69 PASS**.
  This includes explicit Morning Routine approval/module filtering; log `/tmp/hearth-morning-ha.log`.
- `pnpm verify:ci` — PASS: five policy checks and complete non-overlapping inventory of **1,235
  browser cases**. Inventory is not execution. Log `/tmp/hearth-morning-ci.log`.
- `pnpm --filter @hearth/server exec vitest run src/morning-routine.integration.test.ts` — **6 PASS**,
  including close/reopen of a real temporary SQLite file, local date rollover, weekend rejection,
  exact/conflicting retries, stale versions/settings, independent people and module retention.
- The HA integration test proves the new tab stays pending until the exact paired-screen ID/tab
  acknowledgement, then becomes applied; module-off rejects it. Legacy grants cannot navigate or
  switch this module; automation credentials cannot write routine checks/settings.
- `git diff --check` — PASS. The feature itself needs no new dependency or Android APK.
  The authorised release follow-up patches existing dependencies; live networking is preserved.

### Rendered gate and remaining release work

The flow is adult settings → save/reorder → family Morning Routine → any-order check/retry →
reopen/undo. Browser plugin not available; the repository Playwright workflow supplies local
Chromium proof. Target viewports are 3840×2160, 1920×1080, 1366×768, 1280×720, 1280×640,
820×1180, 1180×820, 390×844 and 844×390, in light/dark with reduced motion. Its final combined
command is `pnpm test:e2e:built tests/e2e/morning-routine.spec.ts tests/e2e/modules.spec.ts
tests/e2e/screen-admin-isolation.spec.ts tests/e2e/remote.spec.ts
--output=/tmp/hearth-morning-browser-final`; result is recorded below.

The combined rendered gate **passed 56/56 (1.7 minutes)**, including **23 Morning Routine cases**,
the 80-character/12-step/four-person stress fixtures, actual D-pad exit to the rail, reduced-motion
bar styling, accessible light/dark renders, save/reorder/reopen, loss of a committed response with
exact retry, weekend focus and stale-read protection. Page identity/content, console health,
no framework overlay, horizontal/TV vertical bounds and serious/critical accessibility checks
passed. Demo screenshots were visually inspected, including TV light/dark, constrained TV and
phone. Final small follow-ups **passed 2/2 (8.6 seconds)** with `--grep 'save/reorder|weekend'`,
output `/tmp/hearth-morning-followup`, after rebuilding. These verify Morning Routine alone
retains its Family planning entry and the weekend bar reports zero. Final format/lint, production
build and CI policy/inventory checks also pass. These do not change the actual-device boundary.

Initial read-only live HA inspection showed **Hearth component 1.2.0, one household device/four entities**,
with no approved screen selector yet. At that checkpoint, the existing **06:30 Good Morning** automation
had its wake/music/30%-volume/foreground safety actions and was neither edited, saved nor run. Installing
1.4.0 and explicit adult reconnection must precede choosing the real screen selector for a
weekday-only Morning Routine action. No guessed entity or automatic access expansion is allowed.

The initial local handoff did not include publication/deployment or an NBA repair. The authorised
follow-up above resolves the NBA release blocker and records the successful hosted/private release
and HA installation. The later commissioning follow-up above records adult approval, household
configuration and the saved alarm edit. Physical-device/alarm checks remain explicit; local/browser
evidence does not substitute for them.

## D-119 shared compact Today text modules — 2026-10-20

Built from `10695d5`, whose hosted run **39352656881** passed all eight jobs, including **1,156
browser tests**, before private deployment. Exact live asset hashes matched that run's build;
readiness, database and before/after networking, pairing, configuration and aggregate data checks
passed. That is release evidence for D-118, not physical viewing or acceptance of D-119.

Dinner, Lists, Notices, Reminders and Daily verse now share intrinsic-height grid rows and
bottom alignment, with a 60-logical-pixel readable/actionable minimum. Quiet space above is
intentional. Existing responsive spans, the verse's full-width final row, photo fitting and
full-detail/Back behavior remain. A lone verse no longer allocates an extra
empty row. Phone scrolling remains natural; no fixed overlay, layout state/effect, new preference,
provider/API/schema, dependency, native shell or private-runtime configuration change is added.
Compact TV core/summary budgets explicitly account for a separate verse row and stacked status/
retry messages: concise 18px compact-TV excerpts, four core rows on full-height TVs and three on
compact TVs when the verse adds another summary row,
and one on very short TVs with four/five summaries including the verse. Other capacities remain;
truthful overflow links retain access to omitted items, and a failed row is not hidden dynamically.

### Local verification

- `pnpm verify:code` — **PASS**: formatting, lint, workspace types, **93 shared + 40 core +
  101 server + 427 web unit tests**, **265 API/integration tests**, **29 migration tests**, ten
  deployment scaffold fixture tests and production web/server builds. Two existing upstream
  JSX-parser diagnostics remain, without lint failure. No dependency or API contract changed.
- `pnpm verify:ci` — **PASS**: five policy tests; complete, non-overlapping **1,212-case** browser
  inventory, 303 per shard. This is inventory, not execution of the whole release suite.
- Browser plugin unavailable; used repository Playwright/Chromium, isolated built demo API on
  `127.0.0.1:4310` and web on `127.0.0.1:4320`, never private household content. Flow: Today →
  D-pad Down to a compact module → Enter for its real screen/full text → Back, with natural phone
  scrolling. Fixtures exercise populated, informational, wholly empty and disabled content.

```sh
pnpm test:e2e:built tests/e2e/today-polish.spec.ts tests/e2e/today-adaptive.spec.ts tests/e2e/today-photo-rotation.spec.ts tests/e2e/today-settings.spec.ts tests/e2e/visual.spec.ts tests/e2e/appearance.spec.ts tests/e2e/modules.spec.ts tests/e2e/remote.spec.ts --grep-invert 'Today composition' --output /tmp/hearth-compact-modules.iMnIWC/verified-results
```

**189/189 PASS (5.7 minutes)**, no retries, failures or skips in this final run. Includes the
256-state phone/tablet/short/compact/1080p/4K stress loop, settled focus, eight verse-only cases,
**32 non-verse single-module cases** across themes/TV sizes/photo shapes and empty/populated data,
and **27 stale/retry cases**, each covering all four photo shapes (**108 compositions**). The
shared geometry checks now assert every text card's natural height (or 60px target minimum) and
the last row's bottom alignment, while retaining readable size, sibling separation, image bounds
and no-overflow assertions. Remote reachability, dialog/Back focus, rotation/pause, reduced motion,
module hiding, themes, existing surrounding screens and serious/critical axe checks also pass.
TV and phone screenshots were visually inspected. All **384** named composition cases remain in
the full, unfiltered release gate; they are not counted in this targeted invocation.

Earlier focused runs caught an incorrect new fixture expectation for the pre-existing wholly empty
Today state, then real short/compact/full-TV crowding when status/retry space and different photo
orientations were combined. Those were corrected with the explicit height policy above, not with
weaker assertions, timeouts or release filters. Retry stays focusable and visible; no failed row is
removed dynamically. Raw logs, screenshots and traces are outside source in
`/tmp/hearth-compact-modules.iMnIWC/`.

### Release and physical boundary

The user approved push and private deployment after checks. Full hosted execution/image publication,
exact-version activation and before/after preservation/live-asset checks are subsequent release
evidence. No new APK, HA restart, calendar reconnection or re-pairing is required. Actual TV and
iPhone Safari viewing of this refinement remain **not run**; local demo proof is not device proof.

## D-118 compact bottom verse — local implementation, 2026-10-20

Baseline `b515e1e` was published after hosted run **39246485505** passed all eight jobs,
including **1,148 browser tests**, and activated on the existing private NAS with live asset hashes,
readiness, database and preservation checks passing. The user reports the TV looks better; that
does not establish physical acceptance of this subsequent refinement.

Daily verse now follows the other summaries in a content-height final grid row, anchored at the
bottom of the same summary area. It no longer stretches into otherwise unused vertical space.
Other modules, contained photos, Chores-first order and full-verse/Back behavior remain. Null verse
data retains an informational compact card; hiding the verse removes its track. Companion layout
scrolls naturally and adds no fixed overlay. The rule is D-118, not an exception silently hidden
in the tests. No API, migration, provider, layout observer/state, dependency or private-runtime
configuration change.
Very short TVs with all five summaries show one core row with truthful overflow. This reserves
room for stacked stale/error messages without clipping module text or hiding a failed retry target.

### Local verification

- `pnpm verify:code` — **PASS**: format, lint, workspace type checks, **93 shared + 40 core +
  101 server + 426 web unit tests**, **265 API/integration tests**, **29 migration tests**,
  deployment scaffold checks and production web/server builds. The same two upstream JSX-parser
  diagnostics remain, without lint failure. The final compact-height density stylesheet adjustment
  was rebuilt with `pnpm --filter @hearth/web build` before the final browser run below.
- `pnpm verify:ci` — **PASS**: five policy tests and a complete, non-overlapping **1,156-case**
  browser inventory, 289 per shard. Inventory is not execution of the full release suite.
- Browser plugin unavailable; used repository Playwright/Chromium against isolated built demo API
  `127.0.0.1:4310` and web `127.0.0.1:4320`. Target flow: Today → compact verse → full dialog →
  Back/focus restoration, plus photo/module reflow and natural phone scrolling.

```sh
pnpm test:e2e:built tests/e2e/today-polish.spec.ts tests/e2e/today-adaptive.spec.ts tests/e2e/today-photo-rotation.spec.ts tests/e2e/today-settings.spec.ts --output /tmp/hearth-compact-verse.gGC72u/verified-results
```

**435/435 PASS (6.6 minutes)**, no retries, skips or failures in the final run. Includes all 384
composition subsets, 256 decoded-pixel stress layouts, eight additional verse-only TV/theme cases
with available/unavailable/off states and all photo shapes, settled focus, remote reachability,
full verse/Back, rotation/pause/reduced motion, stale/error/retry, phone settings and axe checks.
Shared assertions now check natural verse height, bottom alignment and separation, in addition to
existing containment, readable-height and no-overflow requirements. TV and phone screenshots were
visually inspected; the normal photo composition, sparse verse-only footer and compact stacked-error
layout are contained. Synthetic stress images are fixtures, not real household photos.

Earlier stopped runs caught old grid specificity and remote-route assumptions, and insufficient
short/compact error-state space; these were corrected rather than waived. One stopped 4K stress run
recorded nine Chromium `net::ERR_NETWORK_CHANGED` resource errors. Its trace was retained; the
unchanged case passed on rerun, and the final complete run has no such error. No network setting,
assertion tolerance, timeout or release filter was changed to hide a failure. Final error-state
checks explicitly focus the visible Retry action. Raw logs, traces and screenshots are outside
source in `/tmp/hearth-compact-verse.gGC72u/`.

### Release and actual-device boundary

The user approved push and private deployment after checks. Publication, the full hosted gate,
immutable-image activation, exact live-asset verification and before/after preservation checks
remain subsequent release evidence, not implied by these local results. This change needs no new
APK, HA restart, calendar reconnection or re-pairing. Actual TV and iPhone Safari viewing of this
refinement remain **not run**; preserve that distinction after deployment.

## D-116 release focus correction — 2026-10-19

Publishing `110635b` triggered hosted run **39245179396**. Its code/API/migration, dependency,
Android and container gates passed, but the 1920×1080 light adaptive case failed after 80 browser
passes in shard 3. Other shards were cancelled and image publication was skipped; the private
server remained on `e58c48c`. The same failure reproduced on the third local repetition.

The generic focus transform scales/translates a filled summary card beyond its allocated track
once its transition settles. Today TV summary/photo cards now keep their geometry while retaining
the existing focus outline/halo. No geometry tolerance, assertion timeout, release filter or data
boundary is weakened. Six regression cases cover settled focus in both themes at compact TV,
1080p and 4K, with all photo shapes and sparse full-height cards. Release checks must pass again
before deployment; physical TV/iPhone viewing remains separate acceptance evidence.

Local correction checks: production rebuild, changed-file lint/format and `git diff --check` pass.
`pnpm test:e2e:built tests/e2e/today-adaptive.spec.ts --grep '1920x1080 light|filled cards'
--repeat-each=3` passes **21/21 (45.4 seconds)**, including three complete executions of the
previously intermittent case and three repetitions of each new focus case. `pnpm verify:ci` passes
five policy tests and accounts for **1,148** browser cases, 287 per shard; full execution still
requires the subsequent hosted run. Evidence is outside source in
`/tmp/hearth-today-games-release.pJnAyc/`.

## D-117 Word groups resume — local evidence, 2026-10-19

Built on local Today commit `f08aa1a`; no live deployment is implied. Returning to `/games`
now selects the last successfully loaded catalogue identity on this device, whether opened from
Archive, Earlier/later, Next puzzle or an explicit link. Guesses, solved groups, remaining mistakes,
shuffled order and completion badges are preserved. A finished result stays visible until explicit
navigation/replay, with Next/Replay as the remote entry action. Untouched choices save too; invalid
links or failed detail reads cannot overwrite the last playable board. Missing archive identities
fall back to the earliest uncompleted board, then the first. Older v2 records recover their most
recent detailed attempt without resetting guesses/completions. The new optional pointer ignores
malformed values independently of otherwise valid progress. No server/API/migration or sync change.

### Verification

- `pnpm --filter @hearth/web exec vitest run src/utils/gameProgress.test.ts` — **10/10 PASS**,
  including untouched choices, legacy v2, corrupt/oversized/blocked storage, runtime/household
  isolation and completion retention. No answer text or unrelated preference is added to the store.
- `pnpm verify:code` — **PASS**: formatting, lint, workspace type checks, **93 shared + 40 core +
  101 server + 423 web unit tests**, **265 API/integration tests**, **29 migration tests**, deployment
  scaffold checks and both production builds. Same two existing JSX-parser diagnostics; no lint
  failure. No dependency added.
- `pnpm verify:ci` — **PASS**: five policy checks and a complete, non-overlapping **1,142-case**
  browser inventory. This is not execution of the entire release suite.
- Browser plugin not available. Used repository Playwright/Chromium against isolated built demo
  API `127.0.0.1:4310` and web `127.0.0.1:4320`, with original demo boards only. Target flow:
  Games → choose puzzle #3 → solve/miss/shuffle → Today → Games → reload → fresh document;
  puzzle identity, guesses and order remain. Fresh tabs exercise durable localStorage, not the
  original page's React Query cache.

```sh
HEARTH_GAMES_RESUME_EVIDENCE_DIR=/tmp/hearth-games-resume-proof.fJU5RE pnpm test:e2e:built tests/e2e/games.spec.ts tests/e2e/games-remote.spec.ts tests/e2e/games-progression.spec.ts tests/e2e/games-resume.spec.ts
```

**28/28 PASS (53.3 seconds)**, no failures/skips. Covers phone portrait/landscape, tablet,
1366px/1080p/4K, light/dark, remote-only play/Back, archive search/paging, completed-game reopen,
explicit Next/replay, untouched choices, deep-link precedence, failed/missing reads, old saves,
offline/blocked storage, no horizontal/TV action clipping, console health and serious/critical axe
checks. Screenshots were inspected at TV and phone; resumed #3 shows one solved group and three
mistakes remaining. Logs/screenshots are outside source at `/tmp/hearth-games-resume-proof.fJU5RE/`.
`git diff --check` and explicit root-doc formatting checks pass.

### Remaining gates and boundaries

No push, merge, publication, deployment, private archive read/import, TV navigation/power command,
HA restart, calendar/authentication change or Synology/network mutation. Android source is unchanged;
its existing WebView enables DOM storage, but actual TV process termination/relaunch and iPhone
Safari/PWA checks remain **not run**. Android-specific checks and the full hosted release suite
were not rerun. Progress remains per browser/device and is lost if its app/site storage is cleared;
this is not household-wide or cross-device resume. Review/publish approval and a physical reopen
check are the next steps.

## D-116 adaptive Today layout — local evidence, 2026-10-19

Prepared on `codex/today-adaptive-layout` from verified release `e58c48c`, in the clean
`phone-access-release` worktree, not the historical dirty iOS checkout. Chores is left/before
Upcoming. Photos are bounded by their allocated track in both axes; enabled summary tiles fill
the remaining space. Portrait, landscape/square, photo-only, no-photo and zero/one/two core-module
layouts collapse unused tracks. The scoped stylesheet replaces the former overlapping TV rules;
very short TV canvases retain two rows and honest overflow. No API, migration, domain command,
preference, photo-rotation cadence, authentication or live-runtime change was made.

### Checks and rendered scope

- `pnpm verify:code` — PASS: formatting, lint, workspace types, **93 shared + 40 core + 101 server
  - 419 web unit tests**, **265 API/integration tests**, **29 migration tests**, deployment scaffold
    verification and production web/server builds. Two existing upstream JSX-parser diagnostics
    remain, with no lint failure. The final three-card CSS adjustment was then rebuilt and retested
    in all 60 affected matrix cases. Final changed-file formatting and lint checks also pass.
- `pnpm verify:ci` — PASS: five policy checks; **1,135** browser cases partitioned without
  duplication/omission. This is inventory, not execution of all 1,135 tests.
- Browser plugin unavailable: used repository Playwright, Chromium, isolated built demo API on
  `127.0.0.1:4310` and preview on `127.0.0.1:4320`, never the private household.
- **640 layout scenarios:** all 32 summary subsets × six typed photo shapes × two TV sizes
  (**384**), plus **256** decoded-pixel stress layouts across 320×740, 390×844, 844×390,
  1024×1366, 1200×620, 1366×768, 1920×1080 and 3840×2160, both themes and all four core-module
  combinations. Stress fixtures include no photo, 4:1 panorama, square and 1:3 portrait; sparse
  Verse/Reminders and full shelves. This is a bounded matrix, not every possible text/viewport.
- Geometry assertions check sibling intersections, photo-slot containment, readable minimum tile
  height, row-content containment, full remaining summary height, no horizontal overflow and
  no TV/main scrolling. Focus-scale overscan is allowed only within six logical pixels.
- Remote traversal reaches every Today control across photo compositions; dialogs restore opener
  focus, resize retains focus, and visible-time rotation/pause/reduced-motion behavior remains.
  Phone settings/notice edits, offline/stale states, failed chore/retry, module hiding, themes and
  serious/critical axe checks are exercised. Screenshots were inspected at phone, compact/full TV,
  portrait-photo reading shelf and short-TV stale/error layouts.

### Exact browser runs and corrections

From `hearth/`:

```sh
pnpm test:e2e:built tests/e2e/today-polish.spec.ts tests/e2e/today-adaptive.spec.ts tests/e2e/today-photo-rotation.spec.ts tests/e2e/today-settings.spec.ts
```

**418 passed**, including the entire 384-case matrix, 256 stress states, remote reachability,
rotation and error layouts. One pre-existing settings test expected the former arrow route;
it was updated to four Down presses from the now-left Chores rail, then Right/Down to Verse.
Two later settings tests were not run in that stopped invocation; all five settings tests pass
in the final adjacent run below. Earlier partial runs also caught an obsolete sizing expectation,
short-TV text spill and a 30-second budget for 16 full navigations. Those were corrected, not
waived: the batched stress case has a 60-second budget, while assertion timeouts stay unchanged.

After the final three-tile full-width adjustment and a fresh production build:

```sh
pnpm test:e2e:built tests/e2e/today-polish.spec.ts --grep 'Today composition (1920x1080|1366x768) (none|portrait-2-3|portrait-9-16) mask (7|11|13|14|19|21|22|25|26|28)$'
```

**60/60 PASS (44.1 seconds)**, including equal top rails for all affected three-card configurations.

```sh
pnpm test:e2e:built tests/e2e/today-settings.spec.ts tests/e2e/visual.spec.ts tests/e2e/appearance.spec.ts tests/e2e/modules.spec.ts tests/e2e/remote.spec.ts
```

**87/87 PASS (1.9 minutes)** on the final build, including the corrected remote path, all settings
tests, Today at 4K/1080p/1366px/phone portrait/landscape, actual intrinsic image sizing, dark surfaces,
module access and adjacent calendar/chore flows. No skipped tests in these two final runs.

Logs and screenshots are preserved outside source at `/tmp/hearth-today-layout-proof.bzR63f/`;
source tests remain the repeatable evidence. `git diff --check` and explicit root-doc formatting pass.

### Unchanged and open

No publication, push, merge, deployment, installed APK update, pairing, calendar connection,
HA command/restart, private content read or Synology/network change. Android/HA-specific gates and
the entire 1,135-case release suite were not rerun for this web-only local change. Actual household
TV and iPhone Safari viewing remain **not run** and distinct from browser emulation. The next step
is review/release approval, then the normal hosted release gate and a physical-device check.

## D-115 spoiler-free games and player box scores — local implementation, 2026-10-18

Built on `3b4226e` in the existing clean `codex/nba-module` worktree, not the historical iOS
checkout. Binding detail/field/cache boundaries are in [NBA_CONTRACT.md](NBA_CONTRACT.md).
Game cards omit scores/winner emphasis, including accessible text and provider status copy;
deliberate open reveals both totals and a named player list for each team. Points, assists and
rebounds lead both Player stats and Shooting & rebounds. Personal fouls, minutes, +/−, steals,
blocks, turnovers, made/attempted shooting/percentages and offensive/defensive rebounds are
available. Eight-player pagination, reported full-game totals and DNP/null semantics are explicit.

### Verification

- `pnpm verify:code` — PASS: format, lint (same two upstream JSX-parser diagnostics, no lint
  failures), workspace type checks, **93 shared + 40 core + 101 server + 418 web unit tests**,
  **265 server API/integration tests**, **29 migration tests**, Synology deployment scaffold
  verification and web/server production builds. No dependency or migration was added.
- `pnpm verify:ci` — PASS: five policy checks and complete, non-overlapping inventory of
  **1,115 browser tests** across four shards. Inventory is not execution of all 1,115 cases.
- Adapter/service/API tests exercise reordered named columns, nullable missing values, DNP,
  made/attempted bounds, identity/duplicate/score mismatch, unavailable/pregame rosters, invalid
  IDs, fixed URL/redirect options, decoded-byte/time limits, coalescing, bounded cache/concurrency,
  stale recovery, module-off no summary I/O and household/auth rejection.
- Browser plugin unavailable; use repository Playwright against isolated **built local demo**
  processes. Exact command (final run recorded below):

```sh
HEARTH_NBA_EVIDENCE_DIR=/tmp/hearth-nba-box-proof.8ziONQ pnpm test:e2e:built tests/e2e/nba-box-score.spec.ts tests/e2e/nba.spec.ts tests/e2e/modules.spec.ts tests/e2e/screen-admin-isolation.spec.ts --max-failures=1
```

Final built-app run — **PASS, 46/46 (1.8 min)**. No failures or skipped cases. Logs:
`/tmp/hearth-nba-box-code-final.log`, `/tmp/hearth-nba-box-ci.log`,
`/tmp/hearth-nba-box-browser-final.log`. `git diff --check` and explicit formatting checks on
all ten changed authoritative documents also pass.

The focused suite covers 320/390px phone, 1080p/4K TV, light/dark, no summary prefetch, no DOM/
accessible/winner-style spoilers (even if provider status text contains scores), totals and column
order, each team's roster, DNP, shooting, paging, Tab/arrows/Enter/remote Back and opener focus,
filter/page retention, module-off route exit/cache removal, explicit loading/unavailable/stale/
not-started states, saved-box TV fit, unchanged NBA views and shared-screen/admin isolation.
It checks meaningful rendered content, horizontal/TV overflow, page errors and axe accessibility.
Initial runs caught a shared phone dialog button-width rule, shooting-table vertical overflow and
an extra list hint that made the stale TV overview too tall. These were fixed, not waived; hints
stay on cards and the saved-detail warning has scoped compact styling.

### Public feed and visual proof

`node /tmp/hearth-nba-box-proof.8ziONQ/public-proof.mjs` — **PASS**; uses an isolated in-memory local demo
household with the **real** ESPN overview, summary and artwork adapters and a fixed
`2026-10-18T10:30:00Z` clock (local week of 12 October). It reads public sports data only, not the
private server or any real household records. Checks: current validated ESPN detail, two teams,
20/21 roster entries, reported totals matching scores, explicit DNP, both stat views and loaded
crests; TV/phone light/dark fit, no browser third-party requests/errors and scores hidden again
after Close. Screenshots were visually inspected; evidence includes:

- `/tmp/hearth-nba-box-proof.8ziONQ/nba-public-tv-light-hidden.png` — spoiler-free game cards.
- `/tmp/hearth-nba-box-proof.8ziONQ/nba-public-tv-light-players.png` — revealed totals/player list.
- `/tmp/hearth-nba-box-proof.8ziONQ/nba-public-tv-dark-shooting.png` — shooting/percentages.
- `/tmp/hearth-nba-box-proof.8ziONQ/nba-public-phone-light-players.png` — labelled phone stat grid.

**Release boundary:** local implementation only. No new push, merge, image publication, NAS/HA
change, device control, module toggle, data/credential/pairing/network modification or APK install.
No EventKit or retired native bridge work. Actual iPhone Safari/VoiceOver and physical TV viewing,
Android suspend/network recovery, the full 1,115-case browser execution, hosted release and new
private deployment are **not run** for this slice. Public-feed/licensing limitations remain open.

## NBA approved release preflight — 2026-10-18

David approved merging, pushing and updating the existing private server while retaining networking
and household state. Main was fast-forwarded to `986a169`. Hosted run `39115839175` passed code/API/
migrations, Android and both container builds, then correctly blocked publication on an outdated
exact HA browser assertion: the existing D-113 DTO includes its approved `moduleIds` list.

The test-only correction retains exact equality: new approval must expose all twelve explicitly
approved IDs; keeping a legacy limited grant must expose only the frozen eleven. It changes no
application permission, grant, feature flag or live HA configuration. The HA contract's response/
approval field lists now include that already-implemented field instead of contradicting D-113.
Browser plugin not available; repository Playwright was used against isolated built demo processes.

- `pnpm exec prettier --check tests/e2e/admin.spec.ts` — PASS.
- `pnpm verify:ci` — PASS, five policy tests / 1,103 fully inventoried browser cases.
- `pnpm test:e2e:built tests/e2e/admin.spec.ts --grep 'Home Assistant connects all Hearth features|a limited HA connection'`
  — PASS, **4 tests (21.0s)** at 390/1440/1920px plus legacy reconnect/cancel. Entry → approve a
  test six-letter setup → connected summary/exact scope → chore complete/reopen; cancellation
  preserves the old limited scope and deliberate disconnection revokes only that test grant.
  These cases also check rendered content, screenshots, console/page errors, overflow and axe.
- `git diff --check` — PASS. No live deployment was attempted after the failed run; activation
  still requires a new fully green hosted run with both immutable images published.

The broader local `admin.spec.ts --max-failures=0` sweep subsequently passed 71/72 and found one
additional stale display expectation: System health correctly reports migration 33, not 32.
The exact rendered expectation was updated to 33; the isolated System health/recovery-copy case
then passed. This is also test-only, not a weakened migration check or a changed live backup.
The intermediate hosted run `39116332331` was cancelled as obsolete before publication/deployment.

## D-114 NBA visual polish — local implementation, 2026-10-18

Built on local `557db74` on `codex/nba-module`, not the older iOS checkout. Retains the four views,
six-card/eight-row pagination and existing auth/module/HA boundaries. No live system, TV state,
household data, network, credential or installed integration was changed. The artwork boundary
is [NBA_CONTRACT.md](NBA_CONTRACT.md); commercial terms review remains open.

### Code, adapter and asset evidence

- `pnpm verify:code` from `hearth/` — PASS: formatting, lint (the same two upstream JSX-parser
  diagnostics, no lint failures), workspace type checks, **93 shared + 40 core + 85 server +
  418 web unit tests**, **262 server API/integration tests**, **29 migration tests**, deployment
  scaffold verification and both production builds. No new migration or dependency is required.
- `pnpm verify:ci` — PASS: five policy checks and complete/non-overlapping inventory of **1,103**
  browser tests; inventory is not execution of every case.
- `python3.12 -B -m unittest discover -s integrations/home_assistant/tests -q` — PASS, **68**
  fake-transport/config/entity checks; HA source/installed state is unchanged by this polish.
- Adapter regressions cover fixed CDN paths, raster validation/resizing, byte/pixel/timeout bounds,
  download-body cancellation, concurrent request coalescing/caps, cache eviction/negative retries,
  optional malformed player identity, and module/auth/known-player rejection before artwork I/O.
  Component tests cover missing pictures, decorative labels and identity-change recovery.
- Initial verification caught a missing accent-token default and two test ordering assumptions
  (concurrent cache completion and React view changes); these were corrected before the final run,
  not waived. `.nba-screen` supplies a real default token; tests await the requested view and
  deterministically exhaust the cache. No unrelated test or design-token rule was weakened.

### Rendered and public-artwork evidence

Browser plugin unavailable: used repository Playwright against isolated built local demo services,
never the private server. Exact regression command:

```sh
HEARTH_NBA_EVIDENCE_DIR=/tmp/hearth-nba-polish.Bl8yb9 pnpm test:e2e:built tests/e2e/nba.spec.ts tests/e2e/modules.spec.ts tests/e2e/screen-admin-isolation.spec.ts
```

Result: **34 passed (2.1m)**, no failed/skipped cases in the final run. Includes 320px/390px phones,
1080p/4K TV, both themes, all four views, loaded/missing artwork, six tied highlights, stale/empty/
unavailable states, settings retention/module changes, scoped axe checks, console/page errors,
horizontal/TV vertical overflow, D-pad/Back and screen-versus-adult isolation.

Separately, `node /tmp/hearth-nba-polish.Bl8yb9/public-proof.mjs` — PASS. This ephemeral local
harness injects the real public ESPN adapters into an in-memory demo server (test clock 18 October;
local week 12 October 2026), not fictional names with real faces. It returned 69 fortnight club
games and four weekly marks; all visible team crests/player portraits decoded successfully in
12 captures (week/standings/highlights × TV/phone × light/dark), with zero external browser
requests, page errors or console errors. Every TV capture fits 1920×1080 without content scrolling;
phones reflow and intentionally scroll vertically, never horizontally. This is public-data/local
browser proof, not private deployment or physical-device proof.

Manual comparison against `/tmp/hearth-nba-proof.FqSSQk/nba-tv-light-3.png` checked:

1. Copy/meaning: full labels and single-game qualification remain; only attribution adds images.
2. Layout/density: same four views and page sizes, no extra banner/controls; six tied cards fit.
3. Palette: original warm/charcoal/eucalyptus system, with thin ornamental team accents only.
4. Typography: stable tabular scores and bold winners; compact names/rows preserve scan order.
5. Asset framing: contained portraits, ivory-backed black crests, no stretched/cropped faces;
   stable initials/abbreviations when unavailable. Fictional demo portraits stay fictional initials.
6. Interaction/responsiveness: retained focus rings, remote escape, phone stacked cards and
   independent footer navigation; no image carries the only accessible team/player name.

Local screenshots/logs are ephemeral under `/tmp/hearth-nba-polish.Bl8yb9/`; no provider artwork
or private household content is committed. Representative images: `nba-public-tv-light-highlights.png`,
`nba-public-tv-dark-week.png`, `nba-public-tv-light-standings.png` and `nba-six-highlights.png`.
Full-page phone captures include the fixed navigation at its viewport position; they are not
evidence of navigation scrolling into the content during normal use. The separate public-artwork
phone captures use the actual viewport rather than full-page compositing.

`git diff --check` — PASS.

Not run: all 1,103 browser cases, actual TV/iPhone Safari, native Android builds/device checks (no
native change), hosted GitHub gates, publication, release images, live migration or deployment.
Next: owner-approved publication/normal private update, then physical TV/iPhone acceptance.

## D-113 optional NBA — local implementation, 2026-10-18

Implemented on `codex/nba-module`, based on the TV-startup-repair checkpoint `5fa860e`.
No live Synology, TV, HA, network or household data was changed. The older iOS worktree was not
used for implementation. NBA starts off; adult Modules enablement and NBA teams settings are
separate from publication/deployment. Binding scope: [NBA_CONTRACT.md](NBA_CONTRACT.md).

### Local code/provider evidence

- `pnpm verify:code` — PASS: formatting, lint (two existing upstream JSX-parser diagnostic lines,
  no lint failures), workspace type checks, 93 shared + 40 core + 78 server + 416 web unit tests,
  261 server API/integration tests, 29 migration tests, deployment scaffold checks and both
  production builds. Migration 0033 is copied into the server build.
- `pnpm verify:ci` — PASS: five policy checks and complete/non-overlapping inventory of 1,101
  browser tests. This verifies inventory, not execution of all 1,101 cases.
- `python3.12 -B -m unittest discover -s integrations/home_assistant/tests -q` from `hearth/`
  — PASS, 68 fake-transport/entity/config-flow checks. macOS's default `python3` is 3.9 and cannot
  run the existing 3.12+ suite; it was not treated as an application regression.
- `git diff --check` — PASS.
- Public provider smoke: `pnpm --filter @hearth/server exec tsx -e 'import { EspnNbaProvider }
from "./src/integrations/nba-provider.ts"; new EspnNbaProvider().read("2026-10-12",
"Australia/Perth").then(data => console.log(JSON.stringify({season:data.season,phase:data.phase,
standings:data.standings.length,games:data.games.length,highlights:data.highlights.length})))'`
  — PASS, season 2026–27 / Preseason, 30 standings entries, 69 club games, four tied/category
  weekly-high marks. No household/API credentials involved. A January monthly feed also returned
  HTTP 200 / 237 games / 3,178,400 bytes, below the four-MiB response bound.
- Regression cases cover local midnight/month boundaries and DST, next-week exclusion from weekly
  highlights, ties, unknown/truncated/oversized feeds and timeout, coalescing/stale recovery, safe
  first-read failure, setting validation/exact retry/conflict/audit/service recreation, module-off
  no-fetch/retention, and legacy/fresh HA module scope. New changed-scope replay conflicts.

### Browser evidence and remaining gates

The Browser plugin is unavailable, so the repository's Playwright runner was used against isolated
built demo processes, not the private home server. The final command is:

```sh
HEARTH_NBA_EVIDENCE_DIR=/tmp/hearth-nba-proof.FqSSQk pnpm test:e2e:built tests/e2e/nba.spec.ts tests/e2e/modules.spec.ts tests/e2e/screen-admin-isolation.spec.ts
```

The NBA cases exercise 320px/390px phone, 1080p/4K TV, light/dark, all four views, conference/page
and filter state, reload, retained team settings, module off/on, empty/unavailable/stale screens,
remote Enter/arrows/Back, and paired-screen read-versus-admin isolation. Axe checks cover NBA
content/settings; happy paths also check page/console errors and horizontal/TV vertical overflow.
Rendered week, standings and highlights were manually inspected. Screenshots/logs are local,
ephemeral evidence in `/tmp/hearth-nba-proof.FqSSQk/`, not committed assets or real household data.

- Final combined browser result: **32 passed (1.7m)**. No failed or skipped cases in that run.
- Not run: actual TV/iPhone browser installation, installed HA 1.3.0 switch/reconnect, all 1,101
  browser cases, Android Gradle/emulator/device tests (no native code changed), GitHub publication,
  release images or live migration/deployment. Sports-feed availability is not a commercial licence.
- Recommended next step: approve GitHub/release publication, then the normal private server update;
  enable NBA in More → Modules and choose NBA teams. Physical device checks follow that update.

## Android native-bridge startup crash — 2026-10-17

Read-only inspection through the TCL's already-authorized HA Android Debug Bridge connection
confirmed `APP CRASH(EXCEPTION)`. Android's retained `data_app_crash` report identifies
`ExceptionInInitializerError` in `NativeBridge` caused by `PatternSyntaxException` in
`BridgeProtocol`: its type-only-message regex escaped the opening JSON brace but not the closing
one. Desktop JVM tests accepted this pattern; Android's ICU engine rejected it on the first bridge
message. No credential, private household content or full device diagnostic export was read.

The narrow fix escapes that closing brace without changing the four-message allowlist, 256-character
bound, exact-origin/main-frame checks or any pairing/household contract. The APK becomes version
`0.1.2` / code 3. An Android-test-only, dependency-free platform instrumentation runner now exercises
the real regex engine, first-message initialization and malformed/extended-message rejection.
It is excluded from normal Debug/Release APKs. Do not install the test APK on a household TV.

Passed local verification:

- `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ANDROID_HOME=/opt/homebrew/share/android-commandlinetools ./hearth/apps/tv/gradlew -p hearth/apps/tv testDebugUnitTest lintDebug lintRelease assembleDebug assembleRelease assembleDebugAndroidTest`:
  **22 JVM tests**, both lint variants, Debug/minified Release APKs and the Android test APK passed.
- On the API 36 Google TV ARM64 emulator, installing the original app plus the new test APK and
  running `adb -s emulator-5554 shell am instrument -w app.hearth.tv.debug.test/app.hearth.tv.BridgeProtocolInstrumentation`
  first reproduced the TCL's exact initializer/regex exception. Reinstalling the fixed app and
  test APK returned **OK (4 Android bridge tests)** with four success statuses. This is Android
  emulator evidence, not a fixed-TCL installation or full rendered-dashboard launch proof.
- `apksigner verify --print-certs hearth/apps/tv/app/build/outputs/apk/debug/app-debug.apk` passed.
- Focused built-browser verification of `native-tv-viewport`, `production-bootstrap` and `remote`
  passed **23 cases**, including 1080p/4K native-script startup/reload, strict CSP, bounded
  launcher/fern assets, phone/TV navigation, Back and offline/cached content. Browser plugin was
  unavailable; repository Playwright supplies isolated demo/browser evidence, CUA supplies real HA
  inspection. These browser cases do not execute Android's native bridge parser.
- `git diff --check` passed. No server/web/HA component or dependency was changed.

### Approved physical TCL installation and smoke test

The owner explicitly approved temporarily starting the already-installed HA File editor, updating
the TV through HA's existing authorized ADB connection, testing without music and restoring TV off.
No Mac ADB key was approved or copied, and the separate Android test APK was not installed on the TCL.

- File editor 6.2.0 was started with autostart, watchdog, auto-update and sidebar switches left off.
  `androidtv.download` retained the exact original installed APK before replacement. Original and
  fixed APKs are protected under HA's `/config/.hearth-tv-rollback-20261017/` (directory 0700,
  files 0600), not a public web directory. Original SHA-256:
  `5cff7a7a45dc7d107a6f0fb69ded58d35995ddcb5d3d4e0d4112d5c997be2bc5`.
- Fixed debug APK SHA-256
  `29e7356d61c3d0de8c5c99b833125bd4866527809abcb37fa2b596c933633288`
  matched independently on Mac, HA and TV. HA's `androidtv.upload` staged it at
  `/data/local/tmp/hearth-tv-0.1.2-debug.apk`; `pm install -r` returned **Success**. No uninstall,
  clear-data, re-pair or permission expansion. `dumpsys package app.hearth.tv.debug` confirmed
  **0.1.2-debug / code 3**, updated at 10:09:29 Perth on 2026-10-17.
- SHA-256 of the encrypted `shared_prefs/hearth_secure_device.xml` was identical before updating,
  after updating and after cold launch/resume. No preference contents, decrypted secret or cookie
  was read. The existing signed-in household dashboard rendered without a pairing prompt.
- `input keyevent KEYCODE_WAKEUP` followed immediately by `am start -W` returned COLD/ok, but the
  TV's wake launcher subsequently took foreground while Hearth's process remained alive. A second
  `am start -W -n app.hearth.tv.debug/app.hearth.tv.MainActivity` returned HOT/ok and showed Today.
  This wake/launcher handoff is recorded separately, not mislabeled as another app crash or a
  proven automatic morning-launch fix.
- Remote D-pad key events opened the read-only daily-verse dialog; native `KEYCODE_BACK` closed
  it and restored Today with focus intact. This was not a Calendar navigation test. An explicit
  `am force-stop app.hearth.tv.debug` followed by `am start -W` returned COLD/ok (977 ms);
  the new process remained foreground. Home moved to the normal launcher, then another start
  returned HOT/ok (236 ms). Private physical screenshots confirmed the final Today dashboard.
  The retained exit report still identifies the earlier 2026-10-16 APP CRASH; the deliberate
  force-stop is USER REQUESTED. No new startup exception was observed during these checks.
- Only non-secret APKs used temporary `/config/www` staging. That directory was created for this
  transfer, then its files were moved privately and the empty directory removed. Screenshots
  transferred through private `/media`, then moved to the protected evidence folder; none used
  public web staging. File editor's command field does not implicitly invoke a shell: an initial
  staging command created five empty temporary directories. Those exact empty directories were
  inspected and removed with `rmdir`, then the explicit `sh -c` move/chmod/checksum succeeded.
  No existing file was overwritten by that failed staging attempt.
- `KEYCODE_SLEEP` and removal of the five known TV temporary APK/capture files were sent at the
  end. The action returned without output, then the TV's ADB entity became unavailable. A final
  `dumpsys power` call could not run. Thus sleep was commanded, but independent final Asleep
  readback and TV-side temporary-file absence are **unverified**, not passed. HA-side staging
  absence/private rollback retention passed. No unrelated remote or media entity was controlled.
- File editor was stopped: Start available, Stop absent, all four switches still off. Its known
  controlled-stop Error badge recurred. HA Core was not restarted; no configuration, automation,
  permission, network, module flag, chore or household content was edited and no music played.

The private NAS health/readiness remain ready on exact `35c7bb7...`; this Mac's direct HTTPS request
received 403 and is not evidence of working remote ingress. No server/web/NAS deployment occurred.
TV source fix is local commit `8c80652` on `codex/tv-native-bridge-crash`, not pushed or hosted-verified.
Full hosted/workspace verification, overnight/morning wake, forced network loss, physical-handset
navigation and the final standby/TV-temp readback remain open. Evidence is private under
`/tmp/hearth-tv-crash-check.EzBYpc/` and the protected HA folder. Safe local screenshots include
`ha-crash-summary.png` and `file-editor-stopped.png`; household screenshots are not committed.

## D-112 household Modules — 2026-10-15

The requested simple **More → Modules** page has eleven household-wide switches. Off removes
family/admin navigation, direct routes, Today cards/dialogs and photo/game entry points; server
gates direct/asset/legacy Assist routes before feature I/O. Data, provider configuration and Today
preferences remain saved. Core management and inbound HA pairing/module switches remain usable
with every feature off. Migration 0032 stores audited flags and durable actor-scoped exact receipts.
Finite request leases include disconnect handling; pending disabled-tab HA commands are cancelled.

The separately disclosed `controlModules` capability defaults false for old grants and pending
approvals. Fresh single approval explicitly includes it. Matching HA component 1.2.0 adds
eleven observed-state configuration switches, removes disabled selector options and makes disabled
chore/calendar entities unavailable without content attributes. No silent grant expansion, general
admin authority or feature data deletion. Old Today command receipts are redacted while Notices
is off, and an unrelated Today save cannot edit a disabled feature preference.

Passed local checks:

- `pnpm --dir hearth verify:code`: format, lint, full workspace typecheck, 617 unit tests
  (93 shared, 40 core, 71 server, 413 web), 254 server integration tests including 37 new module
  cases, 28 migration cases, deployment/scaffold fixtures and production server/web builds.
- `python3.12 -B -m unittest discover -s hearth/integrations/home_assistant/tests -v`: 68 passed
  with fake HTTP and HA import stand-ins, not a real HA runtime.
- `uvx --offline ruff check hearth/integrations/home_assistant` and
  `uvx --offline ruff format --check hearth/integrations/home_assistant` passed.
- `pnpm --dir hearth audit:dependencies`: no known vulnerabilities.
- `pnpm --dir hearth verify:ci`: policy checks and complete, disjoint four-shard coverage of
  1,088 browser cases. This proves the local shard policy, not hosted execution.
- `pnpm --dir hearth test:e2e:built --max-failures=5 --output=/tmp/hearth-modules-proof.PO42nR/final-browser`:
  **1,088 passed (23.3 minutes)**, including all eight new Modules cases. Phone 390×844 and
  desktop/TV-sized adult browser 1920×1080, light/dark, full-row keyboard focus, large targets,
  serious/critical axe checks, all-off core recovery, exact HA retry, realtime route exit, mixed-case/
  encoded deep links, retained reminders, unrelated unsaved form preservation and paired-screen
  admin isolation. Existing phone/tablet/TV/4K, calendar, weather, games, photos and Today-composition
  regressions also passed. Final rendered screenshots were manually inspected. Browser plugin was
  unavailable; the repository Playwright harness was used.
- `git diff --check` and root specification-document Prettier checks passed. Initial focus styling,
  alternate-path ownership, old menu/migration expectations and notice-receipt leakage were repaired
  with regression coverage. No unresolved local test failures remain.

Evidence: `/tmp/hearth-modules-proof.PO42nR/` (isolated demo/fake data only); it contains code/HA/
audit/shard logs and final screenshots under `final-browser/*/modules-first-view-*.png` and
`final-browser/*/all-off-core-phone.png`. Earlier exploratory/failing-run artifacts remain separate
from this final green run.

### D-112 approved release and live installation

The owner explicitly approved publishing/deploying Hearth and installing matching HA with a quiet
Core restart, retaining networking and current TV/module state.

- `git fetch origin`, clean-tree/diff checks and ancestor verification preceded a non-force push
  of `35c7bb7578179b810215540bceb09b61e4d414dc` to `main` and `codex/admin-ui-consistency`.
  Hosted [run 38748473984](https://github.com/davidjpramsay/hearth-v2/actions/runs/38748473984)
  passed all eight jobs: complete code/API gate, Android test/lint/build, both container builds,
  four browser shards of **272 passed each (1,088 total)** and exact verified-image publication.
  Artifact-action Node 20 deprecation annotations were non-failing runner advisories.
- `./hearth/deploy/synology/activate-private-release.sh 35c7bb7578179b810215540bceb09b61e4d414dc`
  exited 0. Both immutable images were pulled before replacement. The unchanged fixed helper took
  and verified its protected stopped-database snapshot before migrating; normal success cleanup
  followed. The prior image/version remains the rollback reference; a full restore was not tested.
  The original `172.24.0.0/16` bridge/DNS rules were verified twice and publication remains
  `127.0.0.1:8433→8080`. Activator, update-agent, release-safety and firewall-hook hashes are identical
  before/after. No private env, Compose, network, ACL, token or credential edits.
- External health at `2026-10-15T14:23:41.804Z` returned `ok/sqlite-ready/private` and exact
  `35c7bb7...`; readiness returned `ready/database ready/private`; runtime was HTTP 200.
  Unauthenticated HA state remains HTTP 401. Transitional HTTP 502s during container replacement
  resolved. Exact-image ready startup establishes that included migration 0032 completed; no direct
  production database, household payload or grant/credential query was performed.
  Generic Docker/root-directory/firewall diagnostics were denied to the unprivileged deployment
  account; the existing bounded helper supplied release/network checks without extra privileges.
- HA UI independently confirmed Core 2026.10.1. `hassio.backup_full` created **Before Hearth Modules
  2026-10-15**, **3.11 MB**, on this system. This is rollback evidence, not a verified restore.
- Archive `hearth-ha-35c7bb7.tar` was created with `git archive` from the exact committed component;
  SHA-256 `4bdc1a1a45d9939233f2cef44073ab190216b038b56404406b50845a5d0a4051` matched after
  authenticated official File editor upload. The guarded `python3 /homeassistant/install-ha-35c7bb7.py`
  checked exactly sixteen archive members/fourteen source files, prior version 1.1.2, every installed
  hash and eleven Python parses, then installed 1.2.0. The thirteen prior files are retained in
  `.hearth-component-rollback-20261015-35c7bb7`. Success and an injected partial replacement were
  tested first using `python3.12 -B /tmp/hearth-modules-live.8xYTFF/test-installer.py`; rollback
  restored every old hash and removed the newly added switch file in the disposable fixture.
- HA configuration validation passed before/after copying. `configuration.yaml`, `automations.yaml`
  and `scripts.yaml` hashes are unchanged. The read-only Template tool and final restart confirmation
  both showed no running automations/scripts. Core alone restarted and reported it had started;
  the integration visibly shows **Version 1.2.0**, the original Ramsay entry, one device/four
  entities and no setup error. No duplicate entry, reconnect, new authority or module entities
  were silently added. Switches register only after deliberate new adult approval.
- Temporary installer, archive and staging were removed; private component rollback is retained.
  File editor was stopped and independently checked after restart: Start available, Stop absent,
  autostart/watchdog/auto-update/sidebar all off. Its existing controlled-stop Error badge recurred.

Live evidence: `/tmp/hearth-modules-live.8xYTFF/` contains `hosted-result.json`, `hosted-full.log`,
`deploy.log`, safe before/after helper hashes, health/readiness JSON, `ha-preflight.txt`,
`ha-install-result.txt`, backup/configuration/quiet-restart screenshots and `ha-1.2.0-loaded.png`.
No secret, approval code, household content or raw provider identifier is included. The browser
inspection used CUA for the real authenticated HA UI, separate from the Playwright demo tests.

Still not run: adult-phone Modules rendering and the one deliberate reconnect; physical HA/TV
module off/on, retained-data readback and state feedback. Existing limited grants remain restricted;
do not add a duplicate HA entry. No live module flag, TV tab/power, chore/calendar item, morning
automation or network setting changed. Android source/APK is unchanged; its hosted gate passed,
but no APK was installed. D-112 must not be called fully physically accepted on release proof alone.

### Follow-up acceptance preflight — 2026-10-15

The owner requested thorough completion of the remaining connection, real-device, morning-routine
and recovery work. Read-only live inspection still shows HA 1.2.0 with the original one-device/
four-entity restricted entry. Hearth health at `2026-10-15T15:14:14.254Z` is private/sqlite-ready on
exact `35c7bb7...`. No device grant was broadened, credential inspected or household data changed.

Fresh focused checks (source unchanged):

- `pnpm --dir hearth --filter @hearth/server exec vitest run src/phone-connections.integration.test.ts src/modules.integration.test.ts src/home-assistant-bridge.integration.test.ts`:
  **111 passed**. Includes atomic owner recovery, lost/old phone rejection, preserved secondary
  phones/screens/content, trusted-phone restrictions, retry/race behavior, HA scope separation and
  module enforcement. These use isolated test databases, not the real household or physical phones.
- `pnpm --dir hearth test:e2e:built tests/e2e/modules.spec.ts tests/e2e/phone-codes.spec.ts tests/e2e/screen-admin-isolation.spec.ts --reporter=line --output=/tmp/hearth-live-proof.O1Xs4L/browser`:
  **22 passed** (58.1 seconds). Demo/mocked phone entry, light/dark phone/TV-sized Modules,
  keyboard/a11y and paired-screen administration isolation; not actual Safari/TCL proof.
- `pnpm --dir hearth --filter @hearth/web exec vitest run src/components/PhoneRecoveryPanel.test.tsx src/runtime/HearthRuntime.phone.test.tsx`:
  **9 passed**, including private recovery preview/acknowledgment, trust selection and phone-entry UI.
- `python3.12 -B -m unittest discover -s hearth/integrations/home_assistant/tests -v`:
  **68 passed**, fake transport/HA stand-ins. Browser plugin unavailable; repository Playwright
  supplies isolated rendered checks, CUA supplies read-only real HA inspection.

The live 06:30 routine was inspected without running or saving it. Its full 177-line YAML was copied
through the editor's normal Copy action to a private mode-0600 rollback file outside Git, with the
previous clipboard restored. The virtualized editor's initial 36-line DOM text was incomplete and
was replaced by the complete copy before YAML validation. Existing routine has 22 actions, mode
single and no `select.select_option` step. Its wake/music/30%-volume/foreground guards are unchanged.
The Today extension requires the actual authorised TV selector after reconnect; no guessed entity
or first-screen fallback was installed. A missing optional Python YAML parser was bypassed using
the repository's existing js-yaml parser, without adding a dependency.

Safe test logs/screenshots: `/tmp/hearth-live-proof.O1Xs4L/`. The private automation rollback copy
must not be published. Phone approval and TV-availability confirmation were requested; no live
reconnect, navigation, chore completion, module toggle or destructive recovery drill occurred.
Actual iPhone saved-card retrieval/recovery still needs a disposable household/device proof;
current owner access must not be replaced merely to close a test. Native authenticated Bluetooth/
Wi-Fi/trusted-HDMI commissioning requires chosen disposable hardware and remains separate future
implementation, not something proved by these browser or schema tests.

## D-111 single-approval Home Assistant setup — 2026-10-15

The adult explicitly requested no permission picker and approved publication/private Hearth and HA
updates after checks. One disclosed approval includes all currently paired unrevoked screens and
the three existing scoped capabilities. Old limited grants are unchanged; confirmed reconnect and
fresh adult approval are required. No server schema, runtime networking, TV/chore command or morning
automation change is part of this patch. HA 1.1.2 updates both step and actual progress instructions.

Local passed checks:

- `pnpm verify:code`: format, lint, workspace typecheck, 585 unit tests (including 13 bridge UI
  tests), 217 integration tests, 28 migration tests, deploy/scaffold fixtures and production builds.
  After the final reconnect-help wording, `pnpm --filter @hearth/web build` passed again.
- `python3.12 -B -m unittest discover -s hearth/integrations/home_assistant/tests -v`: 60 passed.
  The Mac's default `python3` is 3.9 and cannot import the required modern APIs; reran with 3.12,
  not by weakening the component. `uvx --offline ruff check` and `ruff format --check` passed.
- `pnpm verify:ci`: 5 policy tests and disjoint coverage of 1,080 browser cases (270 per shard).
- `pnpm audit:dependencies`: no known vulnerabilities. `ANDROID_HOME=/opt/homebrew/share/android-commandlinetools pnpm verify:tv`:
  test, Debug/Release lint and builds passed; TV source/APK installation unchanged.
- `pnpm test:e2e:built tests/e2e/admin.spec.ts --grep 'one approval|limited HA connection' --reporter=line --output=/tmp/hearth-single-approval-e2e`:
  4 passed. 390×844, 1440×900 and 1920×1080 bundle approval/exchange, all current screens and flags,
  automation credential blocked from admin (403), demo complete/exact retry/reopen, keyboard approval,
  no overflow, no serious/critical Axe findings and no console/page errors. Limited grant cancel
  leaves permissions untouched; confirmed disconnect revokes the old credential (401).
- Deterministic UI tests also cover zero screens, 21-screen blocking, failed screen lookup,
  newly paired screens, no automatic upgrade and exact uncertain retry after query changes.
- `pnpm test:e2e:built tests/e2e/admin.spec.ts tests/e2e/device-isolation.spec.ts --reporter=line --output=/tmp/hearth-single-approval-admin-e2e`:
  72 admin cases passed (1.8 minutes). The second filename matched no file; screen isolation was
  therefore run separately, not claimed from this command.
- `pnpm test:e2e:built tests/e2e/screen-admin-isolation.spec.ts tests/e2e/device-connection.spec.ts --reporter=line --output=/tmp/hearth-single-approval-isolation-e2e`:
  28 passed (1.5 minutes), including phone/TV/4K shared-screen administration isolation.

Rendered light phone and TV-sized setup images were visually inspected. CUA additionally checked
390×844 and 1920×1080 dark presentation, actual `data-theme=dark`, no checkboxes/overflow and no
warning/error logs. The demo's explicit light preference initially overrode the system-media test;
dark was selected through its Appearance UI and light was restored afterward. Temporary media and
viewport overrides, QA tab and owned demo servers were removed after inspection.
Safe demo screenshots are under `/tmp/hearth-single-approval-e2e/` and
`/tmp/hearth-single-approval-live.jQYxkC/`; no production code/key is included. Browser-plugin skill
was unavailable, so repository Playwright supplies automated/demo proof and CUA supplies live UI
inspection. The React/frontend-testing skills kept permissions derived and frozen on explicit action
and required rendered/keyboard/access-isolation checks.

Live preflight: fresh HA full backup **Before Hearth single approval 2026-10-15** completed (2.91 MB,
this system). It is rollback evidence, not a tested restore.

### D-111 approved release and live installation

- Source `f61454839f22da5cc6ed8bc636fb70db27850a0a` was pushed non-force/atomically to `main` and
  `codex/admin-ui-consistency`. Hosted [run 38723549135](https://github.com/davidjpramsay/hearth-v2/actions/runs/38723549135)
  passed all eight jobs: code/API, Android TV, container builds, all four browser shards (1,080
  cases) and exact verified-image publication. Artifact-action Node 20 deprecation notices were
  non-failing runner advisories, not application failures.
- `./hearth/deploy/synology/activate-private-release.sh f61454839f22da5cc6ed8bc636fb70db27850a0a`
  completed successfully. The existing fixed helper pulled both verified images before replacement,
  retained its SQLite backup/rollback boundary and verified the original `172.24.0.0/16` bridge/DNS
  rules twice. Exact server/web tags are running; web publication remains `127.0.0.1:8433→8080`.
  Helper/update-agent hashes match the preflight. No runtime env, credential, network or grant edits.
- External health at `2026-10-15T11:10:11.995Z`: `ok`, `sqlite-ready`, `private`, exact `f614548...`.
  Readiness `ready/database ready/private` and runtime returned HTTP 200. Unauthenticated HA state
  remains 401. These are service checks, not actual phone/TV behavior.
- HA archive `hearth-ha-f614548.tar` SHA-256
  `77eeed09e3f163c9279f5c964ba746d821432d08d9756974146529d4502aace9` was uploaded through the existing
  authenticated official File editor, without an external port. The guarded updater verified the
  archive's exact 15 members/13 files, old installed version 1.1.1, all 13 installed hashes and ten
  Python parses. Previous component files remain in private rollback directory
  `.hearth-component-rollback-20261015-f614548`; the inert uploaded archive/staging were removed.
  Success and injected partial-replacement rollback were both tested first in disposable local
  fixtures; all 13 previous hashes were restored in the latter. This is not a full HA restore drill.
- Configuration passed before/after copying. Template readback and the Core confirmation both
  showed no running automations/scripts. Only HA Core was restarted, not HA OS/Supervisor. The
  existing integration briefly retried while Hearth was restarting; after Hearth became ready,
  reloading that existing entry recovered it. HA visibly shows **Version 1.1.2**, the original one
  Ramsay entry/device and four entities, with no setup error. No duplicate entry, re-pair, approval,
  TV navigation, chore command or morning-automation edit was performed.
- File editor was stopped afterward; Start is available and autostart/watchdog/auto-update/sidebar
  switches remain off. Its existing controlled-stop Error badge recurred; this is not a claim that
  the stopped helper is running. HA continues to load the updated component independently.

Live artifacts: `/tmp/hearth-single-approval-live.jQYxkC/` contains hosted results, deployment log,
safe health/readiness readback, `ha-install-result.txt`, backup/config/quiet-restart evidence,
`ha-file-editor-stopped.png` and `ha-1.1.2-loaded.png`. No key, code, token or household payload was
read for this release evidence. CUA's temporary QA overrides/tab and owned demo servers were closed;
the existing Hearth screen and updated HA entry remain available for the owner.

Still not run: adult-phone reload/rendered single-approval reconnect, live all-scope data/screen
readback, actual selected-screen navigation/feedback, real chore complete/reopen, grant revocation
and recovery drills. The existing limited grant was deliberately not revoked or expanded. The adult
must confirm **Reconnect Home Assistant** on the phone, then use the existing HA entry's repair for
fresh six letters. Do not use **Add hub** to create a duplicate or call this fully connected before
that adult approval and observed functional evidence.

## D-110 live installation and HA progress-prompt correction — 2026-10-15

Server/web release `b65aefe05c855ffb44c382a8415a5bfa58003e2d` passed
[hosted run 38714468224](https://github.com/davidjpramsay/hearth-v2/actions/runs/38714468224):
all code/API, Android, image and publication jobs, with **1,078/1,078 browser cases** across four
clean shards. The complete affected local Today/phone rerun passed **395/395 in 4.1 minutes**.
The approved private activation command exited 0; external health reports that exact version,
private mode and SQLite ready. Readiness is ready; unauthenticated bridge state returns 401.
The fixed helper verified the existing bridge/DNS rules and loopback-only published port;
activation/update-helper hashes are unchanged before/after. No networking was replaced.

A fresh local HA full backup completed (**2.73 MB**, named Before Hearth short codes 2026-10-15).
Installed component 1.1.0's 13 exact-archive files, verified every hash and parsed ten Python files.
Previous component files are retained in a private component-only rollback directory. The temporary
archive was removed after verification. No HA YAML, config-entry credential or automation was edited.
HA configuration check passed; both running-routine template and restart confirmation reported no
running automation/script. Core alone restarted successfully. File editor is stopped with all four
automatic/sidebar toggles off; its shutdown log confirms services stopped despite the Error badge.

Actual installed **Add integration → Hearth** proved the URL-only form and secure live pairing start,
but caught a rendering defect: HA uses `config.progress.approve`, not the pair step description, for
the progress prompt. Version 1.1.0 therefore hid the six letters. The unapproved dialog was closed;
no household grant or device/chore command was issued. Component **1.1.1** moves the code and brief
instructions into the real progress translation in both source and English. Two regression tests
assert its `{code}` placeholder, rendered six letters and approval/expiry instructions; the component
suite now passes **60/60**, with Ruff format/lint and targeted Prettier checks.

Installed component **1.1.1** from `cdb9bb5460b8df0c17b42a45d61d3724af74adc7` after its hosted code
gate passed. All 13 hashes match the archive; ten Python files parse. The old 1.1.0 files have their
own private rollback copy, and the temporary archive was removed. Rechecked valid configuration and
no running routines, then restarted Core only. The real URL-only form and subsequent live progress
dialog now visibly show **six uppercase letters**, the adult-phone approval path and five-minute
expiry. The code and hidden credential are not in the evidence. That preview reached its normal
five-minute expiry without approval, visibly displayed the expiry message, and was closed. The
trusted-origin form is left ready for the owner to press Submit when both devices are ready; no
actual grant, household entity read, navigation or chore command is claimed.
The final full hosted workflow
[38717042149](https://github.com/davidjpramsay/hearth-v2/actions/runs/38717042149) passed every job,
including all four browser shards and verified-image publication. Server/web stay on the already
verified `b65aefe` because this correction
changes only the HA component, tests and documentation; no redundant NAS restart is required.

Evidence is outside Git at `/tmp/hearth-short-codes-live.jBzgZE/`: hosted result/log, deployment log,
health/readiness, unchanged helper hashes, HA backup/install/restart/stopped receipts and key-free
setup screenshots, `ha-final-ready.png` and the redacted `ha-1.1.1-progress-proof.txt`. No hidden machine credential,
private household content or pairing code was logged. Physical Safari approval, real entities,
screen acknowledgement, agreed test-chore writes and morning-automation changes remain open.

Rendered QA (CUA in the existing private HA browser; no terminal Playwright against live HA):

| Check                             | Result                                                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page identity                     | Correct private HA integration dashboard; title Integrations – Home Assistant.                                                                                                  |
| Meaningful render / error overlay | URL-only form and real approval dialog render; no framework overlay.                                                                                                            |
| Interaction                       | Submit trusted HTTPS origin → live six-letter progress prompt with permissions/expiry guidance. No adult approval submitted.                                                    |
| Screenshot evidence               | `ha-1.1.1-setup-ready.png` contains no code or key; prompt proof is redacted text.                                                                                              |
| Console                           | Preserved HA history has opaque Object/disconnected errors around maintenance; no new entry after the corrected prompt was shown. Not claimed as a clean-session console audit. |
| Physical / permissions            | Adult-phone entry, final grant and actual household/screen/chore behavior remain unverified.                                                                                    |

File editor was independently checked after the final restart: Start available, Stop absent, zero
enabled automatic/sidebar switches. The temporary maintenance tab was closed; owner setup remains
at the trusted-origin starting form in the original HA tab, without a manual key field.

## D-110 release gate follow-up — 2026-10-15

Publication of `fa6f8d3` was approved, but hosted run
[38713169398](https://github.com/davidjpramsay/hearth-v2/actions/runs/38713169398) blocked deployment:
code/API, Android and image-build jobs passed, then browser shard 3 failed with
`route.fulfill: Route is already handled!` in the unchanged static Today composition matrix
(`1920x1080 portrait-2-3 mask 2`). No production activation or HA component replacement occurred.
The matrix now reads its seeded Today response once before navigation and serves cloned JSON;
all geometry assertions and route-draining checks remain, with no production behavior change.
The formerly failing case passed **40/40 consecutive repetitions** on the frozen production build:

```sh
pnpm test:e2e:built --grep 'Today composition 1920x1080 portrait-2-3 mask 2$' --repeat-each=40 --reporter=line --output=/tmp/hearth-short-codes-live.jBzgZE/matrix-repeat
```

Targeted Prettier and ESLint checks passed. A new complete hosted workflow and verified image
publication remain required before activation. A fresh named local HA backup completed (2.73 MB);
the staged component archive is inert and File editor was stopped while the release was blocked.

## Six-letter connections — D-110 local checkpoint (2026-10-15)

Local implementation replaces manual HA key entry with machine-generated secret/short-code adult
approval, adds code alternatives to phone invitations, generates letter-only screen codes and
removes the browser owner-key form in favor of private setup/recovery/operator-replacement QR.
Migration 0031 is additive; no live phones, screens, grants, runtime or networking were changed.
Passed local checks on the final implementation:

- `pnpm verify:code`: formatting, lint, workspace typecheck, **581 unit**, **217 API/integration**,
  **28 migration** tests, ten protected Synology deployment-tool fixtures, deployment scaffold and
  production web/server builds. Migration 0031 preserves existing owner/phone/screen/HA rows.
- `pnpm verify:ci`: five release-policy tests and disjoint complete browser-shard enumeration.
  `pnpm audit`: no known vulnerabilities.
- `ANDROID_HOME=/opt/homebrew/share/android-commandlinetools pnpm verify:tv`: existing Kotlin
  tests, Debug/Release lint and both APK builds. No TV source or installed package was changed.
- `/tmp/hearth-ha-check.gSFK1s/venv/bin/python -B -m unittest discover
-s hearth/integrations/home_assistant/tests`: **58 passed**. The environment is Python 3.14 with
  actual HA 2026.10.1 installed; offline stand-ins do not prove HA lifecycle/rendering.
  `ruff check hearth/integrations/home_assistant` passes. A separate actual-HA API smoke checks
  the URL-only schema, progress task reuse, code placeholders, completion and cancellation.
- Isolated real Python/aiohttp ↔ built Fastify round trip at literal loopback port 14310:
  start, adult approval, automatic exchange/state, exact replay and revocation passed, using
  synthetic demo data only. The disposable server was stopped; no live HA/TV/phone was connected.
- Focused built-browser checks: **5/5 passed**, including short-code approval/exchange and phone
  portrait/landscape keyboard entry, consent waiting, horizontal containment and accessibility.
  CUA inspection confirms the final HA entry form and no warning/error console entries.
  Browser plugin unavailable: used repository Playwright plus CUA for interactive inspection.
- `git diff --check` passes. The full built-browser run finished **1,077/1,078 in 21.4 minutes**:
  one unchanged static photo fixture threw `route already handled` during teardown, after its
  layout assertions passed. Its demo album now loads once before navigation and is served as
  fixed JSON; production playback randomness and afterEach route draining are unchanged.
  The formerly failing case passed **20/20 consecutive repetitions**. All **395 Today/phone
  affected checks passed in 4.0 minutes** on the frozen final build. Every case is covered by the
  full run plus clean affected reruns; this is not claimed as a single clean 1,078-case run.
  Fresh hosted CI remains required before release publication/deployment.

Evidence is outside Git: `/tmp/hearth-short-codes-final-code.log`,
`/tmp/hearth-short-codes-final-browser.log`, `/tmp/hearth-short-codes-tv-sdk.log`,
`/tmp/hearth-short-codes-final-browser/` and `/tmp/hearth-six-letter-setup-preview.png`.
The final code gate rerun is `/tmp/hearth-short-codes-post-fixture-code.log`; browser reruns are
`/tmp/hearth-short-codes-photo-repeat.log` and `/tmp/hearth-short-codes-affected-final.log`.
Exact browser commands:

```sh
pnpm test:e2e:built --max-failures=5 --reporter=line --output=/tmp/hearth-short-codes-final-browser
pnpm test:e2e:built --grep 'Today reflows a portrait photo.*tv-1366' --repeat-each=20 --reporter=line --output=/tmp/hearth-short-codes-photo-repeat
pnpm test:e2e:built today-polish.spec.ts phone-codes.spec.ts --reporter=line --output=/tmp/hearth-short-codes-affected-final
```

An intermediate affected-screen run overlapped a local production rebuild, causing hashed-asset
404s; it is not counted as valid evidence. The serialized frozen-build rerun above passed.
A standalone ad-hoc TypeScript invocation lacked workspace package resolution; the supported
workspace typecheck passed in the complete code gate. Do not rebuild artifacts under an active
built-browser run.
Initial checks exposed the Mac's default Python 3.9 and unset Android SDK; reruns used the
verified Python 3.14 environment and explicit existing SDK. Earlier complete browser runs were
intentionally stopped while adding cancellation/audit hardening, not reported as completed.

Still not run: matching component 1.1.0 live installation, physical Safari/code entry, real HA
pairing/entities, screen commands and morning-automation changes. The old manual key-copy step
below is superseded and paused, not a request for the owner to continue typing it.

## HA release and installed-device checkpoint — 2026-10-15

Released software: `05130f051ea33a9f875562b4a9f3b97f7669a193`, pushed to main and
`codex/admin-ui-consistency`. [Hosted Verify Hearth run 38690895856](https://github.com/davidjpramsay/hearth-v2/actions/runs/38690895856)
passed every job: complete code/API gate, dependency audit, 54 offline HA tests, Android
test/lint/Debug+Release builds, all four browser shards and exact-commit image publication.
The corrected local `pnpm test:e2e:built --max-failures=5 --reporter=line
--output=/tmp/hearth-ha-live-release.9FD3XZ/e2e-final` also passed **1,075/1,075 in 24.6 minutes**.
Earlier local failures and their narrow assertion fixes are recorded in the preparation checkpoint.

Approved live operations and evidence:

- `./hearth/deploy/synology/activate-private-release.sh
05130f051ea33a9f875562b4a9f3b97f7669a193` exited 0. Both exact images were pulled before replacement;
  the existing protected backup/rollback procedure ran. A transitional external 502 during startup
  resolved: private HTTPS `/api/v1/readiness` and `/api/v1/health` now return 200, database ready and
  the exact release. An unauthenticated bridge-state request returns 401. The installer verified the
  existing commissioned bridge/DNS rules and loopback publication; no network configuration was
  replaced. Protected release-helper hashes are unchanged before/after and match the repository.
- The signed local Debug APK was integrity-checked on the Mac, in HA staging and on the TV, then
  transferred with HA's existing `androidtv.upload` and installed with guarded `pm install -r`.
  Android's own response says **Success**, `versionCode=2`, `versionName=0.1.1-debug`. No uninstall,
  data clear, re-pair, app launch, power, music, volume or remote-key command was sent. The preflight
  reported Hearth not visible; physical relaunch/pairing retention and new TV control remain untested.
- With the approved local HA backup already complete, copied only the 13 committed component files
  into the previously absent custom-component target. Every installed file matches the checked
  archive; ten Python files parse. No HA YAML, secret/config-entry or automation was edited.
  Removed only the two owned HA staging installers and their empty staging directory; local copies
  remain outside Git. The TV temporary APK remains available pending final setup cleanup.
- HA's built-in Check configuration reported **Configuration will not prevent Home Assistant from
  starting!**. Both a read-only template and the restart confirmation showed no running automation
  or script. Restarted Core only, without upgrading HA/OS or rebooting the TV. After reconnection,
  **Add integration → Hearth** opens the real protected config flow. The trusted server origin is
  entered, HTTP-loopback exception unchecked, key empty. This proves installed flow registration,
  not an authenticated connection or household entity registration.
- File editor is stopped with start-on-boot/watchdog/auto-update/sidebar off. Its official wrapper
  reports an Error badge after Stop; the inspected first shutdown log explicitly shows SIGTERM and
  all configurator services successfully stopped. It is not running or a required ongoing service.
- The owner enrolled the laptop as a screen themselves. It is not an adult controller; do not use
  that screen credential to issue the HA grant. It is an available candidate for a no-TV-interruption
  navigation test once the adult explicitly selects it in the grant.

Evidence is outside Git at `/tmp/hearth-ha-live-release.9FD3XZ/`, including `hosted-result.json`,
`deploy.log`, `browser-final.log`, `tv-update-receipt.png` and `ha-connection-ready.png` (empty key).
No key, household payload, reminder/provider identifier or private configuration was exported.

**Historical D-108 setup, superseded by D-110:** no key was submitted. New setup must use the
matched short-code server/component after approved installation, not the old key field.
Still not run: live household entities/data, laptop or updated-TV navigation
acknowledgement, agreed test-chore complete/reopen, revocation/offline recovery and actual iPhone
Safari/layout proof. The 06:30 automation remains enabled and unchanged; its Today-selection addition
must wait for the real registered TV entity. No morning routine was triggered.

## HA live-connection release preparation — 2026-10-15

The user subsequently approved finishing the private connection, its verified release and
matching TV update, and adding Today selection to the existing 06:30 routine. Preserve that
routine's wake/music/volume guards and do not run it during setup. HA represents the household
as a **Hearth server** and each approved display as a child **Hearth screen**, not two server
connections, network discovery or location tracking.

Pre-release checks from `hearth/`, evidence outside Git at
`/tmp/hearth-ha-live-release.9FD3XZ/`:

- `pnpm verify` passed its complete code/CI gates: format, lint, types, 577 unit tests,
  208 API integration tests, 27 migration tests, ten deployment fixtures, production builds
  and the 1,075-case browser shard inventory. The browser stage exposed an obsolete migration-29
  assertion; corrected to the actual migration 30. A subsequent run exposed an accidentally
  inserted HA URL assertion in the existing People-colour test; removed that unrelated assertion
  and retained its original route/overlay checks. The exact collapsed-height expectation now
  matches D-107's intentional 48px control size. No cases/assertions were skipped or relaxed.
- The full corrected `pnpm test:e2e:built --max-failures=5 --reporter=line` run is in progress;
  neither complete browser acceptance nor hosted acceptance is claimed at this checkpoint.
- `pnpm audit:dependencies`: no known vulnerabilities.
- `ANDROID_HOME=/opt/homebrew/share/android-commandlinetools ./apps/tv/gradlew -p apps/tv
testDebugUnitTest lintDebug lintRelease assembleDebug assembleRelease --offline`: passed,
  including 21 Kotlin tests, both full lint variants and Debug/Release APK assembly.
  `apksigner verify --print-certs` passed for the locally signed Debug APK. No physical update yet.
- The 54 offline HA tests passed under both Python 3.12 and the isolated actual-HA environment;
  Ruff lint/format and `git diff --check` passed. The Mac's unrelated default Python 3.9 cannot
  run these Python-3.12+ tests; the supported runtime passes. CI now runs the offline component
  suite as well. These tests do not prove live config-entry/entity registration.

Live preflight: HA Core 2026.10.1 / OS 18.3; no configured Hearth integration. An explicitly
approved full local HA backup **Before Hearth bridge 2026-10-15** completed and appears in the
backup list (2.63 MB, This system); restore and off-box recovery are not tested. With specific
approval, installed official File editor 6.2.0 through HA, restricted to the configuration base,
Git off, warning-level logs, start-on-boot/watchdog/automatic-update/sidebar off. It is running
temporarily through authenticated ingress; no external port was enabled. Read-only command-form
preflight confirms the Hearth target directory does not exist. No component files, credentials,
automation changes or TV commands have been installed/sent at this checkpoint. Stop File editor
after setup. Synology health/readiness remain private/ready on `3df5cbf`.

Remaining gates: complete local/hosted release checks and image publication, exact private
deployment with unchanged networking, signed update preserving TV pairing, component install/
restart, explicit scoped grant and private key entry, live entities/readback and observed TV tab
acknowledgement. Actual chore writes require an agreed test chore. Do not count source, imports,
offline tests or a backup listing as physical control or recovery proof.

## Optional Home Assistant chore control — 2026-10-15 (D-109)

User requested chores only, following the discussion of completion/reopening versus broader edits.
This extends the local D-108 bridge on `codex/admin-ui-consistency`; it does not authorize live
HA/NAS/TV changes, pairing, deployment or Git publication. **No home system was contacted or changed.**

Implemented: separate off-by-default `controlChores` requiring `shareChores`. Existing/legacy
grants remain read-only. The isolated automation namespace exposes only explicit completion and
reopening of today's existing household occurrences; no creation, deletion, rename, assignment,
schedule/exception, calendar, payment or admin actions. Existing completion/undo domain rules,
audit actor/source, earnings calculations and realtime invalidation are reused, not duplicated.
No online TV is required for chore actions. The unpublished migration 0030 now also stores exact
input-bound chore reservations/receipts. Crash recovery reads the existing atomic domain receipt;
exact retries after restart or midnight never execute again, changed reuse conflicts, and revocation
is rechecked after awaited reads. Observed completion IDs protect against stale reopening; new
commands are limited to 30/minute. The HA **Today's chores** to-do entity has update-only capability
and rejects detail edits. It omits locked/non-actionable chores and is unavailable for old-day,
failed or truncated data, never an optimistic or false-empty success.

Frontend skills kept permission changes in explicit event handlers and required rendered validation.
Browser plugin unavailable; used the existing project Playwright workflow on loopback only. Flow:
390×844 phone / 1440×900 desktop → Home Assistant settings → sharing then separate chore opt-in →
private one-time key dismissed → correct permission summary → real local API complete/retry/reopen.
Page identity/nonblank content, no framework overlay or relevant console errors, no horizontal
overflow, keyboard Space toggle and serious/critical accessibility checks passed. Inspected both
summary screenshots; text, spacing and targets are legible without clipping. No actual Safari or
HA dashboard rendering is claimed. A Codex Browser plugin is optional for future interactive QA,
not required by Hearth's Home Assistant integration.

Checks from `hearth/` unless otherwise stated:

| Command/check                                                                                                                                                                                                                                                                                                        | Result                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`; Prettier check of changed authoritative docs; `git diff --check`                                                                                                                                                                                                                                | Passed                                                                                                                                                                             |
| `pnpm typecheck`; `pnpm lint`                                                                                                                                                                                                                                                                                        | Passed; same two existing non-failing JSX AST diagnostics                                                                                                                          |
| `pnpm --filter @hearth/shared test:unit`                                                                                                                                                                                                                                                                             | 64 passed                                                                                                                                                                          |
| `pnpm --filter @hearth/core test:unit`                                                                                                                                                                                                                                                                               | 40 passed                                                                                                                                                                          |
| `pnpm --filter @hearth/server test:unit`                                                                                                                                                                                                                                                                             | 71 passed                                                                                                                                                                          |
| `pnpm --filter @hearth/web test:unit --maxWorkers=1 --testTimeout=30000`                                                                                                                                                                                                                                             | 402 passed in 57 files                                                                                                                                                             |
| `pnpm --filter @hearth/server test:integration`                                                                                                                                                                                                                                                                      | 208 passed, including 27 bridge tests                                                                                                                                              |
| `pnpm --filter @hearth/server test:migrations`                                                                                                                                                                                                                                                                       | 27 passed; preserved access and empty new receipt table                                                                                                                            |
| `pnpm build`; `pnpm verify:deploy`                                                                                                                                                                                                                                                                                   | Production web/server builds and 10 static deployment checks passed; no deployment                                                                                                 |
| `pnpm test:e2e:built tests/e2e/admin.spec.ts --grep 'Home Assistant chore control' --max-failures=1 --reporter=line --output=/tmp/hearth-ha-chores-proof.jbSohC/e2e`                                                                                                                                                 | 2 passed; both viewports, keyboard, accessibility, API roundtrip                                                                                                                   |
| `pnpm test:e2e:built tests/e2e/admin.spec.ts tests/e2e/screen-admin-isolation.spec.ts --grep 'tightly scoped Home Assistant connection\|Home Assistant setup has\|Connections contains\|screen\|television\|TV\|tablet' --max-failures=1 --reporter=line --output=/tmp/hearth-ha-chores-proof.jbSohC/e2e-regression` | 21 passed; outbound setup, TV/4K/tablet isolation, Back, pairing, light/dark and accessibility                                                                                     |
| From workspace root: `PYTHONDONTWRITEBYTECODE=1 /tmp/hearth-ha-check.gSFK1s/venv/bin/python -B -m unittest discover -s hearth/integrations/home_assistant/tests -q`                                                                                                                                                  | 54 offline tests passed                                                                                                                                                            |
| From workspace root: `/tmp/hearth-ha-check.gSFK1s/venv/bin/ruff check hearth/integrations/home_assistant`; same tool `format --check`                                                                                                                                                                                | Passed                                                                                                                                                                             |
| Actual HA 2026.10.1 smoke: `/tmp/hearth-ha-check.gSFK1s/venv/bin/python -B /tmp/hearth-ha-chores-proof.jbSohC/actual-ha-todo-smoke.py` from workspace root                                                                                                                                                           | Actual API imports, instance-supported feature, TodoItem values, complete/reopen dispatch, no optimism, edit denial and permission loss passed; fictional coordinator, not live HA |

The first new audit test used incorrect SQL aliases and was corrected to actual `source_channel` /
`action_type` columns. The first HA import smoke incorrectly asserted a class-level attribute that
HA wraps as a descriptor; the corrected instance-level and behavior smoke passed. No product tests
were removed or skipped. Screenshots and the temporary smoke script are outside Git:

- `/tmp/hearth-ha-chores-proof.jbSohC/e2e/admin-Home-Assistant-chore-f5faf-es-explicit-opt-in-at-390px/chore-control-summary.png`
- `/tmp/hearth-ha-chores-proof.jbSohC/e2e/admin-Home-Assistant-chore-8e081-s-explicit-opt-in-at-1440px/chore-control-summary.png`

Remaining: approved verified release, installed HA version/backup/component setup, real HA entity
registration/dashboard tick/untick on an agreed test chore, observed household/earnings/audit and
revocation/recovery checks. No physical TV, actual iPhone Safari, full hosted/full Playwright gate,
hassfest or live deployment ran. Native Kotlin was unchanged by D-109 and was not rebuilt here;
its earlier D-108 local evidence remains separately recorded below. Nothing committed/pushed.

## Inbound Home Assistant integration — 2026-10-15 (D-108)

User approved implementation and focused automated tests, while explicitly saying the home TV is
in use. **No live TV/ADB, Home Assistant, NAS deployment, network or household changes.** This
work remains local alongside D-107 UI cleanup; no commit, push or publication is implied.

Implemented: explicit adult grant/revocation with digest-only independent `HearthAutomation`
authority; selected paired-screen public-tab controls with 15s leases/30s command expiry,
24h idempotency receipts, observed-route acknowledgement, native foreground-generation gating
and server-time/monotonic expiry. Old APKs fail closed for control. No wake/app launch, media,
admin navigation, generic URLs/intents, chore completion, calendar editing or EventKit changes.
Optional chores/calendar projections omit provider IDs, notes, locations, credentials, permissions
and money. Enabled-but-unavailable feeds remain null rather than false zero/empty. Migration 0030
creates no grant and preserves existing access. Private `/assist` writes remain uncommissioned.

The HA custom component uses config flow, a dedicated cookie-free verified-TLS session, coordinated
polling, per-screen select entities, read-only chore sensors and read-only calendar. It is a manual
custom-component install, not built-in, HACS-published or auto-discovered. Canonical language-neutral
fixture: `hearth/packages/shared/fixtures/home-assistant-bridge-v1/state.json`.

Local evidence (not physical HA/TV acceptance):

- New server tests cover adult-only issue, digest/no-key readback, mixed-cookie fail-closed isolation,
  explicit read permissions, provider outage isolation, actual-route acknowledgement, exact/concurrent
  retries, changed reuse, transaction rollback, stale/revoked/unapproved screens, new-instance/restart
  cancellation, superseding, rate bounds, all-day positive/negative offsets and precise-range overflow.
- New shared tests validate route/identity/permission/range boundaries and the canonical fixture.
  Existing server API, unit and migration checks are repeated; final results recorded below.
- Kotlin unit checks, debug/release lint and debug APK build passed. Capability build is version
  `0.1.1-debug`, code 2; no APK was installed. Real pause/resume, push, D-pad and signing compatibility
  against the installed TV build remain not run.
- HA Python: 45 offline tests; actual HA 2026.10.1 import/schema/session/calendar-value smoke,
  Ruff lint/format and JSON/AST checks passed. Stubs only cover limited wiring; hassfest and full
  HA lifecycle/config-entry/entity registration remain not run.
- Disposable loopback-only private fixture with in-memory fictional data: the actual aiohttp
  `HearthClient` changed the paired browser screen from Today to Weather and waited for its applied
  acknowledgement. Exact HTTP replay returned `replayed=true` with the same command. A real calendar
  range decoded. No identifiers, content or keys were printed. Keyboard Left escaped Weather to the
  rail, Up/Up/Enter returned Today, and safe aggregate readback confirmed the manually observed tab.
- Interactive in-app browser phone setup at 390×844: no horizontal overflow, all choices/default
  sharing off, explicit individual opt-in, 48px choice/button targets and keyboard-operable setup
  disclosure. Screenshots outside Git in `/tmp/hearth-ha-bridge-proof.aATGOd/` contain fictional data.
  One development-only HMR dependency-array warning occurred while the hook was being edited;
  fresh compiled-preview readback had no warnings/errors, no framework overlay and meaningful
  content. Parent Connections now says Access enabled for an inbound grant instead of misleading
  Set up; the existing outbound connection remains separate. Entry focus starts at the new setup
  disclosure rather than scrolling past the new controls to the legacy outbound token form.

Final checks from `hearth/`:

| Check                                                                                                                                                                                                                                  | Result                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `pnpm format:check`; Prettier check of changed authoritative docs; `git diff --check`                                                                                                                                                  | Passed                                                                                                 |
| `pnpm typecheck`; final `pnpm --filter @hearth/web typecheck`; `pnpm lint` and final scoped ESLint                                                                                                                                     | Passed; two existing non-failing JSX expression-resolution diagnostics                                 |
| `pnpm --filter @hearth/shared test:unit`                                                                                                                                                                                               | 63 passed                                                                                              |
| `pnpm --filter @hearth/core test:unit`                                                                                                                                                                                                 | 40 passed                                                                                              |
| `pnpm --filter @hearth/server test:unit`                                                                                                                                                                                               | 71 passed                                                                                              |
| `pnpm --filter @hearth/web test:unit --maxWorkers=1 --testTimeout=30000`                                                                                                                                                               | 401 passed in 57 files                                                                                 |
| `pnpm --filter @hearth/server test:integration`                                                                                                                                                                                        | 199 passed, including 18 new bridge tests                                                              |
| `pnpm --filter @hearth/server test:migrations`                                                                                                                                                                                         | 27 passed                                                                                              |
| `pnpm verify:deploy`                                                                                                                                                                                                                   | 10 scaffold checks passed; no live deployment                                                          |
| `pnpm build`; final `pnpm --filter @hearth/web build` after entry-focus polish                                                                                                                                                         | Passed, 30 migration files copied                                                                      |
| `pnpm test:e2e:built tests/e2e/admin.spec.ts --grep 'tightly scoped Home Assistant connection\|Home Assistant setup has\|Connections contains' --max-failures=1 --reporter=line --output=/tmp/hearth-ha-bridge-proof.aATGOd/e2e-admin` | 3 passed                                                                                               |
| `pnpm test:e2e:built tests/e2e/screen-admin-isolation.spec.ts --max-failures=1 --reporter=line --output=/tmp/hearth-ha-bridge-proof.aATGOd/e2e-isolation`                                                                              | 11 passed, including wall-tablet/tablet/TV/4K, redirect/auth/Back and accessibility checks             |
| `ANDROID_HOME=/opt/homebrew/share/android-commandlinetools ./apps/tv/gradlew -p apps/tv testDebugUnitTest lintDebug lintRelease assembleDebug --offline`                                                                               | 21 Kotlin tests, both lint variants and debug APK passed                                               |
| `python -B -m unittest discover -s hearth/integrations/home_assistant/tests -v` using isolated Python 3.12/3.14 runtimes                                                                                                               | 45 passed; actual HA 2026.10.1 import/selector/session/calendar and session-cleanup smokes also passed |

The default parallel web run and an initial serial run were interrupted after existing UI/network
waits timed out on this loaded Mac (16 GB RAM, about 12 GB swap in use). The complete serial web
run with a 30s per-test budget passed all assertions; no product assertions or test cases were
removed. Three new async Connections-summary tests use explicit 5s query waits, matching browser
expectations; the focused panel/summary rerun passed 12/12 after an initial 1s wait timed out.
HA entry cleanup was also exercised with real HA/aiohttp across reload, first-refresh failure and
cancellation: sessions detached and shared connectors remained open. This is not full device/entity
registration or physical HA acceptance. Full Playwright/hosted workflow, hassfest, Android emulator/
device and Release APK assembly remain not run. Owned local servers, tabs and build daemons were
stopped after verification; the screenshots remain outside Git. No commit/push/deployment occurred.

Remaining physical gates: agreed quiet-time verified server/TV update, HA backup/component install/
restart, private key entry, actual household registration/entities, intended TV tab/manual feedback,
inactive-other-app/no-interruption, native pause/resume/reload, revocation, real safe chores/calendar
readback and recovery. Actual iPhone Safari and full hosted/release/Android-device gates remain open.
No production connection is claimed by source, import, emulator or browser proof.

## Administration consistency — 2026-10-15 (D-107)

Local preparation on `codex/admin-ui-consistency`, based on published `3df5cbf`. Not pushed or
deployed; no live household, pairing, credential, photo or NAS/network configuration is changed.

- Shared joined menu rows across More, Hearth settings, Family planning and Connections replace
  the planning-only purple cards and inconsistent root/submenu geometry. Keep the existing
  SettingsLink/opener/focus seam, routes, conditional admin visibility and status messages.
- Central companion scale: 32px page titles, 22px section headings, 18px navigation, 16px body/
  controls and 14px labels/help; standard actions/fields are at least 48px and compact utilities
  at least 44px. Long labels wrap, native checkbox/radio/file/crop controls remain separate,
  and family-screen TV menu rows retain 28px type/80px targets with normal doubled 4K scaling.
- Eucalyptus primary, neutral secondary/Keep and brick destructive actions; no focus enlargement.
  People photo actions no longer stack unnecessarily. Activity filters wrap into two readable
  rows on narrow phones instead of running Connections into System. Light/dark phone navigation
  uses the same blue selected state as the family shell. A documentation ambiguity about
  automatic updates is clarified: installation needs approval; backup/rollback/reload are automatic.

Passed from `hearth/`: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`,
`pnpm exec prettier --check` for the six changed authoritative documents, and `git diff --check`.
Lint retains two existing non-failing JSX expression-resolution diagnostics. After the final
stable production build, Vite preview readback at 390×844 and 1366×768 confirmed the joined menu,
dark People form, light overview, 64px/18px menu scale, 32px page heading and no horizontal overflow.
Back restored the exact More opener. The preview console contained no warnings or errors.

Interactive in-app browser review uses only loopback `http://127.0.0.1:4320`, a demo server on
4310 and a disposable in-memory fictional household. Reviewed More, overview, planning, People,
Household/weather, routines, chore-day, pocket money, Lists, Meals, Photos, Calendar connection,
Home Assistant connection, Phones & screens, Today and System/activity. No household settings were saved,
connections created, credentials entered or deletion confirmed. Actual production phone access
uses a different connected-phone panel from the legacy demo; its live workflow is not proved.

Spot-check viewports: 320×700, 390×844, 844×390, 820×1180, 1180×820, 1366×768, 1920×1080 and
3840×2160; light and dark, not every route/theme/viewport combination. Meaningful Hearth content,
no horizontal document overflow in the inspected layouts and no framework overlay/app console
errors were observed. Measured companion menu rows are 64px/18px, desktop rail controls 44px/16px,
standard fields/actions 48px/16px and activity filters 44px/14px. TV-layout More rows are 80px with
28px CSS type and double physically at 4K. This is browser layout evidence, not a paired physical TV.

Interactions: More → Family planning → header Back returns to More and the exact original row;
desktop menu Down/Enter → Today → Escape restores the overview and opener; New chore/Cancel,
activity filtering and photo Delete → Keep photos remain usable. No deletion request was sent.
Screenshots stay outside Git under `/tmp/hearth-admin-consistency-XkT7eZ/` and contain demo data only.

Browser plugin unavailable; the existing computer-use in-app browser performed interactive rendered
review without a test runner. **Not run at this checkpoint (before D-108 test approval):** automated unit, API,
migration, accessibility/e2e suites, CI/hosted release checks and Android gates. None were added,
modified, skipped or relabeled as passing. Actual iPhone Safari, paired TCL/remote, private phone
enrollment/recovery, commit/push, image publication and deployment remain unverified/not performed.
This does not close the complete release gate or authorize an update to the live NAS.

## Private welcome display and varied photo playback — 2026-10-13 (D-105/D-106)

First hosted run `38374057088` at `9115e02df30be858310a3d6720f3773ca29737cc` passed code/API,
Android and both container builds but failed `visual.spec.ts`'s fixed breakfast-photo expectation
at 4K after 187 shard-four browser passes. Other shards were cancelled and verified images were
not published. The follow-up pins only that legacy visual fixture's display seed, as the existing
photo/Today geometry fixtures already do, retaining all image/ratio/focus/layout assertions.
No runtime, schema or security boundary changed in the follow-up. Complete exact-commit hosted
browser execution and image publication remain required.
Local follow-up `pnpm test:e2e:built tests/e2e/visual.spec.ts --max-failures=1` passed **27/27 in
1.2 minutes**, including all five Today viewports, photo ratio/size, provider-outage and other
visual states. Lint, shard inventory and diff checks are repeated before the follow-up push.

The user authorized finishing, committing and pushing for a manual phone-initiated update,
without further physical phone-connection/recovery drills. This does not close those acceptance
items or authorize a NAS deployment/network change. No production phone, screen or household
record was changed during this release work.

Implemented:

- Operator-only branded first-start presenter: existing fern, **Welcome to Hearth**, one private
  QR and short instructions. Ephemeral loopback/capability-bound display, protected-file input,
  bounded credential-free private HTTPS status reads, no-store/no-referrer/CSP, Host/Origin/Fetch
  Metadata checks and terminal QR removal on claim. No anonymous QR endpoint, key issuance,
  automatic appliance boot, native BLE/Wi-Fi or combined phone/TV grant.
- Today, Photos collage and ambient use shuffled featured cycles. Every asset in an unchanged
  visible collection receives a turn before repeating; next cycles avoid an immediate repeat.
  Peek/preload does not consume a turn. Metadata/clock rerenders do not restart the timer.
  Preserve cadence, manual selection, pause, hidden tabs, reduced motion, ratios and focus.
- Compact whole-thumbnail selection, three phone columns, 48 per page, cross-page selections,
  checked state, visible imported-folder label and keyboard/spatial navigation. Keep exact frozen
  deletion confirmation, cancellation, managed-upload-only eligibility and partial failures.
  Management remains stable/favourites-first; no server photo contract or storage change.

Passed from `hearth/`; logs/screenshots outside Git in `/tmp/hearth-welcome-release.oQp7Fn/`:

- `pnpm verify:code`: formatting/lint/typecheck, **485 unit tests** (58 shared, 40 core, 71 server,
  316 web), **181 integration tests**, **26 migration tests**, ten deployment/maintenance fixtures,
  deployment scaffold and production web/server builds (`verify-code-complete.log`). The two
  existing non-failing JSX expression diagnostics remain.
- Final-source follow-up uses the same checks with bounded test execution:
  `pnpm -r --if-present test:unit --maxWorkers=2`,
  `pnpm --filter @hearth/server test:integration --maxWorkers=2`,
  `pnpm test:migrations`, `pnpm verify:deploy`, and `pnpm build`. Default full parallelism later
  exceeded an unchanged lazy-phone-screen test's one-second lookup deadline during sustained
  unrelated Mac workload. No product/test assertion or global runtime setting was changed to
  bypass it. The real-browser legacy WebAuthn fixture's complete cold-Chromium test now has a
  scoped 30-second deadline after repeated five-second timeouts; every authentication assertion
  and production deadline remains unchanged. The hundred-photo unit harness now enters selection before loading its full album
  and additionally freezes cross-page deletion through a library refresh, avoiding expensive
  unrelated normal-card accessible-name scans; actual hundred-card entry remains browser-tested.
- `pnpm verify:ci`: five workflow-policy checks and disjoint **1,073-test** browser inventory.
  Inventory is not execution; exact-commit hosted browser/image publication remains a release gate.
- `pnpm test:e2e:built tests/e2e/photos.spec.ts tests/e2e/today-photo-rotation.spec.ts
tests/e2e/today-polish.spec.ts tests/e2e/today-settings.spec.ts --max-failures=1`:
  **427 passed in 12.8 minutes**, including all Today composition fixtures, photo ratios/rotation,
  pause/hidden-tab/reduced-motion, remote focus, management/deletion, compact hundred-photo pages,
  cross-page selection and light/dark accessibility at phone/tablet/desktop sizes. The final
  hidden-thumbnail indicator refinement is checked by the focused selection follow-up and exact
  hosted gate rather than relabeling that earlier full focused run.
- `pnpm test:e2e:built tests/e2e/photos.spec.ts --grep
'large photo selection|folder-imported|bulk-selects' --max-failures=1`:
  final-source **6 passed in 51.4 seconds**, including compact light/dark selection at four
  viewports, exact managed-photo bulk removal and imported-original protection.
- `pnpm audit:dependencies`: no known vulnerabilities reported.
- `pnpm exec prettier --check ../docs/hearth-v2/*.md` and `git diff --check`.
- `node /tmp/hearth-welcome-release.oQp7Fn/welcome-qa.mjs`: local renderer checked at **1672×941**
  (concept-native), 1920×1080, 3840×2160, 1366×768, 390×844 and 844×390. Page identity, meaningful
  content, exact normalized visible copy, no framework overlay, console, horizontal/TV overflow,
  serious/critical accessibility, failure/recovery and claim-removes-QR checks passed. All QR
  content was a fictional fixture. The helper was stopped and its fixture proof removed afterward.

Browser plugin unavailable; repository Playwright and a temporary Playwright helper used.
The concept and latest implementation were inspected with `view_image`. Fidelity checks covered
exact welcome/instruction/caption copy; cream/charcoal/green palette; two-column whitespace and
safe edges; large type/line breaks; QR square/quiet zone; original fern and responsive layout.
Intentional differences: use Hearth's actual fern and Source Sans 3 rather than AI approximations,
and a real locally generated fixture QR matrix rather than the concept's illustrative pattern.
No material clipping, overflow or copy mismatch remained. Compact selection screenshots were
also inspected. No generated concept screenshot is shipped as app UI.

Initial failures were retained and repaired/rechecked rather than skipped: the unchanged legacy
virtual-WebAuthn integration exceeded its five-second deadline (early isolated/full reruns passed;
sustained workload later required the scoped browser-fixture deadline above); the new hundred-photo JSDOM case needed a scoped
15-second test deadline under the complete parallel suite, retaining all assertions; the paused
Playwright clock needed a frame to execute focus restoration; compact selection needed its visible
NAS-folder label restored; old Today geometry fixtures needed matching one-photo playback albums
instead of a different five-photo album. Runtime code was not changed to fake fixture results.

### Separate physical first-owner evidence

An isolated empty private-HTTPS instance of published `fa044a4a7cda0184db814eed3a9022c811518392`
was used at work, with an actual iPhone on Tailscale. The user confirmed the setup link opened and
completed setup. Aggregate readback: **1 household, 1 member, 1 owner phone, 1 active session,
first-use proof consumed, migration 29**. The original first-use file was consumed/deleted. No
home NAS data/configuration was copied or changed and no proof, credential or private QR was
reported. Only the task-owned temporary HTTPS listener was removed afterward; the isolated
service ports were no longer listening. This proves the first-owner claim, not every browser
storage/persistence behavior, recovery, exact new-release physical rendering or native hardware.

Still not run: actual second-adult enrollment/revocation, saved-card retrieval/all-phone loss,
trusted-phone lost-owner replacement, Safari relaunch persistence, new photo UI on the physical
iPhone/TV, factory autostart, HDMI commissioning, native Bluetooth/Wi-Fi and consumer hardware
identity. Android source/APK is unchanged. Home NAS deployment remains the user's manual action.

## Portable fern icon correction — 2026-10-12

Hosted run `38268993642` for `fbc8ac38de5d226e9cc2531ff9a70bc6b5658c81` failed one Home Screen
icon composition test; Android TV and Synology container builds passed, but browser jobs and
verified-image publication were correctly skipped. That commit was not available for the phone
updater. This is a narrow follow-up, not a change to phone authority, recovery or networking.

Reproduction on Darwin/arm64 and isolated Linux/amd64 (Node 24.18.0, Sharp 0.35.5) found five
decoded colour-channel differences of one level in 255 from floating-point alpha composition.
Trimmed/resized fern buffers matched exactly; the defect was not merely PNG compression.
The builder now uses integer alpha blending and checks exact decoded RGB pixels plus PNG,
180×180, 8-bit RGB and no alpha. Different lossless compression is accepted; a single one-level
pixel alteration is still rejected. The regenerated opaque asset retains the original fern,
geometry and cream background; only 19 channels differ from the old asset by one level.

Passed from `hearth/`, logs outside Git under `/tmp/hearth-icon-release.J6uMLc/`:

- `node apps/web/scripts/build-home-icon.mjs` and the same command with `--check`.
- `pnpm --filter @hearth/web test:unit src/styles/homeScreenIcon.test.ts`: **9 passed**, including
  different lossless encoding, one-channel mutation and wrong size/alpha/format regressions.
- The unchanged `scripts/build-home-icon.mjs --check` under the existing local
  `ghcr.io/davidjpramsay/hearth-v2-server:ad037d7f5c8d67e34dde13eee8762bafca873182` Linux/amd64
  image: passed. Only current public assets/scripts were mounted read-only into `/app/public`
  and `/app/scripts`; `--pull=never --network none --read-only --cap-drop ALL
--security-opt no-new-privileges`, entrypoint `node`. No server startup, data/secrets mount,
  network access or running-service mutation occurred.
- `pnpm verify:code`: format/lint/typecheck, **463 unit tests** (58 shared, 40 core, 71 server,
  294 web), **181 integration tests**, **26 migration tests**, ten deploy/maintenance fixtures,
  deployment verification and production web/server builds. Existing non-failing lint diagnostics
  remain. The new temporary CLI fixtures initially failed ESM dependency resolution; a scoped
  temporary dependency symlink fixed the harness, and all negative cases now assert the real
  composition error rather than accepting any subprocess failure.
- `pnpm test:e2e:built tests/e2e/admin.spec.ts --max-failures=1`: **68 passed in 1.5 minutes**,
  including phone/TV-sized settings, keyboard return, accessibility, layout, title and console/
  framework-error checks. Browser plugin unavailable; existing Playwright workflow used.

Rendered fern asset and phone settings screenshots were inspected. No manifest/session/TV
resource or app navigation changed. Complete hosted browser and verified-image publication
remain an exact-commit gate after push; prior local 1,068-test evidence is not relabeled as a fresh
full local run. Actual iPhone installed-icon refresh and physical recovery remain not run.
No NAS deployment, network change, phone/card issuance, pairing or revocation was performed.

## Complete local release gate and publication authorization — 2026-10-12

The user authorized committing and pushing all prepared changes on `codex/phone-access-release`
after a full check. This includes settings-return navigation, discoverable managed-photo removal,
the fern Home Screen icon, and D-104 private setup-card/phone-independent recovery. This checkpoint
does **not** deploy to the NAS, change networking, create live cards, or pair/revoke household
devices. The user intends to install from the phone's Update button after the exact commit's
hosted verification and server/web image publication pass.

Passed commands from `hearth/`, with logs outside Git in
`/tmp/hearth-complete-release.XU3sHa/`:

- `pnpm verify`: formatting, lint, workspace typecheck, **458 unit tests** (58 shared, 40 core,
  71 server, 289 web), **181 integration tests**, **26 migration tests**, **10 deployment/maintenance
  fixtures**, deployment scaffold, production web/server builds, **5 CI-policy checks**, and
  **all 1,068 Playwright tests passed in 21.3 minutes**. The complete browser run includes TV/mobile
  layout, accessibility, settings/photos, screen isolation, Weather/D-pad and calendar fit checks.
  Production outputs were unchanged during the browser run. The two existing non-failing JSX
  expression-resolution lint diagnostics remain.
- `env ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home pnpm verify:tv`:
  Android TV debug/release lint and builds passed. Initial SDK-not-configured failure was resolved
  with command-scoped installed SDK/JDK paths, without changing system or repository settings.
- With those same command-scoped variables,
  `./apps/tv/gradlew -p apps/tv --no-daemon testDebugUnitTest --rerun-tasks`:
  **14 freshly executed TV unit tests**, zero failures/errors; cached tasks alone are not the proof.
- `pnpm audit:dependencies`: **no known vulnerabilities found**.
- `pnpm exec prettier --check ../docs/hearth-v2/*.md` and `git diff --check`: passed.

The sealed security diff review against `ab33fb926d6a2fc3838293e35455c52070c4927d` completed with
**no findings**: 53 source inventory items, supplementary changed docs/assets/E2E files, disjoint
source review and an independent architecture review. Scan ID
`2ce4a231-e3d1-46d4-8be2-a0a1f76f9043`; source snapshot SHA-256
`90f961420b81a6e24fe22d67f18d365717fa78f58327fc785ea33cc8815284fd`.
This is bounded diff coverage, not a repository-wide vulnerability audit or a guarantee against
all vulnerabilities. Review found two obsolete passkey references in secondary READMEs; these
were aligned with the existing phone-confirmation contract afterward. Only documentation changed
after the reviewed source snapshot; no runtime/configuration/deployment template changed.

Rendered screenshots inspected from this complete run: `admin-phone-portrait.png`, the 3840×2160
Appearance screen (`appearance-light.png`), and the opaque 180×180 fern Home Screen asset. The
earlier isolated private HTTPS recovery-flow evidence below remains separate from these demo
browser checks. Actual iPhone Safari/camera/PNG-save and physical loss/recovery remain **not run**;
native Bluetooth/Wi-Fi/authenticated hardware/trusted HDMI remain future work. No physical TV
upgrade is inferred from local Gradle/browser checks. Existing NAS networking and household
access/data are unchanged.

Hosted Linux/container verification and image publication are a subsequent gate for the exact
pushed commit. Local success does not by itself make the phone Update available or establish
live migration/deployment/physical acceptance. Keep those gates open until independently checked.

## Private setup cards and phone-independent recovery — 2026-10-12 (D-104)

Historical focused local checkpoint on `codex/phone-access-release`, based on `ab33fb9`, before
the complete release gate above. It was not committed, published or deployed at that checkpoint.
The earlier schema-only checkpoint below is also historical. This adds a real browser/server
compatibility path to an already reachable
trusted HTTPS Hearth; it does not build a native phone app or physical network appliance.

- Scanned private first-use card names the household/adult/phone without a copied-key field.
  Existing first-use verification remains; used setup cards cannot authorize owner recovery.
  The provisioning-workstation helper creates private mode-0600 PNG output from an existing
  protected first-use file, rejects unsafe paths/overwrites, and never prints proof/URL.
- Owner-only card preparation/download/acknowledgment/activation; a pending/expired/discarded
  preview never invalidates an older active card. Activated cards work independently of phone
  expiry and are invalidated on rotation/use/owner replacement. Private proof lives only in the
  fragment/temporary memory; SQLite contains verifiers, generations and receipt fingerprints.
- Explicitly trusted **exact connected phone IDs**, not adult-name trust. A normal invitation
  under the owner's/trusted adult's name cannot inherit recovery powers. Approved replacement
  preserves the approving adult and replaces only the lost owner/linked authorities. A separately
  saved card supports all-phone loss. Ordinary Remove/sign-out and People owner protections remain.
- Migration 0029 is additive and does not designate trust, issue cards or revoke existing access.
  Strict private same-origin/controller checks, approval/capability rechecks, exact retry/conflict,
  browser binding, rollback and secret redaction remain enforced. Settings/activity can decode
  every new recovery audit action. Other phones, TV grants, people and lists are preserved in
  regression tests; no Apple/EventKit bridge or calendar reconnection is added.
- Compact collapsed recovery UI, guided recovery step after owner connection, private save preview,
  Cancel/back exits, keyboard controls and automatic-dark-mode Back-button contrast.

Passed commands from `hearth/` (logs outside Git under `/tmp/hearth-onboarding-qa.ne068K/`):

- `pnpm verify:code`: format, lint, typecheck, **458 unit tests** (58 shared, 40 core, 71 server,
  289 web), **181 integration tests**, **26 migration tests**, ten deployment/maintenance
  fixtures, deployment scaffold and production web/server builds (29 migration files).
  Lint retains two existing non-failing JSX expression-resolution diagnostics.
- `pnpm verify:ci`: five policy tests and disjoint inventory of 1,068 browser tests; inventory
  does not execute the full browser suite.
- `pnpm test:e2e:built tests/e2e/admin.spec.ts tests/e2e/phone-navigation.spec.ts
tests/e2e/screen-admin-isolation.spec.ts tests/e2e/photos.spec.ts --max-failures=1`:
  **109 passed in 3.5 minutes**, including mobile/desktop layout, keyboard/D-pad, photos and
  accessibility checks plus paired-screen admin isolation. This is the focused suite, not all
  1,068 tests. No production app build was changed during the run.
- `pnpm --filter @hearth/server exec vitest run src/phone-connections.integration.test.ts`:
  **38 passed**, including typed admin/activity readback after recovery.
- `git diff --check`: passed; authoritative root docs additionally checked with Prettier.

Browser plugin not available: Playwright CLI used installed Chrome, a disposable in-memory
private-mode SQLite household and the real compiled handlers at loopback HTTPS `14431`. Only
the fixture certificate was ignored in that isolated browser; no system trust changed. Successful
browser flow: first owner, saved-card download/activation, second-adult invitation/approval,
exact trusted-phone designation, approved owner replacement, fresh saved-card recovery, old
owner-session rejection and unchanged approving/secondary adult. All private fragments were
removed; no app page errors. Keyboard Space expands/collapses recovery and Enter creates/discards
a card preview. The intentionally replaced original owner produces an expected HTTP 401 on its
next admin read; that is rejection evidence, not an unexplained app failure.
Viewports 320×700 light, 390×844 dark, 844×390 light and 1920×1080 light have no
horizontal overflow. Screenshots inspected outside Git: `01-private-setup.png`,
`03-card-preview-masked.png` (QR deliberately obscured), `04-recovered-owner.png` and
`recovery-*-*.png`. Full-page captures place fixed phone chrome at the capture scroll position;
viewport captures establish the actual docked layout. Back colours in automatic dark are
`rgb(241,238,231)` on `rgb(50,55,53)`.

Verification repairs: rendered readback found omitted recovery audit enum/presentation entries;
these were added and the phone audit writer made type-safe. Test setup used the real cookie helper
and rebuilt shared packages before validation. The first browser regression attempt stopped after
19 passes on a stale **Migration 28** assertion; the real new version is 29. The exact expectation
was updated, not broadened. Initial local assertions also required TanStack's actual call shape,
QR module-aligned 511px output rather than a distorted forced 512px image, and existing consent
`409 CONFIRMATION_REQUIRED`. No production boundary was weakened for these repairs.

Not run/not implemented: actual iPhone Safari/camera/PNG-save/recovery drill; signed native app;
Bluetooth/local-network permission or Wi-Fi join; authenticated appliance identity transport;
trusted HDMI output; Android/physical TV gates; full 1,068-test browser run; hosted images/release;
live migration, owner-card creation, phone/TV pairing/revocation, networking changes or deployment.
Your commissioned household/NAS is untouched. Retain the operator fallback and physical gates;
release/backup review and explicit deployment approval precede live adoption.
The owned test server/browser were shut down; fixture-only private cards and temporary TLS keys
were removed. Non-secret screenshots/logs remain outside Git for review.

## Appliance QR/recovery foundation — 2026-10-12 (D-104)

Historical Stage A record; the local compatibility implementation above supersedes its
schema-only status. Physical commissioning and publication remain open.

The user selected phone-only appliance setup and recoverable loss of the original handset.
This first slice implements strict v1 setup/recovery QR and metadata schemas, deterministic
language-neutral fixtures, and a pure **advisory** recovery-readiness classifier. It does not
implement proof verification or grant authority. The contract rejects short/noncanonical proof,
unsupported version/purpose/generation, arbitrary URL destinations, extra owner/verified/role
flags, credentials in public discovery and duplicate/missing owner recovery authorities.

`APPLIANCE_ONBOARDING_CONTRACT.md` freezes the selected envelope and staged boundaries. D-104
records Bluetooth LE commissioning, Ethernet alternative, private device proof and independent
recovery authority as future product direction. The current D-102/D-103 phone service remains
byte-identical (SHA-256 `c3e5d10f95b9652fa5c7358827b3df9c4b2353742dfe7f058a0a14bb9d93fd4f`).
No active route, cookie, migration, owner/TV grant, native app, network service, Synology setting
or UI changes in this slice. Earlier settings/photo/icon edits remain preserved and unpublished.

Passed local commands from `hearth/`:

- `pnpm --filter @hearth/shared test:unit src/appliance-onboarding.test.ts`: 17 tests.
- `pnpm build:packages`: shared/core compile.
- `pnpm --filter @hearth/core test:unit src/appliance-recovery.test.ts`: 5 tests.
- `pnpm verify:code`: format, lint, workspace typecheck, 431 unit tests
  (56 shared + 40 core + 71 server + 264 web), 166 server integration tests, 25 migration
  tests, 10 maintenance/deployment fixtures, deployment scaffold verification and production
  web/server builds.
- `pnpm verify:ci`: 5 policy checks and complete non-overlapping inventory of 1,068 browser
  tests; this inventories the tests and does not execute them.
- `git diff --check` from the workspace root: passed.

The initial full gate stopped at test typechecking because a Node filesystem fixture loader was
introduced into the browser-safe shared test environment. It was repaired with static JSON
imports and a test-only `rootDir`; no production compiler types or dependencies were broadened.
The full gate then passed. Shape/fixture tests do not establish QR entropy, authenticated device
identity, cryptographic protocol correctness, server state transitions or physical recovery.

Not run/not implemented: Bluetooth/local-network permissions or Wi-Fi joining on iPhone,
authenticated hardware commissioning, a native setup UI, new server persistence/routes,
trusted-adult/offline-card replacement, actual lost-phone/all-phone-loss drill, trusted HDMI
output, full browser/Android gates, hosted release, publication or deployment. No rendered
surface changed here, so no new screenshots or D-pad proof are claimed. Hardware and reviewed
transport must be selected/proved before the next stage; current access is not weakened in the
meantime. Keep the actual recovery and onboarding gates open.

## iPhone Home Screen fern icon — 2026-10-12 (D-093 companion refinement)

The shared HTML had only the browser favicon, not a Home Screen icon declaration. It now declares
the same-origin opaque 180×180 `/apple-touch-icon.png`, composed from the existing green fern on
Hearth's warm-cream background. `apps/web/scripts/build-home-icon.mjs` regenerates that public asset
before the normal production web build and can verify it with `--check`. It lives within the
existing Docker `COPY apps/web` boundary. No dependency, Docker/network configuration, manifest,
standalone-mode switch, service worker, background behavior or phone/session identity changes.
The transparent shared mark remains byte-identical (SHA-256
`1b78850e1611703bc77d842b425e5eb3a522570b17d8e664bd2033e0b5302a00`); TV artwork is untouched.

Checks passed from `codex/phone-access-release` (`hearth/`):

- `pnpm --filter @hearth/web exec vitest run src/styles/homeScreenIcon.test.ts`: **four passed**
  for Apple touch metadata, opaque PNG dimensions/cream corners/green artwork, deterministic
  original-fern composition and preservation of favicon/bootstrap/viewport/browser mode.
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`: passed. Lint retains the same two pre-existing
  non-failing expression-resolution diagnostics. `pnpm -r --workspace-concurrency=1 --if-present
test:unit --maxWorkers=2`: **409 passed** (39 shared, 35 core, 71 server, 264 web); worker limits
  bound local load without changing any test time limit or product behavior.
- `pnpm verify:deploy`: scaffold checks and **10 owner-maintenance fixtures** passed.
  `pnpm build`: production web/server builds passed; the web build generates the icon.
  `cmp apps/web/public/apple-touch-icon.png apps/web/dist/apple-touch-icon.png` and
  `node apps/web/scripts/build-home-icon.mjs --check`: passed.
- `pnpm verify:ci`: **five policy checks** and complete disjoint inventory of **1068** browser
  tests passed; inventory is not full browser execution.
- `pnpm test:e2e:built tests/e2e/phone-navigation.spec.ts
tests/e2e/screen-admin-isolation.spec.ts`: **20 passed in 1.2 minutes**, preserving docked navigation,
  responsive phone behavior and screen/adult isolation.
- Browser plugin not available: Playwright CLI used built localhost demo only (`4320`, loopback API
  `4310`, in-memory database). More at 390×844 light/dark and Today at 1920×1080 light pass page
  identity/content, absent framework overlay, zero app warnings/errors, unchanged favicon/mode,
  Apple metadata and direct icon GET `200 image/png` with PNG signature and decoded 180×180 size.
  More → Manage photos → Back and keyboard activation of Today remain usable; the icon declaration
  survives the nested route. Browser-decoded icon and phone/desktop screenshots are inspected and
  retained outside Git under `/tmp/hearth-home-icon-qa.9pdJ1I/`. The browser's separate raw-image
  viewer requested a missing `/favicon.ico`; that isolated viewer 404 is not a Hearth UI/PNG failure.
- `git diff --check`: passed. Initial new DOMParser tests used a matcher requiring a window-owned
  DOM node; switching those assertions to direct attribute values fixes the fixture without changing
  production code. No final check failed.

Source behavior follows [Apple's icon configuration guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
and [WebKit's Home Screen icon/fallback documentation](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).
**Actual iPhone Add to Home Screen and installed-icon cache refresh are not run.** Do not remove a
working owner web app, clear site data or change its controller connection just to refresh artwork.
No commit, push, published image or live deployment is part of this checkpoint. API/integration,
migration, Android/container builds and full hosted/browser release gates are not rerun for this
static-icon-only refinement; the preceding photo checkpoint records the last local API/migration
results. Existing photo-removal/menu-return work and private Synology configuration are preserved.

## Discoverable adult photo removal — 2026-10-12 (D-061 refinement)

Permanent removal already existed behind bulk selection. **More → Manage photos** now exposes
**Delete** directly on each Hearth-managed upload, including hidden uploads. **Select photos →
Delete selected (n)** retains batch removal. Confirmation freezes the exact target set, defaults
to **Keep photos**, describes irreversible removal and disables repeat submission while pending.
Cancellation makes no deletion request. Success refreshes the source, gallery, Today and activity;
focus returns to a surviving card or the selection control, including when a refresh removed the
intended neighbour. Failure/partial failure retains the affected photos and reports another try.
The dialog has an accessible description, readable sentence-case copy, aligned controls and bounded
scrolling on short displays. NAS imports never gain a Delete control or source-folder write access.

The existing authenticated, validated, idempotent and audited deletion command is unchanged.
No server/API/schema, native shell, phone authentication, private runtime, networking, import mount
or live photo changes are made. The earlier uncommitted settings-return fix is preserved.

Implementation files: `PhotosSettingsScreen.tsx`, its CSS and new unit test, existing
`tests/e2e/photos.spec.ts` assertions, plus UX_SPEC, DECISIONS, OPERATIONS and this acceptance record.
Checks run from the `codex/phone-access-release` checkout's `hearth/` directory:

- `pnpm --filter @hearth/web exec vitest run src/screens/PhotosSettingsScreen.test.tsx`:
  **10 passed** covering visible/hidden uploads, import protection, safe default/cancel/opener focus,
  exact single target across refresh, mixed-source batches, disappearing-neighbour fallback, pending
  repeat submission, failure/retry, partial failure and last-photo empty state.
- `pnpm verify:code`: final unchanged-command rerun **passed** formatting, lint, workspace types,
  **405 unit**, **166 API/integration**, **25 migration** tests, **10 owner-maintenance fixtures**,
  deployment scaffold validation and production web/server builds. Two preceding attempts hit an
  existing five-second WebAuthn fixture timeout and a lazy QR-bootstrap test timeout respectively;
  both passed isolated rechecks and the final complete run without changing source or time limits.
- `pnpm verify:ci`: **five policy checks** and disjoint inventory of **1068** browser tests passed.
  The inventory check is not full-suite execution.
- `pnpm test:e2e:built tests/e2e/photos.spec.ts tests/e2e/today-photo-rotation.spec.ts
tests/e2e/admin.spec.ts tests/e2e/phone-navigation.spec.ts tests/e2e/screen-admin-isolation.spec.ts`:
  **113 passed in 4.5 minutes**. This includes bulk deletion, managed/import boundaries, curation,
  photo rotation, responsive phone administration, axe accessibility, remote controls, docked phone
  navigation and shared-screen denial. The first run passed 85 then stopped on the old assertion
  that Restore skipped straight to the gallery; the updated existing test asserts Delete and then
  the gallery remain reachable. No final browser check failed.
- Browser plugin not available: Playwright CLI against built localhost demo only (`4320`, loopback
  API `4310`, in-memory database), with no private household credentials or photos. Six viewport/theme
  cases—320×700 light, 390×844 light/dark, 844×390 dark, 1280×720 light, 1920×1080 dark—verify page
  identity/content, absent framework overlay, containment, touch target sizes, safe confirmation,
  cancel without a request, D-pad escape to the next grid row, one accepted deletion, surviving-card
  focus and gallery absence. Additional simulated-import and valid 503-error cases confirm protected
  originals and failure retention. Successful flows have zero application warnings/errors; the
  deliberate 503 is the only expected browser resource error. Screenshots and the temporary runner
  remain outside Git under `/tmp/hearth-photo-removal-qa.RQROHN/`.
- `git diff --check`: passed.

This is **local web/server evidence**, not a live deletion or physical-device acceptance. Actual
iPhone Safari, physical TV, Android build/install, full 1068-case browser execution, hosted release
checks, commit, push and deployment remain **not run** for this change. No live photos are deleted.
Existing backups may retain earlier managed originals under their normal retention policy.

## Physical owner-phone setup and legacy cleanup — 2026-10-12

The owner requests that his currently Rachael-signed-in iPhone become David's protected controller,
with all earlier sign-ins retired and Rachael's phone added afresh later. Live health confirms the
already manually activated exact `ab33fb9` release and database migration 28. Safe metadata initially
shows four legacy browsers, two active legacy passkeys, no protected owner and one retained native
TV. No credential/token/key, credential hash or household content is printed or copied into
development databases or source.

- The canonical NAS-owner `issue-phone-key` command uses the resolved private database, intended
  existing adult and checked private SQLite online backup. It issues a 256-bit one-use 15-minute
  key without removing any current access. The key goes privately to the Mac clipboard, never
  into chat, source, a URL, tool output or a log.
- David enters the key on his actual iPhone and confirms **David's iPhone · this phone / David ·
  owner phone**. Server metadata independently confirms the intended adult, protected `owner`
  source, one active non-passkey session and consumed grant. This is physical first-owner evidence,
  not proof of lost-phone replacement, a second phone or a simulator result.
- Four old browser connections are removed through authenticated companion actions. A guarded
  one-time NAS-owner transaction, with a second checked private backup, retires the two remaining
  passkeys with two same-transaction system audits. At execution the browser targets are already
  revoked, so it changes zero phone/session/invitation rows; it never revives or reassigns a session.
  Profile rows and existing screen authorization remain unchanged.
- `python3 /tmp/hearth-phone-cleanup.IJuDyA/test_cleanup.py`: **seven fixtures pass** for exact
  scope/preservation, foreign/missing/duplicate/protected targets, recent valid ownership,
  unreviewed phones/grants/credential counts, audit rollback and inert repetition.
  `python3 hearth/deploy/synology/owner-access.test.py`: **ten existing fixtures pass**.
  Temporary operation source is staged in a NAS-owned mode-0700 directory and matches its locally
  tested SHA-256. Initial SFTP-based `scp` fails closed; legacy `scp -O` succeeds without changing
  SSH, networking or live services. No temporary test script or private database enters Git.
- Post-cleanup readback: **one David owner phone, one active session, zero active legacy passkeys,
  four revoked historical browsers, zero pending invitations/unused owner grants, two retained
  adult profiles, one active native living-room TV**. `PRAGMA quick_check`, the transaction's
  foreign-key/integrity checks, private readiness and health pass; release remains exactly
  `ab33fb926d6a2fc3838293e35455c52070c4927d`.
- The consumed code file is removed only after its consumed, intended-adult grant is verified;
  the matching Mac clipboard value is cleared. Both checked NAS-only backups retain mode 0600.

No live deployment, container/networking/provider change, member/profile deletion, new owner
promotion endpoint or permanent application-code change is performed. The preceding local menu
Back fix remains unpublished. Rachael's new physical QR connection, lost-owner recovery and actual
owner replacement remain **not run**; do not mark the two-adult-phone acceptance complete yet.

## Consistent settings return menu — 2026-10-12 (D-075 refinement)

Reproduced in the built local phone UI: More → Household → header Back opened `/admin`,
which is a separate menu with different destinations and typography; Photos returned to More.
Settings links now remember an allowlisted opener pathname in router history, and header Back
pops the actual prior entry. More remains More; desktop-overview entries return to the overview;
nested settings restore their actual parent. Safe direct-link fallbacks, draft confirmation and
the existing focus memory remain in use. No CSS, server/API/schema, phone authentication,
shared-screen authorization, private runtime or networking configuration changed.

Checks passed from the clean `codex/phone-access-release` checkout (`hearth/`):

- `pnpm verify:code`: formatting, lint (the same two pre-existing non-failing expression-resolution
  diagnostics), workspace types, **395 unit**, **166 API/integration**, **25 migration** tests,
  **10 owner-maintenance** fixtures, deployment scaffold and production web/server builds.
- `pnpm --filter @hearth/web exec vitest run src/components/SettingsNavigation.test.tsx`:
  **14 navigation regressions** passed, including original-menu history, nested parents,
  Back/Forward without duplicate entries, overview/photos origin, safe direct-link fallback,
  rejected external/unknown/self opener values, native modified links and loading/error Back.
- Browser plugin unavailable; the Playwright CLI fallback used only built localhost demo data
  (`127.0.0.1:4320`, loopback server on `4310`, in-memory database). A corrected temporary runner
  completed **200 flows** at 390×844 light/dark, 320×700 light, 1280×720 light and 1920×1080 dark.
  Each of the ten More settings returned using header, browser and keyboard Back with identical
  menu destinations, row heights and text sizes. Eight nested destinations per viewport retained
  their parents through reload. Overview/photos and header Back/browser Forward did not loop.
  Page identity/content, absent framework overlay, zero application console warnings/errors and
  horizontal containment passed. Returned-menu screenshots were inspected in phone light/dark
  and desktop; artifacts stay outside Git under `/tmp/hearth-settings-back-qa.kH8l0z/`.
- A separate CLI check passed keyboard parent/nested focus restoration and draft Cancel/Discard
  protection (**four flows**); no household changes were saved.
- `pnpm verify:ci`: **five policy checks** and complete disjoint inventory of **1068** browser
  tests passed; this inventory check is not execution of the full browser suite.
- `pnpm test:e2e:built tests/e2e/admin.spec.ts tests/e2e/remote.spec.ts
tests/e2e/appearance.spec.ts tests/e2e/phone-navigation.spec.ts tests/e2e/keyboard-layout.spec.ts
tests/e2e/reliability.spec.ts tests/e2e/screen-admin-isolation.spec.ts
tests/e2e/device-connection.spec.ts`: **198 passed in 5.7 minutes**, including admin/mobile layout,
  keyboard/D-pad focus, theme/Appearance, docked navigation, draft/history reliability, adult-phone
  fixtures and the shared-screen administration boundary. The existing household/member test now
  asserts return to More after reloading a setting opened from More.
- `git diff --check`: passed.

No final check failed. No commit, push, published images or live deployment is part of this
checkpoint. Actual iPhone Safari, physical TV and the full 1068-case browser execution are
**not run** for this patch; the targeted built checks above are local evidence only.

## Approved phone/calendar release candidate — 2026-10-12

The owner authorizes GitHub publication and will activate the update manually. The clean
`codex/phone-access-release` checkout contains protected owner-key/QR phone access (D-102/D-103),
the pending Week viewport fit and Month two-preview/full-day changes (D-101). The separately
prepared firewall-helper implementation, installers, activator, helper tests and networking
documentation are deliberately excluded. Production Compose/environment, native TV source,
private runtime files, archive and workflow are unchanged. The original preparation worktree
retains all excluded work; no live NAS or phone state is changed by this publication checkpoint.

Checks passed in the clean release checkout, from `hearth/`:

- `pnpm install --frozen-lockfile`: existing pinned lockfile installs successfully.
- `pnpm verify:code`: formatting, zero lint errors, workspace types, **381 unit**, **166
  API/integration**, **25 migration** tests, **10 owner-maintenance** fixtures, deployment scaffold
  verification and production web/server builds. The separate 19 firewall-helper preparation
  fixtures in earlier checkpoint notes are not part of this release. Two pre-existing non-failing
  ESLint expression-resolution diagnostics remain.
- `pnpm audit`: no known vulnerabilities in production or development dependencies.
- `pnpm verify:ci`: **5 policy checks** and disjoint inventory of **1068** browser tests.
- `pnpm test:e2e:built tests/e2e/device-connection.spec.ts tests/e2e/admin.spec.ts
tests/e2e/remote.spec.ts tests/e2e/screen-admin-isolation.spec.ts tests/e2e/month-day-cards.spec.ts
tests/e2e/week-viewport.spec.ts tests/e2e/calendar.spec.ts tests/e2e/calendar-density.spec.ts
tests/e2e/calendar-header.spec.ts tests/e2e/keyboard-layout.spec.ts
tests/e2e/native-tv-viewport.spec.ts tests/e2e/visual.spec.ts`: **237 passed** in 5.7 minutes.
  Built localhost application, isolated in-memory demo, no reused private/development server.
  TV/mobile calendar screenshots were inspected; keyboard/D-pad, offline, accessibility,
  viewport/resize and shared-screen denial paths pass. Browser plugin was unavailable; existing
  Playwright coverage was used. Earlier phone-flow fictional previews remain distinct from devices.
- `git diff --check`: pass. Readback confirms no deployment/networking/runtime-source changes.

Full hosted verification and verified image publication are required before the phone's Update
button can offer this candidate. Physical Safari, real-camera QR enrollment, owner replacement and
loss/recovery acceptance remain open. Existing valid legacy sessions are retained; do not sign out
or remove the working phone before a backend-file key establishes the intended protected owner
and both phones pass acceptance. No owner key is automatically issued or captured by publication.

After image publication, use the existing phone update workflow; do not rerun a NAS networking
installer for these application-only changes. Actual activation, live readiness and physical
phone/TV acceptance are separate and must not be inferred from GitHub or local test success.

## Protected main owner phone — 2026-10-12 (D-103)

The key-connected main phone is now server-protected. No adult, including itself, may remove it
through connection revocation, app sign-out, QR account switching, screen conversion or owner-adult
archive/demotion in People. Its name/colour/photo remain editable. The menu labels it **owner phone**
and **Protected · replace with server key**, without Remove. Owner settings have no Sign out.
People waits for ownership metadata before displaying edit/remove controls.

Only a fresh backend-issued one-use key replaces ownership. Its claim atomically revokes the
previous owner's sessions/invitations, creates the new owner and consumes the grant. Bad/expired/
reused keys, interrupted browser proof and a simulated database failure preserve the prior owner.
Secondary/legacy phones, TV, household content and networking are preserved. Issuance alone
disconnects nothing and rotates unused owner grants household-wide. Expired ownership remains
protected; clearing/expiring a Safari cookie still needs backend-key recovery. Restrictive
mixed-screen cleanup may invalidate browser sessions but does not delete the owner record.
Migration 0028's existing provenance is sufficient; no additional migration is introduced.

Passed, from `hearth/` in the `tv-fit-wordmark` checkout:

- `pnpm verify:code` (rerun after final UI wording/loading guard): formatting, zero lint errors,
  workspace type checks, **381 unit**, **166 API/integration**, **25 migration** tests, deployment
  scaffold fixtures including **10 owner maintenance** and **19 firewall-helper** checks, and
  production web/server builds. Two pre-existing non-failing ESLint `TSNonNullExpression`
  resolution diagnostics remain. Twenty-eight migrations are copied to the server build.
- `pnpm verify:ci`: **5 policy checks** and complete non-overlapping inventory of **1068 browser
  tests**, not execution of all those cases.
- `pnpm --filter @hearth/server exec vitest run src/phone-connections.integration.test.ts
src/companion-auth.integration.test.ts src/companion-auth.browser.integration.test.ts
src/admin-repository.integration.test.ts`: **56 passed**. One initial HTTP fixture used a
  too-short TV secret and was corrected; the valid request proves owner conversion is forbidden
  before the TV exchange repository runs. The new repository interface's test double was updated.
- `pnpm --filter @hearth/web exec vitest run src/auth/PhoneAccess.test.tsx
src/components/PhoneConnectionsPanel.test.tsx src/screens/PeopleSettingsScreen.owner.test.tsx`:
  **11 passed**. `python3 deploy/synology/owner-access.test.py`: **10 passed**.
- `pnpm test:e2e:built tests/e2e/device-connection.spec.ts tests/e2e/admin.spec.ts
tests/e2e/remote.spec.ts tests/e2e/screen-admin-isolation.spec.ts`: **110 passed** in 3.2 minutes.
  Final owner-help wording and People loading/error guard were additionally verified in the final
  code gate and rebuilt local browser fixture. No live or development server was reused by that gate.
- Playwright CLI named isolated session `hearth-owner-qa` at `http://127.0.0.1:4320`, serving the
  final compiled web app with an in-memory demo server and explicitly fictional phone/API responses.
  Browser plugin was unavailable. Identity/title/content, no framework overlay and zero application
  errors/warnings pass. The owner has zero Remove buttons across 320×700, 390×844, 844×390,
  1920×1080 and 3840×2160 in light/dark; no horizontal overflow. Screenshots were inspected.
  D-pad arrows/Enter reach secondary removal/confirmation; Keep cancels, then confirmed removal
  leaves the owner and TV visible. Rachael's People view locks the owner's role/admin/removal but
  permits profile editing. Owner settings have zero Sign out buttons; an owner QR scan strips the
  fragment and has zero Disconnect actions. WCAG 2 A/AA and 2.1 AA Axe checks report no violations.

Changed surfaces: shared auth-status/audit metadata; `owner-phone.ts`, phone service, companion
session invalidation and admin repository; HTTP and fixture tests; owner maintenance grant rotation;
phone list, access gate, settings and People UI; Product/UX/Architecture/Data/Operations/Decision
contracts. The prior calendar and firewall-helper work is preserved, not activated by this change.

**Not run:** full 1068-browser execution, hosted release/publication, Android checks (unchanged
native source), live NAS activation/key issuance/removal, actual David/Rachael Safari or real-camera
QR setup, owner replacement on hardware and loss/recovery drill. No commit/push/deployment,
production account mutation, household cleanup, credential collection or networking change occurred.

Local fictional screenshot evidence (outside Git, not actual connected-phone proof):

- [Protected owner and secondary phone](/tmp/hearth-owner-phone-qa.MSZEos/owner-protected-mobile.png)
- [Owner permissions protected in People](/tmp/hearth-owner-phone-qa.MSZEos/owner-people-protected.png)
- [Other adult's desktop view, dark](/tmp/hearth-owner-phone-qa.MSZEos/owner-protected-desktop-dark.png)

## Independent owner-key / QR adult phones — 2026-10-12 (D-102)

No passwords or passkeys in active private enrollment. The first phone proves the external
one-time owner key; a second phone scans an inviter-generated QR and receives authority only
after explicit approval and browser-bound exchange. Each connected phone shows the verified
adult identity and is independently removable. TV scope is unchanged.

Local verification passes:

- `pnpm verify:code`: formatting, zero lint errors, workspace types, 377 unit tests, 159
  API/integration tests, 25 migration tests (including two same-time legacy sessions sharing one
  credential), deployment scaffold checks and production web/server builds.
- `pnpm verify:ci`: five policy checks and complete non-overlapping inventory of 1068 browser tests.
- `pnpm test:e2e:built tests/e2e/device-connection.spec.ts tests/e2e/admin.spec.ts
tests/e2e/remote.spec.ts tests/e2e/screen-admin-isolation.spec.ts`: 110 passed. Initial runs
  correctly refused occupied local dev ports and found a stale migration-27 expectation;
  task-owned dev servers were stopped, the expectation updated to 28, and the exact set rerun.
- `pnpm audit --prod`: no known vulnerabilities. Owner maintenance has nine Python checks;
  existing 19 firewall-helper and eight recovery-safety checks also pass without activation.
- Local CLI browser fixtures exercise QR create/request/approve/exchange, both named identities,
  reload, confirmed independent removal (David and display remain), and already-connected QR
  protection. 320×700, 390×844, 844×390, 1920×1080 and 3840×2160 have no horizontal overflow;
  light/dark, Tab/Arrow navigation, title/content, no overlay and zero application console
  errors/warnings were checked. QR scrolled fully above the dock; inputs use at least 16px.
  Axe reports no serious/critical violations; the existing clock outside a landmark produces one
  moderate `region` notice on the full administration page, while the new access gate reports none.

Browser plugin was unavailable; regular Playwright CLI was used. These new-flow rendered sessions
use fictional local responses, not production credentials or real-phone proof. The full 1068-case
browser run, native APK checks and hosted publication are not run for this change. Physical
David/Rachael Safari setup, QR scan,
terminate/reopen, independent removal, lost-one/both-phone recovery, publication and live
activation remain **not run**. Current production access and networking are untouched. No commit,
push, automatic owner-key issuance, legacy cleanup or live pairing has occurred in this checkpoint.

## Month two-event previews and full-day opening — local verification 2026-10-11 (D-101)

Month now reserves two event-title rows and one count row in every day area. The count is exactly
`events.length - 2`, displayed only when positive; phone uses `+N`, TV `+N more`. Compact layouts
no longer hide the second title or switch to dots. Minimum row heights preserve date, titles and
count without clipping. Compact Month chrome retains the source key and the Week-sized navigation
bar; ordinary tested TV viewports fit without main scrolling. Extremely short/message-heavy
layouts may scroll to retain readable cells, as specified in D-101.

OK/Enter/click/tap on any date opens the complete shared read-only day list from the existing
indexed Month response. Focus alone never opens it. The list handles empty dates and all twelve
events in the dense fixture; event details and Back/Close restore the exact event and date.
The old automatic phone agenda and duplicate compact/wide counters are removed. No extra API
request, provider access, permission, write, schema, credential or migration is added.

Passed commands from `hearth/` in the `tv-fit-wordmark` checkout:

- `pnpm verify:code`: formatting, lint, all workspace type checks, **365 unit**, **143 integration**,
  **24 migration** tests, deployment scaffold checks (**8 existing + 19 pending helper fixtures**)
  and production web/server builds. The two existing non-failing ESLint `TSNonNullExpression`
  resolution diagnostics remain. Deployment scaffold verification is not NAS activation.
- `pnpm verify:ci`: **5 policy checks** and disjoint inventory of **1068** browser tests, not
  execution of that complete browser suite.
- `pnpm exec playwright test --config playwright.ci.config.ts tests/e2e/month-day-cards.spec.ts tests/e2e/week-viewport.spec.ts tests/e2e/calendar.spec.ts tests/e2e/calendar-density.spec.ts tests/e2e/calendar-header.spec.ts tests/e2e/keyboard-layout.spec.ts tests/e2e/native-tv-viewport.spec.ts tests/e2e/remote.spec.ts tests/e2e/visual.spec.ts --max-failures=0 --reporter=line --output=/tmp/hearth-month-regression`:
  **141/141 passed** in 2.5 minutes. The initial eight Month regressions reproduced the old hidden
  second title/duplicate counter/no-dialog failures against the unchanged build.
- `pnpm exec playwright test --config playwright.ci.config.ts tests/e2e/month-day-cards.spec.ts --max-failures=0 --reporter=line --output=/tmp/hearth-month-final`:
  **8/8 passed** after adding explicit URL and initial-popup screenshot evidence; runtime code
  is unchanged from the 141-case run. Zero/one/two/three/twelve-event days, long titles, count bounds,
  no overlap/clipping, TV canvas fit, phone clicks, remote OK, full list scrolling, nested Back,
  empty dates and dark-mode dialog accessibility are covered.
- Targeted `pnpm exec eslint ... --max-warnings=0`, final `pnpm format:check` and
  `git diff --check` pass. Built localhost demo at `http://127.0.0.1:4320/calendar/month`, in-memory
  isolated server, Chromium, en-AU/Perth. Identity, meaningful content, absent framework overlays,
  console health and interaction assertions pass. Viewports include 1280×720, 1366×768,
  1536×864, 1920×1080, 3840×2160, 390×844 and 844×390. Rendered TV, 4K, phone and popup
  screenshots were inspected. Browser plugin was unavailable; enabling it would add interactive
  in-app QA alongside these existing Playwright checks. Evidence uses fictional data only.

Changed surfaces: `MonthScreen.tsx`, shared `CalendarDayDialog.tsx`, Month rules in
`CalendarSurface.css`, the new `month-day-cards.spec.ts`, updated `remote.spec.ts`/`visual.spec.ts`
and corresponding Product/UX/Architecture/Roadmap/Decision/Acceptance text. The pending Week fit
and NAS-helper preparation are preserved; no helper/deployment script is changed in this slice.

**Not run:** all 1068 browser cases, physical TCL remote and iPhone Safari acceptance, native
Android build/install (native code is unchanged), commit/push/deployment. No production calendars,
household data, pairings, NAS services or networking were changed. Publication remains separate.

Screenshot gallery (outside Git):

- [Month on TV](/tmp/hearth-month-regression/visual--visual-Month-at-tv-1366/month-tv-1366.png)
- [Month on phone](/tmp/hearth-month-regression/visual--visual-Month-at-phone-portrait/month-phone-portrait.png)
- [Full selected-day list](/tmp/hearth-month-final/month-day-cards-Month-show-4097e-a-bounded-count-at-1366x768/month-day-open.png)

## Calendar Week viewport fit — local verification 2026-10-11

The original fixed-height timeline reproduced the reported small vertical scroll: at 1366×768,
the main canvas had `scrollHeight=777` and `clientHeight=768` (9px overflow). The initial regression
matrix intentionally failed 14/18 normal/empty/stale viewport cases against the unchanged build.

Week now reserves its header, view switch, messages, all-day and overflow bands and navigation,
then fills the remaining television height. A cleaned-up resize observer measures logical CSS
pixels (including doubled 4K), deduplicates unchanged measurements and has a resize-event
fallback. Readable timed cards retain their minimum size; zero, one or two all-day rows fit the
available budget. Every omitted card remains counted and accessible in the full-day dialog.
Clock labels use exact divisions when space is short. Phone/tablet Week remains a complete,
naturally scrolling agenda, not a squeezed television grid.

Passed, from `hearth/` in the `tv-fit-wordmark` checkout:

- `pnpm verify:code`: formatting, lint, workspace type checks, **365 unit**, **143 integration**,
  **24 migration** tests, deployment scaffold fixtures (**8 existing + 19 pending helper cases**)
  and production web/server builds. The two existing ESLint `TSNonNullExpression` resolution
  diagnostics remain non-failing. This local gate does not activate either deployment helper.
- `pnpm verify:ci`: **5 policy checks** and disjoint inventory of **1060 browser tests**; this is
  an inventory check, not execution of all 1060 cases.
- `pnpm exec playwright test --config playwright.ci.config.ts tests/e2e/week-viewport.spec.ts tests/e2e/calendar.spec.ts tests/e2e/calendar-density.spec.ts tests/e2e/calendar-header.spec.ts tests/e2e/keyboard-layout.spec.ts tests/e2e/native-tv-viewport.spec.ts --max-failures=0 --reporter=line --output=/tmp/hearth-week-fit-complete`:
  **92/92 passed** in 1.7 minutes. Built localhost demo with isolated in-memory data, Chromium,
  en-AU/Perth. Normal/empty/stale checks span 1200×620, 1280×720, 1366×768, 1536×864,
  1672×941, 1920×1080 and 3840×2160. Assertions cover zero main/page vertical overflow, no
  clipped timed cards, wheel stability, week navigation, responsive remount/resize, observer
  fallback, dense all-day/off-hours, offline messages at 620/720px, all nine crowded-day events,
  dialog/Back focus restoration, light/dark accessibility and the exact native viewport template.
  One earlier new test incorrectly expected Down from Wednesday to choose Earlier week;
  Hearth's existing spatial navigation correctly chooses the nearer This week. The corrected
  test proves Left/Right reaches both other controls; no focus-engine behavior was changed.
- Targeted `pnpm exec eslint ... --max-warnings=0`, final `pnpm format:check` and
  `git diff --check` pass. Rendered screenshots were inspected at compact/wide/4K television
  sizes, crowded short/offline sizes, and phone portrait. All evidence contains fictional data.

Files in this fix: `CalendarSurface.css`, `WeekScreen.tsx`, `utils/weekLayout.ts`,
`utils/calendar.test.ts`, `tests/e2e/week-viewport.spec.ts`, `calendar-density.spec.ts`,
`native-tv-viewport.spec.ts`, this acceptance section and the Calendar section of `UX_SPEC.md`.
Existing uncommitted NAS-helper preparation is preserved separately. Browser-plugin tooling was
unavailable; enabling that plugin would allow interactive in-app QA alongside these Playwright checks.

**Not run:** the complete 1060-case browser suite, physical TCL TV/remote and actual iPhone Safari
acceptance, native Android build/install (native code is unchanged), commit/push or deployment.
No production household/calendar data, device pairings, credentials, NAS services or networking
were changed. Live installation remains a separate approved release step.

Screenshot gallery (outside Git):

- [Compact Week, 1366×768](/tmp/hearth-week-fit-complete/week-viewport-Week-fits-13-4751b-al-without-canvas-scrolling/week-viewport.png)
- [Wide Week, 1920×1080](/tmp/hearth-week-fit-complete/week-viewport-Week-fits-19-ea054-al-without-canvas-scrolling/week-viewport.png)
- [4K Week](/tmp/hearth-week-fit-complete/week-viewport-Week-fits-38-842a8-al-without-canvas-scrolling/week-viewport.png)
- [Crowded offline Week, 1200×620](/tmp/hearth-week-fit-complete/calendar-density-crowded-W-61261--the-620px-TV-height-budget/crowded-week-offline-620.png)

## People cards and Weather controls — release candidate 2026-10-10

The owner authorizes committing and pushing both follow-ups and will install manually through
**System health → Hearth update** after publication. These changes build on the prior verified
release `068d65b7bfca202bbdf0ebfcb044af2d58a6d6f2`. The local preparation evidence below is retained.
Fresh pre-push `pnpm verify:code` and `pnpm verify:ci` pass, and `pnpm audit` reports no known
vulnerabilities. A read-only health check confirms the private NAS is healthy on that prior release.
The new exact candidate must pass the complete hosted gate, including all **1035 browser cases**,
Android/container checks and immutable image publication before being offered for installation.
Publication is not NAS deployment. No staging, activation, configuration/networking change or live
household write is authorized or performed in this release preparation. Actual installed version,
physical TCL/D-pad and iPhone Safari acceptance remain post-install checks.

## Weather D-pad exit — 2026-10-10

The chart previously consumed Up/Down to cycle graph types, leaving the only directional exit at
the first inspected hour. The new compact-TV regression reproduces that trap before the fix.
Up now returns to the active Temperature/Rain/Wind button while preserving mode and hour; Left
walks through the button row to Weather in the rail. Down still cycles graphs, Left/Right still
inspect hours and Select still restores **Now**. Known Weather controls use the existing focus
helper rather than changing the shared spatial engine, native Back, modal handling or focus memory.

The first broader run finds that a chart-only route strands the Previous hour / Now / Next hour
buttons. The final scoped bindings connect Wind to those actions, skip disabled endpoint buttons
and return through the graph/buttons. The original all-controls arrow-reachability assertion is
retained and passes. Re-entry uses the nearest control chosen by the existing spatial engine,
then bounded Up/Left keys; it does not falsely require Temperature as every spatial entry.
Rail traversal retains the actual Weather → Reminders → Chores order. Viewport checks allow only
0.001% IntersectionObserver subpixel rounding, not visibly clipped controls.

`pnpm verify:code` passes formatting, lint, workspace types, **361 unit**, **143 API/integration**,
**24 migration** tests, deployment checks and production web/server builds. Eight additional
Weather unit cases cover Up exits in all modes, graph/hour-row traversal, disabled endpoints,
preserved mode/hour and untouched modified browser shortcuts. Final scoped ESLint/Prettier and
`git diff --check` pass. `pnpm verify:ci` passes five policy checks and inventories all **1035
browser cases**, without claiming full-suite execution. The final built-browser command passes
**78 cases in 3.1 minutes**:

```sh
pnpm test:e2e:built tests/e2e/weather.spec.ts tests/e2e/rail-visibility.spec.ts \
  tests/e2e/native-tv-viewport.spec.ts tests/e2e/keyboard-layout.spec.ts \
  tests/e2e/chore-assignees.spec.ts --max-failures=0 \
  --output=/tmp/hearth-weather-focus-TSzdjT/final --reporter=line
```

Eight new light/dark remote cases cover 1366×768, 1672×941, 1920×1080 and 3840×2160. Each uses
only D-pad/Select to inspect first/middle/last samples in every mode, return to the rail, re-enter,
visit enabled hour actions and navigate to Chores without Back, Tab or scripted focus. Mode/hour
remain unchanged by focus movement; focused targets stay visible and shell scroll stays zero.
Page identity/content, overlay absence, console health, screenshots and serious/critical
accessibility pass. Broader cases retain mobile Weather geometry/taps, offline freshness, Now,
all-controls reachability, other-screen navigation, native viewport sizing, the TV rail and the
pending People-card fix. `view_image` inspects compact light and 4K dark screenshots outside Git.
Browser plugin unavailable; existing Playwright uses isolated localhost demo data. Local preparation
performed no push, publication, NAS deployment, APK change, private configuration, networking or
live household write. The owner subsequently authorizes the release candidate above; actual
physical TV/remote and iPhone Safari remain not run.

## Chore People-card sizing — 2026-10-10

A local-only follow-up removes the general form-label top margin from every People card, including
later siblings, and uses equal flexible grid rows. It fixes the taller first card and offset later
cards in both create/edit forms without changing selection, saved assignments, other form spacing,
target sizes or the shared-screen/admin boundary. Names can wrap; no fixed clipping height is added.

Before the CSS change, the new 390×844 light geometry check fails on the inherited **17px** top
margin, reproducing the owner's screenshot. After rebuilding, `pnpm verify:code` passes formatting,
lint, workspace types, **353 unit**, **143 API/integration**, **24 migration** tests, deployment safety
checks and production web/server builds. `pnpm verify:ci` passes five policy checks and inventories
all **1027 browser cases**; it is not full-suite execution. Scoped document formatting and
`git diff --check` pass. The final rendered command passes **23 cases in 1.5 minutes**:

```sh
pnpm test:e2e:built tests/e2e/chore-assignees.spec.ts tests/e2e/planning.spec.ts \
  tests/e2e/screen-admin-isolation.spec.ts tests/e2e/keyboard-layout.spec.ts \
  -g 'chore People picker|phone Family Planning|phone routines assign|one-off chore creation|@a11y /admin/routines|paired .* has no administration links|all admin routes|admin text fields retain|admin screens retain visible' \
  --max-failures=0 --output=/tmp/hearth-people-card-sizing-9cVRwU/after --reporter=line
```

Twelve light/dark People-picker cases cover 320×700, 390×844, 844×390, 1366×768, 1920×1080 and
3840×2160 adult-browser viewports. They assert zero card margins, equal widths/heights, aligned row
tops and exact grid gaps before/after selection and in both forms, alongside existing keyboard
toggle, empty-save, exact-assignment and API readback checks. Page identity/content, overlay absence,
console health, mobile containment and serious/critical accessibility pass. Broader checks retain
TV chore expansion and paired-screen exclusion from administration. `view_image` inspects the
before failure, corrected two-column phone creation form and dark wide-browser editor. Browser
plugin unavailable; existing Playwright tests use isolated localhost demo data. Screenshots stay
outside Git under the command's output directory. Local preparation did not push, publish or
deploy this sizing follow-up; the owner subsequently authorizes the release candidate above.
Actual iPhone Safari and physical TV checks remain not run. No live household data, networking,
credentials, configuration or APK is changed.

## Combined release candidate — 2026-10-10

The owner approves committing/pushing the pending shared-screen isolation, phone dock, compact
People colours, responsive Appearance, Weather, photo-menu colour and explicit chore People-picker
changes. The latest combined `pnpm verify:code` passes 353 unit, 143 API/integration and 24 migration
tests plus formatting/lint/types/deployment checks and production builds. `pnpm verify:ci` inventories
1023 browser cases; the complete hosted workflow, including all browser shards, Android and immutable
image publication, must pass at the exact candidate before it becomes an installable release.

The owner chooses to install through their phone's **System health → Hearth update** after that
gate. Publishing is not deployment. Read-only preflight finds the old private release healthy, the
fixed release helper installed and the root-owned update agent running. No NAS activation, staging,
network/configuration change, credential reset or household write is performed while preparing this
candidate. The phone updater uses the existing commissioned protected configuration and automatic
backup/rollback/readiness path; no APK replacement is needed for this web/server-only update.
Actual installed version, phone/TCL rendering and physical remote acceptance remain separate
post-install evidence; earlier sections record the local preparation checks, not live completion.

### Short-TV release regression and repair

The first pushed candidate `a9a3bbdfd81a9756ae418bc925d213f5ad1639e8` fails the full hosted
workflow [38045177238](https://github.com/davidjpramsay/hearth-v2/actions/runs/38045177238) on the
existing 1366×768 light Games check: the active Games rail row has viewport ratio zero. Publication
is skipped and the private NAS remains on its old release. A local rerun reproduces that failure.

The constrained TV shell introduced for Weather is retained. A route/resize/focus-aware rail helper
scrolls only the existing navigation region and prioritises a focused menu row over the active
destination. It converts physical rectangle deltas to logical scroll pixels under 4K zoom. Clock,
footer and main content never scroll with it. Up/Down traverses the one-column TV menu in DOM order
before Appearance: a clipped Games row must not be skipped because the fixed footer is closer in
screen coordinates. General content spatial navigation, modal isolation and unavailable-row checks
remain intact. Target sizes and fonts are not reduced.

`pnpm verify:code` passes 353 unit tests, including two additional focus-graph regressions, plus
143 API/integration, 24 migration, deployment checks and production builds. `pnpm verify:ci`
checks all 1023 browser cases without replacing execution. The final command passes **79 cases
in 2.3 minutes**:

```sh
pnpm test:e2e:built tests/e2e/rail-visibility.spec.ts tests/e2e/games.spec.ts \
  tests/e2e/games-remote.spec.ts tests/e2e/games-progression.spec.ts tests/e2e/weather.spec.ts \
  tests/e2e/native-tv-viewport.spec.ts tests/e2e/keyboard-layout.spec.ts --max-failures=0 \
  --output=/tmp/hearth-release-20261010-7ZYzaK/rail-verified --reporter=line
```

Eight new light/dark cases cover 1366×768, 1672×941, 1920×720 and 3840×1440. They require full
active/focused-row visibility, preserve content focus at entry, visit every menu row through Games
and Appearance, resize while navigating, keep the household clock visible and assert zero shell
scroll. Page identity/content, overlay absence, console health and serious/critical accessibility
pass. Earlier new-test failures expose the footer shortcut and fractional edge clipping; the fix
handles focused-row reveal as well as entry/resize, rather than weakening assertions. `view_image`
inspects the original hosted failure and corrected short-TV light/4K dark screenshots outside Git
in the command's output directory. Browser plugin unavailable; Playwright uses isolated local demo
data. Physical TV/remote, actual Safari and phone installation remain not run. No game progress,
auth contract, APK, household data or NAS/networking configuration is changed by this follow-up.

## Explicit chore People selection — 2026-10-10

New chores start with no person selected, including households with only adults. Editing starts
with the saved assignee set. Every checkbox can be unticked, including the last one; focusing a
person never selects them. Creation and editing reject an empty selection locally with
**Choose at least one person.**, retain the draft, mark/link the invalid People controls for
assistive technology and bring the message/picker into view before focusing the first checkbox.
Choosing a person clears the error. There is no automatic first-child or adult fallback.

`pnpm verify:code` passes format, lint, workspace types, **351 unit tests** (35 shared, 35 core,
71 server, 210 web), **143 API/integration tests**, 24 migration tests, deployment checks and
production web/server builds. Seven new screen unit tests cover empty defaults, focus-only,
last-person deselection, blocked empty create/update, draft preservation, corrected exact selections,
cancel/reopen and adult-only fallback absence. The existing server/shared nonempty-assignee rule
is unchanged. `pnpm verify:ci` passes five policy checks and inventories all **1015 browser tests**;
it does not execute the full inventory. Scoped document Prettier and `git diff --check` pass.

The final built-browser command passes **19 cases in 1.2 minutes**:

```sh
pnpm test:e2e:built tests/e2e/chore-assignees.spec.ts tests/e2e/planning.spec.ts \
  tests/e2e/screen-admin-isolation.spec.ts tests/e2e/keyboard-layout.spec.ts \
  -g 'chore People picker|phone Family Planning|phone routines assign|one-off chore creation|@a11y /admin/routines|paired .* has no administration links|all admin routes|admin text fields retain|admin screens retain visible' \
  --max-failures=0 --output=/tmp/hearth-chore-people-GW6r6y/final-viewport --reporter=line
```

Eight new light/dark cases cover 320×700, 390×844, 844×390 and 1920×1080 adult browsers. They
exercise New chore → empty save (zero POST/PATCH) → keyboard selection/deselection → save one
explicit child → reload → clear the saved selection → empty save (zero additional command) →
save two explicitly chosen people → reload and typed API readback. All unrelated templates remain
identical to the baseline. Page identity, meaningful content, overlay absence, browser errors/warnings,
horizontal containment and serious/critical accessibility pass. Feedback is fully within the
viewport and outside fixed clock/dock bounds for both create/edit failures. Broader cases retain
multi-person TV expansion, ordering, one-off/failed-save retry, pocket-money planning, native input
keys/Tab, visible keyboard focus and paired-screen exclusion from all administration routes.

Screenshots stay outside Git under the command's output directory. `view_image` inspects phone
light validation, phone dark explicit selection and wide light validation. An earlier rendered
check catches wide-screen feedback above the visible area despite passing DOM visibility assertions;
centred picker scrolling and stricter viewport/clock/dock assertions repair that gap. Initial test
fixture, type and import issues are corrected before the final gates; no failure is waived.
Browser plugin not available; repository Playwright uses only the isolated fictional local demo at
`http://127.0.0.1:4320`, never the private household origin.

This fix is **local, uncommitted, unpushed and undeployed**. Actual iPhone Safari, physical TV/remote
and the full hosted release suite are not run. Shared screens still cannot open the adult editor.
No saved household assignments are repaired or removed automatically, and no production data,
API/schema, recurrence/history, credential, pairing, background work, APK or NAS/networking
configuration is changed. Earlier pending work remains intact.

## Consistent photo-management menu colour — 2026-10-10 (D-075 refinement)

**Manage photos** now uses the ordinary joined-row styling in More: neutral text/background and
the same green icon treatment as peer settings in both themes. The one-off purple variant is
removed, not replaced with another special accent. Gallery/management destinations, explicit title,
row order, inset focus and the shared-screen administration guard remain unchanged.

`pnpm verify:code` passes format, lint, workspace type checks, 344 unit tests, 143 API/integration
tests, 24 migration tests, deployment checks and production web/server builds. `pnpm verify:ci`
passes five policy tests and verifies the 1007-case browser inventory; this is not full execution.
Scoped document Prettier and `git diff --check` pass.

The final focused built-browser run passes **16 cases (49.7 seconds)**:

```sh
pnpm test:e2e:built tests/e2e/admin.spec.ts tests/e2e/screen-admin-isolation.spec.ts \
  tests/e2e/photos.spec.ts \
  -g 'Manage photos matches|phone admin keeps all five|phone More opens setup|Hearth settings groups|desktop admin uses|paired .* has no administration links|phone administration uploads and curates|photo curation remains calm' \
  --max-failures=0 --output=/tmp/hearth-photos-colour-wkicDU/final-verified --reporter=line
```

Six new cases compare row text/background and icon colours at 320×700, 390×844 and 1920×1080 in
light/dark. They check page identity/content, horizontal containment, console health, accessibility,
visible focus and Photos → Games → Manage photos D-pad/Select navigation, then return from photo
management. Existing cases retain phone docking/settings navigation, photo upload/curation and
the exclusion of administration from paired screens, including 4K. Screenshots are outside Git at
the command's output path; `view_image` inspects phone and wide light/dark captures. Browser plugin
unavailable; repository Playwright targets only the isolated fictional local demo.

The before-fix regression fails on the actual purple colour mismatch. The first post-fix run has
two test-selector failures because the wide layout also has a Photos rail link; scoping those
selectors to More fixes the harness before the final all-pass run. No product failure is waived.
This change is **local, uncommitted, unpushed and undeployed**. Actual iPhone Safari/physical TCL and
the full hosted release suite are not run. No photo, household data, API, credential, pairing,
networking, NAS configuration or APK is changed; earlier pending work is preserved.

## Weather graph clarity and responsive layout — 2026-10-10 (D-077 refinement)

Rain now has two aligned lanes in one active daily graph: a purple probability line with fixed
0–100% ticks, and blue millimetres-per-hour bars with a separate, labelled zero-based scale.
Labels, units, line/bar shape and the slider's text alternative are redundant with colour.
Both selected values remain visible on phone. Temperature/feels-like and wind/gusts retain their
comparison styles, with explicit units and exact readable ticks; wind starts at zero. Current
low/high labels, a visible Seven days heading, wide-row column labels and condition-aware weekly
icons improve the reading order. All seven temperature ranges still share one domain.

The fixed household-local midnight-to-midnight timeline, separate live/manual markers, shared
minute clock, gap-safe data and Now/Select restoration remain. A tap inspects the nearest hour
without pointer capture or drag ownership; buttons and D-pad remain alternatives. Tap mapping
accounts for 4K CSS zoom. Measuring on mode change prevents a transient old-height viewBox.
Compact and short-wide spacing remains one-screen. Saved/offline status now uses the normal
header freshness line, retaining visible saved age beside the hour controls, so a tall banner no
longer pushes the last day off a compact TV.

The final `pnpm verify:code` passes format, lint, workspace types, **344 unit tests** (35 shared,
35 core, 71 server, 203 web), **143 API/integration tests**, 24 migration tests, eight owner-tool
tests, deployment checks and production web/server builds. `pnpm verify:ci` passes five policy
checks and a complete, non-overlapping **1001-test browser inventory**, not full execution.
Scoped authoritative-document Prettier and `git diff --check` pass. An initial new-test type error
and format failure are repaired before repeating the full gate.

The final built-browser command below passes all **106 cases in 4.1 minutes**. This includes
Weather and the existing pending responsive/access-boundary regressions; it is not the full
1001-case hosted release suite.

```sh
pnpm test:e2e:built tests/e2e/weather.spec.ts tests/e2e/appearance.spec.ts \
  tests/e2e/shell-clock.spec.ts tests/e2e/phone-navigation.spec.ts \
  tests/e2e/keyboard-layout.spec.ts tests/e2e/screen-admin-isolation.spec.ts \
  tests/e2e/native-tv-viewport.spec.ts --max-failures=0 \
  --output=/tmp/hearth-weather-42womg/final-viewport --reporter=line
```

Weather's 23 cases include a 16-case light/dark matrix at 320×700, 390×844, 844×390, 820×1180,
1366×768, 1672×941, 1920×1080 and 3840×2160. They exercise all three modes, measured native-pixel
SVG dimensions, whole-day endpoints, distinct rain colours/lanes, visible secondary readings,
tap/step/Now, one-screen TV and horizontal containment. Additional cases cover keyboard/D-pad,
weekly wind/calmed/missing values, cached heavy rain, missing-hour gaps and compact offline/reconnect
behaviour. Page identity, meaningful content, overlay absence, browser errors/warnings and
serious/critical accessibility are checked. Broader cases retain the pending Appearance,
phone-dock and screen/admin boundary coverage. Browser plugin unavailable; repository Playwright
uses the built fictional demo at `http://127.0.0.1:4320`, never the private production origin.

Early rendered passes identify compact/short-wide overflow and a mode-height race; both are fixed,
not waived. A final native-size screenshot also catches a short-wide grid row growing beyond the
viewport: content-only overflow assertions passed while the outer shell scrolled its heading away.
The shell row is explicitly constrained and the matrix now asserts a fully visible heading/rail
clock and zero outer-shell scroll after inspection/Now, not just content dimensions.
An additional temporary Playwright wind/phone inspection discovers compact offline
overflow (830 versus 768 pixels); after the freshness change the readback is 768/768, with no
browser errors or warnings. Its interaction path is Wind → chart Left/Right → Select/Now → Rain,
then a compact offline check. Screenshots remain outside Git; the temporary runner is removed.

Visual design/fidelity ledger: the generated TV/phone concepts are preview-only at
`/Users/djpramsay@acc.edu.au/.codex/generated_images/01a03727-4977-7420-8e61-3c07dedae9e5/exec-be976ce2-1c7f-4987-bde8-0c66897e78d8.png`
and `exec-009d90b2-454c-4630-afe7-7c79486c8647.png` in the same directory. `view_image` compares
both with the latest rendered screenshots. The inspected points are the original warm Hearth
palette/shell, heading/current-condition hierarchy, typography, purple-line/blue-bar encoding,
explicit axes/units, restrained weekly rows, spacing and phone adaptation. The TV concept's
1672×941 native size is checked; phone uses the requested 390-pixel logical viewport rather than
the generated image's upscaled raster width. Intentional functional deviations retain Hearth's
established shell metrics and real previous/Now/next controls rather than invented hour buttons,
put lane labels above plots, and keep wind on a second phone row rather than reproducing an
over-wide table. Selected readings name the forecast hour, while the separate dot follows the
current minute; all forecast values/scales come from data, not the mockup. Above-the-fold copy
adds only the specified units/low/high/rain labels and existing state copy. No raster UI, filler,
new navigation or unresolved material visual mismatch is introduced. Final viewport screenshots
include `/tmp/hearth-weather-42womg/weather-rain-tv-viewport.png`,
`weather-rain-phone-viewport.png`, `weather-wind-tv.png` and `weather-compact-offline.png` in the
same directory; phone viewport captures keep the dock at the physical bottom rather than making
a full-page screenshot look like a mid-page floating menu.
The final post-grid-fix TV/native-size images are in `final-viewport/` below the same evidence
directory; full heading/clock visibility is confirmed in both themes after the hour/Now flow.

Physical TCL/remote, actual iPhone Safari, commit/push, hosted full-suite release verification and
private deployment are **not run**. No DTO, provider request, persistence, APK, NAS configuration,
network, household data, credential, pairing or background behaviour is changed. This Weather
refinement is part of the existing pending local UI/security update, not a live release.

## Full-screen Appearance presentation — 2026-10-10 (D-026 refinement)

Appearance previously always entered a 680-pixel companion shell, removing the TV rail and
presenting the phone dock even on a wide screen. A built compact-TV reproduction fails its rail
assertion and captures that narrow layout. Appearance now uses the normal responsive family
shell and ScreenHeader rather than AdminPage: wide displays retain their rail and single clock,
three large side-by-side theme cards and a readable evening-comfort control; narrow viewports
retain stacked choices and the bottom dock. Layout follows available width, never adult authority.
Preference storage, automatic theme, dimming, private access and the legacy alias are unchanged.

`pnpm verify:code` passes formatting, lint, workspace types, **334 unit tests**, **143
API/integration tests**, 24 migration tests, eight owner-tool tests, deployment checks and production
web/server builds. Final test changes also pass scoped ESLint and `pnpm format:check`.
`pnpm verify:ci` passes five policy tests and complete/non-overlapping **983-test inventory**, not
full browser execution. `git diff --check` passes.

The final built-browser command is
`pnpm test:e2e:built tests/e2e/appearance.spec.ts tests/e2e/shell-clock.spec.ts
tests/e2e/phone-navigation.spec.ts tests/e2e/keyboard-layout.spec.ts
tests/e2e/screen-admin-isolation.spec.ts tests/e2e/native-tv-viewport.spec.ts --max-failures=0`,
with output outside Git. Final execution passes all **83 cases in 2.6 minutes**. The initial
new-viewport run passes 12/14 cases and detects a real transient light-theme contrast failure:
Appearance backgrounds fade while text changes immediately. The scoped card/background transition
is removed before repeating the complete code/browser gates; focus and switch transitions remain.
No accessibility assertion is suppressed or waived.

Fourteen new layout/interaction cases cover 1366×768, 1920×1080, 3840×2160, 320×700, 390×844,
844×390 and 820×1180 in light/dark at the built fictional demo `http://127.0.0.1:4320`. They check
the real content width, three same-row TV choices, at least 32-pixel logical choice titles, no TV
page scrolling, one visible clock and no phone dock on TV. Phone/tablet choices remain stacked
without horizontal overflow. Dark selection, persistence/reload, Automatic, dimming, D-pad movement
and Back to More are exercised alongside existing Back/focus restoration. Keyboard reachability
and rail-clock coverage now explicitly include Appearance. The paired-display test retains zero
adult-auth requests and no admin requirement; shared-screen exclusion/legacy alias tests remain.
Page identity, meaningful content, framework-overlay absence, console health and serious/critical
accessibility pass. Browser plugin unavailable; repository Playwright is used. Final compact-TV,
1080p-TV and phone screenshots are visually inspected: the wide screen has its normal rail and
large full-width choices, while the phone keeps its compact stacked controls. Screenshots use
fictional data and remain outside Git.

Physical TCL/remote and actual iPhone Safari confirmation, commit/push, hosted full-suite release
checks and private activation are **not run**. No APK, NAS network/configuration, household data,
credentials, pairings or provider integration changes are made. This is included in the same pending
local update as the screen/admin, phone-navigation and compact People-colour changes.

## Compact People colour disclosures — 2026-10-10

Every existing person and Add someone starts with a collapsed, 52-pixel Colour row showing the
current named swatch. Native `details`/`summary` reveals the existing twelve named radio choices
only when opened. Each form owns its own disclosure and colour draft; closing preserves the
selected value for Save. The preview and radios share one draft value, refreshed defaults do not
overwrite an active edit, and native form reset restores the default value and its preview.
No server/API contract, member capability, persistent preference or avatar behavior changes.

`pnpm --filter @hearth/web exec vitest run src/components/MemberColourPicker.test.tsx` passes
all **eight** tests, including closed form submission, independent people, legacy normalization,
reset and refreshed-default/draft consistency. `pnpm verify:code` passes format, lint, workspace
types, **334 unit tests** (35 shared, 35 core, 71 server, 193 web), **143 API/integration tests**,
24 migration tests, eight owner-tool tests, deployment checks and production web/server builds.
Final test changes also pass scoped ESLint and `pnpm format:check`. `pnpm verify:ci` passes five
policy tests and complete/non-overlapping **968-test inventory**, not full browser execution.

The built-browser final command is
`pnpm test:e2e:built tests/e2e/admin.spec.ts tests/e2e/keyboard-layout.spec.ts
tests/e2e/phone-navigation.spec.ts tests/e2e/screen-admin-isolation.spec.ts --max-failures=0`,
with logs/screenshots outside Git. Final execution passes all **103 cases in 2.9 minutes**.
An earlier People-focused run passes 13 of 14 cases; its remaining test waits for PUT instead of
the existing PATCH member-update receipt. That observer is corrected before the final run, not
hidden or waived. The initial format failure is likewise corrected and the full code gate repeated.

New compact/disclosure checks cover 320×700, 390×844, 844×390 and 1280×720 in light/dark at the
built fictional demo `http://127.0.0.1:4320`. They confirm closed palettes expose no radio controls,
opening one exposes twelve and leaves the others closed, selection updates the named preview,
closing restores the compact height, and there is no horizontal overflow. Native keyboard Enter,
Tab, radio-arrow selection, close, Save/PATCH acceptance and reload prove retained values. Add
someone retains its colour and starts collapsed when reloaded. Page identity, meaningful content,
framework-overlay absence, console health and serious/critical phone accessibility pass in the
final cases. Browser plugin unavailable; repository Playwright is used. Final phone light/dark
previews are inspected outside Git using fictional members: the closed row is compact, its named
swatch is clear, and profile-photo controls stay intact. `git diff --check` and scoped authoritative
document Prettier checks pass.

Commit/push, hosted full-suite release checks, private NAS activation and actual iPhone Safari
confirmation are **not run**. This is part of the pending local update with the screen/admin and
phone-navigation fixes; live household data, people, passkeys, pairings and networking are unchanged.

## Phone navigation scroll correction — 2026-10-10 (D-095 refinement)

The owner reports the bottom phone menu intermittently rising into the middle of the page while
scrolling. Both family and companion shells specify fixed `bottom: 0`, a fixed safe-area-aware
height and a competing `top: calc(100dvh - var(--phone-tabs-height))`. Replace that top calculation
with `top: auto`, leaving the browser one bottom anchor. Keep safe-area padding, trailing content
space, native zoom and the existing editing/keyboard-only visibility rule. No React scroll handler,
polling, household API, authentication change or native APK is needed for this refinement.

The new built-browser regression initially fails against the previous loaded stylesheet with
expected `auto` / received `calc(100dvh - var(--phone-tabs-height))`. This proves the conflicting
anchor, not reproduction of physical Safari's intermittent scrolling behavior. Test-harness
failures from short-page fixtures, ambiguous page/list headings and toggling already-open meal
details are corrected without hiding a test or lowering the scroll threshold. Real fictional
reminder records and seven expanded meal-detail controls ensure substantial scrolling on long
pages; Appearance covers the short-page shell too.

`pnpm verify:code` passes format, lint, workspace types, **329 unit tests**, **143 API/integration
tests**, 24 migration tests, eight owner-tool tests, deployment checks and production web/server
builds. The final test is linted and formatted with that gate. `pnpm verify:ci` checks five policy
tests and complete/non-overlapping **960-test inventory**, not full browser execution.

The final built-browser command is
`pnpm test:e2e:built tests/e2e/phone-navigation.spec.ts tests/e2e/appearance.spec.ts
tests/e2e/photos.spec.ts tests/e2e/weather.spec.ts tests/e2e/remote.spec.ts
tests/e2e/keyboard-layout.spec.ts tests/e2e/native-tv-viewport.spec.ts
tests/e2e/screen-admin-isolation.spec.ts --max-failures=0`, with temporary logs/screenshots outside
Git. Final execution passes all **105 cases in 3.0 minutes**, including all nine new navigation
cases with explicit mobile/touch emulation. The earlier viewport-only focused run separately
passes nine cases; it is not physical-device evidence.

The new tests use Chromium mobile/touch emulation against the built fictional demo at
`http://127.0.0.1:4320`. Profiles are 320×700, 390×844, 844×390 and 820×1180, in light/dark. Each
checks family Reminders, adult Meal planning and local Appearance at four heights and five scroll
positions, including return to the top. The navigation stays at the viewport bottom, last content
can scroll above it, and keyboard Enter on More opens the hub. A separate injected visual-viewport
test keeps navigation for a toolbar-sized reduction, hides it for focused keyboard-sized editing
and restores it without losing the draft. Page identity, meaningful content, no framework overlay,
console health and serious/critical phone accessibility are checked. Browser plugin unavailable;
repository Playwright is used. Desktop emulation and injected geometry are not real Safari toolbar
or iOS keyboard evidence. Final scrolled family/admin screenshots in light/dark are visually
inspected: navigation is docked at the bottom, content stays contained and the trailing records
remain above the menu. `git diff --check` and scoped authoritative-document Prettier checks pass.

Actual iPhone Safari/installed-web-app confirmation, commit/push, hosted release checks and live
activation are **not run**. NAS networking, credentials, data and pairings are unchanged. The
separate locally verified shared-screen/admin boundary remains preserved; both changes await
explicit private release approval.

## Shared-screen administration isolation — 2026-10-10 (D-099)

This is a local security fix on `codex/shared-screen-admin-boundary`, not a live release. The
separate unfinished draft in the primary checkout is reference-only and remains untouched.

- An isolated reproduction of the original boundary returns 401 for a screen credential alone,
  200 for an adult controller cookie, and **200** for mixed screen/adult cookies or Bearer+cookie.
  The fixed boundary returns **403** for mixed display requests and preserves **200** for the
  independent adult controller. Cases cover reversed cookie order, case-varied Bearer, empty and
  malformed display proofs, TV hints and all six first-use/authentication/recovery endpoints.
- A real migrated fixture confirms that private screen contact revokes only a retained legacy
  adult session: removing the display cookie afterward cannot restore that old session (401).
  A second phone session stays valid. Pairing still admits valid scoped family reads/commands;
  existing phones, passkeys, device records and household content are not reset.
- Deferred real-service authentication across pairing returns 403 before new session issuance.
  Browser context bindings reject another browser without consuming the genuine ceremony. Bounds,
  expiry and idempotent cleanup have deterministic regressions. Recovery/first-use commit guards
  and existing verified browser/WebAuthn controls remain covered by the complete API gate.
- All known admin routes, case/encoded/query/hash variants, restored URLs, reload and history are
  excluded before admin chrome/children mount. Calendar Sources, Lists/Meals management, More/System,
  private pairing shortcuts and missing Weather setup links are absent on paired screens. Empty
  Agenda/Week/Month asks an adult to connect calendars from their phone. Device-local Appearance,
  its legacy alias, keyboard/remote theme changes and chore completion/undo remain available.
- Independent read-only review reproduces two additional UI-state gaps: another open admin
  document retaining its old runtime after pairing, and cancelled in-flight exchange still setting
  a device cookie without access refresh. Added browser regressions verify accepted normal/cancelled
  exchange clears both documents to Today, with no admin chrome or passkey/recovery controls.
  Runtime context also wins over stale adult status in signed-out generic-screen entry.

`pnpm verify:code` passes format, lint, workspace types, **329 unit tests** (35 shared, 35 core,
71 server, 188 web), **143 API/integration tests**, 24 migration tests, eight owner-tool tests,
deployment checks and production builds. The focused API command
`pnpm --filter @hearth/server exec vitest run src/companion-auth.integration.test.ts
src/app.integration.test.ts src/companion-auth.browser.integration.test.ts
src/browser-access.unit.test.ts src/calendar-projection.integration.test.ts` passes **84** tests.
`pnpm verify:ci` passes five policy tests and complete/non-overlapping **951-test inventory**;
that is not execution of the full browser suite. `git diff --check` and authoritative-document
Prettier checks pass. No relevant test is hidden, skipped or waived in a passing final gate.

The built-browser final command is
`pnpm test:e2e:built tests/e2e/screen-admin-isolation.spec.ts tests/e2e/device-connection.spec.ts
tests/e2e/runtime.spec.ts tests/e2e/planning.spec.ts tests/e2e/calendar.spec.ts
tests/e2e/weather.spec.ts tests/e2e/remote.spec.ts tests/e2e/keyboard-layout.spec.ts
tests/e2e/appearance.spec.ts tests/e2e/photos.spec.ts tests/e2e/admin.spec.ts --max-failures=0`,
with temporary output outside Git. Final execution passes all **233 tests** in **5.6 minutes**,
including all 11 isolation cases. Earlier broad failures from ambiguous status
selectors and a stale Appearance fixture/extra status read are corrected and are not counted as
passing final evidence. Type/Node-storage fixture failures are likewise corrected before repeating
the full code gate.

Browser plugin unavailable; repository Playwright is used against the built fictional demo at
`127.0.0.1:4320`, with separate real-service API/WebAuthn fixtures. Screen profiles include 390×844,
820×1180, 1920×1080 and 3840×2160. Loaded family surfaces, no admin links, meaningful content,
correct Hearth identity, no framework overlay, console health, serious/critical accessibility and
keyboard interactions are checked. Loading placeholders are not screenshot proof. Final loaded
More screenshots are inspected at TV and narrow-tablet sizes outside Git; they show only Family
and device-local Appearance destinations. Empty-calendar screenshots and assertions prove the
adult-phone guidance and removed Sources shortcut, not unrelated Month overflow/layout acceptance.
None contains private household data.

Physical TCL/iPhone Safari proof, commit/push, hosted full-suite/image publication and live
activation are **not run** for this change. The NAS and its private networking/data/secrets are
unchanged. Release requires explicit approval and the existing exact-commit verified-image path.
Generic unpaired browsers are not permanently hardware-attested: adult access still requires
verified personal passkeys and server capabilities. Television hints can only restrict authority.

## Approved combined display release — 2026-10-09

The owner explicitly approved commit, push and private deployment of D-098 and the D-077 weather
refinement. Application release `5fffd5eca9e868bfacc8d06fba717782dee68513` is pushed to `main` and
`codex/tv-fit-wordmark` and activated on the existing private Synology. The following evidence
supersedes the release-not-run status of the earlier local checkpoints below, not their open
physical-device acceptance gates.

- [Verify Hearth run 37938465472](https://github.com/davidjpramsay/hearth-v2/actions/runs/37938465472)
  succeeds for that exact commit: dependency audit has no known vulnerabilities; format, lint,
  workspace types, 321 unit tests, 140 API/integration tests, 24 migration tests, eight owner-tool
  tests, deployment checks and production builds pass. Five CI policy tests and complete inventory
  coverage pass. All four built-browser shards pass 235 tests each: **940 passed**, no failing,
  flaky or unrun tests. Android TV test/lint/build, both image builds, eight isolated privileged
  release-safety tests and verified image publication also pass.
- The local `pnpm verify` run completes its code and CI gates. Its duplicate full browser execution
  is deliberately interrupted after the exact hosted suite succeeds: 368 passed, one interrupted,
  571 not run, exit 130. It is **not** counted as a passing local full-suite execution. The prior
  final-build 83 focused checks remain separate local evidence.
- `sh /tmp/hearth-stage-preserving-runtime-20261009.sh
5fffd5eca9e868bfacc8d06fba717782dee68513` stages the exact archive with the complete commissioned
  runtime excluded. `ssh -o BatchMode=yes hearth-synology 'sudo -n
/usr/local/sbin/hearth-v2-activate-staged'` exits zero after verified image pull, protected
  stopped-database recovery snapshot, replacement, bridge/DNS verification and readiness.
  Commissioned runtime Compose and environment SHA-256 values are identical before and after.
  Root-owned Compose/network configuration, external household data/photos/secrets, credentials
  and pairings are not replaced or reset. No installer, public exposure or APK rebuild is needed.
- External `/api/v1/readiness`, `/api/v1/runtime` and `/api/v1/health` return HTTP 200 in private
  mode. Health reports the exact application commit and SQLite readiness. Unauthenticated runtime
  correctly withholds household data and reports `requiresSetup: false`. A transient HTTP 502
  observed during container replacement clears; the final private origin is healthy.
- Downloading this run's `browser-build` artifact with `gh run download 37938465472 --name
browser-build` and comparing it with the served files using `cmp` confirms byte-identical HTML,
  entry JavaScript/CSS, Photos JavaScript/CSS and Weather JavaScript/CSS. This checks the actual
  deployed frontend rather than only server version or image availability.
- Playwright CLI reloads the live private `/admin` page at 390×844: Hearth title, meaningful sign-in
  content, no framework overlay, zero console warnings/errors, visible Tab movement from adult
  sign-in to shared-screen connection, and a visually inspected contained screenshot pass. No
  authentication ceremony or pairing request is initiated. Browser plugin unavailable; CLI is used.

Actual TCL display/remote and actual iPhone Safari acceptance of these new layouts remain **not
run**. `adb connect` to the previously approved TV endpoint returns `No route to host`; no network
configuration is changed to bypass it. The existing shell receives the web release through its
normal release detection/reload path. The owner should open Weather and fullscreen Photos on the
TV, and refresh Hearth on the phone, to confirm the physical rendering. This evidence-only follow-up
does not change application code or require another container activation.

## Rail focus and compact ambient clock — 2026-10-09 (D-098)

- Side-menu keyboard/D-pad focus uses an inset outline and stays inside the row without a clipped
  outer glow or focus-induced enlargement. Other screen controls keep their existing focus treatment.
- Fullscreen photos retain native-ratio `contain` display without a viewport-wide focus frame.
  The content-width clock/date/Back control is the single keyboard and screen-reader exit target;
  the transparent full-image click target has no outline and is outside Tab/accessibility order.
- Any remote key, Back, the visible return control or a photo-area click exits immediately and
  restores Start ambient focus. The return control exposes the shared time/date as its accessible
  description. Phone portrait/landscape and television layouts keep the control contained.

The local `pnpm verify:code` gate passes format, lint, workspace types, 321 unit tests, 140
API/integration tests, 24 migration tests, eight owner-tool tests, deployment checks and production
builds, retaining the pending fixed-day weather changes. `pnpm verify:ci` passes five policy tests
and unchanged complete/non-overlapping 940-test inventory coverage, not the complete execution.
`pnpm test:e2e:built tests/e2e/photos.spec.ts tests/e2e/shell-clock.spec.ts tests/e2e/appearance.spec.ts
tests/e2e/weather.spec.ts tests/e2e/keyboard-layout.spec.ts tests/e2e/remote.spec.ts --max-failures=0`
passes all 83 checks (2.5 minutes). Coverage includes inset rail focus across household routes,
ambient entry/exit and restored focus, pointer dismissal, bounded clock backgrounds on five
viewports, TV/phone ambient accessibility, light/dark, reduced motion, cached/corrupt photos and
the pending weather graph regressions. No native APK change is needed for these web styles.

CLI inspection at `127.0.0.1:4326` follows keyboard-only Weather rail focus → Photos → ambient
entry. Rail focus is fully contained, stationary and inset. The clock control measures about
323 logical pixels on TV and 212 on phone, rather than spanning the viewport; 4K retains uniform
application scaling. Six viewports (320×700, 390×844, 844×390, 1366×768, 1920×1080 and 3840×2160)
keep the caption and text contained with no full-image outline/shadow. Correct page identity,
meaningful content, no framework overlay and zero console warnings/errors pass. TV menu, TV ambient
and phone ambient screenshots are visually inspected outside Git.

Owner-supplied HEIC references are inspected through temporary JPEG copies outside the repository;
the Photos library originals are unchanged and never uploaded into Hearth. All rendered automated
checks use fictional local demo assets, not private household photos. Browser plugin unavailable;
repository Playwright and CLI are used. At this local checkpoint physical TCL/iPhone verification,
full hosted release, commit/push and live deployment were **not run**; private NAS, networking,
content and pairings were unchanged. See the approved release evidence above for subsequent status.

## Fixed weather day and proportional graph — 2026-10-09 (D-077 refinement)

- The day axis always runs from household-local midnight through the following midnight, not from
  the current hour. The server returns at most 25 points within the unchanged shared schema.
- A filled dot follows the existing shared minute clock on the forecast curve. Deliberate hour
  inspection has a separate hollow marker and survives clock ticks/reads. **Now** or remote Select
  returns to following; a fresh day resets even an inspection of the old midnight endpoint.
- Missing samples remain gaps; an old cached day is marked stale and receives no live dot.
- Plot geometry uses measured logical width and height, observes the HTML canvas, and falls back
  to window resize when ResizeObserver is absent. Phone controls do not cover the graph; the whole
  day is visible without horizontal scrolling. Existing uniform 4K application scaling is retained.

`pnpm verify:code` passes format, lint, workspace types, 321 unit tests (34 shared, 35 core, 67 server,
185 web), 140 API/integration tests, 24 migration tests, eight owner-tool tests, deployment checks
and production builds. The new regressions cover day bounds at midnight/noon/late evening,
timezone conversion, clock progression, inspection, rollover, observer ownership and missing hours.
Initial test-harness failures (cleanup, hidden desktop controls and types) are corrected and the
entire gate is repeated; those failed runs are not passing evidence. `pnpm verify:ci` passes five
policy tests and the unchanged complete/non-overlapping 940-test inventory, not its execution.

Built-browser verification uses `pnpm test:e2e:built tests/e2e/weather.spec.ts
tests/e2e/calendar-weather-settings.spec.ts tests/e2e/remote.spec.ts tests/e2e/shell-clock.spec.ts
tests/e2e/keyboard-layout.spec.ts --max-failures=0` passes all 45 checks on the final build (1.3
minutes), including remote Select/Now, modes, boundaries, stale weather and accessibility.
Local CLI rendering at `127.0.0.1:4326/weather`
uses only fictional demo data: 320×700, 390×844, 844×390, 820×1180, 1180×820, 1366×768, 1920×1080
and 3840×2160 are contained. The dot remains 12×12 logical pixels, uniformly 24×24 on 4K, and
television content remains one-screen. An initial 4K geometry assertion incorrectly compares
physical transformed bounds with logical SVG coordinates; the corrected check compares client
dimensions and independently checks equal dot dimensions. Final phone, TV and compact dark TV
screenshots are visually inspected outside Git. Page identity, meaningful content, absence of an
error overlay and zero console warnings/errors pass; phone hour inspection and Now restoration
retain the separate live dot. Browser plugin unavailable; repository Playwright and CLI are used.

At this local checkpoint no private household, authentication, calendar, TV pairing, NAS configuration
or network state was changed. Full 940-test execution, hosted images, commit/push, live deployment,
physical iPhone Safari and physical TCL weather acceptance were **not run**. See the approved release
evidence above for subsequent status; actual Safari/TCL acceptance remains open.

## Compact phone setup and NAS-owner repair (D-097) — 2026-10-09

- Compact named adults and connected screens replace recovery warnings and technical key inventories.
  Key/recovery controls remain under Advanced. A protected final key has a visible explanation,
  not an inert Remove button.
- Explicit setup verifies the new key and current administrator authority, preserves permissions,
  atomically replaces only the initiating browser session and clears its old private caches.
  Omitted/false intent retains legacy behavior; tokens remain cookie-only.
- Local owner recovery requires OS administrator authority, existing database access, a checked
  private online backup and an exact active adult. Grants are 128-bit, digest-only, 15-minute and
  one-time. Issuance touches no key/session; public recovery still requires a verified new passkey.
  No public owner bypass, household reset or networking change is permitted.
- Obsolete-screen cleanup preserves the chosen TV, history and system audit. Invalid/foreign/retained
  targets reject atomically and repeats are inert.

Eight operator tests pass locally and on DSM Python 3.8. Live cleanup creates a checked private
online backup, revokes exactly three owner-confirmed old browser connections and reads back one
active native Google TV paired 2026-10-08, with three system audits. Adult keys/sessions/permissions,
content and networking are unchanged. New UI release and David/Rachael's independent physical
sign-ins are not proved by this metadata-only checkpoint.

Local release checks: `pnpm verify:code` passes formatting, lint, types, 302 unit tests, 140
API/integration tests, 24 migration tests, eight owner-tool tests, deployment checks and production
builds. The operator-issued fixture is consumed through normal verified recovery, cannot replay,
and leaves the other adult's session active. The optional phone-setup path passes session-isolation,
cookie-only transport, legacy behavior and revoked/demoted/archived commit-time rejection tests.
`pnpm verify:ci` passes five policy tests and complete non-overlapping 940-test inventory coverage;
`pnpm audit:dependencies` reports no known vulnerabilities. `git diff --check` passes.

`pnpm test:e2e:built tests/e2e/device-connection.spec.ts tests/e2e/admin.spec.ts tests/e2e/runtime.spec.ts`
passes all 75 browser checks (2.4 minutes), including phone/TV/4K light/dark layouts, accessibility,
private entry, confirmation/cancel, lost-reply retry, history and keyboard/D-pad. Earlier runs stop
on obsolete text selectors and a clipboard action now intentionally hidden under address help;
they are failed runs, not release evidence. The repeated run opens that help and checks its actual
fallback, without weakening the assertion. The CLI captures fictional two-adult/one-TV renders at
393×852, 844×390 and 1920×1080, verifies page identity, containment and zero console warnings/errors,
and exercises named-adult setup selection plus keyboard movement. Screenshots stay outside Git.
Browser plugin unavailable; repository Playwright and its CLI are used. Hosted verification,
publication, exact live activation and actual iPhone Safari sign-ins remain separate gates.

Live release checkpoint: canonical application commit `7a20a2ef65e723053353b042641fdc9ba6452968`
passes hosted Verify Hearth run `37894968640`, including all 940 browser tests, Android, containers
and verified image publication. Exact server/web images are activated on the private NAS; external
readiness/health return ready/private with the expected version and migration 27. A premature
activation is rejected before restarting anything because staging is unfinished; staging subsequently
completes and the guarded retry succeeds. A transient 502 during the deliberate container replacement
is recorded, not treated as a persistent outage. Commissioned runtime Compose and the installed
release/firewall/update-hook hashes remain unchanged. One active native Google TV remains.

The owner then explicitly requests **reset all passkey sign-ins** after reporting that no saved key
is recognised. A separately tested, exact-household NAS-owner transaction takes a checked private
backup, revokes one remaining active passkey, one phone session and one unused recovery code, and
atomically issues a fresh digest-only recovery grant for David. It retains all credential/audit
history, both adult accounts, household content and the chosen TV. Readback proves zero active
passkeys, zero phone sessions, two adult accounts and one active screen; health remains ready.
The reset fixture passes locally and on DSM, including changed-key rejection/rollback, unrelated
household isolation, retained TV/content, recovery and system audit. This is a data-maintenance
operation, not another application deployment or authentication disablement. New Face ID/passkey
enrolment and independent sign-in for David and Rachael remain **not run**. A prepared private code
handoff requires the owner to open it; native Finder/TextEdit automation fails and Terminal control
is unavailable, so code visibility is not claimed. No recovery code or credential is put in chat.

## Adult controllers and shared-screen clarity (D-096) — 2026-10-09

`pnpm verify:code` passes formatting, lint, type checks, 301 unit tests (including ten new controller
access tests), 137 API/integration tests, 24 migration tests, deployment scaffolding and production
builds. `pnpm verify:ci` passes five policy tests and preserves all 940 browser tests in four
non-overlapping shards. `pnpm audit:dependencies` reports no known vulnerabilities; authoritative
document formatting and `git diff --check` pass.

The initial broader 265-test browser run stops after one connection-flow failure: after connecting
and then disconnecting a screen, both old and new success messages remain. It records 256 passes
and eight unrun tests, not a passing gate. Clear completed approval feedback after disconnection,
clear completed disconnection feedback before a new approval, and clear the accepted code; retain
immutable command identities for unanswered requests. The repeated command
`pnpm test:e2e:built tests/e2e/device-connection.spec.ts tests/e2e/admin.spec.ts tests/e2e/runtime.spec.ts`
passes all 75 tests, including the failed flow, role guidance, history, confirmation/cancel, expired
codes, exact lost-reply retries, private access boundaries and keyboard/D-pad checks.

Local fictional-data rendering at 393×852, 844×390 and 1920×1080 shows readable entry/hub/access
screens. The browser suite also covers 320×700, 390×844, 820×1180 and 3840×2160, light/dark modes and
accessibility. CLI inspection verifies page identity, meaningful content, no framework overlay,
horizontal containment and zero console errors/warnings. Manage adult sign-in → Adult access →
Back, confirmed demo-screen disconnection, collapsed/expanded inert history and Enter to collapse
are exercised. Browser plugin unavailable; repository Playwright and its installed CLI are used.
Screenshots contain fictional data only, remain outside Git and do not prove iPhone Safari.

Live cleanup is blocked on authenticated UI access while the owner's Mac is locked. No live screen,
passkey, session, permission, household record, networking or NAS configuration is changed.
David's and Rachael's physical passkey enrolment/sign-in and controller permissions remain open;
identify exact obsolete active-screen targets before revoking them. Publication/deployment and
full hosted verification of this new revision remain separate release gates.

## Phone fit and bottom navigation (D-095)

- Long phone dates and event titles remain inside the viewport, including narrow and zoomed layouts.
- Last content can scroll above the full navigation/home-indicator area. Browser-toolbar resizing
  retains accessible navigation; focused editing with a keyboard-sized visual-viewport reduction
  hides the bar and dismissal restores it without changing the draft or zoom.
- Physical iPhone acceptance covers Safari toolbar expansion/collapse, keyboard dismissal, native
  date controls and an installed home-screen web app. Desktop emulation cannot close these gates.

Local checkpoint on 2026-10-09: web type checking, scoped ESLint, production build and
`git diff --check` pass. Chromium mobile
rendering at 393×852, 393×650, 320×700 and 844×390 shows no horizontal document overflow; a long sample
date/title remains contained and the bar follows viewport height. Today → More → Reminders opens
the form. Injecting a 360-pixel visual viewport while its text input is focused hides navigation;
restoring the actual viewport restores it. This is simulated geometry, not an iOS keyboard run.
The built preview also renders at 1920×1080 with the TV rail visible and phone tabs hidden. At the
end of the 393×852 page, the photo bottom is 740 and navigation top 780, leaving content accessible.
Inspected screenshots show the intended layouts; page identity, meaningful content and console
checks pass with no framework overlay or errors. Screenshots and CLI artifacts stay outside Git.
Browser plugin unavailable; the installed Playwright CLI is used with fictional local demo data.
Unit/browser suites, physical Safari and live NAS deployment were unrun at this initial checkpoint.

## Foreground TV display retention (D-094)

- While Hearth is resumed, its window requests screen retention; pausing releases that request.
- Normal system screensaver settings, manual standby and independent media playback are preserved.

Physical TCL checkpoint on 2026-10-09: `assembleDebug` succeeds and the APK signing certificate
matches the prior installed package. `adb install -r` succeeds without re-pairing; installed/local
APK SHA-256 matches `91999a1994ce543dd8de1ea3ab2af3a44a31679d799b2be1c2ed70bd83790fd2`.
The paired Today screen is visually inspected. Window readback shows `KEEP_SCREEN_ON` while Hearth
is foregrounded, no flag after Home, and the flag restored after returning to Hearth. Jellyfin's
existing process remains active and playing with its three-item queue. The ten-minute system
timeout and enabled screensaver remain unchanged. `git diff --check` passes. Unit/browser suites,
an unattended full idle interval and overnight/manual-standby acceptance are not run for this change.
Screenshots remain temporary private evidence, outside Git. At this initial checkpoint the TV APK
is installed, source is local, and no NAS/web release or network change is made.

## Reviewed TV/phone release preparation — 2026-10-09

Review retains the prepared foreground window flag and responsive phone changes. It adds 21
deterministic keyboard-hook tests covering editing focus, textarea/content-editable controls,
non-keyboard inputs, toolbar-sized changes, the 150-pixel threshold, zoom, layout-height changes,
companion breakpoints, unavailable VisualViewport, event coalescing and subscription/frame cleanup.
An initial jsdom run exposes an undefined content-editable predicate; requiring an explicit `true`
keeps the result boolean and the repeated hook suite passes. No draft value is read by the hook.
The older roadmap and overnight-static-display assertion are aligned with the explicitly approved
foreground choice rather than silently contradicting D-094.

`pnpm verify` passes format, lint, types, 291 unit, 137 API/integration and 24 migration tests,
deployment checks, production builds, five CI-policy tests, complete non-overlapping browser shard
coverage, and all 940 built-browser tests (20.2 minutes). `pnpm audit:dependencies` reports no known
vulnerabilities. `pnpm verify:tv` passes 14 JVM tests, Debug/Release lint and both APK builds.
The rebuilt debug APK still has the exact previously physically verified SHA-256 above, so no
reinstallation is needed. `git diff --check` and scoped authoritative-document formatting pass.

An isolated built preview at `127.0.0.1:4324`, using its own fictional demo API/database at port
4314, passes rendered inspection at 393×852, 393×650, 320×700, 844×390 and 1920×1080. A deliberately
long visible date wraps to two lines at 320 pixels and a long event title remains inside its card.
Today → More → Reminders, simulated keyboard hide/dismissal and draft retention pass, with no page
or console errors. After scrolling, the final reminder ends at 723.22 pixels above navigation at
780 pixels. The TV layout remains one-screen with its rail visible and phone tabs hidden. Browser
plugin unavailable; Playwright CLI and repository tests are used. Temporary screenshots contain
fictional data only and are not committed.

Hosted container verification/publication and private Synology activation remain separate steps;
local success does not authorize an unverified image or replacement of commissioned networking.
Physical iPhone Safari toolbar, real keyboard/date controls and home-screen-web-app checks remain
unverified, as do a full unattended TV idle interval and overnight/manual-standby recovery.

## Family Games acceptance

- Validate the owner's complete supplied archive without copying it into source, fixtures or images.
- Sixteen tiles form four groups; allow four misses, report three-of-four, and do not penalize an
  identical repeated guess. Correct groups lock; terminal states reveal results and allow replay.
- Shuffle preserves selections/identity. Archive number/date search, pages and earlier/later work.
- Progress survives reload and puzzle switching on the same device; malformed/blocked storage
  remains playable. Another household or changed board cannot inherit that progress.
- The requested v1-only reset starts at #1 without changing unrelated storage. Persisted completions
  appear in ascending Archive and survive replay/attempt eviction. Later visits resume the last
  successfully loaded board (D-117), including untouched choices and finished results; absent saved
  boards fall back safely. A win stays visible until **Next puzzle** or replay is chosen.
- Private reads require the existing household passkey/display authority; failed imports expose no
  source paths and cannot slow startup, reveal household data or take down other modules.
- Test mobile, tablet, 1080p/4K, light/dark, keyboard/D-pad/Back, focus restoration and accessibility.
- Live NAS data installation, signing/physical-device checks and automatic daily archive updates
  are not established by local browser tests.

Games evidence as of 2026-10-06: `pnpm verify:code` passes format, lint, types, 267 unit,
137 integration/API and 24 migration tests, deployment validation and production builds.
`pnpm verify:tv` passes unit tests, Debug/Release lint and both APK builds. `pnpm verify:ci`
proves complete, non-overlapping coverage of the 933-test inventory; it does not run those tests.
`pnpm test:e2e:built tests/e2e/games.spec.ts tests/e2e/games-remote.spec.ts tests/e2e/remote.spec.ts tests/e2e/appearance.spec.ts tests/e2e/keyboard-layout.spec.ts --max-failures=0`
passes 73 tests. This covers light/dark phone portrait/landscape, tablet, short TV, 1080p/4K,
page/console health, serious/critical accessibility, a fully remote-only solve/Back flow,
archive pagination/search, focus, storage failures, loaded-board offline play, guesses and reloads.
The Desktop archive independently passes the production parser for all 1,213 puzzles; an isolated
local browser also checks the actual newest/oldest boards and a correct imported group.
Only original demo content is used in screenshots and committed tests. The Browser plugin is not
available; the repository Playwright workflow is used. `git diff --check` passes. The full 933-test
suite, container image rebuild and physical hardware are not run for this addition. No puzzle data
is committed/published or installed on the live NAS, and this feature is not pushed or deployed.

Progression/reset refinement on 2026-10-06: `pnpm verify:code` passes format, lint, types,
270 unit, 137 integration/API and 24 migration tests, deployment validation and production builds.
`pnpm verify:ci` proves the updated 935-test inventory is completely and uniquely sharded; the
full inventory is not executed for this refinement. The built browser command
`pnpm test:e2e:built tests/e2e/games.spec.ts tests/e2e/games-remote.spec.ts tests/e2e/games-progression.spec.ts tests/e2e/appearance.spec.ts --max-failures=0`
passes 40 tests, including the scoped legacy reset, completion/replay/resume, phone archive
containment and remote-only solve/Back. Phone completion badges are visually inspected using
original demo content. The supplied 1,213-puzzle archive also passes an isolated browser check of
the first-puzzle default, newest archive selection, actual puzzle completion and next-puzzle resume,
with no page errors. That standalone check initially read a previous board before navigation had
settled; waiting for the selected number and expected tile count fixes the test synchronization.
Physical devices and live NAS deployment are not run for this refinement.

Owner-approved release preparation on 2026-10-08: the current preserved Games work passes
`pnpm verify:code` (270 unit, 137 API/integration and 24 migration tests plus format, lint, types,
deployment validation and production builds), `pnpm verify:tv`, and `pnpm verify:ci` (935 distinct
browser tests in four non-overlapping shards). The built browser command covering Games,
Games remote/progression, Appearance, production bootstrap, Remote and keyboard layout passes
79 tests in 2.3 minutes. TV light and phone dark demo screenshots are visually inspected; the
1,213-puzzle private archive independently passes first-puzzle, archive selection, completion and
next-puzzle checks. Today's dependency audit initially rejects sharp 0.35.4; the narrow 0.35.5
patch passes the repeated code gate and `pnpm audit:dependencies` reports no known vulnerabilities.
Hosted verification, image publication, private archive installation and physical TCL acceptance
remain pending at this source checkpoint. The archive is excluded from Git and public images.

The first hosted Games candidate is correctly blocked by the existing rail-clock geometry test:
the scrollable navigation's negative top margin extends four pixels into the clock box. This is
reproduced locally, corrected by keeping only horizontal/bottom negative margins, and the same
clock check now includes Weather, Reminders and Games. The rebuilt focused Games, remote,
production-bootstrap and shell-clock suite passes 26 tests in 44.9 seconds. Failed candidate
`ae3c1e5` publishes no images and the on-host verification guard starts no live installation.

Owner-approved live release checkpoint on 2026-10-08: hosted run `37755078289` passes all jobs,
including all 935 browser tests and publication of the exact `7cfd04d` images. The protected Synology
helper activates that release; external readiness/health pass in private mode. The owner's archive
is installed only in private data. Authenticated readback from the paired physical TCL returns
`ready`, `household-archive` and 1,213 puzzles with no-store caching. The stopped-database recovery
guard passes; the effective network identity, existing DNS/firewall helper and unrelated containers
are unchanged. Installer preflight mistakes stop before replacing the running release and are
corrected/tested; these stopped attempts are not successful deployments.

TV-shell repair checkpoint on 2026-10-08 (D-093): `pnpm verify:tv` passes 14 JVM tests, both lint
variants (zero errors) and Debug/minified Release builds. `pnpm build`, `pnpm format:check`,
`pnpm lint`, `pnpm verify:ci` and `git diff --check` pass; CI inventory covers 940 tests, not a full
940-test execution. The focused built-browser command for `native-tv-viewport`,
`production-bootstrap`, `games-remote` and `shell-clock` passes 13 tests. Its four new behavior cases exercise
the exact Kotlin script under strict CSP, with the server sizing script disabled, at density-two
1080p/4K, plus missing-meta/idempotent fallback and subframe exclusion; another check asserts
the 320×180 banner, 160×160 icon PNGs and manifest mapping. Browser plugin unavailable;
repository Playwright used. Phone shell-clock and normal-browser startup remain covered.

The repaired matching debug APK is installed with `adb install -r` on the physical Android 12 TCL
without re-pairing. New-process launch and fresh reload report 1920×1080, DPR 2, scale 0.5 and the
native marker. Today/Games are contained, the TV rail is visible, phone tabs absent, and a reload
reports zero page/console/log errors. Actual D-pad events reach Games from Today, select/deselect
tiles, and close Archive with Back to its opener; no guess or household mutation is submitted.
Screenshots are inspected locally and kept out of Git because they contain private household or
supplied archive content. Both installed icon/banner resources resolve to the new bounded
wordmarks, and the isolated banner render is inspected. Final launcher-cache display confirmation
is pending while the household uses other TV apps. Overnight standby, forced network loss, APK
release signing/distribution and complete physical-TV commissioning remain not run.

Launcher identity correction on 2026-10-08 retains the original transparent Hearth fern to the
left of the wordmark in both bounded resources. Native composition tints it cream; the original
mark and web branding remain unchanged. `node apps/tv/design/render-launcher.mjs --check` verifies
both committed PNGs against their native source composition. The same focused browser command
passes 13 tests, now also asserting visible fern pixels, both source references and exact
source/raster agreement; an initial assertion incorrectly compared scaled icon area with width,
then passes after correction to an area-proportional threshold. `pnpm verify:tv` passes the 14
JVM tests, Debug/Release lint and both builds; format, lint and `git diff --check` pass. Both
isolated renders are visually inspected. `adb install -r` succeeds without changing pairing;
APK resource readback confirms the xhdpi icon and banner mapping. A read-only physical screenshot
still shows the old launcher artwork while its settings panel is open. Launcher display refresh
is not proved, and no launcher settings, data or foreground navigation are changed to force it.

## Per-change definition of done

A change is complete only when:

- behaviour and out-of-scope boundaries are clear
- contracts and migrations are documented
- relevant automated tests pass
- typecheck, lint and production build pass
- changed UI is rendered and inspected at relevant viewports
- D-pad/keyboard-only navigation is exercised for changed television surfaces
- loading, empty, stale, offline and error behaviour is considered
- no secrets or private provider payloads appear in source, bundle or logs
- authoritative documents are updated when a contract or decision changed
- the handoff names exact passed, failed, blocked and not-run checks

## Product acceptance scenarios

### Launch and navigation

- The native TV shell retains its 1920×1080 logical canvas at density two after cold launch,
  reload and route restoration even when the server sizing script is unavailable. Phone tabs stay
  absent, the TV rail remains accessible, and the script never marks/resizes subframes.
- The physical launcher displays a legible Hearth wordmark in a correctly proportioned tile;
  installing a repair preserves pairing and local preferences.
- Cold launch reaches useful cached/current Today content within the product performance target.
- Resume after overnight television standby restores Hearth without manual process recovery.
- Every primary screen is reachable with D-pad and Back.
- Focus never disappears, becomes trapped or lands behind an overlay.
- Every current household and admin route remains horizontally contained at television, tablet and
  phone sizes across both themes; household television routes retain a visible D-pad focus target
  and admin forms retain ordinary keyboard focus.
- At desktop widths, administration presents a persistent settings rail and a wider content canvas;
  at phone widths the rail is absent and the existing bottom navigation remains available.
- Opening any setting from More and returning with header/browser/remote Back restores More with
  the same destinations and row sizes, not the separate settings overview. Nested settings return
  through their actual opener; reload retains the route history. Header Back creates no duplicate
  menu/history loop, focus returns to the opener and directly opened settings keep a safe parent.
- At 820×1180 and 1180×820, household routes use companion navigation instead of the television rail;
  portrait Admin keeps the compact flow and landscape Admin uses the persistent settings rail.
- Resuming Hearth after normal Google TV app switching restores the previous Hearth screen or a documented safe default.
- Demo/test dates are deterministic, while private mode derives today, Monday
  week start and current month from the configured household timezone.
- A new private database contains no fictional household or planning records,
  exposes an explicit setup-required launch state and does not enable demo
  reset/scenario commands.

### Calendar

- Events from multiple enabled calendars retain correct owner/source cues.
- Month reserves up to two readable colour-coded event previews and one exact remaining-events
  count inside each date cell, with no clipping or overlap. The ordinary TV grid fits a viewport;
  unusually short/message-heavy screens may scroll rather than shrink or hide cell contents.
  A separate avatar/label key identifies each colour. TV OK and phone tap open a complete day
  dialog; focus alone never opens it. Event details and Back/Close restore the exact event/date.
- Month is reachable below Week with D-pad navigation; Back restores Week and the prior rail focus, while the phone exposes a Week/Month switch.
- Calendar opens Agenda by default, with Agenda, Week and Month tabs in that order on TV and phone.
- Week, Month and Agenda are views beneath one Calendar primary destination on
  television and phone. Every view is reachable with D-pad/keyboard-only input;
  legacy Week/Month links redirect without losing scenario/date query state.
- Agenda shows exactly four household-local dates—today plus the next three days—with no past,
  fifth-day-or-later content or period navigation.
- Earlier, current-period and later controls issue the requested week/month
  query, and Calendar source setup is directly discoverable without searching
  the general settings list.
- Empty weeks retain date navigation on television and phone. Multi-day cards have unique
  per-date focus targets, and the last card can move down to week navigation.
- Selecting an Agenda/Week event exposes its available time, source/person and
  location in a family-readable detail surface; Back closes it and restores the
  exact event focus.
- All-day events appear on the correct Perth local dates.
- Week keeps all-day cards in an aligned band above the hourly timeline. Simultaneous timed cards,
  including collisions created by their minimum readable height, render in separate deterministic
  lanes and remain individually selectable with D-pad/keyboard input, directly or through `+N more`.
- Week expands its shared clock axis for off-hours plans without painting cards outside the grid.
  It caps all-day rows and simultaneous timed lanes at two, and overflow opens the full day list.
  The list retains all events offline, traps Tab focus, and restores the exact row/opener on Back.
- Overnight plans use household-local daily segments and continuation labels. Midnight-exclusive
  endings do not repeat on the following day, and details show both dates/times where needed.
- Events created in a daylight-saving region display at the correct Perth time.
- Recurrence exceptions and cancellations do not resurrect.
- An unavailable provider leaves cached events visible and clearly marked stale.
- Today, Week and Month fetch on entry, refresh every five visible minutes and
  refresh immediately after browser reconnect or calendar settings changes.
  A failed refresh retains the last successful event data while showing the
  provider's stale/unavailable state.
- A write conflict is explained and never silently overwrites the provider.
- An adult can test a private HTTPS CalDAV account, select exact calendars,
  assign optional people, save, reload and remove the connection from the phone
  companion. Passwords and raw collection URLs never appear in responses,
  SQLite, screenshots or logs; child and unauthenticated setup are rejected.
- Every connected source permanently shows calendar name, assigned person and
  display colour. Reassigning a source updates Week/Month owner identity and
  member-derived colour without reconnecting or re-entering the CalDAV password;
  Whole family uses the family presentation.
- An adult can add or remove selected calendars from an existing connection by
  using **Edit calendars**. Hearth rediscovers the account with the server-side
  credential and never returns or requests that credential in the browser; the
  revised exact allowlist survives reload and restart.
- An adult can search a suburb/postcode or use the phone's one-time location,
  inspect the resolved label and advanced coordinates, test current conditions,
  and save the location separately from timezone. The saved location survives
  restart and takes precedence over environment fallback coordinates.
- With a tested weather location configured, Today shows current local conditions and
  Week shows normalized daily forecasts without provider branding on household-facing dashboards.
  Provider attribution remains visible in adult Weather settings. Coordinates never enter
  TV/forecast responses or logs. A provider outage retains the last safe forecast and a first-load
  failure leaves calendar and household content usable with an unavailable weather cue.

### Weather

- Weather appears immediately after Calendar in television and phone navigation.
- Current conditions include temperature, apparent temperature, today's low/high, condition, rain
  likelihood and wind. The forecast response exposes a family-readable location but no coordinates.
- The 24-hour graph switches between Temperature, Rain and Wind. D-pad Left/Right changes the
  selected hour and Up/Down changes mode; the same modes and hour controls are touch-operable on a
  phone.
- Temperature distinguishes actual and apparent values, Rain combines probability with the selected
  hour's expected millimetres, and Wind distinguishes sustained speed and gusts with direction.
- Seven daily rows use one common temperature scale and Today marks the current temperature.
  Each row shows daily maximum wind speed in km/h and prevailing direction, with calm and missing
  data distinguished. Wind remains readable on a phone without horizontal overflow.
  Calendar Week shows compact icon/rain/low-high summaries without temperature bars or empty-day
  dashes. Calendar event surfaces remain opaque in both themes.
- A failed refresh retains the last successful forecast with a quiet stale cue. With no configured
  or cached forecast, Weather offers the household settings path without breaking Today or Calendar.
- The Weather screen has no page-level horizontal overflow at 1920x1080 or 390x844, passes serious
  and critical automated accessibility checks, and is inspected in both colour schemes.

Phase 3 evidence as of 2026-08-03: the first five read/degraded-mode scenarios
are automated against the fake adapter, SQLite cache and rendered Today/Week/Month
surfaces. The selected CalDAV/iCloud adapter additionally has contract coverage
for exact allowlisting, HTTPS-only configuration, bounded recurrence expansion,
all-day projection, authentication failure, malformed payload recovery and the
persisted Today query. A credentialed iCloud read remains intentionally not run
until the owner supplies an external app-specific credential and calendar
allowlist. Write-conflict behaviour remains intentionally untested because no
write scope or write implementation has been approved.

Calendar-setup evidence as of 2026-08-08 adds shared-schema, Fastify,
SQLite-restart/idempotency, migration, permission, secret-scan, responsive
Playwright and accessibility coverage using the fake verifier. It does not
constitute live iCloud validation.

Calendar-navigation evidence as of 2026-08-09 adds 1366×768 and 1920×1080
television, 390×844 and 844×390 phone, D-pad/Back, route compatibility,
date-navigation, event-detail focus restoration and automated accessibility
coverage. Browser-plugin control was unavailable, so the installed Playwright
Chromium fallback produced the retained evidence.

### Hearth reminders

- Reminders are household-owned and require no Apple account, companion app, EventKit permission or
  external reminder source.
- A household member can create a reminder with a title and optional date, edit it, complete it,
  reopen it and remove it after confirmation.
- Retrying a create, update, completion or deletion request does not duplicate the mutation and
  returns the original typed result.
- Every accepted mutation records a safe audit event; rejected or unauthenticated writes change
  neither reminder state nor receipts.
- **Open** is the default view and **All** may reveal completed reminders. Date-only reminders do
  not display a fabricated time.
- Open/All is reachable from the reminder list and navigation using arrows without Tab or touch,
  including an empty list. Switching filters retains visible focus and works from loaded data
  offline; text and date fields keep their native editing keys.
- Today reports the total open count, previews overdue items before due-today, undated and future
  items, links to Reminders and shows **No open reminders** only when the count is zero.
- The dedicated page and Today module pass typed integration, television/mobile rendering,
  accessibility and D-pad/Back checks.
- The former Apple pairing/snapshot endpoints are absent. Migration `0027_native_reminders.sql`
  removes the old source, device, projection and receipt tables including credential hashes.
- The retired proof remains only under `hearth/archive/apple-reminders-bridge/` and does not enter
  active builds or deployment images.

### Household people

- An adult administrator can choose either a portrait or landscape profile photo, position its
  square crop, save it, replace it and restore the original member avatar.
- The normalized profile photo survives server restart, remains below the size limit and is served
  from a same-origin opaque URL without exposing a source path or original image.
- Child/guest mutation is rejected; retrying the same command is idempotent; audit summaries and
  logs do not include base64 image data.
- The phone-sized crop dialog supports direct drag plus two-finger pinch zoom without visible
  position sliders. The crop surface remains keyboard-accessible with arrow, plus/minus and reset
  controls, and failures stay family-readable and inline.

### Chores and pocket money

- One remote Select completes one pending occurrence and offers undo.
- A retried voice/automation request does not create a second completion.
- Editing a recurring chore does not rewrite past completions.
- An adult can select one or more people on a chore schedule. A multi-person schedule is returned as
  one grouped template but generates one distinct occurrence per selected person; completing one
  occurrence leaves every other person's copy pending and preserves independent pocket-money totals.
- An adult can create a one-off chore for a household-local date, archive any active chore only
  after confirmation and restore it from today. Archiving withdraws unfinished occurrences already
  due today while completed occurrences remain visible. Command retries replay safely, same-day
  restore returns withdrawn copies to pending and the archived interval produces no retroactive jobs.
- An adult can add an optional available-from time, due time or valid two-ended window to future
  schedules. Reversed windows are rejected with a stable validation error.
- An adult can move active schedules earlier or later from the phone. The saved order includes every
  active template exactly once, appends newly created schedules and survives restart/retry.
- Generated occurrences retain their snapshotted window and order after a later template edit or
  reorder; future ungenerated days use the new values.
- An adult can then reasonedly skip, excuse or
  reassign a pending occurrence from the phone. The occurrence detail shows its snapshotted
  description, time window and newest-first immutable history after restart.
- Skip remains incomplete and eligible for pocket money, excuse is excluded, and reassignment moves
  responsibility. Retrying the same request cannot apply the change or create history twice.
- The television renders compact available/due metadata in the saved order but keeps
  completion/undo as the only ordinary chore actions; ordering, exception and history controls
  remain phone-first.
- An adult can reverse an accidental completion with an audit trail.
- In phone administration, an adult can mark a pending occurrence from an earlier day in the
  current Monday–Sunday week complete, or undo its completion. The correction updates pocket money
  through the existing typed, idempotent and audited chore command.
- The earlier-chore correction list shows only the current week and is empty each Monday. Older
  occurrences and their audit history remain durable and are not deleted at the week boundary.
- A child cannot modify another person's history or household rules without permission.
- Every participating child has a required weekly amount and payday in phone administration. The setting persists across weeks and server restarts, repeats until an adult changes it and is visibly described as set-and-forget.
- Chores shows each child's completed/total count for the complete Monday–Sunday schedule,
  percentage and proportional amount due without requiring scroll on the primary television
  layout. A Monday completion cannot report 100% while that child still has chores scheduled later
  in the week.
- On a day with no due occurrence, each child remains visible with weekly pocket-money progress and explicit unscheduled-day wording; private households never expose a demo-bootstrap action.
- Completing and undoing a chore updates that running total through the same typed chore contract.
- Excused and cancelled occurrences do not reduce the percentage; skipped occurrences remain incomplete.
- Pocket-money administration defaults to the current Monday–Sunday week and uses one labelled selector for current and past-week review. Standing amount/payday settings remain separate from the selected review week, and no future-week control is shown.
- A payment snapshots the counts, percentage and amount, supports an optional note and is idempotent on retry. Multiple partial disbursements are allowed, but their non-voided total cannot exceed the amount due.
- Paid, partially paid and unpaid/building states are explicit. A missing weekly amount/payday produces a named setup warning for each affected child.
- An adult can correct a mistaken payment only by recording a reasoned, audited void. The original payment and void remain visible after restart, and retrying the same void request does not create another correction.
- Before payday, the payment control clearly warns that early recording is allowed.
- Star balances, per-chore points, reward choices and redemptions are absent from the active UI and API.

### Lists and meals

- Items can be checked with one obvious action.
- Voice addition handles exact duplicates and ambiguous list names safely.
- An authenticated adult can create, rename, type, colour, order, archive and
  restore a list from the phone, while the final active list is protected.
- An authenticated adult can edit an item's text and quantity, reorder or
  remove it, and clear checked items only through an explicit confirmation.
  These commands are idempotent, audited and survive restart.
- The television list surface does not expose dense administration controls.
- Today's meal is visible without entering the Meals module.
- The TV's meal actions reach real companion management destinations while keeping dense editing
  out of the television path.
- An authenticated adult can edit multiple dinners and optional notes in one phone-friendly weekly
  form; one save updates the displayed week atomically and survives restart.
- An adult can copy the previous week or clear the current week only through an explicit
  confirmation. Retrying the same request ID replays the original result without duplicate entries
  or audit events.
- Saved family meals can be created, searched, favourited, updated, archived and restored with
  optional preparation time and notes. Archived meals remain understandable in historical plans.
- Permission, invalid-week, copy-conflict and fail-next/retry paths return stable family-readable
  errors and leave the plan consistent.
- Long-form editing is comfortable from the phone companion; the primary seven dinner fields stay
  visible together while saved-meal and note controls expand only when needed.
- A remote meal update preserves dirty dates, refreshes untouched dates and blocks Save for actual
  dirty-date conflicts until the adult explicitly keeps their edits or takes the latest dinners.
- Meals follows Sunday-to-Monday rollover automatically unless intentionally browsing another week;
  This week resumes following and a browsed date is never misleadingly labelled Tonight.
- Losing a reply after an accepted reminder, payment or list addition retries the original intent
  without duplicate records; failed additions retain entered values and success preserves newer typing.
- Retrying an unanswered household, pocket-money settings or meal-week save preserves newer edits;
  a confirmed earlier dinner save rebases retained drafts without inventing a remote-edit conflict.
- Concurrent chore/list commands track each pending record. One failure restores only that record
  and cannot undo another optimistic or successful command.
- A stream reconnect while the browser remains online catches up changes missed during the gap.
- Initial runtime reads retry transient failures twice (five seconds per request, 2/4-second
  backoff) and a continuously hanging online startup offers recovery after about 21 seconds.
  Authentication/malformed responses fail immediately. Retry respects the runtime/authentication
  boundary and no family query starts before a valid runtime response.
- Native paired startup recovers from transient validation or main-document failure without manual
  input, bounded to five attempts/30 seconds. Pause/Back cancel retries and reject late results;
  resume re-enters recovery. Exhaustion offers D-pad Retry while preserving pairing and last route.
  Authentication failure revokes once, and certificate errors are never bypassed.
- Registered drafts survive cancelled menu, remote Back and browser-history navigation; accepted
  discard permits navigation. Admin initial errors preserve heading/Back and a keyboard-operable Retry.
- Admin loading keeps Back available without pre-empting the loaded screen's default D-pad entry.
- Keyboard Retry restores meaningful focus; explicit loading-screen Back focus survives replacement.
  Delayed Calendar routes preserve a short directional burst without automatically opening an event.
- Pending chore/list rows retain remote focus and ignore repeated activation; completion never steals
  focus back after the user deliberately moves to another control.
- Today returns saved verse content while an optional provider is pending; same-day provider recovery
  is not blocked by a previously memoised failure. Weather distinguishes saved-location outage from setup.

### Notices and Today composition

- An authenticated adult can publish, edit and remove a notice with Standard or
  Important priority and a valid start/expiry window.
- Duplicate command request IDs replay the original result and do not create a
  second notice; each accepted write has an audit record.
- The server, not the browser, selects the eligible Important/most-recent notice
  shown on Today, and expiry/removal reveals the next eligible notice.
- Dinner, List summary, Notice, Daily Bible verse and Family photo can be independently shown or
  hidden from the companion without hiding plans or chores or creating a layout
  editor.
- The TV summary rebalances cleanly for one, two, three or four bands, with or without
  a photo; phone administration remains accessible and usable at 390×844.
- At 1920×1080 and 1366×768, every supported Today combination remains inside one television
  viewport with no page or content-panel scrolling. Portrait photos use the right-side composition,
  landscape/square photos use the wide composition, no-photo summaries reclaim the available width,
  and each source remains fully visible at its native pixel ratio without distortion, crop or a
  persistent photo frame.
- Automated layout coverage exercises all 32 Dinner/List/Notice/Daily verse/Reminders subsets
  against six representative photo shapes (including no photo) at both television viewports.
  All 384 combinations remain independently runnable; representative sparse and dense compositions
  are retained for visual inspection.
- Upcoming and due chores use equal-width columns with matching heading and first-row rails. Portrait
  photos share the core upper rail; landscape/square photos share the optional-summary lower rail,
  and hidden optional modules leave no reserved track or unexplained bottom anchoring.
- With multiple approved photos, Today advances the preview after five visible minutes and recomposes
  for the next photo's stored orientation. Photos Pause/Resume also governs Today for that display
  session; reduced motion and hidden documents prevent automatic advancement.
- When Daily Bible verse is enabled, demo mode shows fictional copy and private mode shows an
  attributed ESV passage only when its server secret is configured. Select opens a Back-safe full
  reading; a missing key or provider outage cannot take down Today, and cached text is marked stale.
- Today & notices presents the six visibility switches and notice administration without embedding
  a duplicate simulated dashboard. Two rapid changes cannot overwrite one another, and the actual
  Today destination remains the authoritative rendered result.
- At 390×844, all six Today visibility controls render as full-width joined rows with readable copy,
  an unobstructed trailing switch and a complete inset focus treatment. No control depends on the
  earlier two-column desktop card geometry.
- Today displays three to five event and chore rows on television according to photo orientation
  and available height, keeps the full dashboard inside one viewport, and exposes the exact hidden
  count through focusable links to Calendar Agenda and Chores. A landscape photo permits four only
  at full television height; its compact-height counterpart and the phone remain capped at three.
  No returned item is silently concealed.
- A visible event opens family-readable details, Dinner/List/Photo open their
  real modules, an active Notice opens its full text, and Back restores the exact
  originating control using only remote-equivalent input.

Status as of 2026-08-09: fake/in-memory and durable SQLite command paths,
idempotency, permission/validation rejection, reset isolation, restart state,
realtime invalidation, accessibility and retained 390×844/1920×1080 renders are
implemented. Real household wording and expiry preferences remain pilot tuning,
not a deployment blocker.

Extension evidence as of 2026-08-10: overflow counts, event and notice details,
summary destinations, deterministic focus/Back restoration, TV and phone
responsive renders, automated accessibility checks and console-clean remote
flows are covered by `tests/e2e/today-polish.spec.ts`.

The same date's companion extension adds serialised optimistic visibility changes.
`tests/e2e/today-settings.spec.ts` covers the rapid-toggle race, the absence of the retired embedded
preview, responsive settings renders and automated accessibility checks.

### Home Assistant and voice

- Voice Preview Edition and an iPhone can trigger the same typed Hearth actions.
- The configured chore-completion sentence updates the correct person/date/chore and returns confirmation for Home Assistant/Piper to speak.
- Ambiguous commands ask for clarification rather than guessing.
- Unlisted Home Assistant entities/services cannot be invoked through Hearth.
- A Home Assistant outage does not prevent reading local Hearth data.
- An adult can test, map, replace and remove one Home Assistant connection without returning its
  token, root URL or raw entity IDs to the browser, SQLite, receipts, audits or logs.
- The connection maps exactly four safety states and Evening, Goodnight and Screen off; the runtime
  reads only those states and invokes only the selected scripts through `script.turn_on`.

Local status as of 2026-08-10: fake and REST adapter contracts, external mode-`0600` secret writes,
safe SQLite metadata, adult/idempotency/audit enforcement, malformed/authentication/network errors,
managed activation/removal, responsive phone mapping, keyboard Back and serious/critical
accessibility checks pass. No real token was created and no live Home Assistant, Assist/Piper,
presence, television or IR test was run. Those live/hardware bullets therefore remain incomplete
until the approved commissioning and backup check.

### Native television coexistence

- Jellyfin music and video remain available through the independent native Google TV client without a Hearth credential, connection card or launch command.
- Home Assistant does not auto-power-off the television during protected native-app playback.
- Hearth remains resumable after ordinary Google TV app switching without knowing which media app was used.

### External voice-music commissioning

- Music Assistant is installed beside Home Assistant, not inside Hearth, and
  connects to Jellyfin with a dedicated credential that never enters the
  Hearth workspace or bundles.
- “Play Dreams by Fleetwood Mac” from the living-room voice unit resolves to the
  mapped `Hearth TV` Google Cast player when no destination is spoken.
- Naming a different configured room/player overrides that mapping.
- The requested track plays through Cast with available metadata; acceptance
  does not require opening or automating the native Jellyfin app.
- Pause, resume, next, previous, stop and volume operate reliably, while
  ambiguous search results fail safely or request clarification.
- Cast playback sets the same generic protected-media guard used for native
  playback and prevents a presence-driven screen shutdown.
- Music Assistant/Jellyfin/voice failure remains external to Hearth and does
  not prevent the family dashboard from operating.
- The selected TCL television/video Cast player is explicitly enabled in Music
  Assistant, remains discoverable on the same local network and survives a
  restart/re-discovery test.
- Jellyfin music search, playlist import, refresh and sustained playback are
  reliable enough for the household; otherwise the documented read-only
  Synology music-share fallback is used only after approval.

Status as of 2026-08-04: not run. Music Assistant, the community voice-support
intents, Jellyfin source, player mapping and physical-TCL Cast behaviour remain
live-system commissioning tasks requiring owner approval.

### Presence and power

- Presence during allowed hours can wake/show Hearth.
- No-presence timeout turns the panel off only when Hearth is foreground and no protected media session exists.
- A seated household member does not experience repeated false shutdowns after final presence tuning.
- Quiet hours prevent unwanted wakeups.
- Network wake failure falls back to the approved IR mechanism without hard-cutting mains power.

### Photos and ambient mode

- Approved photos rotate without visible distortion, incorrect orientation or filesystem exposure.
- Automatic collage rotation can be paused and resumed using only the remote or touch, does not
  advance while the document is hidden, and remains still when reduced motion is requested.
- The normal gallery shows each visible photo once and chooses a stable composition from every
  visible photo's stored pixel dimensions. The selected image remains a substantial full-height
  anchor and up to four supports form ratio-derived columns. Every leaf renders at its exact native
  ratio without crop, stretch, persistent frame, shadow or backing card; natural page background may
  remain as negative space. Rotation occurs every
  45 seconds, exposes subtle visible progress to the next composition and remains static under
  reduced motion. The television page has no horizontal or vertical overflow; phone portrait uses
  orientation-aware spans and phone landscape shows three substantial rotating occupants rather
  than five compressed strips.
- Remote/voice input exits ambient mode immediately.
- Normal overnight standby remains available. The owner's explicit foreground-display choice
  (D-094) requests screen retention only while Hearth is resumed and releases it on pause; it does
  not disable manual or Home Assistant standby.
- Missing/corrupt photos fail gracefully.
- An authenticated adult can choose multiple supported phone photos without first configuring a
  shared folder. Each image is capped at 25 MB, decoded server-side, orientation-corrected and
  stored with opaque paths; duplicate content is reported without creating another asset. A child,
  television credential, invalid format and duplicate request ID cannot create an unintended write.
- A batch may partially succeed and reports added, duplicate and failed counts. Client filenames,
  original bytes and private paths do not enter browser-safe responses, receipts, audits or logs.
- An authenticated adult can favourite, unfavourite, hide and restore an indexed photo using touch
  or D-pad only. Commands are validated, idempotent and audited; a hidden photo disappears from
  Today, the gallery and ambient mode without deleting its index or original.
- Favourite and hidden state survives optional incremental Synology folder checks. A missing import
  folder does not disable managed phone uploads or remove their assets. Hidden photos remain available
  in adult administration with a safe derivative preview, while private filesystem paths never
  reach any response or log. Synology metadata and recycle directories such as `@eaDir` and
  `#recycle` are ignored rather than making the approved-folder check fail.
- Adult administration identifies managed uploads and optional-folder imports. Visible and hidden
  managed-upload cards expose **Delete** directly; **Select photos → Delete selected (n)** supports
  batches alongside bulk hide/restore. It permanently deletes managed uploads only after an
  explicit confirmation. The managed master, display and thumbnail files disappear, the command is
  idempotent and one path-free audit event remains. Imported originals cannot be deleted through
  Hearth and the UI explains the source-folder plus **Check folder** workflow.
- Confirmation retains the exact requested photos across source refreshes, defaults to **Keep
  photos**, and blocks repeated submission while pending. Cancel performs no command and restores
  the opener. Success refreshes the library, gallery, Today and activity, restoring a surviving card
  or selection control. Failed/partial deletion retains affected photos and reports a retryable result.
- Phone More exposes **Photos** at `/photos` and a separately labelled, visually prominent
  **Manage photos** action at `/admin/photos`. The latter opens the phone upload/curation surface,
  including **Add photos**, and its Back control returns to More when opened there (or to the
  settings overview when opened from that overview). Hearth settings also
  places Manage photos first under Family content rather than hiding it behind a generic household row.
- More and the Hearth settings root use compact title-only navigation rows with slightly squared joined
  group corners. Repeated row subtitles are absent; destination screens retain the explanatory copy
  needed to complete their tasks.

Status as of 2026-08-21: the local browser/server slice passes a unique-image,
content-dependent orientation-aware collage with bounded tile geometry, uncropped portrait rails,
wide landscape bands, visible 45-second occupant
rotation and a reduced-motion pause, mixed landscape and portrait rendering, path-safe typed
responses, D-pad gallery selection,
immediate keyboard/Back-equivalent ambient exit, real offline cached content,
empty/unavailable/failure-retry states and a corrupt-derivative fallback at TV
and phone viewports. Managed upload tests cover portrait normalization, content deduplication,
decoded-format rejection, adult role enforcement, command replay, path-free audit creation and
persistence across service restart. The optional folder adapter additionally passes local mixed-orientation,
unsupported/corrupt/symlink, incremental-change, opaque-route and cached-unavailable tests, with an
adult-only audited manual scan contract. Adult favourite, unfavourite, hide and restore commands
additionally pass role rejection, validation, duplicate-request replay, audit projection, rescan
persistence, hidden-photo projection and D-pad/focus-restoration checks. Live managed upload,
encrypted data-directory restore, optional Synology folder check, voice exit and physical-TCL rendering
and Home Assistant presence/quiet-hours coordination are not run, so this
acceptance section and Phase 7 remain incomplete.

### Appearance and evening comfort

- Light, Dark and Automatic are selectable without touch and remembered separately on each display.
- A paired display or signed-in household viewer can open Appearance and change this device without
  an administrator passkey; all household-mutating Admin routes remain protected.
- Automatic responds when that device's operating-system/browser colour scheme changes.
- Dark preserves readable household/member colours, semantic states and a visible D-pad focus ring
  across Today, Week, Month, Chores, Lists, Meals, Photos, Home and Admin.
- Evening dimming is independently selectable, persists, includes photos/ambient mode and does not
  invoke the Home Assistant Evening scene.
- Back returns from Appearance to the prior screen and restores its previous focused control.

Status as of 2026-08-05: browser automation passes persistence, automatic
system-theme changes, independent dimming, remote-only entry/selection/Back,
serious/critical accessibility checks and dark renders at 3840×2160, 1920×1080,
1366×768, 390×844 and 844×390. The selected TCL's real room comfort and system
theme reporting remain untested until the physical-TV pilot.

### Security and privacy

- Television pairing can be revoked.
- Adult-controller clarity (D-096): Phones & screens identifies the signed-in adult, distinguishes
  existing controller permissions from passkey enrolment and puts phone guidance before TV code
  approval. Under D-102 no phone is claimed ready until its owner verifies the named connection
  on that actual browser. Disconnected
  screens are retained in collapsed history, not mixed into authorized screens; contact timestamps
  do not imply online status. Confirmed screen revocation restores focus and leaves adult passkeys
  unchanged. Local regression and rendered checks are recorded separately from live cleanup.
  David's and Rachael's actual phone sign-ins and exact stale-screen cleanup remain unverified
  until authenticated on-device evidence is obtained. No live records are removed by this change.
- A private non-Android television browser can replace unsupported passkey sign-in with a
  short-code pairing approved by an authenticated adult. The raw device secret is absent from the
  URL, rendered UI, local/session storage, response bodies and logs; after exchange it exists only
  in a `Secure`, `HttpOnly`, `SameSite=Strict` device cookie and grants television rather than Admin
  scope.
- Server-side secrets are absent from built JS and APK artefacts.
- Child/guest roles cannot access admin configuration.
- In private mode, the external one-time owner key creates the first adult controller connection;
  Admin requires a valid revocable HttpOnly session linked to an active named connection (D-102).
  No password/passkey is required. Only session/key/invitation digests persist, never raw secrets.
- A connected controller creates a one-use, five-minute QR for an existing adult controller,
  confirms the scanned phone and approves without changing the inviter's identity. Only the
  requesting browser exchanges. Removal ends only the selected connection and linked sessions.
  Loss of all phones uses a private owner-issued grant, not a household/TV reset. New enrollment
  does not confer recent sensitive-action consent. Cross-household, child/display, wrong-browser,
  expired/cancelled, removed inviter/target and one-use replay abuse must fail closed.
- After private first use, an unauthenticated browser cannot discover the household identifier or
  name through runtime bootstrap and receives `UNAUTHENTICATED` from household JSON, photo and
  event-stream routes. A same-household companion with `household.view` and a paired television
  with `household.read` can load the same routes; cross-household credentials fail closed.
- Television pairing still creates unique schema-valid six-character codes after more than 99
  retained requests. Phone connection claims enforce bounded per-client attempt state, live and
  retained invitation limits, with expiry/pruning. Retired passkey ceremonies reject in production.
- Signed-out personal-device sign-in and shared-screen connection are separate, explicit choices.
  More, desktop settings and Android pairing use the same **Phones & screens** menu name. No code
  is created before a user selects the shared-screen action, and no private household data is
  requested before access is accepted. Expired codes are hidden; Cancel/Back stops polling and
  rejects late creation/approval results, restores focus, and allows another explicit attempt.
  The signed-out flow supports D-pad arrows; the pairing modal traps Tab without touching the
  background. Phone approval tolerates grouped pasted codes but never approves automatically.
  Disconnecting requires confirmation and a lost command reply retains its original request ID.
  Production settings never offer the demo-only pairing preview. Adult settings remain protected
  by the server-authenticated named phone connection, not by a display code.
  First-use setup remains available on a wide private-HTTPS desktop browser; only actual TV
  browsers direct the user to a companion device.
- Mutation audit records include actor, channel, target, time and result.
- A household administrator can review the latest family, planning, connection and system changes
  in a family-readable Recent activity screen. A child receives `FORBIDDEN`; the screen does not
  render opaque audit/request/target identifiers or provider secrets, and its filter, Back/focus
  restoration, empty, unavailable, phone landscape/portrait and dark presentations work without
  touch.
- Logs do not include tokens or full sensitive calendar content by default; calendar and Home
  Assistant connection tests explicitly redact their credential fields.
- Public internet exposure is absent unless separately reviewed and approved.

Adult-access evidence as of 2026-08-15: shared-schema, Fastify route, SQLite repository, migration
backfill, idempotent revocation and virtual-WebAuthn browser tests cover additional named-adult
passkeys, current-passkey confirmation, digest-only code rotation, one-time recovery and previous
session/credential revocation. The responsive Admin and signed-out recovery surfaces pass focused
390×844 and 844×390 renders, serious/critical accessibility checks and the complete 206-test
Playwright suite. Stable-hostname enrolment and recovery on the actual adult phones remain a live
commissioning acceptance gate.

Connection-flow evidence as of 2026-10-06: `pnpm verify:code` passes format, lint, types, 249 unit,
135 integration/API and 24 migration tests, deployment validation and production builds;
`pnpm verify:tv` passes native unit tests, Debug/Release lint and both APK builds. `pnpm verify:ci`
checks the complete non-overlapping 914-test inventory. The focused production-build command
`pnpm test:e2e:built tests/e2e/device-connection.spec.ts tests/e2e/runtime.spec.ts tests/e2e/admin.spec.ts tests/e2e/keyboard-layout.spec.ts --max-failures=0`
passes 96 tests, followed by 18 passes from
`pnpm test:e2e:built tests/e2e/appliance-readiness.spec.ts --grep '/admin/televisions|/admin/access|/more' --max-failures=0`.
Evidence covers 320×700, 390×844, 844×390, 820×1180, 1920×1080 and 3840×2160 in light/dark,
private choice/first-use gates, code visibility without scrolling, actual demo approval, immutable
lost-reply replay, confirmed disconnection, expiry/cancel/focus/Tab behavior, empty/clipboard
fallbacks, serious/critical accessibility checks and console/overlay health. Screenshots are local
temporary evidence, not household data. The full 914-test browser suite and real-device passkey/TV
commissioning were not rerun for this targeted workflow change; no live device was paired, and no
commit, push, deployment or network change occurred. `git diff --check` passes.

Phase 6 source/build evidence as of 2026-08-04: the release manifest requires
Leanback, marks touch optional, declares only network access plus the protected
AndroidX receiver permission, disables backup and cleartext, and contains no
configured server URL or integration secret. Pairing/revocation integration
tests, eight native unit tests, Android lint and debug/minified-release assembly
pass. The API 36 Google TV emulator also passes short-code pairing, D-pad
completion/undo, Back/exit, app switching, process recreation, sleep/wake,
server recovery and revocation with retained screenshots. The selected-TCL run
is still required, including its visible launcher tile, actual network
disconnect, overnight resume and native-app coexistence; therefore Phase 6 is
not yet complete.

### Operations and recovery

- Untrusted peers cannot change resolved client IP, host or protocol with forged forwarded headers.
  Explicit proxy IP/CIDR configuration permits only the commissioned chain; blank is fail-closed.

- Hearth server restarts automatically after Synology restart.
- Only an authenticated household administrator can read appliance-update state. Starting an update
  requires recent explicit connected-adult-phone consent within the previous five minutes;
  television, child, expired, revoked and cross-household credentials fail closed.
- The browser can request only the exact full commit returned by the fixed successful-release
  provider. It cannot send a repository, image, Compose file or shell command, and neither
  application container receives Docker/root access.
- Before activation Hearth creates and checks an online backup. The root-owned agent then preserves
  a stopped-database rollback copy, verifies readiness and restores the previous database plus image
  tags if activation fails. Start and terminal result appear in Recent activity.
- Development hides the update card. A platform without its separately commissioned fixed agent
  reports unsupported rather than pretending an update can run.
- Completed updates show no progress bar and do not block a subsequent release. Cancelled
  passkeys and rejected commands remain retryable; lost command responses reconnect and retain
  the request ID when retrying the same release.
- A configured Synology with a missing agent/status file shows the exact one-time setup action and
  no inert install button. The root hook considers the agent ready only when both its process and
  non-empty status file exist, and an externally activated release restarts a missing agent before
  reporting success.
- A normal verified release pulls immutable full-commit server and web images before recreating the
  project; it does not install dependencies or compile native code on the Synology.
- A browser or television WebView already left open detects the replacement release when realtime
  reconnects, within one visible minute, when it returns to the foreground or when the network
  returns, then reloads once without clearing its route, passkey session or television pairing.
- Unsaved registered drafts defer release reloads until a safe subsequent check; the new release
  remains detectable rather than being marked consumed while editing.
- Private image pulls use a separately revocable read-only registry credential that is absent from
  source, Compose, workflow logs and application containers.
- Home Assistant recovers after Pi restart.
- TV, Pi, NAS and router restarts are each tested.
- A current Hearth backup is restored into a clean test location successfully.
- A Home Assistant backup to Synology is restored successfully.
- The application has visible but calm health reporting for adults.

Local deployment evidence as of 2026-08-09: the production server/web images build and become
healthy together in private mode on native ARM64 and emulated DS920+ `linux/amd64`; the same-origin
readiness route, 20-migration database startup, unseeded first-use runtime, non-root/read-only
security settings and clean `SIGTERM` shutdown pass. These checks validate the scaffold only. The
online backup service now also creates mode-restricted, integrity-checked SQLite copies with
bounded retention; an automated clean-location restore reads the household successfully, and a
phone System Health surface reports concise database/backup/update state without exposing paths or
a full commit. Automatic recovery is explained beside updates; the uncommon extra-copy action is
collapsed under Advanced recovery. The five
operations bullets above still require the actual Synology, Pi, TV, router and live restore drill,
so production acceptance remains incomplete.

Pull-only deployment evidence as of 2026-08-21: production/fallback Compose validation, immutable
full-commit image references, pinned Buildx publishing configuration and the stage/activation shell
syntax are locally verified. The first hosted package publication, one-time NAS registry sign-in and
live pull/recreate timing remain not run until the change is approved for commit/push and the
private credential is commissioned.

## Release evidence

Local follow-up evidence as of 2026-10-06: `pnpm verify:code` passes formatting, lint, types,
244 unit tests, 135 API/integration tests, 24 migration tests, deployment validation and production
builds. `pnpm verify:ci` validates all five CI-policy checks and the complete four-shard partition;
`pnpm test:e2e:built --max-failures=0` passes all 897 browser tests, including keyboard/D-pad,
responsive, accessibility and strict-production-CSP startup cases. An additional rendered pass
checks 93 route/viewport combinations with no failures. `pnpm verify:tv` passes Android unit tests,
Debug/Release lint and builds. Both final `linux/amd64` production images build; isolated container
checks pass nginx CSP/cache/bootstrap/API routing, read-only/non-privileged configuration and clean
shutdown. The root updater safety toolbox passes eight fixtures. Registry dependency audit is clear
after the source-map-js override; `git diff --check` passes. These are local checks, not publication
or deployment, and no real physical device was available.

Approved live recovery evidence on 2026-10-06 applies to the unchanged installed Ramsay NAS release
`f2dea867ef5ffb3cf875354122ff0cae13b1939c`, not D-089/D-090 deployment. A 1,794,048-byte online snapshot
passes integrity and schema version 27 verification, restores into a network-isolated disposable
container, and matches the logical 800-row fingerprint. Only the two existing Hearth containers
restart; readiness and the original version recover. The original HTTPS hostname subsequently
returns readiness 200 with successful certificate validation. A temporary 502 during the deliberate
restart is recorded, not mistaken for a persistent failure. Disposable copies/containers are removed;
no household commands, deployment, DNS/firewall/VPN changes or other app restarts are performed.

The initial live snapshot attempt correctly stopped before restart when DSM's inherited ACL made
its disposable file report mode 777 despite a 0600 creation request. That exact test copy was removed;
the successful retry used private container tmpfs plus a protected temporary volume directory.
Unix mode alone does not establish effective DSM ACL access. Existing household-folder ACLs are
not changed by this drill. Read-only ACL inspection permits the administrators group and the
`hearth-svc` account, not a general everyone/users grant. The new strict POSIX helper still needs
an approved ACL-compatible commissioning review before installing its protected control-mount
boundary. Physical TV/phone/iPad, standby/network-loss,
live provider-outage and Home Assistant restore checks remain unverified.

D-089 additionally requires regression evidence for revoked/consumed in-flight authority, singleton
first use, bounded pairing/reminder state, legacy date recovery, extreme calendar spans, stream and
sign-out revocation, provider transport budgets, pinned photo bytes and protected update recovery.
Linux root-fixture success is not proof that a live NAS helper was migrated. Verify the installed
Python/SQLite capability, protected paths, control mount and exact activated release only during an
approved deployment. Real-device passkey, standby and television-network checks remain distinct.

- CI verifies that four browser shards cover the complete test inventory exactly once, including
  all 384 Today compositions. Each shard runs one worker against its own disposable demo database
  and the production build from the same workflow run; it cannot reuse a live development server.
- Publication requires successful code/API, all browser shards, Android and container-build gates.
  Failure, timeout or cancellation must leave the candidate unavailable to the appliance updater.
  Local checks never substitute for the hosted successful-release requirement.

Before calling the first household release complete, retain:

- exact test/build command output
- rendered screenshots for 4K/1080 and iPhone states
- Android TV emulator or device test notes
- integration test results and intentionally untested items
- backup/restore evidence
- current deployment versions and rollback procedure
