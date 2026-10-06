# Chkobba & Rami — Rule configuration decisions

Rule engines are planned as pure, server-only TypeScript modules. This document records unresolved Tunisian variants so implementation does not silently turn a guess into a rule.

## Chkobba

- Implemented in `artifacts/api-server/src/game-engine/chkobba/` as a pure server-side engine.
- A deck has 40 unique cards: four suits (`dineri`, `coupe`, `bastoni`, `spade`) with values 1–10. Shuffling uses Node's cryptographic random source; deterministic random-index injection exists for controlled verification.
- Support 2 and 3 individual sides, or 4 players on two teams seated opposite (seats 0/2 and 1/3).
- Deal 3 cards to each player and 4 to the table. If 3 or more Kings are on the initial table, reshuffle and redeal; after 128 failed attempts, fail explicitly.
- Deal the next 3-card batch to every player after all hands are empty, without adding cards to the table.
- Same-value capture takes priority for the selected card. Otherwise enumerate every exact-sum combination. If any card in the hand can capture, reject all non-capturing plays; the player chooses among the legal capture combinations.
- A capture that clears the table earns a Chkobba point except when it is the final play of the round. On round end, remaining table cards go to the last capturer, without an extra Chkobba point.
- Score Carta and Dineri only for a unique leader; ties award zero. Award Sabaa El Haya to the side that captured the 7 of Dineri and award each recorded Chkobba.
- Target score defaults to 21 and supports 11, 21, or 31. A tied top score at/above target continues to another round.
- Bermila ties intentionally do not have a default winner: finalizing a tied round requires an explicitly selected policy and resolver. New-round starting seat is supplied by the caller because the prompt does not specify dealer/lead rotation.
- If a finished round has table cards but no recorded capturer, scoring fails explicitly rather than assigning those cards arbitrarily.

The full automated rule suite belongs to Phase 3. This phase has focused runtime smoke checks only. The engine is not yet connected to an HTTP/WebSocket route or mobile UI.

## Rami

- The deck contains two standard 52-card packs plus four jokers. Physical card IDs distinguish duplicates.
- Sequence, group, ace, joker-limit, opening, discard-pickup, joker-exchange, and meld-manipulation behavior are validated by the server.
- Store opening threshold, clean-sequence requirement, unopened-player penalty, elimination threshold, and special end-of-round variants in versioned configuration.
- The exact meanings of “Rami without joker” and “Rami in one move” must be confirmed before those variants are playable.

No rule-variant configuration is seeded as authoritative until it has a confirmed default. In particular, confirm the Bermila tie-break and the starting-player rotation between rounds before integrating Chkobba scoring into live games.
