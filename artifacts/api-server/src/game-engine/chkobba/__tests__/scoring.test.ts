import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateRoundScore,
  createDeck,
  createGame,
  finishGame,
  finishRound,
  startNextRound,
  type ChkobbaCard,
  type ChkobbaGameState,
  type RoundScore,
} from "../index.js";
import {
  completedCardPiles,
  createCompletedState,
  identityRandomIndex,
  makeCard,
  TEST_BERMILA_POLICY,
} from "./fixtures.js";

function uniqueLeaderPiles(
  excludedCardIds: readonly string[] = [],
): ChkobbaCard[][] {
  const deck = createDeck().filter(
    (card) => !excludedCardIds.includes(card.id),
  );
  const p1 = [
    ...deck.filter((card) => card.suit === "dineri"),
    ...deck.filter((card) => card.value === 7 && card.suit !== "dineri"),
  ];
  const p1Ids = new Set(p1.map((card) => card.id));
  p1.push(...deck.filter((card) => !p1Ids.has(card.id)).slice(0, 12));
  const finalP1Ids = new Set(p1.map((card) => card.id));
  const p2 = deck.filter((card) => !finalP1Ids.has(card.id));
  return [p1, p2];
}

function tiedPiles(): ChkobbaCard[][] {
  const suitIndex = new Map(
    ["dineri", "coupe", "bastoni", "spade"].map((suit, index) => [suit, index]),
  );
  const piles: ChkobbaCard[][] = [[], []];
  for (const card of createDeck()) {
    const side =
      ((suitIndex.get(card.suit) ?? 0) + card.value) % 2 === 0 ? 0 : 1;
    piles[side]!.push(card);
  }
  return piles;
}

function pointMap(state: ChkobbaGameState): Record<string, number> {
  return Object.fromEntries(
    state.totalScores.map(({ sideId, points }) => [sideId, points]),
  );
}

