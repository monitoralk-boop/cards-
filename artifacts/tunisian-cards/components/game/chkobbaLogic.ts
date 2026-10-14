export type ChkobbaSuit = 'dineri' | 'coupe' | 'bastoni' | 'spade';

export interface ChkobbaCard {
  id: string;
  suit: ChkobbaSuit;
  rank: number; // 1 to 10
}

export interface PlayerScoreBreakdown {
  carta: { count: number; won: boolean; points: number };
  dineri: { count: number; won: boolean; points: number };
  bermila: { count: number; tieBreakCount: number; won: boolean; points: number };
  sbaaElHaya: { captured: boolean; points: number };
  chkobbas: { count: number; points: number };
  totalRoundPoints: number;
}

export interface RoundResult {
  playerBreakdown: PlayerScoreBreakdown;
  opponentBreakdown: PlayerScoreBreakdown;
  playerTotalScore: number;
  opponentTotalScore: number;
  targetScore: number;
  isGameOver: boolean;
  winner: 'player' | 'opponent' | null;
}

// 1. Create a complete 40-card authentic Tunisian deck
export function createTunisianDeck(): ChkobbaCard[] {
  const suits: ChkobbaSuit[] = ['dineri', 'coupe', 'bastoni', 'spade'];
  const deck: ChkobbaCard[] = [];

  for (const suit of suits) {
    for (let rank = 1; rank <= 10; rank++) {
      deck.push({
        id: `${suit}_${rank}`,
        suit,
        rank,
      });
    }
  }

  return shuffleDeck(deck);
}

// 2. Fisher-Yates shuffle
export function shuffleDeck(deck: ChkobbaCard[]): ChkobbaCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

  // 3. Initial deal: 4 face-up, then 3 cards to each player.
export function initialDeal(): {
  table: ChkobbaCard[];
  playerHand: ChkobbaCard[];
  opponentHand: ChkobbaCard[];
  drawDeck: ChkobbaCard[];
} {
  let deck = createTunisianDeck();

  const table = deck.slice(0, 4);

  const playerHand = deck.slice(4, 7);
  const opponentHand = deck.slice(7, 10);
  const drawDeck = deck.slice(10);

  return {
    table,
    playerHand,
    opponentHand,
    drawDeck,
  };
}

// 4. Find all possible captures for a played card on the current table
export interface PossibleCapture {
  kind: 'exact' | 'sum';
  cards: ChkobbaCard[];
}

export function findPossibleCaptures(
  table: ChkobbaCard[],
  playedCard: ChkobbaCard,
): PossibleCapture[] {
  // RULE 1: Exact rank match takes precedence over sums in Chkobba.
  const exactMatches = table.filter((c) => c.rank === playedCard.rank);
  if (exactMatches.length > 0) {
    // Each matching card is an exact capture option
    return exactMatches.map((m) => ({
      kind: 'exact',
      cards: [m],
    }));
  }

  // RULE 2: With no equal-value card, allow any non-empty table subset to sum to the played value.
  const sumCombinations: ChkobbaCard[][] = [];

  // Helper to find subsets that sum to playedCard.rank
  function findSubsets(
    currentCombo: ChkobbaCard[],
    startIndex: number,
    currentSum: number,
  ) {
    if (currentSum === playedCard.rank && currentCombo.length >= 1) {
      sumCombinations.push([...currentCombo]);
      return;
    }
    if (currentSum >= playedCard.rank) return;

    for (let i = startIndex; i < table.length; i++) {
      const card = table[i];
      if (currentSum + card.rank <= playedCard.rank) {
        currentCombo.push(card);
        findSubsets(currentCombo, i + 1, currentSum + card.rank);
        currentCombo.pop();
      }
    }
  }

  findSubsets([], 0, 0);

  return sumCombinations.map((combo) => ({
    kind: 'sum',
    cards: combo,
  }));
}

// 5. Evaluate card capture value (for AI or auto-selecting best combination)
export function evaluateCaptureQuality(cards: ChkobbaCard[]): number {
  let score = cards.length * 10; // More cards is good for Carta
  for (const c of cards) {
    if (c.suit === 'dineri' && c.rank === 7) {
      score += 500; // Sabaa El Haya!
    } else if (c.rank === 7) {
      score += 200; // Bermila (7)
    } else if (c.suit === 'dineri') {
      score += 100; // Dineri
    }
  }
  return score;
}

// 6. Intelligent Tunisian AI Bot move decision
export interface BotMoveDecision {
  cardToPlay: ChkobbaCard;
  captureToTake: PossibleCapture | null;
  actionMessage: string;
}

