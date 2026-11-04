# Hearth v2 application instructions

These instructions apply to everything under `hearth/` and supplement the root `AGENTS.md`.

## Intended monorepo

Keep this pnpm workspace shape unless a documented decision changes it:

```text
hearth/
  apps/
    server/       TypeScript Fastify API and background jobs
    web/          React television and responsive companion interface
    tv/           Kotlin Android TV shell
  archive/        Retired, build-excluded proofs; never import from active code
  packages/
    shared/       Schemas, API contracts and shared types
    core/         Pure household-domain logic
  deploy/
    synology/     Docker Compose and deployment documentation
  docs/           Code-level notes generated during implementation
```

Do not add a second JavaScript application at the workspace root.

## Preferred stack

- TypeScript in strict mode
- pnpm workspaces
- React and Vite for `apps/web`
- Fastify for `apps/server`
- Zod at external boundaries and for shared contracts
- SQLite with explicit migrations and WAL mode for the initial household deployment
- Vitest and Testing Library for TypeScript tests
- Playwright for rendered interaction checks
- Kotlin with a minimal Android TV shell; use Compose only for genuinely native surfaces
- Docker Compose for Synology deployment

Avoid introducing Next.js, Electron, Supabase, Kubernetes, Redis, a message broker or microservices without a demonstrated requirement and a recorded decision.

## UI rules

- Assume a 3840×2160 physical panel but use a responsive logical canvas that remains correct at 1920×1080.
- Every action must be reachable with Up, Down, Left, Right, Select and Back.
- Focus must always be visible, stable and restored sensibly after navigation.
- Minimum body text and target sizes are defined in `docs/hearth-v2/UX_SPEC.md`.
- Do not rely on hover, long press, swipe, drag, pinch or touch-only gestures.
- Use an original visual language: warm off-white, charcoal, eucalyptus, sky and ochre are suitable starting tokens, not an obligation to mimic any reference product.
- Render and inspect the interface. Source review alone is not adequate UI verification.

## Server and integration rules

- Domain logic belongs in `packages/core`; transport and storage adapters belong in `apps/server`.
- Shared schemas are the contract. Generate or consume typed clients rather than duplicating request types by hand.
- Calendar, Home Assistant and approved photo-source connections must sit behind small adapter interfaces. Native Google TV media apps and the separate Home Assistant/Music Assistant voice-music path are outside Hearth's integration boundary.
- Reminders are Hearth-owned records. Do not add Apple Reminders, EventKit, CalDAV VTODO, companion snapshot or reminder-source code to active packages; the historical proof under `archive/apple-reminders-bridge/` is reference-only.
- Weather data comes through the server-side Open-Meteo adapter and cache. Keep provider attribution discreet but present on the Weather surface or settings.
- D-129 permits only the user-authorized Fitness exercise demonstrations: adult-uploaded, protected local MP4 clips in an inline player. This does not authorize general media playback.
- Do not add Music Assistant, Jellyfin, Cast, generic Android-intent or general media-player modules to Hearth. Home Assistant may return only the existing generic protected-media boolean to Hearth for television power safety.
- UI code must not call Home Assistant or calendar providers directly.
- Mutations use request identifiers where retries could duplicate work.
- Record actor, source, target and timestamp for chore, calendar, list, pocket-money and home-control mutations.
- Fail safely when an integration is unavailable: core calendar/chore screens must remain readable from cached/local data.

## Work sequencing

Follow `docs/hearth-v2/ROADMAP.md` and close only the acceptance gates affected by the change. Do not infer completion from an older phase label, generated screenshot, successful build or simulator run.
