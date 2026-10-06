import { randomInt } from "node:crypto";
import {
  CHKOBBA_SUITS,
  CHKOBBA_VALUES,
  type CaptureCombination,
  type ChkobbaCard,
  type RandomIndex,
} from "./types.js";

export interface DealtHand {
  readonly playerId: string;
  readonly cards: readonly ChkobbaCard[];
}

export interface DealResult {
  readonly hands: readonly DealtHand[];
  readonly table: readonly ChkobbaCard[];
  readonly deck: readonly ChkobbaCard[];
}

export function secureRandomIndex(exclusiveUpperBound: number): number {
  if (!Number.isSafeInteger(exclusiveUpperBound) || exclusiveUpperBound < 1) {
    throw new RangeError("Random index bound must be a positive safe integer.");
  }

  return randomInt(exclusiveUpperBound);
}

export function createDeck(): ChkobbaCard[] {
  return CHKOBBA_SUITS.flatMap((suit) =>
    CHKOBBA_VALUES.map((value) => ({
      id: `${suit}:${value}`,
      suit,
      value,
    })),
  );
}

export function shuffleDeck(
  deck: readonly ChkobbaCard[],
  randomIndex: RandomIndex = secureRandomIndex,
): ChkobbaCard[] {
  const shuffled = [...deck];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    if (
      !Number.isSafeInteger(swapIndex) ||
      swapIndex < 0 ||
      swapIndex > index
    ) {
      throw new RangeError(
        `Random source returned ${swapIndex} for an exclusive bound of ${index + 1}.`,
      );
    }

    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

/**
 * Deals one card at a time clockwise, three cards per player. Initial deals
 * then place four cards on the table; later batches leave the table unchanged.
 */
export function dealCards(
  deck: readonly ChkobbaCard[],
  playerIds: readonly string[],
  startingSeat: number,
  existingTable: readonly ChkobbaCard[] = [],
  initialDeal = false,
): DealResult {
  if (
    playerIds.length < 2 ||
    playerIds.length > 4 ||
    new Set(playerIds).size !== playerIds.length
  ) {
    throw new RangeError("A deal requires two to four unique player IDs.");
  }
  if (
    !Number.isSafeInteger(startingSeat) ||
    startingSeat < 0 ||
    startingSeat >= playerIds.length
  ) {
    throw new RangeError("Starting seat is outside the player range.");
  }
  if (initialDeal && existingTable.length !== 0) {
    throw new RangeError("The initial deal requires an empty table.");
  }

  const requiredCards = playerIds.length * 3 + (initialDeal ? 4 : 0);
  if (deck.length < requiredCards) {
    throw new RangeError(
      `Not enough cards for a complete ${initialDeal ? "initial" : "batch"} deal.`,
    );
  }

  const hands = playerIds.map((playerId) => ({
    playerId,
    cards: [] as ChkobbaCard[],
  }));
  let deckIndex = 0;

  for (let cardNumber = 0; cardNumber < 3; cardNumber += 1) {
    for (let offset = 0; offset < playerIds.length; offset += 1) {
      const seat = (startingSeat + offset) % playerIds.length;
      hands[seat]?.cards.push(deck[deckIndex]!);
      deckIndex += 1;
    }
  }

  let table = [...existingTable];
  if (initialDeal) {
    table = [...deck.slice(deckIndex, deckIndex + 4)];
    deckIndex += 4;
  }

  return {
    hands,
    table,
    deck: deck.slice(deckIndex),
  };
}

export function getCaptureCombinations(
  table: readonly ChkobbaCard[],
  playedCard: ChkobbaCard,
): CaptureCombination[] {
  const sameValueCards = table.filter(
    (card) => card.value === playedCard.value,
  );

  // Matching value always takes precedence; each matching card is a separate
  // legal single-card capture.
  if (sameValueCards.length > 0) {
    return sameValueCards.map((card) => ({
      kind: "same_value",
      cardIds: [card.id],
    }));
  }

  const candidates = table.filter((card) => card.value < playedCard.value);
  const combinations: CaptureCombination[] = [];
  const selected: ChkobbaCard[] = [];

  function search(startIndex: number, sum: number): void {
    if (sum === playedCard.value) {
      combinations.push({
        kind: "sum",
        cardIds: selected.map((card) => card.id),
      });
      return;
    }

    for (let index = startIndex; index < candidates.length; index += 1) {
      const card = candidates[index]!;
      const nextSum = sum + card.value;
      if (nextSum > playedCard.value) {
        continue;
      }

      selected.push(card);
      search(index + 1, nextSum);
      selected.pop();
    }
  }

  search(0, 0);
  return combinations;
}
