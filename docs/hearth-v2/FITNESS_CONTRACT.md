# Fitness v1 — D-128

Optional `fitness` module, off by default for existing and fresh homes. Hearth owns the plans and
check history. No health provider, wearable, HA workout command, medical advice, calories, body
measurements, chores or pocket-money integration. An adult controller chooses participants and edits
plans. Connected household screens and phones can check/undo today's sessions. All content is visible
to the household; this is not a private personal health record.

## Plans and scheduled-day streaks

Each of up to 20 selected people has up to five long-term goals (title, optional target date and
achieved flag), a weekly focus and up to 14 recurring workouts. Each workout has a stable ID, title,
activity (running, swimming, weights, fitness class), chosen weekdays, optional duration/distance,
notes and up to 20 ordered exercises (name, nullable kg, sets and reps). Empty weights mean no weight
specified; zero is explicit. Plans start empty. Unselecting retains their editable plan/history.

First setup applies today. Later edits take effect tomorrow in the household timezone, disclosed
before save. Repeated edits before tomorrow replace that pending plan. Effective-dated snapshots
preserve historical schedules/details; future previews are not historical records. No past/future
completion entry in v1. Atomic revision/version checks reject stale edits/checks. Today's plan and
checks survive editing and restart. Archiving a person hides their view without deleting history.

The owner explicitly chose **consecutive scheduled workout days**. A date succeeds only when every
workout scheduled for that person on that date is checked. Rest/unselected days are skipped. A missed
scheduled date breaks the streak after local midnight; today's incomplete work does not prematurely
break it. Undo today recalculates the streak. Show current and best streak plus this week's session
count. Module off retains schedules/history and stops access, not the passage of scheduled days.
No rankings, guilt messages or rewards. A tick is self-reported, not proof of exercise.

## Contract and storage

Shared Zod schemas in `packages/shared/src/fitness.ts`; pure schedule/streak logic in core.
Migration 0036 adds Fitness to module flags and separate effective plan, progress and receipt tables.
No existing data conversion/deletion. Existing SQLite backups cover all Fitness records.

- Household `GET .../fitness`: current local date/timezone, this Monday–Sunday week, selected people,
  goals, weekly focus, daily sessions/details/progress versions, effective plan revision and streaks.
- Adult `GET .../fitness/settings`: latest plan/revision/effective date and safe people list.
- Adult `PUT .../fitness/settings`: `{requestId,expectedRevision,configuration}`.
- Household `PUT .../fitness/completion`: `{requestId,localDate,memberId,workoutId,planRevision,
  expectedVersion,isCompleted}`.

All paths require existing household authentication and the enabled module before any feature I/O.
Adult settings also reject screen/mixed credentials. Commands use actor-scoped immutable payload
hashes and transactionally write state, exact result receipts and content-free audits. Changed ID
reuse conflicts; an exact retry replays even after midnight but cannot bypass auth/module revocation.
Emit `fitness.changed` after commit. Cache eviction and route guards follow existing Modules rules.
No offline write queue: keep saved reads, disable new ticks while stale/offline, retain an ambiguous
request exactly in page memory for retry. Adult drafts survive refetch and block accidental navigation.

HA may switch Fitness only after explicit fresh approval with `fitness` in moduleIds; legacy grant
scope stays frozen. The matching optional component catalogue adds its switch, not workout data or
completion access. No new HA navigation tab in this slice. No live HA installation/reconnect implied.

## Presentation and proof

Family route `/fitness`: person selector, goals/weekly progress, seven labelled days and paged daily
workout cards. Icons always have text equivalents. Select a workout for readable notes and exercise
name/kg/sets/reps, check/undo and Close/Back with exact opener focus. Long details scroll with arrows and let focus leave at either edge; phones
scroll naturally. Adult `/admin/fitness` uses ordinary controls with explicit people/day selections,
expandable workout editors, move-up/down exercises and clear save/effective-date feedback.

Prove strict validation, local-date rollover, rest/missed/multiple-session days, undo, historical plan
changes, restart, exact/conflicting retries, auth/household/module isolation and retained data. Render
phone/tablet/TV light/dark, long/empty/error states and keyboard/D-pad detail/Back flows. Local tests,
published release, private deployment and actual phone/TV acceptance are distinct. Rollback before
0036 requires the matching pre-upgrade database backup. No runtime/network or deployment change is
part of local development.
