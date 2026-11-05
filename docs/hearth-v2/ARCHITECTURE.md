# Hearth v2 architecture

## Shared routines and canonical chore references (D-136)

One fixed-period MorningRoutineService instance per routine shares implementation with separate
SQLite settings/progress/receipts and audit/event names. Existing morning table/receipt identity
is preserved. `routine-chores.ts` projects references from canonical due occurrences, gated before
Chores reads. Family UI sends the existing idempotent Chores complete/reversal command for a linked
row; it never writes a separate routine check or duplicates accounting. Optional template identity
is a Hearth ID on the safe occurrence DTO. New-link assignment validation runs inside the settings
command after replay/CAS checks. No provider, background process, credential or network change.
Canonical details: MORNING_ROUTINE_CONTRACT.md. The original independent-checklist design below
continues for plain steps; D-136 explicitly supersedes it for linked chores only.

## Fitness exercise library (D-129)

`FitnessLibraryService` adds separately versioned reusable instructions/clip metadata and private
files beside SQLite; migration 0037 adds receipts and retired IDs. `FitnessService` validates new
library links inside its existing exact-retry transaction. The optional stored field has no parser
default, so earlier hashes remain valid. Same-origin range transport is household/module gated;
adult-only writes use bounded raw MP4, immutable hashes and content-free transactional audit.
The React library route stays behind adult/module guards; one workout dialog swaps to a silent
inline player and preserves its exercise DOM/scroll. Media events drive Play/Pause; Back restores
focus. No new provider, runtime dependency, background work or native TV bridge. See D-129 and
[FITNESS_CONTRACT.md](FITNESS_CONTRACT.md) for limits, deletion, backup and error semantics.

## Fitness service (D-128)

`FitnessService` uses the existing SQLite connection and injected household clock, shared Zod wire
schemas and pure core schedule/streak functions. Effective-dated configuration replaces only a
pending next-day plan, so current/past schedules do not change with later edits. Progress is keyed
by home/date/person/workout, with compare-and-swap versions and atomic actor-scoped hash-bound
receipts/audits. Reads calculate bounded seven-day sessions and streaks from retained plan periods
and completed dates; they do not materialize arbitrary history. Workouts reference one goal belonging
to their person; absent/null references preserve earlier unassigned routines. Goal titles on daily
sessions resolve against that date's plan; later edits cannot rewrite historical labels.
Goal routines are read projections over the same normalized workout list. Streaks aggregate every
active goal's due workouts, skipping achieved goals from their effective date onward. Writer leases,
module gates, adult settings isolation and `fitness.changed` reuse existing infrastructure. React uses lazy routes,
query invalidation, draft protection and no new dependency, provider, background worker or secret.
See [FITNESS_CONTRACT.md](FITNESS_CONTRACT.md).

## Shareable setup boundary (D-127)

The new installer operates only on a fresh private directory and its unique Docker Compose project.
It selects a successful main verification with published images, checks revision labels, binds web
to loopback and creates a private local first-use QR. No new public claim API or host-network policy.
Its explicit portable update command checkpoints complete stopped data/photos/secrets, verifies SQLite,
and restores matching data/configuration on failed readiness; this is not the Synology root agent.
Get started and Connections consume existing adult read models under the existing shared-screen
boundary; no new schema, migration or authority. Code-only deterministic setup downloads are generated
at web build time. The HA installer replaces only its own component with a private rollback copy,
never HA config entries/automations or secrets. See SHARING_SETUP_CONTRACT.md.

## Read-only indoor climate (D-126)

A separate narrow IndoorProvider reads selected HA measurement states and Recorder statistics.
IndoorClimateService owns actor-bound discovery, versioned external source settings, safe command
receipts/audits and four coalesced memory-only period caches. The existing household/controller
boundaries protect routes; the Weather module lease gates all I/O. Home controls and inbound HA
machine permissions remain separate. The private mode-0600 indoor source file sits beside existing
HA secrets (or at HEARTH_INDOOR_CLIMATE_CONFIG_PATH). No sensor history enters Hearth SQLite.
The same typed adapter seam has a deterministic fake for demo/tests. React owns measured SVG
charts and URL-backed selections; no browser-to-HA traffic or new chart dependency.
The existing outbound safety/script adapter remains unchanged except sharing its bounded transport.
Root-owned NAS egress policy remains separate from adult source settings. The commissioned
owner-approved exception permits only the configured HA host/port from Hearth's existing bridge;
changing a source cannot automatically widen it. Existing bridge/DNS policy and inbound exposure
remain unchanged. See INDOOR_CLIMATE_CONTRACT.md; commissioning/publication and physical proof
remain separate acceptance gates.

## Calendar refresh feedback (D-125)

The projection separates routine refresh activity from issue copy. Its transient `refreshing` flag
maps to additive `calendarRefreshing` in Today/Week/Month DTOs (default false for old payloads),
while freshness remains stale until confirmed current. Routine statusMessage is null; integration
diagnostics remain honest, and actual provider/auth/configuration messages remain intact. No new
storage or scheduler. The shared client feedback renders a non-live heading ring for a pending read
or server refresh, and preserves provider errors, cached-read failures and offline banners. Existing
read-only adapters, D-086 queue/backoff, query policy and current device/auth boundaries are unchanged.

## Photo management and bounded uploads (D-122/D-124)

The existing adult-only raw-image command keeps its typed response, actor validation, receipts,
audit, private storage and imported-original protections. A shared 25 MiB byte constant and the
advertised capability govern Fastify/provider/client limits. Only Nginx's exact photo-upload route
gets the matching body bound and 300-second upstream timeout; other API limits remain. Adult/controller
access is checked before reading the image body and again before mutation; legacy mixed-cookie
screen retirement is preserved. The same-origin
XHR adapter validates the same DTO/errors and reports upload bytes separately from preparation.
A page-local external-store queue has at most two transfers, stable File/request IDs for retries,
pause/resume and no new dispatch after unmount. No file bytes/queue go to persistent browser storage;
accepted File references are released. Unfinished uploads/retries register with the existing draft
navigation/release guard. Gallery filters/pages/selection are derived from the canonical source read.

The provider chains its upload promise before awaiting, preserving FIFO through failed jobs and
preventing multiple waiters from decoding concurrently. Canonical 7680px master encoding/hash is
unchanged for existing deduplication. New upload thumbnails are 480px and derive from the bounded
3840×2160 display output instead of decoding the large master twice. Existing files are not rewritten.
No database migration, import mount, network configuration or photo permissions change is needed.

## iPhone/iPad Home Screen web app (D-121)

The shared HTML declares Apple's standalone metadata and `/manifest.webmanifest`. Stable root
identity/scope and `/today` start URL keep the installed entry independent of the route used when
adding it. Nginx serves the manifest explicitly as `application/manifest+json`, with same-origin CSP,
no-store and a real 404 if missing. The existing portable icon generator emits 180/192/512px opaque
fern assets inside the existing web build boundary. No native wrapper, service worker or offline
data store is added. All runtime, API, HttpOnly session and shared-screen authorization paths remain
the same; browser/app storage separation is an installation concern, not a new authority signal.

## Morning Routine day profiles (D-123)

MorningProfiles is canonical for the two schedules. The settings DTO additionally derives the flat
School-days configuration so v1 readers/school-only writers remain safe. Input parsing preserves
legacy command shape for exact receipt hashes; new whole-profile saves use the same revision/CAS,
audit and atomic receipt transaction. The server validates active profile/date/revision/version
before new checks. Core resolves the household-local day assignment. Progress storage gains profile
identity in migration 0035; existing rows become School days and receipts/revisions remain untouched.
The editor owns one draft for both profiles; day selects produce disjoint assignments. The board
uses server profile identity and explicit timed/untimed clock policy, retaining stale-data protection,
query invalidation, seven-step capacity and the shared verse. No new background job, credential,
module flag or HA grant/automation. See the versioned MORNING_ROUTINE_CONTRACT.

## Original Morning Routine slice (D-120)

