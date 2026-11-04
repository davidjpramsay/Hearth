# Hearth v2 decision record

## D-132 — Canonical Hearth repository and preserved legacy source

- Date: 2026-11-04. Status: user-approved repository rename; installation and verification tracked
  in ACCEPTANCE. Supersedes D-130’s deferral of the repository migration.
- Rename the original repository to `old_hearth` and this repository to `Hearth`. Preserve both
  immutable repository identities and histories. Canonical Pages moves to `/Hearth/`; update
  public links, local remotes and the portable installer. Keep GHCR package/runtime names.
- Install a narrow root-verifier compatibility policy before the rename. Only the explicit old/new
  GitHub names and current repository ID 1327675743 can supply a verified release; redirects stay
  rejected, including ones to an unexpected host. Main/push/success/newest commit remain required.
- Preserve current app containers, household/phone/screen state, configuration and networking.
  The Games submenu is already separately implemented and tested in the source history (D-131).

## D-131 — Games menu with a Connections submenu

- Date: 2026-11-04. Status: user-requested local navigation change; release/device acceptance separate.
- Games returns as the family navigation, Modules and HA display label. Its `/games` menu links to
  Connections at `/games/connections`, keeping the existing `games` module/HA IDs and saved data.
- Preserve old explicit puzzle links by redirecting them to the child route. Query-only puzzle
  navigation replaces the current history entry; page Back returns to the opener or the Games
  menu for direct entries. Modal dismissal takes precedence over page Back.
- Both menu and puzzle stay behind the existing module boundary. No game-data import, credential,
  permission, schema, background behavior or live service change is included.

## D-130 — Public Hearth preview, private household runtime

- Date: 2026-11-04. Status: user-requested public README and GitHub Pages website.
- Use Hearth as the public product name. Preserve `hearth-v2` repository/image identities until a
  separately approved migration verifies installed updater and rollback compatibility.
- Publish only an allowlisted static directory with original branding, licensed font and actual
  fictional-demo screenshots. No backend, private data, credentials, tracking or household links.
  Pages deployment permissions belong only to its main-branch deployment job. Pull requests can
  validate but cannot publish. Existing application release gates remain unchanged.
- Describe an assisted early release with private HTTPS/amd64/operator requirements and optional
  Home Assistant. A green CI run is not an independent security review or consumer-readiness proof.
  The owner selected MIT; wider-release gaps are in [PUBLIC_RELEASE_READINESS.md](PUBLIC_RELEASE_READINESS.md).

## D-129 — Reusable local Fitness demonstrations

- Date: 2026-11-04. Status: user-authorized local implementation; deployment and physical proof open.
- Choice: adult-managed household exercise library, optional explicit links from plan exercises,
  short protected MP4 uploads and an inline remote-friendly silent player. Shared instructions and
  demonstrations update centrally; personal kg/sets/reps, historical plans and ticks stay unchanged.
- Boundary: this is the specifically authorized exception to Hearth's general media-player ban.
  No external player/provider, URL fetching, Cast/native-app launch, new HA control or credential.
- Storage: migration 0037 and private generated files inside the existing data volume. Bounded
  uploads, range reads, CAS versions, exact byte-hash receipts, safe audits and module/auth gates.
  Full matching database/media backups are required; SQLite alone does not back up clips.
