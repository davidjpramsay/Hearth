# NBA module — first slice

NBA is an optional, initially **off** household module. An adult enables it in
More → Modules and chooses up to five standout teams in More → NBA teams.
Preferences survive disabling/re-enabling and server restarts. No team selected
means equal focus, not an empty league. Shared screens can read, never edit.

## Data and presentation

- `GET /api/v1/households/{householdId}/nba` returns this and next Monday–Sunday
  week in the household IANA timezone, season/phase, conference standings and
  current-week best **single-game** points, rebounds and assists (including ties).
  These are not weekly totals, averages or an all-player leaderboard.
  Schedules cover games between the 30 NBA clubs, not All-Star or overseas exhibition opponents.
- `GET/PUT /api/v1/households/{householdId}/nba/settings` reads/saves
  `{standoutTeamIds}`; PUT also requires an actor-scoped `requestId`. Exact retries
  replay; changed reuse conflicts. Saves are atomic and audited.
- View, team filter, conference and page are URL state. Pagination bounds the TV
  surface; the phone reflows cards, never shrinks a desktop table. Controls remain
  remote/keyboard reachable with a route back to the rail.
- Source, fetch time, household timezone and preseason/regular/playoff phase are
  explicit. Empty games are different from unavailable data. Retained data is
  labelled stale after a failed refresh. No per-second/live-score promise.

## Provider boundary

### Spoiler-free games and on-demand box scores (D-115)

Game cards show teams, date, phase and game status, **not scores or winner styling**.
No hidden/ARIA/title score values are rendered. Open a game to reveal both team totals
at the top, with a separate player list for each team. Closing returns focus to the same
card without changing browse filters/page. This is spoiler prevention in the interface,
not a confidentiality boundary: the backwards-compatible overview DTO still includes scores.
Standings and Weekly best remain explicit league views, not a global spoiler-free mode.

- `GET /api/v1/households/{householdId}/nba/games/{gameId}` is read-only, household-authenticated,
  module-gated before I/O, `private, no-store`, and varies on Cookie/Authorization. Numeric IDs
  (1–20 digits) must already belong to that household's current local fortnight projection.
  Unknown games return 404 before summary I/O; this is not an arbitrary/history proxy.
- `NbaBoxScoreProvider` has real ESPN and deterministic fictional adapters. The fixed server-only
  summary endpoint is `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event={id}`.
  No caller URL, provider links, odds, commentary, advertisements or media enter the typed DTO.
  The eight-second timeout includes body consumption; decoded responses are bounded at four MiB,
  redirects rejected. Verify event identity, exact home/away team identity, unique players/teams,
  columns and reported team totals before publishing. Map by provider **keys**, never array position.
- `NbaGameService` coalesces exact reads; retain at most 16 entries (including negative/pending),
  at most four concurrent summary requests, and cache/retry for one minute. Fetch only on opening
  a game or Check stats; no timer/background job or eager summary/roster fan-out. Retain last-good
  data with explicit stale state after failure; unknown/new games cannot borrow another box score.
- Detail DTO: `{game,teams,status,source,fetchedAt}`. Teams contain `teamId`, bounded (1–40)
  `players` and reported `totals`; players contain numeric public `id`, name, starter, didNotPlay,
  nullable DNP reason and named stats. Stats are nullable points, assists, rebounds, steals, blocks,
  turnovers, personal fouls, minutes, plusMinus, offensive/defensive rebounds and shooting pairs
  (`fieldGoals`, `threePointers`, `freeThrows`: made/attempted). No missing value becomes zero.
  DNP stats are all null; no spurious provider reason is shown for a player who participated.
  Percentages are computed from each reported pair; zero attempts show a dash, not 0% accuracy.
- Primary columns: Player, **Points, Assists, Rebounds**, Steals, Blocks, Turnovers, Fouls, Minutes,
  +/−. Shooting view keeps Points/Assists/Rebounds first, then field goals, 3-pointers, free throws,
  offensive and defensive rebounds. Starters precede bench, with DNP last; eight players/page on TV,
  full-game team totals on every page. Both team scores remain above the selected team's table.
  Phone tables reflow to labelled stat grids, not a squeezed horizontal desktop sheet.
- Loading, not-started/postponed/cancelled, unavailable, saved/stale and successful stats are distinct.
  Back/Close restores the opener; arrows/Tab stay inside the modal. No migration, credential,
  provider persistence, HA grant/navigation expansion, APK or live-device change is required.

