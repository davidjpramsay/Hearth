# Hearth v2 television and companion UX specification

## Games choices and Connect Four (D-133)

Games offers clear Connections and Connect Four cards. An adult opens More → Modules → Choose games
for two familiar On/Off switches, immediately below the parent Games row. If all children are off,
show a calm empty state explaining where to choose games. Parent off preserves child choices.

Connect Four uses Hearth typography, an eucalyptus board and numbered coral/gold counters, so turn
and ownership do not depend on colour alone. A landing preview identifies the chosen column; large
Previous / Drop / Next controls work on phones. With Drop focused, Left/Right chooses a column and
OK drops; Up reaches Games and Down reaches New round. Back dismisses confirmation before leaving
the game. New round confirms before discarding an unfinished board and alternates the starting
player. A completed board stays visible and cannot accept more counters. The current round resumes
on this device. Text board reading, live turn/win feedback, dark mode and visible focus remain.

## Fitness exercise demonstrations (D-129)

Adult Fitness settings links to Exercise library: search/create a named exercise, add written
instructions, then optionally upload an MP4. A workout chooses this shared entry explicitly while
retaining its own quantities. Family workout rows expose a labelled Demonstration button only when
one exists. One dialog keeps the workout beneath the video panel; Play/Pause and Replay are large
remote targets, Back restores the exact exercise/scroll, and a second Back closes the workout.
Clips start only after Play and run silently, with written instructions visible. Show loading and
recoverable errors without completing or resetting the workout. Ordinary instructions need no clip.

## Fitness (D-128)

Fitness appears in the TV rail and phone More only while enabled. Select a person, see their goals,
current/best scheduled-day streak and weekly session count. Today combines due workouts across all
active goals; each card and its details show the goal. Open the goals card for each goal's weekly
routine and session progress, or choose another day and open a workout.
Four labelled activity icons identify running, swimming, weights and fitness classes. Show four
session cards per page, explicit remaining pages, rest days and honest future-day read-only details.
The modal shows notes and an ordered Exercise / kg / Sets / Reps table; a focusable scrolling region
keeps long instructions accessible with arrows, plus Close/Back and exact card focus restoration.
Phones scroll naturally; never squeeze exercise names into unreadable TV text.

Adult Fitness settings has explicit participant selection, a person selector, long-term goals with
optional target date/achieved status. Each expandable goal contains its own weekly focus and workout
editors. New workouts belong to that goal. Removing a goal confirms removal of its future routine
while preserving history. Earlier unassigned workouts stay separate and can be assigned without
changing their IDs or today's progress. Achieved goals stop scheduling tomorrow. Choose weekdays;
enter optional minutes/km and exercises with optional kg/sets/reps. Empty means unspecified. Exercise
move-up/down is available without dragging. No person is selected automatically. Drafts survive reads,
unknown outcomes retain the exact request, and conflicts offer deliberate Load latest. First save
starts today; later edits clearly start tomorrow. Streak copy explains all sessions/rest days and no
penalty until today's local midnight. Module disabled, empty, loading, stale/offline/error and save
feedback use existing Hearth patterns; shared screens receive no administration link.

## Guided household setup (D-127)

A successful initial owner claim opens Welcome to Hearth → Get started. Existing owner replacement
still opens Recovery & lost phones. Adults can start using Hearth immediately and return through
Hearth settings. Show family, modules, screen/phone connection and recovery as clear linked tasks,
using real state rather than a stored browser checklist. No HA connection is required.
Connections groups Everyday connections (Calendar, Outdoor weather, Family photos) and Optional
smart home (HA, Indoor sensors). Keep rows usable when one provider is unavailable. Hide disabled
features without fetching them. HA offers a matching download, install/update steps, copyable Hearth
address and existing six-letter approval. Outbound home actions start collapsed unless already
connected. No token form or script mapping is a prerequisite for opening HA setup or Morning Routine.

## Weather → Indoors (D-126)

Weather's heading switches Outdoors/Indoors without requiring a configured outdoor forecast.
Indoors shows a named room, current Celsius/percent values, last-report times and Day/Week/Month/
Year choices. Two responsive small-multiple SVG graphs show period means and low–high shading on
separate labelled scales. Missing periods leave gaps; new sensors never imply a year of history.
Use whole-hour time labels for Day, regular local dates for Week/Month and month boundaries for
Year. Increase label density when space allows; never squeeze or rotate overlapping labels.
Vertical scales have evenly spaced whole numbers: padded, enclosing Celsius steps and a fixed
0–100% humidity range. Tick labels represent their actual gridline values, including below zero.
All controls have D-pad paths back to Weather/menu; loading waits for a useful focus entry.
Phones stack charts and retain natural scrolling. TV fits one viewport; both themes remain legible.

Adult Connections → Indoor sensors tests a source, exposes only eligible friendly sensor choices,
groups them into up to eight named rooms and saves exact selections. Edit existing choices without
re-entering the token. Replacement is explicit. Failed/ambiguous saves preserve the draft/exact
request; old settings revisions cannot silently overwrite newer choices. Removing a room removes
only its Hearth display. Shared screens never receive setup links or source credentials.
See INDOOR_CLIMATE_CONTRACT for states, retention and verification.

## Quiet calendar activity (D-125)

Today, Week, Month and Agenda place a small refresh ring beside the heading. It has the accessible
name “Refreshing calendar”, no keyboard stop and no repeated live announcement. Keep its size at
22px on TV / 18px on companion layouts, with a static ring for reduced motion. Routine stale-while-
refreshing data has no banner or explanatory update copy; heading height and content fit stay stable.
Keep saved plans visible and usable. Real provider/authentication/configuration issues, offline
state and failed cached reads keep a message; an unconfirmed cached busy flag never hides them.
Initial loading and failure states retain their existing recovery controls.

## NBA (D-113)

Enable in More → Modules; NBA appears on the TV rail and phone More. Adult More → NBA teams
saves up to five standout teams with checkboxes and Save teams. None means equal focus.
This week, Next week, Standings and Weekly best views have a standout/all filter, conference
switch and pagination (six games/highlights or eight standings rows). TV content fits 1080p;
phone cards reflow. Remote/keyboard escape to navigation stays available. Empty, unavailable,
stale and loading differ. Show source, phase, fetch time and household timezone. No shared-screen
admin entry is added. See [NBA_CONTRACT.md](NBA_CONTRACT.md).

D-114 keeps this exact information hierarchy and page size. Fixed-size team crests, large
unambiguous revealed scores and optional weekly-player portraits add recognition without a hero/banner
or extra controls. Thin team-colour rules are ornamental. Full names remain visible and images
are decorative for assistive technology. Missing images reveal stable initials/abbreviations;
ivory crest backplates preserve dark-logo legibility in both themes. Six tied highlights must
still fit the TV canvas; phone cards reflow rather than squeezing the desktop layout.

D-115 supersedes scores on game cards: no score text, winner emphasis or accessible-name spoilers.
Open a card to reveal both totals at the top of a wide TV / reflowed phone dialog. Named team
buttons choose separate rosters; Points → Assists → Rebounds lead both stat views. Personal fouls,
minutes, steals, blocks, turnovers and +/− are on Player stats; shooting made/attempted/percentages
and offensive/defensive rebounds are on Shooting & rebounds. Eight players/page, labelled
starters/bench/DNP, reported whole-game totals, explicit missing/stale states and Back to the
same card. No horizontal phone table, tiny TV spreadsheet or extra shared-screen administration.

