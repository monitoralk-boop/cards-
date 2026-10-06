import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  captureCards,
  createGame,
  detectChkobba,
  getLegalMoves,
  playCard,
  validateMove,
} from "../index.js";
import {
  createActionState,
  fullCardCount,
  identityRandomIndex,
  makeCard,
  simulateCompleteRound,
} from "./fixtures.js";

describe("legal moves and action validation", () => {
  it("shows moves only to the current player", () => {
    const state = createActionState(
      [[makeCard("dineri", 8, "p1:8")], [makeCard("coupe", 3, "p2:3")]],
      [],
    );

    assert.equal(getLegalMoves(state, "player-1").length, 1);
    assert.deepEqual(getLegalMoves(state, "player-2"), []);
    assert.deepEqual(getLegalMoves(state, "unknown-player"), []);
  });

  it("requires a capture if any card in the hand can capture", () => {
    const state = createActionState(
      [
        [
          makeCard("dineri", 9, "p1:9"),
          makeCard("coupe", 2, "p1:2"),
        ],
        [makeCard("bastoni", 5, "p2:5")],
      ],
      [makeCard("spade", 2, "table:2")],
    );
    const legalMoves = getLegalMoves(state, "player-1");

    assert.deepEqual(
      legalMoves.map((move) => move.playedCardId),
      ["p1:2"],
    );
    const rejected = validateMove(state, {
      playerId: "player-1",
      playedCardId: "p1:9",
      captureCardIds: [],
    });
    assert.equal(rejected.ok, false);
    if (!rejected.ok) assert.equal(rejected.error.code, "capture_required");
  });

  it("allows a placement when no card in the hand can capture", () => {
    const state = createActionState(
      [[makeCard("dineri", 7, "p1:7")], [makeCard("coupe", 8, "p2:8")]],
      [makeCard("spade", 2, "table:2")],
    );
    const moves = getLegalMoves(state, "player-1");

    assert.deepEqual(moves, [
      {
        playerId: "player-1",
        playedCardId: "p1:7",
        captureCardIds: [],
        kind: "place",
      },
    ]);
  });

  it("rejects wrong turns, absent cards, duplicate IDs, and invalid captures", () => {
    const state = createActionState(
      [[makeCard("dineri", 7, "p1:7")], [makeCard("coupe", 8, "p2:8")]],
      [makeCard("spade", 3, "table:3"), makeCard("bastoni", 4, "table:4")],
    );
    const wrongTurn = validateMove(state, {
      playerId: "player-2",
      playedCardId: "p2:8",
      captureCardIds: [],
    });
    assert.equal(wrongTurn.ok, false);
    if (!wrongTurn.ok) assert.equal(wrongTurn.error.code, "wrong_turn");

    const absentCard = validateMove(state, {
      playerId: "player-1",
      playedCardId: "not-in-hand",
      captureCardIds: [],
    });
    assert.equal(absentCard.ok, false);
    if (!absentCard.ok) assert.equal(absentCard.error.code, "card_not_in_hand");

    const duplicateIds = validateMove(state, {
      playerId: "player-1",
      playedCardId: "p1:7",
      captureCardIds: ["table:3", "table:3"],
    });
    assert.equal(duplicateIds.ok, false);
    if (!duplicateIds.ok) {
      assert.equal(duplicateIds.error.code, "duplicate_capture_card");
    }

    const invalidCombination = validateMove(state, {
      playerId: "player-1",
      playedCardId: "p1:7",
      captureCardIds: ["table:3"],
    });
    assert.equal(invalidCombination.ok, false);
    if (!invalidCombination.ok) {
      assert.equal(invalidCombination.error.code, "invalid_capture");
    }
  });

  it("rejects moves after a round has completed and malformed runtime input", () => {
    const state = createActionState(
      [[makeCard("dineri", 1, "p1:1")], [makeCard("coupe", 2, "p2:2")]],
      [],
    );
    const completed = { ...state, roundStatus: "complete" as const };
    const afterRound = validateMove(completed, {
      playerId: "player-1",
      playedCardId: "p1:1",
      captureCardIds: [],
    });
    assert.equal(afterRound.ok, false);
    if (!afterRound.ok) assert.equal(afterRound.error.code, "round_complete");

    const malformed = validateMove(
      state,
      {
        playerId: "player-1",
        playedCardId: "p1:1",
        captureCardIds: [42],
      } as unknown as Parameters<typeof validateMove>[1],
    );
    assert.equal(malformed.ok, false);
    if (!malformed.ok) assert.equal(malformed.error.code, "invalid_action");
  });
});

