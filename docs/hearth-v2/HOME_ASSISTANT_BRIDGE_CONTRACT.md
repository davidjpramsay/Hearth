# Home Assistant → Hearth bridge v1 (D-108)

## Fitness catalogue extension (D-128)

Component 1.5.0 adds only the `fitness` module switch (off by default). Approval accepts up to fourteen
IDs, without changing frozen legacy IDs or existing grants. No workout read/check or Fitness tab
command is granted. No new installed component/reconnect is implied by local source verification.

## Morning Routine extension (D-120)

Component 1.4.0 adds `morning_routine` → `/morning-routine` and module `morningRoutine` (off by
default). The tab and switch require that exact module in the explicitly approved moduleIds list;
legacy grants remain frozen. New approval may contain thirteen IDs. Routine contents and completion
writes are not HA endpoints. The screen still must be visible/online, enabled and explicitly
approved, and acknowledgement still proves applied navigation. See MORNING_ROUTINE_CONTRACT.md.

## NBA catalogue extension (D-113)

Module control carries an immutable approved `moduleIds` list. Missing means the original eleven,
not the evolving catalogue. Fresh adult approval includes today's twelve IDs and may grant NBA's
switch; `controlModules` is still required. Old grants/persisted pairings/retries retain their scope.
No HA NBA statistics or screen-navigation command in this slice. Component 1.3.0 validates the
optional field and only creates approved switches. A local source update is not live installation,
restart or reconnection. See [NBA_CONTRACT.md](NBA_CONTRACT.md).

This opt-in local integration is separate from Hearth's existing outbound Home Assistant
safety/script adapter. It grants no adult login, provider access or general household write authority.
The D-109 extension permits only today's chore completion/reopening. D-111 includes this in one
explicitly approved setup bundle; it does not broaden existing grants or the transport.
D-112 adds separately scoped fixed module switching under [MODULES_CONTRACT.md](MODULES_CONTRACT.md).
Home Assistant still owns TV power, app launching and media. The bridge only navigates Hearth
while its paired display is already open and visible; it never launches or interrupts another app.

## Authority and setup

An authenticated administrator approves the disclosed bundle in Connections → Home Assistant:
all currently paired unrevoked screens, chores/calendar information, today's chore status changes
and turning household modules on/off. The UI sends every current screen ID (maximum 20) and all four
permission flags true. Zero screens
still permits data/chores; exceeding 20 blocks approval. No checkbox picker is shown (D-111).
The separate stored `controlChores` permission still requires `shareChores`; old grants/defaults
remain unchanged. It permits completing/reopening today's existing chores, not chore creation,
deletion, assignment, schedule, exception, account,
calendar-edit or pocket-money management rights. Ordinary completion changes still affect earned
pocket money through Hearth's existing domain rules. Under D-110 the HA integration generates a random
32-byte `ha_` key privately and exchanges it automatically after adult approval. The phone never
generates, displays or asks the adult to copy that credential.
The server stores only its SHA-256 digest. One active grant per home; revoke before replacing it.
The key belongs in Home Assistant's protected config entry, never in chat, URLs, entities or logs.
Installing the included custom integration and changing live HA/NAS configuration require approval.
This is not a built-in/automatically discovered HA integration and needs no MQTT broker.

### Six-letter device approval (D-110)

HA accepts the trusted private HTTPS root, displays six letters and waits. The adult enters those
letters in Hearth Connections → Home Assistant, reads the included access and approves a setup they
initiated. Existing limited grants require confirmed disconnect and fresh approval through the HA
entry's reauthentication repair, not a duplicate entry. Newly paired screens also require reconnect;
future capabilities are not automatically granted. Approval/retry freezes the disclosed screen set.
Closing HA's dialog cancels its task/session. Unexchanged requests expire without access.

- Machine `POST /api/v1/home-assistant/pairing-requests`: strict `{requestId,secret}` →
  `{id,code,expiresAt,interval:3}`; no Cookie, Origin or Authorization accepted.