## Modules (D-112)

D-120 adds Morning Routine in the family rail/More and its adult settings in More, Family planning
and Hearth settings. Up to three person cards share the TV canvas with a vertical countdown; the
remaining fill drops toward the bottom between the configured start and end. Label the remaining
minutes/seconds, start, deadline and weekday state. Use stable numbered rows, visible check/undo
and positive per-person progress, without a combined household step count. Up to seven standard steps
lists fit together even on compact/short TVs; omit the
extra eyebrow and repeated next-step/instruction headings. Announce routine saves without reserving
a permanent status row; errors and refresh actions remain visible. Long routines/participant groups page with accessible
buttons on TV; phones stack naturally. Respect dark mode and reduced motion. Settings choose
people independently of Chores, retain deselected lists, and offer text editing and Up/Down
ordering. Warn on unsaved drafts, retain errors, and reject stale saves/checks with refresh.
On narrow phones, stack Start time and Ready by with full-width native time controls; constrain
each field to its grid cell so Safari's time-picker sizing cannot overlap its neighbour or panel.
The midnight reset derives from the home date, not navigation. See MORNING_ROUTINE_CONTRACT.md.
The scheduled School days/Weekends refinement is defined under D-123 below; the weekday label and
countdown described here apply to the original D-120 defaults, not every assigned profile.

When Daily Bible verse is enabled, Morning Routine adds a compact bottom card beside Today. Keep
its height intrinsic and up to seven standard checklist rows visible on short TVs. A readable excerpt
opens the existing full verse popup; Back returns to the card. Phones place it after
the lists. Missing/stale content has an honest retry/saved state and never blocks the checklists.
Disabling the verse module removes both card and dialog; Today's section visibility is independent.

Six/seven-step compact-TV lists tighten nonessential spacing, place the count beside each name and
omit duplicate sun/progress decoration, with the title in the countdown rail so outer screen insets
stay unchanged. Retain the existing 20px step text, 56px targets and 30px
checks. Focus stays visible inside the close-spaced rows. Exceptionally long labels and lists over
seven retain explicit paging; phones keep normal scrolling. This does not reduce the saved-step limit.

**More → Modules** (also Hearth settings → Modules) is one adult-only page of twelve labelled
On/Off switches, shared styles, large targets and short retained-data copy. No confirmation maze,
per-screen picker or data deletion. Show confirmed state, Saving, a readable failure and safe exact
retry; do not present an unconfirmed optimistic switch. Disabled feature destinations disappear from
phone tabs, TV rail, More, planning/settings and Today, including overlays. If another adult or HA
turns off the current feature, leave it for Today, or Modules for an admin feature route. Core
management stays reachable. Independent Today visibility preferences are retained, not reset.
The one HA approval now also discloses **Turn Hearth modules on and off**. Existing connections without
this capability require one confirmed reconnect; never silently expand them. In HA the household
device has standard module switches that remain usable while their features are off.

## Home Assistant connection directions (D-108)

Connections → Home Assistant separates **Home Assistant controls Hearth** from the existing
**Hearth controls Home Assistant** safety/script adapter. Before approving HA's six-letter code,
show one clear bundle: all current Hearth screens, calendar/chore information and completing or
reopening today's chores (D-111). No permission checkboxes. A limited existing grant shows
**Reconnect Home Assistant**, with confirmation before disconnecting; use the existing HA entry's
connection repair for fresh letters. New screens require reconnect, not automatic access expansion.
The integration creates/exchanges the long credential automatically; no key field/reveal appears
in Hearth or HA setup (D-110). Normalise grouped/lowercase input to uppercase and show clear
expired/retry/cancel states. No code enters query caches/storage. Disconnection needs a clear
confirmation and affects only
this integration, never the adult phone, TV pairing or outbound HA connection.
In HA each approved screen has a tab selector showing the observed route and offline/unavailable
state. Accepted/pending is not applied. No admin/setup destinations or automatic app takeover.
The manual custom-integration installation is not a built-in discovered integration; disclose the
updated native-shell requirement without claiming physical installation or foreground proof.
Disclose the normal effect of chore completion on earned pocket money and the excluded admin,
calendar-edit and broader chore actions. The summary truthfully reports legacy **Read only** grants
until explicitly replaced; new approval includes **Complete and reopen today’s chores**.
HA's **Today's chores** to-do list permits tick/untick only; it never offers Hearth admin access.
No optimistic completion, duplicate commands, silent stale-day writes or false empty lists on errors.

## Appliance setup UX (D-104; browser path local, hardware path future)

The consumer flow is **Scan setup QR → Join home Wi-Fi → Name your household → Save recovery**.
Ethernet skips Wi-Fi configuration. Additional devices stay in **Phones & screens** with distinct
**Add adult phone**, **Connect screen** and deliberate **Replace lost phone** actions. A private
recovery QR or explicitly trusted recovery adult preserves access after phone loss; accidental
main-phone removal remains forbidden. No ordinary NAS console or typed Hearth key/password.
The implemented browser compatibility flow is **Scan private setup card → Name household and
phone → Save recovery**, using the existing trusted HTTPS connection. No typed key field appears
on a valid first-card scan. First-use/recovery fragments are stripped immediately, never echoed
or stored. A used setup card cannot become a recovery card. Native Wi-Fi setup is not simulated.

After owner setup/replacement, open **Recovery & lost phones** in Phones & screens. Elsewhere it
is collapsed by default. Clearly distinguish the protected owner, ordinary Add phone, Connect
screen and deliberate Replace lost phone. Show only exact connected phones eligible for trust;
an adult name alone is not recovery authority. Trusted recovery keeps the approving phone's
identity and explicitly warns that the previous owner will disconnect. Saved-card preparation
offers a private PNG download, acknowledgment and activation; preparing/discarding/closing a
preview never retires an older saved card. No claim that acknowledgment proves a backup exists.
No lost-phone recovery or adult account controls appear on shared screens. Browser-rendered
checks do not establish actual iPhone camera/download or physical commissioning acceptance.
See [the contract](APPLIANCE_ONBOARDING_CONTRACT.md).

## Design target

The operator-only first-start display uses the existing fern and Hearth wordmark, **Welcome to
Hearth**, one large private QR and **Scan with your phone’s camera to set up your home.** Keep the
QR's white quiet zone and television-safe edges, without extra menus. Loading/unreachable status
hides the QR. Verified first-owner claim replaces it with **Hearth is ready** and phone-first
screen-connection guidance. This local presenter is not the anonymous network page or an installed
HDMI appliance/autostart implementation (D-105).

Hearth is viewed on a 65-inch landscape television from roughly two to four metres away. It is not a tablet interface enlarged onto a wall. The initial logical canvas is 1920×1080 and must scale cleanly to a 3840×2160 panel and to ordinary laptop/mobile browsers.

## Original design language

Use a calm domestic visual system rather than an enterprise dashboard or a copy of Skylight:

- warm off-white or deep charcoal surfaces depending on time of day
- charcoal primary text
- eucalyptus green for constructive actions and completion
- clear sky blue for calendar/navigation state
- ochre for attention, not generic decoration
- restrained person colours with labels or avatars as a second cue
- soft depth and grouping, with few large surfaces rather than many cards
- family photography as a first-class visual element

Do not use Skylight artwork, wording, proprietary icons or a screenshot as the implementation template.

## Readability and sizing