describe("capture execution and Chkobba", () => {
  it("captures only the selected legal subset and keeps the rest on the table", () => {
    const table = [
      makeCard("dineri", 3, "table:3"),
      makeCard("coupe", 4, "table:4"),
      makeCard("spade", 1, "table:1"),
      makeCard("bastoni", 2, "table:2"),
    ];
    const result = captureCards(
      table,
      makeCard("coupe", 7, "played:7"),
      ["table:3", "table:4"],
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(
        result.capturedCards.map((card) => card.id),
        ["table:3", "table:4", "played:7"],
      );
      assert.deepEqual(
        result.remainingTable.map((card) => card.id),
        ["table:1", "table:2"],
      );
      assert.equal(result.kind, "sum");
    }
  });

  it("rejects duplicate or absent cards in a capture", () => {
    const table = [makeCard("dineri", 3, "table:3")];
    const played = makeCard("coupe", 3, "played:3");

    const duplicate = captureCards(table, played, ["table:3", "table:3"]);
    assert.equal(duplicate.ok, false);
    if (!duplicate.ok) {
      assert.equal(duplicate.error.code, "duplicate_capture_card");
    }

    const absent = captureCards(table, played, ["elsewhere:3"]);
    assert.equal(absent.ok, false);
    if (!absent.ok) assert.equal(absent.error.code, "invalid_capture");
  });

  it("places a non-capturing card on the table without recording a capturer", () => {
    const state = createActionState(
      [[makeCard("dineri", 7, "p1:7")], [makeCard("coupe", 8, "p2:8")]],
      [],
    );
    const result = playCard(state, {
      playerId: "player-1",
      playedCardId: "p1:7",
      captureCardIds: [],
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.state.table.map((card) => card.id), ["p1:7"]);
      assert.equal(result.state.lastCapturerPlayerId, null);
      assert.equal(result.chkobbaAwarded, false);
    }
  });

  it("awards Chkobba when a non-final capture clears the table", () => {
    const state = createActionState(
      [
        [makeCard("dineri", 7, "p1:7")],
        [makeCard("coupe", 8, "p2:8")],
      ],
      [makeCard("spade", 7, "table:7")],
    );
    const result = playCard(state, {
      playerId: "player-1",
      playedCardId: "p1:7",
      captureCardIds: ["table:7"],
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.chkobbaAwarded, true);
      assert.equal(result.state.players[0]?.chkobbaCount, 1);
      assert.equal(result.state.lastCapturerPlayerId, "player-1");
      assert.deepEqual(result.state.table, []);
    }
  });

  it("does not award Chkobba for the final play that clears the table", () => {
    const state = createActionState(
      [[makeCard("dineri", 7, "p1:7")], []],
      [makeCard("spade", 7, "table:7")],
    );
    const result = playCard(state, {
      playerId: "player-1",
      playedCardId: "p1:7",
      captureCardIds: ["table:7"],
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.chkobbaAwarded, false);
      assert.equal(result.state.players[0]?.chkobbaCount, 0);
      assert.equal(result.state.roundStatus, "complete");
    }
  });

  it("detects sweeps only when the table is empty and the play is not final", () => {
    assert.equal(
      detectChkobba(
        [makeCard("spade", 1, "table:1")],
        [],
        [[]],
      ),
      false,
    );
    assert.equal(detectChkobba([], [], [[], []]), false);
    assert.equal(
      detectChkobba([], [], [[makeCard("coupe", 2, "hand:2")], []]),
      true,
    );
  });
});

describe("dealing batches and full rounds", () => {
  it("deals a fresh three-card hand to every player after a batch ends", () => {
    let state = createGame(["player-1", "player-2"], {
      startingSeat: 0,
      randomIndex: identityRandomIndex,
    });
    const initialDeckCount = state.deck.length;

    for (let turn = 0; turn < 6; turn += 1) {
      const currentPlayer = state.players[state.currentSeat]!;
      const move = getLegalMoves(state, currentPlayer.id)[0]!;
      const result = playCard(state, {
        playerId: move.playerId,
        playedCardId: move.playedCardId,
        captureCardIds: move.captureCardIds,
      });
      if (!result.ok) assert.fail(result.error.message);
      state = result.state;
    }

    assert.ok(state.players.every((player) => player.hand.length === 3));
    assert.equal(state.deck.length, initialDeckCount - 6);
    assert.equal(state.table.length >= 0, true);
    assert.equal(fullCardCount(state), 40);
  });

  for (const playerCount of [2, 3, 4]) {
    it(`plays a full ${playerCount}-player round without losing or duplicating cards`, () => {
      const state = simulateCompleteRound(playerCount);

      assert.equal(state.roundStatus, "complete");
      assert.equal(state.players.reduce(
        (sum, player) => sum + player.capturedCards.length,
        0,
      ) + state.table.length, 40);
      assert.ok(state.players.every((player) => player.hand.length === 0));
    });
  }
});
