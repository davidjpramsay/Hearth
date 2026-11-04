# Hearth v2 integration contracts

## Fitness boundary (D-128)

Fitness is Hearth-owned and works without Home Assistant or any external service. It exposes no
HealthKit, wearable, workout upload, calendar event or automatic exercise advice integration.
The optional HA component 1.5.0 includes a Fitness module switch only for a fresh adult approval
whose immutable moduleIds includes `fitness`. Existing grants keep their original scope. HA cannot
read goals/exercises or check workouts; no Fitness navigation tab is added here. Local source changes
neither install HA files nor reconnect a household. No provider credential or network change.

## Optional connections and installation (D-127)

Hearth works without HA. Connections explains independent calendar, location-based outdoor weather,
phone photo uploads and optional HA/indoor sensors. HA integration installation has a matching
code-only ZIP and narrow local installer/update helper; restart and adult six-letter approval remain
explicit. This does not publish a HACS/Marketplace listing, auto-install into HA, expand grants,
choose TV entities or edit alarms. Indoor history still uses HA's selected-sensor administrator-token
adapter; external credentials are not shortened or silently reused across connection directions.
See SHARING_SETUP_CONTRACT.md and hearth/integrations/home_assistant/README.md.

## Indoor temperature and humidity (D-126)

D-126 explicitly extends the former four-state-only read boundary with a separate, adult-selected
Weather data source. The existing safety states and three script mappings remain unchanged.
Only eligible temperature/humidity measurement sensors are discoverable. Exact selected state
reads and the read-only recorder.get_statistics action supply bounded graph data. The latter uses
POST as the provider's query transport; it changes no devices, history or configuration.
No generic service/entity/template proxy, new inbound HA grant, provider calendar access or
persistent sensor archive. Open-Meteo still supplies Outdoors independently. HA's statistics action
requires an administrator token, privately stored server-side; the narrower Hearth allowlist is
therefore essential. See INDOOR_CLIMATE_CONTRACT.md for fields, bounds and operational acceptance.

## Calendar activity feedback (D-125)

Routine background CalDAV reads expose a typed busy hint without a family warning message.
Authentication/configuration/provider failures still expose their existing safe issue copy and
cached plans. No new provider request, credential, write authority, HA scope or sync cadence.
This presentation flag must not be interpreted as a new calendar source or successful freshness.

## Morning Routine profiles (D-123)

The existing approved `morning_routine` destination and `morningRoutine` module grant remain
sufficient. Opening `/morning-routine` automatically chooses the profile for the home's local date;
School days and Weekends share one module, not separate HA capabilities. No routine contents,
settings writes or tick commands are exposed to HA, and no credentials or grants are expanded.

The existing live alarm continues to open Morning Routine on weekdays only. This feature changes
neither HA automation nor its wake/music/power/weekend branches. A future weekend navigation branch
needs a separately reviewed exact automation change and approval. Local simulated day selection is
not evidence of an actual weekend/weekday alarm execution.

## Original Morning Routine alarm destination (D-120)

HA component 1.4.0 adds wire tab `morning_routine`, mapped to `/morning-routine`, and its optional
`morningRoutine` module flag. Only an approved visible screen and an explicit moduleIds grant may
navigate there; old grants are not expanded. No routine contents or tick commands enter HA.
After an approved release, update the component and deliberately reconnect before selecting the
new tab. Append a weekday-only choice after the existing alarm's wake/music/Hearth launch and
safety checks; never make the whole alarm weekday-only or alter its weekend/media behaviour.
Wait a bounded interval for the actual registered screen selector, then `select.select_option`
with `morning_routine`. A failed/offline selector must not interrupt music or repeatedly relaunch.
Installation and actual weekday alarm operation remain separate acceptance checks.

Morning Routine can also show the existing daily Bible verse. Its narrow read reuses the same
server-side ESV provider/cache and private key as Today, with no browser provider request or extra
credential setup. It respects the `dailyVerse` module, independently of Today's section switch.
Saved/unavailable verse states do not block routine use. This does not change the HA alarm or grant.

## NBA (D-113)

The keyless server adapter reads fixed ESPN NBA standings and monthly scoreboard HTTPS feeds.
Filter complete months into the household's Monday–Sunday fortnight with timezone-edge padding.
Eight-second timeout, four-MiB decoded-byte bound per response, no redirects, schema validation;
reject limit-sized/truncated feeds. No odds, streams, ads or browser third-party requests.
Highlights use completed current-week game leaders. Public feeds are undocumented/no-SLA;
outages retain explicitly stale data. No commercial licence is claimed: review terms and select a
supported/licensed provider before commercial use. HA gets only an explicitly approved module
switch, not NBA stats access/navigation. See [NBA_CONTRACT.md](NBA_CONTRACT.md).

