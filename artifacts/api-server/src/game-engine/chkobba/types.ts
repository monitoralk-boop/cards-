export const CHKOBBA_SUITS = [
  "dineri",
  "coupe",
  "bastoni",
  "spade",
] as const;

export const CHKOBBA_VALUES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
] as const;

export type ChkobbaSuit = (typeof CHKOBBA_SUITS)[number];
export type ChkobbaValue = (typeof CHKOBBA_VALUES)[number];
export type TargetScore = 11 | 21 | 31;

export interface ChkobbaCard {
  readonly id: string;
  readonly suit: ChkobbaSuit;
  readonly value: ChkobbaValue;
}

export interface ChkobbaRuleConfig {
  readonly version: string;
  readonly targetScore: TargetScore;
  readonly sumCaptureSelection: "player_choice";
  readonly initialKingReshuffleThreshold: 3;
  /**
   * Null deliberately means the regional Bermila tie-break has not been
   * selected. Scoring must not invent a winner when this policy is needed.
   */
  readonly bermilaTieBreakPolicyId: string | null;
}

export const DEFAULT_CHKOBBA_RULES: ChkobbaRuleConfig = Object.freeze({
  version: "tn-core-v1",
  targetScore: 21,
  sumCaptureSelection: "player_choice",
  initialKingReshuffleThreshold: 3,
  bermilaTieBreakPolicyId: null,
});

export interface ChkobbaPlayerState {
  readonly id: string;
  readonly seat: number;
  readonly sideId: string;
  readonly hand: readonly ChkobbaCard[];
  readonly capturedCards: readonly ChkobbaCard[];
  readonly chkobbaCount: number;
}

export interface SideScore {
  readonly sideId: string;
  readonly points: number;
}

export interface ChkobbaGameState {
  readonly version: 1;
  readonly roundNumber: number;
  readonly gameStatus: "in_progress" | "finished";
  readonly roundStatus: "active" | "complete" | "scored";
  readonly firstPlayerSeat: number;
  readonly currentSeat: number;
  readonly players: readonly ChkobbaPlayerState[];
  readonly deck: readonly ChkobbaCard[];
  readonly table: readonly ChkobbaCard[];
  readonly lastCapturerPlayerId: string | null;
  readonly totalScores: readonly SideScore[];
  readonly rules: ChkobbaRuleConfig;
}

export type CaptureKind = "same_value" | "sum";

export interface CaptureCombination {
  readonly kind: CaptureKind;
  /** IDs of table cards only; the played card is not included. */
  readonly cardIds: readonly string[];
}

export type LegalMoveKind = CaptureKind | "place";

export interface LegalMove {
  readonly playerId: string;
  readonly playedCardId: string;
  readonly captureCardIds: readonly string[];
  readonly kind: LegalMoveKind;
}

export interface ChkobbaMoveAction {
  readonly playerId: string;
  readonly playedCardId: string;
  readonly captureCardIds: readonly string[];
}

export type MoveErrorCode =
  | "invalid_action"
  | "game_finished"
  | "round_complete"
  | "wrong_turn"
  | "card_not_in_hand"
  | "duplicate_capture_card"
  | "capture_required"
  | "invalid_capture";

export interface MoveError {
  readonly code: MoveErrorCode;
  readonly message: string;
}

export type MoveResult =
  | {
      readonly ok: true;
      readonly state: ChkobbaGameState;
      readonly chkobbaAwarded: boolean;
    }
  | {
      readonly ok: false;
      readonly error: MoveError;
    };

export interface SideCardMetrics {
  readonly sideId: string;
  readonly capturedCardCount: number;
  readonly dineriCount: number;
  readonly sevenCount: number;
  readonly chkobbaCount: number;
  readonly capturedCards: readonly ChkobbaCard[];
}

export type ScoreCategory =
  | "carta"
  | "dineri"
  | "bermila"
  | "sabaa_el_haya"
  | "chkobba";

export interface CategoryBreakdown {
  readonly category: ScoreCategory;
  readonly tied: boolean;
  readonly leadingSideIds: readonly string[];
  readonly awardedPoints: readonly SideScore[];
}

export interface RoundScore {
  readonly pointsBySide: readonly SideScore[];
  readonly categories: readonly CategoryBreakdown[];
  readonly metricsBySide: readonly SideCardMetrics[];
}

export type RoundScoreErrorCode =
  | "round_not_complete"
  | "missing_last_capturer"
  | "bermila_tie_break_required"
  | "invalid_bermila_tie_break";

export interface RoundScoreError {
  readonly code: RoundScoreErrorCode;
  readonly message: string;
  readonly tiedSideIds?: readonly string[];
}

export type RoundScoreResult =
  | {
      readonly ok: true;
      readonly score: RoundScore;
    }
  | {
      readonly ok: false;
      readonly error: RoundScoreError;
    };

export interface BermilaTieBreakContext {
  readonly policyId: string;
  readonly tiedSideIds: readonly string[];
  readonly sevenCountsBySide: readonly {
    readonly sideId: string;
    readonly count: number;
  }[];
  readonly capturedCardsBySide: readonly {
    readonly sideId: string;
    readonly cards: readonly ChkobbaCard[];
  }[];
}

/**
 * The resolver is supplied only after a Tunisian tie-break policy is selected.
 * Return a tied side ID to award Bermila, or null if that policy awards no point.
 */
export type BermilaTieBreakResolver = (
  context: BermilaTieBreakContext,
) => string | null;

export interface GameResult {
  readonly finished: boolean;
  readonly targetScore: TargetScore;
  readonly highestScore: number;
  readonly leadingSideIds: readonly string[];
  readonly winnerSideId: string | null;
  readonly reason: "below_target" | "tied_at_target" | "winner";
}

export interface FinishRoundSuccess {
  readonly ok: true;
  readonly state: ChkobbaGameState;
  readonly score: RoundScore;
  readonly gameResult: GameResult;
}

export type FinishRoundResult =
  | FinishRoundSuccess
  | {
      readonly ok: false;
      readonly error: RoundScoreError;
    };

export type StartNextRoundResult =
  | {
      readonly ok: true;
      readonly state: ChkobbaGameState;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code:
          | "game_finished"
          | "round_not_complete"
          | "invalid_starting_seat"
          | "initial_deal_failed";
        readonly message: string;
      };
    };

export type RandomIndex = (exclusiveUpperBound: number) => number;
