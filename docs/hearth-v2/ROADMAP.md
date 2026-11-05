# Hearth v2 implementation roadmap

## D-136 — Morning additions, Afternoon and linked chores

Local implementation provides shared routine settings/board with independent Afternoon storage
and module, weekday untimed default, per-child due chore references and canonical check/undo.
Forward migration, authority, module-off, recurrence, per-child identity, replay, daily reset,
responsive views and D-pad checks pass in `hearth/docs/evidence/routine-chores.md`. Existing Morning
profiles/ticks/receipts and chore history are preserved. Family-specific scan/import stays private.
Publication, live configuration/deployment and physical TV/phone use remain open. No evening
routine or HA alarm edit in this slice.

## Word Guess (D-135) — requested 2026-11-05

Add an original unlimited five-letter game, separate adult switch, private permitted word data and
device-local saved rounds. Prove scoring/duplicate letters, terminal/invalid/reopen states, private
file bounds and stale refresh, auth/module gates, retained receipts, TV D-pad/Back and phone layout.
Content READMEs and source guards must exclude downloaded databases from all public artefacts.
Local implementation does not install a private dictionary or establish GitHub, deployment or actual
TV/iPhone proof. No daily NYT schedule, scraping, multiplayer or gameplay server writes.

## Independent games (D-133)

Implement original local two-player Connect Four, persistent current round, and adult game choices
under Modules. Verify core rules, child/parent gating, authenticated API writes, retention/replay,
TV remote Back/focus, and phone/tablet/TV layouts. Keep public puzzle archives excluded and guard
release source. Local acceptance does not claim a deployed update or physical TV/iPhone proof.
Online multiplayer and external content downloading are outside this slice.

## Fitness family board (D-134) — requested 2026-11-05

Replace the one-person picker with all selected participants and broad daily activities. Preserve
plans, separate session checks, goal routines, streaks and exact retries. Verify five-person/four-
activity TV fit, responsive phone/tablet, long/multiple-session details and demonstration Back/focus.
Publication, private deployment and actual TV/iPhone acceptance remain separate from local evidence.

## Fitness demonstrations (D-129) — requested 2026-11-04

Add and verify reusable exercise library, optional plan links, private bounded uploads/range reads,
adult-only editing, remote playback/Back and unchanged historical plans/ticks. Keep publication,
private deployment and physical iPhone/Google TV playback separate open gates. The owner will choose
actual exercise demonstrations later; no clip sourcing, medical instruction or live household
configuration is part of this implementation. Canonical behavior: FITNESS_CONTRACT.md.

## Fitness (D-128) — requested 2026-11-04

Implement the optional end-to-end module: explicit participants, multiple long-term goals with their
own weekly routines, an all-participant daily board with broad activities and goal-labelled details, TV checks,
scheduled-day streaks, history-safe editing and adult setup. Preserve earlier unassigned routines
and exact receipts while adding goal associations. Verify
shared/core validation, SQLite/migration/atomic retry/access isolation, UI state recovery, supported
responsive sizes and D-pad/Back. Keep hosted publication, private release and real phone/TV viewing
as separate open gates. No health provider, wearable, HA workout control or live household seed.

## Shareable setup (D-127)

Implement a guarded fresh-server installer, explicit portable update/checkpoint/rollback command,
first-phone private QR, adult Get started, resilient optional Connections and downloadable matching
HA installation/update tools. Local verification, publication, real fresh-server/phone/HA acceptance
and deployment are distinct gates in ACCEPTANCE. Do not alter the commissioned private NAS or HA
while developing these tools. Consumer trusted-certificate/network commissioning, ARM images,
phone-triggered portable updates and integration-store publication remain later work.

## Indoor climate (D-126)

Source, full hosted gate (1,304 browser cases), private deployment/preservation, real HA Recorder,
container-to-HA selected reads and rendered day/week/month/year charts passed on 2026-10-29.
The owner-approved single-host TCP/80 outbound exception preserves all earlier rules. Daily
encrypted backups retain 14 copies, include History and have one independently verified NAS copy.
HA retains its local database and remains the history authority. There was no TV/power/music/alarm
change, router/DNS change, general LAN bypass or new inbound port.

Keep physical Hearth TV/iPhone viewing, actual reboot/later-update policy persistence, the next
scheduled backup execution and a spare-media restore as separate open gates. Independent recovery-key
custody was declined by the owner and must not be marked as proved.
No year before sensor installation was fabricated. Exact evidence and commands are in ACCEPTANCE.

## Quiet calendar refresh (D-125)

Source, hosted and private activation/preservation gates passed for `c9af224` on 2026-10-29,
together with the 25 MiB D-124 correction. The 412-case local Today/photo/isolation run and full
1,286-case hosted browser gate passed. Physical-device viewing/upload throughput remain separate
acceptance work; no HA automation or provider/permission change is implied.

Verify typed pending/current/failure transitions, saved-event retention, quiet heading feedback on
Today/Week/Month/Agenda, genuine error/offline messages, phone/TV fit, dark mode and reduced motion.
Keep sync/coalescing/backoff/auth unchanged. Source checks, hosted release and private activation
are separate gates; ship alongside the D-124 photo-limit correction.

## Morning Routine day profiles (D-123)

Local and full hosted verification plus private release/migration/preservation passed on 2026-10-29
for `3fbd69e`, together with D-121/D-122. Exact evidence is in ACCEPTANCE. Remaining work is actual
device use/installation, real upload throughput and normal alarm observation; no weekend alarm
automation is implemented or implied.

