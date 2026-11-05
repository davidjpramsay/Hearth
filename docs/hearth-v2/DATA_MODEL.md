# Hearth v2 domain and data model

## Word Guess extension (D-135)

Migration `0039_word_guess.sql` extends the game flag constraint with `wordGuess`, copying existing
flags/timestamps unchanged and retaining all receipts. The new child defaults on, matching D-133.
Old result schemas fill the missing new flag in memory; do not rewrite receipt JSON or input hashes.
Current reads remain authoritative. No per-turn database writes.

Private word data is a version-1 JSON file outside Git, with unique lowercase five-letter `answers`
and `allowedGuesses`; the answer pool is a subset. Bounds and source notices are in WORD_GUESS_CONTRACT.md.
`hearth.word-guess.v1.<mode>.<household>` stores only snapshot ID, word index, accepted guesses and
partial input (bounded 2,048-character read). Restore validates/replays turns and rejects changed-list,
out-of-range, duplicate, invalid and post-terminal progress. Marks are recomputed. Off retains data.

## Game submodules and Connect Four (D-133)

Migration `0038_game_modules.sql` adds household game flags keyed by `connections` or `connectFour`
(boolean enabled, updated timestamp) and receipts keyed by household, actor scope and request ID.
Each receipt records its input hash, original result and creation time. Exact replay returns the
original receipt without restoring obsolete flags; changed reuse conflicts. A successful first
change adds one `game-module.update` audit. Existing household/module/puzzle state is untouched.

`ModulesConfiguration.games` defaults missing child flags to both on for older receipt/client
compatibility. Current reads always return authoritative flags. Connect Four local storage key
`hearth.connect-four.v1.<mode>.<household>` stores `{ firstPlayer: 1|2, moves: number[] }`, at most
42 zero-based columns. Load replays every move and rejects invalid, post-win, full-column or
oversized histories. No names, credentials, puzzle text or remote game sync enter this store.

## Fitness demonstration records (D-129)

Migration 0037 adds `fitness_exercise_library` (home/exercise keyed versioned JSON),
`fitness_library_receipts` (home/actor/request with immutable hash/result) and
`fitness_library_retired` (deleted IDs cannot acquire new meaning). Plans gain optional nullable
`libraryExerciseId`, preserving omitted fields and existing snapshots/hashes. Name/kg/sets/reps
remain in each plan; current shared instructions/clip resolve separately. Safe audit contains no
exercise contents or filenames. Clips are private generated files in the data volume, not SQLite
BLOBs. Removing a library entry never cascades into plans, progress or streaks. See FITNESS_CONTRACT.

## Fitness — migration 0036 (D-128)

Add `fitness` to the fixed household module constraint; missing means off. Three separate tables:
`fitness_plans` (household, effective local date, increasing revision, validated configuration JSON),
`fitness_progress` (household/date/member/workout, completed flag, version, updated instant), and
`fitness_receipts` (household/actor scope/request ID, exact input hash, original result). Foreign
household references cascade only with the existing household lifecycle; this change deletes no
existing feature data. Each settings/check/audit/receipt write is transactional. First plan starts
today; subsequent saves replace tomorrow's pending plan, retaining older periods. Unselected/archived
people's histories remain. No exercise/goal text is copied into audit summaries. Backups include all
three tables; rollback to v35 requires its matching database backup. Additive optional JSON fields
`goal.weeklyFocus` and `workout.goalId` link independent goal routines, with same-person validation.
No additional migration or eager data rewrite: absent fields remain absent so old exact-request
hashes and receipts remain replayable. Unassigned sessions keep their stable IDs and progress.
Wire details: FITNESS_CONTRACT.

## Installation records (D-127)

The portable installer keeps a protected external `installation.json` with format, pinned release,
private origin, service UID/GID, unique Compose project, loopback port and configuration checksum.
It is operator metadata, not household identity or claim authority. The independent first-use proof
lives only in the protected secrets directory and is consumed on first owner claim; the local QR
card is never served by the application. Complete private update checkpoints retain data, photos,
secrets and their matching release metadata. No new SQLite migration/table or HA authority is added.
See SHARING_SETUP_CONTRACT.md.

## Indoor climate projection (D-126)

HA Recorder owns individual readings and retained hourly statistics. Hearth returns bounded,
transient room/reading/sample DTOs with explicit freshness/history state and no raw provider IDs.
Only named selected mappings, revision and provider credentials persist in the external private
indoor source file. Existing command_receipts store actor-bound input hashes and safe save results;
audit_events record indoor-climate.settings.update with a room count, never credentials or raw
sensor IDs. No new SQL migration or persistent sensor-history table. Restart retains selections,
not the temporary graph cache. See INDOOR_CLIMATE_CONTRACT.md.

## Calendar refresh presentation metadata (D-125)

TodaySummary, WeekSchedule and MonthSchedule add `calendarRefreshing: boolean`, defaulting false
on legacy decoding. It is transient projection activity, not a persisted calendar/event field or
freshness override. Routine refreshing retains stale freshness with null statusMessage; genuine
issues retain safe messages. No SQL migration, event/cursor rewrite or stored credential change.

