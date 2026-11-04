# Public site assets

- `assets/*-demo.jpg`: unretouched browser captures of the current local Hearth demo at 1920 × 1080,
  4 November 2026. No real household server was used. Fitness and Morning Routine use fictional
  test configuration; plans are illustrative, not exercise advice. Captured from application
  baseline `4168955` with its local deterministic demo clock.
- `assets/hearth-mark.png`: the original Hearth fern, copied from `apps/web/public/brand/`.
- `assets/source-sans-3-latin.woff2`: Source Sans 3, from the workspace’s pinned
  `@fontsource-variable/source-sans-3` 5.3.0 package. Its SIL Open Font License is included as
  `assets/OFL.txt`.
- The fictional generated portraits and photos visible inside demo captures are documented in
  [phase 1](../docs/design/phase-1/README.md) and
  [phase 7 provenance](../docs/design/phase-7/ASSET_PROVENANCE.md).

Generated website concepts guided the layout; they are not shipped as product screenshots.
The public-site artifact is built from a strict file allowlist, never from the whole repository.

Preview locally with `python3 -m http.server 4322 --bind 127.0.0.1 --directory hearth/site`
from the repository root. Validate with `node hearth/scripts/verify-public-site.mjs`.
The Pages workflow publishes only after its static-file boundary check succeeds.
