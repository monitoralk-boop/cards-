import { Router, type Request, type Response } from "express";

const friendsRouter: Router = Router();

export interface FriendItem {
  id: string;
  username: string;
  avatarColor: string;
  level: number;
  isOnline: boolean;
  statusText: string;
}

export interface FriendRequestItem {
  id: string;
  fromUsername: string;
  level: number;
  avatarColor: string;
  sentAt: string;
}

// In-memory fallback mock data store (syncs with Supabase DB when connected)
let mockFriends: FriendItem[] = [
  {
    id: "f-1",
    username: "CH AMINE",
    avatarColor: "#E65100",
    level: 14,
    isOnline: true,
    statusText: "En ligne · À la table Chkobba #102",
  },
  {
    id: "f-2",
    username: "ANIS",
    avatarColor: "#1976D2",
    level: 8,
    isOnline: true,
    statusText: "En ligne · Dans le lobby",
  },
  {
    id: "f-3",
    username: "OUSSAMA",
    avatarColor: "#388E3C",
    level: 22,
    isOnline: false,
    statusText: "Hors ligne · Il y a 2h",
  },
  {
    id: "f-4",
    username: "MAHDI V.",
    avatarColor: "#8E24AA",
    level: 19,
    isOnline: false,
    statusText: "Hors ligne · Hier",
  },
];

let mockFriendRequests: FriendRequestItem[] = [
  {
    id: "req-1",
    fromUsername: "Yassine_Tunis",
    level: 5,
    avatarColor: "#00897B",
    sentAt: "Il y a 10 min",
  },
];

/**
 * GET /api/friends
 * Get list of friends with online/offline status
 */
friendsRouter.get("/friends", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockFriends,
  });
});

/**
 * GET /api/friends/requests
 * Get pending friend requests
 */
friendsRouter.get("/friends/requests", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockFriendRequests,
  });
});

/**
 * POST /api/friends/requests
 * Send a friend request by username
 */
friendsRouter.post("/friends/requests", (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username || typeof username !== "string") {
    res.status(400).json({ success: false, message: "Nom d'utilisateur requis" });
    return;
  }

  const existingFriend = mockFriends.find(
    (f) => f.username.toLowerCase() === username.trim().toLowerCase(),
  );
  if (existingFriend) {
    res.status(400).json({ success: false, message: "Cet utilisateur est déjà dans vos amis." });
    return;
  }

  // Simulate pending request
  res.json({
    success: true,
    message: `Demande d'ami envoyée à ${username.trim()} avec succès !`,
  });
});

/**
 * POST /api/friends/requests/:id/accept
 * Accept a friend request
 */
friendsRouter.post("/friends/requests/:id/accept", (req: Request, res: Response) => {
  const { id } = req.params;
  const request = mockFriendRequests.find((r) => r.id === id);

  if (!request) {
    res.status(404).json({ success: false, message: "Demande introuvable" });
    return;
  }

  // Move to friends
  const newFriend: FriendItem = {
    id: `f-${Date.now()}`,
    username: request.fromUsername,
    avatarColor: request.avatarColor,
    level: request.level,
    isOnline: true,
    statusText: "En ligne",
  };

  mockFriends.push(newFriend);
  mockFriendRequests = mockFriendRequests.filter((r) => r.id !== id);

  res.json({
    success: true,
    message: `${request.fromUsername} a été ajouté à votre liste d'amis !`,
    friend: newFriend,
  });
});

/**
 * POST /api/friends/requests/:id/reject
 * Reject a friend request
 */
friendsRouter.post("/friends/requests/:id/reject", (req: Request, res: Response) => {
  const { id } = req.params;
  mockFriendRequests = mockFriendRequests.filter((r) => r.id !== id);
  res.json({
    success: true,
    message: "Demande refusée",
  });
});

/**
 * DELETE /api/friends/:id
 * Remove a friend
 */
friendsRouter.delete("/friends/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  mockFriends = mockFriends.filter((f) => f.id !== id);
  res.json({
    success: true,
    message: "Ami supprimé",
  });
});

export default friendsRouter;
