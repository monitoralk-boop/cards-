import { Router, type Request, type Response } from "express";

const profileRouter: Router = Router();

let userProfile = {
  id: "usr-monitoralk",
  username: "monitoralk",
  level: 1,
  xp: 0,
  xpTarget: 2000,
  coins: 1000,
  stats: {
    gamesPlayed: 18,
    gamesWon: 12,
    winRate: "66.7%",
    chkobbaSweeps: 34,
    sbaaElHayaCaptures: 14,
    totalPointsScored: 246,
  },
  dailyRewardClaimed: false,
  dailyStreak: 4,
};

const leaderboardData = [
  { rank: 1, username: "Sami_Sousse", level: 32, chkobbaSweeps: 412, winRate: "74%" },
  { rank: 2, username: "Nour_Tunis", level: 28, chkobbaSweeps: 388, winRate: "71%" },
  { rank: 3, username: "CH AMINE", level: 24, chkobbaSweeps: 310, winRate: "68%" },
  { rank: 4, username: "monitoralk", level: 1, chkobbaSweeps: 34, winRate: "66.7%" },
  { rank: 5, username: "ANIS", level: 8, chkobbaSweeps: 28, winRate: "52%" },
];

/**
 * GET /api/profile
 */
profileRouter.get("/profile", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: userProfile,
  });
});

/**
 * POST /api/profile/daily-reward
 */
profileRouter.post("/profile/daily-reward", (_req: Request, res: Response) => {
  if (userProfile.dailyRewardClaimed) {
    res.status(400).json({
      success: false,
      message: "Récompense du jour déjà réclamée !",
    });
    return;
  }

  userProfile.dailyRewardClaimed = true;
  userProfile.coins += 500;
  userProfile.xp += 150;

  res.json({
    success: true,
    message: "+500 pièces et +150 XP reçus !",
    data: userProfile,
  });
});

/**
 * GET /api/leaderboard
 */
profileRouter.get("/leaderboard", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: leaderboardData,
  });
});

export default profileRouter;