describe("round scoring", () => {
  it("awards Carta, Dineri, Bermila, Sabaa El Haya, and each Chkobba correctly", () => {
    const state = createCompletedState(uniqueLeaderPiles(), {
      chkobbaCounts: [2, 1],
    });
    const result = calculateRoundScore(state);

    assert.equal(result.ok, true);
    if (!result.ok) return;
    const points = Object.fromEntries(
      result.score.pointsBySide.map(({ sideId, points: value }) => [
        sideId,
        value,
      ]),
    );
    assert.equal(points["player-1"], 6);
    assert.equal(points["player-2"], 1);
    assert.deepEqual(
      result.score.categories.map((category) => category.category),
      ["carta", "dineri", "bermila", "sabaa_el_haya", "chkobba"],
    );
    assert.equal(
      result.score.categories.find((category) => category.category === "carta")
        ?.awardedPoints[0]?.sideId,
      "player-1",
    );
    assert.equal(
      result.score.categories.find((category) => category.category === "dineri")
        ?.awardedPoints[0]?.sideId,
      "player-1",
    );
    assert.equal(
      result.score.categories.find(
        (category) => category.category === "bermila",
      )?.awardedPoints[0]?.sideId,
      "player-1",
    );
    assert.equal(
      result.score.categories.find(
        (category) => category.category === "sabaa_el_haya",
      )?.awardedPoints[0]?.sideId,
      "player-1",
    );
    assert.deepEqual(
      result.score.categories.find(
        (category) => category.category === "chkobba",
      )?.awardedPoints,
      [
        { sideId: "player-1", points: 2 },
        { sideId: "player-2", points: 1 },
      ],
    );
  });

  it("does not award Carta or Dineri for ties and requires an explicit Bermila rule", () => {
    const state = createCompletedState(tiedPiles());
    const result = calculateRoundScore(state);

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "bermila_tie_break_required");
      assert.deepEqual(result.error.tiedSideIds, ["player-1", "player-2"]);
    }

    const withPolicy = {
      ...state,
      rules: {
        ...state.rules,
        bermilaTieBreakPolicyId: TEST_BERMILA_POLICY,
      },
    };
    const resolved = calculateRoundScore(withPolicy, () => null);
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;

    for (const name of ["carta", "dineri", "bermila"] as const) {
      const breakdown: RoundScore["categories"][number] | undefined =
        resolved.score.categories.find((item) => item.category === name);
      assert.equal(breakdown?.tied, true);
      assert.deepEqual(breakdown?.awardedPoints, []);
    }
    assert.deepEqual(
      resolved.score.categories.find(
        (item) => item.category === "sabaa_el_haya",
      )?.awardedPoints,
      [{ sideId: "player-2", points: 1 }],
    );
  });

  it("uses only an explicitly configured Bermila resolver and validates its result", () => {
    const state = createCompletedState(tiedPiles());
    const withPolicy = {
      ...state,
      rules: {
        ...state.rules,
        bermilaTieBreakPolicyId: TEST_BERMILA_POLICY,
      },
    };
    let receivedPolicy = "";
    const resolved = calculateRoundScore(withPolicy, (context) => {
      receivedPolicy = context.policyId;
      return context.tiedSideIds[0] ?? null;
    });

    assert.equal(resolved.ok, true);
    assert.equal(receivedPolicy, TEST_BERMILA_POLICY);
    if (resolved.ok) {
      assert.deepEqual(
        resolved.score.categories.find(
          (category) => category.category === "bermila",
        )?.awardedPoints,
        [{ sideId: "player-1", points: 1 }],
      );
    }

    const invalidResult = calculateRoundScore(
      withPolicy,
      () => "not-a-tied-side",
    );
    assert.equal(invalidResult.ok, false);
    if (!invalidResult.ok) {
      assert.equal(invalidResult.error.code, "invalid_bermila_tie_break");
    }

    const thrownResolver = calculateRoundScore(withPolicy, () => {
      throw new Error("policy unavailable");
    });
    assert.equal(thrownResolver.ok, false);
    if (!thrownResolver.ok) {
      assert.equal(thrownResolver.error.code, "invalid_bermila_tie_break");
    }
  });

  it("scores a four-player team's combined card, seven, and Chkobba totals", () => {
    const deck = createDeck();
    const piles = [
      deck.slice(0, 15),
      deck.slice(15, 23),
      deck.slice(23, 33),
      deck.slice(33),
    ];
    const state = createCompletedState(piles, {
      chkobbaCounts: [1, 1, 2, 1],
      rules: { bermilaTieBreakPolicyId: TEST_BERMILA_POLICY },
    });
    const result = calculateRoundScore(
      state,
      (context) => context.tiedSideIds[0] ?? null,
    );

    assert.equal(state.players[0]?.sideId, state.players[2]?.sideId);
    assert.equal(state.players[1]?.sideId, state.players[3]?.sideId);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const metrics = Object.fromEntries(
      result.score.metricsBySide.map((metric) => [metric.sideId, metric]),
    );
    assert.equal(metrics["team-1"]?.capturedCardCount, 25);
    assert.equal(metrics["team-2"]?.capturedCardCount, 15);
    assert.equal(metrics["team-1"]?.chkobbaCount, 3);
    assert.equal(metrics["team-2"]?.chkobbaCount, 2);
    assert.equal(metrics["team-1"]?.sevenCount, 2);
    assert.equal(metrics["team-2"]?.sevenCount, 2);
    assert.deepEqual(result.score.pointsBySide, [
      { sideId: "team-1", points: 7 },
      { sideId: "team-2", points: 2 },
    ]);
  });

  it("assigns remaining table cards to the last capturer without adding a Chkobba", () => {
    const table = [makeCard("spade", 1), makeCard("spade", 2)];
    const piles = uniqueLeaderPiles(table.map((card) => card.id));
    const state = createCompletedState(piles, {
      table,
      lastCapturerPlayerId: "player-2",
    });
    const before = JSON.stringify(state);
    const result = finishRound(state);

    assert.equal(result.ok, true);
    assert.equal(JSON.stringify(state), before);
    if (!result.ok) return;
    assert.deepEqual(result.state.table, []);
    assert.ok(
      table.every((card) =>
        result.state.players[1]?.capturedCards.some(
          (captured) => captured.id === card.id,
        ),
      ),
    );
    assert.equal(
      result.state.players.reduce(
        (sum, player) => sum + player.capturedCards.length,
        0,
      ),
      40,
    );
    assert.ok(
      result.state.players.every((player) => player.chkobbaCount === 0),
    );
  });

  it("fails explicitly if leftover table cards have no last capturer", () => {
    const table = [makeCard("spade", 1), makeCard("spade", 2)];
    const piles = uniqueLeaderPiles(table.map((card) => card.id));
    const state = createCompletedState(piles, { table });
    const result = calculateRoundScore(state);

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "missing_last_capturer");
  });

  it("requires a completed round and prevents scoring the same round twice", () => {
    const active = createGame(["a", "b"], {
      startingSeat: 0,
      randomIndex: identityRandomIndex,
    });
    const premature = finishRound(active);
    assert.equal(premature.ok, false);
    if (!premature.ok) {
      assert.equal(premature.error.code, "round_not_complete");
    }

    const state = createCompletedState(uniqueLeaderPiles());
    const firstScore = finishRound(state);
    assert.equal(firstScore.ok, true);
    if (firstScore.ok) {
      assert.equal(firstScore.state.roundStatus, "scored");
      const secondScore = finishRound(firstScore.state);
      assert.equal(secondScore.ok, false);
      if (!secondScore.ok) {
        assert.equal(secondScore.error.code, "round_not_complete");
      }
    }
  });
});