Verify disjoint/editable schedules, untimed/timed weekends, local-date rollover, dated profile
isolation, v1 save/retry compatibility and migration preservation. Keep seven-step TV/verse fit,
phone/iPad editors, draft conflict/unknown-outcome retry and existing auth/module/HA boundaries.
Source tests, hosted release, checked v34-to-v35 deployment and physical viewing remain separate.
Do not change the existing HA weekday alarm as part of local implementation.

## Photo management and uploads (D-122)

Verify compact/paged normal and selection grids, filters/retained selections, safe exact deletion,
25 MiB/decoded-pixel bounds (D-124), bounded FIFO processing, two-transfer progress/pause/retry and draft
protection. Preserve master hashes and existing files. Record local evidence separately from hosted
checks, private deployment, physical phone throughput and any front-proxy limit verification.

## iPhone/iPad installed web companion (D-121)

Provide explicit Home Screen/standalone metadata, canonical fern icons and a stable Today entry
without a new client, auth mode or offline cache. Verify built resources, iPad portrait/landscape/
split-view navigation, phone/TV regressions and access isolation. Publication, private deployment,
actual Add to Home Screen, status-bar safe areas and retained device identity are separate gates.

## Original Morning Routine (D-120)

Implement independent weekday checklists, adult people/step/time editor, downward time bar,
durable daily checks and the explicitly scoped HA destination. Verify schema/timezone/date rollover,
retry/conflict/access/module retention, phone/TV layout, D-pad and reduced motion locally. Publication,
private migration/deployment, adult approval, private list setup and weekday alarm execution are
distinct gates in ACCEPTANCE. D-123 above supersedes the original deferral of weekend variants;
actual weekend alarm automation remains outside this implementation.

## Shared compact Today summaries — D-119 (2026-10-20)

Extend the compact bottom-verse rule to Dinner, Lists, Notices and Reminders. All text cards
shrink-wrap their excerpts with a readable/actionable minimum; keep the group's bottom alignment,
verse span, photo containment, explicit core overflow and natural phone scrolling. Budget compact
and very short TVs for the separate verse row and status/retry space. Verify populated/empty
single-module states as well as all mixed compositions and remote/Back behavior. Record local,
hosted, deployment and actual-device evidence separately in ACCEPTANCE.

## Compact Today verse — D-118 (2026-10-20)

Keep the verse at content height at the bottom of its existing summary area; leave calm space
above it rather than stretching the card. Retain expanding module tracks, photo containment,
Chores-first order and full-verse/Back behavior. Verify all composition subsets, verse-only and
unavailable/off states, phone/TV/4K and remote focus. Local evidence belongs in ACCEPTANCE;
publication, deployment and actual-device viewing of this refinement remain separate gates.

## Today adaptive composition — D-116 (2026-10-19)

Swap Chores left/before Upcoming; bound photos by remaining track height and let enabled summary
cards use that space. Retain the 384 named composition cases, strengthen intersection/containment
checks and cover extreme image ratios, core module combinations, light/dark, phones/tablet/short
TV/4K, stale/error states and D-pad/Back. Local evidence belongs in ACCEPTANCE. Publication,
deployment and actual household TV/iPhone viewing remain separate gates; no live update is implied.

## Optional NBA — D-113 (2026-10-18)

Implement retained standout teams, this/next local week, phase-labelled standings and weekly
single-game highlights behind an initially-off module. Evidence belongs in ACCEPTANCE.
Publication/deployment, installed HA 1.3.0, physical TV/iPhone checks, and a supported commercial
feed remain separate gates. No TV power/pairing, reminders writeback, media or networking work.

D-114 adds optional team/player artwork and restrained score/card polish without changing the
four views or TV pagination. Prove loaded/missing artwork, light/dark, narrow phone, TV fit and
D-pad escape locally; keep publication, physical-device acceptance and licensing gates separate.

D-115: spoiler-free game cards and individual game box scores. On-demand fixed-origin summary
adapter, bounded cache, two team lists, points/assists/rebounds-first columns, shooting and personal
fouls, reported totals, eight-player TV pagination and labelled phone grids. Verify provider failure,
identity/schema bounds, no prefetch/spoilers, Back/focus, a11y and light/dark TV/phone fit. This change
is local; publication/deployment and actual TV/iPhone viewing remain separate approval/proof gates.

## Household Modules — D-112 (2026-10-15)

The eleven retained-data switches, enforcement, responsive menus/routes and all-off recovery passed
local verification. With owner approval, `35c7bb7` passed all hosted gates (1,088 browser cases),
published its verified images and is healthy on the private NAS with migration 0032. Matching HA
component 1.2.0 is installed/loaded after backup, configuration checks and quiet Core restart.
Current limited authority is unchanged. Open gates: adult-phone Modules rendering, one deliberate
adult reconnect, then an agreed reversible physical module off/on test with retained-data/state
feedback. No live feature flag, TV tab/power or morning automation was changed. See ACCEPTANCE.

## Single Home Assistant approval — D-111 (2026-10-15)

Replace permission choices with the disclosed current-feature bundle; preserve restricted existing
grants, the 20-screen bound and exact retries. Verify UI/API isolation, reconnect confirmation and
mobile/TV-sized rendering, then run hosted gates before the approved private Hearth/HA update.
Install wording-only component 1.1.2 with backup/config checks and quiet Core restart. The existing
limited live grant needs one adult-approved reconnect; no automatic upgrade. Physical tab feedback,
real calendar/chores and agreed test-chore complete/reopen remain separate open acceptance gates.
The morning routine, TV content and runtime networking must remain unchanged by this rollout.
Released checkpoint: `f614548` passed all hosted jobs (1,080 browser cases), is healthy on the
private NAS, and HA visibly loaded 1.1.2 with the existing entry. The old limited grant is unchanged;
adult-phone reconnect and actual data/tab/chore functional acceptance remain open. See ACCEPTANCE.

