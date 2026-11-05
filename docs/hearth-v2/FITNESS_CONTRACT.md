# Fitness v1 — D-128

Optional `fitness` module, off by default for existing and fresh homes. Hearth owns the plans and
check history. No health provider, wearable, HA workout command, medical advice, calories, body
measurements, chores or pocket-money integration. An adult controller chooses participants and edits
plans. Connected household screens and phones can check/undo today's sessions. All content is visible
to the household; this is not a private personal health record.

## Plans and scheduled-day streaks

Each of up to 20 selected people has a weekly workout list and up to five **optional** long-term
goals (title, optional target date, achieved flag and optional weekly focus). A person may have
up to 14 recurring workouts in total, either standalone general fitness or linked to their own goal
(D-138). Each workout has a stable ID, optional goal ID and title,
activity (running, swimming, weights, fitness class), chosen weekdays, optional duration/distance,
notes and up to 20 ordered exercises (name, nullable kg, sets and reps). Empty weights mean no weight
specified; zero is explicit. Plans start empty. Unselecting retains their editable plan/history.
The daily view combines due general-fitness workouts and active goal routines, labelling linked
workouts with their goal. Achieved
goals retain their routine but stop scheduling from their plan's effective date; reactivating resumes
on the same next-day boundary. Removing a linked goal confirms unlinking its workouts to general
fitness; it never removes those workouts or history. A previously achieved goal’s unlinked workouts resume at the next-day boundary.
Streaks remain per person across all goals, rather than awarding multiple streaks for the same day.

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
The goal-routine refinement uses optional `goal.weeklyFocus` and optional nullable `workout.goalId`
within existing configuration JSON, without another migration. Validate references against the same
person's goals. Omitted fields stay omitted (no parser defaults on stored/request fields), preserving
old exact-request hashes and receipts. Missing/null goal IDs are ordinary standalone general-fitness
workouts. Preserve person-level weekly focus, sessions and history; no automatic goal or ID rewrite. New UI workouts default to a null goal.
Optional association/unlinking preserves workout IDs and current/past progress. No schema, receipt-hash
or scheduling-rule change is required; omission stays omitted until intentionally edited.

- Household `GET .../fitness`: current local date/timezone, this Monday–Sunday week, selected people,
  goals with their own routine arrays, legacy weekly focus, daily sessions/details/progress versions,
  effective plan revision and streaks. Each session includes nullable `{id,title}` goal metadata from
  that date's effective plan; later title changes never rewrite a past session's label.
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

Family route `/fitness` shows all selected participants together, with a shared Monday–Sunday selector
opening today. Each person has an avatar, daily progress, scheduled-day streak and up to four broad
activity buttons: Run, Swim, Weights and Fitness class. Multiple workouts of one activity are grouped
only for presentation: opening the activity shows every original session and its goal, quantities,
notes, exercises and separate check/undo. There is no bulk completion or change to IDs/receipts.
Progress opens that person's current/best streak, weekly count and any optional goals/routines;
no-goal plans show general fitness without a setup prompt.
Five participants with all four activities fit on one supported landscape TV viewport, including
1280×640. Phones stack readable panels and tablets reflow; larger households remain on the same
page with natural scrolling rather than a person picker or hidden participants. Icons have text
labels. Long details scroll with arrows; Close/Back restores the exact activity, and demonstration
Back restores the exact exercise and scroll. No video is required for instructions.
Adult `/admin/fitness` starts with one person’s compact weekly workout list. People is a collapsed
disclosure (open on first use); goals are a separate collapsed optional section. Add workout needs only
an activity and explicit days; the activity supplies a sensible editable title. Row summaries retain
name/day cues and show paused achieved-goal state. Minutes, distance, custom title, notes, optional goal
link and ordered exercises/demonstrations sit under Exercises & details. No nested goal/workout editor
or earlier-unassigned warning. Keep move-up/down, draft/conflict/ambiguous-save retry behavior and
clear first-save/next-day feedback. Invalid collapsed workouts open with a usable error/focus path.

Prove strict validation, local-date rollover, rest/missed/multiple-session days, undo, historical plan
changes, restart, exact/conflicting retries, auth/household/module isolation and retained data. Render
phone/tablet/TV light/dark, long/empty/error states and keyboard/D-pad detail/Back flows. Local tests,
published release, private deployment and actual phone/TV acceptance are distinct. Rollback before
0036 requires the matching pre-upgrade database backup. No runtime/network or deployment change is
part of local development.

## Exercise demonstrations — D-129