## Morning Routine profiles (D-123)

Migration `0035_morning_routine_profiles.sql` converts saved configuration to canonical `schoolDays`
and `weekends` profiles, each with disjoint assigned days, a countdown flag and its own original
configuration shape. It preserves the settings revision and exact School lists/IDs/selections/times.
Weekends starts Saturday–Sunday with the same explicit participants, empty lists and countdown off.
The original flat API `configuration` is now a derived School-only compatibility projection, not a
second stored authority. Legacy settings saves preserve the entire Weekend profile and assignments.

Progress gains `profile_id` in its primary key: household, local date, profile, person and step.
Old progress rows become `schoolDays` with completion/version/timestamp retained. No checks transfer
between profiles or dates. Existing receipt JSON and input hashes remain byte-for-byte untouched;
optional v1 completion profile identity is interpreted only after hashing. Settings/check/audit/
receipt atomicity and access/module boundaries remain. See MORNING_ROUTINE_CONTRACT.md.

Before live migration, retain a matching v34 database backup. Compare old configuration with new
`profiles.schoolDays.configuration`, and old progress with School rows projected without profile ID;
raw config/progress hashes intentionally change. Receipts and unrelated data must remain unchanged.
A v34 rollback restores its matching database, not the v35 representation. Local fixture tests are
separate from this private preservation check; no live migration is implied.

## Original Morning Routine (D-120)

Migration 0034 extends the fixed module catalogue without enabling the new module or changing
existing overrides/credentials. `morning_routine_settings` stores revision + validated configuration
per household; routines retain stable person/step IDs and explicit selected people. Missing initial
settings derive all current children with empty lists, 07:00–08:00. `morning_routine_progress` is
keyed by household, local date, person and step, with a completion boolean and monotonically
increasing version. New dates read unchecked defaults without erasing history. Actor-scoped
`morning_routine_receipts` bind request hashes and results. Settings/check/audit/receipt commit
together. Audit metadata omits titles; routine contents stay in the private database/backup boundary.
No user-specific list is seeded. See MORNING_ROUTINE_CONTRACT.md for bounds and concurrency.

## NBA preferences and additive catalogue (D-113)

Migration 0033 rebuilds only the `household_modules` fixed-ID check to admit `nba`, preserving
all overrides. It adds household-owned `nba_settings` and actor-scoped `nba_settings_receipts`;
audited saves are atomic and exact retries do not reapply old settings. No game/player history
is persisted. NBA defaults off when an override/old wire field is missing; the original eleven
still default on. Access/device records are untouched. HA connection JSON gains approved
`moduleIds`, defaulting to the frozen eleven for legacy grants.

D-114 adds optional nullable public numeric `playerId` to the projected highlight DTO, with a
null default for legacy/demo data. It identifies only available optional artwork; malformed IDs
do not invalidate scores. No provider URL, image, player history or new household row is stored.
Team accent colours are fixed presentation metadata. No additional migration is required.

D-115 adds validated ephemeral `NbaGameDetail`/team/player/named-stat DTOs, not database tables.
Player IDs remain public numeric provider identities; no private household data is sent to ESPN.
Totals are reported by the feed, not reconstructed from partial rosters. Missing stats and DNP
remain null; shooting made/attempted pairs obey made ≤ attempted. No SQL migration or existing
household/source/access record change. The original overview score fields remain compatible.

## Retained household Modules (D-112)

Migration `0032_household_modules.sql` adds fixed-ID boolean overrides keyed by household/module,
and durable exact-retry receipts keyed by household/actor-scope/request. Missing legacy override means on (NBA is off under D-113).
The setting, receipt and `module.update` audit commit atomically. Exact retry returns the original
receipt without restoring an older flag over a later command; changed reuse conflicts. Feature
tables, independent Today preferences, provider settings and device grants are not deleted or rewritten.
`modules.changed` invalidates clients. Grants/pending HA approvals store optional `controlModules`
in existing JSON; missing means false, with no bulk upgrade of old rows. New approval explicitly
sets it true. No credentials or private module content enter module audits/receipts.

## Explicit bundle approval (D-111)

No data-model or migration change. New UI approval captures all current unrevoked screen IDs
(maximum 20) and explicitly true sharing/control flags. Legacy false flags remain false until a
fresh adult-approved grant replaces them. Newly paired screens and future capabilities are not
implicitly added. Exact retry retains the original request and screen set despite query changes.

## Human connection requests (D-110)

Migration `0031_connection_codes.sql` is additive: digest-only phone invitation codes (FK cascade
to existing invitations) and bounded HA pairing records with unique request/secret/code digests,
expiry, permissions and exact approving connection/session-hash reference. No raw code, machine
credential or adult cookie is persisted. Existing phones, screens, grants and household data are
not rewritten. HA's raw credential belongs only in its protected config entry after exchange.

## Home Assistant inbound grants and screen commands (D-108)

