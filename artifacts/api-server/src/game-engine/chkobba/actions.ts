import {
  dealCards,
  getCaptureCombinations,
} from "./cards.js";
import type {
  ChkobbaCard,
  ChkobbaGameState,
  ChkobbaMoveAction,
  LegalMove,
  MoveError,
  MoveResult,
} from "./types.js";

export function getLegalMoves(
  state: ChkobbaGameState,
  playerId: string,
): LegalMove[] {
  if (state.gameStatus !== "in_progress" || state.roundStatus !== "active") {
    return [];
  }

  const player = state.players.find(
    (candidate) => candidate.id === playerId,
  );
  if (!player || player.seat !== state.currentSeat) {
    return [];
  }

  const moves: LegalMove[] = [];
  for (const card of player.hand) {
    const combinations = getCaptureCombinations(state.table, card);
    if (combinations.length === 0) {
      moves.push({
        playerId,
        playedCardId: card.id,
        captureCardIds: [],
        kind: "place",
      });
      continue;
    }

    for (const combination of combinations) {
      moves.push({
        playerId,
        playedCardId: card.id,
        captureCardIds: combination.cardIds,
        kind: combination.kind,
      });
    }
  }

  // A player may not discard a non-capturing card while any card in their
  // hand has a legal capture.
  const captures = moves.filter((move) => move.kind !== "place");
  return captures.length > 0 ? captures : moves;
}

export function validateMove(
  state: ChkobbaGameState,
  action: ChkobbaMoveAction,
):
  | { readonly ok: true; readonly move: LegalMove }
  | { readonly ok: false; readonly error: MoveError } {
  if (
    !action ||
    typeof action.playerId !== "string" ||
    typeof action.playedCardId !== "string" ||
    !Array.isArray(action.captureCardIds) ||
    action.captureCardIds.some((cardId) => typeof cardId !== "string")
  ) {
    return moveError("invalid_action", "The submitted move is malformed.");
  }
  if (state.gameStatus !== "in_progress") {
    return moveError("game_finished", "This game has already finished.");
  }
  if (state.roundStatus !== "active") {
    return moveError("round_complete", "This round has already finished.");
  }

  const currentPlayer = state.players[state.currentSeat];
  if (!currentPlayer || currentPlayer.id !== action.playerId) {
    return moveError("wrong_turn", "It is not this player's turn.");
  }
  if (!currentPlayer.hand.some((card) => card.id === action.playedCardId)) {
    return moveError("card_not_in_hand", "The played card is not in this hand.");
  }
  if (new Set(action.captureCardIds).size !== action.captureCardIds.length) {
    return moveError(
      "duplicate_capture_card",
      "A table card cannot be selected more than once.",
    );
  }

  const legalMoves = getLegalMoves(state, action.playerId);
  const requestedCardIds = canonicalIds(action.captureCardIds);
  const match = legalMoves.find(
    (move) =>
      move.playedCardId === action.playedCardId &&
      sameIds(canonicalIds(move.captureCardIds), requestedCardIds),
  );
  if (match) {
    return { ok: true, move: match };
  }

  const hasAnyCapture = legalMoves.some((move) => move.kind !== "place");
  if (action.captureCardIds.length === 0 && hasAnyCapture) {
    return moveError(
      "capture_required",
      "A legal capture is available and must be taken.",
    );
  }
  return moveError(
    "invalid_capture",
    "The selected cards do not form a legal capture for this move.",
  );
}

export function captureCards(
  table: readonly ChkobbaCard[],
  playedCard: ChkobbaCard,
  selectedCardIds: readonly string[],
):
  | {
      readonly ok: true;
      readonly kind: "same_value" | "sum";
      readonly capturedCards: readonly ChkobbaCard[];
      readonly remainingTable: readonly ChkobbaCard[];
    }
  | {
      readonly ok: false;
      readonly error: MoveError;
    } {
  if (selectedCardIds.length === 0) {
    return moveError(
      "invalid_capture",
      "A capture must include at least one table card.",
    );
  }
  if (new Set(selectedCardIds).size !== selectedCardIds.length) {
    return moveError(
      "duplicate_capture_card",
      "A table card cannot be selected more than once.",
    );
  }

  const selected = new Set(selectedCardIds);
  const combinations = getCaptureCombinations(table, playedCard);
  const combination = combinations.find((candidate) =>
    sameIds(canonicalIds(candidate.cardIds), canonicalIds(selectedCardIds)),
  );
  if (!combination) {
    return moveError(
      "invalid_capture",
      "The selected cards do not form a legal capture.",
    );
  }

  const selectedCards = table.filter((card) => selected.has(card.id));
  if (selectedCards.length !== selected.size) {
    return moveError(
      "invalid_capture",
      "A selected card is not on the table.",
    );
  }

  return {
    ok: true,
    kind: combination.kind,
    capturedCards: [...selectedCards, playedCard],
    remainingTable: table.filter((card) => !selected.has(card.id)),
  };
}

