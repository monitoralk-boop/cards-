export type RamiSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type RamiPlayerId = string;

export interface RamiCard {
  id: string;
  suit: RamiSuit | 'joker';
  rank: number;
}

export interface RamiMeldCard {
  card: RamiCard;
  /** Rank represented by a joker; required for joker cards. */
  representedRank?: number;
  /** Suit represented by a joker; required for joker cards. */
  representedSuit?: RamiSuit;
}

export interface RamiMeld {
  id: string;
  kind: 'set' | 'sequence';
  cards: RamiMeldCard[];
  ownerId: RamiPlayerId;
  faceDown?: boolean;
}

export interface RamiPlayerState {
  id: RamiPlayerId;
  name: string;
  hand: RamiCard[];
  opened: boolean;
  score: number;
}

export type RamiPhase = 'freesh' | 'draw' | 'play' | 'roundOver';

export interface RamiGameState {
  players: RamiPlayerState[];
  drawPile: RamiCard[];
  discardPile: RamiCard[];
  melds: RamiMeld[];
  dealerIndex: number;
  currentPlayerIndex: number;
  phase: RamiPhase;
  turnNumber: number;
  firstOpeningLimit: number | null;
  winnerId: RamiPlayerId | null;
  roundNumber: number;
  message: string;
}

export type RamiActionResult = { ok: true; state: RamiGameState } | { ok: false; error: string };

export const createRamiDeck = (): RamiCard[] => {
  const suits: RamiSuit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const cards: RamiCard[] = [];
  for (let pack = 0; pack < 2; pack++) {
    for (const suit of suits) {
      for (let rank = 1; rank <= 13; rank++) {
        cards.push({ id: `${pack}-${suit}-${rank}`, suit, rank });
      }
    }
    for (let joker = 0; joker < 2; joker++) {
      cards.push({ id: `${pack}-joker-${joker}`, suit: 'joker', rank: 0 });
    }
  }
  return cards;
};