Migration `0030_home_assistant_bridge.sql` adds a digest-only connection per household (at most
one active), explicit selected Hearth screen IDs and read-sharing flags, idempotent grant/revoke
receipts, and bounded screen-command receipts. No raw automation key, HA credential, provider ID,
chore title or calendar payload is persisted by this bridge. Command receipts contain only Hearth
connection/device/instance/request IDs, tab, status, timestamps and input digest; command rows are
pruned after 24h. Existing household, TV and phone records remain untouched by the migration.
Screen presence/observed routes are ephemeral and expire after 15s; restart cancels pending delivery
while preserving recent idempotency receipts. Revocation cancels pending commands immediately.
New grants require a fresh random key. `home-assistant.bridge.grant`, `.revoke` and `screen.navigate`
audit entries distinguish adult approval from service requests; queue acceptance is not delivery proof.
The unpublished migration also includes D-109's `home_assistant_bridge_chore_receipts`, keyed by
connection/request. It retains an input digest, reservation timestamp and nullable safe status receipt
(occurrence/date/state/completion ID/replayed); no titles or secrets. Existing atomic domain receipts
recover interrupted response persistence. Chore receipts remain durable with the grant, unlike 24h
screen navigation receipts. `controlChores` defaults false for old grants and requires read sharing.
Completion/undo uses the existing audit trail and earnings calculations, not a second chore ledger.

This document defines conceptual entities and invariants. Concrete table/column names may evolve through migrations, but ownership and history rules should remain stable.

## Device-local games and external puzzle data

The supplied Connections archive is not a SQLite table or source fixture. Each imported puzzle
has a unique number/date, four groups and difficulty levels, and a unique sixteen-tile starting
board. The immutable API identifier includes a content digest. Catalogue entries expose only
identifier, number and date; individual reads return the board and groups.

Browser progress (version 2) contains at most eight validated four-tile guesses and a permutation
of the sixteen original tile indices. It is scoped by runtime mode and household, capped at 2,000
recent attempts and validated against the actual board before reuse. A separate index retains up
to 5,000 completed IDs, including after replay or attempt eviction. The requested one-time reset
discards v1 game storage only; v2 records survive later visits/releases. No member name, answer text,
household mutation, token or passkey enters this store. Progress is not synced between devices and
is not included in household database backups. The external archive is included when the complete
Hearth data directory is backed up, not by a SQLite-only recovery copy.

The additive v2 `lastPuzzleId` (D-117) is one nullable opaque catalogue identifier, not a puzzle
number or answer payload. Older records without it remain valid; their most recent attempt is
the best-effort entry choice. Invalid pointer data is ignored without discarding valid attempts
or completion IDs. Opening an untouched board updates only this pointer; loading failures and
invalid explicit links leave it unchanged. The same runtime/household scope and storage bounds apply.

## Identity and tenancy

### Household

- `id`
- `name`
- `timezone` — defaults to `Australia/Perth`
- locale and week-start preferences
- created/updated timestamps

The first deployment serves one household, but household IDs remain explicit so test data and future separation are safe.
First-use setup rechecks this singleton inside its write transaction after reading the external
one-time owner key (D-102). Local-date wire values must represent real Gregorian dates, including leap-year rules.
Timezone settings must be supported by the platform formatter before they can be persisted.

### Member

- `id`, `household_id`
- display name
- original colour/avatar settings
- role/capabilities
- active/archive state
- optional external calendar identity mappings

Known example data such as Ezra must be seeded only in demo/development data until the household configuration is intentionally created.

### Actor

Audit commands identify an actor as one of:

- authenticated member
- paired television device
- Home Assistant service/voice pipeline acting for a member or household
- scheduled system job
- external calendar synchroniser

### Member avatar derivative

- household/member identity, with a database guard that they match
- normalized `image/jpeg` bytes, bounded to 1 MB
- content-derived version key used only for same-origin cache invalidation
- original opaque avatar key retained for restore
- created/updated timestamps

The chosen original image is not retained. Avatar command receipts and audit summaries contain only
member/result metadata, never the base64 payload. This small identity image is separate from the
Synology-backed family-photo collection.

## Calendar projection

### Calendar connection

- provider type
- household/member owner
- credential reference, never raw secret content
- sync status, last success/error category
- opaque incremental cursor plus bounded local-date sync window
- read/write capabilities and approval state

Migration `0011_calendar_connection_setup.sql` adds the adult-facing safe
setup projection: provider type, family label, server hostname, masked account
hint, readiness, selected calendar names/colours/owner mappings and test/success
timestamps. It deliberately has no username, password, full server URL or raw
collection URL column. The external mode-0600 secret file remains the only
persistent credential source; a pending discovery test is memory-only and
expires after ten minutes.

### Calendar

- provider-stable external ID
- connection ID
- display name, colour and visibility
- owner/member mapping
- read-only/write policy

### Calendar event projection

- internal opaque ID plus provider external ID/version
- calendar ID
- title, description, location
- all-day flag
- start/end instant plus an inclusive household-local date range
- recurrence/master relationship and explicit exception state where the provider exposes it
- attendee/organiser summary only as needed
- source modified time and Hearth sync time
- deleted/tombstone state

The provider is authoritative. This table is a local projection/cache and pending-command aid, not a competing calendar.