export function detectChkobba(
  remainingTable: readonly ChkobbaCard[],
  remainingDeck: readonly ChkobbaCard[],
  remainingHands: readonly (readonly ChkobbaCard[])[],
): boolean {
  if (remainingTable.length !== 0) {
    return false;
  }

  const isFinalPlay =
    remainingDeck.length === 0 &&
    remainingHands.every((hand) => hand.length === 0);

  // The prompt explicitly excludes a sweep on the round's final played card.
  return !isFinalPlay;
}

export function playCard(
  state: ChkobbaGameState,
  action: ChkobbaMoveAction,
): MoveResult {
  const validation = validateMove(state, action);
  if (!validation.ok) {
    return validation;
  }

  const move = validation.move;
  const playerIndex = state.players.findIndex(
    (player) => player.id === move.playerId,
  );
  const currentPlayer = state.players[playerIndex]!;
  const playedCard = currentPlayer.hand.find(
    (card) => card.id === move.playedCardId,
  )!;
  const remainingHand = currentPlayer.hand.filter(
    (card) => card.id !== move.playedCardId,
  );

  let table = [...state.table];
  let players = state.players.map((player, index) =>
    index === playerIndex
      ? { ...player, hand: remainingHand }
      : { ...player },
  );
  let lastCapturerPlayerId = state.lastCapturerPlayerId;
  let chkobbaAwarded = false;

  if (move.kind === "place") {
    table.push(playedCard);
  } else {
    const capture = captureCards(
      state.table,
      playedCard,
      move.captureCardIds,
    );
    if (!capture.ok) {
      return capture;
    }

    table = [...capture.remainingTable];
    players = players.map((player) =>
      player.id === move.playerId
        ? {
            ...player,
            capturedCards: [
              ...player.capturedCards,
              ...capture.capturedCards,
            ],
          }
        : player,
    );
    lastCapturerPlayerId = move.playerId;

    const nextHands = players.map((player) => player.hand);
    chkobbaAwarded = detectChkobba(table, state.deck, nextHands);
    if (chkobbaAwarded) {
      players = players.map((player) =>
        player.id === move.playerId
          ? { ...player, chkobbaCount: player.chkobbaCount + 1 }
          : player,
      );
    }
  }

  const nextSeat = (state.currentSeat + 1) % state.players.length;
  let deck = [...state.deck];
  const allHandsEmpty = players.every((player) => player.hand.length === 0);

  if (allHandsEmpty && deck.length > 0) {
    try {
      const nextDeal = dealCards(
        deck,
        players.map((player) => player.id),
        nextSeat,
        table,
        false,
      );
      const handsByPlayer = new Map(
        nextDeal.hands.map((hand) => [hand.playerId, hand.cards]),
      );
      players = players.map((player) => ({
        ...player,
        hand: handsByPlayer.get(player.id) ?? [],
      }));
      table = [...nextDeal.table];
      deck = [...nextDeal.deck];
    } catch {
      return moveError(
        "invalid_action",
        "The game state cannot be dealt as a complete card batch.",
      );
    }
  }

  const roundComplete =
    deck.length === 0 && players.every((player) => player.hand.length === 0);

  return {
    ok: true,
    chkobbaAwarded,
    state: {
      ...state,
      players,
      table,
      deck,
      lastCapturerPlayerId,
      currentSeat: nextSeat,
      roundStatus: roundComplete ? "complete" : "active",
    },
  };
}

function moveError(code: MoveError["code"], message: string): {
  readonly ok: false;
  readonly error: MoveError;
} {
  return { ok: false, error: { code, message } };
}

function canonicalIds(cardIds: readonly string[]): string[] {
  return [...cardIds].sort();
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    left.every((cardId, index) => cardId === right[index])
  );
}
