# Hearth v2 specifications

## Public sharing

[Public release readiness](PUBLIC_RELEASE_READINESS.md) records the early-release boundary,
remaining security/setup checks and repository rename plan. The public product name is **Hearth**;
the canonical repository is `davidjpramsay/Hearth`, with the original preserved as `old_hearth`.
Existing container image identities remain unchanged (D-132). The isolated static preview lives in
[`hearth/site/`](../../hearth/site/) (D-130).

## Fitness

[FITNESS_CONTRACT.md](FITNESS_CONTRACT.md) defines D-128: multiple personal goals with their own weekly
routines, detailed exercises and scheduled-workout-day streaks. Local implementation and release/
physical acceptance are tracked independently.

Hearth is a private family command centre designed for a wall-mounted Google TV, D-pad remote and
phone browser. It owns reminders, chores, routines, pocket money, lists, meals, notices and photos;
connected calendars remain provider-owned.

The active product includes Today, Week, Month, Weather, Hearth reminders, Chores, Lists, Meals,
Home, Photos, Games with Connections, Connect Four and Word Guess and phone administration. Home Assistant remains the authority for physical devices
and voice. Native television media apps remain separate.

## Source of truth

| Document                             | Purpose                         |
| ------------------------------------ | ------------------------------- |
| [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md) | Outcomes and scope              |
| [`UX_SPEC.md`](UX_SPEC.md)           | Screens and interaction         |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Runtime and security boundaries |
| [`DATA_MODEL.md`](DATA_MODEL.md)     | Persistence and ownership       |
| [`INTEGRATIONS.md`](INTEGRATIONS.md) | External services               |
| [`ROADMAP.md`](ROADMAP.md)           | Delivery order                  |
| [`ACCEPTANCE.md`](ACCEPTANCE.md)     | Definition of done              |
| [`DECISIONS.md`](DECISIONS.md)       | Durable decisions               |
| [`OPERATIONS.md`](OPERATIONS.md)     | Local and Synology operation    |

## Current boundaries

D-135 adds [Word Guess](WORD_GUESS_CONTRACT.md): an original unlimited five-letter game with
its own adult switch and device-local saved round. Households supply permitted private word data;
the [game content notes](../../hearth/content/README.md) explain both word games. No downloaded
word database or NYT puzzle ships in the repository or images. Local proof, private data installation,
publication, deployment and physical TV/phone acceptance remain distinct in ACCEPTANCE.

D-127 adds [guided private installation and optional connections](SHARING_SETUP_CONTRACT.md),
a Get started page and matching code-only HA downloads. Local fixtures/browser verification do
not establish a fresh server, actual phone/TV, HA restart, publication or live deployment. HA stays
optional; trusted private HTTPS and currently x86-64 Docker remain explicit prerequisites.

D-126 adds read-only [Indoor climate](INDOOR_CLIMATE_CONTRACT.md) inside Weather. Home Assistant
owns sensor history and encrypted NAS backups; Hearth keeps only selected mappings and temporary
graph data. Recording, local implementation and live deployment/backup evidence remain separate.

D-125 replaces routine calendar updating banners with a quiet heading ring on Today and Calendar;
genuine issues remain visible. Provider/sync/auth behavior is unchanged. See ACCEPTANCE for release evidence.

D-122 improves photo administration with a compact paged library and a visible, bounded upload
queue. D-124 restores the 25 MiB per-photo limit without routine settings copy; approval/private
storage/imported-original boundaries remain.
Local checks do not establish deployed or physical-device upload throughput.

D-121 enables the shared responsive companion as an iPhone/iPad Home Screen web app: Hearth name,
fern icons and standalone Today entry. It adds no offline cache or new authentication method.
Local browser checks and actual device installation/release evidence stay separate in ACCEPTANCE.

Morning / Afternoon routines (D-120/D-123/D-136) follows [MORNING_ROUTINE_CONTRACT.md](MORNING_ROUTINE_CONTRACT.md):
separate modules, selected scheduled-chore links with shared completion, School days/Weekends lists
and participants, editable day assignments, optional countdowns
and automatic household-local profile selection. Existing school content/checks are preserved. Local evidence, publication and the actual HA alarm are separate gates.