- Normal television body text: at least 28 logical px.
- Supporting text: at least 24 logical px when genuinely secondary.
- Major headings/time: 44–72 logical px depending on hierarchy.
- Focusable target height: at least 64 logical px; prefer 72–88 px for repeated rows.
- Maintain a television-safe inset of at least 48 logical px on every edge.
- Do not place essential text over detailed photos without an opaque or strongly graduated treatment.
- Use no more than two dense columns of actionable content on the Today view.

Exact numbers may be refined from real-TV testing, but may not be reduced merely to fit more data.

## Navigation model

Primary commands are Up, Down, Left, Right, Select and Back.

- A persistent navigation rail or dock exposes Today, Calendar, Weather, Chores, Lists, Reminders,
  Meals, selected Home actions and Photos, in that order; Week and Month are views inside Calendar
  rather than competing primary destinations. Reminders are native household records and remain
  available even before the first reminder is created; administration remains phone-first.
- Every household surface shows the live household-local time and date in shared application chrome: in the television rail and in a compact companion header on phone/admin layouts. Individual screens do not repeat their own clock. Pairing and pre-authentication setup remain uncluttered exceptions.
- Phone dates and event titles wrap within the available width. Keep automatic mobile text
  inflation at the authored responsive size while retaining user zoom. The phone navigation and
  page's trailing space share the full home-indicator safe-area allowance, including landscape
  side insets. Use a single fixed bottom anchor, not a competing viewport-height top calculation,
  so the bar stays at the browser's bottom edge as controls expand/collapse and the page scrolls;
  hide it only during focused editing with a keyboard-sized visual-viewport reduction, then restore
  it when that reduction ends. Native editing and pinch zoom remain available.
- The television rail starts with the time and date in place of the Hearth logo/title; no duplicate clock appears in its footer.
- The focused destination and focused action are always visually obvious.
- Choosing a main-menu destination keeps focus on that menu item. Do not automatically highlight
  a page control, including after lazy loading, background updates or a phone-menu tap. New menu
  destinations start at the top. On television, Right explicitly enters the page at its meaningful
  entry control; on phones, touch or Tab chooses the desired control. An early Right waits for
  the selected lazy page instead of entering the outgoing page or losing the press. Another
  menu/focus choice, direction, Tab, pointer interaction or Back cancels that pending entry;
  never replay an activation. Keep the normal visible
  focus treatment once a person deliberately enters the content. Administration's desktop rail
  follows the same rule, including shell changes. Moving along the rail alone does not choose a
  different page: Right returns to the current page unless a new destination was actually selected.
- Television rail rows use a stable inset focus outline, without enlargement or an outer glow that
  the scrolling navigation clips. Apply the same bounded treatment to the rail's Appearance action.
  On short displays, scroll only the rail's navigation region to reveal the current destination
  without moving the clock, footer or page. On resize, a focused navigation row takes precedence
  over the active destination so the remote user's focus never disappears.
  Up/Down follows that single column's menu order through Games before the fixed Appearance footer;
  clipped rows are not skipped merely because the footer is geometrically closer.
- Moving between regions is deterministic; no focus trap or unpredictable jump is acceptable.
- Arrow navigation follows rendered control positions, not fixed cross-screen links; responsive
  reflow therefore changes direction naturally. Hidden, disabled and inert controls are skipped.
  Up/Down stays within the desktop navigation rail; Left/Right moves between rail and content.
  Movement continues through adjacent page content before entering the navigation rail or a fixed phone navigation bar.
  Clearly aligned neighbours take priority over header actions that only graze a row's edge.
  Text fields, selects and screen-specific widgets retain their native/custom arrow handling.
  Direct Calendar entry and Right from the rail focus the selected Week/Month/Agenda selector,
  not an event. Choosing Calendar from the main menu leaves focus on Calendar until Right. Enter
  opens details and Back restores the event that opened them. Arrows and Tab stay inside dialogs.
- Opening a detail page should place focus on its primary meaningful control.
- Back returns to the previous product surface; a second Back at the root may hand control to Google TV after a confirmation or normal Android behaviour.
- A running Home action keeps its guarded busy row focusable so closing a confirmation or receiving
  its result restores the exact action. Further activation remains blocked until completion.
- When normal Google TV app switching resumes Hearth, restore its prior screen and focus when possible.
- Focus state must not rely on colour alone. Use scale, outline, elevation or shape change with reduced-motion support.
- Long lists use page or controlled scroll behaviour and keep the focused row visible.
- Calendar Week keeps earlier/current/later controls available on television and companion screens,
  including empty weeks. Multi-day cards have distinct per-date focus targets.
- Week, Month and Agenda place the heading and displayed date range/year on one baseline when
  space permits, wrapping naturally on narrow screens rather than reserving a second header row.

Touch, mouse and keyboard can work in companion/admin contexts but cannot be the only path.

## Screen map

### Today

The default shared overview:

- time, date, weather and household mode
- upcoming events grouped by time/person
- due-now and due-today chores
- dinner plan
- one active notice
- concise list summary
- an optional bounded summary of all incomplete reminders, ordered overdue, due today, undated and
  future
- one orientation-safe family-photo panel that is large enough to read from the sofa while
  remaining secondary to plans and chores; landscape and portrait sources must remain fully
  visible without distortion, and the photo sits directly on the page without a tinted or
  blurred backing panel
- quick access to selected Home scenes

Adults may independently show or hide Dinner, List summary, Notice, Reminders, Daily Bible verse
and Family photo from the phone-first **Today & notices** settings surface. The verse opens in a Back-safe
reading dialog so a full quotation does not make Today dense; a missing server
key produces a calm unavailable band rather than a broken dashboard. Upcoming plans and due chores
remain the stable core. The reading popup uses Hearth's normal Source Sans font, the passage
reference, unchanged quotation, Close and a compact source link for ESV passages. Publisher and
demo-explanation paragraphs do not appear there. Full Bible attribution is under **More → Credits**,
available to household readers and shared screens without any administration controls. Saved-read
warnings, modal keyboard/Back containment and exact opener focus remain.
The remaining summary bands use the freed width without inflating
their text cards vertically; a photo-only configuration is centred rather than leaving
an unexplained empty column. Television Today is a single non-scrolling dashboard rather than a
vertical document. It selects a bounded composition from the enabled band count and the featured
photo's typed orientation: portrait photos use a substantial right-side rail, landscape and square
photos use a shorter wide panel, and no-photo layouts return the full lower width to summary bands.
Chores occupies the left column and Upcoming the right; that is also their document/phone order.
The two core columns remain equal and share heading and first-card rails. Portrait media begins at
that core upper rail; landscape/square media and the enabled summary bands share one lower rail.
Collapsed modules reserve no track. Every text summary uses content-height sizing (D-119): Dinner,
Lists, Notices, Reminders and Daily verse are only as tall as their displayed text, heading and
normal padding require, with a 60-logical-pixel minimum for readability and remote targeting.
The summary group and cards within each row align to the bottom; a quiet gap above is intentional,
not space to fill by stretching cards. The Daily verse retains its full-width final row (D-118)
and existing Back-safe full-quotation dialog. A lone verse needs only one row. Empty/informational
cards use the same compact treatment when the dashboard exists; a wholly empty Today retains its
existing empty state rather than creating an empty shelf. Hiding a module removes its card/unused
track. Photos retain their independent aspect-preserving fitting rule rather than shrink-wrapping
like text. On phones,
keep natural document flow rather than pinning a card over the bottom navigation or photos.
Filled Today summary/photo cards keep their allocated geometry under television focus; retain the
visible outline and halo, without scaling or lifting the whole card beyond its track.
With neither core module, the optional content takes the whole dashboard rather than preserving an
empty upper row. The Today photo contract carries source dimensions when available. The image fits
its allocated width **and remaining height**, preserves its intrinsic ratio and has no persistent
frame, crop, shadow or backing panel; a transparent sizing slot is not a decorative photo frame.
Landscape media receives a band-count-aware share of the lower rail: it grows when fewer summaries
need horizontal room and remains height-bounded on shorter televisions. Square media stays compact
enough to preserve the core dashboard, while portrait media continues to use the upper right rail.
Enabled bands become balanced tiles without reserving empty rows. The phone keeps its natural
single-column scroll; sufficiently wide landscape companions can pair columns. Tall phone photos
are height-bounded so one preview cannot dominate the whole document.
When more than one approved family photo is available, the Today preview advances after about five
minutes of visible screen time. The Photos screen Pause/Resume control governs this preview for the
current display session as well as the gallery. A hidden document does not consume the interval, and
reduced-motion devices keep the preview static. A reload starts a fresh automatic display session.