The browser-safe `WeekSchedule` day model may include a nullable compact daily
forecast containing a normalized condition code, family-readable label and
Celsius temperature plus a bounded `demo` or `open-meteo` source identity for
correct display attribution. Phase 1 demo forecasts remain deterministic seeded
data. Private forecasts are transient server-cache projections from Open-Meteo.
Daily forecasts also carry optional nullable `maxWindSpeedKph` (0–500) and
`dominantWindDirectionDegrees` (0–360). They mean the daily maximum sustained wind and prevailing
direction, not current conditions. Older cached responses may omit them; missing never means calm.
The selected household weather location is a small SQLite-owned setting; raw
forecast/provider payloads are not persisted.

### Weather location

- one row per household
- family-readable place label
- latitude and longitude constrained to WGS84 ranges
- source (`search` or `device`)
- created/updated timestamps

Saving requires a successful short-lived test result and uses an idempotent
command receipt plus safe audit event. The adult settings response may return
the coordinates under an Advanced disclosure; Today, Week, TV and public
forecast contracts never include them. Environment coordinates are fallback
configuration only and do not overwrite a saved household row.

The browser-safe `MonthSchedule` is a read projection rather than a new stored
calendar model. It contains a Monday-first 42-day grid window, normalized events
overlapping that window and the same browser-safe calendar descriptors used by
Week. Date cells render event colours only; the source/member avatar and label
remain in a separate key so colour is never the sole identity cue.

Provider deletions are retained as tombstones so a cancelled occurrence cannot
reappear merely because the provider is temporarily unavailable. Raw provider
errors and credentials are not projection data.

For the first real adapter, `provider_type = 'caldav'`. Calendar collection
URLs and reversible server-only event references may occupy the existing
external-ID columns, while browser responses continue to expose only hashed
Hearth IDs. A bounded CalDAV refresh is authoritative only for its requested
date window: the transaction hides collections absent from discovery,
tombstones active rows overlapping that window, then restores returned rows.
The external credential/config file is never stored in SQLite.

## Chores and routines

### Chore template

- household ID
- title, description and optional icon
- default assignee set
- recurrence rule
- time-of-day grouping, constrained to Morning, After school, Evening, Bedtime or Anytime
- optional available-from and due-by local times
- stable household-local display order
- active date range and archive state
- creation/update history reference

### Chore occurrence

- stable occurrence ID
- template reference plus snapshotted title and optional description
- scheduled local date plus snapshotted available-from and due-by times
- snapshotted display order
- exactly one assigned member
- state: pending, completed, skipped, excused or cancelled
- completion/skip timestamp and actor where relevant
- immutable audit history for completion, undo, skip, excuse and reassignment; adult exception
  records include a bounded family-readable reason and reassignment records include prior/new member
  identity

Template edits do not rewrite historical occurrences. Generate occurrences within a controlled horizon and enforce a uniqueness rule for template/date/instance.
Read-driven materialization is limited to the household-clock window from Monday seven weeks before
the current week through Sunday of the next week. This covers the eight-week pocket-money review
selector and one full upcoming week. Reads outside it return existing stored occurrences only; they
do not fabricate missing historical records or allocate distant future snapshots. Existing history,
payment snapshots and ID-based correction commands are unchanged. New private occurrences use the
injected runtime timestamp and never inherit fictional demo completion state.
Each member in a template's default assignee set expands to a distinct occurrence for the same
template/date/instance. Completion, exception history and pocket-money eligibility therefore remain
per person; one child's completion never completes another child's copy. The existing
`chore_template_assignees` primary key and occurrence uniqueness key already enforce this model, so
multi-assignee authoring does not require a new migration.
The active template order is a complete, gap-free logical sequence scoped to a household. Reorder
commands must name every active template exactly once. Generated occurrences snapshot that order
and both optional window boundaries, so changing a future schedule never rearranges or retimes
already materialized household history.
One-off templates use an explicit once-only recurrence and equal start/end local dates. Archiving
stops new generation and changes any non-completed occurrence on the household's current local date
to `cancelled`; household Today/Chores reads omit that retained row while completed occurrences stay
visible. Restoring begins a new active window on the supplied household-local date, reopens a
cancelled occurrence on that exact resume date as pending, and moves a restored one-off to that
date. Dates inside the archived gap cannot be manufactured later merely by browsing history.

### Routine

- name, ordering and active time window
- member applicability
- contained chore template references/order

Routines group chores; they do not duplicate completion state.

## Pocket money

### Pocket-money setting

- household and child member
- required weekly amount in integer Australian cents
- payday, constrained to a weekday name
- creation/update timestamps

Only active child members may receive a setting. New children appear as unconfigured until an adult supplies the required weekly amount and payday.

### Pocket-money payment

- household and child member
- Monday week start and Sunday week end
- scheduled and completed counts at payment time
- completion percentage and proportional amount in cents
- optional parent note
- payment timestamp, adult actor and source