The shared schema defines separate configuration/daily progress commands. Pure `morningClock`
projects the household timezone and weekday, independent of screen uptime. `MorningRoutineService`
owns SQLite settings, progress and atomic actor-scoped request receipts; HTTP adapters retain the
existing authenticated household/controller/module leases. A new realtime domain refetches shared
progress. Views only send typed commands. Configuration revision and per-step versions protect
concurrent phones, stale undo and edits. No chore occurrence or pocket-money state is touched.
HA receives only the new allowlisted screen tab and module flag; routine content/check commands
stay outside automation authority. Legacy module grants are frozen; a fresh disclosed approval is
required. See [MORNING_ROUTINE_CONTRACT.md](MORNING_ROUTINE_CONTRACT.md).

Morning Routine's optional bottom verse uses a narrow household/module-gated `GET .../daily-verse`
returning the existing nullable verse schema. Today and this read share one nonblocking verse cache
per server; an optional provider refresh cannot hold routine reads or check commands open. The
household-local date comes from the server clock/timezone. No duplicate provider/key, database
table, Today aggregation read or HA scope is added. `today.changed` also invalidates the dedicated
verse query. The existing full-text dialog preserves attribution and opener focus.

## Bounded Today composer (D-116)

`TodayScreen` derives enabled content from the existing typed summary and module flags. Its scoped
stylesheet allocates the remaining logical canvas: Chores precedes Upcoming; portrait photos share
the upper rail and landscape/square photos share a bounded lower rail with the summary area.
Image intrinsic sizes cannot grow the allocated track. Zero/one core module and absent optional
content collapse their tracks. The viewport subscription selects two rows on very short TV canvases;
normal three/four/five-row policies and honest overflow remain. The shared spatial resolver reads
current geometry after reflow, with stable control IDs for focus restoration. No extra measurements,
resize observer, layout state store, timer, API or persistence layer is introduced.

D-118 refines only Daily verse: the same summary grid allocates an intrinsic-height final row for
the labelled verse variant, after the other modules. Other module tracks keep their available
space, and the original photo slot remains bounded. A lone verse may leave quiet space above it.
The generic SummaryBand accepts an optional layout class for all three semantic variants; no
measurement effect or duplicate verse rendering is added. Companion layout stays in normal flow.
The existing pure capacity helper reserves a single core row only for a very short TV with all
five summaries, including the verse; this also budgets for status and retry messages without
hiding the failed chore dynamically or shrinking targets. Overflow remains explicit.

D-119 extends the content-height policy to every text summary. Existing row templates use `auto`
instead of fractional heights; the summary area fills its allocated track but aligns its compact
rows and cards to the bottom. Cards retain a 60-logical-pixel minimum target. Responsive column
spans, the full-width final verse and the independent photo slot remain. The pure capacity helper
also receives the already-derived verse visibility flag: full-height TVs budget four and compact
TVs three core rows for a separate verse row alongside other summaries. Very short TVs budget one for four/five
summaries including that row. Other existing capacities remain. Compact TVs with core content use
single-line, 18px excerpts to coexist with status and retry messages, without hiding a failed row
when its error appears. Full-height TVs retain their existing excerpt sizing.
No new React state, queries, measurements or effects are introduced. Empty/informational cards
follow the same rule as actionable links and dialogs; no disabled content reserves a card.

## NBA provider and preferences (D-113)

`NbaService` owns bounded read-through cache and household preferences/command receipts.
`NbaProvider` separates deterministic demo from server-only ESPN HTTPS reads. Shared Zod DTOs
validate projections/responses; views never call providers directly. Coalesce reads, cache 15
minutes, keep at most two fortnight/timezone projections and retry failed feeds after one minute.
Module leases gate before I/O; no sports job, timer, browser third-party assets or credential.
Settings/receipt/audit commit atomically. Existing HA grants freeze original module IDs, preventing
implicit future scope. See [NBA_CONTRACT.md](NBA_CONTRACT.md).

D-114 adds a separate optional `NbaMediaProvider`: `EspnNbaMedia` for private runtime,
`NoNbaMedia` for network-free demo. Authenticated/module-gated same-origin raster routes validate
current highlight identity before fixed-CDN reads. Finite coalescing/cache/processing bounds keep
optional images from becoming an unbounded proxy or a dependency for score availability.
React owns fixed artwork slots and fallbacks; no new navigation, state store, chart layer or
browser third-party origin is introduced.

D-115 adds `NbaGameService` and a narrow `NbaBoxScoreProvider`, separate from overview and artwork.
Only an authenticated/module-enabled, current-fortnight game ID can trigger the fixed summary
read. Named typed stats replace provider arrays. Coalesce, bound to 16 cache entries/four concurrent
reads/one-minute TTL and eight-second/four-MiB responses. No eager fan-out or persistent game store.
React fetches detail only while the selected-game dialog is mounted and restores opener focus;
household NBA query-prefix eviction also removes detail data when the module becomes unavailable.

## Household availability boundary (D-112)

The fixed shared module schema drives a persisted `ModulesService`, authenticated GET/adult PUT,
scoped automation PUT, server endpoint gates and aggregate projections. Feature checks follow existing
authentication and precede repository/provider I/O. Finite per-household reader/writer leases order a
module change after preceding feature requests and before later ones; SSE holds no indefinite lease.
Today skips disabled optional repositories/provider reads and chore materialization. HA rechecks
availability around asynchronous work and cancels disabled pending navigation. In-flight background
provider reads cannot be recalled; their cached data is never projected while disabled.

The web ModulesProvider loads availability before features mount, filters navigation, gates deep
routes and clears disabled domain caches. SSE plus foreground/poll catch-up updates other clients;
cached Today content is immediately masked by known flags. No frontend-only security assumption.
The new default-false `controlModules` scope is distinct from content sharing, chore control and
outbound Home controls. HA component 1.2.0 adds observed-state Switch entities, never general admin
authority. D-112 extends D-111's explicitly approved bundle with a fourth capability for fresh
approvals only. See [MODULES_CONTRACT.md](MODULES_CONTRACT.md).

## Single-approval presentation boundary (D-111)

The adult web component derives all current unrevoked paired-screen IDs from the authenticated
admin query and freezes that set plus the three enabled capabilities on explicit approval. There
is no permission picker or server-side automatic upgrade. The existing typed scoped contract and
20-screen bound are unchanged. Limited grants/new screens require confirmed revocation and fresh
approval through HA's existing-entry reauthentication. HA 1.1.2 changes setup wording only; no
provider secret, runtime network setting or general admin authority crosses this boundary.

## Human-code authority boundary (D-110)

`HomeAssistantPairingService` separates machine initiation/exchange from same-origin adult approval.
The HA config flow generates a private 32-byte credential; the phone handles only an expiring
six-letter locator and permissions. Digest-only migration 0031 retains metadata across restart.
Commit rechecks the exact approving phone/session/capabilities, including after asynchronous reads.
Phone codes reuse existing invitation/pending-cookie/approval transactions. Screen credentials
stay unchanged. Owner/operator proof is scanned from purpose-specific private QR cards, never
shortened. See the phone and HA contracts for bounds, restart behavior and compatibility.

## Opt-in inbound Home Assistant bridge — D-108

The separate `HomeAssistantBridgeService` authenticates digest-only Hearth automation grants,
selected paired-screen leases, expiring/idempotent tab commands and safe chores/calendar
projections. Shared Zod contracts and an explicit public route map sit in
`packages/shared/src/home-assistant-bridge.ts`. Automation authorization is isolated before the
global browser/device hooks, including mixed-cookie failures; it cannot become a TV or adult actor.
The web screen reports only through its existing paired-device credential, with serial polling,
observed-route acknowledgement and visibility/native foreground-generation gates. No JavaScript
reads the TV secret. No command is sent to Android intents or another app. Old native shells without
the new eligibility capability fail closed for this feature.

`integrations/home_assistant/custom_components/hearth` is a manually installed HA custom
integration, not another server process or MQTT broker. HA owns its private config-entry credential
and entities; Hearth stores only its digest and safe grant metadata. Normal repository reads may
materialize chore occurrences or refresh caches. D-109 adds narrowly approved chore complete/undo
only through the existing domain repository and Home Assistant service audit actor. A separate
default-false grant flag, exact input-bound durable bridge receipts and existing atomic domain
receipts isolate authority and recover a crash between execution and safe response persistence.
Current-household-day and observed-completion guards protect new commands. No general household,
provider, adult-account or payment write authority is exposed.
See `HOME_ASSISTANT_BRIDGE_CONTRACT.md` for the exact versioned transport and acceptance boundaries.
One HA connection targets the private Hearth server, never the TV's IP address. Household entities
belong to a **Hearth server** device; selected per-display entities are child **Hearth screen** devices.
Tab commands are relayed by the server to the named paired foreground screen. Household data and
chore actions are server operations independent of TV availability. Physical power/app launch
remain in HA's existing Android TV integration, not the Hearth tab selector.