The phone-first settings surface keeps this choice direct: it shows the six visibility switches and
notice administration without embedding a second simulated Today screen. Rapid changes are applied
optimistically and serialised so one switch cannot restore another switch's older value. The actual
Today destination remains the authoritative rendered result.

Direct entry can focus the most relevant actionable item. Opening Today from the main menu keeps
focus on Today in that menu until the person deliberately enters the page.
Today derives the visible event/chore capacity from the rendered composition. Full-height
landscape-photo television layouts may use four rows, while their compact-height counterpart and
compact-square television layouts retain three. Portrait, full-height square and no-photo television
layouts may use up to five when the complete dashboard remains inside one viewport. The phone keeps
three; TV canvases below 720 pixels high use two core rows to preserve the lower content.
When four or five summaries include the compact verse, these very short canvases use one core row
so status and retry messages can coexist with readable module cards; the same overflow links
truthfully expose the omitted items. When a separate verse row accompanies other summary cards,
full-height TVs reserve four core rows and compact TVs three. The scrolling companion is unchanged.
Compact TVs with core content use the existing 18px compact body size, single-line card excerpts
and tighter spacing so stale and retry messages fit. Target sizes stay at least 60 logical pixels;
full details remain one action away. Do not hide a failed chore dynamically to fit its Retry message.
A deterministic, focusable `+N more` action reports the complete hidden count and
opens the Calendar agenda or Chores screen. Event rows open the same detail dialog as the calendar
views. Dinner, List summary and the photo preview link to Meals, Lists and Photos; an active Notice
opens its full text in a Back-safe dialog. Back restores the exact originating row, overflow action
or summary band.

### Calendar

- **Week:** primary television planning surface; columns/days must remain legible.
- Week fills the television viewport without page/main scrolling. Header, view switch, status or
  empty messages, shared all-day rows, overflow controls and week navigation reserve their space;
  the timed grid takes the remaining height. Readable card bounds use that measured logical CSS
  height, including the doubled 4K canvas. Cards that cannot fit remain counted in the full-day
  overflow dialog, rather than being clipped or shrinking their text. Short timelines may use
  coarser, evenly divided clock labels while retaining both endpoints. The phone's complete Week
  agenda continues to scroll naturally; it is not compressed into one viewport.
- Week places all-day events in one shared-height band above the aligned hourly timeline. Timed
  cards whose readable rendered bounds would collide use deterministic side-by-side lanes; no card
  may paint over another. The shared clock axis starts with 8 am–8 pm and expands in two-hour steps
  for early/late plans, up to midnight-to-midnight. Overnight plans are clipped to each household-local
  day, with continuation labels and their full start/end range in details; a midnight end is exclusive.
- Week shows at most two all-day rows (fewer when the height budget requires it) and two timed lanes per day. Extra events, including short
  late events that cannot fit a readable card before the axis ends, count towards `+N more` beneath
  that day. It opens the full day list with every event and source, not just the hidden events.
  The list scrolls within a focus-contained dialog; Select opens details, Back returns to the same
  list row, and a second Back restores the Week opener. Left/Right crosses non-empty day columns.
- Week day headings include a compact, read-only forecast icon, rain probability and low/high,
  without a temperature-range bar. Empty timeline days remain blank, without placeholder dashes.
  The phone agenda carries a compact daily cue without compressing its event list. The
  grouped phone presentation replaces the timeline at narrow widths and must never render as a
  second block beneath the television Week timeline.
- **Agenda:** a chronological, rolling four-day view containing today and the next three calendar
  days. It never includes past dates or days beyond that window and therefore has no earlier/later
  period controls.
- **Today:** expanded day with person lanes where useful.
- **Month:** a Monday-first six-week grid beneath Week in the calendar hierarchy. Every date cell
  reserves two compact, calendar-colour title rows and a separate overflow row. Display up to two
  titles and exactly `+N more` when further events exist (`+N` on the narrow phone grid); zero, one
  and two-event days have no overflow count. Do not replace the second title with a count or dots.
  Faces and solid source colours appear once in the persistent Calendar key, not in every cell.
  The six rows grow into the available television height. Compact TV chrome may tighten, but the
  day number, both previews and count must never overlap or clip. Very short/message-heavy
  layouts retain a readable minimum cell height and permit D-pad scrolling rather than hiding
  cell contents. The Earlier/current/Later bar retains Week navigation's geometry. Today and
  focus remain distinct; date buttons expose every title to assistive technology.
- Selecting any Month date (remote OK, keyboard Enter or phone tap) opens the shared full-day
  dialog with all events, their times and owner/source, including empty-day copy when applicable.
  Focus alone only highlights the date. The full list scrolls within the dialog; selecting an
  event opens details, Back returns to the same event, and a second Back/Close restores the exact
  originating date. Phone retains the grid, key and view switch; the old automatic inline agenda
  beneath the grid is replaced by this explicit day-opening interaction (D-101).

Event cards must express start time, title, owner/source and conflicts. Location and notes appear in a focused detail surface.
Calendar event fills are opaque in both themes, retaining source-colour tints without showing grid
lines or other cards through them. Agenda rows likewise use solid surfaces.

### Weather

- Current conditions show temperature, apparent temperature, today's low/high, condition, rain
  likelihood and wind without exposing coordinates or provider machinery.
- One daily midnight-to-midnight chart switches between Temperature, Rain and Wind. The axis stays
  fixed throughout the household-local day; its right-hand midnight starts the next day. A filled
  dot follows the shared household clock each minute, on the forecast curve rather than claiming
  a new observation. Left/Right inspects another hour with a distinct hollow marker; Down changes
  mode. Up returns focus from the chart to its active Temperature/Rain/Wind button without changing
  the graph or inspected hour. Left moves along those buttons and, from Temperature, to Weather
  in the side menu. This bounded D-pad exit works at every hour, including either midnight endpoint;
  Back and repeatedly stepping to the first hour must never be the only escape.
  Right from Wind reaches Previous hour / Now / Next hour. Their arrows return to the graph or
  graph buttons and skip disabled endpoint actions; every visible control stays remote-reachable.
  **Now** or remote Select returns to following time without removing the live dot. A new day's forecast resets
  old-day inspection; an old cached day never receives a misleading current-time dot.