## Short-code connection usability — D-110 (2026-10-15)

Replace manual Hearth key entry with six uppercase invitation letters or private QR. Preserve
strong machine/recovery proof and all existing connections. Verify typed contracts, additive
migration, expiry/replay/revocation races, origin/screen isolation, HA config-flow task lifecycle
and mobile/TV rendering before publication. Install matching HA component separately with approval
(current wording version 1.1.2; D-111).
Physical phone/HA/TV acceptance and the morning Today-selection change remain separate open gates.

## Inbound Home Assistant integration — 2026-10-15 (D-108)

Priority: approved foreground Hearth tab selection with observed active-tab feedback, then optional
read-only chores/calendar entities. Implement the dedicated scoped contract/credential and migration,
native foreground capability, web heartbeat/acknowledgement and manual HA custom integration.
Focused automated tests are approved for this slice. Local implementation/checks do not authorize
installation or commands on the home TV in use, HA restart, NAS deployment, Git publication or live
network changes. Physical selected-TV/manual navigation, pause/resume without media interruption,
real HA calendar/chores, revocation and recovery remain open until separately witnessed.
The owner-approved D-109 extension adds optional completion/reopening of today's existing chores,
not broader edits/admin rights. Verify opt-in defaults, grant isolation, exact/crash-safe retry,
stale completion/date guards, earnings/audit preservation and HA to-do wiring locally; then perform
an explicitly approved real HA chore tick/untick proof. No live installation is implied.

## Administration consistency — 2026-10-15 (D-107)

Share joined settings menus and a companion typography/control scale, preserve existing behavior
and shared-screen boundaries, and inspect responsive light/dark layouts. Local build/source/
interactive-browser evidence remains separate from automated release gates (not run under the
current instruction), actual iPhone/TCL acceptance, publication and deployment. No NAS or access
configuration change is part of this UI cleanup.

## Selected appliance access work — D-104 (2026-10-12)

1. Future native QR/metadata contract, deterministic fixtures and advisory classification: locally
   implemented validation only, not channel authentication.
2. Disposable appliance proof: native scanner, authenticated identity/transport, Bluetooth LE
   Wi-Fi commissioning and Ethernet discovery. Hardware/protocol selection and actual iPhone
   permissions/network joining remain open. Do not create a provisioning service in the NAS.
3. Existing trusted-HTTPS/browser compatibility: locally implemented scanned first-use card,
   migration 0029 digest-only recovery cards, exact trusted-phone approvals, bounded exact retry,
   typed phone UI and atomic owner replacement. Preserve TV isolation and content. Provisioning
   workstation can create a private setup PNG from an existing first-use file, never via a public
   empty-server endpoint. Browser/API checks are separate from actual Safari/camera/download proof.
4. Verified owner-consented migration, rollback/recovery copies and physical first-setup,
   second-adult, owner-phone-loss/all-phone-loss acceptance before full consumer-appliance acceptance.
   The user authorized compatibility publication/manual update with the remaining physical phone
   loss/recovery checks explicitly open. The isolated first-owner iPhone claim passed on 2026-10-13;
   this does not establish the lost-phone or native hardware flows.

D-105 adds the operator-only branded local welcome/QR presenter and claim-terminal behavior.
Automatic factory/HDMI startup, combined phone/TV commissioning and native BLE/Wi-Fi remain open.
D-106 adds shuffled no-repeat featured cycles across Today/Photos/ambient and compact 48-item
selection pages. Existing photo deletion/authentication/storage and NAS networking are preserved.

Live D-102/D-103 access is unchanged until an approved verified release. No automatic promotion,
household reset, live revocation, deployment or networking change is part of local development.

Adult phone connections (2026-10-12, D-102): implement protected owner-key first-phone setup and
independent QR-approved adult connections, with no passwords/passkeys. Keep current access and
TV grants while verifying local contracts, migration, authorization, browser interactions and
recovery. Publication/live activation, owner key issuance, David/Rachael physical Safari checks
and deliberate legacy cleanup remain separate open gates; no bulk reset or networking changes.

Protected main phone (2026-10-12, D-103): prevent all app removal/sign-out and owner-adult
archive/demotion. Deliberate D-104 recovery or a backend file key atomically replaces ownership while preserving
secondary phones/screens. Test forbidden paths, rollback and expiry; physical owner-key
replacement and loss/recovery acceptance remain open with the D-102 live release gates.

Historical adult-access repair (2026-10-09, D-097; superseded for enrollment by D-102): simplify named-phone setup, keep optional recovery secondary
and support backed-up local NAS-owner lost-access recovery without resetting the household or TV.
Exact obsolete-screen cleanup is verified separately from UI release and both physical phone
sign-ins. Never close device acceptance from passkey counts.

The roadmap is deliberately vertical. Each phase must leave a coherent, testable product state rather than a wide collection of unfinished modules.

Weather refinement (2026-10-09, D-077): a fixed household-local midnight-to-midnight axis, separate
live-clock and inspection markers, gap-safe geometry and measured phone/TV sizing replace the
rolling/stretched graph. The combined D-098 rail-focus/ambient-clock release `5fffd5e` passes all
940 hosted browser checks and is privately deployed with commissioned networking preserved.
Actual Safari/TCL rendering and remote acceptance remain open; see the release evidence in Acceptance.

## Requested addition — Family word-grouping game

