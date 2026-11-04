# Public sharing and release readiness

Assessment: 4 November 2026. Product name: **Hearth**. Repository: `davidjpramsay/Hearth`.

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

## Repository naming and update compatibility (D-132)

The approved canonical names are **davidjpramsay/Hearth** for this application and
**davidjpramsay/old_hearth** for the preserved original. GitHub redirects old `hearth-v2` code links
and Git operations, but project Pages URLs require the new
[Hearth website address](https://davidjpramsay.github.io/Hearth/).

Keep the existing `hearth-v2-server` and `hearth-v2-web` GHCR package names. Local project folders,
NAS shares, container names, mounts, networking and private origins are not repository identities
and must not be renamed as part of this migration.

The protected NAS release verifier rejects redirects. Its compatibility policy tries only the
fixed canonical and former GitHub repository names and accepts immutable repository ID
`1327675743`, plus the existing main/push/success/latest-commit checks. The original repository
(ID `1174989270`) cannot become a release authority when its former name is reused. A root-owner
maintenance step must install this tested policy before GitHub is renamed; configuration and
networking digests and private readiness must agree afterward. This does not install a new app
release or change phone/screen access.

Fresh portable installers use the canonical repository. Anyone retaining an older installer
should download the current installer before their next update; the old installer deliberately
rejects redirects. The private server's existing release-discovery client can use GitHub's normal
rename redirect, while the privileged verifier independently pins repository identity.

Completion and remaining physical/release checks are recorded in [ACCEPTANCE.md](ACCEPTANCE.md).
GitHub's [rename guidance](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)
explains redirect limitations. In particular, the former original `hearth` code URL now identifies
the current product; use `old_hearth` for the legacy source.