- Temperature plots temperature and apparent temperature. Rain uses two aligned lanes in the one
  active daily graph: a purple probability line on a fixed 0–100% scale, and blue expected-rain
  bars on a separately labelled, zero-based millimetres-per-hour scale. Colour is redundant with
  line/bar shape, explicit lane labels and units. The selected probability and expected amount
  remain visible on phones. Wind plots sustained speed and gusts from zero with direction arrows.
- The next seven days use one shared temperature domain. Each row carries day, condition, rain
  probability, daily maximum wind speed with prevailing direction, low, range bar and high; Today
  also carries a current-temperature marker. Wind wraps to a second line on phones. Missing wind
  reads **Wind unavailable**, not zero; a reported zero reads **Calm**.
- Phone presentation stacks naturally with the full day visible and no horizontal graph scrolling.
  Recompute geometry from the actual plot width and height rather than stretching a desktop SVG;
  labels, icons and round markers retain their proportions. Use fewer ticks/icons on a narrow phone,
  with explicit previous/next-hour controls. Missing samples leave gaps, never fabricated data.
- A tap inspects the nearest available hour without capturing a pointer or taking over page scroll;
  hour buttons and D-pad remain equivalent paths. **Now** restores following. Geometry is measured
  before painting a mode-height change and pointer positions account for the 4K shell's CSS zoom.
  Current low/high labels and the visible Seven days heading clarify the reading order; wide
  weekly rows label rain chance, maximum wind and the shared low–high temperature comparison.
- A stale or offline cached forecast remains visible with one quiet status cue. Provider
  attribution stays in the adult Weather location settings so household-facing Weather and Today
  remain clean.
  Saved/offline status occupies the normal header freshness line, with the saved forecast age
  beside the hour controls; it does not add a banner that pushes days off a compact television.

The Calendar view switch is available on both television and phone in Agenda, Week, Month order.
The Calendar navigation destination and `/calendar` open Agenda by default. Agenda, Week and
Month keep their own stable URLs beneath `/calendar`; the previous
`/week` and `/month` paths redirect while preserving query parameters. Week and Month earlier,
current-period and later controls must perform real provider-neutral queries; Agenda is always
anchored to the household-local current date.
Calendar source setup is directly discoverable from the Calendar toolbar and
the phone More hub.

### Chores and routines

- The television family overview uses dynamic person columns. Three children produce three primary columns; children remain visible with their weekly pocket-money progress and a clear "No chores due today" state on unscheduled days. Additional assignees appear only when they have chores due.
- Keep ordinary daily workloads within one television viewport by tightening row density only as needed, never below the minimum remote target size. Exceptional workloads must not silently hide chores.
- Up/Down moves within one person’s chores and Left/Right moves to the nearest chore in an adjacent person column.
- Personal view with outstanding and completed items.
- One Select should complete an ordinary chore; undo remains available.
- Adults can open detail/reassignment functions; children see fewer controls.
- Completion feedback is satisfying but brief and respects reduced motion.
- Phone administration keeps active schedules compact, opens creation only on request and clearly
  distinguishes **One day only**, daily, weekdays and selected weekly days. Archiving requires a
  second explicit action and withdraws unfinished jobs already due today. Completed jobs remain
  visible; archived schedules can resume without filling the paused interval with new occurrences.
- The phone schedule editor uses an explicit multi-person picker. Selecting several people creates
  one separately completable occurrence for each selected person; summaries name the full assignee
  set rather than implying that one shared completion satisfies everyone.
  New chores start with nobody selected; editing starts with the saved assignee set. Every People
  checkbox can be freely selected or deselected, including the last one. Saving with nobody selected
  shows **Choose at least one person.** beside People, moves focus to the picker and sends no command.
  Choosing a person clears that error without discarding the rest of the draft. Focus alone never
  selects a person; there is no first-child or adult fallback assignment.
  People cards have equal flexible row heights and consistent grid gaps in create/edit forms;
  general form-label spacing must not offset later cards. Names can wrap without clipping, and
  selection or keyboard focus must not change card size.
- The phone schedule editor lets an adult move active schedules earlier or later with substantial,
  labelled controls. That explicit top-to-bottom order is the television order; drag, touch or
  hidden heuristics are never required. New schedules append to the end.
- The schedule editor labels its grouping field **Time of day** and uses one native selector with
  exactly **Morning**, **After school**, **Evening**, **Bedtime** and **Anytime**. Adults do not type
  arbitrary group names; the fixed vocabulary keeps phone authoring and television grouping clear.
- An optional **Available from** and **Due by** pair forms a household-local time window. Either end
  may be used independently; when both are present, the start must be earlier than the due time.
  Previously generated occurrences keep the window and order they were created with.
- A separate phone-first **Chores this week** surface opens today's occurrences one at a time. It
  shows the snapshotted description and due time, requires an adult reason before Skip, Excuse or
  Reassign, explains the pocket-money consequence in family language and keeps newest-first history
  visible. Below it, earlier current-week occurrences are grouped by day so an adult can complete a
  missed chore or undo an incorrect completion. The visible correction list starts fresh each
  Monday; occurrence and audit history remain stored.
- The television shows a compact time window such as **7:00–7:30 am**, **From 4:00 pm** or
  **Due 6:30 pm** as quiet secondary metadata. Rows follow the adult-defined schedule order and
  retain one-Select completion/undo; the television does not expose ordering, exception forms or an
  audit timeline.

### Lists

- List chooser plus focused list.
- Large checkable rows and visible item count.
- Home Assistant Assist can add items through Hearth's typed command API; Hearth does not show a listening control.
- Editing long text is primarily a phone/admin-web action.
- The phone Family Planning surface can create, rename, type, colour, order,
  archive and restore lists; it can edit quantities, order or remove items and
  clear checked history only after explicit confirmation. The television keeps
  only the family check/undo interaction.

### Reminders

- The television and phone show the same Hearth-owned reminder list. Open items are the default;
  **All** may reveal completed items.
- Open/All sits directly above the list, below the creation form, so the form cannot block
  the remote's path back to the filters. Entry focuses Open rather than starting text editing.
  Both filters use the same loaded projection; switching never removes the focused button.
- A household member can add a reminder quickly, optionally choose a due date, edit it later and use
  one clear control to complete or reopen it. Removal requires explicit confirmation.
- Date-only reminders never acquire a misleading midnight time. Open reminders sort overdue, due
  today, undated and then future, with deterministic title ordering within each group.
- Today shows a compact summary and honest overflow link into Reminders. It never consumes all
  lower-band space or causes the appliance dashboard to scroll.
- There is no Apple pairing, selected-list or source-freshness UI.

### Meals

- Seven-day dinner strip or week plan.
- Today's meal receives priority on Home.
- The TV's **Saved family meals** and **Plan another night** actions open real authenticated
  companion destinations; they are not acknowledgement-only controls.
- Phone administration keeps all seven dinner-name fields visible together for rapid planning.
  Saved-meal selection and a note expand per night only when needed.
- Saved meals are searchable, show favourites first, expose optional preparation time/notes and use
  recoverable archive/restore rather than destructive deletion.
- Copying or clearing a week requires an explicit confirmation. One **Save week** action commits the
  displayed seven-night plan together and reports failure without silently dropping entered data.
- Breakfast/lunch and grocery linkage remain available future extensions without cluttering the
  dinner-first television or phone paths.

### Photos