export const shuffleRamiDeck = (cards: RamiCard[]): RamiCard[] => {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const rankValue = (rank: number): number => rank === 1 || rank >= 11 ? 10 : rank;
const cardValue = (card: RamiCard): number => card.suit === 'joker' ? 10 : rankValue(card.rank);

export function countDuplicatePairs(hand: RamiCard[]): number {
  const counts = new Map<string, number>();
  for (const card of hand) {
    if (card.suit === 'joker') continue;
    const key = `${card.rank}:${card.suit}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.values()].reduce((pairs, count) => pairs + Math.floor(count / 2), 0);
}

export function canCallFreesh(hand: RamiCard[]): boolean {
  const jokers = hand.filter((card) => card.suit === 'joker').length;
  return countDuplicatePairs(hand) >= 3 + jokers;
}

export function isValidRamiDeal(state: RamiGameState): boolean {
  if (state.players.length < 2 || state.players.length > 4) return false;
  if (state.players[state.dealerIndex]?.hand.length !== 15) return false;
  if (state.players.some((player, index) => index !== state.dealerIndex && player.hand.length !== 14)) return false;
  const cards = [...state.drawPile, ...state.discardPile, ...state.players.flatMap((player) => player.hand)];
  return cards.length === 108 && new Set(cards.map((card) => card.id)).size === 108;
}

export function createRamiGame(
  names: string[] = ['You', 'Bot'],
  dealerIndex = 0,
  roundNumber = 1,
  cumulativeScores: number[] = [],
): RamiGameState {
  if (names.length < 2 || names.length > 4) throw new Error('Rami requires two to four players.');
  for (let attempt = 0; attempt < 100; attempt++) {
    const state = dealRamiRound(names, dealerIndex, roundNumber, cumulativeScores);
    if (!state.players.some((player) => canCallFreesh(player.hand))) return state;
  }
  throw new Error('Unable to find a deal without a Freesh after 100 shuffles.');
}

function dealRamiRound(
  names: string[], dealerIndex: number, roundNumber: number, cumulativeScores: number[],
): RamiGameState {
  const deck = shuffleRamiDeck(createRamiDeck());
  const dealer = ((dealerIndex % names.length) + names.length) % names.length;
  const players = names.map((name, index) => ({
    id: `player-${index}`,
    name,
    hand: [] as RamiCard[],
    opened: false,
    score: cumulativeScores[index] ?? 0,
  }));
  for (let i = 0; i < players.length; i++) {
    const seat = (dealer + i) % players.length;
    const count = seat === dealer ? 15 : 14;
    players[seat].hand = deck.splice(0, count);
  }
  const state: RamiGameState = {
    players,
    drawPile: deck,
    discardPile: [],
    melds: [],
    dealerIndex: dealer,
    currentPlayerIndex: dealer,
    phase: 'play',
    turnNumber: 0,
    firstOpeningLimit: null,
    winnerId: null,
    roundNumber,
    message: 'Check hands for Freesh before play.',
  };
  return state;
}

export function validateRamiMeld(cards: RamiMeldCard[]): { kind: RamiMeld['kind']; points: number } | null {
  if (cards.length < 3) return null;
  if (new Set(cards.map(({ card }) => card.id)).size !== cards.length) return null;
  if (cards.some(({ card, representedSuit, representedRank }) => card.suit === 'joker' && (!representedSuit || !representedRank || representedRank < 1 || representedRank > 13))) return null;
  const values = cards.map(({ card, representedRank, representedSuit }) => ({
    suit: card.suit === 'joker' ? representedSuit : card.suit,
    rank: card.suit === 'joker' ? representedRank! : card.rank,
    isJoker: card.suit === 'joker',
  }));
  const set = values.every((value) => value.rank === values[0].rank) && new Set(values.map((value) => value.suit)).size === values.length && values.length <= 4;
  const sequence = values.every((value) => value.suit === values[0].suit) && new Set(values.map((value) => value.rank)).size === values.length && (() => {
    const ranks = values.map((value) => value.rank).sort((a, b) => a - b);
    return ranks.every((rank, index) => index === 0 || rank === ranks[index - 1] + 1);
  })();
  if (!set && !sequence) return null;
  return { kind: set ? 'set' : 'sequence', points: values.reduce((sum, value) => sum + rankValue(value.rank), 0) };
}

export function findPlusPlayableCardIds(state: RamiGameState, playerId: RamiPlayerId): Set<string> {
  const hand = state.players.find((player) => player.id === playerId)?.hand ?? [];
  const result = new Set<string>();
  for (const meld of state.melds) {
    if (meld.faceDown) continue;
    for (const card of hand) {
      if (card.suit === 'joker') continue;
      const extended = meld.kind === 'set'
        ? meld.cards.length < 4 && meld.cards.some((entry) => (entry.card.suit === 'joker' ? entry.representedRank : entry.card.rank) === card.rank) && !meld.cards.some((entry) => entry.card.suit === card.suit && entry.card.rank === card.rank)
        : (() => {
            const real = meld.cards.filter((entry) => entry.card.suit !== 'joker');
            if (!real.length || real[0].card.suit !== card.suit) return false;
            const ranks = meld.cards.map((entry) => entry.card.suit === 'joker' ? entry.representedRank! : entry.card.rank);
            return card.rank === Math.min(...ranks) - 1 || card.rank === Math.max(...ranks) + 1;
          })();
      if (extended) result.add(card.id);
    }
  }
  return result;
}

const fail = (error: string): RamiActionResult => ({ ok: false, error });
const ok = (state: RamiGameState): RamiActionResult => ({ ok: true, state });

export function drawRamiCard(state: RamiGameState, source: 'draw' | 'discard'): RamiActionResult {
  if (state.phase !== 'draw') return fail('You must finish the current turn first.');
  if (state.turnNumber === 0) return fail('The dealer must discard first; no card is drawn on the opening turn.');
  if (state.turnNumber === 1 && source !== 'draw') return fail('The first player after the dealer must draw from the draw pile.');
  const pile = source === 'draw' ? state.drawPile : state.discardPile;
  if (!pile.length) return fail(`The ${source} pile is empty.`);
  const players = state.players.map((player) => ({ ...player, hand: [...player.hand] }));
  const card = source === 'draw' ? pile[0] : pile[pile.length - 1];
  const player = players[state.currentPlayerIndex];
  player.hand.push(card);
  return ok({
    ...state,
    players,
    drawPile: source === 'draw' ? state.drawPile.slice(1) : state.drawPile,
    discardPile: source === 'discard' ? state.discardPile.slice(0, -1) : state.discardPile,
    phase: 'play',
    message: `${player.name} drew a card.`,
  });
}

export function meldRamiCards(state: RamiGameState, playerId: RamiPlayerId, cards: RamiMeldCard[]): RamiActionResult {
  if (state.phase !== 'play') return fail('Draw before melding.');
  if (state.turnNumber === 0) return fail('The dealer must discard first; melding starts on the next turn.');
  const player = state.players[state.currentPlayerIndex];
  if (player.id !== playerId) return fail('It is not this player’s turn.');
  const valid = validateRamiMeld(cards);
  if (!valid) return fail('Meld must be a valid set or same-suit consecutive sequence of at least three cards.');
  if (cards.some(({ card }) => !player.hand.some((held) => held.id === card.id))) return fail('You can only meld cards from your hand.');
  if (!player.opened && state.firstOpeningLimit !== null && cards.some(({ card }) => card.suit === 'joker')) return fail('Jokers cannot be used in an initial opening.');
  if (!player.opened && state.firstOpeningLimit !== null && valid.points <= state.firstOpeningLimit) return fail(`Your opening must exceed ${state.firstOpeningLimit} points.`);
  const players = state.players.map((entry) => entry.id === playerId ? { ...entry, hand: entry.hand.filter((held) => !cards.some(({ card }) => card.id === held.id)), opened: true } : { ...entry });
  const meld: RamiMeld = { id: `meld-${state.roundNumber}-${state.turnNumber}-${state.melds.length}`, kind: valid.kind, cards: cards.map((entry) => ({ ...entry })), ownerId: playerId };
  return ok({ ...state, players, melds: [...state.melds, meld], firstOpeningLimit: state.firstOpeningLimit ?? valid.points, message: `${player.name} melded ${valid.points} points.` });
}

export function addRamiCardToMeld(state: RamiGameState, playerId: RamiPlayerId, cardId: string, meldId: string): RamiActionResult {
  if (state.phase !== 'play') return fail('Draw before adding to a meld.');
  if (state.turnNumber === 0) return fail('The dealer must discard first; melding starts on the next turn.');
  const player = state.players[state.currentPlayerIndex];
  if (player.id !== playerId) return fail('It is not this player’s turn.');
  if (!player.opened) return fail('Open your table before adding cards to melds.');
  const card = player.hand.find((entry) => entry.id === cardId);
  const meld = state.melds.find((entry) => entry.id === meldId && !entry.faceDown);
  if (!card || !meld) return fail('Card or active meld not found.');
  const addition: RamiMeldCard = { card };
  const valid = meld.kind === 'set'
    ? meld.cards.length < 4 && meld.cards.every((entry) => (entry.card.suit === 'joker' ? entry.representedRank : entry.card.rank) === card.rank) && !meld.cards.some((entry) => entry.card.suit === card.suit && entry.card.rank === card.rank)
    : (() => {
        const ranks = meld.cards.map((entry) => entry.card.suit === 'joker' ? entry.representedRank! : entry.card.rank);
        const suits = meld.cards.map((entry) => entry.card.suit === 'joker' ? entry.representedSuit : entry.card.suit);
        return suits.every((suit) => suit === card.suit) && (card.rank === Math.min(...ranks) - 1 || card.rank === Math.max(...ranks) + 1);
      })();
  if (!valid) return fail('This card cannot extend that meld.');
  const players = state.players.map((entry) => entry.id === playerId ? { ...entry, hand: entry.hand.filter((held) => held.id !== cardId), opened: true } : { ...entry });
  const melds = state.melds.map((entry) => entry.id === meldId ? { ...entry, cards: [...entry.cards, addition] } : entry);
  const nextState = { ...state, players, melds, message: `${player.name} added to a meld.` };
  if (meld.kind === 'sequence' && meld.cards.some((entry) => entry.card.suit === 'joker' && entry.representedRank === card.rank && entry.representedSuit === card.suit)) {
    nextState.melds = melds.map((entry) => entry.id === meldId ? { ...entry, cards: entry.cards.filter((meldCard) => meldCard.card.suit !== 'joker') } : entry);
    nextState.players = players.map((entry) => entry.id === playerId ? { ...entry, hand: [...entry.hand, meld.cards.find((meldCard) => meldCard.card.suit === 'joker')!.card] } : entry);
  }
  return ok(nextState);
}

export function exchangeRamiJoker(state: RamiGameState, playerId: RamiPlayerId, jokerId: string, replacementId: string): RamiActionResult {
  if (state.phase !== 'play') return fail('Draw before exchanging a joker.');
  if (state.turnNumber === 0) return fail('The dealer must discard first; joker exchanges start on the next turn.');
  const player = state.players[state.currentPlayerIndex];
  if (player.id !== playerId) return fail('It is not this player’s turn.');
  if (!player.opened) return fail('Open your table before exchanging a joker.');
  const held = player.hand.find((card) => card.id === replacementId);
  const meld = state.melds.find((entry) => !entry.faceDown && entry.cards.some((card) => card.card.id === jokerId));
  const joker = meld?.cards.find((entry) => entry.card.id === jokerId);
  if (!held || held.suit === 'joker' || !meld || !joker || held.rank !== joker.representedRank || held.suit !== joker.representedSuit) return fail('You do not hold the exact card represented by that joker.');
  const players = state.players.map((entry) => entry.id === playerId ? { ...entry, hand: [...entry.hand.filter((card) => card.id !== replacementId), joker.card] } : { ...entry });
  const melds = state.melds.map((entry) => entry.id === meld.id ? { ...entry, cards: entry.cards.map((card) => card.card.id === jokerId ? { card: held } : card) } : entry);
  return ok({ ...state, players, melds, message: `${player.name} reclaimed a joker.` });
}

export function discardRamiCard(state: RamiGameState, playerId: RamiPlayerId, cardId: string, faceDown = false): RamiActionResult {
  if (state.phase !== 'play') return fail('Draw before discarding.');
  const player = state.players[state.currentPlayerIndex];
  if (player.id !== playerId) return fail('It is not this player’s turn.');
  const card = player.hand.find((entry) => entry.id === cardId);
  if (!card) return fail('Card is not in this hand.');
  if (card.suit === 'joker') return fail('Jokers cannot be discarded.');
  const last = player.hand.length === 1;
  if (last && !faceDown) return fail('Your final card must be discarded face down.');
  if (!last && faceDown) return fail('Only the final card may be discarded face down.');
  if (!last && findPlusPlayableCardIds(state, playerId).has(cardId)) return fail('Plus rule: this card can extend a table meld; add it or keep it.');
  const players = state.players.map((entry) => entry.id === playerId ? { ...entry, hand: entry.hand.filter((held) => held.id !== cardId) } : { ...entry });
  const discardPile = faceDown ? state.discardPile : [...state.discardPile, card];
  if (last) {
    return ok({ ...state, players, discardPile, phase: 'roundOver', winnerId: playerId, message: `${player.name} went out.` });
  }
  const next = (state.currentPlayerIndex + 1) % state.players.length;
  return ok({ ...state, players, discardPile, currentPlayerIndex: next, phase: 'draw', turnNumber: state.turnNumber + 1, message: `${players[next].name}'s turn.` });
}

export function resolveRamiDeadMelds(state: RamiGameState): RamiGameState {
  const melds = state.melds.map((meld) => {
    if (meld.faceDown) return meld;
    if (meld.kind === 'set' && meld.cards.length === 4) return { ...meld, faceDown: true };
    if (meld.kind === 'sequence') {
      const ranks = meld.cards.map((entry) => entry.card.suit === 'joker' ? entry.representedRank! : entry.card.rank).sort((a, b) => a - b);
      if (ranks.length >= 13 && ranks[0] === 1 && ranks[ranks.length - 1] === 13) return { ...meld, faceDown: true };
    }
    return meld;
  });
  return { ...state, melds };
}

export function scoreRamiRound(state: RamiGameState): RamiGameState {
  if (state.phase !== 'roundOver') return state;
  const players = state.players.map((player) => {
    const penalty = Math.min(100, player.hand.reduce((sum, card) => sum + cardValue(card), 0));
    const onlyJokers = player.hand.length > 0 && player.hand.every((card) => card.suit === 'joker');
    if (player.id === state.winnerId) return player;
    return { ...player, score: player.score + penalty + (onlyJokers ? 100 : 0) };
  });
  return { ...state, players };
}

export function completeRamiRound(state: RamiGameState): RamiGameState {
  return resolveRamiDeadMelds(scoreRamiRound(state));
}

export function chooseRamiMatchWinner(players: RamiPlayerState[]): RamiPlayerId | null {
  if (!players.length) return null;
  return [...players].sort((a, b) => a.score - b.score)[0].id;
}