D-114 adds optional server-proxied team crests and current-highlight portraits from fixed
`a.espncdn.com` PNG paths, not caller URLs. Validate identity/auth/module before I/O; bound downloads,
pixels, processing, concurrent work and retained memory; serve metadata-free resized WebP only.
No browser egress/CSP change or persisted images. Missing artwork falls back to text independently
of score availability. Demo never downloads artwork or attaches real faces to fictional people.

D-115 permits fixed public ESPN summary reads only for a known current-fortnight game, after
household/module checks. Eight-second/four-MiB/redirect bounds and a 16-entry/four-pending,
one-minute read-through cache apply. Validate event/teams, map named stat keys, and expose only
bounded box-score DTOs. Missing stats/DNP are not zero. No odds, provider URLs, new HA scope,
credentials, background fetches or persistent sports history; see NBA_CONTRACT for full fields.

## Module availability and HA control (D-112)

The household Modules flags govern direct and aggregate access, including existing HA grants and
legacy Assist routes. Off stops new corresponding provider reads/commands; it does not revoke or
erase the provider connection. Calendar/chore HA projections become null/unavailable while off,
disabled tabs disappear from selectors, and queued navigation to them is cancelled. Home controls
off stops the outbound adapter, not inbound pairing/module management. All-off is recoverable.

The new `controlModules` grant permits only fixed boolean module commands. It defaults false for
all old records. Matching component 1.2.0 exposes eleven household configuration switches;
they can re-enable a feature without its data scope. Fresh one-approval setup discloses this new
capability explicitly. Separate approved installation/restart and adult reconnect are needed on
an existing live HA instance. The current private release and HA 1.2.0 installation are verified
in ACCEPTANCE; its old limited grant still requires one explicit adult reconnect.

## Short human codes (D-110)

The inbound HA component 1.1.2 displays a five-minute six-letter code and waits for approval in
Hearth; it privately generates/exchanges its machine credential. Existing config entries/grants
remain valid. The matching component must be installed separately; server publication does not
install HA files. This changes no TV power/media/morning automation or outbound HA adapter.
Provider-issued calendar app passwords and outbound HA tokens are external credentials, not
Hearth-generated connection codes; their provider formats cannot be shortened.

## Future appliance network provisioning (D-104; not implemented)

D-105's local operator presenter is a read-only client of the existing trusted HTTPS claim-status
endpoint and an existing protected first-use file. It generates QR pixels locally, not via a QR
service. It does not provision Bluetooth/Wi-Fi, pair the TV, issue keys or expose a network QR
endpoint. Its ephemeral loopback listener is never installed or forwarded on Synology.

Bluetooth LE is selected for native phone-assisted Wi-Fi setup, with Ethernet and a temporary
setup-network fallback. Device authentication/private QR proof is independent of transport and
requires a reviewed local protocol. A platform-owned network adapter, not Home Assistant or the
ordinary Hearth API, receives Wi-Fi credentials inside that authenticated channel. No Bluetooth,
Wi-Fi, router, DNS/firewall or Synology configuration is changed by the local browser extension.
Actual hardware, native permissions, identity and network-loss/recovery remain open gates in
[the onboarding contract](APPLIANCE_ONBOARDING_CONTRACT.md).

The existing private HTTPS/browser path now accepts privately supplied first-use QR cards and
explicit saved-card/exact trusted-phone owner recovery. This operates through the existing phone
service, not Home Assistant, Bluetooth or a network-config adapter. The provisioning-workstation
helper reads a protected local first-use file; no proof is fetched from anonymous Hearth HTTP.
Current server reachability/TLS trust remains a prerequisite. Future native QR identity pinning
must not be inferred from this browser proof. No Apple/EventKit integration is reintroduced.

## Integration philosophy

Hearth presents one family experience without pretending to own every underlying system. Each external system sits behind a narrow server-side adapter, has a visible health state and can fail without taking down unrelated features.

No external credentials are required for the first rendered prototype. Seed data and fake adapters must use the same contracts as real providers.

## Household puzzle archive

Games reads an explicitly supplied local JSON archive through `HEARTH_GAMES_ARCHIVE_PATH`.
The import expects `puzzle_number`, real ISO `date`, a four-by-four `starting_board` and four
`groups` containing `category`, `difficulty` (0–3) and four `words`. Extra source fields are not
executed, returned or fetched. Preserve original boards and textual symbols; special visual
editions use their supplied text labels, not downloaded newspaper artwork.

The supplied archive is a fixed snapshot, not a live provider connection or subscription.
Do not scrape a paywall, request NYT credentials or bundle the downloaded data into source,
images, public test fixtures or releases. Local import does not establish redistribution rights.
Demo/tests use original Hearth content. Existing offline/cached household functions are unaffected
by a missing or invalid game archive.

## Calendar providers

