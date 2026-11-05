# Hearth v2 local environment and operations plan

## D-136 release boundary

Use normal verified release gates and a checked v39 recovery snapshot before migration 0040.
Verify unchanged Morning settings/progress/receipt bytes, chore schedules/completions/payments,
module flags, phones/screens and HA grants on the NAS; disclose only preservation/count results.
Afternoon defaults off; configure and enable deliberately. Prepared scan-derived family commands
remain private and must be applied through authenticated adult administration, preserving current
Morning step IDs where the same plain task remains and retaining the full Weekend profile.
Do not overwrite newer settings: re-read current revisions before live configuration. Configure the
approved new chore schedules first, then bind returned IDs in routines; never invent an ID/match.
Rollback requires matching pre-v40 database and old images. No live HA automation, restart or
network change is required. Physical cross-screen completion and day rollover remain separate.

## Repository rename compatibility (D-132)

Canonical source is `davidjpramsay/Hearth`; the original is `davidjpramsay/old_hearth`. New Pages
links use `https://davidjpramsay.github.io/Hearth/`. Update clone remotes with `git remote set-url`
without renaming a local checkout, private NAS directory, container or GHCR package.

Before renaming GitHub, root-owner maintenance installs only the tested `release-safety.py`
policy (and an installer copy if one exists), retaining a root-private rollback copy and exact protected
configuration/firewall digests. Verify the original target hash and that no update is active.
The policy tries two fixed names without following redirects and pins repository ID 1327675743;
wrong/reused repositories cannot authorise an install. Keep the existing latest successful main
workflow and exact commit checks. After rename, verify the installed policy against GitHub,
private readiness, Pages and unchanged public image availability.

Existing private release-discovery configuration may retain `hearth-v2`: its HTTP client follows
GitHub’s rename redirect, while privileged verification is independent. Fresh portable installers
use the canonical name. Re-download an old portable installer before updating; its deliberate
no-redirect policy does not migrate an already downloaded file automatically.

## Public product website (D-130)

The GitHub Pages site is built only from `hearth/site/` by `.github/workflows/pages.yml`.
`node hearth/scripts/verify-public-site.mjs <empty-staging-directory>` validates a fixed file
allowlist and copies only those public files. The deployment job has Pages/OIDC permission only
on main; no NAS or household secret is configured. Enable repository Pages with GitHub Actions as
the source. Changes to the site, validator or workflow on main publish that static artifact.

Rollback by reverting the website commit and allowing Pages to publish the prior static files.
This does not update, roll back or expose a private Hearth installation. Repository naming follows
D-132 and [PUBLIC_RELEASE_READINESS.md](PUBLIC_RELEASE_READINESS.md); existing container image
package names remain stable.

## Fitness demonstration setup and storage (D-129)

After an approved release, an adult opens Fitness settings → Exercise library, saves an exercise
and its written instructions, then adds a short H.264 MP4. Choose that entry in each workout’s
Demonstration selector; personal kg/sets/reps stay in the plan. First setup is today, later plan links
tomorrow; replacing a shared clip applies immediately. Existing phone/screen pairing is sufficient.
No provider key, HA, new APK, mount or network rule. Clips play inline and silently on explicit Play.

Clips live in `fitness-media/` beside the database within the existing writable data volume (25 MiB
per clip, ten minutes, 512 MiB per household, 100 library entries). No runtime transcoding. Back up
that directory together with a consistent SQLite copy; SQLite-only backups and Synology's protected
release rollback do not include videos. Portable stopped data checkpoints include them. Before an
upgrade/rollback, retain matching database and media snapshots. Never restore old metadata over
newer media files; startup sweeps generated files not referenced by its database. See FITNESS_CONTRACT.
Physical playback and household exercise setup remain not run. The approved private release and
its separate live-server evidence are recorded in
[the Fitness release record](../../hearth/docs/evidence/fitness-2026-11-04/RELEASE.md).

## Fitness (D-128)

Migration 0036 adds Fitness and preserves other modules/data. After an approved verified release,
turn on More → Modules → Fitness, open Fitness settings on an adult phone, select people and enter
weekly workouts by activity and days. Goals and detailed exercises are optional. Today gathers due
standalone workouts and active linked workouts. No personal plans are seeded. Existing workouts
remain editable with unchanged IDs; no history is reset. Removing a goal keeps its workouts as
general fitness, while achieving a linked goal pauses its future workouts. First save applies today;
later edits start tomorrow in the home's timezone. Check workouts from Fitness on an already connected TV/phone.
No APK, provider setup, credential or network change is required. Existing SQLite backups cover
Fitness plans/history; rollback needs the corresponding pre-0036 database. HA's optional matching
1.5.0 catalogue adds only a switch after fresh approval; installing/reconnecting HA is separate and
not required for Fitness. No live update or household configuration is claimed by local checks.

## Install Hearth for another household (D-127)

Use [the portable installer guide](../../hearth/deploy/portable/README.md) for a fresh x86-64 Docker
installation with an already trusted private HTTPS proxy. The interactive installer chooses a fully
verified published main release and new protected storage; no HA or existing household data is
required. Its local PNG supplies the existing strong first-use QR. Never serve/copy private cards
into Git, artifacts or public folders. Once claimed, the server consumes its first-use proof;
resume/update must continue without recreating it. Get started links to lost-phone recovery.

For an installation created by this tool, `install.py --directory PRIVATE_DIRECTORY --resume`
checks its exact record/configuration; `--update` proposes a verified forward release, asks for
maintenance consent and retains complete stopped checkpoints plus failed-update state. Avoid edits
during update and allow full-copy disk space. A power loss/failed rollback can require operator
recovery; no automatic phone-update agent is installed. Do not adopt the current commissioned
Synology into this tool. It keeps its existing protected update helper and network policy.

Connections → Home Assistant offers the exact matching public-code ZIP. Run its installer against
the explicitly chosen HA configuration folder, or copy only its bundled component using the existing
secure administration method. Restart HA deliberately, then approve six letters on an adult Hearth
phone. Updates keep a private component rollback copy, not a backup of HA settings/history. No
long credential is manually handled for this inbound connection. Sensor/history and outbound home
controls retain their separate explicit setup. No HA/NAS live changes follow from building a ZIP.

## Indoor sensor history and backups (D-126)

Commissioned 2026-10-29 with explicit owner approval: exact application release `a8c3a58` is
privately deployed after the complete hosted gate. The running container and deployed browser now
read real temperature/humidity and day/week/month/year history. Shared-screen admin isolation and
post-change data/runtime/bridge preservation passed. See ACCEPTANCE for exact evidence.

HA has daily backups with global retention of 14, Settings/history and all apps included, and local
plus restricted NAS locations selected. NAS encryption is enabled. A completed NAS tar was verified
as protected, with the Home Assistant archive and database included. The next scheduled run and
a spare-media restore remain separate evidence. The owner declined an extra recovery-key copy;
no key escrow was executed. Keep existing encrypted backups/schedule intact. Do not claim the
current HA key is independently recoverable after loss of the HA storage.

The owner approved a single outbound Hearth-bridge-to-HA-host TCP/80 rule after container reads
otherwise timed out. It lives in the existing protected firewall source and boot/update hook;
all older rules retain their order. The operator retained root-only original/checkpoint files and
validated exact scope plus authenticated sensor reads. No broad LAN/Docker bypass, new inbound port,
router/DNS change or restart. Do not use the optional iptables comment match on this DSM: it is not
installed. Changing the HA host or port later requires a separately reviewed operator policy update;
adult source settings never widen root-owned network access automatically. Actual reboot and later
release activation remain untested; the existing restricted activation-helper check passes.

HA mount administration uses the supported administrator `supervisor/api` WebSocket command;
Core's REST Supervisor proxy intentionally rejects mount management. Use the actual current DSM
help: its `synouser --modify` takes username, full name, expired and mail, with no password argument.
Do not force a CIFS version through HA's old-protocol override; omit it for normal current SMB
negotiation. The backup account has no administrator membership, a nologin shell, no app privileges
and explicit denial on pre-existing shares. Only the new backup folder is writable. Those new
account-only deny entries do not authorize changing existing users' access. No HA restart, alarm,
TV command or DNS/router setting was changed. The explicit HA-only network exception is recorded above.

Connect temperature/humidity measurements to HA and inspect their History plus Recorder Statistics
(No issue). Keep the HA database on its local storage; do not mount a live SQLite file on the NAS
or increase all detailed history to 365 days. Long-term hourly statistics are retained by HA.

Adult Connections → Indoor sensors tests HA access and selects exact measurements/room labels.
The provider requires an HA administrator token for read-only Recorder statistics. Paste it only
into the private setup field, never chat or source. Existing source edits reuse the saved token.
HEARTH_INDOOR_CLIMATE_CONFIG_PATH may override the default indoor-climate.json beside the existing
HA secret. The mounted secret directory/Compose/network layout need not change. Protect this file
with mode 0600 and the existing service/admin ACL. Browser/SQLite/audit results contain no token,
provider URL or raw entity ID. Removing a room retains the HA source/history.

For recovery, add a restricted Synology SMB backup destination through HA OS Network storage,
then automatic daily encrypted backups with **History included**, 14 retained copies and that
NAS destination selected. Privately save the HA emergency kit outside this repository. Verify a
completed backup in HA and its actual NAS file; separately restore to spare/test media. Configuring
a schedule is not proof a scheduled backup ran. Existing shares/users, networking, HA automations,
TV state and Hearth pairings must remain unchanged. Source/UI work alone authorizes no new NAS
account, shared-folder permission or deployment; record exact adult approval/commissioning evidence.

## Current photo/calendar correction release (D-124/D-125)

Exact release `c9af22401940616e86f1a155058df2ab522de9e5` is installed privately after all eight
hosted jobs and 1,286 browser cases passed on 2026-10-29. Uploads accept at most 25 MiB each;
settings omits the limit line. Routine calendar refresh uses a small heading ring, with real issue
messages retained. No migration; both routine profiles/ticks/receipts, stable household records,
pairings, runtime files and networking passed NAS-only preservation checks. A checked v35 backup
is retained privately. Exact web assets/manifest/icons and health/readiness pass in ACCEPTANCE.
No HA/TV install or alarm edit was required. Physical-device/throughput checks remain separate.

## Morning Routine profiles release (D-123)

Release `3fbd69ec76ab047a3e328a78f7503a2c9f1490bc` is installed privately after all eight hosted jobs
passed on 2026-10-29. It also includes D-121 Home Screen support and D-122 photo management/uploads.
Migration 35, School data/tick/receipt preservation, private runtime, commissioned networking and
exact hosted web assets are verified in ACCEPTANCE. A checked v34 backup is retained on the NAS.
The existing ACLs were verified, not changed; no TV APK/HA integration update or alarm edit occurred.
Actual phone/iPad/TV viewing, bulk-upload throughput and real alarm execution remain separate checks.

Settings now has a day-to-routine selector and separate School days/Weekends editors. Existing
school lists, times and today's checks migrate unchanged. Weekend lists start empty using the same
saved participants, with countdown off. Save both profiles together; choose No routine to leave a
day unscheduled. School holidays are not automatically detected. Closing/reopening retains today's
checks; a new local date starts fresh. Timer off keeps the stored times for later use.

