# Hearth v2 product specification

## Fitness demonstrations (D-129)

Adults may attach one optional demonstration and written instructions to a reusable household
exercise. A workout keeps its own weight, sets and reps. Selecting its exercise opens a clean inline
silent video with Play/Pause, Replay and Back on phone or TV; Back keeps the exercise and workout
unchanged. No video is required for instructions or completion. This is a narrow approved exception
to the exclusion of general media playback, with no streaming-provider integration or HA dependency.
See FITNESS_CONTRACT.md; no real demonstration content is seeded.

## Fitness (D-128)

Add optional Fitness for explicitly selected family members. Adult phones manage up to five long-term goals
per person, each with its own weekly focus, recurring weekday workouts and ordered exercise details
(kg, sets, reps). Today combines all active goals' due workouts and labels each with its goal.
Achieving a goal stops its future routine at the next-day edit boundary. Shared screens
can check/undo today's sessions. Running, swimming, weights and fitness class have distinct icons
and text labels. Streaks count consecutive scheduled days with every session completed, skipping rest
days; no chores/earnings coupling or ranking. First setup begins today; later plan edits begin tomorrow
to preserve historical streaks. Household-visible content, no wearable/health provider or prescription.
See [the canonical contract](FITNESS_CONTRACT.md).

## Shareable private setup (D-127)

Core family features work without Home Assistant. Offer a guided fresh-server installer, a private
first-phone QR and an adult Get started page for people, modules, screens and recovery. Optional
connections explain their prerequisites independently. The installer uses verified pinned images
and new private storage; it never copies an existing household or weakens first-owner proof.
See [SHARING_SETUP_CONTRACT.md](SHARING_SETUP_CONTRACT.md). Trusted private HTTPS and x86-64 Docker
remain explicit prerequisites; native network commissioning is not simulated.

## Indoor climate (D-126)

Weather adds Outdoors/Indoors. Indoors shows explicitly selected temperature and humidity sensors,
named rooms and trailing day/week/month/year graphs. Home Assistant remains the sensor/history
owner; Hearth keeps only a bounded temporary display cache. Missing or old readings stay explicit.
Use HA's local Recorder and long-term statistics, with encrypted History-inclusive backups to a
restricted Synology destination. No climate-device control, general sensor dashboard, new inbound
HA permission or Open-Meteo change. See [INDOOR_CLIMATE_CONTRACT.md](INDOOR_CLIMATE_CONTRACT.md).

## Quiet calendar activity (D-125)

Routine calendar refresh uses a small spinner beside the Today/Calendar heading while saved plans
remain usable. Do not interrupt the household with an updating banner. Real connection, provider,
permission, offline or failed-read issues still have an understandable message. Reduced motion and
assistive context remain available; no calendar sync behavior or authority is expanded.

## Optional NBA (D-113)

An adult may enable NBA and choose up to five standout teams for the home. Browse all teams,
this week's results/games, next week's games, conference standings and the current week's best
single-game points/rebounds/assists (ties retained). Label season/phase and freshness; never
misrepresent preseason records or single-game marks as regular-season/weekly aggregates.
NBA starts off without changing existing modules. See [NBA_CONTRACT.md](NBA_CONTRACT.md).
Team crests and optional weekly-player portraits (D-114) improve recognition without extra
navigation or TV scrolling. Artwork failure must not hide revealed scores or change layout geometry.
D-115 makes the game lists spoiler-free: reveal scores only after opening a game, with both
team totals above team-specific player box scores. Points, assists and rebounds come first;
include shooting, personal fouls and the remaining standard box-score statistics without TV overflow.

## Household Modules (D-112)

D-120 adds optional **Morning Routine**, with its own people selection (all current children before
first save), editable ordered checklists and weekday 07:00–08:00 countdown. Any step can be ticked
in any order; progress persists for that household-local date and starts fresh the next morning.
D-123 adds School days and Weekends profiles with separate participants/steps, editable day
assignments and optional countdowns. The current school lists/times/ticks are preserved; Weekends
starts with empty steps and the timer off. The assigned profile appears automatically using the
household-local date; No routine is a valid day assignment. Each date/profile has separate checks.
The time bar drains downward with remaining time labelled. It encourages readiness without locking
steps after the deadline. This independent checklist has no earnings/chore side effects. HA may
select its family destination after the existing weekday alarm launch, under explicit approval;
weekend behaviour remains separate. See [MORNING_ROUTINE_CONTRACT.md](MORNING_ROUTINE_CONTRACT.md).