D-117 (2026-10-19) retains the last successfully loaded board on each device, including untouched
choices and finished results, without clearing existing guesses/completions. Verify normal entry,
reload/fresh document, explicit links, missing/failed reads, old-v2 compatibility, blocked storage
and D-pad Next/Replay focus. No cross-device sync or live update is implied by local evidence.

Add Games using the household-supplied local puzzle archive, with original Hearth styling and
TV/phone controls. Verify rules, safe imports, authenticated reads, per-device progress, archive
selection, dark mode and D-pad-only use. Do not publish the supplied puzzle data or claim live
daily updates. Live archive installation, deployment and physical-device checks remain separate.

## Phase 0 — Foundation and decision validation

### Work

- Re-read all authoritative documents and report contradictions before coding.
- Inspect available Node, pnpm, Java/Kotlin and Android tooling.
- Create the pnpm monorepo under `hearth/` with `apps/server`, `apps/web`, `packages/shared` and `packages/core`.
- Reserve `apps/tv` with documentation; do not let missing Android SDK block web/server progress.
- Add strict TypeScript, formatting, linting, tests and reproducible scripts.
- Establish original design tokens and seeded demo household data.
- Add a workspace-level `.env.example` without secrets.
- Add a concise `hearth/README.md` with verified setup/run/test commands.

### Completion criteria

- A clean install can run the web and server locally.
- Typecheck, lint, tests and production builds pass.
- No real provider credential is required.

## Phase 1 — Television interaction prototype

### Work

- Build an original Today surface using seeded data.
- Build Week calendar and Chores surfaces.
- Implement persistent TV navigation and complete D-pad/keyboard focus behaviour.
- Implement chore completion in an in-memory/fake adapter with undo.
- Build deliberate loading, empty, stale and offline demonstrations.
- Add responsive phone rendering for the same core information.
- Add Playwright flows for remote-equivalent navigation.
- Render and inspect 4K/1080 and iPhone viewports.

### Completion criteria

- A user can navigate Today → Week → Chores, complete a chore and return using only arrow keys, Enter and Escape/Back equivalents.
- Focus is always visible and stable.
- The Today screen is legible at a simulated three-metre distance.
- The interface is recognisably Hearth and does not imitate Skylight's layout or branding.
- Seeded state and error states are deterministic and testable.

## Phase 2 — Household core and persistence

Implementation note (2026-08-03): Phase 2 is implemented. The phone Admin area manages the household, people/roles, paired televisions and connection readiness. WAL-mode SQLite now persists setup, chore templates, generated occurrence snapshots, completion/undo/skip state, idempotent command receipts and audit events. One-time television pairing is independently revocable. Server-Sent Events invalidate open Today/Chores clients after commands. Restart, closed-database backup/restore, historical-template, duplicate-request and TV/adult/child/voice/automation permission tests cover the completion criteria.

Hardening note (2026-08-09): the runtime now distinguishes `demo`, `test` and
`private`, injects household/clock context, and publishes household-local today,
week and month values through `/api/v1/runtime`. Browser API paths and query
keys no longer embed the fictional household/date. Private repository
construction applies migrations without seeding Ezra, Maya or planning data and
shows an explicit setup-required state. The authenticated adult first-use action now verifies a
one-time external setup code and a user-verified passkey before transactionally creating the named
household, first adult and default lists. Private Admin uses the resulting revocable, hash-only
companion session; real enrolment remains blocked until the stable private HTTPS origin is approved.
Private household reads now share one server-side access boundary: runtime bootstrap redacts the
configured household until sign-in or pairing, companion sessions require `household.view`, paired
televisions require `household.read`, and the same protection covers photos and event streams.
Pairing-code generation remains fixed-width beyond 99 retained requests, while passkey option
issuance now combines per-client throttling, a global pending cap and physical expiry pruning.

Recurring chore editing remains intentionally out of the Admin UI until the denser phone-oriented administration work in Phase 4. Phase 2 establishes and tests its server/domain persistence contract without putting dense editing on the television.

Implementation extension (2026-08-08): People now changes profile photos through a phone-sized
square crop flow with direct drag and pinch/scroll zoom plus a keyboard fallback. Portrait and
landscape originals are normalized in the browser to a bounded 512×512 JPEG; typed adult-only
update/reset commands persist one derivative in SQLite with idempotency receipts and audit events.
Replace, restart persistence, restore-original, permission, malformed-image, migration-integrity
and rendered companion flows are covered without coupling member identity photos to the Phase 7
Synology gallery.

Polish extension (2026-08-10): System Health and More now open an adult-only Recent activity
projection over the existing audit table. It groups the newest changes into family-readable rows,
supports Family/Planning/Connections/System filters and keeps target/request identifiers and
secret-bearing fields out of visible copy. SQLite integration coverage proves cross-repository
events share the same feed; browser coverage exercises child denial, empty/unavailable states,
D-pad filtering, Back focus restoration, accessibility and light/dark phone layouts.

### Work

- Implement household, member, role/capability and paired-device domain models.
- Add SQLite migrations and repositories.
- Implement chore templates, occurrence generation, completion/undo/skip and audit events.
- Replace in-memory UI mutations with the typed API.
- Add request identifiers/idempotency for voice/automation-safe commands.
- Add Today summary query and real-time invalidation/update channel.

### Completion criteria

- State survives server restart.
- Historical occurrences remain correct after template changes.
- Duplicate completion requests do not double-award or corrupt state.
- Permission and audit tests cover TV, adult, child and automation actors.
- Backup and restore of a development database is demonstrated.

## Phase 3 — Calendar projection

