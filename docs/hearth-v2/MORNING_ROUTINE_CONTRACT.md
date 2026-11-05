# Morning / Afternoon routines v2 — D-120 / D-123 / D-136

## Morning and Afternoon routines — D-136

D-136 extends this contract to two independently switchable modules: `morningRoutine` at
`/morning-routine` and `afternoonRoutine` at `/afternoon-routine`, with matching adult settings.
The original v1/v2 names remain for wire compatibility. Both use School days/Weekends profiles,
explicit participants, stable step IDs, daily household-local reset, settings revisions, guarded
plain-step versions and exact actor-scoped receipts. Morning defaults/ticks/history are unchanged.
Afternoon starts off, with empty lists for current children, Monday–Friday, countdown off, and no
assigned weekend days. Stored optional timer values start 15:00–17:00. No evening routine is added.

An adult may add an ordinary step or choose one of that person's active assigned chores. A linked
step adds optional `choreTemplateId` to the existing `{id,title}`; omission is not default-injected,
so old request hashes still replay. Each chore may appear once per person/profile; references in
Morning and Afternoon intentionally share one underlying occurrence. Selecting/removing a link
never creates, reschedules, reassigns, archives or deletes a chore. Keep unavailable saved links
editable/removable; newly added references must match an active household chore assigned to that
person. Explicitly deselected people's lists remain saved.

Family reads resolve each reference only against the real Chores occurrence for that household,
child and local date. `ChoreOccurrence` gains optional Hearth `templateId`; no provider identifier.
An absent, cancelled, skipped, excused or other-person occurrence is omitted. Rest days cannot
manufacture a due job. The actual occurrence title and completion are authoritative, not the stored
link label or a routine progress row. The projected row carries a bounded optional `chore` with
`occurrenceId`, current nullable `completionId` and `locked`. Existing chore snapshot/archival rules
still apply, including retained completed occurrences. A new due date starts its own completion.

Checking/reopening a linked row calls the **existing** Chores completion/reversal API with a frozen
request ID and (for undo) the observed completion ID. Its normal authentication, module gate,
permission, audit, transaction and exact-replay rules apply; no second routine completion, earnings
record or receipt wrapper is written. Ambiguous outcomes retain that exact command for manual retry.
The routine plain-step endpoint rejects a linked row. `chore.changed`/`chore-template.changed`
invalidate both routine overviews, and successful UI commands catch up Chores/Today/pocket money.
Plain routine checks remain separate from Chores and earnings. This explicitly supersedes the
D-120/D-123 independence rule only for intentionally selected chore references.

Chores off omits every linked row from both family overviews without accessing the chore repository;
ordinary steps continue. The settings picker is unavailable and references are retained. Each
routine's own off gate hides its routes/menus and rejects reads/writes, retaining settings/history.
Module changes invalidate both overviews to remove stale linked content. No background/offline queue.

Migration **0040** adds empty `afternoon_routine_settings`, `afternoon_routine_progress` (including
profile identity) and `afternoon_routine_receipts`, and extends the module CHECK constraint. It copies
all existing flags exactly and never rewrites Morning settings/progress/receipt JSON/hashes, chore
schedules, completions, payments, device connections or HA grants. Release requires a checked
pre-migration backup; rollback uses its matching v39 database, not a v40 file in an old server.

Afternoon reuses the existing responsive board/editor, seven-step TV layout, honest paging for
longer lists, D-pad rail escape/return, compact Bible verse, dark/reduced-motion and stale/error/retry
states. It has its own headings and greeting. Phone controls remain natural scrolling with the
existing safe time-field layout. Both lists are adult-editable; order guides, never locks checks.

The existing HA weekday Morning alarm is unchanged. Component 1.5.1 understands the optional
`afternoonRoutine` module switch only after a fresh explicit approval (15 current module IDs).
Old responses default it off and legacy grants never gain it. No Afternoon navigation tab, routine
read/check endpoint, HA install/restart, live automation or live household change is implied by this
source change. Add an afternoon alarm only with a separately reviewed contract/change/approval.

The family scan and prepared household-specific admin payloads stay outside source control. Local
fixtures are fictional. Publication, deployment, live list configuration and physical acceptance are
separate evidence gates.

---

Morning Routine is one optional household module (`morningRoutine`) with two fixed profiles:
**School days** (`schoolDays`) and **Weekends** (`weekends`). Each has its own participant selection,
ordered per-person lists, assigned weekdays and countdown setting. Ordinary checklist steps never
change chores, earnings, calendar or medical records, and are not proof an action occurred.
D-136 linked chores use the original Chores completion; see the extension above.

## Schedule and settings

School days defaults to Monday–Friday with the existing 07:00–08:00 countdown. Weekends defaults to
Saturday–Sunday, the same explicitly selected participants, empty lists and countdown off. Existing
school times, selections, step titles/IDs and saved checks are preserved. Before the first save,
all current children are selected; saved selections stay explicit and new people are not silently
included. No household's real routines or photos are seeded into source, migrations or demos.

