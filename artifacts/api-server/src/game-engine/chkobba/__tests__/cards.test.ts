import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHKOBBA_SUITS,
  CHKOBBA_VALUES,
  createDeck,
  dealCards,
  getCaptureCombinations,
  secureRandomIndex,
  shuffleDeck,
} from "../index.js";
import {
  identityRandomIndex,
  makeCard,
} from "./fixtures.js";

describe("Chkobba deck and card handling", () => {
  it("creates one unique card for each of four suits and ten values", () => {
    const deck = createDeck();

    assert.equal(deck.length, 40);
    assert.equal(new Set(deck.map((card) => card.id)).size, 40);
    assert.deepEqual(
      new Set(deck.map((card) => card.suit)),
      new Set(CHKOBBA_SUITS),
    );
    assert.deepEqual(
      new Set(deck.map((card) => card.value)),
      new Set(CHKOBBA_VALUES),
    );
    assert.ok(deck.every((card) => card.id === `${card.suit}:${card.value}`));
  });

  it("shuffles a copy and preserves every physical card", () => {
    const deck = createDeck();
    const before = deck.map((card) => card.id);
    const shuffled = shuffleDeck(deck, (upperBound) => upperBound - 1);

    assert.notEqual(shuffled, deck);
    assert.deepEqual(shuffled.map((card) => card.id), before);
    assert.deepEqual(deck.map((card) => card.id), before);

    const randomized = shuffleDeck(deck, () => 0);
    assert.deepEqual(
      new Set(randomized.map((card) => card.id)),
      new Set(before),
    );
    assert.equal(randomized.length, 40);
  });

  it("rejects an invalid shuffle source instead of producing a bad deck", () => {
    assert.throws(
      () => shuffleDeck(createDeck(), () => 40),
      /Random source returned/,
    );
  });

  it("deals three cards per player clockwise, then four initial table cards", () => {
    const deck = createDeck();
    const deal = dealCards(deck, ["p0", "p1", "p2"], 1, [], true);
    const idsByPlayer = new Map(
      deal.hands.map((hand) => [
        hand.playerId,
        hand.cards.map((card) => card.id),
      ]),
    );

    assert.deepEqual(idsByPlayer.get("p0"), [
      deck[2]!.id,
      deck[5]!.id,
      deck[8]!.id,
    ]);
    assert.deepEqual(idsByPlayer.get("p1"), [
      deck[0]!.id,
      deck[3]!.id,
      deck[6]!.id,
    ]);
    assert.deepEqual(idsByPlayer.get("p2"), [
      deck[1]!.id,
      deck[4]!.id,
      deck[7]!.id,
    ]);
    assert.deepEqual(deal.table, deck.slice(9, 13));
    assert.deepEqual(deal.deck, deck.slice(13));
  });

  it("deals later batches without adding cards to the table", () => {
    const deck = createDeck();
    const existingTable = [makeCard("spade", 4, "table:4")];
    const deal = dealCards(deck, ["p0", "p1"], 1, existingTable);

    assert.deepEqual(deal.hands[0]?.cards, [deck[1], deck[3], deck[5]]);
    assert.deepEqual(deal.hands[1]?.cards, [deck[0], deck[2], deck[4]]);
    assert.deepEqual(deal.table, existingTable);
    assert.deepEqual(deal.deck, deck.slice(6));
  });

  it("rejects incomplete or malformed deals", () => {
    assert.throws(
      () => dealCards(createDeck().slice(0, 9), ["p0", "p1"], 0, [], true),
      /Not enough cards/,
    );
    assert.throws(
      () => dealCards(createDeck(), ["p0", "p0"], 0),
      /unique player IDs/,
    );
    assert.throws(
      () => dealCards(createDeck(), ["p0", "p1"], 2),
      /Starting seat/,
    );
    assert.throws(
      () =>
        dealCards(
          createDeck(),
          ["p0", "p1"],
          0,
          [makeCard("spade", 1, "existing:1")],
          true,
        ),
      /empty table/,
    );
  });

  it("returns secure random indexes within the requested range", () => {
    for (const upperBound of [1, 2, 10, 100]) {
      const value = secureRandomIndex(upperBound);
      assert.ok(Number.isSafeInteger(value));
      assert.ok(value >= 0 && value < upperBound);
    }
    assert.throws(() => secureRandomIndex(0), /positive safe integer/);
  });
});

describe("capture combination enumeration", () => {
  it("enumerates every exact-sum subset", () => {
    const table = [
      makeCard("dineri", 1, "t1"),
      makeCard("coupe", 2, "t2"),
      makeCard("bastoni", 3, "t3"),
      makeCard("spade", 4, "t4"),
    ];
    const combinations = getCaptureCombinations(
      table,
      makeCard("coupe", 7, "played:7"),
    );

    assert.deepEqual(
      combinations.map((combination) => combination.cardIds.join("+")).sort(),
      ["t1+t2+t4", "t3+t4"],
    );
    assert.ok(combinations.every((combination) => combination.kind === "sum"));
  });

  it("prioritizes same-value capture over all sum combinations", () => {
    const table = [
      makeCard("dineri", 3, "t3"),
      makeCard("coupe", 4, "t4"),
      makeCard("spade", 7, "t7"),
    ];

    assert.deepEqual(
      getCaptureCombinations(table, makeCard("bastoni", 7, "played:7")),
      [{ kind: "same_value", cardIds: ["t7"] }],
    );
  });

  it("offers each matching-value table card as a separate legal capture", () => {
    const table = [
      makeCard("dineri", 7, "t7a"),
      makeCard("coupe", 7, "t7b"),
      makeCard("spade", 3, "t3"),
      makeCard("bastoni", 4, "t4"),
    ];
    const combinations = getCaptureCombinations(
      table,
      makeCard("spade", 7, "played:7"),
    );

    assert.deepEqual(
      combinations.map((combination) => combination.cardIds),
      [["t7a"], ["t7b"]],
    );
  });

  it("returns no capture when there is neither a match nor an exact sum", () => {
    assert.deepEqual(
      getCaptureCombinations(
        [makeCard("dineri", 2, "t2"), makeCard("coupe", 4, "t4")],
        makeCard("spade", 7, "played:7"),
      ),
      [],
    );
  });

  it("does not mutate the supplied table while enumerating captures", () => {
    const table = [
      makeCard("dineri", 3, "t3"),
      makeCard("coupe", 4, "t4"),
    ];
    const before = [...table];
    getCaptureCombinations(table, makeCard("spade", 7, "played:7"));
    assert.deepEqual(table, before);
  });
});
