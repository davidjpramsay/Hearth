# Dependency patches

`minimatch@11.0.1.patch` keeps the existing lint tools compatible with the upstream fix for
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).
The registry currently identifies only 11.0.1 as patched, so the workspace replaces its older
lint-tool copies rather than suppressing the advisory or reducing the audit level.

The patch only adds a callable CommonJS export and an ESM default export for the existing ESLint,
configuration-array and JSX accessibility consumers. All named exports remain available. It does
not change matching, preprocessing, expansion limits or any other security fix. No ESLint rules or
peer-dependency checks are disabled. Remove this compatibility patch when the upstream consumers
all support the named-import surface; keep the upstream security version floor.

`apps/server/src/security-dependencies.unit.test.ts` checks the actual installed dependency through
ESLint: old/new imports, bounded amplified patterns and wildcard custom-control accessibility
checks (both accepted and correctly rejected labels). The normal full lint run exercises repository
file selection. Docker copies this directory before its frozen-lockfile install so CI and production
builds use exactly the same dependency tree.