## Appliance commissioning boundary (D-104)

Future native phone onboarding uses private per-device QR proof and authenticated Bluetooth LE
to configure a local appliance network adapter, then normal authenticated LAN control. Ethernet
skips Wi-Fi provisioning. Neither discovery nor an empty household read grants ownership. A
trusted local HDMI renderer is an optional physical proof channel, not the current TV WebView.
Wi-Fi credentials never enter ordinary Hearth HTTP/SQLite/browser contracts. The responsive web
administration and TV display-only scopes remain separate from the native provisioning seam.

`packages/shared/src/appliance-onboarding.ts` defines future native QR/metadata shape validation;
the core readiness helper is advisory, not authentication. Neither authenticates a radio/network
channel. Separately, the current trusted-HTTPS/browser compatibility path extends the existing
phone service with private fragment setup-card handling and migration 0029 recovery. Shared
`phone-connections.ts` owns the typed HTTP DTOs; `PhoneConnectionService` owns commit-time checks,
exact connection trust, digest-only cards, atomic replacement and bounded process-memory retry.
Views use the typed API, never persist proof or derive owner authority from member names. All
owner removal/screen isolation protections remain; operator file recovery is retained. No public
QR endpoint, network provisioning daemon, native app or live configuration change is added.
See [the contract and staged gates](APPLIANCE_ONBOARDING_CONTRACT.md).

## Operator-only first-start presenter (D-105)

`apps/web/scripts/start-first-phone-screen.mjs` opens an ephemeral loopback-only local renderer,
not a deployed server/web route. It shares protected-file/origin validation with the private card
builder. An unpredictable local capability path, exact Host/Origin/Fetch Metadata checks, no-store,
no-referrer, same-origin resource policy and hash-based CSP bound its surface. It must never be
forwarded through nginx, Tailscale Serve/Funnel, a container port or the external TV shell.

The presenter performs only bounded, deadline-limited, credential-free HTTPS GETs to existing
`auth/status`, rejecting redirects and unexpected/non-private/unconfigured responses. The QR
appears only after a successful unclaimed status; stale/failed reads hide it. Claim is terminal:
stop polling, drop the active QR buffer and refuse further QR GETs. This does not securely erase
camera/browser copies; the server's consumed first-use proof is the authorization boundary.
No new grant, endpoint, database migration, recovery method or networking change is introduced.
Hardware identity, automatic HDMI startup and native network commissioning remain future work.

## Photo playback and compact selection (D-106)

`photoPlayback.ts` shuffles only browser display order, never the server library. `usePhotoPlayback`
owns session-local non-security seeds and a precomputed next-cycle seed; peek/preload is pure and
advancing the completed cycle alone reshuffles. Today, collage and ambient use that seam, while
curation stays in the provider's stable favourites-first order. No photo URLs/seeds/decks are added
to persistent storage and no server contract changes. Hidden/deleted assets leave the current
gallery; the empty gallery never restores an old Today preview.

Selection-mode paging bounds mounted tiles to 48, with an ID set spanning pages. Confirmation
still captures the exact eligible managed assets before any command; paging cannot broaden it.

## Shared administration presentation (D-107)

`SettingsMenu`/`SettingsMenuLink` own joined menu presentation across More, the settings overview,
Family planning and Connections. They delegate to the existing `SettingsLink`, retaining allowed
opener history and focus attributes. `styles/admin.css` and shared admin tokens define companion
typography, controls and action roles without affecting family-screen TV sizing. This is a
presentation boundary only: no API, credential, role, pairing, mutation or runtime-network change.

## Local Games boundary

`/games` is the lazily loaded game menu and `/games/connections` loads the existing word-group
puzzle. Both remain under the `games` module; HA observed-tab mapping recognises the explicit
child route. Puzzle query changes preserve the menu opener and replace the current history entry.
Old explicit puzzle links redirect locally. D-133 adds `/games/connect-four`, lazy-loaded pure
core rules and device-local round storage, without game-state server writes. Migration 0038 stores
`household_game_modules` and `household_game_module_receipts`. `ModulesService.games` owns child
availability; authenticated `/modules` embeds its flags and adult-only PUT
`/game-modules/:gameId` changes them with idempotency/audit. The same writer-preferred request lease
orders child off after preceding feature responses. Parent `games` and child `connections` must both
be on before catalogue/puzzle I/O. Query cancellation removes disabled puzzle cache entries; a
module event/refetch gates child routes. Settings remain accessible with the parent off.
HA controls the parent only and maps all three exact game routes to its existing Games tab.

D-135 adds lazy `/games/word-guess`, pure core scoring/restore and a bounded device-local round.
Authenticated household GET `…/games/word-guess` checks Games and `wordGuess` before provider I/O
under the same lease and returns a private/no-store validated catalogue. The adapter lazily reads a
descriptor-pinned regular file (1 MiB, 10,000 answers, 30,000 guesses), rejects symlinks/unstable input,
coalesces reads and refreshes at most once a minute. Missing data is unconfigured; invalid data is
unavailable or stale with a last-good snapshot. Content-derived IDs prevent old progress being used
against a changed answer set. Browser solutions are ordinary household game data, not an anti-cheat
boundary. No gameplay server writes or runtime downloads. Migration 0039 extends the existing child
ID constraint; old receipt JSON/hash/flags stay unchanged. WORD_GUESS_CONTRACT.md is canonical.

Games serves only the household-supplied archive through authenticated, no-store household GETs:
`…/games/word-groups` returns bounded puzzle metadata; `…/games/word-groups/:puzzleId` returns one
validated board and its groups. No archive path or source URL enters a request or response. Answers
are game data, not an authorization secret; client-side evaluation is not an anti-cheating boundary.

The archive adapter reads one descriptor-pinned regular file, bounded to 10 MiB and 5,000 puzzles.
It validates dates, identifiers, four difficulty levels and the complete sixteen-tile partition;
content-derived IDs prevent changed answers inheriting stale guesses. Reads are lazy, coalesced and
cached for one minute. Malformed/missing data affects only Games, preserving a previously loaded
archive as stale. There is no remote fetch, embedded newspaper interface or new credential.

Game rules live in core. Browser progress stores numeric guesses/order only, isolated by runtime
and household, validated by replay and bounded to the 2,000 most recently played puzzles. This is
device-local game state, not a household command, offline write queue or authoritative shared
record; no database migration or audit event is needed for each tile selection. Version 2 keeps a
separate bounded index of up to 5,000 completed puzzle IDs so replay or eviction of an old detailed
attempt does not forget a completion. The owner's 2026-10-06 reset discards only old v1 Games keys
on each device when it loads this version. Other browser storage and all household state are left
alone. V2 progress is not reset on subsequent visits or ordinary releases.

D-117 adds an optional, validated `lastPuzzleId` to that same v2 store without resetting it.
The loaded board identity is remembered only after a successful read, independently of making
a guess. Explicit URL selection takes precedence, followed by the saved catalogue identity;
old v2 saves use their most recent detailed attempt. An absent/removed saved identity falls back
to the earliest uncompleted board, then the first. Entry selection stays stable while a win is
shown; Next puzzle remains explicit. Missing/invalid pointer data does not invalidate otherwise
valid guesses or completions. This adds no API, household write, timer or cross-device sync.

## System topology

```text
Google TV
  Hearth Android TV shell -> Hearth web UI
  Native Jellyfin app -> Synology Jellyfin server (manual browsing, independent of Hearth)
  Built-in Google Cast receiver <- Music Assistant voice-requested audio
  Normal streaming apps
  HDMI eARC -> optional Sonos Beam

Raspberry Pi 5 / Home Assistant OS
  Home Assistant
  Music Assistant app + official Home Assistant integration
  Piper + Speech-to-Phrase/Whisper + optional openWakeWord
  ESPHome integrations

Synology DS920+
  Existing Jellyfin service and media
  Hearth server/web containers
  Hearth SQLite data volume
  Hearth and Home Assistant backups

Input and automation
  Home Assistant Voice Preview Edition
  iPhone Companion apps -> responsive Hearth web administration
  Existing PIR/IR through ESPHome
  Optional Zigbee/Thread and mmWave devices
```

