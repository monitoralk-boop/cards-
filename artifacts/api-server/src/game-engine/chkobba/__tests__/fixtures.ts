import assert from "node:assert/strict";
import {
  createDeck,
  createGame,
  getLegalMoves,
  playCard,
  type ChkobbaCard,
  type ChkobbaGameState,
  type ChkobbaRuleConfig,
  type ChkobbaSuit,
  type ChkobbaValue,
  type RandomIndex,
} from "../index.js";

export const TEST_BERMILA_POLICY = "test:first-tied-side";

export const identityRandomIndex: RandomIndex = (upperBound) => upperBound - 1;

export function makeCard(
  suit: ChkobbaSuit,
  value: ChkobbaValue,
  id = `${suit}:${value}`,
): ChkobbaCard {
  return { id, suit, value };
}

export function createActionState(
  hands: readonly (readonly ChkobbaCard[])[],
  table: readonly ChkobbaCard[],
  deck: readonly ChkobbaCard[] = [],
): ChkobbaGameState {
  const game = createGame(
    hands.map((_, index) => `player-${index + 1}`),
    { startingSeat: 0, randomIndex: identityRandomIndex },
  );

  return {
    ...game,
    currentSeat: 0,
    gameStatus: "in_progress",
    roundStatus: "active",
    deck,
    table,
    players: game.players.map((player, index) => ({
      ...player,
      hand: hands[index] ?? [],
      capturedCards: [],
      chkobbaCount: 0,
    })),
  };
}

export function createCompletedState(
  piles: readonly (readonly ChkobbaCard[])[],
  options: {
    readonly table?: readonly ChkobbaCard[];
    readonly lastCapturerPlayerId?: string | null;
    readonly chkobbaCounts?: readonly number[];
    readonly rules?: Partial<ChkobbaRuleConfig>;
    readonly totalScores?: ChkobbaGameState["totalScores"];
  } = {},
): ChkobbaGameState {
  const playerIds = piles.map((_, index) => `player-${index + 1}`);
  const game = createGame(playerIds, {
    startingSeat: 0,
    randomIndex: identityRandomIndex,
    rules: options.rules,
  });

  return {
    ...game,
    roundStatus: "complete",
    deck: [],
    table: options.table ?? [],
    lastCapturerPlayerId: options.lastCapturerPlayerId ?? null,
    totalScores: options.totalScores ?? game.totalScores,
    players: game.players.map((player, index) => ({
      ...player,
      hand: [],
      capturedCards: piles[index] ?? [],
      chkobbaCount: options.chkobbaCounts?.[index] ?? 0,
    })),
  };
}

export function completedCardPiles(playerCount: number): ChkobbaCard[][] {
  const cards = createDeck();
  const piles = Array.from({ length: playerCount }, () => [] as ChkobbaCard[]);
  cards.forEach((card, index) => piles[index % playerCount]?.push(card));
  return piles;
}

export function fullCardCount(state: ChkobbaGameState): number {
  return (
    state.deck.length +
    state.table.length +
    state.players.reduce(
      (sum, player) => sum + player.hand.length + player.capturedCards.length,
      0,
    )
  );
}

export function shuffleChoicesFor(
  targetOrder: readonly ChkobbaCard[],
): number[] {
  const working = createDeck();
  assert.equal(targetOrder.length, working.length);
  assert.deepEqual(
    new Set(targetOrder.map((card) => card.id)),
    new Set(working.map((card) => card.id)),
  );

  const choices: number[] = [];
  for (let index = working.length - 1; index > 0; index -= 1) {
    const targetId = targetOrder[index]!.id;
    const swapIndex = working.findIndex(
      (card, candidateIndex) => candidateIndex <= index && card.id === targetId,
    );
    assert.notEqual(swapIndex, -1);
    choices.push(swapIndex);
    [working[index], working[swapIndex]] = [
      working[swapIndex]!,
      working[index]!,
    ];
  }
  assert.deepEqual(
    working.map((card) => card.id),
    targetOrder.map((card) => card.id),
  );
  return choices;
}

export function simulateCompleteRound(playerCount: number): ChkobbaGameState {
  const playerIds = Array.from(
    { length: playerCount },
    (_, index) => `player-${index + 1}`,
  );
  let state = createGame(playerIds, {
    startingSeat: 0,
    randomIndex: identityRandomIndex,
    rules: { bermilaTieBreakPolicyId: TEST_BERMILA_POLICY },
  });
  assert.equal(fullCardCount(state), 40);

  let turns = 0;
  while (state.roundStatus === "active") {
    assert.ok(turns < 40, "a round must finish within one deck of plays");
    const player = state.players[state.currentSeat];
    assert.ok(player, "the current seat must identify a player");
    const move = getLegalMoves(state, player.id)[0];
    assert.ok(move, "the player must have a legal move");
    const result = playCard(state, {
      playerId: move.playerId,
      playedCardId: move.playedCardId,
      captureCardIds: move.captureCardIds,
    });
    if (!result.ok) {
      assert.fail(`Generated legal move failed: ${result.error.message}`);
    }
    state = result.state;
    assert.equal(fullCardCount(state), 40, "no card may be lost or duplicated");
    turns += 1;
  }

  assert.equal(state.roundStatus, "complete");
  assert.equal(state.deck.length, 0);
  assert.ok(state.players.every((player) => player.hand.length === 0));
  return state;
}