- Adult `POST .../home-assistant-bridge/pairing-approvals`: strict
  `{requestId,code,screenIds,shareChores,shareCalendar,controlChores,controlModules,moduleIds}` →
  `{approved:true,expiresAt}`; normal controller/household/origin checks. Binds the exact
  approving connection and session hash, not an adult name.
  Omitted `moduleIds` retains the frozen eleven-module legacy scope; the current UI explicitly
  approves twelve. The state response exposes the approved list, never an inferred future scope.
- Machine `POST /api/v1/home-assistant/pairing-requests/{id}/exchanges`: strict `{secret}` →
  `{state:"waiting",receipt:null}` or `{state:"connected",receipt:{connection,replayed}}`.
  Only the original secret can exchange. Commit rechecks phone/session expiry and revocation,
  capabilities, selected screens, request expiry and cancellation. The immutable machine request
  ID binds one grant; changed approval fails.
- Five-minute lifetime, 64 retained requests, 10 starts/approvals and 240 exchanges per IP/action
  per five minutes, 2,000 total requests per five minutes and bounded IP tracking. Poll every three
  seconds. CSPRNG alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ`; migration 0031 stores code/secret digests.
- Start-response retry reveals the same code only in the same server process. After restart,
  start a new request; approval/exchange metadata survives until expiry. Exact exchanges replay one
  durable grant. Revocation cancels approved pending requests; an old revocation retry must not
  cancel newer approvals. Never accept a short code as a device credential or owner/adult proof.
  Approval and its secret-free `home-assistant.bridge.approve` audit event commit together;
  exact approval retries do not duplicate that event. Disconnecting pending approval is audited
  without falsely claiming a grant was enabled. An approval in flight cannot outrun disconnect.

Admin endpoints (normal adult authority, no shared-screen fallback):

- `GET /api/v1/households/{householdId}/home-assistant-bridge`: safe grant summary or null.
- Legacy compatibility `POST` same path: `{requestId,secret,screenIds,shareChores,shareCalendar,controlChores,controlModules}`. Missing
  `controlChores` and `controlModules` in legacy grants default to false; existing grants are never upgraded. Request IDs are
  idempotent; changed reuse conflicts. Response `{connection,replayed}` never echoes the key.
- `POST .../home-assistant-bridge/revocations`: `{requestId}`; immediately disables all grants/commands.

## Home Assistant transport

Use `Authorization: HearthAutomation ha_<43 base64url characters>`, without browser cookies.
Any request carrying this scheme outside the exact bridge routes fails closed, even if an adult
cookie is also supplied. TV Bearer and adult cookies are not accepted on automation routes.
Responses are private/no-store. Version 1 exposes:

- `GET /api/v1/home-assistant/state`: `{version:1,generatedAt,household:{id,name,timezone},
permissions:{shareChores,shareCalendar,controlChores,controlModules,moduleIds},modules,screens,chores,calendar}`.
- `PUT /api/v1/home-assistant/modules/{moduleId}`: strict `{requestId,enabled}` →
  `{configuration,audit,replayed}`; requires `controlModules`, not data sharing. Fixed module IDs
  and all flags follow MODULES_CONTRACT.md. Exact retry is durable/actor-scoped; changed reuse conflicts;
  30 new commands/minute. A module-off command cannot disable core management or its own switch.
- `POST /api/v1/home-assistant/screens/{deviceId}/navigation`: `{requestId,tab}` →
  `{command,replayed}`. Only explicitly approved, unrevoked screens; no arbitrary path/URL.
- `GET /api/v1/home-assistant/calendar?start=<ISO instant>&end=<ISO instant>`: at most
  31 days, exclusive end. `{freshness,events}`; explicit error if the bounded result overflows.
- `POST /api/v1/home-assistant/chores/{occurrenceId}/completion`:
  `{requestId,localDate,isCompleted,completionId}` → `{id,localDate,state,completionId,replayed}`.
  Requires both chore permissions and the current household-local date for new commands. Only
  existing occurrences on that date may change. Complete with `completionId:null`; reopen with
  the exact observed completion ID, so a stale action cannot undo a newer completion. Locked,
  skipped, excused and cancelled chores keep the existing domain restrictions. No TV need be on.
  Exact request-ID/payload retries return the original receipt, including after midnight; changed
  ID reuse conflicts. Inputs are durably bound before execution, with crash recovery from the
  existing atomic domain receipt. Requests are namespaced by grant. Revoke blocks retries too.
  New commands are capped at 30 per minute per grant. Audit actor is the existing Home Assistant
  service with source `automation`; chore and pocket-money realtime changes use existing events.

Screen: `{id,name,online,currentTab,lastSeenAt,command}`. Command:
`{id,tab,status,createdAt,expiresAt}`, status pending/applied/expired/superseded/cancelled.
An accepted command is not proof of navigation. Only a subsequent authenticated report of its
ID **and** tab marks it applied. Duplicate request IDs replay the original command, never enqueue
again. Commands expire after 30 seconds and cannot transfer to a new browser instance or grant.
Only an already reporting visible screen (last heartbeat within 15 seconds) accepts a new command.
Command rate is bounded to 30 new requests per minute per connection; receipts retained for 24h.

Chores (when allowed): today's household-local date, open/completed counts and at most 250
`{id,title,assignee,state,completionId,locked}` items, with an explicit `truncated` flag.
Completion IDs are supplied only with chore control (otherwise null); they are concurrency
identifiers, not credentials. No money, member account permissions, avatars or audit data.
Calendar (when allowed): next seven
days and cached freshness; events `{id,title,start,end,startLocalDate,endLocalDate,allDay}` only.
No provider IDs, URLs, notes, location, credentials or recurrence internals. Calendar range reads
share this safe projection and return at most 2000 occurrences. Disabled shares return null and
their specific endpoints reject access. Freshness is not upgraded when upstream data is stale.
Household flags additionally gate content/commands even if their original scopes were approved:
off means null projections, unavailable entities and no disabled navigation delivery. Existing
feature-command retries cannot bypass off. Old state DTOs default modules on and module-control
authority false. New grants require deliberate reconnect, not a silent permission upgrade.

## Paired display protocol

`POST /api/v1/device-sessions/current/presentation` uses only the existing TV credential/cookie.
Body: `{instanceId,tab,acknowledgedCommandId}`; nullable tab/ack, strict allowlist. Response:
`{serverTime,command}` (pending command or null). Clients use serverTime and monotonic elapsed
time for command expiry rather than trusting TV/server wall clocks to agree. The server derives household/device from the credential,
not the body. A browser instance ID is correlation, not a credential.

The visible shared screen polls every two seconds, serially and with cancellation on hide/unmount.
It reports observed routes, navigates only the shared route map, then acknowledges after the new
route renders. No `admin`, setup, credential, photo mutation or Android intent destination exists.
On reload, reconnect, revocation, expiry or instance mismatch no old command may be applied.
Reported route/heartbeat is application presence only, not authoritative TV power/media state.

## HA entities and evidence

The custom integration uses config flow + coordinated polling, one Hearth household device,
per-screen child devices with a `select` for visible tab, read-only chore count/detail sensors,
and a read-only calendar entity. With chore control enabled, a household **Today's chores** to-do
entity allows status changes only (no add/delete/rename/reorder); it omits locked and non-actionable
states and becomes unavailable on stale-day, truncated or failed data rather than implying an
empty complete list. It preserves each occurrence ID and the observed completion ID, refreshes
after accepted commands, and never optimistically updates chores. A select reflects observed currentTab, never optimistic success.
Auth failure requires reauthentication; disconnected/offline screens are unavailable.
Calendar all-day values are dates with exclusive end; timed values retain timezone offsets.
Local fixtures/build/browser tests are not physical TV or live HA installation proof.