The Pi is never in the television's HDMI path. Google TV runs Hearth and
Jellyfin as independent native apps; the Jellyfin client connects directly to
the Synology server. For a voice music request, Music Assistant may run on the
Pi, search the same Jellyfin library and send an audio stream over the LAN to
the television's built-in Google Cast receiver. That external path does not
pass through Hearth or the native Jellyfin app.

## Application package boundaries

### `apps/server`

Owns HTTP/Server-Sent Events transport, authentication, persistence adapters, background synchronisation and connections to external systems. Fastify is the preferred server framework.

Suggested modules:

- `auth`
- `households`
- `members`
- `calendar`
- `chores`
- `pocket-money`
- `lists`
- `meals`
- `photos`
- `announcements`
- `home-assistant`
- `devices`
- `audit`
- `health`

### `apps/web`

Owns the television and responsive companion presentation. It consumes only the Hearth API/client and browser-safe configuration. It does not connect directly to calendar providers, Home Assistant, Jellyfin, Music Assistant or the filesystem.

### `apps/tv`

A minimal Kotlin Android TV application that provides:

- TV launcher category and original fern-plus-wordmark banner/icon with explicit intrinsic proportions
- full-screen exact-origin controlled WebView
- foreground-only screen retention through the activity window flag, released on pause (D-094)
- TV-only 1920-pixel logical viewport across Android display densities
- application identity, network-status and exit-only native message bridge
- predictive/remote Back callback forwarded to the React history handler
- one-time pairing and AES-GCM device-credential storage backed by Android Keystore
- last-route restoration plus native server, network, revocation and WebView recovery

Paired startup has one foreground reconnect window: at most five validation/page attempts with
2/4/6/8-second backoff and a 30-second wall-clock deadline. Only network failures and HTTP
408/429/500/502/503/504 retry automatically. Authentication/identity mismatch revokes immediately;
certificate, malformed response, unsafe-content and WebView failures remain terminal. Pause,
Back and destruction cancel scheduled retries; generation tokens discard late callbacks. Resume
starts a fresh bounded window when interrupted or still disconnected, while an already-ready
page remains visible during ordinary session revalidation. No credential is recreated and no
household command is retried. HTTP/error state remains sticky for the failed WebView, even when
Android delivers the failure before page-start; retry creates a new view after the callback returns.

Business logic remains in server/core. Do not create a second chore/calendar implementation in Kotlin.

The shell also installs a main-frame-only document-start viewport script for the exact paired
origin. Native display metrics determine the scale; a short-lived parser observer handles the head
and viewport arriving after document start. Older WebViews receive an origin-checked post-commit/
post-parser fallback. This is a layout guard, not a new bridge capability: it reads no credentials,
storage or API data and does not weaken CSP. The server's same-origin startup script remains in
place for ordinary browsers and appearance. See D-093.

### `archive/apple-reminders-bridge`

Contains the retired Swift/EventKit proof, source projection and frozen wire contract for possible
future research. It is excluded from active application packages, builds and deployment. Restoring
it requires a new product and security decision; active Hearth has no Apple Reminders credential,
pairing, snapshot or EventKit boundary.

### `packages/shared`

Zod schemas, API request/response contracts, event envelopes, identifiers and generated/inferred TypeScript types. It must remain browser-safe.

### `packages/core`

Pure household-domain behaviour: recurrence expansion, completion rules, proportional pocket-money calculation, permission decisions and deterministic summaries. No Fastify, SQL, browser or Home Assistant imports.

## Data flow

```text
Calendar provider -> calendar adapter -> Hearth cache/projection -> Hearth API -> TV/web
TV/web reminder command -> Hearth API -> native reminder validation -> DB/audit
TV/web command -> Hearth API -> domain validation -> DB/audit -> optional provider command
Voice -> Home Assistant Assist -> allowlisted HA script -> Hearth command API
Hearth UI -> Hearth API -> HA adapter -> allowlisted HA service/script
Synology Jellyfin server -> native Google TV Jellyfin app (outside Hearth)
Voice music -> Assist custom intent -> Music Assistant -> Jellyfin music source -> named Google Cast player (outside Hearth)
```

## API style

- JSON HTTP API for queries and commands.
- Server-Sent Events for one-way household-state invalidation.
- Version routes at `/api/v1` from the start.
- Use opaque string identifiers rather than database row numbers at boundaries.
- All time-bearing responses include ISO 8601 timestamps and explicit zone/offset where applicable.
- Commands that may be retried accept a request/idempotency identifier.
- Errors return stable codes plus family-safe messages; raw provider errors stay in restricted logs.

An eventual MCP endpoint, if built, is a thin authenticated adapter over the same application services. It is not a second business-logic path.

### Implemented household and native-bridge contracts

The first slice implements browser-safe Zod contracts for `TodaySummary`,
`WeekSchedule`, `MonthSchedule`, `ChoreList`, integration freshness, command results, audit
summaries and stable family-safe API errors. The implemented routes are:

- `GET /api/v1/households/:id/today?date=`
- `GET /api/v1/households/:id/week?start=`
- `GET /api/v1/households/:id/month?month=`
- `GET /api/v1/households/:id/chore-occurrences?date=`
- adult-only `GET /api/v1/households/:id/chore-occurrences/:occurrenceId` for the occurrence
  description and family-readable immutable command history
- `POST .../:occurrenceId/completions` with `{ requestId }`
- `POST .../:occurrenceId/completion-reversals` with `{ requestId, completionId }`
- adult-only `POST .../:occurrenceId/skips` with `{ requestId, reason }`
- adult-only `POST .../:occurrenceId/excuses` with `{ requestId, reason }`
- adult-only `POST .../:occurrenceId/reassignments` with
  `{ requestId, reason, assigneeId }`
- `GET /api/v1/households/:id/events` as a same-origin Server-Sent Events invalidation stream
- household-owned reminder reads and authenticated create, update, completion and reversal
  commands; the retired native bridge contract remains reference-only under
  `hearth/archive/apple-reminders-bridge/`
- `GET /api/v1/households/:id/admin` and typed household/member setup commands
- adult-only `GET /api/v1/households/:id/activity?limit=` for the newest 1–100 safe audit
  summaries; the companion currently requests 50 and presents family-readable filters without
  rendering opaque target or request identifiers
- `GET /api/v1/households/:id/members/:memberId/avatar` for the same-origin normalized profile derivative
- `PUT /api/v1/households/:id/members/:memberId/avatar` with `{ requestId, mimeType: "image/jpeg", dataBase64 }`
- `POST /api/v1/households/:id/members/:memberId/avatar-resets` with `{ requestId }`
- one-time pairing request, approval/status and paired-device revocation commands
- `GET /api/v1/households/:id/lists` plus typed item add, complete and reversal commands
- adult-only `GET /api/v1/households/:id/list-settings` plus idempotent list
  create/update/archive/restore/order and item update/archive/order/clear-checked commands
- `POST /api/v1/households/:id/assist/list-items`, which resolves a named list without guessing and rejects active duplicates
- `GET /api/v1/households/:id/meal-plan?start=` for the family-readable week and active saved-meal
  summaries
- adult-only `GET /api/v1/households/:id/saved-meal-library` plus idempotent saved-meal
  create/update/archive/restore commands
- adult-only `PUT /api/v1/households/:id/meal-plan-weeks` and confirmed week clear/copy commands;
  each whole-week mutation is one transaction, receipt and audit event
- `GET /api/v1/households/:id/pocket-money?weekStart=&asOf=` for child weekly progress and amounts due
- `PUT /api/v1/households/:id/members/:memberId/pocket-money-settings` for adult-only required weekly amount and payday changes
- `POST /api/v1/households/:id/pocket-money-payments` for an adult-only, idempotent full or partial weekly payment snapshot with an optional note
- `POST /api/v1/households/:id/pocket-money-payments/:paymentId/voids` for an adult-only, idempotent, reasoned correction that preserves the original record
- adult-only chore-template query/create/update commands, including explicit one-off schedules and
  one-or-more `assigneeIds`. Responses expose the grouped `assignees`; the runtime expands each
  template/date into one occurrence per selected person. Legacy singular `assigneeId` command
  receipts remain readable during forward upgrades. Archive/restore use replay-safe lifecycle
  commands (`POST .../:templateId/archivals` and
  `POST .../:templateId/restorations` with a validated `resumeFrom` local date)