Deploy only a fully verified release with the normal checked pre-migration backup. Migration 0035
adds profile-scoped progress and converts saved configuration; it preserves revisions and receipts.
Compare the pre-migration School configuration to `profiles.schoolDays.configuration`, and old
dated progress to School rows without the added profile column; raw configuration/progress hashes
will intentionally differ. Receipts and unrelated data remain unchanged. Keep private values on
the NAS and report only preservation pass/fail, not lists or payloads.
Rollback to the old v34 server requires its matching database snapshot. Verify school data/ticks,
new Weekend settings and independent day/profile checks separately on actual phones/TV. The current
HA weekday alarm remains unchanged; editing a weekend branch requires separate approval. No module
reconnect or new grant is required for the existing Morning Routine destination.

## Original Morning Routine release (D-120)

The bottom-verse refinement needs matching server/web images for its new `GET .../daily-verse`
read. It reuses the commissioned ESV key/cache and needs no migration, key setup, HA component
update or alarm edit. Private activation and physical phone/TV viewing remain separate gates.

The release includes migration 0034 and HA custom component 1.4.0. Use the existing immutable
verified private activation/backup path. Preserve the complete commissioned network, pairings and
household data. The new module defaults off and does not seed personal steps. After approval,
enable it, save all intended child participants and configure their lists through the adult API/UI.
Keep private step contents out of Git, screenshots and release evidence. HA requires matching code
and a deliberate fresh adult approval for this new module. Inspect/back up the current alarm, then
append only the weekday navigation choice with the real registered screen selector. Preserve
wake/music/volume/safety/weekend behaviour and never run the alarm as a deployment test.
Physical TV/phone and the next real weekday alarm remain separate proof from demo/CI.

## NBA local addition — D-113

No key/environment variable is required. After an approved future release/migration 0033, enable
More → Modules → NBA, then More → NBA teams → Save teams. Off retains preferences; provider
traffic is request-driven, never a background task. A failed feed shows unavailable or dated stale
data, not an empty successful schedule. Cache resets on server restart. HA source component
1.3.0 adds an approval-scoped NBA switch; a web update does not install it. Old approvals retain
eleven-module scope until deliberate reconnect. This local feature request authorizes no live
container change, network change, TV APK installation or HA restart.

D-114 artwork requires optional outbound HTTPS from the server to `a.espncdn.com`; no key,
environment variable, inbound port or browser CSP origin is added. Do not weaken networking if
that origin is unavailable: scores remain useful with initials/abbreviations. Raster processing
uses the existing Sharp dependency. Memory is bounded to 64 entries / eight MiB, with 16 in-flight
operations; successful/missing artwork caches last six hours/one minute. Download and processing
bounds are documented in NBA_CONTRACT. Cache is in-memory only and resets on restart. This web/
server polish needs no new TV APK or HA integration version, and does not itself authorize release.

## TV wake/start recovery — released, 2026-11-04

TV shell **0.1.3 / code 4** adds foreground-only reconnect attempts for temporary validation and
main-page failures. Five attempts/30 seconds is the limit; Back/pause cancel them, and resume can
start a fresh window. The matching web release retries runtime startup reads twice, then offers
Try again. Pairing, trusted origins, certificate checks and household data rules are unchanged.

After explicit approval, release `8cb1b244971d76dfe49e2662e700c9138173f2bd` was published on main,
passed all eight hosted jobs (including 1,346 browser tests), and activated through the existing
bounded private updater. Both images and external health match that SHA; readiness/runtime pass
in private mode, and the helper verified the preserved bridge/DNS rules.

The household TCL is now **0.1.3-debug / code 4**, installed in place through HA's existing ADB
connection. APK hashes and the encrypted pairing-file digest were verified. Cold launch, actual
paired UI and Home/warm resume passed. ADB became unavailable after the sleep command; neither
the existing power action nor one network wake attempt restored access. Final power-state readback
and a complete physical deep-standby cycle remain unverified. No standby/network settings were
altered. The reported wake-time symptom is consistent with delayed network availability, but that physical
cause has not been captured. The emulator also reproduced and fixed HTTP-error callback ordering
that could otherwise present an error document as ready.

For future updates, publish verified server/web images and separately install the matching signed
TV APK with `adb install -r`, preserving its package/signing identity. The phone's server Update
button does not replace the installed APK. Never install the instrumentation APK on household
hardware: it uses/clears fictional credentials. Retained old/new APKs and private capture are in
HA's protected `/config/.hearth-tv-update-20261104/`; public transfer staging was cleared and
File editor stopped with all four automatic/sidebar switches off. TV temporary files remain while
ADB is unavailable. No HA Core restart, automation, music, volume or household-data change occurred.
See [approved release evidence](../../hearth/docs/evidence/tv-wake-recovery-2026-11-04/RELEASE.md).
Original local checks and screenshots are in
[`tv-wake-recovery-2026-11-04`](../../hearth/docs/evidence/tv-wake-recovery-2026-11-04/README.md).

## Installed TV startup repair — 2026-10-17

TV shell `0.1.2` / code 3 fixes an Android-only bridge-regex initialization crash. The original
TCL exception was retrieved through HA's **existing** authorized ADB integration while the TV was
off; the Mac's unapproved ADB prompt was neither bypassed nor granted remotely. The same fault
was reproduced on Android API 36 and the fixed parser passes four Android-runtime regressions
plus the JVM/lint/build and focused browser gates. See ACCEPTANCE for exact evidence.

After explicit owner approval, fixed debug APK from local source commit `8c80652` was installed
in place through HA's existing ADB connection. The Mac/HA/TV artifact hashes matched, `pm install -r`
returned Success, and the TCL reports **0.1.2-debug / code 3**. Encrypted pairing-file digest stayed
identical before/after installation and after cold launch/resume; no secret contents were read.
The real paired Today dashboard, read-only verse dialog, native Back, explicit awake cold launch,
Home and warm resume passed. On the first combined wake/start, the wake launcher took foreground;
reopening Hearth worked. Overnight automatic launch has not been proved by this manual test.

Exact original and fixed signed APKs plus private screenshots are retained in HA's protected
`/config/.hearth-tv-rollback-20261017/` (File editor path `/homeassistant/...`, directory 0700/files
0600). HA's temporary `www` APK staging and private-media transfer files were moved/removed and
their absence checked. No household screenshot was put in public staging. File editor shell
commands require explicit `sh -c` for operators; the initial wrapper mistake created only five
empty directories, inspected and removed with exact `rmdir` targets before retrying successfully.

TV sleep and deletion of its five known temporary APK/capture paths were sent at the end, but ADB
then became unavailable. Do not claim final Asleep readback or TV temporary-file absence until
checked when the TV is next reachable. File editor is stopped with all four automatic/sidebar
switches off; its known controlled-stop Error badge recurred. No HA Core restart, automation,
credential, pairing, household data, music, NAS server/web release or networking change.
Source is committed locally, not pushed or hosted-verified. See ACCEPTANCE for exact commands,
hashes, passed physical checks and outstanding overnight/network-loss/standby gates.

For a future repair, obtain explicit installation/power permission and preserve signing/package
identity. Never uninstall, clear data, copy private ADB keys or approve a debugging trust prompt
remotely. Do not install the separate Android test APK on the paired TCL. Retain the original APK;
it reproduces this crash and is not a preferred fallback unless the fixed build has a worse fault.

## Current Modules release — D-112 (2026-10-15)

After explicit owner approval, verified source `35c7bb7578179b810215540bceb09b61e4d414dc` was
published and activated on the private NAS. Hosted run 38748473984 passed all eight jobs, including
1,088 browser cases and both exact-image publications. The unchanged fixed helper checked its
protected database snapshot, preserved the commissioned bridge/DNS and loopback publication, and
confirmed private readiness and the exact health version. This image includes migration 0032;
successful startup is evidence of migration completion, not a direct production-database query.

HA Core remains 2026.10.1. Matching component 1.2.0 is installed and visibly loaded after a fresh
3.11 MB full local backup, fourteen installed-file hash checks, eleven Python parses, configuration
validation and an approved Core-only restart with no running automations/scripts. Configuration,
automation and script hashes are unchanged. Component-only rollback is retained privately;
temporary installer/archive/staging are removed. File editor is stopped with its four automatic/
sidebar switches off. Its known controlled-stop Error badge is not a running installation failure.
The original Ramsay entry still has one device/four entities and no setup error.

Existing grants retain `controlModules=false`; reconnect once after both updates through the
existing HA entry's repair, then approve the disclosed bundle on the adult phone. Do not reconnect
twice or add a duplicate entry. Before approval the eleven module switches are not registered. Test a single
agreed feature off/on with retained data, state feedback and a visible screen only when convenient.
Old binaries do not enforce module flags: do not treat a rollback to a pre-D-112 release as preserving
disabled-feature protection. Coordinate a compatible rollback rather than silently bypassing it.
No payload, credential or private household content belongs in release evidence.
No live module flag, TV tab/power, chore/calendar item, morning automation or network setting was
changed. Actual phone Modules rendering, reconnect and agreed physical off/on proof remain open.
Exact commands and safe artifacts are recorded in ACCEPTANCE.

## Previous HA single-approval release — D-111 (2026-10-15)

Private Hearth runs verified source `f61454839f22da5cc6ed8bc636fb70db27850a0a`; hosted run
38723549135 passed every job, including 1,080 browser cases and image publication. Existing bridge,
DNS rules, loopback publication, private runtime and household connections were preserved. HA loaded
component 1.1.2 after a fresh 2.91 MB full backup, exact-file verification, configuration/no-running-
routine checks and a Core-only restart. File editor is stopped; component rollback is retained.
The existing Ramsay HA entry was reloaded after the brief server outage and has no setup error.

The adult's previous zero-scope connection remains deliberately limited. Reload Hearth on the
phone, open **More → Connections → Home Assistant → Reconnect Home Assistant**, then confirm.
In HA, repair/re-authenticate that existing Hearth entry for fresh six letters; do not add another
hub/entry. Enter the letters on the adult phone and approve the disclosed bundle once. This includes
all current paired screens, calendar/chore information and today's chore complete/reopen. No boxes.
New screens need reconnect too. No live reconnect, screen command, data/chore functional proof or
morning-automation change is claimed yet. See ACCEPTANCE for commands, artifacts and open gates.

## Home Assistant inbound bridge installation (D-108)

The component is validated against HA 2026.10.1/current config-flow APIs; verify the installed
version before copying it. Older HA compatibility is unproved and does not authorize an automatic
HA upgrade. Agree a compatibility change or upgrade separately if required.
The 2026-10-15 read-only live UI preflight confirmed HA Core 2026.10.1 / HA OS 18.3, the enabled
daily 06:30 **Good Morning - TV music and Hearth** automation, and no configured Hearth integration.
No automation was executed or changed during that preflight. The owner subsequently approved
finishing the connection/release. Keep that routine's existing music/wake/volume and native-player
guards; after actual screen registration, append bounded ready → select stored option `today` →
observed-ack verification, using the real selected-screen entity ID, never a guessed placeholder.

The approved 2026-10-15 installation checkpoint is server/web release `b65aefe`: all hosted jobs,
including 1,078 browser checks and exact-image publication, passed; the private NAS is healthy and
its existing networking is preserved. The earlier in-place TV package remains 0.1.1-debug/code 2;
D-110 requires no additional APK installation. A fresh full local HA backup completed (2.73 MB),
and component **1.1.1** from `cdb9bb5` is installed with all 13 hashes verified. Configuration checks
passed and Core restarted only after confirming no running routines. The real HA dialog now shows
six uppercase letters and the adult-phone approval instructions; 1.1.0 hid the letters and is
superseded. File editor is stopped, autostart disabled, temporary installers removed and component
rollback copies retained. Backup restore remains untested. No key was manually entered or exposed,
and no household entities, screen commands or chore writes are claimed until owner approval and
separate functional proof. The morning automation remains unchanged. See
[the acceptance checkpoint](ACCEPTANCE.md) for exact commands, results and open gates.

