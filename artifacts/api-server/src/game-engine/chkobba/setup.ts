import {
  createDeck,
  dealCards,
  secureRandomIndex,
  shuffleDeck,
} from "./cards.js";
import {
  DEFAULT_CHKOBBA_RULES,
  type ChkobbaGameState,
  type ChkobbaPlayerState,
  type ChkobbaRuleConfig,
  type RandomIndex,
  type StartNextRoundResult,
} from "./types.js";

const MAX_INITIAL_DEAL_ATTEMPTS = 128;

export interface CreateGameOptions {
  readonly rules?: Partial<ChkobbaRuleConfig>;
  readonly startingSeat?: number;
  readonly randomIndex?: RandomIndex;
  readonly maxInitialDealAttempts?: number;
}

export function createGame(
  playerIds: readonly string[],
  options: CreateGameOptions = {},
): ChkobbaGameState {
  validatePlayerIds(playerIds);
  const rules = normalizeRules(options.rules);
  const randomIndex = options.randomIndex ?? secureRandomIndex;
  const startingSeat =
    options.startingSeat ?? getRandomSeat(playerIds.length, randomIndex);
  validateStartingSeat(startingSeat, playerIds.length);

  const maxAttempts =
    options.maxInitialDealAttempts ?? MAX_INITIAL_DEAL_ATTEMPTS;
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError("Initial deal attempts must be a positive integer.");
  }

  const identities = createPlayerIdentities(playerIds);
  const dealt = dealFreshRound(
    identities,
    startingSeat,
    rules,
    randomIndex,
    maxAttempts,
  );

  return {
    version: 1,
    roundNumber: 1,
    gameStatus: "in_progress",
    roundStatus: "active",
    firstPlayerSeat: startingSeat,
    currentSeat: startingSeat,
    players: dealt.players,
    deck: dealt.deck,
    table: dealt.table,
    lastCapturerPlayerId: null,
    totalScores: identities.map((player) => ({
      sideId: player.sideId,
      points: 0,
    })),
    rules,
  };
}

/**
 * Starting-player rotation is supplied by the caller because the prompt does
 * not specify a dealer/lead rotation between rounds.
 */
export function startNextRound(
  state: ChkobbaGameState,
  startingSeat: number,
  randomIndex: RandomIndex = secureRandomIndex,
  maxInitialDealAttempts = MAX_INITIAL_DEAL_ATTEMPTS,
): StartNextRoundResult {
  if (state.gameStatus === "finished") {
    return {
      ok: false,
      error: {
        code: "game_finished",
        message: "A finished game cannot start another round.",
      },
    };
  }
  if (state.roundStatus !== "scored") {
    return {
      ok: false,
      error: {
        code: "round_not_complete",
        message:
          "The current round must be finalized and scored before starting another.",
      },
    };
  }
  if (
    !Number.isSafeInteger(startingSeat) ||
    startingSeat < 0 ||
    startingSeat >= state.players.length
  ) {
    return {
      ok: false,
      error: {
        code: "invalid_starting_seat",
        message: "Starting seat is outside the player range.",
      },
    };
  }

  const identities = state.players.map(({ id, seat, sideId }) => ({
    id,
    seat,
    sideId,
  }));
  let dealt: ReturnType<typeof dealFreshRound>;
  try {
    dealt = dealFreshRound(
      identities,
      startingSeat,
      state.rules,
      randomIndex,
      maxInitialDealAttempts,
    );
  } catch {
    return {
      ok: false,
      error: {
        code: "initial_deal_failed",
        message: "A valid initial deal could not be created.",
      },
    };
  }

  return {
    ok: true,
    state: {
      ...state,
      roundNumber: state.roundNumber + 1,
      gameStatus: "in_progress",
      roundStatus: "active",
      firstPlayerSeat: startingSeat,
      currentSeat: startingSeat,
      players: dealt.players,
      deck: dealt.deck,
      table: dealt.table,
      lastCapturerPlayerId: null,
    },
  };
}