There may be multiple immutable partial payment rows for a child/week. The service sums only active
rows and prevents their total exceeding the amount due. The denominator covers the complete
Monday–Sunday schedule, including occurrences later than the selected as-of date. Chores in
`excused` or `cancelled` state are excluded; `pending` and `skipped` remain incomplete. Migration
`0009_pocket_money.sql` introduces the original records; migration
`0014_pocket_money_payment_history.sql` removes the one-row-per-week constraint and adds notes
without rewriting prior snapshots.

### Pocket-money payment void

- one-to-one payment reference
- required family-readable correction reason
- correction timestamp, adult actor and companion source

A payment is never edited or deleted. A mistaken record receives at most one separate void row; it remains in history but no longer contributes to the active paid total. Payment and void commands each use their own idempotency receipt and audit event. The former reward tables from migration 0005 remain dormant for forward-only migration safety; no active source contract, route, UI or chore command reads or writes them.

## Lists

### List

- household ID
- name, type, colour and ordering
- owner/member visibility
- active/archive state

### List item

- list ID
- text and optional quantity/note
- assignee and due date where relevant
- position
- checked state, checked time and actor
- archive state

Repeated voice additions should use a command request ID and sensible normalisation to avoid accidental duplicates without preventing intentional duplicates.

Migration `0005_household_planning.sql` already supplies the forward-only list
and item archive/order columns used by the adult management commands. Clearing
checked items soft-archives them; it does not erase their audit or command
history. An archived list remains recoverable, and the final active list cannot
be archived.

## Reminders

### Reminder list

- household-owned opaque identifier and title
- incomplete count derived from active reminders
- archive timestamp reserved for later multi-list management

### Reminder

- household and reminder-list relationship
- title and optional date-only due date
- optional due instant with an explicit `hasDueTime` flag for future timed-reminder support
- completion flag and completion timestamp
- created/updated timestamps and a soft-delete timestamp

Create, edit, complete, reopen and remove commands use opaque request IDs. The reminder mutation,
command receipt and audit event commit atomically. Retrying the same request replays the original
typed result rather than duplicating work. Migration `0027_native_reminders.sql` removes the retired
Apple source/device/projection/receipt tables and creates the Hearth-owned reminder tables.
Creation enforces 1,000 non-deleted reminders transactionally, including completed records; updates,
completion, deletion and replay remain available at capacity. Legacy over-limit overviews return a
bounded first 1,000 with `hasMore: true` and truthful total counts so records can be removed without
losing data. Invalid legacy due dates are retained in storage but exposed as null with
`dueDateUnavailable: true`; editing provides an explicit correction rather than crashing rendering.

## Meals

### Meal

- saved family meal name
- optional description/notes and bounded preparation minutes
- favourite state used for ordering and concise family counts
- nullable archive time; archived meals remain in historical plans and can be restored

### Meal plan entry

- household local date
- meal slot such as breakfast/lunch/dinner
- saved meal reference or free text
- note and actor

An adult may replace the displayed week's entries in one command, clear the week after explicit
confirmation or copy one Monday–Sunday week to another. These commands validate every date against
the target week, reject duplicate date/slot pairs and commit the plan mutation, command receipt and
audit event together. Copying snapshots the meal name and retains a saved-meal reference only while
that saved meal is active. Duplicate request IDs replay the original typed result.

Recipe/ingredient modelling is deferred. Grocery linkage should use explicit generated list items with source references so changes remain understandable.

## Photos and ambient content

### Photo asset

- provider/path-relative opaque ID
- approved source collection
- safe derivative URLs/keys
- dimensions, orientation, capture time where available
- favourite/hidden state
- last shown time
- source fingerprint, asset readiness and index time
- bounded source kind and permanent-deletion capability for adult curation; never a source path

Do not expose Synology filesystem paths to clients. Derivatives should avoid repeatedly sending original multi-megabyte files to the television.

`TodaySummary` may carry one nullable, same-origin photo preview containing only
a safe derivative URL, family-readable alternative text, normalized orientation and optional source
dimensions used for exact-ratio layout. `PhotoGallery`
returns the approved collection summary, source readiness, freshness, one
nullable featured opaque ID and orientation-aware assets containing only safe
same-origin display/thumbnail URLs. Phase 7 selects the Today preview through
that same injected adapter. Demo mode uses fictional bundled derivatives;
private mode always exposes the managed collection and upload capability. Adult-only
`PhotoSourceIndexStatus` adds aggregate managed/imported/ready/hidden/unsupported/corrupt counts,
the optional folder-import state and path-safe curation rows for ready assets. Those rows contain
only opaque IDs, same-origin derivative URLs, presentation metadata, favourite/hidden flags, the
bounded `hearth-upload | synology-folder | demo` source kind and whether permanent deletion is
supported. Neither response exposes its Synology path.
Migration `0015_synology_photo_index.sql` adds the source fingerprint and scan-status index used for
incremental refresh; the first adapter uses filesystem modification time as `capturedAt` after
orientation correction rather than claiming EXIF capture-date fidelity.

### Managed photo upload

D-122/D-124 change operational byte/queue limits only: up to 25 MiB per raw image, unchanged 120-million
input-pixel bound, serialized preparation and smaller newly generated upload thumbnails. The master
hash/receipt format is unchanged. No migration or rewrite of existing photos is performed; browser
queue state and original filenames remain ephemeral and are never added to SQLite.