An explicit narrow exception to the general media-player exclusion: Hearth can play adult-uploaded
exercise demonstrations inside Fitness. No provider search, streaming-service embedding, external
URL, Jellyfin, Music Assistant, Cast, Android intent, native full-screen playback or HA command is
added. No clips are preloaded; the committed test MP4 is an original generated test pattern only.

A household owns one reusable library of up to 100 named exercises with optional plain-text
instructions and one optional clip each. `exercise.libraryExerciseId` is optional/nullable; omission
stays omitted, preserving earlier plan/receipt hashes. Linking is explicit, never by name. The editor
copies the library name into the workout; kg/sets/reps remain personal plan values. Selecting a link
uses the existing first-save/next-day plan boundary. Library instruction/clip replacements apply
immediately to all references. Removing a library entry/clip preserves plan names, quantities,
completion history and streaks. Retired IDs cannot be reused; unchanged historical links may remain
in edited plans but a new invalid/foreign link is rejected. Missing clips fall back to instructions.

Shared schemas: `fitness-library.ts`. Migration 0037 adds library entries, actor-scoped receipt and
retired-ID tables. `FitnessLibraryService` stores metadata/receipts/audits in SQLite; clips live in
`fitness-media/` beside the database, inside the existing data volume. Generated names, directory
mode 0700 and file mode 0600; no original filename or arbitrary path is stored. Metadata commit
follows writing and flushing the bounded file and directory; transaction failure removes the new file. Successful replacement
removes old bytes; startup sweeps only generated unreferenced files in that directory. A crash can
leave an inaccessible orphan until restart. No background worker or extra container mount.

Adult controller commands (all under `/api/v1/households/{householdId}/fitness`):

- `GET /exercises`: household library. `PUT /exercises/{exerciseId}`:
  `{requestId,expectedVersion,name,instructions}`; version 0 creates.
- `PUT /exercises/{exerciseId}/demonstration`: raw `video/mp4` with `X-Hearth-Request-Id` and
  `X-Hearth-Exercise-Version`. Maximum 25 MiB per clip, ten minutes, 512 MiB active clips per home.
  Container validation accepts a self-contained nonfragmented H.264/avc1 video (up to 3840 px per
  axis), optional AAC/mp4a audio. It rejects external data references, encrypted/other sample types,
  malformed box bounds and unsupported tracks. This is bounded structure validation, not decoding
  or transcoding; browsers can still reject damaged/unsupported bitstreams with a recoverable error.
- `POST /exercises/{exerciseId}/remove-video` and `/archive`:
  `{requestId,expectedVersion}`. Return `{exercise,replayed}` (null for archive).
- `GET`/`HEAD /demonstrations/{assetId}`: household and module gated, same-origin MP4, single byte
  range 206 or unsatisfiable 416; private/no-store and nosniff. No secret in URLs. Module off blocks
  every new media request and closes the UI player. Bytes already delivered cannot be recalled.

Mutations authorize adult/household/module before upload allocation, then recheck before execution.
At most two upload requests in flight per server; 120-second upload deadline. Playback responses have
an absolute 30-second deadline to bound module leases; range retries support slow/interrupted clients.
Exact commands hash metadata plus exact uploaded bytes and replay the original receipt; changed
reuse and stale versions conflict. Files are not duplicated on retry. Every successful new command
has a content-free audit and `fitness.changed`; no workout completion side effect. No offline queue.

Adult `/admin/fitness/exercises` has create/search/edit, upload/replace/remove, draft protection and
exact in-memory retry after an ambiguous failure. Reloading loses an in-flight file/request; refresh
library state before making a new change. Workout editors choose the reusable entry. A connected
screen has watch-only access. Exercise rows open an in-page dialog with Play/Pause, Replay and Back.
Explicit playback only, inline on phones, silent with visible written instructions; no autoplay.
Media events determine control state. Back returns focus/scroll to the same exercise; closing,
page-hidden or unmount pauses/releases the clip without resuming automatically. Removed clips leave
a clear Back path. All ordinary instructions remain available without a video.

Backup/rollback: a SQLite-only backup contains metadata, **not** clips. Back up the complete stopped
data directory including `fitness-media/` for a consistent recoverable library. Portable installer
checkpoints already copy the complete data tree; Synology's protected update rollback is database
only, so it is not a demonstration-library backup. Before an approved upgrade take matching full
media/data backup as well. Do not restore an older metadata database against a newer media tree;
old referenced files might have been replaced, and startup orphan cleanup follows the restored DB.
Downgrading below 0037 requires its matching pre-upgrade database/media snapshot.
