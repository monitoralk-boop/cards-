import {
  type BermilaTieBreakResolver,
  type CategoryBreakdown,
  type ChkobbaCard,
  type ChkobbaGameState,
  type FinishRoundResult,
  type GameResult,
  type RoundScoreError,
  type RoundScoreResult,
  type SideCardMetrics,
} from "./types.js";

export function calculateRoundScore(
  state: ChkobbaGameState,
  bermilaTieBreakResolver?: BermilaTieBreakResolver,
): RoundScoreResult {
  if (state.roundStatus !== "complete") {
    return roundScoreError(
      "round_not_complete",
      "Round scoring is available only after every card has been played.",
    );
  }

  const capturedCardsByPlayer = new Map<string, ChkobbaCard[]>(
    state.players.map((player) => [
      player.id,
      [...player.capturedCards],
    ]),
  );

  if (state.table.length > 0) {
    if (!state.lastCapturerPlayerId) {
      return roundScoreError(
        "missing_last_capturer",
        "Remaining table cards cannot be awarded because no player captured during the round.",
      );
    }
    const lastCapturePile = capturedCardsByPlayer.get(
      state.lastCapturerPlayerId,
    );
    if (!lastCapturePile) {
      return roundScoreError(
        "missing_last_capturer",
        "The last capturing player is not part of this game.",
      );
    }
    lastCapturePile.push(...state.table);
  }

  const sideIds = unique(state.players.map((player) => player.sideId));
  if (sideIds.length === 0) {
    return roundScoreError(
      "round_not_complete",
      "Cannot score a round without players.",
    );
  }

  const cardsBySide = new Map<string, ChkobbaCard[]>(
    sideIds.map((sideId) => [sideId, []]),
  );
  const chkobbasBySide = new Map<string, number>(
    sideIds.map((sideId) => [sideId, 0]),
  );

  for (const player of state.players) {
    cardsBySide.get(player.sideId)?.push(
      ...(capturedCardsByPlayer.get(player.id) ?? []),
    );
    chkobbasBySide.set(
      player.sideId,
      (chkobbasBySide.get(player.sideId) ?? 0) + player.chkobbaCount,
    );
  }

  const metricsBySide: SideCardMetrics[] = sideIds.map((sideId) => {
    const cards = cardsBySide.get(sideId) ?? [];
    return {
      sideId,
      capturedCards: cards,
      capturedCardCount: cards.length,
      dineriCount: cards.filter((card) => card.suit === "dineri").length,
      sevenCount: cards.filter((card) => card.value === 7).length,
      chkobbaCount: chkobbasBySide.get(sideId) ?? 0,
    };
  });

  const points = new Map<string, number>(sideIds.map((sideId) => [sideId, 0]));
  const categories: CategoryBreakdown[] = [];
  const cardLeaders = maximumSideIds(metricsBySide, (metric) =>
    metric.capturedCardCount,
  );
  categories.push(
    awardUniqueLeader("carta", cardLeaders, 1, points, sideIds),
  );

  const dineriLeaders = maximumSideIds(
    metricsBySide,
    (metric) => metric.dineriCount,
  );
  categories.push(
    awardUniqueLeader("dineri", dineriLeaders, 1, points, sideIds),
  );

  const sevenLeaders = maximumSideIds(
    metricsBySide,
    (metric) => metric.sevenCount,
  );
  if (sevenLeaders.length > 1) {
    const policyId = state.rules.bermilaTieBreakPolicyId;
    if (!policyId || !bermilaTieBreakResolver) {
      return roundScoreError(
        "bermila_tie_break_required",
        "The Bermila seven-count is tied; configure the Tunisian tie-break before finalizing this round.",
        sevenLeaders,
      );
    }

    let resolvedSideId: string | null;
    try {
      resolvedSideId = bermilaTieBreakResolver({
        policyId,
        tiedSideIds: sevenLeaders,
        sevenCountsBySide: metricsBySide.map((metric) => ({
          sideId: metric.sideId,
          count: metric.sevenCount,
        })),
        capturedCardsBySide: metricsBySide.map((metric) => ({
          sideId: metric.sideId,
          cards: metric.capturedCards,
        })),
      });
    } catch {
      return roundScoreError(
        "invalid_bermila_tie_break",
        "The configured Bermila tie-break policy could not resolve the tie.",
        sevenLeaders,
      );
    }

    if (resolvedSideId !== null && !sevenLeaders.includes(resolvedSideId)) {
      return roundScoreError(
        "invalid_bermila_tie_break",
        "The configured Bermila tie-break selected a side that was not tied.",
        sevenLeaders,
      );
    }
    if (resolvedSideId) {
      points.set(
        resolvedSideId,
        (points.get(resolvedSideId) ?? 0) + 1,
      );
    }
    categories.push({
      category: "bermila",
      tied: true,
      leadingSideIds: sevenLeaders,
      awardedPoints: resolvedSideId
        ? [{ sideId: resolvedSideId, points: 1 }]
        : [],
    });
  } else {
    categories.push(
      awardUniqueLeader("bermila", sevenLeaders, 1, points, sideIds),
    );
  }

  const sevenOfDineri = metricsBySide.find((metric) =>
    metric.capturedCards.some(
      (card) => card.suit === "dineri" && card.value === 7,
    ),
  );
  const sabaaWinnerIds = sevenOfDineri ? [sevenOfDineri.sideId] : [];
  if (sevenOfDineri) {
    points.set(
      sevenOfDineri.sideId,
      (points.get(sevenOfDineri.sideId) ?? 0) + 1,
    );
  }
  categories.push({
    category: "sabaa_el_haya",
    tied: false,
    leadingSideIds: sabaaWinnerIds,
    awardedPoints: sevenOfDineri
      ? [{ sideId: sevenOfDineri.sideId, points: 1 }]
      : [],
  });

  const chkobbaAwards = metricsBySide
    .filter((metric) => metric.chkobbaCount > 0)
    .map((metric) => ({
      sideId: metric.sideId,
      points: metric.chkobbaCount,
    }));
  for (const award of chkobbaAwards) {
    points.set(
      award.sideId,
      (points.get(award.sideId) ?? 0) + award.points,
    );
  }
  categories.push({
    category: "chkobba",
    tied: false,
    leadingSideIds: chkobbaAwards.map((award) => award.sideId),
    awardedPoints: chkobbaAwards,
  });

  return {
    ok: true,
    score: {
      pointsBySide: sideIds.map((sideId) => ({
        sideId,
        points: points.get(sideId) ?? 0,
      })),
      categories,
      metricsBySide,
    },
  };
}