- opaque upload and asset IDs
- household and authenticated adult actor
- content hash and byte size for deduplication/limits
- opaque private master key
- upload time and fixed companion source channel

Migration `0023_managed_photo_uploads.sql` adds one managed-upload row per asset, unique
household/content hashes and a path-free `photo_folder_import_status` projection. Managed master
WebPs live under `/data/photo-uploads`; display/thumbnail WebPs live under
`/data/photo-derivatives`. Neither a client filename nor an original host path is persisted. The
database online-copy feature protects metadata, while encrypted Synology backup of the complete
Hearth data directory protects the managed image files themselves.

Permanent deletion removes the managed master and its display/thumbnail derivatives, deletes the
`photo_assets` row and lets its `photo_managed_uploads` row cascade. The idempotent command receipt
and path-free `photo.delete` audit event remain. An optional-folder asset can be hidden but never
deleted through this command; its original remains governed by the mounted Synology folder and is
removed from Hearth only after the source is removed and the folder is checked again.

### Announcement

- opaque ID and household ID
- concise message (maximum 240 characters)
- Standard or Important priority
- start time and nullable expiry time
- archive, created and updated times

`today_section_preferences` stores one row per household for Dinner, List
summary, Notice, Reminders, Daily Bible verse and Family photo visibility. `announcements` is append/update/
archive managed through adult commands; the active Today notice is the eligible
Important notice first, then the most recently updated eligible notice. The
browser never chooses priority ordering itself.

Migration `0024_daily_bible_verse.sql` adds the off-by-default verse flag and
`daily_verse_cache`. The cache is keyed by household and bounded passage reference and stores only
attributed display text/source URL plus fetch time. The API token remains an external server secret
and is never a database field.

## Home actions

### Home action definition

- stable Hearth action ID
- display label/icon/category
- mapped Home Assistant target
- typed input schema
- required confirmation level
- allowed roles
- enabled state

Hearth stores no Jellyfin library, Music Assistant connection or media/player projection. The separate Home Assistant/Music Assistant deployment owns its own source, queue and player configuration. The Home Assistant power-safety adapter exposes only a generic protected-media-active boolean covering native-app and Cast playback; it must not turn Hearth into a playback controller.

Migration `0006_home_assistant_projection.sql` stores the last successful
curated state: occupancy, television power, Hearth-foreground state, the
generic protected-media boolean and observation/cache timestamps. Home action
receipts and audits reuse the generic command/audit tables. Raw entity IDs,
service payloads and media metadata are deliberately absent.

Migration `0019_home_assistant_connection_setup.sql` stores one credential-free connection
projection per household: opaque connection ID, family label, hostname, instance/version, status,
friendly state/action mapping labels and check timestamps. The Home Assistant root URL, long-lived
token and seven raw entity IDs exist only in the separate mode-`0600` server secret file. Test
discovery retains them for at most ten minutes in process and exposes only opaque option IDs; save
and removal are normal adult-authorised, idempotent and audited commands.

## Devices and sessions

### Paired device

- device ID/name/type
- credential hash/reference and scopes
- paired/last-seen timestamps
- revoked state
- application version and basic capabilities

Migration `0002_admin_and_pairing` implements the initial paired-device and
short-lived pairing-request records. Migration `0007_tv_device_credentials`
adds the SHA-256 credential hash, requesting shell version and exchange time.
The server never stores the raw television pairing secret. Android retains it
encrypted by a non-exportable Keystore key. On an approved non-Android browser display, Web Crypto
creates the same 256-bit secret and holds it only in volatile page memory until the server installs
it as a persistent `HttpOnly`, `Secure`, `SameSite=Strict` device cookie. It never enters a URL,
browser storage, response body, audit row or log; clearing site data requires re-pairing.

### Session

The private companion stores a random-session SHA-256 hash, household/member/phone-connection
references, created/last-seen/expiry, recent explicit-consent and revocation timestamps. New
phone sessions have 180-day absolute and 90-day idle bounds. Legacy credential references and
their 30-day expiry remain for transition; no unverified actor/handset identity is invented.
Raw session tokens exist only in the
`HttpOnly`, `Secure`, `SameSite=Strict` browser cookie and never enters logs, audit rows or SQLite.

### Phone connection, invitation and owner grant (D-102)

D-104's future native appliance identity/commissioning metadata remains validation-only. The
browser recovery extension is migration `0029_phone_recovery.sql`: a household owner-member
policy with explicit **trusted connection IDs**, monotonic card generation, digest-only pending/
active/consumed/revoked cards, hashed claim context/exact request/name receipt binding and bounded
idempotent command fingerprints. A partial index permits one non-revoked owner and one active
card per household. Invitations distinguish normal connection from frozen-owner replacement.
No raw QR proof/session secret persists, and migration assigns no trust or revocation. Normal
invitees cannot inherit trust through member identity. See
[the staged contract](APPLIANCE_ONBOARDING_CONTRACT.md).