Adults can turn Calendar, Weather, Reminders, Chores & pocket money, Lists, Meals, Home controls,
Photos, Connections, Notices and Daily Bible verse on/off from one simple Modules page. Off is household-wide:
hide all corresponding family/admin surfaces and deny feature API/HA access, without deleting any
saved content or provider configuration. Re-enabling restores it. Today/clock and core household,
access, inbound HA connection, recovery and system management remain available even with every module off.
HA may turn modules back on only under the newly disclosed `controlModules` grant; older approvals
are not expanded. These are fixed feature switches, not a layout editor or plugin marketplace.
The binding behavior is in [MODULES_CONTRACT.md](MODULES_CONTRACT.md).

## Human connection codes (D-110)

Ordinary Hearth connection must not require typing a machine secret. New screen, phone and HA
invitations use six uppercase letters; QR remains available for phones. Codes expire and require
explicit adult approval plus separate private device/browser proof. Powerful first-owner/recovery
proof remains a private QR, never a six-letter password. Existing phones/screens keep their access.

## Appliance direction and local access extension (D-104)

The consumer appliance must support phone-only first setup: private device-specific QR,
authenticated Bluetooth LE Wi-Fi commissioning, Ethernet alternative and LAN operation. No NAS
administration, copied key, Hearth password/passkey or mandatory vendor account in the ordinary
setup path. Additional phones and display-only screens need explicit adult approval. Ownership
must outlive a handset: an explicitly designated recovery adult or a separate private recovery
QR can authorize replacement while preserving household data. Accidental main-phone removal
remains protected. Loss of every authority/proof requires physical recovery and verified backup,
not anonymous re-enrollment. See [the staged contract](APPLIANCE_ONBOARDING_CONTRACT.md).

The private-HTTPS/browser compatibility path now implements scanned setup cards and deliberate
saved-card/exact trusted-phone recovery locally. It preserves existing networking and uses an
operator/factory-supplied private card, never an anonymous empty-server QR. Native authenticated
Bluetooth/Wi-Fi/HDMI remains future work. Publication, deployment and actual Safari acceptance
remain open; existing households never reopen first setup because phones are missing.

## Adult phone access (D-102)

D-105 adds a trusted-local first-start presentation with the existing fern, welcome title,
one private setup QR and short instructions. The operator supplies an existing first-use file;
ordinary network pages and the external TV shell cannot obtain it. Successful claim removes the
QR permanently from that presenter. Consumer hardware autostart, Bluetooth/Wi-Fi commissioning
and combined automatic phone/TV enrollment remain future work.

Adult controller access uses independent named browser connections, not passwords or passkeys.
The owner scans a privately supplied first-use setup card (operator file fallback retained). A connected adult creates
a short-lived QR for another existing adult controller and explicitly approves the requesting
phone. The first proof-connected phone is protected: deliberate saved-card recovery, explicitly
trusted exact phone approval or a fresh backend key can replace it (D-104). Ordinary QR, self
sign-out and People edits cannot. Removing a
secondary connection never removes another adult, the household or the TV. A private
owner-key fallback remains if neither saved card nor trusted phone is available. Keep current access until
replacement connections pass physical acceptance; no automatic bulk cleanup. See
[the v1 phone contract](PHONE_CONNECTIONS_CONTRACT.md). Historical passkey decisions/evidence are
not current enrollment requirements.

## Vision

Hearth should make the state of family life understandable at a glance and easy to change without finding a laptop or navigating an administrative system. From across the room it answers:

- What is happening today and this week?
- Who needs to do what?
- What are we eating and what do we need to buy?
- Is anything important waiting for attention?
- What should the room do next?

It should then allow a family member to act with a remote, an iPhone or natural speech.

## Product principles