Stat terminology follows the [official NBA glossary](https://www.nba.com/stats/help/glossary).
Player-stat and shooting views are a readability choice, not a claim that points/assists/rebounds
is the league's official column order. Public-feed/commercial-source limitations below still apply.

### Overview feed

The server alone reads ESPN's public NBA standings and daily scoreboard feeds
over fixed HTTPS URLs. Sixteen single-day requests cover the local fortnight plus
one day at each edge, including timezone/DST/year boundaries. ESPN groups these by
US Eastern date; verify every event belongs to its requested day, then filter by
household-local date. Date ranges are not supported. Whole months can exceed the
existing response-size bound and are no longer requested.
At most seventeen requests (one standings, sixteen days) run per projection, with
four concurrent requests and one eight-second deadline including queueing and body
consumption. Keep the four-MiB decoded-byte cap per response and reject redirects.
Require every daily response, consistent season identity, valid events and complete
30-team standings; reject a limit-sized day, malformed feed or ignored date filter.
Any failure cancels siblings/queued work and rejects the whole projection, retaining
only the service's explicitly stale last-good fortnight, never partial fresh data.
Requests remain coalesced and cached for 15 minutes; only two fortnight keys are
retained in memory, no historical sports database. No timer/background fetch, and
disabled modules gate before I/O. Responses are projected into typed DTOs.
No browser third-party requests, odds, advertising, streaming,
credentials or arbitrary provider URLs. Demo/test data is deterministic and
explicitly fictional. The public feed is undocumented and has no SLA; a supported
licensed provider and terms review are required before commercial distribution.

## Optional artwork (D-114)

- `GET /api/v1/households/{householdId}/nba/media/{kind}/{id}` is household-authenticated and
  module-gated before I/O. `teams` admits only the fixed 30 team IDs; `players` admits numeric
  IDs (one to ten digits) already present in that household's current fortnight highlights.
  Unknown IDs are not an open image proxy. Missing optional artwork returns 204.
- The public projection adds nullable `playerId`, defaulting to null for older responses and
  demo players. Invalid/missing provider identity disables only the portrait, never scores.
  No provider image URL, credential, binary or player history is persisted in the database.
- `EspnNbaMedia` uses only fixed HTTPS paths on `a.espncdn.com`, rejects redirects, accepts PNG
  content/signature and raster-decodes with Sharp. Four-second download timeout, one-MiB decoded
  response bound, one-million input-pixel bound and two-second image-processing timeout (excluding
  the libuv queue). Strip metadata; resize inside 96×96 team / 320×232 player pixels and emit WebP.
- Coalesce exact requests; at most 16 in-flight operations and 64 cached entries / eight MiB of
  retained image bytes. Success lasts six hours; missing/error lasts one minute. No timer,
  persistent asset store, browser CDN fetch, dependency addition or CSP relaxation. Responses
  are `private, no-store`, vary on Cookie/Authorization and use `nosniff`.
- Fixed artwork slots preserve the six-game/highlight and eight-standings-row TV surface, with
  phone reflow. Crests use an ivory backing so black marks work in dark mode. Portraits/crests
  are decorative beside full player/team labels; failed images reveal initials/abbreviations
  without changing geometry. Team colour is ornamental, not the only score/state/focus cue.
  Attribution is “Data & images: ESPN”. `NoNbaMedia` keeps the fictional demo network-free.
- Artwork outages never make otherwise available NBA scores unavailable. Provider/asset terms
  and commercial licensing remain a separate required review, not implied by this implementation.

## Availability and Home Assistant

Migration 0033 adds NBA without changing existing flags or access. Older payloads
and receipts default the missing NBA flag to off. The module disable lease also
covers NBA settings and waits for in-flight reads/commands. Data/preferences stay.
Existing Home Assistant grants retain their original eleven-module scope. A new
adult approval explicitly freezes the current module IDs; only such approval can
grant NBA's module switch. This slice does not grant HA sports-data access or add
NBA screen-navigation commands. Existing TV/HA behaviour remains unchanged.

NBA is deliberately absent from the paired-display tab allowlist. While a screen
is on `/nba`, its heartbeat reports `tab:null`, so HA's Visible tab entity is
unavailable even if Hearth is foreground. An allowed page such as Photos or Today
is eligible once fresh native-foreground presentation/state polls succeed.
This is distinct from failed authentication, a missing heartbeat or an obsolete
native shell; a module switch does not grant a navigation destination.

## Acceptance

Test timezone boundaries/DST, complete next week, standings phase, leaders/ties,
malformed/truncated/oversized/timeout feeds, coalescing/cache/stale recovery,
settings validation/replay/conflict/restart/isolation, module-off no I/O, and old
HA grants. Render TV and narrow phone; exercise pagination, filters, empty/error
states, D-pad escape and accessibility. Browser/public-feed checks are not
physical TV or production deployment evidence.
Also test malformed/oversized/redirected artwork, identity validation, cache/concurrency bounds,
module/auth rejection before media I/O, loaded and missing assets, six tied highlights and
dark/light rendered TV/phone fit. Real public-data artwork smoke must not use fictional identities.