Migration `0028_controller_phone_connections.sql` adds independent controller connections,
short-lived digest-only QR invitation/browser-claim records, and one-time owner grants bound to
an existing adult controller. `source=owner` also marks protected main-phone ownership (D-103),
including after session expiry. Only a deliberate saved-card/trusted-phone or backend grant transaction retires prior owner
connections, sessions and invitations and issues the replacement; secondary connections remain.
Ordinary QR never sets this provenance. Owner-member admin/archive protection is server enforced.
Public connection IDs are random, never session hashes. Each
established legacy session gets its own earlier-browser connection; synced credentials are not
treated as phones. Invitation rows are capped and expired rows pruned; short-lived exact exchange
retry cookies exist only in process memory, never SQLite. See
[the contract](PHONE_CONNECTIONS_CONTRACT.md) for state and retention bounds.

### Historical passkey credential (no new production enrollment)

- opaque credential row ID and WebAuthn credential ID
- household/member and WebAuthn user references
- credential public key and signature counter
- authenticator transports, device type and backup state
- user-facing label, created/last-used timestamps and revocation state

Registration challenges and the one-time first-use code are ephemeral and never stored in this
table. Migration `0012_passkey_authentication.sql` implements both credential and companion-session
records.

### Historical companion recovery code (superseded by owner phone grants)

- opaque recovery-code row ID and household/member references
- SHA-256 code hash; never the displayed code
- creating adult, created/expiry timestamps and consumed/revoked state
- at most one active code for a household member

Migration `0020_adult_access_recovery.sql` links new companion sessions to their authenticating
credential and adds these one-time recovery records. Recovery expires after 180 days. Successful
use consumes the code and revokes the recovered adult's prior passkeys and sessions before issuing
the replacement session.

D-097 reuses this digest-only table for local NAS-owner recovery, with a 15-minute rather than
180-day expiry. For this operator exception the legacy non-null `created_by_member_id` FK identifies
the beneficiary, not a claimed browser actor. The mandatory same-transaction audit records the
actual `system` issuer (`nas_owner_uid_<uid>`, source `system`, summary `issuer: nas-owner`).
Never infer an authenticated member ceremony from this legacy field. Issuance replaces only that
adult's prior unused code and does not revive a revoked key or create a browser session.

## Audit event

Required fields:

- event ID and timestamp
- household ID
- actor type and actor ID
- source channel: TV, companion, voice, automation, sync or system
- command/action type
- target type and target ID
- request/idempotency ID where applicable
- result: succeeded, rejected, failed or reversed
- safe structured summary

Sensitive descriptions, provider tokens and full external payloads do not belong in the audit event.

The adult-only recent-activity read projection returns at most 100 existing safe audit summaries,
newest first; the current companion asks for 50. It never reads `request_id`,
`safe_summary_json`, provider credentials, raw calendar payloads or backup host paths into the
browser contract. Actor and target IDs remain opaque contract fields for typed correlation, while
the interface resolves known actors to family/device labels and never renders those identifiers.
This is a projection of the one audit table, not a second activity log.

## General persistence rules

- Opaque IDs at API boundaries.
- UTC instants in storage; explicit household timezone for local-date rules.
- `created_at`/`updated_at` on mutable records.
- Archive/tombstone externally referenced records rather than casually deleting them.
- Transactions encompass domain mutation plus audit creation.
- Foreign keys and uniqueness constraints enforce invariants already checked in code.
- Schema changes use reviewed migrations and backup/restore tests.
- Online recovery copies are external mode-restricted SQLite files, not rows or downloadable
  assets. Only the manual/scheduled command receipt and safe audit summary live in the database;
  backup host paths never enter a browser contract, receipt or audit event.

## Current migration and runtime boundary

Migration `apps/server/src/migrations/0001_household_core.sql` establishes the
forward-only household/member, calendar connection/projection, chore
template/occurrence, command receipt and audit-event foundation. Automated
smoke tests enable WAL and foreign keys and exercise uniqueness and foreign-key
failures against a temporary SQLite database.

Migration `0002_admin_and_pairing.sql` adds explicit member capabilities,
short-lived pairing requests and revocable television devices. Migration
`0003_chore_runtime.sql` adds template assignees plus occurrence skip metadata.

