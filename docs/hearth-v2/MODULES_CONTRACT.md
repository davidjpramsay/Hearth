# Household Modules v1 — D-112

An adult requested simple household-wide switches, preserved data, no disabled-module access from
Hearth or Home Assistant, and explicit HA switches that can restore a module. This is feature
availability, never a substitute for authentication or household authorization.

## Fixed modules and core

`calendar`, `weather`, `reminders`, `chores`, `lists`, `meals`, `home`, `photos`, `games`, `notices`,
`dailyVerse`, `nba` (D-113), `morningRoutine` (D-120), `fitness` (D-128). Morning Routine is independent of Chores.
It defaults off; missing legacy fields also mean off. Chores includes its existing routine groups,
occurrences and pocket money. Home means the outbound Home
controls feature, not inbound HA pairing/module management. The original eleven flags default true;
NBA defaults off, including missing legacy wire fields. Existing Today visibility preferences remain
independent and retained (notably Bible verse still defaults hidden on Today).

Today/clock, More, Modules, household/people, phones/screens, pairing/recovery, connections to the
inbound HA bridge, audit, system health/update and authentication stay available. A household with
every module off must remain manageable. This does not implement per-device customization, plugins
or an arbitrary layout system.

## Typed transport and persistence

Source of truth: `hearth/packages/shared/src/modules.ts`.

- `GET /api/v1/households/{householdId}/modules` → `{householdId,enabled:{all fourteen booleans}}`.
  Same normal household-read authorization as Today, including paired screens; no module content.
- Adult `PUT /api/v1/households/{householdId}/modules/{moduleId}`: strict `{requestId,enabled}` →
  `{configuration,audit,replayed}`. Administrator/controller/origin checks remain in force.
- HA `PUT /api/v1/home-assistant/modules/{moduleId}`: identical input/result, dedicated automation
  auth and `controlModules` plus the module in approved `moduleIds` required. Legacy grants retain
  their frozen eleven IDs. Household/actor come from the credential, not input.
- Append-only migration 0032 stores explicit overrides and durable actor-scoped request receipts.
  Missing legacy overrides mean enabled; NBA means off. Toggling never deletes feature records, provider config or grants.
  Exact retry returns its original receipt without reapplying an older state; changed reuse conflicts.
  Each accepted new command audits `module.update`, with the module ID and actor/source but no
  private content/credentials. Emit `modules.changed` after commit; cap HA new commands at 30/minute.

## Enforcement

Hide disabled navigation, full routes, management entries/controls, Today cards/headers/dialogs and
photo/game fullscreen/ambient entry points. An already open disabled route leaves for Today (admin
feature routes return to Modules); do not strand focus or drop an unfinished unrelated form.
Module management itself remains visible to adults and is never visible on paired screens.

Server gates every feature endpoint, including direct asset/download/command routes and legacy
assist routes, after existing authentication and before feature I/O. Reject with 403
`MODULE_DISABLED`. Aggregate Today/admin/status/assist projections must omit disabled content and
avoid disabled provider fetches, photo scans, calendar refreshes or occurrence materialization.
Retain independent Today visibility preferences, but return effective sections/empty arrays/nulls
while disabled. No hidden feature writes are allowed through old clients or cached HA permissions.
In-flight provider reads cannot be recalled; recheck enabled state before returning their content
or committing a new action. Core audit/backup history is retained, not erased by a feature toggle.

HA state includes `modules` (the current flags) and `permissions.controlModules`. Chore/calendar
data become null while off, corresponding commands/ranges reject, and disabled screen destinations
cannot enqueue or deliver (including an already pending command). HA select options omit disabled
tabs; always retain Today and More. A module switch remains available even while its feature is off.
No disabled feature data should enter an entity/attribute/cache as successful readback.
Previously successful reads already copied into HA history or a disconnected browser cannot be
recalled. Connected UI changes propagate through realtime/poll catch-up; the server rejects new
feature access after the off command commits. This switch does not erase another system's history.

## Explicit authority and compatibility

`controlModules` defaults false when absent in stored grants, pending approval records, input and
old DTOs. Current one-approval setup explicitly discloses and sets it true; no checkbox is added.
Existing grants need deliberate reconnect/fresh adult approval to gain this new capability. The
new field is stored in existing grant/pairing JSON; no update that broadens existing rows is allowed.
HA module switches use only this capability. They cannot manage people, phones, credentials,
provider configuration, financial settings or arbitrary admin endpoints. Revocation still blocks
all actions, including exact retries. Existing current-feature scopes keep their original meaning.

The matching manual HA component adds only approved household Switch entities (eleven legacy,
up to twelve after D-113 approval, thirteen after D-120 approval, fourteen after D-128 approval), using observed state,
bounded exact-retry requests and coordinator refresh; no optimistic state. Older server responses
without module fields mean all enabled and no module-control authority. Updating code alone does
not install HA files or authorize live switches, pairing, data changes or deployment.

## Required proof

Persistence/restart, defaults, exact/conflicting retry and audit; admin/screen/HA/cross-household
isolation; all eleven off/on retain existing records; disabled endpoint and aggregate content/I/O
denial; module-off/pending-navigation and data-read races; no silent HA upgrade; manual and HA
module writes; phone/TV light/dark, keyboard/D-pad, realtime route exit and all-off recovery.
Unit/fake/demo/CI proof stays separate from actual iPhone, TV, HA installation and private deployment.

Fitness defaults off, including missing legacy DTO fields. It gates `/fitness`, `/admin/fitness`
and all Fitness API/settings/completion paths; off retains plans/history. HA 1.5.0 creates its switch
only with explicit new `fitness` approval. No workout data or completion authority is included.