The first household provider is iCloud through a standards-based CalDAV
adapter. The `CalendarProvider` boundary remains provider-neutral so Google
Calendar or Microsoft/Outlook can be added later without encoding any
provider's payloads into the domain model.

Minimum adapter capabilities:

- list calendars
- incremental or bounded event synchronisation
- get event detail
- report read/write capability
- create/update/delete only when authorised
- return provider version/etag/conflict information
- normalise all-day events and recurrence references

Initial implementation order:

1. fake seeded provider
2. read-only adapter for the selected household provider
3. monitored sync and cached display
4. explicitly approved write operations
5. conflict handling and retry policy

Phase 3 implements steps 1–3. The server-side contract returns normalized
descriptors plus upserts and tombstones. Provider payload identifiers are
converted to Hearth opaque IDs; the browser receives source identity,
local-date projection, recurrence metadata and capability only. The fake
adapter exercises bounded and incremental changes, deletions and outage. The
real CalDAV adapter performs a read-only RFC 4791 time-range query with bounded
recurrence expansion and deliberately returns a complete bounded snapshot for
transactional reconciliation. Removed sources become hidden and missing
objects become tombstones. RFC 6578 sync tokens are deferred until live
profiling shows they are useful.

Timed CalDAV values with a usable `TZID` are projected from that declared
timezone. Provider values without an absolute offset or resolvable timezone are
treated as household-local wall time, never as the Synology container's local
timezone. This keeps floating events stable across development and UTC
production hosts before Hearth stores their normalized UTC instants.

CalDAV is opt-in outside demo mode through `HEARTH_CALENDAR_CONFIG_PATH`. That
variable points to a server-only JSON secret outside the repository containing
the HTTPS server URL, account identifier, app-specific password, household
timezone and exact allowed calendar names/owner mappings. Empty or ambiguous
allowlists fail closed. Credentials are commissioned outside source control;
current live-validation evidence belongs in OPERATIONS.md. Apple documents app-specific passwords for
third-party calendar access; a credential must be created and supplied by the
owner only when live validation is approved.
Every credential-bearing DAV request and redirect is checked before dispatch. Custom providers stay
on their configured HTTPS origin; iCloud additionally permits only `caldav.icloud.com` and numbered
`pNN-caldav.icloud.com` HTTPS service origins on the default port. Discovery responses permit at most
128 entries, REPORT responses at most 10,000; decoded bodies are capped at 8 MiB before XML parsing
and DTD/entity declarations are rejected. One transport permits four active requests, 256 admissions
and 32 MiB per minute, including retries. Ordinary iCalendar/event bounds still apply afterward.
Home Assistant requests reject redirects and cap decoded responses at 4 MiB within an eight-second
deadline before JSON parsing. Supported local HTTP needs an independently encrypted path or an
explicitly accepted trusted-LAN commissioning risk; a private address alone is not encryption.

The responsive Connections > Calendar workflow now creates that configuration
without exposing it to browser storage or SQLite. An adult supplies an HTTPS
CalDAV server address, account identifier and app-specific password; the server
tests discovery and returns only opaque option IDs, names and colours. The
adult then approves exact calendars and optional household-owner mappings. A
successful private-mode save atomically writes the external JSON secret with
owner-only file permissions and activates the read-only provider. SQLite keeps
only the server hostname, masked account hint, selected names/colours/mappings,
status and timestamps. The password and full server URL are held only in the
short-lived in-process test result until save, then discarded. Demo mode uses a
deterministic fake verifier and never contacts iCloud.

Connected calendar assignments remain editable through a separate idempotent
mapping command. That command rewrites only the allowlisted display-name/owner
mapping inside the existing server-only secret, mirrors the safe mapping in
SQLite and updates the local calendar projection. It never asks for, returns or
replaces the stored CalDAV credential. Browser presentation derives the colour
from the assigned Hearth member (or the fixed Whole family colour), so later
member colour/avatar edits flow through without reconnecting the provider.

The selected-calendar allowlist is also editable independently of account
replacement. An authenticated adult explicitly requests rediscovery; the server
loads the existing credential from its private file, contacts the provider and
returns only a ten-minute opaque test ID plus safe calendar descriptors. The
adult saves a revised exact selection through the normal idempotent save command.
The password and full server URL never return to the browser, while the external
allowlist and safe SQLite projection are replaced together.

Only authenticated CalDAV account connections are supported. Calendar web interfaces and
alternate URL-ingestion paths remain outside the integration boundary.

### Retired iCloud Reminders research (historical)

Apple Reminders is not an active Hearth integration. The former probe and native bridge are archived
under `hearth/archive/apple-reminders-bridge/` and are excluded from builds and deployment. The
following record is retained only to explain why neither CalDAV nor EventKit is currently used.

