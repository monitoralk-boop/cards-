# Chkobba & Rami

An Android-first, human-only multiplayer app for Tunisian Chkobba and Rami card games.

## Run & Operate

- `pnpm --filter @workspace/tunisian-cards run dev` — run the Expo mobile app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — apply Drizzle schema to the development database only
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo React Native, TypeScript, Expo Router
- API starter: Express 5; approved target for the authoritative multiplayer server is NestJS with Socket.IO
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/tunisian-cards` — Android-first Expo app
- `artifacts/api-server` — existing Express health-check service; future server modules belong here
- `lib/db/src/schema` — Drizzle source of truth for database tables
- `docs/architecture.md` — approved system architecture and server boundaries
- `docs/database.md` — database entities and integrity rules
- `docs/protocol.md` — planned REST and Socket.IO contract
- `docs/game-rules.md` — rule assumptions and unresolved regional variants

## Architecture decisions

- Android is the first release target; keep the client portable to a later iOS release.
- Use Replit-managed Clerk rather than local credential handling by default; resolve the requested phone/OTP login gap before the authentication phase.
- The app never decides legal moves, scores, winners, shuffles, rewards, or coin balances.
- The existing Express API remains intact during Phase 1; the approved NestJS/Socket.IO target is introduced with multiplayer work.
- `games.server_state` and game event payloads may contain private cards and must never be returned directly to clients.
- No bots; when matchmaking cannot fill a table, continue waiting, invite friends, change table, or cancel.

## Product

The planned app supports human-only online Chkobba Tunisienne and Rami Tunisien, private rooms, real-player matchmaking, profiles, friends, and localized Arabic/French/English interfaces. Phase 1 architecture/database foundations, the Phase 2 server-side Chkobba engine, and the Phase 3 automated engine tests are implemented. The engine is not yet wired to an API, WebSocket server, or mobile UI.

## User preferences

- Follow the supplied master prompt's phased order; do not present unfinished features as working.
- Never add a bot or substitute player.
- Configure uncertain Tunisian rules explicitly instead of inventing defaults.

## Gotchas

- Push Drizzle changes only to development with `pnpm --filter @workspace/db run push`; production schema changes go through Replit Publish.
- Do not serialize game database rows or raw private-state snapshots to the mobile client.
- Do not credit purchases or rewarded ads based only on a mobile-client assertion.
- Do not finalize a round tied on Bermila without a configured policy/resolver; do not invent the between-round starting-seat rule.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