- `GET /api/v1/households/:id/home` for curated presence, television power and power-safety state
- `POST /api/v1/households/:id/home/actions/:actionId` for allowlisted, confirmed and audited Home Assistant scripts
- adult-only `GET /api/v1/households/:id/home-assistant-connection`, separate connection-test and
  save commands, and an idempotent removal command for the bounded Home Assistant mapping workflow
- `POST /api/v1/households/:id/assist/day-summary` and `/assist/chore-completions` for Home Assistant Assist
- `GET /api/v1/households/:id/photos` for the private, path-safe photo collection and its display/thumbnail derivatives
- adult-only, idempotent `POST /api/v1/households/:id/photo-uploads` with one raw supported image,
  `X-Hearth-Request-Id` and optional capture timestamp; the server authenticates the companion,
  validates/decode-bounds the image, normalizes it locally and returns no storage path or filename
- adult-only `GET /api/v1/households/:id/photo-source` and idempotent
  `POST /api/v1/households/:id/photo-source/refreshes` for aggregate managed/import status and
  manual checks of the optional read-only folder import
- adult-only, idempotent `POST /api/v1/households/:id/photo-assets/:assetId/curation-actions` for
  favourite, unfavourite, hide and unhide commands with command receipts and audit events
- adult-only, idempotent `POST /api/v1/households/:id/photo-assets/:assetId/deletions` for permanent
  removal of a Hearth-managed upload and its derivatives. Optional-folder imports return a stable
  conflict instead of allowing Hearth to mutate the read-only source
- `GET /api/v1/households/:id/photo-assets/:assetId/:variant` for immutable, opaque WebP display
  and thumbnail derivatives; source paths and originals never cross this boundary
- `GET /api/v1/auth/status`, session and sign-out plus owner-key/QR phone connection routes;
  [D-102 contract](PHONE_CONNECTIONS_CONTRACT.md) replaces active passkey ceremonies.

Member-avatar commands use the adult Admin session, strict request-size and JPEG checks,
idempotency receipts and explicit audit actions. The browser normalizes the selected original to a
512×512 JPEG before sending it. SQLite stores at most one 1 MB derivative per member plus the
original opaque avatar key needed for reset; responses and receipts never contain image bytes.
The versioned same-origin URL prevents stale browser images without exposing a filesystem path.

Pocket-money settings, partial-payment and void commands use the same server-side adult session, validation,
idempotency receipt and audit path as other household writes. Chore completion and undo publish a
`pocket-money.changed` invalidation; they do not create star/reward records. The forward-only
`0009_pocket_money.sql` migration leaves the former reward tables dormant for upgrade safety.
Migration `0014_pocket_money_payment_history.sql` adds payment notes, multiple immutable
disbursements per child/week and one reasoned void per payment.

`TodaySummary`, `WeekSchedule` and `MonthSchedule` expose read-only calendar sources and
normalized events with opaque `calendarId`, inclusive household-local start/end
dates, provider version, recurrence-master identity and an explicit exception
flag. `TodaySummary` may include one nullable same-origin photo derivative, family-readable
alternative text and the normalized `portrait | landscape | square` orientation required for
deterministic television composition. Phase 7 now selects that preview through the
same injected photo-source adapter as the Photos gallery; demo mode returns
fictional bundled derivatives. Private mode always constructs the managed Synology adapter. Adult
uploads are normalized to a private master plus bounded WebP display/thumbnail derivatives under
`/data`, deduplicated by content hash and recorded with an opaque asset ID. The optional read-only
folder import activates only when its server environment path is configured; it ignores symlinks,
incrementally fingerprints files, applies EXIF orientation and preserves its last safe index if the
import mount is unavailable. Adult curation receives only a bounded source kind and deletion
capability, never a path. The provider deletes only a managed upload after the service authenticates
an adult, persists an idempotent receipt and records a path-free audit event. The optional import
remains source-authoritative and read-only. Import failure does not disable managed uploads or
existing photos. Each
`WeekSchedule` day also carries a nullable, presentation-safe daily forecast
summary (condition code, family-readable label, low/high Celsius temperatures, rain probability
and safe provider identity). The
existing query routes read calendar values from the durable SQLite projection
rather than from browser fixtures. Demo mode uses deterministic forecasts. Private mode injects the
server-only Open-Meteo adapter when a saved or fallback location is configured, coalesces concurrent
requests, caches successful responses for five minutes and retains the last safe response during a
temporary provider outage. `GET /api/v1/households/:householdId/weather` returns current conditions,
up to 25 hourly points (the complete provider-local day plus the next midnight endpoint) and seven
daily points through one typed projection. No schema shape changes are needed: the existing hourly
bound is 48. The browser derives the minute-position dot from the shared household clock and uses
measured SVG width/height; it does not add a forecast poll or animation loop. Missing hours remain
gaps and an old cached day has no live marker. The safe location label may
appear; coordinates never enter this forecast contract. An optional `configured` boolean keeps a
saved-location outage distinct from missing setup, including when no forecast has ever been cached.

`MonthSchedule` returns a fixed Monday-first 42-day projection window, calendar
source descriptors and the normalized events overlapping that window. The
browser derives colour-coded title rows, deterministic overflow summaries and
accessible per-day summaries from that single typed response; it does not issue
five or six sequential Week requests. The same indexed response supplies two-title date previews,
exact remaining counts and the selected-date full-day dialog on TV and companion (D-101).
Month reuses Week's focused day/event-detail surface through a minimal date-label prop; no extra
network request, duplicate inline phone agenda, provider access or calendar write is introduced.

Today composition reads durable `today_section_preferences` and
`announcements` through an injected content repository. Adult companion writes
use validated, idempotent and audited commands; private runtime uses SQLite and
demo/test runtime uses the same contract with isolated seed state. The server
selects the one active notice by start/expiry window and priority, publishes a
`today.changed` invalidation and returns explicit visibility flags in
`TodaySummary`. This is bounded content configuration, not a layout DSL.

The authenticated household Reminders query reads Hearth-owned reminder rows through the same API
on television, phone and future native clients. The browser defaults to incomplete items; **All**
may reveal completed items. Validated create, update, completion/reopen and deletion commands are
idempotent and audited. `TodaySummary` derives a bounded summary from incomplete reminders, ordered
overdue, due today, undated and then future, returning the total open count plus at most three
preview items.

The optional daily-verse flag resolves through an injected `DailyVerseProvider` only when enabled.
Demo mode returns original fictional copy. Private mode either uses the ESV passage-text API with a
token read from `HEARTH_ESV_API_KEY_PATH`, or an explicit unconfigured adapter. Successful text is
cached by household and passage in SQLite; a failed refresh may return that passage as stale, while
provider failure never fails the wider Today response. The token and raw response do not enter
browser contracts, logs, receipts or audits. The extracted Today composer reads available memory or
SQLite verse content synchronously and starts a deduplicated background refresh; it never awaits
the optional provider. Changed verse content publishes `today.changed`. Failed/null/stale results
back off for one minute rather than suppressing recovery for the rest of the day. Successful daily
results are memoised for that date; prior-date in-memory entries are discarded.

The server selects its calendar implementation at composition time. Demo mode
injects `FakeCalendarProvider`; private mode injects a stable managed provider
that delegates either to the read-only `CalDavCalendarProvider` loaded from an
external secret path or to an `UnconfiguredCalendarProvider` that reports a
distinct not-configured state. The adult calendar-setup command can replace
that delegate after atomically saving the same external secret format, so a
server restart is not required to begin a read-only refresh.
The CalDAV implementation uses the maintained `tsdav` transport for RFC 4791
discovery/query and `ical.js` for normalized iCalendar components. Credentials
remain captured inside the server transport factory and are not enumerable on
the provider object. Full bounded refreshes hide missing calendars and
tombstone missing events in the same SQLite transaction as cursor/freshness
updates.