The former operator-only, read-only capability probe used the commissioned CalDAV credential to
check the [CalDAV standards boundary](https://www.rfc-editor.org/rfc/rfc4791.html). It discovered
every CalDAV collection, queried only collections that
explicitly advertise `VTODO`, and retrieves at most ten small reminder samples. Its result contains
collection names, advertised component names, aggregate resource counts and the bounded
title/status/due/completion sample only. It never returns or persists the account, password,
collection/object URLs, UIDs, descriptions or raw DAV payloads.

WebDAV permits `DAV:href` to be a URI or relative reference. The probe resolves those references
against the advertised collection, compares decoded path segments to tolerate equivalent
percent-encoding, and ignores a response that merely repeats the collection itself. It still
rejects a different origin, sibling/outside path, embedded credentials, fragment, encoded path
separator, query or nested child path before any object body can be requested.

The probe has no browser route, database write, background polling or calendar/reminder mutation.
If no collection advertises `VTODO`, the check stops after discovery; Hearth must not scrape iCloud,
guess private endpoints or imply that modern upgraded iCloud Reminders are available through the
existing Calendar connection. Apple documents EventKit as the permission-controlled native
route for [requesting reminder access](https://developer.apple.com/documentation/eventkit/ekeventstore/requestfullaccesstoreminders%28completion%3A%29),
and documents reminder access inside its own
[Calendar app](https://support.apple.com/en-au/guide/calendar/icl873b9a527/mac) without documenting a
third-party CalDAV equivalent.

The commissioned read-only check on 2026-08-25 discovered two `VTODO` collections, but both
returned the same two legacy/other records and neither contained the newly created current test
reminders. All advertised objects were included within the bounded sample. This is evidence that
the CalDAV surface is not a reliable source for modern iCloud Reminders, so Hearth must not build a
direct iCloud Reminders sync on it.

### Retired native EventKit Reminders bridge (historical)

The retired proof used a native SwiftUI companion now stored under
`hearth/archive/apple-reminders-bridge/ios`. It used a narrow `ReminderStore` protocol,
an `EventKitReminderStore` implementation and a deterministic
`FakeReminderStore` for previews/tests. On iOS 17 and later, the app requests
`requestFullAccessToReminders` because Apple does not offer a read-only
EventKit permission for reminders. The app declares
`NSRemindersFullAccessUsageDescription`, enumerates
`calendars(for: .reminder)`, lets an adult select reminder-capable lists and
reads reminders with `predicateForReminders(in:)`.

The physical EventKit proof itself remains read-only: it never calls EventKit
save, remove, commit, completion or edit APIs. The bridge adds only the frozen
pairing and full-snapshot server route. It registers a best-effort
`BGAppRefreshTask`, but has no persistent execution, APNs, two-way completion,
Apple ID request, iCloud app-specific password, private Apple URL or NAS credential. It deliberately renders
first use, permission request, denied/restricted, loading, empty, success,
stale and failure states. The simulator can prove the wiring and fake-driven
state machine; only an installed physical iPhone can prove that the current
`Reminders` and `Family Reminders` lists and test reminders are visible for the
owner's Apple Account. On 2026-08-25 that proof passed on an iPhone 17e running
iOS 26.6: the owner confirmed that both current lists and their live reminders,
including due and completion state, were visible. Completion controls remain
deliberately non-interactive in Hearth Companion.

Because the trusted Hearth origin may resolve to a LAN host, the app also declares
`NSLocalNetworkUsageDescription`. The HTTPS transport waits for connectivity while iOS resolves
the first local-network permission prompt; it does not browse or advertise Bonjour services.

While the companion is open, the EventKit adapter observes
`EKEventStoreChanged` and refetches the selected lists after a short debounce;
returning to the foreground also triggers a refetch. The current content stays
visible while a refresh is in flight, so pull-to-refresh does not replace the
whole screen with a loading skeleton. Manual refresh remains available.
Separately, when the paired app enters the background it requests another
refresh no earlier than fifteen minutes later. iOS chooses whether and when to
run that task and may delay it substantially. When granted, the app performs a
complete safe EventKit read, uploads through the existing full-snapshot
contract and reports completion only after Hearth accepts or rejects the
snapshot. A task expiration cancels the transport without marking the snapshot
accepted or clearing cached reminders. This is best-effort background freshness,
not continuous monitoring or a fixed service level.
In the physical-device run, one remote change appeared without a pull after
about nine seconds, and completing a reminder in Apple Reminders on the Mac was
reflected in Hearth Companion after about five seconds. Those end-to-end times
include Apple's iCloud/EventKit propagation, not only Hearth's local debounce.

The adult's selected-list choice survives app relaunch through a separate
`ReminderListSelectionStore`. Its live adapter stores only sorted opaque EventKit
list identifiers in the app's local `UserDefaults`; it stores no reminder
content or Apple credential. An absent preference selects all lists on the first
successful non-empty read, an explicitly empty preference stays empty, and
identifiers for lists EventKit no longer exposes are removed on the next
successful non-empty list read. A transient zero-list result cannot turn an
existing non-empty selection into an upload that clears Hearth.

EventKit exposes the reminder list/calendar and reminder fields used by this
proof, but it does not expose the user-created Sections hierarchy shown inside
Apple Reminders. Hearth therefore displays the selected list name and does not
pretend to reconstruct Apple sections from unrelated fields. True Apple
Reminders section support remains a deferred native capability investigation.

Apple references: [Accessing the event store](https://developer.apple.com/documentation/eventkit/accessing-the-event-store),
[requestFullAccessToReminders](https://developer.apple.com/documentation/eventkit/ekeventstore/requestfullaccesstoreminders%28completion%3A%29),
[retrieving events and reminders](https://developer.apple.com/documentation/eventkit/retrieving-events-and-reminders),
[updating with notifications](https://developer.apple.com/documentation/EventKit/updating-with-notifications?language=objc),
[using background tasks](https://developer.apple.com/documentation/uikit/using-background-tasks-to-update-your-app) and
[NSRemindersFullAccessUsageDescription](https://developer.apple.com/documentation/bundleresources/information-property-list/nsremindersfullaccessusagedescription),
[NSLocalNetworkUsageDescription](https://developer.apple.com/documentation/bundleresources/information-property-list/nslocalnetworkusagedescription) and
[TN3179: Understanding local network privacy](https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy).

Pairing, the distinct source credential, identifier privacy, list/reminder fields, atomic snapshot
replacement, ordering, freshness, retry, revocation and Swift client seam remain documented in the
archived `REMINDERS_COMPANION_CONTRACT.md`. The active server no longer implements that contract.
Historical native transport proof
now includes Keychain secret storage, the distinct URLSession authorization scheme, fixture-checked
Swift DTOs, selected-list wire mapping and deterministic pairing/retry/stale/revocation tests.
Physical evidence now also covers selected-list terminate/relaunch persistence, adult-approved
pairing, token exchange, full-snapshot upload and an exact retry returning `replayed: true` without
adding a server receipt. Signed household endpoint/rendered-dashboard readback, physical revocation
and forced-stale recovery remain open before the product UI is called complete. Public EventKit
does not expose Apple Reminders Sections, so neither the bridge nor Hearth models them.

## Weather

Private mode uses the server-side Open-Meteo forecast API with one household
weather location. An adult normally configures it in **Household → Weather
location** by searching a suburb/postcode through Open-Meteo's GeoNames-backed
geocoder, or by allowing a one-time browser geolocation request. Phone
coordinates are reverse-labelled through OpenStreetMap Nominatim as a direct
user-triggered lookup. The chosen label and coordinates are shown to the adult,
tested against current Open-Meteo conditions, then stored locally in SQLite.
The forecast remains independent of Home Assistant and needs no API key.

The forecast projection's optional `configured` flag distinguishes missing setup from an outage
at a saved location. A configured outage offers Retry, not an instruction to set the location again.
This flag exposes no coordinates or provider credentials; clients accept older responses without it.

`HEARTH_WEATHER_LATITUDE` and `HEARTH_WEATHER_LONGITUDE` remain a deployment
fallback for existing installations only. A saved household location takes
precedence. The TV and normal forecast read models never receive coordinates;
the adult-only settings contract exposes them only under an Advanced disclosure.

The adapter requests current temperature, apparent temperature, condition and wind; a bounded
24 past plus 25 forward hourly samples (hour-relative Open-Meteo parameters), then projects only
the provider-local current day's midnight through the following midnight, at most 25 points.
This preserves the morning part of the graph even late in the day. Each point includes temperature,
apparent temperature, precipitation, wind and direction; the daily request includes low/high,
condition, maximum rain probability, `wind_speed_10m_max` and `wind_direction_10m_dominant`.
Wind units are explicitly km/h; missing daily wind does not discard otherwise valid days.
It normalizes WMO codes into Hearth's compact presentation
contract and caches one successful response for five minutes. Concurrent reads share the same
request. If a refresh fails, the last safe response remains available as stale; if no safe response
exists, Today shows **Forecast unavailable**, Week omits the cue and Weather offers setup without
affecting calendars or household data. Household-facing contracts contain only the useful forecast
and the saved family-readable location label, never coordinates. Open-Meteo attribution and link
remain visible in adult Weather location settings, not on household-facing Weather or Today.

Open-Meteo's official forecast contract documents the selected `current`, `hourly`, `daily`,
`timezone`, `forecast_hours`, `past_days` and `forecast_days` fields at
<https://open-meteo.com/en/docs>; attribution requirements are documented at
<https://open-meteo.com/en/terms>.

## Optional ESV daily verse

Today can show one read-only ESV passage selected deterministically from a small approved rotation
using the household-local date. It is disabled by default. Private mode reads the API token only
from the external file named by `HEARTH_ESV_API_KEY_PATH`; the browser receives the quotation,
reference, translation/source link and freshness only. Demo mode uses original fictional copy and
does not contact ESV.

The adapter calls only `GET https://api.esv.org/v3/passage/text/` with server-side Token
authorization, requests the short ESV copyright marker, coalesces the result for the local day and
stores only the bounded rotation in SQLite for outage fallback. Today remains usable when the token
is absent or ESV is unavailable. Today reads saved text immediately while refreshing in the
background. Concurrent refreshes are coalesced; failed/null/stale results retry after a one-minute
backoff on a subsequent read, including within the same local day. Updated text invalidates Today.
The reading dialog retains the provider's short ESV marker unchanged and a small ESV source link.
The full copyright notice is on **More → Credits** (`/credits`), a read-only household page; it no
longer occupies the verse popup. The provider permits the standard notice on the site's copyright
page while requiring the ESV identity/notice and source link with displayed passages. No quotation
words, provider options, key/cache behavior or permissions change. Official contract and usage conditions: <https://api.esv.org/docs/>,
<https://api.esv.org/docs/passage-text/> and <https://api.esv.org/>.

## Home Assistant

### Home Assistant controls Hearth (D-108)

The optional custom integration under `hearth/integrations/home_assistant` implements the separate
`HOME_ASSISTANT_BRIDGE_CONTRACT.md`: selected foreground-screen tab controls/observed state and
explicitly approved read-only chores/calendar entities. It uses a distinct `HearthAutomation`
credential, never the outbound HA access token, adult cookie or TV credential. Manual component
installation, live pairing and physical TV proof require approval and are not implied by local
builds. No MQTT broker, public discovery, media control or background app launch is added.
An enabled data feed that cannot be read is unavailable/null, never a false zero/empty success;
screen control remains independent of those feed failures. All-day wire dates have an exclusive
end (converted from Hearth's inclusive internal local end date), preserving calendar semantics.
D-109 adds a scoped chore-control permission and standard **Today's chores** HA to-do
entity. Tick/untick maps only to existing domain completion/undo on today's occurrences with exact
retry and observed-completion protection. No creation, removal, reassignment, schedule, payment,
calendar-edit or admin operations. Legacy/read-only grants never gain this capability automatically.
D-111 removes the new-setup permission picker: one explicit approval includes all current unrevoked
screens and all three existing flags. Limited grants and newly paired screens require confirmed
disconnect/reconnect through the existing HA entry's repair. No schema/scope expansion, future
automatic grants or change to the outbound adapter. Component 1.1.2 matches the one-approval wording.

### Hearth controls Home Assistant (existing outbound adapter)

Hearth talks to Home Assistant from the server through its supported REST API. The television/web
client never receives the Home Assistant long-lived token, root URL or raw entity IDs.

The responsive **Connections > Home Assistant** workflow implements a two-step test/save boundary.
An authenticated adult supplies the private root address and a long-lived token. The server checks
`GET /api/config` and `GET /api/states`, retains the secret discovery result only in process for ten
minutes and returns opaque option IDs plus friendly labels/kinds. Save resolves those opaque IDs,
atomically writes the URL, token and raw mappings to the external
`HEARTH_HOME_ASSISTANT_CONFIG_PATH` file with mode `0600`, and activates the managed adapter without
a restart. SQLite stores only hostname, instance/version, friendly mapping labels, readiness and
timestamps. Save/remove use normal adult authorisation, idempotency receipts, audits and
`home.changed` invalidation. Demo/test mode uses deterministic fictional discovery and never contacts
Home Assistant.

Home Assistant documents Bearer authentication, `GET /api/config`, state reads and service calls in
its [REST API](https://developers.home-assistant.io/docs/api/rest/); its
[authentication documentation](https://developers.home-assistant.io/docs/auth_api/) describes
creating long-lived tokens from a user profile. Live token creation and connection remain an
owner-approved commissioning step after a current Home Assistant backup is verified.

### Read path

The first adapter reads exactly four mapped states in parallel:

- household occupancy
- living-room television power
- whether Hearth is the foreground television app
- one generic protected-media-active state covering native and Cast playback

Translate entity IDs and raw states into family-readable Hearth models.
These four safety mappings remain separate from D-126's selected temperature/humidity reads.
Door sensors remain deferred. Outdoors uses Open-Meteo; Indoors uses only its narrow selected
measurement adapter, not a general Home Assistant dashboard.

### Command path

Commands resolve a Hearth action ID through a server-side allowlist. Initial actions:

- `evening-mode`
- `goodnight`
- `screen-off`

Each definition includes argument validation, allowed roles and confirmation level. The REST
adapter calls only `POST /api/services/script/turn_on` with the server-mapped script for that action.
Reject arbitrary domain/service/entity input from clients.

### Home Assistant to Hearth

The existing `/assist` day-summary, list-addition and chore-completion routes are demonstrated in
demo/tests; their private-mode service actor currently rejects access. They are not commissioned
production voice write endpoints. Future activation needs its own typed/scoped authentication and
acceptance; the D-108 read/navigation credential deliberately cannot call them. Preserve request
idempotency because voice pipelines may retry.

Recommended initial Home Assistant scripts:

- `hearth_complete_chore`
- `hearth_screen_off`
- `hearth_evening`
- `hearth_goodnight`

## Voice

Home Assistant Assist is the voice orchestrator. The initial fully local pipeline is:

- Home Assistant Voice Preview Edition or iPhone microphone
- Speech-to-Phrase for fast allowlisted household commands
- Piper for local speech responses
- optional openWakeWord
- Whisper later for freer transcription if performance is acceptable

Hearth supplies neither the microphone nor a speech pipeline. It exposes
narrowly scoped, authenticated `/assist` endpoints and returns deterministic
text for Home Assistant/Piper to speak. Phase 5 tests exercise this contract with
the fake provider, while the private REST adapter and adult mapping workflow now
prepare the live connection without placing a token or entity ID in the browser
bundle. Actual Home Assistant/Piper sentence and hardware testing remains
deployment work.

This section governs household commands that call Hearth. Voice-requested
music follows the separate Music Assistant flow below and never calls a Hearth
`/assist` endpoint.

Intent flow for “mark Ezra's dishwasher chore complete today”:

1. Assist produces a structured chore-completion intent.
2. A Home Assistant script calls Hearth with member/chore/date and a request ID.
3. Hearth resolves ambiguity and validates permission/current occurrence.
4. Hearth commits the completion and audit event transactionally.
5. The result is returned for spoken confirmation.
6. Connected clients receive a state invalidation/update.

If multiple chores match, do not guess. Return candidate labels so Assist can ask a short clarification.

An LLM may later map open language to the same typed scripts. It cannot receive arbitrary Home Assistant tools, database access or a generic HTTP tool.

## Music Assistant voice-music path

Music Assistant is a separate open-source music-library and playback server
designed to run beside Home Assistant. It is not bundled into a fresh Home
Assistant installation and is not a Hearth component. On the planned Home
Assistant OS deployment:

1. Install the Music Assistant server from the Home Assistant App Store.
2. Add/confirm the official Home Assistant Music Assistant integration.
3. Add the Synology Jellyfin server as a Music Assistant music source using a
   dedicated least-privilege account supplied outside this workspace.
4. Use Music Assistant's native Google Cast player provider for the selected
   TCL and any later Cast speakers. Music Assistant disables television/video
   Cast devices by default, so explicitly enable only the selected TCL player.
5. Give the television player a clear logical name such as `Hearth TV` and map
   the living-room Assist satellite/area to it.
6. Install and configure Music Assistant's community voice-support
   blueprints/custom intents for initiating playback.

The mapping in step 5 means a request heard by the living-room Voice Preview
Edition can treat `Hearth TV` as its omitted target: “play Dreams by Fleetwood
Mac” routes there, while “play it in Ezra's room” names a different configured
player. This is deployment configuration, not a universal Home Assistant
setting literally named “default music destination.”

As of 2026-08-04, Home Assistant core provides player intents such as pause,
resume, previous, next and volume, but does not natively initiate arbitrary
music searches by voice. Music Assistant documents the additional community
voice-support setup for play requests, with both fully local and LLM-based
recognition options. Hearth uses the fully local/custom-intent option first.

The desired runtime flow is:

```text
Voice Preview Edition or iPhone
  -> Home Assistant Assist custom music intent
  -> Music Assistant search/queue
  -> Jellyfin music source on Synology
  -> Google Cast player named Hearth TV
  -> television/eARC audio
```

Success means the requested audio plays and Cast displays available metadata;
it does not mean the native Jellyfin app opens. Do not automate Jellyfin search
screens with Android keypresses or ADB. App UI state and updates would make
that path unreliable.

The Jellyfin music-source provider is currently maintained by Music Assistant
on a best-effort basis with no dedicated developer. Validate search, playlists,
library refresh and multi-hour playback before relying on it. If it is not
reliable enough, the approved fallback is a read-only direct Synology music
share exposed to Music Assistant through a supported Home Assistant OS/network
storage mechanism; do not grant the app broad mount privileges or change the
source silently. Jellyfin remains the native browsing server either way.

Official references:

- <https://www.music-assistant.io/installation/>
- <https://www.home-assistant.io/integrations/music_assistant/>
- <https://www.music-assistant.io/music-providers/jellyfin/>
- <https://www.music-assistant.io/player-support/google-cast/>
- <https://www.music-assistant.io/integration/voice/>

## Android/Google TV

Home Assistant uses the Android TV Remote integration for power, keys, volume,
approved native-app launches and the generic active-app state needed by
presence-aware power guards. Music Assistant uses the television's separate
Google Cast player for voice-requested audio. TCL may require Screenless
Service/network standby configuration before either integration can wake or
reach it reliably while the panel is off.

The Hearth Android shell exposes a small native bridge to its trusted web origin:

- app identity/version
- network/reconnect status
- exit/back request
- no pairing secret or Android intent surface

The implemented bridge uses `WebViewCompat.addWebMessageListener` with the exact
paired origin and accepts only type-only JSON messages up to 256 bytes. Android
Back is delivered as a native-to-web message; the web root may answer with the
single exit request. Pairing occurs through native HTTPS calls before WebView
creation, and native code installs the scoped `HttpOnly` cookie. Do not replace
this with `addJavascriptInterface`, expose general Android intents, or add
shell/ADB capabilities to web content.

The included Google TV microphone remote remains a normal Google/Gemini remote. Do not rely on remapping it to Home Assistant for the first release.

## Native television media boundary

The existing Jellyfin server on the Synology remains authoritative for movies,
television and music. The native Jellyfin client installed on Google TV
connects directly to that server and handles normal browsing and manual
playback independently of Hearth. Music Assistant may also read the Jellyfin
music library and stream resolved tracks to Google Cast, but remains entirely
within the external Home Assistant/media deployment.

Hearth therefore has:

- no Jellyfin or Music Assistant credential, adapter or connection status
- no movie/music shortcut or native-app launch command
- no media library, now-playing, queue or transport surface
- no return-from-Jellyfin workflow beyond ordinary Android app suspend/resume restoration

Home Assistant may report to Hearth only whether protected television playback
is active so presence automation does not turn off the panel. The boolean must
cover both protected native-app playback and Music Assistant/Cast playback.
That safety signal does not make media a Hearth integration. Any future
proposal to add media controls to Hearth requires explicit owner approval and
a new recorded decision.

## Photos

The primary path is explicit adult upload from the phone companion. The server:

- accepts one supported image up to 25 MiB per authenticated, idempotent command (D-124)
- verifies the decoded format instead of trusting the filename or MIME header
- normalizes an orientation-correct managed master, television derivative and thumbnail locally
- deduplicates the household collection by content hash
- stores opaque asset references
- excludes hidden/unsupported/corrupt files
- never stores the client filename or exposes private filesystem locations

One explicitly approved Synology directory may additionally be mounted read-only as an optional
bulk-import source. It is never a prerequisite for phone uploads and must not be the Synology Photos
library root. Hearth does not connect to Apple Photos, accept shared-album links or browse either
provider account.

Do not attempt facial recognition or ingest every personal photo folder in the first release.

The current Phase 7 product slice provides the typed managed-upload boundary, safe demo and private
display/thumbnail derivatives, gallery, cached states and ambient exit. The optional folder adapter
ignores symbolic links, bounds file count/depth/size, fingerprints files for incremental checks,
skips Synology's `@eaDir` metadata and `#recycle` directories, corrects orientation and creates
atomic WebP derivatives. The browser receives opaque, versioned asset routes and aggregate counts
only. An adult companion may request an idempotent, audited folder check; an automatic quiet check
runs after the configured interval. Selecting and mounting that folder remains an owner-approved
deployment step and must not broaden beyond the configured collection.

## Presence and IR

Prefer an ESP32/ESPHome node near the television for the existing PIR and IR components. This separates room I/O from the Home Assistant server and permits later mmWave replacement.

Power automation guard conditions must include:

- protected television media state reported by Home Assistant, including native-app and Cast playback
- household quiet hours
- presence timeout
- manual override/grace period

The automation sends a supported network/IR standby command. It does not hard-cut mains power.

## iPhones

There is no active Apple Reminders read path. Use the Home Assistant Companion app for:

- Assist from Action Button, lock screen, Control Centre or Shortcut
- presence only if the household explicitly enables it
- notifications for adult-facing integration failures where useful

Use the responsive Hearth web companion for detailed editing. A future native iPhone client should
consume the same Hearth household API/business rules rather than creating a second domain
implementation. Reusing the retired EventKit proof requires a new product and security decision.

## Failure reporting

Represent each Hearth integration as:

- configured and healthy
- configured but degraded/stale
- authentication required
- permission limited/read-only
- not configured
- intentionally disabled

Do not collapse “not configured,” “blocked,” “empty” and “checked successfully” into the same state.