Migration `0004_calendar_projection.sql` adds durable provider cursor/window
state, recurrence-exception metadata and local-date projection indexes.
Migration `0005_household_planning.sql` adds household lists/items, saved meals,
meal-plan entries and the now-dormant historical reward tables. A
unique reversal reference prevents reversing the same ledger entry twice, and
a partial unique index prevents awarding the same chore occurrence twice.
Migration `0006_home_assistant_projection.sql` adds the minimal cached household
power/presence projection. Migration `0007_tv_device_credentials.sql` upgrades
the pairing record for proof-of-possession exchange without storing a bearer
secret.
Migration `0008_photo_library.sql`, `0009_pocket_money.sql`,
`0010_member_avatars.sql` and `0011_calendar_connection_setup.sql` add the
approved photo projection, proportional pocket-money records, bounded member
avatar derivatives and credential-free calendar-setup metadata respectively. Migration
`0012_passkey_authentication.sql` adds public-key credentials and hash-only revocable companion
sessions without storing a setup code or raw bearer token.
Migration `0013_notices_and_today_sections.sql` adds bounded Today visibility settings and expiring
household notices. Migration `0014_pocket_money_payment_history.sql` adds immutable partial-payment
notes and reasoned one-to-one voids.
Migration `0015_synology_photo_index.sql` adds the fingerprint and bounded status index required by
the read-only Synology photo scanner without storing a source filesystem path in asset rows.
Migration `0016_meal_planning_polish.sql` adds nullable, bounded preparation minutes and an index for
active/favourite saved-meal ordering. Existing meal-plan rows and historical saved meals remain
valid without rewriting household data.
Migration `0017_chore_occurrence_management.sql` adds nullable description and due-time snapshots to
existing occurrence rows, backfills them from the referenced template and adds the targeted audit
history index. Skip, excuse and reassignment remain command/audit rows rather than mutable history
blobs; no reason text is placed in a browser-visible receipt beyond the typed result.
Migration `0018_chore_windows_and_order.sql` adds optional available-from time and deterministic sort
order to chore templates, snapshots both window boundaries and order onto occurrences, and backfills
existing rows without rewriting completion state. A household/order index supports the adult
schedule and occurrence queries.
Migration `0019_home_assistant_connection_setup.sql` adds only the safe Home Assistant connection
projection described above. JSON validity and provider/status checks are enforced in SQLite; raw
provider secrets and entity IDs remain outside the database.
Migration `0020_adult_access_recovery.sql` links companion sessions to passkey credentials and adds
one-active-per-adult, digest-only recovery records. The forward migration links older sessions when
the pre-upgrade adult has exactly one active credential; ambiguous rows remain unlinked rather than
guessing. Legacy credential-based sessions carry their credential reference so a lost passkey can be
revoked narrowly.

The Phase 2 demo runtime injects the SQLite implementation of the same
repository boundary. It generates supported one-off, daily and weekly occurrences on
query, snapshots title/routine/assignee identity, and commits occurrence
mutation, audit and idempotent receipt transactionally. Duplicate request IDs
replay the stored typed result. The in-memory repository remains available only
for fast isolated contract tests.

Migration `0021_routine_time_of_day.sql` normalizes historical free-text routine labels into the
five supported time-of-day values. Browser commands and read models use the same enum while the
existing `routine_label` column names remain for forward-compatible storage.

Migration `0022_weather_location.sql` adds the single constrained household
weather-location row. It stores no browser permission state, street address,
provider response or API credential.

Migration `0023_managed_photo_uploads.sql` links each private managed master to its opaque photo
asset, authenticated adult, content hash and bounded byte size, and persists path-free optional
folder-import health. Client filenames, source paths and image bytes do not enter SQLite.

Migration `0024_daily_bible_verse.sql` adds the off-by-default Today verse preference and bounded
attributed fallback cache. Migrations `0025` and `0026` are retained only as forward migration
history for installations that briefly ran the retired Apple proof. Migration
`0027_native_reminders.sql` deletes that projection and all source credential hashes, creates
household-owned reminders and retains the default-on Today Reminders visibility preference.

The Phase 4 runtime stores list, meal, pocket-money and recurring-chore administration
on the same SQLite connection. Voice list commands resolve a normalized list
name before mutation, return `AMBIGUOUS_TARGET` rather than choosing among
multiple matches, reject active exact-item duplicates, and replay a prior typed
result when the same request ID is retried. Pocket-money settings, immutable partial weekly
payment snapshots and reasoned one-to-one voids use the same idempotent, audited command path. The
former reward tables remain dormant migration history and are not read or
written by the runtime.
New additions are limited to 100 unarchived items per list, checked or unchecked, after receipt
lookup inside the transaction. Clear/archive releases capacity. Existing oversized lists, their
original typed receipts, completion and cleanup remain available without truncation. This bounds
new growing-list amplification; it is not universal byte-bounded receipt storage for legacy lists.
Saved meals and whole-week dinner mutations use the same repository boundary. Adult-only create,
update, archive, restore, batch save, clear and copy operations are transactional, audited and
receipt-idempotent in both the SQLite runtime and injected in-memory contract tests.
Chore-template creation/update accepts one-off or recurring schedules. Archive and restore reuse the
existing forward-compatible active-range/archive columns, retain completed history, cancel only the
archive date's unfinished occurrences and write their own idempotent receipts and audit events; no
migration is required.
Active template reordering is an adult-only, receipt-idempotent command requiring the exact active
template set. Creation appends; edits preserve position. The SQLite transaction updates every
position and its audit event together, while occurrence generation snapshots the active position
and optional time window.
Adult occurrence-management commands require a bounded reason. Skip keeps the occurrence eligible
and incomplete, excuse moves pending/skipped work to `excused`, and reassignment moves pending or
skipped work to another active member and resets it to pending. Mutation, audit event and receipt
commit in one SQLite transaction; the adult-only detail query reconstructs newest-first history from
safe audit summaries.