1. **Glance first.** The default screen communicates more than it demands.
2. **One obvious next action.** Children and guests should not need training.
3. **Family truth, not another inbox.** Data remains in a clear system of record.
4. **Local and resilient.** Core household functions survive an internet outage.
5. **Power without visible machinery.** Home Assistant can be sophisticated behind a calm interface.
6. **Safe actions.** Voice and automation may simplify a command but do not bypass validation or auditing.
7. **Respect media boundaries.** Hearth remains a separate appliance surface. Normal browsing stays in native Google TV apps; Home Assistant may independently orchestrate voice-requested music without adding media controls to Hearth.

## Primary users

### Household administrator

Connects calendars, establishes people and permissions, creates recurring chores and routines, sets weekly pocket money and payday rules, records payments and configures Home Assistant actions.

Administration belongs to a personal adult controller phone or computer, never a paired family
screen. A shared screen keeps family interactions and device-local Appearance, but offers no
administration, adult sign-in or recovery path. Screen identity must not be inferred from width.

### Adult household member

Views and changes events, completes or reassigns tasks, manages meals and lists, and controls permitted home scenes.

### Child household member

Sees a simple personal view, checks off assigned chores, sees weekly progress and the proportional pocket-money amount due, and cannot change household-wide configuration.

### Guest or casual viewer

Can understand the current household state and use clearly exposed room controls without gaining administrative access.

## Interaction surfaces

- The wall-mounted Google TV is the primary shared display.
- The included TV remote is the primary direct controller.
- Home Assistant Voice and iPhones provide speech input.
- A responsive web interface provides administration and on-the-go use.
- Touch is a progressive enhancement only. No required workflow may depend on it.

## Core capabilities

### 1. Shared calendar

- Merge multiple household calendars into one view while retaining source and owner identity.
- Today, week, month and agenda views. Month remains television-legible by pairing compact colour-coded event titles and deterministic overflow counts with one avatar/colour source key rather than repeating faces in every date cell.
- Month shows up to two event titles per date, then the exact remaining count. Selecting a date opens its complete read-only day list on television and phone; focus alone never opens it.
- Person/source colour coding with accessible text/icon reinforcement.
- All-day and timed events, locations, notes and recurrence.
- Read-only cached display during provider outages.
- Event creation and editing only after a provider is selected and write scope is explicitly authorised.
- Conflict and sync-state visibility without exposing technical error noise to children.

### 2. Chores and routines

- Chore templates assigned to one or more people.
- One-off, daily, weekly and rule-based recurrence.
- Concrete daily occurrences so historical completion never changes when a template is edited.
- Optional household-local due time, snapshotted onto each occurrence with its title, description,
  routine and assignee.
- Complete and undo from the family surface. Adult skip, excuse and reassignment commands require a
  short reason, permission checks, idempotency and immutable occurrence history.
- Skipping leaves the chore due and incomplete; excusing removes it from the pocket-money
  denominator; reassignment moves an awaiting occurrence to the selected household member.
- Archiving a schedule withdraws any unfinished occurrence already due on the household's current
  local date. A completed occurrence remains visible as completed history.
- Optional evidence/note support later; never required for ordinary chores.
- Morning, after-school, evening, bedtime and anytime chore grouping.
- Streaks and progress that encourage rather than shame.

### 3. Pocket money

- Every participating child has a required weekly amount in Australian dollars and a household-selected payday. These are standing rules that repeat until an adult changes them; they are not re-entered for each week.
- Weekly progress is the number of completed chore occurrences divided by all non-excused,
  non-cancelled occurrences scheduled across the complete Monday–Sunday week. Future scheduled
  chores therefore remain in the denominator until completed, excused or cancelled.
- The amount due is the same proportion of the weekly amount, rounded to the nearest cent. Skipped chores remain due and therefore reduce the proportion.
- A parent can record one or more partial disbursements, each with an optional note. Every payment stores a dated snapshot of the counts, percentage and amount so later chore/template edits do not rewrite payment history; active payments for a week may never exceed the amount currently due.
- Mistakes are corrected with a separate adult-authenticated void record and reason. Hearth never silently edits or deletes a payment, and paid, partially paid and unpaid states remain visible by child and week.
- Recording before the selected payday is allowed with an explicit warning rather than silently blocked.
- Only an adult administrator can change weekly amounts/paydays or record a payment. Chore completion uses the normal actor and permission rules.
- Hearth does not expose star balances, reward choices, redemptions or per-chore point values.

### 4. Lists