Use the trusted Hearth **server** origin, not a television IP. HA's household/server device owns
chore/calendar entities; its child screen devices own tab selectors. Server chore commands do not
require the TV to be online. Android TV Remote/ADB still owns physical power and app launching.

Publishing source alone does not install anything on HA or the TV. Preserve the running TV while
in use. After verified release and explicit live-change approval: back up HA, update Hearth using
the existing verified private release workflow (preserving Synology networking), update the existing
signed TV APK without uninstall/clearing its pairing, and manually copy only the bundled
`hearth/integrations/home_assistant/custom_components/hearth` folder into HA's `custom_components`.
Restart HA at an agreed quiet time. It is not built-in, HACS-published or auto-discovered.

After verifying/releasing D-111 and installing matching HA component 1.1.2, add Hearth in HA using
only the trusted private HTTPS root. It displays six letters. On the adult Hearth phone, open
Connections → Home Assistant, enter those letters, read the included access and approve once.
No permission boxes: all current unrevoked Hearth screens, calendar/chore data and today's chore
complete/reopen are included. This grants no adult/admin or general editing authority.
HA completes automatically. Never copy its hidden credential or use an adult session, TV key or
HA long-lived token for this direction. TLS verification stays enabled; test HTTP stays loopback-only.
HA protects its credential in config entries/backups. Disconnect to revoke it, then start a fresh
six-letter request. Existing full working grants need not be replaced. For a limited grant, use
**Reconnect Home Assistant** on the adult phone, confirm, then open the existing HA Hearth entry's
reauthentication repair for fresh letters. Do not add a duplicate HA entry. Newly paired screens
also need reconnect; later features/devices are not silently granted. Installing an update never
widens permissions. HA exposes **Today's chores** as a status-only to-do
list. It needs no online TV. It is unavailable for denied, stale-day, truncated or failed chore data.
Verify complete then reopen on one explicitly agreed test chore, with normal earnings/audit checks;
do not use real household chores for a speculative smoke test. Calendar stays read-only; admin access
remains blocked.

Physical acceptance: identify the intended screen, open Hearth, change one allowed tab from HA,
confirm observed feedback and manual remote navigation, then leave Hearth for another app and
verify no wake/launch/navigation is performed. Check offline/expiry/revocation, read-only chore
counts and timed/all-day calendar ranges without logging household contents. Retain private backups
and use the existing rollback procedure; no compose/network reset, re-pair or public exposure.

## Appliance access — D-104 (browser/server released, hardware pending)

The selected product uses a private supplied QR, phone-assisted authenticated network setup,
explicit recovery phones and a separate offline recovery QR. Browser recovery routes and migration
0029 are included in the verified private release; this deployment does not prove physical phone
recovery or appliance hardware. No radio/network service runs; protected D-102/D-103 operator-file
fallback remains. The HA installation preserves existing household phone/screen access.
Do not serve the existing private owner key/QR to anonymous browsers, add an empty-server bypass,
open ports, change Synology networking, or auto-promote a secondary adult to implement this plan.
No live key issuance, pairing, migration or deployment is authorized by local implementation.

Future appliance setup cards are private, unit-specific and initial-use only. Recovery cards are
separate, saved off the phone, and never submitted to external QR/image services. Existing
households require verified owner consent and a checked backup before recovery policy migration;
restore/rollback must retain revocations and consumed-proof generations. Actual Bluetooth/HTTPS
identity, Wi-Fi join and lost-phone drills remain not run. See
[the contract](APPLIANCE_ONBOARDING_CONTRACT.md) for proof and rollback requirements.

### Private first-phone card on the current server path

On a provisioning workstation, convert an existing **first-use** private file to a PNG with:

```sh
node hearth/apps/web/scripts/build-first-phone-card.mjs \
  --key-file /PRIVATE/FIRST-USE-FILE \
  --origin https://TRUSTED-PRIVATE-HEARTH-ORIGIN \
  --output /PRIVATE/Hearth-first-phone-card.png
```

The paths/origin above are placeholders, not live instructions to issue a key. Input must be a
single-link regular owner-only file; output is exclusive mode 0600 outside Git/workspace, never
overwritten. The helper rejects unsafe files/destinations, prints no proof/URL and uses no remote
QR generator. It runs before installation/in packaging, not inside nginx. Keep the PNG private,
show it only to the intended first owner, scan using that phone and destroy the installation copy
after verified setup. Hearth must already be reachable over its trusted HTTPS origin. There is no
anonymous first-QR endpoint or phone network-join command. Existing households use separate recovery,
not a retained first-use QR. A private owner **replacement grant** is not a first-setup card.

For an existing household, after separately issuing a protected one-use replacement grant, use the
same helper with `--purpose owner-replacement` and a different private PNG. Scan on the replacement
phone; no long key is typed. Never reuse a first-setup card for replacement. Keep the grant expiry,
backup and owner-consent checks below; this helper does not issue authority.

### Private first-start display (D-105)

On the trusted local provisioning/display workstation, with dependencies installed:

```sh
node hearth/apps/web/scripts/start-first-phone-screen.mjs \
  --key-file /PRIVATE/FIRST-USE-FILE \
  --origin https://TRUSTED-PRIVATE-HEARTH-ORIGIN
```

These are placeholders, not instructions to issue a live key. The helper opens the local default
browser using `open` on macOS or `xdg-open` on Linux, binding only an ephemeral loopback port. It
prints no proof, renderer URL or private path. Keep that display private and stop with Control-C.
Never proxy/forward the listener via Synology, nginx or Tailscale. No install/autostart, firewall,
network or ordinary application-container change is made. A supplied setup PNG remains available
for packaging/non-HDMI use. Hardware boot/fullscreen wiring remains future work.

The welcome QR is shown only while a successful configured private HTTPS status says unclaimed.
Failed/stale reads hide it. Successful claim permanently removes it from this presenter; missing
phones never reopen setup. On the phone, finish household/recovery setup, then separately approve
the display in Phones & screens. A claimed server shows completion without reading a key.

### Owner-consented recovery setup

After approved migration/release, use the current owner browser's **Phones & screens → Recovery
& lost phones**. Create/download a card, save somewhere other than that phone, acknowledge and
activate within five minutes. Preparing/discarding/expiry leaves an older active card valid.
Activated cards do not expire routinely; a successful owner replacement/rotation invalidates them.
Save and physically verify a new card after replacement. Never attach cards to chat, public
screenshots, tickets, source, ordinary exports or external QR scanners.

Connect the second adult normally, then explicitly select their **exact phone** as trusted for
recovery. An invitation under the same adult name does not inherit trust. On that trusted phone,
Replace lost phone creates a private QR; the new phone requests, the trusted phone approves, then
the new phone connects as the existing owner. The approving adult stays signed in as themselves.
A separately saved card also handles all-phone loss without resetting content. Other phones and
screens are not mass-revoked; remove confirmed lost secondary phones deliberately afterward.

Before live migration, back up and recovery-test, verify no duplicate non-revoked owners, preserve
network/runtime identities and obtain deployment approval. Migration assigns no trust/cards or
revocations. Do not downgrade to a release unaware of consumed/revoked recovery state; restore
procedures must not resurrect a lost phone. Browser-only acceptance is not actual iPhone scanning,
private PNG saving/restoration or lost-phone evidence. Bluetooth/Wi-Fi/trusted HDMI requires a
separate disposable hardware proof, not changes to the current Synology network.

## Verified environment snapshot

Local verification uses `pnpm verify` and `pnpm verify:tv` from `hearth/`. `pnpm verify` builds once
for the browser gate and tests the built app with a disposable in-memory demo database. Stop local
servers on ports 4310/4320 first; this gate refuses to reuse them. `pnpm test:e2e` retains the
development-server workflow for focused UI work. Run
`pnpm audit:dependencies` with registry access; GitHub verification also gates production and build
dependencies on that audit. Routine screenshots are ignored test artifacts. Refresh committed
visual evidence deliberately with `pnpm test:visual:update`, then inspect the image diff.

Do not rebuild or replace `apps/web/dist` while a built-app browser gate is running: preview can
temporarily serve a missing entry/chunk and invalidate the evidence. Complete code/build verification
first, then run the browser gate against that stable output.

Dependency remediation on 2026-10-05 pins sharp 0.35.4, Fastify 5.12.5 and Vitest 4.1.11, with
major-preserving fast-uri 3.1.8/4.1.5, js-yaml 4.3.2 and brace-expansion 1.1.21/5.0.12 overrides.
The photo-provider unit gate checks the actually loaded libheif is at least 1.23.2 and exercises AVIF
upload/import. Both installed URI-parser majors have malformed-authority regression controls.
Audit success is point-in-time package evidence, not a substitute for the repository security scan
or Linux/container/live NAS checks. Recheck registry advisories before publishing each release.

The 2026-10-08 Games release advances sharp to 0.35.5 to address the newly published
[upstream librsvg advisory](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w).
The household archive remains private runtime data and is excluded from source and image layers.

After the Fastify security update (D-083), numeric `HEARTH_TRUST_PROXY_HOPS` is ignored. Optional
`HEARTH_TRUST_PROXY_ADDRESSES` lists only verified proxy IPs/CIDRs, never all LAN addresses. Leaving
it blank is safe and keeps the app usable, but clients behind one proxy share authentication
throttling. Passkey HTTPS origin and authorization do not rely on these forwarded headers. Confirm
the actual proxy chain before enabling per-client address forwarding on a live installation.

Checked read-only on 2026-08-03:

### Synology

- Model: DS920+
- DSM: 7.3.2
- CPU: Intel Celeron J4125, x86-64
- Memory: approximately 4 GB
- Storage: approximately 3 TB free at the time checked
- Container Manager installed
- Jellyfin 10.11.11 installed and running
- Existing media directories include music, movies and television content
- Existing `/volume1/docker/hearth` path exists and may belong to the old implementation

### Local workspace

- The repository root contains the Hearth v2 specifications, agent instructions and development prompt.
- No Git metadata was present when the handoff was prepared.
- The owner intentionally removed the former bargain-finder system; no Python regression suite is applicable.
- A root `AGENTS.md` and the `hearth/` pnpm application workspace are present.
- Phases 1–4 run entirely with fictional demo data and make no live Synology or household writes.
- Runtime mode is explicit: `demo` uses deterministic fictional data, `test`
  is reserved for deterministic automated harnesses, and `private` uses the
  real clock and does not seed a household. A new private database therefore
  opens on the setup-required surface rather than displaying demo family data.
- Demo calendar data remains fictional. Phase 3 now includes an inert read-only CalDAV/iCloud adapter, but no provider credential, approved live allowlist or event write exists in the workspace.
- Android command-line tools, platform 36, build-tools 36 and the Gradle 9.5
  wrapper are installed locally. Phase 6 produces verified debug and unsigned
  minified-release APKs. API 36 Google TV emulator lifecycle/navigation evidence
  is retained; the selected-TCL run remains outstanding.

