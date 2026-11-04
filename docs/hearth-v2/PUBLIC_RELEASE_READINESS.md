# Public sharing and release readiness

Assessment: 4 November 2026. Product name: **Hearth**. Repository: `davidjpramsay/hearth-v2`.

## Recommendation

Share the public product preview now. Treat installations in other homes as an **assisted early
release**, with a technically comfortable operator,
private networking and a recovery plan. Do not describe Hearth as independently security-audited,
certified, generally available or a consumer appliance. Do not expose household APIs to the public
internet on the strength of the public website or a green CI run.

## What is demonstrated

- The current application baseline `4168955730e5362b1d9e674479e4290f668e4880` passed
  [hosted verification 41800297742](https://github.com/davidjpramsay/hearth-v2/actions/runs/41800297742):
  764 unit, 309 integration, 32 migration, 1,390 browser and 69 Home Assistant component tests;
  Android checks, dependency audit and fresh private Docker installation also passed.
- That application baseline is privately deployed. Its bounded deployment/rollback evidence is in
  [the Fitness release record](../../hearth/docs/evidence/fitness-2026-11-04/RELEASE.md).
  These results do not prove every feature on every physical device.
- The server and web GHCR packages are public. Anonymous pulls of the pinned release manifests
  returned HTTP 200. Images contain application code, not household data or runtime secrets.
- The guided installer has a no-HA private-mode path. Home Assistant remains optional. The current
  supported image target is `linux/amd64`; private HTTPS, host maintenance and backups remain
  operator responsibilities. See [the sharing contract](SHARING_SETUP_CONTRACT.md).
- The public GitHub Pages site is a separate static directory. It contains only the original mark,
  licensed font and real captures of fictional demo data. It has no backend, credentials, sign-in,
  forms, analytics, third-party scripts or connection to a live household.

## Before a wider release

1. **Licence and content rights.** The owner selected the [MIT licence](../../LICENSE) for Hearth
   during this release. Keep the copyright/licence notice with redistributed software. Review the separate
   rights/terms for provider data, logos, fonts and any supplied content. Never redistribute a
   personal puzzle archive, household photos or private exercise clips.
2. **Finish repository protections.** At inspection, GitHub secret scanning, push protection and
   Dependabot security updates were disabled. Enabling them and a private vulnerability reporting
   channel is recommended. This change does not silently alter account/security settings.
3. **Review the security-sensitive paths at the current release.** Use a focused independent review
   of first-owner setup/recovery, phone and screen revocation, cross-household isolation, upload/
   media access, provider SSRF limits and the privileged update/rollback boundary. Earlier reviews
   and regression tests are evidence, not a review of every subsequent change. A new independent
   review and a full Git-history secret scan have **not** been performed for this site release.
4. **Run a second-household drill.** Fresh install, both adult phones, TV pairing, lost owner phone,
   module disable/re-enable, backup restore and update rollback on disposable private data. Preserve
   the original household. Record physical-device results separately from browser fixtures.
5. **Close known acceptance gaps.** Consult [ACCEPTANCE.md](ACCEPTANCE.md), including physical
   exercise-video playback and device/network recovery. Automate or simplify trusted HTTPS setup
   before promising nontechnical self-installation. Bluetooth/Wi-Fi/HDMI appliance commissioning,
   ARM images and App Store distribution are not part of the current installer.

Ordinary code review, dependency audits, permission tests, secret scanning and backup/restore
checks do not depend on joining an OpenAI security programme. Some dedicated Codex Security
requests/protected findings have separate Trusted Access for Cyber requirements; that is a service
access boundary, not a Hearth installation requirement. The official
[Codex Security documentation](https://learn.chatgpt.com/docs/security/cli) does not establish a
universal requirement to buy a particular physical key for the checks listed here.

## Repository naming

Use **Hearth** in the README and public site now. Keep `hearth-v2` as the technical repository and
image identity until a coordinated rename is explicitly approved.

Suggested future migration: rename the original `hearth` repository to `old_hearth` (or
`hearth-legacy`), clearly mark it archived, then rename this repository to `hearth`. Before doing so:

- Inventory installer constants, release polling, protected update helpers, clone remotes, badges,
  documentation, Actions references and the old repository’s existing Pages site.
- Keep the existing `hearth-v2-server` and `hearth-v2-web` image package names initially. Repository
  renaming is not evidence that packages, installed updater allowlists or rollback paths migrated.
- Verify an existing household can still discover, verify, install and roll back a release. Preserve
  NAS folders, containers, mounts, hostnames, networking, pairings and credentials.
- Publish a legacy notice before reusing `hearth`. Reusing that name replaces GitHub’s old-repository
  redirect, so old clone links could resolve to the new product. Pages URLs do not redirect with a
  repository rename. See [GitHub’s rename guidance](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository).

No repository rename, archive operation or runtime migration is included in this website change.