- Grocery, packing, shopping, wish and arbitrary custom lists.
- Fast check-off from television, voice and phone.
- Optional owner, colour and due date.
- Checked-item history with a simple clear/archive action.
- Voice ambiguity must be confirmed when two items share a name.

### 5. Reminders

- Hearth owns household reminders directly. A household member may create, edit, complete, reopen
  and remove a reminder through the same private, authenticated command boundary as other Hearth
  content.
- Reminders support a title and optional due date. Date-only reminders remain date-only; Hearth does
  not invent a midnight time.
- The dedicated Reminders screen defaults to open items and can reveal completed items. Today shows
  a bounded summary ordered overdue, due today, undated and then future.
- Apple Reminders, EventKit, VTODO and companion-app synchronisation are not active product
  integrations. The retired proof is retained only under `hearth/archive/apple-reminders-bridge/`.

### 6. Meal planning

- Weekly breakfast/lunch/dinner plan, with dinner prioritised visually.
- The television presents tonight and a calm seven-night dinner strip; dense editing belongs in
  the authenticated phone companion.
- The companion can edit all seven dinners in one save, copy the previous week or explicitly clear
  a week. Saved-meal and note controls remain optional details rather than slowing the primary
  dinner-name path.
- Saved family meals support search, favourites, optional preparation time and notes, recoverable
  archive and restore.
- Meal-plan and saved-meal writes use the same validated, idempotent and audited command path as
  other household-owned data.
- Breakfast and lunch remain valid contract slots but do not receive a dedicated first-release UI
  until a real household need justifies the extra density.
- Link meal ingredients to the grocery list later.
- Do not require recipe management in the first implementation.

### 7. Photos and ambient display

- Let an authenticated adult choose one or more family photos directly from the phone companion.
  Hearth stores bounded, orientation-correct managed masters and display derivatives in its private
  Synology data directory. A separately approved read-only Synology folder may bulk-import an
  existing collection, but is not required for normal use.
- Let an authenticated adult select one or more indexed photos in companion administration, then
  favourite, unfavourite, hide or restore them. Favourites appear first in management; hidden photos remain
  indexed but never appear on Today, in the gallery or in ambient mode. Phone-managed uploads may
  also be permanently deleted after explicit confirmation. Hearth must never delete an original
  from the optional read-only Synology import folder: remove that original in Synology and run
  **Check folder**, or hide its Hearth projection instead.
- Today, Photos and ambient display use a shuffled visible-photo cycle rather than restarting
  from the same featured photo or walking chronologically. Every photo receives a featured turn
  before repeating; reshuffle at the end without an immediate repeat. Collage supports come from
  that shuffled order and never duplicate an image within the frame. Management remains stable.
- Photo management uses a compact grid in both ordinary and selection modes, with 48 photos per
  page. Ordinary management has two columns on phones; selection has three. All/Favourites/Hidden
  filters and page selection make large libraries manageable. Selections persist across pages; destructive confirmation still freezes only the exact
  eligible managed-upload targets. Imported originals remain undeletable.
- Preserve each image's native aspect ratio. Normal gallery and Today previews must not crop,
  stretch, frame or place a contrasting panel behind the photograph; rounded clipping and a
  temporary focus halo are allowed.
- Present the browsable Photos screen as a full-screen orientation-aware collage with no duplicate
  image and no narrow leftover strips. Compose the selected photo and up to four supports from their
  stored pixel dimensions: the selected image remains a substantial full-height anchor while the
  remaining images form one to three ratio-derived columns. Natural page background may remain as
  negative space when the source shapes cannot form the viewport exactly. Cycle occupants and
  selection calmly about every 45 seconds without turning portraits into landscape cells; pause automatic
  changes when the display requests reduced motion. On a phone held sideways, show three
  substantial rotating occupants instead of compressing all five into shallow strips.
- Overlay only minimal next-event or household information in ambient mode.
- Exit immediately on remote input, voice request or important alert.
- At the owner's explicit request, keep the Android TV Hearth display visible while its activity
  is foregrounded. Leaving Hearth restores the television's normal idle behaviour. Manual standby
  and Home Assistant panel-off commands remain available, including overnight.