function dealFreshRound(
  identities: readonly Pick<ChkobbaPlayerState, "id" | "seat" | "sideId">[],
  startingSeat: number,
  rules: ChkobbaRuleConfig,
  randomIndex: RandomIndex,
  maxAttempts: number,
): {
  readonly players: ChkobbaPlayerState[];
  readonly table: ChkobbaGameState["table"];
  readonly deck: ChkobbaGameState["deck"];
} {
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError("Initial deal attempts must be a positive integer.");
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const shuffled = shuffleDeck(createDeck(), randomIndex);
    const deal = dealCards(
      shuffled,
      identities.map((player) => player.id),
      startingSeat,
      [],
      true,
    );
    const kingCount = deal.table.filter((card) => card.value === 10).length;
    if (kingCount >= rules.initialKingReshuffleThreshold) {
      continue;
    }

    const handsByPlayer = new Map(
      deal.hands.map((hand) => [hand.playerId, hand.cards]),
    );
    return {
      players: identities.map((player) => ({
        ...player,
        hand: handsByPlayer.get(player.id) ?? [],
        capturedCards: [],
        chkobbaCount: 0,
      })),
      table: deal.table,
      deck: deal.deck,
    };
  }

  throw new Error(
    `Could not find an initial deal with fewer than ${rules.initialKingReshuffleThreshold} Kings in ${maxAttempts} shuffles.`,
  );
}

function normalizeRules(
  partial: Partial<ChkobbaRuleConfig> | undefined,
): ChkobbaRuleConfig {
  const rules = { ...DEFAULT_CHKOBBA_RULES, ...partial };
  if (typeof rules.version !== "string" || !rules.version.trim()) {
    throw new RangeError("Rule version must not be empty.");
  }
  if (![11, 21, 31].includes(rules.targetScore)) {
    throw new RangeError("Target score must be 11, 21, or 31.");
  }
  if (rules.sumCaptureSelection !== "player_choice") {
    throw new RangeError("Unsupported sum-capture selection rule.");
  }
  if (rules.initialKingReshuffleThreshold !== 3) {
    throw new RangeError(
      "This rules version requires a three-King initial-table reshuffle.",
    );
  }
  if (
    rules.bermilaTieBreakPolicyId !== null &&
    (typeof rules.bermilaTieBreakPolicyId !== "string" ||
      !rules.bermilaTieBreakPolicyId.trim())
  ) {
    throw new RangeError(
      "Bermila tie-break policy ID must be nonempty or explicitly null.",
    );
  }
  return rules;
}

function validatePlayerIds(playerIds: readonly string[]): void {
  if (playerIds.length < 2 || playerIds.length > 4) {
    throw new RangeError("Chkobba supports two, three, or four players.");
  }
  if (
    playerIds.some(
      (playerId) => typeof playerId !== "string" || !playerId.trim(),
    ) ||
    new Set(playerIds).size !== playerIds.length
  ) {
    throw new RangeError("Player IDs must be unique, nonempty strings.");
  }
}

function createPlayerIdentities(
  playerIds: readonly string[],
): Pick<ChkobbaPlayerState, "id" | "seat" | "sideId">[] {
  return playerIds.map((id, seat) => ({
    id,
    seat,
    sideId:
      playerIds.length === 4
        ? `team-${(seat % 2) + 1}`
        : `player-${seat + 1}`,
  }));
}

function getRandomSeat(
  playerCount: number,
  randomIndex: RandomIndex,
): number {
  const seat = randomIndex(playerCount);
  validateStartingSeat(seat, playerCount);
  return seat;
}

function validateStartingSeat(seat: number, playerCount: number): void {
  if (
    !Number.isSafeInteger(seat) ||
    seat < 0 ||
    seat >= playerCount
  ) {
    throw new RangeError("Starting seat is outside the player range.");
  }
}
