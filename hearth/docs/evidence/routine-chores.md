# Morning / Afternoon routines with scheduled chore links

Local evidence, 2026-11-05. Decision D-136 and migration 0040. Branch
`codex/afternoon-routine-chores`. This record establishes source/browser proof, not deployment or
physical TV/iPhone acceptance.

An adult can add an ordinary step or select that person's existing active chore. Routine reads
resolve only actual due occurrences for that person/date. Canonical Chores check/undo and receipts
are reused, so there is no second completion or earnings record. Morning/Weekend settings and
history remain intact; Afternoon is a separate optional module, weekdays and untimed initially.
No evening routine, live HA automation, networking, phone/screen access or provider change.

## Passed

Commands run from `hearth/` unless stated otherwise:

| Check                          | Command / result                                                                                                                                                                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen dependencies            | `pnpm install --frozen-lockfile` passed; no lockfile change.                                                                                                                                                                                                    |
| Complete code gate             | `pnpm verify:code` passed: formatting, lint, workspace types, 785 unit tests, 321 server integration tests, 33 migration tests, public-game guard, deployment scaffold/installer checks, production builds and isolated fresh-private commissioning without HA. |
| Additional contract regression | `pnpm --filter @hearth/shared test:unit` passed 117 tests after adding explicit legacy-shape/title-bound coverage (current unit total 786 across the unchanged other suites).                                                                                   |
| Final affected API regressions | `pnpm --filter @hearth/server exec vitest run src/routine-chores.integration.test.ts src/morning-routine.integration.test.ts` passed 16 tests after the final review.                                                                                           |
| Browser regression matrix      | The five-file built command below passed 73/73.                                                                                                                                                                                                                 |
| Final focus/render delta       | The two-file filtered built command below passed 15/15 after the final routine-verse focus metadata change.                                                                                                                                                     |
| Final build / static checks    | `pnpm build`, `pnpm format:check`, `pnpm lint` and `pnpm typecheck` passed after final code review. Lint emits the existing jsx-ast-utils TSNonNullExpression diagnostic; it reports no lint errors/warnings and exits successfully.                            |
| HA compatibility               | `python3.12 -B -m unittest discover -s hearth/integrations/home_assistant/tests -v` from the workspace root passed 69/69 with no network/HA runtime access.                                                                                                     |
| CI policy                      | `pnpm verify:ci` passed; four shards enumerate 369 cases each (1,476 total). Enumeration is not execution of the full browser suite.                                                                                                                            |
| Diff hygiene                   | `git diff --check` passed from the workspace root.                                                                                                                                                                                                              |

```sh
pnpm exec playwright test --config playwright.ci.config.ts \
  tests/e2e/routine-chores.spec.ts tests/e2e/morning-routine.spec.ts \
  tests/e2e/morning-profiles.spec.ts tests/e2e/modules.spec.ts \
  tests/e2e/chore-assignees.spec.ts

pnpm exec playwright test --config playwright.ci.config.ts \
  tests/e2e/routine-chores.spec.ts tests/e2e/morning-routine.spec.ts \
  --grep 'Afternoon|adult selects|ambiguous linked|missing or stale morning|Morning Routine fits 1280x640'
```

The new integration cases prove real Monday/Wednesday/Friday due filtering; canonical cross-routine
completion/undo and exact replay with one chore audit; no routine progress row for a chore; no
cross-person/missing/duplicate reference; no separate routine check for a linked row; omission of
skipped/excused/cancelled/other-person work; no Chores repository read while disabled; ordinary
steps still work while Chores is off; safe settings replay; separate routine progress/receipts;
household-local daily reset; service recreation; stale-date rejection; private/auth/module gates;
and byte-preserving v39→v40 migration of Morning/chore/access state.

Browser checks exercise a real adult chore picker and canonical requests, changes from another
Chores client, immediate hiding after module-off, an accepted request with a deliberately lost
response followed by exact replay, plus seven rows for three people at 1280×640, 1920×1080 and
3840×2160, phone portrait/landscape, light/dark, reduced motion, accessible names/targets, no
horizontal overflow, loaded avatars, D-pad rail exit/return and verse Back/opener restoration.
The existing Morning, Weekend, time fields, midnight transition, saved ticks, verse failure and
person-picker checks pass unchanged. Early checks caught accessibility-label/false-attribute
regressions in the shared board; these were fixed without weakening those assertions.

The Browser plugin was unavailable, so the repository's Playwright Chromium harness was used.
Inspected final screenshots: Afternoon short-TV light, 1080p dark, phone portrait and the adult
phone editor. The short-TV rows remain at least 56px with 20px text. Longer lists use explicit
paging; phone pages scroll. Full-page phone captures stitch fixed navigation at the initial viewport
edge; they do not establish Safari/installed-PWA behaviour.

## Private preparation

The two-page family scan was rendered and read outside source control. Only relevant read-only
member/chore/settings data was inspected on the NAS. The prepared private plan validates against
the shared profile schema, retains all seven original Morning step IDs and the entire Weekend
profile, and includes the user-approved three new weekday chores and extra washing assignee.
Unchanged dishwasher/egg schedules are referenced, not rescheduled. New work must start no earlier
than the household-local apply day; do not create historical assignments. The plan is **not applied**.
No real family routine, scan, private IDs, credential, session or source payload is shipped in Git,
demos or images. Re-read revisions/assignments before applying through authenticated administration.

## Not run / remaining

- GitHub publication, hosted verification and private deployment of this change.
- Live family list/chore configuration and Afternoon enablement.
- Physical iPhone Safari/PWA and actual TV check/undo/readback.
- Actual weekday alarm execution or an Afternoon HA alarm (no automation change requested).
- Full 1,476-case browser run, Android Gradle/device installation (native shell unchanged).

Release needs explicit approval, verified images and a checked pre-migration snapshot. Preserve
networking, connections, Morning/Weekend state, original chore history and all existing HA grants.