export function finishRound(
  state: ChkobbaGameState,
  bermilaTieBreakResolver?: BermilaTieBreakResolver,
): FinishRoundResult {
  const scoreResult = calculateRoundScore(state, bermilaTieBreakResolver);
  if (!scoreResult.ok) {
    return scoreResult;
  }

  const capturedCardsByPlayer = new Map<string, ChkobbaCard[]>(
    state.players.map((player) => [
      player.id,
      [...player.capturedCards],
    ]),
  );
  if (state.table.length > 0 && state.lastCapturerPlayerId) {
    capturedCardsByPlayer
      .get(state.lastCapturerPlayerId)
      ?.push(...state.table);
  }

  const players = state.players.map((player) => ({
    ...player,
    capturedCards: capturedCardsByPlayer.get(player.id) ?? [],
  }));
  const pointsBySide = new Map(
    scoreResult.score.pointsBySide.map((item) => [
      item.sideId,
      item.points,
    ]),
  );
  const totalScores = state.totalScores.map((item) => ({
    ...item,
    points: item.points + (pointsBySide.get(item.sideId) ?? 0),
  }));
  const scoredState: ChkobbaGameState = {
    ...state,
    players,
    table: [],
    totalScores,
    roundStatus: "scored",
  };
  const gameResult = finishGame(scoredState);

  return {
    ok: true,
    score: scoreResult.score,
    gameResult,
    state: {
      ...scoredState,
      gameStatus: gameResult.finished ? "finished" : "in_progress",
    },
  };
}

export function finishGame(state: ChkobbaGameState): GameResult {
  const highestScore = Math.max(
    ...state.totalScores.map((item) => item.points),
    0,
  );
  const leadingSideIds = state.totalScores
    .filter((item) => item.points === highestScore)
    .map((item) => item.sideId);

  if (highestScore < state.rules.targetScore) {
    return {
      finished: false,
      targetScore: state.rules.targetScore,
      highestScore,
      leadingSideIds,
      winnerSideId: null,
      reason: "below_target",
    };
  }

  if (leadingSideIds.length !== 1) {
    return {
      finished: false,
      targetScore: state.rules.targetScore,
      highestScore,
      leadingSideIds,
      winnerSideId: null,
      reason: "tied_at_target",
    };
  }

  return {
    finished: true,
    targetScore: state.rules.targetScore,
    highestScore,
    leadingSideIds,
    winnerSideId: leadingSideIds[0]!,
    reason: "winner",
  };
}

function roundScoreError(
  code: RoundScoreError["code"],
  message: string,
  tiedSideIds?: readonly string[],
): RoundScoreResult {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(tiedSideIds ? { tiedSideIds } : {}),
    },
  };
}

function maximumSideIds(
  metrics: readonly SideCardMetrics[],
  getValue: (metric: SideCardMetrics) => number,
): string[] {
  const highest = Math.max(...metrics.map(getValue));
  return metrics
    .filter((metric) => getValue(metric) === highest)
    .map((metric) => metric.sideId);
}

function awardUniqueLeader(
  category: CategoryBreakdown["category"],
  leaders: readonly string[],
  pointsToAward: number,
  totals: Map<string, number>,
  sideIds: readonly string[],
): CategoryBreakdown {
  const tied = leaders.length !== 1;
  const awardedPoints =
    !tied && leaders.length === 1
      ? [{ sideId: leaders[0]!, points: pointsToAward }]
      : [];
  for (const award of awardedPoints) {
    totals.set(
      award.sideId,
      (totals.get(award.sideId) ?? 0) + award.points,
    );
  }

  return {
    category,
    tied,
    leadingSideIds: leaders.length > 0 ? leaders : [...sideIds],
    awardedPoints,
  };
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