Status: complete and locally verified. iCloud/CalDAV is the selected first
provider; credentialed live-read validation remains an owner-controlled setup
action and is not required in demo mode.

### Work

- Finalise provider-agnostic calendar contracts. **Complete.**
- Implement fake provider sync and recurrence/all-day test corpus. **Complete.**
- Add the selected provider read-only. **Complete for CalDAV/iCloud.**
- Implement sync status, stale cache and provider-error handling. **Complete.**
- Only after explicit approval, add scoped event writes and conflict handling.

### Completion criteria

- Multiple calendars render with owner/source identity.
- Provider outage leaves cached events usable.
- Perth local dates, imported DST events, all-day events and recurrence exceptions are tested.
- No real event is changed without approved write scope.

The completed slice includes multiple source/owner identity, durable SQLite
cache/cursor/window state, all-day and inclusive local-date projection,
recurrence exceptions, cancellation tombstones, imported-DST date tests and
offline/provider-outage recovery. The first real adapter uses HTTPS CalDAV,
server-side exact calendar allowlisting, bounded recurrence expansion,
family-safe error mapping and an external secret-config path. Contract tests
run the adapter through the persisted Today repository. No credentialed iCloud
read was attempted; that is a deployment validation item rather than missing
application code. Any calendar write scope remains separately deferred.

Implementation extension (2026-08-04): the owner approved Month after rendered
television evaluation. Month now uses the existing provider-neutral projection
through one typed 42-day query, compact colour-coded event titles with bounded
overflow, an avatar/colour source key, deterministic D-pad navigation and a
responsive Week/Month phone switch with a selected-date agenda (replaced by the explicit shared
full-day dialog in D-101, 2026-10-11). No calendar
credential, write scope or migration was added.

Implementation extension (2026-08-08): the missing companion calendar setup
workflow is implemented. Adult-only typed routes test an HTTPS CalDAV account,
return safe discovered calendar descriptors, persist exact selections/owner
mappings, replay duplicate saves, audit save/removal and expose connected state
without returning credentials. Private mode atomically updates the configured
external secret path and activates the managed read-only provider; demo mode is
fully fake and inert. Migration `0011_calendar_connection_setup.sql` persists
safe setup metadata only. A real iCloud credentialed read remains an explicitly
owner-controlled deployment validation action and has not been performed.

Implementation extension (2026-08-20): connected calendar ownership is now a
permanent editable mapping rather than part of credential setup. The companion
always shows calendar name, assigned person and derived Hearth colour/avatar;
an idempotent command updates the external allowlist and SQLite projection
without requesting or rewriting the saved app-specific password. Household
settings also owns weather location through suburb/postcode search or a
one-time phone location request, a live current-conditions test, and migration
`0022_weather_location.sql`. Environment coordinates remain fallback-only.

Implementation extension (2026-08-20): an existing calendar connection now has
a separate **Edit calendars** action. It performs an authenticated server-side
rediscovery with the saved private credential, then saves an added/removed exact
calendar selection without revealing or re-entering that credential. Account
replacement remains a distinct recovery action.

Implementation extension (2026-08-09): Calendar is now one primary television
and phone destination with Week, Month and a dedicated responsive Agenda view.
All three views share an explicit D-pad/keyboard switch and a direct source
setup link; legacy `/week` and `/month` bookmarks preserve query parameters
through redirects. Week and Month now have functional earlier/current/later
navigation, event selection opens a family-readable detail surface and Back
restores the exact event focus. Event time and timeline placement use the
runtime household timezone rather than a browser-side Perth constant. Phone
More now exposes family modules before grouped setup links, Home precedes Photos
on television, and duplicate pairing/settings wording has been removed.

Implementation extension (2026-08-21): Agenda is now a rolling household-local four-day surface
containing today and the next three dates only. It no longer accepts past/future week navigation or
renders days outside that window; Week and Month retain period navigation for planning further out.

Implementation extension (2026-08-09): **Today & notices** now provides
phone-first adult creation, editing and removal of expiring Standard/Important
household notices plus independent Dinner, List summary, Notice, Daily Bible verse and Family
photo visibility. Migration `0013_notices_and_today_sections.sql` persists the
state; authenticated commands are validated, idempotent, audited and broadcast
through `today.changed`. Today rebalances its remaining bands without exposing
a layout editor. Demo reset isolation, SQLite restart, phone accessibility and
customised 1080p rendering are automated; live household copy remains a pilot
tuning decision.

Implementation extension (updated 2026-08-24): Today now derives a calm three-to-five-row television
capacity from display height and photo orientation: full-height landscape compositions use four,
their compact-height counterpart uses three, and phone remains at three. Exact, focusable
overflow counts lead into Calendar Agenda and Chores. Event rows open calendar details; Dinner, List
summary and Family photo link to their real modules; and Notice opens the full announcement in a
Back-safe dialog. Automated remote-only TV and phone flows prove focus restoration, responsive
composition, accessibility and clean console behaviour.

Implementation extension (2026-08-21): Today now treats television height as a hard appliance
constraint. Its typed photo orientation and enabled summary count select a deterministic portrait,
wide-photo or no-photo composition; one to four summary tiles reflow without blank reserved bands,
and the full dashboard remains non-scrolling at 1920×1080 and 1366×768. The phone keeps its naturally
scrolling single-column presentation.

Implementation extension (2026-08-20): Daily Bible verse uses the same bounded Today preference
contract. It is off by default, reads an ESV token only from a server secret file, caches a small
attributed passage rotation and opens full text in a Back-safe dialog without becoming a general
content-module system.