Today composition follows D-116/D-119: Chores left/before Upcoming, bounded orientation-safe photos,
content-height bottom-aligned text modules, a full-width final verse and natural companion scrolling. Local layout evidence is
separate from release and actual TV/phone acceptance in ACCEPTANCE.

Connections reopens the last successfully loaded puzzle on each device (D-117), preserving existing saves.

Optional NBA follows [NBA_CONTRACT.md](NBA_CONTRACT.md) (D-113): standout-team settings,
this/next local week, phase-labelled standings and weekly best single-game highlights. It starts
off; local implementation is not publication, deployment or physical acceptance.
D-114 adds bounded same-origin team/player artwork and one-screen TV polish; browser third-party
requests remain forbidden, and missing artwork leaves useful text/score fallbacks.
D-115 hides scores on game cards, revealing both totals and team player box scores only on open;
named stats, bounded on-demand reads and TV/phone reflow keep the same private/module boundary.

- Apple Reminders/EventKit is retired. Its proof is archived under
  `hearth/archive/apple-reminders-bridge/` and excluded from builds and deployment.
- Weather uses the server-side Open-Meteo adapter and cache.
- Calendar access is read-only unless a future decision explicitly expands it.
- Household services are LAN/Tailscale-first; no public exposure is approved.
- The Synology owns Hearth's private runtime and data. The external Google/Android TV device runs
  the small native shell; the Raspberry Pi remains a headless Home Assistant appliance.

Open acceptance work is tracked only in [`ACCEPTANCE.md`](ACCEPTANCE.md) and
[`ROADMAP.md`](ROADMAP.md); this index intentionally avoids duplicating it.

Household feature availability follows [`MODULES_CONTRACT.md`](MODULES_CONTRACT.md) (D-112):
simple adult module switches, retained data and separately approved HA module controls. Core
management is never disabled. Implementation/release evidence is recorded in ACCEPTANCE.

The opt-in, local Home Assistant integration follows
[`HOME_ASSISTANT_BRIDGE_CONTRACT.md`](HOME_ASSISTANT_BRIDGE_CONTRACT.md) (D-108): selected
foreground Hearth screen tabs and read-only chores/calendar feedback. D-109 adds only today's chore
completion/reopening, not admin access or general editing. D-111 presents one explicit approval for
all current screens and these existing capabilities; old limited grants require deliberate reconnect.
The D-112 extension explicitly adds module switching to fresh approvals, with default-false legacy
authority. Verified private release `35c7bb7` and matching HA component 1.2.0 are installed;
adult reconnect and actual-device module acceptance remain open in ACCEPTANCE.
The D-110 setup uses six-letter adult-approved codes; the integration exchanges its strong
private credential automatically. Current single-approval setup uses matching HA component 1.2.0.

Adult phone setup and recovery follow the versioned
[`PHONE_CONNECTIONS_CONTRACT.md`](PHONE_CONNECTIONS_CONTRACT.md) (D-102): protected owner key
for the protected owner phone behind private QR setup/replacement, code or QR approval for
additional phones, and no passwords/passkeys or typed long Hearth keys (D-110).
Casual owner removal stays forbidden (D-103); the implemented D-104 extension adds deliberate
saved-card or exact trusted-phone replacement while retaining private backend recovery.

The selected consumer-appliance direction is
[`APPLIANCE_ONBOARDING_CONTRACT.md`](APPLIANCE_ONBOARDING_CONTRACT.md) (D-104): private QR setup,
phone-assisted network commissioning and phone-independent recovery. The private-HTTPS/browser
setup-card and recovery path is locally implemented; native Bluetooth/Wi-Fi/trusted HDMI remains
future work. No live access, deployment or networking change is implied by local verification.

The operator-only first-start presenter offers the fern, **Welcome to Hearth**, a private QR and
short instructions on a local display. It never exposes that QR through the normal network UI.
Consumer appliance autostart and actual HDMI commissioning remain unimplemented; updating the
current NAS does not install a local display process.