Calendar setup uses separate test/save/remove commands. Discovery credentials
remain in a ten-minute in-process pending record; the browser receives only an
opaque test ID and safe calendar descriptors. Save is idempotent and audited,
writes the private credential file before persisting safe connection metadata,
and publishes `calendar.changed`. Removal deletes the credential file and
disconnects the managed provider. No browser contract returns a username,
password, collection URL or event payload from discovery.

Calendar-owner edits use a fourth idempotent mapping command. It requires the
complete connected source set, validates every member against the household,
updates the safe projection and external allowlist atomically, and leaves the
existing URL/account/password fields untouched.

Selected-calendar edits use an adult-only rediscovery route. The server loads
the existing external credential, stages the same bounded ten-minute safe test
result used by initial setup and never returns credential material. Saving the
revised set reuses the idempotent calendar save contract, so adding or removing
an allowed calendar does not require replacing the connection.

Calendar-bearing browser queries follow an appliance refresh policy. Today,
Week and Month fetch immediately when mounted, refetch every five minutes while
the document is visible and refetch immediately when browser connectivity
returns. Saving, remapping or removing a calendar connection invalidates all
three projections immediately; the existing `calendar.changed` SSE event does
the same for changes made by another connected device. The interval is a
recovery backstop rather than a replacement for SSE. A failed provider refresh
continues to return the durable SQLite projection with stale integration state,
so previously synced events remain visible instead of becoming a blank screen.

Weather location setup is a separate adult-only repository boundary with
search, test and save routes. Search and phone reverse-labelling are server
proxies so provider policy and error mapping remain outside the browser. Save
requires a live test ID, writes migration-0022 household coordinates, creates an
audit event/receipt, reconfigures the managed Open-Meteo provider in memory and
publishes `weather.changed` without restarting Hearth.

Home Assistant setup follows the same two-step boundary. A test calls only the supported
`/api/config` and `/api/states` REST endpoints, keeps the URL, token and raw discovered entity IDs
inside a ten-minute in-process record, and returns opaque option IDs with friendly labels. Save
resolves exactly four state mappings and three script mappings, atomically writes the raw values to
the external mode-`0600` secret file, persists only hostname/instance/version/friendly labels in
SQLite, activates the managed provider without restart and publishes `home.changed`. Removal
deletes the external file and disconnects the provider. Demo/test use deterministic fictional
discovery; the private browser contract never returns the token, root URL or raw entity IDs.

Phase 4 uses the same command envelope, actor/source resolution, audit summaries,
idempotency receipts and SSE invalidation path as chores. The television may
check list items, but recurring-chore, meal and pocket-money editing stays in the
responsive companion presentation.

`PUT /api/v1/households/:householdId/chore-template-order` accepts one idempotent adult command with
every active template ID exactly once. Template create/update commands carry optional
`availableFromTime` and `dueTime` values; shared validation rejects a reversed window. The
repository updates active order transactionally and occurrence generation snapshots both time
boundaries and `sortOrder`, keeping previously generated days stable after later edits.

Demo-only reset/scenario routes exist only when the server is started in demo
mode. Demo actor/source headers exercise the server-side permission matrix and
are rejected outside demo mode; they are not production authentication.

The browser first requests `GET /api/v1/runtime`. Its typed response selects
the configured household and carries the server-derived household-local date,
Monday week start and current month. Household API paths, React Query keys,
planning defaults and real-time event paths are derived only after that
response succeeds. `demo` and `test` inject the fixed Perth clock used by
retained evidence; `private` injects the system clock. A private database with
no household returns `requiresSetup: true` and a null household, so the browser
renders first use without issuing household queries. After the one-time local owner setup key is
verified, household/member/default-list and independent phone-connection creation
commit in one transaction; the runtime resolver observes the new household without a restart.
Once a private household exists, an unauthenticated runtime response remains bootstrap-safe but
redacts the household identifier and name (`household: null`, `requiresSetup: false`). The browser
then offers QR-approved phone connection or private owner-key recovery. A valid companion session or paired-TV credential reveals the runtime
household and allows normal route construction.

Browser JSON requests normally bound both response headers and body parsing to ten seconds and
preserve caller cancellation. The read-only runtime bootstrap uses five-second attempts and two
retries (2/4-second backoff, about 21 seconds total while online). Typed transport errors identify
network/timeouts and HTTP 408/429/500/502/503/504; denied access or malformed responses do not
retry. TanStack cancellation reaches the request; offline pause and foreground/reconnect refresh
remain in place. Exhaustion offers explicit recovery without using cached family data to bypass
authentication. This policy is not applied to mutations. Explicit
calendar/Home Assistant discovery receives thirty seconds; photo upload/import refresh, checked
backup and update-start requests receive two minutes. A timeout is an ambiguous write outcome, not
proof that the server rejected a command.

Reminder, payment/settings/void, household, list-add and meal-management intents retain a cloned
payload and request ID for manual retry while the owning screen is mounted. Date/week context is
captured at submission. A changed intent cannot replace an unanswered one until it is resolved.
Only definitive rejection or confirmed success releases the intent. Optimistic chore/list rollback
restores the affected record only, and per-record pending state prevents overlapping actions on it.

The client maintains one household SSE connection. Opens/reconnects, online, foreground and
pageshow events catch up all household queries plus runtime; domain events invalidate a typed
domain map. Invalidations are coalesced and deferred while commands are pending. A visible-minute
fallback runs only while the stream is disconnected. Inactive queries are marked stale rather than
eagerly loaded. This is catch-up by fresh reads, not event replay.

The data router protects registered drafts across menu links, remote Back and browser history.
Remote entry waits for usable controls rather than hidden Suspense content. A route-lifetime
observer restores focus when loading/error replacement removes the focused node, while retaining
explicit visible field/navigation focus. A bounded eight-direction queue bridges lazy transitions;
activation is never queued, and Back, Tab or pointer interaction discards pending directions.
Shared Calendar-tab movement remains explicit through a pending lazy view; history Back instead
restores the destination route's remembered control.
Meal-week drafts track original per-date revisions; untouched dates absorb incoming data and changed
dirty dates require an explicit resolution before Save. The demo planning repository and pure
record/fixture helpers are separate from SQLite persistence; meal administration CSS is route-local.

Repository construction follows the same mode boundary. Demo/test may seed the
fictional household. Private construction runs migrations but does not insert
fictional households, members, chores, lists, meals, pocket-money settings or
device records. This separation is a composition concern rather than a second
database schema.

## Persistence

Use SQLite in WAL mode for the first household deployment:

- one mounted persistent database file
- numbered, forward-only schema migrations
- transactional commands
- foreign keys enabled
- automated consistent backups
- no dependence on a network-mounted live SQLite file

The database file lives on the Synology container's local volume. Do not put a live SQLite database on an SMB client mount.

Migrations `0001`–`0027` establish the household core, Admin/pairing state, chore runtime, calendar
projection, household planning, Home Assistant projection, television credentials, photos, pocket
money, member avatars, calendar setup, companion passkeys/sessions, Today configuration, payment
history, the Synology photo index, saved-meal preparation metadata, reasoned chore-occurrence
management history, snapshotted chore windows/order, credential-free Home Assistant connection
metadata, named-adult passkey recovery, canonical chore time-of-day grouping,
the tested household weather location, managed photo-upload metadata, optional folder-import status,
daily-verse visibility, the bounded attributed passage cache and Hearth-owned reminders. The
short-lived Apple projection remains in forward migration history only and is removed by `0027`.
The live demo server uses the SQLite
repository; its in-memory adapter remains only for isolated contract tests.

Postgres is a future option only if concurrency or operational evidence justifies it.

## Authentication and authorisation

### Television

Use one-time pairing:

1. The TV requests a short-lived pairing code.
2. An adult approves it in the companion/admin interface.
3. The TV proves possession of its locally generated secret after approval; the
   server stores only its hash and activates the independently revocable device.
4. Android Keystore-backed AES-GCM storage retains the secret. Native code sets
   the scoped `HttpOnly` WebView cookie; browser JavaScript never receives it.

Private pairing codes are random six-character uppercase alphanumeric values with UUID record IDs.
Admission permits at most 32 pending requests and 20 new attempts per resolved peer per ten minutes;
replay occurs before charging admission. Expiry does not depend on polling, pending lists are bounded,
and records retain a seven-day replay window before pruning on new issuance.