D-106: Today, Photos and ambient start from a shuffled visible-photo order and give every photo
a featured turn before repeating. Shuffle again at each completed cycle and avoid an immediate
repeat at the boundary. Preloading does not consume a turn. Clock/metadata rerenders do not
restart the rotation timer. Preserve the five-minute Today and 45-second Photos/ambient cadence,
Pause/Resume, hidden-tab behavior, reduced motion, native ratios and remote focus restoration.
Favourites stay first in management, not permanently first in playback.

In **Select photos**, replace large curation cards with compact whole-thumbnail buttons: three
columns on phones, a responsive wider grid elsewhere, clear checked state and accessible photo
names. Show at most 48 per page, retain selections when paging, and focus the first tile after a
page change. D-122 also pages ordinary curation at 48 photos, using a two-column phone grid and
wider responsive grids with whole-image previews, compact labelled actions and 44px minimum phone
targets. All/Favourites/Hidden filters reset the visible page without dropping selections; Select
page adds only that page, Clear selection is explicit. Keep bulk counts and exact confirmation.
Imported-original protection, cancellation and partial-failure behavior remain unchanged.

- Full-screen ambient slideshow.
- The normal Photos screen is an orientation-aware full-screen collage rather than a large image
  plus a duplicated thumbnail. The selected or automatically advanced photo remains present while
  Hearth chooses the visible occupants and geometry from every photo's stored width and height.
  The selected photo is a substantial full-height anchor and up to four supports form ratio-derived
  vertical columns. Each leaf retains its exact native ratio; the gallery accepts calm negative
  space instead of cropping, stretching or placing photos in framed cards. A focus halo exists only
  while navigating. Phone portrait uses an orientation-aware mosaic so landscape files span both columns
  while portraits remain tall, rather than stacking several narrow strips. Phone
  landscape shows three substantial images at a time and lets rotation bring the remaining photos
  through, rather than squeezing the five-image television composition into shallow ribbons.
- The collage advances its selected photo and visible occupants every 45 seconds with a restrained
  image settle while recomputing the orientation-aware composition.
  A compact refresh symbol and progress line make the next automatic arrangement legible without
  repeating collection/storage or timing copy on the dashboard; the combined state remains
  available to assistive technology. Manual D-pad/touch selection restarts that interval. A clearly labelled Pause/Resume
  control is reachable by remote and touch, hidden tabs do not consume rotations, and reduced-motion
  mode leaves the collage static.
- Ambient photos have one content-width clock/date and **Back** control, bounded by the safe insets
  rather than a full-width background strip. It reads the shared household clock. Keyboard/remote
  focus is visible on that compact control, never as an outline around the whole photograph or
  viewport. The full-image pointer dismiss area is not a second keyboard/screen-reader stop.
- Immediate remote exit.
- Photo storage/import errors should never reveal filesystem paths or technical details to the household.
- Phone-first Photos administration begins with **Add photos**, opens the native
  multi-select photo picker and reports added, duplicate and failed counts without sending client
  filenames to the server. D-124 restores a 25 MB per-photo limit, supplied by the server capability;
  omit routine limit text in settings and show size guidance only for a rejected file. There is no
  aggregate batch-byte limit. Two transfers may overlap while the server serializes
  expensive preparation. A bounded-height queue distinguishes byte-transfer percentage from
  Preparing photo, counts added/duplicate/failed results, pauses new dispatch while current photos
  finish, and retries failures with their original file/request ID. Accepted files release their
  browser File references. Keep queued/failed retries in page memory only, warn before leaving and
  suppress automatic release reloads while unfinished work exists. No background uploader or new
  permission. The optional folder-import details are collapsed unless unavailable.
- Phone navigation names the two photo intents explicitly: **Photos** opens the gallery
  and ambient display, while a direct **Manage photos** row under Manage Hearth opens upload,
  curation and removal. Adults should not have to enter the display gallery to discover the upload
  surface. Its row, text and icon use the same colours as peer settings in light and dark themes;
  photo management has no special purple emphasis.
- The same surface shows orientation-safe thumbnails, capture date when available and clear
  Favourite, Hide and Restore actions. Each managed-upload card also exposes **Delete** directly;
  adults should not need to discover selection mode to remove one photo. **Select photos** supports
  bulk hide, restore and **Delete selected (n)**. Cards identify whether
  the photo was **Added in Hearth** or came from the **NAS folder**. Permanent deletion is available
  only for Hearth-managed uploads (including hidden uploads), requires a focused confirmation dialog
  whose safe default is **Keep photos**, and removes the managed
  master plus its derivatives. Imported originals remain read-only: the surface explains that they
  must be removed from the approved Synology folder and followed by **Check folder**, or hidden in
  Hearth. Confirmation freezes the exact requested photos even if the library refreshes. Cancel
  makes no deletion request; successful removal refreshes the gallery, Today and activity and returns
  focus to a surviving card or the selection control. Partial failures retain their photos and report
  that they need another try. Every action is D-pad reachable. The optional
  Synology folder-import row is secondary and absent as a prerequisite for normal phone uploads.

### Games → Connections

Games appears in the TV rail, phone Family menu, module switch and matching Home Assistant labels.
`/games` is a game-selection submenu with Connections at `/games/connections`. Main-menu selection
retains focus in the rail; explicit Right enters the submenu. Selecting Connections opens its saved
board. Its visible Back to Games action and remote Back return to the submenu and restore the game
link’s focus; dialogs close first. Puzzle changes replace the query entry so Back does not walk through
boards. Older `/games?puzzle=N` links redirect to that same Connections board. A direct puzzle entry
also has a safe Back destination. The phone’s More tab stays active within the submenu and puzzle.

The module and HA identifier remains `games`; HA opens the game menu and reports either Games
route as that tab. Both routes obey the same module switch. Saved puzzle keys remain unchanged.
Service settings remain a separate Connections entry under Manage Hearth.

- Connections opens Word groups, with a four-column board, a clear selected state and explicit Submit.
  Selecting four tiles never submits automatically. Correct groups replace their row; four misses
  reveal the remaining answers. Repeating the same group does not consume another mistake.
- Shuffle preserves tile identity and selections. A three-correct guess reports **One away**.
  Solved groups show their category and all four tiles, not just a colour.
- Earlier/later and Archive select numbered, dated puzzles. Archive supports search and bounded
  pages, with contained D-pad/Tab/Back navigation and opener focus restoration.
- Fresh devices start at puzzle #1. Later visits resume the last successfully
  loaded puzzle on this device, even if no guess was made or the game has finished. Explicit
  puzzle links override that choice; failed/missing reads do not overwrite it. If a saved board
  is absent from the current archive, fall back to the earliest uncompleted puzzle, then the first.
  Browse in ascending puzzle order.
  Completed puzzles have a visible archive marker/count and a **Next puzzle** action after a win;
  the win remains visible until the player chooses to continue. Replaying does not erase completion.
- Progress survives reload on this device; a fresh puzzle never inherits another puzzle's guesses.
  A completed game can be replayed. Restarting unfinished progress requires confirmation.
- Keep the original Hearth design, no newspaper images, logos, screenshots or replica interface.
  A fixed snapshot never implies a live daily subscription. An unavailable import fails only Games;
  cached boards remain playable offline. No external website is contacted during play.

### Home

- A deliberately curated set of scenes and important states.
- No raw entity IDs.
- Initial actions: Evening, Goodnight and Screen Off.
- Security-sensitive controls are omitted or require adult confirmation.

### Settings/admin

