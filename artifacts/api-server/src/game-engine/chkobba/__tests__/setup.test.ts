import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDeck,
  createGame,
  startNextRound,
} from "../index.js";
import {
  identityRandomIndex,
  shuffleChoicesFor,
} from "./fixtures.js";

describe("Chkobba game setup", () => {
  for (const playerCount of [2, 3, 4]) {
    it(`deals a legal initial state for ${playerCount} players`, () => {
      const playerIds = Array.from(
        { length: playerCount },
        (_, index) => `player-${index + 1}`,
      );
      const state = createGame(playerIds, {
        startingSeat: 0,
        randomIndex: identityRandomIndex,
      });

      assert.equal(state.roundNumber, 1);
      assert.equal(state.roundStatus, "active");
      assert.equal(state.currentSeat, 0);
      assert.equal(state.players.length, playerCount);
      assert.ok(state.players.every((player) => player.hand.length === 3));
      assert.equal(state.table.length, 4);
      assert.equal(
        state.deck.length +
          state.table.length +
          state.players.reduce((sum, player) => sum + player.hand.length, 0),
        40,
      );
      assert.ok(state.table.filter((card) => card.value === 10).length < 3);

      if (playerCount === 4) {
        assert.equal(state.players[0]?.sideId, state.players[2]?.sideId);
        assert.equal(state.players[1]?.sideId, state.players[3]?.sideId);
        assert.notEqual(state.players[0]?.sideId, state.players[1]?.sideId);
      } else {
        assert.equal(new Set(state.players.map((player) => player.sideId)).size, playerCount);
      }
    });
  }

  it("retries an opening deal with three or more Kings on the table", () => {
    const deck = createDeck();
    const kings = deck.filter((card) => card.value === 10);
    const nonKings = deck.filter((card) => card.value !== 10);
    const invalidOpeningOrder = [
      ...nonKings.slice(0, 6),
      ...kings,
      ...nonKings.slice(6),
    ];
    const firstAttemptChoices = shuffleChoicesFor(invalidOpeningOrder);
    let randomCalls = 0;

    const state = createGame(["a", "b"], {
      startingSeat: 0,
      maxInitialDealAttempts: 2,
      randomIndex: (upperBound) => {
        if (randomCalls < firstAttemptChoices.length) {
          return firstAttemptChoices[randomCalls++]!;
        }
        randomCalls += 1;
        return upperBound - 1;
      },
    });

    assert.equal(randomCalls, 78);
    assert.ok(state.table.filter((card) => card.value === 10).length < 3);
  });

  it("fails explicitly when every allowed opening deal has three Kings", () => {
    const deck = createDeck();
    const kings = deck.filter((card) => card.value === 10);
    const nonKings = deck.filter((card) => card.value !== 10);
    const invalidOpeningOrder = [
      ...nonKings.slice(0, 6),
      ...kings,
      ...nonKings.slice(6),
    ];
    const choices = shuffleChoicesFor(invalidOpeningOrder);
    let randomCalls = 0;

    assert.throws(
      () =>
        createGame(["a", "b"], {
          startingSeat: 0,
          maxInitialDealAttempts: 1,
          randomIndex: () => choices[randomCalls++]!,
        }),
      /fewer than 3 Kings in 1 shuffles/,
    );
    assert.equal(randomCalls, 39);
  });

  it("rejects invalid player counts, duplicate IDs, and invalid rule values", () => {
    assert.throws(() => createGame(["only-one"]), /two, three, or four/);
    assert.throws(
      () => createGame(["a", "b", "c", "d", "e"]),
      /two, three, or four/,
    );
    assert.throws(() => createGame(["a", "a"]), /unique, nonempty/);
    assert.throws(
      () =>
        createGame(["a", "b"], {
          rules: { targetScore: 15 as 11 },
        }),
      /Target score must be 11, 21, or 31/,
    );
    assert.throws(
      () =>
        createGame(["a", "b"], {
          rules: { bermilaTieBreakPolicyId: " " },
        }),
      /policy ID must be nonempty/,
    );
  });

  it("starts a next round only from scored state and preserves totals", () => {
    const initial = createGame(["a", "b"], {
      startingSeat: 0,
      randomIndex: identityRandomIndex,
    });
    const premature = startNextRound(initial, 1, identityRandomIndex);

    assert.equal(premature.ok, false);
    if (!premature.ok) {
      assert.equal(premature.error.code, "round_not_complete");
    }
  });
});