### Other reusable hardware

- Raspberry Pi 5 from the current Hearth setup
- Existing PIR/IR components
- iPhones

Before changing any live component, refresh these facts. Versions, storage and service status are drift-prone.

## Target deployment roles

### Synology DS920+

- Continue existing Jellyfin/media service.
- Run Hearth v2 server/web containers.
- Store Hearth database on a local Docker volume/path.
- Hold backups from Hearth and Home Assistant.
- Do not run a general local LLM.

### Raspberry Pi 5

- Run Home Assistant OS on Ethernet.
- Run ESPHome and local voice apps.
- Run the Music Assistant Home Assistant OS app when live installation is
  approved; connect its official Home Assistant integration.
- Remain headless and outside the TV HDMI chain.
- Use NVMe if already available; otherwise begin with a quality A2 card and verified backups.

### Google TV

- Run the Hearth Android TV app and the independent native Jellyfin client; each connects directly to its own server.
- Expose its built-in Google Cast receiver to Music Assistant for
  voice-requested music; Cast playback is separate from the native Jellyfin UI.
- Use Home Assistant's Android TV Remote integration for power, volume and
  approved app launches rather than giving Hearth an Android intent bridge.
- Use network standby/Screenless Service where supported.
- Use HDMI eARC for optional soundbar.

## Pre-install preservation

Do not reimage the Pi until:

- its boot/data media is identified
- a full image or equivalent recoverable backup is created
- current Hearth configuration, scripts and GPIO mappings are exported or documented
- the backup is readable from another machine
- a rollback path is written down

The old Hearth source at `/Users/djpramsay@acc.edu.au/Documents/Code/Hearth` remains read-only reference unless the user asks for migration work.

## Proposed network/service names

Use reserved DHCP addresses and stable local DNS names where available. Suggested logical names:

- `hearth.local` or an internal equivalent for Hearth
- `homeassistant.local` for Home Assistant
- existing stable Synology/Jellyfin name

Do not hard-code LAN IPs in application bundles. Production configuration enters the TV through pairing or a controlled environment/build setting.

Phone connections require a stable private hostname with HTTPS before real household data is entered.
Set `HEARTH_AUTH_RP_ID` to that exact hostname, `HEARTH_AUTH_ORIGIN` to its exact HTTPS origin and
`HEARTH_FIRST_USE_CODE_PATH` to an external access-restricted secret file. All three values are
required together. The exact Synology/Tailscale hostname and certificate mechanism are deployment
inputs, not values to hard-code in application bundles.

Before the first start, generate a high-entropy code into the configured first-use file with mode
`0600` or stricter and read it only on the local trusted administration path. Do not put it in an
environment variable, Compose, source, chat, logs, SQLite or a URL. Hearth rate limits invalid
attempts and consumes the file after the first adult phone connection and household are committed.
Use at least 32 random bytes; no password or passkey is needed. The historically named
`HEARTH_AUTH_RP_ID` remains the exact hostname validation setting, not an active WebAuthn requirement.

### Adult phones versus shared-screen pairing

Shared-screen isolation (D-099) uses display-cookie/Bearer presence and recognized TV hints, not
screen dimensions. A paired screen cannot open administration or use adult sign-in/recovery;
direct/restored admin paths return to the family dashboard. Local Appearance and approved family
commands still work. Empty calendar/weather setup is performed from a controller phone.
Controller HTTP clients must keep the short-lived HttpOnly `hearth_browser_context` cookie returned
by runtime or authentication options and send it with verification. It is a correlation nonce,
not an admin credential, and must not be logged or placed in a URL. Pairing cancels pending proofs
from that browser and ends only its retained adult session; it does not reset other phones/keys.
Legacy screens retaining an adult cookie also lose only that browser session when they contact
Hearth, preventing later display-cookie removal from restoring old adult access.
A generic unpaired browser is not permanently classified as screen hardware: adult authority still
requires a valid approved phone connection and server role/capability checks (D-102).

### Current phone setup (D-102)

This subsection describes the installed `ab33fb9` release. D-104's locally implemented private
setup-card/trusted-phone/saved-card paths at the top of this document are **not deployed** yet;
use them only after an approved release. No new live card/trust policy was created during development.

After an approved release upgrade, reload Hearth once on each phone so the new connection UI is
loaded. The exact `ab33fb9` release is live with migration 0028 as of 2026-10-12; David's protected
owner phone is physically connected and verified. Rachael's fresh QR connection remains not run.
Do not issue a live key against a pre-0028 database or remove working legacy access before
actual-phone acceptance.

1. Scan the private first-use setup QR on the first phone. Check **Connected as David** and
   **owner phone · Protected**. No app Remove/Sign out is available for this main phone (D-103).
2. On David's connected phone, open **Phones & screens → Add phone**, choose **Rachael**, and
   show the QR/code. Rachael scans it or enters its six letters, names her phone and requests connection.
3. David confirms **Rachael · Rachael's iPhone** and approves. Rachael taps **Connect as Rachael**.
   Check both identities independently; David is not signed out or switched to Rachael.
4. **Remove** affects only a selected secondary connection; the owner, other phone and TV remain.
   If a secondary phone is lost, a remaining adult controller approves its QR replacement.
   If the owner phone is lost, use a saved recovery QR, an explicitly trusted exact phone, or a
   fresh backend grant rendered into a private replacement QR. Ordinary connected adults cannot
   promote themselves. Successful replacement retires only the previous owner. No household reset.

QRs expire in five minutes and require final approval; a QR alone is not an administrator sign-in.
Use one consistent Safari/Home Screen browser path on each iPhone; separate browser profiles may
be separate connections. Keep phones locked. Do not remove earlier-browser connections until
both replacement phones have passed physical acceptance, unless the NAS owner explicitly requests
cleanup to one confirmed, working protected owner while other phones remain intentionally
unconnected. In that case preserve those adults' profiles/permissions, retire only approved old
sign-ins after the owner phone works, and record the other phone's QR acceptance as not run.
Screen pairing stays separate.

The web build runs `apps/web/scripts/build-home-icon.mjs` to compose the existing fern into the
opaque 180×180 `apps/web/public/apple-touch-icon.png` and 192/512px manifest icons. The shared HTML
declares the Apple touch icon, standalone/title metadata and same-origin `/manifest.webmanifest`;
Vite copies these public resources into the web image's document root. Nginx serves the manifest
with an explicit JSON manifest MIME type, no-store and no application-HTML fallback. The generator
lives inside the existing Docker `COPY apps/web` boundary; no dependency, runtime permission or
networking change is required. `node apps/web/scripts/build-home-icon.mjs --check` verifies all
three renditions against the canonical source. The transparent favicon/brand mark is unchanged.
New Home Screen additions can read this icon after the release is deployed. An existing installed
icon may be cached; its refresh needs physical verification. Do not delete/re-add a working owner
web app, clear Safari/site data or make a new phone connection merely to update artwork. Preserve
the current browser path and session, and check the installed icon after ordinary release reload.

### Add Hearth to a new iPhone or iPad (D-121)

1. With LAN/Tailscale access available, open the household's existing trusted private HTTPS Hearth
   address in Safari. Never use a copied setup/recovery QR URL as the saved app entry.
2. Choose **Share → Add to Home Screen**. Leave **Open as Web App** on where offered, keep the name
   **Hearth**, then choose **Add**. No TestFlight, developer account or App Store installation is needed.
3. Open the fern icon. Fresh launches start on Today. If **Connect to Hearth** appears, connect this
   installed context using the existing adult-approved phone QR/code workflow. A shared-screen
   connection remains a shared screen; installation does not turn it into an adult controller.
4. Check portrait/landscape, tablet multitasking, More/settings navigation and close/reopen without
   losing the intended connection. Record actual device/OS evidence separately from desktop WebKit.

Safari 17.2+ copies cookies when adding a new Home Screen app, but other local storage is not copied;
app/browser storage is separate afterward. Do not guarantee that an earlier connection transfers,
remove old working connections before the new one is verified, replace the protected owner phone,
or clear site data as an installation step. This web app still needs the private server/network;
offline household access, background sync and push are not provided.

Live cleanup checkpoint 2026-10-12: safe metadata initially shows four legacy browser connections
(two for each adult), two active legacy passkeys, no protected owner, and the one retained native
living-room TV. The verified NAS-owner tool issues a David-bound one-use key after a checked private
online backup; issuance disconnects nothing. David completes the owner claim on his actual iPhone
and confirms **David's iPhone · this phone / David · owner phone**. The old browser connections are
removed by authenticated companion actions before final cleanup. A narrowly guarded, locally tested
system transaction then retires the two remaining legacy passkeys, retaining the exact new owner,
its working session, both adults' profiles and TV authorization. Seven safety fixtures and the ten
existing maintenance fixtures pass. Its preflight rejects an unaccepted/stale/wrong-adult owner,
unreviewed phones/sessions/grants, changed credential counts and foreign/missing/duplicate targets;
audit failure rolls back the complete operation. It is a one-time operator action, not an HTTP
endpoint, installed daemon or new production CLI command.

Readback: one protected David owner phone and one active session, four revoked historical browsers,
zero active legacy passkeys, zero pending phone invitations/unused owner keys, two retained adult
profiles, and the same one active native TV. Integrity/readiness/health pass at unchanged `ab33fb9`.
The consumed private key file is removed and its matching Mac clipboard value is cleared; checked
NAS-only mode-0600 backups are retained. No data, networking, container or provider configuration
change or deployment is performed. Rachael's physical QR enrollment remains **not run** until she
uses her own phone; old passkeys cannot reconnect either account.

### Historical passkey setup (D-097; not the active enrollment procedure)

1. Open the same trusted private HTTPS Hearth address on each adult's phone. Choose **Sign in with
   a passkey**, not **Connect shared screen**. Each person uses their own Hearth passkey.
2. A household controller checks **More → Phones & screens** for the signed-in name and controller
   permissions. In **People**, an adult needs **Can change household setup** to manage Hearth and
   approve screens; being an adult or saving a passkey alone does not grant that permission.