- Canonical details and acceptance limits: [FITNESS_CONTRACT.md](FITNESS_CONTRACT.md#exercise-demonstrations--d-129).

## D-128 — Personal Fitness plans with scheduled-day streaks

- Date: 2026-11-04
- Status: user-requested local implementation; release and physical acceptance separate
- Choice: Optional initially-off Fitness with explicit participants and up to five long-term goals
  each. Per the owner's refinement, every goal has its own weekly focus and routine, with four
  activity types and recurring weekday sessions with editable exercise/kg/sets/reps details.
  Today combines due sessions across active goals and labels each with its goal; achieved goals
  stop scheduling at the next-day edit boundary. Up to 14 workouts total per person.
  The owner chose consecutive scheduled workout days (all sessions completed), with rest days
  skipped, current/best streak and no early failure of today's unfinished work. TV checks/undo;
  adult phone setup. No connection to chores or money.
- History: First plan starts today; later edits start tomorrow and can replace only the pending
  next-day snapshot. Preserve past/current plans and progress. Atomic versions, scoped exact
  receipts, safe audit, household timezone and module/access gates use existing infrastructure.
  Add optional goal association/focus fields without rewriting old JSON or receipt hashes.
  Preserve legacy unassigned workouts until an adult explicitly assigns them.
- Consequences: Migration 0036 and new lazy family/admin routes, no provider/dependency/credential
  or network change. HA may switch the new module only after deliberate new approval; no workout
  data/check scope or new navigation command. No live HA/TV/NAS action follows from implementation.
  [FITNESS_CONTRACT.md](FITNESS_CONTRACT.md) is canonical.

## D-127 — Make private setup shareable without requiring Home Assistant

Accepted 2026-10-29 at the owner's request. Keep the existing private setup/recovery and screen/adult
separation. Add guided fresh-server installation using verified pinned images and a local private
QR, an adult Get started page and independent optional Connections. Include deterministic matching
HA code downloads and a narrow local install/update helper with rollback, preserving existing
credentials and explicit approval. Portable release updates retain a complete stopped checkpoint;
never downgrade a migrated database in place. Do not automatically configure public exposure,
certificates, host networking, HA devices/automations or live Synology policy. Keep prerequisites and
actual hardware/deployment evidence explicit. The contract is SHARING_SETUP_CONTRACT.md.

## D-126 — Indoor climate reads HA history; HA owns recording and NAS recovery

- Date: 2026-10-29
- Status: accepted direction; local implementation, commissioning and release gates tracked separately
- Context: the owner added a Zigbee temperature/humidity sensor and wants useful indoor readings
  and up to a year of trends in Hearth without another history database.
- Choice: add Weather → Indoors through a narrow read-only server adapter and explicit adult room/
  sensor selection. HA Recorder and long-term statistics remain authoritative. Use bounded
  current/period queries, temporary display caches, safe exact settings receipts, private credentials
  and the Weather module's access gate. No general entity/service proxy or inbound HA grant change.
  Keep the existing local HA database; schedule encrypted History-inclusive backups to a restricted
  NAS destination and privately retain its recovery kit. No InfluxDB or 365-day raw-history change.
- Consequence: HA continues recording when Hearth is closed. Older graph ranges are aggregated,
  and a new sensor has no pre-installation history. Provider statistics currently require an HA
  administrator credential despite this adapter's narrower read allowlist. Backup commissioning,
  publication/deployment, physical display and spare-media restore require their own evidence.
  This explicitly supersedes the old blanket deferral of climate reads, while leaving the four
  safety states, script allowlist and native media/voice boundaries intact. See INDOOR_CLIMATE_CONTRACT.
- Commissioning boundary: the owner separately approved one existing-bridge-to-configured-HA-host
  TCP/80 forwarding rule. Root-owned operator network policy stays separate from adult source
  settings; source edits never automatically widen LAN access. Existing forwarding/DNS rules,
  inbound exposure and TV/HA automations remain unchanged. Boot/update-hook installation and
  actual reboot/later-update execution are separate evidence.

## D-125 — Quiet routine calendar refreshes

- Date: 2026-10-29
- Status: accepted
- Choice: Today, Week, Month and Agenda show routine calendar refresh as a small labelled ring
  beside the heading, not an “Updating calendar” warning banner. The ring is noninteractive and
  has no live-region announcement on every poll; reduced motion uses a static ring. It disappears
  when the read/refresh finishes and preserves heading height and saved-event visibility.
- Contract: Today/Week/Month add `calendarRefreshing`, default false for older DTOs. The projection
  keeps honest stale freshness while refreshing, returns no ordinary statusMessage, and retains
  an honest updating integration diagnostic. Authentication/configuration/provider failures keep
  their messages and report no routine-refresh flag. Cached HTTP read errors and offline state
  also remain visible; they take precedence over a cached busy flag.
- Boundary: No provider/cadence, calendar write, connection, credential, migration, HA, network or
  background-service change. Existing D-086 coalescing/backoff and foreground-only client refresh
  remain. This is the explicitly requested presentation change, not suppression of genuine issues.

## D-124 — Restore the 25 MiB per-photo cap and remove routine limit copy

- Date: 2026-10-29
- Status: accepted correction to D-122
- Choice: The owner clarified that 100 MB was understood as a batch total and requested 25 MB per
  photo. Restore the shared/provider/Fastify/proxy bound to 25 MiB. Keep the two-transfer batch
  queue, progress/pause/exact retry, compact management, thumbnail efficiency and 300-second timeout.
  There is no aggregate batch-byte cap. Remove the per-photo size line from ordinary settings;
  retained supported-format guidance and actionable oversize errors remain.
- Boundary: No migration, existing-photo rewrite/deletion, new permission, credential, import mount
  or networking change. Existing photos above the new upload limit remain readable; this applies
  only to new upload commands. Local checks, hosted release and private activation remain separate.

## D-123 — Separate scheduled School days and Weekends

- Date: 2026-10-29
- Status: accepted; source/migration, private release and actual-device evidence are separate
- Choice: Extend D-120 with two fixed profiles, each with independent people/lists and optional
  countdown. Default School days to Monday–Friday with existing times/lists; create empty untimed
  Weekends on Saturday–Sunday using the saved participants. A seven-day assignment selector can
  choose either profile or No routine. No overlapping assignments, automatic school-holiday inference
  or silent participant changes. The family view selects by household-local date and keeps seven-step
  TV fit, the bottom verse, accessible focus and natural phone flow.
- Data: Migration 0035 preserves settings revisions, school IDs/text/selections/times, all dated
  checks and receipt hashes. Progress gains profile identity. Fresh dates reset visually without
  deleting history; a midday schedule switch cannot transfer checks between profiles. Timers off
  preserve their stored times and permit every ordinary check.
- Compatibility: Settings adds canonical profiles while retaining a derived flat School configuration
  for v1 readers. Legacy saves affect only School lists/times and never erase Weekends/day assignments.
  New completions name the active profile; omitted v1 identity means School only and is not inserted
  into the raw command hash. Exact old retries replay safely; stale-day/profile/revision/version
  writes conflict. No new module, credential, privilege or HA scope.
- Operation: The current HA weekday alarm is unchanged. Weekend alarm use needs a separate exact
  automation change/approval. A live upgrade requires a checked backup; v34 rollback restores its
  matching database snapshot. Details: [MORNING_ROUTINE_CONTRACT.md](MORNING_ROUTINE_CONTRACT.md).

## D-122 — Compact photo management and a bounded visible upload queue

- Date: 2026-10-29
- Status: accepted; local, release and physical throughput evidence remain separate
- Choice: Page ordinary curation as well as selection at 48 photos. Use two phone columns, a wider
  responsive grid, whole-image previews and compact accessible actions; retain exact deletion and
  read-only imported originals. Add visibility/favourite filters and explicit Select page/Clear.
- Uploads: Originally increase the advertised per-photo limit from 25 to 100 MiB, superseded by
  D-124's restored 25 MiB bound and removal of routine size copy. Keep one raw image per
  authenticated idempotent command and 120-million input-pixel validation. Two same-origin transfers
  may overlap; adult/controller access is checked before reading the larger body and again before
  mutation, preserving legacy mixed-cookie screen retirement. Expensive preparation remains FIFO,
  including recovery after a failed job.
  Show transfer/preparation/progress/outcomes, pause/resume and exact-ID/file retry. Hold work only
  in page memory, release accepted File references and register unfinished work with draft guards.
  No browser transcoding, background sync, new account/permission or credentials.
- Efficiency: Preserve canonical master encoding/content hash, avoiding deduplication changes or
  rewriting existing images. Generate a 480px new-upload thumbnail from the already bounded display
  output. Scope Nginx body/read-timeout increases to photo uploads. Keep other API limits intact.
- Boundary: No deletion, live upload, import-source, DSM/network or deployment change is authorized
  by local implementation. Larger end-to-end uploads and throughput still require physical/private
  release verification; a local benchmark cannot prove NAS/Wi-Fi speed.

## D-121 — Install the shared web companion on iPhone and iPad

- Date: 2026-10-29
- Status: accepted; release and actual Home Screen installation remain separate evidence
- Context: The fern icon was present, but Hearth deliberately had no standalone declaration or
  manifest under the earlier icon-only D-093 refinement. The owner now requests iOS/iPadOS web-app
  capability. This decision supersedes that refinement's metadata-only restriction, not its access
  or privacy boundaries.
- Choice: Declare a same-origin web manifest with stable root identity/scope, the name Hearth and
  `display: standalone`. Start fresh launches at `/today`, never a saved administration, setup or
  recovery URL. Retain the existing 180px Apple touch icon, generate 192/512px opaque fern renditions
  from the same canonical artwork, and provide Apple's capable/title/default-status-bar metadata.
  Leave orientation unrestricted for iPad rotation and multitasking. Safari remains supported.
- Boundary: This is the existing responsive web client and private API, not a new native client or
  authentication method. Installation grants no adult/screen privileges. Keep HttpOnly cookies,
  approval/recovery, session expiry, shared-screen isolation and current pairings unchanged. No
  service worker, household-data offline cache, push, background sync or credential migration.
- Operation: New devices use Safari's Share → Add to Home Screen (Open as Web App where offered).
  Use the existing adult-approved connection if that installed context is not connected. Never
  delete a working owner web app or clear its data to refresh metadata. Home Screen and browser
  storage can be separate; do not promise cookie continuity from viewport emulation.
- Basis: [WebKit's iOS/iPadOS web-app behavior](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/#every-site-can-be-a-web-app-on-ios-and-ipados)
  and [Safari 17.2 cookie-copy boundary](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/#web-apps).

## D-120 — Weekday Morning Routine with independent progress and countdown

- Date: 2026-10-28
- Status: accepted; implementation and actual alarm evidence are separate
- Choice: Add an optional Morning Routine module, independent participant selector, per-person
  ordered editable lists and a household-local 07:00–08:00 vertical bar that drains downward.
  Select all children initially; retain explicit saved choices and deselected lists thereafter.
  Order guides rather than locks; check any step and undo. New local dates start unchecked, while
  reopening/restarting retains today's progress. Weekends show an intentional weekday-only state.
- Persistence: Separate settings/progress/atomic actor-scoped receipts in migration 0034. Validate
  current household/person/step/date and revision/version before new writes. Exact retries replay
  without retoggling; audit omits titles. No chore or earnings effects and no personal seed data.
- UI: Three TV cards per page, bounded step pages, natural phone flow, readable countdown labels,
  progress cues, reduced motion, dark mode and remote exit/navigation. The 2026-10-29 refinement
  fits standard five-step lists together on compact/short TVs, removing duplicate next-step and
  introductory headings while retaining announced save feedback and visible errors.
  The subsequent seven-step refinement reclaims compact-TV padding, gaps and duplicate decoration;
  it retains the existing text/check/target sizes, three visible people and bottom verse. Larger or
  unusually long lists keep explicit paging; saved settings and the twelve-step limit do not change.
- Verse: The owner also requested the Bible verse at the bottom. Reuse the existing daily verse,
  private provider key, shared nonblocking cache and full-text dialog through a narrow authenticated
  `GET .../daily-verse`. Respect its module flag independently of Today's section switch; retain
  five-step TV fit, readable excerpts, saved/unavailable states and remote focus. No new persistence,
  provider, credential, HA grant or alarm behaviour.
- HA: The existing bridge may select the new family tab only with explicit new-module approval.
  HA retains all physical/music authority. Append a weekday choice after the existing launch and
  guards; preserve weekend alarm behaviour. Never execute wake/music as a setup test.
- Details: [MORNING_ROUTINE_CONTRACT.md](MORNING_ROUTINE_CONTRACT.md).

## D-119 — Share compact sizing across Today's text modules

- Date: 2026-10-20
- Status: accepted; local implementation, release and physical viewing remain separate gates
- Context: The user asked to extend the compact bottom-verse rule to the other bottom Today
  modules, not leave Dinner, Lists, Notices and Reminders stretching into spare vertical space.
- Choice: Use intrinsic-height grid rows for every Today summary card, with a 60-logical-pixel
  readable/actionable minimum and normal padding. Bottom-align the summary group and cards within
  each row; allow quiet space above it rather than inflating the cards. Retain existing responsive
  column/span choices and the verse's full-width final row. A lone verse has no extra empty track.
  Full-detail links/dialogs, stable focus IDs and Back behavior remain. Photo slots
  still use their independent bounded, aspect-preserving layout; phones stay in document flow.
- Height budget: Compact TVs with core content use concise 18px, single-line excerpts. A separate
  verse row with other summaries reserves four core rows on full-height TVs and three on compact
  TVs; very short TVs reserve one when four/five summaries include that verse row. Other capacity rules remain. Omitted core
  items retain honest overflow links. Reserve this budget from first render, not by hiding a failed
  row dynamically when Retry appears. Full-height TVs keep their existing excerpt sizing.
- Verification: Apply natural-height and bottom-row assertions to all existing composition cases,
  then exercise each non-verse module alone, populated and empty, across photo shapes, themes and
  short/compact/1080p/4K TVs. Keep readable-size, overlap, scrolling, stale/retry and remote checks.
- Boundaries: Extends D-118's sizing policy and supersedes D-116's text-card stretch only. No API,
  migration, provider, dependency, timer, layout measurement/effect, setting or private runtime
  configuration change. Photo fitting is unchanged; only the bounded text/core height policy is
  refined.

## D-118 — Keep Today's verse compact and bottom-aligned

- Date: 2026-10-20
- Status: accepted; local implementation, not publication/deployment or physical-device proof
- Context: After the D-116 release the user liked the improved TV fit but asked that Daily verse
  stop consuming all unused vertical space. A quiet gap above it is preferable to an oversized card.
- Choice: Render the verse after the other summary modules, in an intrinsic-height final row of
  the existing summary area. Span that area's width and align its bottom to the dashboard; keep
  the excerpt's existing clamping and full-detail/Back interaction. Apply the same geometry to
  the informational unavailable state. Other summaries can still expand; photo containment, core
  order, focus visibility and natural companion scrolling remain. Very short TVs with all five
  summaries use one core row and honest overflow so stale/retry states remain readable; all other
  capacity rules are unchanged. Hide the row when the
  existing preference/module is off. No sticky phone footer or new setting is introduced.
- Verification: Extend the shared composition geometry checks to assert content-height sizing,
  bottom alignment and separation from other modules, including sparse/verse-only layouts,
  unavailable/off states, both themes, TV sizes, photo shapes, D-pad and Back restoration.
- Boundaries: Supersedes D-116's verse-stretch detail only. No API, database, provider, timer,
  photo rotation, credential, pairing, HA, native shell or live-runtime change.

## D-117 — Reopen the last successfully loaded Word groups puzzle

- Date: 2026-10-19
- Status: accepted; local implementation, not publication/deployment or physical-device proof
- Context: Guesses survived, but returning to `/games` deliberately chose the earliest uncompleted
  puzzle instead of the archive puzzle the family had been playing. Query parameters alone did
  not survive normal Games navigation.
- Choice: Add one validated, optional `lastPuzzleId` to the existing device-local v2 store; do
  not reset guesses/completions or bump to a clearing store. Remember only a successfully loaded
  board, including untouched choices. Explicit links win; otherwise resume the stored catalogue
  ID, using the most recent old-v2 attempt when no pointer exists. Missing/removed identities fall
  back to the earliest uncompleted puzzle, then the first. Invalid/failed loads cannot replace the
  saved choice. Preserve completion badges/replays; a finished board remains visible on reopen
  until an explicit navigation action. Next/Replay receive sensible remote entry focus.
- Boundaries: Per device, runtime and household; no server command, migration, credential, answer
  storage, archive import, cross-device sync or live setting change. Blocked storage remains playable
  with the existing progress-save warning. Supersedes only D-092's later-visit entry policy.

## D-116 — Today fills bounded tracks and follows the visible composition

- Date: 2026-10-19
- Status: accepted; local implementation, not publication/deployment or physical-device proof
- Context: Photo dimensions based on viewport height could escape the actual remaining rail,
  while shrink-wrapped, bottom-anchored summary cards left available reading space unused.
  The existing 384-case inventory checked outer scrolling, not sibling intersections.
- Choice: Put Chores left/before Upcoming in the DOM. Own Today layout in a scoped stylesheet;
  use remaining logical-canvas tracks with zero minimums and intrinsic, contained images rather
  than photo `vh` sizing. Stretch enabled summaries into balanced rows with no reserved disabled
  track. Portrait photos share the upper core rail; other photos share the lower summary rail.
  With neither core module, summaries/photo take the full dashboard. With no summaries, only
  enabled content allocates tracks. Very short TV canvases show two core rows and honest overflow.
  The phone scrolls naturally, uses Chores first and bounds tall photos; a landscape companion
  uses paired columns only when wide enough. Existing spatial navigation follows actual geometry.
- Verification policy: Retain all 384 named summary/photo combinations and add sibling/slot bounds,
  decoded extreme-aspect pixel fixtures, core-module combinations, both themes, phone/tablet/4K,
  resize, error/stale and remote reachability checks. Small existing focus-scale overscan is
  measured in logical pixels, not mistaken for a structural intersection.
- Boundaries: No layout editor, API/schema/migration, feature preference, photo rotation cadence,
  authentication, provider, HA, TV-shell or live runtime/network change. Supersedes the old
  shrink-wrap/viewport-photo sizing detail of D-058/D-063, not their bounded appliance direction.

## D-115 — Reveal NBA results only inside a readable individual-game box score

- Date: 2026-10-18
- Status: local implementation; verification evidence in ACCEPTANCE; not deployment approval.
- Context: David wants to browse games without seeing final scores, then open a game for both
  totals and team player lists with points, assists and rebounds first, including personal fouls.
- Choice: remove scores/winner styling from cards and accessible names. On deliberate open,
  reveal both totals above two selectable team rosters. Two stat views and eight-player pagination
  keep TV fit; labelled phone stat grids preserve readability. Back closes/restores the same card.
- Boundary: separate typed box-score provider/service, current-fortnight known IDs, fixed ESPN
  summary origin, bounded/coalesced memory/time/bytes/concurrency and explicit stale/unavailable
  states. Named keys, reported totals, nullable missing stats and distinct DNP avoid invented data.
- Consequences: supersedes D-114 card-score presentation, not weekly-best/standings views. Overview
  API scores remain backward-compatible (spoiler UI, not confidentiality). No migration, credentials,
  native APK, HA scope, live settings or networking change. See NBA_CONTRACT for exact bounds.

## D-114 — Bounded NBA artwork, without sacrificing the one-screen TV surface

- Date: 2026-10-18
- Status: local implementation; release/physical acceptance separate.
- Context: David requested a slicker but clean NBA presentation, team logos and weekly-player
  portraits while keeping the existing one-screen TV layout.
- Choice: retain the four views and six-card/eight-row pagination. Add fixed-size crests, optional
  portraits, ornamental team-colour rules and clearer score hierarchy. Text, scores and focus
  remain authoritative; missing artwork uses initials/abbreviations without layout shift.
- Boundary: optional server-only `NbaMediaProvider`, fixed ESPN CDN paths, validated team IDs and
  numeric player IDs already in the current highlights. Raster-only, timeout/byte/pixel bounded,
  resized WebP with finite in-memory cache/concurrency; no arbitrary URLs or browser CDN access.
  Module/auth gates precede I/O. Demo is network-free and never maps real faces onto fictional names.
- Consequences: supersedes only D-113's original artwork exclusion. No database migration, new
  dependency, credentials, CSP relaxation, HA scope, native APK or live-system change. Public image
  availability grants no commercial rights; the existing supported/licensed-source gate remains.
  See NBA_CONTRACT and ACCEPTANCE for exact bounds and evidence.

## D-113 — Optional NBA, standout teams and honest weekly highlights

- Date: 2026-10-18
- Status: local implementation; release/physical acceptance separate.
- Context: David requested season overview, this/next week's games, selected standout teams and
  interesting weekly performers.
- Choice: initially-off NBA, household-persisted up-to-five standout teams, paged local-week
  schedules and conference standings. Narrow keyless public ESPN adapter, deterministic demo,
  bounded/coalesced read-through cache, explicit source/phase/freshness. Best single-game
  points/rebounds/assists, not unsupported weekly totals/averages. Full league remains accessible.
- Consequences: additive migration 0033; no existing module/data/access changes. HA approvals
  freeze `moduleIds` (legacy eleven by default); fresh approval may add NBA's module switch,
  not sports-data/navigation scope. No odds, logos, streams or credentials. Public feed has no
  SLA; commercial distribution requires a supported/appropriately licensed source. See NBA_CONTRACT.

Record durable choices here. New decisions should include date, status, context, choice and consequences.

## D-112 — Household Modules with retained data and scoped HA switches

- Date: 2026-10-15
- Status: locally/hosted verified; approved private release `35c7bb7` and matching HA 1.2.0 installed.
  Adult reconnect and physical module acceptance remain open; evidence in ACCEPTANCE.
- Context: The adult wants simple module on/off controls that hide a feature everywhere, deny HA
  access while off and retain its data for later. HA must also be able to restore modules.
- Choice: Eleven fixed household flags, all default on. One adult Modules page plus separately
  approved HA switches. Enforce at HTTP/provider/aggregate/command boundaries, not only navigation.
  Retain feature data/configuration and independent Today choices. Core household/access/system,
  Today/clock and inbound HA management cannot be disabled.
- Authority: Add `controlModules` default false. Fresh single approval explicitly grants it;
  old grants/pending approvals stay restricted until deliberate reconnect. Off forbids corresponding
  reads/writes, including exact feature-command retries, but the module switch stays available.
- Consequences: Add migration 0032, audited/idempotent actor-scoped module commands, realtime flags
  and HA component 1.2.0. Cancel pending disabled-tab commands. Never broaden credentials into
  adult access, payments, arbitrary edits, power or media. This extends D-111's future explicit
  bundle, not its installed historical grant. Implementation alone grants no live-change authority;
  the separately approved rollout preserved current feature flags/networking/TV state and existing
  grant scopes. Contract: MODULES_CONTRACT.md.

## D-111 — One explicit Home Assistant approval, no permission picker

- Date: 2026-10-15
- Status: implemented, locally/hosted verified and approved private release installed as `f614548`
  with HA component 1.1.2. Live adult reconnect and functional device proof remain separate.
- Context: The adult completed setup without ticking permissions, leaving a connected but unusable
  integration. Per-feature choices made the difference between server data and screen control harder
  to understand. The owner explicitly requested the supported bundle without options.
- Choice: Disclose one bundle before **Approve Home Assistant**: all currently paired, unrevoked
  Hearth screens, calendar/chore information and completing/reopening today's existing chores.
  Snapshot the screen IDs and all three true flags only on explicit approval; uncertain retries
  reuse that exact request. No checkboxes. Zero screens still permits data/chores; more than the
  contract's 20 screens blocks approval instead of silently selecting a subset.
- Boundary: This is not unrestricted access. No adult/admin login, calendar edits, general chore
  editing, payments, power, media or background app launch. Ordinary completion affects earnings.
  Existing limited grants are not upgraded; confirmed disconnect and fresh adult approval are
  required. Newly paired screens also require reconnect. Future features are not silently granted.
- Consequences: Supersedes D-108/D-109's per-feature setup UI, not their scoped transport, default-false
  legacy flags or revocation rules. No schema, migration or credential-format change. HA component
  1.1.2 matches the instructions, including its actual progress-action translation. Use the existing
  HA entry's reauthentication repair after disconnect, not a duplicate entry. No live TV/chore command
  or morning-automation change is included in this rollout.

## D-110 — Six-letter invitations and invisible machine credentials

- Date: 2026-10-15
- Status: implemented and locally verified; hosted release and physical acceptance remain separate
- Context: Manual HA key copying and the owner-file typing fallback made connection unusable.
  D-108's key reveal and D-102/D-103's browser key entry are superseded, not their security
  boundaries. A six-letter permanent password would be an unsafe replacement.
- Choice: New human codes are six CSPRNG uppercase letters, omitting ambiguous I/O. Screens keep
  ten-minute adult approval plus the existing private device secret; previously issued mixed codes
  remain accepted. Additional phones use a five-minute code or QR, then the existing pending-cookie,
  original-inviter approval and exchange. HA privately generates its 32-byte secret and displays a
  five-minute code; an adult enters it in Hearth and approves explicit permissions. Exchange
  rechecks that exact phone/session and capabilities at commit. A code alone is never authority.
  Attempts, rows and lifetime are bounded; SQLite stores code/secret digests and safe metadata only.
  Exact exchanges replay the same grant. No raw credential is reconstructed after restart.
- Recovery: No normal long-key field. Initial setup, saved recovery and operator replacement use
  separate strong private QR proofs. The backend file fallback is rendered locally into a
  replacement QR, never shortened or exposed to anonymous screens. Owner protection, adult/screen
  isolation, provider credentials, existing connections and networking are preserved.
- Rollout: Additive migration 0031 leaves current phones/screens/grants intact. New HA setup needs
  matching custom component 1.1.0 and server; existing HA config entries remain valid. Hearth
  publication does not install the HA component. Live HA/TV/Safari proof remains separate.

## D-109 — Separately approved Home Assistant chore completion and reopening

- Date: 2026-10-15
- Status: user-requested local extension to D-108; live HA/TV/NAS installation and publication are
  separate approvals. No device in use may be disturbed.
- Context: The owner asked for chores only after discussing broader HA write access. Read-only
  sharing must not silently turn into write authority; accidental completion can affect earnings.
- Choice: Off-by-default `controlChores`, requiring `shareChores`, permits status changes on
  today's existing household occurrences only. Expose a standard HA to-do entity; no add, delete,
  rename, reassignment, schedule/exception, calendar, payment or administration operations. Keep
  existing grants read-only. Screen approval/presence is independent of chore control.
- Safety: Derive the household from the dedicated grant, bind exact request IDs/payloads durably
  before execution, use existing atomic completion/undo rules and audit actor/source, and require
  the observed completion ID for reopening. Recover accepted receipts after a crash or midnight
  without applying again. A revoked grant cannot replay. Bound new requests to 30/minute.
- Consequences: Extend the unpublished migration 0030 and version-1 opt-in contract. The HA list
  omits locked/non-actionable chores and is unavailable for failed, stale-day or truncated feeds.
  It refreshes observed state after acceptance instead of checking boxes optimistically. Existing
  pocket-money calculations respond normally; no financial control is granted. Broader edits and
  adult-account access remain out of scope.

## D-108 — Dedicated local HA integration for Hearth tabs and safe readback

- Date: 2026-10-15
- Status: user-requested local implementation; focused automated tests approved. No live HA/NAS/TV
  installation or commands while the home TV is in use. Publication and physical acceptance open.
- Context: The existing outbound HA connection does not make Hearth a device/entity in HA. The
  priority is explicit tab selection and observed active-tab feedback, with optional chores/calendar
  information. Reusing adult or TV credentials would grant unrelated household write authority.
- Choice: Manually installed HA custom integration with config flow/coordinated polling, selected
  paired screens, digest-only distinct `HearthAutomation` credential, revocation and no cookie fallback.
  Ephemeral visible-screen leases, native eligibility generation, strict shared tab map, 30s commands,
  exact receipts, and observed-route acknowledgement prevent misleading optimistic success or stale
  navigation. Old native shells fail closed; HA keeps power, app launching and media authority.
- Readback: Explicitly opt-in read-only chore projection and provider-owned calendar projection;
  bound ranges/counts and omit provider identifiers, notes, locations, URLs, permissions and money.
  Null enabled feeds mean unavailable, never false empty/zero. Existing cache/occurrence materialization
  is not new completion/calendar-write authority. Internal inclusive all-day ends convert to exclusive
  wire dates. Calendar/chores failures do not take away screen navigation.
- Consequences: Migration 0030, new versioned contract, native foreground capability and private
  manual HA component install. No MQTT broker, public discovery, server credentials in TV/phone
  bundles, generic URLs/intents, EventKit revival or live networking change. Existing private `/assist`
  write routes remain unavailable and are no longer documented as commissioned production support.
  D-109 subsequently adds separately approved chore completion/reopening only.

## D-107 — One coherent administration scale and joined menu primitive

- Date: 2026-10-15
- Status: requested local UI cleanup; publication, deployment and physical acceptance remain separate
- Context: More uses green joined rows while planning uses larger purple cards; individual admin
  forms vary in button heights, typography and focus. Safe and destructive choices can look alike.
- Choice: Share typed, state-free settings-menu components over the existing navigation seam.
  Centralize companion sizing: 32px page titles, 22px section headings, 18px navigation, 16px body
  and controls, 14px labels/help, 48px standard controls and 44px compact utilities. Use eucalyptus
  primary, neutral secondary/cancel and brick destructive actions. Preserve native widget geometry,
  long-label wrapping, dark mode, inset menu focus and Back restoration. TV family menus retain
  their separate 28px/80px readability scale; no administration is exposed to shared screens.
- Consequences: Styling and menu composition only. No provider, schema, authentication, household
  command, NAS configuration, automatic installation or deployment changes. Automated suites are
  neither added nor run at the D-107 checkpoint; D-108 subsequently received separate test approval.
  Build/source/manual rendered evidence
  does not substitute for those release gates or actual iPhone/TCL acceptance.

## D-106 — Varied photo playback and compact paged removal selection

- Date: 2026-10-13
- Status: requested implementation, commit/push and manual-update release verification
- Context: The same starting photo/ordered rotation feels repetitive, and full-height selection
  cards are impractical for a large phone library.
- Choice: Shuffle the full visible pool per display session and again after every complete featured
  cycle, avoiding immediate repeats. Preloading is a pure peek. Preserve native-ratio collage,
  manual selection, pause/hidden-tab/reduced-motion controls and rotation cadence. Favourites remain
  first in management only; display playback gives all visible photos a turn.
- Selection: Whole-thumbnail tiles, three phone columns, 48 per page, persistent cross-page ID
  selections and visible counts. Exact frozen deletion confirmation, cancel, partial errors and
  imported-original protection remain. No server/API/persistence change or new background behavior.

## D-105 — Private local welcome presenter, never an anonymous setup QR

- Date: 2026-10-13
- Status: implemented operator/local-display slice; automatic appliance/HDMI hardware work open
- Context: First startup should show Hearth's fern, a welcome title, a large QR and simple
  instructions without reintroducing an anonymous first-owner takeover path.
- Choice: A local provisioning process with access to the existing protected file opens an
  ephemeral loopback-only, capability-bound presenter. Only trusted private HTTPS status GETs
  determine whether it may show the locally generated QR. Failed/stale reads hide it; observing
  a claim is terminal and removes it permanently. Do not expose or forward the renderer.
- Boundary: It creates no credential, server route, database migration, network/radio write or
  display grant. It is not consumer hardware autostart, the external TV shell, or a network page.
  Factory/HDMI wiring and combined phone/TV commissioning need actual hardware proof.
- Acceptance: The user permits release/manual update without further physical phone recovery drills.
  Keep those drills open. A separate isolated physical iPhone first-owner claim passed; neither
  browser tests nor that claim establish loss/recovery, Bluetooth, Wi-Fi or HDMI acceptance.

## D-104 — Phone-only appliance commissioning and phone-independent recovery

- Date: 2026-10-12
- Status: implemented browser/NAS setup-card and recovery release candidate; commit/push authorized
  after full local verification, with hosted publication and deployment separately gated;
  native authenticated network commissioning and physical acceptance remain open
- Context: The future plug-in appliance must not require a NAS console or copied owner key, and
  loss of the original phone must not require server administration while another trusted adult
  or independently saved recovery proof survives.
- Choice: A private per-appliance setup QR authorizes a reviewed authenticated local commissioning
  session. Prefer Bluetooth LE for Wi-Fi provisioning, offer Ethernet, and use the LAN afterward.
  A temporary setup network is a fallback transport, not proof of ownership. Trusted local HDMI
  can deliver the QR only on supported hardware; an anonymous server page/TV web shell cannot.
- Ownership: Separate the household owner/recovery adults from individual phone credentials.
  Explicitly designated exact adult phone connections may approve an existing owner's replacement; a separate offline
  QR covers all-phone loss. Ordinary invitations do not promote recovery authority. Keep casual
  owner removal forbidden, independent TV credentials and atomic, audited replacement.
- Security: Initial setup proof is permanently disabled after claim. Claimed appliances never
  reopen setup because sessions expire. Setup/recovery scope and generations are disjoint;
  discovery and metadata validation alone grant nothing. No mandatory cloud account or vendor
  recovery backdoor. Loss of every proof still needs physical recovery/reset plus verified backup.
- Browser compatibility: On an already reachable trusted HTTPS server, a privately supplied
  first-use QR replaces copying the operator key into the phone form. A provisioning-workstation
  helper creates that private PNG; anonymous browsers never fetch/mint it. Existing first-use
  verification, irreversible household setup and backend fallback remain.
- Recovery implementation: Migration 0029 adds digest-only independent cards, generations,
  exact-connection trust and request fingerprints without assigning trust/revoking access.
  Prepare/save/acknowledge/activate preserves the prior card until activation. A trusted phone
  uses a bound explicitly approved replacement invitation. Commit-time checks and one transaction
  retire the old owner/linked authorities, issue one replacement and preserve other devices/data.
  No automatic expiry of activated cards; bounded raw retry receipts exist only in memory.
  Ordinary same-member invitations cannot clone recovery authority. Recovery audits are typed.
- Transition: Extends D-102/D-103 locally, retaining casual owner-removal and screen protections.
  Future native JSON QR/metadata schemas/readiness are validation only, distinct from the active
  browser fragment-link format. No native/radio/network service, live pairing or deployment is
  introduced. The retired Apple proof stays excluded.
- Consequences: Follow [the contract](APPLIANCE_ONBOARDING_CONTRACT.md); select/prove hardware and
  local identity/transport before native/network implementation. Existing households adopt recovery
  only with verified owner consent and physical acceptance, preserving current access and data.

## D-103 — Main owner phone is replaceable only with the private backend key

Current refinement: D-104 adds deliberate saved-card and explicitly trusted exact-phone recovery
in the browser release candidate. The backend-only choice below records the earlier request;
casual removal/sign-out, owner People protection and ordinary-QR restrictions remain in force.

- Date: 2026-10-12
- Status: accepted user request; local implementation and verification, no publication/live activation
- Context: The owner explicitly rejects removal of the main administrator phone from any connected
  phone and requires the protected backend key file for that operation.
- Choice: `source=owner` is protected, server-verified ownership. Owner bootstrap/key recovery
  establishes or atomically replaces the main phone; QR connects ordinary adult controllers only.
  Removal, self sign-out, QR account switching, shared-screen conversion, owner-adult archive and
  demotion are rejected by the server. The menu marks the owner and offers no Remove/Sign out.
  Other adults may still manage secondary phones and screens. Owner profile edits remain allowed.
- Recovery: NAS-owner issuance creates a digest-only one-use grant in a protected private file
  and supersedes earlier unused household grants without revoking access. Successful claim alone
  retires the prior owner and its sessions/invitations, creates the new owner and consumes the
  grant in one transaction. Invalid proofs/storage errors preserve the old owner. No QR phone,
  television, content, role, private configuration or networking is reset.
- Limits: This is a protected browser connection, not hardware attestation or an unexpiring cookie.
  Cleared/expired browser authority needs a fresh owner key. Restrictive screen safety checks may
  end a mixed browser session without deleting ownership; screen isolation takes precedence.
  Legacy sessions are not silently designated the owner; a deliberate owner key establishes it.
- Consequences: Refines D-102's all-connections-removable rule. Reuses migration 0028's owner
  provenance; no new migration or password/passkey. Physical setup/replacement and live activation
  remain acceptance gates. See [the phone contract](PHONE_CONNECTIONS_CONTRACT.md).

## D-102 — Owner-key bootstrap and independently QR-approved adult phones

- Date: 2026-10-12
- Status: implemented and locally verified; physical checks, publication and live migration pending
- Context: The owner cannot reliably distinguish whose saved passkey a phone uses and requests
  no passwords/passkeys, a protected file key for the first phone, then QR from a connected phone.
- Choice: Separate named adult identities, browser connections and display grants. Bootstrap or
  recover using an owner-issued short-lived one-time key file. A connected adult controller
  creates a QR for the intended adult; scanning creates a browser-bound pending request, and the
  inviting phone must explicitly approve before one-use exchange. D-103 protects the owner phone;
  keep secondary connections removable without switching the inviter or changing the TV.
- Security: This is possession-based connected-browser authority, not user-verified biometrics.
  No shared PIN, password or new passkey ceremony. Protect phones with locks. Private HTTPS,
  origin/browser checks, bounded secrets/expiry, hash-only storage, HttpOnly cookies, server
  revocation and adult capabilities remain mandatory. Sensitive updates require recent explicit
  connected-phone consent; issuance/refresh alone cannot create consent. See
  [the v1 contract](PHONE_CONNECTIONS_CONTRACT.md).
- Migration: Additive only; keep established legacy sessions, accurately labeled as earlier
  browsers. Correct identity only with an authorized owner grant, never by guessing from a
  label. No live reset, owner grant issuance, deployment or legacy cleanup in this change.
- Supersedes: Active adult passkey requirements in D-014/D-032/D-044/D-091/D-096/D-097;
  historical evidence remains historical. Shared-screen isolation in D-099 is unchanged.

## D-101 — Month keeps two event previews and opens the complete day explicitly

- Date: 2026-10-11
- Status: accepted user request; local implementation, not publication/deployment approval
- Context: The compact one-title rule and hidden overflow lines made some dates misleading or
  clipped. TV selection did not expose the full day; phone used a separate automatic inline agenda.
  The owner requests two events with a clean remaining count and selection to show all events.
- Choice: Reserve two title rows and a separate `+N more` line in every date cell (`+N` on phone).
  Count only events after the two previews; do not show a count for zero/one/two-event dates.
  Compact chrome may tighten while preserving cell/target readability, the source key and the
  week-style navigation bar. Retain a minimum cell height on unusually short/message-heavy
  screens instead of clipping the previews/count. OK/Enter/tap opens the shared, read-only
  full-day dialog. Focus alone only highlights the date. Every event remains available; details,
  Back and Close restore the exact event and date. Remove the duplicate inline phone agenda.
- Consequences: Supersedes D-024's one-title compact layout and automatic phone agenda, not its
  identity key or bounded provider-neutral projection. The existing Month response/index and Week
  day dialog are sufficient; no API, migration, integration permission or calendar write changes.
  Browser/device acceptance and actual deployment remain distinct from local source verification.

## D-099 — Shared screens never acquire adult administration

- Date: 2026-10-10
- Status: locally verified; private release and physical-device verification remain separate
- Context: Family screens expose Calendar Sources and other management links, including empty
  setup states. A local reproduction returns 401 for display-only admin reads but 200 when the
  same request also carries an adult cookie: read admission and adult actor resolution choose
  different principals. A pending verified proof must also not finish as adult after pairing.
- Choice: Give display context one consistent negative-capability boundary whenever companion
  authority is accepted or issued. Deny adult paths for device-cookie/Bearer presence, including
  broken proofs; TV user-agent hints can only restrict, never grant authority. Return a safe
  `sharedScreen` flag to the common browser route boundary and remove all family-to-admin links.
  Keep Appearance and scoped family commands. Use a bounded short-lived HttpOnly browser nonce
  to bind ceremonies and cancel pending proofs when pairing completes; recheck at commit and
  response. Revoke only the switching browser's supplied adult session, not any other phone/key;
  also end retained legacy adult cookies when a private shared-screen request first presents them.
  Accepted exchanges always refresh identity despite modal cancellation, and notify other open
  documents in the same browser to clear private caches/streams and reload the family dashboard.
- Consequence: Direct URLs, restored paths, aliases, history and mixed cookies cannot turn a paired
  display into a controller. Personal phone/desktop flows retain existing passkey verification and
  capabilities. Width is not identity; an unpaired generic browser is still a possible controller
  only after verified adult sign-in. Permanent hardware attestation is not claimed. No APK, database
  migration, credential reset, network change, public exposure or new persistent service is added.

## D-098 — Bounded rail focus and an unframed ambient photo

- Date: 2026-10-09
- Status: implemented and privately deployed in `5fffd5e`; physical-device verification remains separate
- Context: Physical TV photographs show clipped side-menu focus edges and an unexpected outer
  outline in fullscreen photos. The old clock background spans almost the complete viewport.
- Choice: Use a stationary three-pixel inset outline on rail controls, with no outer shadow or
  scale that the scrolling container can clip. Keep other screens' focus treatment unchanged.
  Ambient mode reads time and date from the existing shared clock and presents one intrinsic-width
  clock/date/Back button inside the safe insets. Put keyboard/remote focus and Back dismissal on
  that visible control. The transparent full-image pointer target remains clickable but is hidden
  from assistive technology, outside Tab order and explicitly outline-free. Any remote key still
  exits and restores Start ambient focus; screen readers receive the clock/date as the control's
  description.
- Refinement (2026-10-10): On shorter TVs, reveal the active/focused destination by scrolling only
  the rail navigation region, leaving clock/footer/content stationary. Account for 4K CSS zoom and
  prioritise a focused row during resize. Up/Down follows the single TV-menu column's order through
  Games before Appearance, rather than jumping to a geometrically closer fixed footer past a clipped
  row. Other spatial navigation, modal isolation and unavailable-control rules remain unchanged.
- Consequence: Focus stays obvious without framing the whole photo. Native-ratio `contain` display,
  rotation, reduced motion and photo storage remain unchanged. No timer, provider, credential,
  API, household mutation, native APK or networking change is added.

## D-097 — Compact phone setup and owner-controlled lost-access recovery

- Date: 2026-10-09
- Status: verified and deployed; fresh physical phone sign-ins remain open after the owner-requested reset
- Context: Both adults had controller permissions, but only David had keys. Recovery on a second
  phone replaced his original key without creating Rachael's own identity. Optional recovery warnings,
  technical key labels and an inert final-key Remove control made ordinary setup confusing.
- Choice: Keep two compact named-adult rows and connected screens, with key/recovery details secondary.
  **Set up this phone** explicitly saves the chosen adult's key and signs this browser in as them,
  only after current adult authority and new user-verified registration succeed. Freeze the optional
  `signInOnThisDevice` intent in the ceremony; absent/false preserves legacy behavior. Revoke only
  the initiating helper session, preserve other sessions and permissions, and clear old client caches.
  Put recovery behind Advanced, without warning badges. Replace the blocked final-key Remove button
  with a visible reason. Never claim key counts are a physical-phone inventory.
- Operator exception: A local root/NAS-administrators-group tool with existing database access may
  create a checked online backup and issue a 128-bit, 15-minute, one-time code for an existing active
  adult. Store only its digest; write the raw code to a fresh private file, never a URL, stdout, log,
  repository or chat. The existing user-verified recovery flow remains mandatory. Issuing a code
  changes no key/session/permission; successful recovery replaces only that adult's old access.
  Record actual system/NAS-owner provenance, not a forged member session. No public operator route,
  broad token, new role, household reset, TV reset or networking change.
- Cleanup: Revoke only owner-confirmed obsolete screen IDs, retain the explicitly chosen active TV,
  preserve rows/history and audit atomically. Repeating the same cleanup is inert. Keep working
  adult access until independent successor phone sign-ins are physically verified. This supersedes
  D-096's manual helper sign-out step only for the new explicitly opted-in phone setup action.

## D-096 — Adult controllers are people; paired screens are separate connections

- Date: 2026-10-09
- Status: implemented locally; live cleanup and both physical phone sign-ins remain open
- Context: The household owner could not distinguish adult-phone access from TV pairing, and
  retained disconnected screens looked like current connections. Enrolling a passkey for another
  adult also left the helper's browser session active, without a clear verification step.
- Choice: Put adult-phone guidance first in Phones & screens (superseding D-091's screen-form-first
  ordering), show the current signed-in adult and each adult's existing controller permissions.
  Phones use that adult's own passkey, not a display code. Describe synced passkeys as sign-in keys,
  never as a count of physical phones. On Adult access, guide enrolment using the intended adult's
  own phone/password manager, then explicitly sign the helper out and test the intended adult's
  sign-in. Saving a key never silently changes the session or grants administrator permissions.
  Show only authorized screens in the main list, with paired/last-contact times; authorization is
  not online status. Retain revoked connections in collapsed disconnected history. A confirmed
  disconnection announces its result and restores focus to the connected-screen heading.
  Clear the accepted code and superseded completed action feedback so connected/disconnected
  success messages cannot contradict each other; do not discard unanswered command identities.
- Consequence: No new account, invitation credential, pairing/auth API, migration, public endpoint
  or networking change. Existing revocation/idempotency and final-passkey recovery guards remain.
  Never guess stale live connections from age alone or erase audit history. Live access cleanup
  requires exact target identification; enrolling/checking the two real phones requires their
  owners to complete passkey prompts. Local fictional-data tests are not physical-phone evidence.

## D-095 — Phone chrome respects wrapping, safe areas and the visible viewport

- Date: 2026-10-09
- Status: reviewed for release; physical iPhone acceptance remains open
- Context: The owner supplied an iPhone image with clipped date/card content and reported the
  bottom navigation conflicting with iOS controls. The date was nowrap, mobile text inflation was
  left automatic, and page padding did not include the bar's home-indicator inset.
- Choice: Keep authored text sizing at 100% without disabling zoom; wrap phone dates and event
  titles, allow heading reflow and keep the shell at its container width. Share one safe-area-aware
  navigation-height token with page padding. Use fixed `bottom: 0` with `top: auto`, giving the
  browser one vertical anchor. This 2026-10-10 refinement replaces the original competing
  `100dvh` top calculation after reported scrolling drift. While a companion-width editing control
  is focused, hide the bar only when an unzoomed
  visual viewport is more than 150 pixels shorter than the layout viewport. Restore it on resize
  or focus change; coalesce event delivery and keep only a boolean React state.
- Consequence: No household, authentication, storage, TV sizing or provider contract changes.
  Desktop mobile emulation and injected keyboard geometry establish only local rendering/state
  evidence; actual Safari toolbar, keyboard, picker and installed-web-app behaviour need physical
  iPhone acceptance. Publishing/deploying the server/web release remains a separate operation.
- References: [WebKit safe-area guidance](https://webkit.org/blog/7929/designing-websites-for-iphone-x/),
  [Visual viewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport).

## D-094 — Keep Hearth visible only while the TV activity is foregrounded

- Date: 2026-10-09
- Status: accepted at the owner's explicit request
- Context: The physical TCL entered Google Ambient Mode after its ten-minute idle timeout while
  Jellyfin continued playing music and Hearth was displayed. Hearth's window did not request screen
  retention. The owner chose to keep Hearth visible while it is open.
- Choice: Add `FLAG_KEEP_SCREEN_ON` in the TV activity's `onResume` and clear it in `onPause`.
  This narrows the earlier static-display policy to permit the owner's explicit foreground choice.
  Keep normal system idle settings and manual/Home Assistant standby available. No media-session
  inspection, background wake lock, web bridge message or provider permission is added.
- Consequence: Hearth prevents automatic Ambient Mode while resumed; leaving it releases that
  request. Browser/phone display policy is unchanged. Install over the existing signed package to
  retain pairing and preferences. Actual idle behaviour and foreground/background window state
  are separate from compilation evidence.
- Reference: [Android TV Ambient Mode](https://developer.android.com/training/tv/playback/ambient-mode).

## D-093 — The native TV shell owns TV sizing and a legible launcher wordmark

- Date: 2026-10-08
- Status: accepted
- Context: The physical TCL exposes a 1920×1080 Android surface at density two. The older deployed
  server's CSP-blocked inline startup left it at a 960×540 phone viewport after reloading. Its
  launcher artwork also had no useful wide intrinsic bounds and displayed a stretched square mark.
- Choice: Keep D-047's 1920×1080 logical canvas. Register a main-frame-only native document-start
  sizing script, limited to the exact paired origin, before loading any route. Compute scale from
  native metrics; watch parser insertion only until DOMContentLoaded, then disconnect. Feature-test
  AndroidX document-start support and use an origin-checked commit/finished fallback on older
  WebViews. Keep strict CSP, navigation restrictions, credentials and the three-message bridge
  unchanged. Give both launcher resources explicit bounds: a 16:9 full-background eucalyptus/
  cream Hearth banner and a matching square icon, both retaining the original fern to the left
  of the wordmark. Native layer lists compose the original transparent mark, tinted cream only
  in these launcher resources, with Nunito Sans vector lettering. Outline attribution is retained;
  no system font or borrowed app branding is used. Supply xhdpi 320×180 banner and 160×160 icon
  PNG renditions generated from those same native resources for bitmap-oriented launchers.
  The original mark and web branding remain unchanged.
- Companion Home Screen refinement (2026-10-12): declare a 180×180 opaque warm-cream PNG Apple
  touch icon composed deterministically from the original green fern. The web build generates it
  with the already-installed image tooling; the shared transparent mark and TV resources stay
  unchanged. This fixes the missing Home Screen icon declaration without adding a manifest,
  standalone-mode switch, service worker, new app identity or phone/session migration. Physical
  installed-icon refresh is separate evidence; never remove a working owner connection for artwork.
  Portability refinement: integer alpha blending fixes measured Mac/Linux rounding differences;
  verify exact decoded RGB pixels, PNG format, 180×180 dimensions and opacity rather than compressed
  byte identity. Preserve strict artwork checks without broad image tolerances; lossless re-encoding
  is harmless, while even a one-level pixel alteration must fail the regression check.
- Consequence: Cold loads, reloads and restored routes do not depend solely on the server startup
  script for TV identity/size. Phone/browser sizing is untouched. Install with the existing signing
  identity and `adb install -r`; do not uninstall or clear pairing/launcher preferences to refresh
  artwork. A launcher may need an ordinary restart to drop its image cache. Browser emulation and
  physical TCL evidence remain distinct; overnight standby and network loss are separate gates.
- References: [AndroidX document-start API](<https://developer.android.com/reference/androidx/webkit/WebViewCompat#addDocumentStartJavaScript(android.webkit.WebView,java.lang.String,java.util.Set%3Cjava.lang.String%3E)>),
  [Android TV icon/banner guidance](https://developer.android.com/design/ui/tv/guides/system/tv-app-icon-guidelines).

## D-092 — Family Games uses a household-supplied local archive

- Date: 2026-10-06
- Status: accepted; verified release `7cfd04d` and the private archive installed on 2026-10-08;
  physical TCL board/selection/Back checks passed, full commissioning remains open
- Context: The owner requested a Connections-like word-grouping game and supplied a Desktop
  archive with boards and answers. This expands the product with one calm family game, not a web
  browser, newspaper interface or media integration.
- Choice: Preserve the grouping rules in core and use original Hearth presentation. Load the
  supplied JSON lazily behind authenticated household reads, with descriptor/size/schema bounds
  and no external fetch. Keep data outside public source and images. Store replay-validated,
  household-isolated numeric progress on each device; importing a changed board changes its ID.
- Earlier naming refinement (superseded by D-131): At the owner's request, display Connections instead of Games
  in navigation, the page title, Modules and matching HA labels. Keep `games` routes, module/HA
  identifiers, focus IDs and saved progress unchanged; this does not introduce an external service.
- Progress refinement: At the owner's request, start at #1 and discard prior v1 Games progress on
  each browser loading this version. Keep a separate v2 completion index through replays and recent
  attempt eviction. The original earliest-uncompleted entry policy is superseded by D-117's
  last-played resume; browse ascending and retain earliest-uncompleted as a safe fallback.
  This does not clear other browser storage, credentials, the archive or household data.
- Consequences: The fixed snapshot does not update itself; supplied text substitutes for any
  special visual edition. Device progress is not shared or a household audit record. Source/data
  publication, live installation and physical-TV commissioning are not implied by local work.

## D-087 — Keyboard directions follow the rendered layout

- Date: 2026-09-20
- Status: implemented locally; physical remote verification pending
- Context: Fixed directional IDs followed list order even when Agenda rendered day columns, and
  missing IDs stranded otherwise interactive controls. Calendar entry also jumped to an event.
- Choice: The shared key handler measures visible, enabled, tabbable controls when an arrow is
  pressed, prefers candidates in the same row/column, then ranks forward candidates with a
  cross-axis penalty. Small focus-scale offsets do not change direction. Modal candidates
  stay inside the modal. Native editing and already-handled widget keys are left alone. Calendar
  entry defaults to the current view selector; Back retains focus memory. Focus scrolling is
  immediate so repeated remote input does not race smooth scrolling.
- Consequence: Responsive layouts determine directions without maintaining a parallel link graph.
  Existing directional attributes remain for now but do not override spatial movement. Tab remains
  native except for wrapping inside a modal, and selecting/opening an event still requires
  activation rather than focus alone.
- Menu-entry refinement (2026-10-30): At the owner's request, selecting a TV/phone/desktop-admin
  main-menu destination retains navigation focus instead of automatically selecting a page action.
  Tapped Safari links are focused explicitly; shell replacement restores the current navigation
  item. Loading and background updates must not steal that focus. Right from a rail explicitly
  enters the current page's meaningful control (Calendar's selected view, for example); subsequent
  arrows remain spatial. Direct entry, detail/dialog containment and Back restoration remain.
  Menu navigation resets content scroll to the top; query-only changes and Back do not.

## D-086 — Private calendar screens serve saved projections before provider refresh

- Date: 2026-09-19
- Status: implemented locally; live deployment and provider-connection diagnosis pending
- Context: Today, Week and Month awaited CalDAV requests before returning even when SQLite held
  usable events. Provider timeouts therefore delayed unrelated household content.
- Choice: Private production reads return the saved calendar projection immediately. A serialized,
  bounded background queue refreshes requested windows, coalesces repeated reads and publishes the
  existing calendar invalidation event after completion. Successful windows have a five-minute
  refresh interval; failures have a one-minute retry backoff. Configuration changes invalidate
  obsolete in-flight writes. Demo fixtures retain their deterministic synchronous path.
- Consequence: Calendar outages no longer block those responses on calendar I/O. Cached events
  retain honest freshness; a first-ever uncached range may initially contain no events until sync
  completes. Weather and other integration waits are separate work. No schema, credential or
  calendar-write permission changes are introduced.

## D-001 — Coexist with a root bargain finder

- Date: 2026-08-03
- Status: superseded on 2026-08-03
- Original choice: Reserve `hearth/` for the product so a Python bargain finder could remain at the repository root.
- Superseding context: The owner intentionally removed the bargain finder and confirmed this is a Hearth-only workspace. Hearth code remains under `hearth/` as the stable monorepo boundary, while the root retains authoritative project documents.
- Consequence: No bargain-finder Python regression gate applies to Hearth development.

## D-002 — Skylight-inspired outcomes, original product

- Date: 2026-08-03
- Status: accepted
- Choice: Match the useful family outcomes publicly associated with Skylight Calendar—calendar aggregation, chores/routines, rewards, meal planning, lists and photos—without copying branding, text, artwork or pixel-level UI.
- Consequence: Reference research informs scope; Hearth uses its own information architecture and visual system.

## D-003 — Television-first and touch-optional

- Date: 2026-08-03
- Status: accepted
- Choice: Target a landscape Google TV operated by D-pad remote, voice and iPhone. Touch is optional.
- Consequence: Every required workflow must work with six-key remote navigation; phone companion handles dense editing.

## D-004 — Native TV shell with shared web product UI

- Date: 2026-08-03
- Status: accepted
- Choice: Use a minimal Kotlin Android TV shell containing a controlled Hearth WebView and native bridge rather than a browser bookmark or duplicating the complete interface in Kotlin.
- Consequence: Hearth behaves as a native TV app while the family interface and phone companion share React/domain work. The bridge must remain narrow and secure.

## D-005 — Clear system ownership

- Date: 2026-08-03
- Status: superseded in part by D-019 on 2026-08-03
- Original choice: Synology hosts Hearth/Jellyfin/media; Pi 5 hosts Home Assistant OS, Music Assistant and voice; Google TV runs the visual apps.
- Retained consequence: The Pi is headless and outside the HDMI path. No new general server/streamer is required.

## D-006 — Domain ownership boundaries

- Date: 2026-08-03
- Status: superseded in part by D-019 on 2026-08-03
- Original choice: Hearth owns household organisation; calendar providers own calendar truth; Home Assistant owns devices/automations/voice; Jellyfin owns video; Music Assistant owns music playback.
- Retained consequence: Hearth owns household organisation, calendar providers own calendar truth and Home Assistant owns devices/automations/voice. Hearth does not reimplement adjacent systems.

## D-007 — SQLite-first deployment

- Date: 2026-08-03
- Status: accepted
- Choice: Use migrated SQLite in WAL mode on a Synology-local persistent volume for the initial single-household service.
- Consequence: Operations remain simple. A move to Postgres needs evidence and another decision.

## D-008 — Layouts are source code

- Date: 2026-08-03
- Status: accepted
- Choice: Do not recreate the prior visual layout-development system.
- Consequence: Product layouts are composed/tested in React. Configuration controls household content and permitted modules, not arbitrary grid geometry.

## D-009 — Local deterministic voice before LLM

- Date: 2026-08-03
- Status: accepted
- Choice: Ship core commands through Home Assistant Assist, Speech-to-Phrase/Piper and typed scripts before adding an LLM.
- Consequence: The initial product is fast, local and auditable. Any later model calls the same allowlisted action layer.

## D-010 — LAN/Tailscale-first security posture

- Date: 2026-08-03
- Status: accepted
- Choice: Keep Hearth private to the home network and Tailscale initially.
- Consequence: Public access, public OAuth callbacks or multi-tenant operation require a separate threat/security review.

## D-011 — No soundbar required at launch

- Date: 2026-08-03
- Status: accepted
- Choice: Evaluate the selected TV's built-in audio before purchasing a speaker. Sonos Beam Gen 2 is the preferred clean upgrade if needed.
- Consequence: Hearth software does not depend on Sonos or any media-player adapter. Audio remains a television/native-app concern.

## D-012 — iCloud through the CalDAV adapter is the first household provider

- Date: 2026-08-03
- Status: accepted
- Context: Read-only local account metadata identifies an active iCloud calendar store with household-labelled calendars. No event content or credential was inspected. A server-side standards adapter can support that source without coupling Hearth's domain model to Apple payloads.
- Choice: Implement the first real provider as a read-only RFC 4791 CalDAV adapter suitable for iCloud. The adapter is inert in demo mode and in private mode until an external server-only secret config explicitly names an HTTPS endpoint and an exact calendar allowlist. The allowlist has no broad default.
- Consequence: The provider choice no longer blocks Phase 3 implementation. Creating an app-specific credential, approving exact calendar names and performing a live read remain an owner-controlled setup/validation action; none is stored or performed in the workspace. Calendar writes remain absent until separately approved.

## D-013 — Node baseline and Phase 1 runtime boundary

- Date: 2026-08-03
- Status: accepted
- Choice: Require Node `>=22.12 <26` for the development workspace, use typed Fastify/Zod contracts with an injected in-memory Phase 1 repository, and smoke-test the forward-only SQLite schema separately.
- Consequence: Vite 8 and Fastify 5 run on the installed Node 25.9 toolchain; real persistence is deferred to Phase 2. A supported LTS Node container image must be selected and pinned before Synology deployment.

## D-014 — Named adult passkeys and one-time television pairing

- Date: 2026-08-03
- Status: accepted
- Choice: Companion administration uses named adult accounts with passkeys on a stable private HTTPS origin. A carefully controlled local recovery code may recover an adult account; Hearth never uses a shared admin token in a URL. Televisions request a short-lived code that an authenticated adult approves, producing an independently revocable, narrowly scoped device credential.
- Demo boundary: The isolated demo resolves Maya as an adult administrator through a demo-only server actor header so role and capability checks can be tested before a secure origin exists. Demo identity is disabled outside demo mode and is not production authentication.
- Consequence: The remaining deployment input is the private Synology/Tailscale hostname and HTTPS certificate path, not the authentication model. In private mode the bootstrap runtime withholds household identity until a valid companion session or paired-TV credential is presented, and every household read requires `household.view` or `household.read` respectively. Passkey option ceremonies are rate-limited, capped and pruned; fixed-width pairing codes do not exhaust after 99 retained requests. Children and guests remain server-side forbidden from configuration, and revoking one television does not affect adult companion sessions or other devices.

## D-015 — SQLite chore runtime and Server-Sent Events invalidation

- Date: 2026-08-03
- Status: accepted
- Choice: Implement the Phase 2 chore repository on the same migrated WAL-mode SQLite database as household setup. Generate daily/weekly occurrence snapshots lazily and idempotently by local date; commit commands, audit records and receipts in one transaction. Use same-origin Server-Sent Events for one-way household invalidation.
- Consequence: Chore state survives restart, template edits do not rewrite history, command retries replay safely, and open screens refresh without polling. The server retains an in-memory repository only for isolated tests. SSE carries identifiers and invalidation events rather than household payloads; clients refetch through the authenticated JSON API.

## D-016 — Provider-neutral durable calendar projection

- Date: 2026-08-03
- Status: accepted
- Choice: Normalize adapter events into a read-optimized SQLite projection with opaque Hearth IDs, source/owner identity, instants, inclusive household-local dates, recurrence master/exception metadata and deletion tombstones. Persist one opaque cursor and bounded sync window per connection; use cached rows whenever sync is stale or unavailable.
- Consequence: Today and Week do not depend on provider payloads or connectivity. Full bounded sync reconciles its requested window and incremental sync applies upserts/deletions. Raw provider errors and credentials never enter browser contracts. Calendar writes remain absent until the provider and explicit write scope are approved.

## D-017 — One audited planning command path and append-only rewards

- Date: 2026-08-03
- Status: reward portion superseded by D-027; shared command-path portion remains accepted
- Choice: Persist lists, saved meals, meal plans and reward definitions/ledger on the existing migrated SQLite household database. Send TV, companion and future voice operations through the same typed command services, actor/source checks, idempotency receipts and audit path. Resolve voice list names before mutation and refuse ambiguous targets; reject active normalized duplicates. Derive star balances from an append-only signed ledger, with corrections represented as uniquely linked reversal entries.
- Consequence: A retry cannot silently add a second list item or reward entry, a voice command cannot guess between lists, and reward history remains reconcilable after chore awards, undo, adjustments and reversals. Dense recurring-chore, meal and reward editing remains phone-first while TV list completion uses the same contract.

## D-018 — Bounded read-only CalDAV reconciliation before sync-token optimisation

- Date: 2026-08-03
- Status: accepted
- Choice: The first CalDAV adapter performs an RFC 4791 time-range query for only the requested household dates, asks the server to expand recurrence in that range and returns a complete bounded snapshot. Hearth reconciles the snapshot transactionally, hides removed sources and tombstones absent events before exposing the new cache. The adapter uses Basic authentication only over HTTPS and exposes no create, update or delete operation.
- Consequence: The real adapter satisfies the existing `CalendarProvider` bounded-sync contract with straightforward recovery semantics and no provider writes. RFC 6578 collection sync tokens remain a later performance optimisation after live iCloud profiling demonstrates a need; adding them will not change browser contracts or cache ownership.

## D-019 — Native Google TV media stays outside Hearth

- Date: 2026-08-03
- Status: accepted; external voice-music path clarified by D-022 on 2026-08-04
- Context: The owner clarified that the native Jellyfin app on Google TV should connect directly to the existing Jellyfin server on the Synology for music as well as movies and television. Earlier specifications had incorrectly expanded Hearth into a Jellyfin launcher and Music Assistant controller.
- Choice: Hearth has no Jellyfin or Music Assistant adapter, credential, connection card, library projection, playback surface or app-launch command. Manual media browsing is opened through normal Google TV navigation; D-022 separately permits Home Assistant/Music Assistant voice playback outside Hearth. Home Assistant may expose to Hearth only a generic protected-media-active signal for presence-aware power safety.
- Consequence: The `IntegrationState` public contract contains only Calendar and Home Assistant, Phase 5 contains Home Assistant and voice work rather than media work, and the Android TV shell needs no native-media launch bridge. Adding any Hearth media integration later requires explicit owner approval and a new decision.

## D-020 — Home Assistant owns voice; Hearth exposes typed Assist commands

- Date: 2026-08-03
- Status: accepted
- Context: “Local voice” was ambiguous enough to suggest that Hearth might own a microphone, wake word or speech runtime. The owner clarified that these belong to Home Assistant.
- Choice: Home Assistant Voice Preview Edition/iPhone, Assist, Speech-to-Phrase or Whisper, openWakeWord and Piper own voice capture, recognition, intent and speech. Hearth exposes authenticated, idempotent `/assist` JSON commands and returns deterministic family-readable result text. Hearth's Home screen can call only three fixed server-side Home Assistant script mappings: Evening, Goodnight and Screen Off.
- Consequence: Hearth ships no microphone/listening control, wake-word engine, speech recognizer or text-to-speech service. Home Assistant credentials and raw entity/service names remain server-side, protected native playback is represented only by a boolean power guard, and future LLM work can use only the same typed commands.

## D-021 — Exact-origin Android TV shell and television-held pairing secret

- Date: 2026-08-04
- Status: accepted
- Context: Phase 6 needed a real Google TV launcher and recoverable WebView
  without expanding Hearth into a general Android launcher or exposing a
  server-issued credential to React. Android's legacy JavaScript interface is a
  broader native attack surface, and deprecated encrypted-preference helpers do
  not provide the desired explicit key boundary.
- Choice: Build `app.hearth.tv` as a minimal Kotlin shell using Android Gradle
  Plugin 9.3.0, Gradle 9.5.0, API 36, AndroidX Activity 1.13.0 and WebKit 1.16.0.
  Production accepts one exact HTTPS origin; debug HTTP is limited to
  emulator/loopback hosts. Use an origin-allowlisted WebMessage listener for
  only app identity, network status and exit request. The TV generates a
  256-bit pairing secret, the server persists only its hash, and Android stores
  it with AES-256-GCM under a non-exportable Keystore key before native code
  installs an `HttpOnly`, `SameSite=Strict` WebView cookie. The native shell
  preserves the product's 1920-pixel logical TV canvas across Android display
  densities by combining an Android density-derived initial scale with an
  equivalent TV-only viewport declaration before React renders; cleartext debug command IDs use the cryptographic random-values
  fallback because UUID generation is secure-context-only.
- Consequence: Browser JavaScript and API responses never contain the raw device
  credential, revoking one television fails its next native session check, and
  the bridge cannot launch Jellyfin, invoke Home Assistant, evaluate arbitrary
  JavaScript or access files. Release signing remains external to the
  repository. Android unit/lint/APK gates are automated and the API 36 emulator
  lifecycle evidence is retained; the selected-TCL lifecycle run remains
  required before Phase 6 completion.

## D-022 — Voice-requested music is orchestrated outside Hearth

- Date: 2026-08-04
- Status: accepted
- Context: The household wants a local voice request such as “play Dreams by
  Fleetwood Mac” to start the correct music on the television. Opening the
  native Jellyfin app is easy at an app level, but reliably searching and
  selecting an arbitrary song through its Android UI would require brittle
  keypress/ADB automation. Music Assistant can instead search Jellyfin as a
  music source and stream the result directly to the television's Google Cast
  receiver.
- Choice: Install Music Assistant as a separate Home Assistant OS app when the
  owner approves live Pi changes. Connect it through the official Home
  Assistant integration, use a dedicated Jellyfin account as the music source,
  and prefer its native Google Cast player provider for the TCL. Explicitly
  enable the selected television/video Cast player because Music Assistant
  disables that player class by default. Treat the Jellyfin source as a tested
  first choice rather than a guaranteed dependency; its documented best-effort
  maintenance makes a separately approved read-only Synology music share the
  fallback if household reliability testing fails. Map the living-room Voice
  Preview Edition/area to a logical `Hearth TV` player so an omitted destination
  resolves there. Configure Music Assistant's community voice-support
  blueprints/custom intents because arbitrary voice-started music is not
  currently a built-in Home Assistant core intent. Keep this entire source,
  queue, target and intent path outside Hearth.
- Consequence: A successful voice request normally opens the Cast receiver and
  shows available track metadata rather than navigating the Jellyfin app.
  Hearth receives no library, query, queue, player or app state; it sees only a
  generic protected-media boolean that must include Cast playback. The native
  Jellyfin app remains available for ordinary browsing, and Home Assistant's
  Android TV Remote integration remains responsible for general television
  power/app control. Pi backup, installation, Jellyfin credential creation,
  entity mapping and physical-TV validation require separate live-system
  approval and evidence.

## D-023 — Month uses colour marks plus one identity key

- Date: 2026-08-04
- Status: superseded by D-024
- Context: The owner requested a Month calendar beneath Week and preferred not
  to repeat small faces in every event mark. A conventional event-card month
  would be unreadable at television distance, while colour alone would violate
  Hearth's accessible identity-cue rule.
- Choice: Render Month as a Monday-first six-week grid. Date cells contain only
  compact source-colour marks; a persistent Calendar key pairs each colour with
  its member avatar or the Family household mark and a text label. The API
  returns one typed 42-day projection, and the phone uses the same grid through
  a Week/Month switch.
- Consequence: Month remains glanceable and fits one television viewport without
  duplicating faces in every cell. Assistive date labels name the underlying
  events, and the provider-neutral calendar projection remains the sole data
  source. No new credential, calendar write or persistence migration is needed.

## D-024 — Month names events without repeating member faces

- Date: 2026-08-05
- Status: amended by D-101 for preview count and explicit full-day opening
- Context: Rendered household review showed that colour-only marks answer whose
  calendar an event belongs to but not what the family needs to remember. Full
  miniature event cards or repeated faces would make the six-week television
  grid noisy, while a seven-column phone grid cannot carry sofa-sized titles.
- Choice: Keep the persistent avatar/colour Calendar key, but show compact
  colour-coded event titles inside television date cells. Bound each cell to two
  title rows at the main TV size and one at compact TV sizes, followed by an
  accurate `+N more` summary. Keep every title in the date button's accessible
  name. On phone, retain the familiar grid and expose all titles and times in a
  focused/selected-date agenda directly beneath it.
- Consequence: Month now answers both who and what at a glance without faces in
  every cell or unbounded cell growth. Dense days remain honest about hidden
  events, D-pad geometry and Back behaviour are unchanged, and the existing
  42-day provider-neutral response remains sufficient. No credential, calendar
  write, API-contract or persistence change is introduced.

## D-025 — One dedicated Synology folder is Hearth's photo source

- Date: 2026-08-05
- Status: superseded in part by D-052
- Context: Hearth needs a private, predictable photo source that the Synology can expose to the
  server without granting access to the household's wider photo library.
- Choice: Keep one explicitly approved Synology folder as Hearth's production source. Hearth
  indexes through a server-only adapter, stores opaque asset records and exposes only same-origin
  display/thumbnail derivatives. Demo mode uses five original fictional assets through the same
  public contract; private mode fails safe as unconfigured.
- Consequence: Local ownership remains on the Synology and the browser never receives an original
  file or filesystem path. The current ambient slideshow is local and exits on any remote key;
  Home Assistant presence/quiet-hours coordination remains a separate Phase 7 task.

## D-026 — Appearance is per display; evening dimming is independent

- Date: 2026-08-05
- Status: accepted
- Context: The owner requested a Hearth-wide dark mode after reviewing the light television and
  photo surfaces. A household-wide setting would make a phone unexpectedly restyle the television,
  while coupling visual comfort to Home Assistant's Evening action would confuse interface
  appearance with a physical-home scene.
- Choice: Store only `light`, `dark` or `automatic` plus an evening-dimming boolean in versioned
  local browser/WebView storage on each display. Automatic follows `prefers-color-scheme`; a small
  pre-render bootstrap applies the resolved theme before React starts. Dark uses a warm charcoal
  token set, leaves layouts and family identity cues intact and is available without administrator
  authentication through companion More and a TV-rail utility. The control changes only local
  browser/WebView storage and cannot mutate household data. Evening dimming is a separate rendered overlay that also covers
  photos and ambient mode; it does not call Home Assistant or claim panel-brightness control.
- Refinement (2026-10-10): Render Appearance inside the same responsive family shell as the
  dashboard. The former unconditional 680-pixel companion shell puts phone chrome on television.
  Wide screens retain the rail/clock and use three large theme cards; narrow screens retain
  stacked controls and their bottom dock. Theme changes update Appearance card backgrounds
  immediately with their text, avoiding transient contrast failures during a background fade.
  This is local presentation only, not a change to the
  display/adult authority boundary or stored preference contract.
- Consequence: Each television and companion can choose what suits its room, no server contract,
  credential, migration or household audit event is required, and a corrupted/unavailable storage
  value fails safely to Automatic. A future paired-device policy could remotely recommend a theme,
  but must not silently replace this explicit local choice.

## D-027 — Proportional pocket money replaces star rewards

- Date: 2026-08-06
- Status: amended by D-035 and D-065
- Context: The owner does not want an abstract star economy or reward catalogue. Each child instead has a real weekly pocket-money amount, and parents need an honest running figure and a record of what to pay.
- Choice: Require an adult-configured weekly amount in Australian cents and payday for every participating child. D-065 supersedes the original as-of-date denominator. Apply the resulting percentage directly to the weekly amount and round once to the nearest cent. Keep skipped chores in the denominator. Let an adult record one idempotent payment snapshot per child/week containing counts, percentage and amount. Remove star values from chore contracts and administration, remove reward routes/screens and stop chore completion/undo from writing reward-ledger entries.
- Consequence: Chores can show a child-friendly weekly percentage and amount due while phone administration owns weekly settings and payment recording. A later chore/template change cannot rewrite an existing payment. Migration `0009_pocket_money.sql` is forward-only; the migration-0005 reward tables remain dormant so existing databases are not destructively rewritten, but no active API or UI reads or writes them. D-017 remains authoritative for the shared typed/idempotent/audited command path and is superseded only for its reward-ledger choice.

## D-028 — Member profile photos are bounded local derivatives

- Date: 2026-08-08
- Status: accepted
- Context: Member avatars are identity cues across calendars, chores and pocket money. People had no
  way to change them, while the Synology family-photo gallery has different approval, orientation
  and ambient-display responsibilities. Sending an arbitrary original image to every client or
  storing filesystem paths would weaken local privacy and make television rendering unpredictable.
- Choice: Let adult administrators choose a browser-decodable portrait or landscape image in the
  companion People screen and position a square crop through direct drag and pinch/scroll zoom,
  with arrow-key, plus/minus and reset fallbacks rather than three visible range sliders. Normalize
  it client-side to a 512×512 JPEG, reject payloads over 1 MB or without valid JPEG framing, and
  store one derivative per member in SQLite. Preserve the member's prior opaque avatar key for
  restore. Serve the derivative through a versioned same-origin URL. Update and reset are typed,
  idempotent and audited; image bytes are excluded from receipts, responses and logs.
- Consequence: Member identity photos are editable, restart/backup safe and consistently shaped
  without retaining the selected original or coupling People to the Synology photo adapter. SQLite
  backups now include these small derivatives. Any future phone photo picker may feed the same crop
  contract without changing the stored derivative boundary.

## D-029 — Calendar setup writes an external secret, not browser or database credentials

- Date: 2026-08-08
- Status: accepted
- Context: The read-only CalDAV projection was complete, but connecting it
  required manually authoring a server JSON file. The Connections screen only
  described that process, so an adult could not add the calendar account from
  Hearth. Calendar setup also needed one clear authenticated account path that
  preserves exact server-side calendar allowlisting.
- Choice: Add an adult-only companion workflow for an HTTPS CalDAV server,
  account and app-specific password. Test/discovery occurs on the server and
  returns only opaque option IDs plus calendar names/colours. Keep the pending
  secret in memory for ten minutes, require exact calendar selection and
  optional person mapping, then atomically write the established external
  version-1 config file with mode `0600`. Persist only masked setup metadata in
  SQLite. Use a stable managed read-only provider so saving/removal can activate
  or disconnect it without restarting. Demo mode uses a fake verifier and never
  performs network access.
- Consequence: Calendar setup is usable and auditable without making a browser,
  SQLite backup or log a credential store. `HEARTH_CALENDAR_CONFIG_PATH` remains
  mandatory for a private save, and the supported connection is an authenticated
  CalDAV account. Live iCloud validation still requires the owner's app-specific
  credential and explicit approval, and calendar writes remain absent.

## D-030 — Runtime household and dates come from one server bootstrap

- Date: 2026-08-09
- Status: accepted
- Context: The polished browser still embedded the fictional household ID and
  Monday 3 August 2026 in API paths, query keys, focus targets and planning
  defaults. SQLite repositories also seeded demo records when started for a
  private household, which made the demo look complete while preventing an
  honest first-use state.
- Choice: Expose one browser-safe `GET /api/v1/runtime` contract containing the
  explicit `demo`, `test` or `private` mode, nullable configured household,
  household timezone/locale and server-derived local date, Monday week start
  and current month. Inject the clock and household selection at server
  composition. Demo and automated test modes use the fixed Perth instant;
  private mode uses the system clock and never seeds fictional household,
  member, planning, chore or pocket-money rows. The browser must load this
  dependency before household queries and derive query keys, routes, screen
  dates and focus entry from returned data.
- Consequence: Private startup is an explicit first-use state rather than Ezra
  and Maya, household renames/timezone changes update the runtime contract, and
  date boundaries are consistent on TV and phone. D-032 now implements the initial adult creation
  action behind the stable private HTTPS/passkey boundary; an unconfigured private database still
  shows an honest setup-required surface and accepts no demo bootstrap command.

## D-031 — Synology uses a hardened two-container same-origin deployment

- Date: 2026-08-09
- Status: accepted
- Context: Hearth needs a reproducible DS920+ deployment without mixing build tooling into the
  runtime, exposing Fastify directly, or choosing a permanent WebAuthn origin before the household
  approves its private hostname and certificate. A packaged SQLite ARM binary also proved that
  third-party native prebuilds can require a newer glibc than the pinned runtime.
- Choice: Build separate `server` and `web` images from one multi-stage Dockerfile. Pin Node
  24.18.0 Bookworm and nginx 1.30.4 Alpine bases, compile the SQLite binding inside the exact target
  Linux build, copy migrations into the production server, and gate the web service on database
  readiness. Run both services non-root with read-only roots, all capabilities dropped,
  `no-new-privileges`, bounded logs and private data/secret mounts. Bind nginx only to Synology
  loopback, proxy `/api` on the same origin and reserve DSM Reverse Proxy for the stable private HTTPS
  boundary.
- Consequence: Native ARM64 and emulated DS920+ `linux/amd64` builds and private first-use smoke
  tests pass locally without touching the NAS. The Synology service account/folders, stable private
  hostname, trusted certificate, adult passkeys, backup/restore drill and live commissioning still
  require explicit approval. No real household or provider data may be entered before those controls
  are complete.

## D-032 — Private first use establishes a named adult passkey session

- Date: 2026-08-09
- Status: accepted
- Context: Private mode could prove that no fictional household was seeded, but it had no secure
  way to create the real household or authenticate phone administration. A temporary hostname,
  shared admin URL token or browser-stored bearer credential would undermine the stable private
  WebAuthn boundary selected in D-014.
- Choice: Require `HEARTH_AUTH_RP_ID`, its exact `HEARTH_AUTH_ORIGIN` and an external
  `HEARTH_FIRST_USE_CODE_PATH` together. Rate limit and constant-time-check the one-time code before
  issuing a five-minute, single-use WebAuthn registration challenge. Require a discoverable,
  user-verified passkey. After verification, create the household, first adult administrator,
  Groceries/To-do lists, credential and audit record transactionally. Persist credential public-key
  material, counters, transports/device/backup state and only a SHA-256 digest of a random 30-day
  companion session. Deliver it as an `HttpOnly`, `Secure`, `SameSite=Strict` cookie; advance the
  passkey counter on authentication and revoke the session on sign-out. Keep television device
  credentials independent.
- Consequence: Private Admin no longer relies on demo actor headers and first use completes without a
  server restart, but real enrolment cannot happen until the permanent private HTTPS hostname and
  trusted certificate are approved. D-044 supplies the later second-adult/additional-passkey and
  locally confirmed recovery flow; real-device commissioning evidence remains required.

## D-033 — Calendar is one destination with three stable views

- Date: 2026-08-09
- Status: accepted
- Context: Week and Month occupied separate positions in the television rail,
  Agenda was only an incidental phone rendering of Week, and phone More jumped
  directly into administration. Calendar connection setup therefore existed
  but was hard to discover, while the primary menu gave two positions to one
  family outcome and hid ordinary family modules from the companion.
- Choice: Make Calendar one television rail/phone-tab destination and expose
  Week, Month and Agenda through one D-pad-safe view switch on both form factors.
  Use `/calendar/week`, `/calendar/month` and `/calendar/agenda` as stable paths;
  preserve old Week/Month links through query-preserving redirects. Add real
  earlier/current/later queries, household-timezone event formatting, a focused
  event-detail overlay with exact Back restoration and a direct Sources link.
  Put Home before the lower-frequency Photos destination. Make phone More a
  family-tools/setup hub, rename the admin root Hearth settings and keep pairing
  inside Televisions.
- Consequence: The primary navigation is shorter and outcome-led without
  removing any calendar view or saved link. Dense schedules have a genuine
  full-size Agenda surface, calendar setup is discoverable, and event/detail
  navigation is remote-safe. This changes browser routes and presentation only;
  provider contracts, credentials, read-only scope and database schema are
  unchanged.

## D-034 — Today supports bounded content choices, not layout editing

- Date: 2026-08-09
- Status: accepted
- Context: Dinner, list summary, notice and photo were always rendered, the
  seeded notice could not be changed, and hiding one item would otherwise tempt
  a general user-configurable grid that the product explicitly excludes.
- Choice: Add one phone-first **Today & notices** administration surface. Store
  four independent visibility booleans and durable concise notices with
  Standard/Important priority, start/expiry and archive state. Select the active
  notice on the server. Require authenticated administrator commands with Zod
  validation, request-id receipts, audit records and realtime invalidation.
  Keep plans and chores fixed and let code-defined summary variants rebalance
  the remaining content.
- Consequence: Families can remove irrelevant overview material and publish a
  useful notice without turning Hearth into a layout editor or moving priority
  logic into the browser. Private state survives restart; demo reset remains
  isolated. Rich acknowledgement/member targeting remains deferred until a
  real household need is demonstrated.

## D-035 — Pocket-money payments use immutable disbursements and reasoned voids

- Date: 2026-08-09
- Status: accepted
- Context: D-027 allowed only one payment snapshot per child/week. Real pocket money may be split
  between cash and transfer, paid in parts, or recorded against the wrong account. Parents also need
  to review earlier weeks without an erroneous record disappearing from history.
- Choice: Allow multiple positive, immutable payment disbursements for a child/week, each preserving
  chore counts, percentage, amount, actor, time and an optional parent note. Sum only non-voided
  rows and reject any command that would exceed the amount currently due. Correct a mistake with at
  most one separate adult-authenticated void containing a required reason; never edit or delete the
  original payment. Keep payment and void commands independently idempotent and audited. Permit
  recording before payday, but warn clearly. Drive command timestamps through the injected Hearth
  clock so demo evidence is deterministic and private mode uses real time. Remove the old reward
  schemas, repository methods and seeds from active source while retaining migration-0005 tables for
  forward-only upgrade safety.
- Consequence: Administration can show unpaid, partially paid and paid states, navigate weeks and
  retain an honest correction history after restart. Migration
  `0014_pocket_money_payment_history.sql` rebuilds the payment table without its old one-row-per-week
  constraint, adds optional notes and adds a one-to-one void table. D-027 still governs proportional
  calculation and supersedes stars, but its single-payment choice is replaced by this decision.

## D-036 — Synology photos use one read-only folder and opaque local derivatives

- Date: 2026-08-09
- Status: superseded in part by D-052
- Context: D-025 selected Synology as the family-photo authority but left the concrete private
  indexing and serving boundary open. The collage needs correct portrait/landscape geometry and
  slow automatic rotation without sending full originals, private NAS paths or a whole-library
  credential to the television.
- Choice: Mount exactly one adult-approved Synology folder read-only into the server. Ignore
  symlinks and bound discovery by depth, file count, size and decoded pixels. Store only a hash of
  each relative source identity plus a size/mtime fingerprint; use Sharp `autoOrient()` to create
  atomic, bounded WebP display and thumbnail derivatives in Hearth writable data. Serve them by
  opaque, immutable same-origin asset routes. Keep cached derivatives visible when the source is
  unavailable. Permit automatic interval rescans and an adult-companion-only, idempotent, audited
  manual scan that returns aggregate status—not a source path. Leave the adapter unconfigured when
  the environment path is absent; selecting and mounting the live folder still requires explicit
  approval.
- Consequence: The existing clever collage and ambient views can rotate real mixed-orientation
  family photos efficiently while Synology remains the original-file authority. Migration
  `0015_synology_photo_index.sql` adds incremental fingerprints and a status index. The initial
  adapter uses filesystem modification time for ordering/`capturedAt`; richer EXIF capture dates,
  hiding/favourite administration and any future phone import remain later, separately bounded
  work.

Implementation extension (2026-08-10): the existing favourite/hidden columns are now exposed only
through authenticated companion curation commands. Each favourite, unfavourite, hide or unhide is
validated, idempotent and audited. Scans preserve those flags; hidden assets are excluded from
Today/gallery/ambient projections but remain recoverable in adult administration through opaque
same-origin derivatives. No original, source path or delete operation crosses the boundary.

## D-037 — Meal administration is dinner-first and whole-week transactional

- Date: 2026-08-09
- Status: accepted
- Context: The television's two meal actions only displayed explanatory text and the phone edited
  one selected night at a time. Saved meals could be created but not searched, updated or retired,
  while exposing breakfast and lunch immediately would triple a form before the household had asked
  for those surfaces.
- Choice: Keep tonight and the seven-night dinner strip as the family television surface. Send its
  two management actions to one authenticated phone route where all seven dinner-name fields remain
  visible together and saved-meal/note details expand only when needed. Replace a displayed week's
  entries in one validated, transactional, receipt-idempotent command; add separately confirmed
  clear and copy commands. Treat saved meals as recoverable household records with search,
  favourite ordering, optional preparation minutes/notes and update/archive/restore commands.
  Retain breakfast and lunch as valid schema slots but defer their UI until household use justifies
  the added density. Keep recipes and ingredient-to-list generation deferred.
- Consequence: Planning several nights is materially faster on a phone, a retry cannot leave a
  partly updated week, and historical plans remain understandable after a saved meal is archived.
  Migration `0016_meal_planning_polish.sql` adds only bounded preparation metadata and an ordering
  index; the runtime repository still owns all command, receipt and audit transactions. Adding
  breakfast/lunch editing or grocery generation later requires demonstrated household need rather
  than a new integration boundary.

## D-038 — One-off chores and archived schedules share the occurrence model

- Date: 2026-08-09
- Status: accepted; today's unfinished-occurrence behaviour superseded by D-081
- Context: Phone administration could edit simple recurring templates but could not schedule an
  extra job or retire a schedule. Hard deletion would lose household history, while restoring an
  archived recurring template with its old active range could manufacture jobs inside the paused
  interval when an adult later browsed those dates.
- Choice: Represent a one-off job as a normal chore template with `FREQ=ONCE` and equal household-
  local start/end dates. Use the existing archive column rather than deletion. Require separate,
  authenticated, receipt-idempotent archive and restore commands with audit events. Restore starts a
  new active window on a validated local date; for a one-off it moves the sole due date to that day.
  Previously generated occurrences remain unchanged. Keep multi-assignee schedules, due windows,
  reasoned excuse/reassignment and a history screen as later bounded work.
- Consequence: One-off and recurring jobs use one completion/pocket-money contract, retrying a
  lifecycle command cannot duplicate state, and a paused interval does not silently acquire chores.
  The existing schema already stores recurrence, active ranges and archive state, so this choice
  needs no migration.

## D-039 — Adult chore exceptions are reasoned occurrence commands

- Date: 2026-08-10
- Status: accepted
- Context: Completion/undo and future schedule editing were durable, but an adult could not fairly
  handle a school camp, illness or job swap without changing a template or losing the reason. A
  generic status edit would make pocket-money results hard to explain and could duplicate changes
  during a network retry.
- Choice: Keep television completion/undo unchanged. Add an optional `HH:mm` due time to templates
  and snapshot due time plus optional description onto generated occurrences. Require an
  authenticated adult, bounded reason and idempotent request ID for Skip, Excuse and Reassign.
  Skip changes pending to skipped and leaves it in the pocket-money denominator. Excuse changes
  pending/skipped to excused and removes it. Reassign moves pending/skipped work to another active
  household member and resets it to pending. Store the reason and safe prior/new member summary in
  the existing immutable audit event, and expose an adult-only occurrence-detail/history query.
- Consequence: The phone can explain and preserve one-day decisions without rewriting schedules,
  retries cannot duplicate the mutation/history, and pocket-money calculations remain
  deterministic. Migration `0017_chore_occurrence_management.sql` backfills description/due-time
  snapshots and adds the history lookup index. Multi-assignee templates and due windows remain
  separate later work; this decision completes the reasoned exception/reassignment/history portion
  deferred by D-038.

## D-040 — Multi-assignee schedules create one occurrence per person

- Date: 2026-08-10
- Status: accepted
- Context: The product specification and initial data model allowed a chore template to name one or
  more people, and migration `0003_chore_runtime.sql` already stored a set of template assignees.
  The public contract, SQLite mapper and phone editor nevertheless exposed only one person. Treating
  several people as sharing one completion would also make responsibility and proportional pocket
  money ambiguous.
- Choice: Make `assigneeIds` a non-empty, duplicate-free command field and return a grouped
  `assignees` array. For every due template/date/instance, generate one occurrence per selected
  active member. Each copy has its own completion, exception, audit and pocket-money state. Keep
  previously generated occurrence snapshots intact when the future schedule changes. Normalize old
  singular `assigneeId` requests and stored `assignee` command results at the schema boundary so a
  forward upgrade can safely replay existing idempotency receipts.
- Consequence: Parents author one schedule for a shared household responsibility while each child
  receives a clear, independently completable job. The existing join-table and occurrence-uniqueness
  constraints implement the choice without a new migration. Due windows and routine ordering remain
  separate later work.

## D-041 — Chore windows and order are snapshotted onto occurrences

- Date: 2026-08-10
- Status: accepted
- Context: A single due time could not express “after school but before dinner”, and implicit query
  order gave adults no dependable way to shape a child's television routine. Reusing the template's
  live values at render time would also silently retime and rearrange historical days.
- Choice: Give a chore template optional household-local **Available from** and **Due by** values,
  rejecting a two-ended window unless start is earlier than due. Store an explicit household-local
  `sortOrder`. Phone administration exposes labelled earlier/later actions and sends the complete
  active template order in one authenticated, receipt-idempotent command. New schedules append and
  edits keep their position. Snapshot the two time boundaries and order onto every generated
  occurrence; the television renders compact window text and follows the occurrence order.
- Consequence: Parents can shape a calm, predictable routine without a drag-only editor, while
  completions and historical views remain stable after future edits. Migration
  `0018_chore_windows_and_order.sql` backfills deterministic template order and occurrence snapshots
  and adds the household/order index.

## D-042 — Home Assistant setup uses opaque discovery and an external secret

- Date: 2026-08-10
- Status: accepted
- Context: The curated Home and Assist contracts already enforced Hearth's narrow product boundary,
  but private deployment still needed a usable way for an adult to connect Home Assistant and map
  household-specific entities. Returning raw discovery IDs or storing a long-lived token in the
  browser/SQLite would unnecessarily widen the credential boundary, while a restart-only config
  file would make safe setup difficult on a phone.
- Choice: Use a two-step adult-only test/save workflow. Test the private root address and long-lived
  token through Home Assistant's supported REST API, retain the credential and raw discovery result
  for at most ten minutes in process, and return only opaque option IDs with friendly labels/kinds.
  Save exactly four state mappings (occupancy, television power, Hearth foreground and generic
  protected playback) plus three scripts (Evening, Goodnight and Screen off). Atomically write the
  root URL, token and raw entity IDs to an external mode-`0600` JSON file and activate a managed
  provider without restart. Store only hostname, instance/version, friendly labels, readiness and
  timestamps in SQLite. Permit runtime reads only for the four mapped state endpoints and commands
  only through `script.turn_on` for a server-mapped script. Keep demo discovery fictional; require a
  current approved Home Assistant backup before live commissioning.
- Consequence: Companion setup is usable and auditable without exposing secrets or creating a
  general Home Assistant dashboard. Migration `0019_home_assistant_connection_setup.sql` contains
  credential-free metadata only. Hearth still has no media-player, Jellyfin, Music Assistant, Cast,
  arbitrary entity/service, microphone or speech surface; D-019, D-020 and D-022 remain authoritative.

## D-043 — Recovery copies use SQLite online backup and fail-safe restore tooling

- Date: 2026-08-10
- Status: accepted
- Context: Copying an active WAL database is not a reliable household backup, while exposing a
  generic filesystem or restore action in the browser would make an operational safeguard
  unnecessarily dangerous. Adults also needed calm visibility of database and recovery state
  without turning Hearth into a developer console.
- Choice: In private mode, create scheduled and adult-requested recovery copies with SQLite's
  online backup API inside a mode-`0700` directory, verify `quick_check`, foreign keys and schema
  version, make each retained database mode `0600`, and prune to a bounded configured count. Keep
  commands adult-only, request-idempotent and audited. Expose only state, time, size, retention and
  application/migration version to the browser—never a host path or downloadable database. Restore
  is an operator-only CLI operation that accepts absolute paths, verifies the source, writes only
  to a new destination and refuses to overwrite an existing database. Secrets and original photos
  remain separate recovery domains.
- Consequence: Hearth can stay in use while a consistent local database recovery copy is made, and
  a clean-location restore can be mechanically proved before live deployment. Admin gains a calm
  System Health surface, but swapping a restored database, Synology Hyper Backup, Home Assistant
  recovery and the real NAS restore drill remain explicit operator/approval work rather than web
  buttons.

## D-044 — Adult access uses named passkeys and one-time local recovery

- Date: 2026-08-15
- Status: accepted
- Context: Private first use created one adult passkey, but a household pilot also needs a second
  adult, a spare credential and a safe lost-device path. A shared password, invitation URL or
  recoverable plaintext code would weaken the LAN/Tailscale-first boundary selected in D-014 and
  D-032.
- Choice: Let an authenticated administrator enrol multiple independently named passkeys against
  any active adult household member and revoke them separately. Block revocation of an adult's
  final credential until recovery exists. Creating or replacing recovery requires a fresh
  user-verified assertion from the current adult, generates 128 random bits, displays the grouped
  code once, stores only its SHA-256 digest and expires it after 180 days. Recovery is single-use:
  a valid code creates a replacement discoverable passkey, consumes the code and revokes that
  adult's earlier passkeys and sessions. Do not use URL tokens or browser storage.
- Consequence: A family can add the second adult and recover from a lost phone without a common
  admin secret. Migration `0020_adult_access_recovery.sql` links new sessions to credentials and
  adds one-active-per-adult recovery records. The flow is implemented and virtual-WebAuthn tested;
  real-device use remains gated on the approved stable private HTTPS hostname and commissioning
  evidence.

## D-045 — Pre-commission display testing uses an isolated fictional-data pilot

- Date: 2026-08-16
- Status: accepted
- Context: The family needs to test the rendered product on the Samsung M7 before the permanent
  private HTTPS hostname, passkeys, backups and provider credentials are commissioned. Reusing the
  private Compose service with temporary authentication values would weaken the WebAuthn boundary,
  while putting real household data into an unauthenticated HTTP test would be unsafe.
- Choice: Provide a separate `hearth-v2-demo` Compose project that binds only to an explicitly
  supplied Synology LAN address, mounts its own demo database directory and uses the deterministic
  fictional household. It mounts no secrets or photo source, accepts no live calendar or Home
  Assistant configuration and must not receive a public reverse proxy or router port-forward.
- Consequence: The M7 can begin browser, layout and remote testing immediately without pretending
  that private commissioning is complete. The demo database can never become the private household
  database accidentally; real family data still waits for stable HTTPS, real-device passkey and
  recovery checks, encrypted backup and restore evidence.

## D-046 — Non-Android television browsers use restricted short-code pairing

- Date: 2026-08-16
- Status: accepted
- Context: The commissioned Samsung M7 Tizen Browser exposes WebAuthn but rejects discoverable
  resident credentials and an empty `allowCredentials` list. It cannot install the Android TV
  shell, and signing the shared display in as an adult would unnecessarily grant Admin capability.
- Choice: Offer an explicit browser-television pairing path alongside adult passkey sign-in. The
  display creates a 256-bit secret with Web Crypto, retains it only in volatile component memory,
  requests a short-lived six-character code and exchanges the secret only after an authenticated
  adult approves that code in Admin → Televisions. The server stores only its existing hash and
  sets the raw value directly as a persistent `Secure`, `HttpOnly`, `SameSite=Strict` device cookie.
  Never place it in a URL, local/session storage, response body, audit row or log. Clearing browser
  site data requires re-pairing; revocation remains per display.
- Consequence: The M7 can display the real private dashboard without a recovery code, adult passkey
  session or LAN-cleartext port. Browser JavaScript briefly creates and submits the secret during
  pairing, so D-021's stronger native-only secret boundary remains authoritative for Android but
  does not describe this explicit Tizen fallback. The Android shell remains preferred where
  available because it adds Keystore storage, launcher integration and lifecycle recovery.

## D-047 — Television UI targets a crisp 1080p application surface; 4K remains media-specific

- Date: 2026-08-17
- Status: accepted
- Context: The Samsung M7 has a 3840×2160 panel, but Samsung specifies a 1920×1080 application
  surface for UHD television apps. Amazon likewise directs Fire TV and Fire TV web apps to target
  1920×1080 while separately supporting 4K hardware-decoded video. Trying to make the dashboard
  claim native 4K would add device-specific complexity without increasing the application surface
  exposed by either platform.
- Choice: Keep one sofa-readable 1920×1080 logical television canvas. On genuine 3840×2160 browser
  viewports, use browser layout zoom rather than a transformed completed application layer. Keep
  approved photo display derivatives at up to 3840×2160, request the full display asset for the
  feature and ambient views, and preload the next full display asset. Do not encode photos into a
  synthetic video merely to reach a platform's 4K video plane; a future native ambient player must
  justify that extra transcoding, lifecycle and device-specific surface with real viewing evidence.
- Consequence: Samsung Browser, the Android/Google TV shell and Fire TV candidates share the same
  predictable layout and D-pad contract. Native streaming apps can still use their independent 4K
  video paths, but Hearth does not confuse that media capability with dashboard resolution. Device
  acceptance now prioritises typography, focus, overscan, image quality and stability at the actual
  application surface rather than a misleading pixel-count badge.

Official platform references:

- <https://developer.samsung.com/smarttv/develop/guides/fundamentals/managing-screen-resolution.html>
- <https://developer.samsung.com/smarttv/develop/guides/multimedia/4k-8k-uhd-video.html>
- <https://developer.amazon.com/docs/fire-tv/design-and-user-experience-guidelines.html>
- <https://developer.amazon.com/docs/fire-tv/4k-tunnel-mode-playback.html>

## D-048 — Chore grouping uses five fixed time-of-day values

- Date: 2026-08-17
- Status: accepted
- Context: The routine editor exposed a free-text **Routine group** field. Different labels such as
  “School morning”, “Before school” and “Extra jobs” described overlapping concepts, made television
  grouping unpredictable and did not explain what adults should enter.
- Choice: Rename the adult-facing field **Time of day** and use a native selector containing exactly
  **Morning**, **After school**, **Evening**, **Bedtime** and **Anytime**. Retain `routineLabel` and
  `routine_label` as compatibility names inside the existing API/database shape, but constrain the
  shared command and read contracts to the five values. Migration `0021_routine_time_of_day.sql`
  maps existing morning, after-school/afternoon, bedtime and evening/dinner labels to their canonical
  values and maps any other historical label to Anytime.
- Consequence: Phone, keyboard and remote authoring share an accessible native control; chores can
  be grouped consistently without inventing a separate Routine entity. Existing routine schedules
  and occurrence history remain intact, with only their display grouping normalized.

## D-049 — Weather uses a narrow server-side Open-Meteo adapter

- Date: 2026-08-17
- Status: accepted; coordinate-configuration detail superseded by D-051
- Context: Today and Week already had a browser-safe forecast contract, but private mode returned
  no forecast because only deterministic demo data existed. Routing weather through Home Assistant
  would widen its deliberately small allowlist and make a useful read-only cue depend on the Pi.
- Choice: Use Open-Meteo from the Hearth server with approximate latitude/longitude supplied only
  through the private deployment environment. Request current conditions plus daily maximums and
  WMO condition codes, normalize them into the existing four display conditions, cache successful
  responses for 30 minutes, coalesce concurrent reads and retain the last safe response during
  outage. Expose only a bounded provider identity so the browser can render the required visible
  attribution link; never expose or persist coordinates. Leave weather unavailable when either
  coordinate is absent rather than guessing from an address or calendar.
- Consequence: Weather works without credentials, a browser-side request or Home Assistant entity,
  while calendar/household content remains independent during internet failure. D-051 replaces the
  deployment-only coordinate setup with a household setting. A future provider change remains behind the same injected
  adapter and public forecast schema.

## D-050 — Calendar presentation mappings are editable independently of credentials

- Date: 2026-08-20
- Status: accepted
- Context: Calendar ownership could be chosen only while first entering the CalDAV account. A later
  reassignment incorrectly implied reconnecting and re-entering an app-specific password, while
  provider colours did not consistently match Hearth people.
- Choice: Permanently present every connected source as calendar name, assigned person and display
  colour. Save the complete mapping through its own authenticated, idempotent and audited command.
  Rewrite only the existing external allowlist owner mappings and the safe SQLite projection; retain
  URL, username and app-specific password unchanged. Derive browser/event colour and avatar from the
  current Hearth member, or use the fixed Whole family mark/colour for a null owner.
- Consequence: Adults can fix or evolve ownership without reconnecting, and member colour/avatar
  edits flow through Calendar identity. The command never receives credential material and remains
  read-only with respect to provider events.

## D-051 — Weather location is a tested household setting

- Date: 2026-08-20
- Status: accepted
- Context: Environment-only coordinates made ordinary weather setup inaccessible and forced server
  administration for a household preference. Weather geography and calendar timezone are related
  but not interchangeable.
- Choice: Keep timezone separate. Add an adult-only weather location section with Open-Meteo
  suburb/postcode search, one-time browser geolocation, direct-user-action Nominatim reverse
  labelling, Advanced coordinates, and a required live current-conditions test. Persist the chosen
  label/coordinates/source in migration `0022_weather_location.sql`; reconfigure the managed
  Open-Meteo provider immediately. Retain environment coordinates only as fallback when no row exists.
- Consequence: Families can configure and verify weather from the companion without Home Assistant,
  an API key or container editing. Coordinates appear only in adult settings and local SQLite, never
  in Today/Week/TV contracts, logs or provider audit summaries.

## D-052 — Managed phone uploads are the primary family-photo path

- Date: 2026-08-20
- Status: accepted
- Context: Requiring adults to discover a special Synology shared folder, copy files into it and
  manually request a scan made a normal household action feel like server administration. The
  folder also failed to explain clearly whether Synology Photos or Apple Photos albums were linked.
  Hearth already has an authenticated phone companion and a private writable data mount.
- Choice: Make **Add photos from this phone** the primary adult flow. Accept one bounded supported
  image per raw authenticated command, verify its decoded format, normalize an orientation-correct
  managed master plus 4K display and thumbnail WebPs, deduplicate by content hash and store only
  opaque keys under the private Hearth data mount. The browser may multi-select and upload files
  sequentially with partial-success feedback. Keep the existing adult-approved `/photos-source`
  mount only as an optional read-only bulk importer; an import failure must not mark managed storage
  unavailable. Do not connect to Apple Photos, accept shared-album links or retain client filenames.
- Consequence: Adults can add real photos entirely through Hearth, while local ownership remains on
  the Synology. Migration `0023_managed_photo_uploads.sql` records path-free managed metadata and
  optional import state. SQLite online copies protect metadata but not image files, so encrypted
  Synology backup must include the complete Hearth data directory, including `/data/photo-uploads`
  and `/data/photo-derivatives`. D-025 and D-036 remain valid for the optional importer and opaque
  derivative rules, but no longer make that folder Hearth's primary authority or setup prerequisite.

## D-053 — Pocket-money rules are standing settings, separate from week review

- Date: 2026-08-20
- Status: accepted
- Context: The repository already stores one amount and payday per child, but placing those fields
  inside a selected week's progress card and offering previous/current/next navigation implied that
  adults had to configure pocket money again every week. Future-week navigation also exposed no
  useful progress or payment action.
- Choice: Present amount and payday in a dedicated **Weekly settings** section that explicitly
  repeats until changed. Keep those controls available while reviewing history and always save them
  as the child's current standing rule. Replace three directional week buttons with one labelled
  **Week to review** selector containing the current week and recent past weeks only. Keep progress,
  payments and immutable payment snapshots scoped to the selected week.
- Consequence: Pocket money becomes set-and-forget while parents can still inspect and correct past
  payment records. Future-week setup is unnecessary, and changing the review week cannot alter or
  hide the standing amount/payday controls. D-035 still governs immutable disbursements and voids;
  its week-navigation consequence is narrowed by this decision.

## D-054 — Calendar selection edits reuse the private server-side credential

- Date: 2026-08-20
- Status: accepted
- Context: After initial connection, adults could change presentation mappings but could not add or
  remove provider calendars without replacing the connection and re-entering the app-specific
  password. Calendar selection is an allowlist preference, not a credential change.
- Choice: Add a separate adult-only **Edit calendars** action. The server loads the existing
  credential from the external owner-only secret file, performs provider rediscovery and stages a
  bounded ten-minute pending result. The browser receives only opaque option IDs, names, colours,
  masked account metadata and a test ID. Saving reuses the authenticated idempotent connection-save
  command to replace the exact allowlist and safe SQLite projection. **Replace connection** remains
  solely for account, endpoint or password changes.
- Consequence: Adults can evolve the selected source set without handling credential material. A
  failed saved sign-in directs them to replacement, and no username, password or collection URL is
  added to browser storage, SQLite, logs, receipts or audits.

## D-055 — Daily Bible verse is an optional, attributed server integration

- Date: 2026-08-20
- Status: accepted
- Context: The earlier Hearth had an ESV daily-verse module, and the household wants that calm
  glanceable outcome without restoring the old layout system or exposing its API credential.
- Choice: Add one off-by-default **Daily Bible verse** Today preference. Select one passage from a
  fixed small rotation by household-local date, fetch it through ESV's server-side passage-text API,
  retain the provider's short copyright marker and show full attribution in a Back-safe dialog.
  Read the token only from `HEARTH_ESV_API_KEY_PATH`; cache the bounded passage text in SQLite for
  stale fallback. Demo mode uses original fictional copy and contacts no provider.
- Reading-view refinement (2026-10-30): Use Hearth's normal Source Sans typography in both Today
  and Morning Routine's shared verse dialog. Remove the long publisher/demo paragraphs and redundant
  eyebrow from that reading view; preserve the reference, exact quotation, short ESV marker/source
  link, real freshness warnings and Close/Back focus. Relocate the standard full notice to the
  read-only More → Credits page, following [ESV's published attribution guidance](https://api.esv.org/).
  This is a presentation change; provider calls, cache, secret handling and household authority stay unchanged.
- Consequence: The feature can be enabled per household without changing Today layout code or
  weakening secret boundaries. A missing key or ESV outage cannot take down Today. Migration
  `0024_daily_bible_verse.sql` adds only one visibility flag and the bounded cache; live token
  installation remains an owner-approved deployment action.

## D-056 — Synology pulls verified immutable images instead of compiling releases

- Date: 2026-08-21
- Status: accepted
- Context: The commissioned DS920+ has an Intel Celeron J4125 and approximately 4 GB of memory.
  Production updates were rebuilding the complete pnpm workspace and native `better-sqlite3`
  binding on that appliance even though GitHub Actions already built the same `linux/amd64`
  targets. This made routine updates slow and extended service downtime without adding assurance.
- Choice: Keep the multi-stage Dockerfile as the reproducible image definition, but publish the
  server and web targets to private GitHub Container Registry packages only after the complete
  web/server, Android and Synology-image verification jobs pass. Tag each package solely with the
  full immutable Git commit. Production Compose contains image references and no `build:` section;
  Synology authenticates once with a read-only `read:packages` credential, pulls both images while
  the existing containers remain available, then recreates the project and checks readiness. Keep
  `compose.build.yaml` as an explicit operator-only fallback for registry outages or recovery.
- Consequence: Native compilation and dependency installation happen on the GitHub-hosted amd64
  builder, not the NAS. Image publication is not live deployment: the workflow cannot reach the
  private Synology and receives no household credential. The NAS registry credential remains an
  access-restricted operational secret outside source, Compose and logs. Previous images are not
  automatically pruned, while database rollback remains restore-based when a migration is not
  backward compatible.

## D-057 — Agenda is a rolling today-plus-three-days surface

- Date: 2026-08-21
- Status: accepted
- Context: The dedicated Agenda was presenting the complete Monday–Sunday week even when today was
  late in that week. That made past dates prominent, duplicated Week navigation and pushed the most
  immediately useful plans below the first television viewport.
- Choice: Anchor Agenda to the configured household-local current date and render exactly today plus
  the next three calendar dates. Ignore legacy `start` query parameters on this route and remove its
  earlier/current/later controls. Week and Month remain the explicit surfaces for navigating beyond
  the immediate four-day horizon.
- Consequence: Agenda stays compact and useful across a week boundary without changing calendar
  provider contracts or stored data. The four columns fill a television row, phone keeps the same
  chronological groups, and event detail/Back focus behavior remains unchanged.

## D-058 — Today composition is derived from content and photo orientation

- Date: 2026-08-21
- Status: accepted; the fixed row-cap clause is superseded by D-063
- Context: A fixed lower row reserved excessive height for empty or short summary modules and placed
  portrait and landscape photos in the same geometry. Real household combinations therefore left
  dead space, pushed useful content below the television viewport and made Today behave like a web
  page that needed scrolling.
- Choice: Make television Today a deterministic single-viewport composition. Add normalized photo
  orientation and optional source dimensions to the browser-safe `TodaySummary` photo contract. Portrait photos occupy a substantial
  right-side rail spanning the dashboard; landscape and square photos use a shorter wide lower panel;
  no-photo layouts return the full width to one-to-four compact summary tiles. Upcoming and due
  chores share equal content columns, heading baselines and first-row rails. Portrait media starts
  on the same upper rail; landscape/square media starts on the same lower rail as the optional bands.
  Optional bands follow the actual core content rather than being pinned to the viewport bottom.
  Begin with a three-row event/chore cap and existing focus graph. D-063 later makes that cap
  composition-aware. Do not expose layout controls or carry the non-scrolling constraint into the
  phone companion.
- Consequence: Today responds to real enabled content without becoming a layout editor, keeps every
  module visible on supported television viewports and preserves undistorted photography. New photo
  producers must supply normalized orientation, while old private state needs no database migration
  because orientation is derived from stored image dimensions.

## D-059 — Photos collage geometry follows every visible asset's orientation

- Date: 2026-08-21
- Status: accepted
- Context: The Photos gallery selected a template from only the featured image and forced every
  support photo into the remaining rectangles. Real portrait photos were consequently displayed in
  landscape-shaped cells and lost important content to `cover` cropping, while portrait-heavy sets
  produced narrow strips merely to preserve a fixed five-photo count.
- Choice: Select and place visible occupants using each photo's stored pixel dimensions. Keep the
  selected image as a full-height anchor and search one to three support-column groupings for the
  composition closest to the television stage. Each image leaf retains its exact native ratio;
  negative page space is preferable to crop, stretch, a persistent frame, shadow or backing card.
  Phone portrait flattens the same occupants into orientation-aware spans, while phone landscape
  keeps three substantial occupants. Preserve automatic rotation, selection, ambient mode and
  geometry-derived D-pad links.
- Consequence: Portrait files remain legible without being cut into landscape frames, landscape
  files do not become ribbons and each supported television composition stays within one viewport.
  Up to five photos can remain visible even for portrait-heavy sets because the layout is derived
  from real ratios rather than a fixed set of portrait and landscape slots.

## D-060 — Today photo rotation is slow and display-local

- Date: 2026-08-21
- Status: accepted
- Context: A single Today photo could remain unchanged indefinitely even though the approved family
  collection contained other useful images. Reusing the gallery's 45-second cadence would make the
  household overview feel active and distracting, while a separate unexplained pause setting would
  make the two photo surfaces disagree on the same display.
- Choice: Advance Today after five minutes of visible screen time when at least two approved photos
  exist. Recompose Today from each next asset's normalized orientation. Share one in-memory
  Pause/Resume state with the Photos gallery for the current display session; do not persist it as
  household or device configuration. Stop the timer while the document is hidden and leave the
  preview static when reduced motion is requested. A reload begins a fresh automatic session.
- Consequence: Today gently circulates family photos without behaving like ambient mode. Pausing the
  gallery predictably freezes Today, hidden time cannot cause an immediate surprise change on return,
  and no database migration or browser contract is required.

## D-061 — Managed uploads and folder imports have different deletion authority

- Date: 2026-08-21
- Status: accepted
- Context: Adults need an efficient way to remove obsolete family photos. Treating the optional NAS
  folder as Hearth's only store would weaken the primary phone-upload path, while allowing Hearth to
  delete through a bulk-import mount would make source ownership and backup behaviour unsafe.
- Choice: Keep phone uploads as Hearth-managed assets and the optional Synology folder as a read-only
  secondary bulk source. Adult Photos administration identifies each source and supports bulk
  selection. Any asset may be hidden or restored, but only a managed upload may be permanently
  deleted by Hearth after explicit confirmation. Imported originals are removed in Synology and then
  reconciled with **Check folder**. Deletion uses the typed authenticated command, idempotent receipt
  and path-free audit contract.
- Consequence: Adults can curate large collections quickly without risking NAS originals. Managed
  deletion removes the private master and derivatives, while historical receipts and audits remain.
  Backups may retain an earlier copy according to their normal retention policy; the active library
  no longer serves the deleted asset.
- 2026-10-12 discoverability refinement: expose **Delete** directly on each deletable managed-upload
  card, including hidden uploads, and retain **Select photos → Delete selected (n)** for batches.
  The focused confirmation freezes the selected targets and defaults to **Keep photos**. Cancel
  performs no write; a failed/partially failed deletion leaves the affected photo available to retry.
  This is an adult-only UI refinement of the existing command, not new source-folder write access,
  a server/API/schema change or an administration path for shared screens.

## D-062 — Calendar refresh combines realtime invalidation with a five-minute safety cycle

- Date: 2026-08-22
- Status: accepted; supersedes only D-015's statement that open screens refresh without polling
- Context: SSE refreshes an open display promptly after Hearth-owned settings or household changes,
  but it cannot detect every provider-side iCloud change and a dropped realtime connection must not
  leave an appliance display stale indefinitely. Requiring a manual reload is not dependable.
- Choice: Today, Week and Month fetch immediately when mounted, every five minutes while visible and
  immediately after browser connectivity returns. Calendar connection saves, source-selection
  changes, owner remaps and removal invalidate all three projections immediately. Keep the existing
  `calendar.changed` SSE invalidation for cross-device responsiveness. Each server read attempts the
  bounded provider sync and falls back to the durable SQLite projection when iCloud is unavailable;
  the browser also retains its last successful query data during a failed background request.
- Consequence: Provider-side changes appear within five minutes without user action, Hearth-owned
  settings changes remain immediate, reconnect recovery is deterministic and a temporary iCloud
  outage does not blank the family calendar. The five-minute interval is a resilience backstop, not
  a general high-frequency polling architecture, and it pauses when the document is hidden.

## D-063 — Today row capacity follows the photo composition

- Date: 2026-08-24
- Status: accepted; supersedes only D-058's fixed three-row cap
- Context: Three rows leave useful vertical capacity unused beside portrait photography and when no
  photo is enabled. Raising every layout to five instead pushes landscape photography and optional
  modules beyond supported television viewports or makes the family image unacceptably small.
- Choice: Derive one shared Upcoming/Chores capacity from the active display and normalized photo
  orientation. Phones show three rows. A landscape-photo television shows four rows at full height
  and three on a compact 768-pixel display. Portrait and no-photo television compositions may show
  five; a square image shows five at full TV height and three on the compact display. Slice the typed data
  before rendering so exact overflow counts and D-pad links describe only controls that are visible.
- Consequence: Busy portrait/no-photo dashboards expose more useful work without scrolling, while
  landscape images remain substantial. Photo rotation can recompose the row count together with the
  image orientation, and every hidden item remains reachable through the existing overflow action.

## D-064 — iCloud Reminders requires standards capability evidence before product integration

- Date: 2026-08-24
- Status: accepted
- Context: [CalDAV](https://www.rfc-editor.org/rfc/rfc4791.html) defines `VTODO`, but Apple documents
  [upgraded iCloud Reminders](https://support.apple.com/en-ca/102457) separately and its
  [third-party iCloud access](https://support.apple.com/en-gb/121539) covers Mail, Calendar and
  Contacts rather than Reminders. Treating the existing iCloud app-specific credential as proof of
  Reminders access would risk promising an unsupported integration or probing private endpoints.
- Choice: Add one operator-only, read-only capability probe using the existing server-side CalDAV
  credential. Discover all collections, query only those that explicitly advertise `VTODO`, bound
  samples to at most ten items and omit credentials, URLs, UIDs, descriptions and raw DAV payloads
  from output. Add no browser route, persistence, polling or mutation. Stop when no task collection
  is advertised; do not scrape or guess Apple endpoints. Any later EventKit companion bridge or
  CalDAV reminders product surface needs separate approval and a new typed contract.
- Consequence: Hearth can establish whether the household account exposes standards-based tasks
  without weakening its calendar secret boundary or silently expanding product scope. A successful
  diagnostic is evidence for further design, not an automatic implementation commitment; an empty
  result closes the direct CalDAV path unless Apple publishes a supported change.
- Clarification (2026-08-25): WebDAV `DAV:href` values may be URI or relative references. Resolve
  them only against the advertised collection, compare decoded path segments for equivalent
  percent-encoding, and ignore an exact collection-self response. Different origins, sibling or
  parent paths, embedded credentials, fragments, queries, encoded separators and nested children remain
  rejected before object retrieval.
- Live result (2026-08-25): the commissioned account advertised two `VTODO` collections, but the
  bounded read returned two duplicated legacy/other records and none of the newly created current
  test reminders. Direct CalDAV is therefore rejected as a reliable modern iCloud Reminders source.
  Apple's Calendar guide separately confirms that its native macOS Calendar app can view, create,
  edit and complete scheduled reminders, but documents no corresponding CalDAV or app-password API.
  Reconsider direct server sync only if Apple documents a supported server API; otherwise a future
  permissioned native companion bridge is the appropriate boundary.

## D-065 — Pocket-money progress uses the complete weekly schedule

- Date: 2026-08-24
- Status: accepted; supersedes D-027's as-of-date denominator
- Context: Counting only chores due through today makes one completed Monday chore appear as 100%
  even when that child has more work scheduled later in the week. That overstates both progress and
  the amount earned from a fixed weekly allowance.
- Choice: For every current or historical Monday–Sunday week, load all seven days and calculate the
  percentage from completed occurrences divided by the complete non-excused, non-cancelled weekly
  schedule. Keep future pending occurrences and skipped occurrences in the denominator. Retain the
  as-of date only for payday state, command timing and the immutable payment snapshot timestamp.
- Consequence: Progress begins below 100% when work remains later in the week and rises as the child
  completes the whole schedule. Editing a future recurring schedule can change an unpaid current
  week's denominator, while existing immutable payment snapshots remain unchanged.

## D-066 — Normal Synology releases use a fixed root-owned activator

- Date: 2026-08-24
- Status: accepted with explicit owner approval
- Context: Repeated interactive `sudo` prompts were unreliable in Codex and DSM browser workflows,
  causing failed or confusing deployments. Storing the administrator password, granting a
  passwordless shell or granting unrestricted Docker access would violate Hearth's credential and
  least-privilege boundaries.
- Choice: Use one final owner-entered, non-echoing `sudo` prompt to install a root-owned
  `/usr/local/sbin/hearth-v2-activate-staged` command and root-owned production Compose/environment.
  Permit the named deployment user to run only that command through `sudo -n`. The command accepts
  no release argument, reads one validated 40-character staged marker, operates only the fixed
  Hearth Compose project, reapplies the root-owned narrow Docker-firewall rules and waits for
  readiness before recording the release. Refresh the helper
  deliberately whenever the canonical production Compose changes.
- Consequence: Routine verified releases can be launched and checked entirely from Codex without
  handling a password, while the NAS does not gain a reusable root task, passwordless shell or
  unrestricted Docker privilege. Removing `/etc/sudoers.d/hearth-v2-release` disables this path.

## D-067 — DSM forwarding permits Docker-origin traffic without bypassing inbound policy

- Date: 2026-08-25
- Status: accepted with explicit owner approval
- Context: DSM places its host-oriented `FORWARD_FIREWALL` catch-all drop before Docker's generated
  `DEFAULT_FORWARD` chain. That blocked Hearth's bridge and DNS traffic and left the web shell
  loading while its API proxy timed out. The live audit confirmed qBittorrent independently shares
  Gluetun's network namespace, Docker keeps its own bridge-isolation chains and unsolicited inbound
  traffic should remain subject to DSM's LAN, Tailscale and port rules.
- Choice: Keep DSM's input and forwarding firewall. Add idempotent `FORWARD_FIREWALL` return rules
  matching only the Hearth network's exact subnet-to-subnet traffic and DNS to the configured
  resolver, positioned after established traffic. Remove any superseded blanket `docker+` bypass and
  do not reorder `DEFAULT_FORWARD` ahead of DSM, because those alternatives could weaken unsolicited
  inbound filtering. Apply the rules once at boot and after verified container replacement; run no
  polling watchdog.
- Consequence: Hearth's web/server bridge and DNS requests work while other Docker networks retain
  DSM and Docker isolation. LAN/Tailscale/WAN-origin traffic remains gated by DSM before Docker, and
  qBittorrent remains bounded by Gluetun's own namespace and kill switch. An explicit DSM firewall
  reload still requires one hook invocation and readiness verification.

## D-068 — Modern iCloud Reminders use a native EventKit companion proof

- Date: 2026-08-25
- Status: accepted and physically validated for the read-only proof
- Context: The commissioned CalDAV capability probe found advertised `VTODO`
  collections but did not expose the owner's newly created current Reminders
  or Family Reminders test items. Reopening that server-side path would weaken
  the established calendar credential boundary and still would not be a
  reliable modern Reminders source. Apple documents EventKit as the native
  permission-controlled route and requires full Reminders access for apps that
  read existing reminders on iOS 17+; Apple does not offer a read-only EventKit
  permission.
- Choice: Build the first native SwiftUI companion proof under
  `hearth/apps/ios`. A narrow `ReminderStore` protocol has a real EventKit
  adapter and deterministic fake adapter. The app requests
  `requestFullAccessToReminders`, enumerates `calendars(for: .reminder)`, lets
  an adult select lists and displays reminder title, list, due date/time and
  completion state. The app performs no EventKit mutation and has no server
  writes, background sync, APNs, two-way completion or web session in this
  slice.
- Consequence: A physical iPhone is the only evidence that the owner's current
  Apple Reminders lists and test reminders can be read. Simulator evidence is
  limited to UI wiring and fake-driven states. That physical proof passed on
  2026-08-25 on an iPhone 17e running iOS 26.6; completion was visible but not
  mutable in Hearth Companion. The eventual installed Hearth
  Companion may combine native Apple integrations with the existing responsive
  web administration UI; WKWebView versus opening an authenticated web session
  remains a later evaluated choice. No Apple ID, app-specific password, private
  URL or NAS credential enters Hearth.

## D-069 — Foreground EventKit changes refetch selected reminders without layout replacement

- Date: 2026-08-25
- Status: accepted for the native Reminders proof
- Context: EventKit documents that `EKEventStoreChanged` can invalidate fetched
  reminders and that clients should refetch. A manual pull was also replacing
  the complete success layout with a loading skeleton, causing a brief visual
  flicker when the user pulled repeatedly.
- Choice: Keep a narrow change stream on `ReminderStore`. The EventKit adapter
  yields when its `EKEventStore` changes; the view model debounces the signal,
  refetches the selected lists while the companion is foregrounded, and also
  refetches on foreground entry. When a prior snapshot exists, the view model
  preserves it while the read is in flight and exposes the refreshing state only
  to interaction controls.
- Consequence: Changes made in Apple Reminders while Hearth Companion is open
  appear without a manual pull, with manual refresh retained as a fallback.
  The physical run observed approximately nine seconds for one remote change
  and five seconds for a Mac completion change, and the previously reported
  repeated-pull flicker was no longer visible.
  This is not persistent background sync or APNs. Apple Reminders Sections are
  not synthesized because EventKit does not expose their hierarchy.

## D-070 — Reminder list selection is an app-local opaque preference

- Date: 2026-08-25
- Status: accepted for the native Reminders proof
- Context: Requiring an adult to reselect EventKit lists on every launch makes
  the native proof unreliable, but retaining reminder content would create a
  new cache and privacy boundary that this slice does not need. An empty saved
  set must also remain distinguishable from a first launch with no preference.
- Choice: Inject a narrow `ReminderListSelectionStore` separately from
  `ReminderStore`. The live adapter stores only sorted EventKit list identifiers
  in app-sandboxed `UserDefaults`; tests and previews use an in-memory adapter.
  A missing preference selects all lists after the first successful non-empty
  EventKit list read. A saved empty set remains empty, and every successful read
  intersects saved identifiers with the currently available lists before saving
  them again.
- Consequence: The adult's selection survives relaunch without storing reminder
  titles, dates, completion states or Apple credentials. Removed list identifiers
  fail closed and are pruned. This local preference is not a Hearth server
  snapshot, pairing credential, background upload, APNs state or writeback
  contract; the versioned server bridge is governed separately by D-071.

## D-071 — Native EventKit bridge uses a device-scoped full-snapshot contract

- Date: 2026-08-25
- Status: accepted; implements the native path identified by D-064
- Context: The commissioned CalDAV capability check did not expose current Apple Reminders, while a
  physical iPhone EventKit build successfully read current personal and shared family lists. Hearth
  needs a durable server contract before the iOS task adds network assumptions, and the eventual
  full native client must not fork household business rules or receive a broad credential merely to
  bridge reminders.
- Choice: Freeze `REMINDERS_COMPANION_CONTRACT.md` as wire version 1. Pair one EventKit source per
  household through an adult-approved ten-minute code and a device-generated Keychain secret whose
  server-side form is hash-only. Grant that device exactly `reminders.snapshot.write` through the
  distinct `HearthReminderSource` authorization scheme. Accept bounded full snapshots only, with a
  strictly increasing gap-tolerant sequence, immutable idempotency identities, internal tombstones,
  atomic projection/audit/receipt writes and stale-cache retention. Hash source identifiers before
  persistence and omit them from household reads. Keep the projection read-only and omit Apple
  Reminders Sections and unsupported content. Use hand-written Swift `Codable` DTOs checked against
  committed language-neutral fixtures until a stable generated-schema path exists.
- Consequence: The iPhone bridge can begin without schema drift or Apple credentials on Hearth. A
  revoked source cannot act as a television/adult client, temporary unavailability does not erase
  family information, and the later native iPhone app can use ordinary passkey-authenticated Hearth
  services alongside this narrow source transport. V1 requires full-list enumeration and caps one
  snapshot at 50 lists, 1,000 reminders and 1.5 MB; incremental sync, APNs/background transfer,
  EventKit mutation and full native feature parity require later evidence and decisions.

## D-072 — Reminders are a conditional read-only destination with a bounded Today summary

- Date: 2026-08-26
- Status: accepted and implemented
- Context: The EventKit bridge now provides a durable household projection, but exposing all
  reminders inside Today would crowd the appliance dashboard and showing an empty primary
  destination before the first snapshot would imply a working source that does not yet exist.
- Choice: Add one dedicated Reminders destination only after the active source is `current` or
  `stale`. Group the shared household projection by list, default to incomplete reminders and offer
  an explicit read-only **All** filter for completed rows. Add a default-on but independently
  configurable Today module containing only incomplete reminders whose source-local due date equals
  the household local date. Keep the module bounded and link it to the dedicated destination. Do
  not add complete, edit, delete or writeback controls.
- Consequence: Television, responsive web and the future native client can consume the same typed
  household read model without duplicating business rules. Temporary iPhone/iCloud failure leaves
  cached reminders visible with honest freshness, while unpaired, awaiting-first-snapshot and
  revoked sources do not create misleading navigation or Today content. Migration
  `0026_today_reminders.sql` stores only the visibility preference and no reminder content.

## D-073 — Today settings use direct controls without a simulated dashboard

- Date: 2026-08-26
- Status: accepted and implemented
- Context: The embedded TV/Phone Today preview repeated a large amount of the real dashboard inside
  the phone-first administration page, made the page unnecessarily long and was less trustworthy
  than checking the actual responsive Today destination.
- Choice: Remove the embedded Preview section, its secondary Today-summary query and its preview-only
  rendering code. Keep the six section switches, serialised optimistic persistence and notice
  administration unchanged. Treat the actual Today page as the authoritative rendered result.
- Consequence: Today administration is shorter and performs one fewer query. Layout behaviour remains
  covered on the real Today page across module subsets, photo orientations and supported viewports.

## D-074 — Apple Reminders use best-effort iOS background refresh

- Date: 2026-08-26
- Status: accepted and implemented; physical scheduling latency not yet measured
- Context: Foreground `EKEventStoreChanged` observation is fast, but it does not provide a server
  webhook or guarantee that a suspended iPhone app wakes when Apple Reminders changes. Hearth should
  usually receive changes without requiring the adult to reopen the companion, while keeping the
  source read-only and avoiding a misleading fixed refresh promise.
- Choice: Register one `BGAppRefreshTask` permitted by the app's Info.plist and request another run
  for paired sources when the app enters the background. Set fifteen minutes as the earliest start,
  reschedule when iOS launches the task, reread the complete selected EventKit lists and reuse the
  frozen device-scoped full-snapshot contract. Keep the task alive until Hearth accepts or rejects
  the snapshot. On expiration, cancel the transport without accepting or clearing data and retain
  any exact in-memory pending request for a later retry. Add no APNs polling, proprietary iCloud
  endpoint, continuous background mode or EventKit mutation.
- Consequence: Reminder changes can reach Hearth automatically while the companion is suspended,
  and existing server-sent invalidation updates open household screens immediately after acceptance.
  iOS still controls whether and when the task runs, so Hearth retains cached rows, an honest stale
  state and foreground/manual refresh. Simulator tests prove read-to-acceptance coordination; a
  physical background launch and real-world latency observation remain separate evidence.

## D-075 — Phone administration separates destinations from management actions

- Date: 2026-08-26
- Status: accepted and implemented
- Context: More exposed **Photos** as the family gallery while phone upload and curation lived behind
  a generic household/settings path. Adults repeatedly entered the display gallery while looking for
  photo management. On Today settings, a narrow-width override appeared before the desktop grid rule,
  so the desktop two-column cards won in the cascade and squeezed descriptions against switches.
- Choice: Name the gallery action **View family photos** and expose a direct **Manage photos** row
  under Manage Hearth. Group the settings root as Family content, Household & access,
  Connections & displays and System, using joined list rows and one continuous focus order. At phone
  widths, render all Today visibility options as full-width joined rows; keep the icon, copy and switch
  in distinct grid columns and apply focus inside the group boundary. Keep More and settings-root
  navigation bars slim, slightly squared and title-only; task-specific guidance starts after opening a
  destination rather than repeating under every self-explanatory title.
- Refinement (2026-10-10): **Manage photos** uses the same row/text/icon palette as peer settings in
  both themes. Discoverability comes from its explicit title and position, not one-off purple styling.
- Refinement (2026-10-12): Settings links remember only an allowlisted local opener pathname in
  router history. Header Back pops that entry, restoring its menu, query and existing focus memory;
  nested settings retain their actual parent through reload and Back/Forward. More no longer
  unexpectedly becomes the separate settings overview. The overview remains available for desktop
  use and existing links; directly opened settings retain their safe hierarchical fallback. No
  account, permission, authentication, storage or networking boundary changes.
- Consequence: Viewing and administering photos are discoverable as separate intents, upload no longer
  depends on finding the gallery or a generic household row, and Today controls remain legible at the
  390-pixel companion width. Routes, permissions and the underlying photo/Today contracts do not change.

## D-076 — Today summarises all open reminders

- Date: 2026-08-27
- Status: superseded by D-078; ordering retained for Hearth-owned reminders
- Context: Most household reminders have no due date. Restricting the Today card to reminders due on
  the household local date therefore produced **Nothing due today** while useful open reminders were
  present on the dedicated page.
- Choice: Keep the Today module bounded and linked to Reminders, but derive it from every incomplete
  Hearth reminder. Order the preview as overdue, due today, no due date and future;
  sort deterministically within each group. Return the total open count and at most three preview
  items. Render the count and first title with an overflow summary, and reserve **No open reminders**
  for a genuinely empty open projection.
- Consequence: Undated reminders remain visible at a glance without turning Today into a second task
  list. The dedicated page remains the complete destination and Hearth remains authoritative.

## D-077 — Weather uses one comparative hourly graph and weekly scale

- Date: 2026-08-27
- Status: accepted and implemented; extends D-049 and D-051
- Context: Today and Calendar exposed only small forecast cues. A family may need hourly rain, wind
  and apparent-temperature detail, but three simultaneous charts are noisy at television distance
  and a second weather provider would widen the integration surface unnecessarily.
- Choice: Add Weather immediately after Calendar. Extend the existing server-only Open-Meteo
  request and typed cache to current conditions, 24 hourly points and seven daily points. Present
  one graph with Temperature, Rain and Wind modes, D-pad hour/mode navigation and touch controls.
  Compare seven daily temperature ranges on one weekly domain and use the same approach in compact
  Calendar Week summaries. Refresh the server cache every five minutes, retain stale data on failure
  and keep provider attribution in adult Weather location settings rather than on household-facing
  Weather or Today.
- Consequence: Hearth gains useful forecast depth without another credential, provider or competing
  graph. The browser never receives coordinates, Week remains glanceable, and outage behaviour stays
  consistent with the appliance model. The visual hierarchy is original Hearth work rather than a
  copy of any operating-system weather screen.
- Refinement (2026-09-07): keep range bars on Weather only; Calendar Week retains icon, rain and
  low/high text. Weather's daily rows add maximum wind and prevailing direction from the same
  Open-Meteo request, with optional nullable fields for older cached forecasts.
- Refinement (2026-10-09): replace the rolling window with the fixed household-local day, including
  the next midnight endpoint (at most 25 points within the existing 48-point schema). The shared
  minute clock positions a filled dot on the curve independently of manual hour inspection;
  **Now** resumes following. Measured plot coordinates replace non-uniform SVG stretching and
  the phone's 760-pixel scroll canvas. Missing samples remain gaps, stale prior-day data has no live
  dot, and geometry uses provider-local wall time rather than the browser timezone. No new provider,
  credential, persistence, background worker or networking change is introduced.

- Refinement (2026-10-10): make the Weather reading path explicit without multiplying simultaneous
  modes. Rain's previously same-colour overlaid amount curve had an unlabelled secondary scale;
  replace it with two time-aligned lanes in the one active graph: purple probability line with
  fixed 0–100% ticks, and blue hourly millimetre bars with a separately labelled zero-based 1/2/5
  scale. Redundant units/shapes and a text alternative make colour non-essential. Selected expected
  amount remains visible on narrow phones; wind speed/gusts also start at zero. Add low/high labels,
  a visible Seven days heading and wide-row column labels, retain shared weekly temperature ranges,
  and budget spacing for compact/short wide displays. Tap-to-inspect owns no drag or scroll gesture,
  has button/D-pad alternatives and maps through the existing 4K CSS zoom. Mode changes measure the
  new plot height before paint. Axis labels use exact, readable tick values, not rounded quarter
  positions. Saved/offline status reuses the header freshness line and retains visible age near
  the hour controls, keeping all seven days within a compact TV. The TV shell's single grid row
  is explicitly viewport-bounded so a short-wide rail cannot grow it and scroll the whole shell
  when a chart control receives focus. No DTO, provider request, saved preference, authority, background
  behaviour or runtime-networking change is needed.

  D-pad refinement (2026-10-10): the chart must not consume every direction indefinitely. Up
  returns to the active graph button without changing mode/hour; the explicit button row moves
  Left through Wind/Rain/Temperature and then to Weather in the rail. Down retains graph cycling,
  Left/Right retains hour inspection and Select retains **Now**. This exit is bounded at all hours
  and all TV sizes, without requiring Back or stepping through a whole day's samples. The handlers
  also connect Wind to Previous hour / Now / Next hour, skip disabled endpoint actions and retain
  a bounded return through the graph/buttons. Modified browser shortcuts remain untouched.
  All visible Weather controls must keep an arrow path; the chart escape cannot strand hour actions.
  Use the existing focus helper only for Weather's known controls; general spatial navigation,
  modal isolation, focus memory and native Back handling are unchanged.

## D-078 — Retire Apple Reminders and make reminders Hearth-owned

- Date: 2026-08-27
- Status: accepted and implemented
- Context: Modern iCloud Reminders required a separate physical iPhone bridge, full EventKit
  permission, pairing, a device credential, snapshot replacement and best-effort background
  scheduling. Even after the proof worked, Apple controlled propagation and background execution,
  making this disproportionate to a calm household reminder feature.
- Choice: Remove Apple Reminders from the active product. Archive the Swift proof, CalDAV probe,
  frozen contract, source projection and former browser UI under
  `hearth/archive/apple-reminders-bridge/`, outside all active packages. Replace the projection with
  household-owned reminders supporting create, edit, complete, reopen and confirmed removal.
  Preserve historical migrations `0025` and `0026` for forward upgrade integrity; migration `0027`
  drops the Apple source/device/list/item/receipt tables and their credential hashes before creating
  native reminder tables.
- Consequence: Hearth reminders work without an iPhone companion, Apple permission or external
  freshness state. The old Apple reminder data is intentionally not imported because its ownership
  and identity semantics differ from Hearth content. Deploying `0027` permanently removes that
  projection from the live database; rollback therefore requires restoring a pre-migration backup.
  Any future Apple integration needs a new product decision, threat review and physical acceptance
  campaign rather than re-enabling archived code.

## D-079 — Appliance updates use an authenticated coordinator and fixed host agent

- Date: 2026-08-28
- Status: accepted and implemented for Synology; missing-agent recovery hardened by D-082
- Context: Exact-commit Synology releases are reliable but still require an operator. Letting the
  browser run Docker or shell commands would turn a web compromise into host control, while blindly
  following `main` could install a release whose verification or images are incomplete.
- Choice: Add a System Health update card only when a platform adapter is configured. The server
  discovers the newest successful `main` push from the fixed verification workflow, accepts only its
  exact 40-character commit, creates and verifies an online database backup, then writes a bounded
  request to a mode-restricted FIFO. A separately installed root-owned Synology agent blocks on that
  FIFO, invokes only the fixed Hearth release helper, health-checks the replacement and restores the
  previous database and images on failure. Update reads require an adult administrator; installation
  also requires a passkey session created within five minutes. Development hides the card. Termux
  may use the same typed coordinator only after its platform agent and rollback path are separately
  commissioned.
- Consequence: The normal browser and containers receive neither Docker access nor a general shell.
  Release start and terminal result are audited, progress survives the web container restart, and a
  failed release returns to the prior working state. The first live Synology use still requires one
  approved rerun of the root helper installer to install the new fixed agent and Compose mount.

## D-080 — Open clients reload after a verified release changes

- Date: 2026-09-01
- Status: accepted and implemented
- Context: A television WebView can remain alive across a Synology container replacement and keep
  rendering its already loaded JavaScript even though the new non-cached HTML is live.
- Choice: Expose the non-secret active release identifier from the non-cacheable health route. The
  shared web client compares it on initial load, realtime connection/reconnection, foreground and
  network return, with a once-per-minute fallback while visible. It reloads the document once only
  when the identifier changes; hidden pages do not run the interval check.
- Consequence: Future server/web patches appear without clearing application data or repairing the
  television. A temporary outage leaves the current screen intact and retries at the next lifecycle
  signal or visible interval.

## D-081 — Archiving withdraws today's unfinished chore copies

- Date: 2026-09-01
- Status: accepted and implemented; narrows D-038
- Context: Archiving stopped future generation but left an already-materialised pending job on the
  current Chores screen. To a parent, the schedule appeared not to have been removed. Completed work
  must still remain visible and must never be rewritten.
- Choice: In the same idempotent archive transaction, change every non-completed occurrence for that
  template on the household's current local date to `cancelled`. Omit cancelled rows from household
  Today and Chores reads while retaining them in SQLite and excluding them from pocket money. Leave
  completed copies unchanged. A restore on the cancelled row's exact date returns it to pending;
  dates inside the archived interval remain ungenerated.
- Consequence: Archive now matches the parent's immediate intent without deleting history or completed
  work. Multi-assignee schedules can retain one completed copy while withdrawing another unfinished
  copy, retries remain safe and no migration is required.

## D-082 — Appliance-update readiness must be truthful and self-healing

- Date: 2026-09-01
- Status: accepted and implemented; hardens D-079
- Context: A live Synology had ample free storage but its fixed update agent had stopped without a
  status file. System Health reduced that setup failure to a red Storage chip and left a disabled
  passkey button that appeared broken. The same phone screen repeated recovery explanation and let a
  full commit overflow.
- Choice: Treat the agent as ready only when its process and non-empty status file both exist. Replace
  stale state at startup, wait for readiness and make external activation restart a missing agent
  before it reports success. Put updates immediately after the health summary, show the exact blocker
  instead of an inert button, use short release identifiers, explain automatic backup/rollback once
  and keep manual extra copies collapsed under Advanced recovery.
- Consequence: A setup fault no longer masquerades as low storage or a dead button. Existing Synology
  installations need one final helper reinstall to receive the hardened root-owned scripts; later
  external activations repair the agent automatically.

## D-083 — Reverse-proxy trust requires explicit addresses

- Date: 2026-09-06
- Status: implemented locally; live deployment not performed
- Context: Fastify 5.12.1 removes numeric hop-count trust because it cannot authenticate the
  connecting proxy. Upgrading must not recreate that behaviour with a hop-only callback.
- Choice: `HEARTH_TRUST_PROXY_ADDRESSES` accepts explicit comma-separated IPv4/IPv6 addresses or
  bounded CIDRs. No addresses means no forwarded-header trust. The former
  `HEARTH_TRUST_PROXY_HOPS` setting is no longer used. No LAN range is trusted automatically.
- Consequence: Existing installations remain usable without new configuration. Passkey origin,
  cookies and permissions remain bound to the configured HTTPS origin, not forwarded headers.
  Behind an unconfigured proxy, authentication throttling is conservatively shared by clients
  behind that proxy. Configure only the verified proxy chain's addresses when distinct client
  throttling is required; keep the API container unexposed.

## D-084 — Bounded Week previews with a full-day overflow list

- Date: 2026-09-07
- Status: implemented locally; no live deployment
- Context: A fixed 8 am–8 pm grid loses early/late plans, repeats an overnight duration on each
  date, and becomes unreadable when arbitrary numbers of overlapping cards divide a day column.
- Choice: Extend the shared wall-clock axis as needed, bounded by midnight. Clip timed events to
  each local day and treat timed ends as exclusive. Keep two all-day rows and at most two timed
  lanes, accounting for readable card height. Anything that cannot fit contributes to `+N more`.
  The control opens a native modal full-day list from the already-loaded schedule, with event
  details inside that same modal and exact Back/focus restoration. The companion keeps its agenda.
- Consequence: No provider, API, database or calendar write changes. Busy days and very late short
  events may need one extra Select, but no event is silently lost or reduced to a third tiny lane.
  A repeated daylight-saving hour keeps its true timestamps in details while its wall-clock card
  gets a positive readable span. Hardware remote/browser acceptance remains separate from lab QA.

## D-085 — Release verification shards isolated built-app tests without reducing coverage

- Date: 2026-09-07
- Status: accepted
- Context: The serial browser gate exceeded its 25-minute workflow limit after 422 of 454 tests.
  A single Today test also hid 384 layout combinations from the scheduler. Local success could not
  publish a verified update, and simply adding workers would race shared demo resets.
- Choice: Keep the entire code/API, Android and container gate. Build web/server/shared/core once
  for four browser jobs in the same workflow. Run one browser worker per job with a disposable
  in-memory demo database and no server reuse; shard individual tests, including all 384 separately
  named Today cases. Check the partition for missing/duplicated tests before running it. Cache the
  pnpm store with locked installation, retain Buildx caches, install only headless Chromium and keep
  bounded failure evidence. Give code/browser jobs a 45-minute safety ceiling. Cancel obsolete runs
  and sibling shards after failure, and stop a shard on its first failed test. Publish only when all
  required gates succeed.
- Consequence: Release latency can fall without bypassing checks or moving execution onto a personal
  Mac or production NAS. The updater still accepts only successful hosted releases and may cache
  discovery for five minutes. Hosted timing must be measured; sharding can add setup overhead even
  when it reduces elapsed time. Publication is not deployment.

## D-088 — Bounded startup, immutable retries and draft-safe catch-up

- Date: 2026-10-05
- Status: accepted; implementation verification is local, not live deployment approval
- Context: Lost replies could duplicate writes, whole-cache rollback could undo another command,
  stream gaps left stale data, and optional verse requests delayed Today. Meal refetches discarded
  drafts and an always-open Meals screen did not follow Monday rollover.
- Choice: Bound browser requests; keep immutable retry intents with the original ID/date context;
  roll back individual records; catch up household queries on stream/lifecycle recovery. Read verse
  caches before a deduplicated background refresh with short failure backoff. Protect registered
  drafts through the data router, defer release reloads, and resolve meal conflicts per date.
  Preserve existing responsive layouts and incrementally extract the Today composer, demo planning
  repository, record helpers and meal-administration styles. Keep the existing isolated CI shards.
- Consequence: Recovery is explicit and duplicate-safe while a screen retains its intent. Drafts
  are in memory, not an offline write queue or new authoritative database. No provider calendar
  writes, authentication relaxation, NAS/network changes or deployment are implied. Security-scan,
  container and physical-device verification remain independent gates.

## D-089 — Commit-time authority and protected appliance recovery

- Date: 2026-10-06
- Status: accepted; local gates passed; live helper migration and deployment require approval
- Context: Retained security reviews repeated several boundaries: asynchronous authentication
  outlived revocation, accepted writes exceeded readable state, provider parsing began before bounds,
  and privileged rollback resolved service-controlled filenames.
- Choice: Revalidate credential, member and initiating session authority when access is issued;
  atomically consume recovery codes and claim first-use setup. Bound pairing state and reminder
  creation while keeping legacy records recoverable. Cancel and clear private reads on sign-out,
  close realtime streams, prevent private image cache reuse, and index only the visible Month grid.
  Validate real local dates. Fetch verse content only for the household's current date. Read provider
  bodies within decoded-byte/deadline budgets before parsing; allow only the configured CalDAV origin
  and explicit HTTPS iCloud service/shard origins, with bounded discovery and concurrency.
  Decode one pinned photo snapshot rather than reopening source paths.
- Privileged boundary: Move update control and authoritative metadata/rollback storage under the
  protected external roots: configuration/control under `/usr/local/etc/hearth-v2`, and bounded
  rollback storage on the data volume at `/volume1/.hearth-v2-state`. The host helper checks the newest
  successful main/push `verify.yml` release. Snapshot through no-follow descriptors into protected
  storage; restore using pinned directory identity, checked digest, descriptor ownership/mode
  operations and atomic replacement. Reject root application identities. Readiness must report the
  requested version before activation is accepted.
- Consequence: Synology requires Python 3.8+ with SQLite and a one-time approved helper/Compose
  migration followed by activation of a verified release. Local source work does not alter the
  running appliance. Home Assistant's deliberately supported local HTTP mode remains a commissioning
  risk unless separately encrypted; changing a live connection or mandating HTTPS is a separate
  compatibility decision, not an implicit network change.

## D-090 — Bounded materialization, exact list replay and strict-CSP startup

- Date: 2026-10-06
- Status: accepted; local gates passed; not deployment approval
- Context: A single Standard audit found two authenticated storage-amplification paths. Separately,
  production CSP blocked the early inline theme/TV scripts and malformed optional integration files
  could stop core startup. Browser fixtures could finish with intercepted refreshes still running.
- Choice: Bound chore materialization centrally to seven prior whole weeks, the current week and
  the next whole week, using the household timezone and runtime clock. Older existing history and
  payment snapshots remain readable; missing old records are not invented. Private generation never
  inherits demo completion states and uses the actual materialization timestamp.
  Limit new additions to 100 unarchived items per list, including checked items, inside the command
  transaction after replay lookup; mirror the demo policy. Clear/archive releases capacity. Preserve
  old oversized reads, cleanup, completion and exact typed-result receipts; do not truncate data,
  change response-array contracts or replace original snapshots with current-list hydration.
  Serve early appearance/TV initialization as a same-origin, parser-blocking classic script while
  retaining strict CSP. Disable only invalid/unreadable optional calendar/HA configuration, retain
  its file for repair and emit a secret-free warning; authentication/security config still fails
  closed. Drain intercepted browser refreshes before disposing test contexts.
- Limits: A creation cap closes new unbounded growing-list amplification, not a universal byte cap
  for legacy oversized snapshots or a new receipt retention/compaction policy. Those would need an
  explicit compatibility decision and measured workload. No household records, external credentials,
  NAS services, networking or VPN settings are changed by this local implementation.

## D-091 — One clear phone and shared-screen connection workflow

- Date: 2026-10-06
- Status: accepted; local connection and adjacent regression gates passed; not publication or deployment approval
- Context: Phone passkey sign-in, recovery and browser display pairing were mixed together;
  More, settings and Android named the approval destination differently. The demo pairing preview
  could be mistaken for a production connection path.
  Wide desktop windows also incorrectly hid the first-use form as though they were televisions.
- Choice: Present explicit personal-device and shared-screen choices, and one **Phones & screens**
  hub under the existing `/admin/televisions` route. Keep adult passkey management at `/admin/access`
  with a return link to that hub. Share short code-approval instructions; use a native modal with
  D-pad/Back/Tab handling, cancel late request results and show expired/retry/connected states.
  Keep recovery secondary and its destructive replacement meaning explicit. Put the screen
  approval form at the top of the phone hub, with code-preparation help collapsed. Keep
  first-use setup on capable desktop browsers, using TV identity rather than width for TV guidance.
  Require a confirmed screen disconnection and retain immutable command IDs across lost
  approval/disconnection replies.
- Consequence: No new invitation credential, account, server authority, pairing protocol, database
  migration or network access. Adults still authenticate with passkeys; shared screens still prove
  their local secret after adult approval and receive display scopes only. Demo previews remain
  fictional. Real phone/TV commissioning is distinct from simulated browser evidence.