export function pickBotMove(
  botHand: ChkobbaCard[],
  table: ChkobbaCard[],
  isLastPlayOfRound: boolean,
): BotMoveDecision {
  let bestScore = -9999;
  let bestCard = botHand[0];
  let bestCapture: PossibleCapture | null = null;
  let bestMessage = '';

  for (const card of botHand) {
    const captures = findPossibleCaptures(table, card);

    if (captures.length > 0) {
      // Bot can capture!
      for (const cap of captures) {
        let moveScore = evaluateCaptureQuality(cap.cards);

        // Check if capture clears table (Chkobba!)
        const remainingCount = table.length - cap.cards.length;
        if (remainingCount === 0 && !isLastPlayOfRound) {
          moveScore += 1000; // Sweep bonus!
        }

        if (moveScore > bestScore) {
          bestScore = moveScore;
          bestCard = card;
          bestCapture = cap;
          const cardNames = cap.cards.map((c) => `${c.rank}`).join(' + ');
          bestMessage =
            remainingCount === 0 && !isLastPlayOfRound
              ? `🔥 أكل (${cardNames}) وعمل شكبة!`
              : `أكل الكارطة (${cardNames})`;
        }
      }
    } else {
      // Discarding on the table: calculate safety of discarding this card
      let discardScore = 0;

      // Penalize throwing 7s (Bermila risk)
      if (card.rank === 7) {
        discardScore -= card.suit === 'dineri' ? 800 : 350;
      }
      // Penalize throwing Dineri
      if (card.suit === 'dineri') {
        discardScore -= 150;
      }
      // Kings (10) are safe to throw because they can only be taken by another King (no sum)
      if (card.rank === 10) {
        discardScore += 50;
      }
      // Low ranks (1, 2, 3) are safer to discard than mid ranks (5, 6)
      if (card.rank <= 3) {
        discardScore += 30;
      }

      if (discardScore > bestScore && !bestCapture) {
        bestScore = discardScore;
        bestCard = card;
        bestCapture = null;
        bestMessage = `رمى ${card.rank} على الطاولة`;
      }
    }
  }

  return {
    cardToPlay: bestCard,
    captureToTake: bestCapture,
    actionMessage: bestMessage || `رمى ${bestCard.rank}`,
  };
}

// 7. Calculate Round Results and Category Scores
export function calculateScores(
  playerCaptured: ChkobbaCard[],
  opponentCaptured: ChkobbaCard[],
  playerChkobbaCount: number,
  opponentChkobbaCount: number,
  previousPlayerTotal: number,
  previousOpponentTotal: number,
  targetScore: number = 21,
): RoundResult {
  // 1. Carta (>20 cards)
  const pCards = playerCaptured.length;
  const oCards = opponentCaptured.length;
  const pCartaWon = pCards > oCards && pCards > 20;
  const oCartaWon = oCards > pCards && oCards > 20;
  const pCartaPts = pCartaWon ? 1 : 0;
  const oCartaPts = oCartaWon ? 1 : 0;

  // 2. Dineri (>5 dineri)
  const pDineri = playerCaptured.filter((c) => c.suit === 'dineri').length;
  const oDineri = opponentCaptured.filter((c) => c.suit === 'dineri').length;
  const pDineriWon = pDineri > oDineri && pDineri > 5;
  const oDineriWon = oDineri > pDineri && oDineri > 5;
  const pDineriPts = pDineriWon ? 1 : 0;
  const oDineriPts = oDineriWon ? 1 : 0;

  // 3. Bermila: most 7s, with most 6s as the tie-break.
  const pSevens = playerCaptured.filter((c) => c.rank === 7).length;
  const oSevens = opponentCaptured.filter((c) => c.rank === 7).length;
  const pSixes = playerCaptured.filter((c) => c.rank === 6).length;
  const oSixes = opponentCaptured.filter((c) => c.rank === 6).length;
  const pBermilaWon = pSevens > oSevens || (pSevens === oSevens && pSixes > oSixes);
  const oBermilaWon = oSevens > pSevens || (pSevens === oSevens && oSixes > pSixes);
  const pBermilaPts = pBermilaWon ? 1 : 0;
  const oBermilaPts = oBermilaWon ? 1 : 0;

  // 4. Sbaa El Haya (7 of Dineri)
  const pSbaa = playerCaptured.some((c) => c.suit === 'dineri' && c.rank === 7);
  const oSbaa = opponentCaptured.some((c) => c.suit === 'dineri' && c.rank === 7);
  const pSbaaPts = pSbaa ? 1 : 0;
  const oSbaaPts = oSbaa ? 1 : 0;

  // 5. Chkobbas (1 pt each)
  const pChkobbaPts = playerChkobbaCount;
  const oChkobbaPts = opponentChkobbaCount;

  // Round Totals
  const pRoundTotal = pCartaPts + pDineriPts + pBermilaPts + pSbaaPts + pChkobbaPts;
  const oRoundTotal = oCartaPts + oDineriPts + oBermilaPts + oSbaaPts + oChkobbaPts;

  const playerTotalScore = previousPlayerTotal + pRoundTotal;
  const opponentTotalScore = previousOpponentTotal + oRoundTotal;

  const isGameOver =
    playerTotalScore >= targetScore || opponentTotalScore >= targetScore;

  let winner: 'player' | 'opponent' | null = null;
  if (isGameOver) {
    if (playerTotalScore > opponentTotalScore) winner = 'player';
    else if (opponentTotalScore > playerTotalScore) winner = 'opponent';
    else winner = null; // tie break round needed
  }

  return {
    playerBreakdown: {
      carta: { count: pCards, won: pCartaWon, points: pCartaPts },
      dineri: { count: pDineri, won: pDineriWon, points: pDineriPts },
      bermila: { count: pSevens, tieBreakCount: pSixes, won: pBermilaWon, points: pBermilaPts },
      sbaaElHaya: { captured: pSbaa, points: pSbaaPts },
      chkobbas: { count: playerChkobbaCount, points: pChkobbaPts },
      totalRoundPoints: pRoundTotal,
    },
    opponentBreakdown: {
      carta: { count: oCards, won: oCartaWon, points: oCartaPts },
      dineri: { count: oDineri, won: oDineriWon, points: oDineriPts },
      bermila: { count: oSevens, tieBreakCount: oSixes, won: oBermilaWon, points: oBermilaPts },
      sbaaElHaya: { captured: oSbaa, points: oSbaaPts },
      chkobbas: { count: opponentChkobbaCount, points: oChkobbaPts },
      totalRoundPoints: oRoundTotal,
    },
    playerTotalScore,
    opponentTotalScore,
    targetScore,
    isGameOver,
    winner,
  };
}