describe("game target and round lifecycle", () => {
  it("supports all configured target scores", () => {
    for (const targetScore of [11, 21, 31] as const) {
      const state = createCompletedState(completedCardPiles(2), {
        rules: { targetScore },
        totalScores: [
          { sideId: "player-1", points: targetScore - 1 },
          { sideId: "player-2", points: 0 },
        ],
      });
      const result = finishGame(state);
      assert.equal(result.finished, false);
      assert.equal(result.reason, "below_target");
      assert.equal(result.targetScore, targetScore);
    }
  });

  it("continues when the highest score is tied at or above the target", () => {
    const state = createCompletedState(completedCardPiles(2), {
      totalScores: [
        { sideId: "player-1", points: 21 },
        { sideId: "player-2", points: 21 },
      ],
    });
    const result = finishGame(state);

    assert.equal(result.finished, false);
    assert.equal(result.reason, "tied_at_target");
    assert.deepEqual(result.leadingSideIds, ["player-1", "player-2"]);
  });

  it("ends with the unique side that reaches the target", () => {
    const state = createCompletedState(completedCardPiles(2), {
      totalScores: [
        { sideId: "player-1", points: 22 },
        { sideId: "player-2", points: 21 },
      ],
    });
    const result = finishGame(state);

    assert.equal(result.finished, true);
    assert.equal(result.reason, "winner");
    assert.equal(result.winnerSideId, "player-1");
  });

  it("starts the next round after scoring, preserves totals, and resets round data", () => {
    const piles = uniqueLeaderPiles();
    const initial = createCompletedState(piles, {
      totalScores: [
        { sideId: "player-1", points: 10 },
        { sideId: "player-2", points: 1 },
      ],
      chkobbaCounts: [1, 0],
    });
    const finalized = finishRound(initial);
    assert.equal(finalized.ok, true);
    if (!finalized.ok) return;

    const nextRound = startNextRound(finalized.state, 1, identityRandomIndex);
    assert.equal(nextRound.ok, true);
    if (!nextRound.ok) return;
    assert.equal(nextRound.state.roundNumber, 2);
    assert.equal(nextRound.state.firstPlayerSeat, 1);
    assert.equal(nextRound.state.currentSeat, 1);
    assert.equal(nextRound.state.roundStatus, "active");
    assert.deepEqual(nextRound.state.totalScores, finalized.state.totalScores);
    assert.ok(
      nextRound.state.players.every(
        (player) =>
          player.hand.length === 3 &&
          player.capturedCards.length === 0 &&
          player.chkobbaCount === 0,
      ),
    );
  });

  it("rejects invalid next-round seats and does not restart a finished game", () => {
    const gameWon = createCompletedState(uniqueLeaderPiles(), {
      totalScores: [
        { sideId: "player-1", points: 20 },
        { sideId: "player-2", points: 0 },
      ],
    });
    const finalized = finishRound(gameWon);
    assert.equal(finalized.ok, true);
    if (!finalized.ok) return;
    assert.equal(finalized.state.gameStatus, "finished");

    const finishedResult = startNextRound(
      finalized.state,
      0,
      identityRandomIndex,
    );
    assert.equal(finishedResult.ok, false);
    if (!finishedResult.ok) {
      assert.equal(finishedResult.error.code, "game_finished");
    }

    const notFinished = createCompletedState(uniqueLeaderPiles());
    const scored = finishRound(notFinished);
    assert.equal(scored.ok, true);
    if (!scored.ok) return;
    const invalidSeat = startNextRound(scored.state, 2, identityRandomIndex);
    assert.equal(invalidSeat.ok, false);
    if (!invalidSeat.ok) {
      assert.equal(invalidSeat.error.code, "invalid_starting_seat");
    }
  });

  it("does not mutate scoring inputs", () => {
    const state = createCompletedState(uniqueLeaderPiles());
    const before = JSON.stringify(state);
    const result = calculateRoundScore(state);

    assert.equal(result.ok, true);
    assert.equal(JSON.stringify(state), before);
  });
});