Implementation extension (updated 2026-08-26): **Today & notices** keeps the six visibility controls
and notice administration compact, without embedding duplicate TV and Phone previews. Visibility
switches still update optimistically and execute serially, closing the rapid-toggle race that could
previously restore an older switch value. The real Today screen is the authoritative result.

Implementation extension (2026-08-26): phone administration now uses joined, full-width setting
rows at narrow widths instead of a cramped two-column card grid. More separates **View family
photos** from a prominent **Manage photos** action, and Hearth settings groups family content,
household/access, connections/displays and system destinations in the same scan order. The photo
management page returns to More and leads with phone upload, so curation is discoverable without
entering the family gallery.

## Phase 4 — Lists, meals and pocket money

Status: complete and locally verified with deterministic demo household data.

### Work

- Lists, item completion/addition and phone-first adult list administration.
- Meal plan and saved meals.
- Required weekly pocket-money amount and payday for each child.
- Complete-week chore proportion, amount due and immutable payment snapshots.
- Phone-oriented administration for recurring chores, meals and pocket money.
- Voice-ready typed commands for the new modules.

### Completion criteria

- Ordinary list and meal operations work from TV and phone where appropriate.
- Pocket-money payment and correction retries are idempotent. A child/week may receive multiple immutable partial disbursements, but the non-voided total cannot exceed the calculated amount due.
- Voice retries do not duplicate list items or chore completions.
- Dense editing remains out of the TV's primary interaction path.

Implementation note (updated 2026-08-10): Lists and Meals have D-pad television
surfaces and responsive phone presentations. The phone Family Planning area
creates, renames, colours, orders, archives and restores lists; edits, orders
and removes list items; and explicitly clears checked history. Meal administration now edits all
seven dinner names together, expands saved-meal/note details only when needed, copies or clears a
week with confirmation, and creates, searches, favourites, updates, archives and restores reusable
meals with optional preparation time and notes. Chore administration now creates explicit one-off
or recurring schedules, keeps the everyday list compact, confirms archive, restores from today's
local date, withdraws that day's unfinished jobs and retains completed occurrence history through
idempotent audited commands.
It also edits future recurring chores, optional available/due windows and their stable
top-to-bottom display order. A separate phone-first daily management surface
supports reasoned skip, excuse and adult reassignment, exposes snapshotted descriptions and
newest-first immutable history, and preserves the documented pocket-money denominator rules. The
same admin surface groups earlier current-week occurrences by day for audited complete/undo
corrections; the list resets visually each Monday without deleting historical records.
The schedule editor now accepts one or more people through a phone-friendly visual picker. The
existing template-assignee join table is returned as one grouped template and expands to one
independently completable occurrence per selected person, with legacy singular receipts normalized
at the contract boundary.
Television rows show compact window metadata in the saved order without exposing adult management
controls. It also manages child weekly amounts,
paydays, partial payment snapshots, history, week navigation and reasoned void corrections. Chores shows the current weekly completion
proportion and proportional amount due. Typed voice list commands resolve
the target without guessing, normalize exact duplicates and use persisted
idempotency receipts. Migration `0017_chore_occurrence_management.sql` adds the forward-only
description/due-time snapshots and targeted audit-history index; migration
`0018_chore_windows_and_order.sql` adds available-from time, deterministic template order and
historical occurrence snapshots. Migration `0009_pocket_money.sql` supersedes the active
reward implementation while retaining the old migration tables as dormant
history; active reward source contracts and runtime seeds are removed and chore completion/undo no longer writes star awards. Migration
`0014_pocket_money_payment_history.sql` adds optional payment notes, multiple
immutable disbursements and one audited void per payment. Unit,
Fastify/SQLite integration, migration, accessibility, remote,
offline, failure/retry and rendered-viewport tests cover the completion
criteria.

## Phase 5 — Home Assistant integration and Assist command API

Status: complete and locally verified with fake and private REST adapter contracts plus the adult
connection/mapping workflow. Live credentials, actual entity selection, Assist/Piper hardware and
presence/IR tuning are deployment validation work and were not performed.

### Work

- Implement Home Assistant server adapter and curated state projection.
- Configure allowlisted actions with validation, roles and confirmations.
- Implement Hearth command endpoints for Home Assistant scripts.
- Add deterministic Home Assistant Assist API flows for reading the day and completing a chore. Home Assistant owns capture, recognition and speech.
- Add presence/IR automation guard conditions.

### Completion criteria

- “Mark Ezra's dishwasher chore complete today” updates exactly one occurrence and returns the correct text for Home Assistant/Piper to speak.
- A generic protected-media signal from Home Assistant prevents automatic screen shutdown without exposing media metadata or controls in Hearth.
- Home actions cannot call unlisted services/entities.
- Home Assistant unavailability does not break calendars, chores or lists.

Implementation note (2026-08-03): the responsive Home surface projects only
living-room presence, TV power and a generic playback-protection signal. Three
actions map to fixed server-side script IDs, with idempotency, actor checks,
explicit Goodnight confirmation and audit events. Migration
`0006_home_assistant_projection.sql` caches the minimal state. The `/assist`
day-summary, list-item and chore-completion routes are structured entry points
for Home Assistant; Hearth contains no listening or speaking UI. Browser,
Fastify, SQLite, migration, focus/Back, accessibility and protected-playback
tests cover the completion criteria using the fake adapter.

