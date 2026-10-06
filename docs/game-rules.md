# Chkobba & Rami — Rule configuration decisions

Rule engines are planned as pure, server-only TypeScript modules. This document records unresolved Tunisian variants so implementation does not silently turn a guess into a rule.

## Chkobba

- Same-value capture has priority over sum capture.
- When no same-value card is on the table, calculate every exact-sum combination. If a capture exists, enforce mandatory capture and let the player choose among the legal combinations where the selected variant permits a choice.
- A capture that clears the table earns a Chkobba point except when the final-play exception applies.
- Store target score, initial three-King redeal procedure, multi-combination selection behavior, Bermila tie-break, and three-player scoring as explicit versioned rule configuration.
- Four-player games are two teams with partners opposite; team captures and points are combined.

## Rami

- The deck contains two standard 52-card packs plus four jokers. Physical card IDs distinguish duplicates.
- Sequence, group, ace, joker-limit, opening, discard-pickup, joker-exchange, and meld-manipulation behavior are validated by the server.
- Store opening threshold, clean-sequence requirement, unopened-player penalty, elimination threshold, and special end-of-round variants in versioned configuration.
- The exact meanings of “Rami without joker” and “Rami in one move” must be confirmed before those variants are playable.

No rule-variant configuration is seeded as authoritative until it has a confirmed default.
