# Chkobba & Rami — Architecture

## Product constraints

- Android is the first release target. Keep the mobile client portable for a later iOS target.
- Only human players may occupy seats. Matchmaking never inserts a bot.
- The server is authoritative for cards, legal actions, scores, winners, coins, and rewards.
- Arabic, French, and English are first-class locales; Arabic screens use RTL layout.
- Chkobba and Rami rule differences remain explicit, versioned configuration rather than undocumented assumptions.

## Runtime architecture

```text
Expo React Native Android client
        │ HTTPS REST + authenticated Socket.IO
        ▼
NestJS API / authoritative game server
   ├── authentication and profiles
   ├── rooms, presence, and matchmaking
   ├── Chkobba and Rami engines
   ├── wallet and provider verification
   └── moderation, configuration, and admin
        │                         │
        ▼                         ▼
PostgreSQL (Drizzle)         Redis (planned)
durable records              presence, queues, coordination
```

The existing API artifact is the workspace's Express 5 starter and currently serves health checks. The approved target remains NestJS; converting the starter and adding Socket.IO belongs with the multiplayer-server phase, not this database phase. PostgreSQL is the durable source of truth. Redis is an operational dependency for matchmaking and presence and is not yet configured.

## Mobile client

`artifacts/tunisian-cards` is the Expo React Native app. The Android client renders server-provided game views, submits player intent, and never decides game outcomes or wallet balances. Shared app state will use React context for session/profile and React Query for REST data. Game play uses authenticated Socket.IO events.

## Identity boundary

Account identity is represented in game data by a stable external authentication subject. Passwords, provider tokens, and refresh tokens do not belong in the game database. The project default is Replit-managed Clerk rather than local credential handling; provider setup and account linking are deferred to the authentication phase.

The supplied requirements also call for phone/OTP sign-in and upgradeable guest accounts. Replit-managed Clerk currently does not support SMS/phone sign-in, so the authentication phase must resolve that provider gap before implementation. Do not add a custom local authentication system without an explicit architecture decision.

## Authoritative game state

- Persist game metadata and versioned snapshots in `games`; persist round summaries in `game_rounds`.
- Keep server-private hands, deck order, and rule-engine internals in server-only state. Never serialize this state directly to a client.
- Append ordered server events to `game_events` for auditing and recovery.
- Build a separate recipient-specific view for each connected player. A player's view may contain their own hand and public table state only.
- Every action carries a request ID and expected state version. The server checks authorization, turn ownership, idempotency, and move legality before committing state.
- Use a server-side cryptographic shuffle. Cosmetics cannot affect card distribution, turn order, or scoring.

## Economy boundary

Wallet balances and immutable ledger rows change in one PostgreSQL transaction. Each operation has an idempotency key and a before/after balance record. Entry fees are reserved and later settled or refunded server-side. Google Play purchases and rewarded ads are credited only after provider verification. The schema stores purchase-token digests, not raw purchase tokens.

## Availability and reconnection

The server records connection state and turn deadlines. A reconnect restores the current authorized state and timer. After the configured grace period, the game uses an explicit abandon/forfeit outcome; no bot takes over. Matchmaking can keep searching, invite friends, change table, or cancel.

## Delivery phases

1. Architecture and database
2. Chkobba engine and tests
3. Rami engine and tests
4. Multiplayer server and WebSocket protocol
5. Rooms and human-only matchmaking
6. Authentication and profiles
7. Android lobby and Chkobba/Rami clients
8. Friends, chat, wallet, rewards, ads, purchases, and store
9. Leaderboards, admin, analytics, and notifications
10. Security, load, beta, and release preparation

The detailed source phase list and open rule decisions remain in `docs/protocol.md` and `docs/game-rules.md`.