- Household, member, integration and permissions management.
- Optimised for the companion browser rather than the family TV.
- More, Hearth settings, Family planning and Connections share joined navigation rows: a green
  icon, a sentence-case title and a muted chevron. Companion rows use 18px type, a 36px icon and
  a 64px minimum height; long titles wrap without clipping. Family-screen TV menus retain 28px
  titles and 80px targets rather than inheriting the companion scale.
- Admin pages use a shared 32px page title, 22px section title, 16px body/control text and 14px
  labels/help. Standard actions and text fields are at least 48px high with 12px corners; compact
  utility actions remain at least 44px. Image/radio/checkbox widgets retain their own semantics.
  Constructive primary actions use eucalyptus; secondary/cancel actions stay neutral and
  destructive actions use brick. A safe Keep/Cancel choice never inherits destructive styling.
  Use consistent blue keyboard focus without shifting or enlarging companion controls. Theme,
  native editing, readable wrapping and the existing Back/opener behavior remain intact.
- Visible copy is task-first. A heading or control label is not followed by text that merely repeats
  it. Keep explanations only when they affect a decision, explain state, or protect privacy,
  recovery or an irreversible action.
- The TV may show connection status and pairing QR/code but should not expose secrets.
- Paired displays and recognized television browsers expose no administration links, chrome,
  sign-in prompts or recovery controls. This covers Calendar Sources, empty-calendar guidance,
  Lists/Meals management, unconfigured Weather, More/System and the private pairing shortcut.
  Empty calendar/weather/photo states ask an adult to finish setup from their phone. Direct,
  restored, encoded, case-varied and history navigation to administration returns to Today before
  admin chrome or child screens mount. `/admin/appearance` remains a compatible alias to the
  harmless device-local Appearance screen. Phone/desktop controller navigation remains available.
- Signed-out browsers clearly separate **Phone or computer** (code/QR-approved adult connection or
  private owner setup QR, no typed key/password/passkey) from
  **Shared screen** (TV or wall tablet approved from an adult phone). Neither path starts
  automatically. **Connect shared screen** shows three short steps and a six-character code;
  phone More → **Phones & screens** contains the matching **Connect screen** action. Approval
  exchanges only the display's private local proof and opens the family dashboard without adult
  settings access. Expired codes disappear, retry is explicit, and Cancel/Back restores the opener
  without resuming a late request. **First phone or all phones lost?** offers the protected owner
  setup key; it never resets household or TV data and is never a screen sign-in mechanism.
  First household setup is available on private-HTTPS phones and desktop computers; a wide
  window alone never hides it. Actual television browsers are directed to that companion setup.
- Connections > Calendar offers an adult-only, phone-first setup sequence: enter
  an HTTPS CalDAV address/account/app-specific password, test, review the
  discovered names, select the exact calendars, optionally map each to a person,
  then save. Clear the password field immediately after testing. Connected state
  shows only hostname, masked account, selected calendars, owner cues and
  read-only status. Every connected source permanently presents **Calendar
  name → Assigned person → Display colour**. An adult may change those
  assignments at any time without reconnecting or re-entering a password; a
  person assignment uses that member's current avatar and Hearth colour, while
  Whole family uses Hearth's fixed green household mark and family colour rather
  than a member photo. **Edit calendars** securely rediscovers the account using
  its saved server-side sign-in, allowing calendars to be added or removed
  without returning or re-entering the password. **Replace connection** is used
  only when the account, server address or app-specific password changes;
  removal remains a separate explicit action.
- Household keeps timezone and weather location as separate settings. Weather
  setup searches by suburb/postcode or requests this phone's location once,
  shows a family-readable place label, hides coordinates under **Advanced**,
  and requires a successful current-conditions test before Save is enabled.
- Phone More is a genuine hub rather than a direct jump into settings: family
  destinations appear first, followed by a clearly labelled Manage Hearth group and device-local
  appearance. Display and administration verbs stay distinct, including **Photos** and
  **Manage photos**. Navigation rows use their self-explanatory titles without repeated descriptive
  subtitles, keeping each bar slim and scannable. The administration root is named Hearth settings
  so it cannot be confused with the Home Assistant action surface. Settings Back returns to the
  actual opener: More stays More, while a settings-overview entry returns to Hearth settings.
  Nested settings return one level at a time without changing the originating menu's layout or
  options. Header Back pops the existing history entry rather than pushing a duplicate menu;
  reload, browser Back and remote Back retain the same flow and focus restoration. Direct links
  without an opener keep the safe existing parent fallback. **Phones & screens** is one
  connection hub: ordinary QR-approved phones and deliberate D-104 recovery/operator-key fallback are separate from
  shared-screen code approval and confirmed disconnection. Show compact adult rows first, with
  one named-phone setup action per adult. Keep address help, key details and recovery collapsed;
  optional recovery must not show a "Recovery needed" warning on ordinary controller rows.
  Keep existing `/admin/televisions` and
  `/admin/access` links compatible. Pairing previews are explicitly fictional demo-only content;
  they are not a second production connection route.
- Hearth settings groups destinations by family content, household and access, connections and
  displays, then system. Each group is one joined list with a continuous remote-focus order rather
  than a collection of visually unrelated cards. Joined groups use restrained, slightly squared
  corners and title-only rows; detailed explanation belongs inside the destination screen. System
  Health combines database/backup state with path-free Calendar, Home Assistant
  and Photos setup status; it links to the dedicated setup screen instead of
  exposing credentials or raw provider details. When an appliance update is available it appears
  immediately after the health summary, shows the actual blocking action instead of an inert
  button, and uses short release identifiers. Installing a server update requires explicit adult
  consent; its backup/rollback and subsequent client reload are automatic. Scheduled backups are
  automatic; the
  uncommon manual copy action stays collapsed under **Advanced recovery**.
  Progress appears only during an active update. Completion shows a concise installed state;
  a newer release remains installable after that. Cancelling connected-phone confirmation or rejecting a
  command leaves retry available; only a lost installation response starts reconnecting.
- Today & notices lets an adult publish, edit and remove concise notices, choose
  Standard or Important priority, choose a bounded expiry or keep-until-removed,
  and see which eligible notice currently wins. It also owns the six optional
  Today summary switches; on a phone these are full-width joined rows with a compact icon, title and
  trailing switch. It is not a general layout editor.
- Adult pages show **Connected as David/Rachael**, derived from the verified server actor, not a
  key label. **Adult phones** lists independent connection names and owners; **this phone** marks
  the current browser. **Remove** opens a working confirmation and removes only that connection.
  Legacy entries say **Earlier browser**, not an invented handset identity.
- **Phones & screens → Add phone → Choose adult → Show connection QR** creates a short-lived QR.
  The other adult scans with their camera, enters a phone label and requests connection. The
  inviting phone confirms the adult/phone and explicitly approves; the other phone then chooses
  **Connect as Rachael**. The inviter remains David throughout. No password/passkey prompts.
  Screens stay separate, display-only, with the existing six-character approval code.
  List authorized screens with paired and
  last-contact times, without calling them online. Collapse disconnected screen history, preserve
  its records and require explicit confirmation for a currently authorized screen's revocation.

### Appearance and evening comfort

- Offer Light, Dark and Automatic themes as a per-display preference. Automatic follows that
  display's browser/operating-system colour scheme; changing a phone does not silently restyle the
  television.
- Use a warm charcoal canvas and softened surfaces in Dark rather than pure black. Preserve
  member/event identity colours, semantic states and the high-contrast blue D-pad focus treatment.