Connection extension (2026-08-10): responsive **Connections > Home Assistant** administration now
tests `/api/config` and `/api/states`, presents only opaque friendly discovery choices, maps exactly
four safety states and three scripts, and can save/remove the connection without restart. The raw
URL, token and entity IDs are atomically stored only in an external mode-`0600` file; migration
`0019_home_assistant_connection_setup.sql` stores safe labels/status only. The live adapter reads
only the mapped state endpoints and calls only mapped scripts through `script.turn_on`. Shared,
runtime, repository, Fastify, migration, secret-redaction, phone, keyboard-Back and accessibility
tests cover this local boundary. Actual household commissioning still requires an approved current
Home Assistant backup and remains deliberately unperformed.

## Phase 6 — Android TV shell

### Work

- Create the Kotlin TV project and manifest/launcher resources.
- Implement the controlled WebView and secure origin/bridge.
- Implement one-time device pairing and credential storage.
- Implement Back/D-pad lifecycle, resume and recovery surface.
- Test on an Android TV emulator, then on the selected TCL television.

### Completion criteria

- Hearth launches from Google TV like a normal TV application.
- Overnight standby/resume restores a usable screen.
- Normal Google TV switching away from and back to Hearth restores sensible state/focus.
- Network and server outages show recoverable product UI, not a blank WebView.
- No integration secret is present in the APK/web bundle.

Implementation note (2026-08-04): the Kotlin shell, TV launcher manifest,
controlled WebView, exact-origin bridge, native pairing/revocation flow,
Keystore-backed credential encryption, Back callback, last-route restoration
and branded recovery surfaces are implemented. Android unit tests, lint, debug
APK assembly and minified release APK assembly pass against API 36. The API 36
Google TV emulator now has retained evidence for pairing, a 1920-pixel logical
viewport, D-pad complete/undo, Back/exit, process recreation, app switching,
sleep/wake, server recovery and revocation. Phase 6 remains in progress until
the selected TCL television passes the same checks, including a visible launcher
tile, actual network disconnect and overnight standby/resume. No media-launch or
Home Assistant bridge was added.

Browser-display extension (2026-08-16): Samsung M7 testing demonstrated that Tizen Browser exposes
WebAuthn but rejects resident credentials and an empty `allowCredentials` list. Private signed-out
Hearth now offers the same adult-approved short-code pairing outcome for non-Android television
browsers. The display generates the 256-bit secret with Web Crypto, keeps it only in volatile page
memory during approval, and receives a restricted persistent `HttpOnly` device cookie. The Android
shell remains the preferred Google TV installation because it additionally provides Keystore,
launcher, lifecycle and recovery guarantees.

## Parallel deployment workstream — Home Assistant voice and music

Status: planned and documented; not installed or verified on the live Pi,
Synology or selected TCL. This is household-infrastructure commissioning, not a
new Hearth application phase.

### Work

- Preserve and verify a restorable Home Assistant/Pi backup before changing the
  live appliance.
- Install the Music Assistant Home Assistant OS app and connect the official
  Home Assistant integration.
- Add Jellyfin as a Music Assistant music source with a dedicated
  least-privilege account kept outside this workspace.
- Add the TCL through native Google Cast for music, explicitly enable the
  television/video Cast player that Music Assistant disables by default, and
  add Android TV Remote for power, volume and approved app control.
- Name the Cast player `Hearth TV` and map the living-room Voice Preview
  Edition/area to that target when a request omits a room.
- Install and configure Music Assistant's custom local voice-support
  blueprints/intents; do not claim arbitrary song-starting is built into Home
  Assistant core.
- Extend the Home Assistant protected-playback helper so both native-app and
  Cast playback prevent presence-driven screen shutdown.
- Test wake, Cast takeover, metadata, eARC audio, pause/resume/stop/volume,
  ambiguous titles, loud-playback push-to-talk and recovery after Pi, TV and
  network restarts.

### Completion criteria

- “Play Dreams by Fleetwood Mac” heard by the living-room voice unit resolves
  through Music Assistant and plays on `Hearth TV` without naming the room.
- An explicitly named room/player overrides the living-room mapping.
- Playback uses Google Cast; no Jellyfin UI keypress or ADB automation is
  required.
- Home Assistant does not power off the panel while native or Cast media is
  active, and returns to normal presence policy when playback ends.
- Music Assistant or Jellyfin unavailability produces a clear voice failure and
  does not affect Hearth calendars, chores, lists or launch/resume.
- Jellyfin-source search, refresh, playlists and long playback pass a household
  reliability trial; if not, a separately approved read-only Synology
  music-share fallback is documented and tested.
- A Home Assistant backup containing the new configuration is restored in a
  safe test context.

## Phase 7 — Photos, ambient mode and production operations

Status as of 2026-08-21: in progress. The browser/server Photos slice is
implemented with an injected fake/local source, opaque asset contracts, a
forward-only photo migration, original mixed-orientation demo derivatives,
responsive content-dependent collage placement with uncropped portrait rails, wide landscape
bands, fewer larger tiles when a mixed set cannot truthfully fill five regions, calm
45-second automatic and reduced-motion-safe occupant rotation, a three-image phone-landscape adaptation, ambient
slideshow, immediate remote exit, cached-source states and corrupt-image fallback. The private
Today preview independently advances at a calm five-minute visible-screen cadence, uses the next
asset's normalized orientation to recompute its bounded composition, and shares the display-session
Pause/Resume state with Photos; hidden and reduced-motion displays remain static. The private
server now includes direct adult companion uploads into private managed Synology storage, decoded
format/size checks, content-hash deduplication, orientation-correct managed/display/thumbnail WebPs,
opaque immutable asset routes, and an optional read-only Synology-folder bulk importer with
incremental fingerprinting and adult-only audited checks. Admin shows aggregate managed/import
status and persistent favourite/hide/restore curation. The phone administration surface now adds
source badges, bulk selection, bulk hide/restore and confirmed permanent deletion for managed
uploads only; optional-folder originals remain protected by the read-only adapter. Hidden assets
remain indexed but are excluded from Today, gallery and ambient projections. A production-oriented two-container Synology
scaffold now builds and runs as both ARM64 and the DS920+ `linux/amd64` target,
with same-origin proxying, non-root/read-only processes, readiness gating,
forward migrations and clean shutdown verified locally. The three verification jobs mirror the
complete web/server/browser suite, Android TV shell and production container image builds and have
passed on the release-checkpoint branch. The private Synology instance and hostname/TLS are now
commissioned; real-device passkey enrolment/recovery validation, live managed upload/backup
evidence and optional folder-import evidence,
Home Assistant presence/quiet-hours coordination,
restore evidence and the household pilot remain open; Phase 7 is not complete.

