# Hearth public website verification — 4 November 2026

Scope: public README, owner-selected MIT licence, static GitHub Pages preview and sharing/rename
readiness documentation. No app contract, runtime setting, provider or household data changed.

## Local checks

Passed in the isolated `codex/hearth-public-site` worktree:

- `pnpm install --frozen-lockfile` (under `hearth/`).
- `pnpm format:check` and `pnpm lint`. Lint exited 0; the existing jsx-ast-utils
  TSNonNullExpression diagnostic appeared twice, with no ESLint findings.
- `pnpm audit:dependencies`: no known vulnerabilities at this checkpoint. This is a dependency
  advisory check, not a complete security assessment.
- `node --check hearth/site/site.js`.
- `node hearth/scripts/verify-public-site.mjs /tmp/hearth-public-site-stage`: fixed public file
  allowlist, no symlinks, local assets, internal links, no household endpoint/collection and empty
  staging boundary. The final static source is approximately 0.6 MB; only ten files are published.
- `pnpm exec eslint site/site.js scripts/verify-public-site.mjs` after final gallery changes.
- `git diff --check` using Homebrew Git.

Browser inspection used the in-app Chromium browser, not an actual iPhone/iPad. At 1440×1100,
820×1180, 390×844 and 320×740, document width matched viewport width. No broken loaded image or
console warning/error was observed. Gallery clicks, Left/Right wraparound, Home/End, selection
state, panel visibility and focus were checked. Navigation/setup links and heading/alt-text
structure were inspected. No full automated axe run or physical Safari test is claimed.

Captures: [desktop](website-desktop.jpg), [phone](website-phone.jpg), [tablet](website-tablet.jpg).
Public screen assets were captured from the local app’s real demo at 1920×1080. Viewport-only IAB
captures clipped 47 pixels; these were discarded and replaced with complete full-page captures.
The Apple-provided `python3` launcher could not start because of the local Xcode licence state;
the existing Python 3.12 runtime served the static preview instead. No system setting was changed.

## Visual comparison

Two Image Gen concepts guided the design; the website uses actual demo captures rather than
generated app pixels. Five-point comparison against the rendered desktop/phone result:

1. Original fern, warm ivory/eucalyptus colours and Source Sans 3 retained.
2. Large simple headline, concise introduction and two clear actions retained.
3. One substantial TV-like preview, keyboard-accessible four-screen gallery and demo caption.
4. Open feature rows and a separate pale-green three-step setup column, stacked on phones.
5. Quiet early-release and privacy/footer information; practical setup copy replaces concept
   placeholder claims. The screen frame omits decorative TV feet for a wall-display treatment.

## Boundaries

Public-image anonymous manifest reads returned 200. At the repository-settings checkpoint,
secret scanning, push protection and Dependabot security updates were disabled; no security
settings were silently changed. Full Git-history secret scanning, an independent current-code
security review and a second-household recovery drill remain open. The preceding application
release’s complete hosted evidence is in [the Fitness release record](../fitness-2026-11-04/RELEASE.md).

Publication evidence is the `Publish Hearth website` workflow attached to this commit, followed by
HTTP/render checks of `https://davidjpramsay.github.io/hearth-v2/`. A site deployment is not a private
NAS deployment. Repository renames and package migrations are not included.
