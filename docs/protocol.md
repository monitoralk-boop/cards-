# Chkobba & Rami — API and real-time contract plan

This is the planned protocol surface; endpoints and events are not implemented by the database phase. REST paths use `/api/v1`. Requests are authenticated, validated, rate-limited, and return a stable error shape:

```json
{
  "error": {
    "code": "INVALID_ACTION",
    "messageKey": "errors.invalidAction",
    "requestId": "client-generated-id"
  }
}
```

## REST endpoints

| Method and path | Purpose |
| --- | --- |
| `POST /auth/guest` | Create or resume a managed guest identity |
| `POST /auth/link` | Link a permanent provider identity to the current account |
| `POST /auth/logout` | End the managed session |
| `DELETE /me` | Start account deletion and remove/anonymize associated personal data |
| `GET /me` | Fetch profile, level, and public statistics |
| `PATCH /me/profile` | Change username, avatar, language, or optional location |
| `GET /config` | Fetch public, versioned game/economy configuration |
| `POST /rooms` | Create a private room with server-validated settings |
| `POST /rooms/join` | Join by six-character code and optional password |
| `GET /rooms/:roomId` | Fetch the authorized room lobby |
| `POST /matchmaking` | Join a real-player queue using game, seats, and table settings |
| `GET /matchmaking/:queueId` | Read queue status |
| `DELETE /matchmaking/:queueId` | Cancel matchmaking |
| `GET /wallet` | Fetch server-owned coin balance |
| `GET /wallet/transactions` | Paginate the immutable ledger |
| `POST /rewards/daily/claim` | Claim the server-calculated daily reward |
| `GET /missions` | Fetch active mission definitions and progress |
| `POST /purchases/verify` | Submit a Google Play receipt/token for backend verification |
| `GET /store` | Fetch products and cosmetic catalogue |
| `GET /leaderboards` | Fetch a selected category and period |
| `POST /reports` | Report a player/message/game |
| `POST /blocks` | Block a player |

Rewarded-ad credits use the provider's server-to-server verification endpoint, not a client-authored "watched" claim. Admin routes are separate, role-checked, rate-limited, and always write `admin_audit_logs`.

## Socket.IO client actions

Every mutating action carries an authenticated room/game context plus `requestId` and `expectedVersion`. Acknowledgements are idempotent:

```json
{
  "requestId": "unique-client-action-id",
  "accepted": true,
  "version": 12
}
```

| Event | Intent |
| --- | --- |
| `room:create`, `room:join`, `room:leave` | Create or change room membership |
| `room:ready`, `room:start` | Update ready state or request a start |
| `matchmaking:join`, `matchmaking:cancel` | Enter or leave a human-only queue |
| `game:action` | Submit `playCard`, `capture`, `drawCard`, `meld`, `discard`, or joker exchange intent |
| `chat:send` | Send an allowed quick message, emoji, or moderated text |
| `game:rematch` | Request another game with the same human players |

## Server events

| Event | Contents |
| --- | --- |
| `room:updated` | Authorized room membership, ready state, and settings |
| `matchmaking:status` | Waiting state, elapsed time, and real-player count |
| `game:started` | Game ID, seats, and recipient-specific initial view |
| `game:state` | Public board plus only the receiving player's private hand |
| `game:actionRejected` | Stable error code and localized message key |
| `game:turnChanged` | Current player, server deadline, and legal-move hints for recipient |
| `game:roundFinished`, `game:finished` | Server-calculated score/result and settlement summary |
| `player:disconnected`, `player:reconnected` | Presence state and reconnect grace information |
| `chat:message` | Moderated, authorized room message |

The server never sends the entire deck, an opponent's private hand, or a raw database row.