An adult edits `/admin/morning-routine`. A seven-day selector assigns each day to School days,
Weekends or No routine; a day cannot belong to both profiles. Profile buttons switch editors
without losing either draft. Each editor has its own people, suggested step order and optional
countdown. Turning the timer off retains its saved times. Dates use the home's timezone; school
terms, holidays and one-off overrides are not inferred. Empty day assignments/selections are valid
and retain saved lists. Limits remain 20 people and 12 steps per person per profile, with 80-character
titles. Move up/down and ordinary checkbox toggling remain keyboard/touch accessible.

Save uses one revision for both profiles with compare-and-swap protection. A stale editor never
silently replaces another phone's settings. Failed/ambiguous saves retain the draft and exact
request; leaving warns and release reloads wait. Deselection/reordering/text edits retain stable
step identity. Replacing/removing a step uses a new ID.

## Daily family view

`/morning-routine` chooses the profile assigned to the current household-local date automatically.
It shows that profile's label, participants and steps. Untimed routines remain fully checkable and
show a calm greeting without a deadline, time-remaining bar or Ready by label. Timed profiles use
the existing downward bar: before start show the start time, during the window count down, and
afterward show Time to go without locking unfinished steps. No assigned profile shows No routine
scheduled today. No automatic TV takeover, sound, ranking or punitive late state.

Progress is keyed by household, local date, profile, person and step ID. A new date starts fresh
without deleting history; reopening/restarting preserves today's ticks. Switching day assignments
midday cannot carry a School check into Weekends, even if IDs match. Switching back restores the
original profile's checks. A new command must match today's active profile, current settings revision
and step version. Unknown outcomes retry the original payload; an exact replay returns the earlier
result without mutating today's new profile/date. Old v1 completions without `profileId` refer only
to School days. Auth/module gates still precede receipt lookup; stale/new-profile commands conflict.

The existing TV composition remains: up to three people per page, seven ordinary steps visible
on supported TVs down to 1280×640, explicit paging for longer labels/lists and natural phone flow.
Retain 20px TV step text, 56px targets and 30px checks; do not shrink to fit. Both timed and untimed
profiles support dark mode, reduced motion, D-pad/Back and focus restoration. Save feedback remains
announced, with errors/retry visible. The clock anchors to server time and refetches at foreground/
interval/date change. Saved/offline reads remain visible but stale-day or unconfirmed data disables
new checks. This is not an offline write queue.

When Daily Bible verse is enabled, retain its compact content-height bottom card, independent of
Today's visibility setting. Reuse the existing narrow household/module-gated `GET .../daily-verse`,
shared nonblocking cache/provider/key, attribution/full-text dialog and Back focus. Missing/failed/
stale verse states never block checks. No new provider, persistence or HA authority.

## Typed API and persistence

Schemas are in `packages/shared/src/morning-routine.ts`; date/profile/clock policy is in core.
The existing authenticated/module-gated endpoints remain:

- `GET .../morning-routine`: dated safe overview, `profileId` (nullable), `countdownEnabled`,
  selected people/steps and versions, settings revision, timezone and generated time. `isWeekday`
  remains a calendar fact for compatibility, not authority to enable checks.
- Adult `GET .../morning-routine/settings`: revision, canonical `profiles` and current people.
  The old flat `configuration` remains a derived School-days projection for installed v1 readers.
- Adult `PUT .../morning-routine/settings`: new writes contain requestId, expectedRevision and
  both `profiles`. The v1 body containing `configuration` remains accepted and updates only the
  School-days lists/times, preserving day assignments, timer flag and the entire Weekend profile.
- `PUT .../morning-routine/completion`: existing protected fields plus `profileId` for new clients.
  Connected screens/authorised members may check/undo; HA credentials cannot. The optional v1
  omission is not default-injected into the parsed payload, preserving old request hashes.

Migration **0035** rewrites saved configuration into two profiles, retaining the revision; copies
all existing progress into `schoolDays`; and adds profile identity to the progress primary key.
Existing actor-scoped receipt bytes/hashes are untouched. Migration 0034's tables, audit actions,
atomic setting/check/audit/receipt writes and module flag remain. No new module or credential.
Exact actor/request/payload replay is safe; changed reuse conflicts. `morning-routine.changed`
invalidates the same queries. A checked pre-migration backup is required before live release;
rollback to v34 must restore that matching database snapshot, not read the v35 profile JSON.

## Home Assistant boundary

The existing allowlisted `morning_routine` tab opens `/morning-routine`, which chooses the profile.
Existing approved `morningRoutine` module scope is sufficient; do not expand grants or add routine
content/check commands to HA. The live alarm remains Monday–Friday only; this change does not edit
HA's weekend/music/power branches, wake a screen or execute an alarm as a test. Enabling a weekend
alarm branch later requires a separately reviewed exact automation change and approval.

Source/migration tests, hosted release, private installation, physical viewing and actual alarm
execution remain separate acceptance gates. Local implementation implies no deployment or live
household configuration changes.