Debug emulator HTTP is an intentionally non-secure browser context. Browser
commands therefore generate idempotency IDs with `crypto.randomUUID()` when
available and a `crypto.getRandomValues()` fallback otherwise; both paths retain
cryptographic randomness.

### Companion/admin

Shared-display request context takes precedence over companion authority (D-099). Presence of a
`hearth_device` cookie or Bearer credential, even empty/malformed/revoked, excludes adult authority;
supported TV user-agent markers add a negative capability hint, not authentication or hardware
attestation. Private family reads still require a valid scoped display credential. The same rule
guards adult actor resolution, session reads and every first-use/authentication/recovery option
and verification endpoint. Status suppresses adult identity on screens. Runtime and auth-status
DTOs include a backward-compatible optional `sharedScreen` boolean; the browser uses it at the
common admin boundary and link producers, never viewport width. Runtime is no-store and varies by
Cookie, Authorization and User-Agent. Household role/capability checks remain authoritative.

An HttpOnly, SameSite=Strict correlation cookie `hearth_browser_context` has no access authority.
It is Secure in private mode, refreshed on runtime/options access and expires after ten minutes.
First-use/authentication/recovery ceremonies bind to that browser context and expire after five
minutes; verifications must return its cookie. The in-memory registry caps pending requests at 256
and ceremony bindings at 512, prunes expired bindings and cleans guards on response, timeout or
abort. Successful browser pairing invalidates that context's pending proofs/bindings and revokes
only the adult session cookie supplied by the switching browser. Private shared-screen requests
also revoke and clear a retained legacy adult cookie, so removing the display cookie later cannot
resurrect that old session. Commit-time guards inside
first-use/recovery transactions and before authentication session issuance reject a proof that
finishes after pairing; the response boundary also rechecks and revokes a newly issued session on
a late denial. Other adult phones, passkeys and paired devices are not reset. No new database,
secret, pairing scope, background process, native bridge or network configuration is introduced.

The browser's completed pairing exchange refreshes identity even if its dialog was cancelled or
unmounted while awaiting the accepted response. It sends a same-origin, negative-only
BroadcastChannel/storage notice so other open documents immediately hide private content, cancel
queries/streams, clear private caches and replace their document with Today. The storage notice is
removed immediately and contains no credential or role grant. Runtime and auth status revalidate
on foreground/reconnect, and the provider treats either server `sharedScreen` flag as restrictive.
Appearance and other approved family controls remain accessible; no new polling loop is added.

### Current adult phone authority (D-102)

The private release uses named adult controller connections. Initial/recovery connection proves
possession of an external one-time owner key; another phone scans a connected controller's
short-lived QR, binds a separate HttpOnly pending proof, waits for that inviter's explicit adult
approval, then exchanges once. The inviter's identity/session is unchanged. Role/capability,
household, current inviter and target state are rechecked at exchange. Only hashes persist;
raw session/pending secrets are protected cookies. QR secrets are fragment-only, stripped on the
recipient and never stored in browser storage or logs. D-103 protects owner-key provenance from
browser removal, self sign-out, QR switching, screen conversion and owner-member demotion/archive.
Deliberate D-104 saved-card/trusted-phone recovery or a fresh backend key atomically replaces the owner and its linked sessions/invitations;
QR phones and TVs are preserved. Restrictive screen cleanup can invalidate browser sessions but
cannot remove ownership. Secondary connections have independent revocation,
180-day absolute and 90-day idle session bounds. This is connected-browser possession, not
hardware attestation or user-verified biometrics. Lock connected phones.

Migration 0028 preserves verified legacy sessions with accurately named earlier-browser grants.
Migration 0029 adds owner-consented exact-phone recovery/card state without changing existing grants.
Production disables new passkey ceremonies. Legacy mechanisms below remain only for old-release
compatibility, migration tests and historical evidence; they are not active enrollment paths.
See [the typed v1 contract](PHONE_CONNECTIONS_CONTRACT.md). No network or live access mutation is
authorized by local implementation.

### Historical passkey mechanism (superseded for enrollment by D-102)

The earlier LAN-only release used named adult household accounts with passkeys as the primary companion
sign-in. Private first use reads a high-entropy one-time code from an external secret file, rate
limits invalid attempts, requires user verification and a discoverable passkey, then issues a
30-day `HttpOnly`, `Secure`, `SameSite=Strict` cookie. Only its SHA-256 digest is stored; sign-out
revokes the database session. Registration and authentication challenges are single-use and expire
after five minutes. WebAuthn credentials retain their public key, signature counter, transports,
device type and backup state; successful authentication advances the counter.
Verification rechecks linked credential/member state after asynchronous proof. Additional enrollment
and recovery-code issuance bind and recheck the initiating server-authenticated session at commit;
recovery claims exactly one still-active code before replacing access. First-use transactions
reassert the singleton household invariant. Realtime delivery and heartbeats revalidate admission.
Sign-out cancels private reads, closes streams, clears runtime/query authority and reloads an
unmounted private view. Private photos and avatars use `private, no-store` caching.
Authentication-option issuance is rate-limited per resolved client address. Forwarded addresses are
used only through explicit `HEARTH_TRUST_PROXY_ADDRESSES` IP/CIDR configuration; otherwise the socket
peer identifies the rate-limit bucket, shared by callers behind the same proxy. Pending ceremonies are
globally capped, and expired ceremonies/address windows are physically removed before new options
are created. This keeps the unauthenticated passkey entry point memory-bounded.

The process health response includes the active immutable release identifier and is explicitly
non-cacheable. Open browser and television WebView clients compare it when their existing realtime
connection opens or reconnects, once per visible minute, and when the page returns to the foreground
or network. A changed release causes one full page reload; credentials and paired-device storage are
untouched. Registered unsaved drafts defer that reload until a later safe check without consuming
the new release identifier. Hidden pages do not run the interval check.

### Historical credential recovery (superseded by owner phone keys)

Earlier adult access supported several named adult accounts and several independently revocable passkeys per
adult. Adding a passkey or issuing a replacement recovery code requires a current administrator
session; issuing the code additionally re-verifies the current passkey. The 128-bit recovery code
is displayed once, expires after 180 days, and is stored only as a SHA-256 digest. Successful
recovery consumes the code, creates a replacement passkey and revokes that adult's earlier passkeys
and sessions. Hearth never places a shared admin token in a URL and does not permit the final
passkey to be revoked before recovery exists. Passkeys still require a stable private hostname and
HTTPS secure origin before real household data is entered.

D-097 adds an optional `signInOnThisDevice` registration intent. Legacy requests retain the helper's
session. The explicit phone-setup flow freezes this intent in the ceremony and, only after verified
registration and commit-time administrator/session/target checks, creates a session for the chosen
adult and revokes the initiating browser session in the same transaction. Other sessions and keys
remain active. The replacement token is internal to the server and reaches the browser only in the
existing Secure/HttpOnly/Strict cookie; the response remains credential/audit metadata. The client
closes the old document and clears private caches without calling sign-out on the new cookie.

If every adult loses access, `deploy/synology/owner-access.py` is a deliberately local operator
exception, not a web endpoint or shared password. It requires root or the NAS administrators group,
existing private-database access, a verified online backup and exact active-adult targeting. It
issues a 128-bit, 15-minute, digest-only one-time recovery record. Its private file is never printed
by the tool or persisted in source/logs. Issuance changes no keys, sessions, roles or household data;
the existing user-verified recovery ceremony later consumes it and replaces only that adult's access.
Every operator mutation has a truthful system/NAS-owner audit in the same transaction.

### Current appliance update authority

Appliance update status is an administrator-only service, not a browser privilege. Starting an
update requires explicit connected-adult-phone consent no more than five minutes old. Enrollment
and refresh do not manufacture that timestamp; this is not biometric reauthentication. Legacy
passkey-authenticated sessions retain their earlier verification checks during transition. The server accepts
only the exact release exposed by its fixed verified-workflow provider, creates an online recovery
copy and sends a two-field request through a mode-restricted local FIFO. It has no Docker socket,
root credential or general command endpoint. A separately installed platform agent performs the
fixed host operation and publishes only bounded progress/result state. See D-079.
The host independently enforces the fixed latest-successful-release policy; it does not trust a
commit chosen by the application. Control is mounted from `/usr/local/etc/hearth-v2/control`;
authoritative markers and rollback copies remain outside that mount under root-only
`/volume1/.hearth-v2-state`, so snapshots cannot fill the DSM system partition.
The host Python helper opens data files without following links, verifies a private SQLite snapshot,
and binds atomic recovery to the originally pinned data-directory identity. See D-089.