3. If another adult has no Hearth passkey, open Hearth on that adult's own phone. An existing
   controller temporarily signs in to help, then opens **Phones & screens → Set up phone** beside
   the intended adult, checks the name and saves the key to that adult's password manager.
   The phone owner completes the passkey prompt. Do not save both adults' keys to the helper's
   account or use recovery as an invitation. Browser/OS nearby-device sign-in may help the existing
   controller authenticate without copying a credential; follow its official prompt. See
   [Apple's passkey sign-in guidance](https://support.apple.com/en-au/guide/iphone/iphf538ea8d0/ios).
4. Use **Set up this phone** on that adult's phone. After the owner saves their verified passkey,
   this explicit action signs the browser in as them automatically. Check their name and settings
   access, then test a later sign-out/sign-in. Other phones remain signed in. Existing permissions
   remain unchanged; key counts and simulated registration do not prove physical phone access.
5. The TV is connected separately, once: it displays a six-character code, a signed-in controller
   enters that code in **Phones & screens**, and the TV receives only shared-screen permissions.
   Both controller phones manage the same household; do not pair the TV once per phone.
6. Before cleanup, identify the actual current TV and inspect names/paired/last-contact times.
   Old contact is not proof a connection is unused. Revoke only confirmed obsolete active screens
   through the authenticated confirmation action, then read back the result. Revoked records are
   inert history and stay collapsed; do not delete the database rows or audit history. Retain both
   adults' working passkeys and sessions. Reconnecting a revoked screen requires a new code.

Passkeys can sync between one adult's devices; their labels/counts are not a physical-phone
inventory. Real enrolment, privilege changes and stale connection removal need the owner's
confirmation and must be reported separately from local UI/build verification. No networking,
server secrets, household content or calendar credentials are changed by this workflow.

### If every adult loses access

The NAS owner can recover an existing adult without another phone or resetting the household/TV.
Use the verified release's local tool from an authorized NAS shell:

```sh
python3 -I hearth/deploy/synology/owner-access.py \
  --database /absolute/private/hearth.sqlite \
  --household household_example issue-phone-key --member member_example
```

Resolve exact paths and the named active adult from safe metadata first. This requires root or DSM
administrators-group membership plus existing private database access, not a web session. The tool
rejects missing/linked database paths, creates a checked private SQLite online backup and issues a
256-bit one-time key valid for 15 minutes and bound to an existing adult controller. Output contains
only private file locations and expiry. Never capture the key in chat, tool output or logs.
Use the private PNG helper with `--purpose owner-replacement` and this protected file, then scan
on the intended phone and enter its name. No long-key/password/passkey prompt. Issuance does not disconnect
anything. Successful claim atomically replaces the prior protected
owner phone and invalidates its sessions/invitations; secondary phones, permissions, content and
the TV are unchanged. A newer issued key supersedes earlier unused owner grants household-wide.
There is no casual owner removal, self sign-out or ordinary-QR promotion. On the installed D-103
release, cookie loss/expiry needs a fresh owner key. After approved D-104 adoption, an active saved
card or exact trusted-phone approval is also available. Hearth cannot prevent Safari data deletion.
A failed claim keeps the prior owner.
Delete the exact private code file after consumption/expiry and retain the checked backup under the
commissioned private retention policy. Stop rather than relaxing file/DSM ACL checks.

The same tool supports `revoke-screens --keep device_current --revoke device_old` (repeat `--revoke`
for exact obsolete targets). It preserves rows/history and audits actual NAS-owner system authority,
not a forged member session. Foreign-household, missing, duplicate or retained targets reject the
whole transaction; repeated revocations are inert. Never wildcard devices or revive revoked keys.

Live checkpoint 2026-10-09: a checked private online backup precedes revocation of exactly three
owner-confirmed obsolete browser connections. Readback retains only the native Google TV paired
2026-10-08 as active and three matching system audits. Adult keys/sessions/permissions, content and
networking are unchanged. New UI publication and both physical phone sign-ins remain separate gates.

Historical passkey-reset checkpoint (2026-10-09; superseded for new phone setup by D-102/D-103):
the exact `7a20a2e` application release subsequently passes complete hosted verification and is
activated with commissioned Compose/networking preserved. After the owner explicitly requests an
all-phone sign-in reset, a backed-up, tested, exact-household system transaction revokes the remaining
phone keys/sessions and unused recovery grant, without deleting people, content or TV authorization.
It issues a fresh David-only recovery grant atomically. Readback has zero active phone keys/sessions,
two adult accounts and one active native Google TV. A fresh passkey on each real phone is still
required; do not describe the reset as restored controller access. Old Apple Passwords entries may
remain on the phones but cannot authenticate. The operator must not revive revoked keys or disable
authentication to make that chooser succeed. The actual device owner completes code entry, Save
and Face ID; keep codes out of chat/source/logs, and remove each private code file after consumption.

The CalDAV adapter also fails closed without private configuration. In
non-demo mode, `HEARTH_CALENDAR_CONFIG_PATH` must point to a JSON secret mounted
outside the repository with mode similar to other container secrets. Required
fields are `version: 1`, `provider: "caldav"`, an HTTPS `serverUrl`, `username`,
`appPassword`, `householdTimezone`, and a non-empty `calendars` array of exact
`displayName` plus nullable `ownerMemberId`. Do not put those values in a Vite
variable, Compose file, image layer, source document or command line. Demo mode
rejects the path so visual/test runs cannot contact a live provider by accident.

The companion Calendar setup page is now the supported way to prepare that
same file. In demo mode it always uses fictional discovery and stores no
credential. In private mode, `HEARTH_CALENDAR_CONFIG_PATH` must already resolve
to an access-restricted secrets location writable by the Hearth server. After a
successful test and exact selection, Hearth writes the JSON atomically with
mode `0600` and activates it without restart. The page shows only the hostname
and a masked account hint after save. If the path is missing or unwritable, save
fails safely and the entered secret is not copied into SQLite or logs.

Before the first live iCloud read, use the full Apple Account email as the username and create a
dedicated revocable app-specific password under **Apple Account > Sign-In and Security >
App-Specific Passwords**. Apple requires two-factor authentication before it will issue one. Enter
that generated password in Hearth; never enter the main Apple Account password. Apple documents
this fallback for third-party Calendar access at
<https://support.apple.com/en-us/121539> and the generation/revocation steps at
<https://support.apple.com/en-au/102654>.

Approve the exact calendar names returned by discovery and save through the companion Calendar
page. Start Hearth in private mode, confirm all returned sources are read-only, then revoke the
app-specific password after validation if the deployment is not proceeding. No calendar write
method is present. This code path is covered against a deterministic CalDAV service, but the real
iCloud account remains unverified until the owner performs the first credentialed test.

After connection, change Calendar assignments directly on that same page. The
mapping save does not request an app-specific password: it retains the existing
credential, updates only the exact calendar/person allowlist and refreshes the
projection. Use Whole family for shared sources; a named person automatically
uses their current Hearth avatar and colour.

Open Today, Week and Month screens request current calendar data immediately,
then every five minutes while visible. They also refresh as soon as the browser
reconnects and whenever an adult saves, remaps or removes calendar settings.
Private reads return the durable projection immediately; D-086's serialized, bounded background
queue coalesces requested windows, caches success for five minutes and backs off failures for one
minute. D-125 shows routine updating as a small heading ring, without a warning banner. Actual
provider/authentication/configuration failures and failed cached reads still show an issue message.
If iCloud is temporarily unavailable, Hearth marks the retained projection stale and keeps saved
events on screen. No new polling loop or credential is needed. Do not remove and recreate
the connection merely to force a refresh; first allow the next automatic cycle
or reconnect, then inspect the Calendar status and server logs if stale state
persists.

### Retired CalDAV Reminders capability probe (do not run)

This diagnostic has been removed from the server and archived with the Apple Reminders proof under
`hearth/archive/apple-reminders-bridge/`. The command below is retained only as historical evidence;
it must not be used as an operating procedure.

The former operator-only diagnostic tested whether the commissioned CalDAV account explicitly
advertised a `VTODO` collection. Its implementation and old command are retained only in the
archive; the active server contains no executable probe.

The sample limit accepts `0` through `10`; always begin with `0` for metadata-only discovery. If and
only if `taskCollectionCount` is greater than zero, the owner may approve a second bounded run with
`HEARTH_REMINDERS_PROBE_SAMPLE_LIMIT=3` to confirm that title, status and due/completion fields parse.
The result is
printed only to the interactive terminal and deliberately omits account details, private URLs, UIDs,
descriptions and raw DAV content. Collection names and sampled reminder titles are still household
information, so do not redirect the result into logs, source control or chat. If
`taskCollectionCount` is zero, stop: the current account has not advertised a standards-based task
collection and no unsupported iCloud endpoint should be tried. If a task collection is found,
review the bounded result before proposing a separately approved read-only product integration.
`ignoredCollectionResponseCount` records harmless `REPORT` responses that repeat the collection
URL rather than identifying a task object; it does not represent a reminder. Any different-origin
or outside-collection resource remains a hard failure.

The commissioned 2026-08-25 probe completed and did not expose the account's newly created current
Reminders through CalDAV. Do not repeat the probe as a routine health check or treat advertised
`VTODO` capability as proof of modern iCloud Reminders access. The direct CalDAV Reminders path is
closed unless Apple documents a supported change.

### Retired native Reminders bridge commissioning (historical)

The former SwiftUI iOS 17+ target and its contract are archived under
`hearth/archive/apple-reminders-bridge/`. They are excluded from current builds and must not be
commissioned without a new product/security decision. The following text records the completed
proof only.

The archived target was built locally with XcodeGen/Xcode using the
`HearthCompanion` scheme on a physical iPhone. The app's
`NSRemindersFullAccessUsageDescription` explains that the permission is used
only to read selected lists; the target contains no Apple ID, iCloud
app-specific password, private URL or NAS credential.

The simulator run is a presentation and fake-adapter check only. For the live
proof, the owner selects the physical iPhone, grants Reminders access, chooses
the current `Reminders` and `Family Reminders` lists and confirms the prepared
test reminders' titles, due values and completion states. Check the native
Reminders app before and after to confirm Hearth made no changes. Record the
iPhone model, iOS version, selected lists and visible test-reminder titles in
the phase-8 evidence note. Do not claim the native EventKit proof until this
run is completed; do not place any Apple credential or private device detail in
source control or chat.

Do not reuse the calendar app-specific password. On the private HTTPS/Tailscale Hearth origin, the
iPhone companion generates its own 32-byte secret, stores it in Keychain and displays the
server-issued six-character code. A signed-in adult approves that code in Hearth; no operator edits
an environment file or database row. The app then exchanges and uploads through the distinct
`HearthReminderSource` authorization scheme described in
`REMINDERS_COMPANION_CONTRACT.md`.

Before enabling the household surfaces, verify all of the following without printing the secret or
raw EventKit identifiers:

1. the selected lists survive iPhone terminate/relaunch;
2. the current source session reports the expected household/source and next sequence;
3. one full snapshot succeeds and the household read endpoint returns the expected safe titles,
   due semantics and completion states;
4. an exact upload replay reports `replayed: true`;
5. disconnect/revoke makes the source credential return `UNAUTHENTICATED` while unrelated Hearth
   health, calendar and household data remain available.

Do not script the source secret into Compose, shell history or Synology files. The app must stop and
offer fresh pairing after revocation. A temporary stale source is not an operator incident: Hearth
keeps cached reminders and the user can foreground or manually refresh the iPhone bridge. The
paired app also requests a best-effort iOS background refresh no earlier than fifteen minutes after
it is suspended. Keep Background App Refresh enabled for Hearth Companion, but do not diagnose a
stale badge as a server fault merely because iOS delayed the task; Apple controls its actual launch
time. After installing a build that changes this path, verify it on the physical iPhone before
claiming background latency.

The Home Assistant REST adapter likewise remains inert unless private mode sets
`HEARTH_HOME_ASSISTANT_CONFIG_PATH` to an access-restricted, writable file outside the repository.
Do not place the URL, token or entity IDs in `.env`, Compose values, source, SQLite, logs, chat or a
command line. After a current Home Assistant backup and rollback path are verified, an adult uses
**Connections > Home Assistant** to test the server-reachable private root address and a dedicated
long-lived token. The browser receives only opaque choices and friendly labels. Save maps exactly
occupancy, television power, Hearth foreground, protected playback, Evening, Goodnight and Screen
off; the server atomically writes the raw JSON with mode `0600` and activates it without restart.
Removal deletes that file and returns the provider to the explicit unconfigured state.

Commission the three scripts and four helper/state entities in Home Assistant before saving the
mapping. Confirm the generic protected-playback helper covers native Google TV and Cast playback,
then exercise each Hearth Home action while watching the actual device. Hearth makes no arbitrary
service call and has no Jellyfin, Music Assistant or Cast control. If validation does not proceed,
remove the connection through Admin and revoke the dedicated token. Take a fresh Home Assistant
backup only after the verified mapping/hardware test.

The optional Today daily verse remains inert unless `HEARTH_ESV_API_KEY_PATH` points to an
owner-readable server file containing only an active ESV API token. In the Synology Compose layout,
create `${HEARTH_SECRETS_DIR}/esv-api-key`, make it readable only by the configured Hearth UID/GID
and restart the Hearth server before enabling **Daily Bible verse** in **Today & notices**. The
current server reads this optional secret at process startup. Never place the token in Compose,
`.env`, a Vite variable, source, logs or screenshots. If a token is disclosed, revoke/regenerate it at
<https://api.esv.org/account/> before commissioning.

Weather is independent of Home Assistant. Use **Hearth settings → Household →
Weather location** on a phone to search a suburb/postcode or use the phone's
current location, test the displayed conditions and save. Suburb precision is
sufficient; Hearth stores coordinates locally and does not need a street
address. `HEARTH_WEATHER_LATITUDE` and `HEARTH_WEATHER_LONGITUDE` remain an
optional backwards-compatible fallback only when no household location has
been saved. Both fallback variables must still be set together and in range.
The server calls Open-Meteo for search/forecast and uses Nominatim only for a
direct user-triggered phone reverse-label request.

Set `HEARTH_MODE=private` only with a dedicated private database path. If
`HEARTH_DATABASE_PATH` is omitted, Hearth chooses `data/hearth-private.sqlite`
for private mode and `data/hearth-demo.sqlite` for demo/test. Do not point
private mode at a copied demo database. The adult first-use command is implemented but remains inert
without the approved private HTTPS origin and external one-time code. Do not enrol a real passkey or
enter household data until that origin/certificate is commissioned.

## Household Games archive

Family navigation is **Games → Connections / Connect Four / Word Guess** (D-131/D-133/D-135). Adults choose individual
On/Off games in **More → Modules → Choose games**. The parent Games switch gates all children, retaining
child choices. Connect Four needs no archive/provider and keeps the current round on its device.
`/games` is the menu; the puzzle is at
`/games/connections`. Existing explicit `/games?puzzle=N` links still open that puzzle. The existing
`games` module/HA identifiers and device-local progress remain unchanged. Matching HA source labels
use Games; this local change does not install or restart the live HA component.

See [`hearth/content/connections/README.md`](../../hearth/content/connections/README.md) for the
public setup note. Only that README belongs in the content folder; archives stay outside Git.
`pnpm verify:public-games` guards source releases against accidental archive inclusion; Docker
excludes the whole content folder. Never publish third-party boards in screenshots or fixtures.
Set `HEARTH_GAMES_ARCHIVE_PATH` to the absolute local `connections.json` supplied by the owner.
The server reads it only when Games is used. Demo/test mode normally supplies small original
puzzles; an explicit path may be used for a local read-only import check. Never commit a Desktop
archive, download report or newspaper puzzle collection into the repository or image layers.

Production Compose points to `/data/game-archives/connections.json`. Install the supplied file
inside the existing private data directory only under explicit live-deployment approval and
preserve the service identity/ACL. No new host mount, port, DNS rule or network access is needed.
Replacing the file atomically refreshes it on a later Games read (one-minute cache). Invalid or
missing archives do not block startup or household services. Back up the complete data directory
to retain the archive; SQLite copies do not contain it. Browser game progress remains per device.
Refreshing pinned Compose for this new environment field is a separate approved helper step;
preserve commissioned DNS/bridge settings rather than overwriting them with the generic template.

### Private Word Guess data (D-135)

See [game content notes](../../hearth/content/README.md) and the
[Word Guess README](../../hearth/content/word-guess/README.md). Obtain a permitted answer pool and
allowed dictionary independently; preserve its permission notices and curate answers for the family.
Never import NYT's answer list or publish downloaded words in Git, screenshots, ZIPs or images.
The local `hearth/scripts/prepare-word-guess.py` helper accepts two lowercase five-letter text files
and exclusively creates validated JSON outside the repository. It makes no network request and
does not install anything. `pnpm verify:public-games` checks both private-content placeholders.

Production reads `game-archives/word-guess.json` beside the configured database, normally
`/data/game-archives/word-guess.json`. Optional `HEARTH_WORD_GUESS_PATH` must be an absolute server
path. Install only after explicit live release/data approval into the existing protected data volume,
retaining its service ownership/ACL and required source notices. No Compose mount, firewall, DNS,
pairing, calendar or HA change is required. Do not replace the Connections archive.

The UTF-8 file has `{version:1,answers:[...],allowedGuesses:[...]}` with unique lowercase ASCII
five-letter words, every answer in allowed guesses, at most 10,000 answers/30,000 guesses/1 MiB.
Answer order defines successive rounds and wraps after the last word. Atomically replace with a
validated file; a later read refreshes after the one-minute cache. Missing words show setup guidance;
failed refresh retains the last-good data as stale. The runtime never downloads a dictionary.
Back up the private data and notices together; SQLite contains only the new module flag/receipts.
Switching off retains private files and browser progress. Changed lists safely start a new local round.

## Synology paths

Keep the v2 source/release area separate from the private household state and from the old
deployment:

```text
/volume1/docker/hearth-v2/
  source/              exact staged Hearth source tree
  staging/             temporary release staging
  staged-source-version       legacy untrusted candidate, independently verified by root

/volume1/.hearth-v2-state/     root-protected metadata and rollback storage
  staged-source-version       verified candidate awaiting activation
  active-source-version       last release that passed readiness
  previous-source-version     retained rollback image version
  rollback.*/                 private stopped-database recovery copies

/volume1/hearth-v2-private/
  data/                SQLite, managed photos, derivatives and online backups
  secrets/             external runtime secrets, mode-restricted
```

The commissioned private project is
`/volume1/docker/hearth-v2/source/hearth/deploy/synology/runtime/private-project/`. Its `.env`
points `HEARTH_DATA_DIR` to `/volume1/hearth-v2-private/data` and `HEARTH_SECRETS_DIR` to
`/volume1/hearth-v2-private/secrets`. The generic `./runtime/data` and `./runtime/secrets` values
in `hearth/deploy/synology/.env.example` are only for a new isolated deployment. Live secrets
never return to the workspace.

### NAS firewall compatibility

If Synology network hardening inserts a `FORWARD_FIREWALL` chain before Docker's own forwarding
chains, permit only Hearth's own bridge traffic to continue to Docker's normal isolation and
published-port policy. Do not move Docker ahead of the firewall or add a blanket Docker-interface
exception, because either could bypass the inbound WAN boundary. The repository helper
`hearth/deploy/synology/ensure-docker-firewall.sh` adds idempotent `RETURN` rules for the exact
Hearth subnet and its configured DNS resolver, and removes any superseded broad `docker+` bypass. It
does not open a host port or permit unsolicited inbound WAN traffic. The commissioned NAS installs it as the root-owned
`/usr/local/etc/rc.d/S99hearth-docker-firewall.sh`. Its boot action applies the rules once after
Docker/firewall startup; no polling monitor runs. The private release activator also refreshes the
hook from root-owned configuration and reapplies the rules after recreating the Hearth containers.
On a Synology where `FORWARD_FIREWALL` is not active, the helper makes no firewall change and
reports that no compatibility rule is required.

These compatibility rules are required because DSM mirrors its host-oriented catch-all drop into
`FORWARD_FIREWALL` before Docker's generated forwarding rules. Without them, containers cannot use
their normal bridge or DNS path; Hearth's static web shell can load while nginx's API proxy times
out connecting to the server container. Packets arriving from LAN, Tailscale or WAN still meet the
existing source/port rules before Docker. Docker's own bridge-isolation rules remain active, and
qBittorrent continues to share Gluetun's network namespace and kill switch. After an explicit DSM
firewall reload, run the hook's `start` action once, confirm its `status` action, then verify the
container-to-container readiness request and the public `/api/v1/readiness` route.

For pre-commission television testing, `compose.demo.yaml` provides a separate LAN-bound pilot with
fictional data only. It does not mount the secrets directory, calendar/Home Assistant configuration
or a Synology photo source. Its bind address must be the NAS's exact private LAN address; never add a
router port-forward or public reverse proxy. This pilot is not the private household deployment.
Once the private instance is commissioned, stop and remove the NAS demo project and its separate
data. Continue routine UI work in local demo/test mode; never copy the private database, secrets or
approved photo mount into development.

## Implemented container scaffold

As of 2026-08-09, `hearth/deploy/synology` contains the local production scaffold: a multi-stage
Dockerfile, two-service Compose definition, rootless nginx same-origin proxy, health checks, pinned
Node 24.18.0 and nginx 1.30.4 bases, read-only roots, dropped capabilities, bounded logs and an
DSM Reverse Proxy → nginx → Fastify routing with explicit address-based trust for client throttling,
and an ignored runtime directory template. The server production build includes all 25 forward migrations
and compiles `better-sqlite3` within the target Linux image.

As of 2026-08-21, ordinary production updates no longer execute that build on the DS920+.
GitHub Actions builds and caches the native `linux/amd64` server/web targets, then publishes them to
private GitHub Container Registry packages only after every verification job passes. Production
Compose contains immutable image references and no build instructions. `compose.build.yaml` keeps
the same Dockerfile available as an explicit recovery fallback, not the normal release path.

Both native ARM64 development images and emulated `linux/amd64` images for the DS920+ were built and
started together in private mode. In both runs the server and web containers became healthy, the
proxied readiness endpoint returned `ready`, the runtime returned `household: null` and
`requiresSetup: true`, and no demo household was seeded. The ARM64 run also verified non-root users,
read-only roots, all Linux capabilities dropped, `no-new-privileges`, and clean Fastify shutdown on
`SIGTERM`. This is retained local evidence, not a claim that the live Synology has been changed.

Validation commands from `hearth/`:

```sh
docker compose --env-file deploy/synology/.env.example \
  -f deploy/synology/compose.yaml config --quiet
docker compose --env-file deploy/synology/.env.example \
  -f deploy/synology/compose.yaml \
  -f deploy/synology/compose.build.yaml config --quiet
docker build --platform linux/amd64 --target server \
  -t hearth-v2-server:local-amd64 -f deploy/synology/Dockerfile .
docker build --platform linux/amd64 --target web \
  -t hearth-v2-web:local-amd64 -f deploy/synology/Dockerfile .
```

On 2026-08-16 the private Synology service was commissioned at the allowlisted HTTPS origin recorded
in the private commissioning runbook. It uses a dedicated non-root service identity, source/release
files under `/volume1/docker/hearth-v2`, private data under `/volume1/hearth-v2-private/data`,
private secrets under `/volume1/hearth-v2-private/secrets`, and a separate read-only photo share.
The temporary fictional NAS demo was then stopped and removed at the owner's request. First-adult
enrolment, second-adult recovery validation, an encrypted off-device backup, an actual clean-location
restore drill and a focused security review remain operational acceptance work.

### Image-registry visibility and one-time private setup

Repository visibility and GHCR package visibility are independent. The source repository became
public on 2026-08-21, but that did not make the existing server and web packages public. GitHub
Actions publishes those packages with its short-lived `GITHUB_TOKEN`; no repository secret is
required and the workflow cannot contact the Synology.

When the packages are private, the NAS needs one separately revocable Personal Access Token
(classic) with only `read:packages`, as currently required by GitHub Container Registry. Keep them
private unless the owner separately approves publishing the image artifacts. Never grant
`write:packages`, `delete:packages` or unrelated account scopes merely to deploy Hearth.

From an interactive administrator SSH session on the NAS, run the Container Manager Docker client
and enter the GitHub username plus the token only at its password prompt:

```sh
sudo /var/packages/ContainerManager/target/usr/bin/docker login ghcr.io
```

The credential belongs to root's access-restricted Docker configuration because the release command
runs Compose through `sudo`. Never put it in `.env`, Compose, a shell argument, source, chat or the
GitHub workflow. Revoke the token in GitHub and run `docker logout ghcr.io` on the NAS if the reader
is retired. This one-time persistent-access setup requires explicit owner confirmation when it is
performed.

Public packages need no NAS registry credential. Publishing them is reasonable only when the exact
images have been verified to contain no household data, credentials, private URLs or commissioned
configuration. The production images are designed to satisfy that boundary; private state is
mounted at runtime rather than baked into an image.

### Normal private release

Promote only an exact full Git commit whose hosted workflow has completed successfully and published
both packages. The commissioned NAS uses one root-owned Hearth-only release helper so normal Codex
deployments never need to surface or store the Synology administrator password. Install that helper
once, from a visible owner-controlled terminal:

```sh
hearth/deploy/synology/install-release-helper.sh
```

This is the final interactive privilege step. A genuine `sudo` prompt echoes no characters. The
installer copies the fixed production Compose and runtime environment into root-only configuration,
installs `/usr/local/sbin/hearth-v2-activate-staged` plus the root-owned one-shot Docker-firewall
boot hook, and grants the named deployment user
passwordless access to that command only. It does not grant a passwordless shell, Docker client or
general `sudo`. If the canonical production Compose changes, rerun the one-time installer before
activating that release so the root-owned copy is deliberately refreshed.

For every subsequent verified release, run from the repository root:

```sh
hearth/deploy/synology/activate-private-release.sh <full-verified-commit>
```

The activation script stages that exact source/Compose revision and pulls both images while the
existing containers remain running. It recreates the project with an explicit full immutable commit
tag, waits up to 60 seconds for the loopback readiness route, and only then records the new active
version plus the previous rollback version in atomically replaced runtime metadata. The activation
uses `sudo -n` and fails closed with an installation instruction if the fixed helper or its sudo
policy is missing. The database, managed photos, optional read-only import and integration secrets
stay in their existing external mounts.

Before an externally initiated activation reports success, the helper also verifies that the fixed
update agent has both a live process and a non-empty status file. A stale PID without status is
stopped and replaced. If System Health instead says to finish the one-time appliance update setup,
rerun the installer below once; this is an agent-readiness failure, not evidence of low NAS storage.

Open Hearth pages compare the non-cacheable health release identifier when their realtime stream
reconnects, once per visible minute and when the app returns to the foreground or network. A
successful replacement therefore reloads the page once without clearing a television pairing or
adult session. The first deployment that introduces this behaviour still needs one ordinary page/app
restart; later client reloads are automatic. Server release installation still requires an
explicit approved operator activation or the adult phone's Install update action; a GitHub push
does not deploy to the NAS.

`stage-private-release.sh` remains available when an operator deliberately wants to stage without
restarting. Do not choose Container Manager **Build** for a normal update: production Compose has no
build context. If GHCR is unavailable and an operator explicitly accepts a slow NAS recovery build,
combine `compose.yaml` with `compose.build.yaml`; never silently fall back to compilation.

### Adult in-app update

After the updated fixed helper has been installed once, an authenticated adult can use **System
health > Hearth update**. The card compares the installed commit with the newest successful push of
the repository's fixed `verify.yml` workflow. Installing requires recent explicit connected-phone consent (D-102),
creates and checks an online SQLite backup, downloads immutable images, creates a stopped-database
rollback copy, activates the release and waits for readiness. Failure restores the old database and
image tags automatically. Start and terminal result are separate audit entries.

The browser never supplies a repository, image, Compose file or command. The application container
has no Docker socket and cannot execute the host helper. It can write only `request-id commit` to a
mode-restricted FIFO consumed by the root-owned agent. The agent blocks while idle, so there is no
polling watchdog. Internet access is outbound-only to the existing GitHub API/GHCR paths; no router
port or inbound public access is required.

Rerun the following installer once when first deploying D-079 or whenever the pinned Compose/helper
changes:

```sh
hearth/deploy/synology/install-release-helper.sh
```

That approved live step installs the agent, boot hook and control directory. Until it is run, the
card fails closed with a one-time setup message. Development installations hide it. A Termux phone
must keep using its verified `hearth-update <full-commit>` command until an equivalent platform
agent with automatic database rollback is commissioned; setting `HEARTH_UPDATE_PLATFORM=termux`
without that agent is unsupported.

D-089 changes the host trust boundary. The NAS needs `/usr/bin/python3` (3.8+ with SQLite support).
Install the updated fixed helper and activate the new verified release together under explicit
deployment approval: an existing container still mounts the old control directory and cannot
migrate that mount merely by refreshing its browser. The new mount is
`/usr/local/etc/hearth-v2/control`; root-only markers/rollback copies are in
`/volume1/.hearth-v2-state`, not deployment-writable staging or the DSM system partition.
Root verifies the fixed successful GitHub workflow
independently before stopping Hearth and requires readiness plus the requested health version.
If a directory identity, link, ownership, snapshot digest or release check fails, stop safely and
retain protected recovery evidence for the operator. Do not relax these checks to complete an update.
No installer, mount migration, network/firewall change or deployment is implied by local verification.

DSM ACLs can override a requested 0600 Unix file mode in an inherited shared folder. A mode-only
check must stop safely rather than silently accepting that condition; it does not by itself prove
effective access by another NAS account. Inspect `synoacltool -get` on the dedicated Hearth folders
during commissioning. Any ACL changes need separate approval and a preserved ACL/recovery record.
Keep diagnostic snapshots inside private container temporary storage or a verified mode-700 work
directory under a protected volume parent; verify copy/restore integrity and delete only the exact
disposable artifacts afterwards. A successful drill on an old installed image does not certify the
new helper, mount migration or activated release.

### Root-owned release-helper boundary

The NAS no longer compiles Hearth during a normal release. GitHub Actions builds both `linux/amd64`
images, and the Synology only downloads and recreates containers. The remaining friction comes from
two intentional boundaries: Docker on DSM is root-controlled, and private GHCR packages require a
root-owned registry login. Codex must not read, type or store the DSM password or registry token.

The owner enters the DSM password once when installing the fixed helper; normal releases then use
its exact no-argument activation command through `sudo -n`. The deployment account may stage only
a 40-character version marker. It cannot replace the root-owned Compose, environment, helper or
firewall hook. The helper refreshes and reapplies the root-owned hook from its root-only copy, pulls only the two
fixed Hearth image names, recreates only the fixed
`hearth-v2` project, waits for readiness and atomically records the active version. A public source
repository does not remove the registry step while its packages remain private.

If the one-time installation prompt is unavailable, the supported Safari fallback is:

1. Stage the exact green commit and transfer a short, inspectable release script to the NAS.
2. Create a **disabled**, root-owned DSM Task Scheduler task that runs only that file.
3. Let the owner submit the DSM password when DSM saves the task, then run it manually.
4. Verify the exact container image tags, loopback readiness and private origin.
5. Delete the task, release script and task log after verification.

Do not paste a long release program into DSM's script text area: browser editing has previously
mutated shell text. Do not leave a reusable root deployment task behind. The permanent helper above
is the explicitly approved alternative: it is root-owned, argument-bounded, configuration-pinned
and validated with `sudo -n` after installation.

### Additional household Synology installations

A second household may use the same verified public source and container images, but it is a new
commissioned instance—not a clone of the first household. Give it a distinct HTTPS origin, service
identity, runtime path, database, photo store, secrets, passkeys/recovery material and registry
reader if packages remain private. Never copy another household's database, calendar credentials,
Home Assistant token, photos or authentication material. Confirm the NAS architecture, Container
Manager version, storage paths and private LAN/Tailscale reachability before activation.

## Backup design

### Hearth

- The implemented private service uses SQLite's online backup mechanism, not a casual copy of an
  active WAL database. `HEARTH_BACKUP_DIR` must be absolute; Compose sets it to `/data/backups`.
- `HEARTH_BACKUP_INTERVAL_HOURS` defaults to 24 and `HEARTH_BACKUP_RETENTION` defaults to 14.
  The first scheduled check runs after startup, skips a still-current copy and retries later after
  a family-safe failure. Updates create and verify their own copy. The uncommon manual action is
  **System Health → Advanced recovery → Create extra copy**.
- Every copy is verified with SQLite `quick_check`, foreign-key checks and a schema-version read,
  retained as one mode-`0600` database file inside a mode-`0700` directory and pruned to the
  configured count. The browser sees only status, time, size and retention—not a path or download.
- Back up deployment configuration excluding renewable/cache content.
- Perform a restore into an isolated test location before production acceptance.

The repository integration test now creates three online backups while the source database is open,
proves idempotency/audit records and retention, verifies the latest copy, restores it to a new clean
path and reads the household from that restored database. `node apps/server/dist/recovery-cli.js
verify …` validates one copy; `restore … <new-destination>` writes only to a path that does not
already exist. This is strong local tooling evidence, not the required live Synology restore drill.

The same database now contains the calendar projection cursor, bounded sync
window, source mappings, normalized events and tombstones. A restore drill for
a real deployment must verify that cached events remain available while the
provider is deliberately unreachable.

### Home Assistant

- Automated encrypted Home Assistant backups copied to a restricted Synology destination.
- Retain at least one known-good pre-upgrade backup.
- Test restoring onto spare/test media before calling operations complete.
- Include Music Assistant app/integration configuration and the custom voice
  intent/player mapping in the post-commission backup; keep Jellyfin credentials
  in Home Assistant's supported secret/configuration mechanism, not this repo.

### Photos/media

D-122: **Manage photos** uses a compact paged library in normal and selection modes. Filter All,
Favourites or Hidden; page through 48 at a time. Select page adds only the visible page to the
selection, which is retained across pages/filters. Normal controls and exact delete confirmation
remain available. Optional folder details are collapsed unless there is an import error.

Choose multiple files together, up to **25 MiB per photo** (D-124). There is no total batch-byte limit.
The queue takes its limit from the server capability; ordinary settings show supported formats
without the size-limit line. A rejected file still receives an actionable size error. Previously
accepted larger photos remain readable. Two transfers overlap; the NAS prepares one uploaded image at a time. Progress separates
Uploading from Preparing photo. Pause queue stops dispatch, not already-started commands. Continue
resumes; Retry failed photos retains each failed file and original request ID, so a lost response
can safely replay an already accepted upload. Pause remains in effect when retries are queued.
Keep this page open; browser suspension, leaving/reloading or closing it is not durable background
sync. Accepted photos remain on Hearth, while unsent files need choosing again after leaving. No
photo bytes or upload secrets are persisted in the browser. Actual iPhone/Wi-Fi/NAS throughput
must be measured separately from local fake-server queue and image-pipeline checks.

The committed Nginx upload-only location allows 25 MiB and a 300-second upstream read timeout;
Fastify and the adapter enforce the same byte bound and retain 120-million input-pixel validation.
The front Synology HTTPS reverse proxy may also have a body/idle bound: verify that separately at
release time; do not silently change DSM/network configuration. New managed thumbnails use the
smaller display derivative; existing masters/derivatives are neither replaced nor removed.

- Adult phone uploads are the primary photo path. The server writes normalized managed masters to
  `/data/photo-uploads` and display/thumbnail WebPs to `/data/photo-derivatives`; both locations are
  inside the restricted `HEARTH_DATA_DIR` mount. The browser never supplies a server destination.
- Include the complete host `HEARTH_DATA_DIR` in encrypted Synology Hyper Backup. The in-app online
  SQLite backup protects photo metadata and curation, not the managed image files; a valid photo
  recovery drill must restore the database, managed masters and derivatives together to a clean
  location and confirm the opaque asset routes still resolve.
- Optionally mount one explicitly approved family-photo folder at `/photos-source` read-only for
  bulk import. Leave `HEARTH_PHOTO_SOURCE_DIR` blank when it is not useful; never mount the Synology
  photo-library root. Admin **Check folder** rebuilds imported derivatives without affecting managed
  uploads.
- **More → Manage photos** identifies **Added in Hearth** and **NAS folder** assets. Each Hearth
  upload has a **Delete** action, including hidden uploads; **Select photos → Delete selected (n)**
  removes batches. **Keep photos** cancels without deleting. Confirmed deletion permanently removes
  only Hearth-managed masters and derivatives. Selection mode can hide or restore either source in
  bulk. To remove an imported asset, delete its original from the
  approved Synology folder and run **Check folder**; Hearth must not receive write access to that
  source. Existing backup snapshots can retain deleted managed photos until their configured
  retention expires, even though the active library no longer serves them.
- Photo responses, command receipts, audit summaries and logs must remain free of client filenames
  and host/container paths. A temporary optional-import outage should preserve and serve the last
  safe derivative set while managed uploads continue to work.
- Member profile-photo derivatives are identity settings stored inside Hearth SQLite and are covered
  by the normal database backup/restore drill. The chosen original file is not retained by Hearth.
- Do not imply that Hearth backups protect the entire media library or an optional import folder;
  those originals remain governed by the Synology's existing backup strategy.

## Update and rollback

- Publish immutable full-commit images only after the complete hosted verification gate.
- Pull both target images before recreating either running container.
- Record deployed image/version and migration number.
- Take a current database backup before migrations.
- Use health checks before switching/declaring success.
- Retain the prior image and `previous-source-version`; do not prune them as part of deployment.
- Database rollback is restore-based unless a specific migration has a verified reverse path.
- Do not automatically start an older image after a forward migration. Verify compatibility or
  restore the matching pre-update database through the documented operator recovery path.

## Continuous verification

`.github/workflows/verify.yml` verifies `main` and pull requests with pinned full-commit actions
and no household secrets. `pnpm verify:code` runs formatting, lint, types, all unit/API/migration
tests, deployment checks and production builds on Node 24.18.0. Four browser jobs then download
only that run's compiled web/server/shared/core artifacts and run `pnpm test:e2e:built --shard=N/4`.
Each job has one worker, its own in-memory demo database and fresh browser contexts. Do not raise
the worker count: demo resets are shared within a job. The 384 Today layout cases are individually
listed, and `pnpm verify:ci` proves complete, non-overlapping shard coverage plus release-policy
invariants. No tests are filtered out or replaced by a local success claim.

The shared setup caches only pnpm's content-addressed store, keyed by platform, toolchain and
lockfile, and still performs a frozen-lockfile install. Browser jobs reuse the compiled build, not
`node_modules`, a database or a cross-run build cache. Headless Chromium alone is installed, and
browser artifacts retain blob reports, rendered screenshots and failure traces for seven days.
Download them, collect their `blob-report/*.zip` files into one directory and run
`pnpm exec playwright merge-reports --reporter=html <report-directory>` to combine them.
The code and browser jobs have a 45-minute safety ceiling; that is not an expected runtime.
Each shard stops at its first failed test, retaining that failure's evidence. Obsolete runs and
remaining shards after a failure are cancelled to avoid wasted work; failed runs cannot publish.

Android test/lint/debug-and-release builds and both validated Synology image builds remain
independent gates. The separately permissioned publisher waits for code, every browser shard,
Android and container success, then reuses the existing Buildx cache and publishes both
`linux/amd64` images under the exact full commit. It never deploys, signs an APK, contacts a
provider or gains access to the private household network. A cancelled/failed run cannot become an
in-app update; after success, Hearth's release lookup may retain its prior result for five minutes.

Keep local verification authoritative while changing the workflow itself, then confirm the first
GitHub run before claiming release readiness. Parallel local shard processes need separate
checkouts/ports; never run them against the same demo server. No self-hosted runner is installed on
the developer Mac or household NAS.

Android TV releases should be signed consistently, versioned and initially
sideloaded. Preserve the signing key outside the repository with a secure
recovery record. `apps/tv/local.properties` is an ignored machine-local SDK path;
never place signing configuration or passwords there.

For a TV-shell-only repair, install the matching signed APK with `adb install -r` to preserve
Keystore pairing and local preferences; never uninstall or clear app data as a sizing/icon fix.
Native startup must report the 1920×1080 logical viewport at the appropriate display-density scale,
including fresh reload/cold restoration. A cached launcher image can require an ordinary launcher
restart, without clearing its settings. Launcher fern-plus-wordmark assets have explicit 16:9
banner and square icon bounds. The original mark is unchanged; source outline attribution is
under `apps/tv/design/OFL.txt` (D-093).

The owner's foreground-display choice (D-094) uses `FLAG_KEEP_SCREEN_ON` only while the activity
is resumed and clears it on pause. Do not globally disable Ambient Mode or change the television's
idle timeout for this feature. Keep manual and Home Assistant standby available; foreground flag
readback alone does not prove a complete unattended idle interval or overnight recovery.

The release shell accepts only an entered HTTPS Hearth origin. Debug cleartext
is restricted to `10.0.2.2`, `127.0.0.1` and `localhost`; use the emulator host
alias or `adb reverse tcp:4320 tcp:4320` rather than permitting arbitrary LAN
HTTP. Pair from the phone Admin television list. Revocation is independently
checked by the native shell and clears the encrypted local credential.

Build and inspect before sideloading:

```sh
cd hearth
pnpm verify:tv
apkanalyzer manifest permissions apps/tv/app/build/outputs/apk/release/app-release-unsigned.apk
```

The repository intentionally contains no release keystore. Emulator pairing,
remote navigation, Back, switching, sleep/wake, server recovery and revocation
results are recorded under `hearth/docs/evidence/phase-6`. Release signing and
the selected-TCL install/lifecycle run remain separate release steps.

## Monitoring

Monitor locally:

- Hearth process/database readiness
- time since successful calendar sync
- Home Assistant availability
- Music Assistant availability and last successful Jellyfin/player discovery
- Synology capacity
- TV availability only during expected hours

Notify an adult only for persistent or actionable failures. Do not generate household noise for transient restarts.

## Power automation safety

- Do not hard-cut mains power during normal operation.
- Turn off only after a presence grace period and only when protected media
  states are false for both native-app and Music Assistant/Cast playback.
- Keep quiet hours and a manual override.
- Test network wake after an overnight standby before relying on it.
- Use existing IR through ESPHome only as a controlled fallback.

## Planned Music Assistant and voice commissioning

This work has not been performed on the live Pi, Synology or TCL. It requires
approval because it changes the existing Home Assistant appliance and creates a
new Jellyfin credential.

### Preserve first

1. Create a current Home Assistant backup and copy it to the restricted
   Synology backup location.
2. Verify the backup can be opened and record the running Home Assistant,
   ESPHome and voice-pipeline versions.
3. Record current television, presence and IR entity/script mappings so the
   change can be reversed without guessing.

### Install and connect

1. Install Music Assistant from the Home Assistant App Store. Home Assistant OS
   is the recommended deployment because the app and local-player networking
   are handled together.
2. Confirm the official Music Assistant integration is discovered under
   **Settings → Devices & services**.
3. Create a dedicated least-privilege Jellyfin user for music access and add the
   Jellyfin music provider in Music Assistant. Do not reuse an administrator
   credential or store it in this workspace.
4. Confirm Music Assistant discovers the TCL through its native Google Cast
   provider. Television/video Cast players are disabled by default in Music
   Assistant, so explicitly enable only the selected TCL. Add the same
   television to Home Assistant through Android TV Remote for
   power/volume/app control.
5. Give the resolved Cast player the household-facing name `Hearth TV`.
6. Install Music Assistant's documented community voice-support repository and
   its local play-media blueprint/custom sentences. Starting an arbitrary song
   from Assist is not currently a built-in Home Assistant core intent.
7. Map the living-room Voice Preview Edition/area to `Hearth TV` when the voice
   command has no explicit player. Keep other player targets allowlisted and
   explicitly named.

### Validate on the household network

- “Play Dreams by Fleetwood Mac” selects the expected track and `Hearth TV`.
- An explicit different room/player overrides the implicit living-room target.
- Cast wakes/switches the TCL where supported and shows usable metadata.
- Pause, resume, next, previous, stop and volume work from Voice Preview Edition
  and iPhone Assist.
- Ambiguous titles do not silently select an unsafe or obviously wrong result.
- The Voice Preview Edition hardware button/push-to-talk path remains usable
  during loud music or a movie when wake-word detection is unreliable.
- eARC audio, TV standby, Screenless Service/network standby and recovery after
  Pi/TV/router restart are reliable.
- The Home Assistant protected-media helper remains true throughout native and
  Cast playback, so presence automation cannot switch the television off.
- Hearth remains completely usable if Music Assistant is stopped.

The current Music Assistant documentation warns that its Jellyfin music source
has no dedicated developer and is maintained on a best-effort basis. Before
household acceptance, test library refresh, search, playlists and sustained
playback. If the provider is unreliable, stop and obtain approval for the
fallback: expose only the Synology music folder as a read-only network-storage
source through the supported Home Assistant OS mechanism. Do not add broad
container mount privileges merely to make the fallback work, and retain
Jellyfin as the native television browsing server.

After validation, create a fresh Home Assistant backup and retain the exact
Music Assistant, Home Assistant and Jellyfin versions plus rollback notes.

Official setup references:

- <https://www.music-assistant.io/installation/>
- <https://www.home-assistant.io/integrations/music_assistant/>
- <https://www.music-assistant.io/music-providers/jellyfin/>
- <https://www.music-assistant.io/integration/voice/>
- <https://www.home-assistant.io/integrations/androidtv_remote/>

## Purchases still external to software work

- Preferred TV direction: TCL 65C7L. Consider 65C8K when the verified delivered
  price is only modestly higher; use 65C6K only as the value fallback if
  suitable clearance stock appears. No model, retailer, price or stock is
  confirmed until rechecked at purchase time.
- Home Assistant Voice Preview Edition.
- Professional VESA 300×300 mounting, recessed power and preferably Cat6.
- Speaker only after testing the TV; Sonos Beam Gen 2 is the clean preferred upgrade.
- Optional ESP32 and later Zigbee/Thread or mmWave hardware.

These are planning assumptions, not confirmed purchases. Recheck current price, stock and exact final TV model before writing model-specific automation.