Deployment extension (2026-08-21): production Compose now uses private, immutable
GitHub Container Registry images tagged with the full verified commit. A fourth workflow job
publishes the already verified `linux/amd64` server and web targets only after the other three jobs
pass, while `compose.build.yaml` retains an explicit source-build fallback. The pull-before-recreate
activation script and documentation are implemented locally; the first hosted package publication,
one-time NAS `read:packages` sign-in and live pull-only update remain unverified until the change is
approved for commit/push and commissioned.

Adult-access extension (2026-08-15): private Admin now manages named adults with multiple passkeys,
independent credential revocation and a passkey-confirmed, 128-bit one-time recovery code. Recovery
creates a replacement passkey and revokes that adult's earlier credentials and sessions. Migration
`0020_adult_access_recovery.sql`, schema/route/repository tests and virtual-WebAuthn browser coverage
exercise the local contract; stable-hostname real-device enrolment and code recovery remain a live
commissioning gate rather than an unimplemented software flow.

Cross-cutting appearance extension (2026-08-05): Light, Dark and Automatic are
implemented as per-display browser/WebView preferences, with Automatic following
the device colour scheme. A separate evening-dimming switch reduces Hearth's
rendered glare without invoking Home Assistant or claiming television-brightness
control. Companion More and the TV rail expose the same remote-safe controls without
an administrator passkey because they write only to that device. Unit, accessibility,
persistence, system-change, D-pad/Back and five-viewport rendered checks pass;
physical-TCL comfort assessment remains part of the household pilot.

### Work

- Confirm direct phone uploads and managed-photo deletion against the private Synology data mount,
  then confirm the remaining managed photos survive a container rebuild plus encrypted
  backup/restore. Retain the existing read-only folder only as an optional bulk-import path if the
  household finds it useful.
- Add ambient slideshow and screen/presence coordination.
- Commission the verified Docker/Compose scaffold on the approved private Synology HTTPS origin.
- Commission the implemented System Health and online-backup service, configure Synology's
  encrypted off-device copy, and perform the documented clean-location restore drill on the NAS.
- Conduct a household pilot and tune television readability/presence rules.

### Completion criteria

- Photos are attractive, correctly oriented and do not expose filesystem paths.
- Presence and quiet-hours policies can turn the panel off when the room is unoccupied. The owner's
  explicit foreground-display choice (D-094) may keep Hearth visible while resumed; leaving Hearth
  restores normal idle behaviour, and manual/Home Assistant standby remains available.
- Backup restoration is performed, not merely documented.
- Synology, Pi, router and TV restart scenarios recover without developer intervention.
- The system passes `ACCEPTANCE.md` on actual target hardware.

## Phase 8 — Hearth-owned reminders

Status as of 2026-08-27: the Apple/EventKit bridge is retired and archived under
`hearth/archive/apple-reminders-bridge/`. Its pairing, credential and snapshot routes are absent
from the active server, and migration `0027_native_reminders.sql` removes the former projection and
credential hashes. Reminders now belong to Hearth and require no companion app.

### Work

- Provide one fast reminder-creation form with an optional due date.
- Support edit, complete, reopen and confirmed removal through validated, idempotent commands.
- Keep Open and All filters, a compact Today summary and deterministic overdue/today/undated/future
  ordering.
- Keep every mutation authenticated and audited through the same household boundary as other
  Hearth content.
- Retain the former Swift/EventKit proof only as non-deployed historical source.

### Completion criteria

- Shared-schema, repository and HTTP integration tests cover the native reminder lifecycle and
  command replay.
- The old source pairing and snapshot endpoints return not found, and migration tests prove the
  external-source tables are gone.
- Reminders and Today pass television/mobile rendering, accessibility and D-pad/Back checks.
- No Apple credential, EventKit identifier, source token or companion background task remains in
  the active build.

## Calendar density follow-up (2026-09-07)

- Implemented locally: adaptive off-hours Week axis, overnight segments, bounded all-day/timed
  previews and a full-day overflow dialog with D-pad/Back focus restoration. Phone/tablet retain
  the full agenda. Provider records, APIs and storage are unchanged; live TV/NAS acceptance remains.

## Deferred opportunities

- Incremental extraction of server routes and planning persistence by domain, preserving transactions
- A small deterministic visual-regression baseline suite (captures alone are not pixel assertions)

- Google Calendar OAuth support, read-only first, while retaining one active calendar account per
  household; support simultaneous provider accounts only after real household demand justifies the
  additional setup, credential and migration complexity
- General conversational agent over the allowlisted command layer
- Dedicated local-AI mini-PC
- Full native iOS feature parity and retirement of the responsive companion
- Multiple households/remote family sharing
- Recipe/ingredient management
- Advanced energy and home-status visualisations
- Premium unified remote integration
- MCP adapter over existing authenticated application services