- Provide Appearance as a device-local control in companion More and as a small remote-reachable
  television rail utility. It must not require administrator authentication because it changes only
  that browser or paired display and cannot mutate household data.
- Appearance uses the normal responsive family-screen shell, not a capped phone/admin column.
  Wide displays keep the television rail and one household clock, with large side-by-side theme
  choices and readable evening-comfort controls; phone widths keep stacked choices and bottom
  navigation. Width determines presentation only, never adult or screen authority. Preserve
  D-pad movement, Back/focus restoration and the compatible `/admin/appearance` redirect.
- Keep evening dimming independent of theme and Home Assistant's Evening scene. It reduces Hearth's
  overall rendered glare, including photos and ambient mode, but does not claim to change panel
  hardware brightness.
- Apply the saved appearance before React renders to avoid a bright startup flash.

## Morning Routine day profiles (D-123)

Settings starts with seven clear day assignments: School days, Weekends or No routine. Switching
between the two profile editors preserves unsaved changes in both. Each has independent people,
ordered steps and a Use a countdown switch; off hides time fields but preserves their saved values.
School days retains existing content and times. Weekends starts empty and untimed. New dates start
fresh, while close/reopen and switching back to a profile retain its dated checks. The family view
labels the active profile, permits untimed weekend checks and hides timer/deadline UI when off.
An unassigned day shows No routine scheduled today. Keep seven-step TV fit, compact bottom verse,
ordinary step order/undo, phone safe areas, dark/reduced-motion and remote navigation. No calendar
holiday inference or live HA alarm changes are included. See MORNING_ROUTINE_CONTRACT.

## Responsive companion

The iPhone Home Screen entry uses Hearth's existing green fern on an opaque warm-cream square,
not the browser's letter-only fallback. Declare an explicit same-origin PNG Apple touch icon on
the shared document, so adding any family or settings route uses the same artwork. Let iOS apply
its own corner mask. D-121 explicitly enables standalone Home Screen web-app launch on iPhone and
iPad, with the same Hearth name and fern artwork and a fresh-launch destination of Today. Keep
portrait, landscape and tablet multitasking available. Installation never connects or promotes a
controller; the existing approval, identity and screen boundaries apply in every browser context.
Do not require removing a working controller, migrate its storage, or add background/service-worker
behavior. Installed-icon refresh and actual Home Screen launch remain device checks, not something
browser viewport emulation proves.

The same web application may present a phone-oriented shell for:

- adding/editing events
- managing one-off and recurring chores, weekly pocket-money amounts, paydays and payment records
- maintaining meals and lists
- uploading/approving photos
- reviewing connection problems
- configuring Home Assistant actions
- managing independent adult phone connections and deliberate lost-owner recovery (D-102/D-103/D-104)

Phones & screens labels the main connection **owner phone**, with **Protected owner phone**,
and never offers Remove for it. Owner settings and an owner-phone QR scan have no
Sign out/Disconnect action. People keeps that owner's adult/admin status protected while leaving
name, colour and photo editing available. Secondary phones retain explicit Remove confirmation;
screens retain Disconnect. The private key form explains that connecting replaces the owner phone
while preserving other phones/screens. No browser can promote itself by changing its label.

The companion is responsive, not a shrunken TV canvas. Phone, tablet and television use the same
components and data, with deliberate responsive compositions rather than duplicated screens. Tablet
household views retain companion navigation and use one or two content columns according to
orientation. At desktop widths, administration uses a persistent settings rail and a wider content
canvas. Phone widths retain the compact bottom navigation and single-column flow.

Pocket-money administration separates standing **Weekly settings** from **Weekly progress**. Each
child's amount and payday are configured once and repeat until changed. A labelled **Week to review**
selector defaults to this week and offers past weeks only; it never makes the standing settings look
week-specific. The screen provides named setup warnings, paid/partially-paid/unpaid states and a
recent payment history. Adults may record a full or partial amount with an optional note. Before
payday the interface warns that early recording is allowed. A mistake opens a reason form and
creates a visible void record; no interface offers silent payment editing or deletion.

## Required UI states

Admin loading and initial failures retain the page title and Back control; recoverable failures
offer an inline **Try again**. A background read failure does not hide available settings or drafts.
Loading chrome remains keyboard-accessible but does not take automatic focus ahead of the loaded
screen's meaningful entry control.
Retry restores a usable screen control after the error node disappears. A short burst of remote
directions through a lazy route load is applied once its controls arrive; activation is not replayed.
Short request deadlines replace endless startup loading with recovery, without bypassing sign-in.
On TV wake or paired cold start, show one calm Connecting to Hearth state while retrying temporary
reachability failures for at most 30 seconds/five attempts. Back always exits; retries stop while
paused. An unresolved outage then offers focused Try again and Change address. Pairing/certificate
problems remain explicit. The web startup gate also retries transient reads twice, saying
“Waiting for Hearth… Retrying automatically.” It never opens household views before a successful
runtime response, and leaves Try again after the bounded retry window.

Meal-week, household, pocket-money-rule, list-add and reminder-create drafts warn before route/history
navigation or page exit. Automatic release reloads wait while a registered draft exists. Successful
list/reminder submission clears only the matching submitted draft, not newer typing. Failed or
unanswered commands keep their original request ID and values when retried.

Incoming meal-plan updates refresh untouched days but preserve edited days. Conflicting days show
**Use latest dinners** / **Keep my edits**, with Save blocked until a choice is made. Pending week
saves temporarily disable dinner inputs. Meals follows the current week through Monday rollover
unless the user intentionally browses; **This week** returns to following. Other weeks use a selected
day label rather than calling a different date's meal Tonight.

Every data-driven surface needs intentional states for:

- first-use/empty
- loading
- stale cached data
- integration unavailable
- permission denied
- offline
- optimistic mutation in progress
- mutation failure with safe retry
- destructive or ambiguous confirmation

Do not substitute raw JSON, spinners without context or toast-only errors.

## Accessibility

- WCAG 2.2 AA contrast for text and controls.
- Visible focus with at least a 3:1 contrast change against adjacent colours.
- Colour is never the only person/calendar/status signal.
- People setup offers a curated twelve-colour Hearth palette. Every swatch has a visible name,
  native radio semantics, and a checked/focus treatment so colour is never the only selection cue.
  Each person's palette, including Add someone, starts collapsed behind a compact Colour row
  showing the current named swatch. Open it only to change colour; collapsing retains the selected
  form value. Native keyboard disclosure/radio interaction and form reset remain supported.
- Each existing person has a clearly labelled profile-photo control. After choosing any
  browser-decodable portrait or landscape image, an accessible modal previews the square crop and
  lets the companion user drag to position and pinch or scroll to zoom. Do not expose three
  technical range controls for this phone-first task. The crop surface itself remains keyboard
  operable: arrows move the image, plus/minus change zoom and Home resets it. Save, cancel, replace
  and restore-original states remain usable on a 390-pixel companion; failure stays inline with
  retry.
- Respect reduced-motion settings.
- Avoid time-limited interaction.
- Announce important state changes to assistive technology in the web companion.
- Use plain, family-readable language rather than home-automation jargon.

## Render verification viewports

At minimum inspect:

- 3840×2160 at target TV scale
- 1920×1080
- 1366×768 for constrained testing
- 820×1180 iPad portrait
- 1180×820 iPad landscape
- 390×844 iPhone portrait
- 844×390 iPhone landscape

The decisive check is real-TV or Android TV emulator navigation using only D-pad and Back.