Member profile photos are separate from the ambient family-photo collection. An adult administrator
can choose a portrait or landscape image in People, directly drag and pinch/scroll a square crop,
replace it later or restore the member's original avatar. Hearth keeps only a bounded local
derivative; it does not retain or expose the selected original file.

Family-photo uploads are also distinct from Apple Photos or Synology Photos accounts. Hearth does
not accept an Apple shared-album URL, browse a personal library or retain the client filename. The
adult explicitly chooses the files to add and the managed collection is included in the private
Hearth data backup boundary.

### 8. Notices and household summary

- A dedicated Weather destination follows Calendar in primary navigation and presents current
  conditions, a single mode-switching household-local midnight-to-midnight graph and a comparable
  seven-day forecast. Its filled dot follows the current time; inspecting another hour does not
  move the live marker.
- The graph exposes temperature with apparent temperature, rain probability with expected amount,
  and sustained wind with gusts and direction. Television use requires only D-pad directions and
  Select; the phone uses the same information in a stacked touch-friendly layout.
  Rain probability and expected amount use distinct colours and line/bar marks in aligned lanes,
  with separately labelled percent and millimetre scales; neither selected value is hidden on phone.
- Weather's seven-day temperature bars share a weekly scale and each day includes maximum wind
  speed and prevailing direction. Calendar Week keeps only the compact condition, rain and low/high
  temperatures, without range bars.
- Keep the last successful forecast readable during a provider outage and show its age quietly.
- Brief announcements with expiry and priority.
- Optional household-local daily Bible verse from the ESV API. It is off by default,
  server-fetched, visibly attributed and read-only; provider failure must not affect other Today
  content.
- Current weather and basic room/home state where useful on Today.
- Avoid a dense sensor dashboard. Show only states that affect a family decision.

### 9. Home Assistant controls

- Opt-in Home Assistant integration: select the tab on an explicitly approved, already open Hearth
  screen and read its observed tab. This never powers on a TV, launches Hearth over another app,
  opens administration or controls media. Home Assistant retains physical TV/app-launch authority.
- One explicit approval includes all currently paired Hearth screens, read-only calendar/chore
  information and completing/reopening today's existing chores (D-111). No permission checkboxes.
  Existing limited connections and newly paired screens require deliberate reconnect; installing
  an update never widens access. Completion uses Hearth's normal audit/earnings rules.
  No chore creation/deletion/assignment, calendar/schedule edits, payments or adult administration.
- Launch allowlisted scenes and scripts such as Evening, Goodnight and Screen Off.
- Display selected door, climate, energy or presence states.
- No generic entity browser on the family screen.
- Dangerous actions require explicit confirmation and should normally remain outside Hearth.

### 10. Native media boundary

- The Jellyfin server on the Synology remains authoritative for the household media library.
- The native Jellyfin Google TV app connects directly to it for normal movie, television and music browsing and manual playback.
- Outside Hearth, Home Assistant may use Music Assistant to search the Jellyfin music library and stream a requested track to the television's Google Cast receiver or another approved player.
- Voice music should target the resolved Cast/player entity; it does not need to open or automate the native Jellyfin interface.
- Hearth has no Jellyfin or Music Assistant connection, library browser, playback controls or app-launch shortcut.
- Switching between Hearth, Jellyfin and other services uses normal Google TV behaviour.
- Home Assistant provides Hearth only a generic active-media signal so presence automation cannot turn off the television during native or Cast playback.

### 11. Voice

Home Assistant owns the microphone, wake word, speech recognition, intent
handling and Piper response. Hearth does not listen or speak; it validates the
structured request, performs the household command and returns text that Home
Assistant can speak.

- Read today/tomorrow summaries.
- Complete chores and list items.
- Add permitted list items and events.
- Open Hearth.
- Trigger allowlisted Home Assistant scenes.
- Route music requests outside Hearth to the separately configured Home Assistant/Music Assistant intent flow.
- Confirm ambiguous or consequential changes.
- Work for core deterministic commands without an LLM.

Music playback by voice is not a Hearth `/assist` command. As of 2026-08-04,
initiating arbitrary music from Home Assistant Assist requires Music
Assistant's additional community voice-support blueprints/custom intents;
pause, resume, next, previous and volume have core Home Assistant intent
support. The deployment must not describe song-starting as available until
that custom flow and its target-player mapping have been installed and tested.

