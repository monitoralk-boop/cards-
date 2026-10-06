# Chkobba & Rami — Database foundation

PostgreSQL is the durable source of truth. Drizzle definitions live under `lib/db/src/schema/`, with one table per file and exports through the schema barrel. Development schema updates use the existing `pnpm --filter @workspace/db run push` command. Production schema changes are applied only through Replit's Publish flow.

## Implemented tables

| Area | Tables |
| --- | --- |
| Accounts | `users`, `profiles` |
| Economy | `wallets`, `wallet_transactions`, `purchases`, `ad_rewards` |
| Rooms and games | `rooms`, `room_players`, `games`, `game_players`, `game_rounds`, `game_events` |
| Social | `friends`, `friend_requests`, `chat_messages`, `notifications` |
| Rewards | `daily_rewards`, `missions`, `mission_progress` |
| Progress and safety | `player_statistics`, `leaderboards`, `reports`, `bans` |
| Operations | `admin_users`, `admin_audit_logs`, `app_config` |

## Integrity and privacy rules

- `users.auth_subject` is a unique external identity subject. The schema does not store passwords or authentication tokens.
- `profiles.username_normalized` is unique; the display username is constrained to 3–15 characters.
- Wallet rows cannot have negative balances. Ledger entries require a nonzero signed amount and a consistent before/after transition. Every ledger entry has a unique idempotency key.
- A friendly room cannot charge an entry fee. Room codes are unique and six characters; player capacity is constrained to two through four.
- Game and event records are server-owned. `games.server_state`, `game_rounds.state`, and `game_events.payload` can contain private information and must never be exposed through generic row serialization.
- Purchase provider transaction IDs and ad reward provider IDs are unique per provider. Raw purchase tokens are not stored; only a digest may be persisted for deduplication.
- Each friendship is stored once using an ordered user pair. Duplicate pending friend requests are blocked by a partial unique index.
- Daily rewards are unique per user and calendar date. Mission progress is unique per user, mission, and period.
- Leaderboard uniqueness is split between all-time and weekly periods so NULL dates cannot create duplicate all-time entries.

## Not part of this phase

No auth provider, matchmaking worker, game rules, coin-granting route, purchase verifier, ad callback, or admin UI is active yet. The tables are the storage foundation only. Runtime code must validate all inputs and perform wallet changes transactionally before these capabilities are considered implemented.

## Applying the schema

Run the existing development-only Drizzle push from the workspace root:

```sh
pnpm --filter @workspace/db run push
```

Do not point this command at production. Replit's Publish flow owns the development-to-production schema diff and application.
