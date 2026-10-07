import { Router, type Request, type Response } from "express";
import {
  createGame,
  playCard,
  getLegalMoves,
  type ChkobbaGameState,
} from "../game-engine/chkobba";

const gamesRouter: Router = Router();

// In-memory active game states
const activeGames = new Map<string, ChkobbaGameState>();

/**
 * POST /api/games/chkobba/start
 * Deal a new Chkobba game round
 */
gamesRouter.post("/games/chkobba/start", (req: Request, res: Response) => {
  const { playerCount = 2, targetScore = 21 } = req.body;

  const count = Number(playerCount);
  if (![2, 3, 4].includes(count)) {
    res.status(400).json({ success: false, message: "Nombre de joueurs invalide (2, 3 ou 4)" });
    return;
  }

  const playerIds = Array.from({ length: count }, (_, i) =>
    i === 0 ? "monitoralk" : `player_${i + 1}`,
  );

  const gameId = `chk-${Date.now()}`;
  const gameState = createGame(playerIds, {
    rules: {
      targetScore: Number(targetScore) as 11 | 21 | 31,
    },
  });

  activeGames.set(gameId, gameState);

  const currentPlayer = gameState.players[gameState.currentSeat];
  const legalMoves = currentPlayer ? getLegalMoves(gameState, currentPlayer.id) : [];

  res.json({
    success: true,
    data: {
      gameId,
      playerCount: gameState.players.length,
      currentSeat: gameState.currentSeat,
      tableCards: gameState.table,
      myHand: gameState.players[0]?.hand ?? [],
      roundNumber: gameState.roundNumber,
      gameStatus: gameState.gameStatus,
      roundStatus: gameState.roundStatus,
      legalMoves,
    },
  });
});

/**
 * POST /api/games/chkobba/:id/play
 * Submit a legal move (placement or capture)
 */
gamesRouter.post("/games/chkobba/:id/play", (req: Request, res: Response) => {
  const { id } = req.params;
  const { playedCardId, captureCardIds } = req.body;

  if (typeof id !== "string") {
    res.status(400).json({ success: false, message: "Identifiant invalide" });
    return;
  }

  const gameState = activeGames.get(id);
  if (!gameState) {
    res.status(404).json({ success: false, message: "Partie introuvable" });
    return;
  }

  const currentPlayer = gameState.players[gameState.currentSeat];
  if (!currentPlayer) {
    res.status(400).json({ success: false, message: "Joueur introuvable" });
    return;
  }

  const result = playCard(gameState, {
    playerId: currentPlayer.id,
    playedCardId: String(playedCardId),
    captureCardIds: Array.isArray(captureCardIds) ? captureCardIds.map(String) : [],
  });

  if (!result.ok) {
    res.status(400).json({
      success: false,
      message: result.error.message,
      code: result.error.code,
    });
    return;
  }

  activeGames.set(id, result.state);

  const nextPlayer = result.state.players[result.state.currentSeat];
  const legalMoves = nextPlayer ? getLegalMoves(result.state, nextPlayer.id) : [];

  res.json({
    success: true,
    data: {
      gameId: id,
      tableCards: result.state.table,
      myHand: result.state.players[0]?.hand ?? [],
      currentSeat: result.state.currentSeat,
      chkobbaAwarded: result.chkobbaAwarded,
      gameStatus: result.state.gameStatus,
      roundStatus: result.state.roundStatus,
      legalMoves,
    },
  });
});

export default gamesRouter;