During the isolated demo, a server-resolved Maya administrator session exercises the same role/capability checks without pretending to be production authentication. This demo actor header is disabled outside demo mode. See D-014.

### Service integrations

- Calendar credentials and Home Assistant URL/token/raw mappings remain in access-restricted,
  external server files; SQLite, browser contracts and audit summaries retain only safe metadata.
- Secrets enter containers through environment/secret files excluded from source control.
- Tokens are scoped as narrowly as the provider allows.
- Device and service credentials are independently revocable.

### Permissions

Model roles/capabilities rather than scattered UI checks. The server is authoritative. Hiding a button is not authorisation.

Every `/api/v1/households/:householdId` route in private mode passes one central read boundary
before its route handler. Companion sessions must belong to the requested household and resolve to
an active member with `household.view`; television credentials must belong to the household and
carry `household.read`. This includes photo derivatives and Server-Sent Events. Route-specific
capability checks still apply to administration and mutations after this baseline read check.

## Home Assistant security boundary

Hearth is permitted to call only configured Home Assistant scripts/services through an allowlist containing:

- stable Hearth action ID
- display name
- target HA domain/service or script entity
- accepted argument schema
- confirmation level
- permitted Hearth roles

Never expose an arbitrary service-call form to a child/guest surface or an LLM.

The Phase 5 adapter accepts only `evening-mode`, `goodnight` and `screen-off`.
Those IDs map server-side to one of exactly three selected script entities and call only Home
Assistant's `script.turn_on` service; request payloads cannot name a Home Assistant domain, service
or entity. Runtime reads fetch only the four selected state endpoints. The cached projection stores
only presence, television power, whether Hearth is foreground and a generic protected-media
boolean. It stores no current app, title, track or player. The adult setup workflow exposes only
opaque discovery choices and family-readable saved labels, so it does not become a general Home
Assistant dashboard.

Home Assistant is also the complete local-voice host. Voice Preview Edition or
an iPhone sends speech to Assist; Assist calls Hearth's authenticated `/assist`
API and uses Piper to speak Hearth's returned result. Hearth has no wake-word,
speech-recognition, microphone or text-to-speech runtime.

Music requests take a distinct path. Music Assistant is installed as a Home
Assistant OS app, connected through the official Home Assistant integration,
and configured with Jellyfin as a music source plus Google Cast as the native
player provider. A deployment-owned mapping associates each Assist satellite
or room with a named player such as `Hearth TV`, so “play Dreams” can omit the
room while “play Dreams in Ezra's room” can select another approved player.
This is an Assist automation/custom-intent mapping, not a Hearth setting or
database record.

As of 2026-08-04, starting arbitrary music by voice is not a built-in core
Home Assistant intent. It requires Music Assistant's separately installed
community voice-support blueprints/custom sentences. The implementation should
send the resolved audio to the Cast player. Launching the native Jellyfin app is
possible at a general app level through Home Assistant's Android TV Remote
integration, but selecting an arbitrary song through keypress or UI automation
is deliberately excluded as brittle.

## Offline and degraded operation

- Cache the latest calendar projection and selected Home Assistant household/power-safety state in Hearth.
- Refresh visible calendar surfaces every five minutes and immediately after browser reconnect or calendar settings changes; retain the last successful browser query data while a request is in flight or fails.
- Continue to show local chores, lists, meals, photos and cached events when external services fail.
- Queue only safe, explicitly designed local commands. Do not blindly replay ambiguous calendar edits.
- Mark stale data with a quiet, comprehensible indicator.
- Integration failure must not prevent app startup.
- Missing, malformed or unreadable optional calendar/Home Assistant files disable only those
  adapters. Retain the original file for repair and warn without secrets for an invalid/unreadable
  existing file. Explicit load/test APIs remain strict; invalid authentication/security configuration
  never becomes an unauthenticated fallback.
- The TV shell shows a branded recovery surface if the Hearth server itself is unavailable.

## Deployment

The commissioned production deployment uses Docker Compose source and release files under
`/volume1/docker/hearth-v2`, with private household data and secrets deliberately kept in the
separate `/volume1/hearth-v2-private` share. Do not overwrite the old `/volume1/docker/hearth`
path without explicit approval.

Initial containers:

- `server`: pinned Node LTS, Fastify and the sole owner of the local SQLite volume
- `web`: pinned nginx stable, static React assets and the same-origin `/api` reverse proxy

`hearth/deploy/synology` implements this split with non-root processes, read-only root filesystems,
dropped capabilities, bounded logs, readiness-gated startup and loopback-only HTTP ingress. DSM
Reverse Proxy terminates the eventual private HTTPS origin and is the only intended route to the
web container. No router port-forward or public DNS exposure is part of this deployment.

The server image compiles its SQLite native binding inside the pinned Linux build image for the
target CPU architecture, rather than trusting a prebuilt binary from a different glibc runtime.
GitHub Actions verifies that `linux/amd64` compilation alongside the code and Android gates.
Four isolated single-worker browser shards test the same run's compiled application; each uses a
disposable demo database, never private data or a shared live development server. Only after every
gate succeeds does the cache-backed publisher publish the server/web images to public GitHub
Container Registry packages tagged with the full
Git commit. Production Compose is pull-only; the DS920+ does not install pnpm dependencies or
compile native code during an ordinary update. A separate Compose override retains source builds
only as an explicit recovery fallback. Image publication is an outbound package operation and does
not give GitHub Actions network or credential access to the private household deployment.
Public package visibility permits installation by other households; it does not expose runtime
data. The separate `hearth/site/` GitHub Pages preview publishes only allowlisted static assets and
fictional demo captures, with no household API connection or secret-bearing deployment context.
`GET /api/v1/health` reports process liveness; `GET /api/v1/readiness` verifies SQLite and the latest
migration. The stable private hostname and trusted certificate remain commissioning inputs because
adult phone enrollment is constrained to that origin. See D-031 and D-102.

The server creates routine database recovery copies. The explicitly authorized local NAS-owner
maintenance tool may also create a checked private online backup before access repair (D-097).
In private mode the server
uses SQLite online backup into the restricted data volume, verifies and prunes those files, and
serves only a typed aggregate status to authenticated adults. Restore is intentionally outside the
HTTP application: the production image contains a CLI that verifies a retained copy and writes it
to a new clean destination without overwriting an existing database. See D-043.

On Synology, the optional update agent is root-owned and blocks on a dedicated FIFO; it does not poll
GitHub or expose a socket. The unprivileged server selects the newest successful fixed workflow
release, while the agent independently accepts only a request ID and full hexadecimal commit. The
agent uses the existing pinned Compose/image helper, stops SQLite only for the final checked rollback
copy, health-checks the new containers and restores both database and image tags if activation fails.
Development has no agent and does not render update controls.

## Observability

- Structured server logs with request ID and actor/device ID, excluding secrets and sensitive event bodies by default.
- Public health endpoints distinguish process liveness and database readiness. Authenticated adult
  System Health adds safe migration, application-version and recovery-copy state.
- Audit events are household records, not merely logs.
- Home Assistant may monitor Hearth health and notify an adult after persistent failure.
- Retention and backup behaviour is configured and documented; actual Synology capacity/off-device
  monitoring and the live restore drill remain required before production use.

## Performance strategy

- Private calendar reads return the durable projection immediately and refresh the requested
  bounded date window in the background. One serialized worker coalesces repeated reads, retains
  at most eight pending windows, and publishes calendar invalidation after completion. Successful
  windows refresh after five minutes; failures back off for one minute. Configuration changes
  invalidate in-flight results so an obsolete connection cannot repopulate the cache.

- Server-rendering is unnecessary for the LAN TV application; use a static React build and cached API queries.
- Load the Today shell and cached household summary before secondary modules.
- Avoid large client state frameworks until real complexity requires one.
- Optimise images server-side into television-appropriate derivatives.
- Measure launch/resume and navigation on the target TV rather than optimising only desktop benchmarks.