### 12. Family games

- Connections offers a word-grouping puzzle: sixteen tiles, four groups of four, four incorrect guesses,
  shuffle, deselection, duplicate-guess protection and a three-of-four hint.
- Use the household-supplied local puzzle archive, not a website scraper, subscription credential
  or remotely embedded newspaper interface. Keep Hearth's own visual language and navigation.
- Archive selection works by puzzle number/date on TV and phone. Progress is per device, isolated
  by household, and does not affect chores, pocket money or household records.
- Begin at the first puzzle and keep completion markers independently of replay progress. Later
  visits reopen the last successfully loaded puzzle on this device, including its saved guesses
  and completed result. Advance only through explicit **Next puzzle**, Earlier/later or Archive.
  If no usable saved choice exists, fall back to the earliest uncompleted puzzle, then the first.
- The downloaded archive is external runtime data, never published in source, images or demo
  fixtures. Preserve attribution and original boards/text; do not claim redistribution rights.

## Television home screen

The default Today screen should include, in order of prominence:

1. Current time/date, weather and a quiet connectivity indicator when needed.
2. The next few household events and each person's day.
3. Chores/routines due now or today.
4. An optional bounded summary of all incomplete reminders.
5. Dinner and the most relevant list summary.
6. One concise household notice.
7. Home-scene shortcuts in the navigation rail/dock.
8. One optional, orientation-safe preview from the approved family photo source. It should be large enough to appreciate from the sofa while remaining secondary to plans and chores. When multiple approved photos exist, the preview may advance at a calm five-minute visible-screen cadence; Today does not become a rapid slideshow or replace ambient mode.

It must not become a grid of tiny widgets. Information can be prioritised and paged rather than simultaneously exposed.
When a television column contains more plans or chores than its calm visible limit, Today shows an
honest `+N more` action into the full Calendar agenda or Chores module instead of silently dropping
items. Visible event rows open their real details; Dinner, List summary, Notice and Family photo
lead to their corresponding useful destination or full notice text.

## Initial release scope

The first household release includes:

- Household and member setup
- Seeded demo mode plus migration to real household data
- Today, Week, Month and Agenda calendar views; Agenda is a rolling window containing today and the
  next three calendar days only.
- Read-only calendar connection plus editable person/avatar/colour assignments
- Chores/routines, weekly pocket-money progress and payment history
- Lists
- Household-owned reminders with create, edit, complete, reopen and remove actions
- Photo ambient mode
- Responsive administration
- Tested household weather location, configured separately from timezone
- Home Assistant connection with a small allowlist
- Voice completion of a chore
- Android TV shell
- Synology deployment and backup

Meal planning may follow the first vertical release if schedule or quality would otherwise suffer.

## Explicit non-goals for the first release

- A visual dashboard/layout editor
- Pixel-identical imitation of Skylight or any other commercial product
- A general Home Assistant dashboard/entity browser
- Connecting to, controlling or hosting Jellyfin, Music Assistant or Cast inside Hearth; the separately approved Home Assistant deployment may run Music Assistant outside Hearth
- Audio or video playback inside Hearth
- Social feeds, web browsing or advertising
- Public multi-tenant SaaS
- Replacing the responsive web companion with a full native iOS client before feature parity and
  migration evidence exists
- Apple Reminders, EventKit or VTODO synchronisation without a new product/security decision
- Local general-purpose LLM as a launch requirement
- Biometric surveillance or camera-based person identification

## Non-functional requirements

- Common television navigation should feel responsive within 150 ms after local data is loaded.
- The Today screen should become usable within 3 seconds after a cold TV-app launch on the target device and within 1 second after normal resume where cached data is valid.
- Core local screens must remain readable when calendar, Home Assistant or internet services are unavailable.
- All household mutations must be authenticated and auditable.
- Time calculations must use `Australia/Perth` as the household default while storing instants in UTC.
- Recurrence, daylight-saving imports and all-day events require automated tests even though Perth itself does not observe DST.
- No static display should remain illuminated indefinitely without presence, an explicit media
  session or the owner's explicit foreground-display choice (D-094).
- The product must be usable with D-pad only and meet WCAG 2.2 AA contrast and reduced-motion expectations where applicable.
